/**
 * Central registry of Zoho Inventory OAuth scopes.
 *
 * Scopes are granted only during the browser consent flow (GET /zoho/login → Zoho → callback).
 * The refresh_token remains valid for the exact scope set the user approved. If you later
 * add new scope constants and call Inventory APIs that require them, Zoho returns
 * insufficient_scope / invalid_scope until the user re-authenticates with a broader preset.
 *
 * Always extend ZOHO_SCOPE_PRESETS (or feature flags) and send users through OAuth again
 * when production features need additional scopes — refreshing tokens cannot widen scope.
 */
export const ZOHO_SCOPES = {
  ITEMS_READ: 'ZohoInventory.items.READ',
  ITEMS_CREATE: 'ZohoInventory.items.CREATE',
  SALESORDERS_CREATE: 'ZohoInventory.salesorders.CREATE',
  INVOICES_CREATE: 'ZohoInventory.invoices.CREATE',
  /** Required for GET /invoices/{id} (verify paid state after recording payment). */
  INVOICES_READ: 'ZohoInventory.invoices.READ',
  /** Required for POST /customerpayments (record payment against invoice after Razorpay). */
  CUSTOMER_PAYMENTS_CREATE: 'ZohoInventory.customerpayments.CREATE',
  CONTACTS_READ: 'ZohoInventory.contacts.READ',
  CONTACTS_CREATE: 'ZohoInventory.contacts.CREATE',
  /** Required for GET /settings/taxes (list taxes for ZOHO_SALES_ORDER_LINE_TAX_ID). */
  SETTINGS_READ: 'ZohoInventory.settings.READ',
} as const;

export type ZohoScopeKey = keyof typeof ZOHO_SCOPES;
export type ZohoScopeConstant = (typeof ZOHO_SCOPES)[ZohoScopeKey];

/** Named bundles aligned with product areas (query param `type` on /zoho/login). */
export type ZohoScopePreset = 'read' | 'order' | 'full';

export const ZOHO_SCOPE_PRESETS: Record<
  ZohoScopePreset,
  readonly ZohoScopeConstant[]
> = {
  read: [ZOHO_SCOPES.ITEMS_READ],
  order: [
    ZOHO_SCOPES.ITEMS_READ,
    ZOHO_SCOPES.CONTACTS_READ,
    ZOHO_SCOPES.CONTACTS_CREATE,
    ZOHO_SCOPES.SALESORDERS_CREATE,
    ZOHO_SCOPES.INVOICES_CREATE,
    ZOHO_SCOPES.INVOICES_READ,
    ZOHO_SCOPES.CUSTOMER_PAYMENTS_CREATE,
    ZOHO_SCOPES.SETTINGS_READ,
  ],
  full: [
    ZOHO_SCOPES.ITEMS_READ,
    ZOHO_SCOPES.ITEMS_CREATE,
    ZOHO_SCOPES.CONTACTS_READ,
    ZOHO_SCOPES.CONTACTS_CREATE,
    ZOHO_SCOPES.SALESORDERS_CREATE,
    ZOHO_SCOPES.INVOICES_CREATE,
    ZOHO_SCOPES.INVOICES_READ,
    ZOHO_SCOPES.CUSTOMER_PAYMENTS_CREATE,
    ZOHO_SCOPES.SETTINGS_READ,
  ],
};

export function resolvePreset(raw: string | undefined): ZohoScopePreset {
  if (raw === 'order' || raw === 'full' || raw === 'read') {
    return raw;
  }
  return 'read';
}

/**
 * Builds the `scope` query parameter for Zoho authorize URL (comma-separated per project standard).
 * Duplicates are removed to keep the consent screen stable.
 */
export function buildScopeString(scopes: Iterable<ZohoScopeConstant>): string {
  return Array.from(new Set(scopes)).join(',');
}

export function buildScopesForPreset(preset: ZohoScopePreset): string {
  return buildScopeString(ZOHO_SCOPE_PRESETS[preset]);
}

/**
 * Alternative to presets: compose scopes from feature flags when routing internal jobs
 * or microservices that only need a subset of capabilities.
 */
export function buildScopesFromFeatures(features: {
  readItems?: boolean;
  createItems?: boolean;
  createSalesOrders?: boolean;
  createInvoices?: boolean;
}): string {
  const out: ZohoScopeConstant[] = [];
  if (features.readItems) out.push(ZOHO_SCOPES.ITEMS_READ);
  if (features.createItems) out.push(ZOHO_SCOPES.ITEMS_CREATE);
  if (features.createSalesOrders) out.push(ZOHO_SCOPES.SALESORDERS_CREATE);
  if (features.createInvoices) out.push(ZOHO_SCOPES.INVOICES_CREATE);
  if (out.length === 0) {
    out.push(ZOHO_SCOPES.ITEMS_READ);
  }
  return buildScopeString(out);
}
