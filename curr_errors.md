# CareKaki — Current Known Bugs

Last reviewed: 2026-06-18

---

## Critical (backend won't start)

### 1. `backend/main.py` — line 3
**Bug:** `from pydantic import Basemodel` — `Basemodel` is a typo, correct name is `BaseModel`.  
**Effect:** Python raises `ImportError` at startup. The entire FastAPI server never starts.  
**Fix:** Change `Basemodel` → `BaseModel`.

### 2. `backend/main.py` — line 2
**Bug:** `CORSMiddleware` is imported but `app.add_middleware(CORSMiddleware, ...)` is never called.  
**Effect:** Every browser preflight request from the Next.js frontend is rejected with a CORS error. The frontend cannot reach any backend endpoint.  
**Fix:** Add `app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])` after `app = FastAPI()`.

---

## High (demo-breaking logic bugs)

### 3. `components/chat/ChatInput.tsx` — line 13
**Bug:** `handleKeyDown` calls `onSend()` with no `disabled` check. The Send button is correctly guarded (`disabled={disabled || !value.trim()}`), but the Enter key path is not.  
**Effect:** While the AI is responding (`disabled=true`), pressing Enter fires a second concurrent `sendMessage` call, causing race conditions on message state.  
**Fix:** Add `if (disabled) return;` at the top of `handleKeyDown`.

### 4. `hooks/useChatState.ts` — line 24
**Bug:** `sendMessage` has no `isThinking` re-entrancy guard. Only an empty-string check exists.  
**Effect:** Two concurrent calls both set `isThinking(true)` and race to set it back to `false`, leaving message ordering and profile update state non-deterministic.  
**Fix:** Add `if (isThinking) return;` as the first line of `sendMessage` (and add `isThinking` to the `useCallback` deps array).

### 5. `app/(main)/chat/page.tsx` — line 14
**Bug:** `updateProfile` is not destructured from `useChatState()`. The hook returns it but the page never extracts it.  
**Effect:** When SSE integration is wired, `profile_patch` events from the backend have no path to update the `LiveCareProfile` panel. The profile will never update from live data.  
**Fix:** Add `updateProfile` to the destructured values from `useChatState()`.

### 6. `lib/mock-data.ts` — line 9
**Bug:** Only the Mdm Tan persona is defined. Mr Lim (required for the demo's persona switch in slide 7) has no mock data.  
**Effect:** The persona switch crashes or silently shows Mdm Tan's data under Mr Lim's name. `useChatState.ts:43` also hardcodes "Mdm Tan" in the stub assistant reply.  
**Fix:** Add `mockCareProfileMrLim`, `mockMessagesMrLim`, `mockPathwayColumnsMrLim`, and `mockAutopilotServicesMrLim` exports to `mock-data.ts`.

---

## Medium (wrong on stage but not a crash)

### 7. `components/autopilot/AutopilotDashboard.tsx` — line 30
**Bug:** Footer text hardcodes `"When Aunty Mei calls tomorrow…"` as a static string, not derived from any data or prop.  
**Effect:** When the Mr Lim persona is active, the autopilot screen still shows Mdm Tan's ICCP coordinator name, breaking the demo's "same engine, different context" proof point.  
**Fix:** Pass coordinator name as a prop or derive it from the active persona/session data.

### 8. `hooks/useChatState.ts` — line 43
**Bug:** Stub assistant reply hardcodes `"I've updated Mdm Tan's care profile"` regardless of mode.  
**Effect:** In self mode (`/chat?mode=self`) the user is the patient, not a caregiver for Mdm Tan. The response is contextually wrong and confusing on stage.  
**Fix:** Make the stub response mode-aware, or remove the name reference entirely.

---

## Low (surface only when wiring live data)

### 9. `components/chat/LiveCareProfile.tsx` — line 59
**Bug:** `{String(profile[key])}` renders the literal string `"undefined"` if a profile field is missing.  
**Effect:** When SSE patches profile fields one-by-one, unset fields display `"undefined"` next to their label until their patch arrives.  
**Fix:** Replace with `{profile[key] != null ? String(profile[key]) : "—"}` or similar fallback.

### 10. `lib/mock-data.ts` — line 148
**Bug:** The `"medication"` service has `status: "pending"` but `isRunning: true`. All 6 autopilot services share `isRunning: true` regardless of their actual status.  
**Effect:** Any UI logic conditioned on `isRunning` (e.g. a future stop/cancel button) would incorrectly activate for services that haven't started yet.  
**Fix:** Set `isRunning: false` for services with `status: "pending"`.

---

## Also noted (backend/main.py)

- `import os` on line 5 is unused — dead import, remove it.
