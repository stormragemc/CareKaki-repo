"use client";

import { useEffect, useState } from "react";

interface PlanStep {
  id: string;
  order: number;
  title: string;
  icon: string;
}

const STEP_ICONS: Record<string, string> = {
  coordinator: "🤝",
  nursing: "🏥",
  eldercare: "👴",
  medication: "💊",
  telegram: "📱",
  default: "⚙️",
};

export default function PipelineBar() {
  const [steps, setSteps] = useState<PlanStep[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("autopilotPlan");
    if (stored) {
      try {
        const plan = JSON.parse(stored);
        if (plan.steps) setSteps(plan.steps);
      } catch {}
    }
  }, []);

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 bg-white/[0.03] border-b border-white/10">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20">
            <span className="text-xs">{STEP_ICONS[step.icon] || STEP_ICONS.default}</span>
            <span className="text-[10px] font-medium text-brand-teal">{step.title}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center mx-1">
              <div className="w-4 h-px bg-white/20" />
              <div className="w-1 h-1 border-r border-t border-white/20 rotate-45 -ml-0.5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
