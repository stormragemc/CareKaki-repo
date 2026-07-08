"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import AudioGuideButton from "@/components/ui/AudioGuideButton";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";

// Simple, senior-friendly navigation: Home · Care Plan · Care Brief.
// "AiMao's Mind" (the expert/agent view) is deliberately a quiet icon — normal
// users never need it; judges and clinicians can delve in.
const NAV = [
  { href: "/", key: "nav.home", active: (p: string) => p === "/" },
  { href: "/pathway", key: "nav.carePlan", active: (p: string) => p.startsWith("/pathway") },
  { href: "/handover", key: "nav.careBrief", active: (p: string) => p.startsWith("/handover") },
] as const;

export default function Header() {
  const pathname = usePathname() ?? "/";
  const { t } = useLanguage();

  return (
    <header className="print-hidden sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={30} />
            <span className="font-serif font-bold text-ink text-lg tracking-tight">
              CareKaki
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active(pathname) ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  item.active(pathname)
                    ? "bg-aimao-teal-soft text-aimao-teal-ink"
                    : "text-ink-soft hover:bg-tint hover:text-ink"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden lg:inline-flex">
            <LanguageSwitch compact />
          </span>
          <Link
            href="/autopilot"
            title={t("nav.aimaoMind")}
            aria-label={t("nav.aimaoMind")}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-tint hover:text-ink sm:flex"
          >
            <BrainCircuit size={18} aria-hidden="true" />
          </Link>
          <AudioGuideButton />
          <TalkToHuman />
        </div>
      </div>
    </header>
  );
}
