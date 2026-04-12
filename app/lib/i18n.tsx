"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import nl from "./locales/nl.json";
import pl from "./locales/pl.json";
import ro from "./locales/ro.json";
import hu from "./locales/hu.json";
import cs from "./locales/cs.json";
import hr from "./locales/hr.json";
import el from "./locales/el.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import ar from "./locales/ar.json";
import he from "./locales/he.json";
import tr from "./locales/tr.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import ml from "./locales/ml.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import vi from "./locales/vi.json";
import th from "./locales/th.json";
import id from "./locales/id.json";
import fil from "./locales/fil.json";
import my from "./locales/my.json";
import sw from "./locales/sw.json";
import am from "./locales/am.json";
import yo from "./locales/yo.json";
import zu from "./locales/zu.json";

type TranslationDict = Record<string, string | Record<string, unknown>>;
const locales: Record<string, TranslationDict> = {
  en, es, pt, fr, de, it, nl, pl, ro, hu, cs, hr, el, ru, uk,
  ar, he, tr, hi, bn, ta, te, ml, zh, ja, ko, vi, th, id, fil, my,
  sw, am, yo, zu,
};

type TranslationFn = (key: string, fallback?: string) => string;

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: TranslationFn;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_language");
      if (saved && locales[saved]) setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((code: string) => {
    if (locales[code]) {
      setLocaleState(code);
      if (typeof window !== "undefined") {
        localStorage.setItem("app_language", code);
        document.documentElement.lang = code;
        document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
      }
    }
  }, []);

  const t: TranslationFn = useCallback((key: string, fallback?: string) => {
    const parts = key.split(".");
    let value: unknown = locales[locale];
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
      if (value === undefined) break;
    }
    if (typeof value === "string") return value;

    // Fallback to English
    let enValue: unknown = locales.en;
    for (const part of parts) {
      enValue = (enValue as Record<string, unknown>)?.[part];
      if (enValue === undefined) break;
    }
    if (typeof enValue === "string") return enValue;

    return fallback || key;
  }, [locale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
