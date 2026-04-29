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
  /** Zoho `image_id` when returned by the Items API; null if only `image_name` / no id. */
  zohoImageId: string | null;
  /** True when Zoho has a catalog image (image_id or image_name). */
  hasZohoImage: boolean;
}
