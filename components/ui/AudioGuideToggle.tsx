"use client";

import { useState } from "react";
import { Mic, MicOff, Pause, Play, Square, Volume2 } from "lucide-react";
import type { MicError } from "@/hooks/useAudioGuide";

interface AudioGuideToggleProps {
  enabled: boolean;
  status: string;
  micOn: boolean;
  micError: MicError;
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
  micError,
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
  const hoverBg = dark ? "hover:bg-white/10" : "hover:bg-gray-100";

  if (!enabled) {
    return (
      <button
        onClick={onEnable}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:border-caregiver/50 ${base}`}
      >
        <Volume2 size={14} aria-hidden="true" />
        <span>Audio Guide</span>
      </button>
    );
  }

  // Status dot color
  const dotColor =
    status === "speaking"
      ? "bg-caregiver animate-pulse"
      : status === "listening"
      ? "bg-self animate-pulse"
      : status === "paused"
      ? "bg-amber-400"
      : "bg-green-400";

  // Mic button appearance: active = blue ring + filled bg; error = red; off = muted
  const micActiveStyle = micOn
    ? "bg-self/20 text-self ring-1 ring-self/40"
    : micError
    ? "bg-red-500/15 text-red-400 ring-1 ring-red-400/40"
    : `${hoverBg} ${muted}`;

  const micLabel = micOn
    ? "Mic on — click to mute"
    : micError === "denied"
    ? "Mic blocked — check browser permissions"
    : micError === "unsupported"
    ? "Mic unavailable in this browser"
    : "Mic off — click to unmute";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${base}`}>
        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 pl-0.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className={`text-[11px] font-medium ${dark ? "text-white/70" : "text-gray-600"}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>

        {/* Divider */}
        <span className={`w-px h-3.5 mx-0.5 ${dark ? "bg-white/10" : "bg-gray-200"}`} aria-hidden="true" />

        {/* Mic toggle — always visible so state is always apparent */}
        <button
          onClick={onToggleMic}
          disabled={status === "speaking"}
          aria-label={micLabel}
          title={micLabel}
          className={`flex items-center justify-center w-6 h-6 rounded-md transition-all disabled:opacity-30 ${micActiveStyle}`}
        >
          {micOn ? (
            <Mic size={13} aria-hidden="true" />
          ) : (
            <MicOff size={13} aria-hidden="true" />
          )}
        </button>

        {/* Expand toggle for secondary controls */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse controls" : "Expand controls"}
          className={`flex items-center justify-center w-5 h-5 rounded text-[10px] transition-colors ${muted} ${hoverBg}`}
        >
          {expanded ? "‹" : "›"}
        </button>

        {/* Secondary controls: pause/resume + stop */}
        {expanded && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={status === "paused" ? onResume : onPause}
              aria-label={status === "paused" ? "Resume audio" : "Pause audio"}
              title={status === "paused" ? "Resume" : "Pause"}
              className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${hoverBg} ${muted}`}
            >
              {status === "paused" ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
            </button>
            <button
              onClick={onDisable}
              aria-label="Stop Audio Guide"
              title="Stop Audio Guide"
              className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${hoverBg} ${muted}`}
            >
              <Square size={12} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Permission / support error shown inline below the control strip */}
      {micError && (
        <p className={`text-[10px] leading-tight px-2 ${dark ? "text-red-400" : "text-red-500"}`}>
          {micError === "denied"
            ? "Mic blocked — allow in browser settings"
            : "Mic not supported in this browser"}
        </p>
      )}
    </div>
  );
}
