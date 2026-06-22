import { BadgeCheck } from "lucide-react";
import type { FieldSource } from "@/lib/types";

// Where a profile field came from: MyInfo-verified (green badge) or from chat.
export default function ProvenanceMarker({ source }: { source: FieldSource }) {
  if (source === "myinfo") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-xs font-semibold text-live">
        <BadgeCheck size={13} aria-hidden="true" />
        MyInfo
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-provenance-chat">from chat</span>
  );
}
