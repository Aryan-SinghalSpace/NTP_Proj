# WORKLOG — running build log

> **Purpose:** an append-only, git-committed log of what we build each session, so
> work is always resumable even without the Claude memory system. Newest entries at
> the top. For the "why" behind the product see `docs/PRD.md`; for decisions see
> `docs/decisions.md`; for the page/route index see `docs/RUNBOOK.md`.
>
> **Rule:** after each meaningful step, add an entry here (date · what · files · verified · next).

---

## 2026-07-25 — Phase C "connect" begins: pages wired to the live backend + DB

Goal for the phase: stop running the UI on mock data and connect page after page to
the real NestJS API + Postgres (RLS), then add tests once the connections exist.

### Products (Master Data) — DONE, live end-to-end
- **API** (`code/apps/api`): new `product` entity behind Postgres RLS.
  - `drizzle/0002_product.sql` — `product` table (UUID pk; the 6 GTIN-immutable
    identity attrs as columns; commercial fields + `attributes` jsonb bag;
    draft/committed lifecycle) + RLS tenant-isolation policy + grants + seed
    (6 products for demo tenant *Acme Foods*).
  - `src/db/schema.ts` — drizzle `product` table.
  - `src/products/*` — `ProductsModule`: `GET /api/products`, `GET /api/products/:id`,
    `POST /api/products` (create draft; tenant_id from request context, not body;
    zod-validated).
  - Verified: Acme→6, no header→0, other tenant→0 (RLS proven); POST persists a
    draft (no GTIN); invalid body→400.
- **Web** (`code/apps/web`): `/master-data` now runs on live data.
  - `lib/api.ts` — `ApiProduct`, `getProducts()`, `createProduct()`.
  - `app/master-data/page.tsx` — server component; fetches products via RLS,
    degrades to a "start the backend" message if the API is down.
  - `app/master-data/master-data-client.tsx` — maps API rows → UI shape
    (deterministic swatch, derived pack hierarchy); KPIs computed from live data;
    "New product" modal POSTs a draft then `router.refresh()`.
  - Manufacturers & Brand owners tabs still on mock data (labelled) — sliced next.
  - Verified: `/master-data` HTTP 200 with seeded products live; typecheck clean.
- **Commits:** `bd046ed` (api), `be9977d` (web). Pushed to `origin/main`.
- **Gotcha:** running the api `tsc --noEmit` typecheck writes `tsconfig.tsbuildinfo`
  which poisons `nest dev`'s incremental build (`Cannot find module dist/main`).
  Fix: delete `apps/api/tsconfig.tsbuildinfo` + `apps/api/dist`, restart.

### Manufacturers + Brand Owners — DONE, live end-to-end (finishes Master Data)
- **API**: `0003_master_data.sql` — `manufacturing_unit` + `brand_owner` tables
  (tenant-scoped, RLS policies + grants + seed for Acme). Drizzle schemas.
  `src/master-data/*` — `MasterDataModule`: `GET /api/manufacturing-units`,
  `GET /api/brand-owners`. Product / brand counts are **derived live** by joining
  the `product` table (never stored → can't drift).
  - Verified: units MUM-1→3, PUN-2→1, BLR-3→2, SUR-7→0; owners Acme→4 products/2
    brands, Northstar→2/1, Sunrise→0/0; other tenant→0 (RLS).
- **Web**: `lib/api.ts` +`ApiManufacturingUnit`/`ApiBrandOwner` + fetchers.
  `/master-data` server page now fetches all three in parallel; client's
  Manufacturers & Brand-owner tabs render live data; KPIs use real entity counts.
  - Verified: `/master-data` HTTP 200 with live units + owners; typecheck clean.
- **All three Master Data tabs (Products, Manufacturers, Brand owners) are now live.**
  `data_mock/masterData.ts` `manufacturers`/`brandOwners` exports are now unused.

### Product commit (invariant #7) — DONE, live end-to-end
- **API**: `POST /api/products/:id/commit` — assigns a GTIN and freezes identity.
  Validates the GTIN with `isValidGtin` (GS1 mod-10) from `@tracewell/field-types`;
  rejects re-committing a committed product (409); the partial unique index
  `(tenant_id, gtin)` guarantees one-GTIN-per-tenant (unique_violation → 409).
  Sets `status='committed'` + `committed_at`. Files: `products.service.ts`
  (+`commit`), `products.controller.ts` (+route), `product.dto.ts` (+schema).
  - Verified: invalid GTIN→400, valid→committed (gtin + committed_at set),
    re-commit→409. (Test-committed the Protein Bar draft then reset it to draft so
    the demo keeps two fresh drafts.)
- **Web**: `lib/api.ts` +`commitProduct()`. Product drawer for a **draft** now
  shows a "Commit & lock identity" panel: GTIN input (digits only) → `commitProduct`
  → `router.refresh()`; committed products show Clone instead. Surfaces the server
  error message (bad check digit / already used) via the flash toast.
  - Verified: `/master-data` HTTP 200; typecheck clean.

### Batches — DONE, live end-to-end
- **API**: `0004_batch.sql` — `batch` table (UUID pk, `product_id` FK, `batch_number`,
  mfg/expiry dates, quantity, `manufacturing_unit_id` FK, status
  active/on_hold/recalled/depleted, attributes jsonb) + RLS + grants + unique
  `(tenant_id, product_id, batch_number)` + expiry index (FEFO) + seed (6 batches
  across the committed products). Drizzle `batch` schema (dates mapped as text/ISO).
  `src/batches/*` — `BatchesModule`: `GET /api/batches?productId=` (FEFO order by
  expiry), `POST /api/batches` (create; 409 on dup batch#, 400 on unknown product).
  Products list endpoint now returns a live `batchCount` per product (join, not stored).
  - Verified: 6 seeded batches in FEFO order; product batchCounts (Choco 2, Oat 2…);
    ?productId scoping; RLS other-tenant→0; POST create ok, dup→409, count 2→3.
- **Web**: `lib/api.ts` +`ApiBatch`/`getBatches`/`createBatch` + `batchCount` on
  ApiProduct. Products table re-adds a live **Batches** column. Product drawer now
  **fetches real batches on open** (loading→list, FEFO, status dot) with a
  **"New batch" inline form** (batch#, mfg/expiry date pickers, qty) → `createBatch`
  → refetch + `router.refresh()` so the list count updates.
  - Verified: `/master-data` HTTP 200 with Batches column; typecheck clean.

### Full status snapshot (2026-07-25)
LIVE: `/master-data` (products+units+brand-owners+batches, create/commit/add-batch),
`/fields` (old design). Live API: health, fields, products(+:id,+POST,+commit),
manufacturing-units, brand-owners, batches(+POST). Everything else = mock UI.

### Next up (connect order)
- **Events** (Commission…Recall) — the workflow spine; big, needs a plan. Feeds
  trace/recall/FEFO/dashboard.
- **Users/Roles** (tenant-scoped) — groundwork for real auth.
- **Dashboard** partial-live (product/GTIN/batch KPIs now that those exist).
- Rebuild `/fields` on the new design.
- After connections: tests per component; OIDC to replace `x-tenant-id` stand-in.
