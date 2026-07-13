import type { CareMode, Message } from "@/lib/types";
import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";

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
    return (
      <div className="flex items-end gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-aimao-cream">
          <AiMaoCharacter expression="idle" size={34} />
        </span>
        <div className="max-w-[80%] rounded-[6px_20px_20px_20px] border border-aimao-hairline bg-white px-4 py-3 text-lg leading-relaxed text-aimao-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[80%] rounded-[20px_6px_20px_20px] px-4 py-3 text-lg leading-relaxed text-white ${userFill[mode]}`}
      >
        {message.content}
      </div>
    </div>
  );
}
