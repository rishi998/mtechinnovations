import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  paymentId: string;
}
