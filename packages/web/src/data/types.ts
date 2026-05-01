import { z } from "zod";

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
});

export type Task = z.infer<typeof TaskSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type CurriculumDef = z.infer<typeof CurriculumDefSchema>;

export function parseCurriculumDef(data: unknown): CurriculumDef | null {
  const result = CurriculumDefSchema.safeParse(data);
  return result.success ? result.data : null;
}
