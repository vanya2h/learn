# Sheafu.com

Open-source curriculum and study tracker. Defines learning paths, walks through topics step-by-step (assess → study → hands-on → write-up → feedback), and tracks daily progress as an activity heatmap.

Hosted at [learn.vanya2h.me](https://learn.vanya2h.me) — or self-host your own instance.

## Structure

```
dashboard/
├── packages/
│   └── web/                          # Full-stack app
│       ├── app/routes/               # React Router v7 page routes
│       ├── src/data/curriculums/     # Curriculum definitions (interview-prep, ml, ux-design, ...)
│       ├── src/server/               # Hono API, Better Auth, Prisma client
│       └── prisma/schema.prisma      # Postgres schema
└── .claude/skills/                   # Claude Code skills
```

## Self-hosting

Requirements: Node.js, pnpm, Postgres.

```bash
pnpm install
cp .env.example .env                  # fill in DATABASE_URL, BETTER_AUTH_*, ANTHROPIC_API_KEY
pnpm --filter web run db:migrate      # apply schema
pnpm --filter web run dev             # dev server with SSR
```

A `Dockerfile` is included for container deploys.

## Web package

React Router v7 (SSR) + Hono API + Prisma v7 + Better Auth.

```bash
pnpm --filter web run dev         # dev server with SSR
pnpm --filter web run typecheck   # react-router typegen + tsc --noEmit
pnpm --filter web run db:migrate  # prisma migrate dev
pnpm --filter web run db:studio   # Prisma Studio
```

See [CLAUDE.md](CLAUDE.md) for architecture details (routing layers, auth, Prisma setup, UI conventions).

## Curriculums

Learning content is defined statically in `packages/web/src/data/curriculums/`. Each curriculum is a `CurriculumDef` with topics and tasks; task IDs are referenced by the `TaskCompletion` and `DailyActivity` Prisma models. Use the `/generate-curriculum` Claude Code skill to scaffold a new curriculum from a job-posting URL.

## Tooling

- Runtime: Node.js, pnpm workspaces
- Build orchestration: Turborepo
- Auth: Better Auth (email/password)
- Database: Postgres via Prisma v7 + `PrismaPg` adapter
