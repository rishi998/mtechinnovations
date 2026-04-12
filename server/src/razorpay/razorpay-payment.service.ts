import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { ZohoService } from '../modules/zoho/zoho.service';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductDocument,
} from '../modules/product/product.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderDocument } from '../orders/schemas/order.schema';
import { UsersService } from '../users/users.service';
import { RazorpayVerifyDto } from './dto/razorpay-verify.dto';
import type { ZohoCreateSalesOrderLineItem } from '../modules/zoho/zoho-inventory-salesorder.types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay') as new (args: {
  key_id: string;
  key_secret: string;
}) => {
  orders: { create: (body: Record<string, unknown>) => Promise<{ id: string; amount: number }> };
};

function extractZohoSalesOrderId(data: Record<string, unknown>): string | null {
  const pick = (node: unknown): string | null => {
    if (node && typeof node === 'object' && node !== null) {
      const id = (node as Record<string, unknown>).salesorder_id;
      if (id != null && String(id) !== '') {
        return String(id).trim();
      }
    }
    return null;
  };
  return (
    pick(data.sales_order) ??
    pick(data.salesorder) ??
    (data.salesorder_id != null && String(data.salesorder_id) !== ''
      ? String(data.salesorder_id).trim()
      : null)
  );
}

function extractZohoInvoiceId(data: Record<string, unknown>): string | null {
  const inv = data.invoice;
  if (inv && typeof inv === 'object' && inv !== null) {
    const id = (inv as Record<string, unknown>).invoice_id;
    if (id != null && String(id) !== '') {
      return String(id).trim();
    }
  }
  if (data.invoice_id != null && String(data.invoice_id) !== '') {
    return String(data.invoice_id).trim();
  }
  return null;
}

@Injectable()
export class RazorpayPaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name);
  private readonly razorpay: InstanceType<typeof Razorpay>;

  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly zoho: ZohoService,
    @InjectModel(ZohoSyncedProduct.name)
    private readonly syncedProductModel: Model<ZohoSyncedProductDocument>,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
      key_secret: this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async createRazorpayOrderForCheckout(
    userId: string,
    orderMongoId: string,
  ): Promise<{ razorpayOrderId: string; amount: number; key: string }> {
    const order = await this.ordersService.findOne(orderMongoId, userId);
    if (order.status !== 'pending') {
      throw new BadRequestException('Order cannot be paid');
    }
    if ((order.payment_status ?? 'pending') === 'success') {
      throw new BadRequestException('Order already paid');
    }

    const amountPaise = Math.round(Number(order.total) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new BadRequestException('Invalid order amount for payment');
    }

    const receipt = order.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40) || `ord${Date.now()}`;

    const rzpOrder = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        mongo_order_id: String(order._id),
        user_order_id: order.orderId,
      },
    });

    await this.ordersService.attachRazorpayOrderId(
      orderMongoId,
      userId,
      rzpOrder.id,
    );

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      key: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
    };
  }

  verifyClientPayment(userId: string, dto: RazorpayVerifyDto) {
    this.assertPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    return this.finalizeSuccessfulPaymentByRazorpayIds(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      userId,
    );
  }

  async handleWebhookPayload(payload: Record<string, unknown>) {
    const event = String(payload.event ?? '');
    const entity = this.extractWebhookPaymentEntity(payload);
    if (!entity) {
      return { received: true, ignored: true as const };
    }

    const razorpayOrderId =
      entity.order_id != null ? String(entity.order_id).trim() : '';
    const razorpayPaymentId =
      entity.id != null ? String(entity.id).trim() : '';

    if (!razorpayOrderId || !razorpayPaymentId) {
      return { received: true, ignored: true as const };
    }

    if (event === 'payment.captured') {
      await this.finalizeSuccessfulPaymentByRazorpayIds(
        razorpayOrderId,
        razorpayPaymentId,
        undefined,
      );
    } else if (event === 'payment.failed') {
      await this.ordersService.markPaymentFailedForRazorpayOrder(
        razorpayOrderId,
      );
    }

    return { received: true as const };
  }

  private extractWebhookPaymentEntity(
    payload: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const payPayload = payload.payload as Record<string, unknown> | undefined;
    const paymentNode = payPayload?.payment as Record<string, unknown> | undefined;
    const entity = paymentNode?.entity as Record<string, unknown> | undefined;
    return entity ?? null;
  }

  private assertPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): void {
    const secret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    const body = `${orderId}|${paymentId}`;
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const sig = signature.trim();
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(sig, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid payment signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid payment signature');
    }
  }

  private async finalizeSuccessfulPaymentByRazorpayIds(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    userId?: string,
  ): Promise<{
    success: true;
    orderId: string;
    zohoSynced: boolean;
    zohoSalesOrderId?: string | null;
    zohoInvoiceId?: string | null;
  }> {
    const order = await this.ordersService.findByRazorpayOrderId(
      razorpayOrderId,
    );
    if (!order) {
      if (userId != null) {
        throw new BadRequestException(
          'Order not found for this Razorpay order id',
        );
      }
      this.logger.warn(
        `No order for Razorpay order_id=${razorpayOrderId}; webhook ignored`,
      );
      return {
        success: true,
        orderId: '',
        zohoSynced: false,
      };
    }

    if (userId != null && order.userId.toString() !== userId) {
      throw new ForbiddenException('Order does not belong to this user');
    }

    return this.finalizeSuccessfulPayment(order, razorpayPaymentId);
  }

  private async finalizeSuccessfulPayment(
    order: OrderDocument,
    razorpayPaymentId: string,
  ): Promise<{
    success: true;
    orderId: string;
    zohoSynced: boolean;
    zohoSalesOrderId?: string | null;
    zohoInvoiceId?: string | null;
  }> {
    const paid = (order.payment_status ?? 'pending') === 'success';

    if (paid) {
      if (order.razorpay_payment_id !== razorpayPaymentId) {
        throw new ConflictException('Order already paid with a different payment');
      }

      if (order.zoho_sync_status === 'synced') {
        return {
          success: true,
          orderId: order.orderId,
          zohoSynced: true,
          zohoSalesOrderId: order.zoho_salesorder_id,
          zohoInvoiceId: order.zoho_invoice_id,
        };
      }

      try {
        const zoho = await this.runZohoSync(order);
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          zoho.salesOrderId,
          zoho.invoiceId,
          'synced',
        );
      } catch (err) {
        this.logger.error(
          `Zoho retry failed for order ${order.orderId}`,
          err instanceof Error ? err.stack : undefined,
        );
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          order.zoho_salesorder_id ?? null,
          order.zoho_invoice_id ?? null,
          'failed',
        );
      }

      const refreshed = await this.ordersService.findByRazorpayOrderId(
        order.razorpay_order_id!,
      );
      return {
        success: true,
        orderId: refreshed?.orderId ?? order.orderId,
        zohoSynced: refreshed?.zoho_sync_status === 'synced',
        zohoSalesOrderId: refreshed?.zoho_salesorder_id,
        zohoInvoiceId: refreshed?.zoho_invoice_id,
      };
    }

    let zohoSales: string | null = null;
    let zohoInv: string | null = null;
    let syncStatus: 'synced' | 'failed' = 'synced';

    try {
      const zoho = await this.runZohoSync(order);
      zohoSales = zoho.salesOrderId;
      zohoInv = zoho.invoiceId;
    } catch (err) {
      this.logger.error(
        `Zoho sync failed after Razorpay success for order ${order.orderId}`,
        err instanceof Error ? err.stack : undefined,
      );
      syncStatus = 'failed';
    }

    await this.ordersService.applyVerifiedRazorpayPayment({
      orderMongoId: String(order._id),
      razorpayPaymentId,
      zohoSalesOrderId: zohoSales,
      zohoInvoiceId: zohoInv,
      zohoSyncStatus: syncStatus,
    });

    return {
      success: true,
      orderId: order.orderId,
      zohoSynced: syncStatus === 'synced',
      zohoSalesOrderId: zohoSales,
      zohoInvoiceId: zohoInv,
    };
  }

  private async buildZohoLineItems(order: OrderDocument): Promise<ZohoCreateSalesOrderLineItem[]> {
    const out: ZohoCreateSalesOrderLineItem[] = [];
    for (const row of order.items) {
      const p = row.productId as unknown as {
        sku?: string | null;
        name?: string;
      };
      const sku = p?.sku?.trim();
      if (!sku) {
        throw new BadRequestException(
          'A product in this order has no SKU; map catalog SKUs to Zoho items before checkout.',
        );
      }
      const synced = await this.syncedProductModel.findOne({ sku }).exec();
      const zohoItemId = synced?.zoho_item_id?.trim();
      if (!zohoItemId || !/^\d+$/.test(zohoItemId)) {
        throw new BadRequestException(
          `No Zoho-synced item for SKU "${sku}". Sync Zoho products first.`,
        );
      }
      const name =
        synced?.name?.trim() ||
        (typeof p.name === 'string' && p.name.trim()) ||
        'Item';
      out.push({
        item_id: zohoItemId,
        name,
        quantity: row.quantity,
        rate: row.price,
        unit: 'qty',
      });
    }
    return out;
  }

  private async runZohoSync(
    order: OrderDocument,
  ): Promise<{ salesOrderId: string; invoiceId: string }> {
    const lineItems = await this.buildZohoLineItems(order);
    const user = await this.usersService.findOne(order.userId.toString());
    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('User email missing; cannot create Zoho customer');
    }

    const customerName = order.shippingAddress?.name?.trim() || 'Customer';
    const customerId = await this.zoho.ensureCustomerContact(
      customerName,
      email,
    );

    const today = new Date().toISOString().slice(0, 10);

    const soBody = await this.zoho.createSalesOrder({
      customer_id: customerId,
      date: today,
      line_items: lineItems,
    });
    const salesOrderId = extractZohoSalesOrderId(soBody);
    if (!salesOrderId) {
      throw new Error('Zoho sales order response missing salesorder_id');
    }

    const invBody = await this.zoho.createInvoice({
      customer_id: customerId,
      date: today,
      line_items: lineItems,
    });
    const invoiceId = extractZohoInvoiceId(invBody);
    if (!invoiceId) {
      throw new Error('Zoho invoice response missing invoice_id');
    }

    await this.zoho.recordCustomerPayment({
      customer_id: customerId,
      invoice_id: invoiceId,
      amount: Number(order.total),
      date: today,
      payment_mode: 'Razorpay',
    });

    return { salesOrderId, invoiceId };
  }
}
