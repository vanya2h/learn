# Use `parseResponse` for Hono RPC calls

For HTTP requests via the Hono RPC client (`hc<AppType>(...)` / `apiClient`), use `parseResponse` from `hono/client` instead of manually checking `res.ok` and reading `res.json()`. It returns the typed success body and throws `DetailedError` on non-2xx; `err.detail.data` holds the parsed error JSON (e.g. `{ error: string }`).

```ts
// bad — manual ok-check + cast
const res = await client.api.curriculums.$post({ json: payload });
if (!res.ok) {
  setError(t`Failed to save`);
  return;
}

// good — parseResponse throws on non-2xx, returns typed body
import { parseResponse } from "hono/client";

await parseResponse(client.api.curriculums.$post({ json: payload }));
```

## Streaming endpoints

`parseResponse` consumes the body unconditionally. For endpoints whose success path is a stream (SSE, `text/event-stream`), guard it behind `!res.ok` so the body stays readable on success:

```ts
const res = await client.api.curriculums.generate.$post({ json: payload });
if (!res.ok) await parseResponse(res); // throws DetailedError
// res.body is still unconsumed — proceed to stream it
for await (const delta of readSSEStream(res.body)) { ... }
```

## Extracting the server error message

```ts
import { DetailedError, parseResponse } from "hono/client";

try {
  await parseResponse(client.api.foo.$post({ json: payload }));
} catch (err) {
  const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
  setError(data?.error ?? t`Generic fallback`);
}
```
