# Use Kumo UI components

Before building any UI primitive, check if Kumo has it:

```bash
npx @cloudflare/kumo ls          # list all available components
npx @cloudflare/kumo doc <Name>  # props and examples for a specific component
```

Components available in `@cloudflare/kumo`: Badge, Button, LayerCard, Meter, Tabs, Dialog, Tooltip, Table, and many more.

Import from the sub-path, not the barrel:
```tsx
import { Meter } from "@cloudflare/kumo/components/meter";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
```

Use `Text` for all typographic elements. Note: `Text` does **not** accept `className` or `style` — wrap it in a `div`/`span` for spacing or layout classes:

```tsx
<div className="mb-4">
  <Text variant="heading3" as="h2">Section title</Text>
</div>
```

Use heading variants (`heading1`, `heading2`, `heading3`) for all headers — never `secondary` with a `size` prop. The `size` prop only applies to body/secondary/success/error variants.

Use `LayerCard` idiomatically with its sub-components:
```tsx
<LayerCard render={<Link to="/path" />}>
  <LayerCard.Secondary>Label above</LayerCard.Secondary>
  <LayerCard.Primary>
    <p className="text-sm">Body content</p>
  </LayerCard.Primary>
</LayerCard>
```

## No custom implementations of things Kumo provides

- Progress bar -> `Meter`
- Loading state -> `Loader`
- Notification -> `Toasty`
- Status chip -> `Badge`
