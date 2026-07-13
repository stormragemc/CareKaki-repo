"use client";

/**
 * AiMao — the panda care companion.
 *
 * "AiMao is the face. CareKaki is the intelligence underneath."
 *
 * A single reusable SVG character with genuinely distinct expressions (not an
 * emoji swap): eyes, brows, mouth, blush, ears and body motion all change per
 * state. Gentle animations only — tuned for elderly comfort and reduced-motion.
 *
 *   <AiMaoCharacter expression="listening" size="lg" />
 */

export type AiMaoExpression =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "concerned"
  | "happy"
  | "sleepy";

type SizeToken = "sm" | "md" | "lg" | "xl";

interface AiMaoCharacterProps {
  expression?: AiMaoExpression;
  size?: SizeToken | number;
  /** Force the talking mouth on regardless of expression (e.g. audio playing). */
  speaking?: boolean;
  className?: string;
  /** Accessible label; defaults to a friendly description of the mood. */
  label?: string;
}

const SIZES: Record<SizeToken, number> = { sm: 72, md: 132, lg: 208, xl: 300 };

const CHARCOAL = "var(--color-aimao-charcoal)";
const BODY = "var(--color-aimao-body)";
const BLUSH = "var(--color-aimao-blush)";
const TEAL = "var(--color-aimao-teal)";

const MOOD_LABEL: Record<AiMaoExpression, string> = {
  idle: "AiMao, resting with a gentle smile",
  listening: "AiMao, listening attentively",
  thinking: "AiMao, thinking it over",
  speaking: "AiMao, speaking to you",
  concerned: "AiMao, looking gently concerned",
  happy: "AiMao, happy and celebrating",
  sleepy: "AiMao, sleepy and calm",
};

export default function AiMaoCharacter({
  expression = "idle",
  size = "md",
  speaking = false,
  className = "",
  label,
}: AiMaoCharacterProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  const isSpeaking = speaking || expression === "speaking";

  // Whole-body motion per mood.
  const bodyAnim =
    expression === "happy"
      ? "animate-aimao-bounce"
      : expression === "thinking"
      ? "animate-aimao-sway"
      : "animate-aimao-float";

  // Ears perk up (translate) when listening.
  const earTransform = expression === "listening" ? "translate(0,-4)" : undefined;

  // Pupil gaze offset.
  const gaze =
    expression === "thinking"
      ? { x: 4, y: -5 }
      : expression === "sleepy"
      ? { x: 0, y: 2 }
      : { x: 0, y: 0 };

  const showBlush = ["idle", "listening", "speaking", "happy"].includes(expression);
  const strongBlush = expression === "happy";

  return (
    <div
      className={`inline-block ${bodyAnim} motion-reduce:animate-none ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label={label ?? MOOD_LABEL[expression]}
    >
      <svg viewBox="0 0 220 220" width={px} height={px} fill="none">
        {/* Listening halo */}
        {expression === "listening" && (
          <circle
            cx="110"
            cy="112"
            r="92"
            fill={TEAL}
            className="animate-aimao-listen motion-reduce:animate-none"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}

        {/* Ears */}
        <g transform={earTransform} style={{ transition: "transform .3s ease" }}>
          <circle cx="60" cy="52" r="27" fill={CHARCOAL} />
          <circle cx="160" cy="52" r="27" fill={CHARCOAL} />
          <circle cx="60" cy="54" r="12" fill={BODY} opacity="0.18" />
          <circle cx="160" cy="54" r="12" fill={BODY} opacity="0.18" />
        </g>

        {/* Head / face */}
        <ellipse cx="110" cy="112" rx="82" ry="76" fill={BODY} />
        <ellipse cx="110" cy="112" rx="82" ry="76" fill="none" stroke={CHARCOAL} strokeOpacity="0.08" strokeWidth="2" />

        {/* Eye patches (the iconic panda ovals, angled inward) */}
        <ellipse cx="82" cy="104" rx="20" ry="27" fill={CHARCOAL} transform="rotate(18 82 104)" />
        <ellipse cx="138" cy="104" rx="20" ry="27" fill={CHARCOAL} transform="rotate(-18 138 104)" />

        {/* Eyes — per expression */}
        <Eyes expression={expression} gaze={gaze} />

        {/* Brows — per expression */}
        <Brows expression={expression} />

        {/* Cheeks */}
        {showBlush && (
          <>
            <ellipse cx="66" cy="132" rx="11" ry="7" fill={BLUSH} opacity={strongBlush ? 0.8 : 0.5} />
            <ellipse cx="154" cy="132" rx="11" ry="7" fill={BLUSH} opacity={strongBlush ? 0.8 : 0.5} />
          </>
        )}

        {/* Nose */}
        <path d="M104 126 Q110 122 116 126 Q114 133 110 133 Q106 133 104 126 Z" fill={CHARCOAL} />

        {/* Mouth — per expression */}
        <Mouth expression={expression} speaking={isSpeaking} />

        {/* Decorations */}
        {expression === "thinking" && <ThinkingDots />}
        {expression === "happy" && <Sparkles />}
        {expression === "sleepy" && <Zzz />}
      </svg>
    </div>
  );
}

/* ── Eyes ─────────────────────────────────────────────────────────────────── */

function Eyes({ expression, gaze }: { expression: AiMaoExpression; gaze: { x: number; y: number } }) {
  // Happy → warm closed arcs.
  if (expression === "happy") {
    return (
      <g stroke={CHARCOAL} strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M72 106 Q84 94 96 106" />
        <path d="M124 106 Q136 94 148 106" />
      </g>
    );
  }
  // Sleepy → droopy lids.
  if (expression === "sleepy") {
    return (
      <g stroke={CHARCOAL} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M72 108 Q84 116 96 108" />
        <path d="M124 108 Q136 116 148 108" />
      </g>
    );
  }

  // Open eyes (idle / listening / thinking / speaking / concerned).
  const wide = expression === "listening";
  const soft = expression === "concerned";
  const scleraR = wide ? 13.5 : soft ? 11 : 12.5;
  const pupilR = wide ? 8 : 7;

  return (
    <g>
      {/* left */}
      <circle cx="84" cy="106" r={scleraR} fill="#FFFFFF" />
      <circle cx={84 + gaze.x} cy={106 + gaze.y} r={pupilR} fill={CHARCOAL} />
      <circle cx={81 + gaze.x} cy={103 + gaze.y} r="2.4" fill="#FFFFFF" />
      {/* right */}
      <circle cx="136" cy="106" r={scleraR} fill="#FFFFFF" />
      <circle cx={136 + gaze.x} cy={106 + gaze.y} r={pupilR} fill={CHARCOAL} />
      <circle cx={133 + gaze.x} cy={103 + gaze.y} r="2.4" fill="#FFFFFF" />

      {/* Blink lids — cream shapes that snap shut periodically. Skipped for
          concerned (a steady, soft gaze reads as more sincere). */}
      {!soft && (
        <g
          className="animate-aimao-blink motion-reduce:animate-none"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <circle cx="84" cy="106" r={scleraR + 1} fill={BODY} />
          <circle cx="136" cy="106" r={scleraR + 1} fill={BODY} />
        </g>
      )}
    </g>
  );
}

/* ── Brows ────────────────────────────────────────────────────────────────── */

function Brows({ expression }: { expression: AiMaoExpression }) {
  const stroke = { stroke: CHARCOAL, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  if (expression === "listening") {
    return (
      <g {...stroke}>
        <path d="M70 78 Q84 72 98 76" />
        <path d="M122 76 Q136 72 150 78" />
      </g>
    );
  }
  if (expression === "concerned") {
    // Inner ends lifted — the universal "worried" brow.
    return (
      <g {...stroke}>
        <path d="M72 84 Q84 76 96 82" />
        <path d="M124 82 Q136 76 148 84" />
      </g>
    );
  }
  if (expression === "thinking") {
    // One brow cocked.
    return (
      <g {...stroke}>
        <path d="M70 80 Q84 74 98 80" />
        <path d="M124 74 Q136 70 150 76" />
      </g>
    );
  }
  return null;
}

/* ── Mouth ────────────────────────────────────────────────────────────────── */

function Mouth({ expression, speaking }: { expression: AiMaoExpression; speaking: boolean }) {
  if (speaking) {
    return (
      <ellipse
        cx="110"
        cy="148"
        rx="11"
        ry="9"
        fill={CHARCOAL}
        className="animate-aimao-speak motion-reduce:animate-none"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    );
  }
  const stroke = { stroke: CHARCOAL, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  switch (expression) {
    case "happy":
      return (
        <g>
          <path d="M90 142 Q110 166 130 142 Z" fill={CHARCOAL} />
          <path d="M100 154 Q110 160 120 154" fill={BLUSH} opacity="0.85" />
        </g>
      );
    case "concerned":
      return <path d="M99 150 Q110 143 121 150" {...stroke} />;
    case "thinking":
      return <path d="M101 148 H119" {...stroke} />;
    case "sleepy":
      return <ellipse cx="110" cy="148" rx="5" ry="4" fill={CHARCOAL} />;
    case "listening":
      return <path d="M100 144 Q110 151 120 144" {...stroke} />;
    default: // idle
      return <path d="M97 143 Q110 154 123 143" {...stroke} />;
  }
}

/* ── Decorations ──────────────────────────────────────────────────────────── */

function ThinkingDots() {
  return (
    <g>
      {[188, 200, 212].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={44 - i * 6}
          r="5"
          fill={TEAL}
          className="animate-ck-dot motion-reduce:animate-none"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </g>
  );
}

function Sparkles() {
  const star = (x: number, y: number, s: number) =>
    `M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`;
  return (
    <g fill="var(--color-aimao-yellow)" className="animate-ck-breathe motion-reduce:animate-none">
      <path d={star(30, 60, 9)} />
      <path d={star(192, 66, 7)} />
      <path d={star(44, 150, 6)} />
    </g>
  );
}

function Zzz() {
  return (
    <text
      x="176"
      y="52"
      fontSize="22"
      fontWeight="700"
      fill="var(--color-aimao-ink-faint)"
      className="animate-aimao-float motion-reduce:animate-none"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      z
    </text>
  );
}
