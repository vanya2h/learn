---
name: job-search
description: >
  Job search agent that uses TheirStack to find new opportunities and generates
  structured lead files. Trigger this skill whenever the user asks to search for
  jobs, find leads, run a job scan, look for openings, find founding engineer or
  tech lead roles, or wants help applying to a position. Also trigger for:
  "what's new on the boards", "find me roles", "help me apply to X", "write a
  cover letter for Y", or any mention of job hunting, career moves, or lead
  tracking. Always use this skill when job search topics come up — don't try to
  improvise the workflow without it.
---

# Job Search Agent

You are running a personal job search agent. Your job is to fetch new listings,
save them to the registry, then review them one at a time with the user.

Load the candidate's profile from `profile.md` at the repo root. It points to
the `profile/` folder — read target roles, tech stack, and preferences before
starting the review loop.

---

## Step 1 — Fetch new jobs

```bash
cd packages/job-search && pnpm run fetch 2>/dev/null
```

- **First run:** fetches jobs posted in the last 30 days.
- **Subsequent runs:** fetches only jobs discovered since the last run (incremental).
- New jobs are automatically appended to the registry (`.data/jobs-*.json`).
- stdout is the batch of new `JobListing[]` objects. Count them to report to the user.

**If stdout is `[]` or the count command returns 0:**
```bash
cd packages/job-search && pnpm run count 2>/dev/null
```
Read `.data/state.json` for `last_fetched_at` and tell the user:
"No new jobs since [date]. Registry has X total unreviewed jobs — continue reviewing?"

**If the fetch fails:** report the error and stop.

---

## Step 2 — Review loop

After fetching, immediately start the review loop. Continue until the user stops
or `next-job` returns `null`.

### 2a — Get next unprocessed job

```bash
cd packages/job-search && pnpm run next-job 2>/dev/null
```

Outputs a single `JobListing` as JSON, or `null` if the registry has no more
unprocessed jobs.

If `null`: tell the user "All jobs reviewed." and stop.

### 2b — Present the job

Use the job's structured fields. Do NOT summarize the raw description with your
own words at this point — show what the data contains. Format:

```
────────────────────────────────────────
Company Name · Role Title
[Remote] · [$X–$Y] · [domain tags from raw_text]
Posted: [posted_at]    ID: [id]
URL: [url]

[raw_text — truncated to ~400 chars if long]
────────────────────────────────────────
Approve or reject?
```

Show the `raw_text` as-is. The user knows the candidate's profile — they make
the call. Do not add a "why it fits" analysis at this step.

### 2c — Process the user's answer

**User says yes / approve / looks good / y:**
```bash
cd packages/job-search && pnpm run approve <id>
```
Then proceed to Step 3 (generate lead file for this job), then continue the loop.

**User says no / reject / pass / n:**
```bash
cd packages/job-search && pnpm run reject <id>
```
Continue the loop — get the next job.

**User says stop / enough / that's all:**
Stop the loop. Tell the user how many were approved and how many rejected this session.

---

## Step 3 — Generate lead file (on approval only)

Generate a lead file immediately after the user approves a job.

### Check for duplicates first
Search `leads/` for any existing `.md` file mentioning the same company and role.
If found, tell the user and skip creation.

### File naming
`leads/YYYY-MM-DD_company-name_role-slug.md`
- All lowercase, hyphens only, no special characters
- Max ~30 chars per segment — `leads/2025-01-15_uniswap_tech-lead.md`

### File content
Use the template in `.claude/skills/job-search/references/lead_template.md`.
**This is the only step where you process the job with LLM analysis** — extract
salary, domain, responsibilities, and write a brief notes section.
Leave `applied:` and `follow_up:` blank.

After creating the file, confirm to the user and continue the review loop.

---

## Updating Filters

When the user wants to adjust what gets included or excluded, edit:
`packages/job-search/src/providers/theirstack/config.ts`

| Constant | Effect |
|---|---|
| `JOB_TITLES` | Title patterns to match |
| `TECH_SLUGS` | Technology slugs required |
| `SENIORITY_LEVELS` | Seniority values to include |
| `EXCLUDED_TITLE_PATTERNS` | Regex patterns to reject by title |
| `EXCLUDED_DESCRIPTION_PATTERNS` | Regex patterns to reject by description |
| `DESCRIPTION_KEYWORDS` | Keywords that make a job eligible |
| `DAYS_BACK` | First-run lookback window (default: 30) |
| `PAGES_TO_FETCH` | Max API pages per run, 25 jobs each (default: 2) |

Changing any constant resets the cursor — the next fetch will behave like a
first run (last 30 days) under the new filters.

---

## Notes

- Don't invent salary data — if not listed, mark as "not listed"
- `.data/` is the persistent registry — don't delete it between runs
- Job statuses: `not_processed` (default) → `approved` or `rejected`
