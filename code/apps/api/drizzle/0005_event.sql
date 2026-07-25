-- 0005_event.sql — the trace spine. An append-only event log (data-model §6.2).
-- Events are never updated; corrections are new compensating events. Tenant-scoped
-- under RLS (#6). occurred_at = business time; recorded_at = ingest time.
-- Temporal/workflow-version links and partitioning are deferred (v1 event-log).

CREATE TABLE event (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant(id),
  event_type     text NOT NULL CHECK (event_type IN (
                   'Commission','Decommission','Aggregate','Disaggregate','Transform',
                   'QCHold','Sample','Pack','Store','Dispatch','Receive','Dispense',
                   'RejectReturn','Recall')),
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  recorded_at    timestamptz NOT NULL DEFAULT now(),
  actor          text,
  subject_kind   text NOT NULL DEFAULT 'batch'
                   CHECK (subject_kind IN ('batch','unit','product','logistic_unit')),
  subject_id     uuid,                 -- polymorphic; no FK (batch/unit/…)
  subject_label  text,                 -- denormalised for display (batch #, GTIN…)
  location       text,
  quantity       integer,
  detail         text,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,   -- field-library values
  lineage        jsonb,                                 -- input/output refs (trace)
  idempotency_key text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Idempotency: dedupe double-scan / retry / offline-sync replay (per tenant).
CREATE UNIQUE INDEX event_tenant_idempotency_uq
  ON event (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX event_tenant_time_idx ON event (tenant_id, occurred_at DESC);
CREATE INDEX event_subject_idx ON event (subject_id);
CREATE INDEX event_tenant_type_idx ON event (tenant_id, event_type);

ALTER TABLE event ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_isolation ON event FOR ALL
  USING (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'platform'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON event TO tracewell_app;

-- ---------- dev seed: realistic event timelines against the seeded batches ----------
INSERT INTO event (tenant_id, event_type, occurred_at, actor, subject_kind, subject_id, subject_label, location, quantity, detail)
SELECT b.tenant_id, v.event_type, v.occurred_at, v.actor, 'batch', b.id, b.batch_number, v.location, v.quantity, v.detail
FROM batch b
JOIN (VALUES
  -- B-240517: commissioned → aggregated → dispatched → held → recalled
  ('B-240517','Commission', TIMESTAMPTZ '2026-05-17 06:40+05:30','line-1','Plant MUM-1',3420,'3,420 units commissioned'),
  ('B-240517','Aggregate',  TIMESTAMPTZ '2026-05-17 09:20+05:30','pack-3','Plant MUM-1',3420,'3,420 units to 143 cases'),
  ('B-240517','Dispatch',   TIMESTAMPTZ '2026-05-18 11:05+05:30','r.shah','Mumbai DC',3420,'Shipped to 11 dealers, 6 cities'),
  ('B-240517','QCHold',     TIMESTAMPTZ '2026-06-28 10:39+05:30','qa.bot','Plant MUM-1',3420,'Contamination flag raised'),
  ('B-240517','Recall',     TIMESTAMPTZ '2026-06-28 10:42+05:30','system','System',3420,'Recall RC-0042 fan-out started'),
  -- B-240931: commissioned → packed → dispatched → received
  ('B-240931','Commission', TIMESTAMPTZ '2026-06-01 06:10+05:30','line-1','Plant MUM-1',1240,'1,240 units commissioned'),
  ('B-240931','Pack',       TIMESTAMPTZ '2026-06-01 17:36+05:30','pack-1','Plant MUM-1',1240,'1,240 units cased'),
  ('B-240931','Dispatch',   TIMESTAMPTZ '2026-06-02 10:42+05:30','r.shah','Mumbai DC',1240,'3 legs, 1,240 units'),
  ('B-240931','Receive',    TIMESTAMPTZ '2026-06-02 14:14+05:30','s.kale','Dealer, Pune',420,'420 units accepted'),
  -- B-240488: dispensed with FEFO advisory
  ('B-240488','Commission', TIMESTAMPTZ '2026-05-12 07:00+05:30','line-2','Plant PUN-2',15000,'15,000 units commissioned'),
  ('B-240488','Dispense',   TIMESTAMPTZ '2026-06-20 09:41+05:30','d.iyer','Mumbai DC',600,'FEFO advisory shown'),
  -- B-240777: sampled
  ('B-240777','Commission', TIMESTAMPTZ '2026-05-20 06:30+05:30','line-1','Plant MUM-1',8600,'8,600 units commissioned'),
  ('B-240777','Sample',     TIMESTAMPTZ '2026-05-20 12:10+05:30','qa.bot','Plant MUM-1',20,'20 units pulled for QC'),
  -- B-240655: rejected/returned at dealer
  ('B-240655','Commission', TIMESTAMPTZ '2026-05-11 08:00+05:30','line-3','Plant BLR-3',5400,'5,400 units commissioned'),
  ('B-240655','RejectReturn',TIMESTAMPTZ '2026-06-22 09:22+05:30','v.patil','Dealer, Nashik',12,'12 units returned')
) AS v(batch_number,event_type,occurred_at,actor,location,quantity,detail)
  ON v.batch_number = b.batch_number
WHERE b.tenant_id = '00000000-0000-0000-0000-000000000001';
