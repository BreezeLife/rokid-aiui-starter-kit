# Style Lens backend

The dependency-free Node.js proxy connects the AIUI app to an image-capable, OpenAI-compatible Chat Completions API. The app always opens in **Sample** mode, which needs no server or key. Selecting Live and then Capture & send uses this server after configuration.

This directory contains a portable Dockerfile and a Compose template. No service has been deployed by this repository. Provider keys belong in server runtime secrets; the app receives only the HTTPS endpoint and a temporary team token.

## Start locally

Use Node.js 22 or later; Node.js 24 is the container baseline. From the Starter Kit root:

```bash
cd demos/style-lens/server
cp -n .env.example .env
```

Fill the following values in the private `.env` file. If `.env` already exists, the copy command preserves it; edit that existing file. There is no `npm install` step for this server.

| Setting | Value |
| --- | --- |
| `VISION_API_KEY` | Your provider key; never copy it into the app |
| `VISION_MODEL` | An available model supporting image input through Chat Completions; explicitly required |
| `VISION_API_BASE_URL` | Defaults to `https://api.openai.com/v1`; another compatible provider must use HTTPS |
| `TEAM_TOKEN` | A newly generated token of 32–128 base64url characters |
| `TEAM_TOKEN_EXPIRES_AT` | A future ISO timestamp within 24 hours of server startup |
| `HOST` / `PORT` | Native development defaults to `127.0.0.1` / `8787` |
| `UPSTREAM_TIMEOUT_MS` | Defaults to `25000`; allowed range 100–30000 milliseconds |
| `ALLOWED_ORIGIN` | Leave empty for native AIUI; optionally set one exact HTTPS browser origin for preview |

Generate a temporary token and, separately, a four-hour expiry:

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
node -e "console.log(new Date(Date.now()+4*60*60*1000).toISOString())"
```

Copy the outputs into `.env`, then run:

```bash
node --env-file=.env server.mjs
```

In another terminal, check liveness:

```bash
curl --fail http://127.0.0.1:8787/health
```

Expected body: `{"status":"ok"}`. This does not contact the provider, validate its key/model, or prove that a photo request succeeds. A POST to `/api/style` without a valid bearer token returns `401` before any provider request.

## Run the container locally

With Docker Engine and Compose installed, use the same filled private `.env` file:

```bash
docker compose up --build -d
docker compose ps
curl --fail http://127.0.0.1:8787/health
```

Compose binds the Node process to `0.0.0.0:8787` **inside the container**, while publishing port 8787 on the host's loopback interface. It runs as the image's unprivileged `node` user, with a read-only filesystem. Only `package.json`, `server.mjs`, and `prompt.mjs` enter the image; `.env` is excluded from the build context and supplied at runtime.

Stop this local service with `docker compose down`. After replacing an expiring token or changing the environment, recreate it with `docker compose up -d --force-recreate`. Update the private app copy with the same new team token. An expired token returns `401`; starting with an expired timestamp fails immediately.

The `node:24-bookworm-slim` base is a maintained major-version tag. For a fixed deployment, record and pin the digest produced by your successful build. The [official Node image source](https://github.com/nodejs/docker-node) publishes its supported variants.

## Deploy behind HTTPS

For a managed Docker web service, configure these exact build and runtime settings:

| Setting | Value |
| --- | --- |
| Repository | Your Starter Kit fork or template copy |
| Build context / service root | `demos/style-lens/server` |
| Dockerfile | `Dockerfile`, relative to that context |
| Build command | The platform's Docker build; no package-install command |
| Start command | Image default: `node server.mjs` |
| Runtime host | `HOST=0.0.0.0` |
| Internal port | `PORT=8787`, or the platform's injected `PORT` |
| Health-check path | `/health` |
| Public protocol | A platform-managed HTTPS hostname with a valid certificate |
| Runtime secrets | `VISION_API_KEY`, `TEAM_TOKEN`; also supply `VISION_MODEL` and a fresh `TEAM_TOKEN_EXPIRES_AT` |

The container default already sets `HOST=0.0.0.0`; keep that value. The image reads runtime environment variables directly and does not need a mounted `.env` file. Use the platform's secret storage instead of adding credentials to source, image build arguments, or build logs.

If using the Compose template on a server, put an existing HTTPS reverse proxy in front of the loopback listener. Forward `/health` and `/api/style` to `http://127.0.0.1:8787`, preserving the Authorization header. Allow at least 6 MiB request bodies for the base64-encoded 4 MiB photo, and a response timeout longer than `UPSTREAM_TIMEOUT_MS`. HTTPS certificate and DNS setup depend on the selected host; the template does not configure or provision them.

Check the deployed liveness URL from the phone's network:

```bash
curl --fail https://YOUR-HOST/health
```

Replace `YOUR-HOST` with the actual reachable hostname. Localhost, an HTTP-only URL, or a private laptop address is not a working glasses endpoint. App configuration accepts the exact HTTPS `/api/style` path without query parameters or embedded credentials.

For a hackathon, use one process/replica per team or intentionally share the limits. The proxy permits at most two concurrent authorized requests and twelve authorized attempts per minute **per process**, including invalid attempts. These in-memory limits are not a cross-replica quota. Set the provider's spending limit before enabling paid requests.

## Connect the private app copy

Edit `../app/config.js` in a private team copy after deployment:

```javascript
export const CONFIG = {
  backendUrl: 'https://YOUR-HOST/api/style',
  teamToken: 'YOUR_TEMPORARY_TEAM_TOKEN',
  timeoutMs: 45000,
  maxImageBytes: 4 * 1024 * 1024
};
```

Keep the provider key on the server. The team token is extractable from app source or an AIX package, so it is an expiring hackathon credential. Do not publish a configured app copy. Re-run the DevKit verification and package that changed copy before importing/updating it in AIUI Studio.

The participant flow is:

1. Open the unconfigured app and select an occasion: Sample works with no network/API key.
2. Configure and deploy the backend, check `/health`, and set the private app endpoint/token.
3. Import the updated app, select **Try Live**, then **Capture & send**.
4. Grant camera permission, frame one garment in the system preview, and confirm sending. The selected occasion and JPEG/PNG photo go to this backend and then the configured provider.
5. Review up to three suggestions. Use **Retry** after a recoverable failure or **Use Sample** to return to bundled content.

Step 4 can incur a provider charge and sends the photo to the selected service. The repository's automated checks use a local fake provider; they never perform that step against a paid service.

## Request contract and recovery

`POST /api/style` requires `Content-Type: application/json` and `Authorization: Bearer TEAM_TOKEN`. Body:

```json
{
  "occasion": "work",
  "mimeType": "image/jpeg",
  "imageBase64": "BASE64_ENCODED_IMAGE_BYTES"
}
```

Allowed occasions are `work`, `weekend`, and `evening`. Only JPEG/PNG images up to 4 MiB are accepted. The server validates base64 and file signatures; the provider performs full decoding. Remote image URLs are not accepted. A successful reply is `{"suggestions":["Pair with charcoal trousers."]}` with one to three distinct, nonempty strings of at most 72 characters each.

| Result | Meaning / next action |
| --- | --- |
| `401 UNAUTHORIZED` | Missing, wrong or expired team token; renew matching server/app configuration |
| `400` / `413` / `415` | Invalid request, oversized image or unsupported media; retry a supported capture |
| `429 TRY_LATER` | Concurrent/minute limit reached; wait at least the Retry-After interval |
| `502 PROVIDER_UNAVAILABLE` | Check provider endpoint, credentials, model access and service status |
| `502 INVALID_PROVIDER_REPLY` | Model output did not meet the short JSON contract; check the chosen model/prompt |
| `504 PROVIDER_TIMEOUT` | The upstream attempt exceeded its deadline; retry or use Sample |

The proxy has no persistent photo storage and does not log request bodies, tokens, photos or provider replies. Hosting logs and provider retention/deletion are operator-dependent and must be confirmed separately. The configured upstream never follows redirects; client disconnects abort its in-flight request, but cancellation cannot retract a transmitted photo or an incurred charge.

## Verification recorded on 2026-10-23

- Node behavior/proxy suite: 26 tests passed, including real localhost HTTP against a fake upstream and actual env-file CLI startup.
- Deployment-style native launch (`HOST=0.0.0.0`, runtime environment injection), the Dockerfile health command, and unauthorized-request recovery: checked locally without provider calls; see the retained [deployment check report](../../../verification/deployment-template.json).
- Docker build, Compose startup, remote HTTPS, camera and live provider: **BLOCKED / not executed** here. Docker is unavailable on this machine; native Node checks do not substitute for a container build.

Run the existing suite from the Starter Kit root with `node --test demos/style-lens/tests/*.test.mjs`. The [demo README](../README.md) covers source import and the [project verification report](../../../verification/README.md) distinguishes preview, Studio and physical-glasses evidence.

Implementation references: [Docker environment configuration](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/), [Dockerfile health checks](https://docs.docker.com/reference/dockerfile/#healthcheck), and the [OpenAI image-input contract](https://developers.openai.com/api/docs/guides/images-vision).
