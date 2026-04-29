import './crypto-global';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

/** Explicit origins only (no `*` / reflective wildcard). */
function parseCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    const list = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return ['https://mtechinnovations.in'];
    if (list.length === 1) return list[0]!;
    return list;
  }
  return ['https://mtechinnovations.in'];
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.use(
    helmet({
      /**
       * Default helmet sets Cross-Origin-Resource-Policy: same-origin which blocks
       * the browser from loading /api/** images when the page is on a different origin
       * (e.g. Next.js dev on :3000 fetching images from NestJS on :3001, or any CDN/reverse-proxy
       * setup where the API lives on a different subdomain). Set cross-origin so browsers
       * can embed images, fonts, and other resources from this API in cross-origin pages.
       */
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: parseCorsOrigin(),
    credentials: true,
  });

  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  logger.log(`HTTP server listening on port ${port} (global prefix /api)`);
}

bootstrap();
