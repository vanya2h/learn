import { z } from "zod";
import { GradientCoverSchema } from "../lib/gradient";

export const COMPLEXITY_LEVELS = ["easy", "medium", "deep"] as const;
export type Complexity = (typeof COMPLEXITY_LEVELS)[number];

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string().optional(),
  estMinutes: z.number().optional(),
});

export const PhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  tasks: z.array(TaskSchema).min(1),
});

export const OutlinePhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  unlockedBy: z.object({ phaseId: z.string() }),
});

export const CurriculumDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  phases: z.array(PhaseSchema).min(1),
  skills: z.array(SkillSchema).optional(),
  cover: GradientCoverSchema.optional(),
  complexity: z.enum(COMPLEXITY_LEVELS).optional(),
});

export const CurriculumOutlineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  phases: z.array(OutlinePhaseSchema).min(1),
  skills: z.array(SkillSchema).optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type OutlinePhase = z.infer<typeof OutlinePhaseSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type CurriculumDef = z.infer<typeof CurriculumDefSchema>;
export type CurriculumOutline = z.infer<typeof CurriculumOutlineSchema>;

export function parseCurriculumDef(data: unknown): CurriculumDef | null {
  const result = CurriculumDefSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parseCurriculumOutline(data: unknown): CurriculumOutline | null {
  const result = CurriculumOutlineSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parsePhase(data: unknown): Phase | null {
  const result = PhaseSchema.safeParse(data);
  return result.success ? result.data : null;
}
