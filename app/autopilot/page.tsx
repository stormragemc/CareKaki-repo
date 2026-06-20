"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import GuardianBand from "@/components/ui/GuardianBand";
import AgentWorkspace from "@/components/autopilot/AgentWorkspace";
import { loadDemoUser, loadCareProfile } from "@/lib/session";

const SERVICE_COUNT = 5; // 5 services + Guardian wrapper — Guardian is never a tile.

export default function AutopilotPage() {
  const [name, setName] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const user = loadDemoUser();
    const profile = loadCareProfile();
    // sessionStorage is client-only; reading it after mount keeps SSR/hydration in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user?.name ?? profile?.name ?? "your loved one");
  }, []);

  return (
    <div className="min-h-screen bg-autopilot-bg text-autopilot-text flex flex-col motion-safe:animate-ck-fade-in">
      {/* Dark header — the deliberate "machine world" mood shift */}
      <header className="sticky top-0 z-50 bg-autopilot-bg/95 backdrop-blur-sm border-b border-autopilot-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Logo size={28} />
            <span className="flex flex-col leading-tight">
              <span className="font-serif font-semibold text-autopilot-text text-lg tracking-tight">
                Autopilot
              </span>
              <span className="text-xs text-autopilot-muted">
                {SERVICE_COUNT} services {approved ? "running" : "drafted"} for {name}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/pathway"
              className="text-sm text-autopilot-muted hover:text-autopilot-text transition-colors"
            >
              ← Back to plan
            </Link>
            <TalkToHuman theme="dark" />
          </div>
        </div>
      </header>

      {/* Guardian wraps everything Autopilot runs, then the live workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 overflow-hidden">
        <GuardianBand theme="dark" count={SERVICE_COUNT} />
        <div className="flex-1 overflow-hidden">
          <AgentWorkspace approved={approved} />
        </div>
      </main>

      {/* Draft / approve gate */}
      <footer className="sticky bottom-0 z-40 bg-autopilot-band/95 backdrop-blur-sm border-t border-autopilot-hairline">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {approved ? (
            <>
              <p className="text-sm text-autopilot-muted">
                All {SERVICE_COUNT} running under Guardian · each service is executing its own live flow.
              </p>
              <Link
                href="/handover"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
              >
                Continue to Care Brief →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-autopilot-muted">
                {SERVICE_COUNT} services drafted · Guardian wrapping all {SERVICE_COUNT} · awaiting your approval
                <span className="block text-xs text-autopilot-muted/70">
                  Nothing irreversible runs until you approve. Reject to adjust the plan, or coordinator escalation may proceed to reach a human faster.
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/pathway"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-autopilot-hairline px-5 text-sm font-semibold text-autopilot-text transition-colors hover:bg-autopilot-card"
                >
                  Reject &amp; edit plan
                </Link>
                <button
                  type="button"
                  onClick={() => setApproved(true)}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-self px-7 text-base font-semibold text-white transition-colors hover:bg-self-ink"
                >
                  Approve all
                </button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
