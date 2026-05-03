import { IsMongoId } from 'class-validator';

/** Body for POST /api/zoho/create-invoice (paid orders only). */
export class CreateZohoInvoiceDto {
  @IsMongoId()
  orderMongoId!: string;
}
