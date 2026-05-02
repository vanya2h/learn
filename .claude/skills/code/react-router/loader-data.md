# Loader data in components

Use `useLoaderData` typed against the loader:

```ts
const data = useLoaderData<typeof loader>();
```

For root loader data use `useRootData()` (wrapper around `useRouteLoaderData("root")`).
