# No fetcher for mutations that need full revalidation

Use the Hono RPC client via `useProgress()` for mutations that need to re-run all loaders after. Don't reach for `useFetcher` just to avoid a page reload — `revalidate()` is cheaper and keeps the data consistent.
