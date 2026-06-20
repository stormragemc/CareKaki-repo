"use client";

import { useState } from "react";

interface WorkspacePanelProps {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  isAnyExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
  sources?: string[];
  requiresConfirmation?: boolean;
}

export default function WorkspacePanel({
  title,
  subtitle,
  isExpanded,
  isAnyExpanded,
  onToggleExpand,
  children,
  sources,
  requiresConfirmation = false,
}: WorkspacePanelProps) {
  const [confirmed, setConfirmed] = useState(!requiresConfirmation);

  return (
    <div
      className={[
        "flex flex-col bg-[#3A1E10] rounded-xl border border-white/10 overflow-hidden",
        isAnyExpanded ? (isExpanded ? "flex-1" : "hidden") : "flex-1",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-[11px] text-white/40">{subtitle}</span>
        </div>
        <div className="flex items-center gap-3">
          {sources && sources.length > 0 && (
            <span className="text-[9px] text-white/25 hidden lg:block">
              {sources.join(" · ")}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
            live
          </span>
          <button
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Exit fullscreen" : "Expand panel"}
            className="text-white/50 hover:text-white transition-colors text-sm leading-none px-1"
          >
            {isExpanded ? "⤡" : "⤢"}
          </button>
        </div>
      </div>

      {/* Human-gate overlay */}
      {!confirmed ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">
            🛡️
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white mb-1">Approval Required</p>
            <p className="text-[11px] text-white/50 leading-relaxed max-w-[200px]">
              This action involves submitting or booking on your behalf. Confirm to proceed.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmed(true)}
              className="px-4 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal/90 transition-colors"
            >
              Approve
            </button>
            <button
              className="px-4 py-1.5 rounded-lg border border-white/20 text-white/50 text-xs hover:text-white hover:border-white/40 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
