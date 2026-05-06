import type { CurriculumDef, Phase } from "../types";

const PHASES: Phase[] = [
  {
    id: "ux-fundamentals",
    title: "UI/UX Design Fundamentals",
    subtitle: "Highest-impact basics that interviewers expect every designer to articulate clearly.",
    tasks: [
      {
        id: "ux-design-principles",
        title: "Core design principles: hierarchy, contrast, alignment, repetition, white space",
        estMinutes: 60,
      },
      {
        id: "ux-typography-color",
        title: "Typography and color basics: scale, pairing, contrast ratios, accessible palettes",
        estMinutes: 60,
      },
      {
        id: "ux-process",
        title: "Design process overview: research, wireframes, prototypes, usability testing",
        estMinutes: 75,
      },
      {
        id: "ux-heuristics-a11y",
        title: "Nielsen's 10 heuristics and WCAG accessibility essentials",
        estMinutes: 60,
      },
      {
        id: "ux-figma-basics",
        title: "Figma essentials: auto-layout, components, variants, basic prototyping",
        estMinutes: 90,
      },
    ],
  },
  {
    id: "ux-portfolio-mock",
    title: "Portfolio Walkthrough & Mock Interview",
    subtitle: "The portfolio review is the centerpiece of every UI/UX interview — rehearse it out loud.",
    tasks: [
      {
        id: "ux-portfolio-story",
        title: "Pick 2-3 case studies and structure each as: problem, process, decisions, outcome",
        estMinutes: 90,
      },
      {
        id: "ux-portfolio-rehearse",
        title: "Rehearse a 20-minute portfolio walkthrough out loud (record yourself once)",
        estMinutes: 60,
      },
      {
        id: "ux-app-critique",
        title: "Watch one app critique video and write your own critique of an everyday product",
        estMinutes: 60,
      },
      {
        id: "ux-behavioral",
        title: "Prep 3 behavioral stories: collaboration with engineers, handling feedback, scope trade-off",
        estMinutes: 60,
      },
    ],
  },
  {
    id: "ux-company-research",
    title: "Company Research",
    subtitle: "Show up knowing the product, the design team, and what you'd improve.",
    tasks: [
      {
        id: "ux-use-product",
        title: "Use the company's product as a real user and note 3 friction points",
        estMinutes: 45,
      },
      {
        id: "ux-design-team",
        title: "Read the design team's blog posts, Dribbble, and any public case studies",
        estMinutes: 45,
      },
      {
        id: "ux-questions",
        title: "Prepare 5 thoughtful questions about design process, team, and product direction",
        estMinutes: 30,
      },
    ],
  },
];

export const UX_DESIGN_INTERVIEW_CURRICULUM: CurriculumDef = {
  id: "ux-design-interview",
  name: "UI/UX Design Interview Prep",
  description: "Generic, beginner-friendly prep for product design and UI/UX interviews.",
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
      name: "UI/UX Design Foundations",
      description: "Comfortable explaining core visual design principles, accessibility, and Figma workflows",
      unlockedBy: { phaseId: "ux-fundamentals" },
    },
    {
      id: "ux-portfolio-presentation",
      name: "Portfolio Presentation",
      description: "Can walk through case studies with clear problem framing, decisions, and outcomes",
      unlockedBy: { phaseId: "ux-portfolio-mock" },
    },
    {
      id: "ux-company-fluency",
      name: "Company & Product Fluency",
      description: "Knows the company's product, design team, and has sharp questions ready",
      unlockedBy: { phaseId: "ux-company-research" },
    },
  ],
};
