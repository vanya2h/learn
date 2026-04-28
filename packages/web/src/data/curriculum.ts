import { INTERVIEW_PREP_CURRICULUM } from "./curriculums/interview-prep";
import { ML_CURRICULUM } from "./curriculums/ml";
import type { CurriculumDef } from "./types";

export type { SpecializationId } from "./curriculums/ml";
export { SPECIALIZATION_INFO } from "./curriculums/ml";
export type { CurriculumDef, Phase, Skill, Task } from "./types";

export const CURRICULUMS: CurriculumDef[] = [ML_CURRICULUM, INTERVIEW_PREP_CURRICULUM];
