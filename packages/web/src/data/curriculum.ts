import type { Locale } from "../lib/i18n";
import { DEFAULT_LOCALE } from "../lib/i18n";
import { INTERVIEW_PREP_CURRICULUM } from "./curriculums/interview-prep";
import { INTERVIEW_PREP_CURRICULUM_RU } from "./curriculums/interview-prep-ru";
import { UX_DESIGN_INTERVIEW_CURRICULUM } from "./curriculums/ux-design";
import { UX_DESIGN_INTERVIEW_CURRICULUM_RU } from "./curriculums/ux-design-ru";
import type { CurriculumDef } from "./types";

type LocalizedCurriculum = Partial<Record<Locale, CurriculumDef>>;

const LOCALIZED_CURRICULUMS = {
  "interview-prep": { en: INTERVIEW_PREP_CURRICULUM, ru: INTERVIEW_PREP_CURRICULUM_RU },
  "ux-design-interview": { en: UX_DESIGN_INTERVIEW_CURRICULUM, ru: UX_DESIGN_INTERVIEW_CURRICULUM_RU },
} as const satisfies Record<string, LocalizedCurriculum>;

export const CURRICULUM_IDS = Object.keys(LOCALIZED_CURRICULUMS);

export function getCurriculum(id: string, locale: Locale): CurriculumDef | null {
  const entry = (LOCALIZED_CURRICULUMS as Record<string, LocalizedCurriculum>)[id];
  if (!entry) return null;
  return entry[locale] ?? entry[DEFAULT_LOCALE] ?? null;
}

export function listCurriculums(locale: Locale): CurriculumDef[] {
  return CURRICULUM_IDS.map((id) => getCurriculum(id, locale)).filter((c): c is CurriculumDef => c !== null);
}
