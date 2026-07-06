import Link from 'next/link';
import { Reveal } from '../Reveal';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';
import { LayersIcon, FlowIcon, ScanIcon, ArrowRightIcon, AppsIcon } from '../icons';

const steps = [
  {
    icon: LayersIcon,
    title: 'Configure identity & data',
    body: 'Onboard the tenant, pick identity schemes, and shape product master data with the typed Field Library. No migrations, no code.',
  },
  {
    icon: FlowIcon,
    title: 'Build the workflow',
    body: 'Drag nodes onto the canvas, wire branches and validations, dry-run against sample data, then publish with a 30-day version grace period.',
  },
  {
    icon: ScanIcon,
    title: 'Capture, trace & recall',
    body: 'Scan events from the PWA, watch progress stream in real time, and trace forward or backward — or fan out a recall in seconds.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="hairline bg-surface/40 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-primary">How it works</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.5vw,2.8rem)] font-bold leading-tight tracking-tight">
            From blank tenant to live traceability in three moves.
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 0.1} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="brand-grad grid h-10 w-10 place-items-center rounded-xl font-display text-base font-bold text-white shadow-sm">
                      {i + 1}
                    </span>
                    <Icon width={22} height={22} className="text-muted" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function StandardsBand() {
  return (
    <section id="standards" className="px-5 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-teal">Standards & interop</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-[clamp(1.8rem,3.2vw,2.5rem)] font-bold leading-tight tracking-tight">
          GS1-aware, not GS1-bound.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">
          GTIN is a first-class identity scheme — with mod-10 validation and pack hierarchy — but so
          are UUID and custom identifiers. Turn on GS1 conformance mode, Digital Link resolution and
          EPCIS-style export per tenant when you need them, and leave them off when you don’t.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {['GTIN-13 / 14', 'GS1 Digital Link', 'EPCIS export', 'UUID', 'Custom schemes'].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-muted shadow-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="px-5 pb-24 sm:px-8">
      <Reveal className="mx-auto max-w-6xl">
        <div className="brand-grad relative overflow-hidden rounded-[32px] px-8 py-16 text-center shadow-glow sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 dotgrid opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-tight tracking-tight text-white">
              Assemble your traceability platform.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/85">
              Stand up a fully configured instance for your next customer — without writing a line of
              code.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-[52px] items-center gap-2 rounded-2xl bg-white px-7 text-[15px] font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Get started
                <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center rounded-2xl border border-white/40 bg-white/10 px-7 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const footerCols = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Workflow builder', href: '/workflows' },
      { label: 'Master data', href: '/master-data' },
      { label: 'Label designer', href: '/labels' },
    ],
  },
  {
    title: 'Operate',
    links: [
      { label: 'Events & trace', href: '/events' },
      { label: 'Scanning', href: '/scanning' },
      { label: 'Dispatch', href: '/dispatch' },
      { label: 'Reports', href: '/reports' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Register', href: '/register' },
      { label: 'Onboarding', href: '/onboarding' },
      { label: 'Settings', href: '/settings' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hairline bg-surface px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="brand-grad grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-extrabold text-white">
                S
              </span>
              <span className="font-display text-lg font-bold tracking-tight">Strings</span>
            </Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              The configurable dynamic traceability platform. Multi-tenant, no-code, GS1-aware.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.1em] text-subtle">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-muted transition-colors hover:text-text"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-12 flex flex-col items-center justify-between gap-4 pt-7 sm:flex-row">
          <p className="text-[12.5px] text-subtle">
            © 2026 Strings · Configurable Dynamic Traceability Platform
          </p>
          <Link
            href="/launcher"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-subtle hover:text-text',
            )}
          >
            <AppsIcon width={15} height={15} />
            Dev launcher — every page built so far
          </Link>
        </div>
      </div>
    </footer>
  );
}
