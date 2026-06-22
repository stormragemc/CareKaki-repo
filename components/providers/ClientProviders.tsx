"use client";

import { AudioGuideProvider } from "@/contexts/AudioGuideContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AudioGuideProvider>{children}</AudioGuideProvider>;
}
