'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { CheckIcon, XIcon, StarIcon, FlowIcon, InboxIcon } from '../../components/icons';
import { approvals as seed, type ApprovalState, type ApprovalKind } from '../../data_mock/approvals';

const kindMeta: Record<ApprovalKind, { label: string; Icon: typeof StarIcon; style: React.CSSProperties }> = {
  'field-promotion': {
    label: 'Field promotion',
    Icon: StarIcon,
    style: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  },
  'workflow-publish': {
    label: 'Workflow publish',
    Icon: FlowIcon,
    style: { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' },
  },
};
const stateStyle: Record<ApprovalState, { background: string; color: string }> = {
  pending: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
  approved: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  rejected: { background: 'var(--danger-soft)', color: 'var(--danger-fg)' },
};

export default function ApprovalsPage() {
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };
  const decide = (id: string, state: ApprovalState) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, state } : x)));
    flash(state === 'approved' ? 'Request approved' : 'Request rejected');
  };

  const rows = items.filter((x) => (filter === 'pending' ? x.state === 'pending' : x.state !== 'pending'));
  const pendingCount = items.filter((x) => x.state === 'pending').length;

  return (
    <PageShell
      active="/approvals"
      title="Approvals"
      subtitle="Field-promotion requests (Tenant Custom → Super Field) and workflow publish sign-offs."
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {(['pending', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize ${
                filter === f ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-[12px] font-bold text-[var(--warning-fg)]">
          <InboxIcon width={14} height={14} /> {pendingCount} pending
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((x) => {
          const meta = kindMeta[x.kind];
          return (
            <div key={x.id} className="rounded-3xl border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={meta.style}>
                  <meta.Icon width={18} height={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={meta.style}>
                      {meta.label}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize" style={stateStyle[x.state]}>
                      {x.state}
                    </span>
                    <span className="ml-auto text-[11.5px] text-subtle">{x.submitted}</span>
                  </div>
                  <div className="mt-2 font-semibold">{x.title}</div>
                  <div className="font-mono text-[12px] text-muted">{x.target}</div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{x.detail}</p>
                  <div className="mt-2 text-[12px] text-subtle">Requested by {x.requester}</div>

                  {x.state === 'pending' && (
                    <div className="mt-3 flex gap-2.5">
                      <button
                        onClick={() => decide(x.id, 'approved')}
                        className="inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-semibold text-white"
                        style={{ background: 'var(--success)' }}
                      >
                        <CheckIcon width={15} height={15} /> Approve
                      </button>
                      <button
                        onClick={() => decide(x.id, 'rejected')}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold hover:bg-surface-hover"
                      >
                        <XIcon width={15} height={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
            Nothing {filter === 'pending' ? 'pending' : 'resolved'} right now.
          </div>
        )}
      </div>
    </PageShell>
  );
}
