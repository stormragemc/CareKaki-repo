import type { ReactNode } from "react";

// AiMao's lines live in a soft rounded bubble with a tail pointing back at the
// panda — like the note card on the physical robot's tray.

interface AiMaoSpeechBubbleProps {
  children: ReactNode;
  /** Where AiMao stands relative to the bubble. */
  tail?: "left" | "bottom" | "none";
  className?: string;
}

export default function AiMaoSpeechBubble({
  children,
  tail = "left",
  className = "",
}: AiMaoSpeechBubbleProps) {
  return (
    <div className={`relative motion-safe:animate-aimao-pop ${className}`}>
      <div className="rounded-3xl border border-hairline bg-surface px-5 py-4 text-lg leading-relaxed text-ink-body shadow-[0_8px_24px_rgba(38,38,43,0.08)]">
        {children}
      </div>
      {tail === "left" && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-b border-l border-hairline bg-surface"
        />
      )}
      {tail === "bottom" && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-hairline bg-surface"
        />
      )}
    </div>
  );
}
