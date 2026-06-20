"use client";

import { useEffect, useState } from "react";
import { ChatBubble } from "./WorkspaceLog";

interface TelegramLogEntry {
  from: "bot" | "user";
  text: string;
  buttons: string[] | null;
  time: string;
}

export default function TelegramFeed() {
  const [log, setLog] = useState<TelegramLogEntry[]>([]);
  const [triggered, setTriggered] = useState(false);

  // Auto-trigger emergency alert on mount
  useEffect(() => {
    if (triggered) return;
    setTriggered(true);

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
        await fetch("http://localhost:8000/carekaki/emergency-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      } catch {}
    };

    trigger();
  }, [triggered]);

  // Poll the log
  useEffect(() => {
    const fetchLog = () => {
      fetch("http://localhost:8000/telegram/log")
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
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
        <span className="text-xs text-white/60">Sending caregiver alert…</span>
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
