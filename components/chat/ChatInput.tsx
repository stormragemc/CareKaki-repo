"use client";

import { ArrowUp } from "lucide-react";
import type { CareMode } from "@/lib/types";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  mode: CareMode;
  disabled?: boolean;
}

const sendFill: Record<CareMode, string> = {
  self: "bg-self",
  caregiver: "bg-caregiver",
};

export default function ChatInput({ value, onChange, onSend, mode, disabled }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface p-2 pl-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your reply…"
        disabled={disabled}
        className="flex-1 bg-transparent text-base text-ink-body placeholder:text-ink-muted outline-none disabled:opacity-50"
        aria-label="Chat message input"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-white transition-all
                   hover:opacity-90 active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed ${sendFill[mode]}`}
      >
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
