// Honesty cue for a genuinely-live action (WhatsApp send + Google Calendar invite only).
export default function LiveChip({
  label,
  theme = "light",
}: {
  label: string;
  theme?: "light" | "dark";
}) {
  const styles =
    theme === "dark"
      ? "border-live-dark/40 bg-live-band-dark text-live-dark"
      : "border-live/30 bg-live/10 text-live";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      <span className="size-1.5 rounded-full bg-live-dot motion-safe:animate-pulse" aria-hidden="true" />
      LIVE · {label}
    </span>
  );
}
