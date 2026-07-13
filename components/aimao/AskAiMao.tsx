"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import AiMaoCharacter from "./AiMaoCharacter";

interface AskAiMaoProps {
  /** Contextual invitation copy, e.g. "Want me to explain today's activities?" */
  prompt: string;
  /** A short context tag stored for the chat to open with (optional). */
  context?: string;
  /** "card" sits inline on a page; "floating" pins to the bottom-right. */
  variant?: "card" | "floating";
  className?: string;
}

/**
 * The global "you can always talk to AiMao" affordance. Copy changes per page;
 * clicking opens the existing chat, seeding an optional context hint.
 */
export default function AskAiMao({
  prompt,
  context,
  variant = "card",
  className = "",
}: AskAiMaoProps) {
  const router = useRouter();

  const open = () => {
    try {
      if (context) sessionStorage.setItem("aimaoContext", context);
    } catch {}
    router.push("/chat");
  };

  if (variant === "floating") {
    return (
      <button
        onClick={open}
        aria-label={`Talk to AiMao — ${prompt}`}
        className={[
          "no-print group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full",
          "bg-white py-2 pl-2 pr-5 shadow-[0_10px_30px_rgba(43,42,40,0.18)]",
          "border border-aimao-hairline transition-transform hover:scale-[1.03] active:scale-95",
          className,
        ].join(" ")}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-aimao-cream">
          <AiMaoCharacter expression="idle" size={40} />
        </span>
        <span className="hidden max-w-[180px] text-left text-base font-semibold text-aimao-ink sm:block">
          {prompt}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className={[
        "flex w-full items-center gap-4 rounded-3xl border border-aimao-hairline bg-white",
        "px-5 py-4 text-left transition-shadow hover:shadow-[0_8px_28px_rgba(43,42,40,0.10)]",
        className,
      ].join(" ")}
    >
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-aimao-cream">
        <AiMaoCharacter expression="idle" size={54} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-aimao-ink">{prompt}</span>
        <span className="text-base text-aimao-ink-soft">Tap to talk with AiMao</span>
      </span>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-aimao-teal text-white">
        <Mic size={22} aria-hidden="true" />
      </span>
    </button>
  );
}
