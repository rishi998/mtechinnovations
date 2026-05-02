import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoApiUsageDocument = HydratedDocument<ZohoApiUsage>;
export type ZohoApiUsageChannel = 'sync' | 'order';

@Schema({
  timestamps: true,
  collection: 'zoho_api_usage',
  id: false,
})
export class ZohoApiUsage {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true, enum: ['sync', 'order'] })
  channel: ZohoApiUsageChannel;

  @Prop({ type: Number, required: true, default: 0 })
  count: number;
}

export const ZohoApiUsageSchema = SchemaFactory.createForClass(ZohoApiUsage);
ZohoApiUsageSchema.index({ date: 1, channel: 1 }, { unique: true });
