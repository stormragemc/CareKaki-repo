// Hand-rolled inline-SVG charts — friendly, readable, and they print natively
// (no canvas, no chart library). Each answers one real question; captions live
// with the chart so the printed document stands alone.

import {
  adherenceByWeek,
  activityCompletion,
  mobilityConfidence,
  careDomains,
} from "@/lib/demoCareData";

const TEAL = "var(--color-aimao-teal)";
const INK_MUTED = "var(--color-ink-muted)";
const TRACK = "var(--color-tint)";

/** Weekly plan adherence — “is adherence improving?” */
export function AdherenceChart() {
  const W = 340;
  const H = 150;
  const pad = { l: 8, r: 8, t: 22, b: 24 };
  const bw = (W - pad.l - pad.r) / adherenceByWeek.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weekly adherence, rising from 58 to 84 percent over six weeks">
      {adherenceByWeek.map((d, i) => {
        const h = ((H - pad.t - pad.b) * d.pct) / 100;
        const x = pad.l + i * bw + bw * 0.18;
        const y = H - pad.b - h;
        const last = i === adherenceByWeek.length - 1;
        return (
          <g key={d.label}>
            <rect x={x} y={pad.t} width={bw * 0.64} height={H - pad.t - pad.b} rx={7} fill={TRACK} />
            <rect x={x} y={y} width={bw * 0.64} height={h} rx={7} fill={last ? TEAL : "var(--color-drawer-blue)"} />
            <text x={x + bw * 0.32} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={last ? TEAL : INK_MUTED}>
              {d.pct}%
            </text>
            <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" fontSize="11" fill={INK_MUTED}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Mobility confidence self-report — “has mobility confidence changed?” */
export function MobilitySparkline() {
  const W = 340;
  const H = 120;
  const pad = { l: 10, r: 10, t: 16, b: 20 };
  const max = 10;
  const pts = mobilityConfidence.map((v, i) => {
    const x = pad.l + (i * (W - pad.l - pad.r)) / (mobilityConfidence.length - 1);
    const y = pad.t + (H - pad.t - pad.b) * (1 - v / max);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mobility confidence over the last 14 days, dipping from around 7.5 to 6 in recent days">
      <path d={area} fill="var(--color-drawer-orange-soft)" />
      <path d={line} stroke="var(--color-drawer-orange)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={5} fill="var(--color-drawer-orange)" stroke="#fff" strokeWidth="2" />
      <text x={pad.l} y={H - 5} fontSize="11" fill={INK_MUTED}>14 days ago</text>
      <text x={W - pad.r} y={H - 5} fontSize="11" textAnchor="end" fill={INK_MUTED}>today</text>
      <text x={lx - 10} y={ly - 10} fontSize="11" fontWeight="700" textAnchor="end" fill="var(--color-drawer-orange)">
        recent dip
      </text>
    </svg>
  );
}

/** Per-activity completion — “which activities are frequently missed?”
 *  `data` allows localized activity names; defaults to the English fixture. */
export function CompletionBars({
  data = activityCompletion,
}: {
  data?: { activity: string; done: number; planned: number }[];
}) {
  const rowH = 34;
  const W = 340;
  const labelW = 128;
  const H = data.length * rowH + 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Completion by activity this month; balance practice and chair stands are the most often missed">
      {data.map((d, i) => {
        const y = i * rowH + 6;
        const pct = d.done / d.planned;
        const barW = (W - labelW - 46) * pct;
        const low = pct < 0.7;
        return (
          <g key={d.activity}>
            <text x={0} y={y + 13} fontSize="11.5" fill="var(--color-ink-body)">{d.activity}</text>
            <rect x={labelW} y={y + 2} width={W - labelW - 46} height={13} rx={6.5} fill={TRACK} />
            <rect x={labelW} y={y + 2} width={Math.max(barW, 10)} height={13} rx={6.5} fill={low ? "var(--color-drawer-orange)" : "var(--color-drawer-green)"} />
            <text x={W - 40} y={y + 13} fontSize="11" fontWeight="600" fill={low ? "var(--color-drawer-orange)" : INK_MUTED}>
              {d.done}/{d.planned}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Care-domain attention — “which domain needs the most attention?”
 *  `data` allows localized domain names; defaults to the English fixture. */
export function DomainBars({
  data = careDomains,
}: {
  data?: { domain: string; attention: number; tone: string }[];
}) {
  const rowH = 36;
  const W = 340;
  const labelW = 96;
  const H = data.length * rowH + 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Attention needed by care domain; mobility highest, then nutrition">
      {data.map((d, i) => {
        const y = i * rowH + 6;
        const barW = ((W - labelW - 12) * d.attention) / 100;
        return (
          <g key={d.domain}>
            <text x={0} y={y + 14} fontSize="12" fill="var(--color-ink-body)">{d.domain}</text>
            <rect x={labelW} y={y + 3} width={W - labelW - 12} height={15} rx={7.5} fill={TRACK} />
            <rect x={labelW} y={y + 3} width={Math.max(barW, 12)} height={15} rx={7.5} fill={`var(--color-${d.tone})`} />
            <text x={labelW + Math.max(barW, 12) + 6} y={y + 15} fontSize="11" fontWeight="600" fill={INK_MUTED}>
              {d.attention}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
