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
      for (const item of items) {
        const id = item.zohoItemId?.trim();
        if (!id) continue;
        byId.set(id, item);
      }

      const bulk = [...byId.values()].map((item) => {
        const zoho_item_id = item.zohoItemId.trim();
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
