import { CURRICULUMS } from "../data/curriculum";
import type { CurriculumDef, Skill } from "../data/types";

export type UnlockedSkill = {
  skill: Skill;
  curriculumId: string;
  curriculumName: string;
  unlockedAt: Date;
};

export type ActivityItem =
  | { type: "skill"; skill: UnlockedSkill; date: Date }
  | { type: "task"; taskId: string; taskTitle: string; curriculumName: string; date: Date };

function resolveSkillUnlock(
  skill: Skill,
  curriculum: CurriculumDef,
  completedTaskIds: Record<string, string>,
  specializations: Record<string, string | null>,
): UnlockedSkill | null {
  const phase = curriculum.phases.find((p) => p.id === skill.unlockedBy.phaseId);
  if (!phase) return null;

  const { branch } = skill.unlockedBy;

  if (branch) {
    if ((specializations[curriculum.id] ?? null) !== branch) return null;
  }

  const tasks = branch ? phase.tasks.filter((t) => t.branch === branch) : phase.tasks.filter((t) => !t.branch);

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
  specializations: Record<string, string | null>,
): UnlockedSkill[] {
  return CURRICULUMS.flatMap((curriculum) =>
    (curriculum.skills ?? [])
      .map((skill) => resolveSkillUnlock(skill, curriculum, completedTaskIds, specializations))
      .filter((s): s is UnlockedSkill => s !== null),
  ).sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
}

export function computeRecentActivity(
  completedTaskIds: Record<string, string>,
  specializations: Record<string, string | null>,
  limit = 8,
): ActivityItem[] {
  const unlockedSkillIds = new Set<string>();
  const items: ActivityItem[] = [];

  for (const unlocked of computeUnlockedSkills(completedTaskIds, specializations)) {
    unlockedSkillIds.add(unlocked.skill.id);
    items.push({ type: "skill", skill: unlocked, date: unlocked.unlockedAt });
  }

  for (const curriculum of CURRICULUMS) {
    for (const phase of curriculum.phases) {
      for (const task of phase.tasks) {
        const ts = completedTaskIds[task.id];
        if (!ts) continue;
        items.push({
          type: "task",
          taskId: task.id,
          taskTitle: task.title,
          curriculumName: curriculum.name,
          date: new Date(ts),
        });
      }
    }
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
