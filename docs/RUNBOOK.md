# Strings — Frontend Runbook

> **What this is.** A one-stop index of every page in the `apps/web` frontend: what it
> represents, its route, and its build status. Mirrors the in-app launcher at
> [`/launcher`](http://localhost:3000/launcher) (one click from the Welcome screen).
>
> **Build phase.** Frontend-first: every page runs on **mock data** under
> `code/apps/web/data_mock/` (temporary — deleted once each page is wired to the live
> API). Design system = **Command × Bento**. Product is branded **Strings** in the UI.
>
> _Last updated: 2026-06-28._

---

## How the app is wired

| Piece | Where | Purpose |
|-------|-------|---------|
| **Welcome** | `app/page.tsx` → `/` | Temporary landing — "Welcome to Strings" + one button into the launcher. |
| **Launcher** | `app/launcher/page.tsx` → `/launcher` | Visual index of every page (this runbook, in-app). One click from Welcome and from the top-nav logo / apps button. **Scaffolding only.** |
| **Page registry** | `data_mock/launcher.ts` | Single source of truth for the launcher + this runbook (titles, blurbs, routes, status). |
| **Top-nav chrome** | `components/TopNav.tsx` | Logged-in header. Logo + apps button → launcher; bell → `/notifications`; avatar → `/account`. |
| **PageShell** | `components/PageShell.tsx` | Standard logged-in page wrapper (TopNav + title/subtitle/actions). |
| **AuthShell** | `components/AuthShell.tsx` | Chrome-free centered layout for auth/onboarding screens. |
| **Icons** | `components/icons.tsx` | Shared SVG icon set + the workflow-node `Glyph` map. |
| **Design tokens** | `app/globals.css` | Command × Bento CSS variables + builder/component classes. |

**Status legend:** ✅ Built (mock data) · 🔌 Live API · 🕓 Pending.

---

## 1 · Operational — Tenant workspace
_The day-to-day surface a tenant admin / user lives in._

| Page | Route | Status | What it represents |
|------|-------|--------|--------------------|
| **Dashboard** | `/dashboard` | ✅ | Production snapshot: KPI tiles, 7-day event-volume hero, active recall, FEFO advisories, recent events. |
| **Master Data** | `/master-data` | ✅ | Products/GTINs, manufacturers, brand owners, pack hierarchy. Row → drawer with the 6 GTIN-immutable identity fields (lock badges, invariant 7). Tabs + search + status filter. |
| **Field Library** | `/fields` | 🔌 | Three-tier field model (Core / Super / Tenant Custom). **Reads the live API** through Postgres RLS (graceful message if API is down). |
| **Workflow Builder** | `/workflows` | ✅ | No-code canvas: node palette (collapsible groups), graph + edges, inspector (selectable nodes, collapsible sections), zoom, Validate / Dry-run / Publish. |
| **Events & Trace** | `/events` | ✅ | Append-only event stream (filterable by type), Trace Explorer (backward origin + forward distribution timeline), Recall fan-out with dealer ack status. |
| **Label Designer** | `/labels` | ✅ | WYSIWYG label preview (faux DataMatrix/GS1-128), template list, scannability checks, PDF/PNG/ZPL/Excel output. |
| **Scanning App** | `/scanning` | ✅ | Mobile-PWA preview in a phone frame: Tag / Dispatch / Receive modes, offline-sync banner, recent-scans feed. |
| **Dispatch & Receive** | `/dispatch` | ✅ | Multi-dealer dispatch split into legs (per-dealer status) + FEFO advisory; Receive tab with expected/received reconciliation. |
| **Reports** | `/reports` | ✅ | Template-based report gallery with sparklines (event volume, trace coverage, recall, FEFO, dealer perf, inventory ageing); Run / Schedule. |

## 2 · Tenant administration & configuration
_How a tenant admin shapes their own instance._

| Page | Route | Status | What it represents |
|------|-------|--------|--------------------|
| **Settings** | `/settings` | ✅ | Tenant profile, region/residency, branding, GS1 conformance toggle, danger zone. |
| **Users** | `/users` | ✅ | Invite / manage / disable users; role assignment; search. |
| **Roles & Permissions** | `/roles` | ✅ | Configurable tenant roles + a resource × CRUD permission matrix. |
| **Identity Schemes** | `/identity-schemes` | ✅ | GTIN (primary) / UUID / custom scheme config — validation rules + allocation; custom-scheme table. |
| **Notifications** | `/notifications` | ✅ | Notification rules (trigger → channels → recipients, enable toggle) + delivery log. |
| **Approvals** | `/approvals` | ✅ | Queue for field-promotion (Tenant Custom → Super) and workflow-publish requests; Approve / Reject. |
| **Audit Log** | `/audit` | ✅ | Append-only, versioned change history (actor, action, entity, version, diff); filter by action (invariants 2 & 4). |
| **Account** | `/account` | ✅ | Your profile, active sessions, preferences, sign out. |

## 3 · Platform super-admin console
_God-mode across all tenants (Platform Super Admin / Platform Admin)._

| Page | Route | Status | What it represents |
|------|-------|--------|--------------------|
| **Tenants** | `/admin/tenants` | ✅ | Every customer tenant — users, GTINs, 30-day events, status (active/onboarding/suspended). |
| **Super Fields** | `/admin/super-fields` | ✅ | Canonical shared field library + the Tenant→Super promotion queue (Promote / Reject). |
| **Usage Metrics** | `/admin/usage` | ✅ | Platform-wide usage: active tenants, events, storage, GTINs; weekly chart + top tenants (no billing in v1). |

## 4 · Auth & onboarding
_Entry points — chrome-free, pre-login (AuthShell)._

| Page | Route | Status | What it represents |
|------|-------|--------|--------------------|
| **Login** | `/login` | ✅ | Email/password + SSO (links to dashboard). |
| **Register** | `/register` | ✅ | New user sign-up → flows into onboarding. |
| **Tenant Onboarding** | `/onboarding` | ✅ | 4-step wizard: Organisation → Identity scheme → Modules → Review & create. |
| **Forgot Password** | `/forgot-password` | ✅ | Request a reset link. |

---

## Mock data map (`data_mock/`)

`dashboard.ts` · `masterData.ts` · `workflows.ts` · `events.ts` · `launcher.ts` ·
`users.ts` · `identitySchemes.ts` · `notifications.ts` · `approvals.ts` · `audit.ts` ·
`admin.ts` (tenants + super fields + usage) · `labels.ts` · `scanning.ts` · `dispatch.ts` ·
`reports.ts`.

Each file is shaped roughly like the future API response, so connecting a page later is
a near one-file swap. **Delete the whole `data_mock/` folder once every page is live.**

## Run it

```powershell
# from repo root; portable Node must be on PATH
pnpm -C code --filter @tracewell/web dev   # http://localhost:3000  (→ Welcome → Explore → launcher)
```

## Known gaps / next

- `/fields` is the only page on the **live API**; the rest are mock.
- Auth is **not enforced** — every route is open (no OIDC yet; the launcher is the temporary hub).
- Global UI not yet wired: ⌘K command palette, live notification panel.
- Decorative-only actions on some pages flash a toast rather than mutating real state.
- The internal package is still named `@tracewell/web`; only the **UI brand** is "Strings".
