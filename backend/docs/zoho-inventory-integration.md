# Zoho Inventory — Backend Integration Reference

This document describes how **Zoho Inventory** entities map to API calls and MongoDB collections in this project, and how the main workflows (OAuth, catalog sync, checkout/invoicing) execute end to end.

**Primary code locations**

| Area | Location |
|------|-----------|
| HTTP client, Inventory REST calls | `backend/src/modules/zoho/zoho.service.ts` |
| Gmail-style invoice lifecycle (GST, verify paid, email) | `backend/src/modules/zoho/services/zohoInvoiceService.ts` |
| OAuth scopes / presets | `backend/src/modules/zoho/zoho.config.ts` |
| Typed payloads (items, line items) | `backend/src/modules/zoho/zoho-inventory.types.ts`, `zoho-inventory-salesorder.types.ts` |
| Catalog pull & hourly cron | `backend/src/modules/product/product.service.ts` |
| Catalog HTTP routes | `backend/src/modules/product/product.controller.ts` |
| Post–Razorpay Zoho pipeline & retry queue | `backend/src/razorpay/razorpay-payment.service.ts`, `zoho-order-queue.service.ts` |
| Standalone “push order to Zoho” (admin-style) | `backend/src/modules/order/order.service.ts`, `order.controller.ts` |

---

## 1. Base URL, auth, and scopes

- **Inventory API base**: `https://{api-domain}/inventory/v1` (domain comes from the OAuth token response and is cached in `ZohoService`).
- **Authorization**: `Authorization: Zoho-oauthtoken <access_token>` on every Inventory request (`requestInventory`).
- **Organization**: almost every call appends `organization_id` matching `ZOHO_ORGANIZATION_ID` (see `getInventoryOrganizationId()` in debug responses).
- **OAuth flow** (browser): `GET /api/zoho/login?type=read|order|full` → Zoho consent → `GET /api/zoho/callback?code=…` → tokens persisted via `ZohoTokenPersistence` (Mongo).
- **Scopes** are defined in `zoho.config.ts`. Important ones for Inventory:
  - **Items**: `ZohoInventory.items.READ` (and `CREATE` for `full` preset)
  - **Contacts**: `CONTACTS_READ`, `CONTACTS_CREATE`
  - **Sales orders**: `SALESORDERS_CREATE`
  - **Invoices**: `INVOICES_CREATE`, `INVOICES_READ`
  - **Payments**: `CUSTOMER_PAYMENTS_CREATE`
  - **Taxes**: `SETTINGS_READ` (`GET /settings/taxes`)

Preset **`order`** bundles everything needed for Razorpay checkout → sales order → invoice → payment → email, plus item read and tax list.

---

## 2. API usage channels and budgets

- **`sync` channel**: catalog sync, debug listing, item detail enrichment, image hydration during sync.
- **`order` channel**: sales orders, invoices, customer resolution, post-payment lifecycle.

`ZohoApiBudgetService` tracks daily call counts per channel and a total cap (`zoho_api_usage` collection). Env knobs include `ZOHO_BUDGET_SYNC`, `ZOHO_BUDGET_ORDER`, `ZOHO_DAILY_CALL_BUDGET`.

---

## 3. Zoho Inventory entities → implementation

### 3.1 Items (`/items`)

**Zoho concept**: sellable SKUs with `item_id`, pricing, stock, group/category fields, optional images.

**API usage**

| Operation | Method | Notes |
|-----------|--------|--------|
| List / sync | `GET /items` | Paginated; optional `last_modified_time` for incremental sync |
| Detail | `GET /items/{item_id}` | Descriptions/images when list is incomplete |
| Item image bytes | `GET …/items/{id}/image` | Used during sync hydration into Mongo (`fetchItemImageBuffer`) |

**Normalization**: raw Zoho rows → `ZohoInventoryItemNormalized` (`zoho-inventory.types.ts`): `zohoItemId`, `name`, `sku`, `price`, `stock`, `category`, `subcategory`, `description`, `categoryHints`, image flags/ids.

**Mongo**

- **`zoho_inventory_products`** (`ZohoSyncedProduct`): cache of synced items; unique key `zoho_item_id`.
- **Storefront `products`**: upserted from the same snapshot (`ProductsService.syncCatalogFromZohoItems`); **`zoho_item_id`** is required for checkout line mapping to Zoho.

**Runtime rule**: storefront reads are **Mongo-first**; listing products for shoppers does not call Zoho per request.

---

### 3.2 Item groups (`/itemgroups`)

**Zoho concept**: product groups (often used like top-level categories).

**API**: `ZohoService.listItemGroups()` → `GET /itemgroups` (paginated).

**Backend note**: the method exists for normalized group data. Category listing for `GET /api/zoho/products/categories` is driven by **Mongo** (`CategoryCache` rebuilt from storefront products after sync), not a live `/itemgroups` call on every request.

---

### 3.3 Contacts (`/contacts`)

**Zoho concept**: customers (`contact_id`), looked up or created by email.

**API**

- List/search: `GET /contacts?…`
- Create: `POST /contacts`

**Implementation**: `ZohoService.ensureCustomerContact(name, email, channel)` — resolves an existing contact or creates one; returns numeric **`customer_id` / `contact_id`** string used on sales orders and invoices.

**Checkout path**: `RazorpayPaymentService.runZohoSync` uses shipping name + **user account email** (`UsersService`) for the Zoho customer.

---

### 3.4 Sales orders (`/salesorders`)

**Zoho concept**: order header + line items referencing **`item_id`**, quantities, rates.

**API**

| Step | Call |
|------|------|
| Create | `POST /salesorders` |
| Fetch (optional) | `GET /salesorders/{id}` — used when confirming if already `confirmed` |
| Confirm | `POST /salesorders/{id}/status/confirmed` |

**Line item shape** (`ZohoCreateSalesOrderLineItem`): `item_id`, `name`, `quantity`, `rate`, `unit`, optional `tax_id`.

**Implementation details**

- `ZohoService.createSalesOrder` applies **`resolveInventoryLineItemsTax`** unless invoice path passes pre-resolved taxes (`ZohoInvoiceService` uses **`line_items_have_final_tax_ids`** on `createInvoice`).
- **Storefront paid order flow** (`RazorpayPaymentService`): after payment success, **`runZohoSync`** builds lines from `orders` + `products.zoho_item_id`, creates **one sales order**, then hands off to `ZohoInvoiceService.runPaidInvoiceLifecycle` (which confirms the SO when possible).
- **Legacy / admin API** (`POST /api/zoho/orders`): `OrderService.createOrder` inserts `ZohoSalesOrderRecord` with `PENDING`; **`processPendingSalesOrders`** cron (every 10 minutes) pushes to Zoho — **separate** from the main storefront `Order` collection.

---

### 3.5 Invoices (`/invoices`)

**Zoho concept**: bill with same style of **`line_items`** as sales orders; supports India **place of supply**.

**API**

| Step | Call |
|------|------|
| Create | `POST /invoices` |
| Mark sent | `POST /invoices/{id}/status/sent` |
| Fetch / verify | `GET /invoices/{id}` |
| Email | `POST /invoices/{id}/email` |

**GST / tax resolution** (`ZohoInvoiceService`)

- **`resolveMandatoryTaxId`**: prefers `ZOHO_GST_LINE_TAX_ID_INTRA` / `ZOHO_GST_LINE_TAX_ID_INTER` based on org vs shipping state (`ZOHO_ORG_REGISTERED_STATE` / `ZOHO_ORG_STATE`), else `ZOHO_SALES_ORDER_LINE_TAX_ID`, else default from `listInventoryTaxes()`.
- **`placeOfSupplyFromOrderShipment`**: Indian state code via `resolveIndiaPlaceOfSupplyCode` or override `ZOHO_INVOICE_PLACE_OF_SUPPLY`.
- Invoice payload uses **`line_items_have_final_tax_ids: true`** so each line includes the resolved `tax_id`.

**Lifecycle** (`runPaidInvoiceLifecycle`): validate items active → confirm SO → **create invoice** → **mark sent** → **record customer payment** → **poll until paid** (`verifyInvoicePaid`) → **persist IDs on Order** → structured log → **email invoice** to customer.

---

### 3.6 Customer payments (`/customerpayments`)

**Zoho concept**: payment recorded against an invoice / customer.

**API**: `POST /customerpayments` via `ZohoService.recordCustomerPayment`.

**Implementation**: After Razorpay captures funds, the backend records a Zoho payment with **`payment_mode`** `'Razorpay'` and amount capped by invoice due vs capture amount. Returned **`payment_id`** is stored on the storefront order when available.

---

### 3.7 Taxes / settings (`/settings/taxes`)

**Zoho concept**: organization tax definitions (`tax_id`, percentage, default flags).

**API**: `GET /settings/taxes` → `ZohoService.listInventoryTaxes`.

**Usage**: tax picker for line items; debug route `GET /api/zoho/debug/taxes`. Wrong or missing scope shows up as errors until user re-authenticates with **`order`** or **`full`** preset.

---

## 4. Mongo collections (Zoho-related)

| Collection / model | Role |
|--------------------|------|
| `zoho_oauth_tokens` (via `ZohoTokenState`) | Refresh / access token persistence |
| `zoho_api_usage` | Per-day API call counters (`sync` / `order`) |
| `zoho_inventory_products` | Synced item cache (`ZohoSyncedProduct`) |
| `zoho_images_cache` | Image binary / URL metadata keyed by `zoho_item_id` |
| `products` | Storefront catalog with `zoho_item_id`, `zoho_image_id` |
| `categories` (`CategoryCache` entity) | Category slugs/names/counts derived after sync |
| `zoho_sync_state` | Watermarks: `last_full_sync_at`, `last_incremental_sync_at`, sync status |
| `orders` (storefront) | `zoho_salesorder_id`, `zoho_invoice_id`, `zoho_payment_id`, `zoho_sync_status`, `zoho_sync_last_error` |
| `zoho_orders` | Retry queue for failed Zoho sync after Razorpay |
| `zoho_sales_orders` | Legacy `ZohoSalesOrderRecord` queue for `/api/zoho/orders` |

---

## 5. End-to-end workflows

### 5.1 Catalog sync (hourly + manual)

1. **Trigger**: `@Cron('0 * * * *')` (`scheduledHourlyZohoInventoryPull`) or **`POST /api/zoho/products/sync?forceFull=true`**.
2. **Incremental vs full**: `ProductService.syncProductsFromZoho` uses `ZohoSyncState` — full resync + prune when last full sync ≥ 24h; otherwise uses `last_modified_time` on `GET /items`.
3. **Enrichment**: optional `GET /items/{id}` for missing descriptions (cap: `ZOHO_DETAIL_DESC_MAX_PER_SYNC`).
4. **Persist**: bulk upsert `zoho_inventory_products`; update `zoho_images_cache` and **`hydrateZohoImagesFromZoho`** (cap `ZOHO_IMAGE_FETCH_MAX_PER_SYNC`); **`syncCatalogFromZohoItems`** updates storefront **`products`**; **`refreshCategoriesFromStorefrontSnapshot`** rebuilds **`CategoryCache`**.

Storefront **`GET /api/products`** reads Mongo only.

### 5.2 Storefront checkout → Zoho (Razorpay)

1. User pays via Razorpay; payment verified / webhook flows mark **`orders.payment_status = success`**.
2. **`runPostPaymentZohoSync(orderMongoId)`** runs asynchronously (duplicate guarded by `zohoInvoiceSyncInFlight`).
3. **`runZohoSync`**:
   - Builds line items via **`resolveZohoLineItemsForPaidOrder`** (map `products.zoho_item_id`, add shipping line **`ZOHO_SHIPPING_ITEM_ID`**, optional **`ZOHO_FALLBACK_LINE_ITEM_ID`** if mapping fails).
   - On Zoho **inactive item** errors, retries with **`buildFallbackOnlyLineItemsForInactiveZohoItems`** (single line using fallback item + order total).
   - **`ensureCustomerContact`** → **`createSalesOrder`** → **`ZohoInvoiceService.runPaidInvoiceLifecycle`**.
4. **Persistence**: `OrdersService.updateZohoSyncForOrder` sets IDs and `zoho_sync_status: 'synced'`.
5. **Failure**: `ZohoOrderQueueService.enqueuePending`; **`retryPendingZohoSyncs`** cron every 10 minutes processes `zoho_orders` with exponential backoff (max 12 retries → `failed`).

**Manual retry (JWT)**: `POST /api/zoho/create-invoice` → `syncZohoForPaidOrder` (same pipeline, idempotent if already synced).

### 5.3 Standalone Zoho sales orders API

- **`POST /api/zoho/orders`**: validates storefront `productId` + **`zoho_item_id`**, writes **`ZohoSalesOrderRecord`** (`PENDING`), returns immediately.
- **`processPendingSalesOrders`** (cron `*/10 * * * *`): for each pending record, **`ensureCustomerContact`** + **`createSalesOrder`**, updates to **`SYNCED`** or **`FAILED`**. This path **does not** create Zoho invoices or payments.

---

## 6. HTTP routes (Zoho-related, global prefix `api`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/zoho/login` | OAuth start |
| GET | `/zoho/callback` | OAuth code exchange |
| GET | `/zoho/items/:itemId/image` | Legacy redirect (no live Zoho image fetch in request path) |
| GET | `/zoho/products` | List cached Zoho-synced products |
| GET | `/zoho/products/categories` | Categories from Mongo cache |
| POST | `/zoho/products/sync` | Run sync (optional `forceFull`) |
| POST | `/zoho/orders` | Queue legacy sales order |
| GET | `/zoho/orders` | List legacy sales order records |
| POST | `/zoho/create-invoice` | JWT: retry Zoho for paid storefront order |
| GET/POST | `/zoho/debug/*` | Token probe, items sample, taxes, usage, reset token |

---

## 7. Environment variables (operational checklist)

Exact names live in `.env`; commonly referenced in code:

- **OAuth / org**: client id/secret, redirect URI, **`ZOHO_ORGANIZATION_ID`**, data-center–aware Accounts URL handling in `ZohoService`.
- **Tax / GST**: `ZOHO_GST_LINE_TAX_ID_INTRA`, `ZOHO_GST_LINE_TAX_ID_INTER`, `ZOHO_SALES_ORDER_LINE_TAX_ID`, `ZOHO_ORG_REGISTERED_STATE` / `ZOHO_ORG_STATE`, `ZOHO_INVOICE_PLACE_OF_SUPPLY`.
- **Line item fallbacks**: `ZOHO_FALLBACK_LINE_ITEM_ID`, `ZOHO_SHIPPING_ITEM_ID`.
- **Invoice verification**: `ZOHO_INVOICE_VERIFY_RETRIES`, `ZOHO_INVOICE_VERIFY_DELAY_MS`.
- **Sync caps**: `ZOHO_IMAGE_FETCH_MAX_PER_SYNC`, `ZOHO_DETAIL_DESC_MAX_PER_SYNC`, `ZOHO_BUDGET_*`, `ZOHO_DAILY_CALL_BUDGET`.
- **Incremental sync timezone**: `ZOHO_INVENTORY_LAST_MODIFIED_TZ` (default `Asia/Kolkata`).

---

## 8. Type reference (quick)

- **`ZohoInventoryItemNormalized`**: canonical item after list/detail normalization.
- **`ZohoCreateSalesOrderLineItem`**: payload line for **both** sales orders and invoices in this codebase (plus `tax_id` when required).
- **`ZohoPaidInvoiceLifecycleInput` / `Result`**: inputs/outputs for the paid invoice pipeline in `ZohoInvoiceService`.

---

*Generated from codebase analysis; align with Zoho’s official Inventory v1 docs if their API diverges.*
