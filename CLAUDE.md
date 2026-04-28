# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Definition of Done

A task is complete only after both pass with no errors:

```
pnpm --filter web run typecheck
pnpm run lint:fix
```

## Commands

```bash
# Root (runs across all packages via Turborepo)
pnpm dev                  # start all dev servers
pnpm build                # production build
pnpm lint                 # lint all packages
pnpm run lint:fix         # lint + auto-fix all packages

# Web package
pnpm --filter web run typecheck   # tsc --noEmit (after react-router typegen)
pnpm --filter web run dev         # Vite dev server with SSR

# Database (run from packages/web or via filter)
pnpm --filter web run db:generate # prisma generate
pnpm --filter web run db:migrate  # prisma migrate dev
pnpm --filter web run db:push     # prisma db push (no migration file)
pnpm --filter web run db:studio   # Prisma Studio UI
```

## Monorepo Structure

Turborepo + pnpm workspaces. Three packages under `packages/`:

| Package | Purpose |
|---|---|
| `web` | Full-stack app — React Router v7 (SSR) + Hono API + Prisma |
| `job-search` | CLI — fetches job leads from TheirStack API |
| `cv` | CLI — generates PDF CV/cover letters via React PDF Renderer |

Environment variables are loaded from a root `.env` file (see `.env.example`). Required vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ANTHROPIC_API_KEY`, `THEIRSTACK_API_KEY`.

## Web Package Architecture

### Routing layers

React Router v7 framework mode (SSR enabled). Two distinct layers share one Node.js server:

1. **Page routes** — `app/routes/*.tsx` with `loader()` / `action()` exports. Route config is in `app/routes.ts`.
2. **API routes** — `app/routes/api.ts` is a React Router wildcard that forwards all `/api/*` requests to a Hono app.

### API (Hono)

- Entry: `src/server/app.ts` — mounts auth and progress routers, sets global error handler.
- Routes: `src/server/routes/` (`chat.ts`, `progress.ts`).
- Public: `/api/auth/**` (Better Auth handles this natively).
- Protected: everything else goes through `requireAuth` middleware (`src/server/middleware/requireAuth.ts`), which reads the Better Auth session from the request.

### Auth (Better Auth)

- Config: `src/server/auth.ts` — `betterAuth` with `prismaAdapter`, email/password, 1-year sessions.
- For page routes: `src/server/session.ts` exports `requireSession()` — call in loaders, redirects to `/sign-in` if unauthenticated.
- For API routes: use the `requireAuth` Hono middleware.
- `auth.api.getSession()` is called independently in both layers (no shared session state).

### Database (Prisma v7)

- Schema: `prisma/schema.prisma`.
- Client generated to `node_modules/@prisma/client-generated` — import as `@prisma/client-generated`, not the standard `@prisma/client`.
- Client singleton: `src/server/db.ts` (cached on `globalThis` in non-production).
- Uses `PrismaPg` adapter with the `pg` driver.

**Progress-tracking models:**
- `TaskCompletion` — which task IDs a user has completed.
- `DailyActivity` — per-date record of `taskIds[]` completed that day (activity heatmap data).
- `Specialization` — user's chosen branch per curriculum.
- `AppSetting` — key/value store (e.g. `startedAt`).

### Client–server data flow

```
Root loader (app/root.tsx)
  → requireSession() + fetch progress from DB
  → returns { user, progress } as root loader data

React components
  → useRootData()         reads root loader data (via useRouteLoaderData("root"))
  → useProgress()         wraps mutations via Hono RPC client (hc<AppType>)
                          calls revalidate() after each mutation to re-run all loaders
```

### Hono RPC client

`src/lib/apiClient.ts` uses `hc<AppType>(origin)` for fully type-safe API calls from the browser. API types are inferred from the Hono app definition — no manual typing needed.

### Curriculum data

Learning content is defined statically in `src/data/curriculum.ts` and `src/data/curriculums/`. Tasks have string IDs referenced by `TaskCompletion` and `DailyActivity` — there is no `tasks` DB table. Task completion intensity (for the heatmap) is derived from `taskIds.length` in `DailyActivity`, not from logged minutes.

### Type-generated files

`react-router typegen` writes to `.react-router/types/` — these are committed-ignored but required for type-checking. Always run `typecheck` (which runs `typegen` first) rather than bare `tsc`.
