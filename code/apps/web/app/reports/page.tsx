'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { BarChartIcon, PlusIcon, PlayIcon, CalendarIcon } from '../../components/icons';
import { reports, toneStyle, type ReportTemplate } from '../../data_mock/reports';

export default function ReportsPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  return (
    <PageShell
      active="/reports"
      title="Reports"
      subtitle="Template-based reports & analytics across events, trace, inventory and recall."
      actions={
        <button
          onClick={() => flash('New report from template')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New report
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <ReportCard key={r.id} r={r} onRun={() => flash(`Running “${r.name}”…`)} onSchedule={() => flash(`Scheduled “${r.name}” weekly`)} />
        ))}
      </div>
    </PageShell>
  );
}

function ReportCard({ r, onRun, onSchedule }: { r: ReportTemplate; onRun: () => void; onSchedule: () => void }) {
  const style = toneStyle[r.tone];
  const max = Math.max(...r.spark);
  const min = Math.min(...r.spark);
  const range = max - min || 1;
  const pts = r.spark
    .map((v, i) => {
      const x = (i / (r.spark.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 26 - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={style}>
          <BarChartIcon width={18} height={18} />
        </span>
        <div>
          <div className="font-display text-[15px] font-bold">{r.name}</div>
          <div className="text-[11.5px] text-muted">{r.category}</div>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{r.desc}</p>

      <div className="mt-3 flex items-end gap-3">
        <div>
          <div className="font-display text-[22px] font-bold tracking-tight">{r.metric}</div>
          <div className="text-[11.5px] text-muted">{r.metricFoot}</div>
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="ml-auto h-9 w-24">
          <polyline points={pts} fill="none" stroke={style.color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onRun}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface text-[12.5px] font-semibold hover:bg-surface-hover"
        >
          <PlayIcon width={14} height={14} /> Run
        </button>
        <button
          onClick={onSchedule}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover"
        >
          <CalendarIcon width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
