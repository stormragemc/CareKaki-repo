"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import PathwayBoard from "@/components/pathway/PathwayBoard";
import { getPathwayPlan, modeForPersona } from "@/components/pathway/pathwayData";
import ModeChip from "@/components/ui/ModeChip";
import FlowStepper from "@/components/ui/FlowStepper";
import type { CareMode, CareProfile, PathwayItem } from "@/lib/types";
import type { PhaseRecord } from "@/lib/care-cycle";
import type { DemoUser } from "@/lib/demo-users";
import { useVoiceEvent } from "@/hooks/useVoiceEvent";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";
import AskAiMao from "@/components/aimao/AskAiMao";
import { apiUrl } from "@/lib/api";

// Session values are read-once and never mutate during a visit, so the
// subscription is a no-op; useSyncExternalStore keeps the client read off the
// SSR pass (no hydration mismatch) without a setState-in-effect.
const noopSubscribe = () => () => {};

function useSessionItem(key: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(key),
    () => null,
  );
}

interface ChatMsg {
  role: "user" | "system";
  text: string;
}

const SUGGESTIONS = [
  "Remove the MediFund top-up — we already applied",
  "Add a befriender visit this week",
  "Make the medication review more urgent",
];

export default function PathwayPage() {
  const profileRaw = useSessionItem("careProfile");
  const userRaw = useSessionItem("demoUser");

  let patientName = "";
  if (profileRaw) {
    try {
      patientName = (JSON.parse(profileRaw) as CareProfile).name;
    } catch {
      /* keep default */
    }
  }

  // The real fork is the selected persona (spec §1), not the cosmetic ?mode=
  // label. Onboard users (no demo user) fall back to caregiver.
  let mode: CareMode = "caregiver";
  let personaId: string | undefined;
  if (userRaw) {
    try {
      personaId = (JSON.parse(userRaw) as DemoUser).id;
      mode = modeForPersona(personaId) ?? "caregiver";
    } catch {
      /* keep default */
    }
  }

  // Care cycle — which phase this plan is, and what carried over from the last one.
  const phaseRaw = useSessionItem("carePhase");
  const historyRaw = useSessionItem("carePhaseHistory");
  const phase = phaseRaw ? parseInt(phaseRaw, 10) || 1 : 1;
  let lastPhase: PhaseRecord | null = null;
  if (historyRaw) {
    try {
      const history = JSON.parse(historyRaw) as PhaseRecord[];
      lastPhase = history.length ? history[history.length - 1] : null;
    } catch {
      /* ignore */
    }
  }

  const baseItems = getPathwayPlan(mode, personaId);
  // Edits overlay the persona base; null = untouched (keeps SSR/hydration clean).
  const [editedItems, setEditedItems] = useState<PathwayItem[] | null>(null);
  const items = editedItems ?? baseItems;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const editFromVoiceRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const guide = useAudioGuideCtx();

  // Voice: announce care plan on first load
  const planSummary = items.map((it) => it.title).join(", ");
  useVoiceEvent("care_plan_created", `Plan for ${patientName || "the patient"}: ${planSummary}`);

  // Register voice input: speech → edit the care plan + voice reply
  useEffect(() => {
    guide.registerVoiceInput((transcript: string) => {
      if (!transcript.trim()) return;
      const lower = transcript.toLowerCase();

      // If it sounds like an edit, send it through the editor
      const isEdit = ["remove", "add", "change", "update", "make", "skip", "don't", "move"].some(
        (w) => lower.includes(w)
      );

      if (isEdit) {
        editFromVoiceRef.current = true;
        setChatOpen(true);
        sendEdit(transcript);
      }

      // Voice reply — this is the only audio that plays for voice input
      guide.speak("voice_input_pathway", transcript);
    });
    return () => guide.unregisterVoiceInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.enabled, items, mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const title = patientName ? `${patientName}'s care plan` : "Your care plan";

  const sendEdit = async (raw: string) => {
    const feedback = raw.trim();
    if (!feedback || editing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: feedback }]);
    setEditing(true);
    const fromVoice = editFromVoiceRef.current;
    editFromVoiceRef.current = false;
    if (guide.enabled && !fromVoice) guide.speak("care_plan_edit_requested");
    try {
      const res = await fetch(apiUrl("/pathway/edit-items"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, mode, feedback }),
      });
      const data = await res.json();
      setEditedItems((data.items ?? items) as PathwayItem[]);
      if (guide.enabled && !fromVoice) guide.speak("care_plan_edit_done");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text:
            data.edited === false
              ? "Backend is offline — set OPENAI_API_KEY to edit the plan with AI."
              : "Done — your plan is updated on the left.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "Couldn't reach the planner. Is the backend running?" },
      ]);
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-col">
      <FlowStepper />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-10">
        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
                The Pathway
                {phase > 1 && (
                  <span className="rounded-full bg-self-soft px-2 py-0.5 text-self-ink">
                    Phase {phase}
                  </span>
                )}
              </p>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {title}
              </h1>
              <p className="mt-1 text-ink-soft">
                A plan, not a list — grouped by what needs to happen when. Every item
                explains itself.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ModeChip mode={mode} />
              <button
                type="button"
                onClick={() => setChatOpen((open) => !open)}
                className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink-body transition-colors hover:border-self hover:text-self"
              >
                {chatOpen ? "Close editor" : "Edit plan"}
              </button>
            </div>
          </div>

          {phase > 1 && lastPhase && (
            <div className="flex items-start gap-3 rounded-2xl border border-caregiver-border bg-caregiver-soft px-5 py-4">
              <History size={20} className="mt-0.5 shrink-0 text-caregiver" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-caregiver-ink">
                  Carried forward from Phase {lastPhase.phase}
                </p>
                <p className="text-sm leading-relaxed text-ink-body">{lastPhase.summary}</p>
                <p className="text-xs text-ink-muted">
                  Vital details — the care profile, consents on file, and family contacts —
                  stay in place. This plan adds the next steps on top.
                </p>
              </div>
            </div>
          )}

          <PathwayBoard items={items} />
        </div>

        {/* Natural-language plan editor */}
        {chatOpen && (
          <aside className="flex w-80 shrink-0 flex-col self-start rounded-2xl border border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Edit the plan</p>
                <p className="text-[11px] text-ink-muted">Tell CareKaki what to change</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Close editor"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-ink-muted">Try one of these:</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendEdit(s)}
                      className="rounded-lg border border-hairline px-3 py-2 text-left text-xs leading-relaxed text-ink-body transition-colors hover:border-self hover:text-self"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-self text-white"
                        : "border border-hairline bg-cream text-ink-body"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {editing && (
                <div className="flex items-center gap-2 px-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-self" aria-hidden="true" />
                  <span className="text-[11px] text-ink-muted">Updating plan…</span>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="border-t border-hairline px-3 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendEdit(input)}
                  placeholder="What would you like to change?"
                  disabled={editing}
                  className="flex-1 rounded-lg border border-hairline bg-white px-3 py-2 text-xs text-ink outline-none transition-colors focus:border-self disabled:opacity-50"
                />
                <button
                  onClick={() => sendEdit(input)}
                  disabled={editing || !input.trim()}
                  className="rounded-lg bg-self px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-self-ink disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer bar — hand off to Autopilot */}
      <div className="border-t border-hairline bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <p className="text-base text-ink-body">
            CareKaki can set all of this in motion for you.
          </p>
          <Link
            href="/autopilot"
            className="inline-flex min-h-[54px] shrink-0 items-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
          >
            Launch Autopilot →
          </Link>
        </div>
      </div>

      <AskAiMao
        variant="floating"
        prompt="Want me to walk you through today's activities?"
        context="Explain today's care plan activities"
      />
    </div>
  );
}
