"use client";

import AiMaoCharacter from "@/components/aimao/AiMaoCharacter";
import ActivityCard from "./ActivityCard";
import { AdherenceChart, MobilitySparkline, CompletionBars, DomainBars } from "./charts";
import { PATHWAY_GROUPS, groupMeta } from "@/components/pathway/pathwayData";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCareData } from "@/lib/careData";
import type { PathwayGroup, PathwayItem } from "@/lib/types";

// The Care Plan as a document, not a dashboard — a beautifully prepared care
// booklet that also prints onto A4 (print rules in globals.css).

interface CarePlanDocumentProps {
  items: PathwayItem[];
  patientName: string;
  preparedWith: string;
}

const SUMMARY_LISTS = [
  { titleKey: "doc.priorities", key: "priorities", tone: "bg-aimao-teal-soft" },
  { titleKey: "doc.strengths", key: "strengths", tone: "bg-drawer-green-soft" },
  { titleKey: "doc.monitor", key: "monitor", tone: "bg-drawer-orange-soft" },
  { titleKey: "doc.weeklyGoals", key: "weeklyGoals", tone: "bg-drawer-yellow-soft" },
] as const;

const GROUP_LABEL_KEY: Record<PathwayGroup, string> = {
  "this-week": "doc.groupThisWeek",
  "weeks-2-8": "doc.groupWeeks28",
  "apply-now": "doc.groupApplyNow",
  "single-point": "doc.groupSinglePoint",
};

const DATE_LOCALE = { en: "en-SG", zh: "zh-CN", ms: "ms-MY" } as const;

export default function CarePlanDocument({ items, patientName, preparedWith }: CarePlanDocumentProps) {
  const { lang, t } = useLanguage();
  const data = getCareData(lang);

  const today = new Date().toLocaleDateString(DATE_LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const charts = [
    { q: t("doc.chartQ1"), a: t("doc.chartA1"), node: <AdherenceChart /> },
    { q: t("doc.chartQ2"), a: t("doc.chartA2"), node: <MobilitySparkline /> },
    { q: t("doc.chartQ3"), a: t("doc.chartA3"), node: <CompletionBars data={data.activityCompletion} /> },
    { q: t("doc.chartQ4"), a: t("doc.chartA4"), node: <DomainBars data={data.careDomains} /> },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Cover / header ── */}
      <header className="print-break-avoid overflow-hidden rounded-3xl border border-hairline bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-6 px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aimao-teal-ink">
              {t("doc.personalisedCarePlan")}
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {patientName || t("home.yourLovedOne")}
            </h2>
            <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-ink-soft">
              <div className="flex gap-1.5">
                <dt className="text-ink-muted">{t("doc.preparedWith")}</dt>
                <dd className="font-medium text-ink-body">{preparedWith}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink-muted">{t("doc.lastUpdated")}</dt>
                <dd className="font-medium text-ink-body">{today}</dd>
              </div>
            </dl>
          </div>
          <AiMaoCharacter expression="happy" size="md" className="shrink-0" />
        </div>
        <div className="flex h-2.5" aria-hidden="true">
          <span className="flex-1 bg-drawer-orange" />
          <span className="flex-1 bg-drawer-yellow" />
          <span className="flex-1 bg-drawer-blue" />
          <span className="flex-1 bg-drawer-green" />
        </div>
      </header>

      {/* ── Summary ── */}
      <section className="print-break-avoid rounded-3xl border border-hairline bg-surface px-7 py-7 sm:px-10">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t("doc.summary")}
        </h3>
        <div className="flex flex-col gap-3">
          {data.carePlanSummary.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-base leading-relaxed text-ink-body">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SUMMARY_LISTS.map(({ titleKey, key, tone }) => (
            <div key={key} className={`rounded-2xl px-5 py-4 ${tone}`}>
              <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-body">{t(titleKey)}</h4>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.carePlanSummary[key].map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-ink-body">
                    • {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-5 border-t border-hairline pt-4 text-sm leading-relaxed text-ink-soft">
          <span className="font-bold text-ink-body">{t("doc.caregiverInvolvement")} </span>
          {data.carePlanSummary.caregiverInvolvement}
        </p>
      </section>

      {/* ── Week at a glance ── */}
      <section className="print-break-avoid rounded-3xl border border-hairline bg-surface px-7 py-7 sm:px-10">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t("doc.weekGlance")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {data.weeklySchedule.map(({ day, items: dayItems }) => (
            <div key={day} className="rounded-2xl border border-hairline bg-cream px-3 py-3">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-aimao-teal-ink">
                {day}
              </p>
              <ul className="flex flex-col gap-1.5">
                {dayItems.map((it) => (
                  <li key={it} className="text-xs leading-snug text-ink-body">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Progress ── */}
      <section className="rounded-3xl border border-hairline bg-surface px-7 py-7 sm:px-10">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t("doc.progress")}
        </h3>
        <p className="mb-5 text-sm text-ink-soft">{t("doc.progressNote")}</p>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {charts.map(({ q, a, node }) => (
            <figure key={q} className="print-break-avoid">
              <figcaption className="mb-2">
                <span className="block text-base font-semibold text-ink">{q}</span>
                <span className="block text-xs text-ink-muted">{a}</span>
              </figcaption>
              {node}
            </figure>
          ))}
        </div>
      </section>

      {/* ── Activities, in plan order ── */}
      {PATHWAY_GROUPS.map((group) => {
        const groupItems = items.filter((it) => it.group === group);
        if (groupItems.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pt-2">
              <span className={`h-3 w-3 rounded-[4px] ${groupMeta[group].dot}`} aria-hidden="true" />
              <h3 className="font-serif text-2xl font-semibold text-ink">{t(GROUP_LABEL_KEY[group])}</h3>
            </div>
            {groupItems.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
