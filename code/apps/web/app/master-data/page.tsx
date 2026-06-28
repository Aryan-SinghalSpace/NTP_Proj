'use client';

import { useState } from 'react';
import { TopNav } from '../../components/TopNav';
import {
  BoxIcon,
  LayersIcon,
  BuildingIcon,
  UserIcon,
  ActivityIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  LockIcon,
  XIcon,
  ChevronRightIcon,
  CheckIcon,
} from '../../components/icons';
import {
  kpis,
  products,
  manufacturers,
  brandOwners,
  identityFields,
  type Product,
  type ProductStatus,
  type Tone,
} from '../../data_mock/masterData';

const toneColor: Record<Tone, string> = {
  primary: 'var(--primary)',
  teal: 'var(--teal)',
  amber: 'var(--amber)',
  rose: 'var(--rose)',
  sky: 'var(--sky)',
  violet: 'var(--violet)',
};
const toneSoft: Record<Tone, string> = {
  primary: 'var(--primary-soft)',
  teal: 'var(--teal-soft)',
  amber: 'var(--amber-soft)',
  rose: 'var(--rose-soft)',
  sky: 'var(--sky-soft)',
  violet: 'var(--violet-soft)',
};

type Tab = 'products' | 'manufacturers' | 'brands' | 'hierarchy';

const tabs: { key: Tab; label: string; Icon: typeof BoxIcon }[] = [
  { key: 'products', label: 'Products', Icon: BoxIcon },
  { key: 'manufacturers', label: 'Manufacturers', Icon: BuildingIcon },
  { key: 'brands', label: 'Brand Owners', Icon: UserIcon },
  { key: 'hierarchy', label: 'Pack Hierarchy', Icon: LayersIcon },
];

export default function MasterDataPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ProductStatus>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [hierId, setHierId] = useState(products.find((p) => p.status === 'committed')!.id);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const filtered = products.filter((p) => {
    const matchStatus = status === 'all' || p.status === status;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.gtin.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const hierProduct = products.find((p) => p.id === hierId)!;

  return (
    <>
      <TopNav active="/master-data" />

      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <main className="mx-auto max-w-[1180px] px-6 py-7">
        {/* page head */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">Master Data</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              Acme Foods · products keyed by internal UUID · GTIN, batch & serial are validated attributes
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <Btn icon={<DownloadIcon width={16} height={16} />} onClick={() => flash('Export queued — 3,210 products (CSV)')}>
              Export
            </Btn>
            <Btn grad icon={<PlusIcon width={16} height={16} />} onClick={() => flash('New product draft created')}>
              New product
            </Btn>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-3xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: toneSoft[k.tone], color: toneColor[k.tone] }}
                >
                  <ActivityIcon width={18} height={18} />
                </span>
                <span className="text-[12.5px] font-semibold text-muted">{k.label}</span>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight">{k.value}</div>
              <div className="mt-1.5 text-xs font-semibold text-muted">{k.foot}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Icon width={16} height={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <ProductsTab
            rows={filtered}
            total={products.length}
            query={query}
            setQuery={setQuery}
            status={status}
            setStatus={setStatus}
            onOpen={setSelected}
          />
        )}
        {tab === 'manufacturers' && <ManufacturersTab />}
        {tab === 'brands' && <BrandsTab />}
        {tab === 'hierarchy' && (
          <HierarchyTab productId={hierId} setProductId={setHierId} product={hierProduct} />
        )}

        <p className="mt-8 text-[13px] text-subtle">
          Scaffold v0 · Command × Bento · mock data (frontend-first). Live data arrives when this
          page is connected to the API.
        </p>
      </main>

      {selected && <ProductDrawer product={selected} onClose={() => setSelected(null)} onFlash={flash} />}
    </>
  );
}

/* ── Products tab ─────────────────────────────────────────── */

function ProductsTab({
  rows,
  total,
  query,
  setQuery,
  status,
  setStatus,
  onOpen,
}: {
  rows: Product[];
  total: number;
  query: string;
  setQuery: (v: string) => void;
  status: 'all' | ProductStatus;
  setStatus: (v: 'all' | ProductStatus) => void;
  onOpen: (p: Product) => void;
}) {
  const chips: { key: 'all' | ProductStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'committed', label: 'Committed' },
    { key: 'draft', label: 'Draft' },
  ];
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
          <SearchIcon width={15} height={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GTIN, product or brand…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setStatus(c.key)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${
                status === c.key ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12.5px] text-muted">
          {rows.length} of {total} products
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Product</th>
              <th className="px-4 py-2.5 font-semibold">Brand</th>
              <th className="px-4 py-2.5 font-semibold">Category</th>
              <th className="px-4 py-2.5 font-semibold">Net content</th>
              <th className="px-4 py-2.5 font-semibold">Batches</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                onClick={() => onOpen(p)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl text-[13px] font-bold"
                      style={{ background: toneSoft[p.swatch], color: toneColor[p.swatch] }}
                    >
                      {p.name[0]}
                    </span>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="font-mono text-[12px] text-muted">{p.gtin}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.brand}</td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                <td className="px-4 py-3 text-muted">{p.netContent}</td>
                <td className="px-4 py-3 text-muted">{p.batches}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRightIcon width={16} height={16} className="text-subtle" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'committed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-soft)] px-2.5 py-1 text-[11px] font-bold text-teal">
        <LockIcon width={12} height={12} /> Committed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--warning-fg)]">
      Draft
    </span>
  );
}

/* ── Manufacturers tab ────────────────────────────────────── */

function ManufacturersTab() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Manufacturing unit</th>
            <th className="px-4 py-2.5 font-semibold">Code</th>
            <th className="px-4 py-2.5 font-semibold">Location</th>
            <th className="px-4 py-2.5 font-semibold">Identifier</th>
            <th className="px-4 py-2.5 font-semibold">Products</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.map((m) => (
            <tr key={m.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]">
                    <BuildingIcon width={17} height={17} />
                  </span>
                  <span className="font-semibold">{m.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-muted">{m.code}</td>
              <td className="px-4 py-3 text-muted">{m.location}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-muted">{m.identifier}</td>
              <td className="px-4 py-3 text-muted">{m.products}</td>
              <td className="px-4 py-3">
                <ActiveDot active={m.status === 'active'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Brand owners tab ─────────────────────────────────────── */

function BrandsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {brandOwners.map((b) => (
        <div key={b.id} className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
              <UserIcon width={20} height={20} />
            </span>
            <div>
              <div className="font-semibold">{b.name}</div>
              <div className="font-mono text-[12px] text-muted">GLN {b.gln}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Brands" value={String(b.brands)} />
            <Stat label="Products" value={b.products.toLocaleString()} />
            <Stat label="Country" value={b.country} />
          </div>
          <div className="mt-4">
            <ActiveDot active={b.status === 'active'} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 py-2.5">
      <div className="font-display text-[17px] font-bold">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function ActiveDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: active ? 'var(--teal)' : 'var(--subtle)' }}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── Pack hierarchy tab ───────────────────────────────────── */

function HierarchyTab({
  productId,
  setProductId,
  product,
}: {
  productId: string;
  setProductId: (id: string) => void;
  product: Product;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <h3 className="text-[15px] font-bold">Pack hierarchy</h3>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-muted">
          Each → Case → Pallet
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {products
            .filter((p) => p.status === 'committed')
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${
                  productId === p.id ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted'
                }`}
              >
                {p.name}
              </button>
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {product.hierarchy.map((lvl, i) => (
          <div key={lvl.level} className="flex flex-1 items-center gap-3">
            <div className="flex-1 rounded-2xl border border-border bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-xl text-[12px] font-bold"
                  style={{ background: toneSoft[product.swatch], color: toneColor[product.swatch] }}
                >
                  {i + 1}
                </span>
                <div className="font-semibold">{lvl.level}</div>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                  {lvl.scheme}
                </span>
              </div>
              <div className="mt-3 font-mono text-[12.5px]">{lvl.code}</div>
              <div className="mt-1 text-[12px] text-muted">{lvl.qty}</div>
            </div>
            {i < product.hierarchy.length - 1 && (
              <ChevronRightIcon width={20} height={20} className="hidden shrink-0 text-subtle lg:block" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 text-[12.5px] text-subtle">
        Aggregation events (Each → Case → Pallet) build this hierarchy; disaggregation unwinds it.
        Each level carries its own identity code so a single scan resolves the whole chain.
      </p>
    </div>
  );
}

/* ── Product detail drawer ────────────────────────────────── */

function ProductDrawer({
  product,
  onClose,
  onFlash,
}: {
  product: Product;
  onClose: () => void;
  onFlash: (t: string) => void;
}) {
  const locked = product.status === 'committed';
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-[15px] font-bold"
            style={{ background: toneSoft[product.swatch], color: toneColor[product.swatch] }}
          >
            {product.name[0]}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] font-bold">{product.name}</div>
            <div className="font-mono text-[12px] text-muted">id {product.id}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        {/* identity — locked */}
        <Section
          title="Identity"
          right={
            locked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--teal-soft)] px-2 py-0.5 text-[10.5px] font-bold text-teal">
                <LockIcon width={11} height={11} /> Locked
              </span>
            ) : (
              <span className="rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--warning-fg)]">
                Editable
              </span>
            )
          }
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
            {identityFields(product).map((f) => (
              <div key={f.label} className="bg-surface p-3">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                  {f.label}
                  {locked && <LockIcon width={10} height={10} className="text-subtle" />}
                </div>
                <div className="mt-0.5 text-[13px] font-semibold">{f.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-subtle">
            {locked
              ? 'These six attributes are frozen — committed once the GTIN was used in an event or label (invariant 7).'
              : 'Will be locked the moment this GTIN is first used in an event or label.'}
          </p>
        </Section>

        {/* commercial */}
        <Section title="Commercial & logistics">
          <DefRow label="Brand owner" value={product.brandOwner} />
          <DefRow label="Category" value={product.category} />
          <DefRow label="MRP" value={product.mrp} />
          <DefRow label="HSN" value={product.hsn} mono />
          <DefRow label="Manufacturing unit" value={product.mfgUnit} />
          <DefRow label="Shelf life" value={product.shelfLife} />
        </Section>

        {/* pack hierarchy */}
        <Section title="Pack hierarchy">
          {product.hierarchy.map((lvl) => (
            <div key={lvl.level} className="mb-2 flex items-center gap-3 rounded-xl bg-surface-2 p-3 last:mb-0">
              <span className="text-[12px] font-bold">{lvl.level}</span>
              <span className="ml-auto font-mono text-[12px] text-muted">{lvl.code}</span>
            </div>
          ))}
        </Section>

        {/* batches */}
        <Section title={`Recent batches · ${product.batches} total`}>
          {product.recentBatches.length === 0 ? (
            <p className="text-[12.5px] text-muted">No batches yet — this product is still a draft.</p>
          ) : (
            product.recentBatches.map((b) => (
              <div key={b.code} className="mb-2 flex items-center gap-3 rounded-xl border border-border p-3 last:mb-0">
                <span className="font-mono text-[12.5px] font-semibold">{b.code}</span>
                <span className="ml-auto text-[12px] text-muted">
                  mfg {b.mfg} · exp {b.exp}
                </span>
              </div>
            ))
          )}
        </Section>

        {/* footer actions */}
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button
            onClick={() => onFlash(`Opened trace for ${product.name}`)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover"
          >
            <ActivityIcon width={16} height={16} /> View trace
          </button>
          <button
            onClick={() => onFlash(locked ? 'Cannot edit locked identity — clone to revise' : 'Editing draft…')}
            className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white"
          >
            {locked ? <CheckIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
            {locked ? 'Clone' : 'Edit draft'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-5">
      <div className="mb-3 flex items-center">
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-subtle">{title}</h4>
        {right && <span className="ml-auto">{right}</span>}
      </div>
      {children}
    </div>
  );
}

function DefRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className={`text-[12.5px] font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

/* ── shared button ────────────────────────────────────────── */

function Btn({
  children,
  icon,
  grad,
  onClick,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  grad?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold ${
        grad
          ? 'brand-grad border-transparent text-white'
          : 'border border-border-strong bg-surface text-text hover:bg-surface-hover'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
