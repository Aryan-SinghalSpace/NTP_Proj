'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { ScanIcon, TruckIcon, BoxIcon, CheckIcon, ClockIcon } from '../../components/icons';
import { modes, recentScans, sync } from '../../data_mock/scanning';

const modeIcon: Record<string, typeof ScanIcon> = { scan: ScanIcon, truck: TruckIcon, box: BoxIcon };

export default function ScanningPage() {
  const [mode, setMode] = useState(modes[0]!.key);
  const active = modes.find((m) => m.key === mode)!;

  return (
    <PageShell
      active="/scanning"
      title="Scanning App"
      subtitle="Mobile PWA preview · tag, dispatch and receive against generated labels · offline-first with sync."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* phone frame */}
        <div className="flex justify-center">
          <div className="w-[300px] rounded-[36px] border-[6px] border-[#1b1922] bg-[#1b1922] p-2 shadow-[var(--shadow-lg,0_22px_50px_-16px_rgba(40,30,55,.4))]">
            <div className="overflow-hidden rounded-[28px] bg-bg">
              {/* status bar */}
              <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-muted">
                <span>9:41</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={
                    sync.online
                      ? { background: 'var(--success-soft)', color: 'var(--success-fg)' }
                      : { background: 'var(--warning-soft)', color: 'var(--warning-fg)' }
                  }
                >
                  {sync.online ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* viewport */}
              <div className="relative mx-3 grid h-[180px] place-items-center overflow-hidden rounded-2xl bg-[#14121a]">
                <div className="absolute inset-6 rounded-xl border-2 border-white/30" />
                <div className="absolute left-6 right-6 h-0.5 bg-[var(--teal)]" style={{ top: '50%' }} />
                <div className="z-10 flex flex-col items-center text-white/80">
                  <ScanIcon width={30} height={30} />
                  <span className="mt-2 text-[11.5px]">Point at a label</span>
                </div>
              </div>

              {/* mode tabs */}
              <div className="m-3 flex gap-1 rounded-xl bg-surface-2 p-1">
                {modes.map((m) => {
                  const Icon = modeIcon[m.icon] ?? ScanIcon;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-semibold ${
                        mode === m.key ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                      }`}
                    >
                      <Icon width={16} height={16} />
                      {m.name}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-3 text-center text-[11.5px] text-muted">{active.desc}</div>
            </div>
          </div>
        </div>

        {/* side: sync + feed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5">
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl"
              style={{ background: 'var(--warning-soft)', color: 'var(--warning-fg)' }}
            >
              <ClockIcon width={20} height={20} />
            </span>
            <div>
              <div className="font-semibold">Offline mode · {sync.queued} scans queued</div>
              <div className="text-[12.5px] text-muted">Last sync {sync.lastSync} · auto-syncs when back online</div>
            </div>
            <button className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover">
              Sync now
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">Recent scans</h3>
            </div>
            <div className="px-5 py-2">
              {recentScans.map((s, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                    <ScanIcon width={15} height={15} />
                  </span>
                  <div>
                    <div className="font-mono text-[12.5px] font-semibold">{s.code}</div>
                    <div className="text-[11.5px] text-muted">
                      {s.type} · {s.time}
                    </div>
                  </div>
                  {s.status === 'synced' ? (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-fg)]">
                      <CheckIcon width={12} height={12} /> Synced
                    </span>
                  ) : (
                    <span className="ml-auto rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--warning-fg)]">
                      Queued
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
