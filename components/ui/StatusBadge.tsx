import type { ServiceStatus } from "@/lib/types";

const statusStyles: Record<ServiceStatus, string> = {
  submitted: "bg-brand-orange text-white",
  scheduled: "bg-brand-blue text-white",
  active:    "bg-brand-teal text-white",
  routed:    "bg-brand-amber text-white",
  pending:   "bg-brand-pink text-white",
  passing:   "bg-brand-blue text-white",
};

interface StatusBadgeProps {
  status: ServiceStatus;
  label: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
