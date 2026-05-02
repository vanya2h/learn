# Dictionaries / const maps

Use `as const satisfies` instead of an explicit type annotation on const object literals. This preserves narrow literal types while still validating the shape at compile time:

```ts
// bad — values widened to string, no narrow inference
const PHASE_ROUTES: Record<PhaseName, string> = { assessing: "assess", ... };

// good — values stay as literal types, shape still checked
const PHASE_ROUTES = {
  assessing: "assess",
  ...
} as const satisfies Record<PhaseName, string>;
```
