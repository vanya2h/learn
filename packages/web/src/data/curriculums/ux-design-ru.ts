import type { CurriculumDef, Phase } from "../types";

const PHASES: Phase[] = [
  {
    id: "ux-fundamentals",
    title: "Основы UI/UX дизайна",
    subtitle:
      "Базовые темы с самым высоким приоритетом — то, что должен внятно объяснить любой дизайнер на собеседовании.",
    tasks: [
      {
        id: "ux-design-principles",
        title: "Принципы дизайна: иерархия, контраст, выравнивание, повтор, белое пространство",
        estMinutes: 60,
      },
      {
        id: "ux-typography-color",
        title: "Типографика и цвет: шкала, сочетания, контрастность, доступные палитры",
        estMinutes: 60,
      },
      {
        id: "ux-process",
        title: "Процесс дизайна: исследование, вайрфреймы, прототипы, юзабилити-тесты",
        estMinutes: 75,
      },
      {
        id: "ux-heuristics-a11y",
        title: "10 эвристик Нильсена и базовые требования WCAG по доступности",
        estMinutes: 60,
      },
      {
        id: "ux-figma-basics",
        title: "Figma: auto-layout, компоненты, варианты, базовое прототипирование",
        estMinutes: 90,
      },
    ],
  },
  {
    id: "ux-portfolio-mock",
    title: "Презентация портфолио и мок-собеседование",
    subtitle: "Разбор портфолио — центральная часть любого UI/UX интервью. Проговори вслух заранее.",
    tasks: [
      {
        id: "ux-portfolio-story",
        title: "Выбери 2-3 кейса и структурируй каждый: задача, процесс, решения, результат",
        estMinutes: 90,
      },
      {
        id: "ux-portfolio-rehearse",
        title: "Прорепетируй 20-минутный рассказ по портфолио вслух (запиши себя один раз)",
        estMinutes: 60,
      },
      {
        id: "ux-app-critique",
        title: "Посмотри одно видео-критику приложения и напиши свой разбор привычного продукта",
        estMinutes: 60,
      },
      {
        id: "ux-behavioral",
        title: "Подготовь 3 поведенческие истории: работа с инженерами, обратная связь, компромисс по скоупу",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "ux-company-research",
    title: "Исследование компании",
    subtitle: "Приходи на интервью, зная продукт, дизайн-команду и что бы ты улучшил.",
    tasks: [
      {
        id: "ux-use-product",
        title: "Попользуйся продуктом компании как настоящий пользователь и найди 3 точки трения",
        estMinutes: 45,
      },
      {
        id: "ux-design-team",
        title: "Прочитай блог дизайн-команды, посмотри Dribbble и публичные кейсы",
        estMinutes: 45,
      },
      {
        id: "ux-questions",
        title: "Подготовь 5 содержательных вопросов о процессе, команде и направлении продукта",
        estMinutes: 30,
      },
    ],
  },
];

export const UX_DESIGN_INTERVIEW_CURRICULUM_RU: CurriculumDef = {
  id: "ux-design-interview",
  name: "Подготовка к UI/UX собеседованию",
  description: "Универсальная подготовка для начинающих к интервью по продуктовому и UI/UX дизайну.",
  complexity: "easy",
  cover: {
    shape: "ripple",
    rotation: 342,
    colorBack: "hsl(140, 23%, 98%)",
    colors: ["hsl(140, 78%, 54%)", "hsl(170, 79%, 55%)", "hsl(110, 80%, 55%)", "hsl(200, 78%, 57%)"],
  },
  phases: PHASES,
  skills: [
    {
      id: "ux-design-foundations",
      name: "Основы UI/UX дизайна",
      description: "Уверенно объясняешь визуальные принципы дизайна, доступность и работу в Figma",
      unlockedBy: { phaseId: "ux-fundamentals" },
    },
    {
      id: "ux-portfolio-presentation",
      name: "Презентация портфолио",
      description: "Умеешь провести по кейсам с чёткой постановкой задачи, решениями и результатами",
      unlockedBy: { phaseId: "ux-portfolio-mock" },
    },
    {
      id: "ux-company-fluency",
      name: "Понимание компании и продукта",
      description: "Знаешь продукт компании, её дизайн-команду и подготовил острые вопросы",
      unlockedBy: { phaseId: "ux-company-research" },
    },
  ],
};
