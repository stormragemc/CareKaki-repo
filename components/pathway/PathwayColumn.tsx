import type { PathwayColumnData, PathwayColorScheme } from "@/lib/types";

// ── Colour maps per scheme ────────────────────────────────────────────────────
const topBar: Record<PathwayColorScheme, string> = {
  orange: "bg-brand-orange",
  blue:   "bg-brand-blue",
  amber:  "bg-brand-amber",
  teal:   "bg-brand-teal",
};

const timeframeText: Record<PathwayColorScheme, string> = {
  orange: "text-brand-orange",
  blue:   "text-brand-blue",
  amber:  "text-brand-amber",
  teal:   "text-brand-teal",
};

const bulletBg: Record<PathwayColorScheme, string> = {
  orange: "bg-brand-orange",
  blue:   "bg-brand-blue",
  amber:  "bg-brand-amber",
  teal:   "bg-brand-teal",
};

const whyBg: Record<PathwayColorScheme, string> = {
  orange: "bg-brand-orange-light",
  blue:   "bg-brand-blue-light",
  amber:  "bg-brand-amber-light",
  teal:   "bg-brand-teal-light",
};

const whyLabelText: Record<PathwayColorScheme, string> = {
  orange: "text-brand-orange",
  blue:   "text-brand-blue",
  amber:  "text-brand-amber",
  teal:   "text-brand-teal",
};

interface PathwayColumnProps {
  column: PathwayColumnData;
}

export default function PathwayColumn({ column }: PathwayColumnProps) {
  const { timeframe, title, colorScheme, items, whyThisForYou } = column;

  return (
    <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-brand-cream-border shadow-sm">
      {/* Coloured top bar */}
      <div className={`h-1 w-full ${topBar[colorScheme]}`} />

      {/* Main content */}
      <div className="flex flex-col flex-1 px-5 pt-5 pb-3 gap-3">
        <span
          className={`text-[10px] font-bold tracking-widest uppercase ${timeframeText[colorScheme]}`}
        >
          {timeframe}
        </span>

        <h3 className="font-serif font-bold text-xl text-gray-900 leading-snug">
          {title}
        </h3>

        <ul className="flex flex-col gap-2.5 flex-1">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug"
            >
              <span
                className={`mt-[5px] w-1.5 h-1.5 shrink-0 rounded-full ${bulletBg[colorScheme]}`}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Why this for you */}
      <div className="px-5 pb-5 pt-2">
        <div className={`rounded-lg p-3 ${whyBg[colorScheme]}`}>
          <p className="text-xs leading-snug">
            <span className={`font-bold ${whyLabelText[colorScheme]}`}>
              Why this for you
            </span>
            {"  "}
            <span className="text-gray-600">{whyThisForYou}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
