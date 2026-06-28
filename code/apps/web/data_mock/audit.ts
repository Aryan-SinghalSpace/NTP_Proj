/**
 * Mock data for the Audit Log page (/audit): the append-only, versioned change
 * history. Every config change is a new immutable entry (deactivate-not-delete,
 * versioned-append-only — core invariants 2 & 4).
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type AuditAction = 'Created' | 'Updated' | 'Deactivated' | 'Published';

export interface AuditEntry {
  id: string;
  time: string;
  date: string;
  actor: string;
  actorRole: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  /** version transition, e.g. "v3 → v4"; empty for first creation */
  version: string;
  diff: string;
}

export const auditActions: AuditAction[] = ['Created', 'Updated', 'Deactivated', 'Published'];

export const auditLog: AuditEntry[] = [
  {
    id: 'aud_1',
    time: '09:42:11',
    date: 'Today',
    actor: 'Rahul Sharma',
    actorRole: 'Tenant Admin',
    action: 'Published',
    entity: 'workflow',
    entityId: 'cold_chain_dispatch',
    version: 'v3 → v4',
    diff: '+FEFO advisory node, +dealer-scan branch; v3 enters 30-day grace.',
  },
  {
    id: 'aud_2',
    time: '09:15:02',
    date: 'Today',
    actor: 'Priya Nair',
    actorRole: 'Tenant Admin',
    action: 'Updated',
    entity: 'field_definition',
    entityId: 'cold_chain_min_c',
    version: 'v2 → v3',
    diff: 'validation.min -30 → -40; unit unchanged (°C).',
  },
  {
    id: 'aud_3',
    time: '08:51:44',
    date: 'Today',
    actor: 'Super Admin',
    actorRole: 'Platform Super Admin',
    action: 'Created',
    entity: 'super_field',
    entityId: 'returnable_asset_id',
    version: '',
    diff: 'New canonical Super Field · type=text · regex ^RA-\\d{6}$.',
  },
  {
    id: 'aud_4',
    time: '17:30:09',
    date: 'Yesterday',
    actor: 'Priya Nair',
    actorRole: 'Tenant Admin',
    action: 'Deactivated',
    entity: 'field_definition',
    entityId: 'legacy_lot_code',
    version: 'v5 → v6',
    diff: 'active true → false; historical values preserved (View Historic Records).',
  },
  {
    id: 'aud_5',
    time: '16:02:33',
    date: 'Yesterday',
    actor: 'Anita Verma',
    actorRole: 'Tenant User (QC)',
    action: 'Published',
    entity: 'workflow',
    entityId: 'sample_qc_hold',
    version: 'v1 → v2',
    diff: '+quarantine sub-flow on QC fail; routing condition added.',
  },
  {
    id: 'aud_6',
    time: '11:48:17',
    date: 'Yesterday',
    actor: 'Rahul Sharma',
    actorRole: 'Tenant Admin',
    action: 'Updated',
    entity: 'identity_scheme',
    entityId: 'custom.internal_sku',
    version: 'v1 → v2',
    diff: 'pattern ^SKU-\\d{6}$ → ^SKU-[A-Z]{2}-\\d{6}$.',
  },
  {
    id: 'aud_7',
    time: '10:09:55',
    date: '2 days ago',
    actor: 'Super Admin',
    actorRole: 'Platform Super Admin',
    action: 'Created',
    entity: 'notification_rule',
    entityId: 'recall_fanout',
    version: '',
    diff: 'New rule · trigger=Recall.initiated · channels=in-app,email,webhook.',
  },
  {
    id: 'aud_8',
    time: '09:20:41',
    date: '2 days ago',
    actor: 'Priya Nair',
    actorRole: 'Tenant Admin',
    action: 'Created',
    entity: 'product',
    entityId: '0890123400123',
    version: '',
    diff: 'New product draft · GTIN allocated; identity not yet locked.',
  },
];
