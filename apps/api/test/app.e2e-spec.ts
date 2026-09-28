import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/db/prisma.service.js';

describe('Unigym API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  it('serves a public health route', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('ok');
  });

  it('does not expose the former authentication endpoint', () => {
    return request(app.getHttpServer()).get('/me').expect(404);
  });

  it('stores a provider-neutral external subject', async () => {
    const subject = `identity-${randomUUID()}`;
    const prisma = app.get(PrismaService);

    try {
      const member = await prisma.member.create({
        data: { externalSubject: subject },
      });
      const found = await prisma.member.findUnique({
        where: { externalSubject: subject },
      });
      expect(found?.id).toBe(member.id);
    } finally {
      await prisma.member.deleteMany({ where: { externalSubject: subject } });
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
