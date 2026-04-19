import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const body =
        typeof res === 'string' ? { message: res } : (res as Record<string, unknown>);
      response.status(status).json({
        ...body,
        statusCode: status,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`${request.method} ${request.url}`, err.stack);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProd ? 'Internal server error' : err.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
