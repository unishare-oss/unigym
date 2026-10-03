"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { signInWithUniauth, silentCheckDone } from "@/lib/uniauth";

/**
 * On every page load: reads the session. For a signed-in visitor, that slides the session to
 * 7 more days at most once a day (the API's updateAge) and refreshes the cookie with it.
 * A signed-out visitor is checked silently on uniAuth, at most once per 10 minutes, and
 * comes back to the same page signed in or still signed out.
 */
export function SilentSignIn() {
  // Once only: a second sign-in start would make the code exchange fail with invalid_grant
  // (React Strict Mode runs effects twice in dev).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const { pathname } = window.location;
    // These pages run their own sign-in flow.
    if (pathname.startsWith("/auth/") || pathname === "/login") return;
    void authClient.getSession().then(({ data }) => {
      if (data || silentCheckDone()) return;
      void signInWithUniauth({ returnTo: window.location.href, silent: true });
    });
  }, []);
  return null;
}
