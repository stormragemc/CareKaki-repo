import PathwayColumn from "./PathwayColumn";
import type { PathwayColumnData } from "@/lib/types";

interface PathwayBoardProps {
  columns: PathwayColumnData[];
  patientName?: string;
}

export default function PathwayBoard({ columns, patientName }: PathwayBoardProps) {
  return (
    <section className="flex flex-col gap-6">
      {patientName && (
        <p className="text-sm text-gray-500">
          Generated for{" "}
          <span className="font-semibold text-gray-800">{patientName}</span>
        </p>
      )}

      {/* 4-column grid, stacks to 2-col on tablet, 1-col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <PathwayColumn key={col.id} column={col} />
        ))}
      </div>
    </section>
  );
}
