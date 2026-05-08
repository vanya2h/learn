import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { COMPLEXITY_LEVELS } from "../../data/types";
import { LOCALES } from "../../lib/i18n";
import {
  ASSESSMENT_EVAL_SYSTEM,
  ASSESSMENT_SYSTEM,
  HANDS_ON_EVAL_SYSTEM,
  PART_SYSTEM,
  PLAN_SYSTEM,
  TASK_SOLUTION_SYSTEM,
  WRITEUP_SYSTEM,
} from "../../lib/phase";
import { getProfileContext } from "../lib/profileContext";
import { streamLLM } from "../lib/streamLLM";
import type { AuthEnv } from "../middleware/requireAuth";

const localeField = z.enum(LOCALES).optional();
const complexityField = z.enum(COMPLEXITY_LEVELS).optional();

const assessmentSchema = z.object({
  topic: z.string().min(1),
  curriculum: z.string().min(1),
  complexity: complexityField,
  locale: localeField,
});

const gapsSchema = z.object({
  qa: z.array(z.object({ q: z.string(), a: z.string() })).min(1),
  locale: localeField,
});

const studyPlanSchema = z.object({
  topic: z.string().min(1),
  curriculum: z.string().min(1),
  complexity: complexityField,
  assessmentContext: z.string().optional(),
  locale: localeField,
});

const studyPartSchema = z.object({
  topic: z.string().min(1),
  curriculum: z.string().min(1),
  complexity: complexityField,
  assessmentContext: z.string().optional(),
  partIdx: z.number().int().min(0),
  parts: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  locale: localeField,
});

const taskSolutionSchema = z.object({
  task: z.string().min(1),
  hint: z.string().optional(),
  locale: localeField,
});

const handsOnFeedbackSchema = z.object({
  qa: z.array(z.object({ task: z.string(), answer: z.string() })).min(1),
  locale: localeField,
});

const writeUpFeedbackSchema = z.object({
  topic: z.string().min(1),
  reflection: z.string().min(1),
  locale: localeField,
});

function complexityLine(complexity?: string): string {
  return complexity ? `\nComplexity: ${complexity}` : "";
}

export const llmRoute = new Hono<AuthEnv>()
  .post("/llm/assessment", zValidator("json", assessmentSchema), async (c) => {
    const { topic, curriculum, complexity, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const userMessage = `Topic: "${topic}"\nCurriculum: ${curriculum}${complexityLine(complexity)}`;
    return streamLLM({
      userId: c.var.user.id,
      system: ASSESSMENT_SYSTEM,
      userMessage,
      locale,
      maxTokens: 300,
      profile,
    });
  })
  .post("/llm/gaps", zValidator("json", gapsSchema), async (c) => {
    const { qa, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const userMessage = qa.map(({ q, a }, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${a || "(no answer)"}`).join("\n\n");
    return streamLLM({
      userId: c.var.user.id,
      system: ASSESSMENT_EVAL_SYSTEM,
      userMessage,
      locale,
      maxTokens: 600,
      profile,
    });
  })
  .post("/llm/study-plan", zValidator("json", studyPlanSchema), async (c) => {
    const { topic, curriculum, complexity, assessmentContext, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const base = `Plan a study session for: "${topic}"\nCurriculum: ${curriculum}${complexityLine(complexity)}`;
    const userMessage = assessmentContext ? `${base}\n\nAssessment context: ${assessmentContext}` : base;
    return streamLLM({ userId: c.var.user.id, system: PLAN_SYSTEM, userMessage, locale, maxTokens: 600, profile });
  })
  .post("/llm/study-part", zValidator("json", studyPartSchema), async (c) => {
    const { topic, curriculum, complexity, assessmentContext, partIdx, parts, locale } = c.req.valid("json");
    const partPlan = parts[partIdx];
    if (!partPlan) return c.json({ error: "Invalid partIdx" }, 400);
    const profile = await getProfileContext(c.var.user.id);

    const outline = parts.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join("\n");
    const userMessage = [
      `Topic: "${topic}"`,
      `Curriculum: ${curriculum}`,
      complexity ? `Complexity: ${complexity}` : null,
      assessmentContext ? `Assessment context: ${assessmentContext}` : null,
      ``,
      `Generate part ${partIdx + 1} of ${parts.length}: "${partPlan.title}"`,
      `Scope: ${partPlan.description}`,
      ``,
      `Full session outline:`,
      outline,
    ]
      .filter((l) => l !== null)
      .join("\n");

    return streamLLM({ userId: c.var.user.id, system: PART_SYSTEM, userMessage, locale, maxTokens: 3000, profile });
  })
  .post("/llm/task-solution", zValidator("json", taskSolutionSchema), async (c) => {
    const { task, hint, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const userMessage = hint ? `Task: ${task}\nHint: ${hint}` : `Task: ${task}`;
    return streamLLM({
      userId: c.var.user.id,
      system: TASK_SOLUTION_SYSTEM,
      userMessage,
      locale,
      maxTokens: 800,
      profile,
    });
  })
  .post("/llm/hands-on-feedback", zValidator("json", handsOnFeedbackSchema), async (c) => {
    const { qa, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const userMessage = qa
      .map(({ task, answer }, i) => `Task ${i + 1}: ${task}\nAnswer ${i + 1}: ${answer || "(no answer)"}`)
      .join("\n\n");
    return streamLLM({
      userId: c.var.user.id,
      system: HANDS_ON_EVAL_SYSTEM,
      userMessage,
      locale,
      maxTokens: 500,
      profile,
    });
  })
  .post("/llm/write-up-feedback", zValidator("json", writeUpFeedbackSchema), async (c) => {
    const { topic, reflection, locale } = c.req.valid("json");
    const profile = await getProfileContext(c.var.user.id);
    const userMessage = `Topic: "${topic}"\nLearner's reflection: "${reflection}"`;
    return streamLLM({ userId: c.var.user.id, system: WRITEUP_SYSTEM, userMessage, locale, maxTokens: 250, profile });
  });
