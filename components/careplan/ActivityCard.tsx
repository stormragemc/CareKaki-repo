"use client";

import { AlertTriangle, HeartHandshake, Lightbulb } from "lucide-react";
import { getLocalizedActivityDetail } from "@/lib/careData";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PathwayItem } from "@/lib/types";

// One activity, care-booklet style: purpose, the numbers, numbered steps, the
// caregiver's role, stop conditions, and why it's personally in the plan.
// `print-break-avoid` keeps each activity's instructions on one printed page.

const FACTS: Array<{ labelKey: string; key: "duration" | "frequency" | "difficulty" | "equipment" }> = [
  { labelKey: "activity.duration", key: "duration" },
  { labelKey: "activity.frequency", key: "frequency" },
  { labelKey: "activity.difficulty", key: "difficulty" },
  { labelKey: "activity.equipment", key: "equipment" },
];

export default function ActivityCard({ item }: { item: PathwayItem }) {
  const { lang, t } = useLanguage();
  const d = getLocalizedActivityDetail(lang, item.id);

  return (
    <article className="print-break-avoid overflow-hidden rounded-3xl border border-hairline bg-surface">
      <header className="border-b border-hairline bg-tint px-6 py-4 sm:px-8">
        <h4 className="font-serif text-xl font-semibold text-ink">{item.title}</h4>
        <p className="mt-1 text-base leading-relaxed text-ink-soft">{d.purpose}</p>
      </header>

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
        {/* The numbers */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {FACTS.map(({ labelKey, key }) => (
            <div key={key}>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">{t(labelKey)}</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-body">{d[key]}</dd>
            </div>
          ))}
        </dl>

        {/* How to do it */}
        <section>
          <h5 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
            {t("activity.howToDoIt")}
          </h5>
          <ol className="flex flex-col gap-2">
            {d.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-ink-body">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aimao-teal-soft text-sm font-bold text-aimao-teal-ink">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Caregiver role */}
        <section className="flex items-start gap-3 rounded-2xl bg-drawer-blue-soft px-4 py-3.5">
          <HeartHandshake size={20} className="mt-0.5 shrink-0 text-aimao-blue" aria-hidden="true" />
          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.12em] text-aimao-blue">
              {t("activity.caregiverRole")}
            </h5>
            <p className="mt-1 text-sm leading-relaxed text-ink-body">{d.caregiverRole}</p>
          </div>
        </section>

        {/* Stop conditions */}
        {d.stopIf.length > 0 && (
          <section className="flex items-start gap-3 rounded-2xl bg-drawer-orange-soft px-4 py-3.5">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-drawer-orange" aria-hidden="true" />
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-body">
                {t("activity.stopReview")}
              </h5>
              <ul className="mt-1 flex flex-col gap-1">
                {d.stopIf.map((s) => (
                  <li key={s} className="text-sm leading-relaxed text-ink-body">• {s}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Why this is in the plan */}
        <section className="flex items-start gap-3 border-t border-hairline pt-4">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-drawer-yellow" aria-hidden="true" />
          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {t("activity.whyIncluded")}
            </h5>
            <p className="mt-1 text-sm leading-relaxed text-ink-body">{d.why}</p>
          </div>
        </section>
      </div>
    </article>
  );
}
