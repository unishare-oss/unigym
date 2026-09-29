import { createRemoteJWKSet, jwtVerify } from 'jose';
import { uniauthConfig } from './auth.factory.js';

export const LOGOUT_EVENT =
  'http://schemas.openid.net/event/backchannel-logout';
export const USER_DELETED_EVENT = 'urn:uniauth:event:user-deleted';
export const USER_UPDATED_EVENT = 'urn:uniauth:event:user-updated';
export type UniauthEvent =
  typeof LOGOUT_EVENT | typeof USER_DELETED_EVENT | typeof USER_UPDATED_EVENT;

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let cachedIssuer: string | undefined;

export async function verifyUniauthEvent(token: string, event: UniauthEvent) {
  try {
    const { issuer, clientId } = uniauthConfig();
    if (!cachedJwks || cachedIssuer !== issuer) {
      cachedJwks = createRemoteJWKSet(new URL(`${issuer}/jwks`));
      cachedIssuer = issuer;
    }
    const { payload } = await jwtVerify(token, cachedJwks, {
      issuer,
      audience: clientId,
    });
    const events = payload.events;
    if (!events || typeof events !== 'object' || Array.isArray(events))
      return null;
    if (Object.keys(events).length !== 1 || !Object.hasOwn(events, event))
      return null;
    const data = (events as Record<string, unknown>)[event];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    if ('nonce' in payload || typeof payload.sub !== 'string' || !payload.sub)
      return null;
    return { sub: payload.sub, data: data as Record<string, unknown> };
  } catch {
    return null;
  }
}
