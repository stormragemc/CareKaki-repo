import type { AutopilotService } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";

interface ServiceCardProps {
  service: AutopilotService;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="flex flex-col gap-3 bg-[#3A1E10] rounded-xl p-5 border border-white/10">
      {/* Icon + title */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-white text-sm ${service.iconColor}`}
          aria-hidden="true"
        >
          {service.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-white text-sm leading-snug">
            {service.name}
          </h3>
          <span className="text-[11px] text-brand-orange font-medium tracking-wide">
            {service.provider}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/60 leading-relaxed flex-1">
        {service.description}
      </p>

      {/* Footer: badge + running indicator */}
      <div className="flex items-center justify-between">
        <StatusBadge status={service.status} label={service.statusLabel} />
        {service.isRunning && (
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
            running
          </span>
        )}
      </div>
    </div>
  );
}
