# Codex Prompt: Pearl Training Step-Up Alternating-Leading-Leg Implementation

Read this entire prompt before changing anything.

Pearl’s Training both-sides round and dose-preservation phase is complete.

Current verified state:

- Verdict:
  - `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE`
- Six both-sides exercise plans preserve the exact source dose.
- Left/right total-dose mismatches: `0`
- Rest between sides: `0`
- Round/dose blockers remaining on those six contracts: `0`
- Training Voice V2.1 feature remains off.
- Training Voice V2.1 audio ready remains false.
- Training Voice V2.1 global behaviour ready remains false.
- Balance V2 remains default-closed/audio-pending.
- No audio was generated or changed.
- Human listening remains waived, not completed.
- Physical Android/iOS QA remains deferred.

The exact next approved task is:

```text
Training step-up alternating-leading-leg implementation
```

Approved founder decision `FD-005` is authoritative:

```text
Step-up uses 12 total repetitions per set.

The leading leg alternates every accepted repetition.

Each repetition returns both feet to the floor before the opposite leg
may lead the next repetition.
```

This task must implement that contract truthfully in the training planner, camera/grader evidence, session state, persistence, progression, UI, and Training Voice V2.1 logical planning.

Do not generate audio and do not enable Training Voice V2.1 for users.

---

# 1. Required source artifacts

Read and use:

## Both-sides round implementation

- `docs/audits/PEARL_TRAINING_BOTH_SIDES_ROUNDS_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.md`
- `docs/audits/PEARL_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.json`
- `docs/audits/PEARL_TRAINING_BOTH_SIDES_DOSE_CONVERSION_MATRIX.csv`
- `docs/audits/PEARL_TRAINING_BOTH_SIDES_ROUND_SCENARIOS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_BOTH_SIDES_ROUNDS_HANDOFF.md`
- `scripts/audits/audit-training-both-sides-rounds.mjs`

Available APIs include, or have equivalent current names:

```text
deriveBothSidesDosePlan(...)
deriveBothSidesDosePlanForExerciseId(...)
createBothSidesRoundRuntimeState(...)
advanceBothSidesRoundState(...)
restoreBothSidesRoundRuntimeState(...)
semanticSideRoleForExercise(...)
voiceSideVariantForExercise(...)
sideLabelForExercise(...)
summarizeBothSidesProgression(...)
bothSidesRoundResultsToLegacySetResults(...)
bothSidesStartSideSeed
applyBothSidesExerciseCompletionToStartSideSeed(...)
```

Reuse a general side-order primitive only where its semantics are genuinely shared. Do not force step-up into a two-sides-round model; step-up alternates within each set.

## Training Voice V2.1 foundation

- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`

Current step-up V2.1 contract intent:

```text
Exercise id: step-up
Set type: reps
Current set count: 3
Default target: 12 total reps per set
Current total session dose: 36 accepted reps
Laterality: alternating_lead_leg_each_rep
First-use meaning:
Use the lowest stable step with support nearby.
Alternate the leading leg each rep.
Return both feet to the floor after each rep.
Target: 12 total reps.
Progress: accepted-rep SFX only.
```

The current blocker to remove is:

```text
IR-VOICE-STEP-ALTERNATION
```

Do not remove unrelated blockers such as safety or audio.

## Approved V2.1 product decisions

- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`

## Completed foundations that must remain green

- MPV2 tracked voice/runtime completion
- measurement-side/protocol metadata
- measurement-side UX
- eyes-open Balance Protocol V2
- Training Voice V2.1 foundation
- Training both-sides rounds and dose preservation

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

---

# 2. Objective

Implement a canonical, persisted, camera-verifiable alternating-leading-leg step-up model that guarantees:

1. The default set target is 12 total accepted reps.
2. A valid 12-rep set contains exactly:
   - 6 left-leading reps
   - 6 right-leading reps
3. The expected leading leg alternates after every accepted rep.
4. The expected leading leg does not change after:
   - an invalid attempt,
   - a wrong-leg attempt,
   - tracking interruption,
   - duplicate callback,
   - pause,
   - backgrounding,
   - or restore of an incomplete rep.
5. Both feet must return to the floor/start boundary before the next rep may begin.
6. The next rep cannot begin while either foot remains on the step.
7. Descent foot order is not prescribed unless the current source already requires it; the hard requirement is that both feet return to the floor.
8. A rep is credited only when the evidence identifies the expected lead leg.
9. An otherwise valid rep led by the wrong leg receives no credit.
10. A wrong-leg attempt does not flip the expected lead leg.
11. Rep-credit SFX plays exactly once per accepted rep.
12. No spoken rep-by-rep counting is added.
13. No automatic “switch legs” speech occurs after every rep.
14. The starting lead leg is pinned per set.
15. The starting lead alternates across sets:
    - Set 1 uses the session item’s initial lead.
    - Set 2 uses the opposite lead.
    - Set 3 returns to the initial lead.
16. Main-plan exposures alternate their initial lead over time to avoid permanent order bias.
17. Manual/Explore practice does not silently mutate the main-plan initial-lead seed.
18. The lead-leg plan survives retry, recovery, pause, app restart, sync, and restore.
19. A partially completed rep is never restored or credited.
20. A completed rep is never credited twice.
21. One 12-rep set remains one set for progression and session completion.
22. Lead-side counts do not create extra sets, duplicate valid time, or duplicate completion events.
23. Progression requires the alternating sequence to remain valid.
24. Total accepted reps cannot mask a side imbalance.
25. The Training Voice V2.1 planner gains truthful start-leg and wrong-leg-recovery plans.
26. The step-up contract no longer carries `IR-VOICE-STEP-ALTERNATION`.
27. Other blockers remain accurate.
28. The live legacy path remains unchanged and default.
29. Training Voice V2.1 remains default-closed.
30. No audio is generated or changed.
31. Audit metrics are derived from executed scenarios and state-machine evidence rather than hard-coded zero values.
32. The exact next phase becomes:
    - floor-transfer readiness gate.

---

# 3. Strict scope

## In scope

- Current step-up source/grader reconciliation.
- Alternating-lead plan generation.
- Per-set initial lead.
- Per-rep expected lead.
- Lead-leg evidence.
- Both-feet-floor rep boundary.
- Wrong-lead rejection.
- Rep state machine.
- Session-player integration for the internal/default-closed V2.1 path.
- Rep result metadata.
- Progression aggregation.
- Visible next-lead state and corrections.
- Training Voice V2.1 logical plans.
- Persistence and restore.
- Main-plan initial-lead seed.
- Feature/readiness gates.
- Focused tests.
- Runtime-derived audit scenarios and metrics.
- Handoff to floor-transfer readiness.

## Out of scope

Do not implement in this task:

- Floor-transfer readiness gate.
- Live safety-family narration integration.
- Full training pause/resume/skip/recovery voice implementation.
- Micro-check Voice V2.1.
- Audio generation.
- ElevenLabs calls.
- Runtime TTS.
- Human listening review.
- Physical-device QA.
- New balance audio.
- Enabling Balance V2.
- Enabling Training Voice V2.1.
- Changing step-up set count.
- Changing the default target away from 12.
- Adding per-rep spoken counts.
- Adding a spoken left/right cue on every valid rep.
- Changing unrelated exercise programming.
- New medical or normative claims.
- Package installation.
- Lockfile changes.
- Destructive Git operations.

Do not change live legacy step-up behaviour merely to demonstrate the new internal path.

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
- pre-existing relevant diffs,
- pre-existing untracked audio and audit files.

Rules:

1. Do not reset, checkout, stash, clean, rebase, or discard anything.
2. Do not delete or rename existing audio.
3. Do not overwrite unrelated renderer, protocol, check-up, or audit work.
4. Do not regenerate manifests wholesale.
5. Do not commit or push.
6. Make the smallest safe edits to concurrently modified files.
7. At the end, distinguish this task’s footprint from pre-existing changes.

---

# 5. Current source to inspect

Inspect live source rather than relying on old line numbers.

## Step-up definition and grader

At minimum inspect:

- the exact `step-up` exercise definition
- the ladder entry
- the current step-up set grader
- current per-side pose evidence helpers
- current rep-phase/state helpers
- current required orientation
- current camera readiness requirements
- current valid-rep event shape
- current minimum landmark confidence rules
- current step/stair capability and equipment gates

Likely files include:

- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/types.ts`
- `src/exercises/setGraders.ts`
- the exact step-up exercise file
- movement/pose helper files used by step-up
- step-up tests

## Training generation/runtime

- `src/training/sessionPlayer.ts`
- `src/training/workoutGeneration.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/dynamicState.ts`
- `src/training/progression.ts`
- `src/training/validTimeProgression.ts`
- `src/training/serialize.ts`
- current session item/result types
- current pause/resume/skip/cancel handling
- current session completion aggregation
- `src/screens/TrainingSessionScreen.tsx`
- relevant `App.tsx` plumbing

## Both-sides and shared side order

- all files under `src/training/bothSidesRounds/`
- current seed/persistence helpers
- current diagnostics and tests

## Training Voice V2.1

- all current files under `src/training/voiceV21/`
- step-up contract
- target grammar
- sequence planner
- readiness
- safety planner
- runtime adapter
- asset requirements
- tests

## Persistence/backend

- local training serialization
- training-state sync
- session completion sync
- restore
- export
- duplicate result merge/fingerprint logic

Search broadly for:

```text
step-up
step_up
leadLeg
leadingLeg
leadSide
steppingLeg
left
right
ankle
knee
hip
foot
floor
step
platform
rep phase
rep count
rep-credit
setIndex
targetReps
restore
stale callback
validTime
progression
```

Follow actual call paths.

---

# 6. Source-truth reconciliation

Before designing the new state machine, establish and document:

1. How the current grader identifies a step-up repetition.
2. Whether it currently identifies the leading leg.
3. Whether it uses:
   - one near-side chain,
   - both lower-body chains,
   - or a generic observed side.
4. Whether current side-view setup reliably exposes both legs.
5. Whether current source can distinguish:
   - lead-foot ascent,
   - top position,
   - return to floor,
   - and the next rep boundary.
6. What current rep completion event contains.
7. Whether current frame timestamps are monotonic.
8. Whether current grader can emit duplicate completion events.
9. Whether current setup requires one or two reliable lower-body chains.
10. Whether current camera orientation must be tightened for the V2.1 internal path.

## Evidence boundary

Do not claim reliable lead-leg enforcement from a generic rep count alone.

If current evidence is insufficient:

- add the smallest conservative bilateral evidence model,
- increase readiness requirements only for the new default-closed path,
- keep legacy behaviour unchanged,
- and document the later physical-device validation requirement.

Do not change the public camera orientation without source evidence and tests.

---

# 7. Approved step-up semantics

Implement this exact semantic contract.

## 7.1 Rep definition

A valid rep is:

```text
both feet at the floor/start boundary
→ expected lead leg initiates the ascent
→ the movement reaches the current valid top/step phase
→ both feet return to the floor/start boundary
```

The next rep may begin only after the return boundary is re-established.

## 7.2 Leading leg

The leading leg is the leg that initiates the upward step.

The descending order is not part of the alternation rule unless current source already validates a specific order.

Do not reject a safe rep merely because the descent begins with a different foot, provided:

- the expected leg led the ascent,
- the existing rep validity contract was satisfied,
- and both feet returned to the floor.

## 7.3 Alternation

After an accepted rep:

```text
expectedLead = opposite(expectedLead)
```

After an invalid/wrong/interrupted attempt:

```text
expectedLead remains unchanged
```

## 7.4 Set completion

Default set:

```text
targetTotalReps = 12
leftLeadTarget = 6
rightLeadTarget = 6
```

Set completes only when:

- total accepted reps = 12,
- left-leading reps = 6,
- right-leading reps = 6,
- every accepted rep followed the expected alternation sequence,
- no unresolved partial rep remains.

---

# 8. Scaled target policy

The approved default is 12.

Inspect whether current readiness scaling, short-session logic, or manual practice can produce a different final rep target for step-up.

## Required rule

The alternating engine may support any positive even target:

```text
left target = total target / 2
right target = total target / 2
```

But:

- default main-plan target remains 12,
- this task must not change the current prescription,
- odd targets are unrepresentable for equal alternation,
- an odd final target must block the Training Voice V2.1/internal alternating path,
- no rounding to a nearby even target,
- no silent rep addition or removal.

## Voice target

- 12 uses `Do twelve total reps.`
- another even target requires an exact supported target plan.
- unsupported speech value blocks the V2.1 voice path.
- visible and planned voice target must match the runtime target.

Report every reachable final step-up target from:

- default plan,
- readiness scaling,
- short sessions,
- manual/Explore,
- restored plans.

---

# 9. Start-lead policy

Use deterministic order without permanent bias.

## 9.1 Session-item initial lead

Every generated internal V2.1 step-up item pins:

```ts
initialLeadSide: 'left' | 'right'
```

This value cannot change during the item.

## 9.2 Set order

For a three-set prescription:

```text
Set 1 starts initialLeadSide
Set 2 starts opposite(initialLeadSide)
Set 3 starts initialLeadSide
```

Each set still contains equal left/right reps because its target is even.

## 9.3 Across main-plan exposures

Use one canonical persisted side-order source.

Preferred approach:

- reuse/generalise the existing both-sides start-side seed if its semantics are already “next initial side by exercise”;
- otherwise introduce one shared training-side-order seed abstraction and preserve backward-compatible both-sides APIs.

Do not create two competing authorities for initial side.

Rules:

- absent seed defaults left,
- current seed is pinned into the generated step-up item,
- seed flips only after successful main-plan step-up completion,
- skip/cancel/incomplete exercise does not flip,
- duplicate completion processing is idempotent,
- manual/Explore practice does not mutate main-plan seed unless current rules explicitly count it toward main-plan progression,
- sync/restore preserves the seed.

---

# 10. Canonical types

Create a focused production module using repository conventions, for example:

```text
src/training/stepUpAlternation/
  types.ts
  plan.ts
  evidence.ts
  stateMachine.ts
  aggregation.ts
  persistence.ts
  index.ts
```

Use fewer files if preferred.

A suitable conceptual model is:

```ts
export const STEP_UP_ALTERNATION_PLAN_VERSION = 1 as const;

export type StepUpLeadSide = 'left' | 'right';

export interface StepUpAlternationPlan {
  version: typeof STEP_UP_ALTERNATION_PLAN_VERSION;
  exerciseId: 'step-up';

  targetTotalReps: number;
  targetLeftLeadReps: number;
  targetRightLeadReps: number;

  setCount: number;
  initialLeadSide: StepUpLeadSide;
  setStartLeadSides: readonly StepUpLeadSide[];

  sourcePrescriptionFingerprint: string;
  runtimeSelectable: boolean;
  blockerReasonCodes: readonly string[];
}

export interface StepUpRepEvidence {
  repAttemptId: string;
  expectedLeadSide: StepUpLeadSide;
  observedLeadSide: StepUpLeadSide | null;

  startedAtMs: number;
  topReachedAtMs: number | null;
  returnedToFloorAtMs: number | null;

  bothFeetAtStart: boolean;
  expectedLeadInitiatedAscent: boolean;
  topPhaseValid: boolean;
  bothFeetReturnedToFloor: boolean;

  valid: boolean;
  endReason:
    | 'accepted'
    | 'wrong_lead'
    | 'tracking_interrupted'
    | 'cancelled'
    | 'invalid_phase'
    | 'stale'
    | 'duplicate';
}

export interface StepUpSetResult {
  setIndex: number;
  startLeadSide: StepUpLeadSide;
  targetTotalReps: number;

  acceptedRepCount: number;
  leftLeadRepCount: number;
  rightLeadRepCount: number;

  alternationValid: boolean;
  completedTarget: boolean;
  repEvidence: readonly StepUpRepEvidence[];
}
```

Equivalent naming is acceptable.

## Requirements

- Immutable/readonly where practical.
- No `any`.
- JSON-safe.
- Stable version.
- Deterministic plan fingerprint.
- Explicit timestamps/units.
- No side semantics stored only as prose.
- Do not mutate catalogue defaults.

---

# 11. Alternation plan

Create a pure planner such as:

```ts
deriveStepUpAlternationPlan({
  setCount,
  targetTotalReps,
  initialLeadSide,
  sourcePrescription,
}): StepUpAlternationPlan
```

## Required behaviour

- target must be a positive integer,
- target must be even,
- left/right targets are exactly equal,
- set start sides alternate,
- default target 12 yields 6/6 per set,
- source prescription is retained,
- fingerprint is deterministic,
- unknown/non-step-up exercise fails closed,
- odd target returns a blocker such as `ODD_STEP_UP_TARGET`,
- no silent correction.

## Stable reason codes

Use reason codes such as:

```text
STEP_UP_ALTERNATION_READY
ODD_STEP_UP_TARGET
NON_INTEGER_STEP_UP_TARGET
NON_POSITIVE_STEP_UP_TARGET
UNSUPPORTED_STEP_UP_EXERCISE
SOURCE_PRESCRIPTION_MISMATCH
MISSING_INITIAL_LEAD
```

---

# 12. Conservative lead-leg evidence model

Build on the current grader rather than replacing all step-up movement logic.

## Required output

The grader/wrapper must expose one accepted rep event with:

- expected lead side,
- observed lead side,
- rep attempt id,
- ascent start,
- top phase,
- both-feet-floor completion,
- confidence/validity reason.

## Readiness

For the internal alternating path:

- require enough lower-body evidence to identify the expected leg,
- require both feet/start boundary to be visible/reliable,
- do not begin active counting if the expected side cannot be observed,
- do not silently credit a generic rep to whichever side is clearer.

If only one side chain is reliable:

- remain in setup/recovery,
- show a visible correction,
- do not begin or continue the alternating set.

Keep legacy readiness unchanged with the feature off.

## Wrong lead

When the opposite leg initiates the ascent:

- mark the attempt `wrong_lead`,
- credit no rep,
- play no rep SFX,
- keep the expected lead unchanged,
- require both feet to return to floor,
- then allow a fresh attempt.

## Boundary noise

Use dwell/hysteresis consistent with existing grader conventions.

A foot briefly crossing a threshold must not:

- start two attempts,
- complete two reps,
- or flip the expected side twice.

## Unsupported detection

Do not fabricate:

- exact stair height,
- foot contact force,
- platform pressure,
- or descent-foot order.

---

# 13. Rep state machine

Create an explicit state model.

A suitable conceptual shape is:

```ts
export type StepUpRepPhase =
  | 'set_setup'
  | 'ready_both_feet_floor'
  | 'awaiting_expected_lead'
  | 'ascending'
  | 'top'
  | 'descending'
  | 'awaiting_both_feet_floor'
  | 'rep_complete'
  | 'wrong_lead_recovery'
  | 'tracking_recovery'
  | 'set_complete'
  | 'cancelled';

export interface StepUpAlternationRuntimeState {
  plan: StepUpAlternationPlan;
  setIndex: number;
  expectedLeadSide: StepUpLeadSide;
  phase: StepUpRepPhase;

  currentRepAttemptId: string | null;
  acceptedRepCount: number;
  leftLeadRepCount: number;
  rightLeadRepCount: number;
  repEvidence: readonly StepUpRepEvidence[];

  stageEpoch: number;
}
```

Equivalent naming is acceptable.

## Required transition order

```text
set setup
→ both feet floor readiness
→ expected lead initiation
→ ascent
→ top
→ descent
→ both feet floor
→ accepted rep
→ flip expected lead
→ next rep readiness
```

## Illegal transitions

Make these impossible:

```text
rep accepted without expected lead
rep accepted before both feet return to floor
expected lead flips after invalid attempt
same rep attempt accepted twice
set completes with unequal lead counts
set completes before target
next rep starts while a foot remains on step
stale rep callback mutates a new rep
restore credits partial rep
```

Use explicit actions and guards.

---

# 14. Terminal-event precedence

Use monotonic frame timestamps.

Define deterministic precedence for:

- valid rep completion,
- wrong-lead detection,
- tracking interruption,
- pause,
- cancel,
- set target reached,
- stale callback.

Recommended order when timestamps are equal:

1. previously accepted valid rep completion,
2. cancel/explicit session exit,
3. confirmed tracking interruption,
4. wrong-lead/invalid phase,
5. stale callbacks ignored.

Use a different order only if current source proves it is safer, and document it.

Do not let React effect order decide.

---

# 15. Interruption, pause, background, and restore

## Tracking interruption during a rep

- discard the partial rep,
- preserve prior accepted reps,
- preserve expected lead,
- create a new rep attempt id,
- return to both-feet-floor setup,
- use a fresh countdown/setup boundary in the future V2.1 runtime,
- never credit partial movement.

## Pause/background

Follow the safest current training rule.

Preferred:

- if no rep is active, preserve boundary state;
- if a rep is active, discard only the partial rep;
- preserve accepted count and expected lead;
- resume at both-feet-floor readiness.

## Restore

Persist only safe canonical state.

Rules:

- restore accepted reps and counts,
- restore expected lead,
- restore set start lead,
- restore plan/fingerprint,
- if saved during a partial rep, restart that rep from the boundary,
- never recreate a different plan from current defaults,
- never replay an already accepted rep,
- stale pre-restore callbacks are ignored.

## Skip/cancel

- exit the whole exercise under existing semantics,
- do not create a “skip one lead leg” control,
- incomplete set is not complete,
- main-plan initial-lead seed does not flip.

---

# 16. Result aggregation and progression

## Accepted rep accounting

Each accepted rep contributes:

```text
1 total rep
1 rep to its observed/expected lead side
1 rep-credit SFX
```

No other event increments these values.

## Set completion

A set is complete only when:

```text
acceptedRepCount === targetTotalReps
leftLeadRepCount === targetTotalReps / 2
rightLeadRepCount === targetTotalReps / 2
alternationValid === true
```

## Legacy compatibility

Map the completed alternating set to one legacy-compatible set result:

- total reps remains 12,
- set count remains one,
- side metadata is additive,
- session completion is emitted once,
- progression receives one set result.

## Progression

- preserve current step-up ladder identity,
- preserve current progression thresholds,
- do not create two side-specific set events,
- do not double valid time,
- do not let total reps hide a side mismatch,
- alternation validity is required for the V2.1/internal result to be progression-eligible,
- invalid/wrong-lead attempts do not contribute.

## Valid-time summaries

If current valid-time metadata is attached:

- count active valid time once,
- do not duplicate by lead side,
- side counts may be supporting metadata only.

---

# 17. Workout generation integration

Derive the plan after the final step-up prescription is known.

Cover:

- normal generated session,
- readiness scaling,
- short session,
- pain substitution,
- equipment substitution,
- manual/Explore practice,
- restored generated plan.

## Requirements

- plan uses the final target/set count,
- default 12 becomes six per lead,
- even scaled targets remain representable,
- odd targets block the internal alternating path,
- plan is stored on the generated item,
- generated-item fingerprint includes plan version and source prescription,
- old/in-progress legacy sessions remain legacy,
- new internal V2.1 sessions may use the plan,
- no silent target change.

---

# 18. Main-plan initial-lead persistence

Use one authoritative persisted seed.

## Preferred implementation

Inspect the existing both-sides seed.

If semantically safe, generalise it to a shared abstraction such as:

```text
nextTrainingInitialSideByExercise
```

while preserving backward-compatible exports.

If generalisation would be disruptive, reuse the existing seed map for `step-up` only if its stored meaning is genuinely “next starting side by exercise.”

Do not create an unrelated second seed that can drift.

## Rules

- default left,
- pin into item at generation,
- alternate set start sides,
- flip after successful main-plan step-up completion,
- skip/cancel/incomplete does not flip,
- duplicate completion is idempotent,
- manual/Explore does not mutate main-plan seed unless current rules explicitly count it,
- local/backend restore preserves seed.

---

# 19. Training Voice V2.1 reconciliation

Update only logical software planning.

Do not generate assets or modify the live physical manifest for nonexistent cues.

## 19.1 Contract

The exact semantic contract must be:

```text
Step-up.
Use the lowest stable step with support nearby.
Alternate the leading leg each rep, returning both feet to the floor.
Do twelve total reps.
```

Retain current source truth if wording is already represented equivalently.

## 19.2 Starting lead

Add logical left/right start variants, for example:

```text
step-up-start-left-v21:
Start with your left leg.

step-up-start-right-v21:
Start with your right leg.
```

Use repository naming conventions.

## 19.3 Wrong-lead recovery

Do not speak on every correct rep.

Create logical correction concepts for use only after a wrong-lead attempt or recovery, for example:

```text
step-up-next-left-v21:
Next rep, lead with your left leg.

step-up-next-right-v21:
Next rep, lead with your right leg.
```

Do not add these to the physical `VoiceCueId`/manifest without audio.

## 19.4 Sequence planning

### First use

Planned logical order:

1. exact step-up instruction
2. due step/stair safety only according to the existing safety planner
3. final-position readiness
4. starting-lead cue
5. target
6. countdown

### Later set

1. concise step-up reminder
2. starting-lead cue for that set
3. target where needed
4. countdown

### Wrong-lead correction

1. visual correction immediately
2. optional pending logical next-lead cue
3. return-to-floor readiness
4. fresh attempt boundary

### Repeat instructions

- exact instruction,
- current set’s starting lead,
- total target,
- no set count,
- no per-rep narration.

## 19.5 Progress

- accepted reps use rep-credit SFX only,
- no spoken rep count,
- no spoken “switch legs” after each rep,
- visual UI may show the next expected lead,
- repeated wrong-lead correction may eventually use the logical correction asset.

## 19.6 Runtime readiness

After this task:

- remove `IR-VOICE-STEP-ALTERNATION`,
- keep `IR-VOICE-SAFETY-SUBSUMPTION`,
- keep `IR-VOICE-AUDIO-ASSETS`,
- keep control/recovery blockers if current readiness model requires them,
- Training Voice V2.1 remains globally not ready.

---

# 20. UI requirements

Implement only the internal/default-closed UI needed to represent the state truthfully.

Show:

- `12 total reps`
- accepted rep progress
- `6 left • 6 right` or equivalent concise supporting progress
- `Next: Left leg` / `Next: Right leg`
- wrong-lead correction without shame:
  - `Return both feet to the floor. Next, lead with your right leg.`
- set completion only after 12 valid alternating reps

## Rules

- no rest between reps,
- no side-switch screen between reps,
- no forced spoken cue each rep,
- current expected lead is not encoded by colour alone,
- screen-reader labels include expected lead,
- touch targets remain large,
- legacy UI remains unchanged with feature off.

Do not redesign the full training screen.

---

# 21. Feature flags and rollout

Add a narrow internal flag, for example:

```text
EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION
```

Equivalent naming is acceptable.

Expected state after this task:

```text
Step-up alternation software ready: true
Step-up alternation feature default: off
Training Voice V2.1 feature: off
Training Voice V2.1 audio ready: false
Training Voice V2.1 global behaviour ready: false
Balance V2: default-closed/audio-pending
```

## Isolation

- flag off leaves legacy step-up unchanged,
- alternation flag alone must not create a half-active legacy voice/user path,
- internal tests may inject a V2.1-ready context,
- one session cannot run legacy and alternating step-up semantics simultaneously,
- existing in-progress legacy sessions remain legacy,
- protocol/plan selection is pinned when the session item is created.

---

# 22. Persistence and backend

Additive metadata may include:

- plan version,
- target total,
- target per lead,
- initial lead,
- set start leads,
- expected current lead,
- accepted counts,
- per-lead counts,
- rep evidence,
- plan fingerprint.

## Requirements

- local round trip,
- app restart restore,
- backend training-state JSON round trip where current architecture supports it,
- offline completion then sync,
- duplicate merge preserves richer evidence,
- old clients ignore additive fields,
- old sessions remain readable,
- malformed alternation metadata fails safely to legacy/nonselectable,
- no remote migration unless live architecture proves it necessary,
- do not infer alternating evidence from old generic rep counts.

---

# 23. Diagnostics

Add bounded, privacy-safe diagnostics for:

- alternation plan created,
- set started,
- expected lead,
- rep attempt started,
- observed lead,
- accepted rep,
- wrong lead,
- both-feet-floor boundary,
- partial rep discarded,
- duplicate callback suppressed,
- set completed,
- seed flipped,
- restore boundary,
- odd target blocked,
- progression aggregation.

Do not log:

- raw video,
- landmarks,
- account ids,
- user name,
- detailed health results.

Use stable reason codes.

---

# 24. Required tests

Do not weaken or delete existing tests.

## 24.1 Plan tests

1. Default target 12 yields 6 left and 6 right.
2. Set count remains 3.
3. Initial lead is pinned.
4. Set starts alternate left/right/left.
5. Right initial mirrors the order.
6. Positive even target is representable.
7. Odd target is blocked.
8. Noninteger target is blocked.
9. Zero/negative target is blocked.
10. Plan fingerprint is deterministic.
11. Readiness-scaled final target is used.
12. Short-session final target is used.
13. No silent target correction.
14. Unknown exercise fails closed.

## 24.2 Rep-state tests

1. Expected left valid rep is accepted.
2. Expected right valid rep is accepted.
3. Expected lead flips only after accepted rep.
4. Wrong lead gets no credit.
5. Wrong lead does not flip expectation.
6. Rep cannot complete before both feet return to floor.
7. Next rep cannot start while one foot remains on step.
8. Duplicate completion callback credits once.
9. Stale callback is ignored.
10. Threshold noise does not create two reps.
11. Top phase without return is incomplete.
12. Return without valid ascent is invalid.
13. Descent-foot order is not incorrectly enforced.
14. Accepted evidence records observed lead.

## 24.3 Set-completion tests

1. Twelve valid alternating reps complete the set.
2. Left count is 6.
3. Right count is 6.
4. Eleven reps do not complete.
5. Twelve total with unequal lead counts do not complete.
6. A broken alternation sequence does not become progression-eligible.
7. Set completion emits once.
8. Rep SFX count equals accepted reps.
9. Wrong attempts emit no SFX.
10. One set remains one set.

## 24.4 Interruption/restore tests

1. Tracking loss discards partial current rep.
2. Prior accepted reps remain.
3. Expected lead remains.
4. Resume begins at both-feet-floor readiness.
5. Pause during partial rep discards only partial rep.
6. Background during partial rep discards only partial rep.
7. Restore after six reps preserves counts and expected lead.
8. Restore during partial rep does not credit it.
9. Restore does not regenerate a different plan.
10. Stale pre-restore callback is ignored.
11. Skip does not complete the set.
12. Cancel does not flip main-plan seed.

## 24.5 Lead-evidence tests

1. Both lower-body chains/readiness are sufficient for internal path.
2. Missing expected-side evidence blocks start.
3. Generic rep event cannot be credited without lead evidence.
4. Expected side initiates ascent.
5. Opposite side initiation produces wrong-lead event.
6. Both-feet-floor boundary is detected conservatively.
7. Occlusion does not silently assign the clearer side.
8. Current orientation assumptions are documented/tested.
9. No unsupported platform-contact claim is made.

## 24.6 Seed tests

1. Missing seed defaults left.
2. Main-plan item pins seed.
3. Successful main-plan completion flips seed.
4. Skip does not flip.
5. Cancel does not flip.
6. Incomplete exercise does not flip.
7. Duplicate completion is idempotent.
8. Manual/Explore does not mutate main seed.
9. Sync/restore preserves seed.
10. Existing both-sides start-side behaviour remains green.

## 24.7 Progression tests

1. One alternating set creates one set result.
2. Lead counts do not create extra set events.
3. Valid time is not doubled.
4. Total rep count remains 12.
5. Side imbalance blocks progression eligibility.
6. Alternation invalidity blocks progression eligibility.
7. Existing step-up ladder id remains.
8. Existing thresholds remain.
9. Session completion emits once.
10. Legacy step-up result remains readable.

## 24.8 Generation tests

1. Normal generated step-up gets a plan.
2. Even scaled target gets a plan.
3. Odd scaled target blocks internal V2.1 path.
4. Short session uses final prescription.
5. Pain substitution applies only to final exercise.
6. Equipment substitution applies only to final exercise.
7. Manual practice gets an internal plan without mutating main seed.
8. Restored item uses stored plan.
9. Non-step-up items receive no alternation plan.
10. Existing legacy session remains legacy.

## 24.9 Voice-planner tests

1. First-use sequence includes exact instruction.
2. First-use sequence includes pinned start lead.
3. Later-set sequence uses that set’s start lead.
4. Target says total reps.
5. No side-switch cue after every rep.
6. No spoken rep-by-rep count.
7. Wrong-lead recovery uses the correct expected lead logical cue.
8. Repeat instructions include current start lead and target.
9. No total set-count cue.
10. `IR-VOICE-STEP-ALTERNATION` is removed.
11. Safety/audio blockers remain.
12. Physical manifest is unchanged.
13. Missing new logical cue assets keep audio readiness false.

## 24.10 Feature/legacy isolation tests

1. Feature off leaves live step-up unchanged.
2. Training Voice V2.1 remains off.
3. Audio ready remains false.
4. Global behaviour ready remains false.
5. Alternation flag alone does not half-activate legacy voice.
6. One session cannot mix semantics.
7. Internal ready injection exercises new state.
8. Existing in-progress legacy session stays legacy.
9. Balance V2 remains default-closed.
10. `npm run verify:audio` remains green.

## 24.11 Regression tests

Re-run relevant suites for:

- both-sides round planner/state/seed/progression,
- Training Voice V2.1 foundation/planner/readiness,
- session player,
- workout generation,
- dynamic state,
- progression,
- valid-time progression,
- serialization/restore,
- backend sync,
- MPV2,
- measurement-side,
- Balance V2.

Preserve completed-foundation P0/P1/P2 zeros.

---

# 25. Runtime-derived audit requirements

The previous both-sides audit included some zero-valued metrics that were not all derived from executed runtime scenarios.

This audit must not repeat that weakness.

## Mandatory rules

1. Every audit metric must be computed from:
   - executed pure state-machine scenarios,
   - parsed scenario rows,
   - source-derived registry data,
   - or test/harness results.
2. Do not assign a metric a literal `0` merely because the implementation intends zero defects.
3. The audit JSON must include a `metricEvidence` object.
4. For every metric, `metricEvidence` must name:
   - source scenario ids,
   - event/outcome filters,
   - and the recomputation method.
5. The CSV rows must be sufficient to independently recompute all scenario metrics.
6. The audit harness must recompute metrics from the generated scenario rows before writing the verdict.
7. Validation must parse the CSV and independently recompute the JSON counts.
8. Any mismatch must fail the harness.
9. Verdict must be derived from completion gates, not stored as an unconditional constant.
10. Source-only counts such as feature flags or contract blockers must cite the exact source query used.

---

# 26. Canonical audit scenarios

Create at least these scenarios.

## Normal

- `step_up_left_first_set_12_reps`
- `step_up_right_first_set_12_reps`
- `step_up_three_sets_left_initial`
- `step_up_three_sets_right_initial`
- `step_up_six_left_six_right`
- `step_up_both_feet_floor_each_rep`

## Invalid/wrong lead

- `wrong_lead_on_first_rep`
- `wrong_lead_after_five_reps`
- `wrong_lead_returns_to_floor_then_corrects`
- `wrong_lead_does_not_flip_expected`
- `generic_rep_without_lead_evidence_rejected`
- `opposite_chain_clearer_not_auto_credited`

## Boundary/duplicate

- `top_reached_no_floor_return`
- `one_foot_remains_on_step`
- `duplicate_completion_callback`
- `stale_callback_after_next_rep_started`
- `threshold_noise_single_credit`
- `descent_order_not_overconstrained`

## Interruption/restore

- `tracking_loss_mid_left_lead_rep`
- `tracking_loss_mid_right_lead_rep`
- `pause_mid_rep`
- `background_mid_rep`
- `restore_after_six_reps`
- `restore_mid_rep`
- `cancel_mid_set`
- `skip_mid_set`

## Targets

- `default_target_12`
- `even_scaled_target_10`
- `odd_scaled_target_9_blocked`
- `noninteger_target_blocked`
- `short_session_final_target`
- `visible_voice_runtime_target_match`

## Seed/order

- `seed_defaults_left`
- `successful_completion_flips_seed`
- `skip_does_not_flip_seed`
- `manual_practice_does_not_flip_seed`
- `duplicate_completion_idempotent`
- `sync_restore_preserves_seed`

## Progression

- `one_set_one_progression_event`
- `lead_counts_do_not_double_set_count`
- `valid_time_not_doubled`
- `twelve_total_unequal_sides_rejected`
- `broken_alternation_not_progression_eligible`
- `legacy_result_still_parses`

## Voice/runtime isolation

- `step_up_start_left_logical_plan`
- `step_up_start_right_logical_plan`
- `wrong_lead_left_correction_plan`
- `wrong_lead_right_correction_plan`
- `no_per_rep_spoken_switch`
- `feature_off_legacy_unchanged`
- `alternation_flag_alone_no_half_activation`
- `training_voice_remains_default_closed`
- `balance_v2_remains_default_closed`

The audit may add more.

---

# 27. Required artifacts

Create:

1. `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_IMPLEMENTATION.md`
2. `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_AUDIT.md`
3. `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_AUDIT.json`
4. `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv`
5. `docs/audits/PEARL_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv`
6. `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-training-step-up-alternation.mjs`

Do not overwrite previous artifacts.

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,variantId,setIndex,targetTotalReps,initialLeadSide,expectedLeadBefore,observedLead,event,repAttemptId,bothFeetAtStart,topReached,bothFeetReturnedToFloor,outcome,acceptedRepCount,leftLeadRepCount,rightLeadRepCount,expectedLeadAfter,setCompleted,progressionEligible,seedChanged,restoreOutcome,featureState,testCoverage,notes
```

## Rep-evidence matrix columns

Use columns similar to:

```text
evidenceCase,expectedLead,observedLead,startBoundaryValid,ascentValid,topPhaseValid,returnBoundaryValid,trackingValid,accepted,endReason,creditsRep,playsSfx,flipsExpectedLead,requiresRecovery,sourceFunction,testCoverage,notes
```

---

# 28. Audit verdicts

Issue exactly one primary verdict.

## `TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE`

Use when:

- plan/state/grader/persistence/progression are complete,
- all default-closed software gates pass,
- only safety/audio/later training dependencies remain.

## `TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE_WITH_RUNTIME_BLOCKER`

Use when:

- the software model is implemented,
- but live pose evidence cannot conservatively identify the lead leg or floor boundary,
- so internal runtime remains blocked pending a later evidence/QA phase.

## `REMEDIATION_REQUIRED`

Use when:

- wrong-leg reps can be credited,
- counts can become unequal,
- rep boundaries duplicate,
- restore can double-credit,
- progression can accept invalid alternation,
- or legacy isolation is unsafe.

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when source drift creates unresolved product semantics.

Expected successful verdict:

```text
TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE
```

Use the runtime-blocker verdict instead of fabricating evidence if necessary.

---

# 29. Audit report requirements

Report:

- inspected step-up definitions,
- discovered current targets,
- plan count,
- default target,
- target-per-lead,
- accepted normal reps,
- left-leading accepted reps,
- right-leading accepted reps,
- wrong-lead credit cases,
- generic-rep-without-side credit cases,
- rep-before-floor-return cases,
- duplicate credit cases,
- stale callback mutations,
- partial-rep restore credits,
- set-completion-with-unequal-sides cases,
- progression invalid-alternation acceptance cases,
- rep SFX mismatches,
- initial-lead seed failures,
- manual-practice seed mutations,
- unsupported odd-target count,
- voice/runtime target mismatches,
- per-rep spoken-switch count,
- remaining `IR-VOICE-STEP-ALTERNATION` blockers,
- feature defaults,
- audio-ready state,
- global behaviour-ready state,
- Balance V2 state,
- P0/P1/P2/P3 counts.

Every scenario-derived metric must have `metricEvidence`.

---

# 30. Completion gates

Do not claim completion unless all applicable gates pass.

## Plan

- Default target: `12`
- Left target: `6`
- Right target: `6`
- Odd target silently adjusted: `0`
- Noninteger target silently adjusted: `0`

## Rep validity

- Wrong-lead credited reps: `0`
- Generic side-unknown credited reps: `0`
- Rep credited before both feet floor: `0`
- Duplicate rep credits: `0`
- Stale rep callback mutations: `0`
- Wrong attempt flipping expected lead: `0`

## Set result

- Valid 12-rep set left/right mismatch: `0`
- Set completes before 12: `0`
- Set completes with broken alternation: `0`
- Rep SFX count mismatch: `0`
- Extra set events: `0`

## Persistence

- Partial rep credited after restore: `0`
- Expected lead changed after restore: `0`
- Plan regenerated differently after restore: `0`
- Local/backend round-trip failures: `0`

## Progression

- Invalid alternation accepted for progression: `0`
- Side imbalance masked by total reps: `0`
- Valid time doubled: `0`
- Duplicate completion event: `0`

## Seed/order

- Set-start order failure: `0`
- Main-plan seed flip failure: `0`
- Skip/cancel incorrect seed flip: `0`
- Manual practice main-seed mutation: `0`

## Voice/planning

- Start-lead logical mismatch: `0`
- Voice/runtime target mismatch: `0`
- Per-rep spoken switch cue: `0`
- Spoken total set count: `0`
- `IR-VOICE-STEP-ALTERNATION` remaining: `0`

## Isolation

- Step-up feature default: off
- Training Voice V2.1 feature: off
- Training Voice V2.1 audio ready: false
- Training Voice V2.1 global behaviour ready: false
- Legacy/V2.1 mixed semantics: `0`
- Balance V2 remains default-closed/audio-pending

## Integrity

- Existing tests pass.
- No audio changed.
- No audio generated.
- No external speech/audio API called.
- Human listening remains waived.
- Physical QA remains deferred.

---

# 31. Implementation report structure

Use:

# Pearl Training Step-Up Alternation Implementation

## 1. Result

## 2. Approved FD-005 Contract

## 3. Current Step-Up Source Reconciliation

## 4. Alternation Plan

## 5. Lead-Leg Evidence

## 6. Both-Feet-Floor Rep Boundary

## 7. Rep State Machine

## 8. Wrong-Lead Handling

## 9. Start-Lead Order Across Sets and Sessions

## 10. Interruption, Pause, and Restore

## 11. Result Aggregation and Progression

## 12. Workout Generation Integration

## 13. Training Voice V2.1 Reconciliation

## 14. UI and Accessibility

## 15. Feature Flags and Legacy Isolation

## 16. Persistence and Sync

## 17. Diagnostics

## 18. Tests

## 19. Runtime-Derived Audit Method

## 20. Files Changed

## 21. Worktree Integrity

## 22. Exact Next Phase

---

# 32. Handoff to floor-transfer readiness

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_HANDOFF.md`

The exact next task must be:

```text
Training floor-transfer readiness gate implementation
```

Include:

- step-up plan API,
- state-machine API,
- rep-evidence API,
- result aggregation API,
- start-lead seed API,
- feature/readiness gates,
- removed step-up blocker,
- remaining step-up blockers,
- current floor-affected exercise ids,
- approved floor gate contract,
- tests that must remain green,
- later sequence:
  1. floor-transfer readiness gate
  2. live safety-family integration
  3. training controls/progress/recovery
  4. micro-check Voice V2.1
  5. final cue schema/manifests
  6. consolidated Clara/Marcus generation, including Balance V2
  7. whole-project runtime audit
  8. final physical-device QA

Do not implement the floor gate in this task.

---

# 33. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- step-up plan,
- lead-leg evidence,
- rep state machine,
- wrong-lead handling,
- persistence/restore,
- start-side seed,
- progression,
- workout generation,
- Training Voice V2.1 planner/readiness,
- both-sides regressions,
- session player,
- dynamic state,
- valid-time progression,
- backend training-state sync/restore,
- MPV2,
- measurement-side,
- Balance V2.

Run broader relevant tests where practical.

Run the audit-only harness.

Parse all generated JSON and CSV artifacts.

Independently recompute JSON scenario counts from the scenario CSV.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

Do not modify tests merely to make them pass.

---

# 34. Final Codex response

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
- Current/default step-up target
- Supported scaled-target rule
- Initial-lead persistence strategy
- Set-start lead order
- Rep-state phases
- Lead-leg evidence rule
- Both-feet-floor boundary rule
- Wrong-lead behaviour
- Tracking/pause/restore behaviour
- Progression aggregation rule
- Main-plan seed flip behaviour
- Manual/Explore seed behaviour
- Wrong-lead credit count
- Generic side-unknown credit count
- Rep-before-floor-return count
- Duplicate credit count
- Stale callback count
- Restore partial-credit count
- Unequal-side set-completion count
- Invalid-alternation progression count
- Rep-SFX mismatch count
- Voice/runtime target mismatch count
- Remaining `IR-VOICE-STEP-ALTERNATION` blocker count
- Step-up feature flag/default
- Training Voice V2.1 feature/default
- Training Voice V2.1 audio-ready value
- Training Voice V2.1 global behaviour-ready value
- Balance V2 default/audio-ready status
- Canonical scenario count
- Confirmation that every metric was derived rather than hard-coded
- Post-patch P0/P1/P2/P3 counts
- Primary verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused and broader test results
- Exact next task from the handoff
- A concise confidence statement

Do not generate audio, enable Training Voice V2.1, enable Balance V2, implement the floor gate, or perform physical-device QA in this task.
