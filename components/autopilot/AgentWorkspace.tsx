"use client";

import { useState } from "react";
import WorkspacePanel from "./WorkspacePanel";
import TelegramFeed from "./TelegramFeed";
import AICFeed from "./AICFeed";
import NursingFeed from "./NursingFeed";
import ICCPFeed from "./ICCPFeed";
import MedicationFeed from "./MedicationFeed";

type PanelId = "iccp" | "nursing" | "aic" | "medication" | "telegram";

const PANELS: { id: PanelId; title: string; subtitle: string }[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover" },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking" },
  { id: "aic", title: "AIC", subtitle: "Eldercare services" },
  { id: "medication", title: "Medication Review", subtitle: "HSA + openFDA" },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert" },
];

export default function AgentWorkspace() {
  const [expanded, setExpanded] = useState<PanelId | null>(null);

  const toggle = (id: PanelId) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-9rem)]">
      {PANELS.map((panel) => (
        <WorkspacePanel
          key={panel.id}
          title={panel.title}
          subtitle={panel.subtitle}
          isExpanded={expanded === panel.id}
          isAnyExpanded={expanded !== null}
          onToggleExpand={() => toggle(panel.id)}
        >
          {renderContent(panel.id)}
        </WorkspacePanel>
      ))}
    </div>
  );
}

function renderContent(id: PanelId) {
  switch (id) {
    case "iccp":
      return <ICCPFeed />;
    case "nursing":
      return <NursingFeed />;
    case "aic":
      return <AICFeed />;
    case "medication":
      return <MedicationFeed />;
    case "telegram":
      return <TelegramFeed />;
  }
}
