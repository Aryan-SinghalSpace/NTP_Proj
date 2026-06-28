import { PageShell } from '../../components/PageShell';
import { KeyIcon, CheckIcon, PlusIcon, DownloadIcon } from '../../components/icons';
import { schemes, customSchemes, type SchemeTone } from '../../data_mock/identitySchemes';

const tone: Record<SchemeTone, { background: string; color: string }> = {
  success: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  info: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
};

export default function IdentitySchemesPage() {
  return (
    <PageShell
      active="/identity-schemes"
      title="Identity Schemes"
      subtitle="Every entity is UUID-internal; GTIN / UUID / custom are validated attributes on top (invariant 1)."
      actions={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover">
          <DownloadIcon width={16} height={16} /> Export config
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {schemes.map((s) => (
          <div key={s.id} className="flex flex-col rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl" style={tone[s.tone]}>
                <KeyIcon width={20} height={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[16px] font-bold">{s.name}</span>
                  {s.primary && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10.5px] font-bold text-[var(--primary-soft-fg)]">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-muted">{s.short}</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: s.enabled ? 'var(--teal)' : 'var(--subtle)' }}
                />
                {s.enabled ? 'Enabled' : 'Off'}
              </span>
            </div>

            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{s.summary}</p>

            <div className="mt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-subtle">Validation</div>
              {s.rules.map((r) => (
                <div key={r} className="mb-1.5 flex items-start gap-2 text-[12.5px]">
                  <CheckIcon width={14} height={14} style={{ color: 'var(--success-fg)' }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
              {s.allocation.map((a) => (
                <div key={a.label} className="bg-surface p-2.5">
                  <div className="text-[11px] text-muted">{a.label}</div>
                  <div className={`text-[12.5px] font-semibold ${a.mono ? 'font-mono' : ''}`}>{a.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* custom schemes */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Custom schemes</h3>
          <button className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover">
            <PlusIcon width={15} height={15} /> New scheme
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Scheme</th>
              <th className="px-4 py-2.5 font-semibold">Pattern</th>
              <th className="px-4 py-2.5 font-semibold">Example</th>
              <th className="px-4 py-2.5 font-semibold">Scope</th>
              <th className="px-4 py-2.5 font-semibold">Issued</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {customSchemes.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{c.pattern}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{c.example}</td>
                <td className="px-4 py-3 text-muted">{c.scope}</td>
                <td className="px-4 py-3 text-muted">{c.issued.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c.enabled ? 'var(--teal)' : 'var(--subtle)' }}
                    />
                    {c.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
