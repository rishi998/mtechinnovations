import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { ZohoModule } from '../modules/zoho/zoho.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { RazorpayPaymentService } from './razorpay-payment.service';
import { RazorpayController } from './razorpay.controller';
import { OrdersPaymentController } from './orders-payment.controller';
import { ZohoOrder, ZohoOrderSchema } from './schemas/zoho-order.schema';
import { ZohoOrderQueueService } from './zoho-order-queue.service';
import { ZohoPaidInvoiceTriggerController } from './zoho-paid-invoice.controller';

@Module({
  imports: [
    OrdersModule,
    UsersModule,
    ZohoModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ZohoOrder.name, schema: ZohoOrderSchema },
    ]),
  ],
  controllers: [
    RazorpayController,
    OrdersPaymentController,
    ZohoPaidInvoiceTriggerController,
  ],
  providers: [RazorpayPaymentService, ZohoOrderQueueService],
  exports: [RazorpayPaymentService],
})
export class RazorpayModule {}
