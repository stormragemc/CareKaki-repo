"use client";

import { useState, useEffect } from "react";
import WorkspacePanel from "./WorkspacePanel";
import TelegramFeed from "./TelegramFeed";
import AICFeed from "./AICFeed";
import NursingFeed from "./NursingFeed";
import ICCPFeed from "./ICCPFeed";
import MedicationFeed from "./MedicationFeed";

type PanelId = "iccp" | "nursing" | "aic" | "medication" | "telegram";

interface PanelConfig {
  id: PanelId;
  title: string;
  subtitle: string;
  sources: string[];
  requiresConfirmation: boolean;
}

const ALL_PANELS: PanelConfig[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover", sources: ["Telegram Bot API"], requiresConfirmation: true },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking", sources: ["CHAS GeoJSON", "OneMap"], requiresConfirmation: true },
  { id: "aic", title: "AIC", subtitle: "Eldercare services", sources: ["Eldercare GeoJSON"], requiresConfirmation: false },
  { id: "medication", title: "Medication Review", subtitle: "HSA + openFDA", sources: ["HSA CSV", "openFDA API"], requiresConfirmation: true },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert", sources: ["Telegram Bot API"], requiresConfirmation: false },
];

export default function AgentWorkspace() {
  const [expanded, setExpanded] = useState<PanelId | null>(null);
  const [activeIds, setActiveIds] = useState<PanelId[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("autopilotAdapters");
    if (stored) {
      try {
        const ids = JSON.parse(stored) as PanelId[];
        if (ids.length > 0) {
          setActiveIds(ids);
          return;
        }
      } catch {}
    }
    setActiveIds(ALL_PANELS.map((p) => p.id));
  }, []);

  const panels = ALL_PANELS.filter((p) => activeIds.includes(p.id));

  const toggle = (id: PanelId) => setExpanded((cur) => (cur === id ? null : id));

  if (panels.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-9rem)]">
      {panels.map((panel) => (
        <WorkspacePanel
          key={panel.id}
          title={panel.title}
          subtitle={panel.subtitle}
          isExpanded={expanded === panel.id}
          isAnyExpanded={expanded !== null}
          onToggleExpand={() => toggle(panel.id)}
          sources={panel.sources}
          requiresConfirmation={panel.requiresConfirmation}
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
