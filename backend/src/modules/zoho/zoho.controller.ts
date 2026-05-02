import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolvePreset } from './zoho.config';
import { ZohoService } from './zoho.service';

/** Storefront catalog images are served from Mongo (`products.images`); no runtime Zoho. */
const IMAGE_FALLBACK_URL =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800';

/**
 * With global prefix `api` (see main.ts), routes are:
 *   GET /api/zoho/login?type=read|order|full
 *   GET /api/zoho/callback?code=...
 *   GET /api/zoho/items/:itemId/image — legacy path; redirects to placeholder (no Zoho call).
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
  itemImage(
    @Param('itemId') itemId: string,
    @Query('image_id') _imageId: string | undefined,
    @Res() res: Response,
  ): void {
    this.logger.debug(
      `Catalog image request for Zoho item ${itemId} — redirecting to placeholder (Mongo-only runtime).`,
    );
    res.redirect(302, IMAGE_FALLBACK_URL);
  }
}
