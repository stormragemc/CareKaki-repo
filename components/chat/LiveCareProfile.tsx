import type { CareProfile } from "@/lib/types";

interface LiveCareProfileProps {
  profile: CareProfile;
  isUpdating?: boolean;
}

const profileRows: { key: keyof CareProfile; label: string }[] = [
  { key: "name",         label: "Name" },
  { key: "age",          label: "Age" },
  { key: "living",       label: "Living" },
  { key: "mobility",     label: "Mobility" },
  { key: "conditions",   label: "Conditions" },
  { key: "caregiver",    label: "Caregiver" },
  { key: "financialTier",label: "Financial tier" },
  { key: "recentEvent",  label: "Recent event" },
];

export default function LiveCareProfile({
  profile,
  isUpdating = false,
}: LiveCareProfileProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-brand-cream-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-orange-light border-b border-brand-cream-border">
        <span className="font-semibold text-sm text-brand-orange">
          Living Care Profile
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={[
              "w-2 h-2 rounded-full",
              isUpdating ? "bg-brand-orange animate-pulse" : "bg-green-400",
            ].join(" ")}
            aria-hidden="true"
          />
          {isUpdating ? "updating" : "up to date"}
        </span>
      </div>

      {/* Rows */}
      {/* INTEGRATION POINT: Replace profile prop with real-time data from your
          backend. Each field can be streamed in as entities are extracted from
          the conversation. Call `updateProfile(patch)` from useChatState. */}
      <div className="flex-1 overflow-y-auto divide-y divide-brand-cream-border">
        {profileRows.map(({ key, label }, i) => (
          <div
            key={key}
            className={[
              "flex px-4 py-3 gap-4 text-sm",
              i % 2 === 0 ? "bg-white" : "bg-brand-cream/40",
            ].join(" ")}
          >
            <span className="w-28 shrink-0 text-gray-500 text-xs pt-0.5">
              {label}
            </span>
            <span className="font-semibold text-gray-900 leading-snug">
              {String(profile[key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
