-- Runs once on first Postgres container init.
-- Creates the NON-superuser application role used by the API.
-- This role is intentionally WITHOUT BYPASSRLS so Row-Level Security
-- is always enforced (tenant-isolation invariant #6).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tracewell_app') THEN
    CREATE ROLE tracewell_app LOGIN PASSWORD 'tracewell_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE tracewell TO tracewell_app;
GRANT USAGE ON SCHEMA public TO tracewell_app;
-- Table-level grants are applied by migrations as tables are created.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tracewell_app;
