'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { TruckIcon, BoxIcon, PlusIcon, AlertIcon } from '../../components/icons';
import {
  dispatches,
  legStatusStyle,
  receiving,
  receiveStatusStyle,
} from '../../data_mock/dispatch';

export default function DispatchPage() {
  const [tab, setTab] = useState<'dispatch' | 'receive'>('dispatch');
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  return (
    <PageShell
      active="/dispatch"
      title="Dispatch & Receive"
      subtitle="Multi-dealer dispatch split into legs, dealer receiving, and a FEFO advisory at dispatch."
      actions={
        <button
          onClick={() => flash('New dispatch order')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New dispatch
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-border">
        {([['dispatch', 'Dispatch', TruckIcon], ['receive', 'Receive', BoxIcon]] as const).map(
          ([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold ${
                tab === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Icon width={16} height={16} />
              {label}
            </button>
          ),
        )}
      </div>

      {tab === 'dispatch' ? (
        <div className="flex flex-col gap-4">
          {dispatches.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--info-soft)] text-[var(--info-fg)]">
                  <TruckIcon width={18} height={18} />
                </span>
                <div>
                  <div className="font-semibold">
                    {d.id} · <span className="font-mono text-[13px]">{d.batch}</span>
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {d.product} · {d.total.toLocaleString()} units · {d.created}
                  </div>
                </div>
                <span className="ml-auto rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-muted">
                  {d.legs.length} legs
                </span>
              </div>

              {d.fefo && (
                <div className="flex items-start gap-2 border-b border-border bg-[var(--warning-soft)] px-5 py-2.5 text-[12.5px] text-[var(--warning-fg)]">
                  <AlertIcon width={15} height={15} />
                  <span>
                    <b>FEFO advisory:</b> {d.fefo}
                  </span>
                </div>
              )}

              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                    <th className="px-5 py-2.5 font-semibold">Dealer</th>
                    <th className="px-4 py-2.5 font-semibold">City</th>
                    <th className="px-4 py-2.5 font-semibold">Units</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.legs.map((l) => (
                    <tr key={l.dealer} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-semibold">{l.dealer}</td>
                      <td className="px-4 py-3 text-muted">{l.city}</td>
                      <td className="px-4 py-3 text-muted">{l.units}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={legStatusStyle[l.status]}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">Receipt</th>
                <th className="px-4 py-2.5 font-semibold">Batch</th>
                <th className="px-4 py-2.5 font-semibold">From</th>
                <th className="px-4 py-2.5 font-semibold">Received / expected</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {receiving.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-[12.5px] font-semibold">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12.5px] font-semibold">{r.batch}</div>
                    <div className="text-xs text-muted">{r.product}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.from}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.units} / {r.expected}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={receiveStatusStyle[r.status]}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'Awaiting' && (
                      <button
                        onClick={() => flash(`Receiving ${r.id}…`)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-[12px] font-semibold hover:bg-surface-hover"
                      >
                        <BoxIcon width={13} height={13} /> Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
