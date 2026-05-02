import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { ZohoService } from '../zoho/zoho.service';
import { ProductsService } from '../../products/products.service';
import {
  CategoryCache,
  CategoryDocument,
} from './category.entity';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductDocument,
} from './product.entity';
import {
  ZohoSyncState,
  ZohoSyncStateDocument,
} from './zoho-sync-state.entity';

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
  /** Stable id for storefront category. */
  id: string;
  /** Display name. */
  name: string;
  /** URL slug used by `/category/[slug]/`. */
  slug: string;
  /** Category description. */
  description: string;
  /** Number of synced storefront products in this category. */
  productCount: number;
  /** Category source row type. */
  source: 'cache';
  /** Category image URL if available. */
  image: string | null;
}

@Injectable()
export class ProductService implements OnModuleInit {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(ZohoSyncedProduct.name)
    private readonly productModel: Model<ZohoSyncedProductDocument>,
    @InjectModel(CategoryCache.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(ZohoSyncState.name)
    private readonly syncStateModel: Model<ZohoSyncStateDocument>,
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
   * Zoho list responses may omit/truncate description; enrich missing ones from
   * GET /items/{item_id}. Capped per sync to control API usage.
   */
  private async enrichMissingDescriptionsFromZohoDetails(
    requestId: string,
    items: {
      zohoItemId: string;
      name: string;
      sku: string | null;
      price: number;
      stock: number;
      category: string;
      subcategory: string;
      description: string;
      categoryHints: string[];
      zohoImageId: string | null;
      zohoImageIds: string[];
      hasZohoImage: boolean;
    }[],
  ): Promise<{
    items: typeof items;
    fetched: number;
    enriched: number;
    failed: number;
    capped: boolean;
  }> {
    const maxRaw = process.env.ZOHO_DETAIL_DESC_MAX_PER_SYNC?.trim();
    const parsed = maxRaw ? Number(maxRaw) : 120;
    const maxLookups =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 120;
    let fetched = 0;
    let enriched = 0;
    let failed = 0;
    let capped = false;
    const out = [...items];
    for (let i = 0; i < out.length; i++) {
      const row = out[i]!;
      if (row.description.trim()) {
        continue;
      }
      if (fetched >= maxLookups) {
        capped = true;
        break;
      }
      fetched += 1;
      try {
        const detail = await this.zoho.fetchNormalizedItemDetail(
          row.zohoItemId,
          'sync',
        );
        const desc = detail?.description?.trim() ?? '';
        if (!desc) {
          continue;
        }
        out[i] = {
          ...row,
          description: desc,
          categoryHints:
            detail?.categoryHints?.length && row.categoryHints.length === 0
              ? detail.categoryHints
              : row.categoryHints,
          category:
            row.category === 'Uncategorized' && detail?.category?.trim()
              ? detail.category.trim()
              : row.category,
          subcategory:
            row.subcategory === 'General' && detail?.subcategory?.trim()
              ? detail.subcategory.trim()
              : row.subcategory,
        };
        enriched += 1;
      } catch (err) {
        failed += 1;
        this.logger.warn(
          `[${requestId}] Description detail fetch failed for item_id=${row.zohoItemId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    return { items: out, fetched, enriched, failed, capped };
  }

  /** Mongo-first category listing for storefront reads (no runtime Zoho calls). */
  async getCategoriesFromZoho(): Promise<ZohoCategoryRow[]> {
    const rows = await this.categoryModel
      .find()
      .sort({ name: 1 })
      .lean()
      .exec();
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.slug,
        name: r.name,
        slug: r.slug,
        description: r.description ?? '',
        productCount: Number(r.product_count ?? 0),
        source: 'cache',
        image: typeof r.image === 'string' ? r.image : null,
      }));
    }

    const slugify = (value: string): string =>
      (value || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized';

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
    for (const [slug, name] of namesBySlug.entries()) {
      out.push({
        id: slug,
        name,
        slug,
        description: '',
        productCount: countsBySlug.get(slug) ?? 0,
        source: 'cache',
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
    forceFull?: boolean;
  }): Promise<ZohoSyncDetailResult> {
    const requestId = context?.requestId ?? `cron-${randomUUID()}`;
    const t0 = Date.now();
    const state = await this.syncStateModel
      .findOne({ key: 'inventory' })
      .lean()
      .exec();
    const now = new Date();
    const lastFull = state?.last_full_sync_at
      ? new Date(state.last_full_sync_at)
      : null;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const fullSyncDue =
      !lastFull || now.getTime() - lastFull.getTime() >= oneDayMs;
    const isFullSync = Boolean(context?.forceFull) || fullSyncDue;
    const incrementalSince =
      !isFullSync && state?.last_incremental_sync_at
        ? new Date(state.last_incremental_sync_at)
        : null;
    await this.syncStateModel
      .updateOne(
        { key: 'inventory' },
        {
          $set: {
            key: 'inventory',
            sync_status: 'running',
            last_error: null,
          },
        },
        { upsert: true },
      )
      .exec();
    this.logger.log(`[${requestId}] Starting Zoho product sync...`);

    try {
      const listItems = await this.zoho.getItemsFromZoho({
        channel: 'sync',
        modifiedSince: incrementalSince,
      });
      const totalFetched = listItems.length;

      if (!totalFetched) {
        const durationMs = Date.now() - t0;
        this.logger.log(
          `[${requestId}] inserted=0 updated=0 skipped=0 (no items from Zoho)`,
        );
        this.logger.log(`[${requestId}] Completed sync in ${durationMs} ms`);
        await this.syncStateModel
          .updateOne(
            { key: 'inventory' },
            {
              $set: {
                sync_status: 'success',
                ...(isFullSync ? { last_full_sync_at: new Date() } : {}),
                last_incremental_sync_at: new Date(),
                last_error: null,
              },
            },
            { upsert: true },
          )
          .exec();
        return {
          success: true,
          totalFetched: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          durationMs,
        };
      }

      const enrichedResult =
        await this.enrichMissingDescriptionsFromZohoDetails(
          requestId,
          listItems,
        );
      const items = enrichedResult.items;
      this.logger.log(
        `[${requestId}] description enrichment fetched=${enrichedResult.fetched} enriched=${enrichedResult.enriched} failed=${enrichedResult.failed} capped=${enrichedResult.capped}`,
      );

      const byId = new Map<string, (typeof listItems)[0]>();
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

      const existingByZohoId = new Map<string, string>();
      if (byId.size > 0) {
        const existing = await this.productModel
          .find({ zoho_item_id: { $in: [...byId.keys()] } })
          .select('zoho_item_id description')
          .lean()
          .exec();
        for (const row of existing) {
          const id = String(row.zoho_item_id ?? '').trim();
          const desc =
            typeof row.description === 'string' ? row.description.trim() : '';
          if (id && desc) existingByZohoId.set(id, desc);
        }
      }

      const bulk = [...byId.values()].map((item) => {
        const zoho_item_id = String(item.zohoItemId).trim();
        const incomingDescription = item.description.trim();
        const description =
          incomingDescription || existingByZohoId.get(zoho_item_id) || '';
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
                description,
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
        await this.syncStateModel
          .updateOne(
            { key: 'inventory' },
            {
              $set: {
                sync_status: 'success',
                ...(isFullSync ? { last_full_sync_at: new Date() } : {}),
                last_incremental_sync_at: new Date(),
                last_error: null,
              },
            },
            { upsert: true },
          )
          .exec();
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
      if (isFullSync && zohoIds.length > 0) {
        const del = await this.productModel.deleteMany({
          zoho_item_id: { $nin: zohoIds },
        });
        removedZohoCache = del.deletedCount ?? 0;
      }
      
      await this.storefrontProducts.upsertZohoImageCache([...byId.values()]);
      const imgStats = await this.storefrontProducts.hydrateZohoImagesFromZoho([
        ...byId.values(),
      ]);
      this.logger.log(
        `[${requestId}] zoho_images hydrate fetched=${imgStats.fetched} skipped=${imgStats.skipped} errors=${imgStats.errors} capped=${imgStats.capped}`,
      );
      const catalog = await this.storefrontProducts.syncCatalogFromZohoItems([
        ...byId.values(),
      ], { pruneMissing: isFullSync });
      await this.refreshCategoriesFromStorefrontSnapshot();

      this.logger.log(
        `[${requestId}] zoho_cache inserted=${inserted} updated=${updated} skipped=${skipped} removed=${removedZohoCache}`,
      );
      this.logger.log(
        `[${requestId}] storefront catalog upserted=${catalog.catalogUpserted} modified=${catalog.catalogModified} removed=${catalog.catalogRemoved}`,
      );

      await this.storefrontProducts.logProductsWithoutZohoId();

      const durationMs = Date.now() - t0;
      this.logger.log(`[${requestId}] Completed sync in ${durationMs} ms`);
      await this.syncStateModel
        .updateOne(
          { key: 'inventory' },
          {
            $set: {
              sync_status: 'success',
              ...(isFullSync ? { last_full_sync_at: new Date() } : {}),
              last_incremental_sync_at: new Date(),
              last_successful_page: 1,
              last_error: null,
            },
          },
          { upsert: true },
        )
        .exec();

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
      await this.syncStateModel
        .updateOne(
          { key: 'inventory' },
          {
            $set: {
              sync_status: 'failed',
              last_error: details,
            },
          },
          { upsert: true },
        )
        .exec();
      return {
        success: false,
        totalFetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        durationMs,
        details,
      };
    } finally {
      await this.syncStateModel
        .updateOne(
          { key: 'inventory' },
          {
            $setOnInsert: { key: 'inventory' },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  private async refreshCategoriesFromStorefrontSnapshot(): Promise<void> {
    const rows = await this.storefrontProducts.findAll();
    const bySlug = new Map<
      string,
      { name: string; count: number; image: string | null }
    >();
    const slugify = (value: string): string =>
      (value || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized';

    for (const row of rows) {
      const name = String(row.category ?? '').trim() || 'Uncategorized';
      const slug = slugify(name);
      const existing = bySlug.get(slug);
      const firstImage =
        Array.isArray(row.images) &&
        row.images.find((x) => typeof x === 'string' && x.trim()) != null
          ? String(
              row.images.find((x) => typeof x === 'string' && x.trim()),
            ).trim()
          : null;
      if (!existing) {
        bySlug.set(slug, { name, count: 1, image: firstImage });
        continue;
      }
      existing.count += 1;
      if (!existing.image && firstImage) {
        existing.image = firstImage;
      }
    }

    const now = new Date();
    const bulk = [...bySlug.entries()].map(([slug, payload]) => ({
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            slug,
            name: payload.name,
            description: '',
            image: payload.image,
            product_count: payload.count,
            source: 'mongo',
            last_synced_at: now,
          },
        },
        upsert: true,
      },
    }));
    if (bulk.length > 0) {
      await this.categoryModel.bulkWrite(bulk, { ordered: false });
    }
    await this.categoryModel.deleteMany({
      slug: { $nin: [...bySlug.keys()] },
    });
  }

  /**
   * Hourly Zoho → Mongo inventory pull. Storefront catalog reads stay Mongo-only.
   * Incremental watermark: `last_incremental_sync_at`. Full snapshot + prune when
   * `last_full_sync_at` is ≥ 24h old (see `syncProductsFromZoho`).
   * Same data path as POST /api/zoho/products/sync.
   */
  @Cron('0 * * * *')
  async scheduledHourlyZohoInventoryPull(): Promise<void> {
    await this.syncProductsFromZoho({
      requestId: `hourly-${randomUUID()}`,
      forceFull: false,
    });
  }
}
