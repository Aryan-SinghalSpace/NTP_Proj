-- 0001_seed.sql — dev seed: a demo tenant + Core/Super/Tenant fields for Batch.
-- Applied once (tracked in schema_migrations), so plain INSERTs are fine.

INSERT INTO tenant (id, name, slug, tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Foods', 'acme-foods', 'mid');

INSERT INTO field_definition (tier, tenant_id, entity, key, display_name, data_type, validation, is_locked) VALUES
  ('core',          NULL,                                   'batch', 'batch_number',          'Batch Number',        'text',     '{"required":true,"maxLength":20}', true),
  ('core',          NULL,                                   'batch', 'manufacturing_unit_id', 'Manufacturing Unit',  'unit_ref', '{"required":true}',                true),
  ('super',         NULL,                                   'batch', 'mfg_date',              'Manufacturing Date',  'date',     '{"required":true}',                false),
  ('super',         NULL,                                   'batch', 'expiry_date',           'Expiry Date',         'date',     '{"required":true}',                false),
  ('super',         NULL,                                   'batch', 'mrp',                   'MRP',                 'decimal',  '{"min":0}',                        false),
  ('tenant_custom', '00000000-0000-0000-0000-000000000001', 'batch', 'distributor_code',      'Distributor Code',    'text',     '{"regex":"^D-[0-9]{4}$"}',         false);
