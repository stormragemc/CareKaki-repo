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
    color: "#E97451",
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
      financialTier: "Per-capita ≤ $1,500 · full subsidy",
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
    color: "#4EAAA2",
    tagline: "Medication + pharmacy review",
    scenario: "Senior feels dizzy after medication, needs HSA + openFDA medication review and pharmacy desk routing",
    adapters: ["medication", "telegram"],
    location: {
      address: "Blk 85 Bedok North Street 4",
      lat: 1.3290,
      lng: 103.9300,
    },
    profile: {
      name: "Mr Lim",
      age: 82,
      living: "With wife, ground-floor flat",
      mobility: "Walks independently but slow",
      conditions: "Type 2 diabetes, hypertension, on amlodipine + metformin",
      caregiver: "Wife (76), son visits weekly",
      financialTier: "Per-capita ≤ $2,000 · partial subsidy",
      recentEvent: "Dizziness and giddiness after taking medication",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me what's going on. How can CareKaki help?" },
      { role: "user", content: "My father (82) feels very dizzy after taking his blood pressure and diabetes pills. He almost fell." },
      { role: "assistant", content: "That's concerning. I'll run a medication review against Singapore's HSA registry and check for known side effects. Let me also route this to a pharmacy reviewer." },
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
      name: "Mrs Wong's Mother",
      age: 74,
      living: "With daughter, 5th-floor flat with lift",
      mobility: "Wheelchair after knee surgery",
      conditions: "Post knee replacement, wound care needed, mild diabetes",
      caregiver: "Daughter (Mrs Wong), works part-time",
      financialTier: "Per-capita ≤ $1,800 · partial subsidy",
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
      copy: "Mrs Wong's mother consents to share the data below. Mrs Wong (daughter) may then act on her behalf for this session.",
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
        "Mrs Wong's mother, 74, was discharged from NUH after knee replacement and needs wound care at home. She lives with her daughter Mrs Wong, who works part-time.",
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
        "Delegation: Mrs Wong acts for her mother",
      ],
    },
  },
  {
    id: "uncle-raj",
    name: "Uncle Raj",
    avatar: "🧓",
    role: "senior",
    color: "#7B68EE",
    tagline: "Full emergency — all systems",
    scenario: "Senior collapsed and is unresponsive, triggers ALL adapters: ICCP escalation, AIC services, home nursing, medication review, and caregiver Telegram alert",
    adapters: ["iccp", "nursing", "aic", "medication", "telegram"],
    location: {
      address: "Blk 123 Yishun Ring Road",
      lat: 1.4295,
      lng: 103.8350,
    },
    profile: {
      name: "Uncle Raj",
      age: 85,
      living: "Alone, 2nd-floor flat, no lift",
      mobility: "Uses walking stick, unsteady",
      conditions: "Heart failure, on warfarin + furosemide + bisoprolol, history of falls",
      caregiver: "Nephew visits twice a week, no primary caregiver",
      financialTier: "Per-capita ≤ $1,200 · full subsidy",
      recentEvent: "Found collapsed at home, unresponsive for unknown duration",
    },
    chatHistory: [
      { role: "assistant", content: "Hi — tell me what's happening. How can CareKaki help?" },
      { role: "user", content: "My uncle (85) was found collapsed at home. He lives alone and takes heart medication. We don't know how long he's been down." },
      { role: "assistant", content: "This is urgent. I'm activating all care systems: alerting your caregiver, escalating to the ICCP coordinator, checking his medication for interactions, and finding the nearest eldercare and nursing support." },
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
      copy: "You, Uncle Raj, are sharing the data below so CareKaki can match schemes and arrange care for you.",
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
        "Uncle Raj, 85, was found collapsed at home and lives alone with no primary caregiver — his nephew visits twice a week. He has heart failure and a history of falls.",
      cadence: "Weekly check-in · No family in the room",
      actions: [
        "Emergency escalation to ICCP coordinator",
        "Home nursing arranged",
        "Medication review against HSA registry",
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
