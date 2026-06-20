import type { CareMode, FieldSource } from "@/lib/types";
import ProvenanceMarker from "./ProvenanceMarker";

// "just updated" gets a mode-colored border + pill + a one-shot ckPulse ring.
const updatedBorder: Record<CareMode, string> = {
  self: "border-self",
  caregiver: "border-caregiver",
};

const pulseTint: Record<CareMode, string> = {
  self: "[--ck-pulse:rgba(217,116,46,0.45)]",
  caregiver: "[--ck-pulse:rgba(28,107,102,0.45)]",
};

const updatedPill: Record<CareMode, string> = {
  self: "bg-self-soft text-self-ink",
  caregiver: "bg-caregiver-soft text-caregiver-ink",
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
