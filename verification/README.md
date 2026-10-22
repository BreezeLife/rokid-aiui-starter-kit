# Local verification — 2026-10-23

The editable demos and their AIX packages are prepared. **38/38 local tests, both strict source checks, and both real AIX pack/list flows passed. Unmodified browser preview failed during runtime startup. Studio, glasses, and the live vision provider remain unverified; release-ready is NO.**

This report describes the recorded source snapshot, not a guarantee for a later modified project. [results.json](results.json) binds fingerprints, packages, preview HTML and screenshots. [source-pins.json](source-pins.json) identifies the DevKit, official AIUI source and CLI. The local timezone is Asia/Shanghai; machine timestamps use UTC.

## Executed checks

| Check | Cook Along | Style Lens |
| --- | --- | --- |
| JavaScript behavior tests | PASS, 12 tests | PASS, 26 app/proxy tests |
| Strict AIUI 0.19.0 source validation | PASS, 0 errors / 0 warnings | PASS, 0 errors / 0 warnings |
| AIX 0.8.2 pack and list | PASS, exact source bound | PASS, exact source bound |
| AIX preview HTML export | PASS | PASS |
| Unmodified exported browser preview | FAIL before application loading | FAIL before application loading |
| Separate patched-runtime diagnostic | Recipe/timer/completion clicks observed | Sample/occasion/configuration recovery observed |
| Source-bound audit structure | Valid BLOCKED, exit 2 | Valid BLOCKED, exit 2 |
| Authenticated Studio / physical glasses | BLOCKED | BLOCKED |
| Real camera + paid model | Not part of this app | BLOCKED |

Tests use Node.js 24.19.0. The shipped Page setup is evaluated with controlled clocks and mocked AIUI services; the Style Lens proxy is also exercised through local HTTP against a fake provider. The documented env-file server launch is tested with dummy credentials. No paid model request, real photo upload, or device camera session was made. See the [test output](logs/tests.stdout.txt) and strict [Cook Along](logs/cook-along-structure.stdout.txt) / [Style Lens](logs/style-lens-structure.stdout.txt) output.

Cook Along covers recipe selection, invalid input, both complete recipe flows, timer pause/resume/reset/expiry, hide/show reconciliation and unload cleanup. Style Lens covers Sample default, explicit Live entry, camera refusal, delayed permissions, cancellation and stale results, input/response limits, proxy authentication/expiry, request cancellation, CORS and concurrency bounds.

## Exact source and packages

| Demo | Studio source root | Final package in this local workspace | Bytes |
| --- | --- | --- | --- |
| Cook Along | `demos/cook-along/app` | `output/packages/cook-along-2026-10-22T18-38-44-341Z.aix` | 17,417 |
| Style Lens | `demos/style-lens/app` | `output/packages/style-lens-2026-10-22T18-38-44-341Z.aix` | 17,810 |

Cook Along source fingerprint:
`WORKTREE:5387d8ed2b6e372f04512267f1569bdf8f971d948738f9878129a78018af3e0e`

Cook Along archive SHA-256:
`abb32eb83f51aa250952b69af6d2e890539cb772c5e5c05ddda25a97f1b2074e`

Style Lens source fingerprint:
`WORKTREE:c29724b24c4f70213f50ec0ffbb29141941b27a9a94a7b967b99ade067e6a218`

Style Lens archive SHA-256:
`3021884c320c0276f9b875007aa1a9bad7850fdbed4ea1c261474ac519e565b2`

The DevKit delivery guard checked the exact source before/after packaging and published each archive without overwriting an existing file. Listing showed only app source and generated AIX metadata; the Style Lens server and provider credentials are outside its package. The delivered Style Lens app has empty backend URL and team token and starts in Sample mode. Older timestamped packages in this workspace are superseded by the two above.

Generated archives and raw command logs remain under ignored `output/`; a fresh clone must regenerate them. Recorded metadata and selected captures are retained here. The AIX CLI lock does not pin the network-loaded browser SDK.

## Browser observations and limitation

The unmodified exports resolved `@yodaos-pkg/ink@0.19.0` and both displayed:

```text
Preview failed to start.
TypeError: Cannot read properties of null (reading 'length')
```

The stack originates in SDK construction before application loading. Actual captures: [Cook failure](screenshots/cook-native.png), [Style failure](screenshots/style-native.png), and raw visible [Cook text](browser/cook-native.txt) / [Style text](browser/style-native.txt). This establishes a failure in this preview environment; it does not establish a failure on glasses or in Studio.

To inspect the app UI, a separate local copy of the official Ink 0.19 package was used with two missing constructor arguments supplied. See the exact [compatibility patch](browser/compatibility.patch) and [package provenance/digests](browser/provenance.json). Diagnostic HTML also supplies the initial route and focused `_blank` target and displays a warning banner. Neither the installed CLI nor either app source contains this runtime patch. Byte comparison confirmed that both original and diagnostic HTML contain every final app file unchanged.

The publication review shortened recipe instructions to avoid English words and numbers splitting across lines, then refreshed the exact source, packages and README screenshots. The optional `npm run preview:diagnostic -- <demo>` command reproduces this guarded local runtime copy; it checks the pinned download, exact patch, cached runtime and byte-identical embedded app source. Cold download, cache reuse and rejection of a tampered runtime were exercised.

Observed only in that diagnostic environment, with a 480 × 352 canvas:

- Cook Along: choose coffee, advance through steps, start/pause/resume/reset the Bloom timer, finish and return to recipe selection. Buttons and text fit; step and completion views are exclusive.
- Style Lens: Sample Work tips, Weekend/Evening selection and focus feedback, missing-configuration explanation on Try Live, then recovery to Sample.
- The diagnostic pass found and corrected missing inner layout wrappers and a conditional rendering issue before final fingerprints and packages were generated.

These observations cover clicks and rendering in a modified browser runtime. They do not verify host keyboard routing, real touchpad input, Cook Along's `_current` layout, camera permissions, offline host launch, optical readability, or real host lifecycle.

![Cook Along diagnostic timer; modified runtime, not Studio/device evidence](screenshots/cook-running-final.png)

![Style Lens diagnostic Sample mode; modified runtime, not Studio/device evidence](screenshots/style-sample-final.png)

## Audit and next acceptance steps

[Cook Along audit](../demos/cook-along/verification/AUDIT.md) contains 18 UX rows and 47 capability rows; [Style Lens audit](../demos/style-lens/verification/AUDIT.md) contains 16 UX rows and 47 capability rows. Both reconcile to their exact inventory and return the expected structurally valid BLOCKED exit code 2. AIUI 0.19 capability PASS policies are not registered by this DevKit baseline, and no external trusted RUNNER/STUDIO/DEVICE attestations were supplied. Local test successes remain separately recorded, without upgrading those audit gates.

To advance acceptance:

1. Import each exact `app/` directory into AIUI Studio, record runtime and source identity, and exercise its declared surfaces.
2. Verify focus, touchpad, back/close/reopen, retained lifecycle and readability on the target glasses. Test Cook Along offline host launch separately.
3. For Style Lens Live, choose and deploy the HTTPS proxy/provider, configure a private copy, and test one explicitly authorized photo with the actual camera and model.
4. Refresh fingerprints, packages, audit evidence and submission/media records after changing app configuration or source. Confirm current portal requirements before any separate publishing step.

The [Cook Along](../demos/cook-along/submission.md) and [Style Lens](../demos/style-lens/submission.md) handoffs include listing drafts, permissions/data flow and capture plans. GitHub source publication is tracked in WORKLOG.md. No service deployment or platform submission was performed.

## Reproduce local checks

Install the external DevKit and the locked npm dependency as described in the root README. From the Starter Kit root:

```bash
npm run verify
npm run pack
npm run preview -- cook-along
npm run preview -- style-lens
python3 scripts/audit.py
npm run preview:diagnostic -- cook-along
npm run preview:diagnostic -- style-lens
```

If needed, set `AIUI_SKILL_DIR` to the resolved directory containing `SKILL.md` and `scripts/`. The audit generator currently creates explicit BLOCKED matrices; it does not create trust keys or certify a release. Re-exported HTML still needs actual browser observation.

## GitHub CI status

The clean-clone install, tests, strict validation, audit, package/list and HTML exports passed locally. GitHub Actions is **not enabled**: the publishing credential cannot write workflow files. The pinned [workflow template](../docs/ci/README.md) is preserved for later activation. This is not a remote CI pass.
