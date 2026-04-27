/**
 * Public API base URL (must end with `/api`). Inlined at build time from NEXT_PUBLIC_API_URL.
 * Unset: dev uses local Nest; production defaults to the deployed public API (set NEXT_PUBLIC_API_URL to override).
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  return 'https://mtechinnovations.in/api';
}
