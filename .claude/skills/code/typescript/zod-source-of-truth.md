# Zod as source of truth for runtime-parsed data

Use Zod schemas to define any type that will be parsed from an external or untyped source (DB JSON fields, API responses, `unknown` values). Derive the TypeScript type from the schema with `z.infer` — never maintain a parallel hand-written type.

```ts
// bad — manual type + unsafe cast
export type PersistedPhase = { name: "assessing"; questions: string[] } | ...;
const phase = record?.phaseData as PersistedPhase | null;

// good — schema is the source of truth, type is derived
export const PersistedPhaseSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("assessing"), questions: z.array(z.string()) }),
  ...
]);
export type PersistedPhase = z.infer<typeof PersistedPhaseSchema>;

export function parsePersistedPhase(data: unknown): PersistedPhase | null {
  const result = PersistedPhaseSchema.safeParse(data);
  return result.success ? result.data : null;
}

// usage in loader — broken data becomes null, never throws
const phase = parsePersistedPhase(record?.phaseData);
```

Rules:
- Export both the schema and the `parse*` helper from the same module
- `parse*` functions return `T | null` — callers handle the null case explicitly
- Use `z.record(z.string(), ...)` for record types (JSON keys are always strings)
- Reuse the schema for API input validation (e.g. Hono `zValidator`) — one schema, not two
