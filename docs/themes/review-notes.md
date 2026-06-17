# CareKaki — Judge-Review Notes (2026-06-17)

> **What this is:** before we started building, we ran both spec docs through an adversarial
> "judge" pass — the kind of scrutiny a hackathon judge, a GovTech-savvy Q&A asker, or Care
> Corner themselves might apply. This file explains the *why* behind every change made to
> `product-source-of-truth.md` and `user-flows.md` in this commit, so anyone reviewing the diff
> doesn't have to take the edits on faith. Nothing here changes product intent — every fix either
> (a) closes a contradiction between the two docs, (b) softens a claim that isn't true yet, or
> (c) adds a fallback for something that could fail live. Read it next to the diff.

---

## Why this pass happened

Both docs were already strong: honest about what's real vs. simulated, and self-aware about a
few tensions (the "0 forms" vs. "filed with income docs" reconciliation, the 1/6/0 vs. 5+Guardian
count). The review pass looked for the *next* layer down — places where the docs assert something
as true that the build-gap table in `user-flows.md` §6 says isn't built yet, places where a claim
is strong enough that testing it live could backfire, and places where the demo's happy-path
choreography has no fallback if something doesn't cooperate on stage.

---

## Changes to `product-source-of-truth.md`

**§7 Guardian — added a build-status callout.**
The doc described Guardian as "an actual service... every CareKaki action flows through it." The
build-gap table in `user-flows.md` lists the Guardian service as entirely missing. That's not a
contradiction we should leave standing — it's the kind of thing a judge catches by asking "can you
show me Guardian intercepting something?" and getting silence. Fix: reworded to "designed as" /
"is meant to flow through it," and added an explicit build-status note pointing at the gap, so
nobody on the team accidentally claims it's live before it is.

**§7 Principle 1 (no medical advice) — tightened the boundary.**
"CareKaki suggests services, never diagnoses" doesn't actually resolve the ambiguity once the
product is recommending physio/rehab or a medication review — those read as clinical judgments.
Reworded to anchor the boundary in something defensible: CareKaki recommends *categories of
service already vetted by Care Corner's own intake criteria*, and never assesses severity or
treatment appropriateness itself. This is the line to hold in Q&A if a clinician on the judging
panel pushes on it.

**§7 Principle 2 (PDPA) — softened "PII never leaves the regional boundary."**
This was stated as fact with no tie to an actual deployment region. Changed to "designed so... —
verify before claiming it," because right now it's a design intent, not a verified property of
wherever the team ends up hosting the LLM calls.

**§7 Principle 5 (bias monitoring) — flagged as post-launch, not a prototype feature.**
"Sampled weekly, reviewed by Care Corner" sits in a list of things that otherwise describe the
prototype. Nothing weekly happens in a hackathon build. Added an explicit line marking this as a
governance commitment for after launch, so nobody asks to see a dashboard that doesn't exist.

**§7 Multilingual Q&A answer — hedged the cross-language parity claim.**
The original closed with "CareKaki isn't better in English than in Tamil" — a strong, untested
claim about LLM extraction quality, in a country where a judge could plausibly just switch
languages mid-Q&A and test it on the spot. Reworded to the defensible version: the architecture
supports multilingual conversation, but quality parity across languages hasn't been load-tested,
and that's a post-launch check, not a thing to claim is already proven.

**§6c Singpass delegation wrinkle — corrected the "Singapore has proxy/authorisation mechanisms"
claim.**
We checked this one specifically because it's exactly the kind of detail a GovTech-literate judge
would press on. There is no generic "delegate my Singpass to my caregiver" API for individuals —
what actually exists is service-specific: HealthHub's caregiver-link model for Healthier SG
enrolment, or the next-of-kin / Lasting Power of Attorney route required to check government
benefits on someone else's behalf when they can't do it themselves. CareKaki's flow models that
*pattern*, not a real integration. Reworded the doc to say this plainly, and to commit the team to
admitting (if asked) that the delegation mechanism is simulated.

**§6 Architecture (Kubernetes claim) — marked as target-state.**
"Kubernetes-orchestrated... each service independently deployable" was written in the present
tense for "technical judges," but no k8s manifests exist in the build-gap table. Relabeled the
properties as target architecture and added a status note: say "designed for," not "running on,"
unless a cluster actually exists by demo day.

**§4 Beat 4 — flagged the "Aunty Mei" placeholder name.**
Small but real: Care Corner will be in the room when this plays. If "Aunty Mei" is a fictional
placeholder rather than an actual coordinator, presenting it as if real (or vice versa) is an
easy, avoidable awkward moment. Added a note to confirm with Care Corner before demo day rather
than discovering the answer live.

**§9 Vision footnote — turned the punted "1/6/0 vs 5" tension into an action item.**
The original said "keep whichever number the deck uses consistent" without resolving it — which
means the deck (an asset outside these two files) might still literally show six tiles while the
spoken narrative says five. Added an explicit action item: go open the deck and count, then make
every surface match.

---

## Changes to `user-flows.md`

**§0 — added a build note on Singpass/MyInfo sandbox setup time.**
§6b gives WhatsApp a precise, well-researched demo-vs-production timeline. Singpass/MyInfo has no
equivalent — we don't actually know how long sandbox setup takes for this specific team. Given
Stage 1 is one of the two biggest remaining build items, this is worth verifying now rather than
discovering a multi-day registration delay close to the deadline.

**§1 Integration legend — clarified the polyclinic/medication row.**
The legend listed "polyclinic / medication" as a simulated tag "in these flows," but the locked
decision elsewhere in the doc explicitly excludes medication review from Autopilot (it's
pathway-only). Added a parenthetical so the table doesn't imply an Autopilot integration that
doesn't exist.

**§6 Build-gap table — flagged the mode-fork row as the top risk.**
This is the single most important reconciliation in the whole review: `product-source-of-truth.md`
insists the two modes "must be genuinely distinct," but this table already says mode is currently
"a label only" downstream. Both statements were true and neither was wrong — but burying the gap
in a routine table row undersold how much the entire "reads the room" beat (the most differentiated
part of the pitch) depends on closing it. Marked it explicitly as a P0 risk and pointed at the
reordered build order below.

**§7 Suggested build order — moved the mode fork up, made the Claude swap explicitly optional.**
The original order put "mode fork made genuine" at step 7 of 8 and the Claude-on-Vertex swap last.
But the mode fork is the mechanic behind the strongest demo beat — if time runs out, step 7 is
exactly what gets cut. Moved it into step 3, right where session/seeding work is already
happening, since it's cheap relative to the Autopilot backend that follows. Also relabeled the
Claude swap as optional/best-effort with an explicit fallback instruction: if it doesn't land in
time, the team demos on Gemini and drops "Claude Sonnet 4.6" from talking points rather than
letting anyone imply a swap happened on stage if it didn't.

**§9 (new) — added a contingency plan.**
Section 8's run-of-show is entirely happy-path: no fallback is documented for the Singpass sandbox
being slow, WhatsApp failing to send, the Calendar invite lagging, or the venue's Wi-Fi acting up.
Added a short fallback table so these are pre-agreed team plays, not improvised recoveries in
front of judges. Also flagged two timing/scope risks directly: the Mr Lim "re-run" is allocated
two minutes for a journey that took Mdm Tan roughly six, which only works if it's an intentional
fast-forward — so the doc now says to decide and rehearse that cut explicitly. And since both
personas are currently hardcoded to their demo modes, added a recommendation to informally test
the underlying engine against a made-up third scenario before demo day, so the team knows (rather
than discovers live) whether a judge improvising in Q&A would break it.

---

## What we deliberately left unchanged

A few things came up in the review that we chose not to edit, to keep this diff small and because
they're lower-stakes than the items above:

- The repeated "not a directory, not a chatbot" framing in §1, §2, and §9 of
  `product-source-of-truth.md`. It's redundant as a *document*, but it's intentional repetition
  for pitch-script consistency, and de-duplicating it would touch a lot of unrelated lines for a
  purely stylistic gain.
- No attempt was made to actually fix the underlying build gaps (Guardian doesn't exist, k8s
  manifests don't exist, the mode fork isn't wired). This pass only makes sure the *spec* doesn't
  overclaim ahead of that engineering work — the work itself is still tracked in `user-flows.md`
  §6 and §7 exactly as before, just reordered.

---

*If this file conflicts with how the team actually decides to handle any of the above, the two
source docs win — update them and treat this file as a historical record of one review pass, not
an ongoing source of truth.*