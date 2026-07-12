import { assertCan, PERMISSIONS } from "@operatoros/core";
import { withTenant } from "@operatoros/database";
import type { Prisma } from "@operatoros/database";
import { updateBusinessProfileSchema } from "@operatoros/contracts";
import { validate } from "./validate";
import type { ServiceContext } from "./context";

/**
 * Organization use cases. Each follows the standard shape: authorize (core) →
 * validate (contracts) → persist (tenant-scoped database) → log. No HTTP here.
 */

export async function getBusinessProfile(ctx: ServiceContext) {
  assertCan(ctx.permissions, PERMISSIONS.ORG_VIEW);
  return withTenant(ctx.organizationId, (db) =>
    db.businessProfile.findUnique({ where: { organizationId: ctx.organizationId } }),
  );
}

export async function updateBusinessProfile(ctx: ServiceContext, input: unknown) {
  assertCan(ctx.permissions, PERMISSIONS.ORG_MANAGE);
  const { hours, ...rest } = validate(updateBusinessProfileSchema, input);
  // The `hours` JSON blob is validated as an object; adapt it to Prisma's JSON input.
  const data = {
    ...rest,
    ...(hours !== undefined ? { hours: hours as Prisma.InputJsonValue } : {}),
  };
  ctx.logger.info("business_profile.update", { organizationId: ctx.organizationId });
  return withTenant(ctx.organizationId, (db) =>
    db.businessProfile.upsert({
      where: { organizationId: ctx.organizationId },
      create: { organizationId: ctx.organizationId, ...data },
      update: data,
    }),
  );
}
