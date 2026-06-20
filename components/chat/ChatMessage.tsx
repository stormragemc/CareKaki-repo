import type { CareMode, Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
  mode: CareMode;
}

// User bubble is filled with the active mode color.
const userFill: Record<CareMode, string> = {
  self: "bg-self",
  caregiver: "bg-caregiver",
};

export default function ChatMessage({ message, mode }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={["flex", isAssistant ? "justify-start" : "justify-end"].join(" ")}>
      <div
        className={[
          "max-w-[80%] px-4 py-3 text-base leading-relaxed",
          isAssistant
            ? "rounded-[4px_18px_18px_18px] border border-hairline bg-surface text-ink-body"
            : `rounded-[18px_4px_18px_18px] ${userFill[mode]} text-white`,
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}
