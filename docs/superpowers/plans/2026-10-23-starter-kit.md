# Everyday Starter Kit Implementation Plan

**Goal:** Deliver two independently editable AIUI 0.19 projects with multilingual DevKit-based onboarding and truthful validation.

**Architecture:** A separate repository contains two self-contained `app/` import roots. Style Lens additionally has a Node.js backend proxy; neither app depends on the development Skill at runtime. Product content and prompts have explicit modification entrypoints.

**Tech stack:** AIUI Page/Ink, local JavaScript, Node.js built-in HTTP and test runner, Python DevKit validators, published AIX CLI.

## Approved scope
The preceding discussion approved this structure and the choose-demo → install-DevKit → modify → verify → demonstrate workflow. Cook Along implements recipe selection, step navigation, and an absolute-deadline timer with pause/resume/reset and cleanup. Style Lens implements labeled sample advice, occasion selection, live camera capture, a bounded server request, result validation, error recovery, and cancellation. Live vision service credentials and device evidence are absent; do not invent success.

## Implementation sequence and affected files
- [ ] Create `demos/cook-along/app/{AGENTS.md,app.json,app.js,aiui-audit-claims.json,pages/index/index.ink}` plus editable content and tests outside `app/`. Assert navigation, invalid content recovery, timer deadlines, pause/resume, hidden elapsed time, and cleanup.
- [ ] Create the equivalent Style Lens root, sample data/config, server and `.env.example`, and tests. Assert sample mode makes no requests, live mode requires configuration, validates input/output, times out, and drops stale responses; proxy tests use a local fake provider only.
- [ ] Write `README.md`, `README.zh-CN.md`, `README.ja.md`, and per-demo README files with exact Studio paths and copied DevKit prompts. Provide real runnable commands and label actual versus planned functionality.
- [ ] Add root verification scripts without copying the DevKit. Discover the external Skill through an explicit `AIUI_SKILL_DIR` or documented user installation, test both apps, and run strict validators/inventories.
- [ ] Probe AIX help, package/list both source roots outside their import directories, inspect preview startup and controls where possible, and preserve observed failures.
- [ ] Produce source-bound UX/capability audits and submission drafts; run the audit validator and retain blocked evidence semantics. Review documentation and source independently, correct findings, update project continuity, and deliver local paths.

## Acceptance
Both app roots pass strict 0.19 structural validation and meaningful local tests. All advertised local commands resolve. The offline app contains no application network dependency; the online app works in explicit sample mode without a key and contains a complete configurable live path. Documentation does not present simulated responses or local tests as actual model, Studio, or device verification. No remote repository, deployment, or platform publication is claimed without being executed.
