# /autoplan Review — CareKaki Prototype Spec

**Date:** 2026-06-03
**Reviews:** `2026-06-03-carekaki-prototype-design.md`
**Pipeline:** autoplan (CEO → Design → Eng → DX lenses)
**Reviewer note:** Codex was not installed, so the independent second voice was unavailable.
This is a single-reviewer pass across the four lenses. The gstack onboarding prompts and
disk artifacts (restore points, TODOS, review logs) were intentionally skipped — the value
here is the critique.

---

## Phase 1 — CEO / Strategy

**Premises accepted:** Real backend is worth building (it is in the rubric); all four beats
live (each maps to a scored criterion); hybrid engine (correct risk call).

**Premises challenged:**

1. **The spec scopes the *app*, but a final is won on the *presentation*.** Nothing here
   covers the slide deck refresh, rehearsal, or Q&A prep. For a 23 June final with Dell +
   Care Corner judges, presentation craft and a confident Q&A carry as much weight as a
   working prototype. The single most likely killer question — *"Is the Autopilot real or
   faked?"* — has no prepared answer.
   **Recommendation:** add a "Demo-day readiness" section (deck-to-app mapping, rehearsal
   pass, one-page Q&A doc with the honest "simulated integrations, real reasoning" answer).

2. **Care Corner is your partner AND in the room.** The PS says "seamless linkage to Care
   Corner / ICCP." The autopilot simulates AIC, HomeNursing, WhatsApp — generic agencies —
   and routes to an "ICCP coordinator." Make the **Care Corner / ICCP warm handover the
   hero of slide 6**, not one card of six. The partner judge wants to see *their* role and
   the coordinator Care Brief front and center.

3. **Over-claim risk.** "Autopilot just does it" is the strongest line and the biggest
   exposure. The Responsible-AI honesty framing (§6 Full vs Demonstrative) is the asset
   that defuses it — the pitch should *lean on* that honesty rather than hope nobody asks.

**6-month regret check:** in-memory session, simulated integrations — zero regret for a
hackathon. Fine.

**CEO score: 7/10** — strong fit to rubric; missing presentation/Q&A readiness and Care
Corner hero framing.

---

## Phase 2 — Design / UX

1. **8-second timeout = an 8-second hang on stage.** §3 sets `CLAUDE_TIMEOUT_SECONDS=8`.
   If live mode stalls, the judge watches a spinner for 8 seconds before fallback kicks in —
   that reads as broken.
   **Fix:** drop the demo timeout to ~3s and pre-warm the model (one throwaway call before
   presenting). High severity for stage feel.

2. **Persona switch is under-specified and that is where it will feel slow.** §5 says
   "re-seed the session and replay through the same endpoints." If that means clearing the
   chat and re-typing Mr Lim's messages live, slide 7 drags.
   **Fix:** specify a one-click instant load of Mr Lim's pre-seeded profile + conversation +
   pathway — a fast flip, not a re-run. The "same engine" point is made by the divergent
   output, not by re-watching it type.

3. **Fallback transition must be invisible.** Spec says the schema is identical (good), but
   not that the switch is seamless mid-stream.
   **Fix:** define that on timeout there is no error flash — the scripted content appears as
   if it streamed.

**Design score: 7/10** — great visual base; timeout + persona-switch will feel slow unless
tightened.

---

## Phase 3 — Eng

```
Browser ──HTTP──▶ web (Next BFF) ──HTTP──▶ agent ──localhost──▶ guardian
   ▲                   │                      │
   └──── SSE ──────────┘ (proxied?)           └──▶ Claude (Anthropic SDK)
```

1. **Two Claude calls per turn doubles latency.** §4.1 calls `/conversation` (reply) and
   `/profile` (extraction). On stage, sequential LLM calls = double the wait.
   **Fix:** collapse into one call — a single tool-schema response returning
   `{assistant_text, profile_patch}`. Halves perceived latency. Highest-leverage reliability
   fix in the spec.

2. **Proxying SSE through the Next.js BFF adds a hop and real fiddliness.** Piping an
   upstream SSE stream through a route handler tends to work in dev and break under demo
   conditions.
   **Fix (taste decision):** consider browser → `agent` SSE directly (CORS) for streaming
   endpoints, keeping the BFF for non-streaming. Fewer hops = fewer stage failures.
   Trade-off: slightly muddies the "one gateway" slide.

3. **Guardian on the hot path** is a per-message hop, but container-to-container on the
   compose network is sub-millisecond — not a real latency concern. Keep it as a service;
   the latency villain is the Claude calls, not Guardian.

4. **Missing test: the demo path itself.** §8 tests the three units but has no end-to-end
   "rehearsal" test running the exact stage click-path in scripted mode.
   **Fix:** add a scripted E2E smoke mirroring the demo — landing → 4 chat turns → pathway →
   autopilot → handover → persona switch. The test that actually protects you on 23 June.

5. **Use synthetic data only.** PDPA redaction is real-ish, but never put real NRICs/PII in
   fixtures. Note it explicitly.

**Eng score: 8/10** — sound architecture; double-LLM-call and SSE-proxy are the two real
risks.

---

## Phase 3.5 — DX (team-on-stage operability)

Not a developer product, but the team is the operator under pressure, so DX = stage
operability.

1. **Most important missing artifact: a DEMO-DAY RUNBOOK.** Exact start command, env vars,
   health check, and a recovery tree ("if chat hangs → do X; if wifi dies → already covered
   by scripted"). One page.

2. **`DEMO_MODE` must flip without a restart.** §7 implies an env var + restart. You cannot
   restart mid-pitch.
   **Fix:** add a live escape hatch — a URL query param (`?mode=scripted`) or hidden
   keyboard shortcut — to drop to deterministic instantly and invisibly.

3. **Ship a `.env.example` and a one-command `make demo`.** Remove every chance to
   fat-finger setup on the day.

**DX score: 6/10** — no runbook, no no-restart escape hatch (the on-stage essentials).

---

## Cross-phase theme (appeared in 3 lenses)

**Stage reliability is under-specified relative to its importance.** Timeout length
(design), single-call latency (eng), no-restart mode flip (DX), and rehearsal E2E (eng) all
point the same way: the spec nails the architecture but under-invests in the 90 seconds
where it can fail in front of judges. Fix this cluster first.

---

## Scorecard

| Lens | Score | One-line |
|------|-------|----------|
| CEO / Strategy | 7/10 | Strong rubric fit; missing presentation/Q&A readiness + Care Corner hero framing. |
| Design / UX | 7/10 | Great visual base; timeout + persona-switch will feel slow unless tightened. |
| Eng | 8/10 | Sound architecture; double-LLM-call and SSE-proxy are the two real risks. |
| DX (operability) | 6/10 | No runbook, no no-restart escape hatch — the on-stage essentials. |

The spec is genuinely good — none of this is "start over." It is a strong architecture that
needs a **stage-hardening pass**.

---

## Findings checklist (for folding into the spec)

**Stage-reliability cluster (high severity):**
- [ ] Collapse reply + profile extraction into a single Claude call (eng #1)
- [ ] Drop demo timeout to ~3s + pre-warm the model (design #1)
- [ ] Persona switch = instant pre-seeded load, not a live re-run (design #2)
- [ ] `DEMO_MODE` flippable without restart — query param / hidden shortcut (DX #2)
- [ ] Demo-day runbook artifact (DX #1)
- [ ] Scripted end-to-end demo-path smoke test (eng #4)
- [ ] Invisible fallback transition, no error flash (design #3)

**Strategic / framing:**
- [ ] Add "Demo-day readiness" section: deck mapping, rehearsal, Q&A doc (CEO #1)
- [ ] Make Care Corner / ICCP handover the hero of the autopilot moment (CEO #2)
- [ ] Pitch leans on Responsible-AI honesty to defuse "is it real?" (CEO #3)

**Lower priority / taste:**
- [ ] Browser → agent SSE direct vs. BFF proxy (eng #2 — taste)
- [ ] Synthetic-data-only note for fixtures (eng #5)
