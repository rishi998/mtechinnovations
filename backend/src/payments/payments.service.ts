import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { randomUUID } from 'crypto';

// In production, replace with real payment provider (Razorpay, Stripe, etc.)
const PAYMENT_STORE = new Map<string, { orderId: string; amount: number; userId: string }>();

@Injectable()
export class PaymentsService {
  constructor(private readonly ordersService: OrdersService) {}

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const order = await this.ordersService.findOne(dto.orderId, userId);
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is already paid or cancelled');
    }
    const paymentId = 'pay_' + randomUUID().replace(/-/g, '');
    const orderIdStr = String((order as any)._id);
    PAYMENT_STORE.set(paymentId, {
      orderId: orderIdStr,
      amount: order.total,
      userId,
    });
    await this.ordersService.setPaymentId(orderIdStr, paymentId);
    return {
      paymentId,
      amount: order.total,
      currency: 'INR',
      orderId: order.orderId,
      // In production: paymentGatewayUrl or clientSecret for client-side SDK
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const stored = PAYMENT_STORE.get(dto.paymentId);
    if (!stored) {
      throw new NotFoundException('Payment not found');
    }
    if (stored.userId !== userId) {
      throw new BadRequestException('Invalid payment');
    }
    const order = await this.ordersService.setOrderPaid(stored.orderId);
    PAYMENT_STORE.delete(dto.paymentId);
    return {
      success: true,
      orderId: order.orderId,
      status: order.status,
    };
  }
}
