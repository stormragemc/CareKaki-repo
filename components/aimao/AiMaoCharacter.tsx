import type { CSSProperties } from "react";

// AiMao — the panda care companion. Digital version of the physical robot:
// warm-white head, charcoal body with the medicine-drawer colour stripes.
// Pure SVG + CSS keyframes (tokens in globals.css), so it renders anywhere —
// server or client — and costs no dependencies.
//
// Cuteness rules (deliberate): pupils nearly fill the eyes with big sparkle
// highlights, patches stay small and soft, features sit low and close
// together, blush is always on, and no stroke is ever harsh.

export type AiMaoExpression =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "concerned"
  | "happy"
  | "sleepy";

export type AiMaoSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<AiMaoSize, number> = {
  xs: 40,
  sm: 64,
  md: 104,
  lg: 168,
  xl: 232,
};

// Whole-character motion per mood (gentle + slow; reduced-motion handled globally).
const MOTION: Record<AiMaoExpression, string> = {
  idle: "motion-safe:animate-aimao-float",
  listening: "motion-safe:animate-aimao-float",
  thinking: "motion-safe:animate-aimao-tilt",
  speaking: "motion-safe:animate-aimao-float",
  concerned: "",
  happy: "motion-safe:animate-aimao-bounce",
  sleepy: "",
};

const PANDA = "#2E2E34";
const FUR = "var(--color-aimao-soft)";
const FUR_EDGE = "#EDE5D4";
const BLUSH = "var(--color-aimao-blush)";

interface AiMaoCharacterProps {
  expression?: AiMaoExpression;
  size?: AiMaoSize;
  /** Overrides the mouth to the talking animation (e.g. while TTS plays). */
  speaking?: boolean;
  /** "full" = head + drawer body (default) · "face" = head only. */
  variant?: "full" | "face";
  className?: string;
  style?: CSSProperties;
}

const EYE_X = [90, 150];
const EYE_Y = 90;

function Eyes({ expression }: { expression: AiMaoExpression }) {
  // Happy — closed “^ ^” arcs drawn in white inside the patches.
  if (expression === "happy") {
    return (
      <g>
        <path d="M82 92 Q90 84 98 92" stroke={FUR} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M142 92 Q150 84 158 92" stroke={FUR} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  // Sleepy — soft closed lids curving down.
  if (expression === "sleepy") {
    return (
      <g>
        <path d="M82 90 Q90 96 98 90" stroke={FUR} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M142 90 Q150 96 158 90" stroke={FUR} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  // Open eyes — big dark pupils that nearly fill the white, with two sparkle
  // highlights. The pupil offset carries the mood.
  const mood = {
    idle: { dx: 0, dy: 0, r: 6.2 },
    listening: { dx: 0, dy: -1, r: 6.8 },
    thinking: { dx: -2, dy: -2, r: 6.2 },
    speaking: { dx: 0, dy: 0, r: 6.2 },
    concerned: { dx: 0, dy: 1, r: 5.8 },
  }[expression] ?? { dx: 0, dy: 0, r: 6.2 };

  const blink =
    expression === "idle" || expression === "listening" || expression === "speaking"
      ? "aimao-part motion-safe:animate-aimao-blink"
      : "aimao-part";

  return (
    <g>
      {EYE_X.map((cx) => (
        <g key={cx} className={blink}>
          <circle cx={cx} cy={EYE_Y} r={7.5} fill={FUR} />
          <circle cx={cx + mood.dx} cy={EYE_Y + mood.dy} r={mood.r} fill={PANDA} />
          {/* sparkle highlights — the difference between cute and creepy */}
          <circle cx={cx + mood.dx + 2.2} cy={EYE_Y + mood.dy - 2.2} r={2.4} fill="#FFFFFF" />
          <circle cx={cx + mood.dx - 2} cy={EYE_Y + mood.dy + 2.6} r={1.1} fill="#FFFFFF" opacity={0.9} />
        </g>
      ))}
    </g>
  );
}

function Brows({ expression }: { expression: AiMaoExpression }) {
  if (expression === "thinking") {
    // One softly raised brow — curious, not stern.
    return (
      <path d="M144 62 Q150 58 156 61" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" opacity={0.75} />
    );
  }
  if (expression === "concerned") {
    // Gentle worried tilt, short and soft.
    return (
      <g opacity={0.75}>
        <path d="M84 64 Q90 61 96 64" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(6 90 63)" />
        <path d="M144 64 Q150 61 156 64" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(-6 150 63)" />
      </g>
    );
  }
  return null;
}

function Mouth({ expression, speaking }: { expression: AiMaoExpression; speaking: boolean }) {
  if (speaking || expression === "speaking") {
    // Small open mouth, gently cycling — driven by the aimao-mouth keyframe.
    return (
      <ellipse
        cx={120}
        cy={122}
        rx={6}
        ry={4.5}
        fill={PANDA}
        className="aimao-part motion-safe:animate-aimao-mouth"
      />
    );
  }
  switch (expression) {
    case "happy":
      return <path d="M110 117 Q120 129 130 117 Q120 122 110 117Z" fill={PANDA} />;
    case "concerned":
      return <path d="M114 124 Q120 120 126 124" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" />;
    case "thinking":
      return <path d="M114 122 Q121 125 126 121" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" />;
    case "listening":
      return <circle cx={120} cy={121.5} r={3} fill={PANDA} />;
    case "sleepy":
      return <path d="M114 122 Q120 126 126 122" stroke={PANDA} strokeWidth="3" strokeLinecap="round" fill="none" />;
    default:
      // The little “ω” smile.
      return (
        <path
          d="M112 120 Q116 125 120 121 Q124 125 128 120"
          stroke={PANDA}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
  }
}

export default function AiMaoCharacter({
  expression = "idle",
  size = "md",
  speaking = false,
  variant = "full",
  className = "",
  style,
}: AiMaoCharacterProps) {
  const width = SIZE_PX[size];
  const face = variant === "face";
  const viewBox = face ? "24 6 192 164" : "12 6 216 260";
  const height = face ? Math.round((width * 164) / 192) : Math.round((width * 260) / 216);
  const bigBlush = expression === "happy" || speaking || expression === "speaking";
  const earClass =
    expression === "listening" ? "aimao-part motion-safe:animate-aimao-ear" : "";

  return (
    <span
      role="img"
      aria-label={`AiMao the panda companion (${expression})`}
      className={`inline-block ${MOTION[expression]} ${className}`}
      style={style}
    >
      <svg width={width} height={height} viewBox={viewBox} fill="none" aria-hidden="true">
        {/* Listening halo */}
        {expression === "listening" && (
          <circle
            cx={120}
            cy={94}
            r={84}
            stroke="var(--color-aimao-teal)"
            strokeWidth="3"
            opacity={0.45}
            className="aimao-part motion-safe:animate-aimao-pulse"
          />
        )}

        {/* Body — charcoal, with the drawer stripes from the physical AiMao */}
        {!face && (
          <g>
            <ellipse cx={60} cy={214} rx={14} ry={23} fill={PANDA} />
            <ellipse cx={180} cy={214} rx={14} ry={23} fill={PANDA} />
            <rect x={64} y={178} width={112} height={84} rx={40} fill={PANDA} />
            <rect x={87} y={197} width={66} height={56} rx={18} fill={FUR} />
            <rect x={95} y={205} width={50} height={8.5} rx={4.25} fill="var(--color-drawer-orange)" />
            <rect x={95} y={217.5} width={50} height={8.5} rx={4.25} fill="var(--color-drawer-yellow)" />
            <rect x={95} y={230} width={50} height={8.5} rx={4.25} fill="var(--color-drawer-blue)" />
            <rect x={95} y={242.5} width={50} height={8.5} rx={4.25} fill="var(--color-drawer-green)" />
          </g>
        )}

        {/* Ears — smaller, rounder, set inward (cuter) */}
        <circle cx={62} cy={38} r={19} fill={PANDA} className={earClass} />
        <circle cx={178} cy={38} r={19} fill={PANDA} className={earClass} />
        <circle cx={62} cy={38} r={9} fill="#4A4A52" className={earClass} />
        <circle cx={178} cy={38} r={9} fill="#4A4A52" className={earClass} />

        {/* Head — a touch rounder */}
        <ellipse cx={120} cy={96} rx={76} ry={70} fill={FUR} stroke={FUR_EDGE} strokeWidth="2.5" />

        {/* Eye patches — small, soft, barely tilted */}
        <ellipse cx={90} cy={91} rx={16.5} ry={19.5} fill={PANDA} transform="rotate(-10 90 91)" />
        <ellipse cx={150} cy={91} rx={16.5} ry={19.5} fill={PANDA} transform="rotate(10 150 91)" />

        <Eyes expression={expression} />
        <Brows expression={expression} />

        {/* Blush — always on; stronger when happy or talking */}
        <g opacity={bigBlush ? 0.85 : 0.5}>
          <ellipse cx={68} cy={112} rx={9} ry={5.5} fill={BLUSH} />
          <ellipse cx={172} cy={112} rx={9} ry={5.5} fill={BLUSH} />
        </g>

        {/* Nose + mouth — tiny and close together */}
        <ellipse cx={120} cy={110} rx={5.5} ry={4} fill={PANDA} />
        <path d="M120 113.5 L120 117" stroke={PANDA} strokeWidth="2.2" strokeLinecap="round" />
        <Mouth expression={expression} speaking={speaking} />

        {/* Thinking dots */}
        {expression === "thinking" && (
          <g fill="var(--color-ink-muted)">
            <circle cx={192} cy={34} r={4} className="motion-safe:animate-ck-dot" />
            <circle cx={204} cy={25} r={5} className="motion-safe:animate-ck-dot [animation-delay:150ms]" />
            <circle cx={216} cy={14} r={6} className="motion-safe:animate-ck-dot [animation-delay:300ms]" />
          </g>
        )}
      </svg>
    </span>
  );
}
