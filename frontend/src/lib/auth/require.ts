import { assertCan, type PermissionKey } from "@operatoros/core";
import { getIdentity, getOrgContext, type AuthIdentity, type OrgAuthContext } from "./context";

/**
 * Authorization guards for route handlers and server actions. These throw on
 * failure; a shared error boundary / handler maps them to 401/403 responses.
 */

export class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not a member of this organization") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Requires an authenticated, DB-synced user. */
export async function requireIdentity(): Promise<AuthIdentity> {
  const identity = await getIdentity();
  if (!identity) throw new UnauthenticatedError();
  return identity;
}

/** Requires active membership in the organization. */
export async function requireOrg(organizationId: string): Promise<OrgAuthContext> {
  const ctx = await getOrgContext(organizationId);
  if (!ctx) throw new ForbiddenError();
  return ctx;
}

/** Requires active membership AND a specific permission within the organization. */
export async function requirePermission(
  organizationId: string,
  permission: PermissionKey,
): Promise<OrgAuthContext> {
  const ctx = await requireOrg(organizationId);
  assertCan(ctx.permissions, permission); // throws AuthorizationError -> 403
  return ctx;
}
