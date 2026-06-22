"use client";

import { useState, useEffect, useRef } from "react";
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
  sources: string[];        // provenance — surfaced in the panel header as an honesty cue
  bypassGate?: boolean;     // ICCP escalates to a human faster — it may skip the gate.
  liveLabel?: string;       // LIVE chip only on genuinely-live actions (real Telegram send).
  enabledStatus?: PillStatus; // overrides the default "running" pill once enabled
  statusLabel?: string;     // custom pill text (e.g. a flag rather than a live action)
}

const ALL_PANELS: PanelDef[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover", sources: ["Telegram Bot API"], bypassGate: true },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking", sources: ["CHAS GeoJSON"] },
  { id: "aic", title: "AIC", subtitle: "Eldercare services", sources: ["Eldercare GeoJSON"] },
  // CareKaki does NOT assess medication itself — it raises a flag for a clinician
  // and routes it to the care team. No autonomous interaction check runs here.
  { id: "medication", title: "Medication", subtitle: "Routed to clinician", sources: ["Care Corner clinician"], enabledStatus: "done", statusLabel: "Flagged for clinician" },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert", sources: ["Telegram Bot API"], liveLabel: "Caregiver alert" },
];

const ALL_PANEL_IDS = ALL_PANELS.map((p) => p.id);

// Single source of truth for which services Autopilot is actually running.
// The emergency flow seeds `autopilotAdapters` (from the backend's plan_adapters);
// honour it so the count + tiles only reflect what this situation needs.
export function resolveActivePanelIds(): PanelId[] {
  if (typeof window === "undefined") return ALL_PANEL_IDS;
  try {
    const stored = sessionStorage.getItem("autopilotAdapters");
    if (stored) {
      const ids = (JSON.parse(stored) as PanelId[]).filter((id) => ALL_PANEL_IDS.includes(id));
      if (ids.length > 0) return ids;
    }
  } catch {}
  return ALL_PANEL_IDS;
}

export default function AgentWorkspace({
  approved,
  onAllPanelsViewed,
}: {
  approved: boolean;
  onAllPanelsViewed?: () => void;
}) {
  const [expanded, setExpanded] = useState<PanelId | null>(null);
  const [activeIds, setActiveIds] = useState<PanelId[]>(ALL_PANEL_IDS);
  const viewedRef = useRef<Set<PanelId>>(new Set());
  const firedRef = useRef(false);

  useEffect(() => {
    // sessionStorage is client-only; resolve after mount to keep SSR/hydration in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIds(resolveActivePanelIds());
  }, []);

  const panels = ALL_PANELS.filter((p) => activeIds.includes(p.id));

  const toggle = (id: PanelId) => {
    setExpanded((cur) => (cur === id ? null : id));
    // Once the caregiver has opened every running panel at least once, the
    // "you've seen everything — head to the Care Brief" nudge can fire.
    viewedRef.current.add(id);
    if (
      !firedRef.current &&
      panels.length > 0 &&
      panels.every((p) => viewedRef.current.has(p.id))
    ) {
      firedRef.current = true;
      onAllPanelsViewed?.();
    }
  };

  if (panels.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      {panels.map((panel) => {
        const enabled = approved || !!panel.bypassGate;
        const status: PillStatus = enabled ? panel.enabledStatus ?? "running" : "draft";
        return (
          <WorkspacePanel
            key={panel.id}
            title={panel.title}
            subtitle={panel.subtitle}
            status={status}
            statusLabel={panel.statusLabel}
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
