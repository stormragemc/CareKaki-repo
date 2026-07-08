# PROMPT: CareKaki × AiMao UI Redesign

Copy everything below this line into your coding LLM.

---

You are redesigning the frontend UX of the existing CareKaki application in this repository.

==================================================
SECTION 0 — GROUND TRUTH ABOUT THIS REPOSITORY (READ FIRST)
==================================================

Do not guess any of this. It has been verified:

**Stack:** Next.js 16.2.6 (App Router) · React 19.2.4 · TypeScript · Tailwind CSS v4 · lucide-react icons · Leaflet (maps only). Backend is FastAPI in `backend/` — DO NOT TOUCH the backend.

**CRITICAL — Next.js 16 has breaking changes vs. your training data.** Before writing ANY Next.js code, read the relevant guides in `node_modules/next/dist/docs/`. Heed deprecation notices. Do not write from memory.

**CRITICAL — Tailwind v4 is CSS-first.** There is no `tailwind.config.js`. Design tokens are defined with `@theme` in `app/globals.css`. Put all new AiMao color/radius/font tokens there. Print styles use the `print:` variant plus `@media print` blocks in `globals.css`.

**Route map (real paths — use these, do not invent routes):**

| Experience | Real location |
|---|---|
| Home / landing | `app/(main)/page.tsx` + `components/landing/` |
| Chat | `app/(main)/chat/` + `components/chat/` (ChatPanel, ChatMessage, ChatInput, LiveCareProfile) |
| Care Plan (currently called "Pathway") | `app/(main)/pathway/` + `components/pathway/` (PathwayBoard, PathwayColumn, pathwayData.ts) |
| Care Brief (currently called "Handover") | `app/handover/page.tsx` |
| Autopilot (the 5 services) | `app/autopilot/page.tsx` + `components/autopilot/` (AgentWorkspace, AICFeed, ICCPFeed, MedicationFeed, NursingFeed, TelegramFeed, WorkspaceLog, WorkspacePanel, MiniMap) |
| Other routes | `app/onboard`, `app/consent`, `app/login`, `app/tutorial` |
| Shared UI | `components/ui/` (GuardianBand, FlowStepper, PrimaryButton, StatusPill, TalkToHuman, AudioGuideButton, …) |
| Global nav | `components/layout/Header.tsx` |
| Voice state | `contexts/AudioGuideContext.tsx` + `hooks/` (useAudioGuide, useVoiceEvent, useChatState) |

**Existing voice system — reuse it, do not rebuild it.** `AudioGuideContext` already tracks Speaking / Listening / Ready states, drives ElevenLabs TTS output and Web Speech API mic input, and auto-mutes the mic while the AI speaks. The AiMao character's `speaking` and `listening` expressions MUST be driven by this existing context — subscribe to it; do not create a parallel state system.

**No chart library is installed.** Do NOT add recharts/chart.js/d3. Build small, hand-rolled inline-SVG chart components (sparkline, weekly bars, simple radar). They are more reliable, print cleanly, and match the friendly aesthetic anyway.

**Icons:** use `lucide-react` (already installed). Add no new dependencies without a strong reason.

**Working rules:**
1. Inspect the files above before editing anything.
2. Preserve all existing backend integrations and API calls (`fetch` calls to the FastAPI backend).
3. Do NOT migrate frameworks or rewrite the app from scratch. Refactor incrementally.
4. Keep `components/ui/GuardianBand.tsx` and the safety/traceability UI visible where it appears — the Guardian responsible-AI layer is a core judged feature, not clutter.
5. The `app/autopilot` route must keep working at its URL with all its logic intact — it gets rebranded and demoted, never deleted.
6. Every phase (see Implementation Approach) must end with the app building and all core flows working. Run `npm run build` (or at minimum keep `npm run dev` error-free) before moving to the next phase.
7. Demo fixture data goes in ONE clearly-named file: `lib/demoCareData.ts` (seeded week of observations, adherence history, activity completions — clearly marked synthetic). Do not scatter mock data across components.

==================================================
SECTION 1 — VISUAL REFERENCE: THE AIMAO PANDA
==================================================

AiMao is a physical panda care-companion robot concept (image attached if your interface supports it). If you cannot see the image, this is the canonical description — build from it:

- **Head:** large, round, soft white/cream, with two solid-black hemispherical ears on top.
- **Face:** black panda eye-patches framing a dark rounded-rectangle screen — the screen IS the face (eyes and mouth are rendered on it).
- **Body:** charcoal/near-black rounded body, slightly barrel-shaped, with white front panel.
- **Front:** a small tray/table, and a panel of colored storage drawers — soft orange, warm yellow, gentle blue, muted green — used for medicines and supplies. A little note card on the tray reads e.g. "Don't forget to drink medicine, Ethan".
- **Character:** rounded everywhere, zero sharp corners, friendly, huggable, domestic.

Digital translation rules:
- The web app should feel like the software running ON AiMao's screen-face.
- The drawer colors become the app's four category accent colors.
- The note-card-on-tray becomes the visual metaphor for reminders/observations (small cream cards with a handwritten-feeling warmth, not toast notifications).
- Rounded-rectangle screen shape → large border radii everywhere.

==================================================
SECTION 2 — CONCEPT
==================================================

CareKaki is an AI-assisted elderly-care and healthy-longevity platform. AiMao is its friendly panda care companion. The physical hardware is not ready, so the CareKaki web app itself must feel like the digital personality and screen interface that would live inside AiMao.

Core line: **"AiMao is the face. CareKaki is the intelligence underneath."**

The app must stop feeling like an enterprise healthcare dashboard and instead feel: warm, friendly, conversational, playful, emotionally expressive, extremely easy to understand, appropriate for elderly users, visually simple, large and touch-friendly, reassuring rather than clinical.

Take inspiration from child-friendly digital products (clarity, large shapes, friendly characters, obvious actions, emotional expression) but it must NOT feel infantilising or patronising toward elderly users. Think: friendly companion device + Tamagotchi-like emotional warmth + modern healthcare accessibility + very simple senior-friendly UX.

**Personas (use consistently everywhere):** Mr Tan is the elder receiving care. Sarah is his daughter, the caregiver and primary app user.

==================================================
SECTION 3 — CORE PRODUCT PHILOSOPHY
==================================================

The new CareKaki revolves around conversation. The chatbot conversation is the emotional centre of the application. The user should always feel: "I can tell AiMao something."

Every major page must contain a visible, tempting, contextual invitation back to conversation:

- Home: "How has Dad been today?"
- Care Plan: "Want me to explain today's activities?"
- Care Brief: "Has anything changed since this summary?"
- On a detected change: "Ask me why I noticed this."
- On progress: "Tell me how today's activity went."

Constantly invite lightweight conversation without feeling intrusive.

==================================================
SECTION 4 — INFORMATION ARCHITECTURE
==================================================

Five major experiences:

1. HOME / AIMAO COMPANION — `app/(main)/page.tsx`
2. CHAT / CONVERSATION — `app/(main)/chat`
3. CARE PLAN — `app/(main)/pathway` (rename user-facing labels from "Pathway" to "Care Plan"; the route path may stay)
4. CARE BRIEF — `app/handover` (rename user-facing labels from "Handover" to "Care Brief")
5. EXPERT MODE / AIMAO'S MIND — `app/autopilot` (rebranded, demoted, never in primary nav)

Visible navigation (in `components/layout/Header.tsx`): **Home · Care Plan · Care Brief** only. AiMao conversation is always reachable via the global companion component (Section 7). Expert Mode is reachable only through a subtle secondary affordance (e.g. a small "How AiMao thinks" link in a footer/settings area, or an unobtrusive brain icon). Normal users should never need it.

==================================================
SECTION 5 — HOME PAGE: AIMAO AS THE MAIN CHARACTER
==================================================

Redesign Home around AiMao. The panda is visually dominant; the page must NOT begin with dashboard statistics.

Layout concept:

```
Good morning, Sarah

        [ LARGE AIMAO PANDA — idle animation ]

              Hi Sarah! 👋
        How has Dad been today?

         [ 🎙 Talk to AiMao ]
          or type something...
--------------------------------------------------
Today
  Dad seems mostly stable.
  One small change may be worth reviewing.
  [ Review with AiMao ]
--------------------------------------------------
Today's Care Plan
  Morning walk           Done ✓
  Chair exercise         3:00 PM
  Hydration reminder     5:00 PM
  [ View today's plan ]
```

Calm and spacious. Avoid: dense data grids, many tiny cards, technical terminology, complex navigation, overwhelming analytics. Use: large cards, generous whitespace, rounded corners, friendly illustration, large typography, clear hierarchy.

AiMao occasionally shows contextual greetings: "Good morning! How did Dad sleep?" · "Anything different today?" · "Tell me how lunch went." · "You did great keeping up with today's activities!"

==================================================
SECTION 6 — AIMAO CHAT: THE MAIN PRODUCT EXPERIENCE
==================================================

Redesign `components/chat/` around an expressive AiMao panda. It must not look like a generic ChatGPT clone. AiMao has a large visual presence during conversation.

**Build a reusable AiMao character in pure React + inline SVG + CSS animation.** No external avatar APIs, no Lottie, no new dependencies. Place it in `components/aimao/`.

Expression states (minimum):

1. **idle** — gentle smile, occasional blink, subtle breathing/float animation
2. **listening** — attentive wide eyes, slightly raised ears, subtle pulse → **bind to AudioGuideContext listening state**
3. **thinking** — curious expression, eyes glance up/sideways, gentle floating dots
4. **speaking** — friendly expression, simple cyclic mouth animation → **bind to AudioGuideContext speaking state**
5. **concerned** — soft empathetic eyebrows/eyes; never alarming
6. **happy** — small bounce, closed-happy eyes (^ ^); use on activity completion / progress
7. **sleepy** (optional) — droopy eyes for evening states

API:

```tsx
type AiMaoExpression =
  | "idle" | "listening" | "thinking" | "speaking"
  | "concerned" | "happy" | "sleepy";

<AiMaoCharacter expression="listening" size="lg" speaking={false} />
```

Expressions must be visibly different — vary eye shape, eye direction, eyebrows, mouth shape, cheek accents, head tilt, ear rotation, and body motion. Do NOT just swap an emoji next to a static panda. Animations gentle and slow (elderly-comfortable); honor `prefers-reduced-motion`.

Conversation UX example:

```
            [ AIMAO — listening ]
        "How has Dad been today?"

User: He didn't finish breakfast again and had to
      hold the table when standing up.

            [ AIMAO — thinking → speaking ]
  "I noticed two things that may be useful to remember."

   🍽 Nutrition — Reduced breakfast intake
   🚶 Mobility — Needed support while standing

  "Has the standing difficulty happened before today?"
     [ Yes ]  [ No ]  [ I'm not sure ]
```

Support: natural conversation, mic input (existing Web Speech wiring), typed input, speech output (existing ElevenLabs wiring), transcript, quick-response chips, contextual follow-ups.

Keep interactions lightweight. Target experience: open AiMao → talk 15–30 seconds → AiMao understands → maybe one useful follow-up → observation recorded → conversation ends naturally. A companion, not a medical form.

==================================================
SECTION 7 — GLOBAL CONVERSATION ENTRY POINT
==================================================

Create a persistent reusable `<AskAiMao />` component (in `components/aimao/`), rendered from the `(main)` layout / root layout so it appears on every major page.

Appearance: a floating small panda head bottom-right, OR a small contextual card with a mini AiMao expression + one line of copy + an "Ask AiMao" button. Copy changes per page context:

- Home: "How has today been?"
- Care Plan: "Want me to walk you through today's activities?"
- Care Brief: "Anything changed since this summary?"
- Change detection: "Want to know why I noticed this pattern?"
- Activity detail: "Would you like me to guide you through this step by step?"
- Expert Mode: "Want me to explain this process simply?"

Clicking always opens/returns to the AiMao conversation with the relevant page context passed along (e.g. a query param or context provider so chat can open with a contextual first message). Hide it in print styles.

==================================================
SECTION 8 — CARE PLAN: A REAL, PRINTABLE CARE DOCUMENT
==================================================

The current Pathway page is too thin (headings + short summaries). Rebuild it as a comprehensive, professionally prepared, **printable personal care document**. This page intentionally differs from the rest of the app: structured, trustworthy, calm, comprehensive, professional — a beautifully designed healthcare booklet, not a dashboard — while staying visually connected to AiMao (small friendly panda illustration on the cover header, same tokens).

Document structure:

**Cover/header:** "PERSONALISED CARE PLAN · Prepared for: Mr Tan · Prepared with: Sarah and AiMao · Last updated: {date}" + small AiMao illustration.

**Care Plan Summary:** full paragraphs (not bullets) explaining current priorities, e.g.: "This care plan focuses on maintaining lower-body strength, supporting regular nutrition, and monitoring recent changes in standing stability. Activities are designed to fit into Mr Tan's normal daily routine and can be supported by family members without specialised equipment." Include: main care priorities, current strengths, areas to monitor, weekly goals, caregiver involvement.

**Week at a Glance:** friendly visual weekly timetable (MON: morning walk, chair stands, hydration check · TUE: balance exercise, protein-rich breakfast, social activity · …).

**Activity sections — every activity gets full detail.** Never just "Chair Exercise — do 5 repetitions." Template per activity:

```
CHAIR STAND PRACTICE

Purpose: Supports lower-body strength and independence when
getting up from a chair, bed, or toilet.
Duration: 5–8 minutes · Frequency: 3×/week · Difficulty: Easy–Moderate
Equipment: Stable chair with armrests

HOW TO DO IT
1. Place the chair against a wall so it cannot move.
2. Sit near the front of the chair, both feet flat on the floor.
3. Lean slightly forward.
4. Push through both feet and stand slowly.
5. Pause 2 seconds after standing.
6. Sit back down slowly and with control.
7. Repeat per the prescribed repetition count.

CAREGIVER ROLE
Stand slightly beside the person, not directly in front.
Support only when needed. Never pull upward by the arms.

STOP AND REVIEW IF
dizziness · unusual chest discomfort · markedly more
instability than usual · unexpected pain

WHY THIS ACTIVITY IS INCLUDED
Plain-language explanation of why it is personally relevant
to Mr Tan (traceable to his profile).
```

Extend `components/pathway/pathwayData.ts` (or a new structured file) to carry these rich fields; source demo values from `lib/demoCareData.ts`.

**Visualisations** — hand-rolled inline SVG components in `components/careplan/` (remember: no chart library; do not install one). Only charts that answer real questions:

1. Weekly adherence chart — "Is adherence improving?"
2. Activity completion trend — "Which activities are frequently missed?"
3. Mobility-confidence trend — "Has mobility confidence changed?"
4. Care-domain overview (simple radar or bars) — "Which domain needs the most attention?"

Friendly and readable, no enterprise-BI aesthetics, no decorative charts.

**Print mode** — proper print CSS via Tailwind `print:` variants + `@media print` in `globals.css`:
- hide navigation, floating AiMao, all interactive controls
- keep headings, keep charts (inline SVG prints natively — this is why we hand-roll)
- sensible page breaks (`break-inside: avoid` on activity cards — keep each activity's instructions together)
- readable typography, A4-optimised
- Add a `[ Print Care Plan ]` button calling `window.print()`. Do NOT fake PDF export; browser print layout is the correct scope.

==================================================
SECTION 9 — CARE BRIEF: SHORT, SHAREABLE HANDOVER
==================================================

`app/handover/page.tsx`, relabelled "Care Brief". The Care Plan is detailed; the Care Brief is concise — a one-page handover document:

```
CARE BRIEF

RECENT CHANGES
• Reduced breakfast intake on 3 recent mornings
• Lower activity compared with recent baseline
• Difficulty standing reported twice

TIMELINE
MON  Reduced dinner intake
TUE  Activity below usual range
WED  Reduced breakfast intake
THU  Needed support standing

WHY AIMAO FLAGGED THIS
• appetite change repeated
• a new mobility change appeared
• changes occurred in the same short window
• pattern differs from personal baseline

WHAT MAY BE USEFUL TO DISCUSS
• when standing difficulty began · pain or dizziness ·
  recent appetite and hydration · recent medication changes

TRACEABILITY
Based on: 5 caregiver observations · 4 days of activity history

SAFETY  (keep GuardianBand visible here)
• No diagnosis generated · Human review required ·
  User controls external sharing

[ Edit ]  [ Review with AiMao ]  [ Copy ]  [ Share ]
```

==================================================
SECTION 10 — AUTOPILOT → AIMAO'S MIND (EXPERT MODE)
==================================================

`app/autopilot` becomes a background system. DO NOT delete any logic in `components/autopilot/` — all feeds, adapters, and Telegram wiring stay functional. Rebrand the page "AiMao's Mind" (or "How AiMao Thinks") and remove it from primary navigation; reachable only via the subtle expert affordance.

Philosophy — Normal user: "I told AiMao what happened. It remembered and helped me." Expert: "I want to inspect how CareKaki processed that information."

Expert Mode shows the pipeline:

```
Observation received → Signal extraction → Profile update
→ Longitudinal comparison → Change detection
→ Guardian safety validation → Care Brief preparation
```

The five existing services remain visible here as modules:

```
AIMAO'S MIND
Observation Interpreter     Active
Care Profile Engine         Updated
Change Detection Engine     Pattern found
Guardian Safety Layer       Passed
Care Brief Generator        Ready
```

Each module expandable, e.g.:

```
CHANGE DETECTION ENGINE
Input: 4 recent observations
Signals: Nutrition decline · Mobility change
Window: 4 days
Reason for flag: repeated appetite changes + newly
observed mobility change
Rule trace: [existing implementation details]
```

Important: do not expose hidden chain-of-thought. Show structured system traces, tool outputs, rules, states, sources, and explainable system events. Expert Mode may feel technical and transparent but stays on-brand.

==================================================
SECTION 11 — VISUAL DESIGN LANGUAGE
==================================================

Define an AiMao design system as `@theme` tokens in `app/globals.css`:

- Primary surface: warm cream / soft white
- Panda: near-black / charcoal
- CareKaki teal: `#0E6E78`
- Deep blue: `#1E3A5F`
- Healthy green: `#2E7D58`
- Drawer accents (category/emotion colors, from the hardware's drawers): soft orange, warm yellow, gentle blue, muted green

Never many saturated colors at once; colors are clear categories or emotional accents.

Style: rounded rectangular cards, large border radii, soft shadows, simple illustrations, big touch targets, clear lucide icons, minimal text density on regular pages, generous whitespace, friendly microcopy, approachable motion.

Typography: highly readable, large default sizes, comfortable line height, strong heading hierarchy, no tiny labels.

Accessibility: high contrast; large tap targets; clear focus states; keyboard accessible; never communicate state through color alone; support `prefers-reduced-motion`; no fast animations.

==================================================
SECTION 12 — PANDA COMPONENT SYSTEM
==================================================

All panda components live in `components/aimao/` — never hardcode panda illustrations per page:

```
<AiMaoCharacter />    core SVG character, expression + size props
<AiMaoFace />         face-only variant for small placements
<AiMaoSpeechBubble /> styled bubble for AiMao's lines
<AskAiMaoCard />      contextual conversation invitation (Section 7)
<AiMaoStatus />       tiny status chip with mini expression
<AiMaoGreeting />     time-aware greeting block for Home
```

`AiMaoCharacter` subscribes to `AudioGuideContext` so speaking/listening expressions track the real voice state automatically; explicit `expression` prop overrides.

==================================================
SECTION 13 — IMPORTANT PRODUCT CONSTRAINTS
==================================================

1. Preserve existing CareKaki backend functionality and API calls.
2. Never delete working Autopilot logic — move it behind Expert Mode.
3. No backend complexity in the primary UX.
4. Conversation is the primary emotional interaction.
5. Care Plan and Care Brief may be detailed; every other page stays visually simple.
6. Do not build another healthcare analytics dashboard.
7. No unrelated new features.
8. Reuse existing data and APIs; unavailable data → fixtures in `lib/demoCareData.ts` only.
9. Responsive on desktop and tablet.
10. Prioritise presentation reliability over completeness.
11. No new dependencies unless genuinely necessary (check `package.json` first — you have lucide-react, Leaflet, Tailwind v4; you do NOT have a chart or animation library, and you should not add one).

==================================================
SECTION 14 — IMPLEMENTATION APPROACH
==================================================

Before coding, output a short implementation plan grounded in the actual files (Section 0). Then implement in phases. **Each phase must end with a building, working app** — if time runs out, whatever is done must demo cleanly. Phases 1–3 are the demo spine; treat 4–6 as strongly desired but cuttable.

- **PHASE 1:** AiMao `@theme` tokens · `AiMaoCharacter` + expression system · `AskAiMao` component
- **PHASE 2:** Home redesigned around AiMao · Chat redesigned around AiMao expressions (wired to AudioGuideContext) · contextual chat entry points on major pages
- **PHASE 3:** Care Plan document format · detailed step-by-step activity cards · inline-SVG visualisations · print styling
- **PHASE 4:** Care Brief as concise handover document
- **PHASE 5:** Autopilot → AiMao's Mind, nav demoted, all logic preserved
- **PHASE 6:** Accessibility pass · responsive pass · visual consistency · test all existing core flows (onboard → chat → care plan → care brief; voice toggle; autopilot still functional at its URL)

==================================================
SECTION 15 — SUCCESS CRITERIA
==================================================

1. A first-time user immediately understands AiMao is the companion they can talk to.
2. The first screen does not feel like a dashboard.
3. Conversation is accessible and inviting throughout the app.
4. The panda feels expressive and alive (visibly distinct expressions, gentle animation).
5. The interface looks visually related to the AiMao hardware concept (cream/charcoal, drawer accent colors, rounded screen-face shapes).
6. The Care Plan looks like a detailed, professional, printable care document — and actually prints well on A4.
7. Every care activity has clear step-by-step instructions, caregiver role, and stop conditions.
8. Visualisations support understanding rather than decoration.
9. The Care Brief is short, clear, traceable, easy to share, with Guardian safety visible.
10. The five-service Autopilot system still exists and works but never overwhelms normal users.
11. An expert can intentionally open AiMao's Mind and inspect system processes.
12. The normal experience feels dramatically simpler than the current app.
13. Friendly, calm, accessible — never technical, never patronising.
14. The user is repeatedly and naturally invited to talk to AiMao.
15. The final interface communicates: **AiMao is the face. CareKaki is the intelligence underneath.**
