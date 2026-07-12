/**
 * Pure authorization checks. These operate on a resolved set of permission keys
 * (e.g. derived from a member's role) and are the deterministic gate for every
 * privileged action — including AI tool calls (see docs Security.md §2).
 */
import { ForbiddenError } from "../errors";
import type { PermissionKey } from "./permissions";

export type GrantedPermissions = Iterable<PermissionKey | string>;

function toSet(granted: GrantedPermissions): Set<string> {
  return granted instanceof Set ? (granted as Set<string>) : new Set(granted);
}

/** True if the granted set contains the required permission. */
export function can(granted: GrantedPermissions, permission: PermissionKey): boolean {
  return toSet(granted).has(permission);
}

/** True if the granted set contains every required permission. */
export function canAll(granted: GrantedPermissions, permissions: PermissionKey[]): boolean {
  const set = toSet(granted);
  return permissions.every((p) => set.has(p));
}

/** True if the granted set contains at least one of the required permissions. */
export function canAny(granted: GrantedPermissions, permissions: PermissionKey[]): boolean {
  const set = toSet(granted);
  return permissions.some((p) => set.has(p));
}

/** Thrown when an authorization check fails. Extends ForbiddenError → maps to HTTP 403. */
export class AuthorizationError extends ForbiddenError {
  constructor(public readonly permission: PermissionKey) {
    super(`Missing required permission: ${permission}`);
    this.name = "AuthorizationError";
  }
}

/** Asserts the permission is granted, throwing {@link AuthorizationError} otherwise. */
export function assertCan(granted: GrantedPermissions, permission: PermissionKey): void {
  if (!can(granted, permission)) {
    throw new AuthorizationError(permission);
  }
}
