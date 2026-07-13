"use client";

interface AiMaoSpeechBubbleProps {
  children: React.ReactNode;
  /** Which side the tail points toward the panda. */
  tail?: "left" | "bottom" | "none";
  className?: string;
}

/**
 * A warm, rounded speech bubble for AiMao. Large, high-contrast, senior-friendly.
 */
export default function AiMaoSpeechBubble({
  children,
  tail = "left",
  className = "",
}: AiMaoSpeechBubbleProps) {
  return (
    <div
      className={[
        "relative rounded-3xl bg-white px-6 py-4 text-aimao-ink shadow-[0_6px_24px_rgba(43,42,40,0.08)]",
        "border border-aimao-hairline text-xl leading-relaxed",
        className,
      ].join(" ")}
    >
      {tail === "left" && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-8 h-5 w-5 rotate-45 rounded-sm border-b border-l border-aimao-hairline bg-white"
        />
      )}
      {tail === "bottom" && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-10 h-5 w-5 rotate-45 rounded-sm border-b border-r border-aimao-hairline bg-white"
        />
      )}
      {children}
    </div>
  );
}
