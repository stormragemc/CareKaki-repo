// ── Care profile (assembled from conversation) ──────────────────────────────
export interface CareProfile {
  name: string;
  age: number;
  living: string;
  mobility: string;
  conditions: string;
  caregiver: string;
  financialTier: string;
  recentEvent: string;
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export type CareMode = "self" | "caregiver";

// ── Pathway ──────────────────────────────────────────────────────────────────
export type PathwayColorScheme = "orange" | "blue" | "amber" | "teal";

export interface PathwayColumnData {
  id: string;
  timeframe: string;
  title: string;
  colorScheme: PathwayColorScheme;
  items: string[];
  whyThisForYou: string;
}

// ── Autopilot ─────────────────────────────────────────────────────────────────
export type ServiceStatus =
  | "submitted"
  | "scheduled"
  | "active"
  | "routed"
  | "pending"
  | "passing";

export interface AutopilotService {
  id: string;
  icon: string;
  iconColor: string;       // Tailwind bg class for the icon square
  name: string;
  provider: string;
  description: string;
  status: ServiceStatus;
  statusLabel: string;
  isRunning: boolean;
}

// ── Living Care Profile (view model over CareProfile) ─────────────────────────
// Marks which profile fields are MyInfo-verified vs. assembled from chat, and
// drives the "just updated" pulse. Keyed by CareProfile field name.
export type FieldSource = "myinfo" | "chat";

export interface ProfileFieldMeta {
  source: FieldSource;
  justUpdated?: boolean;   // toggles the ckPulse ring; cleared ~1.8s after set
}

export type ProfileMeta = Partial<Record<keyof CareProfile, ProfileFieldMeta>>;

// ── Pathway (design view model) ───────────────────────────────────────────────
export type PathwayGroup = "this-week" | "weeks-2-8" | "apply-now" | "single-point";
export type Divergence = "differs" | "elevated";   // persona-specific highlight tag

export interface PathwayItem {
  id: string;
  group: PathwayGroup;
  title: string;
  whyTag: string;          // always traces back to a profile fact
  divergence?: Divergence;
  highlight?: boolean;     // emphasis card (e.g. ICCP single point of contact)
}

// ── Consent / Care Brief ──────────────────────────────────────────────────────
export interface ConsentField {
  label: string;
  value?: string;          // masked where sensitive (e.g. NRIC)
  subcopy?: string;
}
