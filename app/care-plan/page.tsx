"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, SlidersHorizontal, Clock, Repeat, Gauge, Package, ArrowLeft } from "lucide-react";
import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";
import AskAiMao from "@/components/aimao/AskAiMao";
import { BarChart, LineChart, RingChart, DomainBars } from "@/components/aimao/MiniChart";
import { loadDemoUser, loadCareProfile } from "@/lib/session";
import {
  CARE_ACTIVITIES,
  WEEK_PLAN,
  ADHERENCE_WEEK,
  MOBILITY_TREND,
  MEALS_WEEK,
  DOMAIN_OVERVIEW,
  type CarePlanActivity,
} from "@/lib/aimao-care-plan";

const accentText: Record<CarePlanActivity["accent"], string> = {
  teal: "text-aimao-teal",
  orange: "text-aimao-orange",
  sky: "text-aimao-sky",
  moss: "text-aimao-moss",
};
const accentDot: Record<CarePlanActivity["accent"], string> = {
  teal: "bg-aimao-teal",
  orange: "bg-aimao-orange",
  sky: "bg-aimao-sky",
  moss: "bg-aimao-moss",
};

export default function CarePlanPage() {
  const [name, setName] = useState("your loved one");
  const [preparedWith, setPreparedWith] = useState("your family");

  useEffect(() => {
    const user = loadDemoUser();
    const profile = user?.profile ?? loadCareProfile();
    const carer = firstWord(profile?.caregiver);
    // Client-only session reads resolved once after mount (SSR-safe).
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(profile?.name ?? "your loved one");
    setPreparedWith(carer && carer !== "You" ? carer : "your family");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const today = new Date().toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-aimao-cream text-aimao-ink">
      {/* Action bar — hidden when printing */}
      <div className="no-print sticky top-0 z-40 border-b border-aimao-hairline bg-aimao-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/home" className="inline-flex items-center gap-2 text-base font-medium text-aimao-ink-soft hover:text-aimao-ink">
            <ArrowLeft size={18} aria-hidden="true" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pathway"
              className="inline-flex items-center gap-2 rounded-full border border-aimao-hairline bg-white px-4 py-2 text-base font-medium text-aimao-ink transition-colors hover:border-aimao-teal hover:text-aimao-teal"
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              Adjust plan
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-aimao-teal px-5 py-2 text-base font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Printer size={17} aria-hidden="true" />
              Print
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8 print:px-0 print:py-0">
        <article className="print-doc overflow-hidden rounded-3xl border border-aimao-hairline bg-white shadow-[0_10px_40px_rgba(43,42,40,0.08)] print:rounded-none print:border-0 print:shadow-none">
          {/* ── Cover ─────────────────────────────────────────────────────── */}
          <header className="flex items-start justify-between gap-4 border-b-2 border-aimao-charcoal px-8 pb-6 pt-10 print:px-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-aimao-teal">
                Personalised Care Plan
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight">{name}</h1>
              <dl className="mt-4 grid grid-cols-1 gap-1 text-base text-aimao-ink-soft sm:grid-cols-2">
                <div>
                  <dt className="inline font-semibold text-aimao-ink">Prepared with: </dt>
                  <dd className="inline">{preparedWith} &amp; AiMao</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-aimao-ink">Last updated: </dt>
                  <dd className="inline">{today}</dd>
                </div>
              </dl>
            </div>
            <AiMaoCharacter expression="happy" size={84} className="shrink-0" />
          </header>

          <div className="flex flex-col gap-10 px-8 py-9 print:px-6">
            {/* ── Summary ─────────────────────────────────────────────────── */}
            <Section title="Care plan summary">
              <div className="flex flex-col gap-4 text-lg leading-relaxed text-aimao-ink-body">
                <p>
                  This plan focuses on keeping {firstName(name)} steady on their feet, eating
                  and drinking regularly, and staying warmly connected each day. The activities
                  are designed to fit into a normal routine and can be supported by family
                  without special equipment.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PriorityCard title="Main priorities">
                    Lower-body strength · steady daily nutrition · a daily social hello · gentle
                    monitoring of recent changes.
                  </PriorityCard>
                  <PriorityCard title="Current strengths">
                    Willing to walk each morning · enjoys company · consistent with reminders when
                    they&apos;re gentle.
                  </PriorityCard>
                  <PriorityCard title="Areas to monitor">
                    Standing stability · breakfast intake · mood on days with no family contact.
                  </PriorityCard>
                  <PriorityCard title="This week's goals">
                    Chair stands 3× · a walk most mornings · breakfast every day · a hello every day.
                  </PriorityCard>
                </div>
              </div>
            </Section>

            {/* ── Week at a glance ────────────────────────────────────────── */}
            <Section title="Week at a glance">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {WEEK_PLAN.map((d) => (
                  <div key={d.day} className="rounded-2xl border border-aimao-hairline bg-aimao-cream p-3">
                    <p className="mb-2 text-center text-base font-bold text-aimao-teal">{d.day}</p>
                    <ul className="flex flex-col gap-1.5">
                      {d.items.map((it) => (
                        <li key={it} className="text-sm leading-snug text-aimao-ink-body">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Visualisations ──────────────────────────────────────────── */}
            <Section title="How things are going">
              <div className="grid gap-6 sm:grid-cols-2">
                <ChartCard title="Activity adherence this week" question="Is the plan being kept up?">
                  <BarChart data={ADHERENCE_WEEK} accent="teal" />
                </ChartCard>
                <ChartCard title="Mobility confidence" question="Is steadiness improving over time?">
                  <LineChart labels={MOBILITY_TREND.labels} values={MOBILITY_TREND.values} accent="moss" />
                </ChartCard>
                <ChartCard title="Meals completed" question="Which days is appetite dipping?">
                  <BarChart data={MEALS_WEEK} accent="orange" />
                </ChartCard>
                <ChartCard title="Where attention is needed" question="Which care area needs the most support?">
                  <div className="flex items-center gap-5">
                    <div className="w-28 shrink-0">
                      <RingChart value={81} accent="green" caption="overall" />
                    </div>
                    <div className="flex-1">
                      <DomainBars data={DOMAIN_OVERVIEW} />
                    </div>
                  </div>
                </ChartCard>
              </div>
            </Section>

            {/* ── Activity detail ─────────────────────────────────────────── */}
            <Section title="The activities, step by step">
              <div className="flex flex-col gap-6">
                {CARE_ACTIVITIES.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
              </div>
            </Section>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <footer className="border-t border-aimao-hairline bg-aimao-cream px-8 py-5 text-center text-sm text-aimao-ink-soft print:px-6">
            Prepared by AiMao with CareKaki · This plan supports care, it does not replace medical
            advice. Please contact a doctor or nurse for clinical guidance.
          </footer>
        </article>
      </main>

      <AskAiMao
        variant="floating"
        prompt="Want me to explain one of these activities?"
        context="Explain a care plan activity step by step"
      />
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 break-inside-avoid">
      <h2 className="font-serif text-2xl font-semibold text-aimao-ink">{title}</h2>
      {children}
    </section>
  );
}

function PriorityCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-aimao-hairline bg-aimao-cream p-4">
      <h3 className="mb-1 text-base font-bold text-aimao-ink">{title}</h3>
      <p className="text-base leading-relaxed text-aimao-ink-body">{children}</p>
    </div>
  );
}

function ChartCard({ title, question, children }: { title: string; question: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-aimao-hairline bg-white p-5">
      <h3 className="text-lg font-semibold text-aimao-ink">{title}</h3>
      <p className="mb-3 text-sm text-aimao-ink-soft">{question}</p>
      {children}
    </div>
  );
}

function ActivityCard({ activity: a }: { activity: CarePlanActivity }) {
  return (
    <article className="break-inside-avoid rounded-3xl border border-aimao-hairline bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accentDot[a.accent]}`} aria-hidden="true" />
        <h3 className="font-serif text-xl font-semibold text-aimao-ink">{a.name}</h3>
        <span className={`ml-auto text-sm font-semibold uppercase tracking-wide ${accentText[a.accent]}`}>
          {a.domain}
        </span>
      </div>

      <p className="mb-4 text-lg leading-relaxed text-aimao-ink-body">{a.purpose}</p>

      {/* Meta row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta icon={<Clock size={16} />} label="Duration" value={a.duration} />
        <Meta icon={<Repeat size={16} />} label="Frequency" value={a.frequency} />
        <Meta icon={<Gauge size={16} />} label="Difficulty" value={a.difficulty} />
        <Meta icon={<Package size={16} />} label="You'll need" value={a.equipment} />
      </div>

      {/* Steps */}
      <h4 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-aimao-ink-soft">How to do it</h4>
      <ol className="mb-5 flex flex-col gap-2">
        {a.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-lg leading-relaxed text-aimao-ink-body">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${accentDot[a.accent]}`}>
              {i + 1}
            </span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-aimao-cream p-4">
          <h4 className="mb-1.5 text-sm font-bold uppercase tracking-[0.12em] text-aimao-ink-soft">
            Caregiver role
          </h4>
          <p className="text-base leading-relaxed text-aimao-ink-body">{a.caregiverRole}</p>
        </div>
        <div className="rounded-2xl border border-aimao-orange/30 bg-aimao-orange-soft p-4">
          <h4 className="mb-1.5 text-sm font-bold uppercase tracking-[0.12em] text-aimao-orange">
            Stop and review if
          </h4>
          <ul className="flex flex-col gap-1">
            {a.stopReview.map((r) => (
              <li key={r} className="text-base leading-snug text-aimao-ink-body">• {r}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-aimao-teal-soft px-4 py-3 text-base leading-relaxed text-aimao-teal-ink">
        <span className="font-semibold">Why this is included: </span>
        {a.why}
      </p>
    </article>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-aimao-hairline p-3">
      <div className="mb-1 flex items-center gap-1.5 text-aimao-ink-faint">
        <span aria-hidden="true">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-medium text-aimao-ink">{value}</p>
    </div>
  );
}

function firstWord(s?: string): string | undefined {
  if (!s) return undefined;
  return s.split(/[\s,]+/)[0] || undefined;
}
function firstName(s: string): string {
  return s.split(/[\s,]+/)[0] || s;
}
