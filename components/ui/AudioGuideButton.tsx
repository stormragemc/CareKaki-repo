"use client";

import { useAudioGuideCtx } from "@/contexts/AudioGuideContext";
import AudioGuideToggle from "./AudioGuideToggle";

export default function AudioGuideButton({ theme = "light" }: { theme?: "light" | "dark" }) {
  const guide = useAudioGuideCtx();

  return (
    <AudioGuideToggle
      enabled={guide.enabled}
      status={guide.status}
      micOn={guide.micOn}
      onEnable={guide.enable}
      onDisable={guide.disable}
      onPause={guide.pause}
      onResume={guide.resume}
      onToggleMic={() => guide.toggleMic(() => {})}
      theme={theme}
    />
  );
}
