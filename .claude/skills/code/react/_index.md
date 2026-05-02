# React Component Rules

| # | Rule | Description | File |
|---|------|-------------|------|
| 1 | Kumo UI components | Always check Kumo before building UI primitives; import from sub-paths | `kumo-components.md` |
| 2 | No inline color styles | Never use `style={{ color }}` — use Tailwind utilities with CSS variables | `no-inline-color-styles.md` |
| 3 | Conditional classes (clsx) | Use `clsx()` instead of template-literal ternaries for conditional Tailwind | `clsx.md` |
| 4 | Prop forwarding | Forward all eligible props to the root element via spread | `prop-forwarding.md` |
| 5 | Component ordering | Main exported component first, helpers below in order of first use | `component-ordering.md` |
| 6 | No describing comments | Only comment the *why*, never describe what code does | `no-describing-comments.md` |
