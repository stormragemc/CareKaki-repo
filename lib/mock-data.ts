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
      "Physio/rehab at SACH",
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
// The canonical 5 services (medical + social), all wrapped by Guardian.
// Guardian is the wrapper/shield (see AutopilotDashboard), NOT a service tile.
// Medication review lives in the Pathway (Weeks 2–8), not here.
export const mockAutopilotServices: AutopilotService[] = [
  {
    id: "hcg",
    icon: "$",
    iconColor: "bg-brand-orange",
    name: "Home Caregiving Grant",
    provider: "AIC",
    description: "Filed with NRIC + income from MyInfo — no form filled in",
    status: "submitted",
    statusLabel: "Submitted",
    isRunning: true,
  },
  {
    id: "home-nurse",
    icon: "+",
    iconColor: "bg-brand-blue",
    name: "Home nurse visit",
    provider: "Home Nursing Foundation",
    description: "Booked Tue 9am · Google Calendar invite sent · lift access noted",
    status: "scheduled",
    statusLabel: "Scheduled",
    isRunning: true,
  },
  {
    id: "aac",
    icon: "♥",
    iconColor: "bg-brand-teal",
    name: "Active Ageing Centre",
    provider: "AAC",
    description: "Enrolled at nearby centre — companionship + day activities",
    status: "active",
    statusLabel: "Enrolled",
    isRunning: true,
  },
  {
    id: "coordinator",
    icon: "→",
    iconColor: "bg-brand-amber",
    name: "Care Corner / ICCP handover",
    provider: "Care Corner (ICCP)",
    description: "Least-loaded officer — Aunty Mei · Care Brief preloaded",
    status: "routed",
    statusLabel: "Routed",
    isRunning: true,
  },
  {
    id: "whatsapp",
    icon: "·",
    iconColor: "bg-brand-pink",
    name: "WhatsApp to Wei Ling",
    provider: "WhatsApp",
    description: "Plain-language summary + active reassurance thread",
    status: "active",
    statusLabel: "Sent",
    isRunning: true,
  },
];
