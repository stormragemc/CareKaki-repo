import type { DemoUser } from "./demo-users";
import type { CareMode, CareProfile } from "./types";

// The active persona is the DemoUser stashed in sessionStorage at /login.
// The /onboard path has no demo user, so callers fall back to careProfile.
export function loadDemoUser(): DemoUser | null {
  try {
    const raw = sessionStorage.getItem("demoUser");
    if (raw) return JSON.parse(raw) as DemoUser;
  } catch {}
  return null;
}

export function loadCareProfile(): CareProfile | null {
  try {
    const raw = sessionStorage.getItem("careProfile");
    if (raw) return JSON.parse(raw) as CareProfile;
  } catch {}
  return null;
}

// Mode is the cosmetic accent (orange self / teal caregiver). When someone acts
// on the senior's behalf (a delegation is on file) the session is caregiver mode.
export function deriveMode(user: DemoUser | null): CareMode {
  const delegated = user?.careBrief?.consentsOnFile.some((c) =>
    c.toLowerCase().startsWith("delegation")
  );
  return delegated ? "caregiver" : "self";
}
