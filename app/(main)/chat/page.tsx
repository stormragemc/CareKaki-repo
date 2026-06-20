"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import LiveCareProfile from "@/components/chat/LiveCareProfile";
import ModeChip from "@/components/ui/ModeChip";
import TalkToHuman from "@/components/ui/TalkToHuman";
import { useChatState } from "@/hooks/useChatState";

const planButtonFill: Record<"self" | "caregiver", string> = {
  self: "bg-self",
  caregiver: "bg-caregiver",
};

function ChatPageInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "self" ? "self" : "caregiver";
  const router = useRouter();

  const {
    messages,
    profile,
    profileMeta,
    isThinking,
    inputValue,
    setInputValue,
    sendMessage,
    emergency,
  } = useChatState();

  useEffect(() => {
    if (emergency) {
      router.push("/autopilot");
    }
  }, [emergency, router]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-cream">
      {/* Sub-header: mode chip + human escape hatch + pathway CTA */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-2.5 sm:px-6">
        <ModeChip mode={mode} />
        <div className="flex items-center gap-2">
          <TalkToHuman />
          <Link
            href="/pathway"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${planButtonFill[mode]}`}
          >
            View care plan
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Split layout: chat (left) | profile (right, cream). On mobile the
          profile becomes a bottom pull-up sheet rendered by LiveCareProfile. */}
      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 border-r border-hairline md:flex-[1.32]">
          <ChatPanel
            messages={messages}
            mode={mode}
            isThinking={isThinking}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={() => sendMessage(inputValue)}
          />
        </div>
        <div className="min-w-0 md:flex-1 md:overflow-hidden md:p-5">
          <LiveCareProfile profile={profile} profileMeta={profileMeta} mode={mode} />
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
