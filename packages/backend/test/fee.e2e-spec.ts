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

  const testParams = {
    token: '0x4B545d0758eda6601B051259bD977125fbdA7ba2',
    amount: '1000000',
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
    sender: '0x1234567890123456789012345678901234567890',
  };

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
        .query(testParams)
        .expect(200);

      expect(response.body).toHaveProperty('feeAmount');
      expect(response.body).toHaveProperty('feeToken');
      expect(response.body).toHaveProperty('deadline');
      expect(response.body).toHaveProperty('signature');
    });

    it('should return valid fee values', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      const { feeAmount, feeToken, deadline, signature } = response.body;

      // Fee amount should be a numeric string
      expect(BigInt(feeAmount)).toBeGreaterThan(0n);

      // Fee token should be a valid address
      expect(feeToken).toMatch(/^0x[0-9a-fA-F]{40}$/);

      // Deadline should be in the future
      const now = Math.floor(Date.now() / 1000);
      expect(deadline).toBeGreaterThan(now);

      // Signature should be a valid hex string
      expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
    });

    it('should return feeToken as configured token address', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      expect(response.body.feeToken).toBeDefined();
      expect(response.body.feeToken).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should return signature for verification', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      expect(response.body.signature).toBeDefined();
      expect(response.body.signature).toMatch(/^0x[0-9a-fA-F]+$/);
    });

    it('should enforce minimum fee cap', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      const feeAmount = BigInt(response.body.feeAmount);
      // Min fee is 0.01 tokens with 6 decimals = 10000 wei
      const minFeeWei = BigInt(10000);
      expect(feeAmount).toBeGreaterThanOrEqual(minFeeWei);
    });

    it('should enforce maximum fee cap', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      const feeAmount = BigInt(response.body.feeAmount);
      // Max fee is 1.0 tokens with 6 decimals = 1000000 wei
      const maxFeeWei = BigInt(1000000);
      expect(feeAmount).toBeLessThanOrEqual(maxFeeWei);
    });

    it('should return consistent structure on multiple requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query({
          ...testParams,
          recipient: '0x0000000000000000000000000000000000000002',
        })
        .expect(200);

      // Both responses should have the same structure
      expect(Object.keys(response1.body).sort()).toEqual(
        Object.keys(response2.body).sort(),
      );
    });

    it('should handle CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should respond quickly (< 2 seconds)', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/api/fees/quote')
        .query(testParams)
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
