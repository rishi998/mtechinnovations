/**
 * @nestjs/schedule v6 uses global `crypto.randomUUID()` (Node 19+). Node 18 LTS has no global `crypto`;
 * polyfill so cron/interval registration does not throw at startup.
 */
import { webcrypto } from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as unknown as Crypto;
}
