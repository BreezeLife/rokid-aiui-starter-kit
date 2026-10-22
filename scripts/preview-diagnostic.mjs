import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { root, selectedDemo, run, python, save } from './tooling.mjs';

// Deliberately separate from native preview: only ignored diagnostic copies are patched.
const demo = selectedDemo(process.argv[2]);
const expected = {
  version: '0.19.0',
  tarball: 'https://registry.npmjs.org/@yodaos-pkg/ink/-/ink-0.19.0.tgz',
  tarballSha256: '00ec6166713b9b0b19ec674fc058d3032f176e663f8dc46dc728b40e6742a8b2',
  originalIndexSha256: 'cb6e58994b1086d21ccfad8561a6b8184961f724fa9a107f1b5a0b3c3eddda0f',
  patchedIndexSha256: 'a3b1e7ea4dc736ae269fed4c5605cc86cc3b57f13ddae68733c4de42d285c614'
};
const provenance = JSON.parse(readFileSync(join(root, 'verification/browser/provenance.json'), 'utf8'));
for (const [key, value] of Object.entries(expected)) {
  if (provenance[key] !== value) throw new Error(`Pinned diagnostic provenance changed: ${key}. Review upstream before updating this tool.`);
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function verifyHash(bytes, hash, label) {
  if (sha256(bytes) !== hash) throw new Error(`${label} checksum mismatch; refusing unexpected content.`);
}
function replaceOnce(value, before, after, label) {
  if (value.split(before).length !== 2) throw new Error(`${label} no longer matches exactly once; refusing to guess.`);
  return value.replace(before, after);
}
function sourceFiles(directory) {
  const found = new Map();
  function visit(current) {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) throw new Error('Diagnostic inputs must not contain symlinks.');
      if (info.isDirectory()) visit(path);
      else if (info.isFile()) found.set(relative(directory, path).split(sep).join('/'), readFileSync(path));
      else throw new Error('Diagnostic inputs must contain only regular files and directories.');
    }
  }
  visit(directory);
  return found;
}
function assertSameFiles(first, second, label) {
  if (first.size !== second.size) throw new Error(`${label}: file count differs.`);
  for (const [path, bytes] of first) {
    if (!second.has(path) || !bytes.equals(second.get(path))) throw new Error(`${label}: bytes differ at ${path}.`);
  }
}
function previewConfig(html) {
  const matches = [...html.matchAll(/<script id="aix-preview-config" type="application\/json">([\s\S]*?)<\/script>/g)];
  if (matches.length !== 1) throw new Error('Unexpected AIX preview config markup.');
  const config = JSON.parse(matches[0][1]);
  if (config.mode !== 'static' || !Array.isArray(config.initialState?.files)) throw new Error('Expected an AIX static source export.');
  return { config, json: matches[0][1] };
}
function embeddedFiles(config) {
  const files = new Map();
  for (const entry of config.initialState.files) {
    if (typeof entry.path !== 'string' || typeof entry.base64 !== 'string' || files.has(entry.path)) throw new Error('Unexpected embedded source entry.');
    files.set(entry.path, Buffer.from(entry.base64, 'base64'));
  }
  return files;
}

const cliPackage = JSON.parse(readFileSync(join(root, 'node_modules/@yodaos-pkg/aix-cli/package.json'), 'utf8'));
if (cliPackage.version !== '0.8.2') throw new Error('This diagnostic tool is verified with the locked AIX 0.8.2 export. Run npm ci.');
const runtimeDirectory = join(root, 'output/previews/diagnostic-runtime');
mkdirSync(runtimeDirectory, { recursive: true });
const tarballPath = join(runtimeDirectory, 'ink-0.19.0.tgz');
let tarball;
if (existsSync(tarballPath)) {
  if (!lstatSync(tarballPath).isFile() || lstatSync(tarballPath).isSymbolicLink()) throw new Error('Expected a regular cached tarball.');
  tarball = readFileSync(tarballPath);
} else {
  console.log('Downloading pinned official Ink 0.19.0 for a separate diagnostic copy...');
  const response = await fetch(expected.tarball, { redirect: 'error', signal: AbortSignal.timeout(60000) });
  if (!response.ok || !response.body) throw new Error(`Ink download failed: HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 64 * 1024 * 1024) throw new Error('Unexpectedly large Ink package.');
    chunks.push(chunk);
  }
  tarball = Buffer.concat(chunks);
  verifyHash(tarball, expected.tarballSha256, 'Official Ink tarball');
  writeFileSync(tarballPath, tarball, { flag: 'wx' });
}
verifyHash(tarball, expected.tarballSha256, 'Official Ink tarball');

const stage = mkdtempSync(join(runtimeDirectory, '.stage-'));
try {
  // Python is already required by the DevKit flow; no extra archive package is installed.
  run(python, ['-c', String.raw`
import pathlib, sys, tarfile
destination = pathlib.Path(sys.argv[2])
seen = set()
total = 0
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0] != 'package':
            raise ValueError('Unsafe package path')
        if member.name in seen:
            raise ValueError('Duplicate package entry')
        seen.add(member.name)
        target = destination.joinpath(*path.parts)
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
        elif member.isfile():
            total += member.size
            if member.size > 128 * 1024 * 1024 or total > 256 * 1024 * 1024:
                raise ValueError('Unexpected package size')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.extractfile(member).read())
        else:
            raise ValueError('Unsupported package entry type')
`, tarballPath, stage], { quiet: true });
  const stagedPackage = join(stage, 'package');
  const indexPath = join(stagedPackage, 'index.js');
  const originalIndex = readFileSync(indexPath);
  verifyHash(originalIndex, expected.originalIndexSha256, 'Official Ink index.js');
  let patchedIndex = originalIndex.toString('utf8');
  patchedIndex = replaceOnce(patchedIndex,
    '      Boolean(config.permissionChecks),\n      loopbackRoutingPolicy,',
    '      Boolean(config.permissionChecks),\n      false, // DIAGNOSTIC ONLY: permission_requests introduced in raw 0.19 binding.\n      loopbackRoutingPolicy,',
    'Permission constructor argument');
  patchedIndex = replaceOnce(patchedIndex,
    '      displayColor.bits,\n    );\n    const view = new InkView(rawView, config);',
    '      displayColor.bits,\n      undefined, // DIAGNOSTIC ONLY: raw 0.19 script_execution default.\n    );\n    const view = new InkView(rawView, config);',
    'Script execution constructor argument');
  verifyHash(Buffer.from(patchedIndex), expected.patchedIndexSha256, 'Patched diagnostic index.js');
  writeFileSync(indexPath, patchedIndex);
  const destination = join(runtimeDirectory, 'package');
  if (existsSync(destination)) {
    if (lstatSync(destination).isSymbolicLink() || !lstatSync(destination).isDirectory()) throw new Error('Expected an ordinary diagnostic package directory.');
    assertSameFiles(sourceFiles(stagedPackage), sourceFiles(destination), 'Cached diagnostic runtime');
  } else renameSync(stagedPackage, destination);
} finally { rmSync(stage, { recursive: true, force: true }); }
save('output/previews/diagnostic-runtime/provenance.json', provenance);
save('output/previews/diagnostic-runtime/compatibility.patch', readFileSync(join(root, 'verification/browser/compatibility.patch'), 'utf8'));

// Keep the native export as an independent artifact; patch only the diagnostic copy.
run(process.execPath, [join(root, 'scripts/preview.mjs'), demo]);
const sourceRoot = join(root, 'demos', demo, 'app');
const originalPath = join(root, 'output/previews', `${demo}.html`);
const originalHtml = readFileSync(originalPath, 'utf8');
const originalHash = sha256(Buffer.from(originalHtml));
const { config, json } = previewConfig(originalHtml);
assertSameFiles(sourceFiles(sourceRoot), embeddedFiles(config), 'Original export/source');
const manifest = JSON.parse(readFileSync(join(sourceRoot, 'app.json'), 'utf8'));
const route = manifest.pages?.[0];
if (typeof route !== 'string' || !config.initialState.files.some(file => file.path === route + '.ink')) throw new Error('Expected a declared .ink entry route.');
config.inkSdkUrl = './diagnostic-runtime/package/index.js';
let diagnosticHtml = replaceOnce(originalHtml, json, JSON.stringify(config), 'Export configuration');
diagnosticHtml = replaceOnce(diagnosticHtml, '<body>', '<body>\n<div style="padding:12px;background:#fff1cc;color:#332600;font:14px sans-serif;border-bottom:2px solid #806000">DIAGNOSTIC ONLY — patched Ink 0.19 constructor; not native AIX, Studio or glasses evidence.</div>', 'Diagnostic banner');
diagnosticHtml = replaceOnce(diagnosticHtml,
  '          files: bundleFiles(state.files),\n        });',
  `          files: bundleFiles(state.files),\n          initialPage: ${JSON.stringify(route)},\n          hostOptions: { initialFocus: "focus", initialTarget: "_blank" },\n        });`,
  'Diagnostic entry and host target');
assertSameFiles(sourceFiles(sourceRoot), embeddedFiles(previewConfig(diagnosticHtml).config), 'Diagnostic export/source');
verifyHash(readFileSync(originalPath), originalHash, 'Preserved original export');
save(`output/previews/${demo}-diagnostic.html`, diagnosticHtml);
save(`output/verification/${demo}/diagnostic-preview.json`, {
  nativeHtml: `output/previews/${demo}.html`, nativeHtmlSha256: originalHash,
  diagnosticHtml: `output/previews/${demo}-diagnostic.html`, diagnosticHtmlSha256: sha256(Buffer.from(diagnosticHtml)),
  runtime: expected.version, runtimeIndexSha256: expected.patchedIndexSha256,
  initialPage: route, target: '_blank', appFilesByteIdentical: true,
  warning: 'Modified runtime diagnostic only. Export does not establish rendering, native preview, Studio, or glasses success.'
});
console.log(`Diagnostic copy: output/previews/${demo}-diagnostic.html`);
console.log('Serve: python3 -m http.server 8768 --bind 127.0.0.1 --directory output/previews');
console.log(`Open: http://127.0.0.1:8768/${demo}-diagnostic.html`);
console.log('DIAGNOSTIC ONLY — the native preview limitation remains; Studio and glasses checks are separate.');
