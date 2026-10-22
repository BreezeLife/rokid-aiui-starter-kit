export function encodeBase64(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  let part = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] || 0;
    const c = bytes[i + 2] || 0;
    part += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bytes.length ? alphabet[c & 63] : '=');
    if (part.length >= 8192) { chunks.push(part); part = ''; }
  }
  if (part) chunks.push(part);
  return chunks.join('');
}

export function normalizeAdvice(value) {
  if (!value || !Array.isArray(value.suggestions) ||
      value.suggestions.length < 1 || value.suggestions.length > 3) return null;
  const suggestions = [];
  for (const text of value.suggestions) {
    if (typeof text !== 'string' || !text.trim() || text.length > 72 || /[\r\n\x00-\x1f]/.test(text)) return null;
    if (suggestions.includes(text.trim())) return null;
    suggestions.push(text.trim());
  }
  return suggestions;
}

export function liveConfigError(config) {
  try {
    const url = new URL(config.backendUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        url.pathname !== '/api/style') return 'Set a reachable HTTPS /api/style URL in config.js.';
  } catch (_) { return 'Set the backend URL in config.js, or use Sample.'; }
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(config.teamToken)) return 'Set a temporary team token in config.js.';
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1000 || config.timeoutMs > 60000 ||
      !Number.isInteger(config.maxImageBytes) || config.maxImageBytes < 1 || config.maxImageBytes > 4194304) {
    return 'Restore valid timeout and photo limits in config.js.';
  }
  return '';
}
