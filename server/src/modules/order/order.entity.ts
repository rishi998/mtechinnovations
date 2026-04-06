import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ZohoSalesOrderRecordDocument = HydratedDocument<ZohoSalesOrderRecord>;

export type ZohoSalesOrderSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

@Schema({ _id: false })
export class ZohoSalesOrderLine {
  @Prop({ type: Types.ObjectId, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  zoho_item_id: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}

export const ZohoSalesOrderLineSchema =
  SchemaFactory.createForClass(ZohoSalesOrderLine);

/**
 * E-commerce orders pushed to Zoho Inventory (separate from storefront `Order` in src/orders).
 */
@Schema({
  timestamps: true,
  collection: 'zoho_sales_orders',
  id: false,
})
export class ZohoSalesOrderRecord {
  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  customerEmail: string;

  @Prop({ type: [ZohoSalesOrderLineSchema], required: true })
  items: ZohoSalesOrderLine[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: String, default: null })
  zoho_salesorder_id: string | null;

  @Prop({
    type: String,
    enum: ['PENDING', 'SYNCED', 'FAILED'],
    default: 'PENDING',
  })
  status: ZohoSalesOrderSyncStatus;

  @Prop({ type: String, default: null })
  lastError: string | null;
}

export const ZohoSalesOrderRecordSchema = SchemaFactory.createForClass(
  ZohoSalesOrderRecord,
);

ZohoSalesOrderRecordSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const o = ret as unknown as Record<string, unknown>;
    o.id = String(o._id);
    delete o._id;
    return o;
  },
});
