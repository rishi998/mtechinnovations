import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CreateZohoOrderDto } from './dto/create-zoho-order.dto';
import { OrderService } from './order.service';

/**
 * Zoho Inventory sales orders (global prefix `api`).
 * Uses `/api/zoho/orders` so it does not conflict with JWT storefront `POST /api/orders`.
 */
@Controller('zoho/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateZohoOrderDto) {
    const result = await this.orderService.createOrder(dto);

    if (result.success) {
      return {
        success: true,
        orderId: result.orderId,
        zohoSalesOrderId: result.zohoSalesOrderId,
        status: result.status,
      };
    }

    return {
      success: false,
      orderId: result.orderId,
      status: result.status,
      message: 'Zoho sales order could not be created',
      details: result.message ?? 'Unknown error',
    };
  }

  @Get()
  async list(@Query('status') status?: string) {
    const data = await this.orderService.findAll(status);
    return {
      success: true,
      count: data.length,
      data,
    };
  }
}
