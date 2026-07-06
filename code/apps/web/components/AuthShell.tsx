import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckIcon, ShieldIcon, LayersIcon, FlowIcon } from './icons';

const proof = [
  { icon: ShieldIcon, text: 'Tenant-isolated by row-level security' },
  { icon: LayersIcon, text: 'Versioned, append-only, fully auditable' },
  { icon: FlowIcon, text: 'No-code workflows — configured, not built' },
];

/**
 * Centred, chrome-free layout for auth & onboarding screens (login, register,
 * tenant onboarding, password reset). A rich brand panel on the left, the form
 * card on the right. Entrance motion is pure CSS (animate-fade-up) so this stays
 * a server component.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-white grad-indigo lg:flex">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-12 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="dotgrid pointer-events-none absolute inset-0 opacity-[0.12]" />

        <Link
          href="/"
          className="animate-fade-up relative flex items-center gap-2.5 font-display text-lg font-bold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 font-extrabold backdrop-blur">
            S
          </span>
          Strings
        </Link>

        <div className="relative">
          <h2 className="animate-fade-up font-display text-[34px] font-bold leading-[1.1] tracking-tight [animation-delay:80ms]">
            Configurable traceability,
            <br />
            without the code.
          </h2>
          <p className="animate-fade-up mt-4 max-w-sm text-[14.5px] leading-relaxed opacity-90 [animation-delay:160ms]">
            One platform, every customer configured to fit. Identity, workflows, labels and recall —
            assembled, not programmed.
          </p>

          {/* floating proof card */}
          <div className="animate-fade-up glass mt-9 max-w-sm rounded-3xl p-5 text-text [animation-delay:240ms]">
            <div className="space-y-3.5">
              {proof.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.text} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-primary-soft text-primary-soft-fg">
                      <Icon width={17} height={17} />
                    </span>
                    <span className="text-[13.5px] font-medium leading-snug text-text">{p.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="animate-fade-up relative flex items-center gap-4 text-[12.5px] opacity-80 [animation-delay:320ms]">
          {['Multi-tenant', 'GS1-aware', 'UUID-internal'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckIcon width={14} height={14} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* form panel */}
      <div className="relative flex items-center justify-center overflow-hidden bg-bg px-6 py-12">
        <div className="mesh pointer-events-none absolute inset-0 opacity-60 lg:hidden" />
        <div className={`animate-fade-up relative w-full ${wide ? 'max-w-xl' : 'max-w-sm'}`}>
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 font-display text-lg font-bold lg:hidden"
          >
            <span className="brand-grad grid h-9 w-9 place-items-center rounded-xl font-extrabold text-white">
              S
            </span>
            Strings
          </Link>
          <h1 className="font-display text-[28px] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[13.5px] text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-[13px] text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
