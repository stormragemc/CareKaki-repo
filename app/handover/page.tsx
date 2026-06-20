"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Star } from "lucide-react";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";
import { loadDemoUser, loadCareProfile, deriveMode } from "@/lib/session";
import type { CareMode, CareProfile, PathwayColumnData } from "@/lib/types";

interface CareBrief {
  situation: string;
  cadence: string;
  actions: string[];
  consentsOnFile: string[];
}

interface BriefData {
  name: string;
  age: number;
  mode: CareMode;
  caregiver: string;
  brief: CareBrief;
  pathway: PathwayColumnData[];
}

export default function HandoverPage() {
  const [data, setData] = useState<BriefData | null>(null);
  const [preparedAt, setPreparedAt] = useState("");

  useEffect(() => {
    const user = loadDemoUser();
    const profile: CareProfile | null = user?.profile ?? loadCareProfile();
    const name = user?.name ?? profile?.name ?? "Your loved one";
    const age = profile?.age ?? 0;

    const brief: CareBrief =
      user?.careBrief ?? {
        situation: profile
          ? `${name}, ${age}. ${profile.recentEvent}. ${profile.living}.`
          : "A care plan has been assembled and is ready for a coordinator.",
        cadence: "Monthly callback",
        actions: ["Care plan assembled", "Services drafted under Guardian"],
        consentsOnFile: ["Singpass verified", "MyInfo: NRIC · DOB · address · income · CPF"],
      };

    let pathway: PathwayColumnData[] = [];
    try {
      const raw = sessionStorage.getItem("pathwayColumns");
      if (raw) pathway = JSON.parse(raw) as PathwayColumnData[];
    } catch {}

    // sessionStorage is client-only; reading it after mount keeps SSR/hydration in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData({
      name,
      age,
      mode: deriveMode(user),
      caregiver: profile?.caregiver ?? "Not specified",
      brief,
      pathway,
    });

    const now = new Date();
    setPreparedAt(
      `${now.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} · ${now
        .toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit", hour12: true })
        .toLowerCase()}`
    );
  }, []);

  if (!data) return null;

  const { name, age, mode, caregiver, brief, pathway } = data;
  const eyebrow = mode === "self" ? "text-self-ink" : "text-caregiver-ink";
  const cadenceCard =
    mode === "self"
      ? "bg-self-soft border-self-border text-self-ink"
      : "bg-caregiver-soft border-caregiver-border text-caregiver-ink";

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col motion-safe:animate-ck-fade-in">
      {/* Slim top bar */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={28} />
          <span className="font-serif font-semibold text-ink text-lg tracking-tight">CareKaki</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/autopilot" className="text-sm text-ink-soft hover:text-ink transition-colors">
            ← Autopilot
          </Link>
          <TalkToHuman />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {/* Warm paper document */}
        <article className="bg-surface rounded-[14px] shadow-[0_14px_40px_rgba(44,39,34,0.10)] overflow-hidden">
          {/* Letterhead */}
          <div className="flex flex-wrap items-end justify-between gap-3 px-7 sm:px-10 pt-9 pb-5 border-b-2 border-ink">
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-bold uppercase tracking-[0.14em] ${eyebrow}`}>
                Care Brief · CareKaki
              </span>
              <h1 className="font-serif font-semibold text-3xl text-ink leading-tight">
                {name}{age ? `, ${age}` : ""}
              </h1>
            </div>
            <div className="text-right text-sm text-ink-soft leading-snug">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Prepared for</p>
              <p className="font-medium text-ink-body">Care Corner ICCP coordinator</p>
              <p className="text-ink-muted">{preparedAt}</p>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid gap-8 px-7 sm:px-10 py-8 md:grid-cols-[1.2fr_1fr]">
            {/* Left — narrative + actions */}
            <div className="flex flex-col gap-7">
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Situation</h2>
                <p className="text-ink-body leading-relaxed">{brief.situation}</p>
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Actions already taken
                </h2>
                <ul className="flex flex-col gap-2">
                  {brief.actions.map((action) => {
                    const elevated = action.toLowerCase().includes("prioritised");
                    return (
                      <li key={action} className="flex items-start gap-2.5 text-ink-body">
                        {elevated ? (
                          <Star size={18} className="mt-0.5 shrink-0 fill-self text-self" aria-hidden="true" />
                        ) : (
                          <Check size={18} className="mt-0.5 shrink-0 text-apply-ink" aria-hidden="true" />
                        )}
                        <span>{action}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {pathway.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Recommended pathway — open items
                  </h2>
                  <div className="flex flex-col gap-3">
                    {pathway.map((col) => (
                      <div key={col.id} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          {col.timeframe}
                        </span>
                        <ul className="flex flex-col gap-1">
                          {col.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-ink-body">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-muted" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right — info cards */}
            <div className="flex flex-col gap-4">
              <div className="rounded-[14px] border border-hairline bg-[#F7F3EB] p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Notified family
                </h3>
                <p className="mt-1.5 text-ink-body">{caregiver}</p>
              </div>

              <div className={`rounded-[14px] border p-4 ${cadenceCard}`}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
                  Check-in cadence
                </h3>
                <p className="mt-1.5 font-medium">{brief.cadence}</p>
              </div>

              <div className="rounded-[14px] border border-hairline bg-surface p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Consents on file
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {brief.consentsOnFile.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-ink-body">
                      <Check size={15} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Guardian footer line */}
          <div className="flex items-center gap-2 border-t border-hairline bg-cream px-7 sm:px-10 py-4">
            <ShieldCheck size={18} className="shrink-0 text-live" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-soft">
              Guardian-checked · PDPA scrubbed · no medical advice given
            </span>
          </div>
        </article>
      </main>
    </div>
  );
}
