import { authClient } from "./auth-client";

export const uniauthURL =
  process.env.NEXT_PUBLIC_UNIAUTH_URL ?? "http://localhost:3002";

const CHECKED_COOKIE = "unigym_uniauth_checked";
const RETURN_KEY = "unigym:return-to";

export function safeLocalPath(value: string | null): string {
  if (!value) return "/";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function silentCheckDone(): boolean {
  if (/bot|crawl|spider|preview/i.test(navigator.userAgent)) return true;
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${CHECKED_COOKIE}=`));
}

export async function signInWithUniauth({
  returnTo,
  errorReturnTo,
  silent = false,
}: {
  returnTo: string;
  errorReturnTo?: string;
  silent?: boolean;
}) {
  const safeReturnTo = safeLocalPath(returnTo);
  document.cookie = `${CHECKED_COOKIE}=1; Max-Age=600; Path=/; SameSite=Lax`;
  sessionStorage.setItem(RETURN_KEY, safeLocalPath(errorReturnTo ?? returnTo));
  await authClient.signIn.social({
    provider: "uniauth",
    callbackURL: `${window.location.origin}${safeReturnTo}`,
    errorCallbackURL: `${window.location.origin}/auth/return`,
    ...(silent ? { additionalParams: { prompt: "none" } } : {}),
  });
}

export function takeReturnTo(): string {
  const value = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return safeLocalPath(value);
}

export async function signOutEverywhere() {
  await authClient.signOut();
  window.location.replace(
    `${uniauthURL}/logout?redirect=${encodeURIComponent(`${window.location.origin}/`)}`,
  );
}

export function accountSettingsURL(): string {
  return `${uniauthURL}/account?redirect=${encodeURIComponent(window.location.href)}`;
}
