"use client";

import { useState } from "react";

interface AudioGuideToggleProps {
  enabled: boolean;
  status: string;
  micOn: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleMic: () => void;
  theme?: "light" | "dark";
}

const STATUS_LABELS: Record<string, string> = {
  off: "Off",
  idle: "Ready",
  speaking: "Speaking…",
  listening: "Listening…",
  paused: "Paused",
};

export default function AudioGuideToggle({
  enabled,
  status,
  micOn,
  onEnable,
  onDisable,
  onPause,
  onResume,
  onToggleMic,
  theme = "light",
}: AudioGuideToggleProps) {
  const [expanded, setExpanded] = useState(false);

  const dark = theme === "dark";
  const base = dark
    ? "bg-white/[0.06] border-white/10 text-white"
    : "bg-white border-gray-200 text-gray-900";
  const muted = dark ? "text-white/50" : "text-gray-500";
  const accent = dark ? "text-caregiver" : "text-caregiver";

  if (!enabled) {
    return (
      <button
        onClick={onEnable}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:border-caregiver/50 ${base}`}
      >
        <span className="text-sm">🔊</span>
        <span>Audio Guide</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${base}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "speaking"
              ? "bg-caregiver animate-pulse"
              : status === "listening"
              ? "bg-self animate-pulse"
              : status === "paused"
              ? "bg-amber-400"
              : "bg-green-400"
          }`}
        />
        <span className={`text-[11px] font-medium ${accent}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Controls */}
      {expanded && (
        <div className="flex items-center gap-0.5 ml-1">
          {/* Mic toggle */}
          <button
            onClick={onToggleMic}
            disabled={status === "speaking"}
            className={`p-1 rounded-md text-sm transition-colors ${
              micOn ? "bg-self/20 text-self" : `hover:bg-white/10 ${muted}`
            } disabled:opacity-30`}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? "🎙️" : "🎙️"}
          </button>

          {/* Pause/Resume */}
          <button
            onClick={status === "paused" ? onResume : onPause}
            className={`p-1 rounded-md text-sm transition-colors hover:bg-white/10 ${muted}`}
            title={status === "paused" ? "Resume" : "Pause"}
          >
            {status === "paused" ? "▶️" : "⏸️"}
          </button>

          {/* Stop */}
          <button
            onClick={onDisable}
            className={`p-1 rounded-md text-sm transition-colors hover:bg-white/10 ${muted}`}
            title="Stop Audio Guide"
          >
            ⏹️
          </button>
        </div>
      )}

      {/* Expand/collapse controls */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`p-0.5 rounded text-[10px] transition-colors ${muted} hover:opacity-80`}
      >
        {expanded ? "‹" : "›"}
      </button>
    </div>
  );
}
