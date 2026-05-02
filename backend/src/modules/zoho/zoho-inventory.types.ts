/** Raw item shape from Zoho Inventory list/detail (fields vary by item type). */
export interface ZohoInventoryItemRaw {
  item_id?: string | number;
  name?: string;
  sku?: string | null;
  rate?: number | string | null;
  stock_on_hand?: number | string | null;
  /** Product group / “category” in Zoho Inventory */
  group_id?: string | number | null;
  group_name?: string | null;
  category_name?: string | null;
  item_type?: string | null;
  product_type?: string | null;
  description?: string | null;
  /** Present when the item has a catalog image in Zoho (list/detail). */
  image_id?: string | number | null;
  image_name?: string | null;
}

export interface ZohoInventoryItemsListResponse {
  code?: number;
  message?: string;
  items?: ZohoInventoryItemRaw[];
  page_context?: {
    page?: number;
    per_page?: number;
    has_more_page?: boolean;
  };
}

/** GET /items/{item_id} — Zoho wraps the row under `item`. */
export interface ZohoInventoryItemDetailResponse {
  code?: number;
  message?: string;
  item?: ZohoInventoryItemRaw | Record<string, unknown>;
}

/** Raw item group row from `GET /inventory/v1/itemgroups`. */
export interface ZohoInventoryItemGroupRaw {
  group_id?: string | number;
  group_name?: string;
  description?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  status?: string | null;
  image_id?: string | number | null;
  image_name?: string | null;
  product_type?: string | null;
}

export interface ZohoInventoryItemGroupsListResponse {
  code?: number;
  message?: string;
  itemgroups?: ZohoInventoryItemGroupRaw[];
  page_context?: {
    page?: number;
    per_page?: number;
    has_more_page?: boolean;
  };
}

/** Normalized item group used by storefront category APIs. */
export interface ZohoInventoryItemGroupNormalized {
  groupId: string;
  groupName: string;
  description: string;
  brand: string | null;
  manufacturer: string | null;
  status: string | null;
  zohoImageId: string | null;
}

/** Normalized row for sync layer (ZohoService → ProductService). */
export interface ZohoInventoryItemNormalized {
  zohoItemId: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  /** From Zoho group_name / category_name (storefront “category”) */
  category: string;
  /** From item_type / product_type (finer bucket under category) */
  subcategory: string;
  description: string;
  /**
   * Storefront category slugs inferred from the Zoho `description` (and item
   * name) — used as a fallback for routing when Zoho group/category is empty
   * or 'Uncategorized', and as additional matches for static storefront pages.
   * Example: "PIR Motion Sensor Module" → ['sensors'].
   */
  categoryHints: string[];
  /** Zoho `image_id` when returned by the Items API; null if only `image_name` / no id. */
  zohoImageId: string | null;
  /** Additional Zoho image ids discovered from detail/list payload arrays. */
  zohoImageIds: string[];
  /** True when Zoho has a catalog image (image_id or image_name). */
  hasZohoImage: boolean;
}

/**
 * Zoho list payloads often omit top-level `image_id` but still expose an image
 * via `image_name` or nested arrays (`zohoImageIds`). Use this for storefront
 * `zoho_image_id` and for the `image_id` query param when fetching bytes.
 */
export function resolveZohoCatalogImageId(
  item: Pick<ZohoInventoryItemNormalized, 'zohoImageId' | 'zohoImageIds'>,
): string | null {
  const primary = item.zohoImageId?.trim();
  if (primary) return primary;
  for (const x of item.zohoImageIds ?? []) {
    const s = String(x ?? '').trim();
    if (s && /^\d+$/.test(s)) return s;
  }
  return null;
}
