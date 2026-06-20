import type { Divergence, PathwayGroup, PathwayItem } from "@/lib/types";
import WhyTag from "@/components/ui/WhyTag";
import { groupMeta } from "./pathwayData";

// DIFFERS / ELEVATED tag — flags a persona-specific change from the baseline
// plan. Always carries a text label (never colour-only); ELEVATED leads with ★.
function DivergenceTag({ divergence }: { divergence: Divergence }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-self bg-self-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-self-ink">
      {divergence === "elevated" && <span aria-hidden="true">★</span>}
      {divergence === "elevated" ? "Elevated" : "Differs"}
    </span>
  );
}

function PathwayItemCard({
  item,
  group,
}: {
  item: PathwayItem;
  group: PathwayGroup;
}) {
  // Single point of contact: a dark emphasis card with a plain descriptive line
  // instead of a WhyTag pill.
  if (item.highlight) {
    return (
      <div className="flex flex-col gap-1.5 rounded-[14px] bg-ink px-4 py-4 text-surface">
        <h4 className="font-serif text-base font-semibold leading-snug">{item.title}</h4>
        <p className="text-sm leading-snug text-surface/70">{item.whyTag}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-[14px] bg-surface px-4 py-3.5 ${
        item.divergence ? "border-2 border-self" : "border border-hairline"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[15px] font-semibold leading-snug text-ink">{item.title}</h4>
        {item.divergence && <DivergenceTag divergence={item.divergence} />}
      </div>
      <div>
        <WhyTag group={group}>{item.whyTag}</WhyTag>
      </div>
    </div>
  );
}

export default function PathwayColumn({
  group,
  items,
}: {
  group: PathwayGroup;
  items: PathwayItem[];
}) {
  const { label, dot } = groupMeta[group];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${dot}`} aria-hidden="true" />
        <h3 className="text-sm font-bold tracking-wide text-ink">{label}</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <PathwayItemCard key={item.id} item={item} group={group} />
        ))}
      </div>
    </div>
  );
}
