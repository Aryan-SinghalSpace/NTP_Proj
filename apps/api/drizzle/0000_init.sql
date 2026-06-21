-- 0000_init.sql — first vertical slice: tenancy + Field Library meta-model,
-- with Row-Level Security (tenant-isolation invariant #6).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------- tenant (platform-global) ----------
CREATE TABLE tenant (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  tier       text NOT NULL DEFAULT 'low',
  region     text NOT NULL DEFAULT 'in',
  status     text NOT NULL DEFAULT 'active',
  settings   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- field_definition (append-only versions) ----------
CREATE TABLE field_definition (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  version      integer NOT NULL DEFAULT 1,
  tier         text NOT NULL CHECK (tier IN ('core','super','tenant_custom')),
  tenant_id    uuid REFERENCES tenant(id),
  entity       text NOT NULL,
  key          text NOT NULL,
  display_name text NOT NULL,
  data_type    text NOT NULL,
  validation   jsonb NOT NULL DEFAULT '{}'::jsonb,
  options      jsonb NOT NULL DEFAULT '[]'::jsonb,
  derived      jsonb,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','deactivated')),
  is_locked    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version)
);
CREATE INDEX field_definition_entity_idx ON field_definition (entity, status);
CREATE INDEX field_definition_tenant_idx ON field_definition (tenant_id);

-- ---------- Row-Level Security ----------
-- The app connects as a NON-superuser role (no BYPASSRLS), and sets
-- app.role / app.tenant_id per transaction. NULLIF(...,'') turns an unset/empty
-- setting into NULL so comparisons simply yield no rows instead of erroring.

ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK ( current_setting('app.role', true) = 'platform' );

ALTER TABLE field_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY field_definition_isolation ON field_definition FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id IS NULL                       -- Core/Super visible to every tenant
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR ( tier = 'tenant_custom'
         AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid )
  );

-- ---------- grants to the non-superuser app role ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant, field_definition TO tracewell_app;
