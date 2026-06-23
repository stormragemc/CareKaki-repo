"use client";

import { useEffect, useRef } from "react";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";

interface UseVoiceEventOptions {
  skipInitial?: boolean;
}

export function useVoiceEvent(
  event: string,
  context: string = "",
  deps: unknown[] = [],
  options: UseVoiceEventOptions = {},
) {
  const guide = useAudioGuideCtx();
  const firedRef = useRef(false);

  useEffect(() => {
    if (options.skipInitial) return;
    if (!guide.enabled || guide.status === "off" || guide.status === "paused") return;
    if (firedRef.current) return;

    firedRef.current = true;

    // Small delay so route-change stopAudio() runs first, preventing overlap
    const timer = setTimeout(() => {
      guide.speak(event, context, getMode());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.enabled, guide.status, ...deps]);

  const refire = (newContext?: string) => {
    firedRef.current = false;
    if (guide.enabled && guide.status !== "off" && guide.status !== "paused") {
      guide.speak(event, newContext ?? context, getMode());
    }
  };

  return { refire };
}

function getMode(): string {
  if (typeof window === "undefined") return "caregiver";
  try {
    const user = sessionStorage.getItem("demoUser");
    if (user) return JSON.parse(user).role === "senior" ? "self" : "caregiver";
  } catch {}
  return "caregiver";
}
