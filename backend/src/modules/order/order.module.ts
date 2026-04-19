import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../zoho/zoho.module';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import {
  ZohoSalesOrderRecord,
  ZohoSalesOrderRecordSchema,
} from './order.entity';

@Module({
  imports: [
    ZohoModule,
    MongooseModule.forFeature([
      { name: ZohoSalesOrderRecord.name, schema: ZohoSalesOrderRecordSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
