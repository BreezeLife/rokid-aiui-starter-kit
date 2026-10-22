# Cook Along submission preparation

## Build identity

- Preparation date / owner: 2026-10-23; Starter Kit maintainers.
- Target AIUI runtime: 0.19.0. Target glasses model/firmware: UNKNOWN; device tester must record them.
- Source import root: `demos/cook-along/app/` within the Starter Kit. Import this directory by itself.
- GitHub repository: [BreezeLife/rokid-aiui-starter-kit](https://github.com/BreezeLife/rokid-aiui-starter-kit); ref: `main`; Studio directory: `demos/cook-along/app`. Pin the actual commit at review time; the source fingerprint below identifies this prepared snapshot.
- Source fingerprint: `WORKTREE:5387d8ed2b6e372f04512267f1569bdf8f971d948738f9878129a78018af3e0e`. Final package path, bytes and SHA-256: [delivery report](../../verification/README.md#exact-source-and-packages). Recompute after any app edit.
- Capability inventory: [inventory.json](verification/inventory.json).
- Studio portal/region, form inspection, Agent ID, generated version and cloud-source correspondence: UNKNOWN; no authenticated import or platform submission was performed by this implementation task.

## Listing draft

- Name: **Cook Along**.
- Summary: Follow a local recipe one step at a time, with optional visual timers.
- Feature description: Choose pour-over coffee or tomato pasta, read one step at a time, and move forward or back. Timed steps offer a visual countdown with pause, resume and reset. Restart a recipe or choose another. The opened application uses local data and does not call an external API. Timers do not ring or send background notifications.
- Opening message: Choose a recipe to begin. Follow each step at your own pace and start a timer when useful. Next or Back clears that step's timer. Closing the Page clears progress.
- Category candidate: Food / Lifestyle; actual available portal category is UNKNOWN.
- Custom icon: BLOCKED; no icon file or provenance has been supplied.
- Capabilities and bindings: selector/recipe sequence in [Page setup](app/pages/index.ink); local recipes in [recipes.js](app/lib/recipes.js); default native button focus and `bindtap` with explicit visual focus state; visual timers use an absolute deadline. See [local results](verification/local-results.md) for executed JavaScript checks and [inventory](verification/inventory.json) for exact audit gates.
- Unsupported behavior: no voice recognition, photo capture, model advice, account, remote recipes, persistence, sound, background notification or doneness detection. Offline host launch remains unverified. Wall-clock changes can affect the countdown; it is a convenience timer, not a precision alarm.

## Usage and reviewer reproduction

| User request | Exact route and target | Parameters/schema/defaults | Expected state and fallback | Evidence/result |
| --- | --- | --- | --- | --- |
| Open recipes | `pages/index`, prefer `_blank`; compact `_current` also authored | Omit `recipe` | Selector with coffee and pasta buttons | PASS: shipped-setup test; Studio/device BLOCKED |
| Open coffee directly | Same Page in a fresh invocation | `{"recipe":"coffee"}` | First coffee step; four steps total | PASS: local test; host routing BLOCKED |
| Select pasta | Visible selector button | `data-recipe="pasta"` in `currentTarget.attributes` | Four local steps; optional 120s/480s example timers | PASS: local test; physical input BLOCKED |
| Invalid preset | Fresh Page, same route | `{"recipe":"missing"}` | Notice plus working selector; no crash | PASS: local negative/recovery test |
| Hide and return | Retained Page, either target | Start Bloom timer, hide, return | Hidden callbacks stop; remaining time reconciles from deadline; expiry does not advance | PASS: local clock-controlled test; real lifecycle BLOCKED |
| Close and reopen | Fresh Page | Omit parameters | New selector, no saved countdown | PASS: local disposed/fresh-instance test; host close/reopen BLOCKED |

Timers are optional. Next/Back, Restart and Recipes discard the current step timer. On completion, Make it again starts the same recipe from step one. The host's Enter, arrows and Backspace remain available because the app does not intercept key events.

## Permissions and data-use draft

| Capability/code | Manifest declaration | Device authorization | Studio review selection | Specific purpose/data flow | Denial/recovery evidence |
| --- | --- | --- | --- | --- | --- |
| Local recipe display and visual timer | None; manifest has no permissions array | N/A for app-owned logic | UNKNOWN; owner must inspect actual form | Bundled recipes and Page-memory state only | PASS: no network/capture/storage use in local tests |
| Native button focus and activation | None | Host focus behavior must be verified | UNKNOWN | Read action identity from event attributes; update displayed state | PASS: callback tests; device input BLOCKED |

- External services: none called by this app. Host/platform behavior is outside this source claim.
- Personal data: this app has no capture, account, storage or transmission implementation. Do not convert that into a claim about the entire Rokid host's telemetry or retention.
- Owner confirmations needed: current Studio review selections, privacy listing expectations and any host/platform disclosures.

## Media register and capture plan

| File or planned shot | Actual capture or plan | Surface/state/workflow | Evidence layer | Source/runtime/time | Format/duration/size | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Recipe selector | Plan | `_blank`, first frame | STUDIO / DEVICE pending | Record exact fingerprint / 0.19.0 / capture time | PNG, dimensions UNKNOWN | BLOCKED |
| Timer with visible focus | Plan | Bloom step, running then paused | STUDIO / DEVICE pending | Same source identity | PNG | BLOCKED |
| Recipe complete | Plan | Final state | STUDIO / DEVICE pending | Same source identity | PNG | BLOCKED |
| Complete workflow | Plan | Selector → timer → completion → selector | STUDIO / DEVICE pending | Same source identity | MP4, planned 30–40s; no file yet | BLOCKED |

See [capture-plan.md](media/capture-plan.md) for the sequence and separate offline/device checks. Studio/device media remains planned; separately labeled diagnostic browser captures are in the [delivery report](../../verification/README.md#browser-observations-and-limitation).

## Verification and review notes

- [Local results](verification/local-results.md): 12 behavioral tests passed; strict 0.19.0 structure validation returned 0 errors and 0 warnings.
- [Functional/UX and capability audit](verification/AUDIT.md): authoritative final evidence matrix. The DevKit's 0.19 policy is inventory-only; do not reinterpret passing callback tests as capability or release approval.
- Official AIX preview, compatibility diagnostics, packaging and exact source identity are recorded by the root verification flow. Preview HTML export alone does not establish a rendered preview, and a compatibility-patched browser view cannot establish unmodified runtime support.
- Studio import/simulation, retained Page lifecycle on the host, root back behavior, physical touchpad input, optical readability, performance and offline host launch remain BLOCKED pending actual captures.
- Recompute the fingerprint and rerun relevant checks after any source change. Refresh media when visible behavior changes.

The actual [30-second diagnostic walkthrough](media/demo.mp4) and its [capture/source provenance](media/README.md) are available for starter onboarding. It does not complete the Studio/device media plans above.

## Owner inputs and decision

| Missing input or gate | Owner | Next action | Result |
| --- | --- | --- | --- |
| Target glasses and firmware | Device tester | Import exact source; record installed runtime/package version | BLOCKED |
| Studio behavior and device UX | Hackathon organizer/tester | Run both target surfaces; compare current source and package; capture focus/steps/timer/return flows | BLOCKED |
| Offline host launch | Device tester | Launch without connectivity separately from after-open offline flow | BLOCKED |
| Publishing metadata and custom icon | Maintainer | Inspect current regional form; select category; provide original icon | BLOCKED |
| Preview images/video | Capture owner | Execute the capture plan against verified source | BLOCKED |

- Materials prepared: source-bound listing draft, permission/data-flow notes, reproduction steps and media capture plan.
- Release-ready: **NO**.
- Platform submission: **NOT PERFORMED**.
