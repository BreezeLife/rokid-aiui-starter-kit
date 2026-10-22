import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const demos = ['cook-along', 'style-lens'];
export const python = process.env.PYTHON || 'python3';

export function selectedDemo(value) {
  if (!demos.includes(value)) throw new Error(`Choose one of: ${demos.join(', ')}`);
  return value;
}

export function resolveSkill() {
  const candidates = process.env.AIUI_SKILL_DIR
    ? [resolve(process.env.AIUI_SKILL_DIR)]
    : [join(homedir(), '.agents/skills/rokid-aiui-agent'), join(homedir(), '.codex/skills/rokid-aiui-agent')];
  const skill = candidates.find(path => existsSync(join(path, 'SKILL.md')) && existsSync(join(path, 'scripts/validate_aiui_project.py')));
  if (!skill) throw new Error('Install rokid-aiui-agent, or set AIUI_SKILL_DIR to its directory containing SKILL.md and scripts/. See README.');
  return skill;
}

export function save(relativePath, value) {
  const path = resolve(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  return path;
}

export function run(command, args, { log, env = {}, allow = [0], quiet = false } = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, PATH: `${dirname(process.execPath)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`, ...env } });
  if (log) {
    save(`${log}.stdout.txt`, result.stdout || '');
    save(`${log}.stderr.txt`, result.stderr || '');
    save(`${log}.command.json`, { command, args, cwd: root, exitCode: result.status, error: result.error?.message || null, capturedAt: new Date().toISOString() });
  }
  if (!quiet || result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error) throw result.error;
  if (!allow.includes(result.status)) throw new Error(`${command} exited ${result.status}`);
  return result;
}

export function aix(args, options) {
  const entry = join(root, 'node_modules/@yodaos-pkg/aix-cli/dist/cli.js');
  if (!existsSync(entry)) throw new Error('Run npm ci before using AIX.');
  return run(process.execPath, [entry, ...args], options);
}
