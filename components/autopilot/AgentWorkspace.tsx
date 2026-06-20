"use client";

import { useState } from "react";
import WorkspacePanel from "./WorkspacePanel";
import TelegramFeed from "./TelegramFeed";
import AICFeed from "./AICFeed";
import NursingFeed from "./NursingFeed";
import ICCPFeed from "./ICCPFeed";
import MedicationFeed from "./MedicationFeed";
import type { PillStatus } from "@/components/ui/StatusPill";

type PanelId = "iccp" | "nursing" | "aic" | "medication" | "telegram";

interface PanelDef {
  id: PanelId;
  title: string;
  subtitle: string;
  bypassGate?: boolean; // ICCP escalates to a human faster — it may skip the gate.
  liveLabel?: string;   // LIVE chip only on genuinely-live actions (real Telegram send).
}

const PANELS: PanelDef[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover", bypassGate: true },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking" },
  { id: "aic", title: "AIC", subtitle: "Eldercare services" },
  { id: "medication", title: "Medication Review", subtitle: "HSA + openFDA" },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert", liveLabel: "Caregiver alert" },
];

export default function AgentWorkspace({ approved }: { approved: boolean }) {
  const [expanded, setExpanded] = useState<PanelId | null>(null);

  const toggle = (id: PanelId) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      {PANELS.map((panel) => {
        const enabled = approved || !!panel.bypassGate;
        const status: PillStatus = enabled ? "running" : "draft";
        return (
          <WorkspacePanel
            key={panel.id}
            title={panel.title}
            subtitle={panel.subtitle}
            status={status}
            liveLabel={enabled ? panel.liveLabel : undefined}
            isExpanded={expanded === panel.id}
            isAnyExpanded={expanded !== null}
            onToggleExpand={() => toggle(panel.id)}
          >
            {renderContent(panel.id, enabled)}
          </WorkspacePanel>
        );
      })}
    </div>
  );
}

function renderContent(id: PanelId, enabled: boolean) {
  switch (id) {
    case "iccp":
      return <ICCPFeed enabled={enabled} />;
    case "nursing":
      return <NursingFeed enabled={enabled} />;
    case "aic":
      return <AICFeed enabled={enabled} />;
    case "medication":
      return <MedicationFeed enabled={enabled} />;
    case "telegram":
      return <TelegramFeed enabled={enabled} />;
  }
}
