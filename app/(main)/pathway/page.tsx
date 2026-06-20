"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import PathwayBoard from "@/components/pathway/PathwayBoard";
import { getPathwayPlan, modeForPersona } from "@/components/pathway/pathwayData";
import ModeChip from "@/components/ui/ModeChip";
import type { CareMode, CareProfile } from "@/lib/types";
import type { DemoUser } from "@/lib/demo-users";

// Session values are read-once and never mutate during a visit, so the
// subscription is a no-op; useSyncExternalStore keeps the client read off the
// SSR pass (no hydration mismatch) without a setState-in-effect.
const noopSubscribe = () => () => {};

function useSessionItem(key: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(key),
    () => null,
  );
}

export default function PathwayPage() {
  const profileRaw = useSessionItem("careProfile");
  const userRaw = useSessionItem("demoUser");

  let patientName = "";
  if (profileRaw) {
    try {
      patientName = (JSON.parse(profileRaw) as CareProfile).name;
    } catch {
      /* keep default */
    }
  }

  // The real fork is the selected persona (spec §1), not the cosmetic ?mode=
  // label. Onboard users (no demo user) fall back to caregiver.
  let mode: CareMode = "caregiver";
  if (userRaw) {
    try {
      mode = modeForPersona((JSON.parse(userRaw) as DemoUser).id) ?? "caregiver";
    } catch {
      /* keep default */
    }
  }

  const items = getPathwayPlan(mode);
  const title = patientName ? `${patientName}'s care plan` : "Your care plan";

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              The Pathway
            </p>
            <h1 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1 text-ink-soft">
              A plan, not a list — grouped by what needs to happen when. Every item
              explains itself.
            </p>
          </div>
          <ModeChip mode={mode} />
        </div>

        <PathwayBoard items={items} />
      </div>

      {/* Footer bar — hand off to Autopilot */}
      <div className="border-t border-hairline bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <p className="text-base text-ink-body">
            CareKaki can set all of this in motion for you.
          </p>
          <Link
            href="/autopilot"
            className="inline-flex min-h-[54px] shrink-0 items-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
          >
            Launch Autopilot →
          </Link>
        </div>
      </div>
    </div>
  );
}
