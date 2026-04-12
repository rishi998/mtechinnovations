import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  OrderZohoSyncStatus,
} from './schemas/order.schema';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items?.length) {
      throw new BadRequestException('Cart is empty');
    }
    const orderId =
      'ORD' +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const subtotal = cart.items.reduce((sum: number, i: any) => {
      const product = i.productId as any;
      const price = product?.price ?? 0;
      return sum + price * i.quantity;
    }, 0);
    const shipping = subtotal >= 999 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax - (dto.discount ?? 0);

    const orderItems = cart.items.map((i: any) => {
      const product = i.productId as any;
      const price = product?.price ?? 0;
      return {
        productId: product?._id || i.productId,
        quantity: i.quantity,
        price,
      };
    });

    const order = await this.orderModel.create({
      orderId,
      userId: this.toObjectId(userId),
      status: 'pending',
      subtotal,
      discount: dto.discount ?? 0,
      tax,
      shipping,
      total,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod ?? 'card',
      items: orderItems,
    });

    await this.cartService.clearCart(userId);
    return this.findOne(String(order._id), userId);
  }

  async findAllByUser(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ userId: this.toObjectId(userId) })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(
    orderId: string,
    userId: string,
    adminOk = false,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!adminOk && order.userId.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findOneByOrderId(
    orderIdStr: string,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ orderId: orderIdStr })
      .populate('items.productId')
      .exec();
    if (!order || order.userId.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    isAdmin: boolean,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!isAdmin) {
      throw new NotFoundException('Order not found');
    }
    order.status = dto.status as OrderStatus;
    if (dto.trackingId !== undefined) {
      order.trackingId = dto.trackingId;
    }
    await order.save();
    return order;
  }

  async setPaymentId(orderId: string, paymentId: string): Promise<void> {
    await this.orderModel
      .updateOne({ _id: new Types.ObjectId(orderId) }, { paymentId })
      .exec();
  }

  async setOrderPaid(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { status: 'processing' },
        { new: true },
      )
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<OrderDocument | null> {
    return this.orderModel
      .findOne({ razorpay_order_id: razorpayOrderId })
      .populate('items.productId')
      .exec();
  }

  async attachRazorpayOrderId(
    orderMongoId: string,
    userId: string,
    razorpayOrderId: string,
  ): Promise<OrderDocument> {
    const order = await this.findOne(orderMongoId, userId);
    if (order.status !== 'pending') {
      throw new BadRequestException('Order cannot be paid');
    }
    if (order.payment_status === 'success') {
      throw new BadRequestException('Order already paid');
    }
    order.razorpay_order_id = razorpayOrderId;
    await order.save();
    return order;
  }

  async applyVerifiedRazorpayPayment(input: {
    orderMongoId: string;
    razorpayPaymentId: string;
    zohoSalesOrderId: string | null;
    zohoInvoiceId: string | null;
    zohoSyncStatus: OrderZohoSyncStatus;
  }): Promise<OrderDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        input.orderMongoId,
        {
          $set: {
            payment_status: 'success',
            razorpay_payment_id: input.razorpayPaymentId,
            paymentId: input.razorpayPaymentId,
            zoho_salesorder_id: input.zohoSalesOrderId,
            zoho_invoice_id: input.zohoInvoiceId,
            zoho_sync_status: input.zohoSyncStatus,
            status: 'processing',
          },
        },
        { new: true },
      )
      .populate('items.productId')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async markPaymentFailedForRazorpayOrder(razorpayOrderId: string): Promise<void> {
    await this.orderModel
      .updateMany(
        {
          razorpay_order_id: razorpayOrderId,
          payment_status: { $ne: 'success' },
        },
        { $set: { payment_status: 'failed' } },
      )
      .exec();
  }

  async updateZohoSyncForOrder(
    orderMongoId: string,
    zohoSalesOrderId: string | null,
    zohoInvoiceId: string | null,
    zohoSyncStatus: OrderZohoSyncStatus,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderMongoId,
        {
          $set: {
            zoho_salesorder_id: zohoSalesOrderId,
            zoho_invoice_id: zohoInvoiceId,
            zoho_sync_status: zohoSyncStatus,
          },
        },
        { new: true },
      )
      .populate('items.productId')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
