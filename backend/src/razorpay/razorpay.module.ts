import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { ZohoModule } from '../modules/zoho/zoho.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { RazorpayPaymentService } from './razorpay-payment.service';
import { RazorpayController } from './razorpay.controller';
import { OrdersPaymentController } from './orders-payment.controller';

@Module({
  imports: [
    OrdersModule,
    UsersModule,
    ZohoModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [RazorpayController, OrdersPaymentController],
  providers: [RazorpayPaymentService],
  exports: [RazorpayPaymentService],
})
export class RazorpayModule {}
