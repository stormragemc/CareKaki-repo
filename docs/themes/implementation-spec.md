# CareKaki — Implementation Spec (engineering bridge)

> **Purpose:** the build-side companion to the design. It records locked decisions, maps the design
> tokens onto our Tailwind config, pins the TypeScript types / state shapes and component contracts,
> and (later) the file-by-file plan. It deliberately does **not** repeat product or visual content —
> read it alongside:
>
> - `product-source-of-truth.md` — product intent (wins on any intent conflict)
> - `user-flows.md` — screens, use cases, demo run-of-show
> - the design handoff (`README.md` + `CareKaki Screens.dc.html` from the design tool) — the visual spec; **source of truth for layout, copy, color, and states**
>
> Follow the repo conventions in `.cursor/rules/` (notably `code-style-vibe`: minimum viable code,
> YAGNI, discriminated unions, fix the data shape rather than translating it).

---

## 0. Build progress (resume here)

> Scratchpad for picking up across chats/windows. Update as phases land.

**Decision (20 Jun):** scope = UI/visual reskin + new screens + draft/approve gate, **plus two cheap
architecture signals** (a real Guardian stub invocable live in Q&A, and Dockerize). **Skip Kubernetes.**
Final is **~10 min live + ~10 min Q&A** (`user-flows.md` §8) on 23 Jun.

| Phase | Status | Notes |
|---|---|---|
| 0 — Foundation | ✅ done | `lucide-react` installed; `globals.css` tokens + `animate-*` (Tailwind v4 `@theme`); `body` styling on Tailwind classes in `layout.tsx`; `lib/types.ts` extended; `components/ui/` kit (10 components) built; `tsc` clean. |
| 1 — Persona data | ⏳ next | **Shared dependency — do alone, first.** Extend `DemoUser` (`profileMeta`, `consent`, `careBrief`, divergence). |
| 2 — Entry screens | pending | Landing, Login, Onboard, Header/Logo + reroute to `/consent`. |
| 3 — Consent (new) | pending | parallelizable after Phase 1 |
| 4 — Conversation | pending | parallelizable after Phase 1 |
| 5 — Pathway | pending | parallelizable after Phase 1 |
| 6 — Autopilot + gate | pending | parallelizable after Phase 1 |
| 7 — Care Brief (new) | pending | parallelizable after Phase 1 |
| 8 — Responsive/a11y/cleanup | pending | last |
| Guardian stub | pending | separate chat ok |
| Dockerize | pending | separate chat ok |

**Parallelizing across chats:** finish Phase 1 first (everything reads persona data). Then per-screen
phases touch mostly different files and can run in parallel — but give each chat its **own git branch/
worktree** to avoid stomping. Shared touchpoints to coordinate: `lib/demo-users.ts`,
`components/layout/Header.tsx`, `app/(main)/layout.tsx`, `components/ui/*`. The design `README.md`
(tokens, exact copy, per-persona field/divergence lists) is the visual source of truth — don't re-author copy.

---

## 1. Locked decisions

Decisions from the initial design review, **reconciled against the actual `kith` codebase** after the
teammate merge (see §9 for the reconciliation rationale and the codebase delta).

- **Flow order:** Landing → (`/onboard` *or* `/login`) → **Consent** → Conversation → Pathway → Autopilot → Care Brief. **Keep** the existing `/login` (persona picker) and `/onboard` (form) entries and reskin them; **insert** the new Consent screen as the gate *after* onboard/login and *before* `/chat`.
- **Autopilot — reskin, don't replace.** The teammate shipped a live `AgentWorkspace` (5 backend-polling feed panels + Leaflet maps) — keep it and the real integrations. Apply the design's visual language on top: new tokens, the **Guardian band**, honesty/`LIVE` cues, and a **draft/approve gate** before the feeds auto-run. Do **not** swap in the design's static `ServiceCard` model. Dark-only (drop the design's dark/light toggle).
- **Personas — keep the 4 demo users** in `lib/demo-users.ts` (Mdm Tan, Mr Lim, Mrs Wong, Uncle Raj). Map the design's two: caregiver ≈ Mdm Tan, self ≈ Mr Lim; the other two inherit the same visual treatment. The **real fork is the selected demo user** (and its `adapters`), not `?mode=` (which stays a cosmetic label for now).
- **Care Brief:** build the new `/handover` screen per the design (warm-handover finale).
- **Icons:** add `lucide-react`. Replace the prototype's CSS-shape/glyph placeholders with minimal, monochrome Lucide icons.
- **Palette is a full token replacement**, not additive. The new hex set (§3) replaces the current `brand-*` tokens in `app/globals.css`; existing screens get recolored to match the comps.
- **`ckPulse` runs ~2s then settles.** The prototype's `infinite` is for the static file; in-app the "just updated" ring plays once (~1.8s) and `justUpdated` is then cleared.
- **Visual pass, keep working backend.** Chat, pathway, and the autopilot feeds already call `localhost:8000` — do **not** rip those out. This pass is UI/visual + the new screens (Consent, Care Brief) + the draft/approve gate; where no endpoint exists (Consent, Care Brief content), drive it from the demo-user data client-side.
- **Honesty cues:** `LIVE` chips ONLY on genuinely-live actions. Guardian is a wrapper band, never a tile. SACH is "physio/rehab," never "polyclinic."

---

## 2. Routing & navigation

`mode` stays in the query string (cosmetic label). Identity/state is carried in `sessionStorage`
(`demoUser`, `careProfile`, `userLocation`, `autopilotAdapters`) exactly as the current code does —
the Consent step writes the same keys so downstream screens are unchanged.

- `/` — Landing → `/onboard?mode=self|caregiver` (new user) or `/login` (persona picker) — **existing**
- `/login` — demo-user picker → seeds sessionStorage → **`/consent?mode=…`** (was `/chat`) — existing, reskin + reroute
- `/onboard` — name/age + location → seeds sessionStorage → **`/consent?mode=…`** (was `/chat`) — existing, reskin + reroute
- `/consent` — **new** Singpass/MyInfo consent gate → `/chat?mode=…`
- `/chat` — Conversation + Living Care Profile → `/pathway?mode=…` — existing
- `/pathway` — Pathway → `/autopilot` — existing
- `/autopilot` — Autopilot (dark, `AgentWorkspace`) → `/handover` — existing, reskin + add gate
- `/handover` — **new** Care Brief finale

`/chat`, `/pathway` live under `app/(main)/…` (shared cream `Header`); `/login`, `/onboard`,
`/autopilot` are standalone (own headers). `/consent` and `/handover` are new — `/consent` standalone
(modal-on-cream), `/handover` standalone (warm paper). The **cream → dark transition** into Autopilot
should feel intentional (short crossfade).

---

## 3. Design tokens → Tailwind `@theme`

Replace the `@theme` block in `app/globals.css` with the set below (Tailwind v4: each `--color-*` generates `bg-*` / `text-*` / `border-*`). Light/dark pairs are flat tokens with a `-dark` suffix; the dark Autopilot subtree uses the `autopilot-*` and `-dark` tokens directly.

```css
@theme {
  /* neutrals / canvas */
  --color-cream: #FBF7F1;
  --color-cream-deep: #F4EEE4;
  --color-surface: #FFFFFF;
  --color-ink: #2C2722;
  --color-ink-body: #3A352E;
  --color-ink-soft: #6F685E;
  --color-ink-muted: #8A8074;
  --color-ink-faint: #9A9184;
  --color-hairline: #EDE7DC;
  --color-hairline-warm: #E4DCCE;

  /* mode — self (orange) */
  --color-self: #D9742E;
  --color-self-ink: #A85518;
  --color-self-soft: #FBEEE2;
  --color-self-border: #F0D9C4;

  /* mode — caregiver (teal) */
  --color-caregiver: #1C6B66;
  --color-caregiver-ink: #15524E;
  --color-caregiver-soft: #E3F0EE;
  --color-caregiver-border: #C9E0DD;

  /* autopilot dark world */
  --color-autopilot-bg: #241C16;
  --color-autopilot-card: #322820;
  --color-autopilot-card-draft: #2A211B;
  --color-autopilot-band: #1B1410;
  --color-autopilot-hairline: #463A30;
  --color-autopilot-text: #F3E9DC;
  --color-autopilot-muted: #9A8C7C;

  /* pathway groups */
  --color-week: #C2841A;        --color-week-soft: #FBEEE2;
  --color-weeks: #3B6FB0;       --color-weeks-soft: #EAF0F7;
  --color-apply: #3E8E5A;       --color-apply-ink: #2E7D58;  --color-apply-soft: #E7F1EC;
  --color-single: #7C5AA6;      --color-single-soft: #F0EAF6;

  /* status — light / dark */
  --color-status-done: #2E7D58;      --color-status-done-dark: #6FCF97;
  --color-status-done-bg: #E7F1EC;   --color-status-done-bg-dark: #1F2E22;
  --color-status-running: #C2841A;   --color-status-running-dark: #E0A94A;
  --color-status-running-bg: #FBF0DC;--color-status-running-bg-dark: #3A2E1A;
  --color-status-draft: #8A7B63;     --color-status-draft-dark: #C9BBA8;
  --color-status-draft-bg: #EFE7D9;  --color-status-draft-bg-dark: #3A322A;

  /* live / guardian / singpass */
  --color-live: #2E7D58;       --color-live-dark: #7FE3A6;   --color-live-dot: #4ED98A;
  --color-live-band-dark: #10301F;
  --color-guardian-border: #BFD8C6; --color-guardian-border-dark: #4A6B52;
  --color-singpass: #F4453C;

  /* fonts (unchanged) */
  --font-serif: var(--font-playfair), Georgia, serif;
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}
```

Also update `body { background-color }` to `--color-cream` (`#FBF7F1`) and base text to `--color-ink`. Base body type is **18px minimum** (senior-legible).

### Migration map (current `brand-*` → new)

- `brand-orange` `#E8622C` → `self` `#D9742E`
- `brand-orange-light` `#FBE8DA` → `self-soft` `#FBEEE2`
- `brand-teal` `#2D5F4E` → `caregiver` `#1C6B66`
- `brand-teal-light` `#D6EBE0` → `caregiver-soft` `#E3F0EE`
- `brand-brown` `#2C1510` → `autopilot-bg` `#241C16`
- `brand-cream` `#F5EDE0` → `cream` `#FBF7F1`
- `brand-cream-border` `#E8DDD0` → `hairline` `#EDE7DC` / `hairline-warm` `#E4DCCE`
- `brand-amber` `#C4952B` → `week` `#C2841A`
- `brand-blue` `#2B5DA6` → `weeks` `#3B6FB0`
- `brand-pink` `#A0445A` → (no longer used — medication left Autopilot; Apply Now is green `apply`, Single Point is plum `single`)

Also remove hardcoded hex in components (`#EDE4D4` chat bubbles, `#3A1E10` service card) in favor of tokens.

---

## 4. Type & state model

The new shapes **replace** the current `lib/types.ts` (rewrite, then update consumers + reshape `lib/mock-data.ts` — don't add a translation layer). Use discriminated/literal fields per the code-style rule.

> **Reconciliation:** the current `lib/types.ts` (`CareProfile` as flat strings) and `lib/demo-users.ts`
> (`DemoUser` with 4 personas) already exist and are wired into chat/pathway/feeds. **Extend, don't
> rewrite.** Add the view-model fields below alongside the existing types; evolve `CareProfile` field
> values into `{ value, source, justUpdated }` (or add a parallel `profileMeta` map) rather than
> replacing the working shape and breaking the backend `profileUpdate` patch path.

```ts
export type Mode = "self" | "caregiver";              // cosmetic label (URL)
// Persona identity is the existing DemoUser["id"]: "mdm-tan" | "mr-lim" | "mrs-wong" | "uncle-raj"

// ── Living Care Profile (view model over CareProfile) ──
export type FieldSource = "myinfo" | "chat";          // myinfo → "✓ MyInfo"; chat → "from chat"
export interface ProfileFieldMeta {
  source: FieldSource;
  justUpdated?: boolean;      // drives ckPulse; cleared ~2s after set
}
// keyed by CareProfile field name, e.g. { financialTier: { source: "myinfo" }, mobility: { source: "chat", justUpdated: true } }
export type ProfileMeta = Partial<Record<keyof CareProfile, ProfileFieldMeta>>;

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

// ── Pathway ──
export type PathwayGroup = "this-week" | "weeks-2-8" | "apply-now" | "single-point";
export type Divergence = "differs" | "elevated";      // persona-specific highlight tag
export interface PathwayItem {
  id: string;
  group: PathwayGroup;
  title: string;
  whyTag: string;             // always traces to a profile fact
  divergence?: Divergence;
  highlight?: boolean;        // dark emphasis card (e.g. ICCP single point)
}

// ── Autopilot ──
export type ServiceStatus = "draft" | "running" | "done";
export type ServiceCategory = "financial" | "clinical" | "social" | "coordination" | "comms";
export interface AutopilotService {
  id: string;
  category: ServiceCategory;
  title: string;
  provider: string;
  description: string;
  status: ServiceStatus;
  progress?: number;          // 0–100 while running
  live?: boolean;             // LIVE chip — WhatsApp + Calendar only
  warmHandover?: boolean;     // amber border + "WARM HANDOVER" (coordination)
  divergence?: Divergence;
  fullWidth?: boolean;        // comms card spans the grid
}

// ── Consent / Care Brief ──
export interface ConsentField { label: string; value?: string; subcopy?: string; } // NRIC, DOB, …
```

### Persona model

The existing `DemoUser` (`lib/demo-users.ts`) is the persona source of truth and is already selected at
`/login` and seeded into `sessionStorage`. **Extend `DemoUser`** with the fields the design's new
screens need, rather than adding a parallel `PersonaData` map:

```ts
// add to the existing DemoUser interface in lib/demo-users.ts
profileMeta?: ProfileMeta;                              // which fields are MyInfo-verified vs from chat
consent?: { copy: string; fields: ConsentField[] };     // Consent screen content (mode-aware)
careBrief?: { situation: string; cadence: string; actions: string[]; consentsOnFile: string[] };
// pathway/services divergence (differs|elevated tags) can be carried on the pathway/service data
```

Screens read the active persona from `sessionStorage.demoUser` (already the pattern). The `/onboard`
path (no demo user) falls back to a minimal default persona. Content/copy comes from the design README +
`demo-users.ts` — don't re-author it. `useChatState` already seeds chat from the demo user; the
"just updated" pulse is driven by toggling `profileMeta[field].justUpdated` when a `profileUpdate`
patch arrives.

---

## 5. Shared component kit (build once, reuse)

Bespoke Tailwind components (no UI lib). Suggested contracts:

- `ModeChip({ mode })` — "Caregiver"/"Self" pill, mode-tinted.
- `TalkToHuman()` — outline pill, in every screen header.
- `WhyTag({ children, group?, mode? })` — `✦`-prefixed pill, group/mode-tinted.
- `ProvenanceMarker({ source })` — `✓ MyInfo` green pill (`myinfo`) or small orange "from chat" label.
- `StatusPill({ status, theme })` — `done | running | draft`; `theme: "light" | "dark"`; running has a leading dot; carries a text label (no color-only).
- `LiveChip({ label, theme })` — bordered green "LIVE · …" chip. WhatsApp/Calendar only.
- `GuardianBand({ theme, count })` — full-width inset band; check badge + "Guardian — active" + "No medical advice · PDPA scrubbed · Human one click away" + "Wrapping all {count}". Wrapper, never a tile.
- `PrimaryButton({ mode, children })` — 50–56px, mode-color fill.
- `ModeCard({ mode })` — Landing self/caregiver card (reshape existing).
- `ConsentRow({ field, mode })` — check badge + label + optional masked value/subcopy.
- `ProfileFieldCard({ field, mode })` — label + provenance marker + value; `justUpdated` applies mode-color border + "just updated" pill + `ckPulse` ring.
- `PathwayColumn({ group, items, mode })` + `PathwayItemCard({ item, mode })`.

Autopilot uses the existing `WorkspacePanel` + `*Feed` components (recolored to the `autopilot-*`
tokens) — **not** the design's standalone `ServiceCard` (that lives only in the orphaned dashboard).
`StatusPill` and `LiveChip` are used inside the panels. Reshape `components/pathway/PathwayColumn.tsx`
rather than duplicating; consolidate the duplicated color maps into one token-driven helper.

---

## 6. Per-screen composition (high level)

- **Landing** — header (monogram + `TalkToHuman`), centered hero, two `ModeCard`s, "Sign in" → `/login`. Routes to `/onboard?mode=`.
- **Login** — reskin the dark persona picker to the new tokens; route on select to `/consent?mode=`.
- **Onboard** — reskin the name/age + location steps to the new tokens; finish → `/consent?mode=`.
- **Consent** — centered modal card with Singpass-red header band, `ModeChip`, mode-aware copy, ordered `ConsentRow`s (NRIC masked, DOB, address, income+subcopy, CPF), Guardian note box, `PrimaryButton`. Writes/keeps the same sessionStorage keys, then → `/chat`.
- **Conversation** — split: chat column (bubbles + typing chip + input/send) | profile column (`ProfileFieldCard` list + "n of 8"). Mobile: profile becomes a bottom pull-up sheet (must not disappear).
- **Pathway** — header, 4 `PathwayColumn`s with `WhyTag`s + divergence tags, footer "Launch Autopilot →".
- **Autopilot** — dark; **keep `AgentWorkspace` + the 5 live feeds**; add `GuardianBand` across the top, recolor panels to the autopilot tokens, add a **draft/approve gate** (summary footer + "Approve all") that holds the feeds before they auto-run, and `LIVE` cues on genuinely-live feed actions.
- **Care Brief** — warm paper doc card: letterhead, two columns (situation / actions checklist / pathway open items | family contact, cadence, consents-on-file), Guardian footer line.

---

## 7. Interactions

- **Profile "just updated":** on each user message, the simulated reply patches one field → set `justUpdated=true` → `ckPulse` (~1.8s) → clear. MyInfo fields are verified at consent and never editable-from-chat.
- **Draft/approve gate (over `AgentWorkspace`):** on entry, the feeds are held in a "draft — awaiting approval" state (don't auto-fire their `POST`/poll effects yet). "Approve all" (or per-panel Approve) releases them; each panel then runs its existing live flow. Only ICCP may bypass the gate (escalate-to-human faster). Implement as a gate flag the feeds check before kicking off their effects — minimal change to each feed.
- **Cream → dark:** short crossfade entering `/autopilot`.
- **`ckPulse` keyframes** (mode-colored): teal `rgba(28,107,102,…)` caregiver / orange `rgba(217,116,46,…)` self — keep in `globals.css`.

---

## 8. Accessibility checklist

- Base body ≥ 18px; tap targets ≥ 44px (primary buttons 50–56px).
- Status never color-only — always a text label and/or icon.
- High contrast text on cream/dark; visible focus states on all interactives.
- Profile pulse is decorative — never the only signal a field changed.

---

## 9. File-by-file build plan (post-merge review)

### 9.1 Codebase delta this reconciles against

The teammate merge changed the app substantially vs. the original design assumptions:

- **Autopilot** is now a live `AgentWorkspace` (5 backend-polling feed panels + Leaflet maps), not a static 5-card screen. **Decision: reskin + gate, keep the feeds.**
- **Entry** is Landing → `/onboard` *or* `/login` (4 demo users in `lib/demo-users.ts`). **Decision: keep both, reskin, insert `/consent` before `/chat`.**
- **Backend is real** — `/chat`, `/pathway`, and the integration feeds call `localhost:8000`. **Decision: visual pass only; don't remove working calls.**
- **Care Brief / Consent / Guardian band / new palette / lucide-react** are not in the code yet. **Decision: build them.**
- Orphans exist (`AutopilotDashboard.tsx`, `ServiceCard.tsx`, `mockAutopilotServices`, `mockMessages`) — clean up at the end.

### 9.2 Plan by phase (file → action)

**Phase 0 — Foundation**
- `package.json` — add `lucide-react`.
- `app/globals.css` — replace `@theme` with §3 tokens; update `body` bg→`cream`/text→`ink`; keep/extend `ckPulse` (mode-colored) + add a short crossfade utility.
- `lib/types.ts` — **add** `FieldSource`, `ProfileFieldMeta`, `ProfileMeta`, `ConsentField`, `PathwayGroup`, `Divergence` (extend; don't break `CareProfile`/`PathwayColumnData`).
- `components/ui/` — **new** shared kit: `ModeChip`, `TalkToHuman`, `WhyTag`, `ProvenanceMarker`, `StatusPill`, `LiveChip`, `GuardianBand`, `PrimaryButton`, `ConsentRow`, `ProfileFieldCard` (see §5 contracts).

**Phase 1 — Persona data**
- `lib/demo-users.ts` — extend `DemoUser` with `profileMeta`, `consent`, `careBrief`, and pathway/service `divergence` tags; fill content for Mdm Tan + Mr Lim (Mrs Wong / Uncle Raj inherit visual treatment + sensible defaults).

**Phase 2 — Entry screens (reskin)**
- `app/(main)/page.tsx` — reskin Landing hero; "Sign in"→`/login`; cards→`/onboard?mode=`.
- `components/landing/ModeCard.tsx` — reskin to new tokens.
- `app/login/page.tsx` — reskin dark persona picker; **reroute select → `/consent?mode=`**.
- `app/onboard/page.tsx` — reskin steps; **finish → `/consent?mode=`**.
- `components/layout/Header.tsx`, `components/ui/Logo.tsx` — reskin monogram; add `TalkToHuman`; fix/remove dead nav links (`/about`, `/resources`, `/coordinators`, `/help`).

**Phase 3 — Consent (new)**
- `app/consent/page.tsx` — **new**; Singpass-red band, `ModeChip`, mode-aware copy + `ConsentRow`s from `demoUser.consent`, Guardian note; preserves sessionStorage keys → `/chat?mode=`.

**Phase 4 — Conversation**
- `app/(main)/chat/page.tsx` — reskin split layout.
- `components/chat/ChatPanel.tsx`, `ChatMessage.tsx`, `ChatInput.tsx` — reskin bubbles (tokens, radii), send button; replace hardcoded `#EDE4D4`.
- `components/chat/LiveCareProfile.tsx` — rebuild as `ProfileFieldCard` list with `ProvenanceMarker` + "n of 8" + `justUpdated` pulse; mobile bottom pull-up sheet.
- `hooks/useChatState.ts` — on `profileUpdate`, set `profileMeta[field].justUpdated=true`, clear after ~2s.

**Phase 5 — Pathway**
- `app/(main)/pathway/page.tsx` — reskin; footer "Launch Autopilot →".
- `components/pathway/PathwayBoard.tsx`, `PathwayColumn.tsx` — 4 groups on new tokens; first-class `WhyTag`; `divergence` tags; consolidate the duplicated color map.

**Phase 6 — Autopilot (reskin + gate, keep feeds)**
- `app/autopilot/page.tsx` — add `GuardianBand`; draft/approve gate UI (footer summary + "Approve all"); crossfade-in.
- `components/autopilot/AgentWorkspace.tsx` — hold feeds behind an approval gate flag; recolor; (optionally honour `autopilotAdapters` to show/hide panels — see deferred).
- `components/autopilot/WorkspacePanel.tsx` — recolor to `autopilot-*` tokens; `StatusPill`; `LiveChip` slot.
- `AICFeed.tsx`, `NursingFeed.tsx`, `ICCPFeed.tsx`, `MedicationFeed.tsx`, `TelegramFeed.tsx` — gate their auto-run `POST`/poll effects behind approval (ICCP may bypass); add `LIVE` cue only where genuinely live; recolor.
- `components/autopilot/MiniMap.tsx`, `WorkspaceLog.tsx` — recolor to tokens.

**Phase 7 — Care Brief (new)**
- `app/handover/page.tsx` — **new**; warm paper doc from `demoUser.careBrief` + profile + consents + Guardian footer line.
- `app/autopilot/page.tsx` — footer/next → `/handover`.

**Phase 8 — Responsive, a11y, cleanup**
- Mobile reflows (chat pull-up, pathway stack, autopilot single column); a11y pass (§8).
- Remove orphans once confirmed unreferenced: `components/autopilot/AutopilotDashboard.tsx`, `components/autopilot/ServiceCard.tsx`, `components/ui/StatusBadge.tsx` (if unused after `StatusPill`), `mockAutopilotServices`, `mockMessages`.

### 9.3 Still deferred (later passes)

- **Backend for the new bits:** Singpass/MyInfo sandbox behind Consent; a Care Brief endpoint; genuinely-live WhatsApp/Calendar `LIVE` proof.
- **`autopilotAdapters` wiring:** make `AgentWorkspace` show/hide panels per the selected persona's `adapters` (currently stored but unused).
- **Genuine mode fork** beyond demo-user selection (seeding/tone/notify by `?mode=`).

---

*Engineering companion to `product-source-of-truth.md`, `user-flows.md`, and the design handoff. On any product-intent conflict, the source-of-truth wins; on any visual conflict, the design handoff wins.*
