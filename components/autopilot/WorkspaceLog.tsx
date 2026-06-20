interface LogEntryProps {
  time: string;
  text: string;
  tone?: "default" | "success" | "pending";
}

const toneDot: Record<string, string> = {
  default: "bg-white/30",
  success: "bg-green-400",
  pending: "bg-brand-orange animate-pulse",
};

export function LogEntry({ time, text, tone = "default" }: LogEntryProps) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
      <span className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-white/80 leading-snug">{text}</span>
        <span className="text-[10px] text-white/30">{time}</span>
      </div>
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
          isBot ? "bg-white/10 text-white/90" : "bg-brand-teal text-white",
        ].join(" ")}
      >
        {text}
      </div>
      {buttons && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {buttons.map((label) => (
            <span
              key={label}
              className="text-[11px] px-2.5 py-1 rounded-full border border-white/20 text-white/70"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <span className="text-[10px] text-white/30 px-1">{time}</span>
    </div>
  );
}
