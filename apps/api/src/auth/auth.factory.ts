import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { genericOAuth } from 'better-auth/plugins';
import type { PrismaService } from '../db/prisma.service.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function uniauthConfig() {
  return {
    issuer: required('UNIAUTH_ISSUER').replace(/\/+$/, ''),
    clientId: required('UNIAUTH_CLIENT_ID'),
    clientSecret: required('UNIAUTH_CLIENT_SECRET'),
  };
}

function noAvatarAsNull<T extends { image?: string | null }>(data: T): T {
  return data.image === '' ? { ...data, image: null } : data;
}

export function createAuth(prisma: PrismaService) {
  const { issuer, clientId, clientSecret } = uniauthConfig();
  const webOrigin = required('BETTER_AUTH_URL');

  return betterAuth({
    baseURL: webOrigin,
    secret: required('BETTER_AUTH_SECRET'),
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    trustedOrigins: [webOrigin],
    advanced: { cookiePrefix: 'unigym' },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: 'uniauth',
            discoveryUrl: `${issuer}/.well-known/openid-configuration`,
            clientId,
            clientSecret,
            authentication: 'basic',
            pkce: true,
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            overrideUserInfo: true,
            mapProfileToUser: (profile) => ({
              email: String(profile.email),
              emailVerified: profile.email_verified === true,
              name: String(profile.name || profile.email),
              image: typeof profile.picture === 'string' ? profile.picture : '',
            }),
          },
        ],
      }),
    ],
    databaseHooks: {
      user: {
        create: { before: async (user) => ({ data: noAvatarAsNull(user) }) },
        update: { before: async (data) => ({ data: noAvatarAsNull(data) }) },
      },
    },
    user: {
      additionalFields: {
        consentGivenAt: { type: 'date', required: false, input: false },
      },
    },
  });
}

export type UnigymAuth = ReturnType<typeof createAuth>;
