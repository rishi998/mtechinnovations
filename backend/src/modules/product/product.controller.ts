import { Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProductService } from './product.service';

const MAX_LIST_LIMIT = 500;

function classifyZohoFailure(details: string): {
  message: string;
  details: string;
} {
  const lower = details.toLowerCase();
  if (
    lower.includes('token') ||
    lower.includes('refresh') ||
    lower.includes('oauth') ||
    lower.includes('zoho token error') ||
    lower.includes('failed to reach zoho token') ||
    lower.includes('failed to obtain zoho access token')
  ) {
    return {
      message: 'Failed to generate Zoho access token',
      details,
    };
  }
  return {
    message: 'Zoho API error',
    details,
  };
}

/**
 * Zoho-backed inventory product cache (global prefix `api`):
 *   GET  /api/zoho/products?limit=10
 *   GET  /api/zoho/products/categories  (live from Zoho /itemgroups + cached counts)
 *   POST /api/zoho/products/sync
 */
@Controller('zoho/products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Get('categories')
  async listCategories() {
    const requestId = randomUUID();
    try {
      const data = await this.productService.getCategoriesFromZoho();
      this.logger.log(
        `[${requestId}] GET zoho/products/categories count=${data.length}`,
      );
      return {
        success: true,
        count: data.length,
        data,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const { message, details } = classifyZohoFailure(raw);
      this.logger.warn(
        `[${requestId}] GET zoho/products/categories failed: ${raw}`,
      );
      return {
        success: false,
        message,
        details,
        count: 0,
        data: [],
      };
    }
  }

  @Get()
  async findAll(@Query('limit') limitRaw?: string) {
    const requestId = randomUUID();
    let limit: number | undefined;
    if (limitRaw !== undefined && limitRaw !== '') {
      const n = parseInt(limitRaw, 10);
      if (!Number.isFinite(n) || n < 1) {
        this.logger.warn(`[${requestId}] Invalid limit query: ${limitRaw}`);
        return {
          success: false,
          message: 'Invalid limit; use a positive integer.',
          count: 0,
          data: [],
        };
      }
      limit = Math.min(n, MAX_LIST_LIMIT);
    }

    const data = await this.productService.getAllProducts(limit);
    this.logger.log(
      `[${requestId}] GET zoho/products count=${data.length}${limit != null ? ` limit=${limit}` : ''}`,
    );
    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Post('sync')
  async sync() {
    const requestId = randomUUID();
    this.logger.log(`[${requestId}] POST zoho/products/sync`);
    const result = await this.productService.syncProductsFromZoho({
      requestId,
    });

    if (!result.success) {
      const raw = result.details ?? 'Unknown error';
      const { message, details } = classifyZohoFailure(raw);
      return {
        success: false,
        message,
        details,
        totalFetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        durationMs: result.durationMs,
      };
    }

    return {
      success: true,
      totalFetched: result.totalFetched,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      durationMs: result.durationMs,
      removedZohoCache: result.removedZohoCache ?? 0,
      catalogUpserted: result.catalogUpserted ?? 0,
      catalogModified: result.catalogModified ?? 0,
      catalogRemoved: result.catalogRemoved ?? 0,
    };
  }
}
