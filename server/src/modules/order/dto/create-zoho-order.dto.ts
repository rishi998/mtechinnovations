import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateZohoOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateZohoOrderDto {
  @IsString()
  @MinLength(1)
  customerName: string;

  @IsEmail()
  customerEmail: string;

  /** Zoho Inventory `contact_id` when you already have a customer; skips contact create/lookup. */
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'zohoCustomerId must be numeric Zoho contact_id' })
  zohoCustomerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateZohoOrderItemDto)
  items: CreateZohoOrderItemDto[];
}
