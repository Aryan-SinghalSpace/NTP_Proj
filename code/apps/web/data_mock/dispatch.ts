/**
 * Mock data for Dispatch & Receive (/dispatch): multi-dealer dispatch broken into
 * legs, the dealer receiving side, and a FEFO advisory at dispatch.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type LegStatus = 'Delivered' | 'In transit' | 'Loading';

export interface DispatchLeg {
  dealer: string;
  city: string;
  units: number;
  status: LegStatus;
}

export interface DispatchOrder {
  id: string;
  batch: string;
  product: string;
  created: string;
  total: number;
  fefo?: string; // advisory note if an older batch is still available
  legs: DispatchLeg[];
}

export const dispatches: DispatchOrder[] = [
  {
    id: 'DSP-1043',
    batch: 'B-240931',
    product: 'Choco Bar 50g',
    created: 'Today 10:42',
    total: 1240,
    fefo: 'Older batch B-240511 (exp 12 Jun) still in Mumbai DC — dispatch it first.',
    legs: [
      { dealer: 'Metro Foods', city: 'Pune', units: 420, status: 'Delivered' },
      { dealer: 'Sunrise Distributors', city: 'Nashik', units: 380, status: 'In transit' },
      { dealer: 'Coastal Traders', city: 'Surat', units: 440, status: 'Loading' },
    ],
  },
  {
    id: 'DSP-1042',
    batch: 'B-240800',
    product: 'Oat Drink 1L',
    created: 'Today 08:15',
    total: 600,
    legs: [
      { dealer: 'Highland Mart', city: 'Mumbai', units: 300, status: 'Delivered' },
      { dealer: 'Green Grocers', city: 'Thane', units: 300, status: 'Delivered' },
    ],
  },
];

export const legStatusStyle: Record<LegStatus, { background: string; color: string }> = {
  Delivered: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  'In transit': { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  Loading: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
};

export interface ReceiveRow {
  id: string;
  batch: string;
  product: string;
  from: string;
  units: number;
  expected: number;
  status: 'Awaiting' | 'Received' | 'Short';
}

export const receiving: ReceiveRow[] = [
  { id: 'RCV-552', batch: 'B-240931', product: 'Choco Bar 50g', from: 'Mumbai DC', units: 0, expected: 380, status: 'Awaiting' },
  { id: 'RCV-551', batch: 'B-240931', product: 'Choco Bar 50g', from: 'Mumbai DC', units: 420, expected: 420, status: 'Received' },
  { id: 'RCV-549', batch: 'B-240800', product: 'Oat Drink 1L', from: 'Pune DC', units: 295, expected: 300, status: 'Short' },
];

export const receiveStatusStyle: Record<ReceiveRow['status'], { background: string; color: string }> = {
  Awaiting: { background: 'var(--surface-2)', color: 'var(--muted)' },
  Received: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  Short: { background: 'var(--danger-soft)', color: 'var(--danger-fg)' },
};
