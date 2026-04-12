import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderItem, OrderItemSchema } from './order-item.schema';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderPaymentStatus = 'pending' | 'success' | 'failed';

export type OrderZohoSyncStatus = 'pending' | 'synced' | 'failed';

export type OrderDocument = Order & Document;

const ShippingAddressSchema = {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
};

@Schema({ timestamps: true, id: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' })
  status: OrderStatus;

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  shipping: number;

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  @Prop({ type: String, default: 'card' })
  paymentMethod: string;

  @Prop({ type: String, default: null })
  trackingId: string | null;

  @Prop({ type: String, default: null })
  paymentId: string | null;

  @Prop({ type: String, default: null })
  razorpay_order_id: string | null;

  @Prop({ type: String, default: null })
  razorpay_payment_id: string | null;

  @Prop({
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  payment_status: OrderPaymentStatus;

  @Prop({ type: String, default: null })
  zoho_salesorder_id: string | null;

  @Prop({ type: String, default: null })
  zoho_invoice_id: string | null;

  @Prop({
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending',
  })
  zoho_sync_status: OrderZohoSyncStatus;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
