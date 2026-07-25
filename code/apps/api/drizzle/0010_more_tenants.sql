-- 0010_more_tenants.sql — a few more tenants so the platform super-admin console
-- (/admin/*) shows a realistic multi-tenant view. Only Acme has seeded data; the
-- others are freshly onboarded (counts derive to 0), which is honest.

INSERT INTO tenant (name, slug, tier, region, status) VALUES
 ('Northstar Beverages', 'northstar', 'mid', 'in', 'active'),
 ('Crescent Dairy',      'crescent',  'mid', 'in', 'active'),
 ('Sunrise Naturals',    'sunrise',   'low', 'in', 'onboarding'),
 ('Orchard Exports',     'orchard',   'low', 'in', 'suspended');
