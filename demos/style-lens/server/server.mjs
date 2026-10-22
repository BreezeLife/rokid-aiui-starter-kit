import http from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { SYSTEM_PROMPT } from './prompt.mjs';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1024;
const MAX_PROVIDER_BYTES = 32768;
const OCCASIONS = new Set(['work', 'weekend', 'evening']);

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
function integer(value, fallback, min, max, name) {
  const result = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(result) || result < min || result > max) throw new Error(`Invalid ${name}`);
  return result;
}
export function readConfig(env = process.env, now = Date.now()) {
  if (!env.VISION_API_KEY || /[\r\n]/.test(env.VISION_API_KEY)) throw new Error('Set VISION_API_KEY');
  if (!env.VISION_MODEL || !/^[A-Za-z0-9_./:-]{1,160}$/.test(env.VISION_MODEL)) throw new Error('Set VISION_MODEL to an image-capable Chat Completions model');
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(env.TEAM_TOKEN || '')) throw new Error('Set TEAM_TOKEN to 32–128 base64url characters');
  const expiresAt = Date.parse(env.TEAM_TOKEN_EXPIRES_AT || '');
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt > now + 86400000) throw new Error('Set TEAM_TOKEN_EXPIRES_AT within the next 24 hours');
  let base;
  try { base = new URL(env.VISION_API_BASE_URL || 'https://api.openai.com/v1'); } catch { throw new Error('Invalid VISION_API_BASE_URL'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('VISION_API_BASE_URL must be HTTPS without credentials, query, or fragment');
  const allowedOrigin = env.ALLOWED_ORIGIN || '';
  if (allowedOrigin) {
    let origin;
    try { origin = new URL(allowedOrigin); } catch { throw new Error('Invalid ALLOWED_ORIGIN'); }
    if (origin.protocol !== 'https:' || origin.origin !== allowedOrigin) throw new Error('ALLOWED_ORIGIN must be one exact HTTPS origin');
  }
  return {
    apiKey: env.VISION_API_KEY, model: env.VISION_MODEL, teamToken: env.TEAM_TOKEN, expiresAt,
    endpoint: base.href.replace(/\/$/, '') + '/chat/completions', allowedOrigin,
    host: env.HOST || '127.0.0.1', port: integer(env.PORT, 8787, 1, 65535, 'PORT'),
    upstreamTimeoutMs: integer(env.UPSTREAM_TIMEOUT_MS, 25000, 100, 30000, 'UPSTREAM_TIMEOUT_MS')
  };
}
function equalToken(actual, expected) {
  const digest = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}
function send(res, status, body, headers = {}) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'JSON_REQUIRED');
  if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') throw new HttpError(415, 'ENCODING_UNSUPPORTED');
  const declared = req.headers['content-length'];
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) throw new HttpError(413, 'PHOTO_TOO_LARGE');
  const text = await new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    const timer = setTimeout(() => finish(new HttpError(408, 'REQUEST_TIMEOUT')), 10000);
    function cleanup() {
      clearTimeout(timer);
      req.off('data', data); req.off('end', end); req.off('error', error); req.off('aborted', aborted);
    }
    function finish(err) { cleanup(); if (err) { req.resume(); reject(err); } else resolve(Buffer.concat(chunks).toString('utf8')); }
    function data(chunk) { size += chunk.length; if (size > MAX_BODY_BYTES) finish(new HttpError(413, 'PHOTO_TOO_LARGE')); else chunks.push(chunk); }
    function end() { finish(); }
    function error() { finish(new HttpError(400, 'REQUEST_INTERRUPTED')); }
    function aborted() { finish(new HttpError(400, 'REQUEST_INTERRUPTED')); }
    req.on('data', data); req.on('end', end); req.on('error', error); req.on('aborted', aborted);
  });
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'INVALID_JSON'); }
}
export function validateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['occasion', 'mimeType', 'imageBase64'].includes(key)) ||
      !OCCASIONS.has(body.occasion)) throw new HttpError(400, 'INVALID_REQUEST');
  if (!['image/jpeg', 'image/png'].includes(body.mimeType)) throw new HttpError(415, 'IMAGE_TYPE_UNSUPPORTED');
  const image = body.imageBase64;
  if (typeof image !== 'string' || image.length === 0 || image.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new HttpError(413, 'PHOTO_TOO_LARGE');
  if (image.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image)) throw new HttpError(400, 'INVALID_IMAGE');
  const bytes = Buffer.from(image, 'base64');
  if (bytes.length > MAX_IMAGE_BYTES || bytes.length < 16 || bytes.toString('base64') !== image) throw new HttpError(400, 'INVALID_IMAGE');
  // Check encoded-file signatures; the provider performs full image decoding.
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
  if ((body.mimeType === 'image/png' && !png) || (body.mimeType === 'image/jpeg' && !jpeg)) throw new HttpError(400, 'INVALID_IMAGE');
  return { occasion: body.occasion, imageUrl: `data:${body.mimeType};base64,${image}` };
}
export function validateAdvice(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.suggestions) || value.suggestions.length < 1 || value.suggestions.length > 3) throw new HttpError(502, 'INVALID_PROVIDER_REPLY');
  const suggestions = value.suggestions.map(text => {
    if (typeof text !== 'string' || !text.trim() || text.length > 72 || /[\r\n\x00-\x1f]/.test(text)) throw new HttpError(502, 'INVALID_PROVIDER_REPLY');
    return text.trim();
  });
  if (new Set(suggestions).size !== suggestions.length) throw new HttpError(502, 'INVALID_PROVIDER_REPLY');
  return { suggestions };
}
async function providerAdvice(config, input, signal, fetchImpl) {
  const response = await fetchImpl(config.endpoint, {
    method: 'POST', redirect: 'error', signal,
    headers: { Authorization: 'Bearer ' + config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, max_completion_tokens: 600,
      messages: [ { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [ { type: 'text', text: 'Occasion: ' + input.occasion },
          { type: 'image_url', image_url: { url: input.imageUrl } } ] } ] })
  });
  if (!response.ok || !response.body) {
    if (response.body) await response.body.cancel();
    throw new HttpError(502, 'PROVIDER_UNAVAILABLE');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PROVIDER_BYTES) { await reader.cancel(); throw new HttpError(502, 'INVALID_PROVIDER_REPLY'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const envelope = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const content = envelope.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('missing content');
    return validateAdvice(JSON.parse(content));
  } catch { throw new HttpError(502, 'INVALID_PROVIDER_REPLY'); }
}

// Factory accepts an explicit configuration so tests can use a local fake provider.
// Production CLI configuration is always checked by readConfig().
export function createStyleServer(config, { fetchImpl = fetch, now = Date.now } = {}) {
  let active = 0;
  let windowStarted = now();
  let windowRequests = 0;
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = origin && origin === config.allowedOrigin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    if (origin && origin !== config.allowedOrigin) { send(res, 403, { error: 'ORIGIN_DENIED' }); return; }
    if (req.method === 'OPTIONS' && req.url === '/api/style' && origin && config.allowedOrigin) {
      send(res, 204, null, { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }); return;
    }
    if (req.method === 'GET' && req.url === '/health') { send(res, 200, { status: 'ok' }, cors); return; }
    if (req.method !== 'POST' || req.url !== '/api/style') { send(res, 404, { error: 'NOT_FOUND' }, cors); return; }
    const auth = req.headers.authorization || '';
    if (now() >= config.expiresAt || auth.length > 160 || !equalToken(auth, 'Bearer ' + config.teamToken)) {
      req.resume(); send(res, 401, { error: 'UNAUTHORIZED' }, cors); return;
    }
    if (now() - windowStarted >= 60000) { windowStarted = now(); windowRequests = 0; }
    if (active >= 2 || windowRequests >= 12) { req.resume(); send(res, 429, { error: 'TRY_LATER' }, { ...cors, 'Retry-After': '60' }); return; }
    active += 1;
    windowRequests += 1;
    const controller = new AbortController();
    let upstreamTimer;
    let timedOut = false;
    const onClose = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', onClose);
    try {
      const input = validateInput(await readBody(req));
      if (res.destroyed) return;
      upstreamTimer = setTimeout(() => { timedOut = true; controller.abort(); }, config.upstreamTimeoutMs);
      const result = await providerAdvice(config, input, controller.signal, fetchImpl);
      send(res, 200, result, cors);
    } catch (error) {
      const status = timedOut ? 504 : error instanceof HttpError ? error.status : 502;
      const code = timedOut ? 'PROVIDER_TIMEOUT' : error instanceof HttpError ? error.code : 'PROVIDER_UNAVAILABLE';
      send(res, status, { error: code }, cors);
    } finally {
      clearTimeout(upstreamTimer);
      res.off('close', onClose);
      active -= 1;
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = readConfig();
    const server = createStyleServer(config);
    server.on('error', () => { console.error('Style Lens could not listen. Check HOST and PORT.'); process.exitCode = 1; });
    server.listen(config.port, config.host, () => console.log('Style Lens proxy listening. No request, photo, or token logging is enabled.'));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
