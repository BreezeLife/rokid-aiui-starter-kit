# Hackathon starter deliverables — 2026-10-23

The five requested starter deliverables are present. This is a source, documentation and media handoff; Studio/device acceptance remains separate.

| Requirement | Cook Along | Style Lens |
| --- | --- | --- |
| English import → run → modify quickstart | [Quickstart](../demos/cook-along/README.md#quickstart-import--run--modify), including first install and local checks | [Quickstart](../demos/style-lens/README.md#quickstart-import--run--modify), beginning with no-key Sample mode |
| “Change these three places first” | Recipe data, Page UI, runtime Agent prompt | Sample data, Page UI, private API configuration; server prompt also identified |
| Three copyable Vibe Coding prompts | [Three prompts](../demos/cook-along/README.md#three-copyable-coding-prompts): content, language, scenario | [Three prompts](../demos/style-lens/README.md#three-copyable-coding-prompts): Sample scenario, vision prompt, team demo |
| Approximately 30-second video | [30-second MP4](../demos/cook-along/media/demo.mp4): selection, steps, timer controls, completion | [30-second MP4](../demos/style-lens/media/demo.mp4): Sample occasions, missing Live setup, Sample recovery |
| Network demo: labeled sample data and deployable backend template | Not applicable: no application API | [Backend guide](../demos/style-lens/server/README.md), Dockerfile, Compose and environment template; private app configuration enables real requests |

English, Simplified Chinese and Japanese onboarding remains aligned across all nine root/demo READMEs. Each README shows screenshots directly and links its video. The external DevKit is still the development Skill; neither demo is packaged as another Skill.

## Media checks

Both actual MP4 files were probed and decoded: H.264, yuv420p, 1280 × 720, 30 fps, 900 frames, exactly 30 seconds, silent. All 15 source states and final decoded samples were visually inspected. Captions and app text fit without overlap.

These are edited walkthroughs of actual pointer-driven diagnostic screenshots, with a persistent modified-runtime disclosure. They are not continuous real-time screen recordings. Timer values come from the original captures; the edit does not simulate an elapsed cooking duration. Style Lens shows bundled Sample advice and setup recovery, with no live photo/provider result.

Original screenshots, timestamps, hashes, editable video source and reproduction commands are retained in the [Cook Along media directory](../demos/cook-along/media/README.md) and [Style Lens media directory](../demos/style-lens/media/README.md). Their provenance binds the unchanged app fingerprints and diagnostic HTML recorded in [results.json](results.json).

## Verification and limits

- Fresh local verification: 38/38 tests, both strict AIUI 0.19.0 checks with zero errors/warnings, fingerprints and capability inventories, both AIX pack/list flows, and both HTML exports passed. Both audit documents remain structurally valid BLOCKED (expected exit 2).
- The [backend template checks](deployment-template.json) passed eight native checks, including isolated startup using exactly the Docker COPY files, runtime environment injection, the Docker health expression, and unauthenticated HTTP rejection. No paid provider was contacted.
- Docker build/Compose startup were not executed because Docker is unavailable here. Remote HTTPS deployment and real camera/provider behavior remain unverified.
- The unmodified Ink 0.19 browser startup failure remains recorded. Diagnostic video does not change native preview, Studio, physical glasses, offline host launch, or release-readiness status. See the [full verification report](README.md).

GitHub Actions remains a dormant [CI template](../docs/ci/README.md), pending workflow-write permission.
