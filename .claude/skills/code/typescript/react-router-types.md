# React Router generated types

For route loader/action args always import the generated types:

```ts
import type { Route } from "./+types/route-name";

export async function loader({ request, params }: Route.LoaderArgs) { ... }
```

Run `react-router typegen` (via `pnpm --filter web run typecheck`) before using these types — they are generated, not hand-written.
