import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { ZohoService } from '../zoho/zoho.service';
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
  /** Raw error text for HTTP layer to classify */
  details?: string;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(ZohoSyncedProduct.name)
    private readonly productModel: Model<ZohoSyncedProductDocument>,
    private readonly zoho: ZohoService,
  ) {}

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

      const bulk = items.map((item) => ({
        updateOne: {
          filter: { zoho_item_id: item.zohoItemId },
          update: {
            $set: {
              name: item.name,
              sku: item.sku,
              price: item.price,
              stock: item.stock,
            },
          },
          upsert: true,
        },
      }));

      const result = await this.productModel.bulkWrite(bulk, {
        ordered: false,
      });

      const inserted = result.upsertedCount;
      const updated = result.modifiedCount;
      const skipped = Math.max(0, result.matchedCount - result.modifiedCount);

      this.logger.log(
        `[${requestId}] inserted=${inserted} updated=${updated} skipped=${skipped}`,
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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledZohoSync(): Promise<void> {
    await this.syncProductsFromZoho();
  }
}
