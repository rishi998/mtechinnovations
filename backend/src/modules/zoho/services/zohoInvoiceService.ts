import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZohoOAuthException } from '../zoho.exceptions';
import type { ZohoApiUsageChannel } from '../zoho-api-usage.entity';
import type { ZohoCreateSalesOrderLineItem } from '../zoho-inventory-salesorder.types';
import { resolveIndiaPlaceOfSupplyCode } from '../india-place-of-supply';
import { ZohoService } from '../zoho.service';

function parseZohoEnvId(raw: string | undefined | null): string | null {
  if (raw == null) {
    return null;
  }
  let s = String(raw).trim();
  if (s === '') {
    return null;
  }
  s = s.split('#')[0].trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || null;
}

function normalizeStateLabel(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function extractInvoiceNode(data: Record<string, unknown>): Record<string, unknown> | null {
  const inv = data.invoice;
  if (inv && typeof inv === 'object') {
    return inv as Record<string, unknown>;
  }
  return null;
}

function extractZohoInvoiceId(data: Record<string, unknown>): string | null {
  const inv = extractInvoiceNode(data);
  if (inv) {
    const id = inv.invoice_id;
    if (id != null && String(id) !== '') {
      return String(id).trim();
    }
  }
  if (data.invoice_id != null && String(data.invoice_id) !== '') {
    return String(data.invoice_id).trim();
  }
  return null;
}

function extractZohoInvoiceAmountDue(data: Record<string, unknown>): number | null {
  const inv = extractInvoiceNode(data);
  if (!inv) {
    return null;
  }
  const pick = (v: unknown): number | null => {
    if (v == null) return null;
    const n = typeof v === 'string' ? parseFloat(v.trim()) : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return pick(inv.balance) ?? pick(inv.balance_due) ?? pick(inv.total);
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

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export interface ZohoPaidInvoiceLifecycleInput {
  storefrontOrderId: string;
  customerId: string;
  customerEmail: string;
  lineItems: ZohoCreateSalesOrderLineItem[];
  invoiceDate: string;
  razorpayCaptureAmount: number;
  paymentMode?: string;
  shippingState: string;
  shippingPincode?: string | null;
}

export interface ZohoPaidInvoiceLifecycleResult {
  invoiceId: string;
  paymentId: string | null;
  /** Lowercase Zoho invoice status after verification. */
  finalInvoiceStatus: string;
}

/**
 * Isolated Zoho Inventory invoice workflow: create → sent → pay → verify → internal notify → email.
 * Invoked from {@link RazorpayPaymentService} post-payment sync (not from the payment gateway itself).
 */
@Injectable()
export class ZohoInvoiceService {
  private readonly logger = new Logger(ZohoInvoiceService.name);

  constructor(
    private readonly zoho: ZohoService,
    private readonly config: ConfigService,
  ) {}

  /** Preflight: items exist in Zoho Inventory and are Active. */
  async validateLineItemsActive(
    lines: ZohoCreateSalesOrderLineItem[],
    channel: ZohoApiUsageChannel,
  ): Promise<void> {
    for (const li of lines) {
      const id = String(li.item_id ?? '').trim();
      if (!/^\d+$/.test(id)) {
        throw new BadRequestException(`Invalid Zoho item_id on line: ${id}`);
      }
      try {
        const snap = await this.zoho.fetchInventoryItemDebugSnapshot(id, channel);
        const st = String(snap.status ?? '').trim().toLowerCase();
        if (st && st !== 'active') {
          throw new BadRequestException(
            `Zoho item ${id} is not active (status=${snap.status})`,
          );
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(
          `Could not validate Zoho item ${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private isIntraStateShipment(shipStateRaw: string, shipPincode?: string | null): boolean {
    const orgRaw =
      this.config.get<string>('ZOHO_ORG_REGISTERED_STATE') ??
      this.config.get<string>('ZOHO_ORG_STATE') ??
      '';

    const orgCode = resolveIndiaPlaceOfSupplyCode(orgRaw);
    const shipCode = resolveIndiaPlaceOfSupplyCode(shipStateRaw, shipPincode);
    if (orgCode && shipCode) {
      return orgCode === shipCode;
    }

    const org = normalizeStateLabel(orgRaw);
    const ship = normalizeStateLabel(shipStateRaw);
    if (!org || !ship) {
      this.logger.warn(
        '[ZohoInvoice] ZOHO_ORG_REGISTERED_STATE unset or empty shipping state — defaulting to intra-state GST tax selection when only one tax env is set',
      );
      return true;
    }
    return ship === org || ship.includes(org) || org.includes(ship);
  }

  /**
   * Resolves a mandatory numeric Zoho `tax_id` for GST lines.
   * Prefer `ZOHO_GST_LINE_TAX_ID_INTRA` / `ZOHO_GST_LINE_TAX_ID_INTER` when both org + ship state known;
   * else `ZOHO_SALES_ORDER_LINE_TAX_ID`; else first default tax from Zoho settings.
   */
  async resolveMandatoryTaxId(
    shippingState: string,
    channel: ZohoApiUsageChannel,
    shippingPincode?: string | null,
  ): Promise<string> {
    const intra = parseZohoEnvId(this.config.get<string>('ZOHO_GST_LINE_TAX_ID_INTRA'));
    const inter = parseZohoEnvId(this.config.get<string>('ZOHO_GST_LINE_TAX_ID_INTER'));
    const legacy = parseZohoEnvId(this.config.get<string>('ZOHO_SALES_ORDER_LINE_TAX_ID'));

    const isIntra = this.isIntraStateShipment(shippingState, shippingPincode);
    let chosen =
      (isIntra ? intra : inter) ??
      legacy ??
      intra ??
      inter;

    if (!chosen) {
      const taxes = await this.zoho.listInventoryTaxes();
      const fallbackTax =
        taxes.find((t) => t.is_default_tax === true) ??
        taxes.find((t) => Number.isFinite(t.tax_percentage) && t.tax_percentage > 0) ??
        taxes[0];
      const id = String(fallbackTax?.tax_id ?? '').trim();
      if (!id) {
        throw new ZohoOAuthException(
          'No tax_id could be resolved. Set ZOHO_GST_LINE_TAX_ID_INTRA / ZOHO_GST_LINE_TAX_ID_INTER or ZOHO_SALES_ORDER_LINE_TAX_ID, or ensure Zoho organization has taxes.',
        );
      }
      chosen = id;
      this.logger.warn(
        `[ZohoInvoice] Using Zoho settings fallback tax_id=${chosen} (configure env GST tax ids for stable intra/inter behavior)`,
      );
    }

    await this.ensureTaxIdExistsInZoho(chosen, channel);

    this.logger.log(
      `[ZohoInvoice] tax_id resolved: ${chosen} intra_state_supply=${isIntra} shipment_state=${JSON.stringify(shippingState)}`,
    );
    return chosen;
  }

  private async ensureTaxIdExistsInZoho(taxId: string, channel: ZohoApiUsageChannel): Promise<void> {
    const taxes = await this.zoho.listInventoryTaxes().catch(() => []);
    const hit = taxes.find((t) => String(t.tax_id).trim() === taxId.trim());
    if (!hit && taxes.length > 0) {
      throw new ZohoOAuthException(
        `tax_id ${taxId} was not returned by GET /settings/taxes for this organization.`,
      );
    }
    if (!hit && taxes.length === 0) {
      this.logger.warn(
        `[ZohoInvoice] Could not list taxes to validate tax_id=${taxId}; proceeding (requires ZohoInventory.settings.READ)`,
      );
    }
  }

  augmentLinesWithTax(
    lines: ZohoCreateSalesOrderLineItem[],
    taxId: string,
  ): ZohoCreateSalesOrderLineItem[] {
    const t = String(taxId).trim();
    if (!t) throw new BadRequestException('Resolved tax_id is empty');
    return lines.map((li) => ({ ...li, tax_id: t }));
  }

  placeOfSupplyFromOrderShipment(
    shippingState: string,
    shippingPincode?: string | null,
  ): string {
    const override = String(this.config.get<string>('ZOHO_INVOICE_PLACE_OF_SUPPLY') ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
    if (/^[A-Z]{2}$/.test(override)) {
      return override;
    }

    const code = resolveIndiaPlaceOfSupplyCode(shippingState, shippingPincode);
    if (code) {
      this.logger.log(
        `[ZohoInvoice] place_of_supply=${code} resolved from ${JSON.stringify({ state: shippingState, pin: shippingPincode ?? null })}`,
      );
      return code;
    }

    this.logger.warn(
      `[ZohoInvoice] Could not resolve place_of_supply for ${JSON.stringify({
        state: shippingState,
        pin: shippingPincode ?? null,
      })} — omitting field so Zoho can use organization/customer defaults`,
    );
    return '';
  }

  async createInvoice(
    input: {
      customerId: string;
      date: string;
      lineItems: ZohoCreateSalesOrderLineItem[];
      placeOfSupply: string;
    },
    channel: ZohoApiUsageChannel,
  ): Promise<Record<string, unknown>> {
    const payloadPreview = {
      customer_id: input.customerId,
      date: input.date,
      line_item_count: input.lineItems.length,
      item_ids: input.lineItems.map((l) => l.item_id),
      tax_ids: input.lineItems.map((l) => l.tax_id),
      place_of_supply: input.placeOfSupply,
    };
    this.logger.log(`[ZohoInvoice] createInvoice payload preview: ${JSON.stringify(payloadPreview)}`);

    const invBody = await this.zoho.createInvoice(
      {
        customer_id: input.customerId,
        date: input.date,
        line_items: input.lineItems,
        place_of_supply: input.placeOfSupply || undefined,
        line_items_have_final_tax_ids: true,
      },
      channel,
    );

    const invoiceId = extractZohoInvoiceId(invBody as Record<string, unknown>);
    if (!invoiceId) {
      throw new Error('Zoho invoice response missing invoice_id');
    }
    this.logger.log(`[ZohoInvoice] created invoice_id=${invoiceId}`);
    return invBody as Record<string, unknown>;
  }

  async sendInvoice(
    invoiceId: string,
    channel: ZohoApiUsageChannel,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`[ZohoInvoice] mark invoice sent invoice_id=${invoiceId}`);
    return this.zoho.markInvoiceSent(invoiceId, channel);
  }

  async recordPayment(
    input: {
      customerId: string;
      invoiceId: string;
      amount: number;
      date: string;
      paymentMode: string;
    },
    channel: ZohoApiUsageChannel,
  ): Promise<Record<string, unknown>> {
    const amt = Number(input.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Payment amount must be > 0 for Zoho customer payment');
    }
    const normalized = Math.round(amt * 100) / 100;
    this.logger.log(
      `[ZohoInvoice] recordPayment payload invoice_id=${input.invoiceId} amount=${normalized} payment_mode=${input.paymentMode}`,
    );

    const payBody = await this.zoho.recordCustomerPayment(
      {
        customer_id: input.customerId,
        invoice_id: input.invoiceId,
        amount: normalized,
        date: input.date,
        payment_mode: input.paymentMode,
      },
      channel,
    );

    const paymentId = extractZohoCustomerPaymentId(payBody as Record<string, unknown>);
    if (paymentId) {
      this.logger.log(`[ZohoInvoice] payment_id=${paymentId}`);
    } else {
      this.logger.warn(`[ZohoInvoice] Customer payment succeeded but payment_id missing in response`);
    }
    return payBody as Record<string, unknown>;
  }

  async verifyInvoicePaid(
    invoiceId: string,
    channel: ZohoApiUsageChannel,
  ): Promise<{ status: string; balance: number; raw: Record<string, unknown> }> {
    const attempts = Number(this.config.get<string>('ZOHO_INVOICE_VERIFY_RETRIES') ?? '4') || 4;
    const delayMs = Number(this.config.get<string>('ZOHO_INVOICE_VERIFY_DELAY_MS') ?? '1500') || 1500;

    let last: Record<string, unknown> | null = null;
    for (let i = 0; i < attempts; i++) {
      if (i > 0) {
        await sleep(delayMs);
      }
      const data = await this.zoho.getInvoice(invoiceId, channel);
      last = data;
      const inv = extractInvoiceNode(data);
      if (!inv) {
        continue;
      }
      const status = String(inv.status ?? '').trim().toLowerCase();
      const balRaw = inv.balance ?? inv.balance_due;
      const balance =
        typeof balRaw === 'string'
          ? parseFloat(balRaw.trim())
          : Number(balRaw ?? NaN);

      const paymentSignals = (): boolean => {
        if (Array.isArray(inv.payments) && inv.payments.length > 0) {
          return true;
        }
        if (Array.isArray(inv.payment_history) && inv.payment_history.length > 0) {
          return true;
        }
        const pm = Number(inv.payment_made ?? 0);
        if (Number.isFinite(pm) && pm > 0.009) {
          return true;
        }
        const lpd = String(inv.last_payment_date ?? '').trim();
        return Boolean(lpd && lpd !== '' && !/^[\s:]+$/.test(lpd));
      };

      const hasPayment = paymentSignals();
      const paidLike = balance <= 0.02 && status === 'paid';

      if (paidLike && hasPayment) {
        this.logger.log(
          `[ZohoInvoice] verified invoice_id=${invoiceId} status=${status} balance=${balance} has_payment_records=${hasPayment}`,
        );
        return { status, balance: Number.isFinite(balance) ? balance : 0, raw: last };
      }
    }

    const invLast = last ? extractInvoiceNode(last) : null;
    const endStatus = String(invLast?.status ?? '').toLowerCase();
    const balanceLast = extractZohoInvoiceAmountDue(last ?? {}) ?? -1;

    throw new BadRequestException(
      `Invoice ${invoiceId} did not reach a settled Paid state (status=${endStatus ?? 'unknown'}, balance≈${balanceLast}).`,
    );
  }

  async sendInvoiceEmail(
    invoiceId: string,
    customerEmail: string,
    opts: { optionalMessage?: string | null },
    channel: ZohoApiUsageChannel,
  ): Promise<Record<string, unknown>> {
    const to = customerEmail.trim().toLowerCase();
    if (!to) {
      throw new BadRequestException('Cannot email invoice — customer email is empty');
    }
    const body = await this.zoho.emailInvoice(
      {
        invoiceId,
        to_mail_ids: [to],
        subject: `Invoice for your order`,
        body:
          opts.optionalMessage?.trim() ||
          'Thank you for your purchase. Your payment was received; please find your invoice attached.',
        send_attachment: true,
      },
      channel,
    );
    this.logger.log(`[ZohoInvoice] invoice email queued/sent for invoice_id=${invoiceId} to=${to}`);
    return body as Record<string, unknown>;
  }

  private emitSettlementNotification(
    input: ZohoPaidInvoiceLifecycleInput,
    invoiceId: string,
  ): void {
    try {
      this.logger.log(
        `[Zoho NOTIFY:invoice-settled] ${JSON.stringify({
          event: 'zoho_invoice_fully_settled',
          storefrontOrderId: input.storefrontOrderId,
          invoice_id: invoiceId,
          invoiceDate: input.invoiceDate,
        })}`,
      );
    } catch {
      /* ignore */
    }
  }

  /**
   * End-to-end: validate items + tax → invoice → Sent → Customer payment → verify Paid → notify → email.
   */
  async runPaidInvoiceLifecycle(
    input: ZohoPaidInvoiceLifecycleInput,
    deps: {
      salesOrderId: string;
      /**
       * Persist Zoho IDs after the invoice is Paid in Zoho but before the customer invoice email is sent.
       */
      persistSettlement: (ctx: {
        salesOrderId: string;
        invoiceId: string;
        paymentId: string | null;
      }) => Promise<void>;
    },
    channel: ZohoApiUsageChannel = 'order',
  ): Promise<ZohoPaidInvoiceLifecycleResult> {
    await this.validateLineItemsActive(input.lineItems, channel);
    const taxId = await this.resolveMandatoryTaxId(
      input.shippingState,
      channel,
      input.shippingPincode,
    );
    const taxedLines = this.augmentLinesWithTax(input.lineItems, taxId);
    const place = this.placeOfSupplyFromOrderShipment(
      input.shippingState,
      input.shippingPincode,
    );

    const soId = String(deps.salesOrderId ?? '').trim();
    if (/^\d+$/.test(soId)) {
      try {
        let alreadyConfirmed = false;
        try {
          const soRaw = await this.zoho.getSalesOrder(soId, channel);
          const node = soRaw.salesorder;
          if (node && typeof node === 'object') {
            const st = String((node as Record<string, unknown>).status ?? '')
              .trim()
              .toLowerCase();
            if (st === 'confirmed') {
              alreadyConfirmed = true;
            }
          }
        } catch {
          /* e.g. missing salesorders.READ — still attempt confirm */
        }
        if (!alreadyConfirmed) {
          await this.zoho.confirmSalesOrder(soId, channel);
        }
        this.logger.log(`[Zoho] Sales order confirmed: ${soId}`);
      } catch (err) {
        this.logger.error('[Zoho] Failed to confirm sales order', err);
      }
    } else {
      this.logger.warn(
        `[ZohoInvoice] Skipping sales order confirm — invalid salesOrderId ${JSON.stringify(deps.salesOrderId)}`,
      );
    }

    const invBody = await this.createInvoice(
      {
        customerId: input.customerId,
        date: input.invoiceDate,
        lineItems: taxedLines,
        placeOfSupply: place,
      },
      channel,
    );

    const invoiceId =
      extractZohoInvoiceId(invBody as Record<string, unknown>) ?? '';
    if (!invoiceId || !/^\d+$/.test(invoiceId)) {
      throw new Error('invoice_id missing after createInvoice');
    }

    await this.sendInvoice(invoiceId, channel);

    const amountDue =
      extractZohoInvoiceAmountDue(invBody as Record<string, unknown>) ??
      Number(input.razorpayCaptureAmount);

    const capture = Number(input.razorpayCaptureAmount);
    if (!Number.isFinite(amountDue) || amountDue < 0) {
      throw new Error('Could not determine invoice balance from Zoho create response');
    }

    let paymentAmount = amountDue;
    if (capture > 0 && Number.isFinite(capture)) {
      paymentAmount = Math.min(amountDue, capture);
    }

    let paymentId: string | null = null;
    if (paymentAmount > 0.005) {
      const payRaw = await this.recordPayment(
        {
          customerId: input.customerId,
          invoiceId,
          amount: paymentAmount,
          date: input.invoiceDate,
          paymentMode: input.paymentMode ?? 'Razorpay',
        },
        channel,
      );
      paymentId =
        extractZohoCustomerPaymentId(payRaw as Record<string, unknown>) ?? paymentId;
    } else if (capture > 0.02) {
      throw new BadRequestException(
        'Invoice total is effectively zero but the customer paid a non-zero Razorpay capture; fix Zoho line items/rates.',
      );
    }

    const verified = await this.verifyInvoicePaid(invoiceId, channel);

    await deps.persistSettlement({
      salesOrderId: deps.salesOrderId,
      invoiceId,
      paymentId,
    });

    this.emitSettlementNotification(input, invoiceId);

    await this.sendInvoiceEmail(
      invoiceId,
      input.customerEmail,
      { optionalMessage: null },
      channel,
    );

    this.logger.log(
      `[ZohoInvoice] lifecycle complete invoice_id=${invoiceId} payment_id=${paymentId ?? '(none)'} final_status=${verified.status} balance=${verified.balance}`,
    );

    return {
      invoiceId,
      paymentId,
      finalInvoiceStatus: verified.status,
    };
  }
}
