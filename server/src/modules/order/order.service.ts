import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ZohoService } from '../zoho/zoho.service';
import { ZohoSyncedProduct, ZohoSyncedProductDocument } from '../product/product.entity';
import { CreateZohoOrderDto } from './dto/create-zoho-order.dto';
import {
  ZohoSalesOrderRecord,
  ZohoSalesOrderRecordDocument,
} from './order.entity';

function extractZohoSalesOrderId(data: Record<string, unknown>): string | null {
  const pick = (node: unknown): string | null => {
    if (node && typeof node === 'object' && node !== null) {
      const id = (node as Record<string, unknown>).salesorder_id;
      if (id != null && String(id) !== '') {
        return String(id);
      }
    }
    return null;
  };
  return (
    pick(data.sales_order) ??
    pick(data.salesorder) ??
    (data.salesorder_id != null && String(data.salesorder_id) !== ''
      ? String(data.salesorder_id)
      : null)
  );
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(ZohoSalesOrderRecord.name)
    private readonly orderModel: Model<ZohoSalesOrderRecordDocument>,
    @InjectModel(ZohoSyncedProduct.name)
    private readonly syncedProductModel: Model<ZohoSyncedProductDocument>,
    private readonly zoho: ZohoService,
  ) {}

  async createOrder(dto: CreateZohoOrderDto): Promise<{
    success: boolean;
    orderId: string;
    zohoSalesOrderId?: string | null;
    status: 'SYNCED' | 'FAILED';
    message?: string;
  }> {
    const lineInputs: {
      productId: Types.ObjectId;
      zoho_item_id: string;
      productName: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const row of dto.items) {
      const product = await this.syncedProductModel
        .findById(row.productId)
        .exec();

      if (!product) {
        throw new BadRequestException(
          `Synced product not found for productId=${row.productId}. Use a Zoho-synced product _id from GET /api/zoho/products.`,
        );
      }

      const zohoItemId = product.zoho_item_id?.trim();
      if (!zohoItemId) {
        throw new BadRequestException(
          `Product ${row.productId} has no zoho_item_id; run product sync first.`,
        );
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException(
          `Invalid price on synced product ${row.productId}.`,
        );
      }

      // Local `stock` can lag behind Zoho after sync; availability is enforced by Zoho on create.

      if (!/^\d+$/.test(zohoItemId)) {
        throw new BadRequestException(
          `Invalid zoho_item_id for product ${row.productId}; expected numeric Zoho item id string.`,
        );
      }

      lineInputs.push({
        productId: new Types.ObjectId(row.productId),
        zoho_item_id: zohoItemId,
        productName: product.name,
        quantity: row.quantity,
        price,
      });
    }

    const totalAmount = lineInputs.reduce(
      (sum, l) => sum + l.price * l.quantity,
      0,
    );

    const customerId = dto.zohoCustomerId?.trim()
      ? dto.zohoCustomerId.trim()
      : await this.zoho.ensureCustomerContact(
          dto.customerName,
          dto.customerEmail,
        );
    if (!customerId || !/^\d+$/.test(customerId)) {
      throw new Error('Invalid Zoho customer_id before creating sales order');
    }

    const doc = await this.orderModel.create({
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      items: lineInputs.map((l) => ({
        productId: l.productId,
        zoho_item_id: l.zoho_item_id,
        quantity: l.quantity,
        price: l.price,
      })),
      totalAmount,
      zoho_salesorder_id: null,
      status: 'PENDING',
      lastError: null,
    });

    const orderId = String(doc._id);

    const today = new Date().toISOString().slice(0, 10);
    const zohoPayload = {
      customer_id: customerId,
      date: today,
      line_items: lineInputs.map((l) => ({
        item_id: String(l.zoho_item_id).trim(),
        name: l.productName,
        quantity: l.quantity,
        rate: l.price,
        unit: 'qty',
      })),
    };

    this.logger.log(`Customer ID used: ${customerId}`);

    try {
      const zohoBody = await this.zoho.createSalesOrder(zohoPayload);
      const zohoSalesOrderId = extractZohoSalesOrderId(zohoBody);

      if (!zohoSalesOrderId) {
        const msg =
          'Zoho returned success but no salesorder_id; check API response shape.';
        this.logger.error(msg);
        await this.orderModel.findByIdAndUpdate(doc._id, {
          $set: { status: 'FAILED', lastError: msg },
        });
        return {
          success: false,
          orderId,
          status: 'FAILED',
          message: msg,
        };
      }

      await this.orderModel.findByIdAndUpdate(doc._id, {
        $set: {
          status: 'SYNCED',
          zoho_salesorder_id: zohoSalesOrderId,
          lastError: null,
        },
      });

      return {
        success: true,
        orderId,
        zohoSalesOrderId,
        status: 'SYNCED',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Order ${orderId} Zoho sync failed: ${msg}`);
      await this.orderModel.findByIdAndUpdate(doc._id, {
        $set: { status: 'FAILED', lastError: msg },
      });
      return {
        success: false,
        orderId,
        status: 'FAILED',
        message: msg,
      };
    }
  }

  async findAll(
    status?: string,
  ): Promise<Record<string, unknown>[]> {
    const allowed = ['PENDING', 'SYNCED', 'FAILED'];
    const filter =
      status && allowed.includes(status.toUpperCase())
        ? { status: status.toUpperCase() as 'PENDING' | 'SYNCED' | 'FAILED' }
        : {};

    const docs = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => d.toJSON() as Record<string, unknown>);
  }
}
