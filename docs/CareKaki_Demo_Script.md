# CareKaki — 5-Minute Demo Script
**12 slides. About 5 minutes.** Pitched to be spoken, not read.

Stage directions in `[brackets]`. Times are running total. Pauses matter — don't try to fill the silence.

---

## Slide 1 — Title  ·  `0:00 – 0:15`

`[Slide 1 — "CareKaki. Your care buddy that knows where to start."]`

Singapore has some of the best community care in the world.

But ask any family what happens the day after a hospital discharge, and you'll hear the same thing — nobody knows where to start.

That's why we built CareKaki.

---

## Slide 2 — The Problem  ·  `0:15 – 0:40`

`[Advance to slide 2.]`

Here's the thing. Singapore doesn't have a care shortage. We have a navigation shortage.

There are over a dozen agencies, each with their own forms, their own hotlines, their own eligibility rules. Families aren't failing because help doesn't exist. They're failing because nobody helps them figure out what's right for them.

One caregiver we spoke to said it best: "The system isn't broken. It's invisible."

---

## Slide 3 — What CareKaki is  ·  `0:40 – 1:00`

`[Advance to slide 3 — landing page mockup.]`

CareKaki is what we've been building with Care Corner Singapore. One front door, two ways in.

If you're a senior, you tap "for myself." If you're caring for someone, "for someone I care for."

That's the only choice we ever ask on day one. Everything after that adapts. Let me show you the caregiver flow first.

---

## Slide 4 — A conversation, not a form  ·  `1:00 – 1:40`

`[Advance to slide 4 — chat + Living Care Profile.]`

So this is Wei Ling. Her mum, Mdm Tan — she's 78 — just had a fall and got discharged this morning. Lives alone. Wei Ling works full-time, two kids, and she's overwhelmed.

She opens CareKaki. No forms, no dropdowns. She just talks.

`[Gesture to the right panel.]`

But watch the panel on the right. Every detail she mentions, CareKaki is quietly assembling into what we call a Living Care Profile. Age. Living situation. Mobility. Caregiver context. Even financial tier.

Nothing here was asked in a form. It all came out of the conversation. Four turns in, and CareKaki already has enough to act.

---

## Slide 5 — Not a list. A plan.  ·  `1:40 – 2:10`

`[Advance to slide 5 — four-column pathway.]`

And this is what it gives her. Mdm Tan's care pathway. Not a list — a plan, grouped by when things need to happen.

Get her home safely this week. Ongoing care over the next two months. Financial support she actually qualifies for. And one coordinator to pull it all together.

`[Point to a green tag.]`

See these little green tags? Every recommendation tells you *why* it's there. "Lives alone post-discharge." "Income within tier." That's reasoning Wei Ling can actually trust.

And when a case is this complex, CareKaki offers a warm handover. Let's say yes.

---

## Slide 6 — Autopilot  ·  `2:10 – 2:55`

`[Advance to slide 6 — dark Autopilot screen.]`

Okay, this next part is the moment I love.

This is CareKaki Autopilot. A normal AI tool would generate a checklist for someone else to go and do. Autopilot just does it. Six services, in parallel, right now.

`[Gesture across the cards.]`

It's filing the Home Caregiving Grant with AIC — discharge summary, NRIC, income docs, all auto-attached. Booking a home nurse for Tuesday morning with HomeNursing.sg. WhatsApping Wei Ling a plain-English summary, and honestly, just reassuring her. Routing the case to the least-loaded ICCP coordinator — that's Aunty Mei — with the full Care Brief preloaded. A medication review at the polyclinic. And the whole thing's running under our Guardian safety layer.

So when Aunty Mei calls tomorrow morning, she already knows everything. Wei Ling never has to repeat herself.

---

## Slide 7 — Same engine. A different plan.  ·  `2:55 – 3:20`

`[Advance to slide 7 — Mr Lim's phone + comparison rows.]`

Quick switch. Same engine, different person.

This is Mr Lim, 72. Same fall, same discharge. But his kids are overseas, and that changes everything.

The plan CareKaki builds for him is completely different. Silver Support instead of Home Caregiving Grant. Active Ageing Centre, because the real risk here is loneliness. Weekly check-ins, since there's no family in the room. And the WhatsApp thread? It goes to his daughter in London.

Same intent, different context. CareKaki reads the room.

---

## Slide 8 — Architecture  ·  `3:20 – 3:50`

`[Advance to slide 8 — layered architecture diagram.]`

Quick look under the hood. CareKaki is cloud-native, top to bottom.

`[Gesture down the diagram.]`

Three client surfaces — web, mobile, WhatsApp — all coming in through one API gateway. Five microservices behind it, each independently deployable: Conversation, Profile Builder, Pathway Reasoner, Autopilot, and Handover.

The agent itself sits in the middle — an LLM that reasons and uses tools, wrapped by Guardian. And underneath, we plug into the real systems: AIC, Home Nursing, the ICCP coordinator pool, WhatsApp Business.

Everything's Kubernetes-orchestrated, containerized, API-first. Standard cloud-native stack, nothing exotic.

---

## Slide 9 — Responsible AI  ·  `3:50 – 4:15`

`[Advance to slide 9 — six Guardian principles.]`

And that Guardian layer I keep mentioning — it's not a prompt instruction. It's an actual service. Six things it does.

`[Gesture across the cards.]`

No medical advice — clinical questions get routed to a human. PDPA-aware at ingest, so personal data never leaks. Human-in-the-loop on anything risky. Every recommendation traceable back to a real fact in the profile. Bias monitoring, reviewed weekly with Care Corner. And a coordinator one click away from every screen.

We didn't bolt safety on. We built it in.

---

## Slide 10 — What makes CareKaki different  ·  `4:15 – 4:35`

`[Advance to slide 10 — five-card grid.]`

So — five things you won't find together anywhere else.

A profile built through conversation, not forms. A navigator that actually reasons, instead of just retrieving links. A "why this for you" explanation on everything. A warm handover that briefs the coordinator for the family. And Responsible AI as a service, not a slogan.

---

## Slide 11 — The vision  ·  `4:35 – 4:55`

`[Advance to slide 11 — pull quote + 1 / 6 / 0 stats.]`

Look. Excellent care already exists in Singapore. CareKaki is just how families actually reach it.

Not a directory. Not a chatbot. An agent that listens, reasons, and operates the system on a family's behalf.

One front door. Six services running in the background. Zero forms to fill in.

---

## Slide 12 — Thank you  ·  `4:55 – 5:00`

`[Advance to slide 12.]`

Thank you.

---

## Presenter notes

A few things to keep in mind when you deliver this:

- **Total runtime is about 5:00 at a normal speaking pace.** Don't rush. The script's tight enough that you can breathe between sentences without going over.
- **Slides 4 and 6 are where you want to slow down.** Those are the two beats where judges actually *get* what CareKaki is. Everywhere else, keep moving.
- **Slides 8 and 9 are your credibility moments with the Dell technical judges.** Hit the words clearly: cloud-native, microservices, API-first, Kubernetes, Responsible AI. Don't mumble through them.
- **Slide 6 is fun to deliver.** The "I love this part" line is real — let it land. If you sound a little excited, that's good.
- **On slide 12, just say "thank you" and stop.** Don't add a sentence about questions or thanking the judges by name. Trust the silence.
- **If you're running long mid-pitch:** cut the per-column tour on slide 5 (just gesture at the four sections instead of naming them) — buys you about 10 seconds.
- **If you're running short:** add a beat after the caregiver quote on slide 2, and after "we built it in" on slide 9. Both lines hit harder with a pause.
