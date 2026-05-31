# Architecture Document
## Configurable Dynamic Traceability Platform

| | |
|---|---|
| **Version** | v0.1 (initial draft) |
| **Status** | Draft — for review |
| **Date** | 2026-05-31 |
| **Companion docs** | `docs/PRD.md` (source of truth for behaviour), `docs/decisions.md` (decision log) |

> This document describes **how** the platform is built. The **what** lives in the PRD. Where this document makes an architectural choice that should be binding, it is flagged **[PROPOSED DECISION]** and, once you approve, copied into `docs/decisions.md`.

---

## Table of Contents

1. [Scope & Relationship to Other Docs](#1-scope--relationship-to-other-docs)
2. [Architectural Principles (from the Invariants)](#2-architectural-principles-from-the-invariants)
3. [Confirmed Technology Stack](#3-confirmed-technology-stack)
4. [System Topology](#4-system-topology)
5. [Application Architecture — Modular Monolith](#5-application-architecture--modular-monolith)
6. [The Workflow Engine — Temporal Graph Interpreter](#6-the-workflow-engine--temporal-graph-interpreter)
7. [Event Ingest Path & The "Sync-Feeling" UI](#7-event-ingest-path--the-sync-feeling-ui)
8. [Multi-Tenant Data Architecture](#8-multi-tenant-data-architecture)
9. [The Meta-Model & Field Library](#9-the-meta-model--field-library)
10. [Configuration Store, Versioning & Audit](#10-configuration-store-versioning--audit)
11. [Real-Time Layer (WebSockets)](#11-real-time-layer-websockets)
12. [Label Rendering & the Zint Service](#12-label-rendering--the-zint-service)
13. [Scanning PWA & Offline Sync](#13-scanning-pwa--offline-sync)
14. [Object Storage Layout](#14-object-storage-layout)
15. [Security Architecture (Pointers)](#15-security-architecture-pointers)
16. [Scalability Model](#16-scalability-model)
17. [Deployment Topology (Cloud-Agnostic)](#17-deployment-topology-cloud-agnostic)
18. [Repository / Monorepo Structure](#18-repository--monorepo-structure)
19. [Cross-Cutting Concerns](#19-cross-cutting-concerns)
20. [Proposed Decisions & Open Questions](#20-proposed-decisions--open-questions)

---

## 1. Scope & Relationship to Other Docs

This architecture realizes the PRD's two-part product (Identity & Master Data; Traceability Engine & Builder) plus opt-in Standards adapters, on the stack confirmed on 2026-05-31. It covers system topology, the workflow engine internals, the multi-tenant data strategy, and the supporting services. It deliberately defers:

- **Cloud-provider specifics** → infrastructure session (cloud is undecided; this document stays cloud-agnostic).
- **Detailed threat model, auth flows, encryption & secret management** → `docs/security.md` (dedicated session). Section 15 here is only a pointer map.
- **Concrete table DDL & ER diagrams** → `docs/data-model.md` (next major doc after this one).

---

## 2. Architectural Principles (from the Invariants)

Every structural choice traces back to a CLAUDE.md invariant. The mapping is explicit so the architecture can't silently drift from the product's correctness guarantees.

| # | Invariant | Architectural realization |
|---|-----------|---------------------------|
| 1 | UUID-internal identity | Every table has a UUID PK; GTIN/batch/serial are validated columns/attributes, never the PK. |
| 2 | Versioned, append-only, immutable config | Configuration lives in versioned tables; history rows are never updated/deleted; a hash-chained audit log makes tampering evident. |
| 3 | Strict typing | One shared TypeScript field-type system + JSON Schema, enforced on client **and** server (the no-code builder and label designer reject mismatched bindings). |
| 4 | Deactivate, never delete | Soft-delete (`status`/`deactivated_at`) everywhere; "View Historic Records" reads retain deactivated fields. |
| 5 | Async engine, sync-feeling UI | Temporal runs workflows in the background; API returns immediately; WebSockets stream progress. |
| 6 | Tenant isolation | Postgres Row-Level Security on every tenant-scoped table; tenant context set per transaction. |
| 7 | GTIN immutability | Application + DB constraints lock the six GTIN attributes once `committed_at` is set. |
| 8 | Scale linearly | Shared-schema multitenancy + declarative partitioning + a clean shard seam (tenant_id) so the same design serves 100-GTIN and 1M-GTIN tenants. |

---

## 3. Confirmed Technology Stack

From `docs/decisions.md` (2026-05-31) plus this session's two forks:

| Layer | Choice |
|-------|--------|
| Backend | **TypeScript / NestJS**, as a **modular monolith** (this session) |
| Workflow engine | **Temporal**, hosting a generic **graph interpreter** |
| System of record | **PostgreSQL** (RLS, JSONB, declarative partitioning) |
| Cache / pub-sub / rate-limit / offline-sync coordination | **Redis** |
| Object storage | **S3-compatible** |
| Barcode rendering | **Zint** (separate sidecar service) |
| Web UI | **Next.js (App Router)** + **shadcn/ui** + **Tailwind** (this session) |
| Workflow builder canvas | **React Flow / @xyflow** |
| Scanning app | **Mobile PWA** (React) |
| Cloud | **Deferred** (must offer an India region for DPDP residency) |
| Analytics store | **ClickHouse**, deferred until dashboards need it |

---

## 4. System Topology

```
                         ┌──────────────────────────────────────────────────┐
                         │                   Clients                         │
                         │  Admin Console (Next.js)   Scanning PWA (React)    │
                         │  Consumer Pages (Next.js)  Dealer mode (PWA)       │
                         └───────────────┬──────────────────┬────────────────┘
                                         │ HTTPS / WSS       │ HTTPS (offline queue)
                                         ▼                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │                  Edge / API Gateway               │
                         │   TLS termination · per-tenant rate limit · authn │
                         └───────────────────────┬──────────────────────────┘
                                                 ▼
        ┌─────────────────────────────────────────────────────────────────────────────┐
        │                       NestJS Modular Monolith (API)                           │
        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
        │  │Identity│ │Fields/ │ │Master  │ │Workflow│ │Events/ │ │Labels  │ │Notify  │ │
        │  │ & RBAC │ │MetaModl│ │Data    │ │Builder │ │Trace   │ │Designer│ │Rules   │ │
        │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
        │  Cross-cutting: AuthZ guard · Tenant-context · Validation · Audit · Outbox     │
        └───┬───────────────┬────────────────┬───────────────┬──────────────┬───────────┘
            │ SQL (RLS)     │ start/signal   │ pub/sub        │ enqueue      │ object I/O
            ▼               ▼                ▼                ▼              ▼
     ┌────────────┐  ┌────────────┐   ┌──────────┐   ┌──────────────┐  ┌──────────┐
     │ PostgreSQL │  │  Temporal  │   │  Redis   │   │ Temporal Task│  │ S3 / blob│
     │ (RLS +     │  │  Service   │   │ (cache,  │   │ Queues       │  │ store    │
     │ partitions)│  │            │   │ pub/sub) │   └──────┬───────┘  └──────────┘
     └────────────┘  └─────┬──────┘                         │
                           │ schedules activities           │ polls
                           ▼                                 ▼
                 ┌───────────────────────────────────────────────────────┐
                 │                 Temporal Worker Pools                   │
                 │  ┌─────────────────┐   ┌───────────────────────────┐   │
                 │  │ Core workers     │   │ Sandboxed workers          │  │
                 │  │ (Validate, ID,   │   │ (Transform / Call-API —     │ │
                 │  │ RecordEvent,     │   │  no platform creds,         │ │
                 │  │ Notify, Label)   │   │  CPU/time-limited isolate)  │ │
                 │  └────────┬─────────┘   └───────────────────────────┘   │
                 └───────────┼───────────────────────────────────────────┘
                             │ gRPC/HTTP (render request)
                             ▼
                      ┌───────────────┐
                      │ Zint / Label  │  renders barcodes + composes
                      │ Render Service│  PDF / PNG / ZPL / Excel
                      └───────────────┘
```

**Deployable units (v1):** (1) `web` (Next.js), (2) `api` (NestJS monolith, also hosts the WebSocket gateway), (3) `worker` core pool, (4) `worker-sandbox` pool, (5) `label-render` (Zint) service. Managed dependencies: PostgreSQL, Redis, Temporal, object store. Five small services — not microservices, but the monolith's hot seams already split out (workers, sandbox, rendering) because they have different scaling and security profiles.

---

## 5. Application Architecture — Modular Monolith

A single NestJS application, internally divided into modules with **enforced boundaries** (a module may call another only through its published service interface, not its repositories). This gives microservice-style separation of concerns with monolith deployment simplicity, and the module seams become the future service-extraction lines.

**Domain modules**

| Module | Responsibility (PRD ref) |
|--------|--------------------------|
| `identity` | Tenants, three-tier admin + configurable tenant roles, RBAC/ABAC, dealer accounts (§4, §11) |
| `fields` (Meta-Model) | Field Library: Core/Super/Tenant Custom, type system, validation, promotion queue, versioning (§5.7) |
| `master-data` | Products (+GTIN immutability), Manufacturer/BrandOwner/ManufacturingUnit, pack hierarchy, identity schemes (§5) |
| `workflow` | Builder graph CRUD, draft/publish, dry-run, version grace; starts Temporal executions (§7) |
| `events` | Event capture, batch/unit/custom-hierarchy state, forward/backward trace, recall, FEFO (§6) |
| `labels` | Label Designer, binding to fields, scannability validation, output generation (§9) |
| `notifications` | Rule model, in-app/email/webhook dispatch (§10.2) |
| `dashboards` | Template dashboards, periodic refresh, drill-down lineage (§10.1) |

**Cross-cutting infrastructure (NestJS providers/guards/interceptors)**

- **AuthN/AuthZ guard** — validates token, resolves `{ tenantId, role, permissions }`, enforces tenant scope + role + per-stage scoping on every request.
- **Tenant-context interceptor** — opens a DB transaction and issues `SET LOCAL app.tenant_id = …` so RLS applies (Section 8).
- **Validation pipe** — every inbound payload checked against a JSON Schema compiled from the relevant FieldDefinitions (Section 9).
- **Audit interceptor** — writes a signed, hash-chained audit entry for every mutation (Section 10).
- **Transactional Outbox** — domain events (e.g., "workflow published", "recall opened") written in the same transaction as the state change, then relayed to Temporal/Redis, guaranteeing no lost or phantom side-effects.

The **Standards & Interop** concern (GS1 mode, Digital Link, EPCIS export) is an opt-in adapter module, dormant unless a tenant enables it — keeping the core free of GS1 coupling, per the PRD's "GS1-aware, not GS1-bound" stance.

---

## 6. The Workflow Engine — Temporal Graph Interpreter

This is the spine. The key idea: **tenant workflows are data, not code.** We do not deploy code per tenant. Instead, one generic Temporal Workflow type — call it `TraceabilityExecution` — **interprets** the tenant's saved graph (`WorkflowVersion` + nodes + edges).

### 6.1 Execution model

```
 Trigger (scan/upload/API)
        │
        ▼
 API: validate · dedupe · resolve published WorkflowVersion
        │  start workflow  (WorkflowId = idempotency key)
        ▼
 ┌───────────────────────────────────────────────────────────────┐
 │ TraceabilityExecution  (deterministic interpreter)            │
 │                                                               │
 │  1. Activity: loadGraph(workflowVersionId)  ── pinned version │
 │  2. walk nodes from Trigger:                                  │
 │       Validate / Transform / GenerateId / GenerateLabel /     │
 │       RecordEvent / Notify / Approve   → run as ACTIVITIES    │
 │       Branch / DynamicRouting / Loop / Parallel / Sub-flow    │
 │                                        → CONTROL FLOW in code  │
 │  3. after each step: progress signal → Redis → WebSocket      │
 └───────────────────────────────────────────────────────────────┘
```

**Why this split.** Temporal requires workflow code to be **deterministic** (it replays history to recover state). So:
- **All I/O happens in Activities** (DB reads/writes, ID minting, label rendering, notifications, external calls). Their results enter the workflow's event history and are deterministic on replay.
- **Graph interpretation is pure**: branch conditions and routing are evaluated in workflow code over data already returned by activities. No clocks, no randomness, no direct DB access in the interpreter.

`loadGraph` runs **once per execution** and pins the exact `WorkflowVersion`; this is what lets in-flight executions finish on their version while new ones use the freshly published version (PRD §6.5).

### 6.2 Node types → execution mechanism

| Node (PRD §7.1) | Mechanism |
|-----------------|-----------|
| Trigger | Execution start (input carries the trigger payload) |
| Validate | Activity: JSON-Schema/type check against bound fields |
| Transform | **Sandboxed** activity (see 6.5) |
| Generate ID | Activity: mint GTIN-13/14 (+mod-10), serial, or custom; idempotent |
| Generate Label | Activity → calls Zint/label service |
| Record Event | Activity: append Event row(s), update batch/unit state |
| Branch / Dynamic Routing | Pure control flow in interpreter |
| Notify | Activity → notifications module |
| Approve | **Durable wait**: workflow blocks on a Temporal Signal until a human approves/rejects (can wait days) |
| Loop / Parallel / Sub-workflow | Interpreter constructs (Parallel = child activities/child workflows); advanced mode (§7.2) |

### 6.3 Per-node failure handling (PRD §6.4)

Each node's configured retry count, backoff, and halt-vs-alert map directly onto a Temporal **Activity RetryPolicy**. On exhaustion: either the interpreter routes to the node's configured failure edge, or it runs a Notify activity and **pauses** the execution (halt-and-alert) with a first-class, structured error surfaced to the UI. No silent failures.

### 6.4 Idempotency & the 30-day grace (PRD §6.4–6.5)

- **Idempotency** — the trigger's idempotency key becomes the Temporal **WorkflowId**, with a reject-duplicates reuse policy. A double-scan or network retry resolves to the same WorkflowId and is deduped at the engine. DB writes additionally carry the key for defense-in-depth.
- **Version grace** — new executions always start on the latest *published* version. In-flight executions are pinned and finish naturally. A scheduled job marks versions older than 30 days (with no new starts) as **retired**, bounding live versions.

### 6.5 Sandboxing (PRD §11)

`Transform` and any `Call-API`-style node run on a **separate, hardened worker pool** (`worker-sandbox`): no platform DB credentials, no tenant cross-access, executed inside an isolate (e.g. `isolated-vm`) with CPU-time and memory ceilings and a strict outbound-network allowlist. Tenant logic therefore never runs arbitrary code against platform internals.

### 6.6 Dry-run, live preview & publish smoke test (PRD §7.4)

The same interpreter runs in a **`dryRun` mode** where activities are swapped for no-op/simulated implementations (no events persisted, no labels emitted), driving the live-preview screen-by-screen. On **publish**, a smoke test runs the new version against sample data through this dry-run path before any live events are admitted.

---

## 7. Event Ingest Path & The "Sync-Feeling" UI

```
Client → POST /events (trigger)            ──┐
  API: authZ · tenant ctx · validate         │  fast, transactional
       · idempotency check · write Outbox     │  (returns in ms)
  → start Temporal execution                  │
  ← 202 Accepted { executionId }            ──┘
Client subscribes: WSS /ws  topic=execution:{id}
  ◄── progress: nodeStarted / nodeCompleted / awaitingApproval / failed / done
```

The POST returns immediately (invariant #5). The UI then renders live progress from WebSocket events, so an inherently async pipeline *feels* synchronous without the fragility of blocking request threads on long workflows. Event-ingest availability target is 99.95% (PRD §12), so the ingest endpoint is deliberately thin and its only hard dependencies are Postgres (outbox) + Temporal start.

---

## 8. Multi-Tenant Data Architecture

**Model: shared database, shared schema, Row-Level Security.** Chosen over schema-per-tenant / database-per-tenant because invariant #8 demands one design across tenant sizes, and RLS gives strong isolation (invariant #6) without per-tenant migration sprawl.

### 8.1 Isolation via RLS

- Every tenant-scoped table carries `tenant_id uuid not null`.
- An `ENABLE ROW LEVEL SECURITY` policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)` for read/write.
- The app role is **not** a superuser and does **not** have `BYPASSRLS`. Each request runs inside a transaction that first executes `SET LOCAL app.tenant_id = '<uuid>'`. `SET LOCAL` is transaction-scoped, so it is safe with connection pooling (incl. PgBouncer transaction mode) — no context leaks between pooled checkouts.
- **Platform Super Admin** cross-tenant access uses a separate, explicitly-audited role/path (a policy branch that admits the platform role), never an ambient bypass.

### 8.2 Partitioning & scale seam (invariant #8, PRD §12)

- High-volume tables (`event`, and unit-level tables) use **declarative partitioning**: by `tenant_id` (hash/list) and by time (range) for the event stream.
- `tenant_id` is the natural **shard key**. v1 runs single-node Postgres; the scale path is range/hash distribution (e.g. Citus) along the same key with no model change — satisfying "design once, scale later."
- Recall fan-out (10M units < 60s, PRD §12) is served by partition-pruned, indexed reads over the impacted batch range, with the heavy fan-out notification work handed to Temporal/queue workers rather than the request path.

### 8.3 Read/write split & analytics

OLTP stays in Postgres. Dashboard/analytics load (periodic ~5-min refresh, PRD §10.1) is kept off the OLTP hot path; when volume warrants, an OLAP store (ClickHouse) is fed from the event stream. p95 reads < 200ms (PRD §12) are met via partition pruning + targeted indexes + Redis caching of hot config/lookup data.

---

## 9. The Meta-Model & Field Library

The platform is configurable because entities are **fixed core columns + a typed, validated attribute bag**.

- **`FieldDefinition`** rows describe each field: `tier` (Core/Super/Tenant-Custom), `entity` binding, `type` (text, number, decimal, boolean, date, datetime, single/multi-select, file/image, GTIN, batch-ref, unit-ref, geo, signature, rich-text — PRD §5.3), `validation` (JSON), `version`, `status`, ownership scope.
- **Entity instances** (Product, Batch, Unit, Event, …) store their core columns plus a **JSONB `attributes`** column holding Super/Tenant-Custom values keyed by FieldDefinition UUID. Hot attributes (batch number, expiry) get **expression / GIN indexes**.
- **Validation pipeline**: for a given entity + tenant, the active FieldDefinitions compile to a **JSON Schema** (cached, invalidated on field version change). Inbound payloads are validated with Ajv at the API boundary and again at the workflow `Validate` node. The **same field-type definitions are a shared TypeScript package** used by the Next.js builder/designer, so the client blocks mismatched bindings before the server ever sees them (invariant #3).
- **Derived fields** (PRD §5.3): tenant formulas evaluated in a **safe expression evaluator** (no arbitrary code), computed and stored.
- **Tiering & deactivation** (PRD §5.7.4): Core can't be deactivated; Super only by Super Admin (global or per-tenant via `TenantFieldBinding`); Tenant-Custom by Tenant Admin. Referential-integrity check blocks deactivating a field referenced by a live workflow/label/rule absent explicit override. Historic reads always resolve values against the **field version** captured at write time (PRD §5.7.6), which is why events store the FieldDefinition version alongside the value.

---

## 10. Configuration Store, Versioning & Audit

- **Versioned, append-only config** (invariant #2): `WorkflowVersion`, `FieldDefinition` versions, `LabelTemplate` versions, `NotificationRule` are immutable once written; a new version is a new row. Editing produces a new version; old rows are never mutated.
- **Optimistic locking**: a `row_version`/`updated_at` guard rejects concurrent overwrites (PRD §7.4) so two admins can't silently clobber each other.
- **Immutable, signed audit log** (PRD §11): every config/data mutation appends an `AuditEntry { actor, tenant, action, before/after, ts, prev_hash, hash, signature }`. Each entry's `hash` chains the previous entry's hash → a **tamper-evident hash chain**; entries are signed. Covers Super Field changes, promotion approvals, FEFO overrides, GTIN locks, and dealer scans.

---

## 11. Real-Time Layer (WebSockets)

- A **NestJS WebSocket gateway** (Socket.IO) co-located in the `api` deployment, backed by the **Redis adapter** so sockets fan out across horizontally-scaled API instances.
- Workflow activities publish progress to a Redis channel `tenant:{id}:exec:{id}`; the gateway relays to subscribed, tenant-scoped clients. Subscriptions are authorized against the same tenant/role guard as HTTP.
- Used by: live workflow progress, recall-state flips, dashboard nudges, dealer-scan notifications back to the tenant.

---

## 12. Label Rendering & the Zint Service

Zint is a C library, so it runs as its own containerized **`label-render` service** rather than being linked into the Node process. It exposes a structured API (gRPC/HTTP): given symbology + structured data + dimensions, it returns the barcode (SVG/PNG) and supports the full symbology set (EAN-13, GTIN-14, GS1-128, GS1 DataMatrix, GS1 QR/Digital Link, Code 128, QR, DataMatrix, ITF-14 — PRD §9).

- **Composition**: the service (or the `labels` module) composes the WYSIWYG layout + barcode into final **PDF / PNG / ZPL / Excel** outputs, written to object storage.
- **Scannability validation at save time** (PRD §9): minimum module size, quiet zones, and data-capacity for the chosen symbology + label dimensions are checked; non-scannable designs are **blocked**.
- Field bindings on a label resolve by FieldDefinition UUID, so labels inherit canonical/versioned field definitions automatically.

---

## 13. Scanning PWA & Offline Sync

- **Mobile PWA** (installable, one codebase for iOS/Android/browser — PRD §8). Camera-based scanner decodes every symbology the Label Designer can emit.
- **Workflow-aware**: a scan posts to the ingest API, which resolves the tenant's configured workflow and triggers the right event (Dispatch/Receive/Pack/Return/…).
- **Offline mode**: scans queue in **IndexedDB**, each stamped with a **client-generated idempotency key (UUID)**. On reconnect the queue replays to the ingest API; the server dedupes on that key (Section 6.4), so double-sync and double-scan converge to one event. Server state is authoritative for conflicts.
- **Dealer mode**: a lightweight scoped surface; dealers authenticate (email invite → password, PRD §8.3 / Q9 default), see only shipments addressed to them, and scan Receive/Return. Every scan is logged against a known identity for accountability.

---

## 14. Object Storage Layout

S3-compatible buckets, **per-tenant key prefixing**, access via short-lived signed URLs (no public buckets):

```
s3://<bucket>/<tenant_id>/products/<product_id>/images/...
s3://<bucket>/<tenant_id>/labels/<template_id>/<version>/output.{pdf,png,zpl,xlsx}
s3://<bucket>/<tenant_id>/exports/audit/<date>/...
```

Encryption at rest (AES-256) and signed-URL TTLs per the security baseline. Local dev uses MinIO (S3-compatible) so the same code path runs everywhere.

---

## 15. Security Architecture (Pointers)

Full detail belongs to `docs/security.md`. This architecture commits the *structural* hooks now (PRD §11):

- **AuthN**: OAuth 2.0 / OIDC; Google + Microsoft SSO and email/password; MFA mandatory for all admin tiers.
- **AuthZ**: RBAC + ABAC guard on every request; tenant scope + role + per-workflow-stage checks.
- **Isolation**: Postgres RLS (Section 8) — the structural backbone of tenant isolation.
- **Audit**: signed hash-chained log (Section 10).
- **Encryption**: AES-256 at rest, TLS 1.3 in transit; optional field-level encryption for flagged fields.
- **Secrets**: managed KMS/vault; nothing in code or committed config (the `.gitignore` already excludes `.env`/keys).
- **API security**: per-tenant rate limiting at the edge; scoped API keys; signed webhooks.
- **Workflow sandboxing**: Section 6.5.
- **CI security**: dependency + container scanning each build; **VAPT is a release blocker** (decisions.md 2026-05-30).
- **Privacy**: DPDP Act / GDPR-style rights where consumer data is involved.

---

## 16. Scalability Model

Mapped to the PRD §12 tiers — one architecture, three operating points:

| Tier | Profile | How the architecture serves it |
|------|---------|--------------------------------|
| **Low** (1–100 GTIN, ≤10k ev/day) | Small tenant | Single-node Postgres + Redis + one worker pool. Snappy. |
| **Mid** (1k–100k GTIN, ≤1M ev/day) | Standard | Multi-AZ managed Postgres (read replicas for dashboards), scaled API + worker replicas, partitioned event tables. |
| **High** (1M+ GTIN, 10M+ ev/day) | Large | Distributed Postgres (Citus) sharded by `tenant_id`; dedicated worker pools; OLAP offload (ClickHouse) for dashboards; recall fan-out parallelized across workers. |

Scaling levers that need **no redesign**: add API/worker replicas (stateless); add Postgres read replicas; promote partitioning to distribution along the existing `tenant_id` seam; offload analytics. NFR targets: 99.9% config/master-data, 99.95% event ingest, p95 reads < 200ms, recall fan-out < 60s.

---

## 17. Deployment Topology (Cloud-Agnostic)

Cloud is undecided, so the topology is described in portable terms (containers + managed backing services). The infrastructure session maps these to a provider.

```
[ CDN ] → [ web (Next.js) ]
[ API GW / LB ] → [ api (NestJS + WS) xN ]
                    ├── [ worker (core) xN ]
                    ├── [ worker-sandbox xN ]      (isolated, no creds)
                    └── [ label-render (Zint) xN ]
Managed: PostgreSQL · Redis · Temporal (self-host or Temporal Cloud) · Object store
```

- **Containers** orchestrated by Kubernetes or a managed equivalent; each deployable scales independently.
- **Stateless** api/workers → horizontal scaling is trivial; all state is in Postgres/Redis/Temporal/object store.
- **Local dev** mirrors prod via `docker-compose`: Postgres + Redis + Temporal + MinIO + Zint, so behavior is identical from laptop to cloud. (Local data volumes are already git-ignored.)
- **Region**: single India region in v1 (DPDP); the `tenant_id` shard seam is also the future multi-region partition seam.

---

## 18. Repository / Monorepo Structure

**[PROPOSED DECISION] pnpm workspaces + Turborepo monorepo**, so the shared field-type system / validators / generated API types live in one place and are consumed by both Next.js and NestJS — the practical mechanism behind invariant #3.

```
NTP_Proj/
├── apps/
│   ├── web/            # Next.js admin console + consumer pages
│   ├── scanning-pwa/   # mobile PWA (React)
│   ├── api/            # NestJS modular monolith (+ WebSocket gateway)
│   ├── worker/         # Temporal core worker pool
│   └── worker-sandbox/ # Temporal sandboxed worker pool
├── services/
│   └── label-render/   # Zint-based barcode + label composition service
├── packages/
│   ├── field-types/    # shared type system + JSON-Schema/Zod validators (client+server)
│   ├── api-contract/   # shared DTOs / OpenAPI-generated types
│   ├── ui/             # shadcn/ui component library, design tokens
│   └── config/         # shared tsconfig, eslint, etc.
├── infra/
│   └── docker-compose.yml   # Postgres · Redis · Temporal · MinIO · Zint
└── docs/               # PRD, decisions, architecture, data-model, security …
```

---

## 19. Cross-Cutting Concerns

- **Idempotency** — platform-wide: client-supplied keys on all writes; Temporal WorkflowId dedup; DB unique constraints as the last line.
- **Transactional Outbox** — state change + intent-to-emit committed atomically; a relay publishes to Temporal/Redis, eliminating lost or phantom side-effects.
- **Error handling** — structured, typed errors end-to-end; per-node failure policy (Section 6.3); no silent catches.
- **Observability** — structured logs, OpenTelemetry traces across api→Temporal→workers, metrics; alerting on **ingest lag** and **label-print failures** (PRD §12).
- **Internationalization** — UTF-8 throughout; multi-language master data; locale-aware rendering.
- **Time** — all timestamps UTC in storage; localized at the edge.

---

## 20. Proposed Decisions & Open Questions

### 20.1 Proposed decisions (to log in `decisions.md` on approval)

1. **Modular monolith (NestJS)** for v1, with enforced module boundaries and pre-split worker/sandbox/label seams. *(confirmed this session)*
2. **Next.js (App Router)** as the web framework; React Flow for the builder canvas. *(confirmed this session)*
3. **Workflow engine = Temporal generic graph interpreter** (workflows are data; nodes are activities; control flow is pure). Idempotency via WorkflowId; version pinned per execution.
4. **Multitenancy = shared-schema + Postgres RLS**, `tenant_id` as the shard seam; declarative partitioning for high-volume tables.
5. **Meta-model = core columns + JSONB attribute bag**, validated by a JSON Schema compiled from FieldDefinitions, with a shared client/server type package.
6. **Audit = signed hash-chained append-only log.**
7. **pnpm + Turborepo monorepo** with shared `field-types` / `api-contract` packages.
8. **Zint runs as a separate `label-render` service**, not linked into Node.

### 20.2 Open questions (defer to their sessions)

- **Cloud provider** + managed-service mapping (and Temporal Cloud vs self-hosted) → infrastructure session.
- **Detailed auth flows, encryption, secret management, threat model** → `docs/security.md`.
- **Concrete schema/DDL, ER diagrams, partition keys per table** → `docs/data-model.md` (recommended next doc).
- **Sandboxed-runtime choice** (`isolated-vm` vs a WASM-based isolate) → spike during workflow-engine build.
- **API style** (REST + OpenAPI vs tRPC vs GraphQL) for the internal client↔API contract — leaning REST + OpenAPI for the public/integration surface; to confirm.
- Stakeholder **Q9–Q18** (PRD §18.2) still carry only default assumptions.

---

## Document History

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-05-31 | Initial architecture draft: topology, Temporal interpreter, multi-tenant RLS, meta-model, supporting services. |
