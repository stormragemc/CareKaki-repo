# CareKaki — Slide & Demo Fixes (Working List)

> A running checklist of fixes to the **pitch deck, script, and demo product**, compiled from
> the review sessions. Companion to `product-source-of-truth.md` (the canonical product doc) —
> when a fix here changes product intent, mirror it into the source of truth.
>
> Scope note: the pitch was already delivered and well-received. These are corrections to make
> the **build and the final-round demo** internally consistent and defensible under Q&A — not a
> rewrite of the winning narrative.

---

## Cross-cutting decisions (apply across slides)

- **Singpass login + MyInfo-on-consent is the canonical "zero forms" mechanism.** Identity via
  Singpass (OpenID Connect); verified data (NRIC, DOB, address, income, CPF) via MyInfo after a
  one-tap consent. This is *how* the profile and grant filing get real data without a form.
- **Integration posture = anchor real, simulate the rest (honestly).** Do **not** swap the real
  care agencies for whatever has a public API — the agencies *are* the product. Instead:
  - **Real anchors (genuinely live):** WhatsApp (notify), Singpass/MyInfo **sandbox** (identity +
    data), Google Calendar (booking).
  - **Simulated against real contracts (government-approval-gated future state):** AIC grant,
    Home Nursing, ICCP/Care Corner routing, polyclinic/medication.
  - Framing: *"We've proven we integrate with real (even government) rails — the sandbox is the
    same door in test mode. The agency actions are simulated because they're partnership
    approvals, not engineering."*
- **Consent model = draft-then-confirm.** Autopilot prepares everything as ready-to-send drafts
  the user approves (one tap / "approve all"). The only thing that bypasses confirmation is
  **escalating to a human coordinator faster** — not autonomous action. Slots under Guardian
  principle 3 (human-in-the-loop).
- **Synthetic data only**, everywhere — never a real NRIC/income in a fixture, prompt, or demo.

---

## Slide-by-slide fixes

### Slide 3 — "One front door, two ways in"
- **Clarify the two modes are genuinely distinct,** not cosmetic. The self vs caregiver choice
  must actually fork the downstream experience (seeding, tone, who gets notified), because the
  deck sells that "everything adapts from here." (Tie to the Slide 7 persona clarity below.)

### Slide 4 — "A conversation, not a form" (Living Care Profile)
- **Status: treated as a UI/interface showcase, not a literal logic demo.** Not a priority to
  make the 4-turn conversation perfectly derive every field.
- **But the "zero forms" claim is made real by Singpass/MyInfo** (see cross-cutting): the
  financial tier / income that appears here comes from MyInfo-on-consent, not from the chat.
  Keep that reconciliation in mind wherever the profile shows means-tested data.

### Slide 5 — "Not a list. A plan." (Pathway)
- **Fix care-ecosystem naming.** "SACH polyclinic" is wrong — **SACH (St Andrew's Community
  Hospital) is a community hospital, not a polyclinic.** Either drop "polyclinic" (physio/rehab
  at SACH is fine) or name an actual polyclinic (SingHealth / NUP). Care Corner is in the room
  and will notice.
- Otherwise strong; keep the timeframe grouping and the why-this-for-you tags.

### Slide 6 — "Autopilot" (the remodel)
The biggest set of changes. Goal: Autopilot executes the pathway and spans **medical *and*
social** care, all under Guardian.

- **Pull Guardian out of the "6 services" grid.** It's the **layer wrapping all actions**, not an
  orchestrated service. Reframe as a shield/status bar across the top (consistent with Slide 9).
  Fixes the "is Guardian really a service you orchestrated?" nitpick.
- **Elevate Care Corner / ICCP warm handover to the hero of the slide** — not one tile of six.
  The partner is in the room; the preloaded Care Brief is the emotional peak.
- **Keep:** AIC Home Caregiving Grant (financial anchor, now MyInfo-powered), Home nurse visit
  (Home Nursing Foundation / NTUC Health — match the pathway naming), Care Corner/ICCP routing
  (hero), WhatsApp to family (live).
- **Fix:** Medication review venue naming (drop "SACH polyclinic"; real polyclinic or reframe as
  medication reconciliation / pharmacy).
- **Add:** **Active Ageing Centre (AAC) enrolment** — the social-care agent; it's exactly what
  differentiates Mr Lim's loneliness case from Mdm Tan's (lets Slides 6 & 7 share one engine).
  **MyInfo/Singpass** as the data + eligibility agent underpinning the grant.
- **Add (real booking proof):** Google Calendar event for the nurse visit — a real invite lands
  alongside the real WhatsApp.
- **Reconcile "filed with NRIC + income docs"** with "zero forms" → the docs come from MyInfo.
- **Re-land the headline number.** With Guardian removed and AAC/MyInfo added it's no longer "6."
  Prefer **"5 services orchestrated, under one Guardian"** (or pick the final set and update the
  count everywhere, incl. Slide 11's 1 / 6 / 0). Message > digit: *spans medical and social, all
  under Guardian.*

### Slide 7 — "Same engine. A different plan." (Mr Lim)
- **Resolve the "Self mode" vs "caregiver is the daughter" ambiguity.** The slide is headed
  *Self mode* but shows a WhatsApp thread with the daughter in London. Make it unambiguous:
  **who opens the app, who is typing, and who receives the WhatsApp.** Keep the divergence
  (Silver Support, AAC, weekly check-ins, WhatsApp to daughter) — just fix who's who.

### Slide 9 — "Responsible AI" (Guardian)
- **Soften the "languages" claim in the Bias-monitoring bullet.** Currently: *"Coverage across
  income tiers, **languages**, and conditions reviewed by Care Corner."* The demo is
  English-only, so either drop "languages" or rephrase to something defensible. (See Q&A below.)
- **Reflect the draft-then-confirm consent model** under the human-in-the-loop principle.
- Keep Guardian framed as a real, separate service (and as the wrapper from the Slide 6 remodel).

### Slide 11 — "The vision" (1 / 6 / 0)
- **Update the "6 services" stat** if the Autopilot lineup changes (see Slide 6). Keep "1 front
  door" and "0 forms" (now literally true via MyInfo).

---

## Q&A preparation (answers to have ready on the day)

- **"Is Autopilot real or simulated?"**
  *"The orchestration is real, and you saw real artifacts arrive — a WhatsApp and a calendar
  invite. Identity and data run through the official Singpass/MyInfo sandbox. The agency actions
  (AIC, ICCP, polyclinic) are simulated against their real interfaces, because going live there
  is a partnership and data-governance approval, not engineering. This is what CareKaki looks
  like the day the agencies adopt it."*

- **"How is it 'zero forms' if you filed a grant with NRIC and income?"**
  *"Singpass login plus MyInfo-on-consent. With one tap the verified NRIC, income, and CPF data
  flow in from the national source — that's literally Singapore's form-autofill service. No form,
  real data."*

- **"What about non-English speakers?"** (multilingual)
  *"Multilingual is essentially free in our architecture, not a bolt-on. The agent is an LLM, so
  the conversation already works in Mandarin, Malay, Tamil, or Singlish; the profile is
  structured data, so it's language-independent; and MyInfo can carry the senior's preferred
  language so we greet them right from the first message. We kept the demo in English for
  clarity. The only real productionization work is translating fixed UI strings and getting
  WhatsApp templates approved per language — WhatsApp supports a language code per template, so
  it's configuration, not re-engineering. And Care Corner reviews pathway quality across language
  groups, so we're not better in English than in Tamil."*

- **"Did the family authorize CareKaki to act for them?"** (consent)
  *"Yes — Autopilot drafts every action and the user approves it (one tap, or approve-all).
  Nothing irreversible happens unilaterally. The only thing that bypasses confirmation is
  escalating to a human coordinator faster."*

- **"A caregiver acting for a senior — whose Singpass?"** (delegation)
  *"That's a delegation case. Singapore has proxy/authorisation mechanisms, and in our flow the
  senior consents once at onboarding so the caregiver can act on their behalf."*

---

*Source sessions: product review chats (deck + script + source-of-truth). Keep this list in sync
with `product-source-of-truth.md` as decisions are finalized.*
