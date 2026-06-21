# Product Requirements Document
## Configurable Dynamic Traceability Platform

> **A no-code, multi-tenant traceability system. GS1-aware, not GS1-bound.**

| | |
|---|---|
| **Version** | v0.5 (GS1/DataKart analysis enrichments) |
| **Status** | Draft, integrating stakeholder feedback from v0.2 + reference-analysis enrichments |
| **Owner** | Platform Super Admin / Product |
| **Audience** | Engineering (Claude Code sessions), Design, QA, Security, Stakeholders |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [Core Platform Concepts](#3-core-platform-concepts)
4. [Roles and Personas](#4-roles-and-personas)
5. [Part A — Identity & Master Data](#5-part-a--identity--master-data)
6. [Part B — Traceability Engine](#6-part-b--traceability-engine)
7. [The No-Code Workflow Builder](#7-the-no-code-workflow-builder)
8. [Scanning App](#8-scanning-app)
9. [Label Designer](#9-label-designer)
10. [Dashboards, Reports and Notifications](#10-dashboards-reports-and-notifications)
11. [Security Baseline](#11-security-baseline)
12. [Scalability and Non-Functional Requirements](#12-scalability-and-non-functional-requirements)
13. [UI / UX](#13-ui--ux)
14. [High-Level Data Model](#14-high-level-data-model)
15. [Delivery Phasing](#15-delivery-phasing)
16. [GS1 Digital Link Resolver — Decision](#16-gs1-digital-link-resolver--decision)
17. [Project Documentation Deliverables](#17-project-documentation-deliverables)
18. [Open Items and Pending Decisions](#18-open-items-and-pending-decisions)

---

## 1. Executive Summary

This document specifies a **Configurable Dynamic Traceability Platform**: a multi-tenant, no-code system that lets an administrator assemble a complete traceability solution for any customer without writing code. The platform is the product; each customer receives a configured instance of it.

The system was inspired by GS1 standards and GS1 India DataKart, and GS1 / GTIN support is a first-class, built-in identity scheme because most customers will arrive holding a GS1 Company Prefix. However, the platform is not bound to GS1: identity is pluggable, and customers without GTINs can use system-generated UUIDs or custom identifiers.

Every meaningful entity in the system — tenant, product, field, label template, workflow, workflow node, event, batch, unit — carries a globally unique internal UUID. Configuration is versioned, validated, audited, and immutable in history, which is the foundation for the correctness guarantee: **no drift, no wrong flow served, no hallucinated data**.

Fields are managed through a three-tier library model: Core Fields (locked, system-required), Super Fields (canonical library curated by Super Admin and shared across all tenants), and Tenant Custom Fields (tenant-specific). This delivers both standardization and flexibility.

The product is delivered in two conceptual parts that share one platform: **Part A — Identity & Master Data** (UUID-internal, GTIN as primary scheme) and **Part B — Traceability Engine & no-code Workflow Builder**. A third concern, **Standards & Interop Adapters** (GS1 mode, EPCIS-style export), is opt-in per tenant.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Deliver a fully configurable traceability platform where products, fields, labels, events, and workflows are admin-configurable, not hard-coded.
- Provide a robust, secure, optimized no-code workflow builder as the operational spine of the system.
- Support batch-level, unit-level, and arbitrary custom packaging hierarchies, configurable per product line.
- Make GTIN/GS1 a built-in primary identity scheme while keeping identity pluggable (UUID, custom).
- Standardize fields across tenants through a curated Super Fields library while allowing tenant-specific customization.
- Guarantee correctness: schema-validated configuration, typed connections, versioning, immutable audit, dry-run simulation, live preview.
- Scale linearly from a single small tenant to high-volume multi-tenant load with no architectural rewrite.
- Support both forward and backward traceability, including raw-material-to-finished-good transformation lineage.
- Support multi-manufacturing-unit operations (one tenant, multiple plants) and multi-dealer dispatch/receive flows.

### 2.2 Non-Goals (v1)

- Issuing GS1 Company Prefixes — the platform consumes prefixes customers already own.
- Billing and metering modules — usage metrics captured for later, but no billing built in v1.
- Deep third-party integrations (ERP/WMS) — deferred; POC delivered first, integrations follow.
- Multi-region deployment — single-region (India) in v1; multi-region in a later phase.
- SMS / Slack / Teams / WhatsApp notification channels — v2. (Email IS in v1.)
- Auto-discovery of field-promotion candidates — v2.

---

## 3. Core Platform Concepts

### 3.1 Everything is a UUID-keyed configurable entity

Internally, every entity has a UUID primary key. Human-facing identifiers (GTIN, batch number, serial, custom code) are strongly-validated attributes on top of the UUID. This decouples display identity from storage identity and is what makes sharding, draft entities, and identity pluggability possible at scale.

**GTIN immutability rule**: Once a GTIN has been committed (used in any event or printed on any label), the following fields are **locked**:
- GTIN itself
- Brand
- Product Name
- Net Content
- Pack Type
- Country of Origin

The following remain **editable** (with audit trail):
- Images
- Marketing copy
- Regulatory IDs that change over time (FSSAI renewal, etc.)
- MRP

If a locked attribute must change, a new GTIN must be allocated for the new product variant. This follows GS1 GTIN Allocation Rules.

### 3.2 The Meta-Model / Schema Registry

A central registry defines what entity types exist and how they may be extended. The platform ships base definitions (Product, Batch, Unit, Event, Label, Workflow) and lets tenants extend them with custom, strongly-typed fields drawn from the Field Library. Every definition is versioned and validated against a JSON Schema before it can be saved; invalid configuration is rejected at save time.

### 3.3 The Configuration Store

All configuration (fields, label templates, workflows, roles, notification rules) is stored versioned and append-only. History is immutable. Optimistic locking prevents two admins from silently overwriting each other. This store is the single source of truth that prevents drift and wrong-flow-served scenarios.

### 3.4 The Workflow Engine (the spine)

An asynchronous engine executes each tenant's configured workflow. Events enter a queue; the engine runs the workflow graph in the background; the UI reflects real-time progress over websockets, giving a synchronous feel without synchronous fragility. The engine is designed to be robust, optimized, secure, and horizontally scalable.

### 3.5 Two-part product, one platform

| Part | Scope |
|------|-------|
| **A. Identity & Master Data** | Tenant onboarding, identity scheme (GTIN primary / UUID / custom), product master data with default field groups plus Field Library, Manufacturer/Brand Owner/Manufacturing Unit entities, pack hierarchy. |
| **B. Traceability Engine & Builder** | No-code workflow builder, event capture, batch/unit/custom-hierarchy traceability, label designer, scanning app, dashboards, notifications, forward & backward trace, recall, FEFO. |
| **C. Standards & Interop (opt-in)** | GS1 conformance mode, GS1 Digital Link resolver, EPCIS-style event export. Enabled per tenant only when required. |

---

## 4. Roles and Personas

### 4.1 Three-tier administration

| Role | Scope and capabilities |
|------|------------------------|
| **Platform Super Admin** | Single role, held by the platform owner. Full god-mode across all tenants: onboard/delete tenants, reset passwords, configure builders, manage billing data (when introduced), all configuration and data. Owns the Super Fields library: creates, edits, deactivates, promotes Super Fields, and reviews promotion requests. |
| **Platform Admin** | Platform support team, tenant-scoped. View tenant configuration and data, assist with and action workflow approvals, support tenants. Cannot delete tenants, change billing, or modify the Super Fields library. |
| **Tenant Admin** | Customer's own administrator. Full control of their own tenant only: invite users, define tenant user roles, build/clone workflows, manage products, labels, dashboards. Can create Tenant Custom Fields and submit Super Field promotion requests. Sees only their tenant's data. |
| **Tenant User (configurable)** | Roles the Tenant Admin defines, with granular per-action permissions (add / edit / export) and per-workflow-stage scoping (e.g., Batch Operator, Label Operator, Dispatch Operator, QA). |

### 4.2 Other personas

- **Consumer** — scans pack barcode/QR; sees a customer-centric detail page with product info, expiry, origin, authenticity, and (when relevant) recall status.
- **Dealer / External Receiver** — external organisation (distributor, wholesaler) that receives goods shipped by a tenant. Default model is external organisation; can alternatively be modelled as a downstream tenant. Has lightweight scoped access (typically through the scanning app) to scan receive/return events against shipments addressed to them.
- **Auditor / Regulator** — read-only access to recall, expiry, and event records as required.

---

## 5. Part A — Identity & Master Data

### 5.1 Identity schemes

- **GTIN (primary, built-in)**: tenant supplies GS1 Company Prefix; system mints GTIN-13/GTIN-14, computes and validates the Modulo-10 check digit, and enforces GTIN allocation/reuse rules. Once committed, GTIN data is immutable (see §3.1).
- **UUID (fallback)**: tenants without a GS1 prefix use a system-generated UUID as the visible product identifier.
- **Custom**: tenant-defined identifier format with a validation pattern.

In all cases the internal primary key is a UUID; the chosen scheme is a validated attribute.

### 5.2 Product master data — default field groups

- **Primary Information** (brand, name, description, category, language variants).
- **Weights & Dimensions** (net/gross weight, dimensions, units of measure).
- **Other Attributes** (open, extensible group).
- **Images** (front, back, ingredients/spec panel, regulatory panel).

These groups are populated from the Field Library (§5.7). Tenants pick which Super Fields apply and may add their own Tenant Custom Fields.

### 5.3 Custom field type system

Supported field types: text, number, decimal, boolean, date, datetime, single-select, multi-select, file/image, GTIN, batch-ref, unit-ref, geo-location, signature, rich-text.

- Tenant-defined validation rules per field: required, regex, min/max, length, required-if-other-field-set.
- Calculated / derived fields: tenant defines a formula (e.g., Net Weight = Gross Weight − Tare Weight); value is computed and stored.
- Strict typing: the workflow builder and label designer refuse to connect or bind mismatched types.

### 5.4 Field lifecycle

- Fields are **deactivated, not deleted**.
- Deactivated fields disappear from new forms and labels.
- Historical records still hold the values; shown greyed-out and read-only behind an explicit **"View Historic Records"** toggle, so traceability history stays intact.
- A field referenced by a live workflow or label cannot be deactivated without explicit admin override (referential integrity).
- Deactivation rules differ by field tier — see §5.7.4.

### 5.5 Pack hierarchy

Configurable depth: each → inner → case → pallet, or any tenant-defined number of levels. Each level may carry its own identifier (GTIN, SSCC, or custom) and participates in aggregation/disaggregation events.

### 5.6 Manufacturer, Brand Owner, and Manufacturing Units

Under Indian Legal Metrology and FSSAI rules (and similar regulations in other markets), contract-manufactured goods often must display the marketer's/brand-owner's name when the manufacturer is not visible on the pack. The data model supports this directly.

**Manufacturer** (entity)
- Legal company name, registered address.
- Manufacturing licence numbers (FSSAI, drug licence, BIS, etc.) with expiry dates and renewal warnings.
- Optional GLN for GS1 mode.
- Active/inactive status.
- One Manufacturer can have many Manufacturing Units.

**Manufacturing Unit** (entity — a specific plant location)
- Name, address (geocoded).
- Belongs to a Manufacturer.
- Plant-specific licence numbers and expiry dates.
- Optional GLN.
- Plant code (tenant-defined short code; can be incorporated into batch numbers).
- Active/inactive status.

**Brand Owner / Marketer** (entity — same structure as Manufacturer, used when different from Manufacturer)

**Product master data** references these entities:
- `manufacturer_id` (FK to Manufacturer)
- `brand_owner_id` (FK to Brand Owner / Marketer)
- These can be the same entity when the brand owner manufactures in-house.

**Batch master data** references:
- `manufacturing_unit_id` (FK to Manufacturing Unit) — every batch knows where it was made.

**Library scoping (v1)**: Manufacturers, Brand Owners and Manufacturing Units are per-tenant. A future version may promote a shared platform-level library so contract manufacturers serving many brands can be modelled once.

**Label validation**: the system can validate that at least one of (Manufacturer Name, Brand Owner Name) appears on the label. Default behaviour: **warn but do not block** (different categories have different legal requirements). Tenant-configurable per label template.

### 5.7 Field Library Model (three tiers)

#### 5.7.1 The three tiers

| Tier | Managed by | Purpose | Examples |
|------|-----------|---------|----------|
| **Core Fields** | Platform (locked) | System-required. Always present, cannot be removed or deactivated. | UUID, Tenant ID, Created At, Updated At, GTIN (when GTIN scheme is selected) |
| **Super Fields** | Super Admin | Canonical, shared library of standard fields available to every tenant. | Batch Number, Manufacturing Date, Expiry Date, MRP, Net Weight, Country of Origin |
| **Tenant Custom Fields** | Tenant Admin | Tenant-specific fields visible only inside that tenant. | "Distributor Code", "Regional Sub-brand", "Internal SKU Notes" |

#### 5.7.2 What a tenant sees on a screen

On any configurable screen (Batch, Label, Product, Unit, Event, etc.), the tenant sees:
- All **Core Fields** for that entity — always on, cannot be removed.
- All **Super Fields** for that entity — tenant toggles them on/off.
- Their own **Tenant Custom Fields** — added, edited, or deactivated by tenant admin.

Every field carries an internal UUID, a tier marker, a type, validation rules, and a version.

#### 5.7.3 Super Fields library — Super Admin responsibilities

- Create new Super Fields with full type, validation, default value, and help-text definitions.
- Edit existing Super Fields (changes are versioned).
- Group Super Fields by entity for discoverability.
- Review and approve / reject promotion requests from tenants.
- Use the per-tenant deactivation screen to disable specific Super Fields for a specific tenant.

#### 5.7.4 Field deactivation rules

- **Core Fields** cannot be deactivated by anyone.
- **Super Fields** cannot be deactivated by Tenant Admins. They may toggle a Super Field off in their own screens, but the field definition remains.
- **Per-tenant deactivation** of Super Fields is performed by Super Admin only, through a dedicated Field Deactivation screen.
- **Global retirement** of a Super Field is also a Super Admin action and requires confirmation.
- **Tenant Custom Fields** can be deactivated by the Tenant Admin.
- Historical records always keep the field and its values; deactivation hides the field from new forms but never destroys data.
- Referential integrity: a field referenced by a live workflow, label, or notification rule cannot be deactivated without an explicit Super Admin override.

#### 5.7.5 Promotion workflow (Tenant Custom → Super Field)

In v1, promotion uses the open-request model:
1. Tenant Admin opens a Field Promotion Request from the field configuration screen.
2. Request includes proposed name, type, validation rules, entity grouping, business rationale.
3. Super Admin sees the request in a Field Requests queue (status: Pending / Approved / Rejected / Needs Changes).
4. On approval, Super Admin sets the canonical definition; the field becomes a Super Field; existing data migrates onto the new Super Field.
5. All actions recorded in the audit log.

In v2: auto-discovery of promotion candidates ("N tenants have created a similar custom field — consider promoting").

#### 5.7.6 Field versioning

- Every field definition carries a version.
- Edits to a Super Field produce a new field version. Historical records remain bound to their captured version.
- Breaking changes blocked unless Super Admin explicitly migrates or marks the old version as deprecated for new use.

---

## 6. Part B — Traceability Engine

### 6.1 Traceability levels (configurable per product line)

- **None** — identity only, no batch/unit tracking.
- **Batch-level** — track by batch/lot (GS1 AI (10)-style, up to 20 alphanumeric chars).
- **Unit-level** — each unit uniquely tracked via Batch + Serial or GTIN + Serial (GS1 AI (21)-style).
- **Custom hierarchy** — arbitrary multi-level packaging traceability with configurable depth.

### 6.2 Event types (v1)

| Event | Meaning |
|-------|---------|
| **Commission** | A unit/batch identifier is created and becomes live. |
| **Decommission** | A unit/batch is destroyed, expired, or otherwise removed. |
| **Aggregate** | Child IDs packed into a parent (units → case → pallet). |
| **Disaggregate** | A parent is broken into its children. |
| **Transform** | Input lots consumed to produce output lots (raw material → finished good). Key enabler of backward traceability. |
| **Quality Check / Hold** | Batch placed on QC hold, then released or rejected. |
| **Sample** | Units pulled for testing; diverted, not lost. |
| **Pack** | Goods packed at a level of the hierarchy. |
| **Store** | Goods moved into storage at a location. |
| **Dispatch** | Goods dispatched from a location. |
| **Receive** | Goods received at a location. |
| **Dispense / Issue** | Goods issued/dispensed downstream. |
| **Reject / Return** | Received goods rejected or returned. |
| **Recall** | Entity flagged for recall; consumer-facing pages flip to recall state. |

Deferred to v2: Relabel/Repack and Sold (point-of-sale capture).

Event payloads are composed of fields drawn from the Field Library: Core fields (event id, timestamp, actor) are always present, Super Fields (e.g., location, quantity) are picked by the tenant, and Tenant Custom Fields are added as needed.

### 6.3 Forward and backward traceability

- **Forward trace**: given a batch or serial, list every downstream event and the current location/state.
- **Backward trace**: given a finished good, walk back through Transform and Aggregate lineage to source lots.
- **Recall**: select identifier + batch range; the system computes the impacted set, last known locations, and dispatches notifications.

### 6.4 Workflow engine behaviour

- **Asynchronous**: events queue; workflow runs in the background; UI shows real-time progress via websockets.
- **Per-node failure handling** is fully configurable (retry count, backoff, halt-and-alert), with first-class clear error reporting.
- **Idempotency keys** on all writes prevent duplicate events from double-scans or network retries.

### 6.5 Workflow versioning

- Draft mode plus explicit publish; a live preview / test window shows what each screen and step will do before publishing.
- On publish, new events use the new version; in-flight events finish on their version.
- **30-day grace period**: after 30 days no new events run on the old version, bounding the number of live versions.

### 6.6 FEFO Expiry Management

**First Expiry First Out** — the system surfaces the oldest-expiry available batch first when an operator initiates a Dispatch or Issue/Dispense event.

- **Mode**: **Advisory** (not enforcement). The system prompts: "Older batch [X] with expiry [Y] is still available — proceed anyway?"
- The operator can override with a reason. The override is logged in the audit trail.
- **Scope**: per-product-and-location (don't suggest a batch sitting in another warehouse).
- **API**: FEFO suggestions and expiry data are exposed via API so integrating systems (WMS, ERP, printer queues) can consume the recommendation.
- Configurable per tenant: FEFO advisory can be enabled or disabled per product line.

### 6.7 Multi-Dealer Dispatch and Receive

Real-world supply chains involve a tenant manufacturing in multiple plants and dispatching to multiple downstream dealers. The platform supports this directly.

**Multi-plant manufacturing**
- A tenant maintains a library of Manufacturing Units (§5.6).
- Every batch carries `manufacturing_unit_id`, so the system always knows where each batch was made.
- Batch numbers can optionally be templated to include the plant code (e.g., `MUM-241124-001`) — configurable per product in the workflow builder.

**Multi-dealer dispatch**
- A single dispatch event may consist of N **Shipment legs**, each going to a different dealer with its own quantity and tracking reference.
- Each leg carries: dealer, items (batches/units/cases), quantity, vehicle/transport reference, expected delivery.
- Forward trace shows where each unit went, per leg.

**Dealer receive flow**
- Dealers are external organisations by default (Partner / Counterparty entity), with the option to be modelled as downstream tenants.
- Dealers receive lightweight scoped access — through the **Scanning App** (see §8) — and scan the labels on goods they receive.
- A dealer scan records: received-by-dealer, time, location; updates batch state; notifies the tenant.
- Dealers can also initiate Return events with reason and condition (good, damaged, expired).

---

## 7. The No-Code Workflow Builder

A canvas-based, drag-and-drop builder is the operational core. It must be robust, optimized, secure, and built for large scale from day one — not a namesake feature.

### 7.1 Node types (v1)

- Trigger (scan / upload / API)
- Validate
- Transform
- Generate ID
- Generate Label
- Record Event
- Branch (conditional if/else) and Dynamic Routing (route by field value)
- Notify
- Approve

Every node that reads or writes data does so against the Field Library: nodes bind to Core, Super, or Tenant Custom fields by UUID, and the builder enforces strict type compatibility.

### 7.2 Advanced flow control

- Loops, parallel branches, and sub-workflows are available as optional advanced constructs.
- Provided but not expected to be used by every tenant; gated behind an "advanced" mode to keep the default builder simple.

### 7.3 Templates

- Starter templates (e.g., FMCG batch, pharma serialization) can be cloned and customized to cut time-to-value.
- Templates ship with sensible Super Field selections so a tenant can start in minutes.

### 7.4 Correctness guarantees in the builder

- JSON Schema validation at save time; invalid configuration is rejected.
- Strict type checking; mismatched node connections are blocked in the UI.
- Dry-run / simulation against sample data before publish.
- Live preview of the running flow (screen-by-screen).
- Immutable, signed audit log of every configuration change.
- Optimistic locking on concurrent edits; referential-integrity checks before deactivating referenced fields.
- Smoke test on publish: a published workflow is run against sample data before live events are admitted.

---

## 8. Scanning App

A dedicated scanning surface is in scope for v1. It is the field-facing tool used by warehouse operators, plant staff, dispatch operators, and external dealers.

### 8.1 Targets and form factor

- **v1: Mobile Progressive Web App (PWA)** — one codebase, runs on iOS, Android, and any modern browser; installable to home screen.
- Native apps (iOS / Android) considered for v2 only if PWA performance proves insufficient.
- Web fallback for desk-based use.

### 8.2 Capabilities

- **Camera-based barcode/QR scanner** supporting all symbologies generated by the Label Designer: EAN-13, GTIN-14, GS1-128, GS1 DataMatrix, GS1 QR / Digital Link, Code 128, QR (generic), DataMatrix (generic), ITF-14.
- **Workflow-aware**: scanning a label triggers the right event (Dispatch / Receive / Pack / Return / etc.) based on the tenant's configured workflow.
- **Offline mode**: local queue; events captured offline sync when network returns. Conflict resolution uses idempotency keys (already a platform-wide guarantee).
- **Dealer mode**: a lightweight scoped surface for external dealers. They authenticate, see only shipments addressed to them, and scan to Receive / Return.

### 8.3 Authentication for dealers

- Email invite → set password → log in.
- Each scan is logged against a known identity — essential for traceability accountability.

### 8.4 Operations supported in v1

- Commission, Pack, Aggregate, Disaggregate
- Store / Dispatch / Receive / Dispense
- Return / Reject (with reason and condition: good / damaged / expired)
- QC hold / release
- Recall scan (mark received unit as recalled)

---

## 9. Label Designer

- Fully configurable: layout, fields, barcode symbology, and dimensions.
- **Pixel-perfect WYSIWYG designer**; what the tenant sees is what prints.
- Label fields are bound to the Field Library by UUID, so a label always reflects the canonical field definition (and inherits its updates when the field is versioned).
- **Barcode rendering via the Zint library** (open-source, strong GS1 support, structured input).
- **Symbologies**: EAN-13, GTIN-14, GS1-128, GS1 DataMatrix, GS1 QR / Digital Link, Code 128, QR (generic), DataMatrix (generic), ITF-14.
- **Scannability validation at save time**: minimum module size, quiet zones, and data capacity are checked for the chosen symbology and label dimensions; non-scannable designs are blocked.
- **Two-name support**: labels can carry both Manufacturer and Brand Owner names; validation per §5.6.
- **Output**: PDF, PNG, ZPL (Zebra), and Excel export of label sets. Direct printer integration deferred to a later phase.

---

## 10. Dashboards, Reports and Notifications

### 10.1 Dashboards and reports

- **Context-aware**: reports and insights are shaped by the tenant's actual traceability configuration.
- Standardized fields (Core + Super) enable cross-tenant analytics, benchmarks, and ready-made templates.
- **Template-based dashboards in v1** that adapt to the tenant's data model; fully configurable widget dashboards in v2.
- **Periodic refresh** (≈5 minutes) rather than always-on real-time, to keep server load low.
- **Data lineage**: any number on a dashboard can be drilled down to its source events.

### 10.2 Notifications

- **Channels in v1**: in-app, **email**, webhook.
- **Rule model in v1**: simple "if event X then notify Y"; complex multi-condition rules in v2.
- **Deferred to v2**: SMS, Slack, Microsoft Teams, WhatsApp.

---

## 11. Security Baseline

A detailed Security Architecture Document will be produced in a dedicated session, covering authentication options, encryption choices, and secret management in depth. The v1 baseline below is committed now because security is far cheaper to build in than to retrofit.

- **Authentication**: OAuth 2.0 / OIDC; SSO (Google, Microsoft) and email/password; MFA mandatory for all admin tiers.
- **Authorization**: role-based plus attribute-based access control; every API call checks tenant scope and role.
- **Tenant isolation**: row-level security so no tenant can access another tenant's data, even via API misuse.
- **Audit log**: immutable, append-only, signed; covers every configuration and data mutation by **both user and system actions**, including Super Field changes, promotion approvals, FEFO overrides, and GTIN locks.
- **Identity governance**: full identity lifecycle (provision → activate → assign/change role → deactivate → de-provision); **provisioning/role-change history reports** per identity; **single active session** enforced at the IdP.
- **Encryption**: AES-256 at rest, TLS 1.3 in transit; optional field-level encryption for sensitive fields.
- **Secrets management**: managed KMS / vault; no secrets in code or committed config.
- **API security**: per-tenant rate limiting; scoped API keys; signed webhooks.
- **Workflow sandboxing**: Transform / Call-API style nodes execute in sandboxed contexts; no tenant workflow runs arbitrary code on platform servers.
- **Input validation**: every API input validated against JSON Schema.
- **Optional cryptographically signed serials/batches** for counterfeit detection at scan time.
- **Privacy**: alignment with India's DPDP Act and GDPR-style rights (export, deletion, consent) where consumer data is involved.
- **Data residency option**: for regulated tenants the model supports keeping a tenant's data in a separate store/region while execution stays central (DPDP-aligned). Single-region in v1; the option is designed in, not retrofitted.
- **Integrator access & internal auth**: scoped developer-console API keys/secrets with per-key rate limits and full request logging; **internal service-to-service calls are authenticated** (never rely on network isolation alone). Idempotency/dedup guards on capture **fail closed**.
- **SOC 2 foundations** (change management, access reviews, logging) laid from the start; certification targeted in a later year.
- **CI security**: dependency and container scanning on every build.
- **VAPT (Vulnerability Assessment and Penetration Testing)**: required pre-launch and recurring annually, performed by a **CERT-In-empanelled** third-party agency; release is gated on the VAPT certificate before each major version goes to production.

---

## 12. Scalability and Non-Functional Requirements

The same architecture must serve the smallest and largest tenants with no rewrite.

| Tier | Profile | Expectation |
|------|---------|-------------|
| **Low** | 1–100 GTINs, 1–10k events/day | Snappy on a single-region deployment. |
| **Mid** | 1k–100k GTINs, 100k–1M events/day | Standard multi-AZ cloud deployment. |
| **High** | 1M+ GTINs, 10M+ events/day | Recall fan-out to 10M units in under 60s; p95 reads under 200ms. |

**Other NFRs**: 99.9% availability for configuration/master-data APIs and 99.95% for event ingest; horizontal scalability partitioned by tenant + identifier; structured logs, metrics and traces with alerting on ingest lag and label-print failures; multi-language master data and UTF-8 throughout; single-region (India) in v1 with multi-region in a later phase.

---

## 13. UI / UX

- **Component system**: shadcn/ui on Tailwind CSS — accessible, themeable, consistent.
- **Animation**: subtle, professional motion for operator/admin views; more expressive motion for executive dashboards and consumer-facing pages.
- **Workflow builder**: canvas/graph UI (drag-and-drop nodes and connectors); treated as a major, dedicated frontend investment.
- **Field Library admin**: dedicated Super Admin screen for managing Super Fields, reviewing promotion requests, and performing per-tenant deactivation.
- **Customer-centric surface**: dedicated detail page where customers/consumers view product details and full event history for a product, batch, or unit.
- **Scanning App**: mobile-first PWA, optimized for one-handed operation and bright-warehouse readability.

---

## 14. High-Level Data Model

Logical core entities (each UUID-keyed, tenant-scoped where applicable, versioned where configurable):

- **Tenant** — a customer organisation.
- **IdentityScheme** — GTIN (with Company Prefix) / UUID / custom, configured per tenant or product line.
- **FieldDefinition** — typed, validated field. Carries: tier (Core / Super / Tenant Custom), entity binding, type, validation rules, version, status, ownership scope.
- **TenantFieldBinding** — which Super Fields a tenant has enabled; per-tenant deactivations by Super Admin.
- **FieldPromotionRequest** — Tenant Admin → Super Admin promotion requests with status, rationale, approver, decision.
- **Manufacturer** — legal manufacturing company with licences.
- **ManufacturingUnit** — specific plant under a Manufacturer.
- **BrandOwner** — marketer / brand owner entity (can equal Manufacturer for in-house production).
- **Product** — master data; references FieldDefinitions, Manufacturer, BrandOwner. GTIN-immutability rules apply.
- **PackHierarchy** — configurable-depth level definitions.
- **Batch** — (Product, BatchNumber); references ManufacturingUnit; production/expiry data, state.
- **Unit** — (Product, Serial); belongs to a Batch.
- **LogisticsUnit** — case/pallet aggregate (SSCC or custom).
- **Location** — physical place/party (GLN or custom).
- **Dealer / Partner** — external receiving organisation; can be linked to a downstream Tenant.
- **Shipment / ShipmentLeg** — Dispatch may have many legs to different dealers.
- **WorkflowDefinition / WorkflowVersion / WorkflowNode** — the builder graph and its versions.
- **Event** — typed traceability event; append-only; payload composed of field values resolved against field-definition versions.
- **LabelTemplate** — versioned design with bound fields (by UUID) and symbology.
- **NotificationRule** — trigger and channel binding.
- **AuditEntry** — immutable, signed configuration/data change record.

---

## 15. Delivery Phasing

### 15.1 v1 (POC and foundation)

- UUID-internal identity; GTIN primary scheme, UUID/custom fallback; GTIN immutability rules.
- Three-tier Field Library Model: Core, Super, Tenant Custom; per-tenant deactivation by Super Admin; promotion request queue.
- Product master data with default groups + Super/Tenant Custom fields, validation, derived fields, deactivate-not-delete.
- Manufacturer, Brand Owner, and Manufacturing Unit entities as per-tenant libraries.
- Batch / unit / custom-hierarchy traceability.
- No-code builder: full node set incl. conditional branch + dynamic routing; draft/publish; dry-run; live preview; 30-day version grace.
- All v1 event types; forward and backward trace; recall.
- FEFO advisory at Dispatch and Issue events; configurable per tenant.
- Multi-dealer dispatch with shipment legs; multi-plant manufacturing.
- Scanning app (mobile PWA) with offline sync and dealer mode.
- Label designer with Zint, WYSIWYG, scannability validation; PDF/PNG/ZPL/Excel output.
- Three-tier admin + configurable tenant roles.
- Template-based dashboards; in-app/email/webhook notifications.
- Full security baseline incl. VAPT pre-launch.
- Single-region; usage metrics captured (no billing).

### 15.2 v2 and later

- Auto-discovery of field promotion candidates.
- Configurable widget dashboards; complex multi-condition notification rules.
- SMS/Slack/Teams/WhatsApp notification channels.
- ERP/WMS and direct printer integrations.
- Multi-region; EPCIS-style export; own GS1 Digital Link resolver.
- Native scanning apps (if PWA performance is insufficient).
- Relabel/Repack and Sold events.
- Promotion of Manufacturer/BrandOwner libraries from per-tenant to shared.
- Multi-supplier inbound (mirror of multi-dealer outbound).
- Billing and metering.

---

## 16. GS1 Conformance Mode & Digital Link Resolver

**GS1 Conformance Mode (opt-in, Part C).** GS1 support is a per-tenant opt-in module, never the spine. When enabled it provides GS1 **key validators/encoders** (GTIN-8/12/13/14, GLN, SSCC, GCN, GRAI, GIAI) using the **Modulo-10 check digit** over `GCP + item reference + check digit`; **Application Identifier** encoding for GS1-128 / DataMatrix; a **GS1 Digital Link** resolver; and **EPCIS-style event export**. In all cases the GTIN remains a *validated attribute on top of the UUID identity* (never the primary key), and GTIN allocation is **append-only once committed** — no deallocate/reuse. (Note: GS1 India supports ~517 identifier types; we implement the common keys and keep the set extensible.) Rationale and prior-system comparison: `docs/datakart-gs1-analysis.md`.

**Digital Link Resolver — Recommendation**: own the resolver in the long run, built fully GS1-conformant so it interoperates with GS1 India's national resolver. Owning it gives control of the consumer experience, latency and reliability at scale, multi-tenant scan analytics, and instant recall-state flips. Conformance preserves interoperability.

**Pragmatic phasing**: v1 may rely on GS1 India's national resolver to reach market quickly; a later phase ships the platform's own conformant resolver and migrates traffic.

---

## 17. Project Documentation Deliverables

The project maintains a living documentation set so any part of the system can be referenced later without ambiguity.

| Document | Contents |
|----------|----------|
| **PRD** | This document; product scope and requirements, versioned. |
| **Architecture Document** | System architecture, component diagrams, data-flow diagrams, scaling model. |
| **Data Model / Schema Document** | Entity descriptions, relationships, ER diagrams, schema-version history, Field Library structure. |
| **Functional Document** | What each module does, business rules, edge cases. |
| **Functionality Inventory** | Living, queryable record of every screen, button, click and pop-up and exactly what it does. Maintained as a database (not a static doc), updated per release. |
| **Frontend Document** | Component library, design tokens, page structures, state management. |
| **Backend Document** | Services, endpoints, queues, jobs/cron, the workflow engine internals. |
| **Code-level Function Document** | Auto-generated: file descriptions, function signatures, dependencies, and visual dependency / call graphs and an API-service mind-map showing how services depend on each other. |
| **API Reference** | Auto-generated OpenAPI/Swagger. |
| **Runbook / SRE Document** | Deploy, debug, and incident-handling procedures. |
| **Security & Threat Model** | Threats, mitigations, security architecture (produced in a dedicated session). |
| **Test Plan** | Unit, integration, e2e, and load-testing strategy. |
| **Release Notes** | Per-version change record. |

---

## 18. Open Items and Pending Decisions

### 18.1 To be settled in dedicated sessions

- **Security Architecture Document** — dedicated working session (auth methods, encryption, secret management).
- **Cloud platform selection** and any data-residency constraints for regulated customers.
- **Tech stack confirmation** (frontend framework, backend language, datastore, queue).
- **12-month scale expectations** (tenant count, GTIN volume, events/day) to finalize capacity planning.
- **Initial seed set of Super Fields** per entity (Batch, Label, Product, Unit, Event) to ship with v1.
- **Billing model** — deferred; revisit when commercialization is decided.

### 18.2 Pending stakeholder responses (from last PRD discussion)

These were raised but not yet answered. Default assumptions are noted; Claude Code should not silently assume — flag and request confirmation.

- **Q9** — Dealer access mode (email invite / SMS magic link / shipment QR / combination). **Default**: email invite + password.
- **Q10** — Multi-dealer dispatch: one event with N legs vs N events. **Default**: support both, prefer single-event-N-legs.
- **Q11** — Return event details: dealer, reason, condition (good/damaged/expired). **Default**: yes to all three.
- **Q12** — What dealer-receive scan does (record / update state / notify / all). **Default**: all of the above.
- **Q13** — Manufacturer entity scope: per-tenant vs shared platform library. **Default**: per-tenant in v1, shared in v2.
- **Q14** — Label two-name validation: enforce vs warn vs tenant-configurable. **Default**: tenant-configurable, warn-don't-block default.
- **Q15** — Events FEFO applies to. **Default**: Dispatch and Issue/Dispense.
- **Q16** — FEFO scope: per-product / per-product-and-location / global. **Default**: per-product-and-location.
- **Q17** — Manufacturing Unit fields. **Default list**: name, address, licences with expiry, GLN, plant code, status.
- **Q18** — Plant code prefix in batch numbers. **Default**: optional, configurable per product.

---

## Document History

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 3 May 2026 | Initial GS1/DataKart-inspired PRD. |
| v0.2 | 16 May 2026 | Rewrite as configurable platform; UUID-internal identity; field type system; phasing. |
| v0.3 | 24 May 2026 | Three-tier Field Library Model added. |
| v0.4 | 30 May 2026 | Stakeholder annotations integrated: GTIN immutability, FEFO advisory, multi-plant + multi-dealer, two-name (Manufacturer + Brand Owner), VAPT, Scanning App as first-class section. |
| v0.5 | 21 Jun 2026 | Enrichments from DataKart/GS1 reference analysis: GS1 Conformance Mode scope (§16); security additions (CERT-In VAPT gate, identity governance + single-session, data-residency option, authenticated internal calls, fail-closed idempotency); audit covers user + system actions. See `docs/datakart-gs1-analysis.md`. |
