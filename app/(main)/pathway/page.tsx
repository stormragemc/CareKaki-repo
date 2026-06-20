"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PathwayBoard from "@/components/pathway/PathwayBoard";
import type { PathwayColumnData, CareProfile } from "@/lib/types";
import { mockCareProfile } from "@/lib/mock-data";

interface ChatMsg {
  role: "user" | "system";
  text: string;
}

export default function PathwayPage() {
  const [columns, setColumns] = useState<PathwayColumnData[]>([]);
  const [patientName, setPatientName] = useState("");
  const [profile, setProfile] = useState<CareProfile>(mockCareProfile);
  const [isLoading, setIsLoading] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [editing, setEditing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("careProfile");
    const p: CareProfile = stored ? JSON.parse(stored) : mockCareProfile;
    setProfile(p);
    setPatientName(p.name);

    const cached = sessionStorage.getItem("pathwayColumns");
    const cachedFor = sessionStorage.getItem("pathwayProfile");
    if (cached && cachedFor === JSON.stringify(p)) {
      setColumns(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    fetch("http://localhost:8000/pathway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: p }),
    })
      .then((res) => res.json())
      .then((data) => {
        setColumns(data.columns ?? []);
        sessionStorage.setItem("pathwayColumns", JSON.stringify(data.columns ?? []));
        sessionStorage.setItem("pathwayProfile", JSON.stringify(p));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendFeedback = async () => {
    if (!chatInput.trim() || editing) return;
    const feedback = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: feedback }]);
    setEditing(true);

    try {
      const res = await fetch("http://localhost:8000/pathway/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          current_columns: columns,
          feedback,
        }),
      });
      const data = await res.json();
      const newColumns = data.columns ?? [];
      setColumns(newColumns);
      sessionStorage.setItem("pathwayColumns", JSON.stringify(newColumns));
      sessionStorage.setItem("pathwayProfile", JSON.stringify(profile));

      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: `Care plan updated with ${newColumns.length} stage(s). Review the changes on the left.` },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: "Failed to update. Is the backend running?" },
      ]);
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold tracking-widest uppercase text-brand-teal">
                The Pathway
              </p>
              <h1 className="font-serif font-bold text-4xl text-gray-900 leading-tight">
                Not a list. A plan.
              </h1>
              <p className="text-gray-500 mt-1">
                Grouped by what needs to happen when — and every recommendation explains itself.
              </p>
            </div>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="shrink-0 mt-2 text-sm px-4 py-2 rounded-lg border border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5 transition-colors"
            >
              {chatOpen ? "Close editor" : "Edit plan"}
            </button>
          </div>

          {/* 4-column board */}
          {isLoading ? (
            <p className="text-sm text-gray-500">Generating your personalised plan…</p>
          ) : (
            <PathwayBoard columns={columns} patientName={patientName} />
          )}

          {/* Escalation banner */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-brand-teal-light border border-brand-teal/20">
            <p className="text-sm text-brand-teal">
              <span className="mr-1">↓</span>
              This case is complex — a Care Corner coordinator can take it from here.
            </p>
            <Link
              href="/review"
              className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Launch Autopilot →
            </Link>
          </div>
        </div>
      </div>

      {/* Side chat panel */}
      {chatOpen && (
        <aside className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col shrink-0">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Edit Care Plan</p>
              <p className="text-[11px] text-gray-400">Tell CareKaki what to change</p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {chatMessages.length === 0 && (
              <div className="px-3 py-2 rounded-lg bg-gray-100 text-[11px] text-gray-500 leading-relaxed">
                <p className="mb-2">Try saying:</p>
                <p>• "Remove the grant application step, we already applied"</p>
                <p>• "Add physiotherapy to the first week"</p>
                <p>• "Make the nursing visit more urgent"</p>
                <p>• "We don't need the activity centre recommendation"</p>
                <p>• "Change the financial tier to subsidised"</p>
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
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {editing && (
              <div className="flex items-center gap-2 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                <span className="text-[11px] text-gray-400">Updating care plan…</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !editing && handleSendFeedback()}
                placeholder="What would you like to change?"
                disabled={editing}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-brand-teal/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendFeedback}
                disabled={editing || !chatInput.trim()}
                className="px-3 py-2 rounded-lg bg-brand-teal text-white text-xs font-semibold disabled:opacity-50 hover:bg-brand-teal/90 transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Note: each edit uses 1 Gemini API call (5/min limit)
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
