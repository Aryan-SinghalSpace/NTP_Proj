'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { CheckIcon, ArrowRightIcon, ChevronLeftIcon } from '../../components/icons';

const steps = ['Organisation', 'Identity', 'Modules', 'Review'] as const;

const schemes = [
  { key: 'gtin', name: 'GTIN (recommended)', desc: 'GS1 14-digit trade-item identity. Mod-10 validated.' },
  { key: 'uuid', name: 'UUID', desc: 'Internal v4 UUID as the primary identity.' },
  { key: 'custom', name: 'Custom', desc: 'Tenant-defined coded identifiers (regex-validated).' },
];

const modules = [
  { key: 'workflows', name: 'Workflow builder', on: true },
  { key: 'labels', name: 'Label designer', on: true },
  { key: 'scanning', name: 'Scanning app', on: true },
  { key: 'recall', name: 'Recall & FEFO', on: true },
  { key: 'gs1', name: 'GS1 conformance mode', on: false },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState('Acme Foods Pvt Ltd');
  const [scheme, setScheme] = useState('gtin');
  const [picked, setPicked] = useState(() => modules.filter((m) => m.on).map((m) => m.key));
  const [done, setDone] = useState(false);

  const togglePick = (k: string) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <AuthShell
      title="Onboard a tenant"
      subtitle="Spin up a configured customer instance in four steps."
      wide
      footer={
        <span>
          Already set up?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </span>
      }
    >
      {/* stepper */}
      <div className="mb-6 flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold"
                style={
                  i <= step
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { background: 'var(--surface-2)', color: 'var(--muted)' }
                }
              >
                {i < step ? <CheckIcon width={14} height={14} /> : i + 1}
              </span>
              <span className={`text-[12.5px] font-semibold ${i <= step ? 'text-text' : 'text-muted'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className="mx-2 h-0.5 flex-1 rounded-full"
                style={{ background: i < step ? 'var(--primary)' : 'var(--border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {done ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--success-fg)]">
            <CheckIcon width={24} height={24} />
          </span>
          <h3 className="mt-4 font-display text-[18px] font-bold">Tenant created</h3>
          <p className="mt-1.5 text-[13px] text-muted">
            {org} is provisioned with the {scheme.toUpperCase()} scheme and {picked.length} modules.
          </p>
          <Link
            href="/dashboard"
            className="brand-grad mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
          >
            Open dashboard <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>
      ) : (
        <>
          {step === 0 && (
            <div>
              <div className="field">
                <label>Organisation name</label>
                <input className="input" value={org} onChange={(e) => setOrg(e.target.value)} />
              </div>
              <div className="field">
                <label>Region / data residency</label>
                <input className="input" defaultValue="India (Mumbai)" />
              </div>
              <div className="field">
                <label>Admin email</label>
                <input className="input" defaultValue="admin@acme.in" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2.5">
              {schemes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScheme(s.key)}
                  className={`rounded-2xl border p-4 text-left ${
                    scheme === s.key ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    {scheme === s.key && <CheckIcon width={15} height={15} style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">{s.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2">
              {modules.map((m) => {
                const on = picked.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => togglePick(m.key)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                      on ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className="grid h-5 w-5 place-items-center rounded-md"
                      style={on ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--surface-2)' }}
                    >
                      {on && <CheckIcon width={13} height={13} />}
                    </span>
                    <span className="text-[13.5px] font-semibold">{m.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <Review label="Organisation" value={org} />
              <Review label="Region" value="India (Mumbai)" />
              <Review label="Identity scheme" value={scheme.toUpperCase()} />
              <Review label="Modules" value={`${picked.length} enabled`} />
              <p className="help mt-2">Configuration is versioned and append-only — you can change it later.</p>
            </div>
          )}

          {/* nav */}
          <div className="mt-6 flex items-center gap-2.5">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn-bd" style={{ height: 40 }}>
                <ChevronLeftIcon width={15} height={15} /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="btn-bd primary ml-auto"
                style={{ height: 40 }}
              >
                Continue <ArrowRightIcon width={15} height={15} />
              </button>
            ) : (
              <button onClick={() => setDone(true)} className="btn-bd primary ml-auto" style={{ height: 40 }}>
                <CheckIcon width={16} height={16} /> Create tenant
              </button>
            )}
          </div>
        </>
      )}
    </AuthShell>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="text-[12.5px] font-semibold">{value}</span>
    </div>
  );
}
