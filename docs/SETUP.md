# Local Development Setup

> **Status (2026-06-21):** Node 20.20.2 + pnpm 9.12.3 are **installed**; `pnpm install` is done; `field-types` builds + tests pass; both apps typecheck; the **web app runs** at http://localhost:3000 (no Docker needed yet). Build approach is **frontend-first** — UI pages with mock data first, backend + Docker later. The infra/DB steps (sections 2–3) are only needed when connecting a page to live data.
>
> _Original scaffold note: first vertical slice — tenant + Field Library meta-model behind Postgres RLS, an API that serves it, and a Next.js page that reads it._

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 20.11 | `.nvmrc` pins 20.11.0 |
| **pnpm** | 9.x | `corepack enable` (ships with Node) then it's available |
| **Docker** | recent | for local Postgres / Redis / Temporal / MinIO (optional for type/unit work) |

## 1. Install dependencies

```bash
corepack enable          # enables pnpm from the version in package.json
pnpm install             # installs the whole workspace
pnpm --filter @tracewell/field-types build   # build the shared package first
```

> The API and web app import the **compiled** `@tracewell/field-types`, so build it once after install (and after changes). `pnpm build` (Turbo) also does this in dependency order.

## 2. Start local infrastructure (needs Docker)

```bash
cp infra/.env.example infra/.env
pnpm infra:up            # Postgres :5432, Redis :6379, Temporal :7233 (+UI :8080), MinIO :9000 (console :9001)
```

The Postgres container auto-creates a **non-superuser** `tracewell_app` role (RLS is always enforced) via `infra/postgres/init/01-app-role.sql`.

## 3. Run database migrations + seed

```bash
cp apps/api/.env.example apps/api/.env
pnpm --filter @tracewell/api migrate     # applies apps/api/drizzle/*.sql once each
```

This creates `tenant` + `field_definition` with RLS policies and seeds a demo tenant (`Acme Foods`, id `00000000-0000-0000-0000-000000000001`) with Core/Super/Tenant Batch fields.

## 4. Run the apps

```bash
# terminal 1 — API (http://localhost:4000)
pnpm --filter @tracewell/api dev

# terminal 2 — web (http://localhost:3000)
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @tracewell/web dev
```

Or everything at once: `pnpm dev` (Turbo runs all `dev` tasks).

## 5. Verify

- **API health:** http://localhost:4000/api/health → `{ "status": "ok" }`
- **Fields (RLS):** `curl -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" "http://localhost:4000/api/fields?entity=batch"` → Core + Super + that tenant's Custom fields. Omit the header → only Core/Super (tenant_id IS NULL). Use a different tenant id → you won't see Acme's custom field. That's RLS doing its job.
- **Web:** http://localhost:3000 (dashboard) and http://localhost:3000/fields (reads the API live).
- **Unit tests:** `pnpm --filter @tracewell/field-types test` (GS1 check digit + value-schema validation).
- **Temporal UI:** http://localhost:8080 · **MinIO console:** http://localhost:9001 (`tracewell` / `tracewell123`).

## What exists vs. what's next

**Exists (this slice):** monorepo (pnpm + Turborepo), shared field-type system + GS1 validators (Zod, tested), NestJS API with the RLS-aware `TenantDbService`, tenant-context middleware, `/health` and `/fields`, Drizzle schema + SQL migrations with RLS, docker-compose infra, Next.js app on the Command × Bento tokens.

**Next:** real OIDC auth (replaces the header stand-in), the attribute-bag entities (product/batch/unit/event), the Temporal worker + graph interpreter, and fleshing out the web shell to match `mockups/final`.
