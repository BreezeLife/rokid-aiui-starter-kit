# Cook Along

English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) · [Starter Kit](../../README.md)

A local recipe stepper and timer for Rokid Glasses. Use it as a starting point for coffee, tea, craft instructions, or another short guided routine.

![Cook Along diagnostic browser screenshot — patched Ink 0.19.0](../../verification/screenshots/cook-running-final.png)

Actual Cook Along browser capture using patched Ink 0.19.0. This is diagnostic UI evidence, not AIUI Studio or physical-glasses validation.

| Fact | This demo |
| --- | --- |
| Runtime / UI | AIUI 0.19.0; English Page UI; `_current` and `_blank` |
| Core flow | Choose recipe → follow steps → time a waiting step → complete or restart |
| Presets | `coffee`: Pour-over coffee; `pasta`: Tomato pasta |
| Network / keys / permissions | No application network request, external API, API key, or camera permission |
| Source import root | `demos/cook-along/app` from the Starter Kit root |
| Development tool | External `rokid-aiui-agent` DevKit Skill |

“Offline” means the core recipe/timer flow after the Page has opened. Host launch, cloud voice services, and installation are outside that claim and need separate device verification. This demo does not use an AI model at runtime.

## Start

1. Follow the [root installation guide](../../README.md) to install **and load** your DevKit in Codex, Claude Code, or Cursor.
2. Open the Starter Kit root in the coding tool. Read this demo, then choose one of the prompts below.
3. Run checks from the **Starter Kit root**:

   ```bash
   npm test
   npm run verify
   ```

4. In AIUI Studio, select `demos/cook-along/app`, which directly contains `app.json`. Do not import the demo's parent folder. Test the sequence below in Studio and then on glasses.

For GitHub import, use these exact coordinates. Choose a specific commit instead of `main` when reproducing a recorded source snapshot.

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
Directory: demos/cook-along/app
```

## Behavior and boundaries

The recipe selector opens a sequence of steps. Previous/next controls change steps; optional timers support start, pause, resume, and reset. Leaving a step cancels its timer. A recipe can be restarted, completed, or left to choose another recipe.

Coffee has a 30-second bloom and 90-second drawdown preset. Pasta has a 120-second sauce step and 480-second cooking preset; follow the packet timing for the actual pasta. Presets are editable demonstration content. Timer completion never advances to another step automatically.

Timing uses an absolute deadline. When the Page is hidden, refresh work stops; showing it again recalculates the remaining time. Closing the Page clears the session. There is no system alarm, sound, background service, or saved timer recovery. Buttons use focus/tap; hardware input behavior still requires glasses verification.

## Change these files first

Paths below are relative to `demos/cook-along/`.

| File | Change here |
| --- | --- |
| `app/lib/recipes.js` | Recipe IDs, labels, step instructions, and timer durations |
| `app/pages/index.ink` | English UI, layout, step flow, timer presentation, focus/tap handlers |
| `app/app.json` | App metadata and declared Page |
| `app/AGENTS.md` | How the runtime Agent opens this Page |
| `tests/` | Regression coverage for any changed behavior |

When adding recipe IDs, update the Page schema enum in `app/pages/index.ink` and runtime instructions in `app/AGENTS.md` too. Keep each recipe readable at a glance. The app must not import files from another demo or outside its own `app/` directory.

## Three copyable coding prompts

Use the invocation for your tool from the [root guide](../../README.md). These examples use Codex. Send them in chat.

**1. Swap the content**

```text
$rokid-aiui-agent
In demos/cook-along/app, replace the coffee and pasta presets with two
tea-brewing guides. Edit the local recipe data, keep English UI, step
navigation and pause/resume timing, and preserve AIUI 0.19.0. Run the
existing tests and strict verification; report actual results.
```

**2. Localize the app**

```text
$rokid-aiui-agent
Localize demos/cook-along/app to Japanese, including recipes and control
labels. Keep the same behavior and import root. Check long text, focus
states and both _current/_blank layouts; run tests and strict verification.
Do not mark unobserved Studio or device checks as passed.
```

**3. Adapt the flow**

```text
$rokid-aiui-agent
Turn demos/cook-along/app into a beginner craft guide using only local
steps and optional timers. Preserve pause/resume, cancellation on step
change, hide/show reconciliation and unload cleanup. Add meaningful
regression coverage and update the UX/per-capability matrices. Deliver
the exact source root and list any BLOCKED Studio or glasses checks.
```

## Short demonstration

1. Open the selector and choose **Pour-over coffee**.
2. Move to the bloom step, start the timer, then pause and resume. Check that the remaining time behaves as expected.
3. Move to the next step; the previous timer must stop. Continue to completion and return to the selector.
4. For the offline check, disconnect only after opening and repeat the core flow. Record the actual device/host and result; this does not prove offline launch.

Also test leaving a running Page hidden and returning, closing/reopening, and both display targets. The short demonstration skips waiting for full preset durations; use controlled clocks in tests or an explicitly shortened local preset when checking timer completion.

For limited browser layout/click checks, follow the [optional diagnostic preview instructions](../../README.md#optional-diagnostic-browser-preview). The helper patches a separate runtime under `output/`; its observations are not native-preview, Studio, or device PASS.

## Verification status

Deterministic local tests and strict AIUI 0.19.0 source validation passed. See [verification/AUDIT.md](verification/AUDIT.md) for source-bound UX/capability gates and the [root verification report](../../verification/README.md) for executed checks and package results. The unmodified AIX browser preview fails before app loading; a separately patched diagnostic renders the UI but does not make native preview PASS. Studio and physical-glasses checks remain **BLOCKED**. Offline host launch also remains **BLOCKED**. The local checks do not establish acceptance by Studio or behavior on a particular glasses model.
