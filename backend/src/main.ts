import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests such as curl/Postman.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Local Expo web development commonly uses ports 8081/8082/etc.
      const isLocalExpoOrigin = /^https?:\/\/localhost:\d+$/.test(origin);

      // Keep support for an explicit comma-separated allow-list in production.
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000, '0.0.0.0');
}

bootstrap();
