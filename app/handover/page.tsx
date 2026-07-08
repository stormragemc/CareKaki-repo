"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  Star,
  ArrowRight,
  AlertTriangle,
  Info,
  History,
  ClipboardList,
  RefreshCw,
  Printer,
  Copy,
  MessageCircleHeart,
  TrendingDown,
  HelpCircle,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";
import AiMaoLive from "@/components/aimao/AiMaoLive";
import { briefTraceability } from "@/lib/demoCareData";
import { getCareData } from "@/lib/careData";
import { useLanguage } from "@/contexts/LanguageContext";
import TalkToHuman from "@/components/ui/TalkToHuman";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import FlowStepper from "@/components/ui/FlowStepper";
import { loadDemoUser, loadCareProfile, deriveMode } from "@/lib/session";
import { getPhase, getLastPhaseRecord, advancePhase, type PhaseRecord } from "@/lib/care-cycle";
import { useVoiceEvent } from "@/hooks/useVoiceEvent";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";
import type { CareMode, CareProfile } from "@/lib/types";

interface LiveBrief {
  senior_name: string;
  age: number;
  situation: string;
  caregiver: string;
  actions_taken: string[];
  next_steps: string[];
  important_notes: string[];
  generated_at: string;
}

export default function HandoverPage() {
  const router = useRouter();
  const [brief, setBrief] = useState<LiveBrief | null>(null);
  const [mode, setMode] = useState<CareMode>("caregiver");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(1);
  const [lastPhase, setLastPhase] = useState<PhaseRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const guide = useAudioGuideCtx();
  const { lang, t } = useLanguage();
  const { briefRecentChanges, briefTimeline, briefWhyFlagged, briefDiscussPoints } =
    getCareData(lang);

  // Narrate the brief when the audio guide is on (calm "handover" summary).
  const { refire } = useVoiceEvent("care_brief_ready", "", [], { skipInitial: true });

  // Register voice input: speech → ask about the brief + voice reply
  useEffect(() => {
    guide.registerVoiceInput((transcript: string) => {
      if (!transcript.trim()) return;
      guide.speak("voice_input_care_brief", transcript);
    });
    return () => guide.unregisterVoiceInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.enabled]);

  useEffect(() => {
    const user = loadDemoUser();
    const profile: CareProfile | null = user?.profile ?? loadCareProfile();
    const m = deriveMode(user);
    setMode(m);
    setPhase(getPhase());
    setLastPhase(getLastPhaseRecord());

    const name = user?.name ?? profile?.name ?? "Your loved one";
    const age = profile?.age ?? 0;
    const situation = profile
      ? `${name}, ${age}. ${profile.recentEvent || "Care plan assembled"}. ${profile.living || ""} ${profile.conditions || ""}`.trim()
      : "A care plan has been assembled and is ready for a coordinator.";

    fetch("http://localhost:8000/care-brief/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senior_name: name,
        age,
        situation,
        caregiver: profile?.caregiver ?? "Not specified",
      }),
    })
      .then((res) => res.json())
      .then((data: LiveBrief) => {
        setBrief(data);
        // Give the voice a real summary to read instead of an empty handover.
        const ctx = `${name}, ${age}. Done: ${data.actions_taken.slice(0, 3).join("; ")}. Next: ${data.next_steps.slice(0, 2).join("; ")}.`;
        refire(ctx);
      })
      .catch(() => {
        setBrief({
          senior_name: name,
          age,
          situation,
          caregiver: profile?.caregiver ?? "Not specified",
          actions_taken: ["Care profile assembled", "Services drafted under Guardian"],
          next_steps: ["Follow up with care coordinator", "Schedule check-in within 48 hours"],
          important_notes: ["This is a prototype care brief."],
          generated_at: new Date().toLocaleString("en-SG"),
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beginNextPhase = () => {
    if (!brief) return;
    const summary = `Phase ${phase}: ${brief.actions_taken.length} action${
      brief.actions_taken.length === 1 ? "" : "s"
    } completed for ${brief.senior_name}. Carrying forward: ${
      brief.next_steps[0] ?? "scheduled follow-ups"
    }.`;
    advancePhase(summary);
    router.push("/pathway");
  };

  const copyBrief = async () => {
    if (!brief) return;
    const text = [
      `CARE BRIEF — ${brief.senior_name}${brief.age ? `, ${brief.age}` : ""}`,
      "",
      "Recent changes:",
      ...briefRecentChanges.map((c) => `• ${c}`),
      "",
      "Situation: " + brief.situation,
      "",
      "Next steps:",
      ...brief.next_steps.map((s) => `• ${s}`),
      "",
      `Based on ${briefTraceability.observations} caregiver observations and ${briefTraceability.daysOfHistory} days of activity history.`,
      "Guardian-checked · PDPA scrubbed · no medical advice · human review required",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading || !brief) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AiMaoLive base="thinking" size="md" />
          <span className="text-base text-ink-soft">{t("brief.generating")}</span>
        </div>
      </div>
    );
  }

  const eyebrow = mode === "self" ? "text-self-ink" : "text-caregiver-ink";

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col motion-safe:animate-ck-fade-in">
      <header className="print-hidden px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={28} />
          <span className="font-serif font-semibold text-ink text-lg tracking-tight">CareKaki</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/autopilot" className="text-sm text-ink-soft hover:text-ink transition-colors">
            {t("brief.backToMind")}
          </Link>
          <Link
            href="/pathway"
            className="hidden items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-sm font-medium text-ink-body transition-colors hover:border-caregiver hover:text-caregiver sm:inline-flex"
          >
            <ClipboardList size={15} aria-hidden="true" />
            {t("nav.carePlan")}
          </Link>
          <AudioGuideButton />
          <TalkToHuman />
        </div>
      </header>

      <FlowStepper />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-6">
        {/* Care Brief document */}
        <article className="bg-surface rounded-[14px] shadow-[0_14px_40px_rgba(30,42,51,0.10)] overflow-hidden">
          {/* Letterhead */}
          <div className="flex flex-wrap items-end justify-between gap-3 px-7 sm:px-10 pt-9 pb-5 border-b-2 border-ink">
            <div className="flex items-end gap-4">
              <AiMaoCharacter expression="idle" variant="face" size="sm" className="mb-1 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] ${eyebrow}`}>
                  {t("brief.eyebrow")}
                  <span className="rounded-full bg-cream-deep px-2 py-0.5 text-ink-muted">
                    {t("brief.phase")} {phase}
                  </span>
                </span>
                <h1 className="font-serif font-semibold text-3xl text-ink leading-tight">
                  {brief.senior_name}{brief.age ? `, ${brief.age}` : ""}
                </h1>
              </div>
            </div>
            <div className="text-right text-sm text-ink-soft leading-snug">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">{t("brief.preparedFor")}</p>
              <p className="font-medium text-ink-body">{t("brief.coordinator")}</p>
              <p className="text-ink-muted">{brief.generated_at}</p>
            </div>
          </div>

          <div className="grid gap-8 px-7 sm:px-10 py-8 md:grid-cols-[1.2fr_1fr]">
            {/* Left column */}
            <div className="flex flex-col gap-7">
              {/* What happened before — only once the cycle has a history */}
              {phase > 1 && lastPhase && (
                <section className="flex flex-col gap-2 rounded-[14px] border border-hairline bg-tint p-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    <History size={14} className="shrink-0" aria-hidden="true" />
                    {t("brief.before", { phase: lastPhase.phase })}
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-body">{lastPhase.summary}</p>
                </section>
              )}

              {/* Recent changes — the early-warning heart of the brief */}
              <section className="print-break-avoid flex flex-col gap-2.5 rounded-[14px] border border-drawer-orange/50 bg-drawer-orange-soft p-4">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-body">
                  <TrendingDown size={14} className="shrink-0 text-drawer-orange" aria-hidden="true" />
                  {t("brief.recentChanges")}
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {briefRecentChanges.map((change) => (
                    <li key={change} className="text-sm leading-relaxed text-ink-body">
                      • {change}
                    </li>
                  ))}
                </ul>
                <ol className="mt-2 flex flex-col gap-1 border-t border-drawer-orange/30 pt-2.5">
                  {briefTimeline.map(({ day, note }) => (
                    <li key={day} className="flex items-baseline gap-3 text-sm">
                      <span className="w-10 shrink-0 font-bold uppercase text-ink-muted">{day}</span>
                      <span className="text-ink-body">{note}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Situation */}
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">{t("brief.situation")}</h2>
                <p className="text-ink-body leading-relaxed">{brief.situation}</p>
              </section>

              {/* Actions taken by CareKaki */}
              <section className="flex flex-col gap-2.5">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.actionsDone")}
                  <span className="rounded-full bg-status-done-bg px-2 py-0.5 text-status-done">
                    {brief.actions_taken.length}
                  </span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {brief.actions_taken.map((action, i) => {
                    const isHighlight =
                      action.toLowerCase().includes("sent") ||
                      action.toLowerCase().includes("alerted") ||
                      action.toLowerCase().includes("responded");
                    return (
                      <li key={i} className="flex items-start gap-2.5 text-ink-body text-sm">
                        {isHighlight ? (
                          <Star size={16} className="mt-0.5 shrink-0 fill-self text-self" aria-hidden="true" />
                        ) : (
                          <Check size={16} className="mt-0.5 shrink-0 text-apply-ink" aria-hidden="true" />
                        )}
                        <span>{action}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Recommended next steps — these seed the next care plan phase */}
              <section className="flex flex-col gap-2.5">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.nextPhase")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {brief.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-ink-body text-sm">
                      <ArrowRight size={16} className="mt-0.5 shrink-0 text-caregiver" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Why AiMao flagged this — explainable, rules-based */}
              <div className="print-break-avoid rounded-[14px] border border-aimao-teal/30 bg-aimao-teal-soft p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-aimao-teal-ink">
                  <HelpCircle size={14} className="shrink-0" aria-hidden="true" />
                  {t("brief.whyFlagged")}
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {briefWhyFlagged.map((reason) => (
                    <li key={reason} className="text-sm leading-relaxed text-ink-body">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What may be useful to discuss */}
              <div className="print-break-avoid rounded-[14px] border border-hairline bg-surface p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.usefulDiscuss")}
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {briefDiscussPoints.map((point) => (
                    <li key={point} className="text-sm leading-relaxed text-ink-body">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Traceability */}
              <div className="rounded-[14px] border border-hairline bg-tint p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.traceability")}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                  {t("brief.traceBasedOn")}{" "}
                  <span className="font-semibold">
                    {t("brief.traceObservations", { n: briefTraceability.observations })}
                  </span>{" "}
                  {t("brief.traceAnd")}{" "}
                  <span className="font-semibold">
                    {t("brief.traceDays", { n: briefTraceability.daysOfHistory })}
                  </span>
                  . {t("brief.traceNote")}
                </p>
              </div>

              {/* Caregiver */}
              <div className="rounded-[14px] border border-hairline bg-tint p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.notified")}
                </h3>
                <p className="mt-1.5 text-ink-body">{brief.caregiver}</p>
              </div>

              {/* Important notes */}
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                  <AlertTriangle size={14} className="shrink-0" />
                  {t("brief.importantNotes")}
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {brief.important_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <Info size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Consents */}
              <div className="rounded-[14px] border border-hairline bg-surface p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t("brief.consents")}
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>{t("brief.consentPdpa")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>{t("brief.consentNoAdvice")}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>{t("brief.consentApproved")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guardian footer */}
          <div className="flex items-center gap-2 border-t border-hairline bg-cream px-7 sm:px-10 py-4">
            <ShieldCheck size={18} className="shrink-0 text-live" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-soft">{t("brief.guardianFooter")}</span>
          </div>
        </article>

        {/* Share / act on the brief */}
        <div className="print-hidden mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[46px] items-center gap-1.5 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink-body transition-colors hover:border-aimao-teal hover:text-aimao-teal"
          >
            <Printer size={16} aria-hidden="true" />
            {t("brief.print")}
          </button>
          <button
            type="button"
            onClick={copyBrief}
            className="inline-flex min-h-[46px] items-center gap-1.5 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink-body transition-colors hover:border-aimao-teal hover:text-aimao-teal"
          >
            {copied ? <Check size={16} className="text-status-done" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? t("brief.copied") : t("brief.copy")}
          </button>
          <Link
            href="/chat"
            className="inline-flex min-h-[46px] items-center gap-1.5 rounded-full bg-aimao-teal px-5 text-sm font-semibold text-white transition-colors hover:bg-aimao-teal-ink"
          >
            <MessageCircleHeart size={16} aria-hidden="true" />
            {t("brief.reviewWithAiMao")}
          </Link>
          <p className="ml-1 text-xs text-ink-muted">{t("brief.youControl")}</p>
        </div>

        {/* Continue the care cycle */}
        <div className="print-hidden mt-6 flex flex-col gap-4 rounded-[14px] border border-caregiver-border bg-caregiver-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-caregiver/15 text-caregiver">
              <RefreshCw size={20} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-serif text-lg font-semibold text-caregiver-ink">
                {t("brief.cycleTitle")}
              </p>
              <p className="text-sm leading-relaxed text-ink-body">
                {t("brief.cycleText", { phase: phase + 1 })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/pathway"
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink-body transition-colors hover:border-caregiver hover:text-caregiver"
            >
              <ClipboardList size={16} aria-hidden="true" />
              {t("brief.viewCarePlan")}
            </Link>
            <button
              type="button"
              onClick={beginNextPhase}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-caregiver px-6 text-sm font-semibold text-white transition-colors hover:bg-caregiver-ink"
            >
              {t("brief.beginPhase", { phase: phase + 1 })}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
