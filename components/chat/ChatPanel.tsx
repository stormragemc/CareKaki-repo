"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { Message } from "@/lib/types";

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
  isThinking: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

export default function ChatPanel({
  messages,
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
    <div className="flex flex-col h-full bg-brand-cream/60 rounded-xl border border-brand-cream-border overflow-hidden">
      {/* Chat label */}
      <div className="px-4 py-3 border-b border-brand-cream-border">
        <span className="text-sm font-semibold text-gray-700">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex gap-1 px-4 py-3 bg-[#EDE4D4] rounded-2xl rounded-tl-sm">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <ChatInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={isThinking}
        />
      </div>
    </div>
  );
}
