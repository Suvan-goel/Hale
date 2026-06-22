You are implementing Stage 4F-R.1 of Hale’s production-readiness work:

PROGRESSION-MODEL ENFORCEMENT, EXPLICIT TRANSITION POLICIES, CONSERVATIVE CONTROLLED-BETA AUTO-PROGRESSION CEILINGS, NON-LINEAR LADDER CONTAINMENT, AND F4R-008 REMEDIATION

“Stage 4F-R.1” is the implementation pass arising from the read-only Stage 4F-R movement-specific progression audit.

This is a focused production-code remediation task.

Do not begin Stage 4G-R mobility presentation/rotation and minimal-equipment positioning, Stage 3D-B, physical-device validation, store-release work, optional-level enablement, load prescription, or unrelated UI/product work in this task.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_4F_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md

Also read the relevant upstream evidence contracts:

- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 4F-R.1

The current exercise catalogue contains:

- 37 registered levels;
- 11 ladders;
- 30 controlled-beta available core levels;
- 7 hidden optional levels;
- 8 ladders currently labelled `linear_progression`;
- 2 ladders labelled `supporting_set`;
- 1 ladder labelled `collection`.

Stage 4C-R is complete:

- floor transfer is distinct from floor space;
- step-up requires an explicitly confirmed environment;
- single-leg balance requires explicit supported confidence;
- Explore/manual starts require explicit daily readiness/discomfort;
- capability snapshots and stale-plan validation exist.

Stage 4D-R and Stage 4D-R.1 are complete and verified:

- one canonical text/voice safety-cue system exists;
- every registered level has a cue profile;
- 44 required safety cues exist for Clara and Marcus;
- 88/88 MP3 assets and static mappings validate;
- cue sequencing, text fallback, player controls, and Expo bundling pass.

Stage 4E-R is complete:

- all seven `v1_optional` levels remain hidden in controlled beta;
- generator, progression, Explore, manual, presets, restore, direct calls, and start validation consume one controlled-beta release policy;
- automatic progression cannot enter optional levels;
- historical optional progress remains readable but current planning is capped.

Stage 5 is complete:

- only valid schedule-credited current main-plan evidence can reach progression;
- evidence is exercise-local and feedback-gated;
- one ladder mutates at most once per credited completion;
- progression event IDs are stable and idempotent;
- fallback/skipped/invalid/manual/extra evidence is ineligible;
- cautious, short, and discomfort-adjusted sessions are `hold_only`;
- restore does not replay progression.

Stage 4F-R validation passed:

- targeted: 25 suites / 300 tests;
- audio integrity: 44 cues / 88 assets;
- full Jest: 101 suites / 823 tests;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- `git diff --check`.

Do not assume the current counts remain unchanged. Re-run and report the current baseline.

## Findings addressed by Stage 4F-R.1

### F4F-001 — P1

`progressionModel` is currently descriptive metadata rather than an enforced mutation contract.

The runtime probe proved that `supporting_set` and `collection` ladders can still mutate adjacent `currentLevelId` values:

- `overhead-reach -> overhead-press-band`;
- `supported-side-step -> loaded-march`;
- `seated-hamstring-reach -> thoracic-rotation -> supported-hip-flexor-stretch -> wall-calf-stretch`.

These are not automatic difficulty progressions.

### F4F-002 — P1

The generic rule:

```text
completion >= 0.85
average RPE <= 3
two easy credited exposures
```

is insufficient by itself for safety-sensitive transitions such as:

- slow sit-to-stand -> power sit-to-stand;
- supported squat -> free squat;
- wall push-up -> incline push-up;
- tandem balance -> single-leg balance;
- free hinge -> floor bridge;
- seated/standing row -> pull-apart.

### F4F-003 — P1

Several ladders labelled `linear_progression` mix different movements, setups, or environments:

- heel raise -> toe raise;
- seated row -> standing anchored row -> pull-apart;
- standing hinge -> floor bridge.

Automatic adjacent forward and backward mutation is semantically unsafe.

### F4F-004 — P2

Controlled-beta release ceilings hide optional levels, but visibility does not equal automatic-progress suitability.

Some visible core levels must remain practiceable while not being automatically reachable.

### F4F-005 — P2

Current tests prove generic progression plumbing but not movement-specific transition correctness.

### F4F-006 — P2

Assessment-to-training calibration is incomplete for several transitions.

### F4F-007 — P2

Physical-device evidence remains required for balance, step-up, floor, band, and camera-assisted transition validation.

Stage 4F-R.1 must close the software/content progression blocker conservatively without pretending physical-device evidence exists.

## Approved controlled-beta progression policy

The following policy is locked for this task.

These are conservative controlled-beta defaults, not permanent public-release decisions.

### 1. Adjacent catalogue order is never sufficient authority

No automatic forward or backward level mutation may occur merely because two levels are adjacent in `ladder.levels`.

Every automatic transition must be explicitly declared in one canonical transition-policy registry.

Undeclared transitions fail closed and hold.

### 2. `progressionModel` is an executable contract

#### `linear_progression`

May mutate `currentLevelId` only through an explicit declared transition whose prerequisites pass.

#### `supporting_set`

Must not automatically mutate a ladder-wide `currentLevelId`.

Eligible credited exposure may still:

- be saved;
- receive an applied progression event ID for idempotency;
- record a non-level-changing maintenance/hold decision if the existing architecture requires it.

It must not infer that one set member is a harder version of another.

#### `collection`

Must not automatically mutate a ladder-wide `currentLevelId`.

Collection entries are variety/coverage items, not ranked achievements.

#### Single-level ladder

Must remain at its sole level.

It may record maintenance evidence but cannot produce a level change.

### 3. One canonical progression-policy module

Create or harden one pure canonical module, conceptually:

```ts
type AutomaticProgressionStatus =
  | 'allowed_generic'
  | 'allowed_strong_valid_time'
  | 'blocked_manual_only'
  | 'blocked_pending_domain_review'
  | 'blocked_pending_device_validation'
  | 'blocked_non_linear_model';

type ProgressionEvidenceRequirement =
  | 'generic_easy_exposure'
  | 'strong_valid_time'
  | 'none';

type LadderTransitionPolicy = {
  fromLevelId: string;
  toLevelId: string;
  direction: 'forward' | 'regression';
  status: AutomaticProgressionStatus;
  minimumCreditedExposures: number;
  minimumCalendarDays?: number;
  requiredEvidence: ProgressionEvidenceRequirement[];
  requiredCapabilities?: string[];
  controlledBetaAllowed: boolean;
  reason: string;
};

type LadderControlledBetaProgressionPolicy = {
  schemaVersion: number;
  ladderId: string;
  model: ExerciseProgressionModel;
  defaultSelectionLevelId: string;
  autoProgressionCeilingLevelId: string;
  transitions: readonly LadderTransitionPolicy[];
};
```

Adapt to the actual codebase.

Requirements:

- pure;
- deterministic;
- stable reason codes;
- no display-name parsing;
- no hidden clock;
- one source of truth;
- explicit policy for every current ladder;
- default deny for undeclared transitions;
- compatible with Stage 4E-R release policy without duplicating it.

### 4. Visibility/practiceability is separate from automatic reachability

A core level may remain:

- visible in Explore;
- manually practiceable when all equipment/capability/daily-context/safety gates pass;
- selectable by an explicitly fixed product template if the policy permits;

while remaining unavailable through automatic ladder progression.

Do not hide additional core levels in this task unless a current production route cannot be made safe without doing so.

Manual practice remains:

- non-main-plan;
- non-schedule-credit;
- progression-ineligible.

The user manually selecting a level must never mutate `ladderProgressById`.

### 5. Conservative controlled-beta ladder policy

Implement the following automatic-progression policy.

#### Sit-to-stand

Model: linear.

Automatic forward transition allowed:

```text
sts-cushion -> sts-standard
```

Prerequisites:

- two qualifying normal-policy credited exposures at `sts-cushion`;
- generic easy thresholds;
- no pain;
- no poor/uncertain tracking;
- no valid-time incomplete/reset signal;
- normal progression policy, not `hold_only`.

Automatic forward transitions blocked:

```text
sts-standard -> sts-slow-eccentric
sts-slow-eccentric -> sts-power
```

Reason:

- cadence/control and power require movement-specific/domain/device evidence.

Controlled-beta automatic ceiling:

```text
sts-standard
```

Safe automatic regression allowed:

```text
sts-standard -> sts-cushion
```

using existing conservative pain/repeated-difficulty logic.

If historical stored state is `sts-slow-eccentric` or `sts-power`:

- preserve it in storage;
- current generated planning derives effective level `sts-standard`;
- do not rewrite on read;
- do not claim a level loss;
- manual practice may still expose the core level if current manual safety policy permits, but it remains progression-ineligible.

#### Squat

Model: linear.

No automatic forward transition in controlled beta.

Blocked:

```text
squat-supported -> squat-free
```

Reason:

- support removal requires an explicit movement-specific readiness policy.

Controlled-beta automatic ceiling/default:

```text
squat-supported
```

Safe regression from a historical `squat-free` state may select/use `squat-supported` for current planning without rewriting history.

Do not automatically mutate historical state merely because the policy is conservative.

#### Step-up

Model: single-level maintenance.

Level:

```text
step-up
```

No forward/backward mutation.

Selection remains governed by:

- Stage 4C-R step environment;
- Stage 5E daily context;
- equipment;
- current templates.

Step-up remains subject to physical-device validation before overall beta release.

#### Heel/toe raise

Reclassify from `linear_progression` to `supporting_set`, unless the current architecture has a more precise non-linear model that already fits.

Levels remain registered and core:

- `heel-raise-supported`;
- `heel-raise-free`;
- `toe-raise-supported`.

No automatic transitions:

```text
heel-raise-supported -/-> heel-raise-free
heel-raise-free -/-> toe-raise-supported
```

Do not auto-regress toe raise into heel raise.

Generated selection must not use adjacent `currentLevelId` mutation.

Where the template explicitly identifies a member, use that member if safe.

Where only the ladder is identified, use the policy’s conservative default:

```text
heel-raise-supported
```

Defer rotation/coverage refinement to later product work.

#### Push

Model: linear.

No automatic forward transition:

```text
push-up-wall -> push-up-incline
```

Reason:

- surface height/load/stability is not standardized.

Controlled-beta automatic ceiling/default:

```text
push-up-wall
```

A historical `push-up-incline` state is preserved but current auto-selected planning derives wall push-up.

Manual incline practice may remain available if current equipment, support, daily-context, release, and cue gates pass.

#### Upper-body pull

Reclassify from `linear_progression` to `supporting_set`.

Levels:

- `seated-band-row`;
- `standing-band-row`;
- `band-pull-apart`.

No automatic mutation between them.

Default when no explicit member is requested:

```text
seated-band-row
```

Existing templates may explicitly request a member only if:

- equipment and door-anchor requirements pass;
- daily context passes;
- the level is release-available;
- no automatic progression state is used to infer the choice.

Do not auto-regress pull-apart into standing row or standing row into seated row by adjacency.

#### Hinge/glutes

Reclassify from `linear_progression` to `supporting_set`.

Levels:

- `hip-hinge-wall`;
- `hip-hinge-free`;
- `glute-bridge-hold`;
- `glute-bridge-reps`.

No automatic mutation across the ladder in controlled beta.

Default when no explicit member is requested:

```text
hip-hinge-wall
```

Existing templates may explicitly request bridge work only when:

- floor space passes;
- floor-transfer capability passes;
- daily context passes;
- release/safety cues pass.

Do not auto-progress:

- wall hinge -> free hinge;
- free hinge -> bridge;
- bridge hold -> bridge reps.

Do not auto-regress between different movement families.

#### Shoulder reach/press

Keep `supporting_set`.

Levels:

- `overhead-reach`;
- `overhead-press-band`.

No ladder-wide automatic mutation.

Default:

```text
overhead-reach
```

Band press may be explicitly selected as cross-domain supporting work only through current template/equipment/safety logic.

It must never be inferred as progression from reach.

#### Static balance

Keep linear.

Automatic forward transition allowed:

```text
balance-feet-together-hold -> balance-tandem-hold
```

Prerequisites:

- at least two credited exposures;
- both use `normal` progression policy;
- both produce `strong` valid-time evidence;
- no `completed_with_resets`;
- no `tracking_uncertain`;
- no `incomplete`;
- no pain;
- supported balance capability/equipment remains valid.

Automatic forward transition blocked:

```text
balance-tandem-hold -> balance-single-leg-hold
```

Reason:

- single-leg requires domain/device validation beyond setup confidence.

Controlled-beta automatic ceiling:

```text
balance-tandem-hold
```

Safe regression allowed:

```text
balance-tandem-hold -> balance-feet-together-hold
```

using existing conservative pain/repeated-incomplete logic.

Historical single-leg state remains stored but current automatic planning derives tandem.

Manual single-leg practice remains subject to Stage 4C-R explicit supported confidence, daily context, safety cues, and current manual non-progression policy.

#### Lateral stability

Keep `supporting_set`.

Levels:

- `supported-side-step`;
- `loaded-march` whose current user-facing name is March in Place;
- hidden optional `mini-band-lateral-walk`.

No automatic mutation.

Default:

```text
supported-side-step
```

March may be selected only through explicit template/slot logic, not progression adjacency.

Optional mini-band level remains hidden under Stage 4E-R.

#### Mobility/flexibility

Keep `collection`.

No automatic mutation between:

- seated hamstring reach;
- thoracic rotation;
- supported hip-flexor stretch;
- wall calf stretch;
- hidden neck rotation.

Default fallback when no explicit item is requested:

```text
seated-hamstring-reach
```

Selection may continue through explicit template/collection logic where it already exists, but must not use `currentLevelId` as a difficulty rank.

Rotation/presentation polish remains Stage 4G-R.

### 6. Undeclared transitions hold

If progression evidence requests a transition not explicitly allowed:

- do not mutate `currentLevelId`;
- record a stable decision:
  - `transition_not_auto_approved`;
  - `non_linear_progression_model`;
  - `device_validation_required`;
  - `domain_review_required`;
  - or equivalent;
- mark the progression event ID applied so replay remains idempotent where appropriate;
- do not count the event as a successful level-up;
- do not show “progressed” copy.

### 7. Non-linear evidence does not mutate ladder state

For `supporting_set` and `collection`:

- do not update `currentLevelId`;
- do not use generic adjacent regression;
- do not aggregate different members into one easy/failure counter that can later mutate another member;
- do not turn pain on one member into a different member’s “regression.”

It is acceptable to:

- persist the applied event ID;
- emit a maintenance/exposure diagnostic;
- preserve existing session feedback/history.

Do not add a new user-facing achievement model for these ladders in this task.

### 8. Per-transition evidence, not ladder-wide generic evidence

The two-exposure count must be tied to:

- the same ladder;
- the same `fromLevelId`;
- the same explicit transition policy;
- eligible normal-policy evidence.

Evidence from:

- another member of a supporting set;
- another collection item;
- a different level;
- a manually selected core level;
- a hold-only session;
- a prior policy version;

must not qualify a future automatic transition.

If current state only stores ladder-wide counters:

- extend it narrowly to preserve transition-relevant evidence;
- or conservatively reset/hold when the current level/policy changes;
- do not infer eligibility from mixed historical arrays.

### 9. Automatic progression ceilings are distinct from release ceilings

Stage 4E-R answers:

> May this level exist in controlled beta?

Stage 4F-R.1 answers:

> May the app automatically move the user into this level?

Do not merge these concepts.

A level may be:

- controlled-beta visible/practiceable;
- not automatically reachable.

Create explicit helpers for:

- release availability;
- automatic progression availability;
- effective auto-selected level.

### 10. Effective current level versus stored historical level

For current planning, derive:

```ts
effectiveLevelIdForControlledBetaProgression(...)
```

Requirements:

- preserves stored historical `currentLevelId`;
- caps or defaults current planning according to the progression policy;
- never mutates state during planning;
- stable diagnostics explain why an effective level differs;
- equal inputs produce equal output;
- unknown/malformed stored levels fail conservatively;
- optional-level capping from Stage 4E-R still occurs first or in one well-defined combined resolver.

Use one documented precedence:

1. validate ladder and stored level;
2. apply controlled-beta release availability;
3. apply movement-specific automatic progression policy/effective ceiling;
4. apply daily readiness regression;
5. apply equipment/capability/discomfort;
6. generate the exercise.

No later step may reintroduce a disallowed level.

### 11. Progression event identity and idempotency remain unchanged

Do not change the stable Stage 5D event-ID identity unless absolutely necessary.

If policy version must become part of eligibility:

- store policy version/fingerprint in evidence/snapshot;
- do not make the same historical completion replayable merely because policy changed;
- old applied event IDs remain applied.

### 12. Progression policy snapshot

New current plans must preserve a narrow immutable progression-policy snapshot.

Conceptually:

```ts
type PlannedProgressionPolicySnapshot = {
  schemaVersion: number;
  policyFingerprint: string;
  ladderId: string;
  model: ExerciseProgressionModel;
  storedLevelId?: string;
  effectiveLevelId: string;
  autoProgressionCeilingLevelId: string;
  selectionReason:
    | 'stored_level'
    | 'release_cap'
    | 'auto_progression_cap'
    | 'non_linear_default'
    | 'explicit_template_member'
    | 'daily_regression';
};
```

Adapt to current plan metadata.

Requirements:

- JSON-safe;
- deterministic;
- compact;
- no full policy duplication;
- survives local generated summaries where needed;
- compact remote round-trip if current plan summaries are synced;
- used by start-time validation;
- user/backend data cannot select a different policy channel;
- historical plans remain readable.

### 13. Start-time validation

Extend current start validation to reject new current plans when:

- progression policy snapshot is missing;
- policy schema is unsupported;
- fingerprint is stale;
- effective level is inconsistent with current policy;
- a non-linear level was selected from progression adjacency;
- an automatic transition is undeclared;
- auto-selected level exceeds the current auto-progression ceiling.

Use stable typed reasons such as:

- `missing_progression_policy_snapshot`;
- `stale_progression_policy`;
- `transition_not_auto_approved`;
- `auto_progression_ceiling_exceeded`;
- `non_linear_progression_selection_invalid`.

Do not expose internal codes directly to users.

Recovery copy:

- “This session needs to be refreshed before it can start.”
- “Hale is keeping this movement at a supported level for now.”
- “Your plan and progress are unchanged.”

### 14. Historical and restored state

Restore must:

- preserve historical `currentLevelId`;
- preserve applied event IDs;
- not replay evidence;
- not rewrite old progression state on read;
- derive the current effective beta level through the new policy;
- reject stale current plans using old policy fingerprints;
- keep historical optional/core completions readable;
- never convert collection/supporting adjacency into current authority.

If current progress was produced under the old generic policy:

- keep it as historical stored state;
- current planning uses the conservative effective level;
- diagnostics record `legacy_progression_policy_capped` or equivalent;
- do not shame the user or display a “regression.”

### 15. User-facing progression copy

Update only narrow copy/state helpers needed to remain truthful.

At an automatic ceiling or blocked transition:

- “Hale is keeping this level steady for now.”
- “You’re maintaining this movement at the highest automatic level currently included in the beta.”
- “Your plan still moves forward when you complete the session.”

For non-linear ladders:

- do not say one item “levelled up” into another;
- do not say mobility drill B is harder than mobility drill A;
- do not say band press is progress from overhead reach;
- do not say march is progress from side-step.

Stage 4G-R will handle broader collection/rotation presentation.

### 16. Main-plan credit and schedule remain separate

A held/capped session may still:

- earn Stage 5A/5B main-plan credit;
- earn Stage 5G schedule credit;
- preserve the four-week block;
- receive honest maintenance feedback.

It must not:

- fabricate a level-up;
- expose a blocked level;
- duplicate progression events.

### 17. Manual and Explore behavior

Manual practice remains progression-ineligible.

Explore:

- may show controlled-beta core levels subject to existing safety/release policy;
- must not use `currentLevelId` to rank supporting-set or collection items as harder;
- must show the effective current auto-progression level for linear ladders;
- historical stored higher level may be shown only as historical/read-only if current UI already supports that safely;
- direct start still passes Stage 4C-R/4D-R/4E-R gates.

Do not implement Stage 4G-R’s full rotation/label redesign.

### 18. Optional-level and safety-audio non-regression

Preserve:

- all seven optional levels hidden;
- 44 safety cues;
- 88 Clara/Marcus assets;
- 88 static mappings;
- `npm run verify:audio`;
- no audio regeneration;
- no provider calls;
- no `.env` inspection/output.

### 19. No fake device evidence

Do not add software checks that pretend to prove:

- real squat depth;
- real support independence;
- real step-up safety;
- real band tension;
- real incline height;
- real sway/touchdown quality;
- real chair velocity reliability.

For transitions awaiting physical-device evidence, block automatic progression and record the reason.

## Primary objective

Implement one fail-closed movement-specific progression boundary so that:

1. `progressionModel` controls mutation.

2. `supporting_set` and `collection` never auto-mutate adjacent members.

3. Every automatic transition is explicitly declared.

4. Undeclared transitions hold.

5. Mixed ladders cannot auto-progress across movement families.

6. Safety-sensitive transitions are capped pending domain/device evidence.

7. Sit-to-stand auto-progresses only cushion -> standard.

8. Squat does not auto-remove support.

9. Push does not auto-increase load/setup complexity.

10. Balance auto-progresses only feet-together -> tandem under strict strong-valid-time evidence.

11. Tandem does not auto-progress to single-leg.

12. Heel/toe, upper-pull, hinge/glutes, shoulder reach/press, lateral stability, and mobility do not use adjacent mutation.

13. Stored historical levels remain intact.

14. Current planning derives conservative effective levels.

15. Stage 5D event identity/idempotency remains intact.

16. Main-plan/schedule credit remains possible at a held level.

17. F4R-008 is closed for controlled beta by conservative containment.

18. Stage 4G-R is unblocked if all software gates pass.

## Scope boundary

This task may change:

- progression-policy types/helpers;
- ladder `progressionModel` metadata where the audit proved it incorrect;
- per-transition policy registry;
- effective-level resolution;
- progression mutation/decision integration;
- progression evidence metadata;
- plan progression-policy snapshot;
- start-time validation;
- generated-session level resolution;
- Explore effective-level/view-model logic;
- local serialization/restore normalization;
- compact remote metadata where needed;
- narrow progression copy;
- tests;
- the Stage 4F-R.1 remediation report.

This task must not change:

- exercise registry count;
- level IDs;
- optional levels to core;
- exercise instructions/cues/audio;
- equipment/capability gates;
- readiness/discomfort rules;
- main-plan/focus/schedule credit;
- generic numeric thresholds except where an explicit transition policy blocks their use;
- scoring;
- norms;
- Check-Up logic;
- exact/near focus;
- four-week schedule;
- broad UI design;
- dependencies;
- lockfiles;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the remediation report.

Important current-tree notes:

- The 88 Clara/Marcus safety MP3s and audio manifests are part of the intended current change set.
- Do not delete, regenerate, rename, or omit them.
- Do not expose `.env` contents or provider credentials.
- Stage 4F-R observed concurrent/external modifications in HaleFlow files.
- Inspect every current diff before touching a file.

Rules:

1. Treat all current modified/untracked files as user-owned.

2. Do not revert, overwrite, reformat, move, or delete unrelated work.

3. Do not edit prior reports.

4. Do not use destructive Git commands.

5. Do not install packages.

6. Do not modify lockfiles.

7. Do not regenerate audio.

8. Do not call the TTS provider.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe and unambiguous;
    - otherwise stop mutation and report the conflict.

## Step 1: Reconstruct every current progression consumer

Before editing, inspect at minimum:

- src/exercises/types.ts
- src/exercises/ladders.ts
- src/exercises/registry.ts
- src/exercises/releasePolicy.ts
- src/exercises/index.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/training/workoutGeneration.ts
- src/training/dailyTrainingContext.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/haleFlow/progressionEvidence.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/exploreViewModel.ts
- src/haleFlow/types.ts
- App.tsx
- current start-time validators
- local/backend restore and training-state sync
- every relevant progression/generation/Explore test.

Search for:

- `progressionModel`;
- `currentLevelId`;
- `levelIndex`;
- `nextLevel`;
- `previousLevel`;
- `adjacent`;
- `readyToProgress`;
- `release_cap_reached`;
- `updateLadderProgressAfterSession`;
- `applyProgressionEvidence`;
- `effective`;
- `current level`;
- `Level `;
- restored ladder progress.

Document:

- every mutation path;
- every level-selection path;
- every display consumer;
- every restore path;
- every direct helper;
- every test that relies on adjacent order.

Do not edit until this trace is complete.

## Step 2: Add the canonical transition-policy registry

Create one production module in the exercise/training domain.

Requirements:

- policy for all 11 ladders;
- explicit forward and regression transitions;
- explicit model;
- explicit default selection;
- explicit auto ceiling;
- stable reason codes;
- schema version;
- deterministic fingerprint;
- validation helper;
- no duplicate transition;
- no unknown level;
- no transition crossing ladder IDs;
- no undeclared automatic transition.

Add policy-integrity tests.

The test must fail if:

- a ladder is added without policy;
- a core level is added without being accounted for;
- a declared transition references an optional hidden level as beta-auto-reachable;
- a supporting/collection ladder declares adjacency mutation accidentally;
- duplicate from/to transitions exist;
- auto ceiling is not controlled-beta release-available.

## Step 3: Reclassify mixed ladders

Apply the locked model changes:

- `heel-toe-raise` -> `supporting_set`;
- `pull-upper-back` -> `supporting_set`;
- `hinge-glutes` -> `supporting_set`.

Keep:

- `shoulder-reach-press` -> `supporting_set`;
- `lateral-stability` -> `supporting_set`;
- `mobility-flexibility` -> `collection`.

Do not change:

- level IDs;
- registry count;
- release status;
- safety profiles;
- audio mappings.

Update catalogue tests to assert the current model intentionally.

## Step 4: Enforce model behavior in the mutation engine

Update `updateLadderProgressAfterSession` or the authoritative wrapper.

### Linear

- resolve explicit transition policy;
- apply current generic evidence only when the transition policy permits it;
- use policy-specific requirements;
- hold when blocked/undeclared.

### Supporting set / collection

- do not change `currentLevelId`;
- do not use adjacent forward/backward logic;
- do not mix member evidence into a future level transition;
- return a stable non-mutating decision;
- preserve idempotency.

### Single-level

- hold at the sole level;
- no false `progressed`.

Add direct unit tests.

## Step 5: Implement transition-scoped exposure evidence

Inspect current `LadderProgress`.

Add the narrowest state required so evidence for one transition cannot leak into another.

Possible approaches:

- reset easy/failure counters whenever effective `fromLevelId` changes;
- store `transitionEvidenceKey`;
- store current policy fingerprint;
- store per-transition count for the active transition only.

Requirements:

- same transition only;
- normal policy only for positive evidence;
- hold-only never increments positive transition count;
- pain/poor tracking/valid-time reset clears positive readiness where current policy requires;
- policy changes cannot reuse old easy counts;
- restore round-trips;
- bounded state;
- no replay.

Do not add an unbounded per-transition event history.

## Step 6: Implement strict balance evidence

For:

```text
balance-feet-together-hold -> balance-tandem-hold
```

Require:

- two separate schedule-credited progression events;
- normal policy;
- `validTimeSignal === 'strong'` for both;
- no pain;
- no poor tracking;
- no `tracking_uncertain`;
- no `completed_with_resets`;
- no `incomplete`;
- capability/equipment still current.

Generic easy completion without strong valid time must hold.

Tests:

- two strong exposures progress;
- one strong + one generic easy holds;
- reset holds/clears;
- uncertain holds;
- pain regresses/holds conservatively;
- duplicate event does not count twice;
- restored evidence works once.

## Step 7: Implement effective-level resolution

Create one pure helper used by generated current planning.

Test every ladder with:

- default state;
- each core stored level;
- hidden optional stored level;
- unknown level;
- historical state above auto ceiling;
- non-linear state;
- readiness regression;
- equipment/capability removal.

Required outcomes follow the locked policy.

Do not mutate input.

Record diagnostics such as:

- `auto_progression_cap_applied`;
- `non_linear_default_selected`;
- `legacy_progression_policy_capped`;
- `stored_level_invalid`;
- `daily_regression_applied`.

## Step 8: Update generated-session selection

Ensure current generation:

- uses effective progression level;
- does not use raw adjacent index for non-linear ladders;
- respects an explicitly fixed template member where current templates actually name one;
- otherwise uses the policy default;
- preserves requested/stored/effective/daily-selected identities;
- does not change persistent progress while planning;
- preserves Stage 4B stimulus metadata.

Tests:

- each ladder;
- each focus;
- equipment/capability/discomfort/readiness interactions;
- stored historical high state;
- no unexpected optional level;
- no unrelated substitution.

## Step 9: Update progression evidence/application

Thread policy data through Stage 5D’s authoritative boundary.

Required:

- evidence event records policy schema/fingerprint and from-level identity where needed;
- application validates the current policy;
- duplicate event remains duplicate;
- non-linear event produces no mutation;
- blocked transition produces no mutation;
- allowed transition behaves once;
- policy mismatch fails closed;
- release cap and auto-progression cap diagnostics remain distinct.

Do not make historical applied events replayable.

## Step 10: Add plan progression-policy snapshot

Stamp every new current generated plan.

Include:

- schema;
- fingerprint;
- ladder/model;
- stored/requested/effective level;
- auto ceiling;
- selection reason.

For plans with multiple generated exercises, store per-exercise or per-ladder entries in a compact deterministic list.

Tests:

- deterministic fingerprint;
- equal input equality;
- local summary round-trip;
- compact remote round-trip where current summaries are synced;
- malformed/missing data;
- no user-controlled policy channel.

## Step 11: Extend start-time validation

Add validation after release/equipment/capability and before player launch in the existing consistent order.

Tests:

- missing snapshot;
- stale fingerprint;
- unsupported schema;
- effective level above auto ceiling;
- non-linear adjacency-selected level;
- undeclared transition;
- valid current plan;
- historical plan;
- running session immutability.

Do not create a second competing recovery screen.

## Step 12: Restore and migration behavior

Test:

- old state with `overhead-press-band` as current supporting-set level;
- old state with `loaded-march`;
- old state with later mobility collection item;
- old state with `sts-power`;
- old state with `squat-free`;
- old state with `balance-single-leg-hold`;
- optional hidden state;
- missing transition evidence metadata;
- future unsupported policy schema.

Required:

- historical state preserved;
- current planning uses policy-effective level;
- no read-time rewrite;
- no replay;
- stale plan refreshes;
- new evidence uses current policy only.

## Step 13: Explore and manual truthfulness

Update the narrowest view-model logic.

### Linear ladders

- show effective current auto-progression level;
- do not show a false level-up above the auto ceiling;
- manual core practice remains available subject to all safety gates.

### Supporting set / collection

- do not use ladder `currentLevelId` to imply one member is harder;
- do not show “progressed to” copy between members;
- preserve current member lists and manual actions;
- broader “Level N”/rotation redesign remains Stage 4G-R.

Tests should protect against:

- reach -> press level-up;
- side-step -> march level-up;
- mobility drill adjacency level-up.

## Step 14: Completion/progression copy

Update pure copy helpers only where required.

Cases:

- allowed transition progressed;
- maintained at auto ceiling;
- blocked pending evidence;
- non-linear exposure recorded;
- conservative regression;
- hold-only;
- no progression event.

Copy must remain:

- calm;
- non-medical;
- non-shaming;
- honest.

Do not say “you levelled up” when no level changed.

## Step 15: Property and transition tests

Add deterministic tests across:

- all declared transitions;
- all undeclared adjacent pairs;
- all supporting-set members;
- all collection members;
- all stored core levels;
- all auto ceilings;
- normal/hold/ineligible;
- pain/tracking/valid-time;
- duplicate/replay;
- restore.

Universal invariants:

1. No supporting-set/collection event changes `currentLevelId`.
2. No undeclared transition changes `currentLevelId`.
3. No auto-selected plan exceeds its auto ceiling.
4. No optional level appears.
5. Equal inputs are deterministic.
6. Planning does not mutate stored progress.
7. Manual/extra evidence remains ineligible.
8. Block/schedule credit remains independent from level mutation.

Use bounded deterministic cases without a new dependency.

## Step 16: Full-lifecycle regression

Update Stage 5H fixtures only as required for the new snapshots/policies.

Prove:

- baseline -> block -> 12 credits -> retest -> next block still works;
- held levels do not block main-plan/schedule credit;
- progression events remain idempotent;
- restore remains deterministic;
- no legacy progression authority returns.

Do not weaken Stage 5H assertions to make the new policy pass.

## Step 17: Safety audio and optional-level regression

Run:

```bash
npm run verify:audio
```

Prove:

- 44 cues;
- 88 assets;
- Clara/Marcus parity;
- static mappings intact;
- no audio regeneration.

Prove all seven optional levels remain hidden.

## Required automated test matrix

### A. Policy integrity

- all 11 ladders;
- all 37 levels accounted for;
- explicit transitions;
- default deny;
- fingerprint.

### B. Model enforcement

- linear;
- supporting set;
- collection;
- single-level.

### C. Approved transition behavior

- sit cushion -> standard;
- balance feet-together -> tandem strong-valid-time;
- safe regressions.

### D. Blocked transitions

- standard -> slow eccentric;
- slow eccentric -> power;
- supported -> free squat;
- wall -> incline push;
- tandem -> single-leg;
- heel -> toe;
- row -> pull-apart;
- hinge -> bridge;
- reach -> press;
- side-step -> march;
- mobility adjacency.

### E. Effective-level resolution

- historical high states;
- optional states;
- invalid states;
- non-linear defaults;
- daily regression.

### F. Progression evidence/idempotency

- policy identity;
- duplicate event;
- hold-only;
- pain;
- tracking;
- valid-time;
- restore.

### G. Planning/start validation

- snapshot;
- stale/missing;
- generated selection;
- no cap bypass.

### H. Explore/manual/copy

- no false level ordering;
- manual remains non-progressing;
- honest maintenance.

### I. Persistence/backend

- local round-trip;
- remote compact round-trip;
- no read-time rewrite;
- no replay.

### J. Regression

- Stage 4A–4E-R;
- Stage 5A–5H;
- Stage 3D;
- navigation;
- TypeScript boundaries;
- safety audio.

## Test-quality requirements

Tests must:

- exercise production policy and mutation helpers;
- derive ladders/levels from the real catalogue;
- assert state before/after;
- assert diagnostics;
- fail if adjacency returns;
- fail if collection/supporting mutates;
- fail if a blocked transition becomes automatic;
- fail if old easy counters leak into a new transition;
- exercise real planning and restore where practical.

Tests must not:

- mock every layer;
- assert only helper calls;
- enable optional levels;
- change generic numeric thresholds;
- invent device measurements;
- regenerate audio;
- install packages;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic IDs, dates, evidence, and stored states.

## Validation commands

Run targeted tests for:

- catalogue/policy integrity;
- progression decision engine;
- progression evidence;
- valid-time progression;
- workout generation;
- session planning/start validation;
- Explore/manual;
- local serialization;
- backend training-state sync/restore;
- Stage 4C-R/4D-R/4E-R;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run the local non-publishing Expo export to protect the verified audio/assets:

```bash
rm -rf /tmp/hale-stage4fr1-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage4fr1-export
rc=$?
rm -rf /tmp/hale-stage4fr1-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- audio verification counts;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

Stage 4F-R reference baseline:

- targeted: 25 suites / 300 tests;
- audio: 44 cues / 88 assets;
- full Jest: 101 suites / 823 tests.

Verify current counts rather than assuming them.

## Manual source verification after tests

Retrace:

### Allowed sit-to-stand transition

```text
two normal easy cushion exposures
-> explicit transition policy
-> standard
```

### Blocked sit-to-stand power

Confirm generic evidence cannot reach slow eccentric or power.

### Balance

Confirm only two strong valid-time feet-together exposures reach tandem.

### Supporting set

Confirm row/press/lateral/hinge evidence cannot mutate adjacent members.

### Collection

Confirm mobility evidence cannot mutate item rank.

### Historical high state

Confirm storage preserved and planning effective level capped.

### Restore

Confirm no rewrite/replay.

### Credit

Confirm held level still permits valid main-plan/schedule credit.

## Remediation report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F4F-001.
   - F4F-002.
   - F4F-003.
   - F4F-004.
   - F4F-005.
   - F4F-006.
4. Finding deferred:
   - F4F-007 physical-device validation.
5. Prior progression architecture.
6. Approved controlled-beta policy.
7. Canonical transition-policy architecture.
8. Complete per-ladder policy table.
9. Model reclassification.
10. Transition-scoped evidence.
11. Sit-to-stand behavior.
12. Squat behavior.
13. Step-up behavior.
14. Heel/toe behavior.
15. Push behavior.
16. Upper-pull behavior.
17. Hinge/glutes behavior.
18. Shoulder reach/press behavior.
19. Static-balance behavior.
20. Lateral-stability behavior.
21. Mobility behavior.
22. Effective-level resolution.
23. Progression evidence/application.
24. Policy snapshot/start validation.
25. Restore/migration.
26. Explore/manual/copy truthfulness.
27. Main-plan/schedule-credit behavior.
28. Safety-audio/optional-level non-regression.
29. Files changed.
30. Tests added/changed.
31. Exact validation results.
32. Stage 4A–4E-R and Stage 5 regression verification.
33. F4R-008 status.
34. Remaining Stage 4 findings.
35. Whether Stage 4G-R is unblocked.
36. Whether core progression is controlled-beta ready.
37. Initial and final Git status.
38. Complete files-changed inventory.
39. Concurrent external changes.
40. Confirmation that no package install, lockfile change, audio regeneration, provider call, staging, commit, branch, or push occurred.

## Required invariant outcomes

After Stage 4F-R.1:

1. `progressionModel` controls mutation.
2. Supporting sets never auto-mutate adjacent members.
3. Collections never auto-mutate adjacent members.
4. Single-level ladders never produce false level changes.
5. Linear transitions require explicit policy.
6. Undeclared transitions hold.
7. Adjacent array order is not transition authority.
8. Sit-to-stand auto-progresses only cushion -> standard.
9. Sit-to-stand cannot auto-reach slow eccentric or power.
10. Squat cannot auto-remove support.
11. Push cannot auto-progress wall -> incline.
12. Balance may auto-progress feet-together -> tandem only with two strong valid-time exposures.
13. Balance cannot auto-progress tandem -> single-leg.
14. Heel raise cannot auto-progress into toe raise.
15. Upper-pull cannot auto-progress row -> pull-apart.
16. Hinge cannot auto-progress into bridge.
17. Reach cannot auto-progress into band press.
18. Side-step cannot auto-progress into march.
19. Mobility items cannot auto-progress by adjacency.
20. Non-linear pain evidence cannot regress into another movement.
21. Transition evidence is scoped to the same from-level/policy.
22. Hold-only evidence cannot build positive transition readiness.
23. Duplicate events remain idempotent.
24. Historical stored levels remain intact.
25. Current planning derives conservative effective levels.
26. Planning does not mutate progression state.
27. New plans carry progression-policy snapshots.
28. Stale/missing policy snapshots fail closed.
29. Main-plan/schedule credit remains possible at held levels.
30. No false level-up copy appears.
31. Manual/Explore do not gain progression authority.
32. All seven optional levels remain hidden.
33. Safety audio remains 44 cues / 88 assets.
34. Stage 4C-R/4D-R/4E-R protections remain.
35. Stage 5A–5H protections remain.
36. App and website typechecks pass.
37. Expo config/export pass.
38. No scoring/norm/Check-Up changes.
39. No package/lockfile/audio/provider mutation.
40. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4F-R.1 complete unless:

1. One canonical policy covers all ladders and levels.

2. `progressionModel` is enforced in mutation.

3. Supporting/collection adjacent mutation is impossible.

4. Every automatic transition is explicit.

5. Conservative controlled-beta ceilings are enforced.

6. Transition evidence cannot leak between levels/policies.

7. Effective-level resolution preserves historical state.

8. Generated planning consumes effective levels.

9. Start validation consumes policy snapshots.

10. Restore cannot reintroduce old generic adjacency.

11. Explore/manual/copy remain truthful.

12. Stage 5D idempotency remains.

13. Stage 5A–5H lifecycle remains green.

14. Optional levels remain hidden.

15. `npm run verify:audio` passes.

16. Targeted tests pass.

17. Full Jest passes.

18. App typecheck passes.

19. Website typecheck passes.

20. Expo config passes.

21. Expo export passes.

22. `git diff --check` passes.

23. No new warning is introduced without explanation.

24. No unrelated user work is reverted or overwritten.

25. No package install, lockfile change, audio regeneration, provider call, staging, commit, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4F-R.1 COMPLETE`
- `STAGE 4F-R.1 BLOCKED`

Also state exactly one:

- `F4R-008 CLOSED FOR CONTROLLED BETA`
- `F4R-008 PARTIALLY CLOSED`
- `F4R-008 REMEDIATION STILL REQUIRED`

Use `F4R-008 CLOSED FOR CONTROLLED BETA` only if all risky automatic transitions are explicitly blocked or safely gated and no P0/P1 progression-content defect remains.

Also state exactly one:

- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `CORE PROGRESSION SOFTWARE/CONTENT-BLOCKED`

Also state exactly one:

- `STAGE 4G-R UNBLOCKED`
- `STAGE 4G-R BLOCKED`

Use `STAGE 4G-R UNBLOCKED` only if no P0/P1 progression-content blocker remains.

Also state:

- `STAGE 4G-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4F-R.1 must not declare overall beta readiness. Physical-device validation remains required for blocked transitions and the full app.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Canonical transition-policy architecture.
- Ladder model changes.
- Allowed automatic transitions.
- Blocked automatic transitions.
- Per-ladder auto ceilings.
- Transition-scoped evidence behavior.
- Supporting-set/collection behavior.
- Effective historical/current level behavior.
- Planning/start-validation behavior.
- Restore behavior.
- Explore/manual/copy behavior.
- Main-plan/schedule-credit behavior.
- Safety-audio and optional-level regression result.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 4A–4E-R, Stage 5A–5H, Stage 3D, navigation, TypeScript boundaries, and safety audio remain.
- F4R-008 status.
- Remaining Stage 4 blockers.
- `STAGE 4F-R.1 COMPLETE` or blocked.
- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA` or blocked.
- `STAGE 4G-R UNBLOCKED` or blocked.
- `STAGE 4G-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, provider call, staging, commit, branch, or push occurred.
