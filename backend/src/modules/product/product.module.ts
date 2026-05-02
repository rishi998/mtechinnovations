import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoModule } from '../zoho/zoho.module';
import { ProductsModule } from '../../products/products.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CategoryCache, CategoryCacheSchema } from './category.entity';
import {
  ZohoSyncedProduct,
  ZohoSyncedProductSchema,
} from './product.entity';
import { ZohoSyncState, ZohoSyncStateSchema } from './zoho-sync-state.entity';

@Module({
  imports: [
    ZohoModule,
    ProductsModule,
    MongooseModule.forFeature([
      { name: ZohoSyncedProduct.name, schema: ZohoSyncedProductSchema },
      { name: CategoryCache.name, schema: CategoryCacheSchema },
      { name: ZohoSyncState.name, schema: ZohoSyncStateSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
