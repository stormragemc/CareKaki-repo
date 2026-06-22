"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAudioGuide } from "@/hooks/useAudioGuide";

type AudioGuideReturn = ReturnType<typeof useAudioGuide>;

const AudioGuideContext = createContext<AudioGuideReturn | null>(null);

export function AudioGuideProvider({ children }: { children: ReactNode }) {
  const guide = useAudioGuide();
  return (
    <AudioGuideContext.Provider value={guide}>
      {children}
    </AudioGuideContext.Provider>
  );
}

export function useAudioGuideCtx(): AudioGuideReturn {
  const ctx = useContext(AudioGuideContext);
  if (!ctx) throw new Error("useAudioGuideCtx must be used inside AudioGuideProvider");
  return ctx;
}
