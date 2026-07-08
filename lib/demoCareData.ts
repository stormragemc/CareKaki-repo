// ─────────────────────────────────────────────────────────────────────────────
// SYNTHETIC DEMO DATA — no real patient information.
// Single source for every seeded number in the UI: the home "Today" strip, the
// printable Care Plan (schedule, activity details, charts) and the Care Brief
// timeline. Swap these fixtures for live backend data without touching the UI.
// ─────────────────────────────────────────────────────────────────────────────

export interface TodayItem {
  time: string;
  title: string;
  done?: boolean;
}

export const todayPlan: TodayItem[] = [
  { time: "9:00 AM", title: "Morning walk", done: true },
  { time: "3:00 PM", title: "Chair stand practice" },
  { time: "5:00 PM", title: "Hydration check" },
];

export const todaySummary = {
  headline: "Mostly stable today.",
  detail: "One small change may be worth reviewing — appetite has been lower than usual this week.",
};

// ── Week at a glance ─────────────────────────────────────────────────────────

export interface ScheduleDay {
  day: string;
  items: string[];
}

export const weeklySchedule: ScheduleDay[] = [
  { day: "Mon", items: ["Morning walk", "Chair stands", "Hydration check"] },
  { day: "Tue", items: ["Balance practice", "Protein breakfast", "Call from Wei Ling"] },
  { day: "Wed", items: ["Morning walk", "Chair stands", "Medication check"] },
  { day: "Thu", items: ["Community centre visit", "Hydration check"] },
  { day: "Fri", items: ["Morning walk", "Chair stands", "Weight check"] },
  { day: "Sat", items: ["Family lunch", "Gentle stretching"] },
  { day: "Sun", items: ["Rest day", "Prep pill box for the week"] },
];

// ── Chart fixtures ───────────────────────────────────────────────────────────

/** Weekly plan adherence — “is adherence improving?” */
export const adherenceByWeek = [
  { label: "W1", pct: 58 },
  { label: "W2", pct: 66 },
  { label: "W3", pct: 71 },
  { label: "W4", pct: 68 },
  { label: "W5", pct: 79 },
  { label: "W6", pct: 84 },
];

/** Per-activity completion this month — “which activities are missed?” */
export const activityCompletion = [
  { activity: "Morning walk", done: 22, planned: 26 },
  { activity: "Chair stands", done: 9, planned: 12 },
  { activity: "Hydration checks", done: 24, planned: 26 },
  { activity: "Balance practice", done: 5, planned: 8 },
  { activity: "Social activity", done: 3, planned: 4 },
];

/** Mobility confidence self-report (0–10), last 14 days — note the recent dip. */
export const mobilityConfidence = [
  7.5, 7.5, 8, 7.5, 7, 7.5, 8, 7.5, 7, 6.5, 6.5, 6, 5.5, 6,
];

/** Where attention is needed most right now (0–100). */
export const careDomains = [
  { domain: "Mobility", attention: 72, tone: "drawer-orange" },
  { domain: "Nutrition", attention: 64, tone: "drawer-yellow" },
  { domain: "Medication", attention: 35, tone: "drawer-blue" },
  { domain: "Social", attention: 28, tone: "drawer-green" },
];

// ── Care Plan document copy ──────────────────────────────────────────────────

export const carePlanSummary = {
  paragraphs: [
    "This care plan focuses on maintaining lower-body strength, supporting regular nutrition, and monitoring recent changes in standing stability. Activities are designed to fit into the normal daily routine and can be supported by family members without specialised equipment.",
    "The plan balances three kinds of work: everyday activities that protect strength and independence, applications that unlock financial and community support, and a single point of contact so no one has to coordinate alone.",
  ],
  priorities: [
    "Keep lower-body strength through short, regular practice",
    "Support consistent meals and hydration",
    "Watch the recent change in standing stability",
  ],
  strengths: [
    "Walks independently at home",
    "Family checks in daily",
    "Takes medication reliably with a pill box",
  ],
  monitor: [
    "Standing stability (new support needed twice this week)",
    "Breakfast appetite (reduced on 3 recent mornings)",
  ],
  weeklyGoals: [
    "Complete chair stands 3 times",
    "Finish at least 6 of 7 hydration checks",
    "One social activity outside the home",
  ],
  caregiverInvolvement:
    "A family member supports the balance and chair-stand sessions, joins the weekly review, and tells AiMao about anything unusual — a 20-second note is enough.",
};

// ── Detailed activity instructions ───────────────────────────────────────────

export interface ActivityDetail {
  purpose: string;
  duration: string;
  frequency: string;
  difficulty: string;
  equipment: string;
  steps: string[];
  caregiverRole: string;
  stopIf: string[];
  why: string;
}

export const activityDetails: Record<string, ActivityDetail> = {
  "home-safety": {
    purpose:
      "Removes the most common causes of falls at home — loose mats, dim corridors, trailing wires — before they cause an injury.",
    duration: "30–45 minutes, once",
    frequency: "Once now, re-check every 3 months",
    difficulty: "Easy",
    equipment: "None — a phone torch helps",
    steps: [
      "Walk the usual daily route: bed → toilet → kitchen → sofa → door.",
      "Remove or tape down loose rugs and wires along that route.",
      "Check every corridor and the toilet have working, bright lights.",
      "Add a night light between the bedroom and the toilet.",
      "Clear walkways of clutter, stools, and low furniture edges.",
      "Note where grab bars would help (toilet, shower, bed side).",
    ],
    caregiverRole:
      "Do the walk-through together — the person living there knows their route best; you spot the hazards they've stopped noticing.",
    stopIf: [],
    why: "There was a recent fall and the home has not been reviewed since. Most repeat falls happen on the same route as the first one.",
  },
  "walker-fit": {
    purpose:
      "A properly fitted walker and grab bars turn unsteady moments — standing from bed, stepping out of the shower — into safe ones.",
    duration: "1 fitting session (about 1 hour)",
    frequency: "Once, then adjust as needed",
    difficulty: "Easy",
    equipment: "Walker (loan or purchase), grab bars installed by HDB EASE or a contractor",
    steps: [
      "Stand upright in normal shoes; the walker's handles should sit at wrist height with arms relaxed.",
      "Practise the pattern: walker forward → weaker leg → stronger leg.",
      "Install grab bars beside the toilet and inside the shower.",
      "Practise sitting and standing using the bars, not the towel rail.",
      "Check rubber tips on the walker monthly and replace when worn.",
    ],
    caregiverRole:
      "Walk slightly behind and to the side during the first practice sessions. Let the equipment take the weight — don't offer an arm unless asked.",
    stopIf: ["New pain when walking", "The walker feels unstable or rocks"],
    why: "Unsteadiness was reported after the recent fall — the right equipment restores confident, independent movement.",
  },
  "caregiver-basics": {
    purpose:
      "Gives the family caregiver the practical skills — safe transfers, medication routines, what to watch for — that make caring sustainable.",
    duration: "1 half-day course",
    frequency: "Once, refresher yearly",
    difficulty: "Easy",
    equipment: "None — courses provided by AIC's Caregivers Training Grant",
    steps: [
      "Apply for the Caregivers Training Grant (up to $200/year).",
      "Book a 'Caring for the Elderly' basics course near home.",
      "Learn safe transfer technique: brace, count together, move slowly.",
      "Set up a shared medication and appointment calendar.",
      "Save the after-hours helplines somewhere visible.",
    ],
    caregiverRole: "This one is for you — the person doing the caring.",
    stopIf: [],
    why: "The daughter is the primary carer and hasn't had formal training. Trained caregivers burn out less and spot problems earlier.",
  },
  "home-nursing": {
    purpose:
      "A community nurse visits at home for wound care, vitals, and medication checks — recovery continues without tiring clinic trips.",
    duration: "45–60 minutes per visit",
    frequency: "Weekly at first, stepping down as recovery progresses",
    difficulty: "Easy — the nurse does the work",
    equipment: "None",
    steps: [
      "AiMao drafts the referral to a home-nursing provider.",
      "Confirm the visit day and keep the medication list on the table.",
      "During visits: vitals, wounds, and any new symptoms are checked.",
      "Ask the nurse anything — write questions down between visits.",
      "The nurse's notes flow into the Care Brief for the care team.",
    ],
    caregiverRole:
      "Be present for the first visit if possible; afterwards the nurse and AiMao keep you in the loop.",
    stopIf: [],
    why: "Post-discharge recovery needs professional eyes on it regularly, and travel to appointments is currently hard.",
  },
  "physio-sach": {
    purpose:
      "Structured physiotherapy rebuilds the strength and balance lost after the fall — the single most effective way to prevent the next one.",
    duration: "45 minutes per session",
    frequency: "2 sessions per week, 6–8 weeks",
    difficulty: "Moderate — designed to be challenging but safe",
    equipment: "Comfortable shoes; the community hospital provides the rest",
    steps: [
      "Attend the initial assessment at the SACH community hospital.",
      "Follow the prescribed programme — usually leg strengthening, balance drills, and walking practice.",
      "Do the short home-exercise version on non-session days.",
      "Report any dizziness or pain to the physiotherapist immediately.",
      "At week 4, the programme is reviewed and progressed.",
    ],
    caregiverRole:
      "Help with transport on session days and encourage the home exercises — consistency matters more than intensity.",
    stopIf: ["Chest discomfort during exercise", "Dizziness that doesn't pass with rest", "Sharp joint pain"],
    why: "Mobility hasn't fully returned since the fall. Supervised rehab is the evidence-backed route back to independent walking.",
  },
  "med-review": {
    purpose:
      "A pharmacist checks all current medications together — new discharge medicines plus old ones — for interactions, duplicates, and fall-risk side effects.",
    duration: "30 minutes",
    frequency: "Once now, then after any hospital visit",
    difficulty: "Easy",
    equipment: "Bring every medication box, including supplements",
    steps: [
      "Gather every current medicine, supplement, and traditional remedy into one bag.",
      "Book a medication review at the usual polyclinic or pharmacy.",
      "Ask specifically: 'Could any of these make falls more likely?'",
      "Update the pill box and the medication list with any changes.",
      "Share the updated list with AiMao so the Care Brief stays current.",
    ],
    caregiverRole:
      "Help gather the medicines and sit in on the review — two sets of ears help when instructions change.",
    stopIf: [],
    why: "New medications were added at discharge. Several common medicines increase drowsiness and fall risk when combined.",
  },
  hcg: {
    purpose:
      "The Home Caregiving Grant provides $250–$400 a month towards caregiving costs for those with permanent moderate disability.",
    duration: "About 30 minutes to apply",
    frequency: "Once — reviewed periodically by AIC",
    difficulty: "Easy",
    equipment: "SingPass, household income information",
    steps: [
      "Check eligibility: needs help with 3 or more daily activities.",
      "A functional assessment report may be needed — the polyclinic can arrange it.",
      "Apply on the AIC website with SingPass.",
      "Submit household income details for the means test.",
      "The grant is paid monthly once approved.",
    ],
    caregiverRole: "The application is usually done by the family caregiver.",
    stopIf: [],
    why: "The household's per-capita income is within the eligible tier — this is money already set aside for families in this situation.",
  },
  medifund: {
    purpose:
      "MediFund is a safety net that helps with remaining healthcare bills when subsidies, MediShield and MediSave aren't enough.",
    duration: "Ask at the hospital/clinic business office",
    frequency: "Per bill, as needed",
    difficulty: "Easy — a medical social worker assists",
    equipment: "Recent bills, income documents",
    steps: [
      "Ask the medical social worker at the treating hospital about MediFund.",
      "Bring recent bills and household income documents.",
      "The social worker submits the application on your behalf.",
      "Approved amounts are offset directly against the bill.",
    ],
    caregiverRole: "Accompany for the appointment with the medical social worker.",
    stopIf: [],
    why: "Rehabilitation adds costs over several months — this keeps recovery from becoming a financial burden.",
  },
  chas: {
    purpose:
      "The CHAS card subsidises GP and dental visits at neighbourhood clinics — routine follow-ups become affordable close to home.",
    duration: "10 minutes online",
    frequency: "Once — renews automatically",
    difficulty: "Easy",
    equipment: "SingPass",
    steps: [
      "Apply or check tier at chas.sg with SingPass.",
      "Once approved, pick a CHAS GP near home for follow-ups.",
      "Show the card at every visit for the subsidised rate.",
    ],
    caregiverRole: "Help with the online application if needed.",
    stopIf: [],
    why: "Outpatient follow-ups are frequent right now — the same visits cost significantly less with the card.",
  },
  iccp: {
    purpose:
      "One named care coordinator who pulls everything together — appointments, services, applications — so the family never has to chase five agencies.",
    duration: "Ongoing relationship",
    frequency: "Monthly check-in, more when things change",
    difficulty: "Easy",
    equipment: "None",
    steps: [
      "AiMao prepares the Care Brief and hands the case to the ICCP coordinator.",
      "The coordinator reviews and confirms the plan with the family.",
      "One phone number from then on — the coordinator chases the rest.",
      "The monthly check-in updates the plan as needs change.",
    ],
    caregiverRole: "Save the coordinator's number and raise anything that feels off — no issue is too small.",
    stopIf: [],
    why: "Care involves many moving parts. A single point of contact is the difference between a plan and a pile of brochures.",
  },
  "family-loop": {
    purpose:
      "A simple monthly rhythm that keeps every family member informed and shares the caring load.",
    duration: "20 minutes a month",
    frequency: "Monthly, plus updates when something changes",
    difficulty: "Easy",
    equipment: "The family group chat",
    steps: [
      "Fix a recurring monthly family check-in — a call or over lunch.",
      "Review the Care Brief together: what changed, what's next.",
      "Rotate who joins the physio or nurse visits.",
      "Agree who responds first if AiMao raises an alert.",
    ],
    caregiverRole: "You host it — but the point is that you're not the only one carrying the plan.",
    stopIf: [],
    why: "Family is present and willing — a light structure turns goodwill into real shared care.",
  },
  "alert-device": {
    purpose:
      "A wearable alert button that reaches family or a 24/7 response centre immediately after a fall — critical when living alone.",
    duration: "1 hour to set up",
    frequency: "Worn daily",
    difficulty: "Easy",
    equipment: "Personal alert button (pendant or wristband)",
    steps: [
      "Choose a device — pendant or wristband, whichever will actually be worn.",
      "Set the emergency contacts in order: family first, then the response centre.",
      "Test it together once a month.",
      "Wear it in the shower — most falls at home happen in the bathroom.",
    ],
    caregiverRole: "Do the monthly test call together so pressing it never feels scary.",
    stopIf: [],
    why: "Living alone after a fall means help must be one press away, not one phone call away.",
  },
  "silver-support": {
    purpose:
      "Silver Support pays a quarterly cash supplement to seniors who had low incomes through life — no application needed if eligible.",
    duration: "Automatic",
    frequency: "Quarterly payout",
    difficulty: "Easy",
    equipment: "None",
    steps: [
      "Eligibility is assessed automatically from CPF and housing records.",
      "Check status on the Silver Support website with SingPass.",
      "Payouts arrive quarterly into the registered bank account.",
    ],
    caregiverRole: "Just verify the payout is arriving.",
    stopIf: [],
    why: "The pension tier from MyInfo suggests eligibility — this is income that may already be owed.",
  },
  aac: {
    purpose:
      "The Active Ageing Centre nearby runs daily activities, exercise groups, and befriending — company and purpose, minutes from home.",
    duration: "Drop in any weekday",
    frequency: "Aim for 2 visits a week to start",
    difficulty: "Easy",
    equipment: "None",
    steps: [
      "Visit the nearest AAC once — no sign-up needed for a look.",
      "Pick one regular activity that appeals (exercise, crafts, kopi sessions).",
      "Ask about the befriending programme for a weekly visitor.",
    ],
    caregiverRole: "A first visit together lowers the barrier; after that it becomes routine.",
    stopIf: [],
    why: "Living alone with family overseas — loneliness is a health risk, and this is its treatment.",
  },
  "med-flag": {
    purpose:
      "Flags the current medication list for a clinician-led review — AiMao does not assess cardiac medication itself.",
    duration: "Handled by the clinic",
    frequency: "Urgent — this week",
    difficulty: "Easy",
    equipment: "Current medication list",
    steps: [
      "AiMao sends the medication list and recent events to the clinic, flagged for review.",
      "The clinic schedules a clinician-led medication review.",
      "Until then: no changes to any medication without the doctor.",
    ],
    caregiverRole: "Make sure the appointment happens this week.",
    stopIf: [],
    why: "Multiple cardiac medications after a blackout is strictly clinician territory. The safe action is a fast handover, not an AI opinion.",
  },
  "falls-review": {
    purpose:
      "A structured falls and mobility assessment finds the cause behind repeated unsteadiness — footwear, vision, blood pressure, or strength.",
    duration: "1 clinic session",
    frequency: "Once, then as advised",
    difficulty: "Easy",
    equipment: "Bring current walking stick and usual footwear",
    steps: [
      "Book the falls clinic assessment (the coordinator arranges the referral).",
      "The assessment covers balance, gait, blood pressure on standing, vision, and footwear.",
      "Follow the resulting plan — often simple fixes with large effect.",
    ],
    caregiverRole: "Accompany to the assessment and help recall the history of falls.",
    stopIf: [],
    why: "A history of falls plus unsteadiness on a stick means the cause needs finding, not just the symptom managing.",
  },
  escalate: {
    purpose:
      "A recent blackout with heart failure and anticoagulants needs a human clinician and a coordinator on the case immediately.",
    duration: "Same week",
    frequency: "Urgent, once",
    difficulty: "Handled by professionals",
    equipment: "None",
    steps: [
      "AiMao packages the situation into a Care Brief and escalates to the coordinator.",
      "The coordinator confirms a clinician review within days, not weeks.",
      "The family is looped in on the outcome and next steps.",
    ],
    caregiverRole: "The nephew is kept updated at every step.",
    stopIf: [],
    why: "This situation is above what any app should manage. The responsible action is a fast, complete handover to humans.",
  },
  "nephew-loop": {
    purpose: "Keeps the one available family member — the nephew who visits weekly — informed without adding to his load.",
    duration: "Minutes a week",
    frequency: "Weekly summary + alerts",
    difficulty: "Easy",
    equipment: "Phone",
    steps: [
      "The nephew receives the weekly Care Brief summary.",
      "Urgent alerts reach him first, with one-tap responses.",
      "His observations from visits go straight back to AiMao.",
    ],
    caregiverRole: "This is the nephew's channel — light by design.",
    stopIf: [],
    why: "With no primary caregiver, the weekly visitor is the safety net — he needs signal, not noise.",
  },
};

const FALLBACK_DETAIL: ActivityDetail = {
  purpose: "Part of the current care plan — ask AiMao for a full explanation of this step.",
  duration: "Varies",
  frequency: "As planned",
  difficulty: "Easy",
  equipment: "None",
  steps: ["Ask AiMao to walk you through this activity step by step."],
  caregiverRole: "Ask AiMao how best to support this one.",
  stopIf: [],
  why: "Added to the plan from your conversation with AiMao.",
};

export function getActivityDetail(id: string): ActivityDetail {
  return activityDetails[id] ?? FALLBACK_DETAIL;
}

// ── Care Brief fixtures ──────────────────────────────────────────────────────

export const briefRecentChanges = [
  "Reduced breakfast intake on 3 recent mornings",
  "Activity below the personal baseline for 4 days",
  "Needed support when standing, twice this week",
];

export const briefTimeline = [
  { day: "Mon", note: "Reduced dinner intake" },
  { day: "Tue", note: "Activity below usual range" },
  { day: "Wed", note: "Reduced breakfast intake" },
  { day: "Thu", note: "Needed support when standing" },
];

export const briefWhyFlagged = [
  "The appetite change repeated across several days",
  "A new mobility change appeared in the same window",
  "The pattern differs from the personal baseline",
];

export const briefDiscussPoints = [
  "When the standing difficulty began",
  "Any pain or dizziness",
  "Recent appetite and hydration",
  "Any recent medication changes",
];

export const briefTraceability = {
  observations: 5,
  daysOfHistory: 4,
};
