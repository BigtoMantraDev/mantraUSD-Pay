import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Use NestJS logger instead
    }),
  );

  app.setGlobalPrefix('api');

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  // OpenAPI/Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('mantraUSD-Pay Relayer API')
    .setDescription(
      'Backend relay service for gasless EIP-7702 transactions on MANTRA Chain',
    )
    .setVersion('1.0')
    // .addServer('/api', 'API base path')
    .addTag('fees', 'Fee calculation and quotes')
    .addTag('nonce', 'On-chain nonce queries')
    .addTag('relay', 'Transaction relay and status')
    .addTag('health', 'Service health monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Scalar API Reference
  app.use(
    '/api/scalar',
    apiReference({
      content: document,
      url: '/openapi.json',
      withFastify: true, // Required when using Fastify adapter
      theme: 'purple',
      metaData: {
        title: 'mantraUSD-Pay API',
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Reference: http://localhost:${port}/api/scalar`);
  logger.log(`📊 Health check: http://localhost:${port}/api/health`);
  logger.log(`💰 Fee quote: http://localhost:${port}/api/fees/quote`);
  logger.log(`🔢 Nonce: http://localhost:${port}/api/nonce/:address`);
  logger.log(`📡 Relay: http://localhost:${port}/api/relay`);
}

bootstrap();
