import type { CareMode, PathwayGroup } from "@/lib/types";

// "Why this for you" tag — always traces a recommendation back to a profile fact.
// Tinted by pathway group when given, else by mode, else neutral.
const groupStyles: Record<PathwayGroup, string> = {
  "this-week": "bg-week-soft text-week",
  "weeks-2-8": "bg-weeks-soft text-weeks",
  "apply-now": "bg-apply-soft text-apply-ink",
  "single-point": "bg-single-soft text-single",
};

const modeStyles: Record<CareMode, string> = {
  self: "bg-self-soft text-self-ink",
  caregiver: "bg-caregiver-soft text-caregiver-ink",
};

export default function WhyTag({
  children,
  group,
  mode,
}: {
  children: React.ReactNode;
  group?: PathwayGroup;
  mode?: CareMode;
}) {
  const tint = group
    ? groupStyles[group]
    : mode
      ? modeStyles[mode]
      : "bg-cream-deep text-ink-soft";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${tint}`}
    >
      <span aria-hidden="true">✦</span>
      {children}
    </span>
  );
}
