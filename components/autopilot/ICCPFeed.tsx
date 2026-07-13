"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface ICCPLogEntry {
  from: "system" | "bot" | "user";
  text: string;
  tone: "default" | "success" | "pending";
  buttons: string[] | null;
  time: string;
}

const toneDot: Record<string, string> = {
  default: "bg-autopilot-muted",
  success: "bg-status-done-dark",
  pending: "bg-status-running-dark animate-pulse",
};

const fromLabel: Record<string, string> = {
  system: "CareKaki",
  bot: "Bot",
  user: "Coordinator",
};

const fromColor: Record<string, string> = {
  system: "text-live-dark",
  bot: "text-weeks-soft",
  user: "text-status-running-dark",
};

// ICCP may bypass the approval gate to escalate to a human faster.
export default function ICCPFeed({ enabled = true }: { enabled?: boolean }) {
  const [log, setLog] = useState<ICCPLogEntry[]>([]);
  const [triggered, setTriggered] = useState(false);

  // Auto-trigger a demo handover on mount if log is empty
  useEffect(() => {
    if (!enabled || triggered) return;

    const trigger = async () => {
      setTriggered(true);

      // Small delay to simulate "agent detecting escalation"
      await new Promise((r) => setTimeout(r, 2000));

      try {
        let patientName = "Senior";
        let age = 75;
        let issue = "Care concern requiring coordinator attention";
        try {
          const profileStr = sessionStorage.getItem("careProfile");
          if (profileStr) {
            const p = JSON.parse(profileStr);
            patientName = p.name || patientName;
            age = p.age || age;
            issue = p.recentEvent || sessionStorage.getItem("autopilotTrigger") || issue;
          }
        } catch {}

        await fetch(apiUrl("/integrations/iccp/handover"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_name: patientName,
            age,
            issue,
            risk: "High",
            suggested_action: "Urgent family check-in + clinic follow-up",
          }),
        });
      } catch {
        // Backend not running or no coordinator — log will just stay empty
      }
    };

    trigger();
  }, [enabled, triggered]);

  // Poll the ICCP log
  useEffect(() => {
    if (!enabled) return;
    const fetchLog = () => {
      fetch(apiUrl("/iccp/log"))
        .then((res) => res.json())
        .then((data) => setLog(data.log ?? []))
        .catch(() => {});
    };

    fetchLog();
    const interval = setInterval(fetchLog, 1500);
    return () => clearInterval(interval);
  }, [enabled]);

  if (log.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-running-dark animate-pulse" />
          <span className="text-xs text-autopilot-muted">Detecting escalation need…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {log.map((entry, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-autopilot-band"
        >
          <span
            className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${toneDot[entry.tone]}`}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold ${fromColor[entry.from]}`}>
                {fromLabel[entry.from] ?? entry.from}
              </span>
              <span className="text-[10px] text-autopilot-muted">{entry.time}</span>
            </div>
            <span className="text-xs text-autopilot-text leading-snug">{entry.text}</span>
            {entry.buttons && (
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.buttons.map((label) => (
                  <span
                    key={label}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-autopilot-hairline text-autopilot-muted"
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
