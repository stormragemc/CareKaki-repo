"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import LiveCareProfile from "@/components/chat/LiveCareProfile";
import ModeChip from "@/components/ui/ModeChip";
import TalkToHuman from "@/components/ui/TalkToHuman";
import FlowStepper from "@/components/ui/FlowStepper";
import AiMaoCharacter, { type AiMaoExpression } from "@/components/aimao/AiMaoCharacter";
import { useChatState } from "@/hooks/useChatState";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";

const planButtonFill: Record<"self" | "caregiver", string> = {
  self: "bg-self",
  caregiver: "bg-caregiver",
};

const STATE_CAPTION: Record<AiMaoExpression, string> = {
  listening: "Listening…",
  thinking: "Thinking it over…",
  speaking: "Speaking…",
  idle: "I'm here — tell me anything.",
  concerned: "I'm listening carefully.",
  happy: "That's lovely to hear!",
  sleepy: "Resting, but still here.",
};

function ChatPageInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "self" ? "self" : "caregiver";
  const router = useRouter();

  const guide = useAudioGuideCtx();

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

  // A contextual opener seeded from AskAiMao / Home nudges.
  const [context, setContext] = useState<string | null>(null);
  useEffect(() => {
    try {
      const c = sessionStorage.getItem("aimaoContext");
      if (c) {
        // One-time read of a client-only hint after mount (SSR-safe).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContext(c);
        sessionStorage.removeItem("aimaoContext");
      }
    } catch {}
  }, []);

  // AiMao's face mirrors what's happening in the conversation.
  const expression: AiMaoExpression =
    guide.status === "listening"
      ? "listening"
      : guide.status === "speaking"
      ? "speaking"
      : isThinking
      ? "thinking"
      : "idle";

  // Register voice input → sends as chat message
  useEffect(() => {
    guide.registerVoiceInput((transcript: string) => {
      if (transcript.trim()) sendMessage(transcript);
    });
    return () => guide.unregisterVoiceInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMessage]);

  // Voice: announce when profile gets updated (skip the initial render)
  const profileUpdateCount = useRef(0);
  useEffect(() => {
    profileUpdateCount.current += 1;
    if (profileUpdateCount.current > 1 && guide.enabled && profile.name) {
      guide.speak("profile_updated", profile.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (emergency) router.push("/autopilot");
  }, [emergency, router]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-aimao-cream">
      <FlowStepper />
      {/* Sub-header: mode chip + human escape hatch + pathway CTA */}
      <div className="flex items-center justify-between gap-3 border-b border-aimao-hairline bg-white px-4 py-2.5 sm:px-6">
        <ModeChip mode={mode} />
        <div className="flex items-center gap-2">
          <TalkToHuman />
          <Link
            href="/care-plan"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${planButtonFill[mode]}`}
          >
            View care plan
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Split layout: AiMao + chat (left) | live profile (right). */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col border-r border-aimao-hairline pb-16 md:flex-[1.32] md:pb-0">
          {/* AiMao companion stage — the emotional anchor of the conversation */}
          <div className="flex items-center gap-4 border-b border-aimao-hairline bg-white/60 px-4 py-3 sm:px-6">
            <AiMaoCharacter expression={expression} size={64} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-aimao-ink">AiMao</p>
              <p
                className="truncate text-sm text-aimao-ink-soft"
                aria-live="polite"
              >
                {context ?? STATE_CAPTION[expression]}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <ChatPanel
              messages={messages}
              mode={mode}
              isThinking={isThinking}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={() => sendMessage(inputValue)}
            />
          </div>
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
