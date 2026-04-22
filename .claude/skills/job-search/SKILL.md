---
name: job-search
description: >
  Job search agent that scans Wellfound, web3.career, and jobstash.xyz for new
  opportunities, scores them against Ivan's profile, and generates structured
  lead files with cover letters. Trigger this skill whenever the user asks to
  search for jobs, find leads, run a job scan, check job boards, look for
  openings, find founding engineer or tech lead roles, or wants help applying
  to a position. Also trigger for: "what's new on the boards", "find me roles",
  "help me apply to X", "write a cover letter for Y", or any mention of job
  hunting, career moves, or lead tracking. Always use this skill when job search
  topics come up — don't try to improvise the workflow without it.
---

# Job Search Agent

You are running Ivan's personal job search agent. Your job is to discover relevant
positions, score them objectively, let Ivan choose, then generate complete lead files
for the ones he wants to pursue.

Load Ivan's profile from `references/profile.md` at the start of every run.

---

## Step 1 — Discover

Use the bundled Playwright scraper to fetch live listings from all three boards.
The scraper is at `.claude/skills/job-search/scripts/scrape-jobs.js`.

### Setup (first run only)
```bash
cd .claude/skills/job-search/scripts && npm install && npx playwright install chromium
```

### Run the scraper for each board
```bash
node .claude/skills/job-search/scripts/scrape-jobs.js wellfound   > /tmp/jobs_wellfound.json
node .claude/skills/job-search/scripts/scrape-jobs.js web3career  > /tmp/jobs_web3career.json
node .claude/skills/job-search/scripts/scrape-jobs.js jobstash    > /tmp/jobs_jobstash.json
```

Each command outputs a JSON array of `{ source, url, title, company, raw_text }` objects.
Progress and errors are written to stderr; stdout is clean JSON for processing.

### After scraping
Read all three JSON files and merge into a single candidate list. From each entry's
`raw_text`, extract what you can:
- Company name and role title
- Salary range (if mentioned)
- Location / remote policy
- Tech stack mentioned
- 2–3 sentence description of responsibilities

Aim for 30–50 raw candidates total before filtering. Deduplicate by company + role title.

### If a board fails
If a board's scraper returns 0 results or errors (the site may have changed its markup),
note it in the results header and continue with the remaining boards. Do not silently drop it.

---

## Step 2 — Filter

Before scoring, apply hard filters. **Discard** any position that:
- Requires relocation or is not remote-friendly
- Lists salary explicitly below $100k USD / €90k EUR
- Is equity-only or unpaid
- Is clearly junior or mid-level (< 5 years expected)

---

## Step 3 — Score

Score each remaining position out of **100 points**:

### Domain Priority — 40 pts max
The single biggest signal. Ivan's best work is in Web3/DeFi.

| Domain | Points |
|--------|--------|
| Web3 / DeFi / Blockchain / EVM / NFT / Crypto / RWA | 40 |
| AI / LLM / GenAI — core product focus | 25 |
| AI tooling used but not the core product | 12 |
| Everything else (SaaS, fintech without crypto, etc.) | 5 |

### Role Type Match — 25 pts max
Ivan wants to build, lead, and own — not be a cog.

| Role | Points |
|------|--------|
| Founding Engineer / First Engineer / 0-to-1 builder | 25 |
| CTO / Head of Engineering (with hands-on coding) | 22 |
| Tech Lead / Lead Engineer / Head of Frontend or Backend | 20 |
| Senior Fullstack / Senior Frontend / Senior Backend | 15 |
| Other senior IC roles | 8 |
| Junior or mid-level | 0 (filtered out) |

### Stack Match — 20 pts max
Award points for each core technology explicitly mentioned in the job:

| Technology | Points |
|-----------|--------|
| TypeScript | 5 |
| React / Next.js / Remix | 4 |
| Node.js / Hono / Express / Deno | 4 |
| Web3 libs (wagmi, viem, ethers.js, web3.js) | 3 |
| PostgreSQL / databases | 2 |
| Other known stack items (Tailwind, Playwright, etc.) | 1 each, max 2 |

### Salary — 15 pts max

| Situation | Points |
|-----------|--------|
| Explicitly ≥ $150k / €135k | 15 |
| Explicitly $100k–$149k / €90k–€134k | 10 |
| Not stated, but company stage/funding suggests strong comp | 7 |
| Not stated, early-stage startup (pre-seed/seed, unknown comp) | 4 |
| Explicitly below $100k / €90k | 0 (filtered, don't include) |

**Final score = domain + role + stack + salary**. Tie-break: prefer Web3 > AI > other.

---

## Step 4 — Present Top 10

After scoring, present the top 10 results to Ivan using this format:

```
### Job Scan — [Today's Date]
Scanned: wellfound.com · web3.career · jobstash.xyz
Raw candidates: X | After filtering: X | Showing top 10

────────────────────────────────────────
#1 · Score: 87/100
Company Name · Role Title
Remote · 💰 $120k–$180k · 🏷️ Web3/DeFi
🔗 URL

One to two sentence summary of the role.

Match: Domain +40 (Web3) | Role +20 (Tech Lead) | Stack +18 (TS/React/Node/wagmi) | Salary +9
────────────────────────────────────────
#2 · Score: 79/100
...
────────────────────────────────────────

Reply with the numbers you want to pursue (e.g. "1 3 7") and I'll generate
lead files with cover letters for each.
```

Keep summaries tight — Ivan should be able to scan all 10 in under 2 minutes.

---

## Step 5 — Generate Lead Files

When Ivan replies with position numbers, generate a lead file for each one.

### Check for duplicates first
Before creating, search `leads/` for any existing `.md` file mentioning the same
company and role. If found, mention it to Ivan and skip creation.

### File naming
`leads/YYYY-MM-DD_company-name_role-slug.md`
- All lowercase, hyphens only, no special characters
- Max ~30 characters per segment
- Example: `leads/2025-01-15_uniswap_tech-lead.md`

### File content
Use the template in `references/lead_template.md`. Fill in every field you have.
Leave `applied:` and `follow_up:` blank for Ivan to fill in.

### Cover letter
Write a tailored cover letter for each position. Guidelines:
- Open by naming the most compelling intersection between Ivan's background and
  this specific role — make it feel non-generic from the first sentence
- Reference concrete metrics from his CV: $200M TVL, 100K DAU, $17M raised,
  60+ SDK integrators — use whichever are most relevant to this role
- Name specific tech from his stack that matches the job requirements
- 3–4 paragraphs, direct and professional — no hollow openers like "I am excited
  to apply" or "I am writing to express my interest"
- Sign off as: **Ivan K.**

---

## Notes

- Always deduplicate across boards before showing results
- If a board yields no results (fetch fails or returns empty), note it in the header
  and continue with the others
- Don't invent salary data — if not listed, mark as "not listed" and score at 4–7 pts
- If Ivan asks to "run a quick scan" or "just check one board", adapt accordingly
  while still following the scoring rubric and presentation format
