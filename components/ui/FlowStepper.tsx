"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

// The four journey sections, in order. The stepper reads the current route so
// every page shows "where you are" like the sections of a multi-step form.
const STEPS = [
  { key: "profile", label: "Care Profile", href: "/chat" },
  { key: "plan", label: "Care Plan", href: "/pathway" },
  { key: "autopilot", label: "Autopilot", href: "/autopilot" },
  { key: "brief", label: "Care Brief", href: "/handover" },
] as const;

const ROUTE_INDEX: Record<string, number> = {
  "/chat": 0,
  "/pathway": 1,
  "/autopilot": 2,
  "/handover": 3,
};

interface FlowStepperProps {
  theme?: "light" | "dark";
  /** Override the active index; otherwise derived from the pathname.
   *  Use -1 (e.g. on the tutorial) to show the whole flow as upcoming. */
  activeIndex?: number;
  className?: string;
}

export default function FlowStepper({
  theme = "light",
  activeIndex,
  className = "",
}: FlowStepperProps) {
  const pathname = usePathname();
  const current = activeIndex ?? ROUTE_INDEX[pathname ?? ""] ?? -1;

  const dark = theme === "dark";
  const barBg = dark
    ? "bg-autopilot-band/95 border-autopilot-hairline"
    : "bg-surface/95 border-hairline";
  const upcomingRing = dark ? "border-autopilot-hairline text-autopilot-muted" : "border-hairline-warm text-ink-muted";
  const upcomingLabel = dark ? "text-autopilot-muted" : "text-ink-muted";
  const activeLabel = dark ? "text-autopilot-text" : "text-ink";
  const connectorDone = "bg-status-done";
  const connectorTodo = dark ? "bg-autopilot-hairline" : "bg-hairline-warm";

  return (
    <nav
      aria-label="Care journey progress"
      className={`w-full border-b backdrop-blur-sm ${barBg} ${className}`}
    >
      <ol className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4 py-2.5 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const circle = done
            ? "bg-status-done border-status-done text-white"
            : active
              ? "bg-self border-self text-white"
              : `border ${upcomingRing}`;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-1 sm:gap-2 last:flex-none">
              <Link
                href={step.href}
                className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${circle}`}
                >
                  {done ? <Check size={13} aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-semibold ${
                    active ? activeLabel : done ? "text-status-done" : upcomingLabel
                  } ${active ? "" : "hidden sm:inline"}`}
                >
                  {step.label}
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${done ? connectorDone : connectorTodo}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
