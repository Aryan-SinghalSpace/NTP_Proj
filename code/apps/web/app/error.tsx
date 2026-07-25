'use client';

import { useEffect } from 'react';

/**
 * Global error boundary for unexpected render/runtime errors. Shows a friendly,
 * non-technical page (never a stack trace) and logs the technical detail to the
 * browser console for diagnostics — mirroring the API's two-layer model.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Internal layer: structured console log for diagnostics.
    // eslint-disable-next-line no-console
    console.error('[ui.error]', { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger-fg)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          We hit an unexpected problem displaying this page. Your data is safe. You can try again, and if it
          keeps happening please let us know.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11.5px] text-subtle">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2.5">
          <button
            onClick={() => reset()}
            className="brand-grad inline-flex h-10 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-2"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
