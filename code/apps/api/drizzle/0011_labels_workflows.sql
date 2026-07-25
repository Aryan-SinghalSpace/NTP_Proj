-- 0011_labels_workflows.sql — label templates + workflow definitions/versions.
-- Workflows are versioned & append-only (invariant #2): a definition has many
-- immutable version rows (draft → published → retired) with a 30-day grace on the
-- prior published version. Temporal execution of the graph is a later slice.

CREATE TABLE label_template (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,
  symbology  text NOT NULL DEFAULT '',
  size       text NOT NULL DEFAULT '',
  payload    text NOT NULL DEFAULT '',
  fields     jsonb NOT NULL DEFAULT '[]'::jsonb,   -- {label,value,mono}[]
  status     text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX label_template_tenant_idx ON label_template (tenant_id);
ALTER TABLE label_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY label_template_isolation ON label_template FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON label_template TO tracewell_app;

CREATE TABLE workflow_definition (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workflow_definition_tenant_idx ON workflow_definition (tenant_id);
ALTER TABLE workflow_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_definition_isolation ON workflow_definition FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_definition TO tracewell_app;

CREATE TABLE workflow_version (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant(id),
  definition_id uuid NOT NULL REFERENCES workflow_definition(id) ON DELETE CASCADE,
  version       integer NOT NULL DEFAULT 1,
  state         text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','published','retired')),
  graph         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {nodes,edges,meta}
  published_at  timestamptz,
  grace_until   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workflow_version_def_idx ON workflow_version (definition_id, version DESC);
ALTER TABLE workflow_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_version_isolation ON workflow_version FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_version TO tracewell_app;

-- ---------- seeds ----------
INSERT INTO label_template (tenant_id, name, symbology, size, payload, fields) VALUES
 ('00000000-0000-0000-0000-000000000001','Unit · GS1 DataMatrix','GS1 DataMatrix','25 × 25 mm','(01)08901234567890(10)B-240931(17)270302',
  '[{"label":"Product","value":"Choco Bar 50g"},{"label":"GTIN","value":"8901234 56789 0","mono":true},{"label":"Batch","value":"B-240931","mono":true},{"label":"Expiry","value":"02 Mar 2027"}]'::jsonb),
 ('00000000-0000-0000-0000-000000000001','Case · GS1-128','GS1-128','100 × 50 mm','(01)18901234567897(37)24(10)B-240931',
  '[{"label":"Product","value":"Choco Bar 50g · Case"},{"label":"GTIN","value":"1 8901234 56789 7","mono":true},{"label":"Qty","value":"24 eaches"},{"label":"Batch","value":"B-240931","mono":true}]'::jsonb),
 ('00000000-0000-0000-0000-000000000001','Pallet · SSCC','GS1-128 (SSCC)','150 × 100 mm','(00)008943210000349218',
  '[{"label":"SSCC","value":"0 0894321 000034921 8","mono":true},{"label":"Contains","value":"48 cases"},{"label":"Ship to","value":"Mumbai DC"}]'::jsonb);

INSERT INTO workflow_definition (id, tenant_id, name) VALUES
 ('11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Inbound Commission → Label'),
 ('11111111-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','Dispatch & FEFO advisory');

INSERT INTO workflow_version (tenant_id, definition_id, version, state, graph, published_at, grace_until) VALUES
 ('00000000-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000010',1,'published',
  '{"nodes":[{"id":"n1","kind":"scan"},{"id":"n2","kind":"validate"},{"id":"n3","kind":"genid"},{"id":"n4","kind":"genlabel"},{"id":"n5","kind":"record"}],"edges":[["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"]]}'::jsonb,
  now() - interval '10 days', now() + interval '20 days'),
 ('00000000-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000011',1,'draft',
  '{"nodes":[{"id":"n1","kind":"scan"},{"id":"n2","kind":"branch"},{"id":"n3","kind":"notify"}],"edges":[["n1","n2"],["n2","n3"]]}'::jsonb,
  NULL, NULL);
