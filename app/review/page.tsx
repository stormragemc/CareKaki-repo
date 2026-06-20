"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

interface PlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  icon: string;
  execution: string;
}

interface AutopilotPlan {
  care_need: string;
  steps: PlanStep[];
  execution_mode: string;
  total_steps: number;
}

interface ChatMsg {
  role: "user" | "system";
  text: string;
}

const STEP_ICONS: Record<string, string> = {
  coordinator: "🤝",
  nursing: "🏥",
  eldercare: "👴",
  medication: "💊",
  telegram: "📱",
  default: "⚙️",
};

export default function ReviewPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<AutopilotPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [editing, setEditing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const careNeed = sessionStorage.getItem("autopilotTrigger") || "General care assessment";
    fetch("http://localhost:8000/autopilot/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ care_need: careNeed }),
    })
      .then((res) => res.json())
      .then((data) => setPlan(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleApprove = () => {
    if (!plan) return;
    sessionStorage.setItem(
      "autopilotAdapters",
      JSON.stringify(plan.steps.map((s) => s.id))
    );
    sessionStorage.setItem("autopilotPlan", JSON.stringify(plan));
    router.push("/autopilot");
  };

  const handleSendFeedback = async () => {
    if (!chatInput.trim() || !plan) return;
    const feedback = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: feedback }]);
    setEditing(true);

    try {
      const res = await fetch("http://localhost:8000/autopilot/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          care_need: plan.care_need,
          current_steps: plan.steps,
          feedback,
        }),
      });
      const data = await res.json();
      setPlan(data);

      const removedSteps = plan.steps.filter(
        (s) => !data.steps.some((ns: PlanStep) => ns.id === s.id)
      );
      const addedSteps = data.steps.filter(
        (ns: PlanStep) => !plan.steps.some((s) => s.id === ns.id)
      );

      let response = "Done. ";
      if (removedSteps.length > 0) {
        response += `Removed: ${removedSteps.map((s) => s.title).join(", ")}. `;
      }
      if (addedSteps.length > 0) {
        response += `Added: ${addedSteps.map((s: PlanStep) => s.title).join(", ")}. `;
      }
      if (removedSteps.length === 0 && addedSteps.length === 0) {
        response = "I couldn't identify which step to change. Try being more specific — e.g. 'remove the medication review' or 'add nursing'.";
      }
      response += `Plan now has ${data.total_steps} step(s).`;

      setChatMessages((prev) => [...prev, { role: "system", text: response }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: "Failed to update plan. Is the backend running?" },
      ]);
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-brown text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
          <span className="text-sm text-white/60">Generating autopilot plan…</span>
        </div>
      </div>
    );
  }

  if (!plan || plan.steps.length === 0) {
    return (
      <div className="min-h-screen bg-brand-brown text-white flex items-center justify-center">
        <p className="text-white/50">No plan generated.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-brown text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-brown/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={28} />
            <span className="font-serif font-bold text-white text-lg tracking-tight">CareKaki</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pathway" className="text-sm text-white/50 hover:text-white transition-colors">
              ← Back to plan
            </Link>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="text-sm px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              {chatOpen ? "Close editor" : "Edit plan"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className={`flex-1 flex flex-col items-center px-6 py-10 overflow-y-auto transition-all ${chatOpen ? "mr-0" : ""}`}>
          {/* Title */}
          <div className="text-center mb-4 max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase text-brand-teal mb-2">
              Autopilot Review
            </p>
            <h1 className="font-serif font-bold text-3xl text-white leading-tight mb-2">
              Here's what CareKaki will do
            </h1>
            <p className="text-sm text-white/50">
              Review the plan below. Approve to run, or edit via the side panel.
            </p>
          </div>

          {/* Situation */}
          <div className="w-full max-w-3xl mb-8 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-white/30">Detected situation</span>
            <p className="text-sm text-white/80 mt-1">{plan.care_need}</p>
          </div>

          {/* Pipeline visualization */}
          <div className="w-full max-w-4xl mb-10">
            <div className="flex items-start justify-center gap-0">
              {plan.steps.map((step, i) => (
                <div key={step.id} className="flex items-start">
                  {/* Step */}
                  <div className="flex flex-col items-center" style={{ width: `${Math.max(160, 700 / plan.steps.length)}px` }}>
                    {/* Circle */}
                    <div className="w-16 h-16 rounded-full bg-brand-teal flex items-center justify-center text-2xl shadow-lg shadow-brand-teal/20 relative z-10">
                      {STEP_ICONS[step.icon] || STEP_ICONS.default}
                    </div>
                    {/* Title */}
                    <span className="text-xs font-semibold text-white mt-3 text-center px-1">
                      {step.title}
                    </span>
                    {/* Description card */}
                    <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 w-full">
                      <p className="text-[11px] text-white/60 leading-relaxed text-center">
                        {step.description}
                      </p>
                    </div>
                    {/* Guardian badge */}
                    {["iccp", "nursing", "medication"].includes(step.id) ? (
                      <span className="mt-2 flex items-center gap-1 text-[10px] text-amber-400/70">
                        <span>🛡️</span> Requires approval
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] text-white/30">
                        Auto-run
                      </span>
                    )}
                  </div>

                  {/* Connector line */}
                  {i < plan.steps.length - 1 && (
                    <div className="flex items-center mt-8 -mx-2">
                      <div className="w-8 h-0.5 bg-brand-teal/40" />
                      <div className="w-2 h-2 border-r-2 border-t-2 border-brand-teal/40 rotate-45 -ml-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Execution mode */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
            <span className="text-xs text-white/40">
              Execution: {plan.execution_mode === "simultaneous" ? "All steps run simultaneously" : "Steps run in order shown"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              className="px-8 py-3 rounded-xl bg-brand-teal text-white font-semibold text-sm hover:bg-brand-teal/90 transition-colors shadow-lg shadow-brand-teal/20"
            >
              Approve & Run Autopilot
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-6 py-3 rounded-xl border border-white/20 text-white/70 text-sm hover:text-white hover:border-white/40 transition-colors"
            >
              I want to change something
            </button>
          </div>
        </main>

        {/* Side chat panel */}
        {chatOpen && (
          <aside className="w-96 border-l border-white/10 bg-[#2A1508] flex flex-col shrink-0">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Edit Plan</p>
                <p className="text-[11px] text-white/40">Tell CareKaki what to change</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {/* Default hint */}
              {chatMessages.length === 0 && (
                <div className="px-3 py-2 rounded-lg bg-white/[0.04] text-[11px] text-white/40 leading-relaxed">
                  <p className="mb-2">Try saying:</p>
                  <p>• "Remove the medication review, I'll handle that myself"</p>
                  <p>• "Skip the ICCP handover"</p>
                  <p>• "Add nursing provider search"</p>
                  <p>• "I don't need the Telegram alert"</p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-teal text-white"
                        : "bg-white/10 text-white/80"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {editing && (
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                  <span className="text-[11px] text-white/40">Updating plan…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !editing && handleSendFeedback()}
                  placeholder="What would you like to change?"
                  disabled={editing}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-brand-teal/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSendFeedback}
                  disabled={editing || !chatInput.trim()}
                  className="px-3 py-2 rounded-lg bg-brand-teal text-white text-xs font-semibold disabled:opacity-50 hover:bg-brand-teal/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
