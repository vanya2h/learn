# Auth in loaders

Every protected page route must call `requireSession` at the top of its loader:

```ts
import { requireSession } from "../../src/server/session";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request);
  // session.user is now available
}
```

`requireSession` redirects to `/sign-in` automatically — no need to handle the unauthenticated case.
