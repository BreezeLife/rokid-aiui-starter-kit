# Rokid AIUI Starter Kit

English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

Two editable AIUI 0.19.0 demo projects for a hackathon. Start with a working pattern, then use the [Rokid AIUI Agent DevKit Skill](https://github.com/BreezeLife/rokid-aiui-agent-skill) in your coding tool to make it your own.

**Choose a demo → install and load the DevKit → modify → verify → demonstrate in Studio and on glasses.**

This Starter Kit has its own [GitHub repository](https://github.com/BreezeLife/rokid-aiui-starter-kit). The Skill remains in its own repository and is a development tool, not an app runtime dependency. Clone the Starter Kit, then open its folder in your coding tool:

```bash
git clone https://github.com/BreezeLife/rokid-aiui-starter-kit.git
cd rokid-aiui-starter-kit
```

You can also download the repository ZIP from GitHub and open the extracted folder.

## Choose your starting point

| Demo | What you can demonstrate | Network and keys | Studio import directory |
| --- | --- | --- | --- |
| [Cook Along](demos/cook-along/README.md) · food | Choose coffee or pasta, follow steps, and start/pause/resume a timer | No application API, account, or key; core flow runs offline after opening | `demos/cook-along/app` |
| [Style Lens](demos/style-lens/README.md) · clothing | Select an occasion and view three suggestions; in Live mode, capture a garment photo and request advice | Sample mode needs no API/key and uses bundled text. Live mode needs camera permission, an HTTPS backend, a team token, and a vision provider key on the server | `demos/style-lens/app` |

The initial app UI is **English**. These developer instructions are available in English, Simplified Chinese, and Japanese. Neither demo is an additional Skill. More everyday scenarios can be added later without changing the DevKit.

## Demo screenshots

These are actual browser captures using a patched Ink 0.19.0 runtime. They show limited diagnostic UI observations, not AIUI Studio or physical-glasses evidence.

![Cook Along running timer in the patched Ink 0.19.0 browser diagnostic](verification/screenshots/cook-running-final.png)

Cook Along: recipe steps and a running timer.

![Style Lens Sample mode in the patched Ink 0.19.0 browser diagnostic](verification/screenshots/style-sample-final.png)

Style Lens: clearly labeled Sample advice with occasion controls; no live model result is shown.

## 1. Install and load your DevKit

Use a coding tool that supports Agent Skills and can read/write this workspace and run terminal commands. The Skills installer requires Node.js **22.20 or later**; local verification also needs Python 3. First review the [Skill and its scripts](https://github.com/BreezeLife/rokid-aiui-agent-skill/tree/main/skills/rokid-aiui-agent).

Run these commands in a terminal for Codex:

```bash
node --version
npx skills add BreezeLife/rokid-aiui-agent-skill --skill rokid-aiui-agent --agent codex --global
npx skills list --agent codex --global
```

The list should contain `rokid-aiui-agent`. The install reads the Skill repository's default branch. To update, repeat the install and check the resolved revision.

| Coding tool | Replace `--agent codex` with | Load the Skill in chat |
| --- | --- | --- |
| Codex | `--agent codex` | Include `$rokid-aiui-agent` in your request |
| Claude Code | `--agent claude-code` | Start with `/rokid-aiui-agent` |
| Cursor | `--agent cursor` | Type `/`, select `rokid-aiui-agent`, then enter your request |

Apply the same replacement to the install and list commands. If discovery is delayed, reopen the session and check that installation and development use the same machine and user. Ask the coding agent to read the Skill and report its resolved `SKILL.md` path before editing; installation alone does not confirm that it was loaded. See the [DevKit usage guide](https://github.com/BreezeLife/rokid-aiui-agent-skill/blob/main/docs/usage.en.md) for the complete workflow.

## 2. Make your first change

Open this Starter Kit folder, select a demo, and send this in **chat**, not the terminal. The example is for Codex; use the invocation in the table for another tool.

```text
$rokid-aiui-agent
Read this project's AGENTS.md and continuity files, then read the installed
Skill and report its path. Modify demos/cook-along/app into a tea-brewing
guide. Keep AIUI 0.19.0, English UI, local recipe data, step navigation,
and pause/resume timing. Keep the app directory independently importable.
Run the project's tests and strict verification, then the AIX operations
supported by the installed CLI. Update the project UX and per-capability
matrices. Report exact source and artifact paths and actual check results;
keep unexecuted Studio and glasses checks BLOCKED.
```

Each demo README has its modification map and three copyable prompts. Start with content before changing interactions. Keep tests, backend code, reports, and generated `.aix` files outside the `app/` directories.

## 3. Run local checks

From the Starter Kit root:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run verify
```

`npm test` runs deterministic app and backend tests; it does not call a paid model. `npm run verify` repeats those tests and uses the external DevKit for strict AIUI 0.19.0 validation, source fingerprints, and capability inventories. If it cannot find your installed Skill, set `AIUI_SKILL_DIR` to the actual directory containing `SKILL.md` and `scripts/`:

```bash
# Example path only: replace it with your resolved Skill directory.
export AIUI_SKILL_DIR="/absolute/path/to/rokid-aiui-agent"
npm run verify
```

The locked AIX dependency supports these wrappers, which inspect CLI help before running supported operations. Run them from the same root (packaging also needs Bash):

```bash
npm run preview -- cook-along
npm run preview -- style-lens
npm run pack
```

Preview HTML is written under `output/previews/`; generating HTML is not proof of successful rendering. Packaging checks both demos and writes unique `.aix` files under `output/packages/`, outside the import roots. An archive supplements the editable source.

### Optional diagnostic browser preview

To inspect UI while the unmodified preview has the startup failure described below, run the separate diagnostic helper. It downloads a checksum-pinned official Ink 0.19.0 package and applies a compatibility patch only under ignored `output/previews/diagnostic-runtime/`. It does not edit either App or turn the native preview result into PASS. Node.js and Python 3 are required.

```bash
npm run preview:diagnostic -- cook-along
npm run preview:diagnostic -- style-lens
python3 -m http.server 8768 --bind 127.0.0.1 --directory output/previews
```

Keep the local server running and open [Cook Along diagnostic](http://127.0.0.1:8768/cook-along-diagnostic.html) or [Style Lens diagnostic](http://127.0.0.1:8768/style-lens-diagnostic.html). Each page labels the modified runtime. Use it for limited layout/click inspection, then record Studio and device results separately. Stop the server with Ctrl+C when finished.

## 4. Import and demonstrate

In AIUI Studio, select the **exact `app/` directory containing `app.json`**:

```text
Cook Along: demos/cook-along/app
Style Lens: demos/style-lens/app
```

These paths are relative to your Starter Kit folder. Do not select the entire repository, a demo's parent folder, its server, or an `.aix` file as the source import root.

For **GitHub import**, use the same repository and ref, then choose the exact directory for your demo:

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
```

| Demo | Directory |
| --- | --- |
| Cook Along | `demos/cook-along/app` |
| Style Lens | `demos/style-lens/app` |

`main` is the current development branch. To reproduce an earlier check, select the corresponding commit and compare the app fingerprint in its verification report.

Use the short demonstration checklist in each demo README. Use each demo’s declared display target: Cook Along covers conversation-embedded `_current` and full-screen `_blank`; Style Lens uses `_blank`. Test focus/tap input, recovery, and closing/reopening. Then verify on your target Rokid Glasses. Cook Along's local logic does not establish that the host can launch the app while offline. Style Lens's Sample mode does not establish camera or live-model behavior.

## Verification status

Deterministic app/backend tests and strict AIUI 0.19.0 source validation passed. Read [verification/README.md](verification/README.md) for executed checks and package results, and [verification/source-pins.json](verification/source-pins.json) for the DevKit and official-source revisions. Local check output is saved to `output/verification/local-results.json`.

The unmodified AIX 0.8.2 browser preview currently **FAILS** during Ink 0.19 startup before either app loads. A separate patched diagnostic renders both apps and allows button checks; it is not a native-preview PASS. Studio, physical-glasses, and live-provider checks remain **BLOCKED**. Local checks, diagnostic rendering, and source-bound audits do not establish release readiness.

A pinned [GitHub Actions template](docs/ci/README.md) is included but **not enabled**: the publishing credential lacks workflow write permission. Its install, test, strict validation, audit, pack/list and HTML-export commands passed from a clean local clone. Enabling CI later does not establish browser, Studio, glasses or live-model success.

## Project map

```text
rokid-aiui-starter-kit/
├── README.md / README.zh-CN.md / README.ja.md
├── AGENTS.md                 # Coding-agent instructions; uses external DevKit
├── PROJECT.md / MEMORY.md / TASKS.md / WORKLOG.md
├── demos/
│   ├── cook-along/
│   │   ├── app/              # Complete Studio import root
│   │   └── tests/            # Local behavior tests
│   └── style-lens/
│       ├── app/              # Complete Studio import root
│       ├── server/           # Separate vision-provider proxy
│       └── tests/            # Local behavior tests
└── scripts/                  # Checks that use your external DevKit
```

Both apps target AIUI **0.19.0**, using [official sources pinned to `7d62c2d`](https://github.com/yodaos-project/AIUI/tree/7d62c2d9ac1cdc1389ba06ed0651b395903accff). App-specific `app/AGENTS.md` files describe runtime Agent behavior; the root `AGENTS.md` directs your coding assistant.
