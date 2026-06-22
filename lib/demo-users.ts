import type { CareProfile, ConsentField, ProfileMeta } from "./types";

export interface DemoUser {
  id: string;
  name: string;
  avatar: string;
  role: "senior" | "caregiver";
  color: string;
  tagline: string;
  scenario: string;
  adapters: string[];
  location: { address: string; lat: number; lng: number };
  profile: CareProfile;
  chatHistory: { role: "assistant" | "user"; content: string }[];
  // ── Design view-model fields (added in Phase 1) ──
  // Which profile fields are MyInfo-verified vs. assembled from chat; seeds the
  // "just updated" pulse for the Conversation hero screen.
  profileMeta?: ProfileMeta;
  // Mode-aware copy + ordered rows for the Consent (Singpass/MyInfo) screen.
  consent?: { copy: string; fields: ConsentField[] };
  // Content for the Care Brief warm-handover finale.
  careBrief?: { situation: string; cadence: string; actions: string[]; consentsOnFile: string[] };
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "mdm-tan",
    name: "Mdm Tan",
    avatar: "👵",
    role: "senior",
    color: "#3B6CA8",
    tagline: "Fall + caregiver coordination",
    scenario: "Senior fell at home, needs AIC eldercare services, ICCP coordinator escalation, and caregiver Telegram alert",
    adapters: ["iccp", "aic", "telegram"],
    location: {
      address: "Blk 208 Ang Mo Kio Ave 1",
      lat: 1.3691,
      lng: 103.8454,
    },
    profile: {
      name: "Mdm Tan",
      age: 78,
      living: "Alone, 3rd-floor flat with lift",
      mobility: "Walker after fall",
      conditions: "Mild hypertension, recent fracture",
      caregiver: "Daughter, full-time + 2 kids",
      financialTier: "Per-capita income ~$1,400/mth · full subsidy",
      recentEvent: "Fell at home, discharged from SGH",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me about the person you're caring for. What just happened?" },
      { role: "user", content: "My mum (78) had a fall. Discharged today. She lives alone." },
      { role: "assistant", content: "Okay, that sounds stressful. I've started assembling a care plan for Mdm Tan. Let me check nearby eldercare services and alert the coordinator." },
    ],
    profileMeta: {
      name: { source: "myinfo" },
      age: { source: "myinfo" },
      living: { source: "chat" },
      mobility: { source: "chat", justUpdated: true },
      conditions: { source: "chat" },
      caregiver: { source: "chat" },
      financialTier: { source: "myinfo" },
      recentEvent: { source: "chat" },
    },
    consent: {
      copy: "Mdm Tan Siew Hua consents to share the data below. Wei Ling (daughter) may then act on her behalf for this session.",
      fields: [
        { label: "NRIC", value: "S••••567A" },
        { label: "Date of birth" },
        { label: "Registered address" },
        { label: "Income (from IRAS)", subcopy: "Used to match financial schemes" },
        { label: "CPF contributions" },
      ],
    },
    careBrief: {
      situation:
        "Mdm Tan, 78, fell at home and was discharged from SGH today. She lives alone in Ang Mo Kio and is unsteady on a walker. Her daughter Wei Ling is the primary caregiver — local, full-time, with two kids.",
      cadence: "Monthly callback · Family present locally",
      actions: [
        "HCG filed (MyInfo income docs)",
        "Home nurse Tue 9am (calendar invite sent)",
        "AAC enrolment started",
        "Family updated via WhatsApp",
      ],
      consentsOnFile: [
        "Singpass verified",
        "MyInfo: NRIC · DOB · address · income · CPF",
        "Delegation: Wei Ling acts for Mdm Tan",
      ],
    },
  },
  {
    id: "mr-lim",
    name: "Mr Lim",
    avatar: "👴",
    role: "senior",
    color: "#3B6CA8",
    tagline: "Lives alone · loneliness after a fall",
    scenario: "Self-managing senior who fell last week; lives alone in Toa Payoh with family overseas — needs Silver Support, home nursing, an Active Ageing Centre, and ICCP coordination",
    adapters: ["aic", "nursing", "iccp", "telegram"],
    location: {
      address: "Blk 79 Toa Payoh Central",
      lat: 1.3343,
      lng: 103.8563,
    },
    profile: {
      name: "Mr Lim",
      age: 72,
      living: "Lives alone · Toa Payoh",
      mobility: "Walks independently but unsteady since the fall",
      conditions: "Recovering from a fall last week",
      caregiver: "Daughter in London · keep informed",
      financialTier: "Pension tier · Silver Support (auto-assessed)",
      recentEvent: "Fell last week · home alone, family overseas",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me what's going on. How can CareKaki help?" },
      { role: "user", content: "I had a fall last week. I'm okay now, but a bit shaken. I live on my own and my daughter is in London." },
      { role: "assistant", content: "I'm glad you're alright. Living alone after a fall can feel unsettling — I'll line up some support nearby and check which schemes you qualify for. Let me start your care plan." },
    ],
    profileMeta: {
      name: { source: "myinfo" },
      age: { source: "myinfo" },
      living: { source: "chat" },
      mobility: { source: "chat" },
      conditions: { source: "chat" },
      caregiver: { source: "chat" },
      financialTier: { source: "myinfo" },
      recentEvent: { source: "chat", justUpdated: true },
    },
    consent: {
      copy: "You, Mr Lim Boon Keng, are sharing the data below so CareKaki can match schemes and arrange care for you.",
      fields: [
        { label: "NRIC", value: "S••••567A" },
        { label: "Date of birth" },
        { label: "Registered address" },
        { label: "Income (from IRAS)", subcopy: "Indicates Silver Support eligibility" },
        { label: "CPF contributions" },
      ],
    },
    careBrief: {
      situation:
        "Mr Lim, 72, fell last week and is now home alone in Toa Payoh. His family is overseas — his daughter is in London — so loneliness is a real risk alongside his recovery.",
      cadence: "Weekly check-in · No family in the room",
      actions: [
        "Silver Support filed",
        "Home nurse Wed 10am (calendar invite sent)",
        "AAC enrolment prioritised — addresses loneliness",
        "Daughter in London updated via WhatsApp",
      ],
      consentsOnFile: [
        "Singpass verified",
        "MyInfo: NRIC · DOB · address · income · CPF",
        "Consented for himself",
      ],
    },
  },
  {
    id: "mrs-wong",
    name: "Mrs Wong",
    avatar: "👩",
    role: "caregiver",
    color: "#D4A843",
    tagline: "Home nursing + post-discharge",
    scenario: "Caregiver needs home nursing after parent's surgery, needs provider booking, nursing slot availability, and AIC support",
    adapters: ["nursing", "aic", "iccp"],
    location: {
      address: "Blk 332 Jurong East Ave 1",
      lat: 1.3480,
      lng: 103.7300,
    },
    profile: {
      name: "Wong Mei Lin",
      age: 74,
      living: "With daughter, 5th-floor flat with lift",
      mobility: "Wheelchair after knee surgery",
      conditions: "Post knee replacement, wound care needed, mild diabetes",
      caregiver: "Daughter (Mrs Wong), works part-time",
      financialTier: "Per-capita income ~$1,750/mth · partial subsidy",
      recentEvent: "Discharged from NUH after knee replacement surgery",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me about the person you're caring for. What just happened?" },
      { role: "user", content: "My mother (74) just had knee surgery. She needs wound care at home and I need help finding a nurse." },
      { role: "assistant", content: "Got it. I'll search for nearby home nursing providers with availability, and check what eldercare support is available in the Jurong area." },
    ],
    profileMeta: {
      name: { source: "myinfo" },
      age: { source: "myinfo" },
      living: { source: "chat" },
      mobility: { source: "chat", justUpdated: true },
      conditions: { source: "chat" },
      caregiver: { source: "chat" },
      financialTier: { source: "myinfo" },
      recentEvent: { source: "chat" },
    },
    consent: {
      copy: "Wong Mei Lin consents to share the data below. Mrs Wong (daughter) may then act on her behalf for this session.",
      fields: [
        { label: "NRIC", value: "S••••567A" },
        { label: "Date of birth" },
        { label: "Registered address" },
        { label: "Income (from IRAS)", subcopy: "Used to match financial schemes" },
        { label: "CPF contributions" },
      ],
    },
    careBrief: {
      situation:
        "Wong Mei Lin, 74, was discharged from NUH after knee replacement and needs wound care at home. She lives with her daughter Mrs Wong, who works part-time.",
      cadence: "Monthly callback · Family present locally",
      actions: [
        "Home nursing visits arranged",
        "AIC eldercare support filed",
        "ICCP coordinator looped in",
        "Family updated via Telegram",
      ],
      consentsOnFile: [
        "Singpass verified",
        "MyInfo: NRIC · DOB · address · income · CPF",
        "Delegation: Mrs Wong acts for Wong Mei Lin",
      ],
    },
  },
  {
    id: "uncle-raj",
    name: "Uncle Raj",
    avatar: "🧓",
    role: "senior",
    color: "#7B68EE",
    tagline: "High-acuity case — escalated to a human",
    scenario: "High-acuity senior: discharged after a fall with a brief blackout, lives alone on a blood thinner with no primary caregiver. CareKaki escalates straight to an ICCP coordinator, flags an urgent clinician-led medication & falls review (without assessing the medication itself), and arranges home nursing, eldercare support, and a caregiver alert under confirm.",
    adapters: ["iccp", "nursing", "aic", "medication", "telegram"],
    location: {
      address: "Blk 123 Yishun Ring Road",
      lat: 1.4295,
      lng: 103.8350,
    },
    profile: {
      name: "Rajesh Kumar",
      age: 85,
      living: "Alone, 2nd-floor flat, no lift",
      mobility: "Uses walking stick, unsteady",
      conditions: "Heart failure, on warfarin + furosemide + bisoprolol, history of falls",
      caregiver: "Nephew visits twice a week, no primary caregiver",
      financialTier: "Per-capita income ~$1,150/mth · full subsidy",
      recentEvent: "Discharged from A&E yesterday after a fall with brief blackout",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me what's happening. How can CareKaki help?" },
      { role: "user", content: "My uncle (85) was discharged from A&E yesterday after a fall — he blacked out for a bit. He lives alone, has heart failure, and takes a blood thinner. I'm worried about him." },
      { role: "assistant", content: "Thank you for telling me. Given a recent blackout, his heart condition and blood-thinning medication, and that no one's regularly at home, this is beyond what I should handle on autopilot. I'm escalating you straight to a Care Corner coordinator now and flagging an urgent clinician-led medication and falls review. I won't make any decisions about his medication myself — that's for his care team. While the coordinator picks this up, shall I arrange a personal alert device and a home-safety visit?" },
    ],
    profileMeta: {
      name: { source: "myinfo" },
      age: { source: "myinfo" },
      living: { source: "chat" },
      mobility: { source: "chat" },
      conditions: { source: "chat" },
      caregiver: { source: "chat" },
      financialTier: { source: "myinfo" },
      recentEvent: { source: "chat", justUpdated: true },
    },
    consent: {
      copy: "You, Rajesh Kumar, are sharing the data below so CareKaki can match schemes and arrange care for you.",
      fields: [
        { label: "NRIC", value: "S••••567A" },
        { label: "Date of birth" },
        { label: "Registered address" },
        { label: "Income (from IRAS)", subcopy: "Used to match financial schemes" },
        { label: "CPF contributions" },
      ],
    },
    careBrief: {
      situation:
        "Rajesh Kumar, 85, was discharged from A&E yesterday after a fall with a brief blackout and lives alone with no primary caregiver — his nephew visits twice a week. He has heart failure and a history of falls.",
      cadence: "Weekly check-in · No family in the room",
      actions: [
        "Urgent escalation to ICCP coordinator",
        "Home nursing arranged",
        "Flagged for clinician-led medication & falls review (not assessed by CareKaki)",
        "Nephew alerted via Telegram",
      ],
      consentsOnFile: [
        "Singpass verified",
        "MyInfo: NRIC · DOB · address · income · CPF",
        "Consented for himself",
      ],
    },
  },
];

export function getDemoUser(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}
