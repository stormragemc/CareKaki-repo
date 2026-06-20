"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import type { CareMode, CareProfile, ProfileMeta } from "@/lib/types";
import ProfileFieldCard from "@/components/ui/ProfileFieldCard";

interface LiveCareProfileProps {
  profile: CareProfile;
  profileMeta: ProfileMeta;
  mode: CareMode;
}

const profileRows: { key: keyof CareProfile; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "living", label: "Living situation" },
  { key: "mobility", label: "Mobility" },
  { key: "conditions", label: "Conditions" },
  { key: "caregiver", label: "Caregiver" },
  { key: "financialTier", label: "Financial tier" },
  { key: "recentEvent", label: "Recent event" },
];

function fieldValue(profile: CareProfile, key: keyof CareProfile): string {
  const raw = profile[key];
  if (key === "age") return raw ? String(raw) : "";
  return String(raw ?? "");
}

function FieldList({ profile, profileMeta, mode }: LiveCareProfileProps) {
  return (
    <div className="flex flex-col gap-3">
      {profileRows.map(({ key, label }) => {
        const value = fieldValue(profile, key);
        if (!value) return null;
        const meta = profileMeta[key];
        return (
          <ProfileFieldCard
            key={key}
            label={label}
            value={value}
            source={meta?.source ?? "chat"}
            justUpdated={meta?.justUpdated}
            mode={mode}
          />
        );
      })}
    </div>
  );
}

export default function LiveCareProfile({ profile, profileMeta, mode }: LiveCareProfileProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const filledCount = profileRows.filter(({ key }) => fieldValue(profile, key) !== "").length;
  const total = profileRows.length;

  return (
    <>
      {/* Desktop / tablet: profile docks as the right column. */}
      <div className="hidden h-full flex-col overflow-hidden md:flex">
        <div className="px-1 pb-4">
          <h2 className="font-serif text-lg font-semibold text-ink">Living Care Profile</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Assembling as you talk · {filledCount} of {total} fields
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-1 pb-2">
          <FieldList profile={profile} profileMeta={profileMeta} mode={mode} />
        </div>
      </div>

      {/* Mobile: profile docks as a bottom pull-up sheet — never disappears. */}
      <div className="md:hidden">
        <div
          className={[
            "fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t border-hairline bg-cream shadow-[0_-8px_24px_rgba(44,39,34,0.10)] transition-[max-height] duration-300",
            sheetOpen ? "max-h-[70vh]" : "max-h-16",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            className="flex shrink-0 items-center justify-between px-5 py-3"
          >
            <span className="flex flex-col items-start">
              <span className="mx-auto -mt-1 mb-1.5 h-1 w-9 rounded-full bg-hairline-warm" aria-hidden="true" />
              <span className="font-serif text-base font-semibold text-ink">
                Living Care Profile · {filledCount}/{total}
              </span>
            </span>
            <ChevronUp
              size={20}
              className={`text-ink-soft transition-transform ${sheetOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <FieldList profile={profile} profileMeta={profileMeta} mode={mode} />
          </div>
        </div>
      </div>
    </>
  );
}
