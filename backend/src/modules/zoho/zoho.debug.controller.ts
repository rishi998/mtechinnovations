import { Controller, Get, Logger, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ZohoApiBudgetService } from './zoho-api-budget.service';
import { ZohoService } from './zoho.service';
import { ZohoOAuthException } from './zoho.exceptions';

function mapZohoTestError(err: unknown): {
  success: false;
  message: string;
  details: string;
} {
  const details = err instanceof Error ? err.message : String(err);
  if (err instanceof ZohoOAuthException) {
    const lower = details.toLowerCase();
    if (
      lower.includes('token') ||
      lower.includes('refresh') ||
      lower.includes('oauth') ||
      lower.includes('zoho token error') ||
      lower.includes('failed to reach zoho token')
    ) {
      return {
        success: false,
        message: 'Failed to generate Zoho access token',
        details,
      };
    }
  }
  return {
    success: false,
    message: 'Zoho API error',
    details,
  };
}

/**
 * Postman / debugging routes (global prefix `api`):
 *   GET  /api/zoho/debug/token
 *   GET  /api/zoho/debug/items
 *   GET  /api/zoho/debug/taxes
 *   GET  /api/zoho/debug/health
 *   GET  /api/zoho/debug/usage
 *   POST /api/zoho/debug/reset-token
 */
@Controller('zoho/debug')
export class ZohoDebugController {
  private readonly logger = new Logger(ZohoDebugController.name);

  constructor(
    private readonly zoho: ZohoService,
    private readonly budget: ZohoApiBudgetService,
  ) {}

  @Get('token')
  async getTokenProbe() {
    const requestId = randomUUID();
    const started = Date.now();
    this.logger.log(`[${requestId}] GET zoho/debug/token started`);
    try {
      const { expiresIn, isCached } = await this.zoho.probeAccessToken();
      this.logger.log(
        `[${requestId}] GET zoho/debug/token ok in ${Date.now() - started}ms`,
      );
      return {
        success: true,
        expiresIn,
        isCached,
      };
    } catch (err) {
      this.logger.warn(
        `[${requestId}] GET zoho/debug/token failed: ${err instanceof Error ? err.message : err}`,
      );
      return { ...mapZohoTestError(err), requestId };
    }
  }

  @Get('taxes')
  async getTaxes() {
    const requestId = randomUUID();
    const started = Date.now();
    this.logger.log(`[${requestId}] GET zoho/debug/taxes started`);
    try {
      const taxes = await this.zoho.listInventoryTaxes();
      this.logger.log(
        `[${requestId}] GET zoho/debug/taxes ok count=${taxes.length} in ${Date.now() - started}ms`,
      );
      return {
        success: true,
        count: taxes.length,
        taxes,
        hint:
          'Set ZOHO_SALES_ORDER_LINE_TAX_ID to a tax_id from this list (same org as ZOHO_ORGANIZATION_ID). If GET fails with scope errors, re-auth with GET /api/zoho/login?type=order (includes ZohoInventory.settings.READ).',
      };
    } catch (err) {
      this.logger.warn(
        `[${requestId}] GET zoho/debug/taxes failed: ${err instanceof Error ? err.message : err}`,
      );
      return { ...mapZohoTestError(err), requestId };
    }
  }

  @Get('items')
  async getItemsSample() {
    const requestId = randomUUID();
    const started = Date.now();
    this.logger.log(`[${requestId}] GET zoho/debug/items started`);
    try {
      const items = await this.zoho.getItemsFromZoho();
      const sample = items.slice(0, 3);
      this.logger.log(
        `[${requestId}] GET zoho/debug/items ok count=${items.length} in ${Date.now() - started}ms`,
      );
      return {
        success: true,
        count: items.length,
        sample,
        hint:
          'This only lists items from Zoho. To persist them to Mongo (`zoho_inventory_products` + storefront `products`), call POST /api/zoho/products/sync or wait for the hourly cron (top of each hour, process timezone).',
      };
    } catch (err) {
      this.logger.warn(
        `[${requestId}] GET zoho/debug/items failed: ${err instanceof Error ? err.message : err}`,
      );
      return { ...mapZohoTestError(err), requestId };
    }
  }

  @Get('health')
  async health() {
    const requestId = randomUUID();
    const started = Date.now();
    this.logger.log(`[${requestId}] GET zoho/debug/health started`);
    try {
      const zohoReachable = await this.zoho.isInventoryReachable();
      const durationMs = Date.now() - started;
      this.logger.log(
        `[${requestId}] GET zoho/debug/health done reachable=${zohoReachable} durationMs=${durationMs}`,
      );
      return {
        success: true,
        zohoReachable,
        durationMs: Date.now() - started,
      };
    } catch (err) {
      this.logger.warn(
        `[${requestId}] GET zoho/debug/health failed (${Date.now() - started}ms): ${err instanceof Error ? err.message : err}`,
      );
      return {
        success: true,
        zohoReachable: false,
        durationMs: Date.now() - started,
      };
    }
  }

  @Post('reset-token')
  async resetToken() {
    const requestId = randomUUID();
    this.logger.log(`[${requestId}] POST zoho/debug/reset-token`);
    await this.zoho.forceRefreshAccessToken();
    return {
      success: true,
      message:
        'Cached access token cleared; next Zoho call will fetch a new access token.',
    };
  }

  @Get('usage')
  async usage() {
    const usage = await this.budget.getTodayUsage();
    return {
      success: true,
      ...usage,
      remainingTotal: Math.max(0, usage.totalBudget - usage.total),
      remainingSync: Math.max(0, usage.sync.budget - usage.sync.count),
      remainingOrder: Math.max(0, usage.order.budget - usage.order.count),
    };
  }
}
