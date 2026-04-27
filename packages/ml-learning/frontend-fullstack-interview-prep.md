# Frontend / Fullstack Interview Prep Program

A topic-based prep guide for a senior frontend/fullstack role. Work through it at your own pace — go deep on weak areas, skim what you already own.

---

## Study Loop

For each topic, run this loop:

- **Study** — read deep-dive, watch talk, or read RFC/source
- **Hands-on** — algo problem, mini-build, or system design whiteboard
- **Write-up** — explain what you learned in your own words

> The write-up is the single highest-leverage habit. If you can't explain it cleanly in writing, you won't explain it cleanly under pressure.

---

## Frontend Internals & Modern React/Next.js

The depth bar at senior level is **"explain *why* and *what trade-offs*"**, not "name the API."

### React Internals
- Reconciliation, fiber, render vs commit phases
- Why hooks have rules
- What `useTransition` / `useDeferredValue` actually do
- `useSyncExternalStore`
- Resources: Mark Erikson's blog and the React docs' "Reference" section

### Server Components & Next.js App Router
- RSC payload format
- Server vs client boundary
- Server actions
- Streaming with Suspense
- The four cache layers: Request Memoization, Data Cache, Full Route Cache, Router Cache
- Partial prerendering
- **Build a mental diagram of where data lives at each layer**

### State & Data
- When local state vs URL state vs server state vs global store
- TanStack Query mental model: cache key, stale-while-revalidate, mutations + invalidation
- Why Zustand/Jotai exist alongside Redux Toolkit

### Performance
- Core Web Vitals (INP replaced FID — know what causes bad INP)
- Bundle splitting
- Hydration cost
- When memoization helps vs hurts
- Virtualization
- Image strategy

### CSS for Seniors
- Cascade layers
- Container queries
- `:has()`
- Subgrid
- Logical properties
- Scroll-driven animations
- New CSS color spaces
- Be ready to discuss design tokens and the styled-components vs Tailwind vs CSS Modules trade-off space

### TypeScript Advanced
- Conditional types
- `infer`
- Template literal types
- Branded types
- Why `as const` matters
- Discriminated unions for state machines

### Practice Project
Rebuild a small feature (e.g. infinite-scroll feed) **three ways**:
1. RSC + server actions
2. Client-side with TanStack Query
3. Old-school SSR + REST

Articulate trade-offs.

---

## Frontend System Design

This is usually where senior interviews are won or lost. Use a consistent framework so you don't freeze:

### Framework

| Step | Activity |
|------|----------|
| 1. Clarify | Functional reqs, non-functional reqs (scale, latency, devices, offline?), constraints |
| 2. High-level architecture | Client / API layer / backend services / data stores, with a quick sketch |
| 3. API design | REST vs GraphQL choice + reasoning, schema for one core endpoint, pagination strategy |
| 4. Data model | Entities, relationships, what's normalized client-side |
| 5. Frontend deep-dive | Component tree, state architecture, rendering strategy (CSR/SSR/RSC), caching layers, real-time updates |
| 6. Trade-offs & scaling | Bottlenecks, what breaks first, how to evolve |

### Designs to Practice
- **News feed (Twitter/X clone)** — pagination, real-time, optimistic updates
- **Autocomplete / typeahead** — debouncing, ranking, caching, race conditions
- **Collaborative doc (Google Docs lite)** — CRDTs vs OT at a high level, presence
- **Photo gallery (Pinterest)** — virtualization, image loading, masonry layout
- **Video player (YouTube)** — adaptive bitrate, buffering, accessibility
- **Chat app** — WebSocket/SSE, message ordering, offline queue
- **Stock/crypto dashboard with real-time charts** — should crush this one given DeFi background

### Resources
- *Frontend System Design* by Alex Xu / the GreatFrontEnd guide
- Evan You and Dan Abramov talks for mental models

---

## Algorithms

### LeetCode Mediums — Focused Patterns

- Hash map + array manipulation
- Two pointers / sliding window
- BFS/DFS on trees and graphs
- Heap / priority queue (top-K, merge-K)
- Dynamic programming (1D + 2D, just the canonical handful)

### Frontend-Flavored Coding

These show up far more often than Dijkstra at frontend interviews — **make them automatic**:

- `debounce`
- `throttle`
- `Promise.all`
- `EventEmitter`
- Deep-clone
- Curry
- Memoize-with-TTL
- Retry-with-backoff

---

## Code Architecture Principles

Work through these and have a **1-paragraph stance** on each:

- **SOLID** — be concrete with frontend examples (single responsibility for hooks, dependency inversion via context)
- **Composition over inheritance** — compound components, render props, custom hooks
- **Module boundaries / dependency direction** — in a monorepo
- **State machines (XState) vs ad-hoc booleans** — when each fits
- **Domain-driven design** — bounded contexts, anti-corruption layers (very relevant for fullstack questions)
- **Testing strategy** — the testing trophy (Kent Dodds), why integration > unit for UI, what to mock
- **First-class architecture concerns** — error boundaries, observability, feature flags

---

## Mock Loops, Behavioral, and Polish

### Mock Interviews
- One frontend coding
- One system design
- One behavioral

Use Pramp / Hellointerview / a friend. **Record yourself.**

### Behavioral Prep

Prep 6–8 STAR stories covering:
- Shipping under pressure
- Technical disagreement
- Mentoring
- Scope cut
- Production incident
- Ambiguous requirements
- Cross-team conflict
- Biggest mistake

> At senior level, interviewers probe for *judgment* and *ownership*, not just outcomes. Make sure your stories show the trade-offs you weighed.

### Company-Specific Research
- Read their engineering blog
- Study their public stack
- Use the product as a power user
- Prepare 5 sharp questions for the interviewer

### Day-Before
- Light review only, no new material
- Sleep

### Day-Of
- 10 min of "warm-up" coding (one easy problem already solved) so the brain is in the right gear

---

## Resources Worth Bookmarking

- **React docs** (the new ones, especially "Learn" + "Reference")
- **web.dev** — performance + Core Web Vitals
- **Patterns.dev** (Lydia Hallie) — design patterns
- **GreatFrontEnd** + Frontend Interview Handbook
- **Designing Data-Intensive Applications** (Kleppmann) — chapters 1–6 + 11 for fullstack/system-design backend basics
- **Kent C. Dodds** — epic-react and testing material

---

## Progress Tracker

### Frontend Internals
- [ ] React internals deep-dive
- [ ] RSC + App Router cache layers diagram
- [ ] State & data architecture review
- [ ] Performance + Core Web Vitals
- [ ] Modern CSS features
- [ ] TypeScript advanced patterns
- [ ] Three-way feature rebuild project

### System Design
- [ ] News feed
- [ ] Autocomplete / typeahead
- [ ] Collaborative doc
- [ ] Photo gallery
- [ ] Video player
- [ ] Chat app
- [ ] Real-time crypto/stock dashboard

### Algorithms
- [ ] Hash map / array problems
- [ ] Two pointers / sliding window
- [ ] BFS/DFS
- [ ] Heap / priority queue
- [ ] DP
- [ ] Frontend utilities (debounce, throttle, Promise.all, EventEmitter, deep-clone, curry, memoize-TTL, retry-backoff)

### Architecture
- [ ] SOLID write-up
- [ ] Composition patterns write-up
- [ ] State machines write-up
- [ ] DDD write-up
- [ ] Testing strategy write-up

### Mocks + Polish
- [ ] Mock: frontend coding
- [ ] Mock: system design
- [ ] Mock: behavioral
- [ ] 8 STAR stories
- [ ] Company research
- [ ] 5 questions for interviewer
