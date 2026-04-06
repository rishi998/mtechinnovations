import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoSyncedProductDocument = HydratedDocument<ZohoSyncedProduct>;

/**
 * Local cache of Zoho Inventory items (separate from legacy catalog `Product` in src/products).
 * Upsert key: zoho_item_id (maps from Zoho `item_id`).
 */
@Schema({
  timestamps: true,
  collection: 'zoho_inventory_products',
  id: false,
})
export class ZohoSyncedProduct {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: null })
  sku: string | null;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, unique: true, index: true })
  zoho_item_id: string;
}

export const ZohoSyncedProductSchema =
  SchemaFactory.createForClass(ZohoSyncedProduct);

ZohoSyncedProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const o = ret as unknown as Record<string, unknown>;
    o.id = String(o._id);
    delete o._id;
    return o;
  },
});
