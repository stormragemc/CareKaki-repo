"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, ArrowRight, CalendarDays, Sparkles, Brain } from "lucide-react";
import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";
import AiMaoSpeechBubble from "@/components/aimao/AiMaoSpeechBubble";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import { loadDemoUser, loadCareProfile, deriveMode } from "@/lib/session";
import type { CareMode } from "@/lib/types";

interface TodayItem {
  label: string;
  time: string;
  done?: boolean;
}

// Isolated demo fixtures for the calm "today" glance (real plan lives in /pathway).
const TODAY_PLAN: TodayItem[] = [
  { label: "Morning walk", time: "Done", done: true },
  { label: "Chair exercise", time: "3:00 PM" },
  { label: "Hydration reminder", time: "5:00 PM" },
];

export default function HomePage() {
  const router = useRouter();
  const [subject, setSubject] = useState("your loved one");
  const [mode, setMode] = useState<CareMode>("caregiver");
  const [greetName, setGreetName] = useState<string | undefined>();

  useEffect(() => {
    const user = loadDemoUser();
    const profile = user?.profile ?? loadCareProfile();
    const m = deriveMode(user);
    // Client-only session reads resolved once after mount (SSR-safe).
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode(m);
    setSubject(profile?.name ?? "your loved one");
    // Caregiver greeting uses the caregiver's context; self mode greets the senior.
    setGreetName(m === "self" ? profile?.name : firstWord(profile?.caregiver));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const timeOfDay = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  const spokenLine =
    mode === "self"
      ? "How are you feeling today?"
      : `How has ${firstName(subject)} been today?`;

  const goChat = (context?: string) => {
    try {
      if (context) sessionStorage.setItem("aimaoContext", context);
    } catch {}
    router.push(`/chat?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-aimao-cream text-aimao-ink">
      {/* Calm header */}
      <header className="sticky top-0 z-40 border-b border-aimao-hairline bg-aimao-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link href="/home" className="flex items-center gap-2.5">
            <AiMaoCharacter expression="idle" size={40} />
            <span className="font-serif text-xl font-semibold tracking-tight">AiMao</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/care-plan"
              className="hidden rounded-full px-4 py-2 text-base font-medium text-aimao-ink-soft transition-colors hover:bg-white sm:block"
            >
              Care Plan
            </Link>
            <Link
              href="/handover"
              className="hidden rounded-full px-4 py-2 text-base font-medium text-aimao-ink-soft transition-colors hover:bg-white sm:block"
            >
              Care Brief
            </Link>
            <AudioGuideButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-8 sm:py-12">
        {/* Hero — AiMao is the main character */}
        <section className="flex flex-col items-center gap-6 text-center">
          <p className="text-lg font-medium text-aimao-ink-soft">
            {timeOfDay()}{greetName ? `, ${greetName}` : ""}
          </p>
          <AiMaoCharacter expression="idle" size="xl" />
          <AiMaoSpeechBubble tail="bottom" className="max-w-md">
            {spokenLine}
          </AiMaoSpeechBubble>

          {/* Primary actions — large and touch-friendly */}
          <div className="mt-2 flex w-full max-w-md flex-col gap-3">
            <button
              onClick={() => goChat()}
              className="flex items-center justify-center gap-3 rounded-2xl bg-aimao-teal px-6 py-5 text-xl font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95"
            >
              <Mic size={24} aria-hidden="true" />
              Talk to AiMao
            </button>
            <button
              onClick={() => goChat()}
              className="rounded-2xl border border-aimao-hairline bg-white px-6 py-4 text-lg text-aimao-ink-soft transition-colors hover:text-aimao-ink"
            >
              or type something…
            </button>
          </div>
        </section>

        {/* Today — a gentle nudge toward conversation */}
        <section className="rounded-3xl border border-aimao-hairline bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={20} className="text-aimao-teal" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Today</h2>
          </div>
          <p className="text-lg leading-relaxed text-aimao-ink-body">
            {firstName(subject)} seems mostly stable. One small change may be worth a quick chat.
          </p>
          <button
            onClick={() => goChat("Review today's change with AiMao")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-aimao-teal-soft px-5 py-2.5 text-base font-semibold text-aimao-teal-ink transition-colors hover:bg-aimao-teal hover:text-white"
          >
            Review with AiMao
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>

        {/* Today's Care Plan — compact glance, deep dive in /pathway */}
        <section className="rounded-3xl border border-aimao-hairline bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={20} className="text-aimao-blue" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Today&apos;s Care Plan</h2>
          </div>
          <ul className="flex flex-col divide-y divide-aimao-hairline">
            {TODAY_PLAN.map((item) => (
              <li key={item.label} className="flex items-center justify-between py-3.5">
                <span className="text-lg">{item.label}</span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-base font-medium",
                    item.done
                      ? "bg-aimao-green-soft text-aimao-green"
                      : "bg-aimao-cream-deep text-aimao-ink-soft",
                  ].join(" ")}
                >
                  {item.done ? "Done ✓" : item.time}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/pathway"
            className="mt-5 inline-flex items-center gap-2 text-lg font-semibold text-aimao-teal hover:underline"
          >
            View today&apos;s plan
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        {/* Secondary, intentionally quiet: how AiMao thinks (the old Autopilot) */}
        <div className="flex justify-center pt-2">
          <Link
            href="/autopilot"
            className="inline-flex items-center gap-2 text-base text-aimao-ink-faint transition-colors hover:text-aimao-ink-soft"
          >
            <Brain size={17} aria-hidden="true" />
            Explore how AiMao thinks
          </Link>
        </div>
      </main>
    </div>
  );
}

function firstWord(s?: string): string | undefined {
  if (!s) return undefined;
  return s.split(/[\s,]+/)[0] || undefined;
}
function firstName(s: string): string {
  return s.split(/[\s,]+/)[0] || s;
}
