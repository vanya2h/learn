# Adding new tokens

If you need a new semantic color not in the existing token table, add it to both places:

1. Define the CSS variable in `src/index.css` under `:root {}` and `.dark {}`
2. Register it under `@theme {}` in the same file:
   ```css
   @theme {
     --color-my-token: var(--my-token);
   }
   ```
