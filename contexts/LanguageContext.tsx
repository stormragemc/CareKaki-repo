"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LANG_STORAGE_KEY, translate, translateList, type Lang } from "@/lib/i18n";

// App-wide language state. Persisted to localStorage so the choice survives
// reloads; the backend receives it per-request (chat + voice) so LLM replies
// and TTS audio follow the same language. Brand names (AiMao, CareKaki,
// Guardian) stay in English by design.

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tl: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start as "en" on both server and first client render (no hydration
  // mismatch), then adopt the stored choice right after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "zh" || stored === "ms") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const tl = useCallback((key: string) => translateList(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
