import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { RazorpayVerifyDto } from './dto/razorpay-verify.dto';
import { RazorpayPaymentService } from './razorpay-payment.service';
import { ConfigService } from '@nestjs/config';

@Controller('razorpay')
export class RazorpayController {
  constructor(
    private readonly razorpayPayment: RazorpayPaymentService,
    private readonly config: ConfigService,
  ) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  verify(
    @CurrentUser() user: UserDocument,
    @Body() dto: RazorpayVerifyDto,
  ) {
    return this.razorpayPayment.verifyClientPayment(
      String(user._id),
      dto,
    );
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ) {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret?.trim()) {
      throw new UnauthorizedException('Webhook not configured');
    }

    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new UnauthorizedException('Invalid webhook body');
    }

    const expected = createHmac('sha256', secret.trim())
      .update(raw)
      .digest('hex');

    const sig = (signature ?? '').trim();
    try {
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(sig, 'utf8');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid webhook JSON');
    }

    return this.razorpayPayment.handleWebhookPayload(payload);
  }
}
