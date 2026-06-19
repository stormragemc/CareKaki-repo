"use client";

import { useEffect, useState } from "react";

interface ICCPLogEntry {
  from: "system" | "bot" | "user";
  text: string;
  tone: "default" | "success" | "pending";
  buttons: string[] | null;
  time: string;
}

const toneDot: Record<string, string> = {
  default: "bg-white/30",
  success: "bg-green-400",
  pending: "bg-brand-orange animate-pulse",
};

const fromLabel: Record<string, string> = {
  system: "CareKaki",
  bot: "Bot",
  user: "Coordinator",
};

const fromColor: Record<string, string> = {
  system: "text-brand-teal",
  bot: "text-blue-400",
  user: "text-amber-400",
};

export default function ICCPFeed() {
  const [log, setLog] = useState<ICCPLogEntry[]>([]);
  const [triggered, setTriggered] = useState(false);

  // Auto-trigger a demo handover on mount if log is empty
  useEffect(() => {
    if (triggered) return;

    const trigger = async () => {
      setTriggered(true);

      // Small delay to simulate "agent detecting escalation"
      await new Promise((r) => setTimeout(r, 2000));

      try {
        await fetch("http://localhost:8000/integrations/iccp/handover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_name: "Mdm Tan",
            age: 78,
            issue: "Fall risk + caregiver unavailable for 2 hours",
            risk: "High",
            suggested_action: "Urgent family check-in + clinic follow-up",
          }),
        });
      } catch {
        // Backend not running or no coordinator — log will just stay empty
      }
    };

    trigger();
  }, [triggered]);

  // Poll the ICCP log
  useEffect(() => {
    const fetchLog = () => {
      fetch("http://localhost:8000/iccp/log")
        .then((res) => res.json())
        .then((data) => setLog(data.log ?? []))
        .catch(() => {});
    };

    fetchLog();
    const interval = setInterval(fetchLog, 1500);
    return () => clearInterval(interval);
  }, []);

  if (log.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-xs text-white/60">Detecting escalation need…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {log.map((entry, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]"
        >
          <span
            className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${toneDot[entry.tone]}`}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold ${fromColor[entry.from]}`}>
                {fromLabel[entry.from] ?? entry.from}
              </span>
              <span className="text-[10px] text-white/20">{entry.time}</span>
            </div>
            <span className="text-xs text-white/80 leading-snug">{entry.text}</span>
            {entry.buttons && (
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.buttons.map((label) => (
                  <span
                    key={label}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
