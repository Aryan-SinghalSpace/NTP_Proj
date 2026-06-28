/**
 * Mock data for Reports (/reports): template-based reports & analytics across
 * events, trace, inventory and recall.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type ReportTone = 'primary' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky';

export interface ReportTemplate {
  id: string;
  name: string;
  desc: string;
  category: string;
  metric: string;
  metricFoot: string;
  tone: ReportTone;
  spark: number[];
}

export const reports: ReportTemplate[] = [
  {
    id: 'rpt_events',
    name: 'Event volume',
    desc: 'Events by type and location over a period.',
    category: 'Operations',
    metric: '312,540',
    metricFoot: 'events · last 7d',
    tone: 'primary',
    spark: [40, 55, 38, 62, 50, 70, 58],
  },
  {
    id: 'rpt_trace',
    name: 'Trace coverage',
    desc: 'Share of units with complete forward + backward trace.',
    category: 'Quality',
    metric: '98.7%',
    metricFoot: 'fully traceable',
    tone: 'teal',
    spark: [88, 90, 92, 94, 96, 97, 99],
  },
  {
    id: 'rpt_recall',
    name: 'Recall summary',
    desc: 'Recall events, fan-out reach and acknowledgement rate.',
    category: 'Risk',
    metric: '1 open',
    metricFoot: '82% fan-out · 9/11 ack',
    tone: 'rose',
    spark: [0, 0, 1, 1, 1, 1, 1],
  },
  {
    id: 'rpt_fefo',
    name: 'FEFO breaches',
    desc: 'Dispatches where an older batch remained available.',
    category: 'Inventory',
    metric: '2',
    metricFoot: 'advisories · last 7d',
    tone: 'amber',
    spark: [3, 2, 4, 1, 2, 2, 2],
  },
  {
    id: 'rpt_dealer',
    name: 'Dealer performance',
    desc: 'Receive confirmation time and short-receipt rate by dealer.',
    category: 'Distribution',
    metric: '11',
    metricFoot: 'active dealers',
    tone: 'violet',
    spark: [9, 10, 10, 11, 11, 11, 11],
  },
  {
    id: 'rpt_inventory',
    name: 'Inventory ageing',
    desc: 'Stock-on-hand by batch age and expiry window.',
    category: 'Inventory',
    metric: '4.1 wk',
    metricFoot: 'avg age at DC',
    tone: 'sky',
    spark: [5, 4.5, 4.3, 4.2, 4.1, 4.1, 4.1],
  },
];

export const toneStyle: Record<ReportTone, { background: string; color: string }> = {
  primary: { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  amber: { background: 'var(--amber-soft)', color: 'var(--amber-fg)' },
  rose: { background: 'var(--rose-soft)', color: 'var(--rose-fg)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  sky: { background: 'var(--sky-soft)', color: 'var(--sky-fg)' },
};
