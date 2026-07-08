"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  ClipboardList,
  Bot,
  FileText,
  RefreshCw,
  Volume2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import FlowStepper from "@/components/ui/FlowStepper";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";
import { useVoiceEvent } from "@/hooks/useVoiceEvent";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CareMode } from "@/lib/types";

const STEPS = [
  { Icon: MessageCircle, titleKey: "tutorial.s1t", bodyKey: "tutorial.s1b" },
  { Icon: ClipboardList, titleKey: "tutorial.s2t", bodyKey: "tutorial.s2b" },
  { Icon: Bot, titleKey: "tutorial.s3t", bodyKey: "tutorial.s3b" },
  { Icon: FileText, titleKey: "tutorial.s4t", bodyKey: "tutorial.s4b" },
];

function TutorialInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode: CareMode = searchParams.get("mode") === "self" ? "self" : "caregiver";
  const guide = useAudioGuideCtx();
  const { t } = useLanguage();

  // If the guide is already on (e.g. enabled on an earlier screen), narrate the
  // page automatically on arrival.
  useVoiceEvent("tutorial_overview");

  const readAloud = () => {
    guide.enableSilently();
    guide.speak("tutorial_overview", "", mode);
  };

  const start = () => router.push(`/chat?mode=${mode}`);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2 transition-opacity hover:opacity-80">
          <Logo size={30} />
          <span className="font-serif text-lg font-bold tracking-tight text-ink">CareKaki</span>
        </Link>
        <div className="flex items-center gap-3">
          <AudioGuideButton />
          <TalkToHuman />
        </div>
      </header>

      <FlowStepper activeIndex={-1} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full bg-self-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-self-ink">
            {t("tutorial.beforeBegin")}
          </span>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {t("tutorial.heading")}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            {t("tutorial.sub")}
          </p>
          <button
            type="button"
            onClick={readAloud}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-self-border bg-self-soft px-5 py-2.5 text-sm font-semibold text-self-ink transition-colors hover:bg-self/10"
          >
            <Volume2 size={18} aria-hidden="true" />
            {guide.status === "speaking" ? t("tutorial.reading") : t("tutorial.readAloud")}
          </button>
        </div>

        <ol className="flex flex-col gap-4">
          {STEPS.map(({ Icon, titleKey, bodyKey }) => (
            <li
              key={titleKey}
              className="flex items-start gap-4 rounded-2xl border border-hairline bg-surface p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-self-soft text-self">
                <Icon size={24} aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-xl font-semibold text-ink">{t(titleKey)}</h2>
                <p className="text-base leading-relaxed text-ink-body">{t(bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* The cycle */}
        <div className="flex items-start gap-4 rounded-2xl border border-caregiver-border bg-caregiver-soft p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-caregiver/15 text-caregiver">
            <RefreshCw size={24} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-xl font-semibold text-caregiver-ink">
              {t("tutorial.cycleTitle")}
            </h2>
            <p className="text-base leading-relaxed text-ink-body">{t("tutorial.cycleBody")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-tint px-4 py-3">
          <ShieldCheck size={18} className="shrink-0 text-live" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-soft">{t("tutorial.guardianNote")}</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink sm:w-auto"
          >
            {t("tutorial.ready")}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={start}
            className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            {t("tutorial.skip")}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function TutorialPage() {
  return (
    <Suspense>
      <TutorialInner />
    </Suspense>
  );
}
