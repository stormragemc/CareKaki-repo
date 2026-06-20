"use client";

import { useState, useEffect } from "react";
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
  sources: string[];     // provenance — surfaced in the panel header as an honesty cue
  bypassGate?: boolean;  // ICCP escalates to a human faster — it may skip the gate.
  liveLabel?: string;    // LIVE chip only on genuinely-live actions (real Telegram send).
}

const ALL_PANELS: PanelDef[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover", sources: ["Telegram Bot API"], bypassGate: true },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking", sources: ["CHAS GeoJSON"] },
  { id: "aic", title: "AIC", subtitle: "Eldercare services", sources: ["Eldercare GeoJSON"] },
  { id: "medication", title: "Medication Review", subtitle: "HSA + openFDA", sources: ["HSA CSV", "openFDA API"] },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert", sources: ["Telegram Bot API"], liveLabel: "Caregiver alert" },
];

export default function AgentWorkspace({ approved }: { approved: boolean }) {
  const [expanded, setExpanded] = useState<PanelId | null>(null);
  const [activeIds, setActiveIds] = useState<PanelId[]>(ALL_PANELS.map((p) => p.id));

  // The emergency flow seeds `autopilotAdapters` (from the backend's plan_adapters);
  // honour it so Autopilot only shows the services this situation actually needs.
  useEffect(() => {
    const stored = sessionStorage.getItem("autopilotAdapters");
    if (!stored) return;
    try {
      const ids = JSON.parse(stored) as PanelId[];
      if (ids.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveIds(ids);
      }
    } catch {}
  }, []);

  const panels = ALL_PANELS.filter((p) => activeIds.includes(p.id));
  const toggle = (id: PanelId) => setExpanded((cur) => (cur === id ? null : id));

  if (panels.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      {panels.map((panel) => {
        const enabled = approved || !!panel.bypassGate;
        const status: PillStatus = enabled ? "running" : "draft";
        return (
          <WorkspacePanel
            key={panel.id}
            title={panel.title}
            subtitle={panel.subtitle}
            status={status}
            liveLabel={enabled ? panel.liveLabel : undefined}
            sources={panel.sources}
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
