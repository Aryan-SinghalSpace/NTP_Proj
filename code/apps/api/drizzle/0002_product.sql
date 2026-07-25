-- 0002_product.sql — Identity & Master Data: the product entity.
-- UUID-internal identity (invariant #1): the pk is a UUID; GTIN and the other
-- five identity attributes are validated columns on top. Tenant-scoped with RLS
-- (invariant #6). GTIN + Brand + Name + Net Content + Pack Type + Country of
-- Origin freeze once the product is committed (invariant #7).

CREATE TABLE product (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant(id),

  -- ----- the six GTIN-immutable identity attributes (invariant #7) -----
  gtin         text,                       -- NULL while draft; assigned at commit
  brand        text NOT NULL,
  name         text NOT NULL,
  net_content  text NOT NULL,
  pack_type    text NOT NULL,
  country      text NOT NULL DEFAULT 'India',

  -- ----- commercial / relational attributes (editable) -----
  brand_owner  text NOT NULL,
  category     text NOT NULL,
  attributes   jsonb NOT NULL DEFAULT '{}'::jsonb,   -- mrp, hsn, mfgUnit, shelfLife…

  -- ----- lifecycle -----
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','committed')),
  committed_at timestamptz,                 -- set when identity is first locked
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- A committed GTIN must be unique within a tenant. Drafts (gtin NULL) are exempt.
CREATE UNIQUE INDEX product_tenant_gtin_uq
  ON product (tenant_id, gtin) WHERE gtin IS NOT NULL;
CREATE INDEX product_tenant_status_idx ON product (tenant_id, status);

-- ---------- Row-Level Security (tenant isolation, invariant #6) ----------
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_isolation ON product FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON product TO tracewell_app;

-- ---------- dev seed for the demo tenant (Acme Foods) ----------
INSERT INTO product (tenant_id, gtin, brand, name, net_content, pack_type, country, brand_owner, category, attributes, status, committed_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '8901234567890', 'Velvet',  'Choco Bar 50g',            '50 g',   'Flow wrap',      'India', 'Acme Foods Pvt Ltd',  'Confectionery', '{"mrp":"₹20.00","hsn":"1806","mfgUnit":"Plant MUM-1","shelfLife":"9 months"}', 'committed', now()),
  ('00000000-0000-0000-0000-000000000001', '8901234567906', 'Harvest', 'Oat Drink 1L',             '1 L',    'Tetra Pak',      'India', 'Acme Foods Pvt Ltd',  'Beverages',     '{"mrp":"₹110.00","hsn":"2202","mfgUnit":"Plant PUN-2","shelfLife":"6 months"}', 'committed', now()),
  ('00000000-0000-0000-0000-000000000001', '8901234567913', 'Velvet',  'Masala Namkeen 200g',      '200 g',  'Pillow pouch',   'India', 'Acme Foods Pvt Ltd',  'Snacks',        '{"mrp":"₹50.00","hsn":"2106","mfgUnit":"Plant MUM-1","shelfLife":"4 months"}', 'committed', now()),
  ('00000000-0000-0000-0000-000000000001', '8901234567920', 'Harvest', 'Cold Brew Coffee 250ml',   '250 ml', 'Glass bottle',   'India', 'Northstar Beverages', 'Beverages',     '{"mrp":"₹95.00","hsn":"2101","mfgUnit":"Plant BLR-3","shelfLife":"3 months"}', 'committed', now()),
  ('00000000-0000-0000-0000-000000000001', NULL,            'Velvet',  'Protein Bar 40g',          '40 g',   'Flow wrap',      'India', 'Acme Foods Pvt Ltd',  'Confectionery', '{"mrp":"₹60.00","hsn":"1806","mfgUnit":"Plant MUM-1","shelfLife":"12 months"}', 'draft', NULL),
  ('00000000-0000-0000-0000-000000000001', NULL,            'Harvest', 'Sparkling Lime 330ml',     '330 ml', 'Aluminium can',  'India', 'Northstar Beverages', 'Beverages',     '{"mrp":"₹40.00","hsn":"2202","mfgUnit":"Plant BLR-3","shelfLife":"8 months"}', 'draft', NULL);
