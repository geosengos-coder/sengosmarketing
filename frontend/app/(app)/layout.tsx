import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { OrganizationProvider } from "@/contexts/organization-context";
import { AppShell } from "@/components/app-shell";

/**
 * Layout for the authenticated app route group. Clerk lives here (not in the root)
 * so the marketing site loads no auth. Middleware guarantees the user is signed in;
 * active-organization resolution is wired in Phase 2, so no org is injected yet.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <OrganizationProvider organization={null}>
        <AppShell>{children}</AppShell>
      </OrganizationProvider>
    </ClerkProvider>
  );
}
