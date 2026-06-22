import type { CareMode, FieldSource } from "@/lib/types";
import ProvenanceMarker from "./ProvenanceMarker";

// "just updated" is GREEN for both personas (Direction A): green border + pill +
// a one-shot green ckPulse ring. Green now consistently = verified / working / done.
const updatedBorder: Record<CareMode, string> = {
  self: "border-updated",
  caregiver: "border-updated",
};

const pulseTint: Record<CareMode, string> = {
  self: "[--ck-pulse:rgba(46,125,88,0.45)]",
  caregiver: "[--ck-pulse:rgba(46,125,88,0.45)]",
};

const updatedPill: Record<CareMode, string> = {
  self: "bg-status-done-bg text-updated",
  caregiver: "bg-status-done-bg text-updated",
};

export default function ProfileFieldCard({
  label,
  value,
  source,
  justUpdated = false,
  mode,
}: {
  label: string;
  value: string;
  source: FieldSource;
  justUpdated?: boolean;
  mode: CareMode;
}) {
  const border = justUpdated ? updatedBorder[mode] : "border-hairline";
  const pulse = justUpdated
    ? `motion-safe:animate-ck-pulse ${pulseTint[mode]}`
    : "";

  return (
    <div className={`rounded-2xl border bg-surface p-4 ${border} ${pulse}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        {justUpdated ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${updatedPill[mode]}`}
          >
            just updated
          </span>
        ) : (
          <ProvenanceMarker source={source} />
        )}
      </div>
      <p className="mt-1 text-ink-body">{value}</p>
    </div>
  );
}
