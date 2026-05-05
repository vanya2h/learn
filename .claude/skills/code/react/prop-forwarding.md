# Prop forwarding — exported named props type, forward eligible props to the root

Every component that takes props must:

1. Define its props type as `<ComponentName>Props` and **export** it (so callers can extend or reuse the type).
2. Extend the root element/component's own prop type so all eligible props pass through.
3. Destructure custom props + `className`, then spread `...restProps` onto the root.

Never use a local `type Props = { ... }` and never accept only a hand-picked subset like `{ onClick, children }` — that silently drops every other attribute the root accepts.

## HTML root

Use `React.ComponentProps<"tagname">`:

```tsx
export type NavButtonProps = React.ComponentProps<"button"> & {
  align?: "left" | "right";
};

export function NavButton({ align = "left", className, children, ...restProps }: NavButtonProps) {
  return (
    <button
      type="button"
      {...restProps}
      className={clsx("base-classes", align === "right" && "items-end", className)}
    >
      {children}
    </button>
  );
}
```

## Custom component root

Use `React.ComponentProps<typeof ComponentName>` — or, when the library exports a props type directly (e.g. `LinkProps` from `react-router`), use that.

If the component controls one of the root's props internally, `Omit` it from the forwarded type so callers cannot pass it:

```tsx
import { Link, LinkProps } from "react-router";

export type ProgramCardProps = Omit<LinkProps, "to"> & {
  curriculum: CurriculumDef;
  progress: number;
};

export function ProgramCard({ curriculum, progress, className, ...restProps }: ProgramCardProps) {
  return (
    <Link
      to={`/curriculum/${curriculum.id}`}
      className={clsx("base-classes", className)}
      {...restProps}
    >
      {/* ... */}
    </Link>
  );
}
```

## Rules

- Props type is named `<ComponentName>Props` and is `export`ed. Never `type Props = ...`.
- Extend the root's prop type; `Omit` only the keys the component controls itself (e.g. `to`, `type`, `role`).
- Spread `...restProps` onto the root element.
- Put forced defaults (`type="button"`, internally-computed `to`, etc.) **before** `{...restProps}` so callers can still override anything not omitted from the type.
- Destructure `className` and merge with `clsx("base", className)` — never apply it twice by leaving it in `restProps` and also passing it explicitly.
- `children` is already in `React.ComponentProps` — drop redundant `ReactNode` imports.
