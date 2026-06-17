"use client";

import { useState } from "react";
import WorkspacePanel from "./WorkspacePanel";
import { LogEntry } from "./WorkspaceLog";
import TelegramFeed from "./TelegramFeed";
import AICFeed from "./AICFeed";
import NursingFeed from "./NursingFeed";

type PanelId = "iccp" | "nursing" | "aic" | "telegram";

const PANELS: { id: PanelId; title: string; subtitle: string }[] = [
  { id: "iccp", title: "ICCP Coordinator", subtitle: "Case handover" },
  { id: "nursing", title: "HomeNursing.sg", subtitle: "Provider booking" },
  { id: "aic", title: "AIC", subtitle: "Grant application" },
  { id: "telegram", title: "Telegram", subtitle: "Caregiver alert" },
];

export default function AgentWorkspace() {
  const [expanded, setExpanded] = useState<PanelId | null>(null);

  const toggle = (id: PanelId) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9rem)]">
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
      return (
        <>
          <LogEntry time="2:31 PM" text="Case packet assembled from Living Care Profile" tone="success" />
          <LogEntry time="2:31 PM" text="Routing to least-loaded officer — Aunty Mei" tone="success" />
          <LogEntry time="2:32 PM" text="Case Brief sent to coordinator queue" tone="success" />
          <LogEntry time="2:33 PM" text="Awaiting officer acknowledgement…" tone="pending" />
        </>
      );
    case "nursing":
      return <NursingFeed />;
    case "aic":
      return <AICFeed />;
    case "telegram":
      return <TelegramFeed />;
  }
}
