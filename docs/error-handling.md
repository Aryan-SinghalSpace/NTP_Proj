# Error Handling, Logging & Offline Fallback

> **Status:** v1 (2026-07-25). This document is the source of truth for how the
> platform reports, logs, and recovers from errors. Keep the **Error Catalog**
> below in sync with `code/apps/api/src/common/errors/error-catalog.ts` — that
> file is the machine-readable version; every code there must appear here.

---

## 1. The two-layer model

Every error has two representations, always:

| Layer | Audience | What it contains | Where |
|---|---|---|---|
| **1 · Customer-facing** | The user in the UI | A stable `code`, a **friendly** `message`, a `requestId`, a `timestamp` (+ `details` for validation). **Never** a stack trace or internal wording. | API JSON envelope → parsed by the web into `ApiError` → shown as a toast/banner. |
| **2 · Internal** | Us (ops/devs) | The real cause: code, HTTP status, method, path, `requestId`, `tenantId`, internal note, **full stack**. | Structured JSON log line on the server (`stdout`/`stderr`); `console.error` in the browser. |

The **`requestId`** ties the two together: it is returned to the client (in the
`error` body **and** the `x-request-id` response header) and printed in the server
log. When a customer reports "I saw an error, reference `a918…`", we grep the logs
for that id and see exactly what happened.

---

## 2. The API error envelope

Every non-2xx API response has this exact shape (produced by the global filter):

```json
{
  "error": {
    "code": "TW-PROD-400-GTIN",
    "message": "That GTIN isn't valid — please check the digits (it failed the GS1 check-digit test).",
    "requestId": "aa975ee0-1bcc-4587-bf83-00f224d45808",
    "timestamp": "2026-07-25T14:33:38.726Z",
    "details": ["brand: Required", "name: String must contain at least 1 character(s)"]
  }
}
```

- `details` is present only for validation errors (`TW-GEN-400`) and lists the
  field-level problems.
- `message` is safe to show verbatim to a customer.

---

## 3. Error Catalog

Codes are `TW-<AREA>-<n>`. Areas: `GEN` generic · `AUTH` auth · `TENANT` tenancy ·
`PROD` product · `MD` master data · `BATCH` batch · `EVENT` event · `SYS` system.

| Code | HTTP | Meaning (internal) | Friendly message (UI) | Thrown in |
|---|---|---|---|---|
| `TW-GEN-400` | 400 | Generic validation failure; `details` carry field issues | "Some of the information provided isn't valid. Please review the highlighted fields and try again." | any controller (zod `safeParse` → `BadRequestException`), mapped by the filter |
| `TW-GEN-404` | 404 | Generic not-found | "We couldn't find what you were looking for…" | filter fallback for framework 404s |
| `TW-GEN-409` | 409 | Generic conflict | "This action conflicts with data that already exists." | filter fallback |
| `TW-GEN-500` | 500 | Unhandled/unknown server error — inspect stack + requestId | "Something went wrong on our end. The team has been notified — please try again shortly." | filter fallback for any non-HttpException |
| `TW-AUTH-401` | 401 | Missing/invalid credentials (currently the `x-tenant-id` stand-in) | "You need to sign in to continue." | filter mapping (reserved for OIDC) |
| `TW-TENANT-403` | 403 | Tenant/role check failed (RLS is the backstop) | "You don't have access to this resource." | filter mapping (reserved) |
| `TW-PROD-404` | 404 | product id not visible to tenant (RLS) or absent | "That product couldn't be found." | `products.service.ts` `getById`, `commit` |
| `TW-PROD-400-GTIN` | 400 | `isValidGtin()` false — bad length or mod-10 check digit | "That GTIN isn't valid — please check the digits…" | `products.service.ts` `commit` |
| `TW-PROD-409-COMMITTED` | 409 | Commit attempted on an already-committed product (invariant #7) | "This product is already committed, so its identity is locked…" | `products.service.ts` `commit` |
| `TW-PROD-409-GTIN-TAKEN` | 409 | `unique_violation` on `product (tenant_id, gtin)` | "That GTIN is already assigned to another product in your account." | `products.service.ts` `commit` |
| `TW-FIELD-404` | 404 | field_definition not visible to tenant (RLS) or absent | "That field couldn't be found." | `fields.service.ts` `setStatus` |
| `TW-FIELD-409-DUP` | 409 | duplicate `(entity, key)` among active fields | "A field with that key already exists for this entity." | `fields.service.ts` `create` |
| `TW-FIELD-403-TIER` | 403 | attempt to modify a core/super field via the tenant endpoint | "Only your own custom fields can be changed here…" | `fields.service.ts` `setStatus` |
| `TW-BATCH-409-DUP` | 409 | `unique_violation` on `batch (tenant_id, product_id, batch_number)` | "A batch with that number already exists for this product." | `batches.service.ts` `create` |
| `TW-BATCH-400-PRODUCT` | 400 | `foreign_key_violation (23503)` on `batch.product_id` | "We couldn't link that batch to a product — the product wasn't found." | `batches.service.ts` `create` |
| `TW-EVENT-409-IDEMPOTENT` | 409 | `unique_violation` on `event (tenant_id, idempotency_key)` — duplicate replay | "This event was already recorded, so we didn't add it again." | `events.service.ts` `create` |
| `TW-ROLE-404` | 404 | role id not visible to tenant (RLS) or absent | "That role couldn't be found." | `access/roles.service.ts` `update` |
| `TW-ROLE-409-DUP` | 409 | `unique_violation` on `role (tenant_id, lower(name))` | "A role with that name already exists." | `access/roles.service.ts` `create`/`update` |
| `TW-USER-409-DUP` | 409 | `unique_violation` on `tenant_user (tenant_id, lower(email))` | "Someone with that email is already in your team." | `access/users.service.ts` `create` |
| `TW-SYS-503-DB` | 503 | Database unreachable / connection error | "The service is briefly unavailable. Your work is safe — please try again in a moment." | reserved (DB health) |

> **Adding a new error:** add it to `error-catalog.ts`, throw
> `new AppException('TW-…')` from the service, and add a row here. Never throw a
> raw string message to the client.

---

## 4. Where it lives (files & sections)

### API (`code/apps/api/src`)
| Concern | File |
|---|---|
| Error catalog (codes → status/message/note) | `common/errors/error-catalog.ts` |
| `AppException` (the only exception we throw for expected errors) | `common/errors/app-exception.ts` |
| Global exception filter (builds envelope + logs) | `common/all-exceptions.filter.ts` |
| Structured JSON logger | `common/logger.ts` |
| Request-lifecycle logging interceptor | `common/logging.interceptor.ts` |
| `requestId` + tenant context (async storage) | `db/tenant-context.ts` |
| Sets `requestId`, echoes `x-request-id` header | `common/tenant.middleware.ts` |
| Wires the filter + interceptor globally | `main.ts` |

### Web (`code/apps/web`)
| Concern | File |
|---|---|
| `ApiError` / `QueuedOfflineError` + envelope parsing | `lib/api-error.ts` |
| API client (throws `ApiError`; writes fall back to the outbox) | `lib/api.ts` |
| Offline outbox (localStorage queue + flush) | `lib/outbox.ts` |
| Outbox watcher (auto-retry + "pending sync" pill) | `components/OutboxWatcher.tsx` (mounted in `app/layout.tsx`) |
| Global render error boundary (friendly page) | `app/error.tsx` |
| Per-page error surfacing | each page catches `ApiError` → shows `e.message` (already friendly) |

---

## 5. Logging strategy (always-on)

The server emits **one JSON object per line** (machine-parseable, ready for any
log aggregator). Two lifecycle events cover every request:

- `request.completed` (level `info`, stdout) — `method`, `path`, `status`,
  `durationMs`, `requestId`, `tenantId`. Emitted by `LoggingInterceptor` for every
  request.
- `error.handled` (level `warn` for 4xx, `error` for 5xx, stderr) — `code`,
  `status`, `method`, `path`, `requestId`, `tenantId`, internal `detail`, and the
  full `stack`. Emitted by `AllExceptionsFilter` for every thrown error.
- `server.started` — emitted once on boot.

Example (an invalid-GTIN attempt):

```json
{"ts":"2026-07-25T14:33:38.726Z","level":"warn","event":"error.handled","requestId":"aa975ee0-…","tenantId":"0000…0001","code":"TW-PROD-400-GTIN","status":400,"method":"POST","path":"/api/products/…/commit","detail":"isValidGtin() false: … — gtin 123","stack":"AppException: …"}
```

**Browser:** the global error boundary logs `[ui.error]` with message/digest/stack
to the console; API client errors carry the `requestId` for cross-referencing.

**Future:** ship stdout/stderr JSON to a central store (e.g. Loki/CloudWatch);
add request/tenant sampling and PII redaction before external log shipping.

---

## 6. Robust fallback — the offline outbox

**Goal:** if a write can't reach the API (network down, server unreachable), the
user's data is **never lost** — it's saved locally and synced automatically later.
This realises the PRD's "offline mode with sync" and the "async engine,
sync-feeling UI" invariant.

**How it works** (`lib/outbox.ts` + `lib/api.ts` + `components/OutboxWatcher.tsx`):

1. Every write (`createProduct`, `commitProduct`, `createBatch`, `createEvent`)
   goes through `writeOrQueue`. On a **network failure** (fetch throws
   `TypeError`), the payload is appended to the **localStorage outbox**
   (`tw.outbox.v1`) and a friendly `QueuedOfflineError` is thrown — the modals
   treat this as *accepted*: they close and show "saved offline — will sync".
   (An **HTTP error** is a real rejection and is shown as-is; it is *not* queued.)
2. `OutboxWatcher` (mounted once in the root layout) shows a pill — "*N changes
   saved offline*" / "*Syncing…*" — and retries the queue **on mount, when the
   browser fires `online`, and every 15 s**.
3. `flushOutbox` re-POSTs each item:
   - success → remove from queue (and `router.refresh()` to update lists);
   - **network error** → keep it (try again later);
   - **409 conflict** → treat as already-synced (idempotent) and remove;
   - other 4xx (permanent) → drop, so the queue can't loop forever.
4. **No duplicates:** events attach a stable `idempotencyKey`, so an online
   success followed by an offline retry can't create the event twice (the server
   returns `TW-EVENT-409-IDEMPOTENT`, which the flush treats as resolved). Batch
   and GTIN-commit retries are protected by their unique constraints (→ 409 →
   resolved). Product create has no natural key; a lost-response retry is the one
   edge that could duplicate — acceptable for v1, to be closed with a
   client-supplied idempotency key when products gain one.

**Manual test:** DevTools → Network → **Offline** → create a product / add a batch
/ record an event → you see the "saved offline" pill → switch back **Online** →
the pill shows "Syncing…" then clears, and the item appears in the list.

---

## 7. Changelog

| Version | Date | Notes |
|---|---|---|
| v1 | 2026-07-25 | Initial: two-layer model, envelope, catalog, structured logging, offline outbox. |
