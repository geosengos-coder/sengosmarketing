-- OperatorOS — Row-Level Security policies (ADR-0003).
-- Source of truth for tenant isolation at the database layer.
--
-- Model: every tenant-owned table is FORCE-RLS. A row is visible only when its
-- organizationId equals the per-transaction GUC `app.tenant_id`, which the
-- tenant-scoped Prisma client sets via set_config(...) at the start of each
-- transaction (see database/src/client.ts). A separate `app.bypass_rls = 'on'`
-- GUC exists for privileged system operations (provisioning, migrations, seed).
--
-- NOTE: This file is the canonical policy definition. It must be applied as part
-- of a Prisma migration (append these statements to the migration that creates
-- the tables) so that RLS ships with the schema. Run order: tables -> this file.
--
-- Identifiers use Prisma's default quoting (PascalCase tables, camelCase columns).
-- current_setting(..., true) returns NULL (not an error) when the GUC is unset,
-- so the default posture with no tenant context is DENY.
--
-- CRITICAL: RLS is BYPASSED for Postgres superusers and BYPASSRLS roles. The app
-- and the isolation tests MUST connect as a limited role (see prisma/sql/app-role.sql);
-- connecting as a superuser silently disables all of the isolation below.

-- Helper: true when the current transaction is running with the system bypass.
CREATE OR REPLACE FUNCTION app_is_bypass() RETURNS boolean AS $$
  SELECT coalesce(current_setting('app.bypass_rls', true), 'off') = 'on';
$$ LANGUAGE sql STABLE;

-- Helper: the current tenant id (NULL when unset).
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '');
$$ LANGUAGE sql STABLE;

-- ---- Organization: a tenant may see only itself ----------------------------
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Organization"
  USING (app_is_bypass() OR "id" = app_current_tenant())
  WITH CHECK (app_is_bypass() OR "id" = app_current_tenant());

-- ---- Tenant-owned tables: scoped by organizationId -------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'OrganizationMember',
    'AIEmployee',
    'AIEmployeeConfiguration',
    'KnowledgeSource',
    'KnowledgeDocument',
    'Location',
    'BusinessProfile',
    'Integration',
    'UsageRecord',
    'AuditLog',
    'EventLog'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (app_is_bypass() OR "organizationId" = app_current_tenant())
         WITH CHECK (app_is_bypass() OR "organizationId" = app_current_tenant());', t);
  END LOOP;
END $$;

-- ---- Per-organization custom Role rows (future): scope non-system roles -----
-- System roles (organizationId IS NULL) are global reference data and remain readable;
-- once custom roles exist, they are tenant-scoped. Enabled but permissive for NULL org.
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Role"
  USING (app_is_bypass() OR "organizationId" IS NULL OR "organizationId" = app_current_tenant())
  WITH CHECK (app_is_bypass() OR "organizationId" IS NULL OR "organizationId" = app_current_tenant());

-- User, Permission, and RolePermission are global reference/identity data and are
-- intentionally NOT tenant-scoped here; access is mediated by the application layer.
