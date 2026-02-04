import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import { AppModule } from '../src/app.module';

describe('Fee Module (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.register(fastifyCors, {
      origin: true,
      credentials: true,
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/fees/quote (GET)', () => {
    it('should return fee quote with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      expect(response.body).toHaveProperty('fee');
      expect(response.body).toHaveProperty('feeFormatted');
      expect(response.body).toHaveProperty('gasPrice');
      expect(response.body).toHaveProperty('gasPriceGwei');
      expect(response.body).toHaveProperty('estimatedGas');
      expect(response.body).toHaveProperty('bufferPercent');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('enabled');
    });

    it('should return valid fee values', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      const { fee, estimatedGas, bufferPercent, expiresAt } = response.body;

      // Fee should be a numeric string
      expect(parseFloat(fee)).toBeGreaterThan(0);

      // Estimated gas should be a positive number
      expect(estimatedGas).toBeGreaterThan(0);

      // Buffer should be reasonable (0-100%)
      expect(bufferPercent).toBeGreaterThanOrEqual(0);
      expect(bufferPercent).toBeLessThanOrEqual(100);

      // Expiration should be in the future
      const now = Math.floor(Date.now() / 1000);
      expect(expiresAt).toBeGreaterThan(now);
    });

    it('should include formatted fee with token symbol', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      expect(response.body.feeFormatted).toContain(response.body.fee);
      expect(response.body.feeFormatted).toMatch(/mantraUSD/);
    });

    it('should return gas price in both wei and gwei', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      // Gas price should be a numeric string
      expect(response.body.gasPrice).toBeDefined();
      expect(BigInt(response.body.gasPrice)).toBeGreaterThan(0n);

      // Gas price in gwei should be a numeric string
      expect(response.body.gasPriceGwei).toBeDefined();
      expect(parseFloat(response.body.gasPriceGwei)).toBeGreaterThan(0);
    });

    it('should enforce minimum fee cap', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      const fee = parseFloat(response.body.fee);
      expect(fee).toBeGreaterThanOrEqual(0.01);
    });

    it('should enforce maximum fee cap', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      const fee = parseFloat(response.body.fee);
      expect(fee).toBeLessThanOrEqual(1.0);
    });

    it('should return consistent structure on multiple requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .expect(200);

      expect(Object.keys(response1.body).sort()).toEqual(
        Object.keys(response2.body).sort(),
      );
    });

    it('should handle CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should respond quickly (< 2 seconds)', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/api/fees/quote').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
