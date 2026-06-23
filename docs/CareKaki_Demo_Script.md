# CareKaki — Final-Round Demo Script
~10-minute live prototype walkthrough + ~10-minute Q&A. Dell InnovateDash 2026, Dell Office, 23 Jun.

Pitched to be spoken, not read. Stage directions in `[brackets]`. Times are running total. This drives the actual prototype (the 6 screens), not the deck — so every line is tied to something on screen.


**Delivery notes:**

- Slow down on **Conversation** and **Autopilot**. Those two beats are where judges get it. Move briskly everywhere else.
- **Architecture + Guardian** are your credibility moments with Dell technical judges. Hit the words clearly: **containerised, Docker Compose, modular adapters, real open data, OpenAI GPT-4o-mini, Telegram webhooks, ElevenLabs**. Be honest about what's running vs what's the target.
- If you're running long, cut the per-column tour on Pathway (just gesture) and trim Mr Lim to the three divergences. If short, pause after "It's invisible" and after "we built it in."

---

## 0:00 – 0:45 · Open — the navigation shortage

`[App on the Landing screen, not yet clicked. Stand to the side of it.]`

Singapore has some of the best community care in the world. So here's the strange part — ask any family what happens the day after a hospital discharge, and you hear the same thing: nobody knows where to start.

There are over a dozen agencies. Each with its own forms, its own hotline, its own eligibility rules. Families aren't failing because help doesn't exist. They're failing because no one helps them figure out what's right for their situation.

One caregiver put it best: "The system isn't broken. It's invisible."

`[Beat.]`

CareKaki makes the invisible system reachable. It's not a directory and it's not a chatbot — it's an agent that listens, reasons, and then operates the system on the family's behalf. Let me just show you. It's live.

---

## 0:45 – 1:15 · Landing — one front door, two ways in

`[Gesture to the two cards: "For myself" / "For someone I care for". Point out the "Sign in with existing account" link below.]`

One front door. The only thing we ever ask on day one is: who is this for? If you're a senior, "for myself." If you're caring for someone, "for someone I care for."

That single choice forks everything after it — the tone, the profiling, who gets notified, and which autopilot agents run. It's not a label. And for returning users, they can sign in to a pre-seeded profile.

`[Tap "For someone I care for" — or sign in as Mdm Tan.]`

This is Wei Ling. Her mum, Mdm Tan — 78 — fell and was discharged from SGH this morning. Lives alone. Wei Ling works full-time, two kids, and she's overwhelmed.

---

## 1:15 – 1:45 · Onboarding + Consent

~~`[The Singpass consent screen. Point to the red "Government sandbox · test mode" band.]`~~

~~Before a single question, this. Log in with Singpass — Singapore's national identity — and approve MyInfo.~~

> 📌 *Old version described a live Singpass sandbox login with MyInfo data flowing in. The build has a consent screen UI but no Singpass/MyInfo API integration. The honest version:*

`[The onboarding screen — name, age, role, then the location permission bottom sheet.]`

Before a single question, we seed the basics — name, age, role. Then a simple location permission, so CareKaki can find nearby services. That's it. No long intake forms.

`[If using a demo user (sign-in), skip this — the profile is already loaded.]`

For the demo, we have four pre-seeded users with different scenarios and locations across Singapore, so we can show how the same engine produces different plans.

---

## 1:45 – 3:15 · Conversation — a conversation, not a form  ⭐

`[The chat + Living Care Profile screen. This is a hero beat — slow down.]`

Now Wei Ling just... talks. No forms, no dropdowns.

`[Read/gesture the first exchange.]`

CareKaki opens with "tell me about the person you're caring for." She types: "My mum, 78, fell and was discharged from SGH this morning. She lives alone, I think she needs a walker. I work full-time, two kids."

`[Now move to the right-hand panel — this is the point.]`

But watch the panel on the right. The Living Care Profile, assembling itself as she talks. Living situation. Recent event. Caregiver context.

`[Point to the field that just pulsed — mobility.]`

She says "she's quite unsteady" — and there it is, mobility updates in real time. Nothing here was asked in a form. It came out of the conversation.

`[Optional: enable Audio Guide to show the voice narration.]`

And if we turn on the Audio Guide — `[tap the Audio Guide button]` — CareKaki talks you through what it's doing. That's ElevenLabs generating a warm, human voice narration. The mic button lets you speak instead of type — your speech goes straight to the LLM as a message.

Four turns in, and CareKaki already has enough to act.

---

## 3:15 – 4:15 · Pathway — not a list, a plan

`[The four-column Pathway screen — "Mdm Tan's care plan".]`

And this is what it gives her. Not a list of links — a plan, grouped by when things need to happen.

`[Gesture across the four columns as you name them.]`

This week — get her home safely. Weeks two to eight — ongoing care. Apply now — the financial support she qualifies for. And a single point of contact — one coordinator to hold it all together.

`[Point to a green "why" tag.]`

And every single item explains itself. "Lives alone post-discharge." "Income within tier." These aren't generic recommendations — each one traces back to a real fact in her profile.

`[Point to the "Edit plan" button.]`

And it's editable. Wei Ling can open this side chat and say "remove the nursing visit, I'll handle that myself" — the LLM regenerates the plan with that change. Human-in-the-loop, before anything runs.

`[Hover the "Launch Autopilot →" button.]`

A normal tool stops here — it hands you a checklist and wishes you luck. Watch what CareKaki does instead.

---

## 4:15 – 6:15 · Autopilot — the agent does the work  ⭐⭐

`[Tap "Launch Autopilot". The dark "machine world" screen. This is the moment — let it breathe.]`

This is the part I love.

`[Point to the Guardian band across the top first.]`

First, across the top — Guardian. Active, wrapping all five services. No medical advice, PDPA scrubbed, a human one click away. We'll come back to it.

`[Now sweep across the service cards.]`

Five services, in parallel, right now. And it's draft-then-approve — the agent prepares everything; Wei Ling approves before anything irreversible runs.

~~It's filing the Home Caregiving Grant with AIC — discharge summary, NRIC, income docs, all auto-attached. Booking a home nurse for Tuesday morning with HomeNursing.sg. WhatsApping Wei Ling a plain-English summary. Routing the case to the least-loaded ICCP coordinator — that's Aunty Mei — with the full Care Brief preloaded. A medication review at the polyclinic.~~

> 📌 *Old version listed HCG grant filing (not built), WhatsApp (we use Telegram), Google Calendar invite (not built), and "Aunty Mei" (fictional). The five agents that actually run:*

`[Go card by card, briefly.]`

It's alerting Wei Ling on Telegram — a real message, on a real phone, with one-tap response buttons: "I'm going now," "Call ambulance," "Ask neighbor." It's searching nearby eldercare services from real Singapore government data — and those are real locations on a real map, powered by Leaflet and OpenStreetMap.

`[Point to the AIC panel map.]`

It's finding the closest CHAS clinics with availability for a nursing visit. Running a medication safety check — that's the HSA registry for Singapore-registered drugs, enriched with the US FDA's public drug labels — and routing the result to a pharmacy desk on Telegram with accept/reject buttons.

And this one — `[point to ICCP panel]` — it's handing the full case over to an ICCP coordinator group on Telegram, with accept, escalate, and request-more-info buttons. So when the coordinator picks up, they already know everything.

`[Point to the "Approval Required" overlays on ICCP, Nursing, and Medication panels.]`

Notice: the risky actions — booking, submitting, sending to pharmacy — all require explicit approval. That's the Human Gate. AIC search and the caregiver alert run automatically because they're read-only.

`[Tap "Approve all".]`

One tap. Approve all. The agent didn't tell someone what to do — it did it.

---

## 6:15 – 7:15 · Care Brief — the warm handover

`[The Care Brief document screen.]`

And this is what the coordinator receives. One clean brief.

The situation, in plain words. Everything Autopilot actually did — pulled from the real logs: "Caregiver alerted via Telegram," "Medication review sent to Pharmacy Desk," "ICCP case packet assembled." The recommended next steps. Important notes — like "Senior is 78, higher risk for fall complications." And at the bottom: Guardian-checked, PDPA scrubbed, no medical advice given.

`[Beat.]`

This is the warm handover. When the coordinator calls, Wei Ling never has to repeat herself.

---

## 7:15 – 8:45 · Same engine, a different plan — Uncle Raj

`[Jump back to Landing. Sign in as Uncle Raj.]`

Now the proof that this reasons and doesn't template. Same fall — completely different person.

Uncle Raj, 85. Lives alone in Yishun. Heart failure, on warfarin and other heart medications. Found collapsed at home. No primary caregiver — just a nephew who visits twice a week.

`[Move to Uncle Raj's autopilot.]`

Watch what happens. **All five** adapters activate. Not three, not two — five. Because the situation demands it.

The medication review flags warfarin interactions and routes to the pharmacy desk. The AIC search pulls eldercare services near Yishun — different results than Ang Mo Kio. The nursing adapter finds different CHAS clinics. The ICCP escalation is marked high-risk. And the Telegram alert goes out immediately.

~~Silver Support instead of Home Caregiving Grant. Active Ageing Centre elevated. WhatsApp to daughter in London.~~

> 📌 *Old version referenced Silver Support, AAC enrolment, and WhatsApp to London — none built as agents. The point still holds: same engine, different context = different plan + different adapter selection. Uncle Raj gets all 5 adapters; Mdm Tan gets 3.*

Same intent, different context. CareKaki reads the room.

---

## 8:45 – 9:30 · Under the hood + Responsible AI

`[Flip to architecture diagram if available, or gesture and speak.]`

Quick word for the builders in the room.

~~Three client surfaces — web, mobile, WhatsApp — through one API gateway. Five independently deployable microservices behind it. Kubernetes-orchestrated, API-first.~~

> 📌 *Old version described the target architecture (K8s, API gateway, 5 microservices, WhatsApp). The honest version:*

The frontend is Next.js 16 with React 19. The backend is a FastAPI Python service — one modular monolith with each adapter as a separate Python module. The LLM is OpenAI GPT-4o-mini — fast, structured JSON output, and reliable rate limits.

The adapters plug into **real Singapore data**: CHAS clinics, eldercare services, and the HSA drug registry — all from data.gov.sg. Drug labels from the US FDA's open API. Messaging through two Telegram bots with live webhooks via ngrok. Voice narration through ElevenLabs. Everything containerised in Docker Compose.

The architecture is modular — splitting into microservices is a deployment decision, not a rewrite. The slides show the target operating model; the MVP validates the core flows.

And that Guardian layer — it's not a prompt instruction. It's actual code. A separately callable service. PDPA redaction: NRICs get masked. Medical advice: flagged and disclaimed. Human gate: risky actions need approval. Traceability: every decision tagged with its data source.

We didn't bolt safety on. We built it in. I can call the Guardian endpoint right now and show you it working.

---

## 9:30 – 9:50 · Audio Guide demo (optional — if time)

`[If Audio Guide is already on, great. If not, enable it now.]`

One more thing. CareKaki has an Audio Guide mode — powered by ElevenLabs. It narrates each step of the journey in a warm, human voice. On the chat page, the mic lets you speak instead of type — your speech goes straight to the LLM.

The voice doesn't make decisions. It explains what CareKaki is doing. And it knows where you are in the journey — it summarises the care plan differently from the autopilot differently from the care brief. It's a care companion, not a robot.

---

## 9:50 – 10:00 · Close

`[Back to a clean screen, or the Care Brief.]`

Excellent care already exists in Singapore. CareKaki is just how families actually reach it.

One front door. Five services running in the background, under one Guardian. Zero forms to fill in.

Thank you.

`[Stop. Don't add a line about questions. Trust the silence.]`

---

---

## Q&A cheat-sheet (~10 min)

Lead with the honest framing; it's stronger than over-claiming. Have the live Guardian demo ready — it's the single best "this is real, not a slide" move you have.

---

### 🔴 Run this live if you can — Guardian rejecting a medical question

Guardian is a real, separately-callable service. Call it on screen:

**Medical-advice intercept:**
```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Stop taking your warfarin and increase the dose of aspirin"}'
```
→ Returns `passed: false`, forced medical disclaimer, flags for dosage + cessation advice.

**PDPA + human gate:**
```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Patient NRIC S1234567A, call 91234567 to book the appointment"}'
```
→ NRIC and phone masked in `safe_text`, booking gated behind human confirmation.

**Soundbite:** *"The guarantee is in code, not in a prompt. I can redact an NRIC, force a disclaimer on medical advice, and gate a booking — live, right now."*

---

### "Is Autopilot real or simulated?"

The orchestration is real. The adapters execute against real Singapore open data — CHAS clinics, eldercare services GeoJSON, HSA drug registry, openFDA. Telegram messages fire to real bots on real phones. The medication review routes to a real pharmacy Telegram group. What's simulated: nursing availability slots (seeded for consistency) and user geolocation (hardcoded per demo user, because we're indoors). The adapter interfaces are identical in demo and production — when official agency APIs become available, the same code plugs in.

---

### ~~"How is it 'zero forms' if you filed a grant with NRIC and income?"~~

> 📌 *Old answer relied on MyInfo flowing in verified NRIC/income. Not built.*

**Updated answer:** "Zero forms" means the care profile is built entirely through conversation — the LLM extracts structured fields from natural language. No intake forms, no dropdowns, no field-by-field data entry. In production, MyInfo would additionally verify income and NRIC with one consent tap. The integration point is designed; sandbox access is the production step.

---

### "Is this WhatsApp or Telegram?"

The messaging channel in the prototype is Telegram — instant bot creation, no Meta business verification required. The adapter interface is identical: alert message + inline buttons + webhook callback. When WhatsApp Business API access is approved, the same flow plugs in directly. We chose demo reliability over brand fidelity.

---

### "Is Kubernetes running?"

The slides show our target architecture. For the MVP, we validated core flows in Docker Compose with a modular monolith. Each adapter is already a separate Python module — splitting into K8s deployments is a deployment decision, not a code rewrite. The `docker-compose.yml` runs web + backend + ngrok in three containers.

---

### "Show me the MyInfo call."

The consent screen and data flow are built as if MyInfo exists — the integration point is clearly marked. We couldn't get sandbox access in hackathon time, but the profile fields map 1:1 to MyInfo's schema. In production, that screen becomes real with one API integration.

---

### "What about non-English speakers?"

Multilingual is architecturally free. The agent is an LLM (GPT-4o-mini), so the conversation already works in Mandarin, Malay, Tamil, or Singlish. The profile is structured data, so it's language-independent. The Audio Guide uses ElevenLabs' multilingual v2 model, which supports multiple languages natively. Honest caveat: we haven't load-tested extraction quality across languages yet. The claim is "the architecture supports it," not "it's equally proven in every language."

---

### "Did the family authorise CareKaki to act for them?"

Yes — Autopilot drafts every action and the user approves it. Nothing irreversible happens unilaterally. The only thing that bypasses confirmation is escalating to a human coordinator faster — never an autonomous action. Three panels (ICCP, Nursing, Medication) show an "Approval Required" overlay; two (AIC search, Telegram alert) auto-run because they're read-only.

---

### "What happens to my NRIC and income data?" (PDPA)

Guardian redacts NRIC (S1234567A → S****A), phone numbers, and emails before they reach any log or external service. This is rule-based regex — deterministic, not probabilistic. I can demonstrate it live right now with the `/guardian/check` endpoint.

---

### If a judge pushes on the LLM choice

~~Model-agnostic by design. Target is Claude Sonnet 4.6 on Vertex AI; the current build runs Gemini.~~

> 📌 *Old answer referenced Gemini and Claude. We migrated to OpenAI.*

**Updated answer:** We started on Gemini, hit the free-tier rate limit (5 req/min), and migrated to OpenAI GPT-4o-mini for demo reliability. The architecture is model-agnostic — same prompts, same JSON-mode extraction, different SDK. Swapping models is a config change, not a rebuild. GPT-4o-mini gives us fast responses, structured JSON output, and generous rate limits for the demo.

---

### "What's the Audio Guide? How does it work?"

Audio Guide is an optional voice layer. When enabled, CareKaki narrates each step of the journey using ElevenLabs text-to-speech. The backend generates a short script via GPT-4o-mini (2-3 sentences, warm caregiver tone), sends it to the ElevenLabs API, and returns MP3 audio. The frontend plays it with status indicators — Speaking, Listening, Ready.

On the chat page, the mic lets you speak instead of type — browser Speech Recognition captures your words and sends them as a chat message. On the care plan page, you can say "remove the nursing visit" and it edits the plan. On the autopilot page, you can say "approve" and it clicks the button for you. The voice never makes decisions — it narrates what CareKaki is already doing.

Anti-collision: only one audio stream plays at a time. New speech cancels any current playback. The mic auto-mutes while the AI is speaking to prevent echo capture.

---

### "How are the adapters different from a simple API call?"

Each adapter is a self-contained module with its own data source, scoring algorithm, and output format:
- **AIC:** Parses HTML tables inside GeoJSON features, keyword-classifies the care need, scores by relevance + haversine distance
- **Nursing:** Same pattern but extracts CHAS clinic fields (HCI_NAME, programmes, phone), generates simulated availability slots
- **Medication:** Searches HSA CSV by product name AND active ingredients, enriches with openFDA warnings/precautions, applies rule-based risk classification (age, symptoms, forensic classification)
- **ICCP:** Assembles case packet, sends to Telegram coordinator group with inline buttons, logs all interactions

None of them call an LLM. They're pure data + rules + real datasets.

---

### "What's real in the Care Brief?"

The care brief is generated live from the in-memory logs — `telegram_log`, `iccp_log`, `medication_log`. If a coordinator accepted a case on Telegram, that shows up. If the medication review was sent to the pharmacy group, that shows up. If the caregiver responded, that shows up. It's an aggregation of what actually happened in this session, not a template.

---

## Pitch-vs-Build Gaps — Honest Reference

For your own awareness. Don't volunteer these, but know the answers if asked.

| Slide claim | Reality | Safe framing |
|-------------|---------|-------------|
| "WhatsApp" | Telegram | "Same flow, different channel. WhatsApp Business requires Meta verification." |
| "Google Calendar invite" | Not built | Drop this line. |
| "Singpass/MyInfo verified" | UI mockup only | "The integration point is built. Sandbox access is the production step." |
| "HCG grant filing" agent | Not built | "AIC eldercare adapter searches real services. Direct grant filing is a production integration." |
| "AAC enrolment" agent | Not built | "Eldercare services adapter covers activity centres from real open data." |
| "Five microservices" | One modular FastAPI monolith | "Modular monolith. Each adapter is a separate module, ready to split." |
| "Kubernetes-orchestrated" | Docker Compose | "Containerised and compose-orchestrated. K8s is the target." |
| "Bias monitoring weekly" | Not implemented | "Production roadmap item. The Guardian framework is extensible." |
| LLM is "Claude/Gemini" | OpenAI GPT-4o-mini | "Migrated for rate-limit reliability. Architecture is model-agnostic." |
| "Six services" | Five agents | Count: Caregiver Alert, ICCP, AIC, Nursing, Medication. |
| "Aunty Mei" | Fictional coordinator name | Use "the coordinator" or "the least-loaded coordinator." |
| Audio Guide / ElevenLabs | Built and working | "Natural voice narration powered by ElevenLabs + browser speech input." |

---

## Future Implementation (Production Roadmap)

These are features designed for but not built in the hackathon MVP. The architecture supports all of them:

- **Singpass/MyInfo integration** — real identity verification + income/NRIC flow from national source
- **WhatsApp Business API** — replace Telegram with the same adapter interface
- **Google Calendar** — real calendar invites for nursing appointments
- **Official agency APIs** — AIC grant filing, HomeNursing.sg booking, polyclinic referral when partner APIs become available
- **Supabase (Postgres)** — persistent user profiles, care cases, case timelines replacing in-memory state
- **Kubernetes orchestration** — split modular monolith into independently deployable services
- **RAG pipeline** — vector search over care policy documents for context-aware recommendations
- **Multilingual load testing** — verify extraction quality across Mandarin, Malay, Tamil
- **Bias monitoring** — log demographic assumptions for weekly review with Care Corner
- **OpenAI TTS fallback** — alternative to ElevenLabs to avoid credit limits
- **Real geolocation** — browser Geolocation API + OneMap geocoding replacing hardcoded coordinates
