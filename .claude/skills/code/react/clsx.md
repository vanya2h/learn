# Conditional class names — use clsx

Never use template-literal ternaries for conditional Tailwind classes. Always use `clsx`:

```tsx
// bad
className={`base-classes ${condition ? "a" : "b"}`}
className={`base-classes ${condition ? "" : "hidden"}`}

// good
className={clsx("base-classes", condition ? "a" : "b")}
className={clsx("base-classes", !condition && "hidden")}
```

Import: `import clsx from "clsx";`
