import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  create(@CurrentUser() user: UserDocument, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(String(user._id), dto);
  }

  @Post('verify')
  verify(@CurrentUser() user: UserDocument, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(String(user._id), dto);
  }
}
