"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

const DEMO_LOCATION = {
  address: "5 Changi Business Park Central 1, Changi City Point",
  lat: 1.3358,
  lng: 103.9626,
};

function OnboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "self" ? "self" : "caregiver";

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

    router.push(`/chat?mode=${mode === "self" ? "self" : "caregiver"}`);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-brand-cream-border">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
          <Logo size={28} />
          <span className="font-serif font-bold text-gray-900 text-lg tracking-tight">CareKaki</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        {step === "form" && (
          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center">
              <p className="text-xs font-bold tracking-widest uppercase text-brand-teal mb-2">
                {mode === "self" ? "Senior Setup" : "Caregiver Setup"}
              </p>
              <h1 className="font-serif font-bold text-3xl text-gray-900 mb-2">
                {mode === "self" ? "Let's get to know you" : "Who are you caring for?"}
              </h1>
              <p className="text-sm text-gray-500">
                CareKaki will use this to personalise your care plan.
              </p>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">
                {mode === "self" ? "Your name" : "Senior's name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === "self" ? "e.g. Mdm Tan" : "e.g. My mother, Mdm Tan"}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-teal/50"
              />
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 78"
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-teal/50"
              />
            </div>

            {/* Role indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Role</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                mode === "self"
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "bg-brand-teal/10 text-brand-teal"
              }`}>
                {mode === "self" ? "Senior" : "Caregiver"}
              </span>
            </div>

            <button
              onClick={handleFormSubmit}
              disabled={!name.trim() || !age.trim()}
              className="px-6 py-3 rounded-xl bg-brand-teal text-white font-semibold text-sm hover:bg-brand-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Location permission - mobile-style bottom sheet */}
        {step === "location" && (
          <>
            {/* Dimmed backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40" />

            {/* Bottom sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
              <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-w-lg mx-auto shadow-2xl">
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />

                {!locationGranted ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-2xl">
                        📍
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Allow location access?</p>
                        <p className="text-xs text-gray-500">CareKaki uses your location to find nearby services</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      This helps us recommend eldercare centres, clinics, and home nursing providers near you.
                      Your location is not stored or shared.
                    </p>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleGrantLocation}
                        className="w-full px-6 py-3 rounded-xl bg-brand-teal text-white font-semibold text-sm hover:bg-brand-teal/90 transition-colors"
                      >
                        Allow while using app
                      </button>
                      <button
                        onClick={finishOnboard}
                        className="w-full px-6 py-3 rounded-xl text-gray-500 text-sm hover:text-gray-700 transition-colors"
                      >
                        Don't allow
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">
                      ✓
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Location set</p>
                    <p className="text-xs text-gray-500">{DEMO_LOCATION.address}</p>
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
