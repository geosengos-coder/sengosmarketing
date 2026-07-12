"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { primaryNav } from "@/config/nav";
import { useOrganization } from "@/contexts/organization-context";

/**
 * The authenticated application shell: sidebar navigation + top bar. Structure
 * only — feature pages render into {children} in later phases.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const organization = useOrganization();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-border p-4">
        <div className="mb-6 px-3 text-lg font-semibold">OperatorOS</div>
        <nav className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <span className="text-sm text-muted-foreground">
            {organization?.name ?? "No organization selected"}
          </span>
          <UserButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
