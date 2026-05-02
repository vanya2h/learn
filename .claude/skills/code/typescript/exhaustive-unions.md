# Exhaustive union handling

When switching over a union type, always add a `default` branch that assigns to `never`. This causes a compile error if a new union member is added without updating the switch:

```ts
// bad — silent at compile time if a new case is added
switch (session.name) {
  case "study": return "Study";
  case "hands-on": return "Practice";
  // forgot "feedback" — no error
}

// good — compile error if any case is missing
switch (session.name) {
  case "assessing":   return "Assessing";
  case "gaps-review": return "Assessment done";
  case "study":       return "Study";
  case "hands-on":    return "Practice";
  case "feedback":    return "Feedback";
  case "write-up":    return "Write-up";
  default: {
    const _exhaustive: never = session.name;
    return _exhaustive;
  }
}
```

Apply this pattern whenever branching on a discriminated union (phase names, status enums, action types, etc.).
