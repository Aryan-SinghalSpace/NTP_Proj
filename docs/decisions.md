# Decisions Log

> Append-only. Latest decisions at the top. Each entry: date, decision, rationale, who decided.

---

## 2026-05-31 — Core tech stack: TypeScript/NestJS, Temporal, Postgres + Redis + S3

**Decision**: The platform's foundational stack is set as follows.

- **Backend language & framework**: **TypeScript on NestJS.**
- **Workflow engine (the spine)**: **Temporal**, hosting a generic *graph interpreter*. Tenant workflows remain data (`WorkflowVersion`/`WorkflowNode` graphs); a single interpreter walks the graph, executing each node as a Temporal activity. Temporal provides durable execution, per-node retry/backoff, idempotency, and long-running version coexistence natively (maps to PRD §6.4–6.5).
- **Primary datastore**: **PostgreSQL** as system of record — native Row-Level Security (tenant-isolation invariant #6), JSONB for the meta-model / Field Library, table partitioning by tenant + identifier as the scale path. **Redis** for cache, websocket pub/sub, rate limiting, and offline-sync coordination. **S3-compatible object storage** for images and generated label artifacts (PDF/PNG/ZPL/Excel).
- **Cloud platform**: **deferred** to the dedicated infrastructure session (software stack chosen now, deployment target later). Constraint carried forward: must offer India region(s) for DPDP data residency.

**Rationale**:
- End-to-end TypeScript lets the field-type system, JSON Schema/Zod validators, and node-binding rules be authored once and enforced on both client and server — the decisive win for the strict-typed no-code workflow builder (invariant #3), and best velocity for a small team building a POC.
- Temporal de-risks the hardest, most differentiated component by providing durable-execution guarantees off the shelf rather than hand-building them on a bare queue.
- Postgres is effectively mandated by the RLS and immutable-audit invariants; Redis and object storage are standard supporting infrastructure.

**Trade-offs noted**: Go would give higher raw event-ingest throughput; the architecture keeps the option of later peeling the hot ingest path into a separate service without a product rewrite. Temporal adds an operational component (server + its datastore) versus a lighter BullMQ/Redis interpreter; accepted in exchange for built-in durability.

**Still open (not decided here)**: cloud platform (above); **frontend framework** (React is fixed by the shadcn/ui decision, but Next.js vs. Vite-React + React Flow is unconfirmed — recommendation: Next.js App Router + React Flow/@xyflow for the builder canvas); analytics store (ClickHouse) deferred until dashboards require it.

**Decided by**: Platform Super Admin.

---

## 2026-05-30 — Scanning App is a first-class v1 deliverable

**Decision**: A scanning surface is in scope for v1, built as a mobile PWA. It handles Commission, Pack, Aggregate, Disaggregate, Store, Dispatch, Receive, Dispense, Return/Reject, QC, and Recall scans.

**Rationale**: Multi-dealer receive flows require dealers to scan via our system; without it, forward traceability ends at the warehouse door.

**Decided by**: Platform Super Admin.

---

## 2026-05-30 — FEFO is advisory, not enforcement

**Decision**: First-Expiry-First-Out is implemented as an advisory prompt with operator override (logged with reason). Not a hard block.

**Rationale**: Operators may have legitimate reasons to dispatch a newer batch. Hard enforcement creates more workarounds than it prevents.

**Decided by**: Platform Super Admin.

---

## 2026-05-30 — GTIN data is immutable once committed

**Decision**: Once a GTIN is used in any event or printed on any label, the following are locked: GTIN, Brand, Product Name, Net Content, Pack Type, Country of Origin. Always editable: Images, marketing copy, regulatory IDs, MRP (with audit trail).

**Rationale**: Aligns with GS1 GTIN Allocation Rules; prevents silent product redefinition that would corrupt traceability history.

**Decided by**: Platform Super Admin.

---

## 2026-05-30 — Two company names supported on product master

**Decision**: Product master carries both `manufacturer_id` and `brand_owner_id` (separate entities, can be the same). Label designer supports rendering both. Validation that at least one appears on the label is tenant-configurable, default = warn-don't-block.

**Rationale**: Indian Legal Metrology and FSSAI rules for contract-manufactured goods.

**Decided by**: Stakeholder feedback on PRD v0.2.

---

## 2026-05-30 — Multi-plant + multi-dealer is v1 scope

**Decision**: Manufacturing Unit, Manufacturer, Brand Owner, Dealer, Shipment, ShipmentLeg are all first-class entities in v1.

**Rationale**: Real-world supply chains demand it; retrofitting later would touch every event type and the entire data model.

**Decided by**: Stakeholder feedback on PRD v0.2.

---

## 2026-05-30 — VAPT is a release blocker

**Decision**: Third-party Vulnerability Assessment and Penetration Testing must complete successfully before any major version goes to production. Annual recurrence required.

**Rationale**: Stakeholder requirement; aligns with SOC 2 trajectory.

**Decided by**: Stakeholder feedback on PRD v0.2.

---

## 2026-05-24 — Three-tier Field Library Model

**Decision**: Fields live in three tiers: Core (locked), Super (Super Admin owned, shared), Tenant Custom (Tenant Admin owned). Super Fields can only be deactivated by Super Admin. Tenant Custom Fields can be promoted via approval queue.

**Rationale**: Balances standardization with tenant flexibility; avoids Super Admin becoming a bottleneck while preserving canonical reporting.

**Decided by**: Platform Super Admin.

---

## 2026-05-16 — Identity model: UUID internal, GTIN as primary scheme

**Decision**: Every entity has a UUID primary key internally. GTIN, batch number, serial are validated attributes.

**Rationale**: Decouples display identity from storage; allows sharding, drafts, identity pluggability; supports non-GS1 customers.

**Decided by**: Platform Super Admin.

---

## 2026-05-16 — Asynchronous workflow engine with sync UI

**Decision**: Events queue; workflow runs in background; UI uses websockets to show real-time progress.

**Rationale**: Synchronous workflow execution doesn't scale and creates ugly failure modes; async with sync-feeling UI is the right architecture.

**Decided by**: Platform Super Admin.

---

## 2026-05-16 — Workflow versioning: 30-day grace period

**Decision**: On publish, new events use new workflow version; in-flight events finish on their version; after 30 days, the old version retires.

**Rationale**: Prevents infinite live versions while not breaking long-running batches.

**Decided by**: Platform Super Admin.

---

## 2026-05-16 — Zint as the barcode rendering library

**Decision**: Use the Zint library for all barcode generation across the Label Designer and Scanning App.

**Rationale**: Open-source, strong GS1 support, structured input model, all required symbologies covered.

**Decided by**: Platform Super Admin.

---

## 2026-05-16 — shadcn/ui on Tailwind

**Decision**: UI built on shadcn/ui components with Tailwind CSS.

**Rationale**: Accessible, themeable, modern; component ownership stays in the project; no opaque framework dependency.

**Decided by**: Platform Super Admin.

---

## Pending decisions

These are listed but not yet decided. See `docs/PRD.md` §18 for context.

- Cloud platform & data residency
- Frontend framework (React is fixed; Next.js vs. Vite-React + React Flow unconfirmed)
- Analytics store (ClickHouse) — deferred until dashboards require it
- Initial seed Super Fields per entity
- Billing model
- Q9–Q18 from PRD §18.2

_Resolved 2026-05-31: backend language & framework (TS/NestJS), workflow engine (Temporal), datastore & queue (Postgres + Redis + S3)._
