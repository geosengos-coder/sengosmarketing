import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/**
 * The base Prisma client. Intentionally NOT exported from the package: every
 * access to tenant data must go through {@link withTenant} (or, for privileged
 * platform operations, {@link withSystem}) so that a Postgres RLS context is
 * always set. This makes cross-tenant access impossible-by-construction rather
 * than prevented-by-convention (ADR-0003).
 */
const basePrisma = new PrismaClient();

/** A transaction-scoped client with the tenant/system RLS context applied. */
export type Tx = Prisma.TransactionClient;

type ScopeGuc = { key: "app.tenant_id"; value: string } | { key: "app.bypass_rls"; value: "on" };

/**
 * Runs `fn` inside a single interactive transaction whose connection has the RLS
 * GUC set via `set_config(..., is_local = true)`. Because `set_config` and every
 * query in `fn` execute on the SAME transaction/connection, the RLS policies see
 * the context, and because it is transaction-local it cannot leak across the
 * connection pool. This is the correct pattern for Prisma + Postgres RLS: the
 * client-extension approach does not guarantee shared-connection semantics.
 */
async function runScoped<T>(guc: ScopeGuc, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return basePrisma.$transaction(async (tx: Tx) => {
    await tx.$executeRaw`SELECT set_config(${guc.key}, ${guc.value}, true)`;
    return fn(tx);
  });
}

/**
 * Executes `fn` bound to a single organization (tenant). Every read/write inside
 * `fn` is restricted by RLS to that organization's rows.
 *
 * @example
 * const membership = await withTenant(orgId, (db) =>
 *   db.membership.findFirst({ where: { userId } }),
 * );
 */
export function withTenant<T>(organizationId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!organizationId) {
    throw new Error("withTenant() requires a non-empty organizationId");
  }
  return runScoped({ key: "app.tenant_id", value: organizationId }, fn);
}

/**
 * Executes `fn` with tenant RLS BYPASSED. Use ONLY for privileged platform
 * operations that legitimately span tenants: organization provisioning, the Clerk
 * user-sync webhook, seeding, and migrations. Never call this from request-scoped,
 * user-driven code paths.
 */
export function withSystem<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return runScoped({ key: "app.bypass_rls", value: "on" }, fn);
}
