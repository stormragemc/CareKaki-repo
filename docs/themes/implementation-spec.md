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

## 1. Locked decisions (agreed before build)

- **Flow order:** Landing → **Consent** → Conversation → Pathway → Autopilot → Care Brief. Consent is a gate *before* the conversation. Landing routes to `/consent?mode=…`, not straight to `/chat`.
- **Autopilot is dark-only.** Drop the design's Dark/Light segmented toggle (it existed to show both gallery frames). Ship the dark "machine world" as the canonical look; no theme context, no persistence. All other screens are light.
- **Icons:** add `lucide-react`. Replace the prototype's CSS-shape/glyph placeholders with minimal, monochrome Lucide icons (person/people on Landing, status/▲ glyphs, etc.).
- **Palette is a full token replacement**, not additive. The new hex set (section 3) replaces the current `brand-*` tokens in `app/globals.css`; existing screens (Landing/Chat/Pathway/Autopilot) get recolored to match the comps.
- **Autopilot starts all-drafts.** The rich mixed-state gallery frame is just for visual density. Real initial state = every service `draft`; Approve (per-card or "Approve all") advances `draft → running → done`. Only the ICCP coordination card may bypass confirm (escalate-to-human faster).
- **`ckPulse` runs ~2s then settles.** The prototype's `infinite` is for the static file; in-app the "just updated" ring plays once (~1.8s) and `justUpdated` is then cleared.
- **Mock / persona data first.** No backend wiring this pass (no SSE, no Singpass sandbox, no live WhatsApp/Calendar). UI is driven by per-persona mock datasets; the simulated status progression is faked client-side. Live integrations are a later layer (see `user-flows.md` §7).
- **Honesty cues:** `LIVE` chips ONLY on WhatsApp send + Google Calendar invite. 5 services + Guardian wrapper (never 6). SACH is "physio/rehab," never "polyclinic."

---

## 2. Routing & navigation

`mode` is carried in the query string throughout (matches the current `?mode=` pattern; simplest for the demo, no global store needed). `persona` is derived from `mode`.

- `/` — Landing → `/consent?mode=self|caregiver`
- `/consent` — Consent (new) → `/chat?mode=…`
- `/chat` — Conversation + Living Care Profile → `/pathway?mode=…`
- `/pathway` — Pathway → `/autopilot?mode=…`
- `/autopilot` — Autopilot (dark) → `/handover?mode=…`
- `/handover` — Care Brief (new)

`/chat`, `/pathway`, `/autopilot` already exist (under `app/(main)/…` except autopilot which has its own dark layout); `/consent` and `/handover` are new. The **cream → dark transition** into Autopilot should feel intentional (short crossfade on navigation).

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

```ts
export type Mode = "self" | "caregiver";
export type PersonaId = "mdm_tan" | "mr_lim";        // caregiver→mdm_tan, self→mr_lim

// ── Living Care Profile ──
export type FieldSource = "myinfo" | "chat";          // myinfo → "✓ MyInfo"; chat → "from chat"
export interface ProfileField {
  key: string;                // "mobility"
  label: string;              // "Mobility"
  value: string;
  source: FieldSource;
  justUpdated?: boolean;      // drives ckPulse; cleared ~2s after set
}
export interface LivingCareProfile {
  fields: ProfileField[];
  filledCount: number;        // "6 of 8 fields"
  totalCount: number;
}

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

`mode` (from URL) → `PersonaId` → a single per-persona seed dataset in `lib/mock-data.ts`:

```ts
interface PersonaData {
  id: PersonaId;
  mode: Mode;
  displayName: string;          // "Tan Siew Hua, 78" / "Lim Boon Keng, 72"
  operator: string;             // "Wei Ling (daughter)" / "Mr Lim himself"
  notifiedContact: string;      // "Wei Ling" / "Daughter in London"
  consentCopy: string;          // mode-aware consent sentence
  consentFields: ConsentField[];
  profile: LivingCareProfile;
  pathway: PathwayItem[];
  services: AutopilotService[];
  careBrief: { situation: string; cadence: string; actions: string[] };
}
```

Keep it data-driven: one `personas: Record<PersonaId, PersonaData>` map; screens select by `mode`. Content/copy for both personas comes from the design README (don't re-author it). No global store — derive persona from `mode` and seed each screen. `useChatState` seeds from the persona's `profile` + opening `messages`; the simulated reply also patches a `justUpdated` field.

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
- `ServiceCard({ service, mode })` — dark card; renders draft (dashed + Approve/Edit) / running (progress bar) / done (✓ + optional LIVE).

Reuse the existing `components/ui/StatusBadge.tsx` and `components/pathway/PathwayColumn.tsx` by reshaping, not duplicating; consolidate the duplicated color maps into one token-driven helper.

---

## 6. Per-screen composition (high level)

- **Landing** — header (monogram + `TalkToHuman`), centered hero, two `ModeCard`s. Routes to `/consent?mode=`.
- **Consent** — centered modal card with Singpass-red header band, `ModeChip`, mode-aware copy, ordered `ConsentRow`s (NRIC masked, DOB, address, income+subcopy, CPF), Guardian note box, `PrimaryButton`.
- **Conversation** — split: chat column (bubbles + typing chip + input/send) | profile column (`ProfileFieldCard` list + "6 of 8"). Mobile: profile becomes a bottom pull-up sheet (must not disappear).
- **Pathway** — header, 4 `PathwayColumn`s with `WhyTag`s + divergence tags, footer "Launch Autopilot →".
- **Autopilot** — dark; header, `GuardianBand`, 2-col `ServiceCard` grid (comms full-width), footer summary + "Approve all". Draft→running→done state machine.
- **Care Brief** — warm paper doc card: letterhead, two columns (situation / actions checklist / pathway open items | family contact, cadence, consents-on-file), Guardian footer line.

---

## 7. Interactions

- **Profile "just updated":** on each user message, the simulated reply patches one field → set `justUpdated=true` → `ckPulse` (~1.8s) → clear. MyInfo fields are verified at consent and never editable-from-chat.
- **Draft-then-confirm:** all services start `draft`. "Approve all" (or per-card Approve) → each `running` (animate `progress`, "Filing…/Routing…/Enrolling…") → `done` after a short delay; WhatsApp + Calendar get `live`. Footer summary recomputes ("2 done · 2 running · 1 draft").
- **Cream → dark:** short crossfade entering `/autopilot`.
- **`ckPulse` keyframes** (mode-colored): teal `rgba(28,107,102,…)` caregiver / orange `rgba(217,116,46,…)` self — keep in `globals.css`.

---

## 8. Accessibility checklist

- Base body ≥ 18px; tap targets ≥ 44px (primary buttons 50–56px).
- Status never color-only — always a text label and/or icon.
- High contrast text on cream/dark; visible focus states on all interactives.
- Profile pulse is decorative — never the only signal a field changed.

---

## 9. Deferred (fill in when the branch settles / later passes)

- **File-by-file build plan** — to be finalized after reviewing the friend's updated branch (route files, component file paths, what to reshape vs. add).
- **Backend wiring** — SSE `{reply, profile_patch}`, Singpass/MyInfo sandbox, real WhatsApp + Google Calendar, server-side session. Per `user-flows.md` §7 these are a separate layer after the UI is faithful.

---

*Engineering companion to `product-source-of-truth.md`, `user-flows.md`, and the design handoff. On any product-intent conflict, the source-of-truth wins; on any visual conflict, the design handoff wins.*
