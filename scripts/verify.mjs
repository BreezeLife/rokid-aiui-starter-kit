import { join } from 'node:path';
import { root, demos, python, resolveSkill, run, save } from './tooling.mjs';

const skill = resolveSkill();
console.log(`Using DevKit: ${skill}`);
run(process.execPath, ['scripts/test.mjs'], { log: 'output/verification/tests' });
const report = { target: 'AIUI 0.19.0', checkedAt: new Date().toISOString(), skillPath: skill, demos: {}, releaseReady: false,
  remaining: ['Authenticated AIUI Studio import', 'Physical glasses input and optics', 'Style Lens live provider request', 'Version-specific capability policy and trusted evidence'] };
for (const demo of demos) {
  const app = join(root, 'demos', demo, 'app');
  const log = `output/verification/${demo}`;
  run(python, [join(skill, 'scripts/validate_aiui_project.py'), app, '--repository-root', root, '--strict', '--target-version', '0.19.0', '--json'], { log: `${log}/structure`, quiet: true });
  const fingerprint = run(python, [join(skill, 'scripts/fingerprint_aiui_project.py'), app, '--repository-root', root], { log: `${log}/fingerprint`, quiet: true }).stdout.trim();
  const inventoryResult = run(python, [join(skill, 'scripts/inventory_aiui_capabilities.py'), app, '--repository-root', root, '--target-version', '0.19.0'], { log: `${log}/inventory`, quiet: true });
  const inventory = JSON.parse(inventoryResult.stdout);
  save(`${log}/inventory.json`, inventory);
  if (inventory.versionViolations.length) throw new Error(`${demo}: target-version violations; inspect ${log}/inventory.json`);
  report.demos[demo] = { structure: 'PASS', fingerprint, capabilities: inventory.items.length, unmatchedSymbols: inventory.unmatchedSymbols.length, capabilityPolicy: 'BLOCKED' };
  console.log(`${demo}: local structure PASS; ${inventory.items.length} capability gates inventoried.`);
}
save('output/verification/local-results.json', report);
console.log('Local checks passed. This does not certify Studio, glasses, live-provider behavior, or release readiness.');
