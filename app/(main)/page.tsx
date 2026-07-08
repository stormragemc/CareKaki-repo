"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Mic, ArrowRight, Check, ClipboardList } from "lucide-react";
import ModeCard from "@/components/landing/ModeCard";
import AiMaoLive from "@/components/aimao/AiMaoLive";
import AiMaoSpeechBubble from "@/components/aimao/AiMaoSpeechBubble";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCareData } from "@/lib/careData";
import type { CareProfile } from "@/lib/types";

// Session values are read-once per visit; useSyncExternalStore keeps the read
// off the SSR pass (no hydration mismatch) — same pattern as the pathway page.
const noopSubscribe = () => () => {};
function useSessionItem(key: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(key),
    () => null,
  );
}

export default function HomePage() {
  const { lang, t } = useLanguage();
  const { todayPlan, todaySummary } = getCareData(lang);
  const profileRaw = useSessionItem("careProfile");
  const userRaw = useSessionItem("demoUser");

  let elderName = "";
  let userName = "";
  if (profileRaw) {
    try {
      elderName = (JSON.parse(profileRaw) as CareProfile).name ?? "";
    } catch {}
  }
  if (userRaw) {
    try {
      const u = JSON.parse(userRaw) as { name?: string };
      userName = u.name ?? "";
    } catch {}
  }

  const h = new Date().getHours();
  const greeting =
    h < 12 ? t("home.goodMorning") : h < 18 ? t("home.goodAfternoon") : t("home.goodEvening");

  const hasSession = Boolean(profileRaw || userRaw);
  const chatHref = hasSession ? "/chat" : "/onboard?mode=caregiver";
  const bubbleLine = hasSession
    ? `${t("home.bubbleHi")}${userName ? ` ${userName.split(" ")[0]}` : ""}! 👋 ${t("home.bubbleHowHasBeen", {
        name: elderName ? elderName.split(" ")[0] : t("home.yourLovedOne"),
      })}`
    : t("home.bubbleNew");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-6 pb-20 pt-8 sm:pt-10">
      {/* ── Language ── */}
      <div className="mb-6">
        <LanguageSwitch />
      </div>

      {/* ── AiMao hero — the companion, not a dashboard ── */}
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <p className="mb-6 text-lg font-semibold text-ink-soft">
          {greeting}
          {userName ? `, ${userName.split(" ")[0]}` : ""}
        </p>

        <AiMaoLive base="idle" size="xl" className="mb-5" />

        <AiMaoSpeechBubble tail="bottom" className="mb-8 max-w-md -translate-y-2">
          {bubbleLine}
        </AiMaoSpeechBubble>

        <div className="flex flex-col items-center gap-3">
          <Link
            href={chatHref}
            className="inline-flex min-h-[60px] items-center gap-2.5 rounded-full bg-aimao-teal px-9 text-lg font-semibold text-white shadow-[0_12px_30px_rgba(14,110,120,0.30)] transition-all hover:bg-aimao-teal-ink active:scale-[0.98]"
          >
            <Mic size={22} aria-hidden="true" />
            {t("home.talkBtn")}
          </Link>
          <Link href={chatHref} className="text-base text-ink-muted transition-colors hover:text-ink">
            {t("home.orType")}
          </Link>
        </div>
      </section>

      {/* ── Returning household: today at a glance ── */}
      {hasSession ? (
        <section className="mt-14 grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-3xl border border-hairline bg-surface p-6 shadow-[0_8px_24px_rgba(38,38,43,0.06)]">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
              {t("home.today")}
            </h2>
            <p className="text-xl font-semibold text-ink">{todaySummary.headline}</p>
            <p className="text-base leading-relaxed text-ink-soft">{todaySummary.detail}</p>
            <Link
              href="/chat"
              className="mt-auto inline-flex items-center gap-1.5 pt-2 text-base font-bold text-aimao-teal transition-colors hover:text-aimao-teal-ink"
            >
              {t("home.reviewWithAiMao")}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-hairline bg-surface p-6 shadow-[0_8px_24px_rgba(38,38,43,0.06)]">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
              {t("home.todayPlanTitle")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {todayPlan.map((item) => (
                <li key={item.title} className="flex items-center justify-between gap-3 text-base">
                  <span className="flex items-center gap-2.5 text-ink-body">
                    {item.done ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-drawer-green-soft text-aimao-green">
                        <Check size={14} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full border-2 border-hairline-warm" aria-hidden="true" />
                    )}
                    <span className={item.done ? "text-ink-muted line-through" : ""}>{item.title}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-muted">
                    {item.done ? t("home.done") : item.time}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/pathway"
              className="mt-auto inline-flex items-center gap-1.5 pt-2 text-base font-bold text-aimao-teal transition-colors hover:text-aimao-teal-ink"
            >
              <ClipboardList size={17} aria-hidden="true" />
              {t("home.viewTodaysPlan")}
            </Link>
          </div>
        </section>
      ) : (
        /* ── First visit: pick who this is for ── */
        <section className="mt-16 w-full max-w-3xl">
          <h2 className="mb-6 text-center font-serif text-2xl font-semibold text-ink">
            {t("home.whoFor")}
          </h2>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
            <ModeCard
              mode="self"
              title={t("home.modeSelfTitle")}
              description={t("home.modeSelfDesc")}
              href="/onboard?mode=self"
              ctaLabel={t("home.modeSelfCta")}
            />
            <ModeCard
              mode="caregiver"
              title={t("home.modeCgTitle")}
              description={t("home.modeCgDesc")}
              href="/onboard?mode=caregiver"
              ctaLabel={t("home.modeCgCta")}
            />
          </div>
          <p className="mt-8 text-center">
            <Link href="/login" className="text-base text-ink-soft transition-colors hover:text-ink">
              {t("home.alreadySetUp")}{" "}
              <span className="font-semibold underline underline-offset-2">{t("home.signIn")}</span>
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
