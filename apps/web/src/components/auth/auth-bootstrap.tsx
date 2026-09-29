"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { signInWithUniauth, silentCheckDone } from "@/lib/uniauth";

export function AuthBootstrap() {
  useEffect(() => {
    const path = window.location.pathname;
    if (
      ["/login", "/auth/return", "/consent", "/terms", "/privacy"].some(
        (excluded) => path === excluded || path.startsWith(`${excluded}/`),
      )
    )
      return;

    void authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          if (!data.user.consentGivenAt) window.location.replace("/consent");
          return;
        }
        if (!silentCheckDone()) {
          void signInWithUniauth({
            returnTo: window.location.href,
            errorReturnTo: window.location.href,
            silent: true,
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);
  return null;
}
