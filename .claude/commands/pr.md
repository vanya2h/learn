Analyze the current changes, create a branch with a meaningful name, and open a PR against `develop` with a short, focused description.

## Steps

### 1. Understand the current state

First, fetch the latest remote state:

- `git fetch origin develop`

Then run these in parallel:

- `git status` — see staged, unstaged, and untracked files
- `git diff --stat` — overview of unstaged changes
- `git diff --cached --stat` — overview of staged changes
- `git log origin/develop..HEAD --oneline` — commits already on this branch (if any)
- `git stash list` — check for stashed work (informational only)

### 2. Gather the full diff against `develop`

- `git diff origin/develop...HEAD` — code already committed on this branch vs develop
- `git diff HEAD` — unstaged local changes not yet committed
- `git diff --cached` — staged changes not yet committed

If the combined diff is very large, use `--stat` first and then read diffs for the most important files individually.

### 3. Analyze changes holistically

Understand the _purpose_ and _impact_ of the work — don't just list files. Identify:

- What feature, fix, or refactor this represents
- Which domains/areas of the codebase are affected
- Any breaking changes, migrations, or notable technical decisions

### 4. Derive a branch name

Based on the analysis, pick a short, descriptive branch name in kebab-case that captures the intent. Examples:

- `feat/fraction-sale-create-flow`
- `fix/wallet-balance-overflow`
- `refactor/project-sidebar-aggr`
- `chore/update-chain-configs`

Use one of these prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`.

### 5. Generate changeset if needed

Check if any workspace packages have changed files relative to `develop`:

```bash
git diff origin/develop...HEAD --name-only
```

Map changed files to packages by their directory prefix:

| Directory prefix  | Package name |
| ----------------- | ------------ |
| `packages/web/`   | `web`        |

If any packages have changed **and** there is no existing `.changeset/*.md` file (excluding `README.md`):

1. Ask the user for the bump type: `patch`, `minor`, or `major`. Explain briefly what changed to help them decide.
2. Generate a changeset file at `.changeset/<random-slug>.md` with this exact format:

   ```
   ---
   "<package-name>": <bump-type>
   ---

   <one-line summary of the change>
   ```

   Example:

   ```
   ---
   "web": minor
   ---

   Add activity heatmap and specialization selector
   ```

   Use a random two-word slug for the filename (e.g., `brave-foxes.md`, `tall-rivers.md`).

3. Stage the changeset file so it is included in the commit.

If only CI, docs, or root config files changed, skip this step entirely.

### 6. Commit uncommitted changes

If there are any staged or unstaged changes that haven't been committed yet:

1. Determine logical groupings (prefer a single commit if changes are related).
2. Stage specific files — never use `git add -A` or `git add .`.
3. Commit with a short conventional commit message (no body, no co-author trailer).
4. Confirm with `git status` after.

Skip this step if working tree is clean and all changes are already in commits.

### 7. Create and push the branch

```bash
git checkout -b <branch-name>
git push -u origin <branch-name>
```

If already on a non-`develop`/non-`main` branch, skip `checkout -b` and just push.

### 8. Open the PR

Use `gh pr create` with base `develop`:

```bash
gh pr create \
  --title "<Conventional title: type(scope): description>" \
  --base develop \
  --body "$(cat <<'EOF'
<2-3 sentences max. What changed and why — only what a reviewer needs to know. Skip if the title is self-explanatory.>

> **Notes:** <one line — breaking changes, migrations, or non-obvious trade-offs only. Omit entirely if nothing notable.>
EOF
)"
```

### 9. Return the PR URL to the user.

## Guidelines

- Keep the body under 5 lines. The title carries the message; the body is for things the title can't fit.
- Only add a Notes line when there is a genuine gotcha: a breaking change, a required migration step, or a non-obvious trade-off.
- Do NOT include `Co-Authored-By` lines or metadata in the PR body.
