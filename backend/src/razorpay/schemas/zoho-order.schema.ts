import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoOrderDocument = HydratedDocument<ZohoOrder>;

export type ZohoOrderSyncStatus = 'pending' | 'success' | 'failed';

@Schema({
  timestamps: true,
  collection: 'zoho_orders',
  id: false,
})
export class ZohoOrder {
  @Prop({ required: true, unique: true, index: true })
  order_id: string;

  @Prop({ required: true, index: true })
  order_mongo_id: string;

  @Prop({ type: String, default: null })
  zoho_salesorder_id: string | null;

  @Prop({ type: String, default: null })
  zoho_invoice_id: string | null;

  @Prop({ type: String, default: null })
  zoho_payment_id: string | null;

  @Prop({
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true,
  })
  sync_status: ZohoOrderSyncStatus;

  @Prop({ type: Number, default: 0 })
  retry_count: number;

  @Prop({ type: Date, default: null, index: true })
  next_retry_at: Date | null;

  @Prop({ type: String, default: null })
  last_error: string | null;
}

export const ZohoOrderSchema = SchemaFactory.createForClass(ZohoOrder);
