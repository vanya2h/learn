# React Component Rules

For any layout, markup, or visual decision (which element to use, sizing, spacing, hierarchy, composition), read `DESIGN.md` at the repo root before coding — it is the authoritative reference for the project's visual language.

| # | Rule | Description | File |
|---|------|-------------|------|
| 1 | Base UI components | Prefer local wrappers in `src/components/ui/`; build new wrappers on `@base-ui-components/react/*` primitives | `base-ui-components.md` |
| 2 | No inline color styles | Never use `style={{ color }}` — use Tailwind utilities with CSS variables | `no-inline-color-styles.md` |
| 3 | Conditional classes (clsx) | Use `clsx()` instead of template-literal ternaries for conditional Tailwind | `clsx.md` |
| 4 | Prop forwarding | Exported `<ComponentName>Props` type that extends the root's props; spread `...restProps` to root | `prop-forwarding.md` |
| 5 | Component ordering | Main exported component first, helpers below in order of first use | `component-ordering.md` |
| 6 | No describing comments | Only comment the *why*, never describe what code does | `no-describing-comments.md` |
