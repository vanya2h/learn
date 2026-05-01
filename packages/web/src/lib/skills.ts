import type { CurriculumDef, Skill } from "../data/types";

export type UnlockedSkill = {
  skill: Skill;
  curriculumId: string;
  curriculumName: string;
  unlockedAt: Date;
};

function resolveSkillUnlock(
  skill: Skill,
  curriculum: CurriculumDef,
  completedTaskIds: Record<string, string>,
): UnlockedSkill | null {
  const phase = curriculum.phases.find((p) => p.id === skill.unlockedBy.phaseId);
  if (!phase) return null;

  const tasks = phase.tasks;

  if (tasks.length === 0 || !tasks.every((t) => !!completedTaskIds[t.id])) return null;

  const timestamps = tasks
    .map((t) => completedTaskIds[t.id])
    .filter((ts): ts is string => ts !== undefined)
    .map((ts) => new Date(ts))
    .sort((a, b) => b.getTime() - a.getTime());

  const [unlockedAt] = timestamps;
  if (!unlockedAt) return null;

  return { skill, curriculumId: curriculum.id, curriculumName: curriculum.name, unlockedAt };
}

export function computeUnlockedSkills(
  completedTaskIds: Record<string, string>,
  curriculums: CurriculumDef[],
): UnlockedSkill[] {
  return curriculums
    .flatMap((curriculum) =>
      (curriculum.skills ?? [])
        .map((skill) => resolveSkillUnlock(skill, curriculum, completedTaskIds))
        .filter((s): s is UnlockedSkill => s !== null),
    )
    .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
}
