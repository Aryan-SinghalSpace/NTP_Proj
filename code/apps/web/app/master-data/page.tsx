import Link from 'next/link';
import { TopNav } from '../../components/TopNav';
import { getProducts, type ApiProduct } from '../../lib/api';
import MasterDataClient from './master-data-client';

/**
 * Master Data — server component. Fetches the tenant's products live from the
 * API (through Postgres RLS) and hands them to the interactive client. If the
 * API is down, it degrades to a clear "start the backend" message rather than
 * crashing, so the page is still reachable during frontend-only work.
 */
export default async function MasterDataPage() {
  let products: ApiProduct[] = [];
  let error: string | null = null;
  try {
    products = await getProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load';
  }

  if (error) {
    return (
      <>
        <TopNav active="/master-data" />
        <main className="mx-auto max-w-[1180px] px-6 py-7">
          <div className="mb-5">
            <h1 className="font-display text-[27px] font-bold tracking-tight">Master Data</h1>
            <p className="mt-1 text-[13.5px] text-muted">Products served by the API through Postgres RLS</p>
          </div>
          <div className="rounded-2xl border border-rose/40 bg-[var(--surface)] p-6 text-sm text-rose">
            Could not reach the API ({error}). Start infra + API from <code>code/</code>:{' '}
            <code>pnpm infra:up</code>, <code>pnpm --filter @tracewell/api migrate</code>, then{' '}
            <code>pnpm --filter @tracewell/api dev</code>. Then{' '}
            <Link href="/master-data" className="underline">
              reload
            </Link>
            .
          </div>
        </main>
      </>
    );
  }

  return <MasterDataClient initialProducts={products} />;
}
