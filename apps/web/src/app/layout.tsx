import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unigym",
  description: "Gym memberships, classes, and bookings",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
