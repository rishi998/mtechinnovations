import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoImageCacheDocument = HydratedDocument<ZohoImageCache>;

@Schema({
  timestamps: true,
  collection: 'zoho_images_cache',
  id: false,
})
export class ZohoImageCache {
  @Prop({ required: true, unique: true, trim: true })
  zoho_item_id: string;

  /** Public URL for `<img>` / Next Image: `/api/products/image/{zoho_item_id}` or external fallback. */
  @Prop({ type: String, default: null })
  image_url: string | null;

  /** Zoho `image_id` when the blob was fetched (refetch if Zoho changes image). */
  @Prop({ type: String, default: null })
  zoho_image_key: string | null;

  @Prop({ type: Buffer, default: null })
  image_data: Buffer | null;

  @Prop({ type: String, default: 'image/jpeg' })
  content_type: string;

  @Prop({ type: Date, default: Date.now })
  cached_at: Date;
}

export const ZohoImageCacheSchema = SchemaFactory.createForClass(ZohoImageCache);
