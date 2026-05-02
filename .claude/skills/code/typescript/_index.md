# TypeScript Rules

| # | Rule | Description | File |
|---|------|-------------|------|
| 1 | Prisma client import | Import from `@prisma/client-generated`, not `@prisma/client` | `prisma-import.md` |
| 2 | Prisma singleton | Use `db` from `src/server/db.ts`, never `new PrismaClient()` | `prisma-singleton.md` |
| 3 | No `any` | Use `unknown` and narrow instead of `any` | `no-any.md` |
| 4 | Type-only imports | Always use `import type` for type-only imports | `type-only-imports.md` |
| 5 | Const maps | Use `as const satisfies` for dictionary/const map literals | `const-maps.md` |
| 6 | No re-exports | Import from canonical source; never proxy re-export | `no-re-exports.md` |
| 7 | Exhaustive unions | Always add `default: never` branch when switching on unions | `exhaustive-unions.md` |
| 8 | Zod as source of truth | Use Zod schemas + `z.infer` for runtime-parsed data | `zod-source-of-truth.md` |
| 9 | React Router generated types | Import `Route.LoaderArgs` etc. from generated `+types/` files | `react-router-types.md` |
