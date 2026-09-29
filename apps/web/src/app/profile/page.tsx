"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { accountSettingsURL, signOutEverywhere } from "@/lib/uniauth";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (!isPending && session && !session.user.consentGivenAt) {
      window.location.replace("/consent");
    }
  }, [isPending, session]);
  if (isPending) return null;
  if (!session) return null;
  if (!session.user.consentGivenAt) return null;
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold">Your account</h1>
      <p>{session.user.name}</p>
      <button
        className="self-start underline"
        onClick={() => window.location.assign(accountSettingsURL())}
      >
        Manage identity in uniAuth
      </button>
      <button
        className="self-start underline"
        onClick={() => void signOutEverywhere()}
      >
        Sign out everywhere
      </button>
    </main>
  );
}
