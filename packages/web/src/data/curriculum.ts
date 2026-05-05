import type { Locale } from "../lib/i18n";
import { INTERVIEW_PREP_CURRICULUM } from "./curriculums/interview-prep";
import { INTERVIEW_PREP_CURRICULUM_RU } from "./curriculums/interview-prep-ru";
import type { CurriculumDef } from "./types";

export type { CurriculumDef, Phase, Skill, Task } from "./types";

export const CURRICULUMS_BY_LOCALE = {
  en: [INTERVIEW_PREP_CURRICULUM],
  ru: [INTERVIEW_PREP_CURRICULUM_RU],
} as const satisfies Record<Locale, CurriculumDef[]>;
