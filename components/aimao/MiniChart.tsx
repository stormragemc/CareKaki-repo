"use client";

/**
 * Friendly, senior-readable charts as inline SVG — no chart dependency, and they
 * print cleanly. Each answers one real question, never decoration.
 */

type Accent = "teal" | "blue" | "green" | "orange" | "sky" | "moss";

const ACCENT: Record<Accent, string> = {
  teal: "var(--color-aimao-teal)",
  blue: "var(--color-aimao-blue)",
  green: "var(--color-aimao-green)",
  orange: "var(--color-aimao-orange)",
  sky: "var(--color-aimao-sky)",
  moss: "var(--color-aimao-moss)",
};

const TRACK = "var(--color-aimao-cream-deep)";
const LABEL = "var(--color-aimao-ink-soft)";

interface Datum {
  label: string;
  value: number;
}

/* ── Vertical bars (e.g. weekly adherence) ─────────────────────────────────── */
export function BarChart({
  data,
  accent = "teal",
  unit = "%",
}: {
  data: Datum[];
  accent?: Accent;
  unit?: string;
}) {
  const W = 300;
  const H = 150;
  const padX = 6;
  const padTop = 20;
  const padBottom = 24;
  const n = data.length;
  const gap = 10;
  const barW = (W - padX * 2 - gap * (n - 1)) / n;
  const chartH = H - padTop - padBottom;
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / n);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Bar chart. Average ${avg}${unit}. ${data
        .map((d) => `${d.label} ${d.value}${unit}`)
        .join(", ")}.`}
    >
      {data.map((d, i) => {
        const x = padX + i * (barW + gap);
        const barH = Math.max(3, (d.value / 100) * chartH);
        const y = padTop + (chartH - barH);
        return (
          <g key={d.label}>
            <rect x={x} y={padTop} width={barW} height={chartH} rx={7} fill={TRACK} />
            <rect x={x} y={y} width={barW} height={barH} rx={7} fill={ACCENT[accent]} />
            <text
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={ACCENT[accent]}
            >
              {d.value}
            </text>
            <text x={x + barW / 2} y={H - 7} textAnchor="middle" fontSize="10" fill={LABEL}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Line trend (e.g. mobility confidence over weeks) ──────────────────────── */
export function LineChart({
  labels,
  values,
  accent = "teal",
}: {
  labels: string[];
  values: number[];
  accent?: Accent;
}) {
  const W = 300;
  const H = 150;
  const padX = 14;
  const padTop = 18;
  const padBottom = 24;
  const chartH = H - padTop - padBottom;
  const stepX = (W - padX * 2) / (values.length - 1);
  const pt = (v: number, i: number) => ({
    x: padX + i * stepX,
    y: padTop + chartH - (v / 100) * chartH,
  });
  const points = values.map(pt);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const trend = values[values.length - 1] - values[0];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Line chart, ${trend >= 0 ? "up" : "down"} ${Math.abs(trend)} points overall. Values: ${values.join(", ")}.`}
    >
      {[0.5].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={W - padX}
          y1={padTop + chartH * f}
          y2={padTop + chartH * f}
          stroke={TRACK}
          strokeWidth="1.5"
        />
      ))}
      <path d={path} fill="none" stroke={ACCENT[accent]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke={ACCENT[accent]} strokeWidth="2.5" />
          <text x={p.x} y={H - 7} textAnchor="middle" fontSize="10" fill={LABEL}>
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Percentage ring (e.g. overall adherence) ──────────────────────────────── */
export function RingChart({
  value,
  accent = "green",
  caption,
}: {
  value: number;
  accent?: Accent;
  caption?: string;
}) {
  const size = 130;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      role="img"
      aria-label={`${value} percent. ${caption ?? ""}`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ACCENT[accent]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--color-aimao-ink)">
        {value}%
      </text>
      {caption && (
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fontSize="10" fill={LABEL}>
          {caption}
        </text>
      )}
    </svg>
  );
}

/* ── Horizontal domain bars (care-priority overview) ───────────────────────── */
export function DomainBars({ data }: { data: Datum[] }) {
  const accents: Accent[] = ["teal", "orange", "moss", "sky"];
  return (
    <div className="flex flex-col gap-3" role="img" aria-label={`Care domains: ${data.map((d) => `${d.label} ${d.value}%`).join(", ")}.`}>
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-base text-aimao-ink-soft">{d.label}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-aimao-cream-deep">
            <div
              className="h-full rounded-full"
              style={{ width: `${d.value}%`, background: ACCENT[accents[i % accents.length]] }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-base font-semibold text-aimao-ink">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}
