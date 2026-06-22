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

> **Direction A (locked).** Palette is now **cool / clinical**. Orange is fully removed from Self mode
> (→ slate-blue `#3B6CA8`); the dark Autopilot world shifts warm-brown → cool slate-navy `#14202B`;
> **green** (`#2E7D58`) is reserved consistently for *verified / working / done* (incl. the "just
> updated" beat, now green for **both** personas). Typography pairs **Newsreader** (serif headlines)
> with **IBM Plex Sans** (UI/body). Full old→new remap in §3.1; unchanged accents in §3.2.

```css
@theme {
  /* neutrals / canvas */
  --color-cream: #F6F8FA;
  --color-cream-deep: #EDF1F5;
  --color-surface: #FFFFFF;
  --color-ink: #1E2A33;
  --color-ink-body: #2E3A42;
  --color-ink-soft: #566069;
  --color-ink-muted: #7C8890;
  --color-ink-faint: #8A969E;
  --color-hairline: #E4E9ED;
  --color-hairline-warm: #D9DFE4;
  --color-tint: #EEF2F6;
  --color-divider: #E8ECEF;
  --color-grab: #D2DAE0;

  /* mode — self (slate-blue; orange fully removed) */
  --color-self: #3B6CA8;
  --color-self-ink: #33598E;
  --color-self-soft: #E9F0F8;
  --color-self-border: #C9D8EC;
  --color-self-dark: #244569;
  --color-provenance-chat: #5E7480;

  /* mode — caregiver (teal) — UNCHANGED */
  --color-caregiver: #1C6B66;
  --color-caregiver-ink: #15524E;
  --color-caregiver-soft: #E3F0EE;
  --color-caregiver-border: #C9E0DD;

  /* autopilot dark world (cool slate-navy) */
  --color-autopilot-bg: #14202B;
  --color-autopilot-card: #1E2E3A;
  --color-autopilot-card-draft: #19262F;
  --color-autopilot-band: #0E1820;
  --color-autopilot-hairline: #2C3E48;
  --color-autopilot-dashed: #3A4E58;
  --color-autopilot-pill: #283842;
  --color-autopilot-text: #EAF1F5;
  --color-autopilot-muted: #8598A2;
  --color-autopilot-muted-2: #94A7B1;
  --color-autopilot-draft: #AEBFC8;

  /* pathway groups */
  --color-week: #8A5A14;        --color-week-soft: #F4E9D6;   /* This Week — kept muted amber */
  --color-weeks: #3B6FB0;       --color-weeks-soft: #EAF0F7;
  --color-apply: #3E8E5A;       --color-apply-ink: #2E7D58;  --color-apply-soft: #E7F1EC;
  --color-single: #7C5AA6;      --color-single-soft: #F0EAF6;

  /* status — light / dark */
  --color-status-done: #2E7D58;      --color-status-done-dark: #6FCF97;
  --color-status-done-bg: #E7F1EC;   --color-status-done-bg-dark: #1F2E22;
  --color-status-running: #C2841A;   --color-status-running-dark: #E0A94A;
  --color-status-running-bg: #FBF0DC;--color-status-running-bg-dark: #3A2E1A;
  --color-status-draft: #5E7480;     --color-status-draft-dark: #AEBFC8;
  --color-status-draft-bg: #E2E8EC;  --color-status-draft-bg-dark: #283842;
  --color-draft-border: #C3D0D8;

  /* "just updated" beat — GREEN for both personas */
  --color-updated: #2E7D58;

  /* live / guardian / singpass — UNCHANGED */
  --color-live: #2E7D58;       --color-live-dark: #7FE3A6;   --color-live-dot: #4ED98A;
  --color-live-band-dark: #10301F;
  --color-guardian-border: #BFD8C6; --color-guardian-border-dark: #4A6B52;
  --color-singpass: #F4453C;

  /* fonts (Direction A) */
  --font-serif: var(--font-newsreader), Georgia, serif;       /* weights 500/600/700 */
  --font-sans: var(--font-plex-sans), system-ui, sans-serif;  /* weights 400/500/600/700 */
  --font-mono: var(--font-geist-mono), monospace;
}
```

Also update `body { background-color }` to `--color-cream` (`#F6F8FA`) and base text to `--color-ink`
(`#1E2A33`). Base body type is **18px minimum** (senior-legible).

### 3.1 Direction A remap (old warm → new cool — replace every occurrence)

**Neutrals / surfaces:** `#FBF7F1`→`#F6F8FA` (canvas) · `#F4EEE4`→`#EDF1F5` (paper) ·
`#F7F3EB`→`#EEF2F6` (tint box) · `#FAF4EA`→`#EDF2F6` (autopilot-light draft) ·
`#EFE7D9`→`#E2E8EC` (progress track / draft pill) · `#D8C4A8`→`#C3D0D8` (dashed draft border) ·
`#8A7B63`→`#5E7480` (draft text) · `#EDE7DC`→`#E4E9ED` (card hairline) ·
`#E4DCCE`→`#D9DFE4` (pill/outline border) · `#F1ECE3`→`#E8ECEF` (consent divider) ·
`#E9E2D6`→`#E4E9ED` (swatch border) · `#E0D8CB`→`#D2DAE0` (mobile grab handle) ·
`#F2EDE4`→`#EDF1F4` (typing-chip bg) · `#B7AC9A`→`#9CA9B1` (typing dots).

**Text inks:** `#2C2722`→`#1E2A33` (primary) · `#3A352E`→`#2E3A42` (body) · `#6F685E`→`#566069`
(secondary) · `#8A8074`→`#7C8890` (muted) · `#9A9184`→`#8A969E` (muted 2).

**Self mode (orange → slate-blue):** `#D9742E`→`#3B6CA8` (primary/CTA) · `#A85518`→`#33598E` (text) ·
`#FBEEE2`→`#E9F0F8` (tint) · `#8A3E12`→`#244569` (cadence dark text) · `#A8714A`→`#5E7480`
("from chat" label) · self card border `#F0D9C4`→`#C9D8EC` · self glow
`rgba(217,116,46,.10)`→`rgba(59,108,168,.16)`.

**Autopilot dark (warm brown → cool slate-navy):** `#241C16`→`#14202B` (bg) · `#322820`→`#1E2E3A`
(service card) · `#2A211B`→`#19262F` (draft card) · `#1B1410`→`#0E1820` (guardian band) ·
`#463A30`→`#2C3E48` (hairline) · `#5A4A3A`→`#3A4E58` (dashed) · `#3A322A`→`#283842` (draft pill) ·
`#F3E9DC`→`#EAF1F5` (text) · `#9A8C7C`→`#8598A2` (muted) · `#B7A998`→`#94A7B1` (muted 2) ·
`#C9BBA8`→`#AEBFC8` (draft text).

**Semantic (not just hue):** "Just updated" beat is now **green** `#2E7D58` for both personas
(border + pill + pulse). Pathway **This Week** keeps muted amber (pills bg `#F4E9D6`, text `#8A5A14`).
Consent **self-mode** check badges → slate (bg `#E9F0F8`, check `#33598E`).

### 3.2 Deliberately UNCHANGED

Caregiver teal `#1C6B66`/`#E3F0EE`/`#15524E`; success green `#2E7D58`/`#E7F1EC`; pathway accents
Weeks 2–8 `#3B6FB0`/`#EAF0F7`, Apply Now `#3E8E5A`, Single Point `#7C5AA6`/`#F0EAF6`; amber status
`#C2841A`/`#E0A94A`; dark done `#6FCF97`/`#1F2E22`; LIVE green `#4ED98A`/`#7FE3A6`; Guardian greens
`#4A6B52`/`#BFD8C6`; Singpass red `#F4453C`.

> ⚠️ Self-mode blue `#3B6CA8` sits close to Weeks 2–8 blue `#3B6FB0`; different contexts so it reads OK.

### Migration map (legacy `brand-*` → new, Direction A)

- `brand-orange` `#E8622C` → `self` `#3B6CA8` (slate-blue)
- `brand-orange-light` `#FBE8DA` → `self-soft` `#E9F0F8`
- `brand-teal` `#2D5F4E` → `caregiver` `#1C6B66`
- `brand-teal-light` `#D6EBE0` → `caregiver-soft` `#E3F0EE`
- `brand-brown` `#2C1510` → `autopilot-bg` `#14202B` (slate-navy)
- `brand-cream` `#F5EDE0` → `cream` `#F6F8FA`
- `brand-cream-border` `#E8DDD0` → `hairline` `#E4E9ED` / `hairline-warm` `#D9DFE4`
- `brand-amber` `#C4952B` → `week` `#8A5A14` (muted amber retained for This Week)
- `brand-blue` `#2B5DA6` → `weeks` `#3B6FB0`
- `brand-pink` `#A0445A` → (no longer used — Apply Now is green `apply`, Single Point is plum `single`)

Also remove warm hardcoded hex in components (chat bubbles, `#F7F3EB` tint boxes, ink-based shadow
`rgba(44,39,34,…)`→`rgba(30,42,51,…)`) in favor of tokens.

### Typography (Direction A)

- **Headlines:** ~~Playfair Display~~ → **Newsreader** (serif, weights 500/600/700) — `--font-serif`.
- **Body / UI:** ~~Geist~~ → **IBM Plex Sans** (weights 400/500/600/700) — `--font-sans`.
- Load both via `next/font/google` in `app/layout.tsx` (`--font-newsreader`, `--font-plex-sans`).

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
- `ProvenanceMarker({ source })` — `✓ MyInfo` green pill (`myinfo`) or small slate "from chat" label (`text-provenance-chat`, `#5E7480`).
- `StatusPill({ status, theme })` — `done | running | draft`; `theme: "light" | "dark"`; running has a leading dot; carries a text label (no color-only).
- `LiveChip({ label, theme })` — bordered green "LIVE · …" chip. WhatsApp/Calendar only.
- `GuardianBand({ theme, count })` — full-width inset band; check badge + "Guardian — active" + "No medical advice · PDPA scrubbed · Human one click away" + "Wrapping all {count}". Wrapper, never a tile.
- `PrimaryButton({ mode, children })` — 50–56px, mode-color fill.
- `ModeCard({ mode })` — Landing self/caregiver card (reshape existing).
- `ConsentRow({ field, mode })` — check badge + label + optional masked value/subcopy.
- `ProfileFieldCard({ field, mode })` — label + provenance marker + value; `justUpdated` applies a **green** (`border-updated`) border + green "just updated" pill + green `ckPulse` ring (same for both personas).
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
- **`ckPulse` keyframes are now GREEN for both personas** (no longer mode-colored): `rgba(46,125,88,…)`.
  Green = verified / working / done. Keep in `globals.css`. See §10 for the full motion system.

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
- `app/globals.css` — replace `@theme` with §3 tokens; update `body` bg→`cream`/text→`ink`; `ckPulse` is now **green** for both personas + add `ckDot`/`ckBreathe`/`ckShine`/`ckGuard` (§10) + a short crossfade utility.
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

## 10. Motion system (Direction A)

### Keyframes (in `globals.css`, under `@theme` → `animate-*` utilities)

```css
@keyframes ckPulse  { 0%{box-shadow:0 0 0 0 rgba(46,125,88,.38)} 70%{box-shadow:0 0 0 10px rgba(46,125,88,0)} 100%{box-shadow:0 0 0 0 rgba(46,125,88,0)} }
@keyframes ckDot    { 0%,80%,100%{transform:translateY(0);opacity:.45} 40%{transform:translateY(-5px);opacity:1} }
@keyframes ckBreathe{ 0%,100%{opacity:.4;transform:scale(.78)} 50%{opacity:1;transform:scale(1)} }
@keyframes ckShine  { 0%{transform:translateX(-130%)} 100%{transform:translateX(340%)} }
@keyframes ckGuard  { 0%,100%{box-shadow:0 0 0 0 rgba(111,207,151,0)} 50%{box-shadow:0 0 0 7px rgba(111,207,151,.16)} }
```

### Ambient (always-on loops)

- Conversation typing-indicator dots → `ckDot` with `0 / .18s / .36s` stagger across the 3 dots.
- Running status dots ("Filing…/Routing…/Enrolling…") + green LIVE dots → `ckBreathe`.
- Autopilot progress-bar fills → moving shine overlay (`ckShine` on a `::after` gradient strip, parent `overflow:hidden`).
- Guardian shield check badge → soft green halo `ckGuard`.
- The "just updated" profile field → green `ckPulse` (in-app plays once ~1.8s then clears).

### Hover

- Landing mode cards: `translateY(-4px)` + shadow `0 16px 38px rgba(30,42,51,.15)`, `.18s`, `cursor:pointer`.
- Pathway items + Autopilot service cards: `translateY(-2px)` + shadow `0 10px 24px rgba(30,42,51,.12)` + `brightness(1.03)`, `.16s`.
- Filled CTAs (Start / Approve / Launch Autopilot / Approve all / Edit): `brightness(1.07)` + glow `0 8px 20px rgba(14,110,120,.22)`; active `scale(.97)`.
- "Talk to a human" pills: bg → `#EAF1F2`, text/border → `#0E6E78` / `#BCD7D6`.

### On-demand "▶ Play" sequences (two hero screens)

- **Conversation:** profile fields fade-up in sequence (each `opacity 0→1` + `translateY(14px)→0`, `.5s`, staggered ~280ms), ending on the green just-updated pulse.
- **Autopilot:** service cards settle in (staggered ~220ms) and progress bars animate `width 0%→target` (`1.1s cubic-bezier(.4,0,.2,1)`).

---

*Engineering companion to `product-source-of-truth.md`, `user-flows.md`, and the design handoff. On any product-intent conflict, the source-of-truth wins; on any visual conflict, the design handoff wins.*
