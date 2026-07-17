import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

/** Auth route group: Clerk provider without the app shell. Keeps marketing auth-free. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
