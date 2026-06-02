"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import LiveCareProfile from "@/components/chat/LiveCareProfile";
import { useChatState } from "@/hooks/useChatState";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "self" ? "self" : "caregiver";

  const {
    messages,
    profile,
    isProfileUpdating,
    isThinking,
    inputValue,
    setInputValue,
    sendMessage,
  } = useChatState();

  const modeLabel =
    mode === "caregiver" ? "Caregiver mode" : "Self mode";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Sub-header: mode indicator + CTA to view pathway */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-brand-cream-border bg-brand-cream/80 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{modeLabel}</span>
        <Link
          href="/pathway"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-teal text-white font-semibold text-xs hover:opacity-90 transition-opacity"
        >
          View care plan →
        </Link>
      </div>

      {/* Split layout: chat (left) + profile (right) */}
      {/* INTEGRATION POINT: The left panel is where React Flow will live.
          Replace ChatPanel with your Flow-based conversation graph, keeping
          the same `messages` / `onSend` props as the external contract. */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex-[3] min-w-0 overflow-hidden">
          <ChatPanel
            messages={messages}
            isThinking={isThinking}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={() => sendMessage(inputValue)}
          />
        </div>
        <div className="flex-[2] min-w-0 overflow-hidden hidden md:block">
          <LiveCareProfile profile={profile} isUpdating={isProfileUpdating} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
