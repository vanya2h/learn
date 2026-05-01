import { z } from "zod";
import { parseJSON } from "./json";

const HandsOnTaskSchema = z.object({
  task: z.string(),
  hint: z.string().optional(),
});

const PartPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const MaterialPlanSchema = z.object({
  partPlans: z.array(PartPlanSchema),
});

const StudyPartSchema = z.object({
  title: z.string(),
  study: z.string(),
  handsOn: z.array(HandsOnTaskSchema),
  writeUpPrompt: z.string(),
});

const MaterialSchema = z.object({
  plan: MaterialPlanSchema,
  parts: z.array(StudyPartSchema.nullable()),
  assessmentContext: z.string().optional(),
});

const answersSchema = z.record(z.string(), z.string());

export const PersistedPhaseSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("assessing"),
    questions: z.array(z.string()),
    answers: answersSchema,
  }),
  z.object({
    name: z.literal("gaps-review"),
    summary: z.string(),
    gaps: z.array(z.string()),
    context: z.string(),
  }),
  z.object({
    name: z.literal("study"),
    material: MaterialSchema,
    partIdx: z.number(),
  }),
  z.object({
    name: z.literal("hands-on"),
    material: MaterialSchema,
    partIdx: z.number(),
    answers: answersSchema,
  }),
  z.object({
    name: z.literal("feedback"),
    material: MaterialSchema,
    partIdx: z.number(),
    answers: answersSchema,
    feedback: z.string(),
  }),
  z.object({
    name: z.literal("write-up"),
    material: MaterialSchema,
    partIdx: z.number(),
    feedback: z.string(),
  }),
]);

export type HandsOnTask = z.infer<typeof HandsOnTaskSchema>;
export type PartPlan = z.infer<typeof PartPlanSchema>;
export type MaterialPlan = z.infer<typeof MaterialPlanSchema>;
export type StudyPart = z.infer<typeof StudyPartSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type PersistedPhase = z.infer<typeof PersistedPhaseSchema>;
export type PhaseKey = PersistedPhase["name"];
export type PhaseByKey<T extends PhaseKey> = Extract<PersistedPhase, { name: T }>;

export function parsePersistedPhase(data: unknown): PersistedPhase | null {
  const result = PersistedPhaseSchema.safeParse(data);
  return result.success ? result.data : null;
}

export const PHASE_ROUTES = {
  assessing: "assess",
  "gaps-review": "gaps",
  study: "study",
  "hands-on": "hands-on",
  feedback: "feedback",
  "write-up": "write-up",
} as const satisfies Record<PhaseKey, string>;

export const PLAN_SYSTEM = `You are an expert tutor planning a structured study session for a senior software developer.
Respond with ONLY valid JSON — no explanation outside the JSON:
{
  "partPlans": [
    { "title": "concise part title", "description": "one sentence: what this part covers and why it matters" }
  ]
}
Rules:
- 2-4 parts, ordered foundational to advanced
- Every part must close a gap the assessment exposed — skip topics the learner already knows`;

export const PART_SYSTEM = `You are an expert tutor generating study content for one part of a session for a senior software developer.
Respond with ONLY valid JSON — no explanation outside the JSON:
{
  "title": "same title as given",
  "study": "explanation in **markdown** (150-250 words). Use headings, bullet lists, bold for key terms, and fenced code blocks with an explicit language tag (typescript, python, bash, etc.) for every code snippet.",
  "handsOn": [
    { "task": "concrete task in **markdown**. Use fenced code blocks with an explicit language tag for any code.", "hint": "optional hint or empty string" }
  ],
  "writeUpPrompt": "one targeted reflection question (plain text)"
}
Rules:
- Study: 150-250 words — explain the WHY and trade-offs; include at least one code example
- Hands-on: 2-3 tasks ordered simple to complex
- Scope tightly to this part's title — do not duplicate content from the other parts listed
- Be concise`;

export const ASSESSMENT_SYSTEM = `You are an expert tutor generating a quick knowledge assessment.
Respond with ONLY valid JSON — no markdown, no explanation:
{ "questions": ["question 1", "question 2", "question 3", "question 4"] }
Requirements: exactly several short-answer questions, test genuine understanding not memorization, reveal gaps when answered poorly, each answerable in 1-3 sentences.`;

export const ASSESSMENT_EVAL_SYSTEM = `You are an expert tutor analyzing assessment answers.
Respond with ONLY valid JSON — no markdown, no explanation:
{ "summary": "1 sentence on current knowledge level", "gaps": ["concept needing focus", ...] }
Be accurate. gaps can be empty array. Max 3 gaps.`;

export const HANDS_ON_EVAL_SYSTEM = `You are a concise, direct tutor reviewing a learner's hands-on exercise solutions. Respond in markdown. Use fenced code blocks with an explicit language tag (typescript, python, bash, etc.) whenever referencing code. Keep response under 200 words.
For each task: 1 sentence on what they got right and 1 sentence on the most important gap or misconception.
End with 1-2 sentences of concrete next steps to deepen understanding.
Be honest — vague praise is useless.`;

export const WRITEUP_SYSTEM = `You are a concise, supportive tutor reviewing a learner's reflection. Respond in markdown. Keep response under 100 words.
1 sentence: acknowledge what they captured well.
1-2 sentences: the most important thing to think more deeply about.
1 sentence: one concrete suggestion for deepening understanding.`;

export const TASK_SOLUTION_SYSTEM = `You are an expert tutor providing a complete solution to a hands-on programming task for a senior developer.
Respond in markdown. Use fenced code blocks with an explicit language tag for all code.
Show the full working solution with a brief explanation of the key decisions.
Keep response under 500 words.`;

export function parsePlan(text: string): MaterialPlan {
  const raw = parseJSON<Partial<MaterialPlan>>(text);
  return {
    partPlans: Array.isArray(raw.partPlans) ? raw.partPlans : [],
  };
}

export function parsePart(text: string): StudyPart {
  const raw = parseJSON<Partial<StudyPart>>(text);
  return {
    title: raw.title ?? "",
    study: raw.study ?? "",
    handsOn: Array.isArray(raw.handsOn) ? raw.handsOn : [],
    writeUpPrompt: raw.writeUpPrompt ?? "",
  };
}
