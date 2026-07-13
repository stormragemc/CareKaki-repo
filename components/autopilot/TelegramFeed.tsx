"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubble, DraftNotice } from "./WorkspaceLog";
import { apiUrl } from "@/lib/api";

interface TelegramLogEntry {
  from: "bot" | "user";
  text: string;
  buttons: string[] | null;
  time: string;
}

export default function TelegramFeed({ enabled = true }: { enabled?: boolean }) {
  const [log, setLog] = useState<TelegramLogEntry[]>([]);
  const triggeredRef = useRef(false);

  // Auto-trigger emergency alert on mount (once).
  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    const trigger = async () => {
      await new Promise((r) => setTimeout(r, 1500));

      let seniorName = "Senior";
      let message = "Emergency alert: your family member needs help. Please respond.";
      try {
        const profileStr = sessionStorage.getItem("careProfile");
        if (profileStr) {
          const p = JSON.parse(profileStr);
          seniorName = p.name || seniorName;
          const event = p.recentEvent || "needs immediate attention";
          message = `Emergency alert: ${seniorName} — ${event}. Please respond as soon as possible.`;
        }
      } catch {}

      try {
        await fetch(apiUrl("/carekaki/emergency-alert"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      } catch {}
    };

    trigger();
  }, []);

  // Poll the log
  useEffect(() => {
    if (!enabled) return; // held behind the approval gate
    const fetchLog = () => {
      fetch(apiUrl("/telegram/log"))
        .then((res) => res.json())
        .then((data) => setLog(data.log ?? []))
        .catch(() => {});
    };

    fetchLog();
    const interval = setInterval(fetchLog, 1500);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return <DraftNotice label="Drafted — caregiver alert awaiting approval" />;

  if (log.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-status-running-dark animate-pulse" aria-hidden="true" />
        <span className="text-xs text-autopilot-muted">Sending caregiver alert…</span>
      </div>
    );
  }

  return (
    <>
      {log.map((entry, i) => (
        <ChatBubble
          key={i}
          from={entry.from}
          time={entry.time}
          text={entry.text}
          buttons={entry.buttons ?? undefined}
        />
      ))}
    </>
  );
}
