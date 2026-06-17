# CareKaki — Product Source of Truth

> **This document is the absolute source of truth for the CareKaki project.**
> It captures *what we are building and why*, derived directly from the pitch deck
> (`CareKaki_Demo_Deck`) and the 5-minute demo script (`docs/CareKaki_Demo_Script.md`).
> When in doubt about product intent, scope, tone, or narrative — defer to this file.

**Project:** CareKaki — an agentic Care Navigator
**Partner:** Care Corner Singapore (an ICCP provider)
**Event:** Dell InnovateDash 2026 — SUTD
**Tagline:** *"Your care buddy that knows where to start."*

---

## 1. The one-sentence pitch

CareKaki is an **agentic Care Navigator that turns Singapore's fragmented community-care
system into a single, personalised plan — built through conversation, not forms.**

It is **not** a directory. **Not** a chatbot. It is an agent that **listens, reasons, and
operates the system on the family's behalf** — so the people who need care don't have to
navigate a system to receive it.

---

## 2. The core insight (the thesis everything hangs on)

> **Singapore doesn't have a care shortage. It has a navigation shortage.**

World-class community care already exists. But the moment a senior is discharged, families
collide with a maze of agencies, schemes, and acronyms (AIC, ICCP, SMF, MediFund, HCG,
Silver Support, AAC, CHAS, PCP, Discharge…).

People don't fail because help doesn't exist. **They fail because no one helps them figure
out what's right for their situation.**

> *"The system isn't broken. It's invisible."*
> — A caregiver, in their fourth phone call of the morning.

**The product's entire job is to make the invisible system reachable.**

---

## 3. The product in one line

**One front door. Two ways in.**

- **1 front door** — a single starting question.
- **5 services** — orchestrated in the background, **all under one Guardian** (the deck's
  original "6" folded Guardian into the count; Guardian is the *wrapper*, not a service — see §4 Beat 4).
- **0 forms** — nothing is ever filled in by hand, because **Singpass login + MyInfo-on-consent**
  bring in verified data (NRIC, income, CPF) with one tap (see §6c).

---

## 4. The four demo beats (the heart of the product)

These four moments are where the product is *understood*. Everything else is supporting
material. **Slides 4 and 6 are the beats that make people "get it" — they carry the most weight.**

### Beat 1 — One front door, two ways in (Landing)

The only choice we ever ask on day one: **"Who is this for?"**

- **For myself** — a senior figuring things out (discharge, schemes, day-to-day support).
- **For someone I care for** — a caregiver who needs a plan they can actually act on.

Everything after this adapts to that single answer. **The two modes must be genuinely distinct**
— different seeding, tone, and who-gets-notified — not just a cosmetic label, because the whole
promise is that "everything adapts from here."

### Beat 2 — A conversation, not a form (Living Care Profile) ⭐

The hero moment. The user simply **talks**; there are no forms or dropdowns.

As they talk, CareKaki assembles a **Living Care Profile** in real time on the right — name,
age, living situation, mobility, conditions, caregiver context, financial tier, recent event.

**Every field is extracted from natural conversation. No form is ever filled.** A few turns
in, CareKaki already has enough to act.

> **How "zero forms" stays true:** the *narrative* fields come from conversation, but
> means-tested / identity data (NRIC, income, financial tier) is **not** guessed from chat —
> it flows in from **Singpass login + MyInfo-on-consent** (Singapore's official autofill). So
> "no form" is *literally* true, and the data is verified, not inferred (see §6c).

### Beat 3 — Not a list. A plan. (Pathway) ⭐

From the profile, CareKaki generates a **personalised pathway** — grouped by *what needs to
happen when*, not a flat list:

- **This Week** — get home safely (home-safety walk-through, walker + grab-bar fitting, caregiver basics).
- **Weeks 2–8** — ongoing care (home nursing visits, physio/rehab, medication review).
- **Apply Now** — financial support the family actually qualifies for (HCG, MediFund top-up, CHAS review).
- **Single Point** — one coordinator to pull it all together (ICCP case officer, family loop, monthly check-in).

> **Naming accuracy (Care Corner is in the room):** do **not** label physio/rehab as a
> "polyclinic" service at SACH — **SACH (St Andrew's Community Hospital) is a community
> hospital, not a polyclinic.** Polyclinics are SingHealth / NUP. Use "physio/rehab at SACH"
> or name an actual polyclinic.

**Every recommendation explains itself** with a *"Why this for you"* tag traced to a real
profile fact (e.g. "Lives alone post-discharge", "Per-capita income within tier"). This is
reasoning the family can **trust**.

When a case is complex, CareKaki offers a **warm handover** to a Care Corner coordinator.

### Beat 4 — Autopilot: the agent does the work ⭐⭐

The signature moment.

> A normal AI tool generates a checklist for *someone else* to go and do.
> **Autopilot just does it** — five services, in parallel, right now, **all under one Guardian**.

**The remodeled set — 5 real-world services spanning *medical AND social* care, wrapped by
Guardian** (the deck's "6th card" was Guardian itself; it is the wrapper, not a service):

1. **Financial — Home Caregiving Grant (AIC).** Filed with NRIC + income docs that came from
   **MyInfo-on-consent**, not a form (reconciles "zero forms" with "filed with income docs").
2. **Clinical — Home nurse visit (Home Nursing Foundation / NTUC Health).** Booked with lift
   access + caregiver contact, and a **real Google Calendar invite** is sent (a live anchor).
3. **Social — Active Ageing Centre (AAC) enrolment.** The whole-person agent; this is what makes
   Mr Lim's loneliness case diverge from Mdm Tan's, on the *same* engine (see §5).
4. **Coordination — Care Corner / ICCP warm handover (THE HERO).** Routed to the least-loaded
   officer (Aunty Mei — **confirm with Care Corner whether this should stay a placeholder name
   or reference an actual coordinator**, since the partner will be in the room) with the **Care
   Brief preloaded**. The partner is in the room — this is the emotional peak of the slide, not
   one tile of six.
5. **Comms — WhatsApp to the family.** Plain-language summary + reassurance thread — the
   **genuinely live** integration (a real message lands on a real phone).

**Guardian wraps all five** (no medical advice · PDPA scrubbed · human one click away) — shown
as a shield/status layer across the top, not as a sixth tile.

The payoff:

> **When the coordinator calls tomorrow, she already knows everything. The family never
> repeats themselves.** ← this is the **warm handover**.

> **Consent model — draft-then-confirm:** Autopilot *prepares* every action as a ready-to-send
> draft the user approves (one tap, or "approve all"). Nothing irreversible happens unilaterally.
> The only thing that bypasses confirmation is **escalating to a human coordinator faster** — not
> autonomous action. This strengthens "the agent does the work" (it did the labour; the human
> just says yes) and sits under Guardian's human-in-the-loop principle.

---

## 5. "Reads the room" — same engine, different plan

The proof that CareKaki *reasons* rather than templates: **same engine, different person.**


|               | **Mdm Tan, 78**                                             | **Mr Lim, 72**                                                 |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Context       | Caregiver: daughter Wei Ling, **local**, full-time + 2 kids | Caregiver: daughter in **London** (kids overseas)              |
| Finance       | Home Caregiving Grant                                       | Silver Support Scheme (pension tier)                           |
| Social        | Family already present                                      | Active Ageing Centre — because the real risk is **loneliness** |
| Check-ins     | Single coordinator callback                                 | **Weekly** check-in cadence (no family in the room)            |
| Notifications | WhatsApp to caregiver                                       | WhatsApp to daughter overseas                                  |


> **Same intent. Different context. CareKaki reads the room.**

> **Persona clarity (fix the "self mode" ambiguity):** the Mr Lim slide is headed *Self mode*
> but shows a WhatsApp thread with his daughter in London. Be unambiguous about **who opens the
> app, who is typing, and who receives the WhatsApp.** Recommended reading: Mr Lim self-navigates
> (he is the user), and the daughter is a **notified family member**, not the operator — keep the
> divergence (Silver Support, AAC, weekly check-ins, WhatsApp to daughter), just fix who's who.

---

## 6. Architecture (cloud-native, API-driven)

*Built for the cloud. Built around the agent.* (For the technical judges — hit these words
clearly: **cloud-native, microservices, API-first, Kubernetes, Responsible AI.**)

```
CLIENT SURFACES   Web app · Mobile PWA · WhatsApp bot
        │
API GATEWAY       OAuth + role-based auth · rate limiting · PDPA scrub · request tracing
        │
MICROSERVICES     Conversation · Profile Builder · Pathway Reasoner · Autopilot Orchestrator · Handover
        │
AGENT PLANE       LLM (reasoning + tool-use)  ·  Guardian (safety + PDPA + escalation)
        │
IDENTITY/DATA     Singpass (login) · MyInfo (verified data on consent)
INTEGRATIONS      AIC API · Home Nursing · ICCP coordinator · WhatsApp Business · Polyclinic · AAC · Google Calendar
```

Properties (target architecture): **Kubernetes-orchestrated · containerized · stateless
services · event-driven · API-first · observable.** Each service is designed to be
independently deployable.

> **Build status:** no k8s manifests exist yet (see `user-flows.md` §6, "Cross-cutting"). Say
> "designed for" rather than implying a cluster is already running, unless one actually is by
> demo day.

> **The agent never talks to a service directly — only through APIs, only after Guardian.**

---

## 6a. Integrations — a reference architecture, not a fake

The agencies CareKaki orchestrates (AIC, HomeNursing.sg, the ICCP coordinator pool,
Polyclinic / SMF, WhatsApp Business) are the **real** institutions in Singapore's care
journey — they are the exact maze families drown in (see §2). Depicting them in Autopilot is
correct product design: an orchestrator that skipped the hard government and healthcare rails
would be solving the wrong problem.

What CareKaki demonstrates is the **target operating model** — *what this looks like once the
agencies are on board.* Crucially, draw the line between **depiction and claim**:

- **The orchestration is real.** The Autopilot Orchestrator genuinely fans out to each
  integration in parallel, manages real async state, and progresses statuses over time.
- **The agency endpoints are simulated against their real interfaces.** Going live on the
  government / healthcare rails is a **partnership, credentialing, and data-governance step —
  not an engineering one.**

This is not vapourware: these integrations exist in the world and would be unlocked by
adoption, not by more code. AIC runs provider-facing referral/case systems that partner orgs
file through; **Care Corner, as an ICCP provider, is precisely the partner that switches on
ICCP routing**; polyclinics sit behind national health IT. Every "simulated" tag is therefore
a **deployment step, not a missing feature** — a roadmap of what flips on as each agency joins.

**Posture: anchor with real rails, simulate the rest — never substitute.** Do **not** swap the
real care agencies for whatever happens to have a public API; the agencies *are* the product.
Instead, prove capability with the rails that are genuinely accessible, so the simulated ones
inherit that credibility:

- **Real anchors (genuinely live in the demo):**
  - **WhatsApp** — Meta's Business Cloud API; a real message lands on a real phone (see §6b).
  - **Singpass / MyInfo** — via the **official government sandbox** (test personas); the real
    consent flow, in test mode. This directly proves "we plug into government rails when approved."
  - **Google Calendar** — a real nurse-visit invite lands in the caregiver's calendar.
- **Simulated against real contracts (government-approval-gated future state):** AIC grant,
  Home Nursing, ICCP / Care Corner routing, polyclinic / medication.

The honest, *strong* framing for Q&A:

> "These are the real agencies in the journey. The orchestration is live — you saw a real
> WhatsApp arrive, a real calendar invite, and identity + data flowing through the official
> Singpass/MyInfo sandbox. The agency actions (AIC, ICCP, polyclinic) are simulated against
> their real interfaces, because going live there is a partnership and data-governance approval,
> not engineering. The sandbox is the same door, just in test mode. This is what CareKaki looks
> like the day the agencies adopt it."

That answer makes the simulation read as a **roadmap**, not a gap — and never over-claims.

---

## 6b. WhatsApp — the one real integration (and how it scales)

WhatsApp is the single integration that is **genuinely live**, because it is the one rail
that's publicly accessible: **Meta's WhatsApp Business Cloud API**. When Autopilot fires, a
real message lands on a real phone — the undeniable proof that CareKaki reaches the outside
world. Everything else follows the same contracts the day access is granted.

### It is production-grade, not a demo toy

The Cloud API *is* the production system — since the On-Premises API was deprecated
(Oct 2025), it is the **only** sanctioned way anyone sends WhatsApp programmatically, startup
to enterprise. The prototype and the live product run on the **same API, same send code, same
templates, same webhooks.** Scaling up is **configuration and compliance, not a rewrite:**

| Demo (prototype) | Live product |
| --- | --- |
| Meta **test sender number** (`+1 555…`) | Own **registered, verified** business number |
| **5 whitelisted** recipients | Anyone who has **opted in** |
| **Unverified** → 250 business-initiated convos/day | **Business-verified** → 100,000/day → unlimited at high quality |
| Temporary token | Permanent **System-User** token (same approach in prod) |

The unlock from demo to live is **Meta Business Verification** (a KYC/paperwork gate) + your
own number + opt-in capture — **not** more engineering. The API, send code, template
structure, webhooks, and architecture are **byte-for-byte identical** across demo and
production; verification is the single gate that bundles the rest (own number + display name,
opt-in recipients, and automatic limit scaling).

### Timelines — demo is same-day, production is ~a week of review queues

| Path | Time | Notes |
| --- | --- | --- |
| **Demo / prototype** | **Same day (~15–60 min)** | Test number provisioned instantly; `hello_world` template pre-approved (sends in seconds). A **custom** template takes minutes–hours (≤24h) — submit it a day or two early so it's safely approved. **No business verification needed.** |
| **Production / live** | **~3–10 business days** | Dominated by **Meta Business Verification: 2–5 business days** (can stretch to ~14 if legal name/docs mismatch). Display-name review same-day–2 days; first template approvals 1–24h. |

Both paths involve only ~15–20 min of actual setup clicks — the rest is Meta's review queue.
The biggest avoidable delay is a **legal business name that doesn't exactly match the
registration documents**. Care Corner, as an established entity, clears verification far faster
than a brand-new startup would. Net: **the demo carries zero schedule risk; production is a
~1-week paperwork-latency step, not a build-effort one.**

### Permanent platform constraints to design around

These are WhatsApp platform rules everyone lives with — design the product around them now:

1. **The 24-hour window.** Free-form messages are only allowed within 24h of the *user*
   messaging you. CareKaki's proactive nudges (most of the "WhatsApp the caregiver" flow) are
   **business-initiated**, so they must be **pre-approved templates** (Meta review, usually
   fast but up to ~24–48h — never leave to demo day).
2. **Opt-in is mandatory.** You cannot message someone who hasn't consented. Clean for
   CareKaki — capture caregiver consent during onboarding.
3. **Per-message pricing.** Post-July-2025 billing is per template message (Utility cheap /
   free in-window; Marketing pricier). Cheap and predictable at care-coordination volumes,
   but a real line item.

### The architectural answer (and the scaling concern, resolved)

WhatsApp is a **Meta-governed channel** (their policies, quality ratings, pricing). The mature
design — and the right thing to say to judges — is that **WhatsApp is one notification adapter
behind CareKaki's own messaging interface**, so SMS, email, or Telegram can be added without
touching the rest of the system. This is exactly what the architecture implies ("WhatsApp
Business" as one integration behind the gateway). So WhatsApp **does** scale to a real product;
the only discipline is to keep it a **swappable adapter**, never the sole hard-wired channel.

> Honesty note for Q&A: the demo sends from a Meta **test number**, not a verified "CareKaki"
> business number (verification is a longer KYC step). Fine for a prototype — don't claim it's
> a production business account if asked.

---

## 6c. Identity & data — Singpass + MyInfo (how "zero forms" is literally true)

Singpass is Singapore's national digital identity, and it gives CareKaki two things in one flow:

1. **Login (authentication)** — "Log in with Singpass" via **OpenID Connect**: a verified
   assertion of *who* the user is. Familiar, trusted, no passwords to manage.
2. **MyInfo (verified data, on consent)** — after login, CareKaki requests a **specific set of
   MyInfo fields** (NRIC, DOB, address, **income from IRAS**, CPF). The user sees a consent
   screen listing exactly what's requested and approves; the data returns **signed and verified**.
   MyInfo is literally Singapore's official form-autofill service.

**Why this matters:** it is the canonical resolution to the "zero forms" vs "filed with NRIC +
income docs" tension. The identity/means-tested data Autopilot needs to file the Home Caregiving
Grant flows in from **MyInfo-on-consent**, not from a typed form and not inferred from chat. So
"0 forms" is *literally* true — and more impressive: not "we skipped the form," but "the data
flows from the national source with one consent tap."

**Demo vs production:** the demo uses the **official Singpass/MyInfo sandbox** (synthetic test
personas) — the real consent flow in test mode, which itself proves "we integrate with
government rails." Production swaps in the live MyInfo API (a registration/approval step).

**Delegation wrinkle (have the answer ready):** a caregiver acting for a senior is a delegation
case (whose Singpass?). Singapore doesn't have one generic "delegate my Singpass" API — what
exists today is service-specific (e.g. HealthHub's caregiver-link model for Healthier SG, or the
next-of-kin / Lasting Power of Attorney route required for checking government benefits on
someone else's behalf). **CareKaki's flow models that same pattern, not a real integration**: the
senior consents once at onboarding, and the caregiver acts on their behalf for the rest of the
session. Be ready to say plainly, if asked, that the actual delegation mechanism is simulated, and
going live would mean partnering with whichever agency's rail it ends up modeling.

---

## 7. Guardian — Responsible AI as a service (not a slogan)

> **Safety is an architectural choice, not a prompt instruction.**

Guardian is designed as a **policy plane between the LLM and the world** — an actual service,
auditable, testable, deployable. Every CareKaki action is meant to flow through it.

> **Build status (added in judge-review pass, 2026-06-17):** Guardian does not exist as a running
> service yet — see `user-flows.md` §6, "Cross-cutting." Until at least a minimal stub exists,
> describe Guardian as the safety architecture the product is built around, not as a service a
> judge can be shown live.

Six principles:

1. **No medical advice** — clinical questions are intercepted and routed to a human. CareKaki recommends categories of services already vetted by Care Corner's intake criteria (e.g. "eligible for home nursing visits") — it never assesses condition severity, diagnoses, or judges treatment appropriateness itself.
2. **PDPA-aware by default** — NRIC, income, and medical details tokenised at ingest; **designed so** PII never leaves the regional boundary *(verify this against whichever cloud region the team actually deploys to before claiming it — don't assert it until it's confirmed)*.
3. **Human-in-the-loop** — complexity and risk signals auto-escalate to a Care Corner coordinator; no LLM-only decisions on care plans. **Autopilot is draft-then-confirm** (the user approves every action; only human-escalation bypasses confirmation — see §4 Beat 4).
4. **Traceable recommendations** — every recommendation links back to facts in the Living Care Profile (the "why this for you" tags); auditable, never hand-wavy.
5. **Bias monitoring** — pathway outputs sampled weekly; coverage across income tiers and conditions reviewed by Care Corner. **This is a post-launch governance commitment, not a feature running in the prototype** — don't imply a live dashboard exists today. *(Note: soften any hard "languages" claim — the demo is English-only; multilingual is real at the conversation layer but a config step for the UI. See the Q&A answer below.)*
6. **One click to human** — a coordinator is reachable from every screen; the family never has to ask twice.

> **Multilingual — the Q&A answer:** multilingual is essentially free in the architecture, not a
> bolt-on. The agent is an LLM, so the conversation already works in Mandarin, Malay, Tamil, or
> Singlish; the profile is structured data, so it's language-independent; and MyInfo can carry the
> senior's preferred language. The demo is English for clarity; productionizing means translating
> fixed UI strings and getting WhatsApp templates approved per language (WhatsApp supports a
> language code per template) — configuration, not re-engineering. **We haven't load-tested
> extraction quality across languages yet, so the honest claim is "the architecture supports
> it," not "it's already proven equally good in every language."** Care Corner's role is to
> review pathway quality across language groups once it's live — that's a post-launch check,
> not something to claim is already done.

---

## 8. What makes CareKaki different (five things, found together nowhere else)

1. **Living Care Profile** — built through conversation, never a form; it assembles itself as the family talks.
2. **Agentic Navigator** — reasons across schemes and services, not just retrieves them. A plan, not a search result.
3. **Why-this-for-you** — every recommendation explains itself in the family's own context, never generic copy.
4. **Warm Handover** — coordinators inherit the full Care Brief; families never repeat themselves on the next call.
5. **Responsible by design** — Guardian safety layer, no medical advice, PDPA-aware; a human is always one click away.

---

## 9. The vision

> **Excellent care already exists in Singapore. CareKaki is how families actually reach it.**
>
> Not a directory. Not a chatbot. An agent that listens, reasons, and operates the system on
> the family's behalf — so the people who need care don't have to navigate a system to
> receive it.

**1 front door · 5 services orchestrated (under one Guardian) · 0 forms to fill in.**

*(The deck's memorable "1 / 6 / 0" counted Guardian as the 6th. With Guardian reframed as the
wrapper, the honest count is 5 services. **Action item: open the actual deck file and count the
tiles on the relevant slide before demo day** — don't leave this as a documented tension; pick
one number and make every surface (deck, script, this doc, the UI) match it.)*

---

## 10. Voice & tone (how CareKaki should always feel)

- **Warm, human, reassuring** — it is a "care buddy," not a bureaucratic tool. ("Okay, that sounds stressful." / "I've been so worried." / "I'll keep you in the loop.")
- **Plain language** — no jargon thrown at the family; acronyms are handled *for* them, never *at* them.
- **Confident but honest** — it acts decisively (Autopilot) yet always keeps a human reachable and never over-claims (no medical advice).
- **Personalised, never generic** — everything ties back to *this* family's actual context.

---

*Anchors:* the pitch deck (`CareKaki_Demo_Deck`) and the demo script
(`docs/CareKaki_Demo_Script.md`). If any future work conflicts with the product intent
captured here, this document wins unless deliberately and explicitly revised.