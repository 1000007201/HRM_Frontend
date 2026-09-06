# CLAUDE.md — HRM Portal (Frontend)

Project memory for Claude Code. Read this before making changes.

## What this is

Web client for a **multi-tenant HRM SaaS** for Indian SMEs (employee directory,
attendance, leave, salary, payroll, employee self-service). It's a dashboard-
style SPA behind authentication — not a public/marketing site.

- **Solo developer.**
- **Backend is a SEPARATE repo** (Fastify + Prisma + Better Auth API). This repo
  is UI-only and talks to that API over HTTP. Do not add server/DB code here.
- Current phase: **Stage 0 / early Stage 1**. Keep scope tight.

## Tech stack (decided — do not substitute)

- **React** + **Vite** + **TypeScript**
- **Tailwind CSS** for styling
- Auth via **Better Auth** — use its React client (`better-auth/react`) to talk
  to the backend's `/api/auth/*` endpoints. Do not build a custom auth layer.

> Next.js was explicitly ruled out — this is a client-rendered SPA behind login,
> so SSR/SEO aren't needed. Keep it a Vite SPA.

- **Routing: React Router.** Public routes (login, forgot-password,
  reset-password, register-company, accept-invitation) + protected routes behind
  an auth gate (a `ProtectedRoute` wrapper that reads the session).
- **Data fetching / server state: TanStack Query.** All server data goes through
  query/mutation hooks over a typed fetch wrapper (credentials included, base URL
  from `VITE_API_URL`). Invalidate queries after mutations.
- **Forms + validation: React Hook Form + zod.** Zod schemas mirror the backend
  validation (e.g. password min 10). Show inline field errors + a form-level
  error for server failures.
- **Components / styling: custom Tailwind components on the design tokens below.**
  No external UI kit yet; shadcn/ui is the candidate if a kit is wanted later —
  decide before scattering ad-hoc component patterns.

## Design tokens (coffee theme — do not invent new colors)

Defined once as CSS variables in `src/index.css` (Tailwind v4 `@theme`).
Components reference the semantic utility classes (`bg-primary`, `text-ink`,
`border-border`, ...) — never raw hex, never a component-local color.

- Canvas (page bg) `#FBFAF8`. Panel/card/sidebar `#FFFFFF`. Border `#EFEAE4`.
- Primary (coffee) `#8A5D3B`, hover `#754C2E` — buttons, links, key actions.
- Accent (apricot) `#E0A878` — avatars, chart fills, focus rings, highlights.
  Text placed on accent must be dark (`text-ink`), not white — white-on-accent
  is ~2:1 contrast.
- Active nav pill: bg `#F6E7DD`, ink = `primary` (`#8A5D3B`). The originally
  specced ink `#9A6A45` measured ~3.85:1 on that bg (below AA); reusing
  `primary` hits ~4.7:1.
- Row hover tint `#F5ECE3`.
- Text: ink (headings) `#3F3128`, ink-2 (body) `#6F6156`, muted `#7D7062`.
  Muted was speced as `#A89A8D` but that's ~2.7:1 on white and muted is used
  as real label/empty-state text (not just decorative) — darkened to ~4.8:1.
- Role pills (ADMIN/HR/MANAGER/EMPLOYEE): neutral-warm, bg `#F1ECE5`, ink
  `#8A6F57` (`neutral-ink`). Keep role pills neutral — the coffee/primary
  color stays reserved for actions.
- Status (leave + attendance badges, attendance calendar) — kept mutually
  distinguishable and harmonized to the warm palette. Measured contrast is
  noted since several sit under the 4.5:1 AA line for normal text at their
  specced values; left as speced (this is a deliberate "keep them visually
  distinct from each other" palette) rather than unilaterally redesigned:
  - success `#3F8F5B` / bg `#E8F2EA` (~3.5:1) — Active / Present / Approved
  - warning `#C98A2E` / bg `#F7ECD6` (~2.5:1) — Half-day / Pending
  - error `#B4472E` / bg `#F6E1DA` (~4.3:1) — Absent / Rejected
  - on-leave `#8A6F57` / bg `#EFE7DF` (~3.8:1) — On leave
  - neutral `#EFEAE4` / ink `#8A6F57` — Holiday / Week off / Cancelled
  If any of these need to hit strict AA, darken that status's ink — same
  approach used for muted/active-pill-ink above.

## Commands

```bash
npm run dev        # Vite dev server (http://localhost:5174, strictPort)
npm run build      # production build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit  (must pass before considering work done)
```

## Talking to the backend

- Backend runs at **http://localhost:4000**; this app runs at
  **http://localhost:5174**. Those origins are wired into the backend's CORS +
  Better Auth `trustedOrigins` (backend `PORT` / `BETTER_AUTH_URL` /
  `FRONTEND_ORIGIN`).
- Put the API base URL in an env var (`VITE_API_BASE_URL`), never hard-code it.
- Auth is **cookie/session based** via Better Auth — send requests with
  credentials included so the session cookie rides along.
- The signed-in user belongs to an **organization** (their company). Most data
  is tenant-scoped on the backend; the UI should assume it only ever sees the
  current org's data.

## Conventions

- **TypeScript strict.** No `any` unless genuinely unavoidable and commented.
- Keep components small and focused; colocate feature code by domain
  (e.g. `src/features/leave/`, `src/features/attendance/`).
- Tailwind utility classes in markup; avoid one-off CSS files unless a pattern
  clearly warrants it.
- Reuse types/validation from the backend where practical — a shared shape for
  `Employee`, `role`, etc. avoids frontend/backend drift.
- Handle the three states for every data view: loading, error, empty.

## Coding standards

Naming:
- **Variables & functions: camelCase.** Start lowercase, capitalize each
  following word — `employeeCount`, `getLeaveBalance`, `handleSubmit`.
- **Types, interfaces, enums, React components: PascalCase** — `Employee`,
  `LeaveRequest`, `EmployeeCard`.
- **Constants (fixed config values): UPPER_SNAKE_CASE** — `MAX_LEAVE_DAYS`,
  `API_TIMEOUT`.
- Booleans read as yes/no questions: `isLoading`, `hasError`, `canEdit`.

Names must be **relevant and descriptive** — the name says what the thing is or
does. No single letters (except loop indices `i`/`j`), no vague names like
`data`, `temp`, `val`, `info`, `handleStuff`. Prefer clarity over brevity:
`pendingLeaveRequests`, not `plr` or `list`.

## Env / secrets

- Only `VITE_`-prefixed vars are exposed to the client — never put real secrets
  in this repo. Anything sensitive stays on the backend.
- Commit `.env.example`, never `.env`.

## Git — never push without being told

**Do not run `git push` unless I explicitly ask for it in that message.**
This is absolute: not after finishing a feature, not after a green build, not
because the work "looks done", and not because I asked you to push something
earlier in the session — permission does not carry over between requests.

Same for `git commit`: only when I ask. Finish the work, leave it in the
working tree, and tell me what's uncommitted. I'll decide when it goes up.

When I *do* ask to push:
- If we're on `main`, say so and ask before branching vs committing directly —
  don't quietly push to a branch I then can't find on GitHub's default view.
- Show me what's staged before committing, and never stage `.env`.

## Before you call a task done

1. `npm run typecheck` passes.
2. `npm run build` succeeds.
3. New config values are added to `.env.example` (with `VITE_` prefix).
4. Report what changed and leave it uncommitted — see the git rule above.

## Don'ts

- Don't switch away from the stack above (no Next.js, no swapping Tailwind).
- Don't implement auth/session logic by hand — use the Better Auth React client.
- Don't call the database or hold secrets here — that's the backend's job.
- Don't add features beyond the current stage without being asked.
- Don't `git push` (or `git commit`) unless I asked in that same message.