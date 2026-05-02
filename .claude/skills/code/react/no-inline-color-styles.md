# No inline styles for colors

Never use `style={{ color: '...' }}` or `style={{ background: '...' }}` for theme colors. Always use Tailwind utilities backed by CSS variables.

Follow the CSS theme-colors rule — use `text-foreground`, `text-muted-foreground`, etc. Never write neutral gray pairs inline.
