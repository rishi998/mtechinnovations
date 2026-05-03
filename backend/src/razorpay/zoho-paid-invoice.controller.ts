import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { RazorpayPaymentService } from './razorpay-payment.service';
import { CreateZohoInvoiceDto } from './dto/create-zoho-invoice.dto';

/**
 * Paid-order Zoho invoice pipeline at `/api/zoho/*`.
 * Mirrors the post-payment sync job invoked after Razorpay success.
 */
@Controller('zoho')
export class ZohoPaidInvoiceTriggerController {
  constructor(private readonly razorpayPayment: RazorpayPaymentService) {}

  @Post('create-invoice')
  @UseGuards(JwtAuthGuard)
  createInvoice(@CurrentUser() user: UserDocument, @Body() dto: CreateZohoInvoiceDto) {
    return this.razorpayPayment.syncZohoForPaidOrder(
      dto.orderMongoId,
      String(user._id),
    );
  }
}
