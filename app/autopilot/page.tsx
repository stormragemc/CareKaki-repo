"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import GuardianBand from "@/components/ui/GuardianBand";
import FlowStepper from "@/components/ui/FlowStepper";
import AgentWorkspace, { resolveActivePanelIds } from "@/components/autopilot/AgentWorkspace";
import { loadDemoUser, loadCareProfile } from "@/lib/session";
import { useVoiceEvent } from "@/hooks/useVoiceEvent";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";

export default function AutopilotPage() {
  const guide = useAudioGuideCtx();
  const [name, setName] = useState("");
  const [approved, setApproved] = useState(false);
  // Count reflects the services this case actually needs, not a fixed 5.
  const [serviceCount, setServiceCount] = useState(resolveActivePanelIds().length);
  // The "cycle" nudge: once everything's been seen (or it's been running a
  // while), suggest moving on to the Care Brief and the next phase.
  const [cycleReady, setCycleReady] = useState(false);
  const [cycleDismissed, setCycleDismissed] = useState(false);

  useEffect(() => {
    const user = loadDemoUser();
    const profile = loadCareProfile();
    // sessionStorage is client-only; reading it after mount keeps SSR/hydration in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user?.name ?? profile?.name ?? "your loved one");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServiceCount(resolveActivePanelIds().length);
  }, []);

  // Voice: explain autopilot actions before approval (wait for name to load)
  const panelIds = resolveActivePanelIds();
  const panelNames = panelIds.join(", ");
  const { refire: refireExplanation } = useVoiceEvent(
    "autopilot_explanation",
    `Services planned: ${panelNames}. For ${name || "the patient"}.`,
    [],
    { skipInitial: true },
  );

  // Fire voice once data is resolved (useEffect runs after mount)
  const voiceFiredRef = useRef(false);
  useEffect(() => {
    if (voiceFiredRef.current) return;
    voiceFiredRef.current = true;
    // Small delay to let sessionStorage reads settle
    const t = setTimeout(() => {
      const resolvedName = name || "the patient";
      refireExplanation(`Services planned: ${panelNames}. For ${resolvedName}.`);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, serviceCount]);

  const approvedByVoiceRef = useRef(false);

  // Register voice input: speech → approve/ask/change + voice reply
  useEffect(() => {
    guide.registerVoiceInput((transcript: string) => {
      if (!transcript.trim()) return;
      const lower = transcript.toLowerCase();

      const isApprove = ["approve", "go ahead", "yes", "confirm", "run it", "do it", "proceed"].some(
        (w) => lower.includes(w)
      );

      if (isApprove && !approved) {
        approvedByVoiceRef.current = true;
        setApproved(true);
      }

      // Single voice reply — covers both approval acknowledgment and questions
      guide.speak("voice_input_autopilot", transcript);
    });
    return () => guide.unregisterVoiceInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.enabled, approved]);

  // Fallback so the nudge always appears in the demo: ~18s after approval.
  useEffect(() => {
    if (!approved) return;
    const t = setTimeout(() => setCycleReady(true), 18000);
    return () => clearTimeout(t);
  }, [approved]);

  const showCyclePopup = approved && cycleReady && !cycleDismissed;

  return (
    <div className="min-h-screen bg-autopilot-bg text-autopilot-text flex flex-col motion-safe:animate-ck-fade-in">
      {/* Dark header — the deliberate "machine world" mood shift */}
      <header className="sticky top-0 z-50 bg-autopilot-bg/95 backdrop-blur-sm border-b border-autopilot-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Logo size={28} theme="dark" />
            <span className="flex flex-col leading-tight">
              <span className="font-serif font-semibold text-autopilot-text text-lg tracking-tight">
                AiMao&apos;s Mind
              </span>
              <span className="text-xs text-autopilot-muted">
                expert view · {serviceCount} {serviceCount === 1 ? "process" : "processes"} {approved ? "running" : "drafted"} for {name}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/pathway"
              className="text-sm text-autopilot-muted hover:text-autopilot-text transition-colors"
            >
              ← Back to plan
            </Link>
            <AudioGuideButton theme="dark" />
            <TalkToHuman theme="dark" />
          </div>
        </div>
      </header>

      <FlowStepper theme="dark" />

      {/* Guardian wraps everything AiMao runs, then the live workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 overflow-hidden">
        {/* How AiMao thinks — the pipeline behind the friendly face. Structured
            system states only; never hidden chain-of-thought. */}
        <div className="overflow-x-auto rounded-xl border border-autopilot-hairline bg-autopilot-card/60 px-4 py-2.5">
          <ol className="flex min-w-max items-center gap-2 text-xs text-autopilot-muted">
            {[
              "Observation received",
              "Signal extraction",
              "Profile update",
              "Baseline comparison",
              "Change detection",
              "Guardian validation",
              "Care Brief",
            ].map((step, i, arr) => (
              <li key={step} className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${approved ? "bg-autopilot-pill text-autopilot-text" : "bg-autopilot-band text-autopilot-muted"}`}>
                  {step}
                </span>
                {i < arr.length - 1 && <span aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        </div>
        <GuardianBand theme="dark" count={serviceCount} />
        <div className="flex-1 overflow-hidden">
          <AgentWorkspace approved={approved} onAllPanelsViewed={() => setCycleReady(true)} />
        </div>
      </main>

      {/* Care-cycle nudge — once the work's been seen, move on to the Care Brief */}
      {showCyclePopup && (
        <div className="fixed bottom-24 right-4 z-50 w-[330px] max-w-[calc(100vw-2rem)] motion-safe:animate-ck-fade-in">
          <div className="rounded-2xl border border-autopilot-hairline bg-autopilot-card p-4 shadow-[0_16px_38px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-autopilot-text">Autopilot has done its part</p>
              <button
                type="button"
                onClick={() => setCycleDismissed(true)}
                aria-label="Dismiss"
                className="text-autopilot-muted transition-colors hover:text-autopilot-text"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-autopilot-muted">
              When you&apos;re ready, open the Care Brief to review everything and set up the
              next phase of {name}&apos;s care.
            </p>
            <Link
              href="/handover"
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-full bg-self px-5 text-sm font-semibold text-white transition-colors hover:bg-self-ink"
            >
              Go to Care Brief
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Draft / approve gate */}
      <footer className="sticky bottom-0 z-40 bg-autopilot-band/95 backdrop-blur-sm border-t border-autopilot-hairline">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {approved ? (
            <>
              <p className="text-sm text-autopilot-muted">
                All {serviceCount} running under Guardian · each service is executing its own live flow.
              </p>
              <Link
                href="/handover"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
              >
                Continue to Care Brief →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-autopilot-muted">
                {serviceCount} services drafted · Guardian wrapping all {serviceCount} · awaiting your approval
                <span className="block text-xs text-autopilot-muted/70">
                  Nothing irreversible runs until you approve. Reject to adjust the plan, or coordinator escalation may proceed to reach a human faster.
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/pathway"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-autopilot-hairline px-5 text-sm font-semibold text-autopilot-text transition-colors hover:bg-autopilot-card"
                >
                  Reject &amp; edit plan
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setApproved(true);
                    if (guide.enabled && !approvedByVoiceRef.current) {
                      guide.speak("autopilot_approved");
                    }
                    approvedByVoiceRef.current = false;
                  }}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
                >
                  Approve all
                </button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
