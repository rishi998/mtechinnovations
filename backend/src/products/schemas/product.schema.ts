import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, id: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  /**
   * Zoho Inventory `item_id` as string (required for sales orders / invoices).
   * Manual catalog rows may omit until synced.
   */
  @Prop({ type: String, default: null, trim: true })
  zoho_item_id: string | null;

  /** Zoho Inventory `image_id` when the item has a catalog image (sync from Zoho). */
  @Prop({ type: String, default: null, trim: true })
  zoho_image_id: string | null;

  @Prop({ type: String, default: null })
  sku: string | null;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  subcategory: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Number, default: null })
  originalPrice: number | null;

  @Prop({ type: Number, default: null })
  discount: number | null;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: String, default: '' })
  description: string;

  /** Slug hints inferred from Zoho description/name (e.g. 'sensors'). */
  @Prop({ type: [String], default: [] })
  category_hints: string[];

  @Prop({ type: Object, default: {} })
  specs: Record<string, string>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  brand: string;

  @Prop({ type: Boolean, default: false })
  featured: boolean;

  @Prop({ type: Boolean, default: false })
  trending: boolean;

  @Prop({ type: Boolean, default: false })
  dealOfDay: boolean;

  @Prop({ type: Boolean, default: false })
  isNewLaunch: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ zoho_item_id: 1 }, { unique: true, sparse: true });
