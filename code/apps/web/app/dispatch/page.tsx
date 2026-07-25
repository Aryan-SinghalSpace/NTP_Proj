'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { TruckIcon, BoxIcon, PlusIcon, XIcon, CheckIcon } from '../../components/icons';
import {
  getShipments,
  getDealers,
  getAllBatches,
  createShipment,
  updateShipmentLeg,
  type ApiShipment,
  type ApiShipmentLeg,
  type ApiDealer,
  type ApiBatch,
} from '../../lib/api';

const legStatusStyle: Record<string, { background: string; color: string }> = {
  delivered: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  in_transit: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  loading: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
};
const legStatusLabel: Record<string, string> = { delivered: 'Delivered', in_transit: 'In transit', loading: 'Loading' };

export default function DispatchPage() {
  const [tab, setTab] = useState<'dispatch' | 'receive'>('dispatch');
  const [shipments, setShipments] = useState<ApiShipment[] | null>(null);
  const [dealers, setDealers] = useState<ApiDealer[]>([]);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [creating, setCreating] = useState(false);
  const [busyLeg, setBusyLeg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  async function load() {
    try {
      const [s, d, b] = await Promise.all([getShipments(), getDealers(), getAllBatches()]);
      setShipments(s);
      setDealers(d);
      setBatches(b);
    } catch {
      flash('Could not reach the API');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function receive(leg: ApiShipmentLeg) {
    setBusyLeg(leg.id);
    try {
      await updateShipmentLeg(leg.id, { status: 'delivered', receivedUnits: leg.units });
      flash(`Received ${leg.units} units at ${leg.dealerName}`);
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyLeg(null);
    }
  }

  const all = shipments ?? [];
  const openLegs = all.flatMap((s) => s.legs.filter((l) => l.status !== 'delivered').map((l) => ({ ...l, shipment: s })));

  return (
    <PageShell
      active="/dispatch"
      title="Dispatch & Receive"
      subtitle="Acme Foods · live via Postgres RLS · multi-dealer dispatch, legs, and the dealer receive surface"
      actions={
        <button
          onClick={() => setCreating(true)}
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
        {([['dispatch', 'Dispatch', TruckIcon], ['receive', 'Receive', BoxIcon]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Icon width={16} height={16} />
            {label}
            {key === 'receive' && openLegs.length > 0 && (
              <span className="ml-1 rounded-full bg-[var(--warning-soft)] px-1.5 text-[10.5px] font-bold text-[var(--warning-fg)]">
                {openLegs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {shipments === null && <div className="text-[13.5px] text-muted">Loading…</div>}

      {tab === 'dispatch' ? (
        <div className="flex flex-col gap-4">
          {all.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--info-soft)] text-[var(--info-fg)]">
                  <TruckIcon width={18} height={18} />
                </span>
                <div>
                  <div className="font-semibold">
                    {d.code} · <span className="font-mono text-[13px]">{d.batchLabel}</span>
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {d.productLabel} · {d.totalUnits.toLocaleString()} units
                  </div>
                </div>
                <span className="ml-auto rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-muted">
                  {d.legs.length} legs
                </span>
              </div>
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
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-semibold">{l.dealerName}</td>
                      <td className="px-4 py-3 text-muted">{l.city}</td>
                      <td className="px-4 py-3 text-muted">{l.units}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={legStatusStyle[l.status]}>
                          {legStatusLabel[l.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {shipments !== null && all.length === 0 && (
            <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[13.5px] text-muted">
              No dispatches yet — create one to split a batch across dealers.
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">Shipment</th>
                <th className="px-4 py-2.5 font-semibold">Batch</th>
                <th className="px-4 py-2.5 font-semibold">Dealer</th>
                <th className="px-4 py-2.5 font-semibold">Units</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {openLegs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-[12.5px] font-semibold">{l.shipment.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12.5px] font-semibold">{l.shipment.batchLabel}</div>
                    <div className="text-xs text-muted">{l.shipment.productLabel}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {l.dealerName} · {l.city}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.units}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={legStatusStyle[l.status]}>
                      {legStatusLabel[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => receive(l)}
                      disabled={busyLeg === l.id}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-[12px] font-semibold hover:bg-surface-hover disabled:opacity-50"
                    >
                      <BoxIcon width={13} height={13} /> {busyLeg === l.id ? '…' : 'Receive'}
                    </button>
                  </td>
                </tr>
              ))}
              {shipments !== null && openLegs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Nothing awaiting receipt — all legs delivered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[13px] text-subtle">
        Dispatch &amp; receive are <span className="font-semibold text-teal">live</span> (Postgres + RLS).
        Creating a dispatch appends a <span className="font-mono">Dispatch</span> event; receiving a leg appends
        a <span className="font-mono">Receive</span> event — visible on the Events page and the audit log.
      </p>

      {creating && (
        <NewDispatchModal
          batches={batches}
          dealers={dealers}
          onClose={() => setCreating(false)}
          onCreated={(code) => {
            setCreating(false);
            flash(`Dispatch ${code} created`);
            void load();
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function NewDispatchModal({
  batches,
  dealers,
  onClose,
  onCreated,
  onError,
}: {
  batches: ApiBatch[];
  dealers: ApiDealer[];
  onClose: () => void;
  onCreated: (code: string) => void;
  onError: (msg: string) => void;
}) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '');
  const [legs, setLegs] = useState<{ dealerId: string; units: string }[]>([{ dealerId: dealers[0]?.id ?? '', units: '' }]);
  const [busy, setBusy] = useState(false);

  const validLegs = legs.filter((l) => l.dealerId && Number(l.units) > 0);
  const valid = batchId && validLegs.length > 0;
  const total = validLegs.reduce((n, l) => n + Number(l.units), 0);

  function setLeg(i: number, patch: Partial<{ dealerId: string; units: string }>) {
    setLegs((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const ship = await createShipment({
        batchId,
        legs: validLegs.map((l) => ({ dealerId: l.dealerId, units: Number(l.units) })),
      });
      onCreated(ship.code);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create dispatch');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--info-soft)] text-[var(--info-fg)]">
            <TruckIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New dispatch</div>
            <div className="text-[12px] text-muted">Split a batch across dealers</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Batch</span>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary">
              {batches.length === 0 && <option value="">No batches</option>}
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · {b.quantity} u
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-muted">Legs (dealer · units)</span>
            <div className="flex flex-col gap-2">
              {legs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={l.dealerId}
                    onChange={(e) => setLeg(i, { dealerId: e.target.value })}
                    className="h-10 flex-1 rounded-xl border border-border-strong bg-surface px-2 text-[12.5px] outline-none focus:border-primary"
                  >
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.city}
                      </option>
                    ))}
                  </select>
                  <input
                    value={l.units}
                    onChange={(e) => setLeg(i, { units: e.target.value.replace(/[^\d]/g, '') })}
                    inputMode="numeric"
                    placeholder="units"
                    className="h-10 w-[84px] rounded-xl border border-border-strong bg-surface px-2 text-[12.5px] outline-none focus:border-primary placeholder:text-subtle"
                  />
                  {legs.length > 1 && (
                    <button onClick={() => setLegs((ls) => ls.filter((_, idx) => idx !== i))} className="grid h-10 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
                      <XIcon width={14} height={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setLegs((ls) => [...ls, { dealerId: dealers[0]?.id ?? '', units: '' }])}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-[12px] font-semibold hover:bg-surface-2"
            >
              <PlusIcon width={13} height={13} /> Add leg
            </button>
          </div>
          <p className="text-[11.5px] text-subtle">Total {total.toLocaleString()} units · appends a Dispatch event.</p>
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50">
            <CheckIcon width={16} height={16} /> {busy ? 'Dispatching…' : 'Create dispatch'}
          </button>
        </div>
      </aside>
    </div>
  );
}
