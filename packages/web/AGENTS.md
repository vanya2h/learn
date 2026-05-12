# AGENTS.md — Sheafu

## Goal

Build a single-user web app that tracks progress through a structured ML learning curriculum. Three core surfaces:

1. **Curriculum checklist** — hierarchical, with phases and tasks
2. **Activity heatmap** — GitHub-style 53×7 contribution grid
3. **Decision tree** — branching Phase 3 specialization picker

Single-user, client-only, no auth, no backend. Persist everything in `localStorage`.

---

## Tech stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (no UI kit — write components directly)
- **date-fns** for date math
- **zustand** for state (overkill alternatives: Redux, Jotai — don't use them)
- No router needed for v1 (single page with tabs)
- No backend, no API calls, no telemetry

Do not add: shadcn/ui, MUI, Chakra, react-query, Next.js, Prisma, a database, or auth. The whole app should fit in ~500 lines of source.

---

## Data model

```ts
type PhaseId = "phase-0" | "phase-1" | "phase-2" | "phase-3" | "project";

type SpecializationId = "applied-llms" | "trading" | "research";

type Task = {
  id: string; // stable slug
  title: string;
  notes?: string; // optional one-liner
  estMinutes?: number; // rough estimate, used for progress weighting
};

type Phase = {
  id: PhaseId;
  title: string;
  subtitle: string;
  tasks: Task[];
};

type ActivityEntry = {
  date: string; // YYYY-MM-DD, local time
  taskIds: string[]; // tasks completed that day
  minutes: number; // total study minutes logged that day
};

type AppState = {
  completedTaskIds: Record<string, string>; // taskId -> ISO completion timestamp
  activity: Record<string, ActivityEntry>; // date -> entry
  specialization: SpecializationId | null; // chosen Phase 3 branch
  startedAt: string; // ISO date of first interaction
};
```

`localStorage` key: `ml-tracker-v1`. On schema change, bump the suffix and migrate.

---

## UI layout

Single page, three sections stacked vertically. No router.

```
┌─────────────────────────────────────────────────┐
│ Header: title + overall % + streak              │
├─────────────────────────────────────────────────┤
│ Activity heatmap (53 weeks × 7 days)            │
├─────────────────────────────────────────────────┤
│ Curriculum (collapsible phases with checklists) │
│   - Phase 0  [██████░░░░] 60%                   │
│   - Phase 1  [██░░░░░░░░] 20%                   │
│   - Phase 2  ...                                │
│   - Phase 3  → specialization picker            │
│   - Project  → freeform                         │
├─────────────────────────────────────────────────┤
│ Today: "Log study session" (minutes input)      │
└─────────────────────────────────────────────────┘
```

### Components

- `<Header />` — title, overall progress %, current streak (consecutive days with activity)
- `<Heatmap />` — see spec below
- `<Curriculum />` — renders all phases
- `<PhaseCard />` — collapsible, shows progress bar
- `<TaskRow />` — checkbox + title + notes; checking it logs an activity entry for today
- `<SpecializationPicker />` — only visible inside Phase 3 until a choice is made
- `<SessionLogger />` — single number input + "Log" button to add minutes to today

Keep it minimal. No animations beyond Tailwind transitions. No modals.

---

## Activity heatmap spec

Match GitHub's contribution graph behavior closely:

- **Grid**: 53 columns (weeks) × 7 rows (days). Sunday on top.
- **Range**: last 371 days ending today. Trim leading days from the first column so the rightmost column ends on today.
- **Cell**: 11px square, 2px gap. Rounded 2px corners.
- **Intensity buckets** based on `entry.minutes` (or task completions if minutes=0 but tasks were checked):
  - 0 → `bg-neutral-200 dark:bg-neutral-800`
  - 1–29 min → `bg-green-200 dark:bg-green-900`
  - 30–59 min → `bg-green-400 dark:bg-green-700`
  - 60–119 min → `bg-green-600 dark:bg-green-500`
  - 120+ min → `bg-green-700 dark:bg-green-400`
- **Tooltip on hover**: `"{date}: {minutes} min, {n} tasks"`
- **Month labels**: above the grid, aligned with the first week of each month.
- **Weekday labels**: Mon / Wed / Fri on the left.

Implement as plain SVG or CSS grid — don't pull in a chart library.

A task being checked counts as ≥1 activity for that day even if no minutes are logged. Unchecking a task does NOT erase the day's activity (treat history as append-only).

---

## Curriculum content

Hardcode this in `src/data/curriculum.ts`. Order matters.

### Phase 0 — Math refresh (1–2 weeks, parallel with Phase 1)

Subtitle: "Just enough math. Don't take a course."

- `p0-3b1b-linalg` — 3Blue1Brown "Essence of Linear Algebra" (full series, ~15 videos) — 180 min
- `p0-3b1b-calc` — 3Blue1Brown "Essence of Calculus" (full series, ~12 videos) — 150 min
- `p0-prob-refresh` — Khan Academy probability refresher (optional, only if rusty) — 90 min

### Phase 1 — Karpathy "Neural Networks: Zero to Hero" (3–4 weeks)

Subtitle: "Build everything from scratch. Code along, don't just watch."

- `p1-micrograd` — Build micrograd (autograd from scratch) — 150 min
- `p1-makemore-1` — makemore part 1: bigram language model — 120 min
- `p1-makemore-2` — makemore part 2: MLP — 120 min
- `p1-makemore-3` — makemore part 3: activations, gradients, BatchNorm — 120 min
- `p1-makemore-4` — makemore part 4: becoming a backprop ninja — 150 min
- `p1-makemore-5` — makemore part 5: WaveNet — 120 min
- `p1-build-gpt` — "Let's build GPT" from scratch — 180 min
- `p1-tokenizer` — "Let's build the GPT Tokenizer" — 120 min
- `p1-reproduce-gpt2` — "Let's reproduce GPT-2 (124M)" — 240 min

### Phase 2 — fast.ai Practical Deep Learning (3–4 weeks)

Subtitle: "Top-down. Train SOTA in week 1, theory falls out."

- `p2-fastai-l1` — Lesson 1: Getting started — 90 min
- `p2-fastai-l2` — Lesson 2: Deployment — 90 min
- `p2-fastai-l3` — Lesson 3: Neural net foundations — 90 min
- `p2-fastai-l4` — Lesson 4: NLP — 90 min
- `p2-fastai-l5` — Lesson 5: From-scratch model — 90 min
- `p2-fastai-l6` — Lesson 6: Random forests — 90 min
- `p2-fastai-l7` — Lesson 7: Collaborative filtering — 90 min
- `p2-fastai-l8` — Lesson 8: Convolutions — 90 min
- `p2-fastai-l9` — Lesson 9: Stable Diffusion (or capstone) — 90 min

### Phase 3 — Specialization

Subtitle: "Pick one path. Don't try to do all three."

This phase shows `<SpecializationPicker />` until a choice is stored. After that, render only the chosen branch's tasks.

**Branch A — Applied LLMs / agents** (`applied-llms`)

- `p3a-karpathy-advanced` — Karpathy's advanced videos (deep dive into LLM internals) — 240 min
- `p3a-build-agent` — Build a working agent with tool use (LangGraph or hand-rolled) — 480 min
- `p3a-finetune` — Fine-tune an open model (Llama / Qwen) on a custom dataset — 360 min
- `p3a-evals` — Set up evals for your agent / model — 240 min

**Branch B — ML for trading** (`trading`)

- `p3b-timeseries` — Time-series forecasting fundamentals (ARIMA → Transformers for TS) — 360 min
- `p3b-rl-basics` — RL basics (Sutton & Barto chapters 1–6, plus a practical implementation) — 480 min
- `p3b-microstructure` — Order book microstructure features (imbalance, queue dynamics) — 240 min
- `p3b-backtest` — Build a leak-proof backtester — 360 min

**Branch C — Foundations / research** (`research`)

- `p3c-cs231n` — Stanford CS231n (CNNs for visual recognition) — 720 min
- `p3c-cs224n` — Stanford CS224n (NLP with deep learning) — 720 min
- `p3c-attention-paper` — Read & reproduce "Attention Is All You Need" — 360 min
- `p3c-gpt-papers` — Read GPT-1, GPT-2, GPT-3, InstructGPT papers — 240 min
- `p3c-reproduce` — Reproduce a recent paper end-to-end — 600 min

### Project — Ship something real

Subtitle: "Concepts only stick when you build."

- `proj-pick` — Pick a concrete project (order-book microstructure model / regime classifier on CoinGlass-style data / DeFi research agent / something you'd actually use)
- `proj-mvp` — Ship MVP — 1200 min
- `proj-deploy` — Deploy publicly (HF Space, Vercel, wherever)
- `proj-writeup` — Write a short post-mortem / blog post

---

## Decision tree (Phase 3 picker)

When the user reaches Phase 3 and `state.specialization === null`, show three large cards side by side. Each card:

```
┌──────────────────────────┐
│  Applied LLMs / agents   │
│  ─────────────────────   │
│  Highest market demand.  │
│  Build agents, fine-tune │
│  open models.            │
│                          │
│  4 tasks · ~22 hrs       │
│  [ Choose this path ]    │
└──────────────────────────┘
```

Choosing a card sets `state.specialization` and reveals that branch's tasks. Allow switching later via a small "change path" link in the phase header — switching does not erase progress on the previous branch (keep `completedTaskIds` for all branches; just hide the inactive ones).

---

## Progress calculation

- **Per-phase progress**: `sum(estMinutes of completed tasks) / sum(estMinutes of all tasks in phase)`. For Phase 3, only count the chosen branch.
- **Overall progress**: weighted average across all phases, with weights = total estMinutes per phase.
- **Streak**: number of consecutive days ending today with at least one activity entry. Reset on first gap.

---

## Implementation notes

- `App.tsx` mounts everything. Single page.
- State lives in one zustand store with persist middleware writing to `localStorage`.
- All dates are local time. Use `format(new Date(), "yyyy-MM-dd")` from date-fns. Never store `Date` objects — store strings.
- Heatmap should compute its grid from `state.activity` on render. Don't precompute or memoize aggressively unless it stutters.
- Dark mode: respect `prefers-color-scheme`, no toggle needed for v1.
- Accessibility: checkboxes are real `<input type="checkbox">`, heatmap cells have `aria-label` with the date and count.
- Keyboard: Enter on a focused task row toggles it.
- Don't add tests. This is a single-user toy app — manual smoke test is enough.

---

## Out of scope (do not build)

- User accounts, auth, sync across devices
- Sharing / social features
- Mobile app (responsive web is fine)
- Notifications
- AI-generated study suggestions
- Any kind of analytics or telemetry
- Import/export beyond a single "Export JSON" / "Import JSON" button (optional, only if trivial)

---

## Acceptance criteria

1. I can check off tasks; checking a task today colors today's heatmap cell.
2. The heatmap shows the last 371 days, GitHub-style, with 5 intensity levels.
3. I can log study minutes for today and the heatmap reflects them.
4. Phase 3 starts as a 3-card picker; choosing one reveals that branch's tasks; I can switch later without losing progress.
5. Refreshing the page preserves all state.
6. Total source code (excluding generated files and curriculum data) is under ~500 lines.
