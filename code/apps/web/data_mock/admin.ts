/**
 * Mock data for the Platform super-admin console (/admin/*): all tenants, the
 * canonical Super Field library + promotion queue, and platform-wide usage.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type TenantStatus = 'active' | 'onboarding' | 'suspended';

export interface Tenant {
  id: string;
  name: string;
  region: string;
  status: TenantStatus;
  users: number;
  gtins: string;
  events30d: string;
  since: string;
}

export const tenants: Tenant[] = [
  { id: 'tnt_acme', name: 'Acme Foods Pvt Ltd', region: 'India · Mumbai', status: 'active', users: 42, gtins: '12,480', events30d: '1.4M', since: 'Jan 2026' },
  { id: 'tnt_northstar', name: 'Northstar Beverages', region: 'India · Bengaluru', status: 'active', users: 18, gtins: '3,210', events30d: '402K', since: 'Feb 2026' },
  { id: 'tnt_crescent', name: 'Crescent Dairy', region: 'India · Pune', status: 'active', users: 27, gtins: '5,890', events30d: '770K', since: 'Mar 2026' },
  { id: 'tnt_sunrise', name: 'Sunrise Naturals', region: 'India · Mumbai', status: 'onboarding', users: 3, gtins: '190', events30d: '2.1K', since: 'Jun 2026' },
  { id: 'tnt_orchard', name: 'Orchard Exports', region: 'India · Nashik', status: 'suspended', users: 0, gtins: '1,020', events30d: '0', since: 'Apr 2026' },
];

export const tenantStatusStyle: Record<TenantStatus, { background: string; color: string }> = {
  active: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  onboarding: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  suspended: { background: 'var(--danger-soft)', color: 'var(--danger-fg)' },
};

export interface SuperField {
  key: string;
  name: string;
  type: string;
  scope: string; // global / per-tenant
  tenantsUsing: number;
  status: 'active' | 'deactivated';
}

export const superFields: SuperField[] = [
  { key: 'batch_number', name: 'Batch Number', type: 'text', scope: 'Global', tenantsUsing: 6, status: 'active' },
  { key: 'expiry_date', name: 'Expiry Date', type: 'date', scope: 'Global', tenantsUsing: 6, status: 'active' },
  { key: 'mfg_unit', name: 'Manufacturing Unit', type: 'unit-ref', scope: 'Global', tenantsUsing: 5, status: 'active' },
  { key: 'returnable_asset_id', name: 'Returnable Asset ID', type: 'text', scope: 'Global', tenantsUsing: 2, status: 'active' },
  { key: 'cold_chain_min_c', name: 'Cold-chain min °C', type: 'number', scope: 'Global', tenantsUsing: 4, status: 'active' },
  { key: 'legacy_grade', name: 'Legacy Grade', type: 'enum', scope: 'Global', tenantsUsing: 1, status: 'deactivated' },
];

export interface PromotionRequest {
  id: string;
  field: string;
  type: string;
  tenant: string;
  requester: string;
  when: string;
}

export const promotionQueue: PromotionRequest[] = [
  { id: 'pr_1', field: 'Cold-chain min °C', type: 'number', tenant: 'Acme Foods', requester: 'Priya Nair', when: '14 min ago' },
  { id: 'pr_2', field: 'Halal cert no.', type: 'text', tenant: 'Crescent Dairy', requester: 'Imran Q.', when: '2 hours ago' },
];

export interface UsageKpi {
  label: string;
  value: string;
  foot: string;
  tone: 'primary' | 'teal' | 'violet' | 'amber';
}

export const usageKpis: UsageKpi[] = [
  { label: 'Active tenants', value: '4', foot: '1 onboarding · 1 suspended', tone: 'primary' },
  { label: 'Events · 30d', value: '2.6M', foot: '+11% vs prior 30d', tone: 'teal' },
  { label: 'Object storage', value: '184 GB', foot: 'labels + artifacts', tone: 'violet' },
  { label: 'GTINs tracked', value: '22.8K', foot: 'across all tenants', tone: 'amber' },
];

/** weekly event volume (platform-wide), for the bar chart. */
export const usageSeries = [70, 84, 62, 96, 78, 110, 92];

export interface TenantUsage {
  name: string;
  events: string;
  share: number; // % of platform events
}
export const topTenants: TenantUsage[] = [
  { name: 'Acme Foods', events: '1.4M', share: 54 },
  { name: 'Crescent Dairy', events: '770K', share: 30 },
  { name: 'Northstar Beverages', events: '402K', share: 15 },
  { name: 'Sunrise Naturals', events: '2.1K', share: 1 },
];
