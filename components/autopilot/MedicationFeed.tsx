"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ArrowUpRight, UserCog } from "lucide-react";
import { DraftNotice } from "./WorkspaceLog";

// CareKaki does NOT assess medication itself. For a high-acuity, unsupported
// case (e.g. anticoagulants + a recent blackout) the safe behaviour is to raise
// a flag and route it to a clinician via the coordinator — never an autonomous
// interaction check. So this panel makes no network call; it surfaces the flag.
export default function MedicationFeed({ enabled = true }: { enabled?: boolean }) {
  const [meds, setMeds] = useState<string>("");

  useEffect(() => {
    try {
      const profileStr = sessionStorage.getItem("careProfile");
      if (profileStr) {
        const p = JSON.parse(profileStr);
        if (typeof p.conditions === "string") setMeds(p.conditions);
      }
    } catch {}
  }, []);

  if (!enabled) return <DraftNotice label="Drafted — medication flag awaiting approval" />;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5 rounded-xl border border-status-running-dark/50 bg-autopilot-band p-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-status-running-dark/20 text-status-running-dark">
          <ShieldAlert size={15} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-semibold text-autopilot-text">
            Flagged for clinician-led review
          </p>
          <p className="text-[11px] leading-snug text-autopilot-muted">
            CareKaki won&apos;t assess these medications itself. The list has been routed to
            the care team for an urgent clinician-led medication &amp; falls review.
          </p>
        </div>
      </div>

      {meds && (
        <div className="flex items-start gap-2 rounded-lg bg-autopilot-band px-2.5 py-2">
          <UserCog size={13} className="mt-0.5 shrink-0 text-autopilot-muted" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-autopilot-muted">
              Shared with clinician — not interpreted
            </span>
            <span className="text-xs leading-snug text-autopilot-text">{meds}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-autopilot-band px-2.5 py-2">
        <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-status-done-dark" aria-hidden="true" />
        <span className="text-xs leading-snug text-autopilot-text">
          Routed to the ICCP coordinator alongside the urgent escalation — a clinician
          decides on interactions and falls risk.
        </span>
      </div>
    </div>
  );
}
