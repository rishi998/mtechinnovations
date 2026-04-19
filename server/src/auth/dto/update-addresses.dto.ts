import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SavedAddressDto {
  @IsString()
  @MinLength(4)
  id: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @MinLength(5)
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  state: string;

  @IsString()
  @Length(6, 6)
  pincode: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SavedAddressDto)
  addresses: SavedAddressDto[];
}
