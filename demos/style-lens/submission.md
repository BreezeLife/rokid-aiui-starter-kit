# Style Lens — submission preparation

This is a filled preparation draft for the shipped source snapshot. Platform submission has not been performed. Sample advice is bundled content; a Live API or camera success has not been observed on glasses.

## Build identity

- Preparation date: 2026-10-23 (Asia/Shanghai). Owner: BreezeLife project maintainer; platform publisher identity UNKNOWN.
- Target runtime: AIUI 0.19.0; source contract pinned to official `7d62c2d9ac1cdc1389ba06ed0651b395903accff`.
- Target surface: full-screen Page (`_blank`); no embedded, Widget, or Worker experience is advertised.
- Target glasses / firmware: UNKNOWN; the maintainer must record the actual device before device acceptance.
- Studio import root: `demos/style-lens/app` within this Starter Kit; select the directory directly containing `app.json`.
- Repository root: the local `rokid-aiui-starter-kit` directory.
- GitHub repository: [BreezeLife/rokid-aiui-starter-kit](https://github.com/BreezeLife/rokid-aiui-starter-kit); ref: `main`; Studio directory: `demos/style-lens/app`. Pin the actual commit at review time; the source fingerprint below identifies this prepared snapshot.
- Source fingerprint: `WORKTREE:c29724b24c4f70213f50ec0ffbb29141941b27a9a94a7b967b99ade067e6a218`; recompute after any app edit, including local backend configuration.
- DevKit source baseline inspected: `d9fe8f9a82891640351cdcf5515b4c17689df95a` of the existing Skill repository.
- Capability inventory and final audit: [verification/inventory.json](verification/inventory.json), [verification/AUDIT.md](verification/AUDIT.md). Use those artifacts for final gate status; local test results do not grant capability PASS.
- AIX version / archive / bytes / digest / listing: [final delivery report](../../verification/README.md#exact-source-and-packages), bound to this fingerprint.
- Studio portal / region / form inspection / Agent ID / generated version / cloud source correspondence: UNKNOWN; no authenticated portal inspection or cloud version creation occurred.

## Listing draft

- Name: **Style Lens** (10 characters; availability remains UNKNOWN).
- Summary: Quick outfit ideas from a sample garment or one explicitly captured photo.
- Feature description: “Choose Work, Weekend, or Evening and explore three short styling ideas. Sample mode uses bundled examples for a blue shirt. With a configured backend and camera permission, Live mode sends one garment photo for AI suggestions. Switch back to Sample whenever needed.”
- Opening message: “Choose an occasion to try sample ideas for a blue shirt. To use your own garment, select Live after setup, then Capture & send. One photo and the occasion will be sent to the configured backend and its AI provider.”
- Category candidate: Lifestyle; actual current portal option UNKNOWN.
- Custom icon: BLOCKED — no icon asset created or submitted. Planned original garment-outline icon; capture/creation owner is the maintainer. Verify current icon specifications and inspect the final pixels before upload.
- Implemented behaviors: [Page controls and lifecycle](app/pages/index/index.ink), [editable sample data](app/data/samples.js), [config and input validation](app/lib/advice.js), [proxy](server/server.mjs), [live prompt](server/prompt.mjs). Exact capability gate IDs are in the linked inventory.
- Limitations: Sample mode does no image analysis. Live requires a reachable HTTPS backend, an unexpired team token, a compatible configured model, available camera, and device permission. English UI only. No microphone, location, image gallery, accounts, background work, shopping links, price estimates, identity recognition, or attractiveness rating. Cancellation cannot undo transmitted data or incurred provider cost.

## Usage and reviewer reproduction

| User request | Exact route and target | Parameters/schema/defaults | Expected state and fallback | Evidence/result |
| --- | --- | --- | --- | --- |
| Show outfit examples | `pages/index/index`, `_blank` | `{}`; `occasion` defaults to `work` | SAMPLE, blue-shirt label, three bundled tips; no network/camera | Local behavior tests PASS; Studio/device BLOCKED |
| Show evening ideas | Same route on a new Page, or Evening button in the existing Page | `{ "occasion": "evening" }`; allowed values `work`, `weekend`, `evening` | SAMPLE remains explicit; tips change | Local behavior tests PASS; host routing BLOCKED |
| Supply unknown occasion | Same route and target | `{ "occasion": "unknown" }` | Work sample with “Unknown occasion” explanation | Local behavior tests PASS; host schema rejection/routing BLOCKED |
| Try my garment | Try Live, then Capture & send | No mode route parameter; private `app/config.js` supplies backend URL and temporary token | Missing configuration shows Setup needed. With setup, system framing preview then one encoded image upload; at most three validated suggestions | Mocked camera/network and fake-provider tests PASS; live provider / Studio / glasses BLOCKED |
| Deny camera permission | Same Live action | Device authorization denied | Actionable error plus Use Sample and Retry | Local denial test PASS; device permission UI BLOCKED |
| Leave while loading, then return | Host back/hide then reopen/return | No retained background operation | Tracks stopped, request aborted, late results ignored; retry available after return | Local lifecycle tests PASS; actual host lifecycle BLOCKED |

Fresh Page invocation always starts in Sample. Occasion controls change the existing Page in place. “Try Live” alone neither captures nor sends a photo. Each “Capture & send” / “Retry” / “New photo” is a new explicit attempt; no automatic retries are made.

## Permissions and data-use draft

| Capability/code | Manifest declaration | Device authorization | Studio review selection | Specific purpose/data flow | Denial/recovery evidence |
| --- | --- | --- | --- | --- | --- |
| `navigator.mediaDevices.getUserMedia({audio:false,video:true})` and `ImageCapture.takePhoto` | `CAMERA` only | Required for Live; not requested in Sample | UNKNOWN until form inspection | Capture one garment image with system framing preview; stop every acquired track | Mock denial, cancel, timeout and late-stream cleanup PASS; hardware BLOCKED |
| `fetch` in Page | No invented NETWORK permission | Actual connectivity needed | UNKNOWN until form inspection | JSON POST to configured HTTPS `/api/style`, containing occasion, JPEG/PNG base64, MIME type; Authorization carries temporary team token | Mock HTTP failure, timeout, cancel and stale-result tests PASS; real transmission BLOCKED |
| Proxy provider request | N/A to AIUI manifest | Backend credentials supplied by operator | Disclose configured third party in portal | Backend creates Chat Completions request with the encoded image and occasion; provider key stays server-side | Local HTTP fake-provider integration PASS; actual provider BLOCKED |

- The source does not write images or advice to disk or a database and does not log request bodies, photos, tokens, or provider replies. Process memory temporarily contains the uploaded image. This is a source observation, not a guarantee about hosting infrastructure, platform telemetry, or third-party storage.
- Hosting logs, provider retention/deletion, applicable regions, and account terms: UNKNOWN until the operator chooses and confirms the deployment/provider. Publish the actual endpoint owner and data policy before public use.
- A captured scene may contain people or other incidental personal information. The user-facing action names sending; frame the garment and avoid bystanders. The prompt instructs the model to focus on garments, without identity or personal-trait inference.
- No API key belongs in the app. The temporary team token is extractable from an app/package, expires server-side within 24 hours, and is a hackathon access mechanism. Do not commit or redistribute a configured private copy. Public distribution requires an appropriate user-access and budget design.
- Local proxy defaults to `127.0.0.1:8787`; device Live use requires a separately deployed reachable HTTPS endpoint. The repository does not deploy a service.

## Media register and capture plan

All entries below are Studio/device capture plans. Separate diagnostic browser captures are retained in the [delivery report](../../verification/README.md#browser-observations-and-limitation). Detailed steps are in [media/capture-plan.md](media/capture-plan.md).

| Planned file | Actual capture or plan | Surface/state/workflow | Evidence layer | Source/runtime/time | Format/duration/size | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `sample-work.png` | Plan | Full-screen SAMPLE, blue shirt, Work tips | Studio then device separately | Bind final fingerprint, AIUI 0.19, device and timestamp at capture | PNG; square recommended; size UNKNOWN | BLOCKED |
| `sample-evening.png` | Plan | Change occasion with visible focus and confirmation | Studio then device separately | Same source identity required | PNG; size UNKNOWN | BLOCKED |
| `live-recovery.png` | Plan | Denied permission or unavailable backend; Use Sample visible | Device | Record real denial/error scenario | PNG; size UNKNOWN | BLOCKED |
| `style-lens-flow.mp4` | Plan | Sample selection, explicit Live, actual capture/advice if configured, recovery | Studio/device distinguishable | Record runtime/device/source/time; redact secrets only | MP4; target 30–40 s, hard documented maximum 60 s | BLOCKED |

Official pinned [publishing requirements](https://github.com/yodaos-project/AIUI/blob/7d62c2d9ac1cdc1389ba06ed0651b395903accff/documentation/0-guide/bundle/publish.en-US.md) require 3–5 previews with at least one image and one video; square format, 15–45-second video and at most 50 MB per file are recommendations. Current portal dimensions/codec choices remain UNKNOWN. Do not publish a staged Sample recording as live model evidence.

## Verification and review notes

- Executed local tests: `node --test demos/style-lens/tests/*.test.mjs` from repository root; 26/26 PASS under Node.js 24.19.0. Includes the documented `node --env-file=.env server.mjs` launch flow with dummy credentials and `/health`; no paid model call.
- Camera mocks use the documented AIUI 0.19 direct `AbortSignal` construction and `abort()` behavior. Node backend cancellation separately uses Node's `AbortController`. Mock success is not AIUI runtime proof.
- Strict validation, inventory, AIX package/list, and final audit validator outcome are owned by the linked final verification report and must match the current source fingerprint.
- Preview: verification observed a bootstrap failure in the supplied Ink 0.19 preview before application loading. A separately patched diagnostic preview showed all Sample controls and tips within 480 × 352 and the Weekend action updated content and visible focus. This diagnostic compatibility patch is outside the shipped source and cannot establish native runtime success; see the final verification report and actual captures.
- Studio import/simulation, phone-to-glasses package update, actual device focus/camera/input, Live provider request, and physical optical checks: BLOCKED.
- Every 0.19 capability row remains BLOCKED under the DevKit's inventory-only policy, even where local tests pass. Do not mark Release-ready YES from local results.

## Owner inputs and decision

| Missing input or gate | Owner | Next action | Result |
| --- | --- | --- | --- |
| Live backend and model | Hackathon organizer | Choose provider/model, set budget, deploy HTTPS, issue expiring team token, verify one consented photo | BLOCKED |
| Device and firmware | Maintainer with glasses | Record version and run camera/input/lifecycle/optical checks | BLOCKED |
| Studio cloud identity | Publisher | Import exact `app/`, simulate, create cloud version, reconcile source match | BLOCKED |
| Third-party privacy facts | Backend operator | Confirm regions, retention/deletion, hosting logs and participant disclosure | BLOCKED |
| Icon and real media | Publisher | Produce original icon and capture the planned states | BLOCKED |
| Portal fields and permission selections | Publisher | Inspect current region/form; confirm name/category/media limits | BLOCKED |

Materials prepared: editable source, proxy, test suite, listing/permission draft, reproducible capture plan. Release-ready: **NO**. Platform submission: **NOT PERFORMED**.

After owner inputs are ready: import the exact source into Studio, simulate, create its cloud resource version, update the glasses resource package using the companion app, verify that version on glasses, refresh source-bound media and the audit, then perform a separately authorized submission.
