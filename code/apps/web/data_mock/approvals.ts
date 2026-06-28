/**
 * Mock data for the Approvals queue page (/approvals): pending requests that need
 * Super Admin / Tenant Admin sign-off — Tenant Custom → Super Field promotions and
 * Workflow publish requests.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type ApprovalKind = 'field-promotion' | 'workflow-publish';
export type ApprovalState = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  title: string;
  /** target of the request (field name, workflow name) */
  target: string;
  /** human note describing what is being requested */
  detail: string;
  requester: string;
  submitted: string;
  state: ApprovalState;
}

export const approvals: ApprovalItem[] = [
  {
    id: 'apr_1',
    kind: 'field-promotion',
    title: 'Promote "Cold-chain min °C" to Super Field',
    target: 'tenant_custom.cold_chain_min_c → super_field',
    detail: 'Number field, °C, validation -40…25. Reused across 4 tenants — requesting canonical promotion.',
    requester: 'Priya Nair · Tenant Admin (Acme Foods)',
    submitted: '14 min ago',
    state: 'pending',
  },
  {
    id: 'apr_2',
    kind: 'workflow-publish',
    title: 'Publish "Cold-chain Dispatch v4"',
    target: 'workflow.cold_chain_dispatch · v3 → v4',
    detail: 'Adds FEFO advisory node + dealer-scan branch. Dry-run passed (0 type errors). 30-day grace on v3.',
    requester: 'Rahul Sharma · Tenant Admin (Acme Foods)',
    submitted: '38 min ago',
    state: 'pending',
  },
  {
    id: 'apr_3',
    kind: 'field-promotion',
    title: 'Promote "Halal cert no." to Super Field',
    target: 'tenant_custom.halal_cert_no → super_field',
    detail: 'Text field, regex ^HC-\\d{8}$. Requested for cross-tenant export conformance.',
    requester: 'Imran Q. · Tenant Admin (Crescent Dairy)',
    submitted: '2 hours ago',
    state: 'pending',
  },
  {
    id: 'apr_4',
    kind: 'workflow-publish',
    title: 'Publish "Sample & QC Hold v2"',
    target: 'workflow.sample_qc_hold · v1 → v2',
    detail: 'Routes failed QC to quarantine sub-flow. Dry-run passed. Awaiting tenant-admin sign-off.',
    requester: 'Anita Verma · Tenant User (QC)',
    submitted: '5 hours ago',
    state: 'approved',
  },
  {
    id: 'apr_5',
    kind: 'field-promotion',
    title: 'Promote "Pallet GRAI" to Super Field',
    target: 'tenant_custom.pallet_grai → super_field',
    detail: 'Returnable-asset identifier. Rejected — overlaps existing Super Field "Returnable asset ID".',
    requester: 'Priya Nair · Tenant Admin (Acme Foods)',
    submitted: 'Yesterday',
    state: 'rejected',
  },
];
