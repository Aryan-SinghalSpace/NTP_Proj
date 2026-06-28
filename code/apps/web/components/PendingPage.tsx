import Link from 'next/link';
import { TopNav } from './TopNav';
import { ClockIcon } from './icons';

/**
 * Placeholder shown for nav routes that exist (so links never 404) but whose
 * real page hasn't been built yet. Frontend-first: we build pages one at a time.
 */
export function PendingPage({
  active,
  title,
  blurb,
}: {
  active: string;
  title: string;
  blurb?: string;
}) {
  return (
    <>
      <TopNav active={active} />
      <main className="mx-auto grid min-h-[calc(100vh-62px)] max-w-[1180px] place-items-center px-6 py-7">
        <div className="flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ClockIcon width={26} height={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {blurb ?? 'This page is still pending. We’re building the platform one page at a time — check back soon.'}
          </p>
          <span className="mt-4 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-[11.5px] font-bold text-[var(--warning-fg)]">
            Coming soon
          </span>
          <Link
            href="/dashboard"
            className="brand-grad mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
