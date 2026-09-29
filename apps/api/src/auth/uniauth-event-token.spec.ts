import { createServer, type Server } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  LOGOUT_EVENT,
  USER_DELETED_EVENT,
  verifyUniauthEvent,
} from './uniauth-event-token.js';

describe('uniAuth event tokens', () => {
  let server: Server;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
  let issuer: string;

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey;
    const jwk = await exportJWK(keys.publicKey);
    server = createServer((_request, response) => {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          keys: [{ ...jwk, kid: 'test-key', use: 'sig', alg: 'RS256' }],
        }),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('missing test address');
    issuer = `http://127.0.0.1:${address.port}/api/auth`;
    process.env.UNIAUTH_ISSUER = issuer;
    process.env.UNIAUTH_CLIENT_ID = 'unigym-test-client';
    process.env.UNIAUTH_CLIENT_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  function token(
    events: Record<string, unknown>,
    audience = 'unigym-test-client',
    nonce?: string,
  ) {
    return new SignJWT({ events, ...(nonce ? { nonce } : {}) })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('uniauth-user-1')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  }

  it('accepts only the requested signed event', async () => {
    const jwt = await token({ [USER_DELETED_EVENT]: {} });
    expect(await verifyUniauthEvent(jwt, USER_DELETED_EVENT)).toEqual({
      sub: 'uniauth-user-1',
      data: {},
    });
    expect(await verifyUniauthEvent(jwt, LOGOUT_EVENT)).toBeNull();
  });

  it('rejects a different audience, mixed events, and nonce', async () => {
    expect(
      await verifyUniauthEvent(
        await token({ [USER_DELETED_EVENT]: {} }, 'other-app'),
        USER_DELETED_EVENT,
      ),
    ).toBeNull();
    expect(
      await verifyUniauthEvent(
        await token({ [USER_DELETED_EVENT]: {}, [LOGOUT_EVENT]: {} }),
        USER_DELETED_EVENT,
      ),
    ).toBeNull();
    expect(
      await verifyUniauthEvent(
        await token(
          { [USER_DELETED_EVENT]: {} },
          'unigym-test-client',
          'id-token-nonce',
        ),
        USER_DELETED_EVENT,
      ),
    ).toBeNull();
  });
});
