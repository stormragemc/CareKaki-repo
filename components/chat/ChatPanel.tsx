"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { CareMode, Message } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION POINT — React Flow
//
// This component is the primary seam for inserting a React Flow diagram.
// Two patterns are common for this use-case:
//
//   A) Overlay: Render <ReactFlow> in the area above the message list to show
//      the conversation state-machine; swap the chat pane to a split layout.
//
//   B) Replace: Swap this component entirely with a Flow-driven interface
//      where nodes ARE the conversation turns.
//
// The `messages` and `onSend` props provide the stable API either way.
// ─────────────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages: Message[];
  mode: CareMode;
  isThinking: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

export default function ChatPanel({
  messages,
  mode,
  isThinking,
  inputValue,
  onInputChange,
  onSend,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} mode={mode} />
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-[4px_18px_18px_18px] border border-hairline bg-surface px-4 py-3 text-sm text-ink-soft">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:300ms]" />
              </span>
              CareKaki is updating the profile…
            </div>
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
