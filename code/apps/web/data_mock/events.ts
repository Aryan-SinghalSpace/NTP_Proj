/**
 * Mock data for the Events & Trace page (/events). Shaped to resemble what the
 * traceability engine will serve: an append-only event stream, plus forward /
 * backward trace and recall fan-out derived from those events.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type EventTone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'teal' | 'violet' | 'primary';

/** soft-bg + fg pair for an event/trace tone. */
export function toneStyle(tone: EventTone): { background: string; color: string } {
  switch (tone) {
    case 'success':
      return { background: 'var(--success-soft)', color: 'var(--success-fg)' };
    case 'info':
      return { background: 'var(--info-soft)', color: 'var(--info-fg)' };
    case 'warning':
      return { background: 'var(--warning-soft)', color: 'var(--warning-fg)' };
    case 'danger':
      return { background: 'var(--danger-soft)', color: 'var(--danger-fg)' };
    case 'teal':
      return { background: 'var(--teal-soft)', color: 'var(--teal)' };
    case 'violet':
      return { background: 'var(--violet-soft)', color: 'var(--violet)' };
    case 'primary':
      return { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' };
    default:
      return { background: 'var(--surface-2)', color: 'var(--muted)' };
  }
}

export interface EvKpi {
  label: string;
  value: string;
  foot: string;
  tone: EventTone;
}

export const kpis: EvKpi[] = [
  { label: 'Events today', value: '48,210', foot: '14s avg lag', tone: 'teal' },
  { label: 'Event types active', value: '14', foot: 'all v1 types', tone: 'primary' },
  { label: 'QC holds open', value: '7', foot: '2 awaiting release', tone: 'warning' },
  { label: 'Open recalls', value: '1', foot: 'RC-0042 · B-240517', tone: 'danger' },
];

/** Event-type filter chips (subset of the 14 v1 types, plus "All"). */
export const eventTypeChips = [
  'All',
  'Commission',
  'Aggregate',
  'Dispatch',
  'Receive',
  'QC Hold',
  'Recall',
] as const;

export interface StreamEvent {
  id: string;
  time: string;
  date: string;
  type: string;
  tone: EventTone;
  entity: string;
  sub: string;
  location: string;
  actor: string;
  status: string;
  dot: 'on' | 'warn' | 'danger';
}

export const events: StreamEvent[] = [
  { id: 'ev-1', time: '10:42', date: 'Today', type: 'Dispatch', tone: 'info', entity: 'B-240931', sub: '3 legs · 1,240 units', location: 'Mumbai DC', actor: 'r.shah', status: 'Done', dot: 'on' },
  { id: 'ev-2', time: '10:39', date: 'Today', type: 'QC Hold', tone: 'warning', entity: 'B-240517', sub: '3,420 units held', location: 'Plant MUM-1', actor: 'qa.bot', status: 'On hold', dot: 'warn' },
  { id: 'ev-3', time: '10:31', date: 'Today', type: 'Commission', tone: 'success', entity: '8901234·56789·0', sub: 'GTIN · batch B-241002', location: 'Plant PUN-2', actor: 'line-2', status: 'Live', dot: 'on' },
  { id: 'ev-4', time: '10:28', date: 'Today', type: 'Aggregate', tone: 'muted', entity: 'SSCC·0034921', sub: '48 units → case', location: 'Plant MUM-1', actor: 'pack-3', status: 'Done', dot: 'on' },
  { id: 'ev-5', time: '10:22', date: 'Today', type: 'Recall', tone: 'danger', entity: 'B-240517', sub: 'unit flagged at dealer', location: 'Dealer · Surat', actor: 'system', status: 'Recalled', dot: 'danger' },
  { id: 'ev-6', time: '10:14', date: 'Today', type: 'Receive', tone: 'primary', entity: 'B-240931', sub: '420 units accepted', location: 'Dealer · Pune', actor: 's.kale', status: 'Done', dot: 'on' },
  { id: 'ev-7', time: '09:58', date: 'Today', type: 'Transform', tone: 'violet', entity: 'B-240800', sub: 'repacked → 6-pack', location: 'Plant PUN-2', actor: 'line-5', status: 'Done', dot: 'on' },
  { id: 'ev-8', time: '09:41', date: 'Today', type: 'Dispense', tone: 'teal', entity: 'B-240488', sub: 'FEFO advisory shown', location: 'Mumbai DC', actor: 'd.iyer', status: 'Done', dot: 'on' },
  { id: 'ev-9', time: '09:22', date: 'Today', type: 'Reject', tone: 'danger', entity: 'B-240701', sub: '12 units returned', location: 'Dealer · Nashik', actor: 'v.patil', status: 'Returned', dot: 'danger' },
  { id: 'ev-10', time: '17:36', date: 'Yesterday', type: 'Pack', tone: 'info', entity: 'B-240931', sub: '1,240 units cased', location: 'Plant MUM-1', actor: 'pack-1', status: 'Done', dot: 'on' },
];

/** Entities you can trace. */
export interface TraceTarget {
  id: string;
  label: string;
  kind: string;
}
export const traceTargets: TraceTarget[] = [
  { id: 'B-240517', label: 'B-240517', kind: 'Batch · recalled' },
  { id: 'B-240931', label: 'B-240931', kind: 'Batch · in distribution' },
  { id: 'SSCC-0034921', label: 'SSCC·0034921', kind: 'Pallet' },
];

export interface TraceStep {
  type: string;
  tone: EventTone;
  time: string;
  location: string;
  actor: string;
  detail: string;
}
export interface Trace {
  title: string;
  gtin: string;
  product: string;
  status: string;
  statusTone: EventTone;
  /** upstream — where it came from (origin first) */
  backward: TraceStep[];
  /** downstream — where it went (latest last) */
  forward: TraceStep[];
}

export const traces: Record<string, Trace> = {
  'B-240517': {
    title: 'Batch B-240517',
    gtin: '8901234 56789 0',
    product: 'Choco Bar 50g',
    status: 'Recalled',
    statusTone: 'danger',
    backward: [
      { type: 'Receive (RM)', tone: 'muted', time: '14 May 08:10', location: 'Plant MUM-1', actor: 'wh.bot', detail: 'Cocoa lot CL-9921 received' },
      { type: 'Commission', tone: 'success', time: '17 May 06:40', location: 'Plant MUM-1', actor: 'line-1', detail: '3,420 units commissioned · GTIN 8901234 56789 0' },
    ],
    forward: [
      { type: 'Aggregate', tone: 'muted', time: '17 May 09:20', location: 'Plant MUM-1', actor: 'pack-3', detail: '3,420 units → 143 cases' },
      { type: 'Dispatch', tone: 'info', time: '18 May 11:05', location: 'Mumbai DC', actor: 'r.shah', detail: 'Shipped to 11 dealers · 6 cities' },
      { type: 'QC Hold', tone: 'warning', time: '28 Jun 10:39', location: 'Plant MUM-1', actor: 'qa.bot', detail: 'Contamination flag raised' },
      { type: 'Recall', tone: 'danger', time: '28 Jun 10:42', location: 'System', actor: 'system', detail: 'Recall RC-0042 fan-out started' },
    ],
  },
  'B-240931': {
    title: 'Batch B-240931',
    gtin: '8901234 56789 0',
    product: 'Choco Bar 50g',
    status: 'In distribution',
    statusTone: 'info',
    backward: [
      { type: 'Commission', tone: 'success', time: '01 Jun 06:10', location: 'Plant MUM-1', actor: 'line-1', detail: '1,240 units commissioned' },
    ],
    forward: [
      { type: 'Pack', tone: 'info', time: '01 Jun 17:36', location: 'Plant MUM-1', actor: 'pack-1', detail: '1,240 units cased' },
      { type: 'Dispatch', tone: 'info', time: '02 Jun 10:42', location: 'Mumbai DC', actor: 'r.shah', detail: '3 legs · 1,240 units' },
      { type: 'Receive', tone: 'primary', time: '02 Jun 10:14', location: 'Dealer · Pune', actor: 's.kale', detail: '420 units accepted' },
    ],
  },
  'SSCC-0034921': {
    title: 'Pallet SSCC·0034921',
    gtin: '1 8901234 56789 7',
    product: 'Choco Bar 50g · Case',
    status: 'Aggregated',
    statusTone: 'muted',
    backward: [
      { type: 'Aggregate', tone: 'muted', time: '28 Jun 10:28', location: 'Plant MUM-1', actor: 'pack-3', detail: '48 units → case' },
    ],
    forward: [
      { type: 'Store', tone: 'muted', time: '28 Jun 12:00', location: 'Plant MUM-1', actor: 'wh.bot', detail: 'Bay A-12' },
    ],
  },
};

/** Recall fan-out. */
export interface RecallDealer {
  name: string;
  city: string;
  units: number;
  status: 'Acknowledged' | 'Pending' | 'Quarantined';
}
export interface Recall {
  id: string;
  batch: string;
  product: string;
  reason: string;
  started: string;
  units: number;
  dealers: number;
  fanout: number;
  acknowledged: number;
  dealerList: RecallDealer[];
}

export const recall: Recall = {
  id: 'RC-0042',
  batch: 'B-240517',
  product: 'Choco Bar 50g',
  reason: 'Possible contamination — cocoa lot CL-9921',
  started: '28 Jun 10:42',
  units: 3420,
  dealers: 11,
  fanout: 82,
  acknowledged: 9,
  dealerList: [
    { name: 'Surat Retail Hub', city: 'Surat', units: 420, status: 'Quarantined' },
    { name: 'Pune Distributors', city: 'Pune', units: 380, status: 'Acknowledged' },
    { name: 'Nashik Traders', city: 'Nashik', units: 310, status: 'Acknowledged' },
    { name: 'Mumbai West Depot', city: 'Mumbai', units: 540, status: 'Acknowledged' },
    { name: 'Thane Mart', city: 'Thane', units: 260, status: 'Pending' },
    { name: 'Nagpur Supply Co', city: 'Nagpur', units: 290, status: 'Pending' },
  ],
};
