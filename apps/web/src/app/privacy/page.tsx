import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy | Unigym" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 py-16">
      <Link className="underline" href="/login">
        Back
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Unigym Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 29 September 2026
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Who handles your data</h2>
        <p>
          The Unigym operator handles data needed for this app. uniAuth
          separately manages your shared identity and sign-in methods. Questions
          and requests about your uniAuth identity should be made through your
          uniAuth account page.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data we receive and keep</h2>
        <p>
          When you sign in, uniAuth sends Unigym your unique uniAuth user ID,
          name, email address, email verification status, and profile picture.
          Unigym stores a local copy so it can identify you and display your
          account. It also stores local session tokens, session expiry, device
          or browser information, IP address supplied with the session, and the
          time you agree to these policies. Unigym does not receive your uniAuth
          password.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Why we use it</h2>
        <p>
          We use this data to sign you in, keep your session secure, show your
          profile, record your agreement, and respond to account changes or
          deletion sent by uniAuth. Unigym does not currently store workouts,
          bookings, or membership records.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cookies and sharing</h2>
        <p>
          Unigym sets a host-only session cookie on the Unigym web host. A
          short-lived cookie limits repeated silent sign-in checks. Your browser
          also visits uniAuth when signing in or out; uniAuth uses its own
          cookies. Unigym does not use advertising cookies or sell your account
          data.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Updates and deletion</h2>
        <p>
          uniAuth can tell Unigym when your name, email, or picture changes; we
          update the local copy. When uniAuth tells us your account was deleted,
          we delete the local Unigym user and sessions. If you only sign out,
          your local account remains but its sessions end.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p>
          You can decline the Unigym terms and sign out. Manage your shared
          identity or delete your uniAuth account from the{" "}
          <a className="underline" href="https://auth.psstee.dev/account">
            uniAuth account page
          </a>
          . For questions about Unigym-held data, contact the Unigym operator
          through the support channel provided for this service.
        </p>
      </section>
    </main>
  );
}
