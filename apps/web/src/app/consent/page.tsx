"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { signOutEverywhere } from "@/lib/uniauth";

export default function ConsentPage() {
  const { data: session, isPending } = authClient.useSession();
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user.consentGivenAt) window.location.replace("/");
  }, [session]);

  useEffect(() => {
    void fetch("/api/legal/status")
      .then((response) => response.json())
      .then((data: { approved?: boolean }) =>
        setApproved(data.approved === true),
      )
      .catch(() => setApproved(false));
  }, []);

  async function agree() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/users/me/consent", { method: "POST" });
      if (!response.ok)
        throw new Error("Could not save your agreement. Please try again.");
      window.location.replace("/");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save your agreement.",
      );
      setSaving(false);
    }
  }

  if (isPending || !session || session.user.consentGivenAt) return null;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 px-6">
      <h1 className="text-3xl font-semibold">Before you use Unigym</h1>
      <p>
        Please read Unigym&apos;s{" "}
        <a className="underline" href="/terms">
          Terms of Service
        </a>{" "}
        and{" "}
        <a className="underline" href="/privacy">
          Privacy Policy
        </a>
        . Your uniAuth agreement does not cover Unigym.
      </p>
      {!approved && (
        <p role="status">
          The Unigym policies are being reviewed. Access will open after they
          are approved.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button
        className="rounded-md bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50"
        disabled={!approved || saving}
        onClick={() => void agree()}
      >
        I agree
      </button>
      <button
        className="self-start underline"
        onClick={() => void signOutEverywhere()}
      >
        Sign out
      </button>
    </main>
  );
}
