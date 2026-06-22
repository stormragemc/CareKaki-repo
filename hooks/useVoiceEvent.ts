"use client";

import { useEffect, useRef } from "react";
import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";

export function useVoiceEvent(event: string, context: string = "", deps: unknown[] = []) {
  const guide = useAudioGuideCtx();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!guide.enabled || guide.status === "off" || guide.status === "paused") return;
    if (firedRef.current) return;

    firedRef.current = true;

    const mode =
      typeof window !== "undefined"
        ? (() => {
            try {
              const user = sessionStorage.getItem("demoUser");
              if (user) return JSON.parse(user).role === "senior" ? "self" : "caregiver";
            } catch {}
            return "caregiver";
          })()
        : "caregiver";

    guide.speak(event, context, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.enabled, guide.status, ...deps]);

  // Allow re-firing (e.g. after care plan edit)
  const refire = (newContext?: string) => {
    firedRef.current = false;
    if (guide.enabled && guide.status !== "off" && guide.status !== "paused") {
      const mode =
        typeof window !== "undefined"
          ? (() => {
              try {
                const user = sessionStorage.getItem("demoUser");
                if (user) return JSON.parse(user).role === "senior" ? "self" : "caregiver";
              } catch {}
              return "caregiver";
            })()
          : "caregiver";
      guide.speak(event, newContext ?? context, mode);
    }
  };

  return { refire };
}
