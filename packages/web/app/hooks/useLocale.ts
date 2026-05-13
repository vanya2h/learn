import { useRootData } from "./useRootData";

import { DEFAULT_LOCALE, isLocale, type Locale } from "~/lib/i18n";

export function useLocale(): Locale {
  const raw = useRootData()?.locale;
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
}
