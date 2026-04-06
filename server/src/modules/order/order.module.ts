import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../zoho/zoho.module';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductSchema,
} from '../product/product.entity';
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
      { name: ZohoSyncedProduct.name, schema: ZohoSyncedProductSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
