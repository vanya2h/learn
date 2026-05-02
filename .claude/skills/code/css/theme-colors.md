# Theme colors — never use paired `dark:` overrides for neutral grays

The project has semantic CSS variables registered as Tailwind color utilities in `src/index.css`. Use them instead of `text-neutral-X dark:text-neutral-Y` pairs.

## Available tokens

| Token | Use for |
|---|---|
| `text-foreground` | Primary text — headings, labels, values |
| `text-muted-foreground` | Secondary text — descriptions, captions, section headers |
| `text-foreground/70` | Slightly dimmed interactive text (e.g. hover targets at rest) |
| `text-foreground/40` | Subtle labels, disabled-adjacent text |
| `text-foreground/20` | Locked / inactive states |
| `border-border` | All neutral borders |
| `bg-background` | Page / surface background |
| `bg-muted` | Subtle fill (e.g. card backgrounds, input backgrounds) |
| `bg-muted/50` | Even subtler fill |
| `ring-offset-background` | Ring offset color on focused/highlighted elements |

## Mapping cheat-sheet

| Old pattern | Replace with |
|---|---|
| `text-neutral-900 dark:text-neutral-100` | `text-foreground` |
| `text-neutral-500 dark:text-neutral-400` | `text-muted-foreground` |
| `text-neutral-600 dark:text-neutral-400` | `text-muted-foreground` |
| `text-neutral-400 dark:text-neutral-500` | `text-foreground/40` |
| `text-neutral-400 dark:text-neutral-600` | `text-foreground/40` |
| `text-neutral-300 dark:text-neutral-700` | `text-foreground/20` |
| `hover:text-neutral-700 dark:hover:text-neutral-300` | `hover:text-foreground/70` |
| `border-neutral-200 dark:border-neutral-800` | `border-border` |
| `bg-neutral-50 dark:bg-neutral-900/40` | `bg-muted/50` |
| `dark:ring-offset-neutral-950` | `ring-offset-background` |

## Exception

Intentionally semantic colors (green for success, red for error, etc.) keep their `dark:` variants — they encode meaning, not just theme adaptation.

```tsx
// OK — encodes semantic state
"border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/60"

// NOT OK — pure theme adaptation
"text-neutral-500 dark:text-neutral-400"
```
