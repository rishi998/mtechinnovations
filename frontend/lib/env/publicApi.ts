/**
 * Public API base URL (must end with `/api`). Inlined at build time from NEXT_PUBLIC_API_URL.
 * Set `NEXT_PUBLIC_API_URL` on your host (e.g. Render frontend service) to your API origin + `/api`.
 * If unset, falls back to local dev URL — fine for `next dev`; for production deploys, set the env var.
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'http://localhost:3001/api';
}
