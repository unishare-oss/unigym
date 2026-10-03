import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SilentSignIn } from "@/components/auth/silent-sign-in";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unigym",
  description: "Gym memberships, classes, and bookings",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SilentSignIn />
        {children}
      </body>
    </html>
  );
}
