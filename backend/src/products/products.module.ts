import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../modules/zoho/zoho.module';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  ZohoImageCache,
  ZohoImageCacheSchema,
} from './schemas/zoho-image-cache.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    ZohoModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ZohoImageCache.name, schema: ZohoImageCacheSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
