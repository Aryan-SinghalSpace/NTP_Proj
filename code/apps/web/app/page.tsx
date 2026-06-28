import Link from 'next/link';
import { ArrowRightIcon, AppsIcon } from '../components/icons';

/**
 * Temporary landing — "Welcome to Strings". A single button reveals the page
 * launcher (every page available right now). Scaffolding for this build phase
 * only; real routing + auth gating replaces this later.
 */
export default function WelcomePage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-6">
      {/* soft background blooms */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl grad-indigo" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full opacity-30 blur-3xl grad-teal" />

      <div className="relative flex max-w-xl flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl font-display text-3xl font-extrabold text-white shadow-lg brand-grad">
          S
        </span>
        <h1 className="mt-7 font-display text-[44px] font-bold leading-tight tracking-tight">
          Welcome to Strings
        </h1>
        <p className="mt-3 max-w-md text-[15px] text-muted">
          The configurable dynamic traceability platform. Assemble a complete solution for any
          customer — identity, workflows, labels and recall — without writing code.
        </p>

        <Link
          href="/launcher"
          className="brand-grad mt-9 inline-flex h-12 items-center gap-2.5 rounded-2xl px-7 text-[15px] font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <AppsIcon width={18} height={18} />
          Explore the platform
          <ArrowRightIcon width={18} height={18} />
        </Link>

        <p className="mt-6 text-[12.5px] text-subtle">
          One click → every page built so far. (Temporary launcher for this build phase.)
        </p>
      </div>
    </main>
  );
}
