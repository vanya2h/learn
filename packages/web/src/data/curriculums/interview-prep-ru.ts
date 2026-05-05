import type { CurriculumDef, Phase } from "../types";

const PHASES: Phase[] = [
  {
    id: "fe-internals",
    title: "Внутреннее устройство фронтенда и современный React/Next.js",
    subtitle: "Уровень senior: объясняй «почему» и «какие компромиссы», а не просто называй API.",
    tasks: [
      {
        id: "fe-react-internals",
        title:
          "Внутренности React: рекончиляция, fiber, фазы render и commit, правила хуков, useTransition, useDeferredValue, useSyncExternalStore",
        estMinutes: 120,
      },
      {
        id: "fe-rsc-nextjs",
        title:
          "RSC + Next.js App Router: граница server/client, серверные экшены, Suspense streaming, 4 уровня кеша, partial prerendering",
        estMinutes: 120,
      },
      {
        id: "fe-state-data",
        title:
          "Состояние и данные: локальное vs URL vs серверное, ментальная модель TanStack Query (stale-while-revalidate, мутации + инвалидация), Zustand/Jotai против Redux",
        estMinutes: 90,
      },
      {
        id: "fe-performance",
        title:
          "Производительность: Core Web Vitals (INP заменил FID), разбивка бандла, стоимость гидратации, компромиссы мемоизации, виртуализация, стратегия изображений",
        estMinutes: 90,
      },
      {
        id: "fe-css",
        title:
          "Современный CSS: cascade layers, container queries, :has(), subgrid, logical properties, scroll-driven animations, новые цветовые пространства, дизайн-токены",
        estMinutes: 90,
      },
      {
        id: "fe-typescript",
        title:
          "Продвинутый TypeScript: conditional types, infer, template literal types, branded types, as const, discriminated unions для стейт-машин",
        estMinutes: 90,
      },
      {
        id: "fe-rebuild-project",
        title:
          "Практический проект: пересобери ленту с бесконечным скроллом тремя способами — RSC + server actions / TanStack Query / SSR + REST. Сформулируй компромиссы.",
        estMinutes: 240,
      },
    ],
  },
  {
    id: "system-design",
    title: "Системное проектирование фронтенда",
    subtitle:
      "Здесь выигрываются или проигрываются senior-собеседования. Используй 6-шаговый фреймворк: уточнить → архитектура → API → модель данных → детали фронтенда → компромиссы.",
    tasks: [
      {
        id: "sd-news-feed",
        title: "Проектирование: новостная лента (Twitter/X) — пагинация, реалтайм, оптимистичные обновления",
        estMinutes: 60,
      },
      {
        id: "sd-autocomplete",
        title: "Проектирование: автодополнение / typeahead — debouncing, ранжирование, кеширование, гонки запросов",
        estMinutes: 60,
      },
      {
        id: "sd-collab-doc",
        title:
          "Проектирование: совместный документ (упрощённый Google Docs) — CRDT против OT на высоком уровне, присутствие",
        estMinutes: 60,
      },
      {
        id: "sd-photo-gallery",
        title: "Проектирование: фотогалерея (Pinterest) — виртуализация, загрузка изображений, masonry-раскладка",
        estMinutes: 60,
      },
      {
        id: "sd-video-player",
        title: "Проектирование: видеоплеер (YouTube) — адаптивный битрейт, буферизация, доступность",
        estMinutes: 60,
      },
      {
        id: "sd-chat-app",
        title: "Проектирование: чат — WebSocket/SSE, порядок сообщений, очередь при офлайне",
        estMinutes: 60,
      },
      {
        id: "sd-realtime-dashboard",
        title: "Проектирование: дашборд реалтайм-данных (акции/крипто) — задействуй опыт в DeFi",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "algorithms",
    title: "Алгоритмы",
    subtitle:
      "LeetCode medium по ключевым паттернам + фронтенд-утилиты, которые встречаются на собеседованиях намного чаще, чем алгоритм Дейкстры.",
    tasks: [
      { id: "algo-hashmap", title: "Hash map + манипуляции с массивами (5–8 задач)", estMinutes: 90 },
      { id: "algo-two-pointers", title: "Два указателя / скользящее окно (5–8 задач)", estMinutes: 90 },
      { id: "algo-bfs-dfs", title: "BFS/DFS на деревьях и графах (5–8 задач)", estMinutes: 90 },
      { id: "algo-heap", title: "Куча / очередь с приоритетом: top-K, слияние K списков", estMinutes: 90 },
      { id: "algo-dp", title: "Динамическое программирование: канонические 1D и 2D задачи", estMinutes: 120 },
      {
        id: "algo-fe-utils",
        title:
          "Фронтенд-утилиты с нуля: debounce, throttle, Promise.all, EventEmitter, deep-clone, curry, memoize с TTL, retry с экспоненциальным откатом",
        estMinutes: 180,
      },
    ],
  },
  {
    id: "architecture",
    title: "Принципы архитектуры кода",
    subtitle:
      "По каждому принципу напиши абзац с позицией и конкретными фронтенд-примерами до следующего собеседования.",
    tasks: [
      {
        id: "arch-solid",
        title: "SOLID — фронтенд-примеры: единственная ответственность для хуков, инверсия зависимостей через context",
        estMinutes: 60,
      },
      {
        id: "arch-composition",
        title: "Композиция вместо наследования — compound components, render props, кастомные хуки",
        estMinutes: 60,
      },
      {
        id: "arch-state-machines",
        title: "Стейт-машины (XState) против набора булевых флагов — когда что уместно",
        estMinutes: 60,
      },
      {
        id: "arch-ddd",
        title: "Domain-driven design — ограниченные контексты, слои антикоррупции (актуально для fullstack-вопросов)",
        estMinutes: 60,
      },
      {
        id: "arch-testing",
        title:
          "Стратегия тестирования — «трофей» тестирования (Kent Dodds), почему интеграционные важнее юнитных для UI, что мокать",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "mocks-polish",
    title: "Мок-собеседования и финальная подготовка",
    subtitle:
      "На уровне senior интервьюеры проверяют суждения и ответственность. Истории должны показывать взвешенные компромиссы, а не просто результаты.",
    tasks: [
      {
        id: "mock-coding",
        title: "Мок: фронтенд-кодинг (Pramp / Hellointerview / друг — запиши себя)",
        estMinutes: 90,
      },
      { id: "mock-system-design", title: "Мок: системное проектирование", estMinutes: 90 },
      { id: "mock-behavioral", title: "Мок: поведенческое собеседование", estMinutes: 60 },
      {
        id: "mock-star-stories",
        title:
          "Подготовь 8 историй по STAR: дедлайн под давлением, технический спор, менторинг, урезание скоупа, инцидент в проде, размытые требования, конфликт между командами, главная ошибка",
        estMinutes: 120,
      },
      {
        id: "mock-company-research",
        title: "Исследование компании: инженерный блог, публичный стек, пользуйся продуктом как опытный пользователь",
        estMinutes: 60,
      },
      { id: "mock-questions", title: "Подготовь 5 острых вопросов для интервьюера", estMinutes: 30 },
    ],
  },
];

export const INTERVIEW_PREP_CURRICULUM_RU: CurriculumDef = {
  id: "interview-prep",
  name: "Подготовка к Frontend / Fullstack-собеседованию (Демо)",
  description:
    "Глубокое погружение во внутреннее устройство фронтенда, системное проектирование и алгоритмы для собеседований уровня senior.",
  complexity: "deep",
  coverImage:
    "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDEyMjF8MHwxfHNlYXJjaHw4fHxhYnN0cmFjdHxlbnwwfDB8fHwxNzc3NzcwMDYwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  phases: PHASES,
  skills: [
    {
      id: "ip-react-nextjs-expert",
      name: "Эксперт React & Next.js",
      description:
        "Глубокое понимание внутренностей React, RSC, четырёх уровней кеша и продвинутых паттернов TypeScript",
      unlockedBy: { phaseId: "fe-internals" },
    },
    {
      id: "ip-frontend-system-design",
      name: "Системное проектирование фронтенда",
      description: "Способен проектировать сложные фронтенд-системы end-to-end с чётким обоснованием компромиссов",
      unlockedBy: { phaseId: "system-design" },
    },
    {
      id: "ip-algorithm-patterns",
      name: "Алгоритмические паттерны",
      description: "Владение LeetCode medium-паттернами и всеми фронтенд-утилитами с нуля",
      unlockedBy: { phaseId: "algorithms" },
    },
    {
      id: "ip-software-architecture",
      name: "Архитектура программного обеспечения",
      description:
        "Чёткие, аргументированные позиции по SOLID, композиции, DDD, стейт-машинам и стратегии тестирования",
      unlockedBy: { phaseId: "architecture" },
    },
    {
      id: "ip-interview-ready",
      name: "Готовность к собеседованию",
      description: "Мок-собеседования пройдены, 8 историй по STAR подготовлены, компания тщательно изучена",
      unlockedBy: { phaseId: "mocks-polish" },
    },
  ],
};
