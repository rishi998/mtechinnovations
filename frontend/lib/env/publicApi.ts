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
  return normalizePublicApiBase(base);
}
