import type { CareMode } from "@/lib/types";

interface LogoProps {
  size?: number;
  mode?: CareMode;
}

// Rounded-square "C" monogram, tinted by the active mode (self = orange,
// caregiver = teal). Defaults to self/orange for mode-less screens (Landing).
const fill: Record<CareMode, string> = {
  self: "bg-self",
  caregiver: "bg-caregiver",
};

export default function Logo({ size = 30, mode = "self" }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg font-serif font-bold text-white leading-none select-none ${fill[mode]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden="true"
    >
      C
    </div>
  );
}
