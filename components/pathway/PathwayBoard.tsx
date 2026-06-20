import type { PathwayItem } from "@/lib/types";
import PathwayColumn from "./PathwayColumn";
import { PATHWAY_GROUPS } from "./pathwayData";

export default function PathwayBoard({ items }: { items: PathwayItem[] }) {
  return (
    // 4 equal columns; stacks to 2-up on tablet, single column on mobile.
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PATHWAY_GROUPS.map((group) => (
        <PathwayColumn
          key={group}
          group={group}
          items={items.filter((item) => item.group === group)}
        />
      ))}
    </div>
  );
}
