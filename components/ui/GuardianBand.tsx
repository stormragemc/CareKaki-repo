import { ShieldCheck } from "lucide-react";

// Guardian is a wrapper band over everything Autopilot runs — never a service tile.
export default function GuardianBand({
  theme = "light",
  count,
}: {
  theme?: "light" | "dark";
  count?: number;
}) {
  const shell =
    theme === "dark"
      ? "border-guardian-border-dark bg-live-band-dark text-autopilot-text"
      : "border-guardian-border bg-live/5 text-ink-body";

  const sub = theme === "dark" ? "text-autopilot-muted" : "text-ink-soft";
  const icon = theme === "dark" ? "text-live-dark" : "text-live";

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3 ${shell}`}
      role="note"
      aria-label="Guardian is active"
    >
      <ShieldCheck size={18} className={icon} aria-hidden="true" />
      <span className="font-semibold">Guardian — active</span>
      <span className={`text-sm ${sub}`}>
        No medical advice · PDPA scrubbed · Human one click away
      </span>
      {count != null && (
        <span className={`ml-auto text-sm font-medium ${sub}`}>
          Wrapping all {count}
        </span>
      )}
    </div>
  );
}
