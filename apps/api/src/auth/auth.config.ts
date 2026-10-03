import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { PrismaService } from '../prisma/prisma.service.js';

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

export const UNIAUTH_PROVIDER_ID = 'uniauth';
/** e.g. https://auth.psstee.dev/api/auth */
export const UNIAUTH_ISSUER = env('UNIAUTH_ISSUER').replace(/\/+$/, '');
export const UNIAUTH_CLIENT_ID = env('UNIAUTH_CLIENT_ID');

/** The one Prisma client, shared by Better Auth and Nest (see PrismaModule). */
export const prisma = new PrismaService();

const DAY = 60 * 60 * 24;

export const auth = betterAuth({
  // The web origin: it proxies /api to this server, so the callback and the session cookie
  // stay on the host people use.
  baseURL: env('BETTER_AUTH_URL'),
  secret: env('BETTER_AUTH_SECRET'),
  trustedOrigins: [env('BETTER_AUTH_URL')],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  // Host-only cookie with Unigym's own name. Never crossSubDomainCookies.
  advanced: { cookiePrefix: 'unigym' },
  // Sliding: an active user's session moves 7 days forward at most once a day.
  // No cookieCache, so a deleted session (sign-out, back-channel logout) ends at once.
  session: { expiresIn: 7 * DAY, updateAge: DAY },
  // No emailAndPassword and no socialProviders: people sign in on uniAuth only.
  plugins: [
    genericOAuth({
      config: [
        {
          // Callback: <BETTER_AUTH_URL>/api/auth/callback/uniauth
          providerId: UNIAUTH_PROVIDER_ID,
          discoveryUrl: `${UNIAUTH_ISSUER}/.well-known/openid-configuration`,
          clientId: UNIAUTH_CLIENT_ID,
          clientSecret: env('UNIAUTH_CLIENT_SECRET'),
          authentication: 'basic',
          pkce: true,
          requireIdTokenVerification: true,
          scopes: ['openid', 'profile', 'email', 'offline_access'],
          // Name and avatar are uniAuth's: refreshed at every sign-in.
          overrideUserInfo: true,
          mapProfileToUser: (profile) => ({
            email: String(profile.email),
            emailVerified: profile.email_verified === true,
            name: String(profile.name || profile.email),
            // '' = no avatar: Better Auth skips an undefined image, so a removed uniAuth
            // avatar would never clear. The database hooks store '' as null.
            image: typeof profile.picture === 'string' ? profile.picture : '',
          }),
        },
      ],
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: (user) => Promise.resolve({ data: noAvatarAsNull(user) }),
      },
      update: {
        before: (data) => Promise.resolve({ data: noAvatarAsNull(data) }),
      },
    },
  },
  user: {
    additionalFields: {
      // Set by Unigym's consent screen, never at sign-up.
      consentGivenAt: { type: 'date', required: false, input: false },
    },
  },
});

function noAvatarAsNull<T extends { image?: string | null }>(data: T): T {
  return data.image === '' ? { ...data, image: null } : data;
}
