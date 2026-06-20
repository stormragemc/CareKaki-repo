"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Check } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TalkToHuman from "@/components/ui/TalkToHuman";
import type { CareMode } from "@/lib/types";

const DEMO_LOCATION = {
  address: "5 Changi Business Park Central 1, Changi City Point",
  lat: 1.3358,
  lng: 103.9626,
};

function OnboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode: CareMode = searchParams.get("mode") === "self" ? "self" : "caregiver";

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [step, setStep] = useState<"form" | "location">("form");
  const [locationGranted, setLocationGranted] = useState(false);

  const handleFormSubmit = () => {
    if (!name.trim() || !age.trim()) return;
    setStep("location");
  };

  const handleGrantLocation = () => {
    setLocationGranted(true);
    setTimeout(() => {
      finishOnboard();
    }, 1200);
  };

  const finishOnboard = () => {
    const profile = {
      name: name.trim(),
      age: parseInt(age),
      living: "",
      mobility: "",
      conditions: "",
      caregiver: mode === "caregiver" ? "You" : "",
      financialTier: "",
      recentEvent: "",
    };

    sessionStorage.setItem("careProfile", JSON.stringify(profile));
    sessionStorage.setItem("userLocation", JSON.stringify(DEMO_LOCATION));
    sessionStorage.removeItem("demoUser");
    sessionStorage.removeItem("pathwayColumns");
    sessionStorage.removeItem("pathwayProfile");
    sessionStorage.removeItem("autopilotAdapters");

    router.push(`/consent?mode=${mode}`);
  };

  const accentText = mode === "self" ? "text-self-ink" : "text-caregiver-ink";
  const accentTint = mode === "self" ? "bg-self-soft text-self-ink" : "bg-caregiver-soft text-caregiver-ink";
  const focusBorder = mode === "self" ? "focus:border-self" : "focus:border-caregiver";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-hairline flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
          <Logo size={30} mode={mode} />
          <span className="font-serif font-bold text-ink text-lg tracking-tight">CareKaki</span>
        </Link>
        <TalkToHuman />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        {step === "form" && (
          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center">
              <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${accentText}`}>
                {mode === "self" ? "Senior Setup" : "Caregiver Setup"}
              </p>
              <h1 className="font-serif font-bold text-3xl text-ink mb-2">
                {mode === "self" ? "Let's get to know you" : "Who are you caring for?"}
              </h1>
              <p className="text-base text-ink-soft">
                CareKaki will use this to personalise your care plan.
              </p>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-body">
                {mode === "self" ? "Your name" : "Senior's name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === "self" ? "e.g. Mdm Tan" : "e.g. My mother, Mdm Tan"}
                className={`px-4 py-3 rounded-xl border border-hairline-warm bg-surface text-base text-ink placeholder-ink-faint outline-none transition-colors ${focusBorder}`}
              />
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-body">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 78"
                className={`px-4 py-3 rounded-xl border border-hairline-warm bg-surface text-base text-ink placeholder-ink-faint outline-none transition-colors ${focusBorder}`}
              />
            </div>

            {/* Role indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cream-deep border border-hairline">
              <span className="text-[11px] text-ink-muted uppercase tracking-wider">Role</span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${accentTint}`}>
                {mode === "self" ? "Senior" : "Caregiver"}
              </span>
            </div>

            <PrimaryButton
              mode={mode}
              onClick={handleFormSubmit}
              disabled={!name.trim() || !age.trim()}
            >
              Continue
            </PrimaryButton>
          </div>
        )}

        {/* Location permission - mobile-style bottom sheet */}
        {step === "location" && (
          <>
            {/* Dimmed backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40" />

            {/* Bottom sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
              <div className="bg-surface rounded-t-3xl px-6 pt-6 pb-8 max-w-lg mx-auto shadow-2xl">
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-hairline-warm mx-auto mb-6" />

                {!locationGranted ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentTint}`}>
                        <MapPin size={22} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-ink">Allow location access?</p>
                        <p className="text-sm text-ink-soft">CareKaki uses your location to find nearby services</p>
                      </div>
                    </div>

                    <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                      This helps us recommend eldercare centres, clinics, and home nursing providers near you.
                      Your location is not stored or shared.
                    </p>

                    <div className="flex flex-col gap-2">
                      <PrimaryButton mode={mode} onClick={handleGrantLocation} className="w-full">
                        Allow while using app
                      </PrimaryButton>
                      <button
                        onClick={finishOnboard}
                        className="w-full px-6 py-3 rounded-xl text-ink-soft text-base hover:text-ink transition-colors"
                      >
                        Don&apos;t allow
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-full bg-status-done-bg flex items-center justify-center text-status-done">
                      <Check size={24} aria-hidden="true" />
                    </div>
                    <p className="text-base font-semibold text-ink">Location set</p>
                    <p className="text-sm text-ink-soft">{DEMO_LOCATION.address}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense>
      <OnboardInner />
    </Suspense>
  );
}
