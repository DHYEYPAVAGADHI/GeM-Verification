"use client";

import { createContext, useCallback, useContext } from "react";
import { LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries, type Dict } from "./dictionaries";

type I18nValue = {
  locale: Locale;
  dict: Dict;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const setLocale = useCallback((l: Locale) => {
    // One year, site-wide. Server components read this on the next request.
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    // Server components can't react to a client cookie change — reload to
    // re-render the whole tree in the new language.
    window.location.reload();
  }, []);

  return (
    <I18nContext.Provider value={{ locale, dict: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so a client component used outside a provider still renders.
    return {
      locale: "en",
      dict: dictionaries.en,
      setLocale: () => {},
    };
  }
  return ctx;
}
