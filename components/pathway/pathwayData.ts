import type { CareMode, PathwayGroup, PathwayItem } from "@/lib/types";

// Single token-driven source for group → colour + label. Replaces the five
// per-scheme `Record` maps the old column carried; WhyTag tints its own pill
// from the same `group`, so the dot square is all that's left here.
export const PATHWAY_GROUPS: PathwayGroup[] = [
  "this-week",
  "weeks-2-8",
  "apply-now",
  "single-point",
];

export const groupMeta: Record<PathwayGroup, { label: string; dot: string }> = {
  "this-week": { label: "This Week", dot: "bg-week" },
  "weeks-2-8": { label: "Weeks 2–8", dot: "bg-weeks" },
  "apply-now": { label: "Apply Now", dot: "bg-apply" },
  "single-point": { label: "Single Point", dot: "bg-single" },
};

// The plan is composed client-side from the active mode: the per-item "why"
// traces and the Mr Lim DIFFERS/ELEVATED divergences can't come from the
// /pathway endpoint's flat shape, so the README copy is the source of truth.
// caregiver ≈ Mdm Tan · self ≈ Mr Lim (the other two personas inherit by mode).
const caregiverPlan: PathwayItem[] = [
  { id: "home-safety", group: "this-week", title: "Home-safety walk-through", whyTag: "Lives alone post-discharge" },
  { id: "walker-fit", group: "this-week", title: "Walker + grab-bar fitting", whyTag: "Unsteady · needs a walker" },
  { id: "caregiver-basics", group: "this-week", title: "Caregiver basics for Wei Ling", whyTag: "Daughter is primary carer" },

  { id: "home-nursing", group: "weeks-2-8", title: "Home nursing visits", whyTag: "Post-discharge recovery" },
  { id: "physio-sach", group: "weeks-2-8", title: "Physio / rehab — SACH community hospital", whyTag: "Restore mobility after the fall" },
  { id: "med-review", group: "weeks-2-8", title: "Medication review", whyTag: "New discharge medications" },

  { id: "hcg", group: "apply-now", title: "Home Caregiving Grant", whyTag: "Per-capita income within tier" },
  { id: "medifund", group: "apply-now", title: "MediFund top-up", whyTag: "Helps with rehab costs" },
  { id: "chas", group: "apply-now", title: "CHAS review", whyTag: "Outpatient follow-ups" },

  { id: "iccp", group: "single-point", title: "ICCP case officer", whyTag: "One person to pull it all together.", highlight: true },
  { id: "family-loop", group: "single-point", title: "Family loop + monthly check-in", whyTag: "Family present locally" },
];

const selfPlan: PathwayItem[] = [
  { id: "home-safety", group: "this-week", title: "Home-safety walk-through", whyTag: "Lives alone post-discharge" },
  { id: "walker-fit", group: "this-week", title: "Walker + grab-bar fitting", whyTag: "Steady footing after the fall" },
  { id: "alert-device", group: "this-week", title: "Personal alert device", whyTag: "No one else in the home" },

  { id: "home-nursing", group: "weeks-2-8", title: "Home nursing visits", whyTag: "Post-discharge recovery" },
  { id: "physio-sach", group: "weeks-2-8", title: "Physio / rehab — SACH community hospital", whyTag: "Restore mobility after the fall" },
  { id: "med-review", group: "weeks-2-8", title: "Medication review", whyTag: "New discharge medications" },

  { id: "silver-support", group: "apply-now", title: "Silver Support Scheme", whyTag: "Pension tier from MyInfo", divergence: "differs" },
  { id: "medifund", group: "apply-now", title: "MediFund top-up", whyTag: "Helps with rehab costs" },
  { id: "chas", group: "apply-now", title: "CHAS review", whyTag: "Outpatient follow-ups" },

  { id: "iccp", group: "single-point", title: "ICCP · weekly check-in", whyTag: "Weekly cadence — no family in the room", highlight: true },
  { id: "aac", group: "single-point", title: "Active Ageing Centre", whyTag: "Loneliness — family overseas", divergence: "elevated" },
];

// Uncle Raj is high-acuity and unsupported (recent blackout, heart failure, on
// anticoagulants, lives alone). The correct posture is to lead with escalation
// to a human and flag — NOT to autonomously plan or assess his medication. So he
// gets a dedicated plan rather than inheriting the standard `selfPlan`.
const escalationPlan: PathwayItem[] = [
  { id: "alert-device", group: "this-week", title: "Personal alert device", whyTag: "Lives alone after a blackout" },
  { id: "home-safety", group: "this-week", title: "Home-safety walk-through", whyTag: "Recent fall · 2nd-floor flat, no lift" },
  { id: "med-flag", group: "this-week", title: "Flag for clinician-led medication review", whyTag: "Multiple cardiac medications — not assessed by CareKaki" },

  { id: "home-nursing", group: "weeks-2-8", title: "Home nursing — once a clinician clears it", whyTag: "Post-A&E monitoring" },
  { id: "falls-review", group: "weeks-2-8", title: "Falls & mobility review", whyTag: "History of falls · unsteady on a stick" },

  { id: "medifund", group: "apply-now", title: "MediFund top-up", whyTag: "Per-capita income within full-subsidy tier" },
  { id: "chas", group: "apply-now", title: "CHAS review", whyTag: "Outpatient cardiac follow-ups" },

  { id: "escalate", group: "single-point", title: "Urgent: clinician review + coordinator escalation", whyTag: "Recent blackout · heart failure · on anticoagulants · lives alone", highlight: true },
  { id: "nephew-loop", group: "single-point", title: "Loop in nephew + coordinator updates", whyTag: "No primary caregiver — nephew visits weekly" },
];

// Personas whose plan diverges from the plain mode default. Keyed by persona id.
const personaPlans: Record<string, PathwayItem[]> = {
  "uncle-raj": escalationPlan,
};

export function getPathwayPlan(mode: CareMode, personaId?: string): PathwayItem[] {
  if (personaId && personaPlans[personaId]) return personaPlans[personaId];
  return mode === "self" ? selfPlan : caregiverPlan;
}

// The real fork is the selected demo persona, not the cosmetic ?mode= label
// (which the role-based login mis-tags for Mdm Tan). Map id → mode directly.
const personaMode: Record<string, CareMode> = {
  "mdm-tan": "caregiver",
  "mrs-wong": "caregiver",
  "mr-lim": "self",
  "uncle-raj": "self",
};

export function modeForPersona(id: string | undefined): CareMode | undefined {
  return id ? personaMode[id] : undefined;
}
