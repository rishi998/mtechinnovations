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
