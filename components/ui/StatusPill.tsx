export type PillStatus = "draft" | "running" | "done";

// Status is never color-only — always a text label (and a leading dot when running).
const defaultLabel: Record<PillStatus, string> = {
  draft: "Draft",
  running: "Running",
  done: "Done",
};

const lightStyles: Record<PillStatus, string> = {
  draft: "bg-status-draft-bg text-status-draft",
  running: "bg-status-running-bg text-status-running",
  done: "bg-status-done-bg text-status-done",
};

const darkStyles: Record<PillStatus, string> = {
  draft: "bg-status-draft-bg-dark text-status-draft-dark",
  running: "bg-status-running-bg-dark text-status-running-dark",
  done: "bg-status-done-bg-dark text-status-done-dark",
};

export default function StatusPill({
  status,
  theme = "light",
  label,
}: {
  status: PillStatus;
  theme?: "light" | "dark";
  label?: string;
}) {
  const styles = theme === "dark" ? darkStyles : lightStyles;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status === "running" && (
        <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" />
      )}
      {label ?? defaultLabel[status]}
    </span>
  );
}
