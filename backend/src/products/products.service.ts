import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ZohoInventoryItemNormalized } from '../modules/zoho/zoho-inventory.types';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
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
   * Upsert storefront `products` from a Zoho sync snapshot and remove rows tied to
   * Zoho ids that no longer exist in that snapshot. Rows without `zoho_item_id`
   * (e.g. hand-seeded catalog) are left unchanged.
   */
  async syncCatalogFromZohoItems(
    items: ZohoInventoryItemNormalized[],
  ): Promise<ZohoCatalogSyncStats> {
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

    const bulk = [...byId.values()].map((item) => {
      const zoho_item_id = String(item.zohoItemId).trim();
      const slug = slugifyZohoStorefrontProduct(item.name, zoho_item_id, item.sku);
      const brand =
        item.category === 'Uncategorized'
          ? 'Zoho'
          : item.category.split(/[\/|]/)[0]?.trim() || 'Zoho';
      const imageQuery =
        item.zohoImageId != null
          ? `?image_id=${encodeURIComponent(item.zohoImageId)}`
          : '';
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
        brand,
        /** Proxy resolves image bytes; path always present so storefront URL is stable. */
        /** Full path on site origin; Nest serves GET /api/zoho/items/:id/image */
        images: [`/api/zoho/items/${zoho_item_id}/image${imageQuery}`],
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

    const removeRes = await this.productModel.deleteMany({
      zoho_item_id: { $exists: true, $ne: null, $nin: uniqueIds },
    });
    const catalogRemoved = removeRes.deletedCount ?? 0;

    return { catalogUpserted, catalogModified, catalogRemoved };
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
