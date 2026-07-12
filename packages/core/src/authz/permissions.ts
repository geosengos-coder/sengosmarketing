/**
 * The canonical catalog of permissions (capability strings). This is the single
 * source of truth: the database Permission table is seeded from here, and runtime
 * authorization checks reference these keys. Framework-free by design (ADR-0005).
 */

export const PERMISSIONS = {
  ORG_MANAGE: "org:manage",
  ORG_VIEW: "org:view",

  MEMBER_INVITE: "member:invite",
  MEMBER_MANAGE: "member:manage",
  MEMBER_VIEW: "member:view",

  BILLING_MANAGE: "billing:manage",
  BILLING_VIEW: "billing:view",

  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_MANAGE: "employee:manage",
  EMPLOYEE_VIEW: "employee:view",

  KNOWLEDGE_MANAGE: "knowledge:manage",
  KNOWLEDGE_VIEW: "knowledge:view",

  INTEGRATION_MANAGE: "integration:manage",
  INTEGRATION_VIEW: "integration:view",

  ANALYTICS_VIEW: "analytics:view",
  AUDIT_VIEW: "audit:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  category: string;
  description: string;
}

/** Every permission with metadata, used to seed the database catalog. */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    key: PERMISSIONS.ORG_MANAGE,
    category: "Organization",
    description: "Manage organization settings and lifecycle",
  },
  {
    key: PERMISSIONS.ORG_VIEW,
    category: "Organization",
    description: "View organization settings",
  },
  { key: PERMISSIONS.MEMBER_INVITE, category: "Members", description: "Invite new members" },
  {
    key: PERMISSIONS.MEMBER_MANAGE,
    category: "Members",
    description: "Manage members and their roles",
  },
  { key: PERMISSIONS.MEMBER_VIEW, category: "Members", description: "View members" },
  {
    key: PERMISSIONS.BILLING_MANAGE,
    category: "Billing",
    description: "Manage billing, plans, and payment methods",
  },
  { key: PERMISSIONS.BILLING_VIEW, category: "Billing", description: "View billing and usage" },
  {
    key: PERMISSIONS.EMPLOYEE_CREATE,
    category: "AI Employees",
    description: "Create AI employees",
  },
  {
    key: PERMISSIONS.EMPLOYEE_MANAGE,
    category: "AI Employees",
    description: "Configure and manage AI employees",
  },
  { key: PERMISSIONS.EMPLOYEE_VIEW, category: "AI Employees", description: "View AI employees" },
  {
    key: PERMISSIONS.KNOWLEDGE_MANAGE,
    category: "Knowledge",
    description: "Manage knowledge sources",
  },
  { key: PERMISSIONS.KNOWLEDGE_VIEW, category: "Knowledge", description: "View knowledge sources" },
  {
    key: PERMISSIONS.INTEGRATION_MANAGE,
    category: "Integrations",
    description: "Connect and manage integrations",
  },
  { key: PERMISSIONS.INTEGRATION_VIEW, category: "Integrations", description: "View integrations" },
  {
    key: PERMISSIONS.ANALYTICS_VIEW,
    category: "Analytics",
    description: "View analytics and reports",
  },
  { key: PERMISSIONS.AUDIT_VIEW, category: "Security", description: "View the audit log" },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_CATALOG.map((p) => p.key);
