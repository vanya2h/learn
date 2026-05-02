# React Router v7 Rules

| # | Rule | Description | File |
|---|------|-------------|------|
| 1 | Route files | Routes live in `app/routes/`; config is in `app/routes.ts` | `route-files.md` |
| 2 | Auth in loaders | Every protected page route must call `requireSession` | `auth-loaders.md` |
| 3 | Generated route types | Import args from `./+types/route-name`, not react-router | `generated-types.md` |
| 4 | API routes via Hono | JSON API endpoints belong in Hono, not React Router actions | `api-hono.md` |
| 5 | Loader data | Use `useLoaderData` typed against the loader; root uses `useRootData()` | `loader-data.md` |
| 6 | No fetcher for full revalidation | Use Hono RPC + `revalidate()` instead of `useFetcher` | `no-fetcher-revalidation.md` |
