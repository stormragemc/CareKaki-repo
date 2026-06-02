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
