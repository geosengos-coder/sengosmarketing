import type { ReactNode } from "react";
import { OrganizationProvider } from "@/contexts/organization-context";
import { AppShell } from "@/components/app-shell";

/**
 * Layout for the authenticated app route group. Middleware guarantees the user is
 * signed in; active-organization resolution (from the URL or a stored preference)
 * is wired in Phase 2, so no organization is injected yet.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider organization={null}>
      <AppShell>{children}</AppShell>
    </OrganizationProvider>
  );
}
