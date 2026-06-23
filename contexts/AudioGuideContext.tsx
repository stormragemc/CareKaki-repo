"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAudioGuide } from "@/hooks/useAudioGuide";

type AudioGuideReturn = ReturnType<typeof useAudioGuide>;

interface AudioGuideContextValue extends AudioGuideReturn {
  registerVoiceInput: (cb: (transcript: string) => void) => void;
  unregisterVoiceInput: () => void;
  handleVoiceInput: (transcript: string) => void;
}

const AudioGuideContext = createContext<AudioGuideContextValue | null>(null);

export function AudioGuideProvider({ children }: { children: ReactNode }) {
  const guide = useAudioGuide();
  const pathname = usePathname();
  const firstRender = useRef(true);
  const { stopAudio } = guide;
  const voiceInputCb = useRef<((transcript: string) => void) | null>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stopAudio();
  }, [pathname, stopAudio]);

  const registerVoiceInput = useCallback((cb: (transcript: string) => void) => {
    voiceInputCb.current = cb;
  }, []);

  const unregisterVoiceInput = useCallback(() => {
    voiceInputCb.current = null;
  }, []);

  const handleVoiceInput = useCallback((transcript: string) => {
    if (voiceInputCb.current) {
      voiceInputCb.current(transcript);
    }
  }, []);

  return (
    <AudioGuideContext.Provider value={{ ...guide, registerVoiceInput, unregisterVoiceInput, handleVoiceInput }}>
      {children}
    </AudioGuideContext.Provider>
  );
}

export function useAudioGuideCtx(): AudioGuideContextValue {
  const ctx = useContext(AudioGuideContext);
  if (!ctx) throw new Error("useAudioGuideCtx must be used inside AudioGuideProvider");
  return ctx;
}
