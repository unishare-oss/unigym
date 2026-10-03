import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy · Unigym" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we keep</h2>
      <p>
        From uniAuth: your name, email address, whether the email is verified,
        and your profile picture. Unigym also keeps your sign-in sessions and
        when you accepted these terms.
      </p>
      <h2>Why</h2>
      <p>
        To sign you in, show who you are, and run Unigym&rsquo;s features for
        you.
      </p>
      <h2>Changes and deletion</h2>
      <p>
        Changes to your name, email or picture on uniAuth are copied to Unigym.
        Deleting your uniAuth account deletes your Unigym data.
      </p>
    </LegalPage>
  );
}
