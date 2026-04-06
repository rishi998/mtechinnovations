import { Injectable } from '@nestjs/common';
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
