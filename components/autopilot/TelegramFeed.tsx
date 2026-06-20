"use client";

import { useEffect, useState } from "react";
import { ChatBubble, DraftNotice } from "./WorkspaceLog";

interface TelegramLogEntry {
  from: "bot" | "user";
  text: string;
  buttons: string[] | null;
  time: string;
}

export default function TelegramFeed({ enabled = true }: { enabled?: boolean }) {
  const [log, setLog] = useState<TelegramLogEntry[]>([]);

  useEffect(() => {
    if (!enabled) return; // held behind the approval gate
    const fetchLog = () => {
      fetch("http://localhost:8000/telegram/log")
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
    return <p className="text-xs text-autopilot-muted px-2 py-1">Waiting for activity…</p>;
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
