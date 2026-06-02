import type {
  CareProfile,
  Message,
  PathwayColumnData,
  AutopilotService,
} from "./types";

// ── Caregiver demo: Mdm Tan ───────────────────────────────────────────────────
export const mockCareProfile: CareProfile = {
  name: "Mdm Tan",
  age: 78,
  living: "Alone, 3rd-floor flat with lift",
  mobility: "Walker after fall",
  conditions: "Mild hypertension, recent fracture",
  caregiver: "Daughter, full-time + 2 kids",
  financialTier: "Per-capita ≤ $1,500 · full subsidy",
  recentEvent: "Discharged today, SGH",
};

export const mockMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi — tell me about the person you're caring for. What just happened?",
  },
  {
    id: "2",
    role: "user",
    content: "My mum (78) had a fall. Discharged today. She lives alone.",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Okay, that sounds stressful. A few quick things help me get this right — is she steady on her feet now? And is anyone home with her this week?",
  },
  {
    id: "4",
    role: "user",
    content: "She needs a walker. I work full-time, two kids.",
  },
  {
    id: "5",
    role: "assistant",
    content:
      "Got it. I'll start lining things up. One more — any conditions I should plan around?",
  },
];

// ── Pathway plan ─────────────────────────────────────────────────────────────
export const mockPathwayColumns: PathwayColumnData[] = [
  {
    id: "this-week",
    timeframe: "THIS WEEK",
    title: "Get home safely",
    colorScheme: "orange",
    items: [
      "Home safety walk-through",
      "Walker + grab-bar fitting",
      "Caregiver basics: falls",
    ],
    whyThisForYou: "Lives alone post-discharge",
  },
  {
    id: "weeks-2-8",
    timeframe: "WEEKS 2–8",
    title: "Ongoing care",
    colorScheme: "blue",
    items: [
      "Home Nursing Foundation visits",
      "Physio at SACH polyclinic",
      "Medication review",
    ],
    whyThisForYou: "Mobility limited; subsidy eligible",
  },
  {
    id: "apply-now",
    timeframe: "APPLY NOW",
    title: "Financial support",
    colorScheme: "amber",
    items: ["Home Caregiving Grant", "MediFund top-up", "CHAS Blue review"],
    whyThisForYou: "Per-capita income within tier",
  },
  {
    id: "single-point",
    timeframe: "SINGLE POINT",
    title: "One coordinator",
    colorScheme: "teal",
    items: ["ICCP case officer", "Family WhatsApp loop", "Monthly check-in"],
    whyThisForYou: "Complex case + working caregiver",
  },
];

// ── Autopilot services ────────────────────────────────────────────────────────
export const mockAutopilotServices: AutopilotService[] = [
  {
    id: "hcg",
    icon: "$",
    iconColor: "bg-brand-orange",
    name: "Home Caregiving Grant",
    provider: "AIC",
    description: "Filing with discharge summary + NRIC + income docs",
    status: "submitted",
    statusLabel: "Submitted",
    isRunning: true,
  },
  {
    id: "home-nurse",
    icon: "+",
    iconColor: "bg-brand-blue",
    name: "Home nurse visit",
    provider: "HomeNursing.sg",
    description: "Booked Tue 9am · lift access + daughter's contact noted",
    status: "scheduled",
    statusLabel: "Scheduled",
    isRunning: true,
  },
  {
    id: "whatsapp",
    icon: "·",
    iconColor: "bg-brand-teal",
    name: "WhatsApp to Wei Ling",
    provider: "Messaging",
    description: "Plain-language summary + active reassurance thread",
    status: "active",
    statusLabel: "Active",
    isRunning: true,
  },
  {
    id: "coordinator",
    icon: "→",
    iconColor: "bg-brand-amber",
    name: "Coordinator routing",
    provider: "ICCP",
    description: "Least-loaded officer — Aunty Mei · Care Brief preloaded",
    status: "routed",
    statusLabel: "Routed",
    isRunning: true,
  },
  {
    id: "medication",
    icon: "Rx",
    iconColor: "bg-brand-pink",
    name: "Medication review",
    provider: "Polyclinic SACH",
    description: "Appointment requested, fasting flagged",
    status: "pending",
    statusLabel: "Pending",
    isRunning: true,
  },
  {
    id: "guardian",
    icon: "✓",
    iconColor: "bg-brand-blue",
    name: "Guardian checks",
    provider: "Responsible AI",
    description: "No medical advice · PDPA scrubbed · human one click away",
    status: "passing",
    statusLabel: "Passing",
    isRunning: true,
  },
];
