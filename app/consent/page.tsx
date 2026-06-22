"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import ModeChip from "@/components/ui/ModeChip";
import ConsentRow from "@/components/ui/ConsentRow";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { CareMode, ConsentField } from "@/lib/types";
import type { DemoUser } from "@/lib/demo-users";

// Onboard path (no demo user) falls back to this minimal, mode-aware default.
function defaultConsent(mode: CareMode): { copy: string; fields: ConsentField[] } {
  return {
    copy:
      mode === "self"
        ? "You are sharing the data below so CareKaki can match schemes and arrange care for you."
        : "The person you care for consents to share the data below so you can act on their behalf for this session.",
    fields: [
      { label: "NRIC", value: "S••••567A" },
      { label: "Date of birth" },
      { label: "Registered address" },
      { label: "Income (from IRAS)", subcopy: "Used to match financial schemes" },
      { label: "CPF contributions" },
    ],
  };
}

function ConsentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The active persona is read from sessionStorage (existing pattern). We don't
  // re-write any keys here, so downstream screens stay unchanged.
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("demoUser");
    let parsed: DemoUser | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as DemoUser;
      } catch {
        parsed = null;
      }
    }
    // sessionStorage is client-only; reading it after mount keeps SSR/hydration in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemoUser(parsed);
  }, []);

  // mode is the cosmetic URL label; fall back to the persona's role, then caregiver.
  const urlMode = searchParams.get("mode");
  const mode: CareMode =
    urlMode === "self" || urlMode === "caregiver"
      ? urlMode
      : demoUser
        ? demoUser.role === "senior"
          ? "self"
          : "caregiver"
        : "caregiver";

  const consent = demoUser?.consent ?? defaultConsent(mode);

  const handleApprove = () => {
    router.push(`/chat?mode=${mode}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[20px] bg-surface shadow-[0_14px_40px_rgba(30,42,51,0.10)]">
        {/* Singpass header band */}
        <div className="flex items-center justify-between bg-singpass px-6 py-4 text-white">
          <span className="text-lg font-bold lowercase tracking-tight">singpass</span>
          <span className="text-xs font-medium text-white/85">
            Government sandbox · test mode
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-7 py-8 sm:px-8">
          <ModeChip mode={mode} />

          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              CareKaki is requesting access
            </h1>
            <p className="text-base leading-relaxed text-ink-body">{consent.copy}</p>
          </div>

          <hr className="border-hairline" />

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
            MyInfo will share — verified by Government
          </p>

          <ul className="flex flex-col">
            {consent.fields.map((field) => (
              <ConsentRow key={field.label} field={field} mode={mode} />
            ))}
          </ul>

          {/* Guardian note */}
          <div className="flex items-start gap-3 rounded-xl bg-tint px-4 py-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-ink-soft">
              Guardian tokenises your NRIC &amp; income on arrival. Data never leaves the
              regional boundary.
            </p>
          </div>

          <div className="mt-1 flex flex-col items-center gap-3">
            <PrimaryButton mode={mode} className="w-full" onClick={handleApprove}>
              Approve &amp; continue
            </PrimaryButton>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentInner />
    </Suspense>
  );
}
