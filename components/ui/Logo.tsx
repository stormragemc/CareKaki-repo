import type { CareMode } from "@/lib/types";

interface LogoProps {
  size?: number;
  /** Kept for API compatibility; the brand mark is always two-tone teal. */
  mode?: CareMode;
  /** Brightens the teals so the mark reads on the dark slate-navy screens. */
  theme?: "light" | "dark";
  className?: string;
}

// CareKaki brand mark: two figures (heads + bodies) forming a heart, split into a
// lighter-teal left half and a deeper-teal right half. Teal is the brand colour and
// is unchanged by Direction A (it matches the caregiver token #1C6B66).
const TONES = {
  light: { soft: "#7FC4BD", deep: "#1C6B66" },
  dark: { soft: "#A7DAD4", deep: "#5FB3AB" },
} as const;

export default function Logo({ size = 30, theme = "light", className }: LogoProps) {
  const { soft, deep } = TONES[theme];

  // Heart ring (outer minus inner via even-odd), split down the middle by colour.
  const heart =
    "M32 56 C 13 40 6 31 6 22 C 6 15 11 10 18 10 C 24 10 29 13 32 18 " +
    "C 35 13 40 10 46 10 C 53 10 58 15 58 22 C 58 31 51 40 32 56 Z " +
    "M32 47 C 18 35 13 29 13 23 C 13 18.5 16.5 15.5 21 15.5 C 25 15.5 29 18.5 32 23.5 " +
    "C 35 18.5 39 15.5 43 15.5 C 47.5 15.5 51 18.5 51 23 C 51 29 46 35 32 47 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 60"
      fill="none"
      className={className}
      role="img"
      aria-label="CareKaki"
    >
      <defs>
        <clipPath id="ck-logo-left">
          <rect x="0" y="0" width="32" height="60" />
        </clipPath>
        <clipPath id="ck-logo-right">
          <rect x="32" y="0" width="32" height="60" />
        </clipPath>
      </defs>

      {/* Heart ring, two-tone */}
      <path d={heart} fill={soft} fillRule="evenodd" clipPath="url(#ck-logo-left)" />
      <path d={heart} fill={deep} fillRule="evenodd" clipPath="url(#ck-logo-right)" />

      {/* Heads */}
      <circle cx="20" cy="6.5" r="5" fill={soft} />
      <circle cx="44" cy="5" r="5.5" fill={deep} />
    </svg>
  );
}
