-- 0006_users_roles.sql — tenant-scoped identity & access: configurable roles +
-- tenant users. RLS-isolated (#6). Groundwork for real auth (OIDC) later — for
-- now users are records; the x-tenant-id header is still the auth stand-in.

CREATE TABLE role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant(id),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,   -- resource -> {create,read,update,delete}
  is_system   boolean NOT NULL DEFAULT false,        -- built-in; not deletable
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX role_tenant_name_uq ON role (tenant_id, lower(name));

ALTER TABLE role ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_isolation ON role FOR ALL
  USING (current_setting('app.role', true) = 'platform'
         OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform'
         OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON role TO tracewell_app;

CREATE TABLE tenant_user (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant(id),
  name           text NOT NULL,
  email          text NOT NULL,
  role_id        uuid REFERENCES role(id),
  status         text NOT NULL DEFAULT 'invited' CHECK (status IN ('active','invited','disabled')),
  last_active_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tenant_user_email_uq ON tenant_user (tenant_id, lower(email));
CREATE INDEX tenant_user_role_idx ON tenant_user (role_id);

ALTER TABLE tenant_user ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_user_isolation ON tenant_user FOR ALL
  USING (current_setting('app.role', true) = 'platform'
         OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform'
         OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_user TO tracewell_app;

-- ---------- seed roles (permission matrix per role) ----------
INSERT INTO role (tenant_id, name, description, is_system, permissions) VALUES
 ('00000000-0000-0000-0000-000000000001','Tenant Admin','Full control of this tenant — config, users, workflows, data.', true,
  '{"Master Data":{"create":true,"read":true,"update":true,"delete":true},"Field Library":{"create":true,"read":true,"update":true,"delete":true},"Workflows":{"create":true,"read":true,"update":true,"delete":true},"Events":{"create":true,"read":true,"update":true,"delete":true},"Labels":{"create":true,"read":true,"update":true,"delete":true},"Users & Roles":{"create":true,"read":true,"update":true,"delete":true}}'::jsonb),
 ('00000000-0000-0000-0000-000000000001','Operations','Capture events, run dispatch & receive, manage batches.', false,
  '{"Master Data":{"create":true,"read":true,"update":true,"delete":false},"Field Library":{"create":false,"read":true,"update":false,"delete":false},"Workflows":{"create":false,"read":true,"update":false,"delete":false},"Events":{"create":true,"read":true,"update":true,"delete":false},"Labels":{"create":true,"read":true,"update":false,"delete":false},"Users & Roles":{"create":false,"read":false,"update":false,"delete":false}}'::jsonb),
 ('00000000-0000-0000-0000-000000000001','QA','Hold/release, quality checks, recall initiation.', false,
  '{"Master Data":{"create":false,"read":true,"update":false,"delete":false},"Field Library":{"create":false,"read":true,"update":false,"delete":false},"Workflows":{"create":false,"read":true,"update":false,"delete":false},"Events":{"create":true,"read":true,"update":true,"delete":false},"Labels":{"create":false,"read":true,"update":false,"delete":false},"Users & Roles":{"create":false,"read":false,"update":false,"delete":false}}'::jsonb),
 ('00000000-0000-0000-0000-000000000001','Dealer','Scan inbound, confirm receive against dispatch.', false,
  '{"Master Data":{"create":false,"read":true,"update":false,"delete":false},"Field Library":{"create":false,"read":false,"update":false,"delete":false},"Workflows":{"create":false,"read":false,"update":false,"delete":false},"Events":{"create":true,"read":true,"update":false,"delete":false},"Labels":{"create":false,"read":true,"update":false,"delete":false},"Users & Roles":{"create":false,"read":false,"update":false,"delete":false}}'::jsonb),
 ('00000000-0000-0000-0000-000000000001','Viewer','Read-only access to dashboards and trace.', false,
  '{"Master Data":{"create":false,"read":true,"update":false,"delete":false},"Field Library":{"create":false,"read":true,"update":false,"delete":false},"Workflows":{"create":false,"read":true,"update":false,"delete":false},"Events":{"create":false,"read":true,"update":false,"delete":false},"Labels":{"create":false,"read":true,"update":false,"delete":false},"Users & Roles":{"create":false,"read":false,"update":false,"delete":false}}'::jsonb);

-- ---------- seed users (mapped to roles by name) ----------
INSERT INTO tenant_user (tenant_id, name, email, role_id, status, last_active_at)
SELECT '00000000-0000-0000-0000-000000000001', v.name, v.email,
       (SELECT id FROM role r WHERE r.tenant_id='00000000-0000-0000-0000-000000000001' AND r.name = v.role_name),
       v.status, v.last_active
FROM (VALUES
  ('Riya Sharma','riya.sharma@acmefoods.in','Tenant Admin','active',   now() - interval '2 minutes'),
  ('Arjun Mehta','arjun.mehta@acmefoods.in','Operations','active',     now() - interval '18 minutes'),
  ('Neha Kapoor','neha.kapoor@acmefoods.in','QA','active',             now() - interval '1 hour'),
  ('Vikram Singh','vikram.singh@northdealers.in','Dealer','active',    now() - interval '3 hours'),
  ('Priya Nair','priya.nair@acmefoods.in','Viewer','invited',          NULL),
  ('Karan Bhatia','karan.bhatia@southdealers.in','Dealer','invited',   NULL),
  ('Sana Iqbal','sana.iqbal@acmefoods.in','Operations','active',       now() - interval '1 day'),
  ('Rohit Verma','rohit.verma@acmefoods.in','QA','disabled',           now() - interval '21 days')
) AS v(name, email, role_name, status, last_active);
