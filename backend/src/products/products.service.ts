import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ZohoInventoryItemNormalized } from '../modules/zoho/zoho-inventory.types';
import { ZohoService } from '../modules/zoho/zoho.service';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ZohoImageCache,
  ZohoImageCacheDocument,
} from './schemas/zoho-image-cache.schema';

/** Only treat 24-char hex strings as Mongo ObjectIds (avoids e.g. `"3"` or slugs). */
function isMongoObjectIdString(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

/** Stable URL slug for Zoho-backed storefront rows (includes Zoho id to avoid collisions). */
export function slugifyZohoStorefrontProduct(
  name: string,
  zohoItemId: string,
  sku: string | null,
): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  const safeSku =
    sku && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(sku)
      ? sku.toLowerCase().slice(0, 30)
      : '';
  const z = `z-${zohoItemId}`;
  const combined = safeSku ? `${base}-${safeSku}-${z}` : `${base}-${z}`;
  return combined.slice(0, 120);
}

export interface ZohoCatalogSyncStats {
  catalogUpserted: number;
  catalogModified: number;
  catalogRemoved: number;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  static readonly FALLBACK_IMAGE_URL =
    'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800';

  /** Skip storing blobs larger than this (Mongo 16 MB doc limit; keep headroom). */
  private static readonly MAX_IMAGE_BYTES = 2 * 1024 * 1024;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ZohoImageCache.name)
    private readonly imageCacheModel: Model<ZohoImageCacheDocument>,
    private readonly zoho: ZohoService,
  ) {}

  /** Storefront rows with missing / empty `zoho_item_id` (manual catalog or sync gap). */
  async getProductsWithoutZohoId(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        $or: [
          { zoho_item_id: null },
          { zoho_item_id: { $exists: false } },
          { zoho_item_id: '' },
        ],
      })
      .exec();
  }

  /** Logs how many storefront products lack `zoho_item_id`. Returns that count. */
  async logProductsWithoutZohoId(): Promise<number> {
    const n = await this.productModel.countDocuments({
      $or: [
        { zoho_item_id: null },
        { zoho_item_id: { $exists: false } },
        { zoho_item_id: '' },
      ],
    });
    if (n > 0) {
      this.logger.warn(
        `Storefront products without zoho_item_id: count=${n} (sync Zoho or set ids before invoicing)`,
      );
    } else {
      this.logger.log('Storefront products without zoho_item_id: count=0');
    }
    return n;
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const product = new this.productModel(dto);
    return product.save();
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Lookup by Mongo `_id`, Zoho `zoho_item_id`, or `slug`.
   */
  async findOne(idOrSlug: string): Promise<ProductDocument> {
    if (isMongoObjectIdString(idOrSlug)) {
      const product = await this.productModel.findById(idOrSlug).exec();
      if (!product) {
        throw new NotFoundException(`Product with id ${idOrSlug} not found`);
      }
      return product;
    }
    const trimmed = idOrSlug.trim();
    if (/^\d{5,}$/.test(trimmed)) {
      const byZoho = await this.productModel
        .findOne({ zoho_item_id: trimmed })
        .exec();
      if (byZoho) {
        return byZoho;
      }
    }
    return this.findBySlug(idOrSlug);
  }

  /**
   * Mongo-first product lookup for storefront reads.
   * Zoho calls are intentionally avoided in user request flow.
   */
  async findOneWithCachedDescription(idOrSlug: string): Promise<ProductDocument> {
    return this.findOne(idOrSlug);
  }

  /**
   * Upsert storefront `products` from a Zoho sync snapshot and remove rows tied to
   * Zoho ids that no longer exist in that snapshot. Rows without `zoho_item_id`
   * (e.g. hand-seeded catalog) are left unchanged.
   */
  async syncCatalogFromZohoItems(
    items: ZohoInventoryItemNormalized[],
    options?: { pruneMissing?: boolean },
  ): Promise<ZohoCatalogSyncStats> {
    const pruneMissing = options?.pruneMissing ?? true;
    const byId = new Map<string, ZohoInventoryItemNormalized>();
    for (const item of items) {
      const raw = item.zohoItemId?.trim();
      if (!raw) {
        this.logger.warn(
          `syncCatalogFromZohoItems: skipped item without Zoho item_id name=${item.name ?? 'unknown'}`,
        );
        continue;
      }
      const id = String(raw);
      byId.set(id, { ...item, zohoItemId: id });
    }
    const uniqueIds = [...byId.keys()];
    if (!uniqueIds.length) {
      return { catalogUpserted: 0, catalogModified: 0, catalogRemoved: 0 };
    }

    const imageCacheRows = await this.imageCacheModel.find({
      zoho_item_id: { $in: uniqueIds },
    }).lean().exec();
    const imageByZohoId = new Map<string, string>();
    for (const row of imageCacheRows) {
      const id = String(row.zoho_item_id ?? '').trim();
      const url = String(row.image_url ?? '').trim();
      if (id && url) imageByZohoId.set(id, url);
    }

    const bulk = [...byId.values()].map((item) => {
      const zoho_item_id = String(item.zohoItemId).trim();
      const slug = slugifyZohoStorefrontProduct(item.name, zoho_item_id, item.sku);
      const brand =
        item.category === 'Uncategorized'
          ? 'Zoho'
          : item.category.split(/[\/|]/)[0]?.trim() || 'Zoho';
      const cached = imageByZohoId.get(zoho_item_id);
      const images = cached
        ? [cached]
        : [ProductsService.FALLBACK_IMAGE_URL];
      const setFields: Record<string, unknown> = {
        zoho_item_id,
        zoho_image_id: item.zohoImageId,
        name: item.name,
        sku: item.sku,
        category: item.category,
        subcategory: item.subcategory,
        price: item.price,
        stock: item.stock,
        description: item.description,
        category_hints: item.categoryHints,
        brand,
        images,
      };
      return {
        updateOne: {
          filter: { zoho_item_id },
          update: {
            $set: setFields,
            /**
             * $setOnInsert runs only when the document is first created (upsert INSERT path).
             * IMPORTANT: do NOT repeat any key that is already in $set — MongoDB will throw
             * a write conflict and silently drop the entire upsert when ordered:false.
             * `images` intentionally omitted here because $set always writes it.
             */
            $setOnInsert: {
              slug,
              originalPrice: null,
              discount: null,
              rating: 0,
              reviewsCount: 0,
              specs: {},
              tags: [],
              featured: false,
              trending: false,
              dealOfDay: false,
              isNewLaunch: false,
            },
          },
          upsert: true,
        },
      };
    });

    const write = await this.productModel.bulkWrite(bulk, { ordered: false });
    const catalogUpserted = write.upsertedCount;
    const catalogModified = write.modifiedCount;

    let catalogRemoved = 0;
    if (pruneMissing) {
      const removeRes = await this.productModel.deleteMany({
        zoho_item_id: { $exists: true, $ne: null, $nin: uniqueIds },
      });
      catalogRemoved = removeRes.deletedCount ?? 0;
    }

    return { catalogUpserted, catalogModified, catalogRemoved };
  }

  /**
   * Upsert image cache metadata. Binary is filled by {@link hydrateZohoImagesFromZoho} (sync only).
   * Storefront serves bytes from GET /api/products/image/:zohoItemId.
   */
  async upsertZohoImageCache(
    items: ZohoInventoryItemNormalized[],
  ): Promise<number> {
    const byId = new Map<string, ZohoInventoryItemNormalized>();
    for (const item of items) {
      const id = String(item.zohoItemId ?? '').trim();
      if (id) byId.set(id, { ...item, zohoItemId: id });
    }
    if (byId.size === 0) return 0;

    let n = 0;
    for (const item of byId.values()) {
      const id = String(item.zohoItemId).trim();
      if (!item.hasZohoImage) {
        await this.imageCacheModel
          .updateOne(
            { zoho_item_id: id },
            {
              $set: {
                zoho_item_id: id,
                image_url: ProductsService.FALLBACK_IMAGE_URL,
                zoho_image_key: null,
                image_data: null,
                content_type: 'image/jpeg',
                cached_at: new Date(),
              },
            },
            { upsert: true },
          )
          .exec();
        n += 1;
        continue;
      }

      const zohoKey = item.zohoImageId?.trim() || null;
      const image_url = `/api/products/image/${encodeURIComponent(id)}`;
      const existing = await this.imageCacheModel
        .findOne({ zoho_item_id: id })
        .select('zoho_image_key')
        .lean()
        .exec();
      const prevKey =
        existing?.zoho_image_key !== undefined &&
        existing?.zoho_image_key !== null
          ? String(existing.zoho_image_key)
          : '';
      const newKey = zohoKey ?? '';
      const keyChanged = prevKey !== newKey;

      await this.imageCacheModel
        .updateOne(
          { zoho_item_id: id },
          {
            $set: {
              zoho_item_id: id,
              image_url,
              zoho_image_key: zohoKey,
              cached_at: new Date(),
              ...(keyChanged ? { image_data: null } : {}),
            },
          },
          { upsert: true },
        )
        .exec();
      n += 1;
    }
    return n;
  }

  /**
   * Fetches catalog images from Zoho during sync and stores BSON Binary in Mongo.
   * Respects ZOHO_IMAGE_FETCH_MAX_PER_SYNC (default 120) to limit API usage per run.
   */
  async hydrateZohoImagesFromZoho(
    items: ZohoInventoryItemNormalized[],
  ): Promise<{ fetched: number; skipped: number; errors: number; capped: boolean }> {
    const rawMax = process.env.ZOHO_IMAGE_FETCH_MAX_PER_SYNC?.trim();
    const parsed = rawMax ? Number(rawMax) : 120;
    const maxFetches =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 120;

    let fetched = 0;
    let skipped = 0;
    let errors = 0;
    let capped = false;

    for (const item of items) {
      if (!item.hasZohoImage) continue;
      if (fetched >= maxFetches) {
        capped = true;
        break;
      }
      const id = String(item.zohoItemId ?? '').trim();
      if (!id) continue;
      const key = item.zohoImageId?.trim() || '';

      const row = await this.imageCacheModel.findOne({ zoho_item_id: id }).lean().exec();
      const existingBuf = row?.image_data;
      const existingLen =
        existingBuf != null
          ? Buffer.isBuffer(existingBuf)
            ? existingBuf.length
            : (existingBuf as { length?: number })?.length ?? 0
          : 0;
      if (
        existingLen > 0 &&
        String(row?.zoho_image_key ?? '') === key
      ) {
        skipped += 1;
        continue;
      }

      try {
        const { buffer, contentType } = await this.zoho.fetchItemImageBuffer(
          id,
          item.zohoImageId?.trim() || null,
          'sync',
        );
        if (buffer.length > ProductsService.MAX_IMAGE_BYTES) {
          this.logger.warn(
            `Zoho image for item ${id} skipped (${buffer.length} bytes > max)`,
          );
          errors += 1;
          continue;
        }
        await this.imageCacheModel.updateOne(
          { zoho_item_id: id },
          {
            $set: {
              image_data: buffer,
              content_type: contentType || 'image/jpeg',
              zoho_image_key: key || null,
              cached_at: new Date(),
            },
          },
        ).exec();
        fetched += 1;
      } catch (err) {
        errors += 1;
        this.logger.warn(
          `Zoho image fetch failed for item ${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (capped) {
      this.logger.warn(
        `hydrateZohoImagesFromZoho: cap reached (${maxFetches} fetches); remaining items unchanged this run`,
      );
    }
    return { fetched, skipped, errors, capped };
  }

  async getCachedImageBinary(
    zohoItemId: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    const id = zohoItemId.trim();
    if (!id || !/^\d+$/.test(id)) return null;
    const row = await this.imageCacheModel.findOne({ zoho_item_id: id }).lean().exec();
    if (!row) return null;
    const raw = row.image_data;
    if (raw == null) return null;
    const data = Buffer.isBuffer(raw)
      ? raw
      : Buffer.from(raw as Uint8Array);
    if (data.length === 0) return null;
    const contentType =
      typeof row.content_type === 'string' && row.content_type.trim()
        ? row.content_type.trim()
        : 'image/jpeg';
    return { data, contentType };
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ slug }).exec();
    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    return product;
  }

  async update(idOrSlug: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const existing = await this.findOne(idOrSlug);
    const product = await this.productModel
      .findByIdAndUpdate(existing._id, { $set: dto }, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with id ${idOrSlug} not found`);
    }
    return product;
  }

  async remove(idOrSlug: string): Promise<void> {
    const existing = await this.findOne(idOrSlug);
    const result = await this.productModel.findByIdAndDelete(existing._id).exec();
    if (!result) {
      throw new NotFoundException(`Product with id ${idOrSlug} not found`);
    }
  }
}
