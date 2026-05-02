import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ZohoService } from '../zoho/zoho.service';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
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
    @InjectModel(Product.name)
    private readonly storefrontProductModel: Model<ProductDocument>,
    private readonly zoho: ZohoService,
  ) {}

  async createOrder(dto: CreateZohoOrderDto): Promise<{
    success: boolean;
    orderId: string;
    zohoSalesOrderId?: string | null;
    status: 'PENDING' | 'SYNCED' | 'FAILED';
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
      const product = await this.storefrontProductModel
        .findById(row.productId)
        .exec();

      if (!product) {
        throw new BadRequestException(
          `Storefront product not found for productId=${row.productId}. Use a product _id from GET /api/products.`,
        );
      }

      const zohoItemId = product.zoho_item_id?.trim();
      this.logger.log(
        `Product zoho_item_id: ${zohoItemId ?? '(missing)'} productId=${row.productId}`,
      );
      if (!zohoItemId) {
        throw new BadRequestException('Missing zoho_item_id');
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException(
          `Invalid price on product ${row.productId}.`,
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
    return {
      success: true,
      orderId,
      status: 'PENDING',
      message: 'Queued for background Zoho sync.',
    };
  }

  @Cron('*/10 * * * *')
  async processPendingSalesOrders(): Promise<void> {
    const docs = await this.orderModel
      .find({ status: 'PENDING' })
      .sort({ createdAt: 1 })
      .limit(20)
      .exec();
    for (const doc of docs) {
      const today = new Date().toISOString().slice(0, 10);
      const lineItems = doc.items.map((l) => ({
        item_id: String(l.zoho_item_id).trim(),
        name: 'Item',
        quantity: l.quantity,
        rate: l.price,
        unit: 'qty',
      }));
      try {
        const customerId = await this.zoho.ensureCustomerContact(
          doc.customerName,
          doc.customerEmail,
          'order',
        );
        const zohoPayload = {
          customer_id: customerId,
          date: today,
          line_items: lineItems,
        };
        const zohoBody = await this.zoho.createSalesOrder(zohoPayload, 'order');
        const zohoSalesOrderId = extractZohoSalesOrderId(zohoBody);
        if (!zohoSalesOrderId) {
          throw new Error(
            'Zoho returned success but no salesorder_id; check API response shape.',
          );
        }
        await this.orderModel.findByIdAndUpdate(doc._id, {
          $set: {
            status: 'SYNCED',
            zoho_salesorder_id: zohoSalesOrderId,
            lastError: null,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Order ${String(doc._id)} Zoho sync failed: ${msg}`);
        await this.orderModel.findByIdAndUpdate(doc._id, {
          $set: { status: 'FAILED', lastError: msg },
        });
      }
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
