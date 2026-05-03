import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZohoOAuthException } from './zoho.exceptions';
import type { ZohoTokenPersistence } from './zoho-token.persistence';

export type ZohoRefreshTokenSource = 'mongodb' | 'env';

/** Last N chars for logs only — never log full refresh tokens. */
export function zohoRefreshTokenFingerprint(token: string, tail = 8): string {
  const t = String(token ?? '').trim();
  if (t.length < tail) {
    return '(too_short)';
  }
  return `…${t.slice(-tail)}`;
}

/**
 * Single resolution path for the Zoho refresh token used with Accounts `grant_type=refresh_token`.
 *
 * Priority (default):
 * 1. Persisted bundle (Mongo `zoho_oauth_tokens`) — updated by GET /api/zoho/callback (canonical after OAuth).
 * 2. `ZOHO_REFRESH_TOKEN` in env — bootstrap / legacy only, unless disabled.
 *
 * Set `ZOHO_ALLOW_ENV_REFRESH_TOKEN_FALLBACK=false` once OAuth has written tokens to Mongo so .env cannot override.
 */
const zohoRefreshResolverLog = new Logger('ZohoOAuth');

export async function resolveStoredZohoRefreshToken(
  tokens: ZohoTokenPersistence,
  config: ConfigService,
): Promise<{ refreshToken: string; source: ZohoRefreshTokenSource }> {
  const allowEnvFallback = !/^false$/i.test(
    String(config.get<string>('ZOHO_ALLOW_ENV_REFRESH_TOKEN_FALLBACK') ?? '').trim(),
  );

  let persistedRefresh = '';
  try {
    const bundle = await tokens.load();
    persistedRefresh = String(bundle?.refreshToken ?? '').trim();
  } catch {
    persistedRefresh = '';
  }

  const envRefresh = String(config.get<string>('ZOHO_REFRESH_TOKEN') ?? '').trim();

  if (persistedRefresh) {
    zohoRefreshResolverLog.debug(
      `[Zoho OAuth] Resolved refresh token from Mongo: ${zohoRefreshTokenFingerprint(persistedRefresh)}`,
    );
    return { refreshToken: persistedRefresh, source: 'mongodb' };
  }

  if (envRefresh && allowEnvFallback) {
    return { refreshToken: envRefresh, source: 'env' };
  }

  if (envRefresh && !allowEnvFallback) {
    throw new ZohoOAuthException(
      'No refresh token found in persisted Zoho OAuth store (Mongo). Complete GET /api/zoho/login … callback, ' +
        'or set ZOHO_ALLOW_ENV_REFRESH_TOKEN_FALLBACK=true temporarily to allow ZOHO_REFRESH_TOKEN.',
    );
  }

  throw new ZohoOAuthException(
    'No Zoho refresh token available. Complete OAuth via GET /api/zoho/login?type=order (or type=full), ' +
      'or set ZOHO_REFRESH_TOKEN in .env when env fallback is allowed.',
  );
}
