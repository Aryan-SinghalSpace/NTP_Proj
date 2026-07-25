-- 0007_config.sql — tenant config surfaces: settings (via tenant), identity
-- schemes, the approvals queue, and the append-only audit log. All tenant-scoped
-- under RLS (#6). The audit log realises invariant #2 ("every change auditable").

-- ---------- allow a tenant to update its OWN row (Settings page) ----------
-- The original tenant policy only let the platform role write. Relax WITH CHECK
-- so a tenant can self-update; the service restricts writable columns to
-- name + settings (tier/status/slug stay platform-managed at the app layer).
DROP POLICY IF EXISTS tenant_isolation ON tenant;
CREATE POLICY tenant_isolation ON tenant FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

-- ---------- identity_scheme ----------
CREATE TABLE identity_scheme (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  kind       text NOT NULL CHECK (kind IN ('standard','custom')),
  name       text NOT NULL,
  short      text NOT NULL DEFAULT '',
  summary    text NOT NULL DEFAULT '',
  tone       text NOT NULL DEFAULT 'info',
  is_primary boolean NOT NULL DEFAULT false,
  enabled    boolean NOT NULL DEFAULT true,
  rules      jsonb NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  allocation jsonb NOT NULL DEFAULT '[]'::jsonb,   -- {label,value,mono}[]
  pattern    text,                                  -- custom only
  example    text,
  scope      text,
  issued     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identity_scheme_tenant_idx ON identity_scheme (tenant_id);
ALTER TABLE identity_scheme ENABLE ROW LEVEL SECURITY;
CREATE POLICY identity_scheme_isolation ON identity_scheme FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON identity_scheme TO tracewell_app;

-- ---------- approval_request ----------
CREATE TABLE approval_request (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  kind       text NOT NULL CHECK (kind IN ('field-promotion','workflow-publish')),
  title      text NOT NULL,
  target     text NOT NULL DEFAULT '',
  detail     text NOT NULL DEFAULT '',
  requester  text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX approval_request_tenant_idx ON approval_request (tenant_id, status);
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_request_isolation ON approval_request FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_request TO tracewell_app;

-- ---------- audit_entry (append-only) ----------
CREATE TABLE audit_entry (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor      text NOT NULL DEFAULT 'System',
  actor_role text NOT NULL DEFAULT '',
  action     text NOT NULL,          -- Created / Updated / Deactivated / Published / Reactivated …
  entity     text NOT NULL,          -- product / field_definition / role / …
  entity_id  text NOT NULL DEFAULT '',
  version    text NOT NULL DEFAULT '',
  diff       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entry_tenant_time_idx ON audit_entry (tenant_id, occurred_at DESC);
ALTER TABLE audit_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_entry_isolation ON audit_entry FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_entry TO tracewell_app;

-- ---------- seeds (demo tenant) ----------
-- default tenant settings for the Settings page
UPDATE tenant SET settings = jsonb_build_object('gs1Mode', false, 'locale', 'en-IN', 'timezone', 'Asia/Kolkata')
WHERE id = '00000000-0000-0000-0000-000000000001';

INSERT INTO identity_scheme (tenant_id, kind, name, short, summary, tone, is_primary, enabled, rules, allocation) VALUES
 ('00000000-0000-0000-0000-000000000001','standard','GTIN','Global Trade Item Number','GS1 14-digit trade-item identity. Primary scheme — used on labels and as the default product key.','success', true, true,
  '["mod-10 check digit (GS1 algorithm)","length in {8,12,13,14}; normalised to GTIN-14","company prefix must match registered licence"]'::jsonb,
  '[{"label":"Company prefix","value":"890 1234","mono":true},{"label":"Allocated","value":"—"},{"label":"Indicator digits","value":"0–8 (pack levels)"},{"label":"Allocation mode","value":"Manual + bulk import"}]'::jsonb),
 ('00000000-0000-0000-0000-000000000001','standard','UUID','Universally Unique Identifier','Internal v4 UUID — every entity carries one regardless of scheme. First-class fallback identity.','info', false, true,
  '["RFC 4122 v4 format check","collision-checked against the tenant namespace","immutable once assigned"]'::jsonb,
  '[{"label":"Generator","value":"Server-side v4"},{"label":"Namespace","value":"tnt_acme","mono":true},{"label":"Allocation mode","value":"Auto on create"}]'::jsonb);

INSERT INTO identity_scheme (tenant_id, kind, name, pattern, example, scope, issued, enabled) VALUES
 ('00000000-0000-0000-0000-000000000001','custom','Internal SKU','^SKU-[A-Z]{2}-\d{6}$','SKU-FD-004821','Product', 1210, true),
 ('00000000-0000-0000-0000-000000000001','custom','Asset Tag','^AT\d{8}$','AT00194872','Manufacturing unit', 642, true),
 ('00000000-0000-0000-0000-000000000001','custom','Legacy ERP code','^[0-9]{4}-[0-9]{4}$','4821-0093','Product', 88, false);

INSERT INTO approval_request (tenant_id, kind, title, target, detail, requester, status, created_at, decided_at) VALUES
 ('00000000-0000-0000-0000-000000000001','field-promotion','Promote "Cold-chain min °C" to Super Field','tenant_custom.cold_chain_min_c → super_field','Number field, °C, validation -40…25. Reused across 4 tenants — requesting canonical promotion.','Priya Nair · Tenant Admin', 'pending', now() - interval '14 minutes', NULL),
 ('00000000-0000-0000-0000-000000000001','workflow-publish','Publish "Cold-chain Dispatch v4"','workflow.cold_chain_dispatch · v3 → v4','Adds FEFO advisory node + dealer-scan branch. Dry-run passed (0 type errors). 30-day grace on v3.','Rahul Sharma · Tenant Admin', 'pending', now() - interval '38 minutes', NULL),
 ('00000000-0000-0000-0000-000000000001','field-promotion','Promote "Halal cert no." to Super Field','tenant_custom.halal_cert_no → super_field','Text field, regex ^HC-\d{8}$. Requested for cross-tenant export conformance.','Imran Q. · Tenant Admin', 'pending', now() - interval '2 hours', NULL),
 ('00000000-0000-0000-0000-000000000001','workflow-publish','Publish "Sample & QC Hold v2"','workflow.sample_qc_hold · v1 → v2','Routes failed QC to quarantine sub-flow. Dry-run passed.','Anita Verma · Tenant User (QC)', 'approved', now() - interval '5 hours', now() - interval '4 hours'),
 ('00000000-0000-0000-0000-000000000001','field-promotion','Promote "Pallet GRAI" to Super Field','tenant_custom.pallet_grai → super_field','Returnable-asset identifier. Overlaps existing Super Field "Returnable asset ID".','Priya Nair · Tenant Admin', 'rejected', now() - interval '1 day', now() - interval '20 hours');

INSERT INTO audit_entry (tenant_id, occurred_at, actor, actor_role, action, entity, entity_id, version, diff) VALUES
 ('00000000-0000-0000-0000-000000000001', now() - interval '20 minutes','Rahul Sharma','Tenant Admin','Published','workflow','cold_chain_dispatch','v3 → v4','+FEFO advisory node, +dealer-scan branch; v3 enters 30-day grace.'),
 ('00000000-0000-0000-0000-000000000001', now() - interval '45 minutes','Priya Nair','Tenant Admin','Updated','field_definition','cold_chain_min_c','v2 → v3','validation.min -30 → -40; unit unchanged (°C).'),
 ('00000000-0000-0000-0000-000000000001', now() - interval '2 hours','Priya Nair','Tenant Admin','Deactivated','field_definition','legacy_lot_code','','active true → false; historical values preserved.'),
 ('00000000-0000-0000-0000-000000000001', now() - interval '1 day','Rahul Sharma','Tenant Admin','Updated','identity_scheme','custom.internal_sku','','pattern ^SKU-\d{6}$ → ^SKU-[A-Z]{2}-\d{6}$.');
