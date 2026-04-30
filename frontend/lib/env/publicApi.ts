/**
 * Public API base URL (must end with `/api`). Inlined at build time from NEXT_PUBLIC_API_URL.
 * Unset: dev uses local Nest; production defaults to the deployed public API (set NEXT_PUBLIC_API_URL to override).
 *
 * Normalizes a common production mistake: `NEXT_PUBLIC_API_URL=https://domain.com` (no `/api`).
 * Without this, image URLs become `https://domain.com/zoho/...` and static hosting returns 404;
 * the Nest API lives at `https://domain.com/api/...`.
 */
function normalizePublicApiBase(base: string): string {
  const trimmed = base.replace(/\/$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  try {
    const withScheme = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const u = new URL(withScheme);
    const pathOnly = u.pathname.replace(/\/$/, '') || '/';
    if (pathOnly === '/') {
      return `${u.origin}/api`;
    }
    return trimmed;
  } catch {
    return `${trimmed}/api`;
  }
}

let _dbgPublicApiLogCount = 0;

export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  let base: string;
  if (raw) {
    base = raw.replace(/\/$/, '');
  } else if (process.env.NODE_ENV === 'development') {
    base = 'http://localhost:3001/api';
  } else {
    base = 'https://mtechinnovations.in/api';
  }
  const resolved = normalizePublicApiBase(base);
  // #region agent log
  if (_dbgPublicApiLogCount < 6) {
    _dbgPublicApiLogCount += 1;
    fetch('http://127.0.0.1:7681/ingest/2a46f5dd-d7d2-453e-bd45-dce3655ab643', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'ae2d28',
      },
      body: JSON.stringify({
        sessionId: 'ae2d28',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'publicApi.ts:getPublicApiUrl',
        message: 'public API base resolved',
        data: {
          nodeEnv: process.env.NODE_ENV,
          rawPresent: Boolean(raw),
          rawHasApiPath: raw ? raw.replace(/\/$/, '').includes('/api') : false,
          resolvedEndsWithApi: resolved.endsWith('/api'),
          resolvedHost: (() => {
            try {
              return new URL(resolved.includes('://') ? resolved : `https://${resolved}`).hostname;
            } catch {
              return 'parse_fail';
            }
          })(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return resolved;
}
