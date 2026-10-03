import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  LOGOUT_EVENT,
  USER_DELETED_EVENT,
  USER_UPDATED_EVENT,
} from '../src/modules/uniauth/uniauth-event-token.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { startMockUniauth, type MockProfile } from './support/mock-uniauth.js';

const WEB_ORIGIN = 'http://127.0.0.1:3003';
const CLIENT = { id: 'unigym-test', secret: 'unigym-test-secret' };
const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_DOMAIN = `e2e-${randomUUID()}.example`;

describe('Unigym API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let uniauth: Awaited<ReturnType<typeof startMockUniauth>>;

  beforeAll(async () => {
    // Better Auth fetches uniAuth's discovery document when it starts, so the mock provider
    // and the env must exist before the app module is imported.
    uniauth = await startMockUniauth(CLIENT);
    Object.assign(process.env, {
      BETTER_AUTH_URL: WEB_ORIGIN,
      BETTER_AUTH_SECRET: 'e2e-secret-at-least-thirty-two-characters',
      UNIAUTH_ISSUER: uniauth.issuer,
      UNIAUTH_CLIENT_ID: CLIENT.id,
      UNIAUTH_CLIENT_SECRET: CLIENT.secret,
    });
    const { AppModule } = await import('../src/app.module.js');
    const { PrismaService } = await import('../src/prisma/prisma.service.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication({ bodyParser: false });
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({
      where: { email: { endsWith: `@${EMAIL_DOMAIN}` } },
    });
    await app?.close();
    await uniauth?.close();
  });

  function newProfile(overrides: Partial<MockProfile> = {}): MockProfile {
    return {
      sub: `u_${randomUUID()}`,
      email: `${randomUUID()}@${EMAIL_DOMAIN}`,
      name: 'Mya',
      ...overrides,
    };
  }

  const cookiesOf = (res: request.Response) =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? []);

  /** Runs the whole OIDC sign-in against the mock uniAuth and returns the session cookie. */
  async function signIn(profile: MockProfile) {
    uniauth.signInAs(profile);
    const start = await request(app.getHttpServer())
      .post('/api/auth/sign-in/social')
      .set('Origin', WEB_ORIGIN)
      .send({ provider: 'uniauth', callbackURL: `${WEB_ORIGIN}/` })
      .expect(200);
    const authorize = await fetch(start.body.url as string, {
      redirect: 'manual',
    });
    const callback = new URL(authorize.headers.get('location') ?? '');
    expect(`${callback.origin}${callback.pathname}`).toBe(
      `${WEB_ORIGIN}/api/auth/callback/uniauth`,
    );

    const done = await request(app.getHttpServer())
      .get(`${callback.pathname}${callback.search}`)
      .set(
        'Cookie',
        cookiesOf(start).map((c) => c.split(';')[0]),
      )
      .expect(302);
    expect(done.headers.location).toBe(`${WEB_ORIGIN}/`);

    const setCookie = cookiesOf(done).find((c) =>
      c.startsWith('unigym.session_token='),
    );
    expect(setCookie).toBeDefined();
    return { setCookie: setCookie!, cookie: setCookie!.split(';')[0] };
  }

  async function sessionFor(email: string) {
    return prisma.session.findFirstOrThrow({ where: { user: { email } } });
  }

  describe('public routes', () => {
    it('serves /health without a session', () =>
      request(app.getHttpServer()).get('/health').expect(200).expect('ok'));

    it('serves /api/health without a session', () =>
      request(app.getHttpServer()).get('/api/health').expect(200).expect('ok'));
  });

  describe('Better Auth config', () => {
    it('has no email and password sign-up', async () => {
      const email = `signup-${randomUUID()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .set('Origin', WEB_ORIGIN)
        .send({ email, password: 'password1234', name: 'X' })
        .expect(400);

      expect(res.body.code).toBe('EMAIL_PASSWORD_SIGN_UP_DISABLED');
      expect(await prisma.user.count({ where: { email } })).toBe(0);
    });

    it('links the person by uniAuth sub and sets a host-only unigym cookie', async () => {
      const profile = newProfile();
      const { setCookie } = await signIn(profile);

      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).not.toMatch(/Domain=/i);
      const account = await prisma.account.findFirstOrThrow({
        where: { user: { email: profile.email } },
      });
      expect(account).toMatchObject({
        providerId: 'uniauth',
        accountId: profile.sub,
      });
    });

    it('creates a session that lasts 7 days', async () => {
      const profile = newProfile();
      await signIn(profile);

      const session = await sessionFor(profile.email);
      const lifetime =
        session.expiresAt.getTime() - session.createdAt.getTime();
      expect(Math.abs(lifetime - 7 * DAY_MS)).toBeLessThan(60_000);
    });
  });

  describe('session guard', () => {
    it('rejects a request without a cookie', () =>
      request(app.getHttpServer()).get('/api/me').expect(401));

    it('rejects a random token', () =>
      request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', `unigym.session_token=${randomUUID()}`)
        .expect(401));

    it('rejects a deleted session', async () => {
      const profile = newProfile();
      const { cookie } = await signIn(profile);
      await prisma.session.deleteMany({
        where: { user: { email: profile.email } },
      });

      await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('rejects an expired session', async () => {
      const profile = newProfile();
      const { cookie } = await signIn(profile);
      await prisma.session.updateMany({
        where: { user: { email: profile.email } },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('slides a session last moved 2 days ago to 7 days from now, keeping the token', async () => {
      const profile = newProfile();
      const { cookie } = await signIn(profile);
      const before = await sessionFor(profile.email);
      await prisma.session.update({
        where: { id: before.id },
        data: { expiresAt: new Date(Date.now() + 5 * DAY_MS) },
      });

      await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(200);

      const after = await sessionFor(profile.email);
      expect(after.token).toBe(before.token);
      expect(
        Math.abs(after.expiresAt.getTime() - (Date.now() + 7 * DAY_MS)),
      ).toBeLessThan(60_000);
    });

    it('leaves a session moved less than a day ago alone', async () => {
      const profile = newProfile();
      const { cookie } = await signIn(profile);
      const before = await sessionFor(profile.email);

      await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(200);

      const after = await sessionFor(profile.email);
      expect(after.expiresAt.getTime()).toBe(before.expiresAt.getTime());
    });
  });

  describe('GET /api/me', () => {
    it('returns the signed-in user', async () => {
      const profile = newProfile({
        picture: 'https://auth.psstee.dev/api/avatars/a.png',
      });
      const { cookie } = await signIn(profile);

      const res = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual({
        id: expect.any(String),
        email: profile.email,
        emailVerified: true,
        name: 'Mya',
        image: profile.picture,
      });
    });

    it('returns image null for a user without an avatar', async () => {
      const { cookie } = await signIn(newProfile());

      const res = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body.image).toBeNull();
    });
  });

  describe('uniAuth receivers', () => {
    const post = (path: string, form: Record<string, string>) =>
      request(app.getHttpServer())
        .post(`/api/uniauth/${path}`)
        .type('form')
        .send(form);
    const RECEIVERS = [
      {
        path: 'backchannel-logout',
        field: 'logout_token',
        event: LOGOUT_EVENT,
      },
      { path: 'user-deleted', field: 'token', event: USER_DELETED_EVENT },
      { path: 'user-updated', field: 'token', event: USER_UPDATED_EVENT },
    ];

    it.each(RECEIVERS)('$path: missing token → 400', async ({ path }) => {
      await post(path, {}).expect(400);
    });

    it.each(RECEIVERS)(
      '$path: invalid token → 400',
      async ({ path, field }) => {
        await post(path, { [field]: 'not-a-jwt' }).expect(400);
      },
    );

    it.each(RECEIVERS)(
      '$path: unknown sub → 200 and no change',
      async ({ path, field, event }) => {
        const profile = newProfile();
        await signIn(profile);
        const before = await prisma.user.findUniqueOrThrow({
          where: { email: profile.email },
          include: { sessions: true },
        });

        const token = await uniauth.signEvent(`u_${randomUUID()}`, {
          [event]: { name: 'Changed' },
        });
        await post(path, { [field]: token }).expect(200);

        expect(
          await prisma.user.findUniqueOrThrow({
            where: { email: profile.email },
            include: { sessions: true },
          }),
        ).toEqual(before);
      },
    );

    it('backchannel-logout ends every session of the user', async () => {
      const profile = newProfile();
      const first = await signIn(profile);
      const second = await signIn(profile);

      const token = await uniauth.signEvent(profile.sub, {
        [LOGOUT_EVENT]: {},
      });
      await post('backchannel-logout', { logout_token: token }).expect(200);

      expect(
        await prisma.session.count({
          where: { user: { email: profile.email } },
        }),
      ).toBe(0);
      for (const { cookie } of [first, second]) {
        await request(app.getHttpServer())
          .get('/api/me')
          .set('Cookie', cookie)
          .expect(401);
      }
    });

    it('user-deleted rejects a logout token and keeps the user', async () => {
      const profile = newProfile();
      await signIn(profile);

      const token = await uniauth.signEvent(profile.sub, {
        [LOGOUT_EVENT]: {},
      });
      await post('user-deleted', { token }).expect(400);

      expect(await prisma.user.count({ where: { email: profile.email } })).toBe(
        1,
      );
    });

    it('user-deleted removes the user, accounts and sessions', async () => {
      const profile = newProfile();
      await signIn(profile);
      const { id } = await prisma.user.findUniqueOrThrow({
        where: { email: profile.email },
      });

      const token = await uniauth.signEvent(profile.sub, {
        [USER_DELETED_EVENT]: {},
      });
      await post('user-deleted', { token }).expect(200);

      expect(await prisma.user.count({ where: { id } })).toBe(0);
      expect(await prisma.account.count({ where: { userId: id } })).toBe(0);
      expect(await prisma.session.count({ where: { userId: id } })).toBe(0);
    });

    it('user-updated refreshes the copy', async () => {
      const profile = newProfile({
        picture: 'https://auth.psstee.dev/api/avatars/a.png',
      });
      await signIn(profile);
      const newEmail = `${randomUUID()}@${EMAIL_DOMAIN}`;

      const token = await uniauth.signEvent(profile.sub, {
        [USER_UPDATED_EVENT]: {
          email: newEmail.toUpperCase(),
          email_verified: false,
          name: 'Mya Mya',
          picture: null,
        },
      });
      await post('user-updated', { token }).expect(200);

      expect(
        await prisma.user.findUniqueOrThrow({ where: { email: newEmail } }),
      ).toMatchObject({ name: 'Mya Mya', emailVerified: false, image: null });
    });

    it('user-updated keeps the name when the new one is empty', async () => {
      const profile = newProfile();
      await signIn(profile);

      const token = await uniauth.signEvent(profile.sub, {
        [USER_UPDATED_EVENT]: { name: '' },
      });
      await post('user-updated', { token }).expect(200);

      expect(
        await prisma.user.findUniqueOrThrow({
          where: { email: profile.email },
        }),
      ).toMatchObject({ name: 'Mya' });
    });
  });
});
