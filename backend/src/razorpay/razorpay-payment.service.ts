import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { ZohoService } from '../modules/zoho/zoho.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { orderLineStorefrontProductId } from '../orders/utils/order-line-product-id';
import { OrdersService } from '../orders/orders.service';
import { OrderDocument } from '../orders/schemas/order.schema';
import { UsersService } from '../users/users.service';
import { RazorpayVerifyDto } from './dto/razorpay-verify.dto';
import type { ZohoCreateSalesOrderLineItem } from '../modules/zoho/zoho-inventory-salesorder.types';
import { ZohoOrderQueueService } from './zoho-order-queue.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay') as new (args: {
  key_id: string;
  key_secret: string;
}) => {
  orders: { create: (body: Record<string, unknown>) => Promise<{ id: string; amount: number }> };
};

/**
 * Supports both Razorpay dashboard naming (KEY_ID / KEY_SECRET) and
 * common .env aliases (API_KEY / API_SECRET).
 */
function resolveRazorpayCredentials(config: ConfigService): {
  keyId: string;
  keySecret: string;
  mode: 'live' | 'test';
} {
  const modeRaw =
    config.get<string>('RAZORPAY_MODE')?.trim().toLowerCase() ||
    (process.env.NODE_ENV === 'production' ? 'live' : 'test');
  const mode: 'live' | 'test' = modeRaw === 'live' ? 'live' : 'test';

  const keyIdCandidates =
    mode === 'live'
      ? [
          config.get<string>('RAZORPAY_LIVE_KEY_ID')?.trim(),
          config.get<string>('RAZORPAY_KEY_ID')?.trim(),
          config.get<string>('RAZORPAY_API_KEY')?.trim(),
        ]
      : [
          config.get<string>('RAZORPAY_TEST_KEY_ID')?.trim(),
          config.get<string>('RAZORPAY_KEY_ID')?.trim(),
          config.get<string>('RAZORPAY_API_KEY')?.trim(),
        ];
  const keySecretCandidates =
    mode === 'live'
      ? [
          config.get<string>('RAZORPAY_LIVE_KEY_SECRET')?.trim(),
          config.get<string>('RAZORPAY_KEY_SECRET')?.trim(),
          config.get<string>('RAZORPAY_API_SECRET')?.trim(),
        ]
      : [
          config.get<string>('RAZORPAY_TEST_KEY_SECRET')?.trim(),
          config.get<string>('RAZORPAY_KEY_SECRET')?.trim(),
          config.get<string>('RAZORPAY_API_SECRET')?.trim(),
        ];
  const keyId = keyIdCandidates.find((x) => Boolean(x)) ?? '';
  const keySecret = keySecretCandidates.find((x) => Boolean(x)) ?? '';
  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or RAZORPAY_API_KEY and RAZORPAY_API_SECRET.',
    );
  }
  const keyMode = keyId.startsWith('rzp_live_')
    ? 'live'
    : keyId.startsWith('rzp_test_')
      ? 'test'
      : 'unknown';
  if (mode === 'live' && keyMode === 'test') {
    throw new Error(
      'Razorpay is configured for LIVE mode but a TEST key is loaded (rzp_test_*). Set RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET (or replace generic RAZORPAY_KEY_ID/SECRET with live keys).',
    );
  }
  return { keyId, keySecret, mode };
}

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

/** Amount to record against the invoice (Zoho’s balance after tax; matches what customer should pay in Zoho). */
function extractZohoInvoiceAmountDue(data: Record<string, unknown>): number | null {
  const inv = data.invoice;
  if (!inv || typeof inv !== 'object') {
    return null;
  }
  const o = inv as Record<string, unknown>;
  const pick = (v: unknown): number | null => {
    if (v == null) {
      return null;
    }
    const n = typeof v === 'string' ? parseFloat(v.trim()) : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return pick(o.balance) ?? pick(o.total);
}

function extractZohoCustomerPaymentId(data: Record<string, unknown>): string | null {
  const payment = data.payment;
  if (payment && typeof payment === 'object') {
    const id = (payment as Record<string, unknown>).payment_id;
    if (id != null && String(id).trim() !== '') {
      return String(id).trim();
    }
  }
  if (data.payment_id != null && String(data.payment_id).trim() !== '') {
    return String(data.payment_id).trim();
  }
  return null;
}

const ZOHO_ERR_UI_MAX = 2000;

function truncateZohoErrorMessage(err: unknown): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);
  const t = msg.trim() || 'Unknown Zoho error';
  return t.length > ZOHO_ERR_UI_MAX ? `${t.slice(0, ZOHO_ERR_UI_MAX)}…` : t;
}

@Injectable()
export class RazorpayPaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name);
  /** Prevents duplicate concurrent Zoho invoice creation for the same order (verify + webhook). */
  private readonly zohoInvoiceSyncInFlight = new Set<string>();
  private readonly razorpay: InstanceType<typeof Razorpay>;
  private readonly rzpKeyId: string;
  private readonly rzpKeySecret: string;
  private readonly rzpMode: 'live' | 'test';

  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly zoho: ZohoService,
    private readonly zohoQueue: ZohoOrderQueueService,
    @InjectModel(Product.name)
    private readonly storefrontProductModel: Model<ProductDocument>,
  ) {
    const { keyId, keySecret, mode } = resolveRazorpayCredentials(this.config);
    this.rzpKeyId = keyId;
    this.rzpKeySecret = keySecret;
    this.rzpMode = mode;
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    this.logger.log(
      `Razorpay initialized in ${this.rzpMode.toUpperCase()} mode with key ${this.rzpKeyId.slice(0, 12)}…`,
    );
  }

  async createRazorpayOrderForCheckout(
    userId: string,
    orderMongoId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    key: string;
    mode: 'live' | 'test';
  }> {
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

    let rzpOrder: { id: string; amount: number };
    try {
      rzpOrder = await this.razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          mongo_order_id: String(order._id),
          user_order_id: order.orderId,
        },
      });
    } catch (err: unknown) {
      const desc = (() => {
        if (err && typeof err === 'object' && 'error' in err) {
          const e = (err as { error?: { description?: string } }).error;
          if (e?.description) return e.description;
        }
        if (err instanceof Error) return err.message;
        return String(err);
      })();
      this.logger.error(`Razorpay orders.create failed: ${desc}`);
      throw new BadRequestException(
        'Could not start Razorpay checkout. Confirm API keys match your Razorpay mode (test vs live) and are copied correctly.',
      );
    }

    await this.ordersService.attachRazorpayOrderId(
      orderMongoId,
      userId,
      rzpOrder.id,
    );

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      key: this.rzpKeyId,
      mode: this.rzpMode,
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
    const secret = this.rzpKeySecret;
    const body = `${orderId}|${paymentId}`;
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const sig = signature.trim();
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(sig, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        this.logger.warn(
          `Razorpay signature mismatch for order_id prefix=${orderId.slice(0, 12)}… — ` +
            'confirm RAZORPAY_KEY_SECRET matches this Key Id in the Razorpay dashboard (test vs live).',
        );
        throw new UnauthorizedException('Invalid payment signature');
      }
    } catch (e) {
      if (!(e instanceof UnauthorizedException)) {
        this.logger.warn(
          `Razorpay signature verify threw for order_id prefix=${orderId.slice(0, 12)}…`,
        );
      }
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

      void this.runPostPaymentZohoSync(String(order._id)).catch((e) =>
        this.logger.error(
          `[Zoho] runPostPaymentZohoSync (repeat payment path) failed: ${e instanceof Error ? e.message : e}`,
        ),
      );

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
    let zohoPayment: string | null = null;
    const syncStatus: 'pending' = 'pending';

    await this.ordersService.applyVerifiedRazorpayPayment({
      orderMongoId: String(order._id),
      razorpayPaymentId,
      zohoSalesOrderId: zohoSales,
      zohoInvoiceId: zohoInv,
      zohoPaymentId: zohoPayment,
      zohoSyncStatus: syncStatus,
      zohoSyncLastError: null,
    });

    void this.runPostPaymentZohoSync(String(order._id)).catch((e) =>
      this.logger.error(
        `[Zoho] runPostPaymentZohoSync failed: ${e instanceof Error ? e.message : e}`,
      ),
    );

    return {
      success: true,
      orderId: order.orderId,
      zohoSynced: false,
      zohoSalesOrderId: zohoSales,
      zohoInvoiceId: zohoInv,
    };
  }

  /**
   * Creates Zoho sales order + invoice after Razorpay success (background).
   * On failure, stores error on the order and enqueues for cron retries.
   */
  private async runPostPaymentZohoSync(orderMongoId: string): Promise<void> {
    if (this.zohoInvoiceSyncInFlight.has(orderMongoId)) {
      this.logger.log(
        `[Zoho] Invoice sync already running for mongo order ${orderMongoId}; skip duplicate trigger`,
      );
      return;
    }
    this.zohoInvoiceSyncInFlight.add(orderMongoId);
    try {
      const order = await this.ordersService.findByMongoIdForSystem(orderMongoId);
      if (!order) {
        this.logger.warn(`[Zoho] runPostPaymentZohoSync: order ${orderMongoId} not found`);
        return;
      }
      if ((order.payment_status ?? 'pending') !== 'success') {
        this.logger.warn(
          `[Zoho] runPostPaymentZohoSync: order ${order.orderId} not paid; skipping`,
        );
        return;
      }
      if (order.zoho_sync_status === 'synced' && order.zoho_invoice_id) {
        return;
      }

      this.logger.log(`[Zoho] Starting invoice sync for order ${order.orderId}`);

      try {
        const result = await this.runZohoSync(order);
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          result.salesOrderId,
          result.invoiceId,
          result.paymentId,
          'synced',
          null,
        );
        await this.zohoQueue.markSuccess(order.orderId, {
          salesOrderId: result.salesOrderId,
          invoiceId: result.invoiceId,
          paymentId: result.paymentId,
        });
        this.logger.log(
          `[Zoho] Invoice sync completed for order ${order.orderId} invoice_id=${result.invoiceId}`,
        );
      } catch (err) {
        const msg = truncateZohoErrorMessage(err);
        this.logger.error(
          `[Zoho] Invoice sync failed for order ${order.orderId}: ${msg}`,
          err instanceof Error ? err.stack : undefined,
        );
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          order.zoho_salesorder_id ?? null,
          order.zoho_invoice_id ?? null,
          order.zoho_payment_id ?? null,
          'pending',
          msg,
        );
        await this.zohoQueue.enqueuePending({
          orderId: order.orderId,
          orderMongoId: String(order._id),
          salesOrderId: order.zoho_salesorder_id ?? null,
          invoiceId: order.zoho_invoice_id ?? null,
          paymentId: order.zoho_payment_id ?? null,
          reason: msg,
        });
      }
    } finally {
      this.zohoInvoiceSyncInFlight.delete(orderMongoId);
    }
  }

  private async buildZohoLineItems(order: OrderDocument): Promise<ZohoCreateSalesOrderLineItem[]> {
    const out: ZohoCreateSalesOrderLineItem[] = [];
    for (const row of order.items) {
      const pid = orderLineStorefrontProductId(row.productId);
      const product = await this.storefrontProductModel.findById(pid).exec();
      if (!product) {
        throw new BadRequestException(
          `Storefront product not found for order line productId=${pid}`,
        );
      }
      const zohoItemId = product.zoho_item_id?.trim();
      this.logger.log(
        `Product zoho_item_id: ${zohoItemId ?? '(missing)'} productId=${pid}`,
      );
      if (!zohoItemId) {
        throw new BadRequestException('Missing zoho_item_id');
      }
      if (!/^\d+$/.test(zohoItemId)) {
        throw new BadRequestException(
          `Invalid zoho_item_id for product ${pid}; expected numeric Zoho item id string.`,
        );
      }
      const name = product.name?.trim() || 'Item';
      out.push({
        item_id: String(zohoItemId).trim(),
        name,
        quantity: row.quantity,
        rate: row.price,
        unit: 'qty',
      });
    }
    return out;
  }

  private parseNumericZohoItemId(key: string): string | null {
    const v = this.config.get<string>(key)?.trim();
    return v && /^\d+$/.test(v) ? v : null;
  }

  /**
   * Builds Zoho invoice lines: prefers real SKU → Zoho item mapping; falls back to a
   * generic Zoho item when needed so any paid order can still get an invoice.
   */
  private async resolveZohoLineItemsForPaidOrder(
    order: OrderDocument,
  ): Promise<ZohoCreateSalesOrderLineItem[]> {
    const fallbackId =
      this.parseNumericZohoItemId('ZOHO_FALLBACK_LINE_ITEM_ID') ??
      this.parseNumericZohoItemId('ZOHO_SHIPPING_ITEM_ID');

    let lines: ZohoCreateSalesOrderLineItem[] = [];
    try {
      lines = await this.buildZohoLineItems(order);
    } catch (err) {
      this.logger.warn(
        `Zoho SKU line mapping failed for order ${order.orderId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      lines = [];
    }

    const sub = Number(order.subtotal ?? 0);
    const ship = Number(order.shipping ?? 0);
    const tot = Number(order.total);

    if (lines.length === 0 && tot > 0.01) {
      if (!fallbackId) {
        throw new BadRequestException(
          'Could not map catalog lines to Zoho items. Create a generic non-stock item in Zoho Inventory and set ZOHO_FALLBACK_LINE_ITEM_ID (item_id) in server .env so invoices can still be generated.',
        );
      }
      this.logger.warn(
        `Using fallback Zoho item_id=${fallbackId} for order ${order.orderId} (no mapped catalog lines)`,
      );
      if (sub > 0.01) {
        lines.push({
          item_id: String(fallbackId).trim(),
          name: 'Merchandise',
          quantity: 1,
          rate: sub,
          unit: 'qty',
        });
      } else {
        lines.push({
          item_id: String(fallbackId).trim(),
          name: 'Order total',
          quantity: 1,
          rate: tot,
          unit: 'qty',
        });
      }
    }

    if (ship > 0.01) {
      const shipItemId =
        this.parseNumericZohoItemId('ZOHO_SHIPPING_ITEM_ID') ?? fallbackId;
      if (!shipItemId) {
        throw new BadRequestException(
          'Order includes shipping. Set ZOHO_SHIPPING_ITEM_ID or ZOHO_FALLBACK_LINE_ITEM_ID to a Zoho Inventory item_id used for shipping lines.',
        );
      }
      this.logger.log(
        `Using Zoho item_id=${shipItemId} for shipping line (order ${order.orderId})`,
      );
      const singleLineCoversFullOrder =
        lines.length === 1 &&
        sub <= 0.01 &&
        Math.abs((lines[0].rate ?? 0) - tot) < 0.02;
      if (!singleLineCoversFullOrder) {
        lines.push({
          item_id: String(shipItemId).trim(),
          name: 'Shipping',
          quantity: 1,
          rate: ship,
          unit: 'qty',
        });
      }
    }

    if (lines.length === 0) {
      throw new BadRequestException(
        'Nothing to send to Zoho for this order (empty lines and zero total).',
      );
    }

    return lines;
  }

  /**
   * Re-run Zoho sales order + invoice for a paid order (admin / API retry).
   */
  async syncZohoForPaidOrder(
    orderMongoId: string,
    userId: string,
  ): Promise<{
    orderId: string;
    zohoSynced: boolean;
    zohoSalesOrderId: string | null;
    zohoInvoiceId: string | null;
  }> {
    const order = await this.ordersService.findOne(orderMongoId, userId);
    if ((order.payment_status ?? 'pending') !== 'success') {
      throw new BadRequestException(
        'Zoho invoice sync is only available after payment has succeeded.',
      );
    }
    if (order.zoho_sync_status === 'synced' && order.zoho_invoice_id) {
      return {
        orderId: order.orderId,
        zohoSynced: true,
        zohoSalesOrderId: order.zoho_salesorder_id ?? null,
        zohoInvoiceId: order.zoho_invoice_id,
      };
    }
    await this.waitForZohoInvoiceSyncLock(String(order._id));
    await this.runPostPaymentZohoSync(String(order._id));
    const refreshed = await this.ordersService.findOne(orderMongoId, userId);
    return {
      orderId: refreshed.orderId,
      zohoSynced: refreshed.zoho_sync_status === 'synced',
      zohoSalesOrderId: refreshed.zoho_salesorder_id ?? null,
      zohoInvoiceId: refreshed.zoho_invoice_id ?? null,
    };
  }

  /** Wait until another in-flight Zoho invoice sync for this order finishes (e.g. post-payment background job). */
  private async waitForZohoInvoiceSyncLock(
    orderMongoId: string,
    maxMs = 120_000,
  ): Promise<void> {
    const t0 = Date.now();
    while (this.zohoInvoiceSyncInFlight.has(orderMongoId)) {
      if (Date.now() - t0 > maxMs) {
        throw new BadRequestException(
          'Zoho invoice sync is still running for this order. Wait a moment and refresh.',
        );
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  @Cron('*/10 * * * *')
  async retryPendingZohoSyncs(): Promise<void> {
    const jobs = await this.zohoQueue.fetchRetryBatch(20);
    for (const job of jobs) {
      if (this.zohoInvoiceSyncInFlight.has(job.order_mongo_id)) {
        continue;
      }
      const order = await this.ordersService.findByMongoIdForSystem(
        job.order_mongo_id,
      );
      if (!order) {
        const { terminalFailure } = await this.zohoQueue.markRetry(
          job.order_id,
          'Order not found',
        );
        if (terminalFailure) {
          this.logger.error(`[Zoho] Queue job ${job.order_id} abandoned: order document missing`);
        }
        continue;
      }
      if ((order.payment_status ?? 'pending') !== 'success') {
        await this.zohoQueue.markRetry(
          job.order_id,
          'Payment is not successful; skipping retry',
        );
        continue;
      }
      this.zohoInvoiceSyncInFlight.add(job.order_mongo_id);
      try {
        this.logger.log(`[Zoho] Cron retry: syncing order ${order.orderId}`);
        const result = await this.runZohoSync(order);
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          result.salesOrderId,
          result.invoiceId,
          result.paymentId,
          'synced',
          null,
        );
        await this.zohoQueue.markSuccess(job.order_id, {
          salesOrderId: result.salesOrderId,
          invoiceId: result.invoiceId,
          paymentId: result.paymentId,
        });
        this.logger.log(
          `[Zoho] Cron retry succeeded for ${order.orderId} invoice_id=${result.invoiceId}`,
        );
      } catch (err) {
        const msg = truncateZohoErrorMessage(err);
        this.logger.error(
          `[Zoho] Cron sync failed for order ${order.orderId}: ${msg}`,
          err instanceof Error ? err.stack : undefined,
        );
        const { terminalFailure } = await this.zohoQueue.markRetry(job.order_id, msg);
        await this.ordersService.updateZohoSyncForOrder(
          String(order._id),
          order.zoho_salesorder_id ?? null,
          order.zoho_invoice_id ?? null,
          order.zoho_payment_id ?? null,
          terminalFailure ? 'failed' : 'pending',
          msg,
        );
      } finally {
        this.zohoInvoiceSyncInFlight.delete(job.order_mongo_id);
      }
    }
  }

  private async runZohoSync(
    order: OrderDocument,
  ): Promise<{ salesOrderId: string; invoiceId: string; paymentId: string | null }> {
    this.logger.log(`[Zoho] runZohoSync starting for order ${order.orderId}`);
    const lineItems = await this.resolveZohoLineItemsForPaidOrder(order);
    const user = await this.usersService.findOne(order.userId.toString());
    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('User email missing; cannot create Zoho customer');
    }

    const customerName = order.shippingAddress?.name?.trim() || 'Customer';
    const customerId = await this.zoho.ensureCustomerContact(
      customerName,
      email,
      'order',
    );

    const today = new Date().toISOString().slice(0, 10);

    const soBody = await this.zoho.createSalesOrder({
      customer_id: customerId,
      date: today,
      line_items: lineItems,
    }, 'order');
    const salesOrderId = extractZohoSalesOrderId(soBody);
    if (!salesOrderId) {
      throw new Error('Zoho sales order response missing salesorder_id');
    }

    const invBody = await this.zoho.createInvoice({
      customer_id: customerId,
      date: today,
      line_items: lineItems,
    }, 'order');
    const invoiceId = extractZohoInvoiceId(invBody);
    if (!invoiceId) {
      throw new Error('Zoho invoice response missing invoice_id');
    }

    const invRecord = invBody as Record<string, unknown>;
    const amountDue =
      extractZohoInvoiceAmountDue(invRecord) ?? Number(order.total);
    if (!Number.isFinite(amountDue) || amountDue < 0) {
      throw new Error('Could not determine invoice amount due from Zoho response');
    }
    const capture = Number(order.total);
    /** Never apply more than Razorpay captured or more than Zoho’s open balance. */
    const paymentAmount =
      capture > 0 ? Math.min(amountDue, capture) : amountDue;

    if (capture > 0 && amountDue + 0.01 < capture) {
      this.logger.warn(
        `Zoho invoice due (${amountDue}) is below Razorpay capture (${capture}) for ${order.orderId}. Applied ${paymentAmount}. Align shipping item, tax, and catalog rates with Zoho.`,
      );
    }
    if (capture > 0 && amountDue > capture + 0.02) {
      this.logger.warn(
        `Zoho invoice due (${amountDue}) exceeds Razorpay capture (${capture}) for ${order.orderId}. Recording ${paymentAmount}; remaining balance may stay open in Zoho.`,
      );
    }

    let paymentId: string | null = null;
    if (paymentAmount > 0) {
      try {
        const payBody = await this.zoho.recordCustomerPayment({
          customer_id: customerId,
          invoice_id: invoiceId,
          amount: paymentAmount,
          date: today,
          payment_mode: 'Razorpay',
        }, 'order');
        paymentId = extractZohoCustomerPaymentId(
          payBody as Record<string, unknown>,
        );
      } catch (err) {
        this.logger.error(
          `Zoho invoice ${invoiceId} was created but recording customer payment failed for order ${order.orderId}: ${
            err instanceof Error ? err.message : String(err)
          }. Invoice exists in Zoho; reconcile payment manually if needed.`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    } else if (capture > 0) {
      throw new BadRequestException(
        'Zoho invoice amount is 0 but the customer paid a non-zero total. Set ZOHO_FALLBACK_LINE_ITEM_ID and/or ZOHO_SHIPPING_ITEM_ID so invoice lines match the paid amount.',
      );
    }

    return { salesOrderId, invoiceId, paymentId };
  }
}
