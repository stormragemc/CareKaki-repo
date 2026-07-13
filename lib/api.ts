// Single source of truth for the backend base URL.
//
// Local dev falls back to the FastAPI server on :8000. In a deployment, set
// NEXT_PUBLIC_API_BASE (e.g. https://carekaki-backend.onrender.com) at build
// time — Next.js inlines NEXT_PUBLIC_* into the client bundle.
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "") || "http://localhost:8000";

/** Build a full backend URL from a path, e.g. apiUrl("/chat"). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
