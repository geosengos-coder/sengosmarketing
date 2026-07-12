"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The caller's active organization (tenant). Resolved on the server and provided to
 * client components. Phase 2 wires active-org selection; Phase 0 establishes the
 * context so every client component reads the tenant the same way.
 */
export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
}

const OrganizationContext = createContext<ActiveOrganization | null>(null);

export function OrganizationProvider({
  organization,
  children,
}: {
  organization: ActiveOrganization | null;
  children: ReactNode;
}) {
  return (
    <OrganizationContext.Provider value={organization}>{children}</OrganizationContext.Provider>
  );
}

export function useOrganization(): ActiveOrganization | null {
  return useContext(OrganizationContext);
}
