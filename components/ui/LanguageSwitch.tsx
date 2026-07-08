"use client";

import { Languages } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

// Segmented EN / 中文 / Melayu pill. `compact` fits the header; the default
// size suits the landing hero.

export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-0.5 rounded-full border border-hairline bg-surface ${
        compact ? "p-0.5" : "p-1"
      }`}
    >
      {!compact && <Languages size={16} className="ml-2 mr-0.5 text-ink-muted" aria-hidden="true" />}
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full font-semibold transition-colors ${
            compact ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm"
          } ${
            lang === code
              ? "bg-aimao-teal text-white"
              : "text-ink-soft hover:bg-tint hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
