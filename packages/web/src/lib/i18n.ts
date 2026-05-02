import { i18n } from "@lingui/core";
import { messages as enMessages } from "../locales/en/messages.po";
import { messages as ruMessages } from "../locales/ru/messages.po";

export const LOCALES = ["en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const catalogs: Record<Locale, typeof enMessages> = {
  en: enMessages,
  ru: ruMessages,
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function activateLocale(locale: Locale) {
  i18n.loadAndActivate({ locale, messages: catalogs[locale] });
}

const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  en: "Respond in English.",
  ru: "Respond in Russian (Русский). All prose, explanations, headings, list items, hints, and reflection prompts must be in Russian. Keep code, code identifiers, JSON keys, and language tags (typescript, python, bash, etc.) in English. Translate technical terms idiomatically — do not transliterate every English word.",
};

export function languageInstruction(locale: Locale): string {
  return LANGUAGE_INSTRUCTIONS[locale];
}

export function localizeSystem(locale: Locale, system: string): string {
  return `${languageInstruction(locale)}\n\n${system}`;
}

export function getLocaleFromRequest(request: Request): Locale {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)locale=(\w+)/);
  if (match?.[1] && isLocale(match[1])) return match[1];

  const accept = request.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const lang = part.trim().split(";")[0]?.split("-")[0];
    if (lang && isLocale(lang)) return lang;
  }

  return DEFAULT_LOCALE;
}

export { i18n };
