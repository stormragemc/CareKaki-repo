"use client";

import { useEffect, useState } from "react";

interface RecommendedService {
  name: string;
  address: string;
  postal_code: string;
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

export default function AICFeed() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  useEffect(() => {
    const care_need = "Granny fell off the stairs and is weak now";

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
            latitude: 1.3521,
            longitude: 103.8198,
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
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Step 1: classify */}
      {phase.step !== "idle" && (
        <StepRow
          done={phase.step !== "classifying"}
          text={
            phase.step === "classifying"
              ? "Classifying care need…"
              : "Care need classified"
          }
        />
      )}

      {/* Step 2: search */}
      {(phase.step === "searching" || phase.step === "done") && (
        <StepRow
          done={phase.step === "done"}
          text={
            phase.step === "searching"
              ? "Searching eldercare services…"
              : "Search complete"
          }
        />
      )}

      {/* Keywords used */}
      {phase.step === "done" && (
        <div className="flex flex-wrap gap-1 px-2 py-1">
          {phase.data.keywords_used.map((kw) => (
            <span
              key={kw}
              className="text-[10px] px-2 py-0.5 rounded-full bg-brand-teal/20 text-brand-teal"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {phase.step === "done" &&
        phase.data.recommended_services.map((svc, i) => (
          <ServiceCard key={i} rank={i + 1} service={svc} />
        ))}
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

function ServiceCard({
  rank,
  service,
}: {
  rank: number;
  service: RecommendedService;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 h-5 rounded-full bg-brand-teal/20 text-brand-teal text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
          <span className="text-xs font-semibold text-white truncate">
            {service.name}
          </span>
        </div>
        {service.distance_km != null && (
          <span className="shrink-0 text-[10px] text-white/40">
            {service.distance_km} km
          </span>
        )}
      </div>
      <span className="text-[11px] text-white/50 leading-snug pl-7">
        {service.address}
      </span>
      <div className="flex items-center gap-3 pl-7">
        <span className="text-[10px] text-white/30">
          Postal {service.postal_code}
        </span>
        <span className="text-[10px] text-white/30">
          Score {service.total_score}
        </span>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
