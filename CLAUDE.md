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

## Design tokens (from the dashboard work — do not invent new colors)

- Primary (sky blue): `#1A9FE0`. Ramp: 50 `#E8F4FC`, 100 `#B3DCFA`, 200 `#5BB8F0`,
  300 `#1A9FE0`, 400 `#0C6BA8`.
- Charcoal: `#2C2C2C`. Ramp: 50 `#EAEEF2`, 100 `#C8CDD3`, 200 `#6B6F75`,
  300 `#3D3D3D`, 400 `#2C2C2C`. Used for the sidebar.
- Silver gray page background: `#EAEEF2`. White cards. Black text
  (`#111111`/`#333333`/`#666666`/`#999999`).
- Semantic: success `#16A34A`, warning `#EAB308`, error `#DC2626`, info `#8B5CF6`.

## Commands

```bash
npm run dev        # Vite dev server (default http://localhost:5173)
npm run build      # production build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit  (must pass before considering work done)
```

## Talking to the backend

- Backend runs at **http://localhost:3000**; this app runs at
  **http://localhost:5173**. Those origins are wired into the backend's CORS +
  Better Auth `trustedOrigins`.
- Put the API base URL in an env var (`VITE_API_URL`), never hard-code it.
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

## Before you call a task done

1. `npm run typecheck` passes.
2. `npm run build` succeeds.
3. New config values are added to `.env.example` (with `VITE_` prefix).

## Don'ts

- Don't switch away from the stack above (no Next.js, no swapping Tailwind).
- Don't implement auth/session logic by hand — use the Better Auth React client.
- Don't call the database or hold secrets here — that's the backend's job.
- Don't add features beyond the current stage without being asked.