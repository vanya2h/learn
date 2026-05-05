# Use Base UI components

UI primitives come from [Base UI](https://base-ui.com) — unstyled, accessible React headless components. The package is `@base-ui-components/react` (note: not `@base-ui/react` as some older docs show).

## Step 1 — check for an existing local wrapper

Local styled wrappers live in [packages/web/src/components/ui/](packages/web/src/components/ui/). Always check there first:

```
Badge, Breadcrumbs, Button, Dialog, Input, Menu, Meter, Spinner
```

Prefer these over importing Base UI directly — they encode the project's Tailwind theme (focus rings, borders, transitions, dark/light tokens).

## Step 2 — if no wrapper exists, add one

Don't sprinkle raw `@base-ui-components/react/*` imports across feature components. Add a thin wrapper under `src/components/ui/<Name>.tsx` that:

- Imports the primitive from its sub-path: `import { Dialog as BaseDialog } from "@base-ui-components/react/dialog"`
- Exports a single object grouping the sub-components, or a single component for atomic primitives
- Uses `clsx("base classes", className)` to merge incoming `className`
- Spreads `...props` (and types props as `ComponentProps<typeof BasePrimitive.X>`) so callers can pass any Base UI prop

Example pattern (atomic — `Button.tsx`):

```tsx
import { Button as BaseButton } from "@base-ui-components/react/button";
import clsx from "clsx";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof BaseButton> & { variant?: Variant; size?: Size };

export function Button({ variant = "secondary", size = "sm", className, ...props }: ButtonProps) {
  return <BaseButton className={clsx("base", VARIANTS[variant], SIZES[size], className)} {...props} />;
}
```

Example pattern (composite — `Dialog.tsx`):

```tsx
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";

const Root = BaseDialog.Root;
const Trigger = BaseDialog.Trigger;
const Close = BaseDialog.Close;

function Popup({ children, className, ...props }: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="..." />
      <BaseDialog.Popup className={clsx("base classes", className)} {...props}>{children}</BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const Dialog = { Root, Trigger, Close, Popup, Title, Description };
```

## Polymorphism — use the `render` prop, not wrapping

Every Base UI component (and our wrappers built on top) accepts a `render` prop. To turn a `Button` into a router link, pass a React Router `<Link>` to `render`:

```tsx
<Button variant="primary" render={<Link to="/curriculum/new" />}>
  <Trans>New Program</Trans>
</Button>
```

Use the same pattern for `Menu.Trigger`, `Tabs.Tab`, `Dialog.Trigger`, etc. when you need them rendered as a different element/component:

```tsx
<Menu.Trigger render={<Button />}>Open</Menu.Trigger>
```

For dynamic render based on internal state, pass a function:

```tsx
<Tabs.Tab render={(p) => <Link to="/foo" {...p} />} />
```

**Never** wrap `<Link>` around `<Button>` — that produces invalid HTML (`<a><button>`). **Never** use `onClick={() => navigate(...)}` on a button for navigation — use `render={<Link />}` instead.

## Available Base UI primitives

If a primitive doesn't exist locally yet, check Base UI before building from scratch. Available components:

- **Forms:** Button, Checkbox, Checkbox Group, Input, Radio, Switch, Toggle, Toggle Group, OTP Field, Number Field, Field, Fieldset, Form
- **Selection:** Select, Combobox, Autocomplete, Slider
- **Indicators:** Progress, Meter, Avatar, Separator, Tooltip, Preview Card
- **Containers:** Accordion, Collapsible, Tabs, Toolbar, Scroll Area
- **Overlays:** Dialog, Alert Dialog, Drawer, Popover, Toast, Menu, Context Menu, Menubar, Navigation Menu

Docs: `https://base-ui.com/react/components/<name>` — e.g. `/dialog`, `/menu`, `/meter`.

## Animation states

Base UI exposes lifecycle data attributes on portaled/animated parts. Use these for enter/exit transitions instead of state libraries:

- `data-[starting-style]` — applied while the element is mounting
- `data-[ending-style]` — applied while the element is closing

Example: `data-[ending-style]:opacity-0 data-[starting-style]:opacity-0` on `Backdrop` / `Popup`.
