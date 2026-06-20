import { Check } from "lucide-react";
import type { CareMode, ConsentField } from "@/lib/types";

const badge: Record<CareMode, string> = {
  self: "bg-self-soft text-self-ink",
  caregiver: "bg-caregiver-soft text-caregiver-ink",
};

// One MyInfo field being shared at consent: check badge + label + masked value/subcopy.
export default function ConsentRow({
  field,
  mode,
}: {
  field: ConsentField;
  mode: CareMode;
}) {
  return (
    <li className="flex items-start gap-3 border-b border-hairline py-3 last:border-0">
      <span
        className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${badge[mode]}`}
      >
        <Check size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-ink-body">{field.label}</span>
          {field.value && (
            <span className="font-mono text-sm text-ink-soft">{field.value}</span>
          )}
        </div>
        {field.subcopy && (
          <p className="mt-0.5 text-sm text-ink-muted">{field.subcopy}</p>
        )}
      </div>
    </li>
  );
}
