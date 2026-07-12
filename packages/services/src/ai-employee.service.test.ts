import { describe, expect, it } from "vitest";
import { AuthorizationError, PERMISSIONS, createLogger } from "@operatoros/core";
import { createAIEmployee, listAIEmployees } from "./ai-employee.service";
import type { ServiceContext } from "./context";

/**
 * Authorization is enforced before any data access, so these run without a DB:
 * assertCan throws first. (Data-access behavior is covered by the tenant-isolation
 * integration test in @operatoros/database.)
 */
function ctx(permissions: string[]): ServiceContext {
  return {
    organizationId: "org_test",
    actorUserId: "user_test",
    permissions: new Set(permissions),
    logger: createLogger({}, "error"),
  };
}

describe("aiEmployeeService authorization", () => {
  it("rejects createAIEmployee without employee:create", async () => {
    await expect(createAIEmployee(ctx([]), { name: "Ava" })).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("rejects listAIEmployees without employee:view", async () => {
    await expect(listAIEmployees(ctx([PERMISSIONS.KNOWLEDGE_VIEW]))).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});
