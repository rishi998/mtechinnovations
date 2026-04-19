import { Controller, Get, Param } from '@nestjs/common';
import { ZohoItemFlowDebugService } from './zoho-item-flow-debug.service';

/**
 * Operational debugging (no auth). Restrict exposure in production if needed.
 * GET /api/debug/zoho-item-flow/:orderId — `orderId` may be Mongo _id or public `orderId` (e.g. ORD…).
 */
@Controller('debug')
export class DebugController {
  constructor(private readonly zohoItemFlow: ZohoItemFlowDebugService) {}

  @Get('zoho-item-flow/:orderId')
  async getZohoItemFlow(@Param('orderId') orderId: string) {
    return this.zohoItemFlow.inspectOrder(orderId);
  }
}
