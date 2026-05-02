# Generated route types

Always import args types from the generated file, not from react-router directly:

```ts
import type { Route } from "./+types/route-name";

export async function loader({ request, params }: Route.LoaderArgs) { ... }
export async function action({ request }: Route.ActionArgs) { ... }
```
