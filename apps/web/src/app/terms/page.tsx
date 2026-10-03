import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service · Unigym" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <h2>Using Unigym</h2>
      <p>
        Unigym helps you manage gym memberships, classes and bookings. You sign
        in with your uniAuth account. These terms cover Unigym only.
      </p>
      <h2>Your account</h2>
      <p>
        Keep your uniAuth sign-in safe. You are responsible for what happens in
        Unigym under your account.
      </p>
      <h2>Ending your use</h2>
      <p>
        You can stop using Unigym at any time. Deleting your uniAuth account
        also deletes your Unigym data.
      </p>
    </LegalPage>
  );
}
