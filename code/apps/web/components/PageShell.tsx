import type { ReactNode } from 'react';
import { TopNav } from './TopNav';

/**
 * Standard logged-in page chrome: TopNav + a centred container with a page head
 * (title, subtitle, optional right-aligned actions). Keeps the many admin /
 * config pages consistent and terse.
 */
export function PageShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <TopNav active={active} />
      <main className="mx-auto max-w-[1180px] px-6 py-7">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-[13.5px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="ml-auto flex gap-2.5">{actions}</div>}
        </div>
        {children}
      </main>
    </>
  );
}
