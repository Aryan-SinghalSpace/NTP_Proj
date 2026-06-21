# CLAUDE.md — Project Briefing

> **This file is auto-loaded by Claude Code at the start of every session.** Keep it short and focused. For full requirements, see `docs/PRD.md`.

---

## What we're building

A **Configurable Dynamic Traceability Platform**: a multi-tenant, no-code system that lets an administrator assemble a complete traceability solution for any customer without writing code. The platform itself is the product; each customer receives a configured instance.

Inspired by GS1 standards and GS1 India DataKart, but **not bound to GS1**. GTIN is the primary supported identity scheme; UUID and custom identifiers are also first-class.

---

## Core invariants — never break these

1. **UUID-internal identity.** Every entity has a UUID primary key. GTIN, batch number, serial, etc. are validated *attributes* on top.
2. **Configuration is versioned, append-only, immutable in history.** No silent overwrites. Every change auditable.
3. **Strict typing.** The workflow builder and label designer refuse to bind mismatched types.
4. **Deactivate, never delete.** Fields are deactivated; historical data is preserved and viewable via a "View Historic Records" toggle.
5. **Async workflow engine, sync-feeling UI.** Events queue; workflow runs in background; UI reflects real-time progress via websockets.
6. **Tenant isolation is non-negotiable.** Row-level security; no tenant ever sees another's data, even via API misuse.
7. **GTIN immutability.** Once committed (used in an event/label), GTIN + Brand + Product Name + Net Content + Pack Type + Country of Origin are locked.
8. **Scale linearly.** Same architecture serves a 100-GTIN tenant and a 1M-GTIN tenant. No "rewrite at scale" — design once.

---

## Product structure

| Part | Scope |
|------|-------|
| **A. Identity & Master Data** | Tenant onboarding, identity schemes, product master data, Field Library Model, Manufacturer/Brand Owner entities, pack hierarchy. |
| **B. Traceability Engine & Builder** | No-code workflow builder (the spine), event capture, batch/unit/custom-hierarchy traceability, label designer, dashboards, notifications, forward & backward trace, recall, FEFO. |
| **C. Standards & Interop (opt-in)** | GS1 conformance mode, GS1 Digital Link resolver, EPCIS-style event export. |

---

## Role hierarchy

- **Platform Super Admin** (me — single role): god-mode across all tenants.
- **Platform Admin** (my team): tenant-scoped support, no destructive ops.
- **Tenant Admin** (customer's admin): full control of their own tenant only.
- **Tenant User** (configurable): roles the tenant admin defines, granular permissions.

---

## Field Library Model — three tiers

| Tier | Managed by | Purpose |
|------|------------|---------|
| **Core Fields** | Platform (locked) | System-required; cannot be removed. |
| **Super Fields** | Super Admin | Canonical library shared across all tenants. |
| **Tenant Custom Fields** | Tenant Admin | Tenant-specific; tenant admin can add freely. |

- Super Fields can only be deactivated by Super Admin (per-tenant or global).
- Tenant Admins can request promotion of a Tenant Custom Field → Super Field via an approval queue.

---

## Tech direction (decided 2026-05-31 unless noted)

- **Backend**: **TypeScript on NestJS.**
- **Workflow engine**: **Temporal**, hosting a generic graph interpreter (tenant workflows stay data; each node runs as a Temporal activity). Gives durable execution, per-node retry/backoff, idempotency, version coexistence.
- **Datastore**: **PostgreSQL** (system of record — RLS for tenant isolation, JSONB for the meta-model, partitioning for scale) + **Redis** (cache, websocket pub/sub, rate limiting, offline sync) + **S3-compatible object storage** (images, label artifacts).
- **UI**: shadcn/ui on Tailwind CSS (React); subtle motion for admin views, expressive for dashboards/consumer pages.
- **Barcode rendering**: **Zint** library (runs as a sidecar render service).
- **Cloud / region**: single-region (India) for v1. Multi-region in v2.
- **Cloud platform**: TBD — to decide at infrastructure session (must offer India region for DPDP residency).
- **Frontend framework**: React fixed by shadcn; Next.js vs. Vite-React + React Flow still to confirm. Recommendation: Next.js App Router + React Flow/@xyflow for the builder canvas.
- **Analytics store**: ClickHouse deferred until dashboards require it.

---

## v1 scope (what we're building first)

- Three-tier admin + configurable tenant roles.
- Identity: UUID-internal; GTIN primary; UUID/custom fallback.
- Product master data with default field groups + Field Library Model (Core/Super/Tenant Custom) with typed fields, validation, derived fields, deactivate-not-delete.
- Manufacturer + Brand Owner as entity-linked records; Manufacturing Units as a separate entity.
- Batch / unit / custom-hierarchy traceability.
- **No-code workflow builder** (canvas/graph UI): full node set incl. conditional branch + dynamic routing; draft/publish; dry-run; live preview; 30-day version grace period.
- All v1 event types (Commission, Decommission, Aggregate, Disaggregate, Transform, QC/Hold, Sample, Pack, Store, Dispatch, Receive, Dispense/Issue, Reject/Return, Recall).
- Forward and backward trace; recall fan-out.
- **FEFO advisory** at Dispatch and Issue events.
- **Multi-dealer dispatch + receive** with dealer scanning surface.
- **Scanning app** (mobile PWA) — tag, dispatch, receive against generated labels; offline mode with sync.
- Label designer (WYSIWYG, Zint, scannability validation; PDF/PNG/ZPL/Excel output).
- Template-based dashboards; in-app/email/webhook notifications.
- Full security baseline incl. VAPT pre-launch and recurring.
- Usage metrics captured (no billing).

---

## v2 and later

Auto-discovery of field promotion candidates; configurable widget dashboards; multi-condition notification rules; SMS/Slack/Teams/WhatsApp; ERP/WMS and direct printer integrations; multi-region; EPCIS export; own GS1 Digital Link resolver; Relabel/Repack and Sold events; billing.

---

## Working style — important

1. **Read `docs/PRD.md` first** if the task touches any product behavior. It's the source of truth.
2. **Check `docs/decisions.md`** for the most recent decisions; that's the change log.
3. **Plan mode for non-trivial work.** Show me the plan before you execute.
4. **Ask before installing dependencies or adding new services.** I want to know what's running.
5. **Git commit after each meaningful unit of work.** Small, reversible steps.
6. **When you find ambiguity in the spec, log it.** Don't guess silently. Either append to `docs/decisions.md` ("pending decision: X") or ask.
7. **Tests are not optional.** Schema validation, type checks, audit trails — the correctness guarantees are the product. Cover them.

---

## Open questions (not yet decided)

These are listed at the end of `docs/PRD.md` Section 18. Don't make assumptions on these — flag them:

- Cloud platform & data residency
- Frontend framework (React fixed; Next.js vs. Vite-React + React Flow unconfirmed)
- Billing model
- Seed Super Fields per entity
- Q9–Q18 from the last PRD discussion (scanning app and multi-dealer details — see PRD Section 18.2 "Pending stakeholder responses")

_Resolved 2026-05-31: backend language (TS/NestJS), workflow engine (Temporal), datastore & queue (Postgres + Redis + S3). See `docs/decisions.md`._

---

## Files in this repo

- `CLAUDE.md` — this file. Always loaded.
- `docs/PRD.md` — full Product Requirements Document. Read on demand.
- `docs/decisions.md` — append-only log of decisions taken across sessions.
- `docs/architecture.md` — system topology, Temporal interpreter internals, multi-tenant RLS model, supporting services (v0.1, 2026-05-31).
- `docs/datakart-gs1-analysis.md` — reference analysis of GS1 India's DataKart + the GS1 BRD/RFP; what to learn vs. differentiate (2026-06-21). GS1 = opt-in conformance mode.
- `docs/data-model.md` — logical data model: entities, RLS, meta-model/Field Library, partitioned events, audit chain, opt-in GS1 allocation, ER diagram (v0.1, 2026-06-21).
- `docs/security.md` — to be created at security session.
- `mockups/` — static HTML UI mockups. Chosen direction: **Command × Bento** (`mockups/final/`); 5 concept explorations in `mockups/concepts/`.

> **Confidential reference (git-ignored, local-only):** `Hakuna Matata/` and `DK-2-Prod-Features--main/` are third-party DataKart material — study as reference, **never clone, never commit/push**.
