import { HttpException, HttpStatus } from '@nestjs/common';

export class ZohoOAuthException extends HttpException {
  constructor(message: string, public readonly zohoError?: string) {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}

export class ZohoMissingScopeException extends HttpException {
  constructor(
    message: string,
    public readonly details?: { requested?: string; hint?: string },
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'ZohoInsufficientScope',
        message,
        ...details,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ZohoCallBudgetExceededException extends HttpException {
  constructor(
    message: string,
    public readonly count: number,
    public readonly budget: number,
  ) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'ZohoCallBudgetExceeded',
        message,
        count,
        budget,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class ZohoCircuitBreakerException extends HttpException {
  constructor(message: string, public readonly totalCount: number) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'ZohoCircuitBreakerOpen',
        message,
        totalCount,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
