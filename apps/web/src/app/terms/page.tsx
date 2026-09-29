import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service | Unigym" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 py-16">
      <Link className="underline" href="/login">
        Back
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Unigym Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 29 September 2026
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Using Unigym</h2>
        <p>
          Unigym provides access to its gym application and related features as
          they become available. Use it lawfully and follow the rules displayed
          for any feature you use. Do not misuse the service, impersonate
          another person, interfere with its operation, or try to access another
          person&apos;s account.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Your account</h2>
        <p>
          You sign in through uniAuth. Keep your uniAuth account secure. Unigym
          keeps a separate session for this app. Changes to your name, email,
          picture, password, or linked sign-in methods are managed in uniAuth.
          Unigym may restrict access if an account is used to harm others or the
          service.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Availability and changes</h2>
        <p>
          Features may change or be unavailable while Unigym is being developed.
          We may update these terms. If a material change requires renewed
          agreement, we will ask you before you continue using protected
          features.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Privacy and deletion</h2>
        <p>
          Our{" "}
          <Link className="underline" href="/privacy">
            Privacy Policy
          </Link>{" "}
          explains the data Unigym handles. Deleting your uniAuth account also
          deletes your local Unigym account. Signing out through uniAuth ends
          your sessions across connected apps.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Governing law</h2>
        <p>These terms are governed by the laws of Thailand.</p>
      </section>
    </main>
  );
}
