/**
 * Mock data for the Scanning App surface (/scanning): the mobile PWA used to tag,
 * dispatch and receive against generated labels, with offline sync.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export interface ScanMode {
  key: string;
  name: string;
  desc: string;
  icon: string; // 'scan' | 'truck' | 'box'
}

export const modes: ScanMode[] = [
  { key: 'tag', name: 'Tag', desc: 'Commission a unit/case against a label', icon: 'scan' },
  { key: 'dispatch', name: 'Dispatch', desc: 'Scan out to a dealer leg', icon: 'truck' },
  { key: 'receive', name: 'Receive', desc: 'Confirm inbound at a location', icon: 'box' },
];

export interface ScanRow {
  code: string;
  type: string;
  time: string;
  status: 'synced' | 'queued';
}

export const recentScans: ScanRow[] = [
  { code: 'B-240931 · unit', type: 'Tag', time: '10:42', status: 'synced' },
  { code: 'B-240931 · unit', type: 'Tag', time: '10:42', status: 'synced' },
  { code: 'SSCC·0034921', type: 'Dispatch', time: '10:41', status: 'synced' },
  { code: 'B-240931 · case', type: 'Dispatch', time: '10:40', status: 'queued' },
  { code: 'B-240488 · unit', type: 'Receive', time: '10:38', status: 'queued' },
];

export const sync = {
  online: false,
  queued: 2,
  lastSync: '10:39 · 3 min ago',
};
