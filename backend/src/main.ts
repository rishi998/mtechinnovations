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

  app.use(helmet());
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
