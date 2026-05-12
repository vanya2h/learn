Update an existing PR description to reflect new commits that haven't been pushed yet.

## Steps

### 1. Verify PR exists

Run in parallel:

- `gh pr view --json number,title,body,url,baseRefName` — get the current PR details
- `git status` — confirm working tree state
- `git log --oneline @{u}..HEAD` — commits not yet pushed to remote

If no PR is found, tell the user and stop.
If there are no unpushed commits, tell the user there's nothing new to update and stop.

### 2. Understand the new changes

- `git diff @{u}..HEAD` — full diff of unpushed commits
- `git log @{u}..HEAD --format='%h %s'` — list of new commit messages

If the diff is very large, use `--stat` first and then read diffs for the most important files individually.

### 3. Analyze the new changes

Understand what the new commits add on top of the existing PR:

- What new feature, fix, or improvement do they introduce?
- Do they change the scope or purpose of the PR?
- Any new breaking changes, migrations, or notable decisions?

### 4. Update changeset if needed

Check if the new commits affect any published packages:

```bash
git diff @{u}..HEAD --name-only
```

Map changed files to packages by their directory prefix:

| Directory prefix  | Package name |
| ----------------- | ------------ |
| `packages/web/`   | `web`        |

Also check what packages are already covered by existing changesets. Look at all `.changeset/*.md` files (excluding `README.md`) already tracked or staged in the branch:

```bash
git diff origin/develop...HEAD --name-only -- '.changeset/*.md'
```

Read any existing changeset files to see which packages and bump types they already cover.

**If new commits affect published packages that are NOT covered by an existing changeset:**

1. Ask the user for the bump type (`patch`, `minor`, or `major`) for the newly affected packages. Explain briefly what changed to help them decide.
2. Either:
   - **Update the existing changeset file** to add the new packages to the frontmatter and update the summary, OR
   - **Create a new changeset file** at `.changeset/<random-slug>.md` if it's cleaner to keep them separate.

   Changeset format:

   ```
   ---
   "<package-name>": <bump-type>
   ---

   <one-line summary of the change>
   ```

3. Stage and commit the changeset change before pushing.

**If new commits change the scope of already-covered packages** (e.g., what was a `patch` now warrants a `minor`):

1. Ask the user if they want to update the bump type.
2. If yes, update the existing changeset file accordingly.
3. Stage and commit the changeset change before pushing.

If no published packages are newly affected and existing changesets are still accurate, skip this step.

### 5. Draft the updated PR description

Start from the existing PR body. Update it to incorporate the new changes:

- Update the **Summary** if the scope has changed
- Add new items to **What changed** for the new commits
- Update **How to test** if new test scenarios are needed
- Add or update **Notes** if there are new trade-offs or follow-up items

Present the updated description to the user for approval using AskUserQuestion.

### 6. Push and update

After the user approves:

```bash
git push origin <current-branch-name>
gh pr edit <number> --body "$(cat <<'EOF'
<updated body>
EOF
)"
```

Optionally update the PR title if the scope has meaningfully changed (ask the user first).

### 7. Return the PR URL to the user.

## Guidelines

- Preserve the original PR description structure and tone — extend it, don't rewrite from scratch.
- Be concise but thorough — the updated description should reflect the full scope of the PR including new changes.
- If new changes are minor (typos, lint fixes), a small addition to "What changed" is enough — don't over-describe.
- Do NOT include `Co-Authored-By` lines or metadata in the PR body.
