-- 0003_master_data.sql — Identity & Master Data: manufacturing units + brand owners.
-- Both are tenant-scoped entities under RLS (invariant #6). Product counts are
-- NOT stored here — they are derived live by joining the product table, so they
-- can never drift out of sync.

-- ---------- manufacturing_unit (the "Manufacturers" tab / a plant) ----------
CREATE TABLE manufacturing_unit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,          -- matches product.attributes->>'mfgUnit'
  code       text NOT NULL,
  location   text NOT NULL,
  identifier text NOT NULL,          -- GLN or a custom identifier
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX manufacturing_unit_tenant_idx ON manufacturing_unit (tenant_id);

ALTER TABLE manufacturing_unit ENABLE ROW LEVEL SECURITY;
CREATE POLICY manufacturing_unit_isolation ON manufacturing_unit FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON manufacturing_unit TO tracewell_app;

-- ---------- brand_owner (a company that owns brands) ----------
CREATE TABLE brand_owner (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,          -- matches product.brand_owner
  gln        text,
  country    text NOT NULL DEFAULT 'India',
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brand_owner_tenant_idx ON brand_owner (tenant_id);

ALTER TABLE brand_owner ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_owner_isolation ON brand_owner FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON brand_owner TO tracewell_app;

-- ---------- dev seed for the demo tenant (Acme Foods) ----------
-- Unit names match the mfgUnit values on the seeded products so counts join.
INSERT INTO manufacturing_unit (tenant_id, name, code, location, identifier, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Plant MUM-1', 'MUM-1', 'Bhiwandi, MH',   'GLN 8901234000017', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Plant PUN-2', 'PUN-2', 'Chakan, MH',     'GLN 8901234000024', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Plant BLR-3', 'BLR-3', 'Bommasandra, KA','GLN 8908765000031', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Plant SUR-7', 'SUR-7', 'Sachin GIDC, GJ','CUST-COPACK-007',   'inactive');

-- Brand-owner names match product.brand_owner so product/brand counts join.
INSERT INTO brand_owner (tenant_id, name, gln, country, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Foods Pvt Ltd',  '8901234000000', 'India', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Northstar Beverages', '8908765000000', 'India', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Sunrise Naturals',    '8907654000000', 'India', 'active');
