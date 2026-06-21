import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
  await app.listen(env.PORT);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}/api`);
}

void bootstrap();
