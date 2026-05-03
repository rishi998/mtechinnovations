import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoController } from './zoho.controller';
import { ZohoDebugController } from './zoho.debug.controller';
import { ZohoApiBudgetService } from './zoho-api-budget.service';
import { ZohoApiUsage, ZohoApiUsageSchema } from './zoho-api-usage.entity';
import { ZohoScopeLogger } from './zoho-scope-logger';
import {
  ZohoMongoTokenPersistence,
  ZohoTokenPersistence,
} from './zoho-token.persistence';
import { ZohoTokenState, ZohoTokenStateSchema } from './zoho-token.entity';
import { ZohoService } from './zoho.service';
import { ZohoInvoiceService } from './services/zohoInvoiceService';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: ZohoTokenState.name, schema: ZohoTokenStateSchema },
      { name: ZohoApiUsage.name, schema: ZohoApiUsageSchema },
    ]),
  ],
  controllers: [ZohoController, ZohoDebugController],
  providers: [
    ZohoService,
    ZohoInvoiceService,
    ZohoApiBudgetService,
    ZohoScopeLogger,
    {
      provide: ZohoTokenPersistence,
      useClass: ZohoMongoTokenPersistence,
    },
  ],
  exports: [
    ZohoService,
    ZohoInvoiceService,
    ZohoApiBudgetService,
    ZohoTokenPersistence,
    ZohoScopeLogger,
  ],
})
export class ZohoModule {}
