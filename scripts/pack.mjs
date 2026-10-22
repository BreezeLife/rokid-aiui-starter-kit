import { join } from 'node:path';
import { root, demos, resolveSkill, run, aix } from './tooling.mjs';

const skill = resolveSkill();
const help = aix(['--help'], { log: 'output/verification/aix-help', quiet: true }).stdout;
if (!/\bpack\b/.test(help) || !/\b(list|ls)\b/.test(help)) throw new Error('Installed AIX lacks pack/list support.');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
for (const demo of demos) {
  run('bash', [join(skill, 'scripts/smoke_aix.sh'), join(root, 'demos', demo, 'app'), join(root, 'output/packages', `${demo}-${stamp}.aix`), root], {
    env: { AIX_BIN: join(root, 'node_modules/.bin/aix') }, log: `output/verification/${demo}/package`
  });
}
