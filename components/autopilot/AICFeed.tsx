"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DraftNotice } from "./WorkspaceLog";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

interface RecommendedService {
  name: string;
  address: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  distance_km: number | null;
  match_score: number;
  total_score: number;
  next_step: string;
}

interface AICResponse {
  care_need: string;
  keywords_used: string[];
  recommended_services: RecommendedService[];
}

type Phase =
  | { step: "idle" }
  | { step: "classifying"; care_need: string }
  | { step: "searching" }
  | { step: "done"; data: AICResponse };

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
  if (typeof window === "undefined") return "General care assessment";
  return sessionStorage.getItem("autopilotTrigger") || "Elderly person needs care support and nearby services";
}

export default function AICFeed({ enabled = true }: { enabled?: boolean }) {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  useEffect(() => {
    if (!enabled) return; // held behind the approval gate
    const care_need = getCareNeed();
    const { lat, lng } = getUserLocation();

    const run = async () => {
      setPhase({ step: "classifying", care_need });
      await delay(1200);

      setPhase({ step: "searching" });
      try {
        const res = await fetch("http://localhost:8000/integrations/aic/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            care_need,
            latitude: lat,
            longitude: lng,
            limit: 5,
          }),
        });
        const data: AICResponse = await res.json();
        await delay(800);
        setPhase({ step: "done", data });
      } catch {
        setPhase({ step: "idle" });
      }
    };

    run();
  }, [enabled]);

  if (!enabled) return <DraftNotice label="Drafted — eldercare match awaiting approval" />;

  return (
    <div className="flex flex-col gap-2">
      {phase.step !== "idle" && (
        <StepRow
          done={phase.step !== "classifying"}
          text={phase.step === "classifying" ? "Classifying care need…" : "Care need classified"}
        />
      )}

      {(phase.step === "searching" || phase.step === "done") && (
        <StepRow
          done={phase.step === "done"}
          text={phase.step === "searching" ? "Searching eldercare services…" : "Search complete"}
        />
      )}

      {phase.step === "done" && (
        <>
          <div className="flex flex-wrap gap-1 px-2 py-1">
            {phase.data.keywords_used.map((kw) => (
              <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-caregiver/25 text-caregiver-soft">
                {kw}
              </span>
            ))}
          </div>

          <MiniMap
            center={getUserLocation()}
            markers={phase.data.recommended_services.map((svc, i) => ({
              lat: svc.latitude,
              lng: svc.longitude,
              label: svc.name,
              rank: i + 1,
              address: svc.address,
              distance_km: svc.distance_km,
              postal_code: svc.postal_code,
              extra: `Match score: ${svc.match_score} · Total: ${svc.total_score}`,
            }))}
          />

          {phase.data.recommended_services.map((svc, i) => (
            <ServiceCard key={i} rank={i + 1} service={svc} />
          ))}
        </>
      )}
    </div>
  );
}

function StepRow({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-autopilot-band">
      <span
        className={`w-1.5 h-1.5 shrink-0 rounded-full ${
          done ? "bg-status-done-dark" : "bg-status-running-dark animate-pulse"
        }`}
      />
      <span className="text-xs text-autopilot-text">{text}</span>
    </div>
  );
}

function ServiceCard({ rank, service }: { rank: number; service: RecommendedService }) {
  return (
    <div className="rounded-lg border border-autopilot-hairline bg-autopilot-band px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 h-5 rounded-full bg-caregiver/25 text-caregiver-soft text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
          <span className="text-xs font-semibold text-autopilot-text truncate">{service.name}</span>
        </div>
        {service.distance_km != null && (
          <span className="shrink-0 text-[10px] text-autopilot-muted">{service.distance_km} km</span>
        )}
      </div>
      <span className="text-[11px] text-autopilot-muted leading-snug pl-7">{service.address}</span>
      <div className="flex items-center gap-3 pl-7">
        <span className="text-[10px] text-autopilot-muted">Postal {service.postal_code}</span>
        <span className="text-[10px] text-autopilot-muted">Score {service.total_score}</span>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
