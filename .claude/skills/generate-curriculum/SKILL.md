---
name: generate-curriculum
description: >
  Generate a study curriculum from a job posting URL. Fetches the job description,
  extracts technical requirements, and creates a CurriculumDef TypeScript file
  tailored to help the user pass the technical interview. Trigger when the user
  says "generate curriculum for [URL]", "build a study plan for this job",
  "prep me for [URL]", "create interview prep from [link]", or provides a job
  posting URL and wants a learning plan.
argument-hint: <job-posting-url>
---

# Generate Curriculum from Job Posting

Creates a tailored interview-prep curriculum from a job posting URL. The curriculum
helps the user build the knowledge foundation needed to pass the technical interview.

---

## Step 1 — Fetch the Job Posting

Use `WebFetch` to retrieve the page at the provided URL.

Extract from the page:

- **Company name** and **role title**
- **Required skills / technologies** (languages, frameworks, tools, platforms)
- **Nice-to-have skills**
- **Seniority level** (infer from title + requirements if not explicit)
- **Domain context** (fintech, e-commerce, infra, etc.)
- **Interview process details** (if listed — coding rounds, system design, etc.)

If the page content is too sparse (e.g. JavaScript-rendered), tell the user and ask
them to paste the job description directly.

---

## Step 2 — Design the Curriculum

Generate a `CurriculumDef` following the exact type structure in
`packages/web/src/data/types.ts`:

```typescript
type CurriculumDef = {
  id: string;
  name: string;
  description?: string;
  phases: Phase[];
  skills?: Skill[];
};

type Phase = {
  id: string;
  title: string;
  subtitle: string;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  notes?: string;
  estMinutes?: number;
};

type Skill = {
  id: string;
  name: string;
  description: string;
  unlockedBy: { phaseId: string };
};
```

### Curriculum design rules

1. **Phases** map to major knowledge areas extracted from the job posting.
   Order them from foundational to advanced — the user works through them sequentially.

2. **Tasks** are concrete study/practice items. Each task should be:
   - Actionable (not vague — "Read X", "Build Y", "Practice Z pattern")
   - Scoped to a single sitting (30–240 minutes)
   - Titled with enough detail that the user knows exactly what to do

3. **Estimate minutes** realistically. Reading/watching = 60–120 min.
   Hands-on practice/building = 120–240 min. Quick reviews = 30–60 min.

4. **Skills** — one per phase. Each skill represents what the user gains by
   completing that phase.

5. **IDs** — use kebab-case. Prefix task IDs with a short phase abbreviation
   (e.g., `sys-`, `fe-`, `algo-`). Keep IDs unique across the entire curriculum.

6. **Tailor to the job** — don't generate a generic curriculum. If the job
   requires Kubernetes, there should be a Kubernetes phase. If it's a frontend
   role, system design tasks should be frontend-flavored. If the job mentions
   specific tools (Kafka, Redis, GraphQL), include targeted tasks for those.

7. **Include interview-specific phases** — always end with at least:
   - A **mock interview / practice** phase
   - A **company research** phase (understand the product, read eng blog, etc.)

8. **Phase count**: aim for 4–7 phases. **Task count per phase**: 4–8 tasks.

### Reference

Use `packages/web/src/data/curriculums/interview-prep.ts` as a style reference
for tone, task granularity, and structure. Do NOT copy its content — generate
fresh content tailored to the specific job.

---

## Step 3 — Derive the file name

Derive a slug from the company name and role:
`{company}-{role-slug}.ts` — all lowercase, hyphens only.

Example: `stripe-senior-frontend.ts`, `vercel-fullstack-engineer.ts`

---

## Step 4 — Write the curriculum file

Write the TypeScript file to:
`packages/web/src/data/curriculums/{slug}.ts`

Follow the exact export pattern from existing curriculum files:

```typescript
import type { CurriculumDef, Phase } from "../types";

const PHASES: Phase[] = [
  // ... phases here
];

export const {CONST_NAME}: CurriculumDef = {
  id: "{slug}",
  name: "{Company} — {Role Title} Prep",
  description: "...",
  phases: PHASES,
  skills: [
    // ... skills here
  ],
};
```

The const name should be UPPER_SNAKE_CASE derived from the slug,
suffixed with `_CURRICULUM` (e.g., `STRIPE_SENIOR_FRONTEND_CURRICULUM`).

---

## Step 5 — Register the curriculum

Edit `packages/web/src/data/curriculum.ts`:

1. Add an import for the new curriculum file.
2. Add the exported const to the `CURRICULUMS` array.

---

## Step 6 — Validate

Run:

```bash
pnpm --filter web run typecheck
pnpm run lint:fix
```

Both must pass with no errors. Fix any issues before finishing.

---

## Step 7 — Present to the user

Show a summary:

- Company + role
- Number of phases and total tasks
- Estimated total hours
- List of phase titles

Tell the user the curriculum is live and they can view it on the dashboard.
