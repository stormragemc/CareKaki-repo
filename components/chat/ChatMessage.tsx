import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";
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

  if (isAssistant) {
    // AiMao speaks: small panda face beside a soft, rounded bubble.
    return (
      <div className="flex items-end justify-start gap-2.5">
        <AiMaoCharacter
          expression="idle"
          variant="face"
          size="xs"
          className="mb-0.5 shrink-0"
        />
        <div className="max-w-[78%] rounded-[6px_22px_22px_22px] border border-hairline bg-surface px-4 py-3 text-base leading-relaxed text-ink-body shadow-[0_4px_14px_rgba(38,38,43,0.05)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[80%] rounded-[22px_6px_22px_22px] px-4 py-3 text-base leading-relaxed text-white ${userFill[mode]}`}
      >
        {message.content}
      </div>
    </div>
  );
}
