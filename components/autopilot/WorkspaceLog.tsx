interface LogEntryProps {
  time: string;
  text: string;
  tone?: "default" | "success" | "pending";
}

const toneDot: Record<string, string> = {
  default: "bg-autopilot-muted",
  success: "bg-status-done-dark",
  pending: "bg-status-running-dark animate-pulse",
};

export function LogEntry({ time, text, tone = "default" }: LogEntryProps) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-autopilot-band">
      <span className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-autopilot-text leading-snug">{text}</span>
        <span className="text-[10px] text-autopilot-muted">{time}</span>
      </div>
    </div>
  );
}

// Shown in a gated panel before "Approve all" releases its live flow.
export function DraftNotice({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-autopilot-band">
      <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-status-draft-dark" aria-hidden="true" />
      <span className="text-xs text-autopilot-muted">{label}</span>
    </div>
  );
}

interface ChatBubbleProps {
  from: "bot" | "user";
  time: string;
  text: string;
  buttons?: string[];
}

export function ChatBubble({ from, time, text, buttons }: ChatBubbleProps) {
  const isBot = from === "bot";
  return (
    <div className={`flex flex-col gap-1.5 ${isBot ? "items-start" : "items-end"}`}>
      <div
        className={[
          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
          isBot ? "bg-autopilot-band text-autopilot-text" : "bg-caregiver text-white",
        ].join(" ")}
      >
        {text}
      </div>
      {buttons && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {buttons.map((label) => (
            <span
              key={label}
              className="text-[11px] px-2.5 py-1 rounded-full border border-autopilot-hairline text-autopilot-muted"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <span className="text-[10px] text-autopilot-muted px-1">{time}</span>
    </div>
  );
}
