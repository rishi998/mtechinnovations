import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../zoho/zoho.module';
import { ProductsModule } from '../../products/products.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductSchema,
} from './product.entity';

@Module({
  imports: [
    ZohoModule,
    ProductsModule,
    MongooseModule.forFeature([
      { name: ZohoSyncedProduct.name, schema: ZohoSyncedProductSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
