# No re-exports

Import from the canonical source directly. Never re-export a type or value just to proxy it through another module:

```ts
// bad — useProgress.ts re-exporting StepKey it didn't define
export type { StepKey } from "../lib/phase";

// good — import from lib/phase wherever StepKey is needed
import type { StepKey } from "../lib/phase";
```
