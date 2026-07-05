# Impact-Loading Ladder — Design Spec (Phase 2 of the menopause reframe)

**Status:** proposed (founder-directed 2026-07-05, ahead of positioning validation — see
docs/decisions.md). Nothing in this spec is implemented yet except where noted.

## Why

The 2026-07-05 repositioning targets menopausal muscle loss and fall/fracture-relevant
functional decline. The training catalog covers progressive strength, balance, and mobility,
but has **no impact work**: the `power` slot holds a march and a step-up. Bone tissue
responds preferentially to brief, novel, higher-strain-rate loading (encode sources in code
comments when implemented: LIFTMOR trial — Watson et al. 2018, supervised heavy
resistance/impact in postmenopausal women; Bailey & Brooke-Wavell 2010, unilateral hopping
and femoral-neck BMD in premenopausal women; ACSM position stance on bone health). Brief
daily hops/heel-drops are the smallest home-safe version of that stimulus.

**Claims boundary (unchanged):** this is programming rationale, not product copy. User-facing
copy must never claim bone-density measurement or fracture-risk reduction —
`MENOPAUSE_CLAIM_COPY` in `copyGuardrails.test.ts` enforces this. Allowed user framing:
"brisk, springy work that trains power and landing control."

## The ladder

New `ExerciseLadder` in `src/exercises/ladders.ts`, following the heel-toe-raise shape:

- `id: 'impact-loading'`, `title: 'Springy Strength'` (user-facing name TBD by founder),
  `domain: 'strength_power'`, `progressionModel: 'linear_progression'`,
  `stimulusKind: 'impact_loading'` (new union member), `sortOrder` after `heel-toe-raise`.
- `releaseStatus: 'post_v1_beta'` at ladder and level granularity. The existing release
  policy (`releasePolicy.ts`) already models `capability_prerequisite_not_approved` and
  hides post-V1 levels in the controlled beta, so the ladder can merge structurally inert
  and flip to `v1_optional` only after replay validation + founder approval.

Levels (all zero-equipment per Law 6; `counter` for support only):

| L | id | Name | View | Movement |
|---|----|------|------|----------|
| 0 | `impact_heel_drop_supported` | Supported Heel Drops | side | Fingertips on counter. Rise onto the balls of the feet, then let the heels drop to the floor with a firm, quick landing (not a slow lower — the brisk landing is the point). |
| 1 | `impact_heel_drop_free` | Brisk Heel Drops | side | Free-standing, steady rhythm, firm landings. |
| 2 | `impact_mini_hop` | Mini Hops | front | Small two-foot hops in place near a counter; land softly through the whole foot, knees springy. |
| 3 | `impact_low_hop` | Low Hops | front | Slightly higher continuous two-foot hops. **Parked** (`post_v1_beta` even after L0–L2 release); single-leg hops are explicitly out of scope for V1. |

Prescription: `2 sets × 10`, `restSec: 45`, `autoregulate: false` (impact reps are not
velocity-autoregulated; the set ends at target or on interruption). `measurementTier:
'camera_assisted'` — count and rhythm only.

## Grading

One new set grader, `ImpactRepGrader`, a `RepCycleTracker` composition — no new primitive:

- **Signal:** smoothed (EMA) ankle-midpoint vertical position in body units, calibrated
  against the warmup-gate stance baseline. Heel drops cycle between *heels-raised* (ankle-y
  above threshold, hysteresis pair) and *landing* (return below threshold). Hops add a
  *flight* condition: both ankle-y rising together plus hip-midpoint rise; a rep is a
  **landing**, credited on the downward crossing.
- **All house rules apply:** warmup gate before any counting; hysteresis on both thresholds;
  subject-gone → tracking-interruption → full state reset; hot path allocation-free;
  UI updates throttled. Side view for heel drops (near-side chain only), front view for hops
  (both chains required).
- **Silence by default (Law 3):** no landing-quality critique, ever. A stiff-landing proxy
  (landing deceleration spike) may be **logged** as a set flag for future tuning, never
  spoken or shown.
- **Replay-first (working agreement):** before any threshold tuning, capture on-device
  landmark recordings — heel drops side-view and mini hops front-view, at least one clean
  and one sloppy performance each — and land them as `src/replay/__tests__` fixtures with
  asserted landing counts. No tuning against live camera.

## Safety gating (FD-008, proposed)

Three independent gates; any one substitutes the whole ladder:

1. **Capability question** — new `impactReadiness` entry in `MovementCapabilityProfile`
   (schema bump; `not_confirmed` default): *"Are you comfortable with small hops or brisk
   heel drops, with support nearby?"* — Yes / "Not yet" (`confirmed` / `avoid_for_now`),
   FD-007 conventions: no medical/fall-risk language, editable in Settings, unanswered never
   renders as answered. **Not** added to the onboarding funnel (the 2026-07-05 safety-setup
   pass deliberately holds it at three questions); asked contextually the first time a
   generated block would include impact work, one question on one screen.
2. **Pain/injury auto-gate** — `hasCurrentPain` in knee/hip/ankle/back, or
   `hasRecentInjury`, substitutes regardless of the capability answer.
3. **Release policy** — the ladder stays unavailable in the controlled beta until validated.

**Substitution:** `impact-loading` → `heel-toe-raise` (existing, zero-equipment, same slot
family) via the standard substitute mechanism; a missing counter never blocks (Law 6).

**Pelvic-floor note (wellness-side):** impact can feel wrong for some women (e.g. pelvic-floor
symptoms). Handled by the capability question's comfort framing plus one scripted voice line
("land softly — and skip this one if it doesn't feel right today"), never by medical intake.
Pairs with the planned pelvic-floor awareness content (Phase 2b); no symptom questions.

## Programming integration

- Enters the `power` slot as a supporting finisher alongside `loaded-march`/`step-up`; the
  generator prefers it when the capability is `confirmed` and release policy allows.
- **Stage-independent:** `menopauseStage` does not gate or bias exercise selection. The
  shipped promise is "stage shapes guidance, never measurements"; keeping the generator
  stage-blind keeps the plan explainable to every user. (Open question below.)
- Goal-bias tables (`goalDomainMapping.ts`) may later add `'impact_loading'` to
  `preferredSlotTypes` — not in the first cut.

## Voice

New cues in `scripts/generate-audio.ts` `LINES`: `ex-heel-drop`, `ex-mini-hop` (instruction
per family level group), plus the soft-landing safety line above. Regenerate for Clara and
Marcus (~6 files, one-time ElevenLabs cost) in the same pass that flips the release status —
not before, so unreleased exercises ship no dead audio.

## Implementation order

1. Catalog: ladder + levels + `impact_loading` stimulus kind, `post_v1_beta` — merges inert.
2. Grader + replay fixtures (**blocked on on-device recordings**).
3. FD-008 capability + gating + substitution wiring (founder must ratify FD-008 wording).
4. Voice lines + regeneration; flip L0–L2 to `v1_optional`.

## Open questions for the founder

1. User-facing ladder name ("Springy Strength" is a placeholder).
2. FD-008 wording sign-off, and contextual-ask vs. Settings-only placement.
3. Should impact ever be goal- or stage-biased, or stay universal? (Spec says universal.)
4. Is L3 (Low Hops) in or out of the first release?
