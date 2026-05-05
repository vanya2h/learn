---
name: code
description: >
  Project-specific coding standards for the dashboard monorepo. Invoke before making any code changes.
  Loads only the rule files relevant to what is being changed: CSS/Tailwind, TypeScript, React components,
  or React Router routes.
---

# Code Standards

Before writing any code, load the rules that apply to this task using the two-step lookup below.

## Step 1 — Read the index files

Read **only** the `_index.md` files for the domains that apply to this task:

| Domain | Index file | When to read |
|---|---|---|
| CSS / Tailwind | `.claude/skills/code/css/_index.md` | Any `.css` file or Tailwind class changes |
| TypeScript | `.claude/skills/code/typescript/_index.md` | Any `.ts` or `.tsx` file |
| React components | `.claude/skills/code/react/_index.md` | Any component file under `src/components/` or `app/routes/` |
| React Router | `.claude/skills/code/react-router/_index.md` | Any file in `app/routes/` or `app/routes.ts` |
| Forms | `.claude/skills/code/forms/_index.md` | Any form component or form submission handler |

Each index contains a table of rules with one-line descriptions.

## Step 2 — Read only the rules you need

From the index table, identify which specific rules are relevant to the change you are about to make. Read **only** those rule files — do not read the entire set.

Rule files live in subdirectories next to this file:
- `.claude/skills/code/css/<rule>.md`
- `.claude/skills/code/typescript/<rule>.md`
- `.claude/skills/code/react/<rule>.md`
- `.claude/skills/code/react-router/<rule>.md`
- `.claude/skills/code/forms/<rule>.md`

## Definition of Done

Every task is complete only after both pass with no errors:

```bash
pnpm --filter web run typecheck
pnpm run lint:fix
```

Run these at the end and fix any errors before reporting done.
