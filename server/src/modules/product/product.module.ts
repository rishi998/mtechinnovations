import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../zoho/zoho.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductSchema,
} from './product.entity';

@Module({
  imports: [
    ZohoModule,
    MongooseModule.forFeature([
      { name: ZohoSyncedProduct.name, schema: ZohoSyncedProductSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
