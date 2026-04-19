import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { DebugController } from './debug.controller';
import { ZohoItemFlowDebugService } from './zoho-item-flow-debug.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [DebugController],
  providers: [ZohoItemFlowDebugService],
})
export class DebugModule {}
