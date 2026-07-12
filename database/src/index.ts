/**
 * @operatoros/database — the single gateway to persistent data.
 *
 * Consumers get tenant-scoped access only: use `withTenant(organizationId, fn)`
 * for all user-driven data access, or `withSystem(fn)` for privileged platform
 * operations. The raw PrismaClient instance is deliberately not exported.
 */
export { withTenant, withSystem } from "./client";
export type { Tx } from "./client";

// Re-export generated enums and types (e.g. PlanTier, EmployeeStatus, Prisma) so
// callers have one import surface for the data model. This exposes the
// PrismaClient *class* for typing only — application code must not instantiate it;
// without a tenant GUC, RLS denies access to tenant tables by default.
export * from "@prisma/client";
