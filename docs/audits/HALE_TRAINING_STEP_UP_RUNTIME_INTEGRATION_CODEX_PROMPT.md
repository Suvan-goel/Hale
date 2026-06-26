# Codex Prompt: Hale Step-Up Alternation End-to-End Runtime Integration Patch

Read this entire prompt before changing anything.

Hale’s step-up alternation **model** is correct, but the verification addendum proved that it is not connected end to end to the actual training runtime.

Current verified status:

```text
Primary verdict:
TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING

Canonical scenarios:
53 / 53

Scenario rows:
54

Event-evidence rows:
134

Runtime trace:
5 model-only missing links
7 partial/legacy links
0 uncertain links
```

The isolated/default-closed model already verifies:

- 12 total accepted reps
- 6 left-leading and 6 right-leading reps
- expected lead flips only after an accepted rep
- wrong/unknown lead receives no credit
- both feet must return to the floor
- duplicate/stale events receive no credit
- partial reps do not survive interruption or restore
- even target support and odd-target rejection
- deterministic set-start side order
- progression rejection for side imbalance or broken alternation
- logical Training Voice V2.1 lead/correction plans
- default-closed feature isolation

The three blocking findings are:

```text
F-STEPUP-RUNTIME-INTEGRATION
F-STEPUP-POSE-EVIDENCE-ADAPTER
F-STEPUP-BACKEND-SYNC
```

The exact missing or partial links are:

```text
3. Feature/readiness selector -> active internal runtime path
4. Training screen/session controller -> alternation runtime owner
5. Pose/grader output -> lead-leg and floor-boundary evidence
6. Evidence -> alternation state-machine action
7. Accepted alternation rep -> rep-credit SFX
8. Alternation state -> SetResult
9. SetResult -> progression
11. Active alternation state -> local serialization
12. Local serialization -> live restore
13. Training state -> backend JSON sync/restore
14. Successful main-plan completion -> initial-lead seed flip
15. Manual/Explore completion -> no main-plan seed mutation
```

This task must connect those links truthfully.

Do not begin the floor-transfer readiness phase until this runtime-integration patch passes its completion gates.

---

# 1. Required source artifacts

Read and use:

## Verification addendum

- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv`
- `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_VERIFICATION_HANDOFF.md`
- `scripts/audits/audit-training-step-up-alternation-addendum.mjs`

## Existing step-up model

- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.md`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv`
- all current source under `src/training/stepUpAlternation/`
- all existing step-up tests

The existing APIs include, or have repository-equivalent names:

```text
deriveStepUpAlternationPlan(...)
deriveStepUpAlternationPlanForGeneratedExercise(...)
resolveStepUpRepEvidence(...)
createStepUpAlternationRuntimeState(...)
advanceStepUpAlternationState(...)
serializeStepUpAlternationRuntimeState(...)
deserializeStepUpAlternationRuntimeState(...)
stepUpSetResultToLegacySetResult(...)
selectTrainingStepUpAlternationMode(...)
```

## Training Voice V2.1

- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- current source under `src/training/voiceV21/`

## Both-sides rounds / shared initial-side seed

- current source under `src/training/bothSidesRounds/`
- `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.md`

## Completed foundations that must remain green

- MPV2 voice/runtime completion
- measurement-side metadata and UX
- Eyes-Open Balance Protocol V2
- Training Voice V2.1 contract foundation
- both-sides rounds
- isolated step-up model

Project boundaries remain:

```text
Step-up alternation feature:
default off

Training Voice V2.1:
default off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

Balance V2:
default closed / audio pending

Human listening:
waived, not completed

Physical-device QA:
deferred
```

Do not change those boundaries.

---

# 2. Objective

Implement a default-closed, end-to-end internal step-up runtime path that guarantees:

1. A generated internal V2.1 step-up item carries one pinned alternation plan.
2. Feature/readiness selection routes that item to exactly one alternation runtime owner.
3. The training session player owns and advances the live alternation state.
4. Real pose/grader frames are conservatively adapted into:
   - observed lead leg,
   - valid ascent,
   - valid top phase,
   - both-feet-floor start boundary,
   - both-feet-floor return boundary,
   - tracking validity.
5. Ambiguous or insufficient evidence never receives a guessed side.
6. The alternation state machine is the sole authority for accepted step-up reps in the internal path.
7. The legacy generic `repCredited` event cannot also credit the same rep.
8. Rep-credit SFX plays exactly once and only after alternation-state acceptance.
9. Wrong-lead attempts receive no credit and no SFX.
10. Wrong-lead attempts do not change the expected lead.
11. Both feet must return to the floor before:
    - the rep can be accepted,
    - the expected lead can flip,
    - or the next rep can begin.
12. The alternation state produces the live `SetResult`.
13. The generic grader’s `finish()` result is not used as the live internal step-up result.
14. The adapted `SetResult` reaches existing progression exactly once.
15. One alternating set remains one set.
16. Valid time and completion are not doubled by lead side.
17. Active alternation state survives local serialization and restore.
18. A partial rep is retired on pause/background/restore.
19. Accepted reps are never replayed or duplicated after restore.
20. Backend compact training-state sync preserves:
    - step-up alternation plan,
    - initial lead,
    - active safe-boundary state,
    - accepted counts,
    - expected lead,
    - plan fingerprint,
    - shared next-start-side seed where current backend architecture stores it.
21. Successful main-plan completion flips the shared initial-side seed once.
22. Skip, cancel, incomplete exercise, duplicate completion, manual practice, and Explore practice do not incorrectly flip the main-plan seed.
23. Training Voice V2.1 planning receives the live expected lead and target context.
24. The legacy path remains unchanged with the feature off.
25. The internal path cannot partially activate under legacy voice.
26. Existing in-progress legacy sessions remain legacy.
27. All 16 runtime integration trace links become:
    - `connected_verified`, or
    - `not_applicable` only where genuinely not applicable.
28. Missing/partial/legacy/uncertain integration links become zero.
29. All original 53 canonical scenarios remain present and passing.
30. New end-to-end integration scenarios pass.
31. Every audit metric is derived from executable scenario/evidence rows.
32. No audio is generated or changed.
33. The exact next task becomes the floor-transfer readiness gate only if all runtime integration gates pass.

---

# 3. Strict scope

## In scope

- Live feature/readiness selection.
- Session-player runtime ownership.
- Conservative pose/grader evidence adapter.
- Additive grader observation output if necessary.
- Step-up alternation runtime controller.
- Live accepted-rep/SFX authority.
- Live SetResult generation.
- Progression integration.
- Safe pause/background/retry/restore.
- Local persistence.
- Backend compact sync/restore.
- Shared initial-lead seed integration.
- Main-plan versus manual/Explore completion semantics.
- Training Voice V2.1 live context plumbing.
- Default-off feature isolation.
- Development diagnostics.
- Focused production tests.
- Post-integration runtime-derived audit.

## Out of scope

Do not implement:

- floor-transfer readiness gate,
- live safety-family narration integration,
- full training pause/resume/skip/recovery voice completion,
- Micro-Check Voice V2.1,
- audio generation,
- ElevenLabs calls,
- runtime TTS,
- human listening review,
- physical-device QA,
- enabling Training Voice V2.1,
- enabling Balance V2,
- enabling step-up alternation by default,
- changing step-up’s 3 × 12 prescription,
- changing exercise release policy,
- changing unrelated exercise programming,
- medical/normative claims,
- package installation,
- lockfile changes,
- destructive Git operations.

Do not weaken the approved evidence contract merely to obtain end-to-end connectivity.

---

# 4. Worktree safety

The repository is already heavily dirty.

At task start record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- pre-existing relevant modifications,
- pre-existing untracked files,
- pre-existing audio diff.

Rules:

1. Treat every current modification as user-owned.
2. Do not reset, stash, checkout, clean, rebase, or discard anything.
3. Do not delete untracked files.
4. Do not overwrite unrelated render/check-up/website/audit work.
5. Do not regenerate audio manifests wholesale.
6. Do not commit or push.
7. Make minimal edits to concurrently modified files.
8. At completion, distinguish this task’s footprint from pre-existing changes.

---

# 5. Current source to inspect

Inspect live source and follow actual imports.

## Training runtime

At minimum:

- `src/training/sessionPlayer.ts`
- `src/screens/TrainingSessionScreen.tsx`
- current training controller/player types
- current frame-update path
- current set-start/set-end path
- current pause/resume/skip/cancel path
- current `SetUpdate` and `SetResult` types
- current rep-credit SFX path
- current session completion path
- current main-plan event path
- current manual/Explore path

## Step-up model

All source under:

```text
src/training/stepUpAlternation/
```

## Exercise/grader

- exact step-up definition
- current step-up grader creation
- `src/exercises/setGraders.ts`
- lower-body landmark/pose helpers
- current rep-phase helpers
- current camera readiness/preflight helpers
- current body-unit and smoothing helpers
- current frame timestamp type

## Generation/dynamic state

- `src/training/workoutGeneration.ts`
- `src/training/dynamicState.ts`
- generated exercise/session types
- restored generated-session paths
- short-session/readiness/pain/equipment variants

## Progression/results

- `src/training/progression.ts`
- `src/training/validTimeProgression.ts`
- session completion/result aggregation
- main-plan events
- ladder progression persistence

## Persistence/backend

- `src/training/serialize.ts`
- active training-state types
- `src/services/backend/trainingStateSyncService.ts`
- `src/services/backend/restoreService.ts`
- session sync/completion sync where relevant
- account export/restore where relevant
- duplicate merge/fingerprint logic

## Shared side-order seed

- `src/training/bothSidesRounds/startSide.ts`
- all current callers
- current local/backend persistence

## Voice planning

- `src/training/voiceV21/sequencePlanner.ts`
- `src/training/voiceV21/readiness.ts`
- `src/training/voiceV21/runtime.ts`
- target grammar
- step-up contract and logical cue requirements

Search broadly for:

```text
TrainingSessionPlayer
ExerciseSetGrader
RepsSetGrader
repCredited
playRepSound
SfxChannel
grader.finish
SetResult
stepUpAlternationPlan
stepUpInitialLeadSide
stepUpAlternationRuntime
selectTrainingStepUpAlternationMode
resolveStepUpRepEvidence
APPLY_REP_EVIDENCE
countsTowardMainPlan
applyBothSidesExerciseCompletionToStartSideSeed
sanitizeGeneratedExerciseSummary
deserializeTrainingState
```

---

# 6. Architectural boundary

Do not bolt the pure model onto the screen with ad hoc React state.

Create one explicit internal set-runtime abstraction.

A suitable conceptual interface is:

```ts
export interface TrainingSetRuntime {
  readonly kind: 'legacy' | 'step_up_alternation';

  update(frame: PipelineFrameOutput): TrainingSetRuntimeUpdate;
  pause(atMs: number): TrainingSetRuntimeUpdate;
  resume(atMs: number): TrainingSetRuntimeUpdate;
  cancel(atMs: number): TrainingSetRuntimeUpdate;
  finish(atMs: number): SetResult;

  serialize(): SerializedTrainingSetRuntime;
}

export interface TrainingSetRuntimeUpdate {
  setUpdate: SetUpdate;
  acceptedRepEvent?: {
    repAttemptId: string;
    repCount: number;
  };
  correction?: {
    code: 'wrong_lead' | 'return_both_feet_to_floor' | 'insufficient_lead_evidence';
    expectedLeadSide: 'left' | 'right';
  };
  stepUpContext?: {
    expectedLeadSide: 'left' | 'right';
    acceptedRepCount: number;
    leftLeadRepCount: number;
    rightLeadRepCount: number;
    targetTotalReps: number;
  };
}
```

Equivalent repository-consistent naming is acceptable.

## Rules

- `LegacyTrainingSetRuntime` may wrap the current grader.
- `StepUpAlternationSetRuntime` owns:
  - the existing step-up alternation plan,
  - evidence adapter,
  - state machine,
  - live state,
  - SetResult conversion.
- `TrainingSessionPlayer` owns exactly one current runtime.
- The screen consumes unified updates.
- The screen does not independently own alternation state.
- The generic grader and alternation runtime cannot both credit reps.
- Avoid a broad rewrite of every exercise runtime if a narrow strategy wrapper is sufficient.
- Preserve legacy behavior byte-for-byte where practical when the feature is off.

---

# 7. Runtime selection

Connect the existing selector to the live session player.

A suitable selection input is:

```ts
selectTrainingSetRuntime({
  generatedExercise,
  exerciseDefinition,
  featureFlags,
  trainingVoiceMode,
  runtimeCapabilities,
  restoredRuntime,
})
```

## Step-up alternation may be selected only when

- exercise id is `step-up`,
- `EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION === '1'`,
- the generated item contains a valid alternation plan,
- the plan fingerprint matches the final prescription,
- the item is a newly generated internal V2.1-capable item,
- the internal runtime capability is enabled,
- no in-progress legacy set state exists,
- the required pose evidence adapter is available,
- the session cannot simultaneously run legacy and V2.1 semantics.

Because Training Voice V2.1 audio/behaviour remain globally closed:

- the normal user route must remain legacy,
- internal tests may inject a ready runtime capability,
- do not create a public bypass,
- do not treat the step-up alternation flag alone as sufficient.

## Existing sessions

- A legacy session remains legacy for its lifetime.
- Do not migrate an in-progress set.
- Protocol/runtime mode is pinned into generated-session metadata.

---

# 8. Conservative live pose-evidence adapter

The addendum proved that the current generic grader does not emit enough evidence.

Implement a dedicated adapter for the internal step-up path.

A suitable conceptual API is:

```ts
export interface StepUpFrameObservation {
  timestampMs: number;
  trackingValid: boolean;

  leftFootReliable: boolean;
  rightFootReliable: boolean;
  bothFeetFloorReady: boolean;

  observedLeadCandidate: 'left' | 'right' | null;
  ascentStarted: boolean;
  topPhaseValid: boolean;
  returnToFloorValid: boolean;

  reasonCodes: readonly string[];
}

export interface StepUpAlternationEvidenceAdapter {
  resetForSet(input: StepUpEvidenceSetup): void;
  resetForRep(input: StepUpEvidenceRepSetup): void;
  update(frame: PipelineFrameOutput): StepUpFrameObservation[];
}
```

Equivalent naming is acceptable.

## 8.1 Use current pipeline conventions

Reuse current:

- landmark validity/confidence helpers,
- smoothing,
- body-unit calibration,
- monotonic frame timestamps,
- subject-gone/tracking interruption rules,
- side-chain definitions,
- step-up phase logic where semantically valid.

Do not introduce a second competing smoothing pipeline.

## 8.2 Required landmarks

Independently determine the smallest reliable set.

The internal alternation path should normally require both lower-body chains sufficiently visible, including the landmarks needed to distinguish:

- left/right hip,
- left/right knee,
- left/right ankle,
- left/right heel and/or foot index where the current pipeline supports them.

Do not require landmarks that the live pose event does not actually provide.

## 8.3 Floor baseline

During stable setup:

- establish a per-foot floor/start baseline from current coordinates,
- pin the calibration to the current set,
- require a stable dwell,
- reset only on a meaningful setup restart,
- do not recalibrate mid-rep,
- store enough calibration in active runtime persistence to restore safely or force a new setup calibration.

## 8.4 Lead candidate

Use a conservative multi-signal rule based on current source evidence.

A lead candidate should require:

- both feet were at the start boundary,
- one foot begins the ascent first,
- the opposite foot remains at the start/floor boundary during candidate confirmation,
- the candidate side’s lower-body chain remains valid,
- candidate dwell/hysteresis is met.

Do not choose whichever side is merely clearer.

If both feet move ambiguously or confidence is insufficient:

```text
observedLeadCandidate = null
```

and no rep may be credited.

## 8.5 Top phase

Prefer the current step-up grader’s validated top/ascent phase if it can be exposed additively.

Do not replace proven rep mechanics unnecessarily.

A top phase must not be inferred solely from one noisy ankle threshold.

## 8.6 Return boundary

A rep may become eligible for acceptance only after both feet return to the calibrated floor/start boundary with a stable dwell.

Requirements:

- one foot remaining on the step is not a valid return,
- transient threshold crossing is not enough,
- duplicate return callbacks cannot create duplicate acceptance,
- descent-foot order is deliberately unconstrained unless existing production semantics prove otherwise.

## 8.7 Tracking interruption

On confirmed tracking interruption:

- retire the current rep attempt,
- credit nothing,
- preserve previously accepted reps,
- preserve expected lead,
- return to setup/floor readiness,
- create a new attempt id.

## 8.8 No unsupported claims

Do not claim detection of:

- force,
- pressure,
- exact stair height,
- exact platform contact,
- safe foot placement,
- descent-foot order,

unless the current source genuinely provides it.

---

# 9. Additive grader integration

Choose the least risky approach after inspecting current source.

Acceptable patterns:

## Pattern A — Additive observation output

Extend the step-up-specific grader/update with an optional observation:

```ts
interface StepUpGraderObservation {
  timestampMs: number;
  phase: string;
  topPhaseValid: boolean;
  trackingValid: boolean;
}
```

The legacy runtime ignores it.

The alternation adapter combines it with bilateral foot evidence.

## Pattern B — Dedicated internal grader

Create a `StepUpAlternationSetRuntime` that directly consumes frames while reusing current pure step-up phase helpers.

## Requirements

- Legacy step-up behavior is unchanged with the feature off.
- Do not emit both generic `repCredited` and alternation acceptance.
- Do not make generic `RepsSetGrader` responsible for product-level lead alternation across every exercise.
- Keep step-up-specific logic local.

---

# 10. Evidence to state-machine dispatch

The internal runtime must own one current `repAttemptId`.

A suitable flow is:

```text
stable floor boundary
→ create rep attempt
→ detect observed lead candidate
→ compare with expected lead
→ observe valid ascent/top
→ observe both-feet floor return
→ resolve StepUpRepEvidence
→ dispatch APPLY_REP_EVIDENCE
→ state machine accepts/rejects
```

## Required behavior

### Expected lead

- Accepted only when observed lead matches expected lead.
- State flips expected lead only after acceptance.

### Wrong lead

- Produce a rejected `wrong_lead` evidence object.
- No rep credit.
- No SFX.
- Expected lead unchanged.
- Require both feet to return before a new attempt.

### Unknown lead

- Produce no accepted evidence.
- No generic fallback credit.
- Keep expected lead unchanged.

### Duplicate/stale

- Evidence carries attempt id and stage epoch.
- State ignores evidence from retired attempts.
- Acceptance is idempotent.

---

# 11. Rep-credit SFX authority

In the internal step-up path:

```text
alternation state accepted rep
→ one acceptedRepEvent
→ one rep-credit SFX
```

## Requirements

- The generic grader update must not separately request SFX.
- Wrong/unknown/incomplete reps play no SFX.
- Duplicate accepted callbacks play one SFX total.
- Screen effects do not infer SFX from rep-count changes.
- SFX count equals accepted rep count.
- Legacy exercises and legacy step-up retain their current SFX path.

Add a source-level guard preventing both authorities from firing for the same internal step-up set.

---

# 12. Live SetResult integration

When the alternation state reports set completion:

1. Convert the live state through the existing result adapter.
2. Produce one `SetResult`.
3. Include additive step-up metadata:
   - plan version/fingerprint,
   - set start lead,
   - accepted total,
   - left/right counts,
   - alternation validity,
   - rep evidence summary,
   - progression eligibility.
4. Do not call the generic grader’s result as the canonical internal result.
5. Ensure session-player set completion occurs once.
6. Preserve current rest and next-set behavior.
7. Preserve the current step-up ladder identity.
8. Preserve the 3-set prescription.

## Incomplete exit

Pause/cancel/skip must not fabricate a completed SetResult.

---

# 13. Progression integration

Connect the live adapted result to current progression.

Requirements:

- one completed alternating set maps to one set,
- 12 reps remain 12 reps,
- lead counts are supporting evidence,
- valid time is not duplicated,
- side imbalance cannot be hidden by total reps,
- alternation invalidity cannot be progression-eligible,
- session completion emits once,
- current progression thresholds remain unchanged,
- legacy step-up results remain readable.

Add an integration test that begins from a generated internal session item, completes 12 accepted alternating reps, finishes the set, and reaches the real progression summary.

Do not test only the pure result adapter.

---

# 14. Local active-state serialization and restore

Add active alternation runtime state to the canonical training state.

Persist only JSON-safe fields needed to resume safely:

- runtime schema version,
- plan fingerprint,
- set index,
- set start lead,
- expected lead,
- accepted rep count,
- left/right counts,
- accepted rep evidence or compact accepted-rep ids,
- stage epoch,
- phase safe checkpoint,
- completed set results if the current training state stores them.

## Safe checkpoints

Prefer persistence at:

- set setup,
- accepted rep completion,
- pause,
- app background,
- side-safe/rep-safe boundary.

Do not persist a partial rep as accepted.

## Restore behavior

- Reconstruct the session-owned alternation runtime.
- Validate fingerprint against the stored generated item.
- Preserve accepted reps.
- Preserve expected lead.
- Retire any partial attempt.
- Return to both-feet-floor readiness.
- Create a new attempt id.
- Do not regenerate the plan from current defaults.
- If metadata is malformed or mismatched:
  - fail closed to a safe nonselectable/internal error,
  - do not guess,
  - do not silently switch to legacy mid-session.

## Legacy

Old sessions without active alternation state remain legacy.

---

# 15. Backend compact sync/restore

Close `F-STEPUP-BACKEND-SYNC`.

Inspect the actual backend payload architecture.

At minimum preserve:

## Generated exercise summary

- `stepUpAlternationPlan`
- `stepUpInitialLeadSide`
- runtime/protocol mode if stored on the item
- plan fingerprint

## Active training state

Where the current compact snapshot persists active session state, include the safe active alternation envelope.

## Shared seed

Preserve the shared next-start-side seed through the existing canonical training-state payload if it is already part of that state.

## Requirements

- additive JSON only unless live schema proves otherwise,
- no remote migration unless unavoidable,
- do not execute remote changes,
- sanitizer retains validated metadata,
- restore maps it back,
- malformed metadata fails safely,
- richer/newer alternation metadata is not replaced by an older compact copy,
- offline completion then sync preserves the final seed and results,
- account export includes additive metadata if training state is exported.

Add backend round-trip tests using the actual sanitizer and restore mapper.

---

# 16. Main-plan seed flip integration

Connect the existing idempotent helper to the canonical successful exercise completion path.

Rules:

- Flip after successful completion of the full step-up exercise, not after each set.
- Require `countsTowardMainPlan === true`.
- Use a stable completion id/idempotency token.
- Duplicate processing does not flip twice.
- Skip/cancel/incomplete does not flip.
- Manual/Explore does not flip unless existing product rules explicitly mark it as main-plan completion.
- Restore/replay of an already-processed completion does not flip again.
- Backend sync/restore preserves the resulting seed.

Do not create a second seed store.

---

# 17. Manual and Explore isolation

Trace every path that can run step-up outside the main plan.

For each:

- generate an internal plan if an internal test context enables it,
- do not mutate the main-plan seed,
- do not emit main-plan progression unless existing `countsTowardMainPlan` logic explicitly says so,
- preserve one-set/one-result semantics,
- preserve default closure.

Add real completion-path tests, not helper-only tests.

---

# 18. Training Voice V2.1 live context plumbing

Do not generate audio.

Connect the live internal runtime state to the V2.1 planner input.

Expose:

- current set start lead,
- current expected lead,
- target total reps,
- accepted count,
- left/right count,
- wrong-lead correction state.

## Planned behavior

### Set setup

Planner receives the set’s pinned start lead.

### Wrong lead

Planner can produce the appropriate logical correction:

```text
Next rep, lead with your left leg.
```

or:

```text
Next rep, lead with your right leg.
```

### No per-rep speech

Correct accepted reps still use SFX only.

## Readiness

Physical assets remain pending, so:

- Training Voice V2.1 remains unselectable,
- no pending logical key enters the physical manifest,
- no live legacy audio is mixed with logical V2.1 state,
- this connection is tested through logical plans only.

---

# 19. UI integration

Implement only the internal/default-closed UI needed for truthful state display.

When the internal runtime is injected in tests/internal builds, show:

- `12 total reps`
- accepted rep progress
- `6 left • 6 right` target context or equivalent
- `Next: Left leg` / `Next: Right leg`
- calm wrong-lead correction:
  - `Return both feet to the floor. Next, lead with your right leg.`
- setup state when both feet are not at the floor boundary
- set completion only after valid 6/6 alternation

## Accessibility

- expected lead appears in text and accessibility label,
- no color-only indication,
- wrong-lead correction is not shaming,
- dynamic type does not hide essential controls,
- legacy UI remains unchanged with the feature off.

Do not redesign the whole training screen.

---

# 20. Pause, background, retry, skip, and cancel

## Pause/background during a rep

- retire the partial attempt,
- preserve accepted counts,
- preserve expected lead,
- return to both-feet-floor readiness,
- no partial credit,
- no SFX.

## Retry/recovery

The full training recovery voice phase is later.

For this task:

- runtime data semantics must be correct,
- retry creates a new rep attempt at the same expected lead,
- existing visible control remains available,
- do not add new audio.

## Skip/cancel

- exit under current exercise/session semantics,
- do not create a partial completed set,
- do not flip the main-plan seed,
- do not preserve a live partial attempt.

---

# 21. Feature flags and readiness

Keep or use:

```text
EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION
```

Expected after this task:

```text
Step-up alternation software ready:
true

Step-up alternation runtime integrated:
true

Step-up alternation feature default:
off

Training Voice V2.1 feature:
off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

Balance V2:
default closed / audio pending
```

## Critical isolation rule

Setting only the step-up alternation flag in an ordinary user build must not produce a half-integrated path without the required internal V2.1 capability.

Selection must require the full internal readiness context.

No legacy and internal step-up runtime may own the same set.

---

# 22. Diagnostics

Add bounded, privacy-safe diagnostics for:

- runtime mode selected,
- alternation runtime created,
- plan fingerprint validated,
- floor baseline ready,
- lead candidate observed,
- lead ambiguous,
- wrong lead rejected,
- top phase reached,
- return boundary reached,
- rep accepted,
- generic rep event suppressed,
- SFX emitted,
- SetResult emitted,
- progression consumed,
- active state serialized,
- runtime restored,
- backend metadata sanitized/restored,
- main-plan seed flip attempted/applied/deduplicated,
- manual/Explore seed mutation suppressed.

Do not log:

- raw video,
- raw landmarks,
- account identifiers,
- user name,
- detailed health values.

---

# 23. Required production tests

Do not weaken or remove existing tests.

## 23.1 Runtime selection

1. Feature off selects legacy.
2. Step-up flag alone does not half-activate.
3. Internal complete readiness selects alternation runtime.
4. Invalid plan fingerprint blocks selection.
5. Missing plan blocks selection.
6. In-progress legacy set remains legacy.
7. Non-step-up exercise remains legacy.
8. Only one runtime owns the set.

## 23.2 Pose evidence adapter

Use deterministic synthetic frame sequences based on the current live frame type.

Required cases:

1. Stable both-feet-floor baseline.
2. Left lead observed.
3. Right lead observed.
4. Opposite foot remains at floor during candidate confirmation.
5. Both feet move ambiguously -> no lead.
6. Expected-side landmarks missing -> insufficient evidence.
7. Clearer opposite chain does not override observed lead.
8. Valid top phase.
9. Top without return does not accept.
10. One foot remains on step -> no return boundary.
11. Both feet return with dwell -> valid return.
12. Threshold noise produces one candidate/return only.
13. Tracking interruption retires attempt.
14. No unsupported descent-foot-order requirement.
15. No unsupported platform-pressure/contact claim.
16. Calibration does not change mid-rep.

## 23.3 End-to-end frame-to-rep

1. Synthetic left-leading frame sequence produces one accepted left rep.
2. Synthetic right-leading sequence produces one accepted right rep.
3. Wrong-lead sequence produces no credit.
4. Unknown-lead sequence produces no credit.
5. Incomplete-return sequence produces no credit.
6. Duplicate terminal frame produces one credit.
7. Stale old-attempt frame produces no mutation.
8. Accepted rep flips expected lead once.
9. SFX event count equals accepted rep count.
10. Generic legacy rep event is suppressed in internal path.

## 23.4 Session-player integration

1. Generated item creates live alternation runtime.
2. Player update dispatches evidence.
3. Player exposes current expected lead.
4. Player emits wrong-lead correction state.
5. Player accepts 12 alternating reps.
6. Player completes one set.
7. Player uses adapted SetResult.
8. Player does not call generic grader result as canonical.
9. Rest/next set behavior remains correct.
10. Three sets start L/R/L or R/L/R.
11. Set completion emits once.
12. Legacy path regression remains unchanged.

## 23.5 Progression integration

1. Adapted live SetResult reaches real progression.
2. One set remains one set.
3. 12 total remains 12.
4. 6/6 evidence is preserved.
5. Broken alternation is not progression eligible.
6. Side imbalance is not progression eligible.
7. Valid time is not doubled.
8. Session completion emits once.
9. Existing ladder identity remains.
10. Legacy result remains readable.

## 23.6 Local restore

1. Active state serializes after accepted rep.
2. Restore after six reps preserves counts and expected lead.
3. Restore mid-rep retires partial attempt.
4. Restore creates a new attempt id.
5. Plan fingerprint remains pinned.
6. Mismatched fingerprint fails closed.
7. Completed rep is not replayed.
8. Stale pre-restore callback is ignored.
9. Pause/background checkpoints are safe.
10. Old session without metadata remains legacy.

## 23.7 Backend sync

1. Generated summary sanitizer retains plan.
2. Sanitizer retains initial lead.
3. Sanitizer retains fingerprint.
4. Active runtime envelope round-trips where supported.
5. Restore mapper reconstructs metadata.
6. Malformed metadata fails safely.
7. Richer metadata wins duplicate merge.
8. Offline completion then sync preserves final result.
9. Shared next-side seed round-trips.
10. No remote schema migration is required unless explicitly documented.

## 23.8 Seed integration

1. Successful main-plan exercise completion flips seed once.
2. Three set completions do not flip three times.
3. Duplicate exercise completion is idempotent.
4. Skip does not flip.
5. Cancel does not flip.
6. Incomplete exercise does not flip.
7. Manual completion does not flip.
8. Explore completion does not flip.
9. Main-plan completion after restore flips once.
10. Backend replay does not flip again.

## 23.9 Voice context

1. Live expected lead reaches logical planner.
2. Set start lead reaches logical planner.
3. Wrong-lead left correction is correct.
4. Wrong-lead right correction is correct.
5. No per-rep spoken switch.
6. Target remains 12 total.
7. No set-count setup cue.
8. Physical manifest remains unchanged.
9. Audio readiness remains false.
10. Training Voice V2.1 remains default-closed.

## 23.10 Regression

Re-run:

- all 53 addendum scenarios,
- isolated step-up tests,
- both-sides tests,
- Training Voice V2.1 tests,
- session-player tests,
- workout-generation tests,
- progression/valid-time tests,
- training serialization tests,
- backend training-state tests,
- MPV2 regressions,
- measurement-side regressions,
- Balance V2 regressions.

Preserve completed-foundation P0/P1/P2 zeros.

---

# 24. Required runtime audit scenarios

Retain all original 53 canonical ids.

Add at least these integration scenarios:

## Selection and ownership

- `integration_generated_item_selects_runtime`
- `integration_step_up_flag_alone_stays_legacy`
- `integration_one_runtime_owner`
- `integration_existing_legacy_session_stays_legacy`

## Pose evidence

- `integration_frames_left_lead_to_evidence`
- `integration_frames_right_lead_to_evidence`
- `integration_frames_wrong_lead_rejected`
- `integration_frames_unknown_lead_rejected`
- `integration_frames_top_without_return_rejected`
- `integration_frames_one_foot_on_step_rejected`
- `integration_frames_threshold_noise_single_credit`
- `integration_tracking_interrupt_retires_rep`

## Runtime and SFX

- `integration_evidence_dispatches_state_machine`
- `integration_accepted_rep_is_only_sfx_source`
- `integration_generic_rep_sfx_suppressed`
- `integration_twelve_reps_complete_one_set`
- `integration_three_sets_preserve_start_order`

## Result and progression

- `integration_state_machine_emits_set_result`
- `integration_set_result_reaches_progression`
- `integration_invalid_alternation_blocks_progression`
- `integration_no_valid_time_double_count`
- `integration_session_completion_once`

## Persistence

- `integration_local_restore_after_six_reps`
- `integration_local_restore_mid_rep`
- `integration_backend_generated_plan_roundtrip`
- `integration_backend_active_state_roundtrip`
- `integration_backend_seed_roundtrip`
- `integration_richer_metadata_merge`

## Seed and manual isolation

- `integration_main_plan_completion_flips_seed_once`
- `integration_duplicate_completion_seed_idempotent`
- `integration_manual_completion_does_not_flip_seed`
- `integration_explore_completion_does_not_flip_seed`

## Voice context and defaults

- `integration_live_expected_lead_reaches_voice_planner`
- `integration_wrong_lead_context_reaches_voice_planner`
- `integration_training_voice_remains_closed`
- `integration_balance_v2_remains_closed`
- `integration_audio_manifest_unchanged`

Minimum canonical scenario ids after this task:

```text
53 original + at least 35 integration scenarios = at least 88
```

Variants may increase row count.

---

# 25. Runtime-derived audit rules

The previous addendum’s derived-metric standard remains mandatory.

## Requirements

1. Every scenario executes current pure/runtime functions wherever possible.
2. Every metric derives from:
   - scenario rows,
   - event-evidence rows,
   - runtime trace rows,
   - or explicit source queries.
3. No defect count is assigned a literal expected zero.
4. Write CSVs first.
5. Reopen CSVs from disk.
6. Independently recompute all metrics.
7. Recompute findings.
8. Recompute verdict.
9. Fail on mismatch.
10. Include `metricEvidence` for every metric.
11. Integration trace status must derive from current source after implementation.
12. All 16 links must be reevaluated.
13. A passing verdict cannot be hard-coded.

---

# 26. Required artifacts

Create:

1. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md`
2. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md`
3. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json`
4. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv`
5. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv`
6. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv`
7. `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md`

Add an audit-only harness:

- `scripts/audits/audit-training-step-up-runtime-integration.mjs`

Do not overwrite the addendum artifacts.

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,variantId,category,evidenceMethod,sourceFunctions,initialState,eventSequence,expectedOutcome,observedOutcome,passed,findingRuleIds,metricTags,testCoverage,notes
```

## Event CSV columns

Use columns similar to:

```text
scenarioId,variantId,eventIndex,timestampMs,runtimeMode,setIndex,repAttemptId,phase,expectedLeadBefore,observedLead,bothFeetAtStart,ascentValid,topPhaseValid,bothFeetReturnedToFloor,trackingValid,evidenceOutcome,stateOutcome,credited,sfxPlayed,expectedLeadAfter,acceptedRepCount,leftLeadRepCount,rightLeadRepCount,setCompleted,setResultEmitted,progressionConsumed,serialized,restored,seedBefore,seedAfter,notes
```

## Trace CSV columns

Use the existing addendum trace schema and all 16 link ids.

---

# 27. Findings and severity

At minimum define:

## P1

Any nonzero:

- wrong-lead live credit,
- unknown-lead live credit,
- rep accepted before floor return,
- duplicate live credit,
- stale live mutation,
- generic and alternation double credit,
- SetResult duplication,
- progression acceptance of invalid alternation,
- restore partial-rep credit,
- mixed legacy/internal ownership.

## P2

- any missing/partial/legacy/uncertain runtime integration link,
- backend metadata loss,
- screen/runtime path connected only in tests but not current source,
- evidence adapter cannot distinguish lead/floor conservatively,
- seed mutation path remains helper-only,
- an important integration scenario is statically indeterminate.

## P3

- physical-device pose reliability deferred,
- human listening waived,
- final phone-speaker/audio timing deferred.

Severity counts derive from findings.

---

# 28. Primary verdicts

Issue exactly one.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_DEFAULT_CLOSED`

Use only when:

- all original 53 scenarios remain,
- all required integration scenarios are present,
- all completion gates pass,
- every relevant trace link is `connected_verified`,
- only device/listening P3 findings remain,
- feature remains default off.

Next task:

```text
Training floor-transfer readiness gate implementation
```

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING`

Use only if software integration is complete and the only distinction from the prior verdict is explicitly deferred physical validation.

The floor gate may proceed because device QA is intentionally deferred for the whole project.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED`

Use when one or more software/runtime gates fail.

Next task:

```text
Fix the exact step-up runtime findings
```

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when current source drift prevents safe integration.

---

# 29. Completion gates

A complete verdict requires:

## Integration trace

- connected verified links: all applicable links
- model-only missing links: `0`
- partial links: `0`
- legacy-only blocking links: `0`
- uncertain links: `0`

## Live evidence

- wrong-lead live credits: `0`
- unknown-lead live credits: `0`
- credits before floor return: `0`
- duplicate credits: `0`
- stale mutations: `0`
- generic/alternation double credits: `0`
- threshold-noise extra credits: `0`

## Runtime

- alternation state-machine dispatch missing: `0`
- accepted-rep SFX mismatch: `0`
- SetResult missing: `0`
- duplicate SetResult: `0`
- session completion duplicates: `0`

## Progression

- invalid alternation accepted: `0`
- side imbalance masked: `0`
- extra set events: `0`
- valid time doubled: `0`

## Persistence

- local round-trip failure: `0`
- restore partial-rep credit: `0`
- expected-lead restore drift: `0`
- plan-fingerprint drift: `0`
- backend generated-plan loss: `0`
- backend active-state loss: `0`
- backend seed drift: `0`
- richer metadata lost: `0`

## Seed/manual

- successful main-plan seed flip failure: `0`
- duplicate flip: `0`
- skip/cancel flip: `0`
- manual seed mutation: `0`
- Explore seed mutation: `0`

## Voice/defaults

- live voice-context mismatch: `0`
- per-rep spoken switch: `0`
- spoken set-count setup cue: `0`
- physical manifest change: `0`
- Training Voice V2.1 feature remains off
- Training Voice V2.1 audio ready remains false
- Training Voice V2.1 global behaviour ready remains false
- Balance V2 remains default closed/audio pending
- step-up feature remains default off

## Integrity

- no audio changed,
- no audio generated,
- no external speech/audio API called,
- existing tests pass,
- human listening remains waived,
- physical QA remains deferred.

---

# 30. Implementation report structure

Use:

# Hale Training Step-Up Runtime Integration Implementation

## 1. Result

## 2. Blocking Findings Addressed

Map:

- F-STEPUP-RUNTIME-INTEGRATION
- F-STEPUP-POSE-EVIDENCE-ADAPTER
- F-STEPUP-BACKEND-SYNC

to exact code and tests.

## 3. Runtime Selection and Ownership

## 4. Live Pose Evidence Adapter

## 5. Lead-Leg and Floor-Boundary Semantics

## 6. Evidence-to-State Dispatch

## 7. Rep-Credit SFX Authority

## 8. Live SetResult and Progression

## 9. Pause, Background, and Restore

## 10. Backend Sync and Restore

## 11. Main-Plan Seed and Manual Isolation

## 12. Training Voice V2.1 Context

## 13. Feature Flags and Legacy Isolation

## 14. Diagnostics

## 15. Tests

## 16. Runtime-Derived Audit

## 17. Remaining Device-Only Risks

## 18. Files Changed

## 19. Worktree Integrity

## 20. Exact Next Task

---

# 31. Handoff behavior

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md`

## If integration completes

Exact next task:

```text
Training floor-transfer readiness gate implementation
```

Include:

- runtime selector API,
- runtime owner API,
- pose-evidence adapter API,
- live SetResult path,
- progression path,
- persistence/backend fields,
- seed integration,
- feature/default state,
- tests to preserve.

## If remediation remains

Exact next task must name the failing finding ids.

Do not automatically advance to the floor gate.

---

# 32. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run focused suites for:

- step-up evidence adapter,
- runtime controller,
- session-player integration,
- TrainingSessionScreen integration,
- SetResult/progression,
- local serialization/restore,
- backend sync/restore,
- shared side seed,
- manual/Explore isolation,
- Training Voice V2.1 context,
- original 53 addendum scenarios.

Run:

- both-sides regression suites,
- Training Voice V2.1 suites,
- training session/player suites,
- workout-generation suites,
- progression/valid-time suites,
- MPV2 suites,
- measurement-side suites,
- Balance V2 audit,
- full Jest suite.

Run the new audit harness.

Parse all generated JSON/CSV files.

Independently recompute metrics from written CSVs.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

Do not modify tests merely to make them pass.

Existing Watchman/open-handle warnings may be reported if commands exit successfully.

---

# 33. Final Codex response

When finished, respond with:

- paths to all seven generated artifacts,
- audit harness path,
- all production files changed/added,
- all test files changed/added,
- confirmation that no audio changed or was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether the worktree was already dirty,
- original 53 scenario coverage,
- added integration scenario count,
- total scenario/variant count,
- event-evidence row count,
- all 16 runtime-link statuses,
- missing/partial/legacy/uncertain link counts,
- runtime selection rule,
- pose-evidence rule,
- lead-candidate rule,
- floor-boundary rule,
- generic rep suppression rule,
- SFX authority,
- live SetResult path,
- progression path,
- local restore behavior,
- backend metadata fields added,
- seed-flip integration,
- manual/Explore isolation behavior,
- wrong-lead live credit count,
- unknown-lead live credit count,
- pre-floor-return credit count,
- duplicate/stale credit count,
- generic/alternation double-credit count,
- SetResult duplication count,
- invalid progression acceptance count,
- local/backend round-trip failure counts,
- seed mutation failure counts,
- voice-context mismatch count,
- P0/P1/P2/P3 counts,
- primary verdict,
- whether the floor-transfer phase is unblocked,
- exact next task,
- `npm run verify:audio` result,
- typecheck result,
- focused and full Jest results,
- independent metric recomputation result,
- concise confidence statement.

Do not implement the floor-transfer gate, generate audio, enable Training Voice V2.1, enable Balance V2, or perform physical-device QA in this task.
