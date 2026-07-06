import { Reveal } from '../Reveal';
import { cn } from '../../lib/utils';
import {
  BoxIcon,
  FlowIcon,
  TagIcon,
  RecallIcon,
  ShieldIcon,
  ScanIcon,
  Glyph,
} from '../icons';

const stats = [
  { value: '1M+', label: 'GTINs per tenant, same architecture' },
  { value: '99.95%', label: 'event-ingest uptime target' },
  { value: '14', label: 'event types, v1' },
  { value: '< 60s', label: 'recall fan-out, 10M units' },
];

export function StatStrip() {
  return (
    <section className="hairline bg-surface/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 sm:px-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06} className="px-4 py-8 text-center">
            <div className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              {s.value}
            </div>
            <div className="mx-auto mt-2 max-w-[16ch] text-[12.5px] leading-snug text-muted">
              {s.label}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const features = [
  {
    icon: FlowIcon,
    swatch: 'bg-primary-soft text-primary-soft-fg',
    title: 'No-code workflow builder',
    body: 'Drag-and-drop the full node set — validate, branch, generate IDs & labels, record events, approve. Draft, dry-run, publish. Tenant workflows are data, not code.',
    span: 'sm:col-span-2',
    featured: true,
  },
  {
    icon: BoxIcon,
    swatch: 'bg-violet-soft text-violet',
    title: 'Identity & master data',
    body: 'UUID-internal identity with GTIN, UUID or custom schemes. Typed Field Library — Core, Super, Tenant-Custom — with validation and deactivate-never-delete.',
  },
  {
    icon: TagIcon,
    swatch: 'bg-teal-soft text-teal',
    title: 'Label designer',
    body: 'WYSIWYG labels rendered with Zint. Scannability validated at save time. Export PDF, PNG, ZPL or Excel.',
  },
  {
    icon: RecallIcon,
    swatch: 'bg-rose-soft text-rose-fg',
    title: 'Trace & recall',
    body: 'Forward and backward trace across batch, unit and custom hierarchies. Recall fan-out with dealer acknowledgement — in seconds.',
  },
  {
    icon: ShieldIcon,
    swatch: 'bg-sky-soft text-sky-fg',
    title: 'Tenant-isolated by design',
    body: 'Postgres row-level security on every table. No tenant sees another’s data — even via API misuse. Versioned, hash-chained audit throughout.',
  },
  {
    icon: ScanIcon,
    swatch: 'bg-amber-soft text-amber-fg',
    title: 'Scanning PWA, offline-ready',
    body: 'Mobile scanning for tag, dispatch and receive against generated labels. Queues offline, syncs on reconnect with idempotent replay.',
  },
];

export function FeatureGrid() {
  return (
    <section id="platform" className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-primary">The platform</p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.5vw,2.8rem)] font-bold leading-tight tracking-tight">
            Everything a traceability solution needs — assembled, not built.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">
            The platform is the product. Each customer gets a configured instance across identity,
            workflows, labels, trace and recall.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal
                key={f.title}
                delay={(i % 3) * 0.07}
                className={cn(
                  'group relative flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg',
                  f.span,
                )}
              >
                <span className={cn('grid h-12 w-12 place-items-center rounded-2xl', f.swatch)}>
                  <Icon width={22} height={22} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{f.body}</p>

                {f.featured && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {['scan', 'validate', 'genid', 'genlabel', 'record'].map((g) => (
                      <span
                        key={g}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 text-muted transition-colors group-hover:border-border-strong"
                      >
                        <Glyph name={g} width={16} height={16} />
                      </span>
                    ))}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
