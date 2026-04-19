import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoController } from './zoho.controller';
import { ZohoDebugController } from './zoho.debug.controller';
import { ZohoScopeLogger } from './zoho-scope-logger';
import {
  ZohoMongoTokenPersistence,
  ZohoTokenPersistence,
} from './zoho-token.persistence';
import { ZohoTokenState, ZohoTokenStateSchema } from './zoho-token.entity';
import { ZohoService } from './zoho.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: ZohoTokenState.name, schema: ZohoTokenStateSchema },
    ]),
  ],
  controllers: [ZohoController, ZohoDebugController],
  providers: [
    ZohoService,
    ZohoScopeLogger,
    {
      provide: ZohoTokenPersistence,
      useClass: ZohoMongoTokenPersistence,
    },
  ],
  exports: [ZohoService, ZohoTokenPersistence, ZohoScopeLogger],
})
export class ZohoModule {}
