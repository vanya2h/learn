export type PhaseId = "phase-0" | "phase-1" | "phase-2" | "phase-3" | "project";
export type SpecializationId = "applied-llms" | "trading" | "research";

export type Task = {
  id: string;
  title: string;
  notes?: string;
  estMinutes?: number;
  branch?: SpecializationId;
};

export type Phase = {
  id: PhaseId;
  title: string;
  subtitle: string;
  tasks: Task[];
};

export const CURRICULUM: Phase[] = [
  {
    id: "phase-0",
    title: "Phase 0 — Math refresh",
    subtitle: "Just enough math. Don't take a course.",
    tasks: [
      {
        id: "p0-3b1b-linalg",
        title: '3Blue1Brown "Essence of Linear Algebra" (full series, ~15 videos)',
        estMinutes: 180,
      },
      { id: "p0-3b1b-calc", title: '3Blue1Brown "Essence of Calculus" (full series, ~12 videos)', estMinutes: 150 },
      { id: "p0-prob-refresh", title: "Khan Academy probability refresher (optional, only if rusty)", estMinutes: 90 },
    ],
  },
  {
    id: "phase-1",
    title: 'Phase 1 — Karpathy "Neural Networks: Zero to Hero"',
    subtitle: "Build everything from scratch. Code along, don't just watch.",
    tasks: [
      { id: "p1-micrograd", title: "Build micrograd (autograd from scratch)", estMinutes: 150 },
      { id: "p1-makemore-1", title: "makemore part 1: bigram language model", estMinutes: 120 },
      { id: "p1-makemore-2", title: "makemore part 2: MLP", estMinutes: 120 },
      { id: "p1-makemore-3", title: "makemore part 3: activations, gradients, BatchNorm", estMinutes: 120 },
      { id: "p1-makemore-4", title: "makemore part 4: becoming a backprop ninja", estMinutes: 150 },
      { id: "p1-makemore-5", title: "makemore part 5: WaveNet", estMinutes: 120 },
      { id: "p1-build-gpt", title: '"Let\'s build GPT" from scratch', estMinutes: 180 },
      { id: "p1-tokenizer", title: '"Let\'s build the GPT Tokenizer"', estMinutes: 120 },
      { id: "p1-reproduce-gpt2", title: '"Let\'s reproduce GPT-2 (124M)"', estMinutes: 240 },
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2 — fast.ai Practical Deep Learning",
    subtitle: "Top-down. Train SOTA in week 1, theory falls out.",
    tasks: [
      { id: "p2-fastai-l1", title: "Lesson 1: Getting started", estMinutes: 90 },
      { id: "p2-fastai-l2", title: "Lesson 2: Deployment", estMinutes: 90 },
      { id: "p2-fastai-l3", title: "Lesson 3: Neural net foundations", estMinutes: 90 },
      { id: "p2-fastai-l4", title: "Lesson 4: NLP", estMinutes: 90 },
      { id: "p2-fastai-l5", title: "Lesson 5: From-scratch model", estMinutes: 90 },
      { id: "p2-fastai-l6", title: "Lesson 6: Random forests", estMinutes: 90 },
      { id: "p2-fastai-l7", title: "Lesson 7: Collaborative filtering", estMinutes: 90 },
      { id: "p2-fastai-l8", title: "Lesson 8: Convolutions", estMinutes: 90 },
      { id: "p2-fastai-l9", title: "Lesson 9: Stable Diffusion (or capstone)", estMinutes: 90 },
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3 — Specialization",
    subtitle: "Pick one path. Don't try to do all three.",
    tasks: [
      {
        id: "p3a-karpathy-advanced",
        title: "Karpathy's advanced videos (deep dive into LLM internals)",
        estMinutes: 240,
        branch: "applied-llms",
      },
      {
        id: "p3a-build-agent",
        title: "Build a working agent with tool use (LangGraph or hand-rolled)",
        estMinutes: 480,
        branch: "applied-llms",
      },
      {
        id: "p3a-finetune",
        title: "Fine-tune an open model (Llama / Qwen) on a custom dataset",
        estMinutes: 360,
        branch: "applied-llms",
      },
      { id: "p3a-evals", title: "Set up evals for your agent / model", estMinutes: 240, branch: "applied-llms" },
      {
        id: "p3b-timeseries",
        title: "Time-series forecasting fundamentals (ARIMA → Transformers for TS)",
        estMinutes: 360,
        branch: "trading",
      },
      {
        id: "p3b-rl-basics",
        title: "RL basics (Sutton & Barto chapters 1–6, plus a practical implementation)",
        estMinutes: 480,
        branch: "trading",
      },
      {
        id: "p3b-microstructure",
        title: "Order book microstructure features (imbalance, queue dynamics)",
        estMinutes: 240,
        branch: "trading",
      },
      { id: "p3b-backtest", title: "Build a leak-proof backtester", estMinutes: 360, branch: "trading" },
      { id: "p3c-cs231n", title: "Stanford CS231n (CNNs for visual recognition)", estMinutes: 720, branch: "research" },
      { id: "p3c-cs224n", title: "Stanford CS224n (NLP with deep learning)", estMinutes: 720, branch: "research" },
      {
        id: "p3c-attention-paper",
        title: 'Read & reproduce "Attention Is All You Need"',
        estMinutes: 360,
        branch: "research",
      },
      {
        id: "p3c-gpt-papers",
        title: "Read GPT-1, GPT-2, GPT-3, InstructGPT papers",
        estMinutes: 240,
        branch: "research",
      },
      { id: "p3c-reproduce", title: "Reproduce a recent paper end-to-end", estMinutes: 600, branch: "research" },
    ],
  },
  {
    id: "project",
    title: "Project — Ship something real",
    subtitle: "Concepts only stick when you build.",
    tasks: [
      {
        id: "proj-pick",
        title:
          "Pick a concrete project (order-book microstructure model / regime classifier / DeFi research agent / something you'd actually use)",
      },
      { id: "proj-mvp", title: "Ship MVP", estMinutes: 1200 },
      { id: "proj-deploy", title: "Deploy publicly (HF Space, Vercel, wherever)" },
      { id: "proj-writeup", title: "Write a short post-mortem / blog post" },
    ],
  },
];

export const SPECIALIZATION_INFO: Record<
  SpecializationId,
  { label: string; description: string; tasks: number; hours: number }
> = {
  "applied-llms": {
    label: "Applied LLMs / agents",
    description: "Highest market demand. Build agents, fine-tune open models.",
    tasks: 4,
    hours: 22,
  },
  trading: {
    label: "ML for trading",
    description: "Time-series forecasting, RL, microstructure, backtesting.",
    tasks: 4,
    hours: 24,
  },
  research: {
    label: "Foundations / research",
    description: "Deep theory. Stanford courses, reproduce papers end-to-end.",
    tasks: 5,
    hours: 44,
  },
};
