import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<CategoryCache>;

@Schema({
  timestamps: true,
  collection: 'categories',
  id: false,
})
export class CategoryCache {
  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: null })
  image: string | null;

  @Prop({ type: Number, required: true, default: 0 })
  product_count: number;

  @Prop({ type: String, default: 'mongo' })
  source: string;

  @Prop({ type: Date, default: null })
  last_synced_at: Date | null;
}

export const CategoryCacheSchema = SchemaFactory.createForClass(CategoryCache);
