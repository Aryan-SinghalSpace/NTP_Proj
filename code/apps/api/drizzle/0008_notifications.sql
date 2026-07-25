-- 0008_notifications.sql — notification rules ("if trigger-event then notify via
-- channel") + a delivery log. Tenant-scoped under RLS. The actual delivery engine
-- (in-app/email/webhook fan-out) is a later slice; here we make the config + log
-- surfaces live.

CREATE TABLE notification_rule (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenant(id),
  name       text NOT NULL,
  trigger    text NOT NULL,
  channels   jsonb NOT NULL DEFAULT '[]'::jsonb,   -- ('in-app'|'email'|'webhook')[]
  recipients text NOT NULL DEFAULT '',
  enabled    boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_rule_tenant_idx ON notification_rule (tenant_id);
ALTER TABLE notification_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_rule_isolation ON notification_rule FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_rule TO tracewell_app;

CREATE TABLE notification_delivery (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant(id),
  rule        text NOT NULL,
  channel     text NOT NULL,
  recipient   text NOT NULL,
  status      text NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered','pending','failed')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_delivery_tenant_time_idx ON notification_delivery (tenant_id, occurred_at DESC);
ALTER TABLE notification_delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_delivery_isolation ON notification_delivery FOR ALL
  USING (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.role', true) = 'platform' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_delivery TO tracewell_app;

-- ---------- seeds ----------
INSERT INTO notification_rule (tenant_id, name, trigger, channels, recipients, enabled) VALUES
 ('00000000-0000-0000-0000-000000000001','Recall fan-out','Recall · initiated','["in-app","email","webhook"]'::jsonb,'Impacted dealers, Quality team', true),
 ('00000000-0000-0000-0000-000000000001','QC hold raised','QC / Hold · created','["in-app","email"]'::jsonb,'Quality team', true),
 ('00000000-0000-0000-0000-000000000001','FEFO breach advisory','Dispatch · FEFO violation','["in-app"]'::jsonb,'Dispatch operators', true),
 ('00000000-0000-0000-0000-000000000001','Dispatch received','Receive · confirmed','["email","webhook"]'::jsonb,'Logistics, ERP webhook', false),
 ('00000000-0000-0000-0000-000000000001','Field promotion request','Approval · submitted','["in-app","email"]'::jsonb,'Super Admin queue', true);

INSERT INTO notification_delivery (tenant_id, rule, channel, recipient, status, occurred_at) VALUES
 ('00000000-0000-0000-0000-000000000001','Recall fan-out','webhook','erp.acme.in/hooks/recall','delivered', now() - interval '20 minutes'),
 ('00000000-0000-0000-0000-000000000001','Recall fan-out','email','metro-foods@dealer.in','delivered', now() - interval '20 minutes'),
 ('00000000-0000-0000-0000-000000000001','Recall fan-out','email','sunrise-dist@dealer.in','pending', now() - interval '21 minutes'),
 ('00000000-0000-0000-0000-000000000001','QC hold raised','in-app','quality@acme.in','delivered', now() - interval '2 hours'),
 ('00000000-0000-0000-0000-000000000001','FEFO breach advisory','in-app','dispatch@acme.in','delivered', now() - interval '1 day'),
 ('00000000-0000-0000-0000-000000000001','Dispatch received','webhook','erp.acme.in/hooks/receive','failed', now() - interval '1 day');
