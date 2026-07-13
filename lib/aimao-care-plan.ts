// Care Plan document content. Isolated demo fixtures — the interactive kanban
// board + AI editor live at /pathway; this is the comprehensive, printable,
// senior-friendly document a family (and a coordinator) can hold in their hands.

export type CareDomain = "Mobility" | "Nutrition" | "Social" | "Monitoring";

export interface CarePlanActivity {
  id: string;
  name: string;
  domain: CareDomain;
  accent: "teal" | "orange" | "sky" | "moss";
  purpose: string;
  duration: string;
  frequency: string;
  difficulty: string;
  equipment: string;
  steps: string[];
  caregiverRole: string;
  stopReview: string[];
  why: string;
}

export const CARE_ACTIVITIES: CarePlanActivity[] = [
  {
    id: "chair-stands",
    name: "Chair stand practice",
    domain: "Mobility",
    accent: "teal",
    purpose:
      "Builds lower-body strength and independence when getting up from a chair, bed, or toilet.",
    duration: "5–8 minutes",
    frequency: "3 times per week",
    difficulty: "Easy to moderate",
    equipment: "A stable chair with armrests",
    steps: [
      "Place the chair against a wall so it cannot slide.",
      "Sit near the front of the chair with both feet flat on the floor.",
      "Lean gently forward from the hips.",
      "Push down through both feet and stand up slowly.",
      "Pause and steady yourself for two seconds after standing.",
      "Lower back down slowly and with control — don't drop.",
      "Repeat for the number of times set in this week's plan.",
    ],
    caregiverRole:
      "Stand slightly to the side rather than directly in front. Offer a hand only if needed — do not pull upward by the arms.",
    stopReview: [
      "Dizziness or light-headedness",
      "Chest discomfort or breathlessness",
      "Noticeably more unsteady than usual",
      "New or unexpected pain",
    ],
    why: "Standing up has been harder recently, so gentle practice keeps this everyday movement safe.",
  },
  {
    id: "morning-walk",
    name: "Morning walk",
    domain: "Mobility",
    accent: "moss",
    purpose:
      "Keeps the heart, legs, and mood healthy, and gives a gentle, predictable rhythm to the day.",
    duration: "10–15 minutes",
    frequency: "Most mornings",
    difficulty: "Easy",
    equipment: "Supportive shoes, walker if used",
    steps: [
      "Have a glass of water before setting off.",
      "Choose a flat, familiar route with places to rest.",
      "Walk at a comfortable pace where you can still chat.",
      "Turn back at the halfway point so the return isn't tiring.",
      "Finish with a short sit-down and another sip of water.",
    ],
    caregiverRole:
      "Walk alongside for company where possible, or agree a check-in message for when the walk is done.",
    stopReview: [
      "Unusual shortness of breath",
      "Leg pain that doesn't ease with rest",
      "Feeling faint or very tired",
    ],
    why: "A short daily walk protects mobility and is one of the simplest ways to lift the day.",
  },
  {
    id: "balance-practice",
    name: "Standing balance practice",
    domain: "Mobility",
    accent: "teal",
    purpose:
      "Improves steadiness and lowers the risk of a fall when turning or reaching.",
    duration: "5 minutes",
    frequency: "2–3 times per week",
    difficulty: "Easy",
    equipment: "A kitchen counter or sturdy chair back to hold",
    steps: [
      "Stand behind a sturdy chair and rest both hands on it.",
      "Stand tall with feet hip-width apart.",
      "Slowly shift weight onto one foot for a few seconds.",
      "Return to both feet, then shift to the other side.",
      "Keep breathing steadily throughout.",
    ],
    caregiverRole:
      "Stay within arm's reach and keep the floor clear of rugs or clutter during practice.",
    stopReview: [
      "Any loss of balance without the chair",
      "Dizziness",
      "Reluctance or fear — stop and try again another day",
    ],
    why: "Steadier balance means more confidence moving around the home alone.",
  },
  {
    id: "hydration",
    name: "Hydration check-ins",
    domain: "Nutrition",
    accent: "sky",
    purpose:
      "Prevents dehydration, which can cause tiredness, confusion, and dizziness in older adults.",
    duration: "A moment, a few times a day",
    frequency: "Morning, midday, and late afternoon",
    difficulty: "Easy",
    equipment: "A favourite cup kept within reach",
    steps: [
      "Keep a filled cup where it can be seen easily.",
      "Have a few sips at each reminder — small and often is best.",
      "Warm drinks and soups count too.",
      "Notice the colour of urine — pale is a good sign.",
    ],
    caregiverRole:
      "A friendly reminder message at set times works well; avoid nagging — gentle is enough.",
    stopReview: [
      "Very dark urine or going much less than usual",
      "Confusion or new drowsiness",
      "Dry mouth with dizziness",
    ],
    why: "Appetite and intake have dipped recently, so staying topped up matters more than usual.",
  },
  {
    id: "protein-breakfast",
    name: "A steady breakfast",
    domain: "Nutrition",
    accent: "orange",
    purpose:
      "A protein-rich start supports muscle strength and steady energy through the morning.",
    duration: "As long as is comfortable",
    frequency: "Every day",
    difficulty: "Easy",
    equipment: "None",
    steps: [
      "Offer a small protein with breakfast — egg, yoghurt, tofu, or beans.",
      "Keep portions small and inviting rather than large.",
      "Sit together where possible — company helps appetite.",
      "Follow with a piece of soft fruit if wanted.",
    ],
    caregiverRole:
      "Notice how much is eaten without commenting on it directly; jot a quick note if a meal is skipped.",
    stopReview: [
      "Skipping breakfast several mornings in a row",
      "Noticeable weight change",
      "Difficulty swallowing or coughing while eating",
    ],
    why: "Breakfast has been partly skipped lately, so keeping it small and appealing helps.",
  },
  {
    id: "social-call",
    name: "A daily hello",
    domain: "Social",
    accent: "moss",
    purpose:
      "Regular, warm contact protects mood and is one of the strongest supports for healthy ageing.",
    duration: "10–20 minutes",
    frequency: "Every day",
    difficulty: "Easy",
    equipment: "A phone, or AiMao",
    steps: [
      "Pick a regular time — a predictable call is something to look forward to.",
      "Talk about ordinary things: the walk, the weather, a memory.",
      "AiMao can keep company on the days family can't call.",
      "End with a plan for the next hello.",
    ],
    caregiverRole:
      "Even a short message counts. A shared calendar of who calls when spreads the load across the family.",
    stopReview: [
      "Withdrawing from calls that were usually welcome",
      "Low mood lasting more than a couple of weeks",
      "Talk of feeling like a burden or hopeless — seek support promptly",
    ],
    why: "Family live far away, so a steady daily hello is at the heart of this plan.",
  },
];

// ── Week at a glance ────────────────────────────────────────────────────────
export interface DayPlan {
  day: string;
  items: string[];
}
export const WEEK_PLAN: DayPlan[] = [
  { day: "Mon", items: ["Morning walk", "Chair stands", "Daily hello"] },
  { day: "Tue", items: ["Balance practice", "Steady breakfast", "Hydration"] },
  { day: "Wed", items: ["Morning walk", "Chair stands", "Daily hello"] },
  { day: "Thu", items: ["Balance practice", "Hydration", "Daily hello"] },
  { day: "Fri", items: ["Morning walk", "Chair stands", "Steady breakfast"] },
  { day: "Sat", items: ["Gentle stretch", "Daily hello", "Hydration"] },
  { day: "Sun", items: ["Rest & family call", "Short walk"] },
];

// ── Visualisation data (drives the friendly charts) ─────────────────────────
export const ADHERENCE_WEEK = [
  { label: "Mon", value: 100 },
  { label: "Tue", value: 80 },
  { label: "Wed", value: 100 },
  { label: "Thu", value: 60 },
  { label: "Fri", value: 90 },
  { label: "Sat", value: 70 },
  { label: "Sun", value: 100 },
];

export const MOBILITY_TREND = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
  values: [48, 52, 55, 60, 58, 66],
};

export const MEALS_WEEK = [
  { label: "Mon", value: 100 },
  { label: "Tue", value: 90 },
  { label: "Wed", value: 70 },
  { label: "Thu", value: 60 },
  { label: "Fri", value: 80 },
  { label: "Sat", value: 90 },
  { label: "Sun", value: 100 },
];

export const DOMAIN_OVERVIEW = [
  { label: "Mobility", value: 72 },
  { label: "Nutrition", value: 58 },
  { label: "Social", value: 80 },
  { label: "Monitoring", value: 90 },
];
