// Video tooling only. GSAP is not part of either AIUI app.
// GSAP 3.14.2 is subject to https://gsap.com/standard-license.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js';
const expected = 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280';
const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`GSAP download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(bytes).digest('hex') !== expected) {
  throw new Error('GSAP download does not match the pinned SHA-256. No file written.');
}
const directory = new URL('./assets/vendor/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('gsap.min.js', directory), bytes);
console.log('Prepared GSAP 3.14.2; upstream license header preserved.');
