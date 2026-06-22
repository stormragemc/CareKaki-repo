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
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import FlowStepper from "@/components/ui/FlowStepper";
import { loadDemoUser, loadCareProfile, deriveMode } from "@/lib/session";
import { getPhase, getLastPhaseRecord, advancePhase, type PhaseRecord } from "@/lib/care-cycle";
import { useVoiceEvent } from "@/hooks/useVoiceEvent";
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

  // Narrate the brief when the audio guide is on (calm "handover" summary).
  const { refire } = useVoiceEvent("care_brief_ready");

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

  if (loading || !brief) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-caregiver rounded-full animate-pulse" />
          <span className="text-sm text-gray-500">Generating care brief…</span>
        </div>
      </div>
    );
  }

  const eyebrow = mode === "self" ? "text-self-ink" : "text-caregiver-ink";

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col motion-safe:animate-ck-fade-in">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={28} />
          <span className="font-serif font-semibold text-ink text-lg tracking-tight">CareKaki</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/autopilot" className="text-sm text-ink-soft hover:text-ink transition-colors">
            ← Autopilot
          </Link>
          <Link
            href="/pathway"
            className="hidden items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-sm font-medium text-ink-body transition-colors hover:border-caregiver hover:text-caregiver sm:inline-flex"
          >
            <ClipboardList size={15} aria-hidden="true" />
            Care Plan
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
            <div className="flex flex-col gap-1">
              <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] ${eyebrow}`}>
                Care Brief · CareKaki
                <span className="rounded-full bg-cream-deep px-2 py-0.5 text-ink-muted">
                  Phase {phase}
                </span>
              </span>
              <h1 className="font-serif font-semibold text-3xl text-ink leading-tight">
                {brief.senior_name}{brief.age ? `, ${brief.age}` : ""}
              </h1>
            </div>
            <div className="text-right text-sm text-ink-soft leading-snug">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Prepared for</p>
              <p className="font-medium text-ink-body">Care Corner ICCP coordinator</p>
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
                    What happened before · Phase {lastPhase.phase}
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-body">{lastPhase.summary}</p>
                </section>
              )}

              {/* Situation */}
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Situation</h2>
                <p className="text-ink-body leading-relaxed">{brief.situation}</p>
              </section>

              {/* Actions taken by CareKaki */}
              <section className="flex flex-col gap-2.5">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Actions identified &amp; completed
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
                  The next phase · what to do next
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
              {/* Caregiver */}
              <div className="rounded-[14px] border border-hairline bg-tint p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Notified family / caregiver
                </h3>
                <p className="mt-1.5 text-ink-body">{brief.caregiver}</p>
              </div>

              {/* Important notes */}
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                  <AlertTriangle size={14} className="shrink-0" />
                  Important notes
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
                  Consents on file
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>Guardian-checked — PDPA scrubbed</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>No medical advice given by system</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-ink-body">
                    <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                    <span>Caregiver approved autopilot actions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guardian footer */}
          <div className="flex items-center gap-2 border-t border-hairline bg-cream px-7 sm:px-10 py-4">
            <ShieldCheck size={18} className="shrink-0 text-live" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-soft">
              Guardian-checked · PDPA scrubbed · no medical advice given · prototype care brief
            </span>
          </div>
        </article>

        {/* Continue the care cycle */}
        <div className="mt-6 flex flex-col gap-4 rounded-[14px] border border-caregiver-border bg-caregiver-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-caregiver/15 text-caregiver">
              <RefreshCw size={20} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-serif text-lg font-semibold text-caregiver-ink">
                Continue the care cycle
              </p>
              <p className="text-sm leading-relaxed text-ink-body">
                Care doesn&apos;t stop here. Start Phase {phase + 1} — the next steps above
                become a fresh plan, and everything from this phase carries forward.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/pathway"
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink-body transition-colors hover:border-caregiver hover:text-caregiver"
            >
              <ClipboardList size={16} aria-hidden="true" />
              View care plan
            </Link>
            <button
              type="button"
              onClick={beginNextPhase}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-caregiver px-6 text-sm font-semibold text-white transition-colors hover:bg-caregiver-ink"
            >
              Begin Phase {phase + 1} plan
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
