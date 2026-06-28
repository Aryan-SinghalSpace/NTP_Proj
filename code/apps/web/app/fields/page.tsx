import { TopNav } from '../../components/TopNav';
import { getFields, type FieldDefinitionRow } from '../../lib/api';

const tierClass: Record<string, string> = {
  core: 'bg-[var(--surface-2)] text-muted',
  super: 'bg-primary-soft text-primary',
  tenant_custom: 'bg-[#d9f3ee] text-teal',
};

export default async function FieldLibraryPage() {
  let rows: FieldDefinitionRow[] = [];
  let error: string | null = null;
  try {
    rows = await getFields('batch');
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load';
  }

  return (
    <>
      <TopNav active="/fields" />
      <main className="mx-auto max-w-[1180px] px-6 py-7">
        <div className="mb-5">
          <h1 className="font-display text-[27px] font-bold tracking-tight">Field Library</h1>
          <p className="mt-1 text-sm text-muted">
            Batch entity · Core / Super / Tenant Custom · served by the API through Postgres RLS
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose/40 bg-[var(--surface)] p-6 text-sm text-rose">
            Could not reach the API ({error}). Start infra + API: <code>pnpm infra:up</code>,{' '}
            <code>pnpm --filter @tracewell/api migrate</code>, then{' '}
            <code>pnpm --filter @tracewell/api dev</code>.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Field</th>
                  <th className="px-4 py-3 font-semibold">Tier</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Ver.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={`${f.id}:${f.version}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{f.displayName}</div>
                      <div className="font-mono text-xs text-muted">{f.key}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                          tierClass[f.tier] ?? 'bg-[var(--surface-2)] text-muted'
                        }`}
                      >
                        {f.tier === 'tenant_custom' ? 'Tenant' : f.tier[0]?.toUpperCase() + f.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{f.dataType}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-[12.5px]">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: f.status === 'active' ? 'var(--teal)' : 'var(--subtle)' }}
                        />
                        {f.status === 'active' ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">v{f.version}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No fields returned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
