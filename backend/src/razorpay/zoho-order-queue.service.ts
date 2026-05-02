import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZohoOrder,
  ZohoOrderDocument,
  ZohoOrderSyncStatus,
} from './schemas/zoho-order.schema';

@Injectable()
export class ZohoOrderQueueService {
  constructor(
    @InjectModel(ZohoOrder.name)
    private readonly queueModel: Model<ZohoOrderDocument>,
  ) {}

  async enqueuePending(input: {
    orderId: string;
    orderMongoId: string;
    salesOrderId?: string | null;
    invoiceId?: string | null;
    paymentId?: string | null;
    reason?: string | null;
  }): Promise<void> {
    await this.queueModel
      .updateOne(
        { order_id: input.orderId },
        {
          $set: {
            order_id: input.orderId,
            order_mongo_id: input.orderMongoId,
            zoho_salesorder_id: input.salesOrderId ?? null,
            zoho_invoice_id: input.invoiceId ?? null,
            zoho_payment_id: input.paymentId ?? null,
            sync_status: 'pending',
            next_retry_at: new Date(),
            last_error: input.reason ?? null,
          },
          $setOnInsert: { retry_count: 0 },
        },
        { upsert: true },
      )
      .exec();
  }

  async markSuccess(orderId: string, data: {
    salesOrderId?: string | null;
    invoiceId?: string | null;
    paymentId?: string | null;
  }): Promise<void> {
    await this.queueModel
      .updateOne(
        { order_id: orderId },
        {
          $set: {
            sync_status: 'success',
            zoho_salesorder_id: data.salesOrderId ?? null,
            zoho_invoice_id: data.invoiceId ?? null,
            zoho_payment_id: data.paymentId ?? null,
            last_error: null,
            next_retry_at: null,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async markRetry(orderId: string, errorMessage: string): Promise<void> {
    const existing = await this.queueModel.findOne({ order_id: orderId }).lean().exec();
    const retries = Number(existing?.retry_count ?? 0) + 1;
    const delayMinutes = Math.min(6 * 60, Math.pow(2, Math.min(retries, 8)));
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    const syncStatus: ZohoOrderSyncStatus = retries >= 12 ? 'failed' : 'pending';
    await this.queueModel
      .updateOne(
        { order_id: orderId },
        {
          $set: {
            sync_status: syncStatus,
            retry_count: retries,
            next_retry_at: nextRetryAt,
            last_error: errorMessage,
          },
        },
      )
      .exec();
  }

  async fetchRetryBatch(limit: number): Promise<ZohoOrderDocument[]> {
    return this.queueModel
      .find({
        sync_status: 'pending',
        $or: [{ next_retry_at: null }, { next_retry_at: { $lte: new Date() } }],
      })
      .sort({ next_retry_at: 1, updatedAt: 1 })
      .limit(limit)
      .exec();
  }
}
