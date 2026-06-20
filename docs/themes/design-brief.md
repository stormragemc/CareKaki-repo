# CareKaki — Design Handoff Brief

> **Read this with two companion docs:** `product-source-of-truth.md` (what we're building and why)
> and `user-flows.md` (the screens, use cases, and demo run-of-show). This brief does **not** repeat
> those — it frames the *design task*: what to design, the constraints to honour, and what to hand
> back so it can be built. When this brief and the source-of-truth disagree on *product intent*,
> the source-of-truth wins.

---

## 1. What you're designing

CareKaki is an agentic Care Navigator for Singapore's community-care system — "your care buddy that
knows where to start." We need a **visual + interaction design for a 6-screen demo journey**, to be
presented live at a hackathon final (Dell InnovateDash 2026, partner: Care Corner Singapore).

Design these six screens as one coherent product:

1. **Landing** — "Who is this for?" (one front door, two ways in)
2. **Consent** — Singpass login + MyInfo data consent (this is how "zero forms" is literally true)
3. **Conversation + Living Care Profile** — the user talks; a structured profile assembles itself in real time (HERO screen)
4. **Pathway** — a personalised 4-part plan with a "why this for you" reason on every item
5. **Autopilot** — the agent executes 5 services in parallel under a Guardian safety layer (HERO screen)
6. **Care Brief / Handover** — the warm-handover artifact a human coordinator receives

The full step-by-step content of each screen lives in `user-flows.md` §2 and §3. Use those flows as
the functional spec; your job is the look, feel, layout, hierarchy, motion, and states.

---

## 2. The two beats that must hit hardest

Per the demo script, **Slide 4 (Conversation) and Slide 6 (Autopilot) are where judges "get it."**
Design weight should follow:

- **Conversation:** the emotional + "aha" moment is watching the Living Care Profile *fill itself
  in from natural talk* — no forms. Make that visible and satisfying.
- **Autopilot:** the "the agent actually does the work" moment — parallel services going from draft
  to done, with a real WhatsApp message and a real Google Calendar invite as live proof.

Everything else should be clean and quiet so these two breathe.

---

## 3. Brand voice & feeling (drives the visual tone)

From source-of-truth §10:

- **Warm, human, reassuring** — a "care buddy," not a government portal or a generic chatbot.
- **Plain language** — no jargon thrown at families; acronyms are handled *for* them.
- **Confident but honest** — acts decisively, never over-claims, always keeps a human reachable.
- **Personalised, never generic** — everything ties back to *this* person's context.

Target users include **seniors and stressed caregivers**, so the design must be calm,
legible, and unintimidating — large tap targets, high contrast, generous spacing, minimal cognitive
load on any single screen.

---

## 4. The mode / persona fork (a core design requirement, not a cosmetic toggle)

The product's biggest differentiator is **"same engine, reads the room."** The very first choice
("for myself" vs "for someone I care for") must lead to a *genuinely different* experience, not just
a relabel. Two bound demo personas (details in source-of-truth §5 and user-flows §6):

- **Caregiver mode → Mdm Tan, 78** (daughter Wei Ling operates; family is local).
- **Self mode → Mr Lim, 72** (he operates himself; family overseas; real risk is loneliness).

The same screens should visibly produce different results for each (different financial scheme,
social-care emphasis, check-in cadence, who gets notified). **Please design with both personas in
mind** and show, where useful, how a screen differs between them — especially a side-by-side or
before/after treatment that could sell the "reads the room" point on stage.

---

## 5. Per-screen design notes (what each must convey)

Keep the functional steps from `user-flows.md`; below is the *design intent* per screen.

- **Landing.** One question, two clear paths. Hero line + tagline. Warm, inviting, almost no UI
  chrome. The two choices should feel equal and human (a senior vs a caregiver), colour-coded.

- **Consent (Singpass + MyInfo).** Must feel trustworthy and official without feeling bureaucratic.
  Show the **exact** list of data fields requested (NRIC, DOB, address, income from IRAS, CPF) with a
  clear approve action — transparency is the feature. Mode-aware: caregiver mode communicates the
  delegation ("the senior consents; the caregiver acts on their behalf"); self mode is the person
  consenting for themselves. (For the demo this is a sandbox/simulated flow — design it to look like
  the real thing.)

- **Conversation + Living Care Profile.** A two-region layout: the conversation and the live profile.
  The profile should populate field-by-field as the person talks, with a clear "just updated" beat.
  Distinguish **conversation-derived** fields from **MyInfo-verified** fields (a subtle verified
  marker) to reinforce "verified, not guessed." Design the mobile experience deliberately (the
  profile can't just disappear on small screens).

- **Pathway.** A *plan*, not a list — grouped by when things happen (This Week / Weeks 2–8 / Apply
  Now / one coordinating Single Point). Every recommendation carries a **"Why this for you"** reason
  traced to a real profile fact — make this a consistent, trustable, first-class element. End with a
  clear path into Autopilot (the warm-handover offer).

- **Autopilot.** A deliberate, dramatic shift in mood (the current product uses a dark theme here to
  signal "the machine is working" — feel free to keep or reinterpret, but make the contrast
  intentional). Design the **draft-then-confirm** interaction: each of the 5 services first appears
  as a ready-to-send *draft*, the user approves per-service or "approve all," then statuses progress
  live. So design at least three card states: **draft → approving/running → done.** A persistent
  **Guardian** safety layer wraps all services (a shield/status band across the top — it is the
  wrapper, NOT a 6th service tile). Visually flag the two genuinely-real actions (WhatsApp send,
  Google Calendar invite).

- **Care Brief / Handover.** The emotional payoff: "what the coordinator sees." One clean,
  briefing-style artifact gathering the profile, the actions taken, consents, the family contact, and
  the check-in cadence — so "the family never repeats themselves." Warm, document-like, reassuring.

---

## 6. Cross-cutting design requirements

- **Responsible AI is visible.** A subtle, consistent presence: a "Responsible AI / Guardian" cue,
  and a **"talk to a human" / one-click-to-human** affordance reachable from every screen.
- **Honesty in the UI.** Where it helps credibility, lightly distinguish what's genuinely live (real
  WhatsApp, real calendar invite, Singpass/MyInfo consent) from what's simulated — without making it
  read as "fake." (Don't over-design this; it should feel like confidence, not a disclaimer.)
- **Accessibility / senior-friendly.** High contrast, large readable type, big tap targets, clear
  focus states, no reliance on colour alone.
- **Responsive.** It will be shown on a laptop but should hold up as a mobile/PWA layout too;
  define how the multi-region screens (especially Conversation) reflow on small screens.

---

## 7. Technical context (so the design is buildable)

It will be implemented in **Next.js (App Router) + React + Tailwind CSS**. Practical implications:

- Favour layouts and components that map to Tailwind utility styling and standard React components.
- There is an existing **warm palette** you can build on or refine: a warm orange (self / primary
  accent), a deep teal (caregiver), cream backgrounds, plus blue / amber / pink accents used to
  differentiate the four pathway groups and service statuses. A dark brown is currently used for the
  Autopilot "machine" world. Treat these as a starting point — you may evolve them, but please define
  a final palette with hex values.
- Typography currently pairs a serif (Playfair Display) for headlines with a clean sans (Geist) for
  UI/body. Keep a similar "warm serif headline + neutral sans body" feeling unless you have a strong
  reason to change.
- No specific component library is required (the current app is bespoke Tailwind components), so you
  have freedom — just keep it implementable with plain React + Tailwind.

---

## 8. What to hand back (deliverables that make implementation smooth)

Please produce, for each of the 6 screens:

1. **Layout / wireframe** — structure, regions, and hierarchy (desktop + mobile).
2. **Visual design** — final colours (with hex), typography scale, spacing, corner radii, elevation,
   iconography direction.
3. **Key states** — empty / loading / populated; and specifically the Conversation "profile filling
   in" moment and the Autopilot "draft → running → done" card states.
4. **Both personas** — how at least the Conversation, Pathway, and Autopilot screens differ between
   Mdm Tan (caregiver) and Mr Lim (self), ideally a side-by-side.
5. **A small reusable component set** — e.g. card, badge/status pill, "why this for you" tag, Guardian
   shield band, consent row, service card, primary button — so the build composes from shared parts.
6. **Motion notes** — any transitions that matter (profile field fill, status progression, the
   cream→dark shift into Autopilot).

A short rationale per major decision is welcome but optional. Static mockups, a clickable prototype,
or a structured written spec are all fine formats — whatever lets us build it faithfully.

---

## 9. Guardrails (please don't)

- Don't turn it into a **directory** or a **generic chatbot UI** — it's an agent that reasons and
  acts. (This is the #1 thing the product is defined *against*.)
- Don't over-claim in UI copy (no "diagnoses," no medical advice; CareKaki recommends vetted service
  categories and always keeps a human reachable).
- Don't bury the two hero moments (profile-fills-itself, agent-does-the-work) under heavy chrome.
- Don't make the mode choice cosmetic — the two personas must feel genuinely different.

---

*Companion docs to read alongside this brief: `product-source-of-truth.md` and `user-flows.md`.*
