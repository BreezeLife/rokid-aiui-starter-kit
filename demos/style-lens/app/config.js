// Edit only in a private local copy before Live mode. Never put a provider API key here.
// This temporary team token is readable by anyone receiving the source or package.
export const CONFIG = {
  backendUrl: '', // Full reachable HTTPS URL, e.g. https://YOUR-HOST/api/style
  teamToken: '', // Match server TEAM_TOKEN; expires server-side within 24 hours.
  timeoutMs: 45000, // Entire capture + upload + response, including camera permission.
  maxImageBytes: 4 * 1024 * 1024
};
