'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageShell } from '../../components/PageShell';
import { ShieldIcon, CheckIcon, LogInIcon } from '../../components/icons';

const sessions = [
  { device: 'Chrome · Windows', where: 'Mumbai, IN', when: 'Active now', current: true },
  { device: 'Safari · iPhone', where: 'Mumbai, IN', when: '2 hours ago', current: false },
  { device: 'Edge · Windows', where: 'Pune, IN', when: 'Yesterday', current: false },
];

export default function AccountPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  return (
    <PageShell active="/account" title="Account" subtitle="Your profile, sessions and preferences.">
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* profile card */}
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl font-bold text-white avatar-grad">
              RS
            </span>
            <div>
              <div className="font-display text-[18px] font-bold">Rahul Sharma</div>
              <div className="text-[13px] text-muted">rahul.sharma@acme.in</div>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-soft-fg)]">
                <ShieldIcon width={12} height={12} /> Tenant Admin · Acme Foods
              </span>
            </div>
          </div>
          <div className="mt-5">
            <div className="field">
              <label>Full name</label>
              <input className="input" defaultValue="Rahul Sharma" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" defaultValue="rahul.sharma@acme.in" />
            </div>
            <button
              onClick={() => flash('Profile saved')}
              className="btn-bd primary mt-1"
              style={{ width: '100%', justifyContent: 'center', height: 40 }}
            >
              <CheckIcon width={16} height={16} /> Save changes
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* sessions */}
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">Active sessions</h3>
            </div>
            <div className="px-5 py-2">
              {sessions.map((s) => (
                <div key={s.device} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <div>
                    <div className="text-[13px] font-semibold">{s.device}</div>
                    <div className="text-xs text-muted">
                      {s.where} · {s.when}
                    </div>
                  </div>
                  {s.current ? (
                    <span className="ml-auto rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-fg)]">
                      This device
                    </span>
                  ) : (
                    <button
                      onClick={() => flash('Session revoked')}
                      className="ml-auto rounded-lg border border-border-strong bg-surface px-2.5 py-1 text-[12px] font-semibold text-muted hover:bg-surface-hover"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* preferences */}
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">Preferences</h3>
            </div>
            <div className="px-5 py-2">
              <PrefRow label="Theme" value="Light" />
              <PrefRow label="Density" value="Comfortable" />
              <PrefRow label="Default landing" value="Dashboard" />
            </div>
            <div className="border-t border-border p-5">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold text-rose hover:bg-surface-hover"
              >
                <LogInIcon width={16} height={16} /> Sign out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="rounded-lg bg-surface-2 px-3 py-1 text-[12.5px] font-semibold">{value}</span>
    </div>
  );
}
