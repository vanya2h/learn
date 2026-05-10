# Discriminated unions via keyed object lookup

When defining a discriminated union where each variant carries different fields, prefer the keyed-object lookup pattern over hand-written `|` chains. Each variant lives under its discriminator key and the union is produced by indexing with the discriminator type.

```ts
// bad — discriminator repeated, no easy way to narrow to a single variant
export type IPendingStatus<T> =
  | { status: "pending" }
  | { status: "rejected"; error: unknown; onReload: () => void }
  | { status: "fulfilled"; value: T };

// good — variants live under their key, K narrows to a single one when needed
type Status = "pending" | "rejected" | "fulfilled";

export type IPendingStatus<T, K extends Status = Status> = {
  pending: {
    status: "pending";
  };
  rejected: {
    status: "rejected";
    error: unknown;
    onReload: () => void;
  };
  fulfilled: {
    status: "fulfilled";
    value: T;
  };
}[K];
```

Why this shape:

- **Single source of truth for variants** — adding a new status means adding one key; TypeScript will error if it's missing from the discriminator union.
- **Narrowing via the type parameter** — `IPendingStatus<T, "fulfilled">` resolves to just the fulfilled variant. Callers that already know the state (e.g. inside a branch) can ask for that one shape directly instead of re-narrowing.
- **Default `K = Status`** — unparameterized usage still gives you the full union, so existing call sites stay ergonomic.

Apply this whenever a type has 3+ variants keyed by a string discriminator (request/response states, async results, form steps, message envelopes, etc.). For 2-variant cases, a plain `|` is fine.
