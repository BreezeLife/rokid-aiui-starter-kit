"""Generate source-bound, explicitly blocked release matrices using the DevKit contracts.

Local execution results belong in verification/README.md and output/verification.
They are not independently signed release evidence. This script creates no keys
and never converts those results to release PASS.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
CANDIDATES = ([Path(os.environ['AIUI_SKILL_DIR']).expanduser()] if os.environ.get('AIUI_SKILL_DIR')
              else [Path.home() / '.agents/skills/rokid-aiui-agent', Path.home() / '.codex/skills/rokid-aiui-agent'])
SKILL = next((p.resolve() for p in CANDIDATES if (p / 'scripts/validate_aiui_audit.py').is_file()), None)
if SKILL is None:
    sys.exit('Install the DevKit or set AIUI_SKILL_DIR to the folder containing SKILL.md.')
sys.path.insert(0, str(SKILL / 'scripts'))
SPEC = importlib.util.spec_from_file_location('audit_contracts', SKILL / 'scripts/validate_aiui_audit.py')
V = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = V
SPEC.loader.exec_module(V)
LAYERS = ['SOURCE', 'STATIC', 'LOGIC', 'AIX', 'STUDIO', 'DEVICE']
BASE = 'https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/'
DOCS = {
    'page.route': 'documentation/1-framework/open-agent-format/page-definition.en-US.md',
    'page.target': 'documentation/1-framework/open-agent-format/target.en-US.md',
    'page.lifecycle': 'documentation/1-framework/open-agent-format/page-lifecycle.en-US.md',
    'focus.host': 'documentation/1-framework/open-agent-format/focus.en-US.md',
    'focus.element': 'documentation/1-framework/open-agent-format/focus.en-US.md',
    'ui.button': 'documentation/2-components/button.en-US.md',
    'event.bindtap': 'documentation/2-components/button.en-US.md',
    'component.scroll-view': 'documentation/2-components/scroll-view.en-US.md',
    'network.https': 'documentation/3-api/network/https.en-US.md',
}
for family in ['input.enter', 'input.back', 'input.scroll.host', 'input.key.unknown']:
    DOCS[family] = 'documentation/1-framework/open-agent-format/page-events.en-US.md'
for family in ['media.camera.permission', 'media.camera.runtime', 'media.camera.lifecycle']:
    DOCS[family] = 'documentation/3-api/media/media-capture.en-US.md'


def evidence(layers):
    reasons = {
        'SOURCE': 'AIUI 0.19 capability PASS policies have not been independently registered',
        'STATIC': 'local checks are recorded separately but lack trusted RUNNER attestation',
        'LOGIC': 'local tests are recorded separately but lack trusted RUNNER attestation',
        'AIX': 'native preview failed before app loading - see verification/README.md for diagnostic and packaging results - trusted RUNNER capture unavailable',
        'STUDIO': 'authenticated Studio import and runtime capture unavailable',
        'DEVICE': 'physical glasses and trusted DEVICE capture unavailable',
    }
    return '; '.join(f'{layer}=blocked:{reasons[layer]}' for layer in layers)


def table(headers, rows):
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join('---' for _ in headers) + ' |']
                     + ['| ' + ' | '.join(row) + ' |' for row in rows])


def generate(name):
    app = ROOT / 'demos' / name / 'app'
    out = ROOT / 'demos' / name / 'verification'
    out.mkdir(exist_ok=True)
    result = subprocess.run([sys.executable, str(SKILL / 'scripts/inventory_aiui_capabilities.py'), str(app),
                             '--repository-root', str(ROOT), '--target-version', '0.19.0'], check=True, capture_output=True, text=True)
    inventory = json.loads(result.stdout)
    (out / 'inventory.json').write_text(result.stdout)
    blocked, required, ux_rows, cap_rows = [], [], [], []

    def add(identifier, layers):
        blocked.append(identifier)
        required.extend(f'{identifier}@{layer}' for layer in layers)

    gates = {'UX-TARGET': 'all-targets', 'UX-STATE': 'all-states', 'UX-TEXT': 'boundary-text',
             'UX-FOCUS': 'focus-model', 'UX-RECOVERY': 'failure-recovery', 'UX-LIFECYCLE': 'page-lifecycle',
             'UX-VISUAL': 'visual-system', 'UX-ENVIRONMENT': 'optical-scenes', 'UX-MOTION': 'motion-performance'}
    for family, contract in V.UX_CONTRACTS.items():
        instances = ([(f'UX-INPUT-GATE{i + 1}', item['gate']) for i, item in enumerate(inventory['inputGates'])]
                     if family == 'UX-INPUT' else [(family, gates[family])])
        if family == 'UX-INPUT' and not instances:
            instances = [('UX-INPUT', 'no-input')]
        for identifier, gate in instances:
            layers = [x for x in LAYERS if x in V.UX_REQUIRED_LAYERS[family]]
            ux_rows.append([f'[{identifier}] {{gate={gate}}}', contract[0], contract[1],
                            f'{{contract={V.UX_CONTRACT_TOKENS[family]}}} ' + contract[2],
                            ', '.join(layers), 'BLOCKED', evidence(layers)])
            add(identifier, layers)

    for index, item in enumerate(inventory['items']):
        family, gate = item['family'], item['gate']
        policy = V.CAPABILITY_POLICIES[family]
        identifier = policy.base_id + '-' + gate.rsplit('-', 1)[1].upper()
        if item['policyState'] == 'binding-unresolved':
            identifier += '-PROVISIONAL'
        surface = ','.join(inventory['supportedSurfaces'])
        if item['mechanism'].startswith('CLAIM:'):
            surface = item['mechanism'].split('@', 1)[1].split(':', 1)[0]
        elif item['mechanism'].startswith('target:'):
            surface = item['mechanism'].split(':', 1)[1]
        layers = [x for x in LAYERS if x in policy.layers]
        if family == 'project.unregistered':
            behavior = V.PROVISIONAL_BEHAVIOR
            source = ('SEARCH-SCOPE=[AIUI documentation](https://github.com/yodaos-project/AIUI/tree/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation); '
                      'SEARCH-SCOPE=[AIUI samples](https://github.com/yodaos-project/AIUI/tree/7d62c2d9ac1cdc1389ba06ed0651b395903accff/samples)')
        else:
            behavior = V.CAPABILITY_BEHAVIOR_CONTRACTS[family]
            if family not in DOCS:
                raise ValueError(f'Add inspected official source for family {family}')
            source = f'DOC=[Official AIUI 0.19 contract]({BASE}{DOCS[family]})'
        cells = [V.capability_contract_cell(family, path, value) for path, value in
                 zip(('positive', 'negative-fallback', 'lifecycle-cleanup'), behavior)]
        label = 'Unregistered project capability' if family == 'project.unregistered' else family
        cap_rows.append([f'[{identifier}] {{family={family}}} {{gate={gate}}} {label}',
                         f'AIUI 0.19.0; device=UNAVAILABLE; surface={surface}', item['apiBinding'],
                         item['declarationBinding'], source, *cells, ', '.join(layers), 'BLOCKED', evidence(layers)])
        add(identifier, layers)

    lines = ['Project revision: ' + inventory['projectRevision'], 'Canonical version: AIUI 0.19.0',
             f'Import root: demos/{name}/app', 'Device/host: UNAVAILABLE',
             'Supported surfaces: ' + ','.join(sorted(inventory['supportedSurfaces'])),
             'Inputs: ' + (','.join(sorted(f"{x['kind']}@{x['gate']}" for x in inventory['inputGates'])) or 'none'),
             'Claimed capabilities: ' + ','.join(sorted(inventory['claimedCapabilities']))]
    text = '\n'.join(lines) + '\n\n## Project UX evidence matrix\n\n' + table(V.UX_HEADERS, ux_rows)
    text += '\n\n## Per-capability matrix\n\n' + table(V.CAPABILITY_HEADERS, cap_rows)
    text += '\n\n## Final release decision\n\nFinal status: BLOCKED\nRelease-ready: NO\nReason: FAIL=[none]; BLOCKED=[' + ','.join(sorted(blocked)) + ']\nRequired gates: ' + ','.join(sorted(required)) + '\n'
    report = out / 'AUDIT.md'
    report.write_text(text)
    checked = subprocess.run([sys.executable, str(SKILL / 'scripts/validate_aiui_audit.py'), str(report),
                              '--repository-root', str(ROOT), '--import-root', f'demos/{name}/app'], capture_output=True, text=True)
    (out / 'audit-validation.txt').write_text(checked.stdout + checked.stderr)
    if checked.returncode != 2:
        print(checked.stdout + checked.stderr)
        raise RuntimeError(f'{name}: expected structurally valid BLOCKED audit (exit 2), got {checked.returncode}')
    print(f'{name}: {len(ux_rows)} UX rows, {len(cap_rows)} capability rows; audit BLOCKED (valid exit 2).')


for demo in ['cook-along', 'style-lens']:
    generate(demo)
