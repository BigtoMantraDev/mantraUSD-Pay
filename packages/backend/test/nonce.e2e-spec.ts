import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import { AppModule } from '../src/app.module';

describe('Nonce Module (e2e)', () => {
  let app: NestFastifyApplication;

  const validAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const anotherAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

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

  describe('/api/nonce/:address (GET)', () => {
    it('should return nonce for valid address', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('nonce');
      expect(typeof response.body.nonce).toBe('string');
    });

    it('should return non-negative nonce', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      const nonce = BigInt(response.body.nonce);
      expect(nonce).toBeGreaterThanOrEqual(0n);
    });

    it('should handle different addresses', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/api/nonce/${anotherAddress}`)
        .expect(200);

      // Both should return valid nonces
      expect(response1.body.nonce).toBeDefined();
      expect(response2.body.nonce).toBeDefined();
    });

    it('should accept lowercase addresses', async () => {
      const lowercaseAddress = validAddress.toLowerCase();
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${lowercaseAddress}`)
        .expect(200);

      expect(response.body.nonce).toBeDefined();
    });

    it('should reject invalid address format', async () => {
      const invalidAddress = 'not-an-address';
      await request(app.getHttpServer())
        .get(`/api/nonce/${invalidAddress}`)
        .expect(400);
    });

    it('should reject address without 0x prefix', async () => {
      const addressWithoutPrefix = validAddress.slice(2);
      await request(app.getHttpServer())
        .get(`/api/nonce/${addressWithoutPrefix}`)
        .expect(400);
    });

    it('should reject short address', async () => {
      const shortAddress = '0x1234';
      await request(app.getHttpServer())
        .get(`/api/nonce/${shortAddress}`)
        .expect(400);
    });

    it('should reject empty address', async () => {
      // Accept both 400 (validation error) or 404 (route not found)
      const response = await request(app.getHttpServer()).get('/api/nonce/');
      expect([400, 404]).toContain(response.status);
    });

    it('should accept chainId query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .query({ chainId: 5887 })
        .expect(200);

      expect(response.body.nonce).toBeDefined();
    });

    it('should reject mismatched chainId', async () => {
      await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .query({ chainId: 1 })
        .expect(400);
    });

    it('should return consistent nonce for same address', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      // Nonce should be the same if no transactions occurred
      expect(response1.body.nonce).toBe(response2.body.nonce);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).get(`/api/nonce/${validAddress}`),
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.nonce).toBeDefined();
      });
    });

    it('should respond quickly (< 3 seconds)', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    });

    it('should handle CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should return address in response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nonce/${validAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('address');
      expect(response.body.address.toLowerCase()).toBe(
        validAddress.toLowerCase(),
      );
    });
  });
});
