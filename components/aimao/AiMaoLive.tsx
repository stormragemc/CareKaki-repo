"use client";

import AiMaoCharacter, { type AiMaoExpression, type AiMaoSize } from "./AiMaoCharacter";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";

// AiMao bound to the real voice pipeline: while the Audio Guide is speaking the
// mouth moves; while the mic is open the ears perk up. Everything else shows
// the caller's `base` mood (thinking, happy, concerned…).

interface AiMaoLiveProps {
  base?: AiMaoExpression;
  size?: AiMaoSize;
  variant?: "full" | "face";
  className?: string;
}

export function useAiMaoVoiceExpression(base: AiMaoExpression = "idle"): {
  expression: AiMaoExpression;
  speaking: boolean;
} {
  const guide = useAudioGuideCtx();
  if (guide.status === "speaking") return { expression: "speaking", speaking: true };
  if (guide.status === "listening" || guide.micOn) return { expression: "listening", speaking: false };
  return { expression: base, speaking: false };
}

export default function AiMaoLive({ base = "idle", size = "md", variant = "full", className }: AiMaoLiveProps) {
  const { expression, speaking } = useAiMaoVoiceExpression(base);
  return (
    <AiMaoCharacter
      expression={expression}
      speaking={speaking}
      size={size}
      variant={variant}
      className={className}
    />
  );
}
