/**
 * @operatoros/core — framework-free domain logic shared across services.
 * No imports of Next.js, Prisma, Twilio, or any provider SDK (ADR-0005).
 */
// `./authz` (RBAC) is dormant Phase 2 platform groundwork — see /platform/README.md.
// Not exported while only the parked dashboard consumes it.
export * from "./errors";
export * from "./logging";
