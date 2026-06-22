"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAudioGuide } from "@/hooks/useAudioGuide";

type AudioGuideReturn = ReturnType<typeof useAudioGuide>;

const AudioGuideContext = createContext<AudioGuideReturn | null>(null);

export function AudioGuideProvider({ children }: { children: ReactNode }) {
  const guide = useAudioGuide();
  const pathname = usePathname();
  const firstRender = useRef(true);
  const { stopAudio } = guide;

  // Cut off any audio still playing from the previous page on navigation. This
  // runs after the new page's mount effects, so a page that narrates itself
  // (its speak() is still mid-fetch) isn't interrupted — only stale audio is.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stopAudio();
  }, [pathname, stopAudio]);

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
