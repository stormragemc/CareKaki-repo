"use client";

import { useEffect, useState } from "react";
import { DraftNotice } from "./WorkspaceLog";

interface MedLogEntry {
  from: "system" | "bot" | "user";
  text: string;
  tone: "default" | "success" | "pending";
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
  user: "Pharmacy",
};

const fromColor: Record<string, string> = {
  system: "text-live-dark",
  bot: "text-weeks-soft",
  user: "text-status-done-dark",
};

export default function MedicationFeed({ enabled = true }: { enabled?: boolean }) {
  const [log, setLog] = useState<MedLogEntry[]>([]);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || triggered) return; // held behind the approval gate

    const trigger = async () => {
      setTriggered(true);
      await new Promise((r) => setTimeout(r, 3000));
      try {
        let seniorName = "Senior";
        let age = 75;
        let rawMessage = "Senior feels unwell after taking medication";
        try {
          const profileStr = sessionStorage.getItem("careProfile");
          if (profileStr) {
            const p = JSON.parse(profileStr);
            seniorName = p.name || seniorName;
            age = p.age || age;
            rawMessage = `${seniorName} ${p.conditions || "needs medication review"}`;
          }
        } catch {}

        await fetch("http://localhost:8000/integrations/medication-review/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senior_name: seniorName,
            age,
            symptom: sessionStorage.getItem("autopilotTrigger") || "medication concern",
            context: "caregiver is worried about medication side effects",
            raw_message: rawMessage,
          }),
        });
      } catch {}
    };
    trigger();
  }, [enabled, triggered]);

  useEffect(() => {
    if (!enabled) return;
    const fetchLog = () => {
      fetch("http://localhost:8000/medication/log")
        .then((res) => res.json())
        .then((data) => setLog(data.log ?? []))
        .catch(() => {});
    };
    fetchLog();
    const interval = setInterval(fetchLog, 1500);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return <DraftNotice label="Drafted — medication review awaiting approval" />;

  if (log.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-status-running-dark animate-pulse" />
        <span className="text-xs text-autopilot-muted">Scanning for medication concerns…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {log.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-autopilot-band">
          <span className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${toneDot[entry.tone]}`} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold ${fromColor[entry.from]}`}>
                {fromLabel[entry.from] ?? entry.from}
              </span>
              <span className="text-[10px] text-autopilot-muted">{entry.time}</span>
            </div>
            <span className="text-xs text-autopilot-text leading-snug">{entry.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
