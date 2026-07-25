# WORKLOG — running build log

> **Purpose:** an append-only, git-committed log of what we build each session, so
> work is always resumable even without the Claude memory system. Newest entries at
> the top. For the "why" behind the product see `docs/PRD.md`; for decisions see
> `docs/decisions.md`; for the page/route index see `docs/RUNBOOK.md`.
>
> **Rule:** after each meaningful step, add an entry here (date · what · files · verified · next).

---

## 2026-07-25 — Admin console wired (platform super-admin, cross-tenant)

- **API**: `0010_more_tenants.sql` seeds 4 more tenants (varied status). `AdminModule`
  (platform-role-guarded via `x-platform: 1` stand-in → `TW-TENANT-403` otherwise):
  `GET /api/admin/tenants` (all tenants + derived user/product/event counts),
  `GET /api/admin/super-fields` (tier=super field defs + pending field-promotion
  approvals), `GET /api/admin/usage` (tenant status split, total events/products,
  top tenants by events). RLS returns cross-tenant rows under the platform role.
- **Web**: `lib/api.ts` +`getPlatform` helper (x-platform:1) + admin fetchers.
  `/admin/tenants` (live table + search), `/admin/usage` (live KPIs + events-by-
  tenant chart + top-tenants), `/admin/super-fields` (live canonical list + live
  **promotion queue** — Promote/Reject call `decideApproval`).
- **Verified**: 5 tenants w/ real counts (Acme 8/6/17, others 0); 3 super fields +
  2 pending promotions; usage aggregates; **403 without platform header**; all 3
  pages HTTP 200; typecheck clean.

## 2026-07-25 — Scanning + Reports wired (no new backend)

- **`/scanning`**: mobile-PWA surface now records **real events** via the same
  offline outbox — pick a mode (Tag→Commission / Dispatch / Receive), pick a
  batch, Scan → `createEvent` (queues offline if disconnected). Recent-scans feed
  = live events + outbox-queued items; sync status + "Sync now" driven by the
  outbox (`subscribe`/`flushOutbox`). This is the PRD "offline mode with sync".
- **`/reports`**: 6 report cards computed **live** over products/batches/events/
  dealers/shipments (event volume, trace coverage = batches-with-events, recall
  events, near-expiry FEFO, dealer network, product catalogue) with a 7-day event
  sparkline. Deep time-series + scheduled exports deferred to the analytics store.
- **Verified**: both HTTP 200; typecheck clean.

## 2026-07-25 — Dealer / Shipment slice → dispatch, receive & REAL recall fan-out

- **API**: `0009_dealers_shipments.sql` — `dealer`, `shipment`, `shipment_leg`
  tables (RLS + grants + seeds incl. a shipment for the recalled batch B-240517 so
  fan-out is real). `LogisticsModule` (imports EventsModule; EventsService now
  exported): `GET/POST /api/dealers`, `GET /api/shipments` (with legs + dealer
  joined), `POST /api/shipments` (multi-dealer dispatch — **appends a Dispatch
  event** + audit), `PATCH /api/shipment-legs/:id` (receive — marking delivered
  **appends a Receive event**), `GET /api/recall-fanout?batchId=` (dealers impacted,
  derived live from shipment legs).
- **Web**: `/dispatch` live — Dispatch tab (shipments + legs), Receive tab (open
  legs → Receive → delivered), **New dispatch** modal (pick batch + add dealer
  legs). `/events` **Recall tab now shows the real dealer fan-out** (fetched from
  `/api/recall-fanout` for the recalled batch) with a delivered-progress bar.
  `lib/api.ts` +dealer/shipment/leg/recall-fanout fetchers.
- **Verified**: 5 dealers, 3 seeded shipments w/ legs; recall fan-out for B-240517
  → 3 impacted dealers (real); create dispatch → Dispatch event (15→16); receive
  leg → Receive event (16→17); `/dispatch` + `/events` HTTP 200; typecheck clean.
- **Note:** `/scanning` (mobile PWA) still mock — it can reuse the receive path.

## 2026-07-25 — Notifications wired (rules + delivery log)

- **API**: `0008_notifications.sql` — `notification_rule` (name, trigger, channels
  jsonb, recipients, enabled) + `notification_delivery` (rule, channel, recipient,
  status, occurred_at) + RLS + seeds. `NotificationsModule`:
  `GET/POST /api/notification-rules`, `PATCH /api/notification-rules/:id` (toggle),
  `GET /api/notification-deliveries`. Rule create/toggle write audit entries.
  Delivery ENGINE (actual fan-out) deferred — the log shows seeded deliveries.
- **Web**: `/notifications` live — Rules tab (live toggle + **New rule** modal with
  channel multi-select) + Delivery log tab (live). `lib/api.ts` +rule/delivery
  fetchers + Channel type.
- **Verified**: 5 rules (4 enabled), toggle works, 6 deliveries, page HTTP 200,
  typecheck clean.

## 2026-07-25 — Config pages wired: settings, account, identity-schemes, approvals, audit

- **API**: `0007_config.sql` — relaxed tenant RLS (tenant may self-update its own
  row) + `identity_scheme`, `approval_request`, `audit_entry` tables + RLS +
  grants + seeds (+ default tenant settings jsonb). New modules:
  - `TenantModule`: `GET/PATCH /api/tenant` (name + settings jsonb, merge; tier/
    status/slug stay platform-managed) and `GET /api/me` (current user =
    active Tenant Admin stand-in until OIDC).
  - `IdentitySchemesModule`: `GET /api/identity-schemes`, `POST` (custom),
    `PATCH /:id` (enable/disable).
  - `ApprovalsModule`: `GET /api/approvals`, `PATCH /:id` (approve/reject).
  - **`AuditModule` (@Global)**: `GET /api/audit` + `AuditService.record()`.
    **Hooked into every mutation** — product create/commit, field create/
    deactivate/reactivate, role create/update, user invite, identity-scheme
    create/toggle, approval decision, tenant settings → the audit log now fills
    live as you use the app (invariant #2). record() swallows its own errors so
    it can never break the primary op.
  - Filter robustness: Postgres `22P02` (bad UUID in path) → friendly `TW-GEN-400`
    instead of 500.
- **Web**: all five pages live via `lib/api.ts` (+`getTenant/updateTenant/getMe`,
  identity-scheme/approval/audit fetchers): `/settings` (org name + GS1 toggle +
  locale/timezone → PATCH save), `/account` (live profile from /api/me), 
  `/identity-schemes` (standard cards + custom table with enable toggle + New
  scheme modal), `/approvals` (live queue + Approve/Reject → PATCH), `/audit`
  (live append-only log + action filter chips + search).
- **Verified**: all 5 pages HTTP 200; tenant PATCH merges settings; identity 5
  schemes; approvals decide works + **audit hook fires** (6→7 on a decision);
  malformed uuid → 400; web typecheck clean.

## 2026-07-25 — Users & Roles wired to live backend

- **API**: `0006_users_roles.sql` — `role` (name, description, `permissions` jsonb
  resource→CRUD, `is_system`) + `tenant_user` (name, email, `role_id` FK, status
  active/invited/disabled, last_active_at) + RLS + grants + seed (5 roles w/
  matrices, 8 users). `AccessModule` (`access/`): `GET/POST /api/roles`,
  `PATCH /api/roles/:id` (name/description/**permission matrix**),
  `GET/POST /api/users`. Role member counts + user role-name are derived
  (group-by / left-join). New codes `TW-ROLE-404 / 409-DUP`, `TW-USER-409-DUP`.
- **Web**: `/users` live (table + search + **Invite modal** → POST) and `/roles`
  live (role cards w/ live member counts + **editable CRUD permission matrix** for
  non-system roles → PATCH save + dirty state + **New role** modal). `lib/api.ts`
  +`ApiRole/ApiUser/Crud` + `getRoles/createRole/updateRole/getUsers/createUser`;
  `patchJson` now takes an optional body.
- **Verified**: roles w/ counts (Admin 1, Ops 2, QA 2, Dealer 2, Viewer 1 = 8);
  users w/ role names; RLS other-tenant→0; invite+dup→409; role create + permission
  PATCH + dup→409; `/users` + `/roles` HTTP 200; typecheck clean.

## 2026-07-25 — Field Library completed (write endpoints + rebuilt page)

Finishes the last half-done live page (was live-read on the old design).
- **API**: `fields.service.ts` +`create` (Tenant Custom only; tier forced;
  dup-key guard) +`setStatus` (deactivate/reactivate — deactivate-not-delete,
  invariant #4). `fields.controller.ts` +`POST /api/fields`,
  `PATCH /api/fields/:id/{deactivate,reactivate}`, and `GET …&includeInactive=1`.
  `field.dto.ts` (zod, snake_case key, dataType ∈ FIELD_DATA_TYPES). New codes
  `TW-FIELD-404 / 409-DUP / 403-TIER`.
- **Web**: `/fields` rebuilt as a live client page — entity tabs
  (product/batch/unit/event/label/location), search, **"View historic records"**
  toggle (shows deactivated), tier badges + lock, per-row Deactivate/Reactivate
  (tenant-custom only; core/super = platform-managed), **"New field" modal**
  (auto snake_case key, data-type select, required). `lib/api.ts` +`createField/
  deactivateField/reactivateField` + `getFields(entity, includeInactive)`.
- **Verified**: create→tenant_custom/active; dup→409; deactivate→excluded from
  active, shown in historic; reactivate→active; core deactivate→403; `/fields`
  HTTP 200; web typecheck clean. Now all 4 originally-live pages are on the new
  design and the Field Library is fully manageable.

## 2026-07-25 — Error handling, logging & offline fallback (cross-cutting)

User requirement: robust error handling with (1) friendly customer-facing errors,
(2) always-on structured logging, (3) a robust fallback so writes are never lost if
the API can't be reached — plus a document describing every error code. See the
full spec in **`docs/error-handling.md`** and the standard in memory.

- **API two-layer errors**: `common/errors/error-catalog.ts` (coded catalog
  TW-<AREA>-<n> → status/friendly message/internal note), `AppException`,
  `AllExceptionsFilter` (builds the `{ error: { code, message, requestId,
  timestamp, details? } }` envelope + logs internal detail with full stack).
  Services (products/batches/events) now throw coded `AppException`s.
- **Structured logging**: `common/logger.ts` (one JSON line per event),
  `LoggingInterceptor` (`request.completed`), filter (`error.handled`),
  `server.started`. `requestId` set in `tenant.middleware.ts`, echoed as the
  `x-request-id` header, and carried in the async context → links UI error ↔ log.
- **Web**: `lib/api-error.ts` (`ApiError`/`QueuedOfflineError` + envelope parse);
  `lib/api.ts` refactored so reads throw `ApiError` (pages show the friendly
  message) and writes fall back to the **offline outbox** (`lib/outbox.ts`,
  localStorage) on network failure; `components/OutboxWatcher.tsx` (mounted in
  layout) auto-retries on online + every 15s and shows a "pending sync" pill;
  `app/error.tsx` friendly global boundary. Modals treat queued-offline as accepted.
- **Verified**: friendly envelopes for 404/400-GTIN/validation (with details) +
  `x-request-id` header; structured `request.completed`/`error.handled` logs with
  matching requestId; all 4 live pages still HTTP 200; web typecheck clean.
  Offline outbox = manual browser test (DevTools offline) per the doc.
- Commit: (this change). Memory: [[error-handling-standard]] added.

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

### Events & Trace — DONE, live end-to-end (the trace spine)
- **API**: `0005_event.sql` — append-only `event` table (data-model §6.2): UUID pk,
  `event_type` CHECK across the 14 v1 types, occurred/recorded_at, actor,
  subject_kind/subject_id/subject_label, location, quantity, detail, payload +
  lineage jsonb, idempotency_key + RLS + grants + partial-unique
  `(tenant_id, idempotency_key)` + time/subject/type indexes + a seeded timeline
  (15 events across 5 batches: Commission→Aggregate→Dispatch→QCHold→Recall etc.).
  Drizzle `event` schema. `src/events/*` — `EventsModule`: `GET /api/events?type=&
  subjectId=&limit=` (newest first), `POST /api/events` (append; 409 on dup
  idempotency key, 400 on bad type). (Temporal/workflow-version links + partitioning
  deferred — this is the v1 event-log.)
  - Verified: 15 events newest-first; ?type=Recall→1; ?subjectId trace→5-event
    chain; RLS other-tenant→0; POST append ok, dup-idempotency→409, bad-type→400.
- **Web**: `/events` rewritten as a live client page (fetches on mount → tz-safe).
  `lib/api.ts` +`ApiEvent`/`getEvents`/`createEvent`/`getAllBatches` + shared
  `postJson`. Three tabs live: **Event Stream** (type chips + search, EVENT_META
  tone/status mapping, formatted time), **Trace Explorer** (pick a subject → real
  chronological timeline), **Recall** (live Recall events; dealer fan-out flagged
  as later shipments slice). KPIs from live events. **"Record event" modal** →
  `POST /api/events` → reload.
  - Verified: `/events` HTTP 200; typecheck clean. **CORS confirmed** for browser
    client-side calls (GET allow-origin ok; POST preflight 204 allows x-tenant-id),
    which also covers the master-data client writes.

### Dashboard — DONE, live (no new backend; reuses existing endpoints)
- **Web only**: `/dashboard` rewritten as a live client page (fetches products +
  batches + events on mount). All figures live: KPIs (Active GTINs = committed
  products, Events logged + distinct types, QC holds, Recall events), an
  **events-by-type** hero bar chart, latest **Recall** card (→ trace), **real FEFO
  advisories** (soonest-expiring active batches, product name joined client-side),
  recent-events feed, and batch/FEFO mini-tiles. Loading + API-down states.
  - Event-volume-over-time and dealer fan-out deferred to the shipments slice.
  - Verified: `/dashboard` HTTP 200 with all sections; typecheck clean.

### Full status snapshot (2026-07-25)
LIVE pages: `/dashboard` (KPIs/events-by-type/recall/recent/FEFO), `/master-data`
(products+units+brand-owners+batches; create/commit/add-batch), `/events`
(stream+trace+recall; record-event), `/fields` (old design). Live API: health,
fields, products(+:id,+POST,+commit), manufacturing-units, brand-owners,
batches(+POST), events(+POST). Everything else = mock UI.

### Next up (connect order)
- **Users/Roles** (tenant-scoped) — groundwork for real auth.
- Rebuild `/fields` on the new design (+ create/deactivate-field endpoints).
- Dealer/shipment slice → real recall fan-out + multi-dealer dispatch + scanning.
- Labels, workflows, notifications, approvals, audit, admin/*, identity-schemes.
- After connections: tests per component; OIDC to replace `x-tenant-id` stand-in.
