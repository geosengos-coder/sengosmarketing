/**
 * System roles and their permission grants. These are seeded as global roles
 * (organizationId = null, isSystem = true). Per-organization custom roles can be
 * layered on later without changing this contract.
 */
import { ALL_PERMISSION_KEYS, PERMISSIONS, type PermissionKey } from "./permissions";

export const SYSTEM_ROLE_KEYS = ["owner", "admin", "member"] as const;
export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

export interface RoleDefinition {
  key: SystemRoleKey;
  name: string;
  description: string;
  /** "*" grants every permission; otherwise an explicit list. */
  permissions: "*" | PermissionKey[];
}

export const SYSTEM_ROLES: Record<SystemRoleKey, RoleDefinition> = {
  owner: {
    key: "owner",
    name: "Owner",
    description: "Full control over the organization, billing, and all AI employees.",
    permissions: "*",
  },
  admin: {
    key: "admin",
    name: "Admin",
    description:
      "Manage AI employees, knowledge, integrations, and members. No billing or org lifecycle control.",
    permissions: [
      PERMISSIONS.ORG_VIEW,
      PERMISSIONS.MEMBER_INVITE,
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.BILLING_VIEW,
      PERMISSIONS.EMPLOYEE_CREATE,
      PERMISSIONS.EMPLOYEE_MANAGE,
      PERMISSIONS.EMPLOYEE_VIEW,
      PERMISSIONS.KNOWLEDGE_MANAGE,
      PERMISSIONS.KNOWLEDGE_VIEW,
      PERMISSIONS.INTEGRATION_MANAGE,
      PERMISSIONS.INTEGRATION_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
  member: {
    key: "member",
    name: "Member",
    description: "View-oriented access to AI employees, knowledge, integrations, and analytics.",
    permissions: [
      PERMISSIONS.ORG_VIEW,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.EMPLOYEE_VIEW,
      PERMISSIONS.KNOWLEDGE_VIEW,
      PERMISSIONS.INTEGRATION_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
  },
};

/** Resolves a system role's concrete permission keys (expanding "*"). */
export function permissionsForRole(roleKey: SystemRoleKey): PermissionKey[] {
  const def = SYSTEM_ROLES[roleKey];
  return def.permissions === "*" ? [...ALL_PERMISSION_KEYS] : [...def.permissions];
}
