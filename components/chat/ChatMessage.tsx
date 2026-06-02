import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={[
        "flex",
        isAssistant ? "justify-start" : "justify-end",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isAssistant
            ? "bg-[#EDE4D4] text-gray-900 rounded-tl-sm"
            : "bg-white text-gray-800 rounded-tr-sm shadow-sm",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}
