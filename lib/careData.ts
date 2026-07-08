// Language-aware access to the seeded care data. English lives in
// lib/demoCareData.ts (unchanged, still safe to import directly); 中文 and
// Bahasa Melayu bundles mirror its structure. Anything missing in a bundle
// falls back to English so a partial translation can never break the UI.

import {
  todayPlan,
  todaySummary,
  weeklySchedule,
  activityCompletion,
  careDomains,
  carePlanSummary,
  activityDetails,
  getActivityDetail,
  briefRecentChanges,
  briefTimeline,
  briefWhyFlagged,
  briefDiscussPoints,
  type ActivityDetail,
  type TodayItem,
  type ScheduleDay,
} from "./demoCareData";
import { zhCareData } from "./careData.zh";
import { msCareData } from "./careData.ms";
import type { Lang } from "./i18n";

export interface CareDataBundle {
  todayPlan: TodayItem[];
  todaySummary: { headline: string; detail: string };
  weeklySchedule: ScheduleDay[];
  activityCompletion: { activity: string; done: number; planned: number }[];
  careDomains: { domain: string; attention: number; tone: string }[];
  carePlanSummary: {
    paragraphs: string[];
    priorities: string[];
    strengths: string[];
    monitor: string[];
    weeklyGoals: string[];
    caregiverInvolvement: string;
  };
  activityDetails: Record<string, ActivityDetail>;
  fallbackDetail: ActivityDetail;
  briefRecentChanges: string[];
  briefTimeline: { day: string; note: string }[];
  briefWhyFlagged: string[];
  briefDiscussPoints: string[];
}

const enCareData: CareDataBundle = {
  todayPlan,
  todaySummary,
  weeklySchedule,
  activityCompletion,
  careDomains,
  carePlanSummary,
  activityDetails,
  fallbackDetail: getActivityDetail("__fallback__"),
  briefRecentChanges,
  briefTimeline,
  briefWhyFlagged,
  briefDiscussPoints,
};

const BUNDLES: Record<Lang, CareDataBundle> = {
  en: enCareData,
  zh: zhCareData,
  ms: msCareData,
};

export function getCareData(lang: Lang): CareDataBundle {
  return BUNDLES[lang] ?? enCareData;
}

/** Activity detail in the chosen language, falling back to English, then to
 *  the language's generic detail (for items added live by plan edits). */
export function getLocalizedActivityDetail(lang: Lang, id: string): ActivityDetail {
  const bundle = getCareData(lang);
  return bundle.activityDetails[id] ?? enCareData.activityDetails[id] ?? bundle.fallbackDetail;
}
