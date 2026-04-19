import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZohoTokenState,
  ZohoTokenStateDocument,
} from './zoho-token.entity';
import type { ZohoTokenBundle } from './zoho.types';

/**
 * Abstraction so production can swap in MongoDB/Redis/encrypted vault without changing ZohoService.
 */
export abstract class ZohoTokenPersistence {
  abstract save(bundle: ZohoTokenBundle): Promise<void>;
  abstract load(): Promise<ZohoTokenBundle | null>;
  abstract clear(): Promise<void>;
}

@Injectable()
export class ZohoInMemoryTokenPersistence extends ZohoTokenPersistence {
  private bundle: ZohoTokenBundle | null = null;

  async save(bundle: ZohoTokenBundle): Promise<void> {
    this.bundle = bundle;
  }

  async load(): Promise<ZohoTokenBundle | null> {
    return this.bundle;
  }

  async clear(): Promise<void> {
    this.bundle = null;
  }
}

@Injectable()
export class ZohoMongoTokenPersistence extends ZohoTokenPersistence {
  private static readonly DEFAULT_KEY = 'default';

  constructor(
    @InjectModel(ZohoTokenState.name)
    private readonly tokenModel: Model<ZohoTokenStateDocument>,
  ) {
    super();
  }

  async save(bundle: ZohoTokenBundle): Promise<void> {
    await this.tokenModel
      .findOneAndUpdate(
        { key: ZohoMongoTokenPersistence.DEFAULT_KEY },
        {
          $set: {
            accessToken: bundle.accessToken,
            refreshToken: bundle.refreshToken,
            expiresAt: bundle.expiresAt,
            grantedScope: bundle.grantedScope,
            apiDomain: bundle.apiDomain ?? null,
          },
          $setOnInsert: { key: ZohoMongoTokenPersistence.DEFAULT_KEY },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async load(): Promise<ZohoTokenBundle | null> {
    const doc = await this.tokenModel
      .findOne({ key: ZohoMongoTokenPersistence.DEFAULT_KEY })
      .exec();
    if (!doc) {
      return null;
    }
    return {
      accessToken: doc.accessToken,
      refreshToken: doc.refreshToken,
      expiresAt: doc.expiresAt,
      grantedScope: doc.grantedScope,
      ...(doc.apiDomain ? { apiDomain: doc.apiDomain } : {}),
    };
  }

  async clear(): Promise<void> {
    await this.tokenModel
      .deleteOne({ key: ZohoMongoTokenPersistence.DEFAULT_KEY })
      .exec();
  }
}
