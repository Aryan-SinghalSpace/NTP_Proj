import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { logEvent } from './common/logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    exposedHeaders: ['x-request-id'], // let the client read the correlation id
  });
  // Two-layer error handling + always-on request logging (see docs/error-handling.md).
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(env.PORT);
  logEvent('info', { event: 'server.started', detail: `API listening on http://localhost:${env.PORT}/api` });
}

void bootstrap();
