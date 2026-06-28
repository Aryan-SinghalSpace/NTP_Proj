import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Centred, chrome-free layout for auth & onboarding screens (login, register,
 * tenant onboarding, password reset). A soft gradient panel on the left for
 * brand, the form card on the right.
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
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10" />
        <Link href="/" className="relative flex items-center gap-2.5 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 font-extrabold">S</span>
          Strings
        </Link>
        <div className="relative">
          <h2 className="font-display text-[32px] font-bold leading-tight">
            Configurable traceability, without the code.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] opacity-90">
            One platform, every customer configured to fit. Identity, workflows, labels and recall —
            assembled, not programmed.
          </p>
        </div>
        <div className="relative text-[12.5px] opacity-80">
          Multi-tenant · GS1-aware · UUID-internal identity
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-bg px-6 py-12">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-sm'}`}>
          <Link href="/" className="mb-8 flex items-center gap-2.5 font-display text-lg font-bold lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl font-extrabold text-white brand-grad">
              S
            </span>
            Strings
          </Link>
          <h1 className="font-display text-[26px] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[13.5px] text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-[13px] text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
