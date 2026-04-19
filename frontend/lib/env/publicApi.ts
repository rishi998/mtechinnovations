/**
 * Public API base URL (must end with `/api`). Inlined at build time from NEXT_PUBLIC_API_URL.
 * In production builds, NEXT_PUBLIC_API_URL must be set (e.g. in Render) so the client can reach the API.
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required for production builds. Set it in Render (frontend service) to your backend URL + /api.',
    );
  }
  return 'http://localhost:3001/api';
}
