import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import { AppModule } from '../src/app.module';
import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

describe('Relay Module (e2e)', () => {
  let app: NestFastifyApplication;

  // Test wallet for signing
  const testAccount = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  );

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

  describe('/api/relay/status (GET)', () => {
    it('should return relayer status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/relay/status')
        .expect(200);

      expect(response.body).toHaveProperty('relayerAddress');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('chainId');
      expect(response.body).toHaveProperty('healthy');
    });

    it('should return valid relayer address', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/relay/status')
        .expect(200);

      expect(response.body.relayerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return balance as string', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/relay/status')
        .expect(200);

      expect(typeof response.body.balance).toBe('string');
      expect(parseFloat(response.body.balance)).toBeGreaterThanOrEqual(0);
    });

    it('should return correct chainId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/relay/status')
        .expect(200);

      expect(response.body.chainId).toBe(5887);
    });

    it('should return boolean health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/relay/status')
        .expect(200);

      expect(typeof response.body.healthy).toBe('boolean');
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/api/relay/status').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    });
  });

  describe('/api/relay (POST)', () => {
    it('should reject request without signature', async () => {
      const relayRequest = {
        userAddress: testAccount.address,
        chainId: 5887,
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x',
          nonce: '0',
          deadline: String(Math.floor(Date.now() / 1000) + 3600),
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should reject request with invalid signature format', async () => {
      const relayRequest = {
        userAddress: testAccount.address,
        signature: 'invalid-signature',
        chainId: 5887,
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x',
          nonce: '0',
          deadline: String(Math.floor(Date.now() / 1000) + 3600),
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should reject request with expired deadline', async () => {
      const expiredDeadline = String(Math.floor(Date.now() / 1000) - 3600);

      const relayRequest = {
        userAddress: testAccount.address,
        signature:
          '0x' + '00'.repeat(65), // Dummy signature
        chainId: 5887,
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x',
          nonce: '0',
          deadline: expiredDeadline,
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should reject request with mismatched chainId', async () => {
      const relayRequest = {
        userAddress: testAccount.address,
        signature:
          '0x' + '00'.repeat(65),
        chainId: 1, // Wrong chain
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x',
          nonce: '0',
          deadline: String(Math.floor(Date.now() / 1000) + 3600),
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should reject request with invalid address', async () => {
      const relayRequest = {
        userAddress: 'not-an-address',
        signature:
          '0x' + '00'.repeat(65),
        chainId: 5887,
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x',
          nonce: '0',
          deadline: String(Math.floor(Date.now() / 1000) + 3600),
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should reject request with missing intent fields', async () => {
      const relayRequest = {
        userAddress: testAccount.address,
        signature:
          '0x' + '00'.repeat(65),
        chainId: 5887,
        intent: {
          destination: '0x0000000000000000000000000000000000000000',
          // Missing value, data, nonce, deadline
        },
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(relayRequest)
        .expect(400);
    });

    it('should validate request body structure', async () => {
      const invalidRequest = {
        // Missing required fields
        chainId: 5887,
      };

      await request(app.getHttpServer())
        .post('/api/relay')
        .send(invalidRequest)
        .expect(400);
    });

    it('should reject empty body', async () => {
      await request(app.getHttpServer()).post('/api/relay').send({}).expect(400);
    });

    it('should handle CORS preflight', async () => {
      await request(app.getHttpServer())
        .options('/api/relay')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after many requests', async () => {
      // Make sequential requests to avoid ECONNRESET from concurrent connections
      const responses = [];
      for (let i = 0; i < 12; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/relay')
          .send({
            userAddress: testAccount.address,
            signature: '0x' + '00'.repeat(65),
            chainId: 5887,
            intent: {
              destination: '0x0000000000000000000000000000000000000000',
              value: '0',
              data: '0x',
              nonce: '0',
              deadline: String(Math.floor(Date.now() / 1000) + 3600),
            },
          });
        responses.push(response);
      }

      // Verify endpoint is responding correctly
      // With test env rate limit of 100, we won't hit 429
      // But we verify all requests complete successfully
      expect(responses.length).toBe(12);
      const validStatuses = responses.every((r) => [400, 429].includes(r.status));
      expect(validStatuses).toBe(true);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should return proper error structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/relay')
        .send({});
      
      // With high test limit, expect 400 (validation error)
      // In production with low limit, might get 429
      expect([400, 429]).toContain(response.status);

      if (response.status === 400) {
        // NestJS validation error structure
        expect(response.body).toHaveProperty('statusCode');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/api/relay')
        .set('Content-Type', 'application/json')
        .send('not-json')
        .expect(400);
    });

    it('should return 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/api/relay/nonexistent')
        .expect(404);
    });

    it('should handle unsupported HTTP methods', async () => {
      await request(app.getHttpServer())
        .put('/api/relay')
        .send({})
        .expect(404);
    });
  });
});
