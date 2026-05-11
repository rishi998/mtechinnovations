import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZohoTokenState,
  ZohoTokenStateDocument,
} from './zoho-token.entity';
import {
  joinGrantedScopesForStorage,
  parseZohoGrantedScopeList,
} from './zoho.config';
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
  /** Single canonical document key after OAuth redirect/callback persists tokens. */
  static readonly CANONICAL_KEY = 'Oho_oauth' as const;
  /** Older rows — migrated to {@link CANONICAL_KEY} on load or next save. */
  static readonly LEGACY_KEYS = ['default', 'zoho_oauth'] as const;

  private readonly logger = new Logger(ZohoMongoTokenPersistence.name);

  constructor(
    @InjectModel(ZohoTokenState.name)
    private readonly tokenModel: Model<ZohoTokenStateDocument>,
  ) {
    super();
  }

  private bundleFromDoc(doc: ZohoTokenStateDocument): ZohoTokenBundle {
    const rowScopes = Array.isArray(doc.grantedScopes)
      ? doc.grantedScopes.map((s) => String(s).trim()).filter((x) => x.length > 0)
      : [];
    const grantedScopes =
      rowScopes.length > 0
        ? Array.from(new Set(rowScopes))
        : parseZohoGrantedScopeList(doc.grantedScope);
    const grantedScope =
      grantedScopes.length > 0
        ? joinGrantedScopesForStorage(grantedScopes)
        : String(doc.grantedScope ?? '');
    return {
      accessToken: doc.accessToken,
      refreshToken: doc.refreshToken,
      expiresAt: doc.expiresAt,
      grantedScope,
      grantedScopes,
      ...(doc.apiDomain ? { apiDomain: doc.apiDomain } : {}),
    };
  }

  async save(bundle: ZohoTokenBundle): Promise<void> {
    const rt = String(bundle.refreshToken ?? '').trim();
    if (!rt) {
      throw new Error('Zoho refresh token missing after OAuth');
    }

    await this.tokenModel
      .updateOne(
        { key: ZohoMongoTokenPersistence.CANONICAL_KEY },
        {
          $set: {
            key: ZohoMongoTokenPersistence.CANONICAL_KEY,
            accessToken: bundle.accessToken,
            refreshToken: bundle.refreshToken,
            expiresAt: bundle.expiresAt,
            grantedScope: bundle.grantedScope,
            grantedScopes: bundle.grantedScopes,
            apiDomain: bundle.apiDomain ?? null,
          },
        },
        { upsert: true },
      )
      .exec();

    const removed = await this.tokenModel
      .deleteMany({ key: { $ne: ZohoMongoTokenPersistence.CANONICAL_KEY } })
      .exec();

    if (removed.deletedCount > 0) {
      this.logger.log(
        `[Zoho OAuth] Removed ${removed.deletedCount} extra zoho_oauth_tokens row(s); canonical key="${ZohoMongoTokenPersistence.CANONICAL_KEY}"`,
      );
    }

    this.logger.log(
      `[Zoho OAuth] OAuth document upserted (canonical key); refresh …${rt.slice(-8)}; grantedScopes count=${bundle.grantedScopes.length}`,
    );
  }

  async load(): Promise<ZohoTokenBundle | null> {
    let doc = await this.tokenModel
      .findOne({ key: ZohoMongoTokenPersistence.CANONICAL_KEY })
      .exec();

    if (!doc) {
      for (const legacyKey of ZohoMongoTokenPersistence.LEGACY_KEYS) {
        const legacy = await this.tokenModel
          .findOne({ key: legacyKey })
          .exec();
        if (!legacy) {
          continue;
        }
        this.logger.warn(
          `[Zoho OAuth] Migrating legacy token row key="${legacyKey}" → "${ZohoMongoTokenPersistence.CANONICAL_KEY}"`,
        );
        await this.save(this.bundleFromDoc(legacy));
        doc = await this.tokenModel
          .findOne({ key: ZohoMongoTokenPersistence.CANONICAL_KEY })
          .exec();
        break;
      }
    }

    if (!doc) {
      return null;
    }

    const rt = String(doc.refreshToken ?? '').trim();
    if (rt) {
      this.logger.debug(
        `[Zoho OAuth] Using refresh token from Mongo: …${rt.slice(-8)}`,
      );
    }

    return this.bundleFromDoc(doc);
  }

  async clear(): Promise<void> {
    await this.tokenModel.deleteMany({}).exec();
  }
}
