# Style Lens

English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) · [Starter Kit](../../README.md)

A garment-advice starter for Rokid Glasses. Select work, weekend, or evening and read three short suggestions. Start with bundled Sample results; connect your own vision provider when you are ready to test the live photo flow.

[![Style Lens diagnostic browser screenshot — patched Ink 0.19.0](../../verification/screenshots/style-sample-final.png)](media/demo.mp4)

[Watch the ~30-second diagnostic walkthrough (MP4)](media/demo.mp4). This edited walkthrough uses actual diagnostic browser screenshots from patched Ink 0.19.0; it is not a continuous real-time recording or evidence of Studio, glasses, or live-provider operation.

Actual Style Lens browser capture using patched Ink 0.19.0. This is diagnostic UI evidence, not AIUI Studio or physical-glasses validation. Style Lens is in Sample mode; no live model result is shown.

| Fact | This demo |
| --- | --- |
| Runtime / UI | AIUI 0.19.0; English Page UI; full-screen `_blank` |
| Default mode | **Sample**: bundled blue-shirt examples, no camera capture or network request; not model-generated analysis of the current view |
| Live flow | Select Live → capture and send a photo → wait → read up to three suggestions, or recover from an error |
| Live requirements | Camera permission, reachable HTTPS proxy, short-lived team token, server-side provider key, and a vision-capable model |
| Source import root | `demos/style-lens/app` from the Starter Kit root |
| Backend | `demos/style-lens/server`; deploy separately, never import it into Studio |
| Development tool | External `rokid-aiui-agent` DevKit Skill |

## Quickstart: import → run → modify

First clone the Starter Kit and [install and load the DevKit](../../README.md#1-install-and-load-your-devkit) in your coding tool.

1. **Import:** select `demos/style-lens/app` in AIUI Studio, or use the GitHub coordinates below. Do not import `server/`.
2. **Run:** open `pages/index/index` in `_blank`. Keep **Sample** selected and try **Work**, **Weekend**, and **Evening**. No camera, backend, or API key is needed for Sample.
3. **Modify:** ask the DevKit to change a bundled tip in `app/data/samples.js`, using prompt 1 below. Run the checks from the **Starter Kit root**, then reopen/reimport the edited app and observe the changed Sample text:

   ```bash
   npm ci --ignore-scripts --no-audit --no-fund
   npm test
   npm run verify
   ```

For GitHub import, use these exact coordinates. Choose a specific commit instead of `main` when reproducing a recorded source snapshot.

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
Directory: demos/style-lens/app
```

The Page starts in Sample mode every time. An optional `occasion` input accepts `work`, `weekend`, or `evening` and defaults to `work`; it does not enable Live mode. Camera capture is an explicit user action.

## Connect Live mode

See the [backend deployment guide](server/README.md) for complete local Node.js, Docker/Compose, and managed HTTPS container instructions. The templates are provided for your deployment; container, remote HTTPS, and live-provider operation have not been verified here.

The proxy accepts an image and occasion at `POST /api/style`, then calls a configurable OpenAI-compatible vision API. Pick a provider/model available to your team and able to accept image inputs; no particular model is bundled or provisioned.

From the Starter Kit root:

```bash
cd demos/style-lens/server
cp -n .env.example .env
# Edit .env before starting. Existing .env files should be edited, not overwritten.
node --env-file=.env server.mjs
```

Use the same Node.js 22.20+ environment as the root setup. Configure these values in the server's `.env`:

| Variable | Purpose |
| --- | --- |
| `VISION_API_KEY` | Your provider key, stored only on the server |
| `VISION_MODEL` | A vision-capable model ID supported by that provider |
| `VISION_API_BASE_URL` | Provider base URL; template default is `https://api.openai.com/v1` |
| `TEAM_TOKEN` | A random per-team token of at least 32 characters; give the matching temporary token to the demo App |
| `TEAM_TOKEN_EXPIRES_AT` | Future ISO timestamp, at most 24 hours ahead; renew it for a later session |
| `HOST`, `PORT` | Local defaults `127.0.0.1` and `8787` |
| `UPSTREAM_TIMEOUT_MS` | Provider timeout; default `25000` |
| `ALLOWED_ORIGIN` | Optional exact HTTPS browser origin; blank disables browser cross-origin access |

The local server is for development. For glasses, deploy the proxy behind a reachable **HTTPS** endpoint, then edit `app/config.js`:

```js
backendUrl: 'https://your-backend.example/api/style',
teamToken: 'your-temporary-per-team-token'
```

The hostname and token above are placeholders. Keep `VISION_API_KEY` out of all App files. The team token is a temporary demo credential, not a replacement for production authentication; remove it before sharing source and revoke or rotate it after the session. Keep `.env` outside the Studio import root and out of version control.

Configure the backend before choosing **Try Live** and **Capture & send**. Grant camera permission when prompted. Live mode sends the photo through your proxy to the configured provider; Sample mode does not. The App and proxy do not save photos; retention at your chosen provider is not established here. Cancellation cannot undo a photo already transmitted or an incurred provider charge. Initial limits are 4 MiB per image, a 45-second App timeout, and a 25-second provider timeout. Cancel, permission denial, missing configuration, network/provider errors, and invalid responses should lead to an explicit recoverable state. Switching to Sample provides a key-free fallback; it does not pretend the live request succeeded.

## Change these three places first

Paths are relative to `demos/style-lens/`. Start with these **three** entrypoints:

| Order | File | First change |
| --- | --- | --- |
| **1 · Data** | `app/data/samples.js` | Change the bundled Work, Weekend, or Evening tips |
| **2 · UI** | `app/pages/index/index.ink` | Change headings, button labels, or the occasion/advice layout |
| **3 · API configuration** | `app/config.js` | In a private copy, set the HTTPS backend URL and temporary team token; leave both blank for Sample |

For Live-model behavior, edit the system prompt in `server/prompt.mjs`. Server credentials/settings use `server/.env.example` → private `.env`; request/authentication logic is in `server/server.mjs`. Runtime invocation and permissions are in `app/AGENTS.md` and `app/app.json`; regression tests are in `tests/`. Keep provider keys on the server.

## Three copyable coding prompts

Use the invocation for your tool from the [root guide](../../README.md). These examples use Codex and belong in chat.

**1. Change the scenario without an API**

```text
$rokid-aiui-agent
In demos/style-lens/app, change the Sample scenarios to a campus day,
a job interview and a weekend walk. Keep English UI and explicit Sample
labels. Update bundled advice and tests; Sample must not capture photos
or call the backend. Run tests and strict AIUI 0.19.0 verification.
```

**2. Adapt the live prompt**

```text
$rokid-aiui-agent
Adapt demos/style-lens for a travel packing helper. Change the backend
vision prompt and the matching Sample text, keeping the response contract of one to three
short suggestions. Keep provider credentials on the server, use test
stubs, and do not call a paid model. Verify errors, cancellation and stale
results as well as normal behavior; report live-provider checks as BLOCKED.
```

**3. Prepare a team demonstration**

```text
$rokid-aiui-agent
Review demos/style-lens/app and server for our hackathon demo. Check
Sample/Live labeling, configuration errors, permission denial, timeouts,
token expiry, cancellation and unload cleanup. Run local tests, strict
verification and supported AIX operations. Update UX/per-capability
matrices and report exact import/artifact paths. Keep Studio, glasses
and real-provider checks BLOCKED unless actually performed.
```

## Short demonstration

1. Open **Sample**, choose **Work**, and display the three bundled suggestions. State that they are example data.
2. Change to **Weekend** or **Evening** and show the corresponding results. No camera or provider request is involved.
3. Choose **Try Live**. With the initial empty configuration, check **Setup needed**, then choose **Use Sample** to return.
4. For a separately configured Live demonstration, choose **Try Live**, point at a garment, and choose **Capture & send**. Show the waiting state and the actual returned suggestions.
5. Exercise an unavailable backend or a denied permission, then return to Sample. Never present a fallback result as live analysis.

A Live response depends on provider/network conditions, so the short Sample demonstration does not promise a fixed Live response time. Use full-screen `_blank`; check focus/tap, cancel, leaving the Page during a request, and reopening it in Sample.

For limited browser layout/click checks, follow the [optional diagnostic preview instructions](../../README.md#optional-diagnostic-browser-preview). The helper patches a separate runtime under `output/`; its observations are not native-preview, Studio, or device PASS.

## Verification status

Deterministic local tests and strict AIUI 0.19.0 source validation passed. See [verification/AUDIT.md](verification/AUDIT.md) for source-bound UX/capability gates and the [root verification report](../../verification/README.md) for executed checks and package results. The unmodified AIX browser preview fails before app loading; a separately patched diagnostic renders the UI but does not make native preview PASS. Studio and physical-glasses checks remain **BLOCKED**. Local proxy tests use a fake provider; the real vision service and camera hardware remain **BLOCKED**. Sample results are not evidence of successful live inference.
