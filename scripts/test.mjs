import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { demos, root, run } from './tooling.mjs';

const files = demos.flatMap(demo => readdirSync(join(root, 'demos', demo, 'tests'))
  .filter(name => name.endsWith('.test.mjs')).sort()
  .map(name => join(root, 'demos', demo, 'tests', name)));
if (files.length === 0) throw new Error('No demo tests found.');
run(process.execPath, ['--test', ...files]);
