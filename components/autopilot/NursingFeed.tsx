"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

interface Slot {
  date: string;
  time: string;
  type: string;
}

interface Provider {
  name: string;
  address: string;
  postal_code: string;
  phone: string;
  programmes: string[];
  latitude: number;
  longitude: number;
  distance_km: number | null;
  match_score: number;
  total_score: number;
  available_slots: Slot[];
  booking_status: string;
}

interface NursingResponse {
  care_need: string;
  keywords_used: string[];
  recommended_providers: Provider[];
}

type Phase =
  | { step: "idle" }
  | { step: "searching" }
  | { step: "checking_slots" }
  | { step: "done"; data: NursingResponse };

function getUserLocation() {
  if (typeof window === "undefined") return { lat: 1.3521, lng: 103.8198 };
  try {
    const stored = sessionStorage.getItem("userLocation");
    if (stored) {
      const loc = JSON.parse(stored);
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {}
  return { lat: 1.3521, lng: 103.8198 };
}

function getCareNeed() {
  if (typeof window === "undefined") return "Elderly patient needs home nursing care";
  return sessionStorage.getItem("autopilotTrigger") || "Elderly patient needs home nursing care";
}

export default function NursingFeed() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  useEffect(() => {
    const { lat, lng } = getUserLocation();
    const care_need = getCareNeed();

    const run = async () => {
      setPhase({ step: "searching" });
      try {
        const res = await fetch("http://localhost:8000/integrations/nursing/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            care_need,
            latitude: lat,
            longitude: lng,
            limit: 3,
          }),
        });
        const data: NursingResponse = await res.json();
        await delay(1000);
        setPhase({ step: "checking_slots" });
        await delay(1200);
        setPhase({ step: "done", data });
      } catch {
        setPhase({ step: "idle" });
      }
    };
    run();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {phase.step !== "idle" && (
        <StepRow
          done={phase.step !== "searching"}
          text={phase.step === "searching" ? "Searching nearby providers…" : "Providers found"}
        />
      )}

      {(phase.step === "checking_slots" || phase.step === "done") && (
        <StepRow
          done={phase.step === "done"}
          text={phase.step === "checking_slots" ? "Checking availability…" : "Slots confirmed"}
        />
      )}

      {phase.step === "done" && (
        <>
          <MiniMap
            center={getUserLocation()}
            markers={phase.data.recommended_providers.map((prov, i) => ({
              lat: prov.latitude,
              lng: prov.longitude,
              label: prov.name,
              rank: i + 1,
              address: prov.address,
              distance_km: prov.distance_km,
              postal_code: prov.postal_code,
              phone: prov.phone,
              extra: prov.programmes.join(", "),
            }))}
          />

          {phase.data.recommended_providers.map((prov, i) => (
            <ProviderCard key={i} rank={i + 1} provider={prov} />
          ))}
        </>
      )}
    </div>
  );
}

function StepRow({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
      <span
        className={`w-1.5 h-1.5 shrink-0 rounded-full ${
          done ? "bg-green-400" : "bg-brand-orange animate-pulse"
        }`}
      />
      <span className="text-xs text-white/80">{text}</span>
    </div>
  );
}

function ProviderCard({ rank, provider }: { rank: number; provider: Provider }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
          <span className="text-xs font-semibold text-white truncate">{provider.name}</span>
        </div>
        {provider.distance_km != null && (
          <span className="shrink-0 text-[10px] text-white/40">{provider.distance_km} km</span>
        )}
      </div>

      <div className="pl-7 flex flex-col gap-0.5">
        <span className="text-[11px] text-white/50 leading-snug">{provider.address}</span>
        {provider.phone && (
          <span className="text-[10px] text-white/30">Tel: {provider.phone}</span>
        )}
      </div>

      <div className="pl-7 flex flex-wrap gap-1">
        {provider.programmes.map((p) => (
          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
            {p}
          </span>
        ))}
      </div>

      <div className="pl-7 flex flex-col gap-1">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">Available slots</span>
        {provider.available_slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />
            <span className="text-[11px] text-white/70">{slot.date} · {slot.time}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{slot.type}</span>
          </div>
        ))}
      </div>

      <div className="pl-7 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[10px] text-amber-400/80">Tentative booking</span>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
