"use client";

interface WorkspacePanelProps {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  isAnyExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}

export default function WorkspacePanel({
  title,
  subtitle,
  isExpanded,
  isAnyExpanded,
  onToggleExpand,
  children,
}: WorkspacePanelProps) {
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

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
