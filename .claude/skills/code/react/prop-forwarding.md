# Prop forwarding — always bypass eligible props to the root element

When a component renders a single root HTML element or custom component, it must forward all props the root accepts. Callers should not need to fork the component just to pass `className`, `aria-*`, event handlers, etc.

For HTML root elements use `React.ComponentProps<"tagname">`, extend it with custom props, and spread the rest:

```tsx
// bad — only onClick and children accepted, all other button attrs silently dropped
function NavButton({ onClick, children }: { onClick: () => void; children: ReactNode }) { ... }

// good — every button prop passes through; align is the only custom extension
type NavButtonProps = React.ComponentProps<"button"> & { align?: "left" | "right" };
function NavButton({ align = "left", className, children, ...rest }: NavButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx("base-classes", align === "right" && "items-end", className)}
    >
      {children}
    </button>
  );
}
```

For custom component roots use `React.ComponentProps<typeof ComponentName>`:

```tsx
type CardProps = React.ComponentProps<typeof LayerCard> & { label: string };
function Card({ label, ...rest }: CardProps) {
  return <LayerCard {...rest}>{label}</LayerCard>;
}
```

Rules:
- Spread `...rest` onto the root element
- Put custom `type` / `variant` / other forced defaults **before** `{...rest}` so callers can still override
- Merge `className` via `clsx("base", rest.className)` — destructure it before spreading so it is not applied twice
- With this pattern, `children` is already in `React.ComponentProps` — drop explicit `ReactNode` imports that become redundant
