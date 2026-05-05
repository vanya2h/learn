import { useMemo } from "react";
import { useRootData } from "../../app/hooks/useRootData";
import { CURRICULUMS_BY_LOCALE } from "../data/curriculum";
import type { CurriculumDef } from "../data/types";
import { DEFAULT_LOCALE } from "../lib/i18n";

export function useAllCurriculums(): CurriculumDef[] {
  const data = useRootData();
  const locale = data?.locale ?? DEFAULT_LOCALE;
  return useMemo(
    () => [...CURRICULUMS_BY_LOCALE[locale], ...(data?.customCurriculums ?? [])],
    [locale, data?.customCurriculums],
  );
}
