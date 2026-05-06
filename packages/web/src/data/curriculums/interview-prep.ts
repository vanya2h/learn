import type { CurriculumDef, Phase } from "../types";

const PHASES: Phase[] = [
  {
    id: "fe-internals",
    title: "Frontend Internals & Modern React/Next.js",
    subtitle: 'Depth bar at senior level: explain "why" and "what trade-offs", not just the API name.',
    tasks: [
      {
        id: "fe-react-internals",
        title:
          "React internals: reconciliation, fiber, render vs commit, hooks rules, useTransition, useDeferredValue, useSyncExternalStore",
        estMinutes: 120,
      },
      {
        id: "fe-rsc-nextjs",
        title:
          "RSC + Next.js App Router: server vs client boundary, server actions, Suspense streaming, 4 cache layers, partial prerendering",
        estMinutes: 120,
      },
      {
        id: "fe-state-data",
        title:
          "State & data: local vs URL vs server state, TanStack Query mental model (stale-while-revalidate, mutations + invalidation), Zustand/Jotai vs Redux",
        estMinutes: 90,
      },
      {
        id: "fe-performance",
        title:
          "Performance: Core Web Vitals (INP replaced FID), bundle splitting, hydration cost, memoization trade-offs, virtualization, image strategy",
        estMinutes: 90,
      },
      {
        id: "fe-css",
        title:
          "Modern CSS: cascade layers, container queries, :has(), subgrid, logical properties, scroll-driven animations, new color spaces, design tokens trade-off",
        estMinutes: 90,
      },
      {
        id: "fe-typescript",
        title:
          "TypeScript advanced: conditional types, infer, template literal types, branded types, as const, discriminated unions for state machines",
        estMinutes: 90,
      },
      {
        id: "fe-rebuild-project",
        title:
          "Practice project: rebuild infinite-scroll feed 3 ways — RSC + server actions / TanStack Query / SSR + REST. Articulate trade-offs.",
        estMinutes: 240,
      },
    ],
  },
  {
    id: "system-design",
    title: "Frontend System Design",
    subtitle:
      "Where senior interviews are won or lost. Use the 6-step framework: clarify → architecture → API → data model → frontend deep-dive → trade-offs.",
    tasks: [
      {
        id: "sd-news-feed",
        title: "Design: news feed (Twitter/X) — pagination, real-time, optimistic updates",
        estMinutes: 60,
      },
      {
        id: "sd-autocomplete",
        title: "Design: autocomplete / typeahead — debouncing, ranking, caching, race conditions",
        estMinutes: 60,
      },
      {
        id: "sd-collab-doc",
        title: "Design: collaborative doc (Google Docs lite) — CRDTs vs OT at high level, presence",
        estMinutes: 60,
      },
      {
        id: "sd-photo-gallery",
        title: "Design: photo gallery (Pinterest) — virtualization, image loading, masonry layout",
        estMinutes: 60,
      },
      {
        id: "sd-video-player",
        title: "Design: video player (YouTube) — adaptive bitrate, buffering, accessibility",
        estMinutes: 60,
      },
      { id: "sd-chat-app", title: "Design: chat app — WebSocket/SSE, message ordering, offline queue", estMinutes: 60 },
      {
        id: "sd-realtime-dashboard",
        title: "Design: real-time stock/crypto dashboard — leverage DeFi background here",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms",
    subtitle:
      "LeetCode mediums on focused patterns + frontend-flavored utilities that show up far more often than Dijkstra.",
    tasks: [
      { id: "algo-hashmap", title: "Hash map + array manipulation (5–8 problems)", estMinutes: 90 },
      { id: "algo-two-pointers", title: "Two pointers / sliding window (5–8 problems)", estMinutes: 90 },
      { id: "algo-bfs-dfs", title: "BFS/DFS on trees and graphs (5–8 problems)", estMinutes: 90 },
      { id: "algo-heap", title: "Heap / priority queue: top-K, merge-K problems", estMinutes: 90 },
      { id: "algo-dp", title: "Dynamic programming: 1D + 2D canonical handful", estMinutes: 120 },
      {
        id: "algo-fe-utils",
        title:
          "Frontend utilities from scratch: debounce, throttle, Promise.all, EventEmitter, deep-clone, curry, memoize-with-TTL, retry-with-backoff",
        estMinutes: 180,
      },
    ],
  },
  {
    id: "architecture",
    title: "Code Architecture Principles",
    subtitle:
      "For each principle, write a 1-paragraph stance with concrete frontend examples before the next interview.",
    tasks: [
      {
        id: "arch-solid",
        title: "SOLID — frontend examples: single responsibility for hooks, dependency inversion via context",
        estMinutes: 60,
      },
      {
        id: "arch-composition",
        title: "Composition over inheritance — compound components, render props, custom hooks",
        estMinutes: 60,
      },
      {
        id: "arch-state-machines",
        title: "State machines (XState) vs ad-hoc booleans — when each fits",
        estMinutes: 60,
      },
      {
        id: "arch-ddd",
        title: "Domain-driven design — bounded contexts, anti-corruption layers (relevant for fullstack questions)",
        estMinutes: 60,
      },
      {
        id: "arch-testing",
        title: "Testing strategy — the testing trophy (Kent Dodds), why integration > unit for UI, what to mock",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "mocks-polish",
    title: "Mocks, Behavioral & Polish",
    subtitle:
      "At senior level, interviewers probe for judgment and ownership. Stories must show the trade-offs you weighed — not just outcomes.",
    tasks: [
      {
        id: "mock-coding",
        title: "Mock: frontend coding (Pramp / Hellointerview / friend — record yourself)",
        estMinutes: 90,
      },
      { id: "mock-system-design", title: "Mock: system design", estMinutes: 90 },
      { id: "mock-behavioral", title: "Mock: behavioral", estMinutes: 60 },
      {
        id: "mock-star-stories",
        title:
          "Prep 8 STAR stories: shipping under pressure, tech disagreement, mentoring, scope cut, production incident, ambiguous requirements, cross-team conflict, biggest mistake",
        estMinutes: 120,
      },
      {
        id: "mock-company-research",
        title: "Company research: engineering blog, public stack, use the product as a power user",
        estMinutes: 60,
      },
      { id: "mock-questions", title: "Prepare 5 sharp questions for the interviewer", estMinutes: 30 },
    ],
  },
];

export const INTERVIEW_PREP_CURRICULUM: CurriculumDef = {
  id: "interview-prep",
  name: "Frontend / Fullstack Interview Prep (Demo)",
  description: "Deep-dive frontend internals, system design, and DSA for senior-level interviews.",
  complexity: "deep",
  cover: {
    shape: "blob",
    rotation: 88,
    colorBack: "hsl(353, 15%, 93%)",
    colors: ["hsl(353, 88%, 56%)", "hsl(143, 78%, 57%)", "hsl(203, 86%, 63%)", "hsl(23, 89%, 57%)"],
  },
  phases: PHASES,
  skills: [
    {
      id: "ip-react-nextjs-expert",
      name: "React & Next.js Expert",
      description:
        "Deep understanding of React internals, RSC, all four caching layers, and advanced TypeScript patterns",
      unlockedBy: { phaseId: "fe-internals" },
    },
    {
      id: "ip-frontend-system-design",
      name: "Frontend System Design",
      description: "Can design complex frontend systems end-to-end with clear trade-off reasoning",
      unlockedBy: { phaseId: "system-design" },
    },
    {
      id: "ip-algorithm-patterns",
      name: "Algorithm Patterns",
      description: "Fluent in LeetCode medium patterns + all frontend utility implementations from scratch",
      unlockedBy: { phaseId: "algorithms" },
    },
    {
      id: "ip-software-architecture",
      name: "Software Architecture",
      description: "Clear, articulated stances on SOLID, composition, DDD, state machines, and testing strategy",
      unlockedBy: { phaseId: "architecture" },
    },
    {
      id: "ip-interview-ready",
      name: "Interview Ready",
      description: "Mock interviews done, 8 STAR stories prepped, company thoroughly researched",
      unlockedBy: { phaseId: "mocks-polish" },
    },
  ],
};
