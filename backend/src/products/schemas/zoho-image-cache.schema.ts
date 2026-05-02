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

  @Prop({ type: String, default: null })
  image_url: string | null;

  @Prop({ type: Date, default: Date.now })
  cached_at: Date;
}

export const ZohoImageCacheSchema = SchemaFactory.createForClass(ZohoImageCache);
