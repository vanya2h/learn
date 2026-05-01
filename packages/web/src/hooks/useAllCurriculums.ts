import { useMemo } from "react";
import { useRootData } from "../../app/hooks/useRootData";
import { CURRICULUMS } from "../data/curriculum";
import type { CurriculumDef } from "../data/types";

export function useAllCurriculums(): CurriculumDef[] {
  const data = useRootData();
  return useMemo(() => [...CURRICULUMS, ...(data?.customCurriculums ?? [])], [data?.customCurriculums]);
}
