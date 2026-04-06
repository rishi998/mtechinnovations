import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZohoController } from './zoho.controller';
import { ZohoDebugController } from './zoho.debug.controller';
import { ZohoScopeLogger } from './zoho-scope-logger';
import {
  ZohoInMemoryTokenPersistence,
  ZohoTokenPersistence,
} from './zoho-token.persistence';
import { ZohoService } from './zoho.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ZohoController, ZohoDebugController],
  providers: [
    ZohoService,
    ZohoScopeLogger,
    {
      provide: ZohoTokenPersistence,
      useClass: ZohoInMemoryTokenPersistence,
    },
  ],
  exports: [ZohoService, ZohoTokenPersistence, ZohoScopeLogger],
})
export class ZohoModule {}
