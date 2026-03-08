import { IsString, IsOptional, IsIn } from 'class-validator';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  trackingId?: string;
}
