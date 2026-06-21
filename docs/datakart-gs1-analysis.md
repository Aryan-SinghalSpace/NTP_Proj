# DataKart / GS1 Reference Analysis

| | |
|---|---|
| **Version** | v0.1 |
| **Status** | Analysis — for direction-setting |
| **Date** | 2026-06-21 |
| **Sources** | `DK-2-Prod-Features--main/` (understanding docs for GS1 India's live DataKart "DK 2.0" — 49 repos), `Hakuna Matata/` (original GS1 BRD `GS1_BRD_1.3`, RFP `Annexure 2.1`, Compliance Deck `Annexure 2.6`). |

> **Ground rule (non-negotiable): reference only, never cloned.** DataKart is a third-party system built for GS1 India by another vendor (Hakuna Matata). We study it to learn the GS1 mechanics, borrow proven *concepts*, and deliberately differentiate. We copy **no** code, schema, screens, or text. This document records principles and decisions, not their implementation.
>
> **Confidentiality:** the two source folders contain third-party proprietary and **commercially confidential** material (signed agreements, POs, GST/bank documents, a vendor's source-understanding docs). They must **not** be committed to our repo or pushed to any remote — see §8.

---

## 1. What DataKart actually is

DataKart 2.0 is **GS1 India's national product-data registry, with traceability bolted on as a peripheral subsystem.** A GS1-member brand owner registers the GS1 Company Prefix (GCP) it already holds, allocates GTINs/GLNs/GCNs, builds a published product catalogue, and syncs it to the global "Verified by GS1" (VbG) registry. Around that registry sit label/QR generation, a serialized trace add-on, a public consumer-scan experience (Smart Consumer), retailer catalogue consumption, coupons, and integrator APIs.

- **Shape:** ~49 microservices (Node/**Fastify**, **Keycloak** auth, **Kong** gateway path-routing only, **PostgreSQL** + **ClickHouse** + Azure Blob + Azure Event Hub), on AKS/Azure, one React SPA.
- **Identity model:** **GTIN/GS1-centric and not pluggable.** DB ids + `company_id` are the de-facto keys; there is no UUID-internal identity and no UUID/custom identifier path. Products without a GTIN are not a first-class concept.
- **Tenancy:** **application-level filtering by `company_id`** — no row-level security, no per-tenant schema. One forgotten `WHERE company_id =` is a cross-tenant leak.
- **Trace:** a **parallel, separate stack** (own schema, own event bus + worker, own DK-1.0 bridge, own label service) with a **hard-coded EPCIS event vocabulary** (pack/aggregate/dispatch/receive/store/issue/QC/stock-take) implemented as branch logic — adding an event type means writing code.
- **Configurable fields ("superfields"):** a **two-tier** (master vs tenant) custom-field store with rendering metadata; typed server-side only, **mutated in place (no version-at-write-time)**, no platform-locked Core tier, no promotion queue.

**Bottom line:** DataKart is a *registry-first* product where traceability and configurability are add-ons. **Our product inverts this**: traceability-first, no-code-configurable, identity-pluggable, multi-tenant with enforced isolation and durable execution.

---

## 2. GS1 identity mechanics worth knowing

The BRD/RFP **reference** the GS1 keys but defer the algorithms ("GS1 will provide the logic for generation of all Identifiers"; GS1 India supports **517 identifier types**). The mechanics below are the published GS1 standard — relevant to us **only as our opt-in "GS1 conformance mode" (PRD Part C)**. In our system the GTIN is always a *validated attribute on top of a UUID*, never the primary key.

- **GTIN** (GTIN-8/12/13/14): composed as **GS1 Company Prefix + Item Reference + Check Digit**, stored right-justified in a 14-digit field. The brand owner's GCP is fixed; they allocate the item reference; the system computes the check digit. The indicator digit (GTIN-14 position 1) encodes packaging level.
  - **Modulo-10 check digit:** take data digits right-to-left, multiply alternating positions by **3** and **1** (rightmost data digit ×3), sum, then `check = (10 − (sum mod 10)) mod 10`.
- **GLN** (13-digit): `GCP + Location Reference + check digit` — physical/legal/functional locations; the "where" of trace events.
- **SSCC** (18-digit): `Extension + GCP + Serial Reference + check digit` — logistic units (cases/pallets).
- **Other keys:** GRAI, GIAI, **GCN** (coupons), plus **Application Identifiers** — the `(01)`,`(10)`,`(21)`… prefixes encoded into GS1-128 / DataMatrix.
- **GS1 Digital Link:** a web-URI form of the GTIN that resolves (via a resolver) to product info / authentication / track-&-trace / warranty / coupons.
- **Symbologies:** EAN-13, GS1-128, DataMatrix, QR, ITF-14, plus RFID — all covered by **Zint**, which DataKart also uses (validating our Zint sidecar decision).
- **"How a GTIN gets filled":** on create, DataKart captures core attributes (Brand, Product Name, Packaging Type, Category, Country of Origin, Net Content + UoM, MRP, dimensions, HS code, FSSAI/Drug-License where applicable, up to 8 images) and **locks core attributes on commit**; minor edits → version history, major edits → a new GTIN with old↔new linkage. This directly corroborates our **GTIN-immutability invariant (#7)**.

---

## 3. DataKart vs. our design

| Dimension | DataKart (DK 2.0) | Our platform | Verdict |
|---|---|---|---|
| **Primary identity** | GTIN/GS1-centric; DB id + `company_id` | UUID-internal; GTIN/UUID/custom pluggable | **Ours stronger / broader** |
| **Traceability** | Bolted-on parallel stack; hard-coded event types | Traceability-first; **workflows-as-data** Temporal interpreter | **Ours stronger** |
| **Configurable fields** | 2-tier, mutate-in-place, server-only typing | 3-tier (Core/Super/Tenant), versioned-at-write, promotion queue, shared client+server typing | **Ours stronger** |
| **Tenant isolation** | App-level `company_id` filter, no RLS | Postgres **RLS**, non-BYPASSRLS app role | **Ours stronger** |
| **Reliability** | Fire-and-forget eventing, empty error handlers, **no DLQ** → half-provisioned tenants | Temporal durable execution + transactional outbox + per-node retry/halt | **Ours stronger** |
| **Topology** | 49 repos, near-duplicate services, naming drift | Modular monolith with pre-split worker/sandbox/render seams | **Ours simpler** (needs boundary discipline) |
| **Secrets** | Plaintext in ConfigMaps/git, default DB password fallback in ~27 files | KMS/vault, nothing in git | **Ours stronger** |
| **GS1 conformance** | Native (it *is* the registry) | Opt-in conformance mode (Part C) | **Theirs deeper — by design; not our spine** |

The dimensions that hurt DataKart most (isolation, reliability, configurability, secrets) are precisely the ones our **invariants** already address. Our architecture is essentially the negation of DataKart's structural weaknesses.

---

## 4. What to LEARN / incorporate (concepts only)

**GS1 standards as opt-in conformance (PRD Part C):**
- Mod-10 check-digit + GCP/item-reference composition; GTIN/GLN/SSCC/GCN/GRAI/GIAI validators and AI encoders.
- GS1 Digital Link resolver behaviour for the consumer scan.
- EPCIS-style event semantics (who/what/why/where/when) as our *native* event model and as opt-in EPCIS export.

**Security baseline (the BRD/RFP/Compliance deck are a strong checklist — folds into our security session):**
- Central IAM + MFA/OTP, full identity lifecycle, RBAC on every function, **identity-governance/provisioning-history reports**.
- **Append-only audit of all user *and* system actions** (matches invariant #2).
- Secrets in a **vault** (Azure Key Vault there / our KMS); **security testing in CI/CD**; deploy only after fixing findings.
- **Mandatory CERT-IN-empanelled third-party VAPT** as an acceptance gate (aligns with our VAPT-as-release-blocker decision; add the CERT-IN specifier).
- **Tenant data-isolation / residency option** (a tenant's data in a separate repo/region) — DPDP-aligned; worth offering as a config.

**Proven engineering patterns (as concepts, improved):**
- A **single reusable permission-resolver** primitive shared by all modules.
- **IdP-level single-active-session** enforcement.
- **Scoped developer-console API keys + secrets** for integrators.
- **Atomic job-claim** (`FOR UPDATE SKIP LOCKED`, Pending→Processing single-winner) for async work.
- **Stateless renderer fed by a queue** for labels (our Zint sidecar — their model validates it).
- **Idempotency/dedup guard on duplicate capture** — but **fail closed** (theirs fails open).
- **Data-quality verification score**, FEFO, recall-fan-out-by-batch, configurable per-category field templates, draft→approve→publish→notify — all reusable product concepts we already intend.

---

## 5. What to DIFFERENTIATE / explicitly NOT copy

- **The national product-registry / data-pool role**, VbG/GDSN sync, the 517-identifier GS1-India catalogue, GCP licensing/allocation administration — for us these are at most thin **opt-in connectors**, never the spine. (Issuing GS1 prefixes is already a PRD non-goal.)
- **Zoho (CRM/Desk/Subscriptions) and Power BI hard-wiring**, and the GS1-India role taxonomy (Company Owner / Retailer / E-tailer / Solution Provider) — replaced by our three-tier admin + configurable tenant roles and our own notification/analytics path.
- **Hard-coded verticals** (Army acceptance-tender flow, pharma 5-level batch, oxygen-concentrator screens) — we achieve these via the **generic no-code workflow builder + custom hierarchies**, not per-vertical code.
- **GTIN-as-primary-identity** and **GTIN deallocate/reuse** — conflicts with our UUID-internal identity and **append-only-once-committed** GTIN rule.
- **Web-only / mobile-out-of-scope** stance — our v1 includes the mobile PWA scanning app with offline sync.

---

## 6. Anti-patterns to design AWAY from (their failures → our antidotes)

1. **App-only tenant isolation** → our Postgres RLS.
2. **Secret sprawl** (plaintext ConfigMaps, secrets in git, `JWT_SECRET=thisisnotsecure`, default DB password fallback in ~27 files, a service that `console.log`s its full config incl. password) → KMS/vault, nothing in git, no plaintext fallbacks.
3. **No auth on internal/destructive endpoints** (relies on network policy alone) → authenticate internal calls; defence in depth.
4. **Fire-and-forget eventing, swallowed errors, no DLQ** → transactional outbox + Temporal durable execution + per-node retry/halt-and-alert.
5. **Hard-coded event-type branch logic** → data-driven graph interpreter.
6. **Repo/code sprawl + naming drift** (three repos named `gs1-utility`; superfields repo named `datakart-masters`; code↔env↔k8s name mismatches) → modular monolith with enforced, consistently-named module boundaries.
7. **Injection surfaces** (`child_process.exec` with interpolated barcode strings; string-built ClickHouse SQL) → parameterize everything; never shell-interpolate user input (relevant to our Zint sidecar — use structured args).
8. **Brittle prod CD** (hand-bumped image tags, stale in-repo manifests, one-line READMEs) → IaC + pinned, reproducible deploys.

---

## 7. Verdict

**Continue — do not change course.** This analysis *validates* our PRD and architecture rather than challenging them. DataKart is a capable registry, but it is registry-first, GS1-bound, GTIN-keyed, application-isolated, and fire-and-forget — exactly the four things our invariants invert. Our traceability-first, identity-pluggable, RLS-isolated, durably-executed, three-tier-configurable design is the stronger product for our goal ("customization of trace for any user, not a generalised registry for GS1 members only").

**Concrete enrichments to fold into our docs (proposed, not yet logged):**
1. **GS1 conformance mode (Part C)** — promote from "later" to a defined opt-in module spec: check-digit/key validators, AI encoders, Digital Link resolver, EPCIS export. Keep GTIN a validated attribute on the UUID.
2. **Security session inputs** — adopt the BRD checklist: central IAM + MFA, identity-governance reports, append-only audit of user+system actions, vaulted secrets, security-in-CI/CD, **CERT-IN-empanelled VAPT gate**, residency option.
3. **Borrowed patterns** — single permission-resolver, IdP single-session, scoped dev-console API keys, atomic job-claim, fail-closed idempotency.
4. **Product concepts already in PRD** confirmed by real-world precedent — GTIN immutability + version linkage, per-category field templates, data-quality score, FEFO, recall fan-out, draft→approve→publish.

---

## 8. Housekeeping (action needed)

The `DK-2-Prod-Features--main/` and `Hakuna Matata/` folders are **third-party confidential reference material** and must never enter our git history or remote. **Recommended:** add both to `.gitignore` immediately (keep them locally as read-only reference). They are someone else's IP and contain signed contracts, POs, and financial documents — committing/pushing them would be a confidentiality breach.
