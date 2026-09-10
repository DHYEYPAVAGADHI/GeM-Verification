export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie the language toggle writes; read on the server to pick the dictionary. */
export const LOCALE_COOKIE = "gemv_lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export const localeLabel: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};
