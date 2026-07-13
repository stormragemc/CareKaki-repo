"use client";

import AiMaoCharacter, { type AiMaoExpression } from "./AiMaoCharacter";
import AiMaoSpeechBubble from "./AiMaoSpeechBubble";

interface AiMaoGreetingProps {
  /** Who AiMao is greeting (the caregiver or senior). */
  name?: string;
  /** The line AiMao "says". If omitted, a time-of-day greeting is used. */
  message?: string;
  expression?: AiMaoExpression;
  className?: string;
}

function timeGreeting(name?: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

/**
 * The hero header that puts AiMao front-and-centre with a warm spoken line.
 * Stacks on mobile, side-by-side on wider screens.
 */
export default function AiMaoGreeting({
  name,
  message,
  expression = "idle",
  className = "",
}: AiMaoGreetingProps) {
  return (
    <div className={`flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8 ${className}`}>
      <AiMaoCharacter expression={expression} size="lg" className="shrink-0" />
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <p className="text-lg font-medium text-aimao-ink-soft">{timeGreeting(name)}</p>
        <AiMaoSpeechBubble tail="left" className="max-w-md text-center sm:text-left">
          {message ?? "Hi! I'm AiMao. How has today been?"}
        </AiMaoSpeechBubble>
      </div>
    </div>
  );
}
