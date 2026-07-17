import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Sengos Digital Systems — The operating system for AI employees",
  description:
    "Connect your systems and Sengos Digital Systems learns your business — then answers the phone, books appointments, and follows through.",
};

/**
 * Root layout: no auth. The marketing site is fully public and dependency-free.
 * Clerk lives in the (app) and (auth) route groups only.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
