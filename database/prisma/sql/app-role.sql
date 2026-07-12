-- OperatorOS — application database role.
--
-- CRITICAL: RLS is bypassed for Postgres SUPERUSERS and roles with BYPASSRLS.
-- The application (and the isolation tests) MUST connect as this limited role or
-- tenant isolation is silently disabled. Production uses an equivalently limited
-- role (e.g. Neon's app role); migrations/provisioning use a privileged role.
--
-- Apply AFTER the schema migration (tables must exist to grant on them).

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app_pw' NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
