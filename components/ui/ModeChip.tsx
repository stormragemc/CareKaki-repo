import type { CareMode } from "@/lib/types";

const styles: Record<CareMode, string> = {
  self: "bg-self-soft text-self-ink border-self-border",
  caregiver: "bg-caregiver-soft text-caregiver-ink border-caregiver-border",
};

const label: Record<CareMode, string> = {
  self: "Self",
  caregiver: "Caregiver",
};

export default function ModeChip({ mode }: { mode: CareMode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${styles[mode]}`}
    >
      {label[mode]}
    </span>
  );
}
