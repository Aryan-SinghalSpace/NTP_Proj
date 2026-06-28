/**
 * Mock data for the Dashboard. Shaped the way the real API will return it, so
 * "connecting" later is a one-file swap (see lib/api.ts). Frontend-first: this
 * lets the page look fully alive with no backend running.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type Tone = 'primary' | 'teal' | 'amber' | 'rose' | 'sky';

export interface Kpi {
  label: string;
  value: string;
  foot: string;
  tone: Tone;
  trend?: 'up' | 'down';
}

export const kpis: Kpi[] = [
  { label: 'Active GTINs', value: '12,480', foot: '3.2% vs last week', tone: 'primary', trend: 'up' },
  { label: 'Events today', value: '48,210', foot: '12% · 14s lag', tone: 'teal', trend: 'up' },
  { label: 'QC holds', value: '7', foot: '2 awaiting release', tone: 'amber' },
  { label: 'Open recalls', value: '1', foot: 'B-240517 active', tone: 'rose', trend: 'down' },
];

export const eventVolume = {
  total: '312,540',
  caption: 'events this week',
  // paired bars: primary (commission/pack) + lighter overlay (dispatch/receive)
  bars: [62, 80, 50, 94, 70, 104, 82],
  overlay: [20, 26, 16, 30, 22, 36, 26],
};

export const recall = {
  id: 'RC-0042',
  batch: 'B-240517',
  units: 3420,
  dealers: 11,
  fanout: 82,
};

export type EventTone = 'info' | 'warning' | 'success' | 'muted' | 'danger';

export interface RecentEvent {
  time: string;
  type: string;
  tone: EventTone;
  entity: string;
  sub: string;
  location: string;
  status: string;
  dot: 'on' | 'warn' | 'danger';
}

export const recentEvents: RecentEvent[] = [
  { time: '10:42', type: 'Dispatch', tone: 'info', entity: 'B-240931', sub: '3 legs · 1,240 units', location: 'Mumbai DC', status: 'Done', dot: 'on' },
  { time: '10:39', type: 'QC Hold', tone: 'warning', entity: 'B-240517', sub: '3,420 units', location: 'Plant MUM-1', status: 'On hold', dot: 'warn' },
  { time: '10:31', type: 'Commission', tone: 'success', entity: '8901234·56789·0', sub: 'GTIN · new batch', location: 'Plant PUN-2', status: 'Live', dot: 'on' },
  { time: '10:28', type: 'Aggregate', tone: 'muted', entity: 'SSCC·0034921', sub: '48 units → case', location: 'Plant MUM-1', status: 'Done', dot: 'on' },
  { time: '10:22', type: 'Recall scan', tone: 'danger', entity: 'B-240517', sub: 'unit flagged', location: 'Dealer · Surat', status: 'Recalled', dot: 'danger' },
];

export interface FefoAdvisory {
  product: string;
  dc: string;
  batch: string;
  expiry: string;
}

export const fefo: FefoAdvisory[] = [
  { product: 'Choco Bar 50g', dc: 'Mumbai DC', batch: 'B-240511', expiry: '12 Jun' },
  { product: 'Oat Drink 1L', dc: 'Pune DC', batch: 'B-240488', expiry: '18 Jun' },
];
