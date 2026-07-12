import { afterAll, describe, expect, it } from "vitest";
import { withSystem, withTenant } from "./client";

/**
 * Cross-tenant isolation is a SECURITY CONTROL, so we prove it, not assume it.
 * This is an integration test: it requires a migrated database with the RLS
 * policies applied. Run it with `RUN_DB_TESTS=1` and a `DATABASE_URL` pointing at
 * a disposable test database (wired into CI). It is skipped otherwise so unit
 * runs stay hermetic.
 */
const RUN = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("tenant isolation (RLS)", () => {
  const suffix = Date.now().toString(36);
  let orgA = "";
  let orgB = "";

  it("provisions two organizations and one employee in A", async () => {
    const a = await withSystem((db) =>
      db.organization.create({ data: { slug: `iso-a-${suffix}`, name: "Org A" } }),
    );
    const b = await withSystem((db) =>
      db.organization.create({ data: { slug: `iso-b-${suffix}`, name: "Org B" } }),
    );
    orgA = a.id;
    orgB = b.id;
    await withTenant(orgA, (db) =>
      db.aIEmployee.create({ data: { organizationId: orgA, name: "Ava (A)" } }),
    );
  });

  it("tenant A sees its own employee", async () => {
    const list = await withTenant(orgA, (db) => db.aIEmployee.findMany());
    expect(list).toHaveLength(1);
  });

  it("tenant B cannot READ tenant A's employee", async () => {
    const list = await withTenant(orgB, (db) => db.aIEmployee.findMany());
    expect(list).toHaveLength(0);
  });

  it("tenant B cannot WRITE into tenant A (RLS WITH CHECK)", async () => {
    await expect(
      withTenant(orgB, (db) =>
        db.aIEmployee.create({ data: { organizationId: orgA, name: "intruder" } }),
      ),
    ).rejects.toBeTruthy();
  });

  afterAll(async () => {
    if (!RUN || !orgA) return;
    await withSystem(async (db) => {
      await db.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });
    });
  });
});
