import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolvePreset } from './zoho.config';
import { ZohoService } from './zoho.service';

/** Publicly-reachable fallback shown when a Zoho item has no image. */
const IMAGE_FALLBACK_URL =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800';

/**
 * With global prefix `api` (see main.ts), routes are:
 *   GET /api/zoho/login?type=read|order|full
 *   GET /api/zoho/callback?code=...
 *   GET /api/zoho/items/:itemId/image?image_id=...
 *       — streams the catalog image from Zoho Inventory (OAuth). Falls back to a static
 *       placeholder on error. Counts against the `order` API budget channel.
 */
@Controller('zoho')
export class ZohoController {
  private readonly logger = new Logger(ZohoController.name);

  constructor(private readonly zoho: ZohoService) {}

  @Get('login')
  login(
    @Query('type') type: string | undefined,
    @Res() res: Response,
  ): void {
    const preset = resolvePreset(type);
    const url = this.zoho.getAuthorizationUrl(preset);
    res.redirect(302, url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Query('error_description') oauthErrorDescription: string | undefined,
  ) {
    if (oauthError) {
      throw new BadRequestException({
        message: 'Zoho OAuth returned an error',
        error: oauthError,
        error_description: oauthErrorDescription ?? null,
      });
    }
    if (!code?.trim()) {
      throw new BadRequestException(
        'Missing OAuth `code` query parameter. User may have denied access or redirect misconfigured.',
      );
    }
    const bundle = await this.zoho.exchangeAuthorizationCode(code.trim());
    return {
      ok: true,
      message: 'Zoho OAuth complete. Tokens stored.',
      expiresAt: bundle.expiresAt,
      scope: bundle.grantedScope,
      apiDomain: bundle.apiDomain ?? null,
    };
  }

  @Get('items/:itemId/image')
  async itemImage(
    @Param('itemId') itemId: string,
    @Query('image_id') imageId: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const { buffer, contentType } = await this.zoho.fetchItemImageBuffer(
        itemId,
        imageId?.trim() || null,
        'order',
      );
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Cache-Control',
        'public, max-age=86400, stale-while-revalidate=604800',
      );
      res.send(buffer);
    } catch (err) {
      if (err instanceof NotFoundException) {
        res.redirect(302, IMAGE_FALLBACK_URL);
        return;
      }
      this.logger.warn(
        `Zoho item image failed for item ${itemId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      res.redirect(302, IMAGE_FALLBACK_URL);
    }
  }
}
