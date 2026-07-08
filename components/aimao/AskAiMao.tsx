"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import AiMaoCharacter from "./AiMaoCharacter";
import { useLanguage } from "@/contexts/LanguageContext";

// The always-there invitation back to conversation. A floating AiMao head in
// the bottom-right corner with a page-aware line — every page invites a chat.

const PAGE_PROMPTS: Array<{ match: (p: string) => boolean; key: string }> = [
  { match: (p) => p === "/", key: "ask.home" },
  { match: (p) => p.startsWith("/pathway"), key: "ask.plan" },
  { match: (p) => p.startsWith("/handover"), key: "ask.brief" },
  { match: (p) => p.startsWith("/autopilot"), key: "ask.mind" },
  { match: (p) => p.startsWith("/consent"), key: "ask.consent" },
  { match: (p) => p.startsWith("/onboard"), key: "ask.onboard" },
  { match: (p) => p.startsWith("/tutorial"), key: "ask.tutorial" },
];

// Pages where the floating companion would be redundant or in the way.
const HIDDEN_ON = ["/chat", "/login"];

export default function AskAiMao() {
  const pathname = usePathname() ?? "/";
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const prompt = t(PAGE_PROMPTS.find(({ match }) => match(pathname))?.key ?? "ask.fallback");

  return (
    <div className="print-hidden fixed bottom-5 right-5 z-40 flex items-end gap-2">
      {!dismissed && (
        <div className="relative hidden max-w-[240px] motion-safe:animate-aimao-pop sm:block">
          <div className="rounded-2xl rounded-br-md border border-hairline bg-surface px-4 py-3 shadow-[0_10px_30px_rgba(38,38,43,0.14)]">
            <p className="text-sm leading-snug text-ink-body">{prompt}</p>
            <Link
              href="/chat"
              className="mt-1.5 inline-block text-sm font-bold text-aimao-teal hover:text-aimao-teal-ink"
            >
              {t("ask.cta")}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t("ask.dismiss")}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface text-ink-muted shadow-sm transition-colors hover:text-ink"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}
      <Link
        href="/chat"
        aria-label={`${t("ask.talkAria")} — ${prompt}`}
        className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-hairline bg-surface shadow-[0_12px_32px_rgba(38,38,43,0.18)] transition-transform hover:scale-105 active:scale-95"
      >
        <AiMaoCharacter expression="idle" variant="face" size="sm" className="pointer-events-none translate-y-0.5" />
      </Link>
    </div>
  );
}
