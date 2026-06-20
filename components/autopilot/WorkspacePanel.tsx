"use client";

import StatusPill, { type PillStatus } from "@/components/ui/StatusPill";
import LiveChip from "@/components/ui/LiveChip";

interface WorkspacePanelProps {
  title: string;
  subtitle: string;
  status?: PillStatus;
  liveLabel?: string;
  sources?: string[];
  isExpanded: boolean;
  isAnyExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}

export default function WorkspacePanel({
  title,
  subtitle,
  status,
  liveLabel,
  sources,
  isExpanded,
  isAnyExpanded,
  onToggleExpand,
  children,
}: WorkspacePanelProps) {
  return (
    <div
      className={[
        "flex flex-col rounded-2xl border overflow-hidden",
        status === "draft"
          ? "bg-autopilot-card-draft border-autopilot-hairline border-dashed"
          : "bg-autopilot-card border-autopilot-hairline",
        isAnyExpanded ? (isExpanded ? "flex-1" : "hidden") : "flex-1",
      ].join(" ")}
    >
      {/* Header — title always wins for space; verbose detail only when expanded. */}
      <div
        className={[
          "flex items-center justify-between gap-2 py-3 border-b border-autopilot-hairline shrink-0",
          isExpanded ? "px-4" : "px-3",
        ].join(" ")}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-autopilot-text truncate">{title}</span>
          <span className="text-[11px] text-autopilot-muted truncate">{subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isExpanded ? (
            <>
              {sources && sources.length > 0 && (
                <span className="hidden lg:block max-w-[160px] truncate text-[9px] text-autopilot-muted/60">
                  {sources.join(" · ")}
                </span>
              )}
              {liveLabel && <LiveChip label={liveLabel} theme="dark" />}
              {status && <StatusPill status={status} theme="dark" />}
            </>
          ) : (
            // Collapsed: one status signal only, so the title stays readable.
            // LIVE implies running, so prefer it over a redundant Running pill.
            <>
              {liveLabel ? (
                <LiveChip label={liveLabel} theme="dark" compact />
              ) : (
                status && <StatusPill status={status} theme="dark" />
              )}
            </>
          )}
          <button
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Exit fullscreen" : "Expand panel"}
            className="text-autopilot-muted hover:text-autopilot-text transition-colors text-sm leading-none px-1"
          >
            {isExpanded ? "⤡" : "⤢"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
