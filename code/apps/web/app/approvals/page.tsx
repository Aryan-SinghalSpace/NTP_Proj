'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { CheckIcon, XIcon, ShieldIcon } from '../../components/icons';
import { getApprovals, decideApproval, type ApiApproval } from '../../lib/api';

const kindLabel: Record<string, string> = {
  'field-promotion': 'Field promotion',
  'workflow-publish': 'Workflow publish',
};
const statusChip: Record<string, string> = {
  pending: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]',
  approved: 'bg-[var(--success-soft)] text-[var(--success-fg)]',
  rejected: 'bg-[var(--danger-soft)] text-[var(--danger-fg)]',
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApiApproval[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  async function load() {
    try {
      setItems(await getApprovals());
    } catch {
      flash('Could not reach the API');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function decide(item: ApiApproval, decision: 'approved' | 'rejected') {
    setBusyId(item.id);
    try {
      await decideApproval(item.id, decision);
      flash(`Request ${decision}`);
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const all = items ?? [];
  const pending = all.filter((a) => a.status === 'pending');
  const decided = all.filter((a) => a.status !== 'pending');

  return (
    <PageShell
      active="/approvals"
      title="Approvals"
      subtitle="Acme Foods · live via Postgres RLS · field-promotion & workflow-publish sign-offs"
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2.5">
        <span className="rounded-full bg-[var(--warning-soft)] px-3 py-1 text-[12px] font-bold text-[var(--warning-fg)]">
          {pending.length} pending
        </span>
        <span className="text-[12.5px] text-muted">{all.length} total requests</span>
      </div>

      {items === null && <div className="text-[13.5px] text-muted">Loading approvals…</div>}

      <div className="flex flex-col gap-3">
        {pending.map((a) => (
          <div key={a.id} className="rounded-3xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <ShieldIcon width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                    {kindLabel[a.kind] ?? a.kind}
                  </span>
                  <span className="text-[11.5px] text-subtle">{ago(a.createdAt)}</span>
                </div>
                <div className="mt-1 font-display text-[15.5px] font-bold">{a.title}</div>
                <div className="mt-0.5 font-mono text-[12px] text-muted">{a.target}</div>
                <p className="mt-2 text-[12.5px] text-muted">{a.detail}</p>
                <div className="mt-2 text-[12px] font-semibold text-subtle">Requested by {a.requester}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => decide(a, 'rejected')}
                  disabled={busyId === a.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--rose)]/50 bg-[var(--rose-soft)] px-3 text-[12.5px] font-semibold text-rose hover:opacity-90 disabled:opacity-50"
                >
                  <XIcon width={14} height={14} /> Reject
                </button>
                <button
                  onClick={() => decide(a, 'approved')}
                  disabled={busyId === a.id}
                  className="brand-grad inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  <CheckIcon width={14} height={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        ))}
        {items !== null && pending.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[13.5px] text-muted">
            No pending approvals. You’re all caught up.
          </div>
        )}
      </div>

      {decided.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-[13px] font-bold uppercase tracking-wide text-subtle">Recently decided</h3>
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-semibold">Request</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Requester</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold">{a.title}</td>
                    <td className="px-4 py-3 text-muted">{kindLabel[a.kind] ?? a.kind}</td>
                    <td className="px-4 py-3 text-muted">{a.requester}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusChip[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}
