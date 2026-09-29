"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  safeLocalPath,
  signInWithUniauth,
  silentCheckDone,
} from "@/lib/uniauth";

export default function LoginPage() {
  const [next] = useState(() =>
    typeof window === "undefined"
      ? "/"
      : safeLocalPath(new URLSearchParams(window.location.search).get("next")),
  );
  const [error, setError] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("error"),
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          window.location.replace(data.user.consentGivenAt ? next : "/consent");
        } else if (!error && !silentCheckDone()) {
          void signInWithUniauth({
            returnTo: next,
            errorReturnTo: window.location.href,
            silent: true,
          }).catch(() => {
            setError("start_failed");
            setChecking(false);
          });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setError("session_failed");
        setChecking(false);
      });
  }, [next, error]);

  if (checking) return null;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <h1 className="text-3xl font-semibold">Sign in to Unigym</h1>
      {error && error !== "login_required" && (
        <p role="alert">Sign-in failed ({error}). Please try again.</p>
      )}
      <button
        className="rounded-md bg-primary px-5 py-3 text-primary-foreground"
        onClick={() => void signInWithUniauth({ returnTo: next })}
      >
        Continue with uniAuth
      </button>
      <p className="text-sm text-muted-foreground">
        Review Unigym&apos;s{" "}
        <a className="underline" href="/terms">
          Terms
        </a>{" "}
        and{" "}
        <a className="underline" href="/privacy">
          Privacy Policy
        </a>{" "}
        before using the app.
      </p>
    </main>
  );
}
