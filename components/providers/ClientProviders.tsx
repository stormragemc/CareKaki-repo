"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { AudioGuideProvider } from "@/contexts/AudioGuideContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AudioGuideProvider>{children}</AudioGuideProvider>
    </LanguageProvider>
  );
}
