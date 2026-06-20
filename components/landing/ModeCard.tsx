import Link from "next/link";
import { User, Users, ArrowRight } from "lucide-react";
import type { CareMode } from "@/lib/types";

interface ModeCardProps {
  mode: CareMode;
  title: string;
  description: string;
  href: string;
}

const config = {
  self: {
    Icon: User,
    border: "border-self-border",
    iconBg: "bg-self-soft",
    iconColor: "text-self",
    cta: "bg-self hover:bg-self-ink",
    shadow: "shadow-[0_10px_28px_rgba(217,116,46,0.10)]",
    ctaLabel: "Start for myself",
  },
  caregiver: {
    Icon: Users,
    border: "border-caregiver-border",
    iconBg: "bg-caregiver-soft",
    iconColor: "text-caregiver",
    cta: "bg-caregiver hover:bg-caregiver-ink",
    shadow: "shadow-[0_10px_28px_rgba(28,107,102,0.10)]",
    ctaLabel: "Start for someone",
  },
} satisfies Record<CareMode, unknown>;

export default function ModeCard({ mode, title, description, href }: ModeCardProps) {
  const c = config[mode];
  const Icon = c.Icon;

  return (
    <div
      className={`flex flex-col gap-5 rounded-[20px] border-2 bg-surface p-8 ${c.border} ${c.shadow}`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.iconBg}`}>
        <Icon size={28} className={c.iconColor} aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-serif font-semibold text-2xl text-ink">{title}</h2>
        <p className="text-base text-ink-soft leading-relaxed">{description}</p>
      </div>

      <Link
        href={href}
        className={`mt-auto inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-colors active:scale-[0.99] ${c.cta}`}
      >
        {c.ctaLabel}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
