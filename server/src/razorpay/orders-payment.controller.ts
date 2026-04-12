import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';
import { RazorpayPaymentService } from './razorpay-payment.service';

@Controller('orders')
export class OrdersPaymentController {
  constructor(private readonly razorpayPayment: RazorpayPaymentService) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  createPayment(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.razorpayPayment.createRazorpayOrderForCheckout(
      String(user._id),
      dto.orderId,
    );
  }
}
