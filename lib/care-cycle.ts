// ── Care cycle ────────────────────────────────────────────────────────────────
// CareKaki runs in repeating phases: Care Plan → Autopilot → Care Brief →
// (next) Care Plan. Each phase carries vital context forward plus a short
// summary of what happened in the previous phase. State is client-only
// (sessionStorage) for the demo — no backend persistence this pass.

const KEY_PHASE = "carePhase";
const KEY_HISTORY = "carePhaseHistory";

export interface PhaseRecord {
  phase: number; // the phase that just completed
  summary: string; // 1-2 line "what happened" carried into the next plan
  at: string; // human-readable completion timestamp
}

export function getPhase(): number {
  if (typeof window === "undefined") return 1;
  const raw = sessionStorage.getItem(KEY_PHASE);
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function getPhaseHistory(): PhaseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as PhaseRecord[]) : [];
  } catch {
    return [];
  }
}

export function getLastPhaseRecord(): PhaseRecord | null {
  const history = getPhaseHistory();
  return history.length ? history[history.length - 1] : null;
}

// Close the current phase (record a summary) and advance to the next one.
// Returns the new phase number.
export function advancePhase(summary: string): number {
  if (typeof window === "undefined") return 1;
  const current = getPhase();
  const history = getPhaseHistory();
  history.push({
    phase: current,
    summary,
    at: new Date().toLocaleString("en-SG", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  });
  const next = current + 1;
  sessionStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  sessionStorage.setItem(KEY_PHASE, String(next));
  return next;
}

// New case / fresh onboarding — start the cycle over.
export function resetCycle(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY_PHASE);
  sessionStorage.removeItem(KEY_HISTORY);
}
