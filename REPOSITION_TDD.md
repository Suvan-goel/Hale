# Reposition Build-Out — Technical Design Doc

Date: 2026-07-06 · Status: **awaiting founder approval — no implementation started**
Spec: "Reposition build-out" brief (Parts 1–3). Base: `voice-sessions-v1` @ working tree
(1444/1444 tests green as of the last recorded checkpoint).

Supersession boundary honored: this doc changes POSITIONING, COPY, STRUCTURE, BRAND only.
All recorded engineering invariants stand untouched — intent-matcher seam, camera path
parked behind `EXPO_PUBLIC_ENABLE_CAMERA_CONDUCTED_SESSIONS`, reported-vs-measured split,
append-only pain audit trail, claims-checked strings, hot-phrase lint, tap parity,
no-stall, measurement-integrity Retry/Skip, tune/gate separation, device-evening and
corpus gates. Nothing engine-specific, no new graders.

Labels used throughout, per the standing reporting rule:
**BUILT-AND-TESTED** (exists, behavior-tested) · **SOURCE-PINNED** (exists, pinned by
source-scan/wiring test only) · **PLANNED** (does not exist; this doc is its spec).
A fourth honesty label appears where needed: **PROMPT-ONLY** (exists nowhere but in the
reposition brief).

---

## 0. Executive summary

The reposition is mostly a presentation-layer build on an engine that already fits it.
The measurement stack, claim-eligibility machinery, baseline-relative progress framing,
guest-first architecture, and menopause Phase-1 copy layer all carry over whole. The
genuinely new work, in effort order:

1. **Dimension registry + dimension-generic results/trend surfaces** — today the domain
   model is fragmented across six hardcoded 3-value unions and the results screen renders
   a literal `[Card, Card, Card]` tuple. Clarity cannot be added without this refactor.
2. **Subjective fog instrument + covariates** — fully new: a short self-report appendix to
   the monthly check-up, covariate capture, rolling-baseline utilities, a flag-gated
   Clarity trend surface.
3. **Results reshape** — the diagnosis-shaped first output partially exists (the focus
   engine already picks "biggest opportunity"); naming a "strongest asset" and moving
   percentile copy behind an opt-in are new and reverse a default.
4. **Brand token + rename readiness** — ~150 user-facing brand-name occurrences across
   ~60 source files, 1 app-config field, 2 bundled spoken lines (×2 voices), logo/icon
   assets, and the marketing site. Centralized so the rename is one commit + 4 audio
   assets + art.
5. **Onboarding rebuild** — stage self-ID exists (taxonomy differs from the brief — §1
   F2); the symptom picture is new; "skippable" reverses a recorded rule (§1 F1).
6. **Cognitive claims fence** — new banned list wired into the existing guardrail
   pattern before any fog-adjacent string is written.

Section 1 lists **8 flags** where the brief touches recorded decisions or existing
structure — per instruction, flagged rather than silently chosen. Three need a founder
call before the affected slice (F1, F2, F5); the rest are sign-offs on
recommended resolutions.

---

## 1. Flags: brief vs recorded decisions / existing structure

**F1 — ⚖️ "Optional, sensitive, skippable" stage question vs the 2026-07-05
required-before-Continue rule.** The recorded rule ("unanswered never masquerades as
answered") made `menopauseStage` required before Continue, with `prefer_not_to_say` as
the escape. The brief says skippable. These are reconcilable: a skip stores `null`
(honestly unanswered — the rule's letter is satisfied; it banned *masquerading*, not
*absence*), and copy adapts to the unanswered state. But it reverses a decision recorded
one day ago. **Recommendation: adopt the brief** — a sensitive question this early earns
trust by being visibly skippable; `prefer_not_to_say` and skip are recorded distinctly.
Needs your call.

**F2 — ⚖️ Stage taxonomy mismatch.** Stored enum (schema v9): `perimenopausal |
postmenopausal | neither_or_unsure | prefer_not_to_say`. The brief:
"perimenopausal / menopausal / postmenopausal / prefer not to say" — adds a distinct
**menopausal**, omits **neither_or_unsure**. Recommendation: add `menopausal` (schema
v9→v10, defensive parse), **keep** `neither_or_unsure` (relabeled "Not sure") — it is an
honest answer for the target user and dropping it would orphan stored answers. Needs your
call on both halves.

**F3 — `younger_than_age_band` milestone is a live age-comparison surface.** BUILT:
`milestoneService.ts:64` emits a milestone when the domain age-band midpoint sits below
the user's age ("This home estimate is below your age…"). The brief's progress framing
(baseline-relative default, population comparison opt-in, no age framing) makes this the
last user-facing age-comparative surface. **Recommendation: retire the milestone type**
(stored instances tolerated on read, never re-emitted). Flagged because the milestone
stack was a recorded MVP-adherence decision (2026-06-16).

**F4 — Percentile-by-default results reverse the V2 presentation decisions.** Today's
domain cards lead with "Around the Xth–Yth percentile for your age group" /
"Above/Below the typical range for your age group" (BUILT, `movementProfileV2/viewModel.ts`).
The brief moves all population comparison behind opt-in. This is squarely inside the
brief's supersession scope (copy/structure) — noted so decisions.md records it as a
product-owner reversal, not drift. The *claim-eligibility machinery under it is untouched*:
the opt-in view renders exactly what the engine already gates as reference-eligible.

**F5 — ⚖️ "No plan ever ends" vs the block-report ritual.** The 4-week block → retest →
new block loop is already structurally continuous (block auto-creation is BUILT,
2026-07-04), but the **block report** is a deliberate end-of-phase ritual (recorded
adherence design). Recommendation: keep the report, reframe copy as a *phase* marker
("your next 4 weeks start from here"), and audit the handful of strings that imply
termination ("Your 4-week re-test is close. It will add another data point." is fine;
"4-week plan" section titles get "current phase" framing). No structural change. Needs
sign-off that the report ritual survives the reframe.

**F6 — Brand token vs static `app.json`.** `app.json` carries `"name": "Hale"` and is
plain JSON — it cannot consume a token. Resolution honoring the CommonJS-config rule:
`brand/brand.js` (CommonJS data), consumed by `app.config.js` (which already spreads
`appJson.expo` and can override `name`) and re-exported typed for `src/`. The **slug,
scheme, bundle identifiers, Supabase project, EAS project id, storage filenames**
(`training-state.json` etc.) are deliberately NOT tokenized — renaming those is an
infra/data-migration decision separate from the display rename, listed for the rename
commit's founder checklist (§3.4).

**F7 — Audience age band drift.** CLAUDE.md Phase-1 records "women ~40–60"; the brief
says "~45–60". No user-facing copy states a numeric band (checked), so nothing changes
in-product; recorded here so the docs don't silently disagree. Marketing surfaces state
no band either.

**F8 — Self-report must never touch protocol completeness.** The fog items ride the same
monthly ritual, but check-up validity, claim eligibility, and the invalid-marking chain
(verified 2026-07-06) key off *movement* items. Design rule, enforced by test: skipping
or abandoning the self-report appendix can never downgrade, invalidate, or gate a
measurement result — `selfReport` is additive and read by Clarity surfaces only.

---

## 2. Surface-by-surface audit — current vs target

### 2.1 Onboarding
Current (BUILT-AND-TESTED): welcome → life-goal → safety profile (DOB, reference sex,
`menopauseStage` when female — required before Continue, copy pins "never changes how
your results are measured") → single camera-setup screen → baseline check-up → results →
create block. Welcome already leads with the menopause strength narrative (Phase 1).
- Gap → target: stage question becomes skippable (F1) with taxonomy amendment (F2).
- **Symptom picture: PROMPT-ONLY.** New optional multi-select ("In the last month:
  disrupted sleep · hot flushes · joint aches · low mood · brain fog · none of these ·
  prefer not to say") stored in the profile (schema v10), used for personalisation
  context/covariates only — never diagnosis-flavoured output, never scoring. Copy
  claims-checked. Editable in Settings beside the stage field.
- First-results variant: see §2.3.

### 2.2 Check-up flow
Current (BUILT-AND-TESTED): V2 battery, voice-guided, protocol-frozen, invalid-marking
chain verified end-to-end 2026-07-06. Time-of-day is already captured (`startedAt`) —
the covariate needs zero new capture, only derivation at read.
- **Fog self-report appendix: PLANNED** (§5). One screen after the last movement, before
  results: 3–5 Likert items + one-tap sleep quality + optional symptom load. Tap-only
  (no new voice vocabulary); one optional new spoken transition line (§8.3). Skippable
  as a unit (F8).
- **Consistent-time nudge: PLANNED, copy-only.** On the manual check-up start screen and
  the retest prompt: "Check-ups compare best at a similar time of day." No notification,
  no enforcement — groundwork for covariates. Claims-checked.

### 2.3 Results / first-assessment output
Current: header "Your Strength Profile" (BUILT); three domain cards in a hardcoded tuple,
leading with percentile/IQR/benchmark copy by default (BUILT); focus engine picks the
"clearest area to build" — a defensible "biggest opportunity" (BUILT-AND-TESTED via the
assessment/focus machinery); no "strongest asset" concept; no opt-in gating of
population comparison; onboarding variant exists.
- Gap → target (**PLANNED**): diagnosis-shaped headline — "[strongest dimension] is your
  strongest asset; [focus dimension] is your biggest opportunity — here's your plan."
  Strongest-asset selection reuses the existing evidence-category ranking that the focus
  engine already computes (no new scoring; ordinal only, numbers never shown in the
  default view). When claim eligibility can't support a ranking (raw-only results), the
  headline falls back to today's honest focus copy — never a fabricated ranking.
- **Population comparison becomes opt-in**: a "Compare with published values" disclosure
  (placement: results-screen toggle persisted in prefs — founder input Q7). It renders
  the existing reference-eligible strings unchanged; raw-only results show nothing new.
  Claim machinery untouched (F4).
- Cards become dimension-generic (§4) — visually identical for the three active
  dimensions.

### 2.4 Progress / trend surfaces
Current (BUILT-AND-TESTED): baseline-relative is already the default — "Since your first
check-up" comparison, small-change honesty ("holding steady", never inflated), measured
bands drive Today snapshot copy, history renders through the shared results shell.
No chart of any kind exists.
- **"Worse never bare" (PLANNED):** every downward change row gains a paired
  trainable-path line (and, once covariates exist, known-driver context: sleep, symptom
  load). Enforced by a view-model test: direction `down` ⇒ non-empty support copy.
- **Ghost curve (PLANNED, source-gated):** from ~month 4 (≥4 monthly points), her
  trajectory against typical age-related decline as a SHADED BAND, never a line, framed
  "strength kept is strength won." Hard prerequisite: a published decline-rate source per
  metric admitted through the existing fingerprinted-source/approved-transform machinery
  — that vetting is its own step (§11 slice 8) and the surface does not build before the
  source is approved. Component is dimension-generic from day one.
- Age-band milestone retired (F3).

### 2.5 Plans
Current: continuous by construction (auto-created next block, self-healing plans,
retest → new phase). Copy audit found only mild endpoint framing ("4-week plan" titles,
block-report finality). Target: phase framing per F5 — copy-only pass, structure
untouched. **No notifications exist at all** (2026-07-03 reminders proposal remains
unbuilt), so no notification can imply an endpoint; if reminders are ever approved they
inherit this rule.

### 2.6 Settings
Current (BUILT): stage editing (female reference group only), voice picker, equipment +
swapped-out movements, optional account backup, data export. New (PLANNED): symptom
picture editing, comparison opt-in visibility (if placed here), Clarity check-in row
(flag-gated off until Clarity ships). Mic/privacy flows untouched per the brief.

### 2.7 Explore / Learn
Current (BUILT): `insight-menopause-muscle` flagship article with claims-boundary
section; "Reviewed Jul 2026" label is a recorded founder convention choice with an audit
trail (no clinical review has occurred — standing founder task). Target: article copy
joins the brand-token sweep; any fog-adjacent Learn content written later must use the
approved claim shapes (§7) — **no fog article ships in this build** (marketing must not
claim objective fog measurement anywhere until instruments exist).

### 2.8 Voice sessions / training
No structural change from this build. Session copy joins the brand sweep (2 spoken
lines, §3.3); the pain trail, tap parity, no-stall, and reported-vs-measured invariants
are explicitly out of scope and untouched.

---

## 3. Brand mechanics

### 3.1 Token design (PLANNED)
```
brand/brand.js          — CommonJS: { appName: 'Hale', appDisplayNamePossessive: "Hale's" }
src/brand/index.ts      — typed re-export for app code
app.config.js           — name: brand.appName (overrides app.json)
```
Every user-facing string interpolates `BRAND.appName`. Where voice-adjacent copy names
the app, the string builders take the token too, so screen text and any future generated
audio can never disagree.

### 3.2 Hardcoded-name audit (measured from the working tree)
- **~150 occurrences of the word "Hale" in non-test source across ~60 files** — the
  string-literal subset (≈120; remainder are comments/identifiers) is the sweep list.
  Heaviest: `exercises/ladders.ts` (15 — user-visible measurement-honesty notes),
  `AccountAuthCard.tsx` (13), `SettingsScreen.tsx` (9), `SessionPreviewScreen.tsx` (9),
  `SessionPlanningRecoveryScreen.tsx` (8), `workoutGeneration.ts` (6 — plan guidance
  strings), plus haleFlow view-model copy throughout.
- **Config:** `app.json` `name` (tokenized via F6). NOT tokenized, rename-commit
  checklist items instead: slug `hale`, scheme `hale`, bundle ids, EAS/Supabase project
  identity, `hale-release-flag-audit` error tag, storage filenames.
- **Identifiers that are code, not copy** (stay, allowlisted): `HaleLifecycleState`,
  `haleFlow/` module path, `HaleDataExport` type names.
- **Export/share text:** `dataExportService` writes `app: 'Hale'` — that field is a
  restore-validated format id; recommendation: keep it as the stable machine id forever
  and add `appDisplayName: BRAND.appName` for humans. Restore accepts the machine id
  regardless of rename (no stranded backups).
- **Art:** `assets/hale-logo-mark.png` (HeaderLogo), iOS/Android icons, splash
  background. Regeneration is founder art work at rename time.
- **Marketing site `website/`**: 13 files carry the brand; joins the rename commit, not
  this build. **`landing/` is quarantined** — live founder experiment, untouched, and no
  copy from this build leaks into it.

### 3.3 Voice audio that speaks the name (regeneration work list)
Audited every generated-line source (`safetyAudio`, `movementProfileV2Audio`,
`voiceV21Audio`, `voiceCues`, `voiceSessionLineScripts`, `safetyCueDefinitions`):
**exactly 2 bundled lines speak "Hale"** — safety cues `global_pause_if_tracking_lost`
and `tracking_keep_full_body_in_view`. Rename cost: 2 lines × 2 voices = **4 audio
assets**, generated via the existing pipeline + `verify:audio`, scripts through the
hot-phrase lint. Plus the `generate-audio.ts` fallback label. Nothing else in 364
assets/voice names the brand. Recommendation: at rename time, reword both lines to not
name the app at all ("…wait for tracking to reset") so this class of coupling ends.

### 3.4 Enforcement (PLANNED)
`brandToken.test.ts`: scans production source for `\bHale\b` inside string literals
outside `brand/` + the identifier allowlist; fails on new hardcoding. The rename then
is: edit `brand.js`, regenerate 4 assets, swap art, run the site sweep — one commit.

---

## 4. Dimension registry (build now — Part 2a)

### 4.1 Current state (the honest gap)
Domain identity is fragmented across six unions: `scoring.Domain`
(strength|balance|mobility — legacy, still feeds focus/band plumbing),
`adherence.MovementDomain`, `TrainingDomain`/`ExerciseDomain`/`TrainingPrimaryDomain`
(strength_power|balance_stability|mobility_flexibility), `UnifiedResultDomainId`,
`MovementProfileV2DomainId` (chair|balance|shoulder), `PoseAvatarActiveDomain`. The
results presentation hardcodes `readonly [Card, Card, Card]`; progress summaries are
fixed-three. Nothing accepts a fourth dimension today.

### 4.2 Design (PLANNED)
New module `src/dimensions/`:
```ts
export type DimensionId = 'strength' | 'balance' | 'mobility' | 'clarity';
export interface DimensionDefinition {
  id: DimensionId;
  displayName: string;                       // via brand-safe copy layer
  iconToken: 'strength' | 'balance' | 'mobility' | 'clarity';
  measurement: 'objective_camera' | 'self_report';
  surfaceHierarchy: number;                  // strength leads every surface (Part 1)
  compositeEligible: false;                  // literal false — rule of record, v1
  trainingDomain: TrainingDomain | null;     // clarity: null (same prescription trains it)
  legacyKeys: { ... };                       // adapters to the six existing unions
}
```
- `activeScoringDimensions(flags)` returns strength/balance/mobility;
  `clarity` registers now but is excluded from scoring surfaces until
  `EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION` flips (default off, added to the safe-beta-flag
  audit like existing flags).
- **Scope discipline:** the registry rationalizes the *presentation and trend layer*
  (results cards, progress summaries, trend readings, copy lookup). The training-side
  enums (`ExerciseDomain` etc.) are NOT rewritten — clarity has no training domain by
  design (one prescription law), and rewriting six unions across grading/training would
  be a high-risk refactor the reposition does not need. Adapters live in the registry.
- Results: `UnifiedCheckUpResultsPresentation.domains` → `readonly
  UnifiedDimensionResultCard[]`; renderers map. Progress: summaries/change rows keyed by
  `DimensionId`. Snapshot/tuple call sites updated with behavior-identical output for
  the three active dimensions (pinned by existing tests, re-pinned where copy moves).
- **Trend readings** become the generic seam both future instruments share:
  `DimensionReading { dimensionId, metricId, value, unit, atIso, basis:
  'measured'|'self_report', covariates? }` — derived at read time from stored check-ups
  (objective dims: existing snapshot metrics; clarity: `selfReport`). No new store.
- **Rolling-baseline utilities** `src/dimensions/baseline.ts`: rolling median + honest
  personal-range band (windowed IQR-style spread) over `DimensionReading[]`,
  dimension-generic, unit-agnostic — consumed now by the Clarity subjective trend,
  later by dual-task cost and fluency scores unchanged.
- **Composite guard:** registry test asserts `compositeEligible === false` for all;
  clarity never folds into any headline result in v1 — folding is a future recorded
  decision gated on observed noise characteristics (rule of record, restated here).

### 4.3 Why additive schema costs nothing here
`CheckUp` already takes optional fields (`movementProfileV2Snapshot?` etc.) and history
records deserialize tolerantly at `HISTORY_SCHEMA_VERSION = 1` — an unknown optional
field round-trips harmlessly. `selfReport?` rides that pattern with **no version bump**,
so old records stay valid and old readers ignore it (verified against
`history/serialize.ts` read path; test added). Sync: check-up backup carries whole JSON
— shape-tolerance test added to `checkupSyncService`.

---

## 5. Subjective fog instrument + covariates (build now — Part 2b)

### 5.1 Items (ORIGINAL wording — drafts for founder sign-off, critical path)
Written fresh; deliberately NOT drawn from published instruments (many are
copyright/licensed — **founder task: licensing review if a published instrument is ever
wanted**). Four items, past-week frame, 4-point frequency scale
(Rarely or never / Some days / Most days / Every day → 0–3):
1. "Finding the right word took longer than I'd like."
2. "Staying focused on one thing felt harder than usual."
3. "My thinking felt tired well before the day was done."
4. "I lost my thread partway through tasks or conversations."
In-product label: **"Self-reported tracking"** — the word "validated" is banned on these
surfaces by guardrail (§7). Screen name: "Clarity check-in" (in-product noun "Clarity";
"brain fog" stays a marketing search term only).

### 5.2 Covariates (every check-up)
- `localHour` — derived from `startedAt` at read time (zero new capture).
- `sleepQuality` — one tap, "How did you sleep last night?" Poorly / OK / Well (1–3).
- `symptomLoad` — optional, "How heavy have your menopause symptoms felt this week?"
  Light / Moderate / Heavy / Prefer not to say. Shown only when the reference group +
  stage context makes it sensible (mirrors the stage-question gating).
Stored alongside results for future correlation surfaces; never scoring, never gating.

### 5.3 Data model (additive)
```ts
// CheckUp.selfReport?: — optional, never affects protocol evidence (F8)
interface CheckUpSelfReport {
  schemaVersion: 1;
  clarity?: { itemScores: readonly (0|1|2|3)[]; itemSetId: 'clarity_items_v1'; skipped: boolean };
  covariates?: { sleepQuality?: 1|2|3; symptomLoad?: 1|2|3 | 'prefer_not_to_say' };
}
```
Raw per-item scores persist (granularity never lost); the reading derived for trends is
the item mean. `itemSetId` freezes wording-set identity so a future item revision never
silently mixes scales — same freezing discipline as measurement protocols.

### 5.4 Scoring & display rules (PLANNED; enforced by tests)
Baseline-relative ONLY: reading vs her rolling baseline band ("your usual range").
Never population percentiles, never age comparison, never a raw score alone — the trend
surface shows trajectory dots + personal band and says plainly that self-reports
fluctuate. A "worse" reading is always paired with drivers (sleep, symptom load — her
own covariates when present) and the trainable path (§2.4 rule shares the test helper).
Clarity gets its own trend surface behind the flag — never in the composite (§4.2).

### 5.5 GP-escalation path — **PLANNED tier, spec only, not built**
Cannot fire before months of data exist. Spec of record: trigger = clarity readings
below the personal baseline band in ≥3 consecutive monthly check-ups; response = one calm
card — "Your check-ins have trended down for a few months. That's worth a conversation
with your GP — here's a summary you can bring." — plus an exportable trend summary
(reuses the data-export pattern; includes covariate context). Copy shape passes the §7
banned lists (no disease words, no urgency, no rule-out). This is the ONLY escalation
path; nothing else in the product may read as alarm (guardrail-pinned when built).

### 5.6 Future objective instruments (TDD-only context; architecture hooks, no build)
1. **Dual-task variants** of existing movement tests — metric is dual-task cost (%
   degradation vs her single-task result, same session). Audio needs VOICE-ACTIVITY
   DETECTION only. Hooks made cheap by this build: `DimensionReading` basis field,
   baseline utilities, and the check-up flow's appendix pattern generalize; the VAD stays
   inside the existing voice module seam (intent matcher untouched).
2. **60-second verbal fluency** — REQUIRES on-device transcription, which contradicts the
   shipped "never transcribed" promise. That arrival therefore has a mandatory,
   impossible-to-silently-do gate, recorded here as binding: a deliberate decisions.md +
   CLAUDE.md privacy amendment, new in-context consent copy, guardrail-test updates
   (the current copy is pinned implementation-true — it will FAIL CI if transcription
   ships without the copy change), and an ASR feasibility block added to
   DEVICE_SESSION_PROTOCOL.md. None of that happens in this build.

---

## 6. Claims discipline — cognitive fence (extends existing guardrails)

New banned list in `copyGuardrails.test.ts` (+ mirrored on the site tests at rename
time), scanned across all product surfaces including the new Clarity/onboarding files:
```
COGNITIVE_CLAIM_COPY =
  dementia | alzheimer                            — banned outright, any form, any surface
  "menopause, not dementia" and all rule-out/reassurance-as-diagnosis shapes
  (fights|treats|cures|reverses|fixes) (brain fog|fog|cognitive…)
  guaranteed-outcome shapes ("will think clearer", "sharper in N weeks")
  disease-risk scare framing (risk of cognitive decline …)
  "validated" on self-report surfaces
```
Approved shapes (documented beside the regex so future copy has a template):
personal-evidence — "track how it changes as you train"; mechanism-and-mediators — "the
same training that rebuilds strength supports the sleep and symptom relief linked to
clearer thinking." Existing rules stand unchanged (medical-device, bone/hormone,
MENOPAUSE_CLAIM_COPY, equipment honesty). Every new/changed string file joins the scan
lists in the same PR that creates it — the fence lands FIRST (slice 1) so no fog-adjacent
string ever exists unscanned.

---

## 7. Copy inventory (what changes, where, coverage)

Exact string diffs are per-slice deliverables; this is the binding inventory of surfaces:

| Surface | Files (non-exhaustive keys) | Change class | Claims scan |
|---|---|---|---|
| Results header/cards/focus | `movementProfileV2/viewModel.ts`, `results/movementProfileV2ResultsAdapter.ts` | diagnosis-shaped headline; percentile→opt-in; dimension-generic | already scanned |
| Progress | `movementProfileV2ProgressViewModel.ts`, `progressProductPresentation.ts`, `ProgressScreen.tsx` | worse-never-bare pairing; phase framing | joins scan |
| Plans | `planViewModel.ts`, `adherenceCopy.ts`, `PlanScreen.tsx`, block report screens | continuous-phase framing (F5) | partially scanned → full |
| Onboarding | `WelcomeScreen.tsx`, `SafetyProfileScreen.tsx`, life-goal screen, new symptom step | skippable stage, symptom picture, tone | scanned + new files join |
| Check-up | `ManualCheckupStartScreen.tsx`, retest copy, new Clarity check-in screen | time-of-day nudge; self-report labeling | new files join |
| Milestones | `milestoneService.ts` | retire age-band type (F3) | joins scan |
| Settings | `SettingsScreen.tsx` | symptom edit, opt-in row, brand token | scanned |
| Everything brand-naming | ~60 files (§3.2) | token interpolation, no wording change | brand lint |

**Voice lines** (×2 voices, all through hot-phrase lint):
- This build: **0 required**. Optional +1 check-in transition line ("Last part — a few
  quick questions about your week.") — recommend generating it (2 assets) for flow
  continuity; tap-only otherwise.
- Rename (deferred): 2 safety-cue lines × 2 voices (§3.3).
- Explicitly NOT changed: every line speaking "Movement Check-Up" (the spoken noun is
  unchanged and screens must not diverge from voice — standing rule).

---

## 8. Programming-fit audit (report only — graders are gated work, nothing fabricated)

Catalog today: 11 ladders / 13 level-lists — sit-to-stand, squat, step-up, push,
pull-upper-back, shoulder-reach-press, hinge-glutes, heel-toe-raise, balance,
lateral-stability, mobility-flexibility. Fit against the audience:

| Need | Coverage | Backlog item |
|---|---|---|
| Impact-loading (bone) | **Missing.** Spec exists (`docs/specs/IMPACT_LOADING_DESIGN.md`, proposed, merge-inert `post_v1_beta`), blocked on FD-008 ratification + device recordings | Content backlog #1: impact-loading ladder per its spec — its 4 open founder questions are the blocker, restated in §10 |
| Pelvic-floor-aware alternatives for high-impact items | **No high-impact items exist yet**, so nothing currently violates this. The obligation attaches to the impact ladder: its regression path (supported heel drops) + the heel-toe-raise substitution must be documented as the pelvic-floor-aware route, with a capability question at the same FD-008 moment | Content backlog #2, rides #1 |
| Joint-aware progressions | Partial: per-ladder regressions, pain auto-exclusion + Settings reversal, capability gating all BUILT-AND-TESTED. No knee/wrist-specific alternates documented per ladder | Content backlog #3: per-ladder joint-substitution notes (content, not graders); affected: squat, step-up, push (wrists), hinge |
| Zero-equipment law | Holds (BUILT; equipment-honesty strings guarded) | — |

No new graded movements are designed here — graders remain gated behind the device
evening + corpus discipline, unchanged.

---

## 9. Migration / compatibility notes

- **Prefs schema v9 → v10:** `menopauseStage` gains `menopausal` (F2); new
  `symptomPicture?`, `comparisonOptIn?` (default absent=false), `voiceSetup` untouched.
  Defensive parse as v9 did. Downgrade note: an OLD app reading a v10 profile nulls the
  unknown stage value (existing validator behavior) — acceptable for local-wins backup
  merge; recorded, not hidden.
- **History schema:** stays v1; `CheckUp.selfReport?` additive (§4.3). No migration.
- **Stored check-ups without selfReport** render Clarity surfaces as "no check-in yet" —
  never fabricated, never a downgrade (F8).
- **Milestone store:** retired type tolerated on read, never re-emitted (F3).
- **Telemetry:** check-in completion/skip + covariate presence join the existing
  session-funnel pattern (no content of answers in telemetry — counts only, mirroring
  the intent-count precedent). Pain trail untouched.
- **Backups/sync:** all fields ride existing JSON blobs; shape-tolerance tests on
  `profileSyncService` + `checkupSyncService`. Nothing in the measurement or session
  path touches the network (law unchanged).
- **Never renamed:** exercise/movement ids, storage filenames, funnel schemas — session
  identity and dose maps key on them (recorded uniqueness rule).

---

## 10. Founder input on the critical path

1. **F1 + F2 calls** (skippable stage; taxonomy amendment) — blocks slice 6.
2. **Fog item final wording** (§5.1 drafts) + confirmation no published instrument is
   wanted (else licensing review) — blocks slice 4's screen copy freeze.
3. **Comparison opt-in placement** — results-screen disclosure (recommended) vs Settings.
4. **F3 + F5 sign-offs** (milestone retirement; block-report-as-phase-report).
5. **Name timing** — no build dependency; token work proceeds; rename is one commit +
   4 audio assets + art + site sweep whenever chosen. **No name invented here.**
6. **Ghost-curve decline source** — a published, citable age-decline reference per metric
   must be nominated and pass the source/transform approval machinery before slice 8.
7. Standing items restated: clinical review for Learn content (audit trail 2026-07-05);
   impact-loading FD-008 questions (its spec §open-questions); device evening remains
   owed and gates all engine-specific work (unchanged).

---

## 11. Sequenced build plan (small PRs; checkpoint after every slice)

| Slice | Work | Gate/depends |
|---|---|---|
| 1 | **Cognitive claims fence**: COGNITIVE_CLAIM_COPY + approved-shape docs + "worse never bare" test helper | none — lands first |
| 2 | **Brand token**: brand.js + typed export + config wiring + export display-name split + brand-lint test (rename NOT executed) | none |
| 3 | **Dimension registry**: `src/dimensions/`, dimension-generic results/progress components (3 dims, output visually unchanged, tests re-pinned), baseline utilities, clarity registered + flagged off, composite guard | none |
| 4 | **Check-up appendix**: Clarity check-in screen + covariates + `selfReport` storage + sync tolerance tests + time-of-day nudge copy (+1 optional voice line ×2) | founder item 2 |
| 5 | **Results reshape**: strongest-asset/biggest-opportunity headline, percentile opt-in, milestone retirement, first-results variant polish | slice 3; founder items 3, 4 |
| 6 | **Onboarding rebuild**: stage skippability + taxonomy (schema v10), symptom picture, Settings editing, copy | founder item 1 |
| 7 | **Continuous-phase copy pass** (plans/block report/progress framing) + Clarity trend surface behind flag | slices 3–4 |
| 8 | **Ghost curve**: source vetting → approval → shaded-band component behind ≥4-point threshold | founder item 6; explicitly deferrable |

Each slice: tsc clean, full jest green, guardrail + brand lint green, decisions.md entry,
checkpoint report in the standing BUILT-AND-TESTED / SOURCE-PINNED / PLANNED format.
On-device verification items accumulate into the existing batched device-evening protocol
(nothing here adds camera/mic surface; the check-in screen is a plain tap flow).

**Explicitly not in any slice:** graders or engine work of any kind, camera-path changes,
objective Clarity instruments, transcription or any privacy-promise change, notifications,
composite scores, the rename itself, `landing/` in any form.

---

**Stopping here for approval.** The three decisions that block the earliest affected
slices: **F1/F2** (stage question — slice 6), **fog item wording** (slice 4), and
**opt-in placement + F3/F5 sign-offs** (slice 5). Slices 1–3 have no open dependency and
can start on your word.
