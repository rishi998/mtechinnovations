import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { buildScopesForPreset, type ZohoScopePreset } from './zoho.config';
import { ZohoMissingScopeException, ZohoOAuthException } from './zoho.exceptions';
import { ZohoScopeLogger } from './zoho-scope-logger';
import { ZohoTokenPersistence } from './zoho-token.persistence';
import type {
  ZohoTokenBundle,
  ZohoTokenEndpointError,
  ZohoTokenEndpointSuccess,
} from './zoho.types';
import type {
  ZohoInventoryItemNormalized,
  ZohoInventoryItemsListResponse,
} from './zoho-inventory.types';
import type { ZohoCreateSalesOrderPayload } from './zoho-inventory-salesorder.types';

const ACCESS_EXPIRY_BUFFER_MS = 60_000;
const ZOHO_ITEMS_PAGE_SIZE = 200;
const ZOHO_ITEMS_MAX_PAGES = 500;

/** Normalize tax / exemption ids from .env (quotes, comments, accidental text). */
function parseZohoNumericEnvId(raw: string | undefined | null): string | null {
  if (raw == null) {
    return null;
  }
  let s = String(raw).trim();
  if (s === '') {
    return null;
  }
  s = s.split('#')[0].trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (/^\d+$/.test(s)) {
    return s;
  }
  const m = s.match(/\d{3,}/);
  if (m && /^\d+$/.test(m[0])) {
    return m[0];
  }
  return null;
}

@Injectable()
export class ZohoService {
  private readonly logger = new Logger(ZohoService.name);

  /** In-memory access token cache (never log this value). */
  private cachedAccessToken: string | null = null;
  /** Epoch ms when cached access token expires (Zoho `expires_in`). */
  private cachedExpiresAtMs = 0;
  /** From last token response; used for Inventory host when present. */
  private cachedApiDomain: string | null = null;

  private tokenFetchLock: Promise<void> | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly tokens: ZohoTokenPersistence,
    private readonly scopeLogger: ZohoScopeLogger,
  ) {}

  /**
   * Zoho Accounts OAuth endpoint (India DC default). Token URL must match the DC where
   * the refresh token was issued.
   */
  private get accountsBase(): string {
    const raw = this.config.get<string>(
      'ZOHO_ACCOUNTS_URL',
      'https://accounts.zoho.in',
    );
    return raw.replace(/\/$/, '');
  }

  private get clientId(): string {
    return this.config.getOrThrow<string>('ZOHO_CLIENT_ID');
  }

  private get clientSecret(): string {
    return this.config.getOrThrow<string>('ZOHO_CLIENT_SECRET');
  }

  private get defaultInventoryBase(): string {
    const base = this.config.get<string>(
      'ZOHO_INVENTORY_API_BASE',
      'https://www.zohoapis.in/inventory/v1',
    );
    return base.trim().replace(/\/$/, '');
  }

  /** Zoho may return api_domain with or without scheme; avoid `https://https://...` (ENOTFOUND https). */
  private normalizeZohoApiHost(raw: string): string {
    let s = raw.trim();
    s = s.replace(/^https?:\/\//i, '');
    return s.replace(/\/$/, '');
  }

  private get organizationId(): string {
    return this.config.getOrThrow<string>('ZOHO_ORGANIZATION_ID');
  }

  /**
   * True when there is no usable cached access token (missing, or past expiry minus buffer).
   */
  isTokenExpired(): boolean {
    if (!this.cachedAccessToken) {
      return true;
    }
    return Date.now() >= this.cachedExpiresAtMs - ACCESS_EXPIRY_BUFFER_MS;
  }

  /**
   * Returns a valid access token using `ZOHO_REFRESH_TOKEN` + client credentials.
   * Uses in-memory cache until near expiry, then POSTs to Accounts token endpoint.
   */
  async getAccessToken(): Promise<string> {
    if (!this.isTokenExpired()) {
      this.logger.log('Reusing cached Zoho access token');
      return this.cachedAccessToken as string;
    }

    await this.synchronizedEnvRefresh();
    if (!this.cachedAccessToken) {
      throw new ZohoOAuthException('Failed to obtain Zoho access token.');
    }
    return this.cachedAccessToken;
  }

  /**
   * @deprecated Prefer {@link getAccessToken}. Kept for callers that still use this name.
   */
  async getValidAccessToken(): Promise<string> {
    return this.getAccessToken();
  }

  /**
   * Clears cached access token so the next {@link getAccessToken} hits Zoho again
   * (e.g. after Inventory returns 401).
   */
  async forceRefreshAccessToken(): Promise<void> {
    this.cachedAccessToken = null;
    this.cachedExpiresAtMs = 0;
    this.cachedApiDomain = null;
  }

  /** Approximate seconds until cached access token expires (0 if none cached). */
  getSecondsUntilAccessTokenExpiry(): number {
    if (!this.cachedAccessToken || !this.cachedExpiresAtMs) {
      return 0;
    }
    return Math.max(0, Math.ceil((this.cachedExpiresAtMs - Date.now()) / 1000));
  }

  /**
   * Ensures an access token exists and reports whether the current value was reused
   * from cache (before call) vs freshly obtained from Zoho.
   */
  async probeAccessToken(): Promise<{ expiresIn: number; isCached: boolean }> {
    const isCached = !this.isTokenExpired();
    await this.getAccessToken();
    return {
      isCached,
      expiresIn: this.getSecondsUntilAccessTokenExpiry(),
    };
  }

  /**
   * Lightweight Inventory call (single item page) for connectivity checks.
   */
  async isInventoryReachable(): Promise<boolean> {
    try {
      const qs = new URLSearchParams({
        organization_id: this.organizationId,
        page: '1',
        per_page: '1',
      });
      await this.requestInventory<ZohoInventoryItemsListResponse>({
        method: 'GET',
        url: `/items?${qs.toString()}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists organization taxes (Zoho Inventory GET /settings/taxes).
   * OAuth scope: ZohoInventory.settings.READ (included in `order` and `full` login presets).
   */
  async listInventoryTaxes(): Promise<
    Array<{
      tax_id: string;
      tax_name: string;
      tax_percentage: number;
      tax_type: string;
      tax_specific_type?: string;
      is_default_tax?: boolean;
    }>
  > {
    const qs = new URLSearchParams({
      organization_id: this.organizationId,
      per_page: '200',
    });
    const data = await this.requestInventory<{
      code?: number;
      message?: string;
      taxes?: unknown[];
    }>({
      method: 'GET',
      url: `/settings/taxes?${qs.toString()}`,
    });

    if (data && typeof data === 'object' && 'code' in data) {
      const c = Number((data as { code?: number }).code);
      if (Number.isFinite(c) && c !== 0) {
        throw new ZohoOAuthException(
          `Zoho Inventory taxes API error code ${c}: ${String((data as { message?: string }).message ?? '')}`,
        );
      }
    }

    const raw = Array.isArray(data?.taxes) ? data.taxes : [];
    return raw
      .map((t) => {
        const r = t as Record<string, unknown>;
        const tax_id = String(r.tax_id ?? '').trim();
        if (!tax_id) {
          return null;
        }
        const pct = Number(r.tax_percentage);
        return {
          tax_id,
          tax_name: String(r.tax_name ?? ''),
          tax_percentage: Number.isFinite(pct) ? pct : 0,
          tax_type: String(r.tax_type ?? ''),
          ...(typeof r.tax_specific_type === 'string'
            ? { tax_specific_type: r.tax_specific_type }
            : {}),
          ...(typeof r.is_default_tax === 'boolean'
            ? { is_default_tax: r.is_default_tax }
            : {}),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }

  /**
   * Builds the Zoho authorize URL. Requires `ZOHO_REDIRECT_URI` (browser flow only).
   */
  getAuthorizationUrl(preset: ZohoScopePreset): string {
    const redirectUri = this.config.get<string>('ZOHO_REDIRECT_URI');
    if (!redirectUri?.trim()) {
      throw new ZohoOAuthException(
        'ZOHO_REDIRECT_URI is required for the OAuth browser flow.',
      );
    }
    const scope = buildScopesForPreset(preset);
    this.scopeLogger.logOAuthStep(`login:${preset}`, scope);

    const params = new URLSearchParams({
      scope,
      client_id: this.clientId,
      response_type: 'code',
      access_type: 'offline',
      redirect_uri: redirectUri.trim(),
    });

    return `${this.accountsBase}/oauth/v2/auth?${params.toString()}`;
  }

  async exchangeAuthorizationCode(code: string): Promise<ZohoTokenBundle> {
    const redirectUri = this.config.get<string>('ZOHO_REDIRECT_URI');
    if (!redirectUri?.trim()) {
      throw new ZohoOAuthException('ZOHO_REDIRECT_URI is required to exchange an authorization code.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri.trim(),
    });

    const data = await this.postTokenForm(body);
    const bundle = this.mapTokenResponse(data, data.scope ?? '');
    await this.tokens.save(bundle);
    this.applySuccessfulTokenResponse(data);
    this.scopeLogger.logOAuthStep('callback:stored', bundle.grantedScope);
    this.logger.log('Generated new Zoho access token');
    return bundle;
  }

  getInventoryBaseUrl(_bundle?: ZohoTokenBundle | null): string {
    return this.resolveInventoryBaseUrl();
  }

  private resolveInventoryBaseUrl(): string {
    if (this.cachedApiDomain) {
      const host = this.normalizeZohoApiHost(this.cachedApiDomain);
      if (host) {
        return `https://${host}/inventory/v1`;
      }
    }
    return this.defaultInventoryBase;
  }

  async getItemsFromZoho(): Promise<ZohoInventoryItemNormalized[]> {
    const organizationId = this.organizationId;
    const aggregated: ZohoInventoryItemNormalized[] = [];
    let page = 1;

    while (page <= ZOHO_ITEMS_MAX_PAGES) {
      const qs = new URLSearchParams({
        organization_id: organizationId,
        page: String(page),
        per_page: String(ZOHO_ITEMS_PAGE_SIZE),
      });

      const data = await this.requestInventory<ZohoInventoryItemsListResponse>({
        method: 'GET',
        url: `/items?${qs.toString()}`,
      });

      if (data && typeof data === 'object' && 'code' in data) {
        const c = Number((data as { code?: number }).code);
        if (Number.isFinite(c) && c !== 0) {
          throw new ZohoOAuthException(
            `Zoho Inventory items API error code ${c}: ${String((data as { message?: string }).message ?? '')}`,
          );
        }
      }

      const batch = Array.isArray(data?.items) ? data.items : [];
      if (batch.length === 0) {
        break;
      }

      for (const raw of batch) {
        const normalized = this.normalizeZohoInventoryItem(
          raw as Record<string, unknown>,
        );
        if (normalized) {
          aggregated.push(normalized);
        }
      }

      const hasMore = data.page_context?.has_more_page === true;
      if (!hasMore) {
        break;
      }
      page += 1;
    }

    return aggregated;
  }

  private normalizeZohoInventoryItem(
    raw: Record<string, unknown>,
  ): ZohoInventoryItemNormalized | null {
    const idRaw = raw.item_id ?? raw.itemId;
    if (idRaw === undefined || idRaw === null || idRaw === '') {
      return null;
    }
    const zohoItemId = String(idRaw);
    const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Unnamed item';
    const sku =
      raw.sku === undefined || raw.sku === null || raw.sku === ''
        ? null
        : String(raw.sku);
    const price = this.coerceNumber(raw.rate, 0);
    const stock = this.coerceNumber(raw.stock_on_hand, 0);
    return { zohoItemId, name, sku, price, stock };
  }

  private coerceNumber(value: unknown, fallback: number): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Creates a sales order in Zoho Inventory. Requires scope e.g. ZohoInventory.salesorders.CREATE.
   */
  async createSalesOrder(
    payload: ZohoCreateSalesOrderPayload,
  ): Promise<Record<string, unknown>> {
    const cidRaw = payload.customer_id;
    if (
      cidRaw == null ||
      (typeof cidRaw === 'string' && cidRaw.trim() === '') ||
      !/^\d+$/.test(String(cidRaw).trim())
    ) {
      throw new ZohoOAuthException(
        'Invalid Zoho customer_id before creating sales order',
      );
    }
    this.logger.log(`Customer ID used: ${String(cidRaw).trim()}`);
    this.logger.log('Creating Zoho Sales Order...');

    const lineTaxRaw =
      this.config.get<string>('ZOHO_SALES_ORDER_LINE_TAX_ID') ??
      process.env.ZOHO_SALES_ORDER_LINE_TAX_ID;
    const exemptionRaw =
      this.config.get<string>('ZOHO_SALES_ORDER_TAX_EXEMPTION_ID') ??
      process.env.ZOHO_SALES_ORDER_TAX_EXEMPTION_ID;

    const lineTaxId = parseZohoNumericEnvId(lineTaxRaw);
    const taxExemptionId = parseZohoNumericEnvId(exemptionRaw);

    if (String(lineTaxRaw ?? '').trim() !== '' && !lineTaxId) {
      this.logger.warn(
        'ZOHO_SALES_ORDER_LINE_TAX_ID is set but not usable as a numeric id (check quotes, spaces, or text after #).',
      );
    }
    if (String(exemptionRaw ?? '').trim() !== '' && !taxExemptionId) {
      this.logger.warn(
        'ZOHO_SALES_ORDER_TAX_EXEMPTION_ID is set but not usable as a numeric id.',
      );
    }

    const body: Record<string, unknown> = {
      customer_id: String(cidRaw).trim(),
      date: payload.date,
      line_items: payload.line_items.map((li) => ({ ...li })),
    };
    if (payload.tax_exemption_id?.trim()) {
      body.tax_exemption_id = payload.tax_exemption_id.trim();
    }

    if (lineTaxId && /^\d+$/.test(lineTaxId)) {
      body.line_items = (body.line_items as ZohoCreateSalesOrderPayload['line_items']).map(
        (li) => ({
          ...li,
          tax_id: lineTaxId,
        }),
      );
      this.logger.log(`Sales order line tax_id from env: ${lineTaxId}`);
    } else if (taxExemptionId && /^\d+$/.test(taxExemptionId)) {
      body.tax_exemption_id = taxExemptionId;
      this.logger.log(`Sales order tax_exemption_id from env: ${taxExemptionId}`);
    } else if (
      body.tax_exemption_id &&
      /^\d+$/.test(String(body.tax_exemption_id))
    ) {
      /* payload already carried exemption */
    } else {
      throw new ZohoOAuthException(
        'Zoho requires a tax or tax exemption on sales orders. Set ZOHO_SALES_ORDER_LINE_TAX_ID (Zoho Inventory → Settings → Taxes → copy tax id) or ZOHO_SALES_ORDER_TAX_EXEMPTION_ID in server .env, then restart.',
      );
    }

    const qs = new URLSearchParams({
      organization_id: this.organizationId,
    });
    try {
      const data = await this.requestInventory<Record<string, unknown>>({
        method: 'POST',
        url: `/salesorders?${qs.toString()}`,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (data && typeof data === 'object' && 'code' in data) {
        const c = Number((data as { code?: number }).code);
        if (Number.isFinite(c) && c !== 0) {
          const msg = String(
            (data as { message?: string }).message ?? 'Zoho rejected sales order',
          );
          this.logger.error(`Sales Order failed: ${msg}`);
          throw new ZohoOAuthException(msg);
        }
      }

      this.logger.log('Sales Order created successfully');
      return data;
    } catch (err) {
      this.logger.error(
        'Sales Order failed',
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  /**
   * Extracts contact_id from POST /contacts body: { contact: { contact_id } }.
   * Do not use top-level response.contact_id — Zoho nests under `contact`.
   */
  private extractContactIdFromCreateBody(
    body: Record<string, unknown>,
  ): string | null {
    const contact = body.contact;
    if (contact && typeof contact === 'object' && contact !== null) {
      const id = (contact as Record<string, unknown>).contact_id;
      if (id != null && String(id).trim() !== '') {
        return String(id).trim();
      }
    }
    return null;
  }

  /**
   * Resolves Zoho `customer_id` (string) for sales orders: finds customer contact by email or creates one.
   * IDs are returned as strings so large Zoho longs are not corrupted by Number().
   */
  async ensureCustomerContact(
    customerName: string,
    email: string,
  ): Promise<string> {
    const org = this.organizationId;
    const emailNorm = email.trim().toLowerCase();

    const listQs = new URLSearchParams({
      organization_id: org,
      email: emailNorm,
    });
    const listRes = await this.requestInventory<Record<string, unknown>>({
      method: 'GET',
      url: `/contacts?${listQs.toString()}`,
    });

    if (listRes && typeof listRes === 'object' && 'code' in listRes) {
      const c = Number((listRes as { code?: number }).code);
      if (Number.isFinite(c) && c !== 0) {
        throw new ZohoOAuthException(
          String((listRes as { message?: string }).message ?? 'List contacts failed'),
        );
      }
    }

    const contacts = (listRes as { contacts?: unknown[] }).contacts;
    if (Array.isArray(contacts) && contacts.length > 0) {
      const row = contacts.find((raw) => {
        const r = raw as Record<string, unknown>;
        const t = String(r.contact_type ?? '').toLowerCase();
        return t === 'customer' && r.contact_id != null;
      }) as Record<string, unknown> | undefined;

      if (row?.contact_id != null) {
        const id = String(row.contact_id).trim();
        if (/^\d+$/.test(id)) {
          return id;
        }
      }
    }

    const trimmed = customerName.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] ?? trimmed;
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '-';

    const body = {
      contact_name: trimmed,
      contact_type: 'customer',
      contact_persons: [
        {
          first_name: firstName,
          last_name: lastName,
          email: emailNorm,
          is_primary_contact: true,
        },
      ],
    };

    const created = await this.requestInventory<Record<string, unknown>>({
      method: 'POST',
      url: `/contacts?${new URLSearchParams({ organization_id: org }).toString()}`,
      data: body,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (created && typeof created === 'object' && 'code' in created) {
      const c = Number((created as { code?: number }).code);
      if (Number.isFinite(c) && c !== 0) {
        throw new ZohoOAuthException(
          String((created as { message?: string }).message ?? 'Create contact failed'),
        );
      }
    }

    const createdRecord = created as Record<string, unknown>;
    const id = this.extractContactIdFromCreateBody(createdRecord);
    if (id == null || !/^\d+$/.test(id)) {
      throw new ZohoOAuthException(
        'Zoho contact response missing nested contact.contact_id (create response parse failed)',
      );
    }
    return id;
  }

  /**
   * Inventory API call with `Authorization: Zoho-oauthtoken <access_token>`.
   * On 401, invalidates cache and retries once after fetching a new access token.
   */
  async requestInventory<T = unknown>(
    config: AxiosRequestConfig,
  ): Promise<T> {
    const run = async (): Promise<T> => {
      const token = await this.getAccessToken();
      const base = this.resolveInventoryBaseUrl();
      const path = config.url != null ? String(config.url) : '';
      const url = path.startsWith('http')
        ? path
        : `${base}${path.startsWith('/') ? path : `/${path}`}`;

      this.scopeLogger.logApiRequest(
        config.method?.toUpperCase() ?? 'GET',
        '(env refresh token flow)',
      );

      try {
        const res = await firstValueFrom(
          this.http.request<T>({
            ...config,
            url,
            headers: {
              ...config.headers,
              Authorization: `Zoho-oauthtoken ${token}`,
            },
            validateStatus: () => true,
          }),
        );

        if (res.status === 401) {
          let detail = '';
          if (res.data && typeof res.data === 'object') {
            const d = res.data as Record<string, unknown>;
            detail = String(d.message ?? d.error ?? '').trim();
          }
          const hint =
            'Check: refresh token must include scopes for this API (e.g. ZohoInventory.salesorders.CREATE for sales orders). Re-auth via GET /api/zoho/login?type=order or type=full, then update ZOHO_REFRESH_TOKEN in .env. Also verify ZOHO_ORGANIZATION_ID and India DC (.in) settings.';
          const msg = detail
            ? `Zoho Inventory 401: ${detail}. ${hint}`
            : `Zoho Inventory 401 Unauthorized. ${hint}`;
          const err = new Error(msg) as Error & { status: number };
          err.status = 401;
          throw err;
        }

        if (res.status >= 400) {
          this.throwIfScopeError(res.data, res.status);
          let detail = `Zoho Inventory HTTP ${res.status}`;
          if (res.data && typeof res.data === 'object') {
            const d = res.data as Record<string, unknown>;
            const m = String(d.message ?? d.error ?? '').trim();
            if (m) {
              detail = `${detail}: ${m}`;
            }
          }
          throw new ZohoOAuthException(detail);
        }

        return res.data as T;
      } catch (err) {
        if (!isAxiosError(err) && (err as { status?: number })?.status === 401) {
          throw err;
        }
        if (isAxiosError(err)) {
          this.logger.warn(
            `Zoho Inventory request error: ${err.message}`,
          );
        }
        throw err;
      }
    };

    try {
      return await run();
    } catch (first) {
      const status = (first as { status?: number })?.status;
      const axiosStatus = isAxiosError(first)
        ? first.response?.status
        : undefined;
      if (status === 401 || axiosStatus === 401) {
        this.logger.warn(
          'Zoho Inventory returned 401; invalidating cache and retrying once after new access token',
        );
        await this.forceRefreshAccessToken();
        return run();
      }
      throw first;
    }
  }

  private throwIfScopeError(body: unknown, status?: number): void {
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      const code = String(o.code ?? o.error ?? '');
      const msg = String(o.message ?? o.error_description ?? '');
      const combined = `${code} ${msg}`.toUpperCase();
      if (
        combined.includes('SCOPE') ||
        combined.includes('INSUFFICIENT') ||
        combined.includes('INVALID OAUTH SCOPE') ||
        code === 'OAUTH_SCOPE_MISMATCH'
      ) {
        throw new ZohoMissingScopeException(
          'Zoho rejected this call due to missing or changed OAuth scopes. Re-run GET /zoho/login with a preset that includes the required scopes.',
          {
            hint: 'Refresh tokens cannot expand scope; user consent is required.',
          },
        );
      }
    }
    if (status === 403 && body && typeof body === 'object') {
      const msg = JSON.stringify(body);
      if (msg.toLowerCase().includes('scope')) {
        throw new ZohoMissingScopeException(
          'Possible insufficient Zoho Inventory scope. Re-authenticate with a broader `type` on /zoho/login.',
        );
      }
    }
  }

  private applySuccessfulTokenResponse(data: ZohoTokenEndpointSuccess): void {
    const expiresIn = Number(data.expires_in);
    const ms = (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000;
    this.cachedAccessToken = data.access_token;
    this.cachedExpiresAtMs = Date.now() + ms;
    if (data.api_domain) {
      this.cachedApiDomain = this.normalizeZohoApiHost(data.api_domain);
    }
  }

  private async synchronizedEnvRefresh(): Promise<void> {
    if (this.tokenFetchLock) {
      await this.tokenFetchLock;
      if (!this.isTokenExpired()) {
        return;
      }
    }

    this.tokenFetchLock = this.fetchAccessTokenUsingEnvRefreshToken().finally(
      () => {
        this.tokenFetchLock = null;
      },
    );
    await this.tokenFetchLock;
  }

  private async fetchAccessTokenUsingEnvRefreshToken(): Promise<void> {
    const refreshToken = this.config.getOrThrow<string>('ZOHO_REFRESH_TOKEN');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const data = await this.postTokenForm(body);
    this.applySuccessfulTokenResponse(data);
    this.logger.log('Generated new Zoho access token');
  }

  private async postTokenForm(
    body: URLSearchParams,
  ): Promise<ZohoTokenEndpointSuccess> {
    const url = `${this.accountsBase}/oauth/v2/token`;
    try {
      const res = await firstValueFrom(
        this.http.post<ZohoTokenEndpointSuccess | ZohoTokenEndpointError>(
          url,
          body.toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            validateStatus: () => true,
          },
        ),
      );

      const data = res.data;
      if ('error' in data && data.error) {
        const desc =
          'error_description' in data ? String(data.error_description) : '';
        if (
          String(data.error).includes('scope') ||
          desc.toLowerCase().includes('scope')
        ) {
          throw new ZohoMissingScopeException(
            `Zoho token endpoint: ${data.error}. ${desc}`.trim(),
          );
        }
        throw new ZohoOAuthException(
          `Zoho token error: ${data.error} ${desc}`.trim(),
          String(data.error),
        );
      }

      return data as ZohoTokenEndpointSuccess;
    } catch (e) {
      if (e instanceof ZohoMissingScopeException || e instanceof ZohoOAuthException) {
        throw e;
      }
      throw new ZohoOAuthException(
        `Failed to reach Zoho token endpoint: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private mapTokenResponse(
    data: ZohoTokenEndpointSuccess,
    scopeFallback: string,
  ): ZohoTokenBundle {
    const expiresIn = Number(data.expires_in);
    const expiresAt = Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000;
    const refresh = data.refresh_token;
    if (!refresh) {
      throw new ZohoOAuthException(
        'Zoho did not return refresh_token; ensure access_type=offline and prompt=consent if re-linking.',
      );
    }
    return {
      accessToken: data.access_token,
      refreshToken: refresh,
      expiresAt,
      grantedScope: data.scope ?? scopeFallback,
      apiDomain: data.api_domain,
    };
  }
}
