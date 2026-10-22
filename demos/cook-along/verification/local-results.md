# Cook Along local implementation checks

Date: 2026-10-23 (Asia/Shanghai). Target: AIUI 0.19.0.

The local test runner executes the shipped `app/pages/index.ink` setup and `app/lib/recipes.js` in a Node VM. Only ESM linkage, `setData`, timer scheduling and time are supplied by the harness. This is behavioral evidence for the JavaScript, not an Ink renderer, Studio or glasses test.

| Check | Command / inputs | Observed result |
| --- | --- | --- |
| Page behavior | `node --test demos/cook-along/tests/*.test.mjs` from the repository root | PASS: 12 tests, 0 failures |
| Import-root structure | `python3 "$AIUI_SKILL/scripts/validate_aiui_project.py" demos/cook-along/app --repository-root . --strict --target-version 0.19.0 --json` | PASS: valid true; 0 errors; 0 warnings |
| Actual rendering, host navigation and optics | Requires preview/Studio/glasses captures in the root verification record | BLOCKED in this local test report; no visual or physical-input claim is made |
| Release readiness | See [AUDIT.md](AUDIT.md) and [inventory.json](inventory.json) | BLOCKED: the DevKit's 0.19 capability policy is inventory-only |

The executed local Node binary was the bundled Codex runtime, not an npm-installed app dependency. `AIUI_SKILL` above denotes the resolved external `rokid-aiui-agent` Skill directory. The implementation agent used the sibling DevKit repository's `skills/rokid-aiui-agent` directory.

The twelve behavioral cases cover initial/invalid query input, documented button attributes, both complete recipe flows, precise pause/resume and timer reset, expiry without automatic advancement, hide/show reconciliation, paused hide/show, step-change cancellation, disposed-page cleanup, button focus, all template handler bindings, and bounded editable data with no network calls.

## Source contracts inspected

Official snapshot: `7d62c2d9ac1cdc1389ba06ed0651b395903accff`.

- [ES modules](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/1-framework/open-agent-format/module.en-US.md): local `.js` import from Page setup.
- [Page API](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/3-api/framework/page.en-US.md): default export, `setData`, show/hide/unload ownership.
- [Focus](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/1-framework/open-agent-format/focus.en-US.md) and [events](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/1-framework/open-agent-format/page-events.en-US.md): native host navigation, focus/blur callbacks. The app does not intercept key events.
- [Button](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/2-components/button.en-US.md): `bindtap`.
- [Official navigation sample](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/samples/capabilities/pages/index/index.js): read `data-*` from `event.currentTarget.attributes`.
- [Manifest](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/1-framework/open-agent-format/app-json.en-US.md): Page declaration and exact permission boundaries. This app requests none.
- [Monochrome design](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/design/monochrome/design-system-green.md): green luminance, low fill, 1px structural and 2px focus lines. Source choices still need optical verification.

## API and binding inventory for review

`app/app.js` exports an empty App object. `pages/index` is the only route. The Page imports only `../lib/recipes.js`. It uses `Date.now`, `setInterval`, `clearInterval`, `setData`, `onLoad`, `onShow`, `onHide`, `onUnload`, `onHostFocus` and `onHostBlur`.

Template taps bind to `chooseRecipe`, `nextStep`, `previousStep`, `restartRecipe`, `showRecipes`, `toggleTimer` and `resetTimer`. Every button binds `onActionFocus` and `onActionBlur`; `data-action` is the identity and recipe buttons additionally carry `data-recipe`. Enter/ArrowUp/ArrowDown/Backspace retain host behavior. There are no voice, head-gesture, camera, storage, fetch, audio, Widget or Worker APIs.

`aiui-audit-claims.json` closes the product-only claim universe with `claims: []`; functionality is directly represented in source. This is not a statement that runtime capabilities passed verification.
