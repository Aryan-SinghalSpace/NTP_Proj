# Strings — UI Revamp Runbook (review & polish)

> **What this is.** A focused guide to the UI revamp in progress: how to run and review it,
> what was rebuilt, and a page-by-page **polish checklist** so you can give precise feedback
> before we move to the next page.
>
> **Direction (agreed 2026-07-06):** landing = product **marketing page**; vibe = **polish the
> existing warm-light Command × Bento identity** (level it up, don't replace it); **light-only for
> now** (dark mode scaffolded but dormant); motion = tasteful/expressive.
>
> _Last updated: 2026-07-06 · Phases 1–2 complete (design foundation, landing, auth)._

---

## 1 · Run & review

Everything below is **frontend-only** — no DB needed to review the look. The web app runs on mock/
static data.

```powershell
# from repo root (portable Node on PATH)
pnpm -C code --filter @tracewell/web dev      # → http://localhost:3000
```

If a stale server holds port 3000, Next will use **3001** — watch the startup line for the URL.

**Full stack** (only needed when wiring a page to the live API — not for visual polish):

```powershell
pnpm -C code infra:up                                 # Postgres/Redis/Temporal/MinIO (Docker)
pnpm -C code --filter @tracewell/api migrate          # once
pnpm -C code --filter @tracewell/api dev              # → http://localhost:4000
pnpm -C code infra:down                               # stop containers when done
```

**Pages to review right now:**

| Page | URL | Phase |
|------|-----|-------|
| Marketing landing | http://localhost:3000/ | 1 |
| Login | http://localhost:3000/login | 2 |
| Register | http://localhost:3000/register | 2 |
| Forgot password | http://localhost:3000/forgot-password | 2 |
| Dev launcher (every page built) | http://localhost:3000/launcher | — |

> **Review tips:** resize the window down to a phone width to check responsiveness; the landing nav
> turns to frosted glass once you scroll; try the show/hide eye toggle on the login password field;
> the auth brand panel hides below the `lg` breakpoint (a mobile mesh backdrop shows instead).

---

## 2 · What changed — the design foundation (reusable everywhere)

This is the groundwork that makes every future page stop looking "generic." All of it is themed to
the existing Bento tokens, not shadcn's stock palette.

| File | What it gives us |
|------|------------------|
| `apps/web/lib/utils.ts` | `cn()` — merge/dedupe Tailwind classes (the one helper every component uses). |
| `apps/web/components/ui/button.tsx` | `Button` + `buttonVariants` — 6 variants (primary, **gradient**, secondary, ghost, soft, link), 4 sizes, hover-lift + press states. Use `buttonVariants({...})` as a `className` on `<Link>` for navigation. |
| `apps/web/components/ui/card.tsx` | `Card` (+ `interactive` lift), `CardHeader/Title/Description/Content`. |
| `apps/web/components/ui/badge.tsx` | `Badge` — neutral/primary/teal/amber/rose/success/outline. |
| `apps/web/components/ui/input.tsx` | **Form kit:** `Input` (leading-icon/trailing slots + focus ring), `Label`, `Field` (label+control+hint), `Checkbox`, `OrDivider`. |
| `apps/web/components/ui/password-input.tsx` | `PasswordInput` with a working show/hide toggle. |
| `apps/web/components/Reveal.tsx` | Framer-motion scroll-reveal wrapper (fade + rise; respects reduced-motion). |
| `apps/web/tailwind.config.ts` | Full Bento palette aliases, `darkMode:'class'`, `tailwindcss-animate`, keyframes (`fade-up`, `float`, `shimmer`, `pulse-ring`), shadow tokens. |
| `apps/web/app/globals.css` | New tokens `--shadow-lg` / `--shadow-glow`; helpers `.grad-text`, `.glass`, `.mesh`, `.dotgrid`, `.hairline`; reduced-motion guard; dormant `.dark{}` block. |
| `apps/web/app/layout.tsx` | Fonts via `next/font` (Inter / Space Grotesk / JetBrains Mono) — no render-blocking import, no layout shift. |

**New libraries added** (web app only): `class-variance-authority`, `clsx`, `tailwind-merge`,
`lucide-react`, `framer-motion`, `tailwindcss-animate`.

**Why not vanilla shadcn tokens?** shadcn renames `muted` to mean a *background*; Bento uses `muted`
for *text*. Adopting shadcn's palette wholesale would silently recolor the already-built pages, so we
kept Bento tokens and gave the components shadcn's structure (`cn()` + CVA) instead.

---

## 3 · Pages revamped so far — with polish checklists

Tick anything that feels off and tell me; that's the polish loop.

### Landing — `/` (`app/page.tsx` + `components/landing/*`)
Sections, in order: **Nav** (sticky, glass-on-scroll) → **Hero** (animated, with a floating "live
workflow" preview card) → **StatStrip** (4 metrics) → **FeatureGrid** (6-pillar bento, workflow
builder featured) → **HowItWorks** (3 steps) → **StandardsBand** (GS1 opt-in) → **CtaBand** (gradient)
→ **Footer** (with a discreet dev-launcher link).

- [ ] Hero headline & subcopy wording
- [ ] The animated workflow preview card — right metaphor? too busy / too plain?
- [ ] Feature pillar copy (6 tiles) — accurate, well-prioritised?
- [ ] Stats (1M+ GTIN, 99.95% uptime, 14 event types, <60s recall) — keep these numbers?
- [ ] Motion intensity — more subtle / more expressive?
- [ ] Nav links (Platform / How it works / Standards) — right set?
- [ ] CTA copy ("Get started", "Book a demo") and where they point

### Auth — `/login`, `/register`, `/forgot-password` (`components/AuthShell.tsx` + `app/{...}/page.tsx`)
Shared `AuthShell`: left **brand panel** (gradient + blurred blooms + dot grid + floating glass proof
card + trust row, staggered fade-in); right **form panel** on the shared form kit. Login & Register
have **Google + Microsoft SSO**; login has the password show/hide toggle + "keep me signed in".

- [ ] Brand-panel proof points (tenant-isolated / auditable / no-code) — the right three?
- [ ] Form fields per page — anything missing or excessive?
- [ ] SSO providers — Google + Microsoft only, or add email-link / others?
- [ ] Copy & tone (titles, hints, the "SSO configured per tenant" note)
- [ ] Button labels and destinations (login→dashboard, register→onboarding)

---

## 4 · Not yet revamped (still on the older styling)

These pages **work and are reachable** (see the main [RUNBOOK.md](RUNBOOK.md) / `/launcher`) but still
use the pre-revamp look. They'll be upgraded page-by-page onto the foundation above:

`/onboarding` · `/dashboard` · `/master-data` · `/workflows` · `/events` · `/labels` · `/scanning` ·
`/dispatch` · `/reports` · `/settings` · `/users` · `/roles` · `/identity-schemes` · `/notifications` ·
`/approvals` · `/audit` · `/account` · `/admin/tenants` · `/admin/super-fields` · `/admin/usage` ·
`/fields` · `/launcher` · `/notifications`.

**Recommended next:** `/onboarding` (4-step wizard — finishes the sign-up funnel and reuses the form
kit) → then `/dashboard` (introduces the logged-in `PageShell` chrome that all internal pages share).

---

## 5 · The polish loop (how we work each page)

1. You review the page in the browser and give feedback (use the checklists above).
2. I adjust, then run: **typecheck** (`pnpm -C code --filter @tracewell/web exec tsc --noEmit`) →
   verify the route returns **HTTP 200** → tell you what changed.
3. When you're happy, I commit that page as one unit and we move to the next.

**How to give feedback that lands fastest:** name the page + section (e.g. "landing → hero"), and say
the *intent* ("make the hero calmer", "the stat numbers feel invented"). Screenshots welcome.

---

## 6 · Token & component cheat-sheet (for precise feedback)

- **Colours:** `primary` (indigo #5b5bf0), `teal`, `amber`, `rose`, `sky`, `violet`, `success`,
  `danger` — each with a `-soft` background and (where relevant) `-fg` text variant. Neutrals:
  `bg`, `surface`, `surface-2`, `border`, `border-strong`, `text`, `muted`, `subtle`.
- **Type:** display = Space Grotesk (`font-display`), body = Inter (`font-sans`), mono = JetBrains.
- **Gradients:** `.brand-grad` (indigo→teal), `.grad-indigo`, `.grad-rose`, `.grad-teal`, `.grad-amber`.
- **Effects:** `.grad-text` (animated gradient headline), `.glass` (frosted card), `.mesh` (soft blob
  backdrop), `.dotgrid` (faint dots), shadows `shadow-sm | shadow | shadow-lg | shadow-glow`.
- **Motion:** `<Reveal>` for scroll reveals; `animate-fade-up | animate-float | animate-pulse-ring`
  for CSS-only entrances; all auto-disable under "reduce motion".
