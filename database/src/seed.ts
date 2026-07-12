/**
 * Seeds global reference data: the permission catalog and the system roles with
 * their grants. Idempotent (upserts), so it is safe to run repeatedly. Runs under
 * withSystem() (RLS bypass) because permissions/roles are global, non-tenant data,
 * and wraps the whole seed in one transaction so it is atomic.
 *
 * Run: `pnpm db:seed`
 */
import {
  PERMISSION_CATALOG,
  SYSTEM_ROLE_KEYS,
  SYSTEM_ROLES,
  permissionsForRole,
} from "@operatoros/core";
import { withSystem } from "./client";

async function main() {
  await withSystem(async (db) => {
    // 1) Permission catalog.
    for (const p of PERMISSION_CATALOG) {
      await db.permission.upsert({
        where: { key: p.key },
        create: { key: p.key, description: p.description, category: p.category },
        update: { description: p.description, category: p.category },
      });
    }

    // 2) System roles (organizationId = null, isSystem = true) + their grants.
    for (const roleKey of SYSTEM_ROLE_KEYS) {
      const def = SYSTEM_ROLES[roleKey];

      // Unique index is (organizationId, key); for system roles organizationId is
      // null, so locate by key + null org via findFirst rather than a unique upsert.
      const existing = await db.role.findFirst({
        where: { key: def.key, organizationId: null },
      });
      const role = existing
        ? await db.role.update({
            where: { id: existing.id },
            data: { name: def.name, description: def.description, isSystem: true },
          })
        : await db.role.create({
            data: { key: def.key, name: def.name, description: def.description, isSystem: true },
          });

      // Reset and reassign grants to match the current definition.
      await db.rolePermission.deleteMany({ where: { roleId: role.id } });
      const keys = permissionsForRole(roleKey);
      const permissions = await db.permission.findMany({ where: { key: { in: keys } } });
      await db.rolePermission.createMany({
        data: permissions.map((perm) => ({ roleId: role.id, permissionId: perm.id })),
        skipDuplicates: true,
      });

      console.log(`Seeded role "${def.key}" with ${permissions.length} permissions.`);
    }

    console.log(`Seeded ${PERMISSION_CATALOG.length} permissions.`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
