-- 0004_batch.sql — Batch traceability. A batch is a produced lot of a product,
-- carrying its own mfg/expiry dates and quantity. UUID-internal identity (#1);
-- batch_number is a validated attribute. Tenant-scoped under RLS (#6). Feeds
-- FEFO advisory (expiry_date) and recall fan-out later.

CREATE TABLE batch (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenant(id),
  product_id            uuid NOT NULL REFERENCES product(id),
  batch_number          text NOT NULL,
  mfg_date              date,
  expiry_date           date,
  quantity              integer NOT NULL DEFAULT 0,
  manufacturing_unit_id uuid REFERENCES manufacturing_unit(id),
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','on_hold','recalled','depleted')),
  attributes            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- A batch number is unique per product within a tenant.
CREATE UNIQUE INDEX batch_tenant_product_number_uq ON batch (tenant_id, product_id, batch_number);
CREATE INDEX batch_tenant_expiry_idx ON batch (tenant_id, expiry_date);   -- FEFO
CREATE INDEX batch_product_idx ON batch (product_id);

ALTER TABLE batch ENABLE ROW LEVEL SECURITY;
CREATE POLICY batch_isolation ON batch FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON batch TO tracewell_app;

-- ---------- dev seed: a few batches for the committed products ----------
-- Product ids are random UUIDs, so join by name to resolve them; the mfg unit is
-- resolved by matching the product's mfgUnit attribute.
INSERT INTO batch (tenant_id, product_id, batch_number, mfg_date, expiry_date, quantity, manufacturing_unit_id, status)
SELECT p.tenant_id, p.id, v.batch_number, v.mfg_date, v.expiry_date, v.quantity,
       (SELECT mu.id FROM manufacturing_unit mu
         WHERE mu.tenant_id = p.tenant_id AND mu.name = p.attributes->>'mfgUnit' LIMIT 1),
       v.status
FROM product p
JOIN (VALUES
  ('Choco Bar 50g',          'B-240931', DATE '2026-06-02', DATE '2027-03-02', 12000, 'active'),
  ('Choco Bar 50g',          'B-240517', DATE '2026-05-17', DATE '2027-02-17',  9800, 'active'),
  ('Oat Drink 1L',           'B-240488', DATE '2026-05-12', DATE '2026-11-12', 15000, 'active'),
  ('Oat Drink 1L',           'B-240402', DATE '2026-04-28', DATE '2026-10-28', 11200, 'on_hold'),
  ('Masala Namkeen 200g',    'B-240777', DATE '2026-05-20', DATE '2026-09-20',  8600, 'active'),
  ('Cold Brew Coffee 250ml', 'B-240655', DATE '2026-05-11', DATE '2026-08-11',  5400, 'active')
) AS v(product_name, batch_number, mfg_date, expiry_date, quantity, status)
  ON v.product_name = p.name
WHERE p.tenant_id = '00000000-0000-0000-0000-000000000001';
