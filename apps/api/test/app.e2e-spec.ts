import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Unigym API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.BETTER_AUTH_URL = 'http://127.0.0.1:3003';
    process.env.BETTER_AUTH_SECRET =
      'test-secret-at-least-thirty-two-characters';
    process.env.UNIAUTH_ISSUER = 'http://127.0.0.1:39999/api/auth';
    process.env.UNIAUTH_CLIENT_ID = 'test-client';
    process.env.UNIAUTH_CLIENT_SECRET = 'test-client-secret';
    process.env.UNIGYM_LEGAL_APPROVED = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
  });

  it('serves a public health route', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('ok');
  });

  it('serves health through the web API rewrite path', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('ok');
  });

  it('mounts Better Auth on the web-facing API path', () => {
    return request(app.getHttpServer())
      .get('/api/auth/get-session')
      .expect(200);
  });

  it('requires a local session for profile and consent', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
    await request(app.getHttpServer())
      .post('/api/users/me/consent')
      .expect(401);
  });

  it('rejects invalid uniAuth event tokens', async () => {
    await request(app.getHttpServer())
      .post('/api/uniauth/user-deleted')
      .type('form')
      .send({ token: 'invalid' })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
