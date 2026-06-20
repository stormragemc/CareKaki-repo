import ServiceCard from "./ServiceCard";
import type { AutopilotService } from "@/lib/types";

interface AutopilotDashboardProps {
  services: AutopilotService[];
  // INTEGRATION POINT: pass a WebSocket / SSE subscription here to push
  // live status updates into each ServiceCard as the agent runs.
}

export default function AutopilotDashboard({ services }: AutopilotDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif font-bold text-3xl text-white leading-tight">
          The agent doesn&apos;t prepare the work.
        </h2>
        <p className="text-brand-orange text-lg italic font-serif">
          It does the work — five services, in parallel, right now.
        </p>
      </div>

      {/* Guardian shield — wraps every service, not a tile of its own */}
      <div className="flex flex-col gap-2 rounded-xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span aria-hidden="true">🛡️</span>
          Guardian — all actions under Responsible AI
        </span>
        <span className="text-xs text-white/60">
          No medical advice · PDPA scrubbed · human one click away
        </span>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      <p className="text-center text-sm text-white/40 italic">
        When Aunty Mei calls tomorrow, she already knows everything. The family
        never repeats themselves.
      </p>
    </div>
  );
}
