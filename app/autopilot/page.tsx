import Link from "next/link";
import Logo from "@/components/ui/Logo";
import AutopilotDashboard from "@/components/autopilot/AutopilotDashboard";
import { mockAutopilotServices } from "@/lib/mock-data";

export default function AutopilotPage() {
  return (
    <div className="min-h-screen bg-brand-brown text-white flex flex-col">
      {/* Minimal dark header */}
      <header className="sticky top-0 z-50 bg-brand-brown/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={28} />
            <span className="font-serif font-bold text-white text-lg tracking-tight">
              CareKaki
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/pathway"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              ← Back to plan
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
              Autopilot running
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      {/* INTEGRATION POINT: Replace mockAutopilotServices with a real-time
          data source (WebSocket / SSE). Connect service statuses to actual
          agent actions via the Autopilot Orchestrator microservice. */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AutopilotDashboard services={mockAutopilotServices} />
      </main>
    </div>
  );
}
