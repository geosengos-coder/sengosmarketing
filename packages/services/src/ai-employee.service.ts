import { assertCan, NotFoundError, PERMISSIONS } from "@operatoros/core";
import { withTenant } from "@operatoros/database";
import { createAIEmployeeSchema } from "@operatoros/contracts";
import { validate } from "./validate";
import type { ServiceContext } from "./context";

/**
 * AI Employee use cases. The receptionist is created here as data + configuration —
 * the platform primitive, not a bespoke feature.
 */

export async function listAIEmployees(ctx: ServiceContext) {
  assertCan(ctx.permissions, PERMISSIONS.EMPLOYEE_VIEW);
  return withTenant(ctx.organizationId, (db) =>
    db.aIEmployee.findMany({ orderBy: { createdAt: "desc" }, include: { configuration: true } }),
  );
}

export async function getAIEmployee(ctx: ServiceContext, id: string) {
  assertCan(ctx.permissions, PERMISSIONS.EMPLOYEE_VIEW);
  const employee = await withTenant(ctx.organizationId, (db) =>
    db.aIEmployee.findUnique({ where: { id }, include: { configuration: true } }),
  );
  if (!employee) throw new NotFoundError("AI employee not found");
  return employee;
}

export async function createAIEmployee(ctx: ServiceContext, input: unknown) {
  assertCan(ctx.permissions, PERMISSIONS.EMPLOYEE_CREATE);
  const data = validate(createAIEmployeeSchema, input);
  ctx.logger.info("ai_employee.create", { organizationId: ctx.organizationId, name: data.name });
  return withTenant(ctx.organizationId, (db) =>
    db.aIEmployee.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        type: data.type,
        configuration: {
          create: {
            organizationId: ctx.organizationId,
            greeting: data.greeting,
            instructions: data.instructions,
          },
        },
      },
      include: { configuration: true },
    }),
  );
}
