# Codex Prompt: Hale Training Both-Sides Round State and Dose Preservation

Read this entire prompt before changing anything.

Hale’s Training Voice V2.1 software foundation is complete and safely default-closed.

Current verified foundation state:

- Primary verdict:
  - `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_BEHAVIOR_AND_AUDIO_PENDING`
- Live exact exercise count: `37`
- Training Voice V2.1 contract count: `37`
- Missing/stale/duplicate contracts: `0 / 0 / 0`
- Exact first-use mappings: `37`
- Exact later-set mappings: `37`
- Semantic mismatches: `0`
- Bilateral side-policy errors: `0`
- Unsupported targets: `0`
- Silent target approximations: `0`
- Active spoken set-count cues: `0`
- Unique logical cue count: `163`
- Exact existing physical-pair reuse: `10`
- Pending new cue pairs: `133`
- Existing-pair script mismatches: `20`
- Training Voice V2.1 feature default: off
- Training Voice V2.1 audio ready: false
- Training Voice V2.1 behaviour ready: false
- Live V2.1-selectable exercise count: `0`
- Balance V2 remains software-complete/audio-pending and default-closed
- Physical Android/iOS QA remains deferred
- Human listening remains waived rather than completed

The exact next approved phase is:

```text
Training both-sides round state and dose-preservation implementation
```

This task implements the behavioural foundation required by approved founder decision `FD-001` for these six exact exercise levels:

1. `balance-single-leg-hold`
2. `balance-tandem-hold`
3. `chair-supported-split-squat`
4. `seated-hamstring-reach`
5. `supported-hip-flexor-stretch`
6. `wall-calf-stretch`

A round is complete only after equal prescribed work has been completed on both sides. Rest occurs after the second side, not between sides. The total programmed training dose must not be silently doubled.

This task must not generate audio and must not activate Training Voice V2.1 for users.

---

# 1. Source artifacts

Read and use:

## Training Voice V2.1 foundation

- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_FOUNDATION_HANDOFF.md`
- `scripts/audits/audit-training-voice-v21-foundation.mjs`

The current V2.1 APIs include, or are expected to include equivalents of:

```text
listTrainingVoiceContractsV21()
getTrainingVoiceContractV21(exerciseId)
planTrainingVoiceSequenceV21(input)
resolveTrainingVoiceTargetV21(input)
resolveTrainingVoiceSafetyV21(input)
resolveTrainingVoiceRuntimeReadinessV21(input)
selectTrainingVoiceRuntimeModeV21(input)
TrainingVoiceRuntimeV21
```

## Approved decisions/specification

- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`

Approved FD-001 is authoritative:

```text
A unilateral or asymmetric training round contains work on both sides
before rest.

Both sides receive equal prescribed work within the session.

The first side alternates by round.

Do not use an odd left-right-left side-specific set schedule.

Do not silently double the previous total programmed dose.
```

This is an approved implementation dependency, not an unresolved founder decision.

## Completed foundations that must remain green

- MPV2 tracked voice/runtime completion
- measurement-side/protocol metadata
- measurement-side UX
- eyes-open Balance Protocol V2
- Training Voice V2.1 exact contract foundation

Do not regress any completed P0/P1/P2 gate.

## Review status

Use:

```text
Training Voice V2.1 scripts:
founder_assumed_accepted_for_implementation

Human audio listening:
waived, not completed

Audio approval:
not granted

Physical-device QA:
deferred
```

Do not claim generated or listened audio.

---

# 2. Objective

Implement a canonical, persisted, testable both-sides round model that guarantees:

1. The six affected exercises use one explicit semantic side role.
2. A round contains a first-side segment and a second-side segment.
3. Both sides receive exactly equal prescribed total dose within the session.
4. The converted session’s total active dose equals the source prescription exactly.
5. Current set/rest structure is preserved where this does not violate a source-proven minimum valid side target.
6. If the direct half-set target is below a source-proven minimum, round count is reduced deterministically while preserving:
   - equal left/right totals,
   - exact total active dose,
   - and a valid per-side target.
7. No rest occurs between sides.
8. Rest occurs only after the second side completes or is explicitly resolved.
9. The first side alternates by round.
10. The initial first side is pinned for the session item and does not change during retry, restore, app-state changes, or voice changes.
11. Main-plan exposures alternate their initial first side over time so one side is not permanently favoured.
12. Manual/Explore practice does not silently mutate main-plan side-order history.
13. A side switch always uses a fresh setup/readiness/countdown boundary in the future V2.1 runtime.
14. Partial active work from an interrupted side is never credited twice.
15. A completed first side is preserved if interruption occurs before or during the second side.
16. Restore can resume at a safe side boundary without replaying already completed dose.
17. Existing progression receives one round result rather than two fake sets.
18. Existing session completion does not count side segments as extra sets.
19. Progression cannot be driven by one strong side masking an incomplete other side.
20. Current readiness-scaled, short-session, manual, pain-substitution, and equipment paths derive a valid dose plan from the actual final prescription.
21. An impossible equal-side rep prescription fails closed for the V2.1 path instead of creating unequal work.
22. Exact side/round targets are reflected truthfully in visible and planned voice target text.
23. The Training Voice V2.1 contracts no longer carry:
   - `IR-VOICE-ROUND-STATE`
   - `IR-VOICE-DOSE-CONVERSION`
   for the six completed exercises.
24. Other blockers such as safety integration and audio remain.
25. The live legacy training path remains unchanged and remains the default.
26. Training Voice V2.1 remains default-closed.
27. No audio is generated or changed.
28. The exact next phase becomes:
   - alternating-leg step-up support.

---

# 3. Strict scope

## In scope

- Canonical both-sides dose planner.
- Exact conversion for the six affected exercises.
- Semantic side-role definitions.
- Round/side state machine.
- Session-item plan metadata.
- Current-side and side-order pinning.
- Main-plan initial-side alternation.
- Safe side-switch transitions.
- Current prescription conversion after readiness/short-session scaling.
- Round aggregation and progression evidence.
- Session result metadata.
- Local serialization and restore.
- Existing training-state backend JSON sync/restore where applicable.
- UI state required to represent Round and current side.
- V2.1 target/sequence-planner reconciliation.
- Runtime-readiness/blocker reconciliation.
- Default-off feature flag/rollout.
- Focused tests.
- Post-implementation audit.
- Handoff to step-up alternation.

## Out of scope

Do not implement in this task:

- Step-up alternating-leg support.
- Floor-transfer readiness gate.
- Live safety-family narration integration.
- Full training pause/resume/skip/recovery voice completion.
- Micro-check Voice V2.1.
- New MP3 generation.
- ElevenLabs calls.
- Runtime TTS.
- Physical-device QA.
- Human listening review.
- Final audio manifests for nonexistent assets.
- Enabling Training Voice V2.1.
- Enabling Balance V2.
- Changing exercise ladder release status.
- New exercise levels.
- Medical claims.
- Normative scoring changes.
- New progression thresholds unrelated to preserving round evidence.
- Side-specific pain diagnosis.
- Package installation.
- Lockfile changes.
- Destructive Git operations.

Do not change live default behaviour merely to demonstrate the new engine.

---

# 4. Worktree safety

The repository is heavily dirty and contains important user-owned work.

Before editing, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
```

Also record:

- branch,
- full and short `HEAD`,
- upstream,
- pre-existing relevant changes,
- pre-existing untracked audio/audits.

Rules:

1. Do not reset, checkout, stash, clean, rebase, or discard anything.
2. Do not delete or rename existing MP3s.
3. Do not overwrite unrelated renderer, check-up, protocol, or audit work.
4. Do not regenerate audio manifests wholesale.
5. Do not commit or push.
6. Make the smallest safe edits to concurrently modified files.
7. At the end, distinguish this task’s footprint from pre-existing changes.

---

# 5. Current source to inspect

Inspect current source rather than relying on stale line numbers.

## Exercise definitions and graders

Inspect the six exact definitions and all relevant helpers:

- `balance-single-leg-hold`
- `balance-tandem-hold`
- `chair-supported-split-squat`
- `seated-hamstring-reach`
- `supported-hip-flexor-stretch`
- `wall-calf-stretch`

At minimum inspect:

- `src/exercises/index.ts`
- exact exercise files
- `src/exercises/ladders.ts`
- `src/exercises/types.ts`
- `src/exercises/setGraders.ts`
- `src/exercises/common.ts`
- current set/hold/timer/ROM graders
- minimum-valid-window rules
- autoregulation rules
- progression rules

## Training generation/runtime

- `src/training/sessionPlayer.ts`
- `src/training/workoutGeneration.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/dynamicState.ts`
- `src/training/progression.ts`
- `src/training/validTimeProgression.ts`
- `src/training/serialize.ts`
- current session-plan/item/result types
- current pause/resume/skip/cancel handling
- current session completion/result aggregation
- current manual/Explore session path
- `src/screens/TrainingSessionScreen.tsx`
- relevant `App.tsx` plumbing

## Backend/persistence

Inspect relevant:

- training-state sync service
- session completion sync
- restore service
- account export
- result merge/fingerprint logic

## Voice V2.1 foundation

Inspect all current files under:

```text
src/training/voiceV21/
```

including:

- contracts
- target grammar
- safety policy
- sequence planner
- readiness
- runtime adapter
- tests

## Completed runtime foundations

Inspect `VoiceChannel.speakTracked` and current MPV2 state/scope patterns only as architectural references.

Do not copy check-up-specific logic blindly.

Search broadly for:

```text
setIndex
setCount
target
targetReps
targetSeconds
holdMs
validTime
round
side
left
right
standingLeg
leadFoot
extendedLeg
frontLeg
rearLeg
rest
autoregulation
countsTowardMainPlan
manual
Explore
restore
session completion
ladder progress
```

Follow actual call paths.

---

# 6. Approved dose-preservation policy

Implement this policy exactly unless current source proves that it would violate a hard grader validity requirement.

## 6.1 Source dose

For each final prescribed session item, after all current scaling/substitution logic:

```text
source total active dose =
source set count × source target per set
```

Units must remain explicit:

- repetitions,
- milliseconds of hold/timer work,
- milliseconds of ROM/capture work.

Rest is not part of active dose.

## 6.2 Direct conversion

Default conversion:

```text
one source set becomes one both-sides round

round active dose =
first-side target + second-side target

first-side target =
second-side target =
source target per set / 2
```

This preserves:

- source set count as round count,
- source rest count,
- total active dose,
- equal side totals.

## 6.3 Minimum-valid-target exception

Before accepting the direct conversion, inspect source-proven grader/runtime minimums.

If the direct per-side target is below a real minimum valid side target:

1. Do not invent a minimum from the default target.
2. Use only a threshold established by current code/tests or an explicit exercise contract.
3. Reduce round count to the **largest positive integer no greater than source set count** that allows:
   - each side target to meet the minimum,
   - equal left/right total dose,
   - exact source total active dose.
4. Time targets may use 250 ms precision.
5. Rep targets must remain whole integers.
6. If no valid exact plan exists:
   - mark the V2.1 behaviour not selectable,
   - report `DOSE_PLAN_UNREPRESENTABLE`,
   - do not silently change total dose or create unequal sides.

## 6.4 No silent tolerance

Target totals must match exactly.

Do not use an undocumented ±5% or ±10% tolerance.

If an exact plan cannot be represented, fail closed.

## 6.5 Voice for fractional or awkward time targets

The software may use precise millisecond targets such as 7,500 ms or 11,250 ms.

Do not require awkward spoken fractions.

For a fractional or otherwise unsuitable spoken target, use a truthful nonnumeric logical instruction such as:

```text
Hold until I say switch.
```

or movement-appropriate equivalent.

Visible UI may show a precise rounded display only if it remains truthful, for example:

```text
7.5 sec each side
```

Do not speak or show a different target from the runtime target.

---

# 7. Expected source-dose reconciliation

Independently verify these current source doses.

They are the expected baseline from the Training Voice V2.1 handoff:

| Exercise | Expected source prescription | Expected source total |
|---|---:|---:|
| balance-single-leg-hold | 3 × 15 sec | 45 sec |
| balance-tandem-hold | 3 × 20 sec | 60 sec |
| chair-supported-split-squat | 2 × 8 reps | 16 reps |
| seated-hamstring-reach | 2 × 12 sec ROM window | 24 sec |
| supported-hip-flexor-stretch | 2 × 30 sec | 60 sec |
| wall-calf-stretch | 2 × 30 sec | 60 sec |

## Direct-conversion candidates before minimum validation

| Exercise | Candidate rounds | Candidate target per side per round |
|---|---:|---:|
| balance-single-leg-hold | 3 | 7,500 ms |
| balance-tandem-hold | 3 | 10,000 ms |
| chair-supported-split-squat | 2 | 4 reps |
| seated-hamstring-reach | 2 | 6,000 ms |
| supported-hip-flexor-stretch | 2 | 15,000 ms |
| wall-calf-stretch | 2 | 15,000 ms |

These are candidates, not permission to ignore a real grader minimum.

The final implementation must produce a source-backed conversion matrix.

If a candidate changes because of a proven minimum, report:

- the exact minimum,
- its source,
- chosen round count,
- exact target per side,
- proof that total and left/right dose remain exact.

No founder clarification is required if all approved invariants remain satisfied.

---

# 8. Semantic side roles

Do not use a generic side label without defining what it means.

Add a strict semantic role, such as:

```ts
export type TrainingRoundSide = 'left' | 'right';

export type TrainingRoundSideRole =
  | 'standing_leg'
  | 'lead_foot'
  | 'front_leg'
  | 'extended_leg'
  | 'stretched_hip_side'
  | 'stretched_calf_side';
```

Independently verify the correct role and stance semantics.

Expected mapping:

| Exercise | Semantic side |
|---|---|
| balance-single-leg-hold | standing leg |
| balance-tandem-hold | front/lead foot |
| chair-supported-split-squat | front/lead leg |
| seated-hamstring-reach | extended leg |
| supported-hip-flexor-stretch | stretched hip/rear-leg side |
| wall-calf-stretch | stretched calf/rear-leg side |

## Requirements

- Runtime side means the body side receiving the prescribed work.
- Side-specific setup derives from that semantic role.
- Voice/UI/controller/grader/result metadata must use the same semantic side.
- For hip-flexor/calf stretches, the spoken stance may position the opposite foot forward; do not invert the stored working side.
- Retry and restore preserve semantic side.
- No side is inferred from whichever pose chain happens to be clearer.
- Do not reuse official measurement-side metadata for training rounds.

---

# 9. Canonical dose-plan types

Create a focused production module using repository conventions, for example:

```text
src/training/bothSidesRounds/
  types.ts
  dosePlanner.ts
  stateMachine.ts
  aggregation.ts
  persistence.ts
  index.ts
```

Use fewer files if preferred.

A suitable conceptual model is:

```ts
export const TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION = 1 as const;

export type BothSidesDoseUnit =
  | 'reps'
  | 'hold_ms'
  | 'timer_ms'
  | 'rom_window_ms';

export interface BothSidesRoundSideTarget {
  side: TrainingRoundSide;
  targetReps?: number;
  targetMs?: number;
}

export interface BothSidesRoundDescriptor {
  roundIndex: number;
  startSide: TrainingRoundSide;
  sideOrder: readonly [TrainingRoundSide, TrainingRoundSide];
  targets: Readonly<Record<TrainingRoundSide, BothSidesRoundSideTarget>>;
}

export interface BothSidesDosePlan {
  version: typeof TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION;
  exerciseId: string;
  sideRole: TrainingRoundSideRole;

  sourceSetCount: number;
  sourceTargetPerSet: number;
  sourceUnit: BothSidesDoseUnit;
  sourceTotalDose: number;

  roundCount: number;
  rounds: readonly BothSidesRoundDescriptor[];

  totalLeftDose: number;
  totalRightDose: number;
  convertedTotalDose: number;

  minimumValidSideTarget: number | null;
  conversionReason:
    | 'direct_half_set'
    | 'round_count_reduced_for_minimum'
    | 'unrepresentable';

  exactDosePreserved: boolean;
  equalSideDose: boolean;
  runtimeSelectable: boolean;
  blockerReasonCodes: readonly string[];
}
```

Equivalent names are acceptable.

## Requirements

- Immutable/readonly.
- No `any`.
- No unitless numeric fields.
- Rep and time plans cannot be confused.
- Stable version.
- JSON-safe.
- Deterministic output.
- Plan fingerprint or stable identity for restore/conflict checks.
- Source prescription is retained for auditability.
- Do not mutate the exercise catalogue defaults.

---

# 10. Generic dose planner

Create a pure planner such as:

```ts
deriveBothSidesDosePlan({
  exerciseId,
  prescribedSetCount,
  prescribedTarget,
  targetUnit,
  minimumValidSideTarget,
  initialStartSide,
}): BothSidesDosePlan
```

## Algorithm requirements

### Time/hold/ROM

1. Convert source values to integer milliseconds.
2. Calculate source total exactly.
3. Try source set count as round count.
4. Calculate equal per-side target.
5. Require 250 ms precision.
6. If below a proven minimum, reduce round count as described.
7. Require:
   - left total = right total,
   - converted total = source total.
8. Never round runtime dose merely for speech.

### Repetitions

1. Calculate source total reps exactly.
2. Require an even source total so both sides can receive equal whole reps.
3. Prefer source set count as round count when each round can split evenly.
4. If per-round source reps are odd but total is even:
   - distribute whole reps deterministically across rounds,
   - preserve equal session totals,
   - alternate which side receives any per-round extra,
   - but never produce unequal final side totals.
5. If exact equal integer allocation is impossible, block.

The six expected current plans should all be representable.

## Reason codes

Use stable reason codes such as:

```text
DIRECT_HALF_SET
MINIMUM_SIDE_TARGET
ROUND_COUNT_REDUCED
NON_INTEGER_REP_TARGET
ODD_TOTAL_REPS
TIME_PRECISION_UNSUPPORTED
TOTAL_DOSE_MISMATCH
SIDE_DOSE_MISMATCH
UNKNOWN_EXERCISE
UNSUPPORTED_UNIT
```

---

# 11. Initial side and side-order policy

Implement deterministic order without permanent side bias.

## 11.1 Item-level pinning

Every generated both-sides session item must pin:

- `initialStartSide`,
- dose-plan version,
- round descriptors,
- source prescription fingerprint.

These values cannot change mid-session.

## 11.2 Within-session order

If initial side is left:

```text
Round 1: left → right
Round 2: right → left
Round 3: left → right
...
```

If initial side is right, mirror it.

## 11.3 Across main-plan exposures

Use one canonical persisted source of truth such as:

```ts
nextBothSidesStartSideByExercise: Partial<Record<ExerciseId, TrainingRoundSide>>
```

or a repository-consistent equivalent.

Rules:

- Default to left when absent.
- Pin the current value into the generated main-plan item.
- Flip the persisted next side only after successful exercise completion.
- Do not flip after:
  - skip,
  - cancel,
  - invalid/incomplete exercise,
  - abandoned session.
- Manual/Explore practice may use the current seed, but must not mutate main-plan next-side state unless it already counts toward main-plan progression under existing rules.
- Sync/restore must preserve the seed.
- Duplicate completion processing must be idempotent.

Do not create two competing side-order stores.

---

# 12. Round state machine

Create an explicit state model.

A suitable conceptual shape is:

```ts
export type BothSidesRoundPhase =
  | 'round_setup'
  | 'side_setup'
  | 'side_ready'
  | 'side_countdown'
  | 'side_active'
  | 'side_complete'
  | 'side_switch'
  | 'round_complete'
  | 'rest'
  | 'exercise_complete'
  | 'interrupted'
  | 'cancelled';

export interface BothSidesRoundRuntimeState {
  dosePlan: BothSidesDosePlan;
  roundIndex: number;
  currentSideIndex: 0 | 1;
  currentSide: TrainingRoundSide;
  currentSideAttemptId: string;
  phase: BothSidesRoundPhase;
  sideResults: Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>>;
  completedRounds: TrainingRoundResult[];
  stageEpoch: number;
}
```

Equivalent naming is acceptable.

## Required transition order

For each round:

```text
first-side setup
→ first-side readiness
→ fresh countdown
→ first-side active
→ first-side complete
→ side switch
→ second-side setup
→ second-side readiness
→ fresh countdown
→ second-side active
→ second-side complete
→ round complete
→ rest or exercise complete
```

## Illegal transitions

Make these impossible:

```text
rest after first side
round complete with only one side resolved
second side using first-side target/role incorrectly
active side without a pinned side
active side without fresh countdown
round index increment before both sides resolve
same side completed twice in one round
old-side callback mutating new side
source dose changing during active exercise
```

Use explicit actions/guards rather than screen assumptions.

---

# 13. Interruption, retry, pause, and restore semantics

Training controls/recovery voice is a later phase, but the round data semantics must be safe now.

## 13.1 Tracking interruption during current side

- Invalidate partial current-side attempt.
- Do not add partial reps/time to the completed side result.
- Preserve a completed opposite-side result in the same round.
- Return to current-side setup.
- Use a new side-attempt id.
- Require a fresh countdown in the future V2.1 runtime.
- Never restart the whole round unless current source cannot preserve the first-side result safely; if so, report and justify.

## 13.2 Pause

Preserve:

- dose plan,
- round,
- current side,
- completed side result.

Follow existing pause semantics for active accumulation.

If current architecture cannot safely resume a partial camera-measured side, restart only the current side from zero after resume.

Do not repeat completed first-side dose.

## 13.3 App background/unmount during active side

Use the safest existing training rule.

Preferred:

- discard partial current side,
- preserve completed opposite side,
- resume at current-side setup with fresh countdown.

## 13.4 Restore

Persist at safe checkpoints:

- plan,
- round index,
- side order,
- current side,
- completed side result,
- completed rounds.

Restore rules:

- If restored between sides, continue with the second-side setup.
- If restored during an active side, restart that side from zero.
- Do not replay or re-credit a completed side.
- Do not change initial side.
- Do not derive a new plan from current defaults after restore.

## 13.5 Skip/cancel

- Skip/cancel exits the entire exercise under current product semantics.
- Do not add a new “skip only this side” action in this task.
- Incomplete round does not count as completed.
- Main-plan next-start-side seed does not flip.

---

# 14. Side-segment and round results

Create additive result types.

A suitable conceptual model is:

```ts
export interface TrainingSideSegmentResult {
  side: TrainingRoundSide;
  sideRole: TrainingRoundSideRole;
  targetReps?: number;
  completedReps?: number;
  targetMs?: number;
  validTimeMs?: number;
  completedTarget: boolean;
  valid: boolean;
  endReason:
    | 'target_completed'
    | 'autoregulated'
    | 'tracking_interrupted'
    | 'user_stopped'
    | 'skipped'
    | 'cancelled'
    | 'invalid';
  attemptId: string;
}

export interface TrainingRoundResult {
  roundIndex: number;
  startSide: TrainingRoundSide;
  sideOrder: readonly [TrainingRoundSide, TrainingRoundSide];
  left: TrainingSideSegmentResult;
  right: TrainingSideSegmentResult;

  completedBothSides: boolean;
  totalCompletedDose: number;
  totalTargetDose: number;
  leftCompletionRatio: number;
  rightCompletionRatio: number;
  conservativeCompletionRatio: number;
}
```

Equivalent names are acceptable.

## Aggregation rules

- `completedBothSides` requires valid resolution of both sides.
- Total reps/time may be summed for raw reporting.
- Conservative completion ratio is the lower of left/right completion ratios.
- Progression cannot use only the summed total if one side is incomplete.
- One round result maps to one set/round completion event.
- Side segments do not increment set count separately.
- Existing session completion counts the exercise once.
- Existing rep-credit SFX may still occur per accepted rep.
- Do not create duplicate progression events.

---

# 15. Progression and valid-time integration

Inspect current progression and valid-time logic carefully.

## Required principles

1. Preserve current total dose.
2. Preserve current exercise/ladder identity.
3. Do not create a new exercise level merely for round behaviour.
4. One completed round is the unit replacing one converted source set.
5. Progression evidence may include:
   - completed rounds,
   - total dose completion,
   - conservative side completion,
   - per-side valid time/reps.
6. A strong side cannot mask an incomplete other side.
7. Progression eligibility requires all prescribed rounds to satisfy current completion rules on both sides.
8. Perceived effort remains under current session-level policy.
9. Existing progression thresholds remain unchanged unless a technical mapping is required.
10. Do not double valid-time totals.
11. Do not create two session completion records for one exercise.
12. Existing legacy sessions without round metadata remain readable.

## Valid-time cards

If current summaries expose valid time:

- use the aggregate total once,
- optionally expose side detail internally,
- do not show doubled totals,
- do not create two cards for the same round.

---

# 16. Workout generation and prescription integration

Derive the dose plan only after the final session item prescription is known.

Cover:

- normal generated plan,
- readiness-scaled target,
- reduced set count,
- short session,
- equipment substitution,
- pain substitution,
- manual/Explore practice,
- optional exercise reachability,
- restored pre-generated plan.

## Requirements

- The planner receives final set count/target.
- Do not hard-code catalogue defaults.
- Persist the generated plan with the session item.
- Generated-session fingerprint includes dose-plan version and source prescription.
- Existing generated sessions without a plan remain legacy.
- Do not migrate an in-progress legacy session into both-sides semantics.
- New internal V2.1 test sessions may use the new plan.
- If scaled rep total becomes odd/unrepresentable, V2.1 readiness blocks that item.
- No silent target adjustment.

---

# 17. Training Voice V2.1 integration

Update the V2.1 contract/planner layer to consume the actual dose plan.

## 17.1 Side-specific setup

Use current contract side variants according to semantic side role.

Examples:

- single-leg: standing leg
- tandem: lead foot
- split squat: front leg
- hamstring reach: extended leg
- hip flexor: stretched/rear leg
- calf stretch: stretched/rear leg

Verify exact scripts against movement truth.

## 17.2 Target plans

The planned target must describe the side segment, not the old whole set.

Rules:

- Integer natural time target may use an exact time phrase.
- Fractional or awkward time uses a truthful nonnumeric line such as:
  - `Hold until I say switch.`
- Split squat uses exact per-side reps.
- ROM uses exact movement-appropriate language.
- Visible target and voice plan agree.
- No line still says the source whole-set target for one side.
- No spoken total set count.

## 17.3 Side switch

After the first side:

- no rest cue,
- emit the logical side-switch cue,
- emit the second-side setup,
- require final-position readiness,
- use a fresh countdown.

After the second side:

- emit round completion/rest or exercise completion.

## 17.4 Later rounds

The first side alternates according to the pinned plan.

Later-round reminder must identify the current side where needed.

## 17.5 Logical assets only

Update logical asset requirements as required.

Do not:

- add nonexistent cue ids to physical `VoiceCueId`,
- add nonexistent assets to manifests,
- generate MP3s.

---

# 18. UI requirements

Implement only UI needed to represent the new internal path truthfully.

When the internal both-sides V2.1 path is active in tests/internal builds, show:

- `Round 1 of 3` rather than treating each side as a set,
- current semantic side:
  - `Left leg`
  - `Right leg`
  - or movement-appropriate label,
- current side target,
- side progress within the round,
- no rest screen between sides,
- rest only after the second side.

## Accessibility

- semantic side appears in accessible label,
- round/side order is screen-reader coherent,
- no colour-only side distinction,
- controls remain large,
- current side is not encoded only by mirrored graphics.

Do not redesign the entire training screen.

Legacy path appearance remains unchanged.

---

# 19. Persistence and backend

Add metadata additively.

## Required persisted fields

At minimum persist:

- dose-plan version,
- plan fingerprint,
- source set count/target/unit,
- round descriptors,
- initial start side,
- current round index,
- current side,
- completed side result,
- completed round results,
- next-main-plan start-side seed where stored.

## Requirements

- Local round trip.
- App restart restore.
- Backend training-state JSON round trip where current architecture supports it.
- Offline completion then later sync.
- Duplicate merge preserves richer round metadata.
- Old clients may ignore additive fields.
- Old sessions remain readable.
- Malformed round metadata fails safely to legacy/nonselectable state.
- Do not execute a remote migration.
- Add a nullable/additive migration only if current architecture truly requires it.
- Do not infer completed side data from old set results.

---

# 20. Feature flags and readiness

Use a narrow internal flag such as:

```text
EXPO_PUBLIC_ENABLE_TRAINING_BOTH_SIDES_ROUNDS
```

Equivalent naming is acceptable.

## Defaults

```text
Training both-sides rounds feature: off
Training both-sides rounds software ready: true after this task passes
Training Voice V2.1 feature: off
Training Voice V2.1 audio ready: false
Training Voice V2.1 global behaviour ready: still false
```

Global behaviour remains false because other approved dependencies remain:

- step-up alternation,
- floor gate,
- live safety integration,
- training controls/recovery,
- audio.

## Selection rules

- Flag off: live legacy behaviour unchanged.
- Flag on without an internal V2.1-ready test/runtime context:
  - do not partially change session semantics under legacy voice.
- Both-sides behaviour and V2.1 voice must not become independently half-active in a user session.
- Internal tests may inject ready logical assets/runtime.
- No public route should activate the new path.

## Readiness reconciliation

For the six contracts:

- remove `IR-VOICE-ROUND-STATE`,
- remove `IR-VOICE-DOSE-CONVERSION`,
- keep remaining valid blockers, such as:
  - safety integration,
  - audio assets,
  - control/recovery where applicable.

Audit the resulting counts.

---

# 21. Diagnostics

Add bounded, privacy-safe diagnostics for:

- source prescription,
- dose plan created,
- minimum validity adjustment,
- round started,
- first side started/completed,
- side switch,
- second side started/completed,
- round completed,
- rest entered,
- current side retry,
- restore checkpoint,
- plan fingerprint mismatch,
- main-plan start-side seed flipped,
- unrepresentable dose plan,
- progression aggregation.

Do not log:

- raw video,
- landmarks,
- account ids,
- user name,
- detailed health results.

Use stable reason codes.

---

# 22. Required tests

Do not weaken or delete existing tests.

## 22.1 Dose planner tests

1. Single-leg expected source total is reconciled from live prescription.
2. Tandem source total is reconciled.
3. Split-squat source total is reconciled.
4. Hamstring source total is reconciled.
5. Hip-flexor source total is reconciled.
6. Calf source total is reconciled.
7. Direct half-set conversion preserves exact total.
8. Left and right totals are equal.
9. Time values use supported precision.
10. Proven minimum reduces round count deterministically.
11. Reduced round count still preserves exact total.
12. Default target is not treated as a minimum without evidence.
13. Even reps split exactly.
14. Odd total reps fail closed.
15. Unsupported unit fails closed.
16. Unknown exercise fails closed.
17. Readiness-scaled prescription derives from scaled values.
18. Short-session prescription derives from final values.
19. No silent rounding.
20. Plan output is deterministic.

## 22.2 Expected conversion matrix tests

Verify the final source-backed matrix for all six.

For every row assert:

- source total,
- round count,
- side target,
- left total,
- right total,
- converted total,
- exact preservation,
- minimum source,
- conversion reason.

If final values differ from the direct candidates, tests must cite the proven minimum rule.

## 22.3 Side-role tests

1. Single-leg uses standing leg.
2. Tandem uses lead/front foot.
3. Split squat uses front/lead leg.
4. Hamstring uses extended leg.
5. Hip flexor uses stretched/rear-leg side.
6. Calf uses stretched/rear-leg side.
7. No role inversion in side-specific setup.
8. No measurement-side metadata is reused.
9. Retry preserves semantic side.
10. Restore preserves semantic side.

## 22.4 State-machine tests

1. Round starts at pinned first side.
2. Round 2 starts opposite side.
3. Round 3 returns to initial side.
4. First-side completion enters side switch, not rest.
5. Second-side completion enters round completion.
6. Rest occurs only after second side.
7. Round cannot complete with one side missing.
8. Same side cannot complete twice.
9. Fresh countdown is required for each side.
10. Old-side callback is ignored.
11. Active target matches current side plan.
12. Final round completes exercise.
13. Skip exits whole exercise.
14. Cancel exits whole exercise.
15. No side-only skip exists.

## 22.5 Interruption/restore tests

1. Tracking interruption on first side restarts first side from zero.
2. Tracking interruption on second side preserves completed first side.
3. Second side restarts from zero.
4. Restore between sides continues second-side setup.
5. Restore during active side restarts only current side.
6. Restore does not regenerate a different plan.
7. Restore preserves initial side.
8. Completed side is not replayed.
9. Partial side is not credited.
10. No duplicate round completion.
11. App background follows safe current-side restart.
12. Stale callback cannot save old side result.

## 22.6 Start-side persistence tests

1. Missing seed defaults left.
2. Main-plan item pins current seed.
3. Round order alternates within session.
4. Successful main-plan exercise flips next seed.
5. Skip does not flip.
6. Cancel does not flip.
7. Incomplete exercise does not flip.
8. Duplicate completion is idempotent.
9. Manual/Explore practice does not mutate main-plan seed unless existing main-plan rules explicitly count it.
10. Sync/restore preserves seed.

## 22.7 Progression tests

1. One round creates one round/set completion event.
2. Side segments do not double set count.
3. Total valid time is not doubled.
4. Total reps equal source total.
5. Conservative completion uses the weaker side.
6. One complete side cannot mask one incomplete side.
7. Progression requires both sides.
8. Existing ladder identity is preserved.
9. Session completion occurs once.
10. Legacy set result remains readable.
11. Valid-time summary does not duplicate cards.
12. Autoregulation result remains deterministic.

## 22.8 Generation/variant tests

1. Normal generated plan gets a dose plan.
2. Readiness-scaled plan gets a dose plan.
3. Short session gets a dose plan.
4. Pain substitution resolves the substituted exercise only.
5. Equipment substitution resolves the final exercise only.
6. Manual practice gets a plan.
7. Restored item uses stored plan.
8. Odd/unrepresentable rep target blocks V2.1.
9. Unmapped affected item count is zero.
10. Nonaffected exercises receive no round plan.

## 22.9 Voice V2.1 planner tests

1. Current side setup key matches semantic side.
2. First side target matches runtime.
3. Second side target matches runtime.
4. Fractional time uses truthful nonnumeric voice target.
5. Integer side target uses exact phrase where supported.
6. No source whole-set target is spoken for one side.
7. First-side completion emits side switch without rest.
8. Second-side completion may emit rest.
9. Later round uses correct first side.
10. Repeat instructions use current side/target.
11. No total set-count cue.
12. Missing side-switch asset remains an audio blocker, not a broad fallback.
13. Physical manifest is unchanged.

## 22.10 Feature/legacy isolation tests

1. Both-sides flag off leaves live behaviour unchanged.
2. Training Voice V2.1 remains off.
3. Audio ready remains false.
4. Global behaviour ready remains false.
5. Legacy and both-sides V2.1 paths cannot run simultaneously.
6. Enabling only the round flag does not partially alter a legacy-voice user session.
7. Internal ready injection can exercise the new state machine.
8. Unknown/malformed plan fails closed.
9. Balance V2 remains default-closed.
10. `npm run verify:audio` remains green.

## 22.11 Regression tests

Re-run relevant existing suites for:

- training session player,
- workout generation,
- readiness/pain/equipment substitutions,
- training dynamic state,
- progression,
- valid-time progression,
- serialization,
- backend training-state sync/restore,
- Training Voice V2.1 foundation,
- MPV2 voice/runtime,
- measurement side,
- Balance V2.

Preserve completed foundation P0/P1/P2 zeros.

---

# 23. Audit scenarios

Create at least these canonical scenarios:

## Normal per exercise

- `single_leg_normal_left_first`
- `single_leg_normal_right_first`
- `tandem_normal_left_first`
- `tandem_normal_right_first`
- `split_squat_normal_left_first`
- `split_squat_normal_right_first`
- `hamstring_normal_left_first`
- `hamstring_normal_right_first`
- `hip_flexor_normal_left_first`
- `hip_flexor_normal_right_first`
- `calf_normal_left_first`
- `calf_normal_right_first`

## Dose variants

- `single_leg_direct_candidate_or_minimum_adjustment`
- `hamstring_direct_candidate_or_minimum_adjustment`
- `readiness_scaled_time_target`
- `readiness_scaled_rep_target`
- `short_session_one_source_set`
- `odd_total_rep_target_blocked`
- `fractional_time_voice_target`
- `exact_total_dose_preserved_all_six`

## Transitions

- `no_rest_between_sides`
- `rest_after_second_side`
- `round_start_side_alternates`
- `final_round_completes_exercise`
- `same_side_duplicate_rejected`

## Interruption/restore

- `tracking_loss_first_side`
- `tracking_loss_second_side`
- `restore_between_sides`
- `restore_during_first_side`
- `restore_during_second_side`
- `stale_first_side_callback`
- `background_during_second_side`
- `skip_during_first_side`
- `cancel_between_sides`

## Side-order persistence

- `main_plan_seed_defaults_left`
- `successful_completion_flips_seed`
- `skip_does_not_flip_seed`
- `manual_practice_does_not_flip_main_seed`
- `sync_restore_preserves_seed`

## Progression

- `round_counts_as_one_set`
- `side_segments_do_not_double_valid_time`
- `weaker_side_governs_progression`
- `one_side_incomplete_blocks_progression`
- `legacy_result_still_parses`

## Runtime isolation

- `feature_off_legacy_unchanged`
- `round_flag_alone_does_not_half_activate`
- `training_v21_stays_default_closed`
- `balance_v2_stays_default_closed`

The audit may include more scenarios.

---

# 24. Required artifacts

Create:

1. `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_IMPLEMENTATION.md`
2. `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.md`
3. `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.json`
4. `docs/audits/HALE_TRAINING_BOTH_SIDES_DOSE_CONVERSION_MATRIX.csv`
5. `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUND_SCENARIOS.csv`
6. `docs/audits/HALE_VOICE_PROJECT_POST_BOTH_SIDES_ROUNDS_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-training-both-sides-rounds.mjs`

Do not overwrite previous Training Voice V2.1 artifacts.

## Dose conversion CSV columns

Use columns similar to:

```text
exerciseId,sideRole,sourceSetCount,sourceTarget,sourceUnit,sourceTotalDose,minimumValidSideTarget,minimumSource,roundCount,sideTargetPerRound,leftTotalDose,rightTotalDose,convertedTotalDose,exactDosePreserved,equalSideDose,conversionReason,voiceTargetStrategy,implementationStatus,notes
```

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,exerciseId,sourcePrescription,dosePlanVersion,initialStartSide,roundIndex,sideOrder,currentSide,event,target,completedDose,leftTotal,rightTotal,restEntered,roundCompleted,exerciseCompleted,progressionEligible,restoreOutcome,featureState,testCoverage,notes
```

---

# 25. Audit verdicts

Issue exactly one primary verdict.

## `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE`

Use when:

- all six plans are exact,
- state/persistence/progression are complete,
- blockers are reconciled,
- software is ready behind default-off gates,
- audio remains pending separately.

## `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE_WITH_ITEM_BLOCKERS`

Use when:

- shared engine is correct,
- but one or more of the six cannot be represented safely because of a source-proven minimum or odd/unrepresentable target.

## `REMEDIATION_REQUIRED`

Use when:

- dose is changed silently,
- side totals differ,
- restore/progression duplicates dose,
- or runtime isolation is unsafe.

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when live source changed so materially that the six approved mappings cannot be implemented without a new product decision.

The expected successful verdict is:

```text
TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE
```

---

# 26. Audit report requirements

Report:

- affected exercise count,
- exact dose-plan count,
- direct-half-set plan count,
- minimum-adjusted plan count,
- unrepresentable plan count,
- exact source-total match failures,
- unequal side-dose failures,
- rest-between-sides cases,
- round-with-one-side cases,
- duplicate-side completion cases,
- stale callback mutations,
- restore duplicate-dose cases,
- progression double-count cases,
- main-plan seed flip failures,
- manual-practice seed mutation cases,
- unsupported scaled prescription count,
- Voice V2.1 side/target mismatch count,
- active set-count cue count,
- physical manifest changes,
- remaining round/dose blocker count in six contracts,
- global Training Voice V2.1 behaviour-ready value,
- feature defaults,
- P0/P1/P2/P3 counts.

Approved remaining safety/audio/control blockers are not defects if represented honestly.

---

# 27. Completion gates

Do not claim completion unless all pass.

## Dose

- Affected exercises: `6`
- Exact dose plans: `6`
- Source-total mismatch: `0`
- Left/right total mismatch: `0`
- Silent dose increase: `0`
- Silent dose decrease: `0`
- Unrepresentable current plan: `0`

## Round state

- Rest after first side: `0`
- Round complete with one side: `0`
- Duplicate same-side completion: `0`
- Side switch without pinned second side: `0`
- Active side without fresh boundary: `0`
- Stale side callback mutation: `0`

## Persistence

- Restore duplicate dose: `0`
- Completed first side lost before second side: `0`
- Initial side changed after restore: `0`
- Plan regenerated differently after restore: `0`
- Backend/local round-trip failures: `0`

## Progression

- Side segments counted as extra sets: `0`
- Valid time doubled: `0`
- Rep total doubled: `0`
- One side masking incomplete other side: `0`
- Duplicate session completion: `0`

## Side order

- Main-plan first-side seed failure: `0`
- Skip/cancel incorrectly flipping seed: `0`
- Manual practice incorrectly mutating main seed: `0`
- Within-session alternation failure: `0`

## Voice/planning

- Runtime side/voice side mismatch: `0`
- Side target/voice target mismatch: `0`
- Whole-set target spoken for one side: `0`
- Active spoken set-count cue: `0`
- Broad family fallback inserted: `0`

## Readiness

- `IR-VOICE-ROUND-STATE` remaining on the six contracts: `0`
- `IR-VOICE-DOSE-CONVERSION` remaining on the six contracts: `0`
- Training Voice V2.1 global behaviour ready may remain false.
- Training Voice V2.1 audio ready remains false.
- Training Voice V2.1 feature remains off.
- Balance V2 remains default-closed/audio-pending.

## Integrity

- Existing tests pass.
- No audio changed.
- No audio generated.
- No external speech/audio API called.
- Physical QA remains deferred.
- Human listening remains waived.

---

# 28. Implementation report structure

Use:

# Hale Training Both-Sides Rounds Implementation

## 1. Result

## 2. Approved FD-001 Contract

## 3. Source Prescription Reconciliation

## 4. Dose-Preservation Algorithm

## 5. Final Six-Exercise Conversion Matrix

## 6. Semantic Side Roles

## 7. Round State Machine

## 8. Side Order Across Rounds and Sessions

## 9. Interruption and Restore

## 10. Result Aggregation and Progression

## 11. Workout Generation Integration

## 12. Training Voice V2.1 Reconciliation

## 13. Feature Flags and Legacy Isolation

## 14. Persistence and Sync

## 15. Diagnostics

## 16. Tests

## 17. Files Changed

## 18. Worktree Integrity

## 19. Exact Next Phase

---

# 29. Handoff to step-up alternation

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_BOTH_SIDES_ROUNDS_HANDOFF.md`

The exact next task must be:

```text
Training step-up alternating-leading-leg implementation
```

Include:

- dose-planner API,
- round-state API,
- semantic-side API,
- progression aggregation API,
- persisted start-side API,
- feature/readiness gates,
- the six resolved contracts,
- remaining blockers after this phase,
- approved step-up contract:
  - 12 total reps,
  - alternate lead leg every rep,
  - both feet return to floor,
- grader/session changes step-up still needs,
- tests that must remain green,
- later sequence:
  1. step-up alternation
  2. floor-transfer gate
  3. live safety-family integration
  4. training controls/progress/recovery
  5. micro-check Voice V2.1
  6. final cue schema/manifests
  7. consolidated Clara/Marcus generation, including Balance V2
  8. whole-project runtime audit
  9. final physical-device QA

Do not implement step-up in this task.

---

# 30. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- both-sides dose planner,
- round state machine,
- side order,
- workout generation,
- readiness/short-session variants,
- session player,
- progression,
- valid-time progression,
- serialization/restore,
- backend training state,
- Training Voice V2.1 foundation/planner/readiness,
- MPV2 regressions,
- measurement-side regressions,
- Balance V2 regressions.

Run broader relevant tests where practical.

Run the audit-only harness.

Parse all generated JSON and CSV artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

Do not modify tests merely to make them pass.

---

# 31. Final Codex response

When finished, respond with:

- Summary of implementation
- Paths to all six generated artifacts
- All production files changed/added
- All test files changed/added
- Any audit-only harness added
- Confirmation that no audio changed or was generated
- Confirmation that no external speech/audio API was called
- Confirmation that listening and physical-device QA remain deferred
- Current branch and commit
- Whether the worktree was already dirty
- Affected exercise count
- Final conversion matrix:
  - source set count/target
  - round count
  - per-side target
  - left/right/total dose
- Proven minimum adjustments, if any
- Direct-half-set plan count
- Minimum-adjusted plan count
- Unrepresentable plan count
- Semantic side role for each exercise
- Initial-side persistence strategy
- Within-session side-order strategy
- Rest timing
- Tracking/restore behaviour
- Progression aggregation rule
- Main-plan seed flip behaviour
- Manual/Explore seed behaviour
- Source-total mismatch count
- Side-dose mismatch count
- Rest-between-sides count
- Restore duplicate-dose count
- Progression double-count count
- Voice side/target mismatch count
- Remaining round/dose blocker count
- Training Voice V2.1 feature/default
- Training Voice V2.1 audio-ready value
- Training Voice V2.1 global behaviour-ready value
- Balance V2 default/audio-ready status
- Post-patch P0/P1/P2/P3 counts
- Primary verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused test results
- Exact next task from the handoff
- A concise confidence statement

Do not generate audio, enable Training Voice V2.1, enable Balance V2, implement step-up, or perform physical-device QA in this task.
