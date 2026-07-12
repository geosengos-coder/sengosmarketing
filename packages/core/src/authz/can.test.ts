import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "./permissions";
import { permissionsForRole } from "./roles";
import { assertCan, AuthorizationError, can, canAll, canAny } from "./can";

describe("authz: system role grants", () => {
  it("owner has every permission", () => {
    const owner = permissionsForRole("owner");
    expect(can(owner, PERMISSIONS.ORG_MANAGE)).toBe(true);
    expect(can(owner, PERMISSIONS.BILLING_MANAGE)).toBe(true);
    expect(can(owner, PERMISSIONS.AUDIT_VIEW)).toBe(true);
  });

  it("admin can manage employees but not billing or org lifecycle", () => {
    const admin = permissionsForRole("admin");
    expect(can(admin, PERMISSIONS.EMPLOYEE_CREATE)).toBe(true);
    expect(can(admin, PERMISSIONS.EMPLOYEE_MANAGE)).toBe(true);
    expect(can(admin, PERMISSIONS.BILLING_MANAGE)).toBe(false);
    expect(can(admin, PERMISSIONS.ORG_MANAGE)).toBe(false);
  });

  it("member is view-only and cannot mutate", () => {
    const member = permissionsForRole("member");
    expect(can(member, PERMISSIONS.EMPLOYEE_VIEW)).toBe(true);
    expect(can(member, PERMISSIONS.EMPLOYEE_CREATE)).toBe(false);
    expect(can(member, PERMISSIONS.KNOWLEDGE_MANAGE)).toBe(false);
    expect(can(member, PERMISSIONS.MEMBER_INVITE)).toBe(false);
  });
});

describe("authz: combinators", () => {
  const admin = permissionsForRole("admin");

  it("canAll requires every permission", () => {
    expect(canAll(admin, [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.EMPLOYEE_MANAGE])).toBe(true);
    expect(canAll(admin, [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.BILLING_MANAGE])).toBe(false);
  });

  it("canAny requires at least one", () => {
    expect(canAny(admin, [PERMISSIONS.BILLING_MANAGE, PERMISSIONS.EMPLOYEE_VIEW])).toBe(true);
    expect(canAny(admin, [PERMISSIONS.BILLING_MANAGE, PERMISSIONS.ORG_MANAGE])).toBe(false);
  });
});

describe("authz: assertCan", () => {
  it("throws AuthorizationError when the permission is missing", () => {
    const member = permissionsForRole("member");
    expect(() => assertCan(member, PERMISSIONS.EMPLOYEE_CREATE)).toThrow(AuthorizationError);
  });

  it("does not throw when the permission is present", () => {
    const owner = permissionsForRole("owner");
    expect(() => assertCan(owner, PERMISSIONS.EMPLOYEE_CREATE)).not.toThrow();
  });
});
