"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import AiMaoLive from "@/components/aimao/AiMaoLive";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CareMode, Message } from "@/lib/types";

interface ChatPanelProps {
  messages: Message[];
  mode: CareMode;
  isThinking: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  /** Sends a quick-reply chip as a message. */
  onQuickReply?: (text: string) => void;
}

export default function ChatPanel({
  messages,
  mode,
  isThinking,
  inputValue,
  onInputChange,
  onSend,
  onQuickReply,
}: ChatPanelProps) {
  const { t, tl } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  // Lightweight conversation starters — a 20-second check-in, not a form.
  const starterChips = tl("chat.chips");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* AiMao presence — the companion is always visible while you talk */}
      <div className="flex items-center gap-3 border-b border-hairline bg-cream px-4 py-2.5 sm:px-6">
        <AiMaoLive base={isThinking ? "thinking" : "idle"} variant="face" size="sm" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ink">AiMao</span>
          <span className="text-xs text-ink-muted">
            {isThinking ? t("chat.thinking") : t("chat.hereWithYou")}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} mode={mode} />
        ))}

        {isThinking && (
          <div className="flex items-end justify-start gap-2.5">
            <span className="mb-0.5 shrink-0">
              <AiMaoLive base="thinking" variant="face" size="xs" />
            </span>
            <div className="flex items-center gap-2 rounded-[6px_22px_22px_22px] border border-hairline bg-surface px-4 py-3 text-sm text-ink-soft">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:300ms]" />
              </span>
              {t("chat.thinkingBubble")}
            </div>
          </div>
        )}

        {/* Quick replies — lower the effort of the first message */}
        {!isThinking && messages.length <= 1 && onQuickReply && (
          <div className="flex flex-wrap gap-2 pl-10">
            {starterChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onQuickReply(chip)}
                className="rounded-full border border-hairline bg-surface px-4 py-2 text-sm text-ink-body transition-colors hover:border-aimao-teal hover:text-aimao-teal"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 sm:px-6">
        <ChatInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          mode={mode}
          disabled={isThinking}
        />
      </div>
    </div>
  );
}
