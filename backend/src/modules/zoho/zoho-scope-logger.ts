import { Injectable, Logger } from '@nestjs/common';

/**
 * Bonus: audit trail of which scope string was requested or active for a flow.
 * Never log access_token / refresh_token — only scope labels.
 */
@Injectable()
export class ZohoScopeLogger {
  private readonly logger = new Logger(ZohoScopeLogger.name);

  logOAuthStep(step: string, scopeString: string): void {
    this.logger.log(`[${step}] scope parameter: ${scopeString}`);
  }

  logApiRequest(label: string, activeScopeSummary: string): void {
    this.logger.debug(`[${label}] token granted scopes (summary): ${activeScopeSummary}`);
  }
}
