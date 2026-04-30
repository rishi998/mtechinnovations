import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, Timeout } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { ZohoService } from '../zoho/zoho.service';
import { ProductsService } from '../../products/products.service';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductDocument,
} from './product.entity';

export interface ZohoSyncDetailResult {
  success: boolean;
  totalFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  durationMs: number;
  /** Zoho cache rows removed (no longer returned by Inventory) */
  removedZohoCache?: number;
  /** Storefront `products` collection — upserts from same snapshot */
  catalogUpserted?: number;
  catalogModified?: number;
  /** Storefront rows with zoho_item_id removed (delisted in Zoho) */
  catalogRemoved?: number;
  /** Raw error text for HTTP layer to classify */
  details?: string;
}

/**
 * Public-facing category row (storefront `/api/zoho/categories`).
 * Merges Zoho item groups (canonical "categories") with the unique categories
 * already pulled into Mongo by sync, so the storefront can render every group
 * even if no item has been synced into it yet.
 */
export interface ZohoCategoryRow {
  /** Stable id (Zoho `group_id` when from `/itemgroups`, slug otherwise). */
  id: string;
  /** Display name (Zoho `group_name`). */
  name: string;
  /** URL slug used by `/category/[slug]/`. */
  slug: string;
  /** Zoho item-group description (may be empty). */
  description: string;
  /** Number of synced storefront products in this category. */
  productCount: number;
  /** `'group'` when sourced from `/itemgroups`, `'item'` when only inferred from items. */
  source: 'group' | 'item';
  /** Storefront image URL when Zoho exposes a group image, else null. */
  image: string | null;
}

@Injectable()
export class ProductService implements OnModuleInit {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(ZohoSyncedProduct.name)
    private readonly productModel: Model<ZohoSyncedProductDocument>,
    private readonly zoho: ZohoService,
    private readonly storefrontProducts: ProductsService,
  ) {}

  /**
   * Drops Mongo indexes that are not declared on the schema (e.g. legacy
   * `zohoItemId` unique index). Those caused E11000 duplicate key on null when
   * documents only stored `zoho_item_id`.
   */
  async onModuleInit(): Promise<void> {
    try {
      const coll = this.productModel.collection;
      for (const legacy of ['zohoItemId_1', 'zohoItemId']) {
        try {
          await coll.dropIndex(legacy);
          this.logger.log(
            `Dropped legacy index "${legacy}" on zoho_inventory_products`,
          );
        } catch {
          // index absent or non-default name
        }
      }
      await this.productModel.syncIndexes();
      this.logger.log('ZohoSyncedProduct collection indexes synced');
    } catch (err) {
      this.logger.warn(
        `ZohoSyncedProduct index maintenance failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getAllProducts(limit?: number): Promise<Record<string, unknown>[]> {
    let q = this.productModel.find().sort({ updatedAt: -1 });
    if (limit != null && limit > 0) {
      q = q.limit(limit);
    }
    const docs = await q.exec();
    return docs.map((d) => d.toJSON() as Record<string, unknown>);
  }

  /**
   * Live Zoho categories for the storefront.
   *
   * Strategy:
   *  - Hit Zoho `/itemgroups` for the canonical category list (groups with
   *    description, image, etc.).
   *  - Aggregate counts from the local `zoho_inventory_products` cache so the
   *    storefront can show "N products" without hitting Zoho per group.
   *  - Add any item-derived categories that Zoho returned via `category_name`
   *    on items but not as item-groups (so nothing is hidden from the UI).
   */
  async getCategoriesFromZoho(): Promise<ZohoCategoryRow[]> {
    const slugify = (value: string): string =>
      (value || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized';

    let groups: Awaited<ReturnType<typeof this.zoho.listItemGroups>> = [];
    try {
      groups = await this.zoho.listItemGroups();
    } catch (err) {
      this.logger.warn(
        `Zoho /itemgroups call failed; falling back to product-derived categories: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const cached = await this.productModel.find().lean().exec();
    const countsBySlug = new Map<string, number>();
    const namesBySlug = new Map<string, string>();
    for (const row of cached) {
      const r = row as unknown as { category?: string };
      const name = (r.category ?? '').trim() || 'Uncategorized';
      const slug = slugify(name);
      countsBySlug.set(slug, (countsBySlug.get(slug) ?? 0) + 1);
      if (!namesBySlug.has(slug)) {
        namesBySlug.set(slug, name);
      }
    }

    const out: ZohoCategoryRow[] = [];
    const seenSlugs = new Set<string>();

    for (const g of groups) {
      const slug = slugify(g.groupName);
      if (seenSlugs.has(slug)) {
        continue;
      }
      seenSlugs.add(slug);
      const image = g.zohoImageId
        ? `/api/zoho/items/${encodeURIComponent(g.groupId)}/image?image_id=${encodeURIComponent(g.zohoImageId)}`
        : null;
      out.push({
        id: g.groupId,
        name: g.groupName,
        slug,
        description: g.description,
        productCount: countsBySlug.get(slug) ?? 0,
        source: 'group',
        image,
      });
    }

    for (const [slug, name] of namesBySlug.entries()) {
      if (seenSlugs.has(slug)) {
        continue;
      }
      seenSlugs.add(slug);
      out.push({
        id: slug,
        name,
        slug,
        description: '',
        productCount: countsBySlug.get(slug) ?? 0,
        source: 'item',
        image: null,
      });
    }

    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Pulls items from Zoho and upserts by zoho_item_id.
   * On Zoho/DB errors returns success: false without throwing (cron-safe).
   */
  async syncProductsFromZoho(context?: {
    requestId?: string;
  }): Promise<ZohoSyncDetailResult> {
    const requestId = context?.requestId ?? `cron-${randomUUID()}`;
    const t0 = Date.now();
    this.logger.log(`[${requestId}] Starting Zoho product sync...`);

    try {
      const items = await this.zoho.getItemsFromZoho();
      const totalFetched = items.length;

      if (!totalFetched) {
        const durationMs = Date.now() - t0;
        this.logger.log(
          `[${requestId}] inserted=0 updated=0 skipped=0 (no items from Zoho)`,
        );
        this.logger.log(`[${requestId}] Completed sync in ${durationMs} ms`);
        return {
          success: true,
          totalFetched: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          durationMs,
        };
      }

      const byId = new Map<string, (typeof items)[0]>();
      let skippedNoItemId = 0;
      for (const item of items) {
        const raw = item.zohoItemId?.trim();
        if (!raw) {
          skippedNoItemId += 1;
          this.logger.warn(
            `[${requestId}] Skipped Zoho item without item_id: name=${item.name ?? 'unknown'}`,
          );
          continue;
        }
        const zoho_item_id = String(raw);
        this.logger.debug(`Synced Zoho item_id: ${zoho_item_id}`);
        byId.set(zoho_item_id, { ...item, zohoItemId: zoho_item_id });
      }

      if (skippedNoItemId > 0) {
        this.logger.warn(
          `[${requestId}] Skipped ${skippedNoItemId} Zoho row(s) missing item_id`,
        );
      }

      this.logger.log(
        `[${requestId}] ${byId.size} Zoho item row(s) have valid item_id after de-duplication`,
      );
      if (byId.size > 0) {
        const sample = [...byId.keys()].slice(0, 10);
        this.logger.log(
          `[${requestId}] Sample Synced Zoho item_id: ${sample.join(', ')}${byId.size > 10 ? ' …' : ''}`,
        );
      }

      const bulk = [...byId.values()].map((item) => {
        const zoho_item_id = String(item.zohoItemId).trim();
        return {
          updateOne: {
            filter: { zoho_item_id },
            update: {
              $set: {
                zoho_item_id,
                name: item.name,
                sku: item.sku,
                price: item.price,
                stock: item.stock,
                category: item.category,
                subcategory: item.subcategory,
                description: item.description,
                category_hints: item.categoryHints,
              },
            },
            upsert: true,
          },
        };
      });

      if (!bulk.length) {
        const durationMs = Date.now() - t0;
        this.logger.log(
          `[${requestId}] inserted=0 updated=0 skipped=0 (no items with valid Zoho id)`,
        );
        return {
          success: true,
          totalFetched,
          inserted: 0,
          updated: 0,
          skipped: 0,
          durationMs,
        };
      }

      const result = await this.productModel.bulkWrite(bulk, {
        ordered: false,
      });

      const inserted = result.upsertedCount;
      const updated = result.modifiedCount;
      const skipped = Math.max(0, result.matchedCount - result.modifiedCount);

      const zohoIds = [...byId.keys()];
      let removedZohoCache = 0;
      if (zohoIds.length > 0) {
        const del = await this.productModel.deleteMany({
          zoho_item_id: { $nin: zohoIds },
        });
        removedZohoCache = del.deletedCount ?? 0;
      }

      const catalog = await this.storefrontProducts.syncCatalogFromZohoItems([
        ...byId.values(),
      ]);

      this.logger.log(
        `[${requestId}] zoho_cache inserted=${inserted} updated=${updated} skipped=${skipped} removed=${removedZohoCache}`,
      );
      this.logger.log(
        `[${requestId}] storefront catalog upserted=${catalog.catalogUpserted} modified=${catalog.catalogModified} removed=${catalog.catalogRemoved}`,
      );

      await this.storefrontProducts.logProductsWithoutZohoId();

      const durationMs = Date.now() - t0;
      this.logger.log(`[${requestId}] Completed sync in ${durationMs} ms`);

      return {
        success: true,
        totalFetched,
        inserted,
        updated,
        skipped,
        durationMs,
        removedZohoCache,
        catalogUpserted: catalog.catalogUpserted,
        catalogModified: catalog.catalogModified,
        catalogRemoved: catalog.catalogRemoved,
      };
    } catch (err) {
      const durationMs = Date.now() - t0;
      const details = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[${requestId}] Zoho product sync failed after ${durationMs} ms: ${details}`,
        err instanceof Error ? err.stack : undefined,
      );
      return {
        success: false,
        totalFetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        durationMs,
        details,
      };
    }
  }

  /**
   * Pull Zoho Inventory items and upsert `zoho_inventory_products` (+ storefront catalog).
   * Twice daily at 09:00 and 17:00 (process timezone; set `TZ` in production if needed).
   * Same data path as POST /api/zoho/products/sync.
   */
  @Cron('0 9,17 * * *')
  async scheduledZohoInventoryPull(): Promise<void> {
    await this.syncProductsFromZoho({
      requestId: `interval-${randomUUID()}`,
    });
  }

  /** First sync soon after startup so DB is not empty until the first interval. */
  @Timeout(60_000)
  async zohoSyncOneMinuteAfterBoot(): Promise<void> {
    await this.syncProductsFromZoho({
      requestId: `boot-${randomUUID()}`,
    });
  }
}
