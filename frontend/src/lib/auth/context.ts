import { auth } from "@clerk/nextjs/server";
import { withSystem, withTenant } from "@operatoros/database";
import { permissionsForRole, type PermissionKey, type SystemRoleKey } from "@operatoros/core";

/**
 * Resolves the authenticated caller's identity and, optionally, their authorization
 * within a specific organization. Clerk supplies identity; our DB supplies the
 * membership, role, and resolved permission set (ADR-0009).
 *
 * Active-organization selection UI arrives in Phase 2; here the organization is
 * passed explicitly by the caller (e.g. from a route param) and membership is
 * verified against it inside that tenant's RLS context.
 */

export interface AuthIdentity {
  clerkUserId: string;
  userId: string;
  email: string;
}

export interface OrgAuthContext extends AuthIdentity {
  organizationId: string;
  roleKey: string;
  permissions: Set<string>;
}

/** The Clerk-authenticated user, mirrored into our DB. Null if unauthenticated. */
export async function getIdentity(): Promise<AuthIdentity | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  // User lookup is a global-identity read; use the system context.
  const user = await withSystem((db) => db.user.findUnique({ where: { clerkUserId } }));
  if (!user) return null; // Clerk user not yet synced (webhook pending).

  return { clerkUserId, userId: user.id, email: user.email };
}

/**
 * Verifies the caller is an active member of `organizationId` and returns their
 * resolved permissions. Membership is read inside the tenant's RLS context.
 * Returns null when the caller is not a member.
 */
export async function getOrgContext(organizationId: string): Promise<OrgAuthContext | null> {
  const identity = await getIdentity();
  if (!identity) return null;

  const membership = await withTenant(organizationId, (db) =>
    db.organizationMember.findFirst({
      where: { userId: identity.userId, status: "ACTIVE" },
      include: { role: true },
    }),
  );
  if (!membership) return null;

  // Phase 0 ships system roles; resolve their grants from the core definitions.
  const permissions = new Set<string>(
    permissionsForRole(membership.role.key as SystemRoleKey) as PermissionKey[],
  );

  return {
    ...identity,
    organizationId,
    roleKey: membership.role.key,
    permissions,
  };
}
