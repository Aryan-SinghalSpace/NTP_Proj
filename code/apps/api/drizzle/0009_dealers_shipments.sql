-- 0009_dealers_shipments.sql — logistics: dealers (external receiving parties),
-- shipments (a dispatch) and shipment legs (per-dealer split). Powers multi-dealer
-- dispatch, the dealer receive surface, and REAL recall fan-out (which dealers got
-- a recalled batch). Tenant-scoped under RLS. (data-model §6.3)

CREATE TABLE dealer (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,
  city       text NOT NULL DEFAULT '',
  identifier text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dealer_tenant_idx ON dealer (tenant_id);
ALTER TABLE dealer ENABLE ROW LEVEL SECURITY;
CREATE POLICY dealer_isolation ON dealer FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON dealer TO tracewell_app;

CREATE TABLE shipment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,
  batch_id      uuid REFERENCES batch(id),
  batch_label   text NOT NULL DEFAULT '',
  product_label text NOT NULL DEFAULT '',
  total_units   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipment_tenant_idx ON shipment (tenant_id, created_at DESC);
CREATE INDEX shipment_batch_idx ON shipment (batch_id);
ALTER TABLE shipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipment_isolation ON shipment FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment TO tracewell_app;

CREATE TABLE shipment_leg (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant(id),
  shipment_id    uuid NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  dealer_id      uuid NOT NULL REFERENCES dealer(id),
  units          integer NOT NULL DEFAULT 0,
  received_units integer NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'loading' CHECK (status IN ('loading','in_transit','delivered')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipment_leg_shipment_idx ON shipment_leg (shipment_id);
CREATE INDEX shipment_leg_dealer_idx ON shipment_leg (dealer_id);
ALTER TABLE shipment_leg ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipment_leg_isolation ON shipment_leg FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment_leg TO tracewell_app;

-- ---------- seeds ----------
INSERT INTO dealer (tenant_id, name, city, identifier, status) VALUES
 ('00000000-0000-0000-0000-000000000001','Metro Foods','Pune','GLN 8909999000012','active'),
 ('00000000-0000-0000-0000-000000000001','Sunrise Distributors','Nashik','GLN 8909999000029','active'),
 ('00000000-0000-0000-0000-000000000001','Coastal Traders','Surat','GLN 8909999000036','active'),
 ('00000000-0000-0000-0000-000000000001','Highland Mart','Mumbai','GLN 8909999000043','active'),
 ('00000000-0000-0000-0000-000000000001','Green Grocers','Thane','CUST-DLR-0051','active');

-- Shipments reference seeded batches; legs reference seeded dealers.
-- DSP-1043: B-240931 (Choco); DSP-1042: B-240488 (Oat); DSP-1030: B-240517 (recalled).
INSERT INTO shipment (tenant_id, code, batch_id, batch_label, product_label, total_units, created_at)
SELECT '00000000-0000-0000-0000-000000000001', v.code,
       (SELECT id FROM batch b WHERE b.tenant_id='00000000-0000-0000-0000-000000000001' AND b.batch_number = v.batch_label),
       v.batch_label, v.product_label, v.total_units, now() - v.age
FROM (VALUES
  ('DSP-1043','B-240931','Choco Bar 50g',        1240, interval '2 hours'),
  ('DSP-1042','B-240488','Oat Drink 1L',          600, interval '4 hours'),
  ('DSP-1030','B-240517','Choco Bar 50g',        1520, interval '30 days')
) AS v(code, batch_label, product_label, total_units, age);

INSERT INTO shipment_leg (tenant_id, shipment_id, dealer_id, units, received_units, status)
SELECT '00000000-0000-0000-0000-000000000001',
       (SELECT id FROM shipment s WHERE s.code = v.code),
       (SELECT id FROM dealer d WHERE d.tenant_id='00000000-0000-0000-0000-000000000001' AND d.name = v.dealer),
       v.units, v.received, v.status
FROM (VALUES
  ('DSP-1043','Metro Foods',          420, 420, 'delivered'),
  ('DSP-1043','Sunrise Distributors', 380,   0, 'in_transit'),
  ('DSP-1043','Coastal Traders',      440,   0, 'loading'),
  ('DSP-1042','Highland Mart',        300, 300, 'delivered'),
  ('DSP-1042','Green Grocers',        300, 300, 'delivered'),
  ('DSP-1030','Metro Foods',          600, 600, 'delivered'),
  ('DSP-1030','Sunrise Distributors', 500, 500, 'delivered'),
  ('DSP-1030','Coastal Traders',      420, 420, 'delivered')
) AS v(code, dealer, units, received, status);
