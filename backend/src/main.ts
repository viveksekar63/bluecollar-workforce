import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isLocalExpoOrigin = /^https?:\/\/localhost:\d+$/.test(origin);
      const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (isLocalExpoOrigin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(3000, '0.0.0.0');
}

bootstrap();
