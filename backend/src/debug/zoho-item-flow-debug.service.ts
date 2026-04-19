import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { orderLineStorefrontProductId } from '../orders/utils/order-line-product-id';
import type { ZohoCreateSalesOrderLineItem } from '../modules/zoho/zoho-inventory-salesorder.types';

function isLikelyMongoId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

@Injectable()
export class ZohoItemFlowDebugService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async inspectOrder(orderKey: string): Promise<{
    products: Array<{
      productId: string;
      name: string | null;
      sku: string | null;
      zoho_item_id: string | null;
    }>;
    zoho_item_ids: string[];
    line_items: ZohoCreateSalesOrderLineItem[];
    isValid: boolean;
  }> {
    const trimmed = orderKey.trim();
    const order = isLikelyMongoId(trimmed)
      ? await this.orderModel
          .findById(new Types.ObjectId(trimmed))
          .populate('items.productId')
          .exec()
      : await this.orderModel
          .findOne({ orderId: trimmed })
          .populate('items.productId')
          .exec();

    if (!order) {
      throw new NotFoundException(`Order not found for key: ${trimmed}`);
    }

    const products: Array<{
      productId: string;
      name: string | null;
      sku: string | null;
      zoho_item_id: string | null;
    }> = [];

    const line_items: ZohoCreateSalesOrderLineItem[] = [];
    let isValid = true;

    for (const row of order.items) {
      const pid = orderLineStorefrontProductId(row.productId);
      const doc = await this.productModel.findById(pid).exec();
      const zid = doc?.zoho_item_id?.trim() ?? null;
      products.push({
        productId: pid,
        name: doc?.name ?? null,
        sku: doc?.sku ?? null,
        zoho_item_id: zid,
      });

      if (!zid || typeof zid !== 'string' || !/^\d+$/.test(zid)) {
        isValid = false;
        line_items.push({
          item_id: zid ?? '',
          name: doc?.name?.trim() || 'Item',
          quantity: row.quantity,
          rate: row.price,
          unit: 'qty',
        });
        continue;
      }

      line_items.push({
        item_id: String(zid).trim(),
        name: doc?.name?.trim() || 'Item',
        quantity: row.quantity,
        rate: row.price,
        unit: 'qty',
      });
    }

    const zoho_item_ids = products
      .map((p) => p.zoho_item_id)
      .filter((x): x is string => typeof x === 'string' && x.length > 0);

    return { products, zoho_item_ids, line_items, isValid };
  }
}
