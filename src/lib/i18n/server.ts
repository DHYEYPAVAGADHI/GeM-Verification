import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";
import { dictionaries, type Dict } from "./dictionaries";

/** Current locale from the language cookie (falls back to English). */
export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : defaultLocale;
}

/** Locale + its message dictionary, for use in server components. */
export function getDict(): { locale: Locale; dict: Dict } {
  const locale = getLocale();
  return { locale, dict: dictionaries[locale] };
}
