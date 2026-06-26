# Codex Prompt: Hale Micro-Check Voice V2.1 End-to-End Implementation

Read this entire prompt before changing anything.

Hale’s Training Voice V2.1 behaviour layer is now software-complete.

Current reported state:

```text
Training Voice V2.1 controls ready:
true

Training Voice V2.1 progress ready:
true

Training Voice V2.1 recovery ready:
true

Training Voice V2.1 safety ready:
true

Training Voice V2.1 global behaviour ready:
true

Training Voice V2.1 audio ready:
false

Training Voice V2.1 feature:
default off

Training Voice V2.1 selectable exercises:
0

IR-VOICE-TRAINING-CONTROLS remaining:
0

IR-VOICE-TRAINING-RECOVERY remaining:
0

Balance V2:
default closed / audio pending

Step-up alternation:
default off

Floor V2.1:
default off

Human listening:
waived, not completed

Physical-device QA:
deferred
```

The exact next phase is:

```text
Micro-Check Voice V2.1 implementation
```

This task must implement the complete default-closed software/runtime contract for all three current Hale micro-check types:

1. `chair-power`
2. `single-leg-balance`
3. `mobility-reach`

It must integrate with the completed:

- micro-check side-selection UX,
- measurement protocol and comparability metadata,
- official/micro side-anchor policy,
- tracked voice runtime,
- audible-go contract,
- pause/resume/retry/discard controls,
- tracking recovery,
- mounted Clara/Marcus switching,
- local/backend result persistence,
- and current weekly micro-check planning.

It must not generate audio.

It must not begin the final cue-schema/physical-manifest phase.

---

# 1. Mandatory entry baseline

Before changing production code, run and record:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run the current relevant audit/test baselines:

- Training Voice V2.1 controls/progress/recovery audit
- Training Voice V2.1 live-safety audit
- measurement-side post-UX audit
- Eyes-Open Balance V2 audit
- focused current micro-check tests
- focused micro-check side-setup tests

Run the full Jest suite if practical before edits or at least record the latest current full-suite baseline.

## Entry rule

If a relevant current failure exists in:

- micro-check behavior,
- side metadata,
- tracked voice,
- training voice shared runtime helpers,
- audio verification,
- or typecheck,

do not layer this implementation over an unresolved relevant defect.

Return:

- `CURRENT_SOURCE_REBASE_REQUIRED`, or
- `MICRO_CHECK_VOICE_V2_1_REMEDIATION_REQUIRED`

with exact evidence.

An unrelated pre-existing failure may be documented and left untouched.

---

# 2. Required source artifacts

Read and use current source plus these reports/specifications.

## Latest Training Voice V2.1 handoff

- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json`
- `docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`
- current source under `src/training/voiceV21/`

Current reusable APIs include, or have repository-equivalent names:

```text
TrainingVoiceRuntimeV21
TrainingVoicePhaseV21
TrainingVoiceRuntimeEventV21
startCountdown()
notifyCountdownGoPlaybackStarted()
listTrainingVoiceControlContractsV21()
resolveTrainingVoiceProgressPlanV21()
planTrainingVoiceTransitionV21()
createTrainingVoiceRecoveryEpisodeV21()
listTrainingVoiceReactiveSafetyContractsV21()
VoiceChannel.speakTracked(...)
```

Reuse shared tracked-playback primitives where appropriate.

Do not make the micro-check runtime depend on exercise-specific training contracts.

## Measurement-side foundation

- `docs/audits/HALE_MEASUREMENT_SIDE_UX_COMPLETION_IMPLEMENTATION.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.json`
- `docs/audits/HALE_MEASUREMENT_SIDE_UX_SCENARIOS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_SIDE_UX_HANDOFF.md`

Current APIs include:

```text
deriveMicroCheckSideSetup(...)
createMicroCheckMeasurementContextForSide(...)
oppositeMicroCheckSide(...)

normalizeMicroCheckMeasurementMetadata(...)
descriptorForMicroCheck(...)
measurementSeriesKey(...)
comparableMeasurementSeriesKey(...)
deriveMeasurementComparability(...)
findOfficialMeasurementAnchor(...)
deriveOfficialMeasurementSide(...)
```

Preserve the completed side UX and comparability behavior.

## Eyes-Open Balance V2

- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.md`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json`

Balance micro-check side recommendation currently prefers a valid new Balance V2 standing-leg anchor where present, then the old MPV2 standing-leg anchor.

The micro-check result still starts or continues its own micro-check series.

## Approved Voice V2.1 specification

Read:

- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`

The approved V2.1 micro-check scripts are specified below.

## Current voice inventory/runtime audit

Read:

- current voice cue inventory
- current voice runtime timeline audit
- current current-state reconciliation
- current audio asset inventory

Known current legacy gaps to verify:

- generic micro-check intro is bundled but not used;
- current flow uses type-specific old cues;
- active begins on the same controller transition that emits `go`;
- single-leg voice does not currently state the selected leg;
- mobility voice does not currently state the selected extended leg;
- skip is not relevant; discard is visible/silent;
- pause/resume and tracking recovery are not voice-complete;
- current completion copy contains “logged” language;
- micro-check-specific V2.1 assets are not physically present.

## Review and QA status

Use:

```text
Micro-Check V2.1 scripts:
founder_assumed_accepted_for_implementation

Human audio listening:
waived, not completed

Audio approval:
not granted

Physical-device QA:
deferred
```

Do not claim human audio approval.

---

# 3. Approved logical cue contract

Use these exact scripts unless the current approved V2.1 artifacts contain a clearly later approved revision.

## Chair power

```text
micro-chair-power-v21

Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.
```

## Single-leg balance

```text
micro-single-leg-left-v21

Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable.
```

```text
micro-single-leg-right-v21

Quick balance check. Stand on your right leg with support nearby. Hold as long as comfortable.
```

## Mobility reach

```text
micro-mobility-left-v21

Quick mobility check. Extend your left leg and reach gently until I say relax.
```

```text
micro-mobility-right-v21

Quick mobility check. Extend your right leg and reach gently until I say relax.
```

## Final position

```text
final-position-set-v21

You're set.
```

## Countdown and active start

```text
countdown-three
Three.

countdown-two
Two.

countdown-one
One.

go
Go!
```

## Active stop

```text
times-up-v21
Time.
```

For mobility reach, the setup script promises a “relax” instruction.

Independently inspect the current logical cue surface.

If no exact generic whole-body/leg-appropriate cue exists, add a **logical pending** cue:

```text
micro-relax-v21

Relax.
```

Do not reuse `relax-arm-v21` for a leg reach.

Do not add `micro-relax-v21` to the physical runtime manifest without real Clara and Marcus files.

## Controls and recovery

```text
paused-v21
Paused.

resuming-v21
Resuming.

retry-v21
Let's try that again.

micro-discard-v21
Check discarded.

tracking-loss-v21
Pause. Return to the setup position.

tracking-recovered-v21
You're back in position. We'll restart.
```

## Completion

```text
microcheck-complete-v21

Check complete.
```

## Retired/default-absent cue

```text
microcheck-intro
```

must not be emitted by the V2.1 path.

Type-specific instructions already provide the context.

---

# 4. Objective

Implement one canonical Micro-Check Voice V2.1 software/runtime path that guarantees:

1. Every current micro-check type has one exact immutable V2.1 contract.
2. Chair power remains side-independent.
3. Single-leg balance uses the pinned standing leg.
4. Mobility reach uses the pinned extended leg.
5. The exact spoken side matches:
   - side-selection UI,
   - `MeasurementContext`,
   - runner/controller side,
   - visible setup copy,
   - persisted result metadata.
6. No side-dependent runner is created before a side is pinned.
7. No side can change during setup, countdown, active work, pause, retry, recovery, or restore.
8. An existing same-protocol micro-check anchor is preferred.
9. Balance may use a compatible official standing-leg anchor as an initial recommendation.
10. Mobility does not borrow shoulder, hinge, balance, or unrelated official side metadata.
11. First valid side-known result establishes its own micro-check series.
12. An invalid, interrupted, cancelled, or discarded attempt does not establish a series.
13. Opposite-side micro checks remain separate/reduced-comparability and do not overwrite the usual side anchor.
14. No current official anchor is overwritten by a micro check.
15. The generic `microcheck-intro` cue is absent.
16. Type-specific instruction is required.
17. Exact instruction completes before final-position readiness can complete.
18. Final-position confirmation occurs only after the actual movement start position is established.
19. General camera framing alone is not final-position readiness.
20. A fragile new pose classifier is not invented merely to automate readiness.
21. Where current pose evidence is insufficient, explicit user confirmation plus stable current movement visibility/readiness is used.
22. Countdown is:
    - Three
    - Two
    - One
    - Go
23. Active measurement starts from the `go` playback-start event.
24. Active does not start from:
    - `speak()` dispatch,
    - countdown scheduling,
    - `go` completion,
    - or a blind delay.
25. Missing/failing `go` blocks active start.
26. Every active attempt has one stable scope/epoch/attempt id.
27. Old callbacks cannot affect a new attempt or result.
28. Pause, tracking loss, app background, and retry do not continue a partial measurement as though it were uninterrupted.
29. A restarted measurement uses:
    - fresh setup,
    - fresh final-position readiness,
    - fresh countdown,
    - fresh attempt id.
30. Selected side is preserved during restart.
31. Partial rep/time/ROM evidence is not credited twice.
32. Chair accepted reps use rep-credit SFX only.
33. No spoken rep-by-rep chair count is added.
34. Single-leg balance does not use unsupported progress prompts.
35. Mobility reach does not use active progress prompts.
36. Optional progress is not invented for unsupported durations.
37. Active-window stop happens at the canonical controller boundary.
38. Stop speech confirms the accepted stop; speech does not cause the measurement to stop.
39. Mobility’s promised `Relax.` instruction is represented truthfully.
40. Valid result persistence happens before `microcheck-complete-v21`.
41. Completion cue failure does not roll back a valid persisted result.
42. Invalid/no-measurement result does not speak “Check complete.”
43. Invalid/no-measurement state exposes current truthful Retry/Discard controls.
44. Discard is controller-first.
45. Discard creates no result and no progression/trend evidence.
46. `micro-discard-v21` confirms the accepted discard.
47. Cancel/unmount remains a silent state exit unless current approved source proves otherwise.
48. Pause is controller-first and confirmation-only.
49. Resume never jumps directly into active work.
50. Resume returns through setup/final position and a fresh countdown.
51. Repeat Instructions replays:
    - exact type-specific instruction,
    - pinned side where applicable.
52. Repeat Instructions does not:
    - change side,
    - create a result,
    - start countdown,
    - repeat generic intro,
    - or claim completion.
53. Retry creates one fresh measurement attempt.
54. Rapid Retry/Discard/Pause/Resume taps are programmatically deduplicated.
55. Confirmed active tracking loss creates one recovery episode.
56. Repeated loss in the same episode is deduplicated.
57. Tracking loss during ordinary setup uses setup/readiness prompts rather than a false active-loss episode.
58. Tracking recovery preserves the selected type and side.
59. Tracking recovery requires stable current readiness plus a fresh full countdown.
60. A recovered cue never starts active work by itself.
61. Mounted Clara/Marcus switching cannot mix voices within one required sequence.
62. Voice change during countdown restarts at Three.
63. Voice change during active measurement is deferred to a safe boundary.
64. Voice change during setup/paused/recovery state replays the complete current required sequence where needed.
65. Restore/background never auto-starts an active attempt.
66. In-flight speech is not restored as completed.
67. Completed results do not duplicate after restore.
68. Current weekly type selection remains:
    - strength focus -> chair power,
    - balance focus -> single-leg balance,
    - mobility focus -> mobility reach,
    unless current source proves another mapping.
69. The selected micro-check type is pinned for the launched flow.
70. Current scheduling/cadence/product eligibility is not changed by voice work.
71. Existing local/backend completed-result sync/restore remains intact.
72. No raw video or landmarks are persisted by the voice runtime.
73. Current comparison/history suppression remains intact.
74. No direct trend claim bridges incompatible protocol versions.
75. Any protocol-affecting measurement change is versioned or explicitly proven non-protocol-affecting.
76. Legacy micro-check history remains readable.
77. Legacy live micro-check behavior remains unchanged with V2.1 off.
78. Legacy and V2.1 voice never speak in the same micro-check flow.
79. The V2.1 path fails closed when required audio is missing.
80. Physical pending logical cues do not enter the physical manifest.
81. Micro-Check V2.1 behavior readiness becomes true after genuine completion.
82. Micro-Check V2.1 audio readiness remains false.
83. Micro-Check V2.1 feature remains default off.
84. V2.1 selectable micro-check type count remains zero.
85. Training Voice V2.1 behavior readiness remains true.
86. Training Voice V2.1 feature remains off.
87. Balance V2 remains default closed/audio pending.
88. Step-up alternation remains default off.
89. Floor V2.1 remains default off.
90. No audio is generated or changed.
91. Exact next phase becomes:
    - Final Voice V2.1 cue schema and physical manifest reconciliation.

---

# 5. Strict scope

## In scope

- Current micro-check runtime reconciliation.
- Three exact V2.1 micro-check contracts.
- Type-specific side-aware instruction planning.
- Logical asset requirements.
- Final-position readiness.
- Tracked required setup speech.
- Audible countdown/go.
- Active-start gating.
- Chair rep-credit SFX.
- End/stop planning.
- Pause/resume.
- Repeat Instructions.
- Retry.
- Discard.
- Cancel/state exit.
- Tracking loss/recovery.
- Mounted voice switching.
- Result completion/persistence ordering.
- Protocol/comparability compatibility assessment.
- Local/backend completed-result round trips.
- Safe active-flow restore/background semantics.
- Default-off runtime selection.
- UI needed for truthful internal behavior.
- Accessibility.
- Tests.
- Post-implementation audit.
- Handoff to final schema/manifests.

## Out of scope

Do not implement:

- final cue-schema migration,
- final physical voice manifests,
- audio generation,
- ElevenLabs calls,
- runtime TTS,
- human listening review,
- physical-device QA,
- enabling Micro-Check Voice V2.1,
- enabling Training Voice V2.1,
- enabling Balance V2,
- enabling step-up alternation,
- enabling floor V2.1,
- new micro-check types,
- new micro-check scheduling,
- changes to weekly cadence,
- changes to block focus selection,
- changes to scoring/trend thresholds,
- changes to progression or plan rewrite behavior,
- medical claims,
- broad UI redesign,
- package installation,
- lockfile changes,
- destructive Git operations.

Do not use this phase to opportunistically refactor all check-up or training voice code.

---

# 6. Worktree safety

The repository is heavily dirty and contains important user-owned work.

Before editing, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- whether the worktree was already dirty,
- pre-existing relevant diffs,
- pre-existing untracked audio/audit files.

Rules:

1. Do not reset, checkout, stash, clean, rebase, or discard anything.
2. Do not delete or rename existing audio.
3. Do not overwrite unrelated renderer, check-up, profile, website, backend, or audit work.
4. Do not regenerate physical manifests wholesale.
5. Do not commit or push.
6. Inspect current diffs before modifying a dirty file.
7. Make the smallest safe changes.
8. At completion, distinguish this task’s footprint from pre-existing changes.

---

# 7. Current source to inspect

Follow current imports and actual runtime paths.

## Micro-check runtime

At minimum inspect:

- `src/training/microCheck.ts`
- `src/screens/MicroCheckScreen.tsx`
- `src/haleFlow/microCheck.ts`
- current micro-check types
- current runner/controller phases
- current frame/update path
- current countdown
- current active clocks
- current grader construction
- current completion/result construction
- current pause/resume/retry/discard/cancel paths
- current app-state/background handling
- current voice selection handling
- current result persistence call path

## Side setup and metadata

- `src/training/microCheckSideSetup.ts`
- `src/checkup/measurementContext.ts`
- `src/checkup/measurementMetadata.ts`
- `src/checkup/measurementComparability.ts`
- `src/checkup/measurementProtocolRegistry.ts`
- micro-check history/trend selectors
- progress/report surfaces

## Micro-check graders

Inspect exact current graders and evidence for:

- chair power
- single-leg balance
- mobility reach

Likely relevant:

- `src/exercises/setGraders.ts`
- chair rep grader
- balance hold grader
- `RomSetGrader`
- lower-body side chain helpers
- movement-specific readiness
- preflight helpers
- body-unit/smoothing/timestamp conventions

## Shared tracked voice

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- SFX channel
- current training V2.1 runtime
- current MPV2 runtime
- tracked playback start/completion/cancellation
- voice-generation/channel ids

## Screen and app plumbing

- `App.tsx`
- micro-check route creation
- active movement block focus selection
- `SafePoseDetectionView`
- profile voice preference
- current camera readiness gate

## Persistence/backend

- micro-check local serializer
- `src/services/backend/microCheckSyncService.ts`
- `src/services/backend/restoreService.ts`
- account export/restore
- duplicate/richer metadata merge
- training state if active micro-check draft state is represented

## Tests

Inspect:

- current `microCheck.test.ts`
- `MicroCheckScreen` tests
- side-setup tests
- backend micro-check sync/restore tests
- history/comparability tests
- VoiceChannel tests

Search broadly for:

```text
MicroCheckRunner
chair-power
single-leg-balance
mobility-reach
microcheck-chair
microcheck-balance
microcheck-complete
microcheck-intro
pause
resume
retry
discard
cancel
countdown
go
tracking
measurementContext
selectedSide
observedSide
standing_leg
extended_leg
hard cap
target
activeElapsed
RomSetGrader
repCredited
playRepSound
```

---

# 8. Architecture boundary

Do not bolt voice behavior onto `MicroCheckScreen` through unrelated React effects.

Create or extend one explicit Micro-Check V2.1 runtime/controller adapter.

A suitable conceptual structure is:

```text
Current micro-check controller/runner
              |
              +-- legacy voice path
              |
              +-- MicroCheckVoiceRuntimeV21
                    - contract
                    - sequence planner
                    - tracked speech
                    - countdown/go gate
                    - controls
                    - recovery
                    - completion
                    - stale guards
```

A suitable file layout is:

```text
src/training/microCheckVoiceV21/
  types.ts
  contracts.ts
  sequencePlanner.ts
  runtime.ts
  readiness.ts
  assets.ts
  protocolCompatibility.ts
  index.ts
```

Use fewer files if repository style prefers it.

## Authority rule

The canonical micro-check runner/controller remains authoritative for:

- active type,
- accepted rep/time/ROM evidence,
- result validity,
- result values,
- completion,
- discard,
- persistence.

The voice runtime owns:

- logical instruction selection,
- tracked speech,
- countdown/go gating,
- control/recovery narration,
- voice scope/epoch cancellation,
- audio failure state,
- completion narration.

Voice must not invent measurement results.

---

# 9. Canonical contract types

Use strict immutable types.

A suitable conceptual model is:

```ts
export type MicroCheckTypeV21 =
  | 'chair-power'
  | 'single-leg-balance'
  | 'mobility-reach';

export type MicroCheckSideRoleV21 =
  | 'not_applicable'
  | 'standing_leg'
  | 'extended_leg';

export type MicroCheckEndPolicyV21 =
  | 'accepted_rep_target_or_cap'
  | 'hold_end_or_cap'
  | 'fixed_rom_window';

export interface MicroCheckVoiceContractV21 {
  type: MicroCheckTypeV21;

  protocolId: string;
  protocolVersion: number;
  comparisonGroup: string;

  sideRole: MicroCheckSideRoleV21;
  sideRequired: boolean;

  setupCueKey:
    | 'micro-chair-power-v21'
    | 'micro-single-leg-left-v21'
    | 'micro-single-leg-right-v21'
    | 'micro-mobility-left-v21'
    | 'micro-mobility-right-v21';

  exactScript: string;
  finalPositionRequired: true;

  endPolicy: MicroCheckEndPolicyV21;
  targetDescription: string;
  hardCapMs: number | null;

  repSfxOnly: boolean;
  progressCueKeys: readonly string[];

  stopCueKey: string | null;
  completionCueKey: 'microcheck-complete-v21';

  requiredness: {
    setup: 'required';
    finalPosition: 'required';
    countdown: 'required';
    completion: 'result_transition';
  };

  implementationRequirements: readonly string[];
}
```

Equivalent naming is acceptable.

Requirements:

- exactly three current contracts,
- no stale extra contract,
- no broad generic micro instruction,
- no placeholder side,
- no `any`,
- no runtime import from `docs/`,
- stable logical keys,
- logical keys separate from physical asset ids.

---

# 10. Protocol compatibility and versioning

This phase changes the timing/control contract.

Do not silently assume old and new results are identical protocols.

For each micro-check type, determine whether the V2.1 runtime changes any measurement-defining behavior, including:

- active start timestamp,
- target/cap boundary,
- interruption invalidation,
- side semantics,
- final-position prerequisites,
- result acceptance.

Classify each type as:

```text
same_protocol_non_measurement_voice_change
same_protocol_bugfix_no_metric_effect
new_protocol_version_required
new_protocol_id_required
```

## Conservative rule

If a change can materially alter the stored metric or comparability:

- register a new protocol version/id,
- preserve old history,
- start a new comparison series,
- do not bridge direct deltas.

Voice copy alone does not require versioning.

Audible-go alignment or restart-on-interruption may require versioning if current stored metrics previously used materially different timing.

## Required output

Create a protocol compatibility matrix with:

- old id/version,
- new id/version,
- timing semantics,
- side semantics,
- interruption semantics,
- result semantics,
- direct comparison allowed,
- migration behavior,
- reason.

Do not rewrite old results.

A previous-protocol side may still be used as a **recommendation** when product semantics permit, without making the metrics directly comparable.

If protocol impact cannot be resolved from source:

- do not guess;
- return `CURRENT_SOURCE_REBASE_REQUIRED` or a P2 compatibility finding.

---

# 11. Side resolution and voice alignment

Use the completed side setup.

## Chair power

- side-independent;
- no side selector;
- no left/right script;
- no official side claim;
- observed pose side remains diagnostic only under current source semantics;
- no side-specific series split.

## Single-leg balance

Resolution order remains:

1. existing valid same-protocol micro-check series anchor;
2. compatible official standing-leg recommendation;
3. explicit left/right choice.

Voice:

```text
left -> micro-single-leg-left-v21
right -> micro-single-leg-right-v21
```

## Mobility reach

Resolution order:

1. existing valid same-protocol mobility micro-check anchor;
2. explicit left/right choice.

Do not borrow an official shoulder, hinge, balance, or other side.

Voice:

```text
left -> micro-mobility-left-v21
right -> micro-mobility-right-v21
```

## Pinning

Pin:

- type,
- selected side,
- side source,
- anchor side/id,
- protocol,
- comparability,
- attempt id

before activating the camera runner.

No side change exists after runner creation.

## Observed side

Do not fabricate independent camera side classification.

Preserve the current completed metadata contract.

If current normalization stores `observedSide = selectedSide` because the selected-side instruction defines the attempted side, document that it is not an independent camera verification.

Do not claim camera-confirmed side unless current source proves it.

---

# 12. Setup and final-position readiness

The intended sequence is:

```text
side selection if required
→ camera/preflight readiness
→ exact type/side instruction
→ actual movement start position
→ final-position readiness
→ countdown
→ active
```

## General framing is not final position

A standing/framing-ready cue does not prove:

- the user is seated correctly for chair power,
- the selected standing leg is lifted for balance,
- the selected leg is extended for mobility.

## Chair power

Verify the current reliable setup evidence.

Required setup truth includes:

- correct chair context,
- required body visibility/orientation,
- seated start position where current source can reliably establish it,
- arms crossed only if current source can verify it.

Do not invent an unreliable arms-crossed classifier.

If exact arms-crossed/start-position verification is not reliable:

- use explicit `I'm ready`,
- require current camera readiness/visibility,
- then emit `final-position-set-v21`.

## Single-leg balance

Require:

- selected standing-leg context,
- required full-body/feet visibility,
- current orientation,
- stable readiness,
- current selected-leg setup evidence where reliable.

If exact one-leg stance verification is not reliable enough before start:

- use explicit confirmation,
- keep the selected side visible,
- require current camera readiness,
- do not guess from the clearer side chain.

## Mobility reach

Require:

- seated/current setup truth,
- selected extended-leg context,
- required side-view/landmark visibility,
- stable readiness.

Do not invent a fragile exact seated-leg-extension classifier.

Use explicit confirmation plus current readiness where needed.

## Final-position cue

`final-position-set-v21` may complete only after actual readiness.

It is required before countdown.

Rapid ready taps must be deduplicated.

A stale ready callback cannot start another attempt.

---

# 13. Runtime phases and scopes

Create an explicit state model.

A suitable phase union is:

```ts
export type MicroCheckVoicePhaseV21 =
  | 'side_setup'
  | 'preflight'
  | 'instruction'
  | 'final_position'
  | 'countdown'
  | 'active'
  | 'paused'
  | 'tracking_recovery'
  | 'invalid_result'
  | 'completion'
  | 'discarded'
  | 'audio_failure'
  | 'cancelled';
```

State should include:

- flow id,
- type,
- protocol id/version,
- selected side,
- measurement context,
- flow epoch,
- setup epoch,
- attempt id/epoch,
- recovery id,
- active start timestamp,
- completion id,
- active voice id,
- pending voice id,
- required speech scope,
- result-persisted flag.

Suggested scopes:

```text
micro:<flowId>:setup
micro:<flowId>:attempt:<attemptId>:countdown
micro:<flowId>:attempt:<attemptId>:active
micro:<flowId>:control:<controlId>
micro:<flowId>:recovery:<recoveryId>
micro:<flowId>:completion:<completionId>
```

Requirements:

- one current required scope,
- stale callback rejection,
- one active attempt,
- one completion,
- one discard,
- one recovery episode.

---

# 14. Sequence planner

Create a pure deterministic planner.

A suitable API is:

```ts
planMicroCheckVoiceSequenceV21({
  type,
  selectedSide,
  exposure,
  phase,
  measurementContext,
  readiness,
}): MicroCheckVoiceSequencePlanV21
```

Exposure types:

```text
first_setup
repeat_instructions
resume_setup
retry_setup
recovery_setup
completion
discard
```

## First setup

Plan:

1. exact type/side instruction
2. final-position cue after readiness
3. countdown

Do not include:

- generic microcheck intro,
- result/trend claim,
- set count,
- universal training safety,
- unrelated equipment-family safety.

## Repeat Instructions

Plan:

- exact current instruction,
- current pinned side.

Do not include:

- final completion,
- generic intro,
- countdown,
- side selection prompt,
- current result,
- comparability claim.

After Repeat Instructions, re-evaluate final-position readiness.

## Retry/recovery setup

Use the same exact current instruction and side.

Do not use a generic broad cue.

---

# 15. Audible countdown and active start

Use shared tracked countdown principles.

## Sequence

```text
Three.
Two.
One.
Go!
```

## Active start

Dispatch one explicit controller action from the `go` playback-start callback, for example:

```text
micro_check_go_playback_started
```

Include:

- flow id,
- type,
- attempt id,
- scope id,
- playback request id,
- voice generation id,
- monotonic timestamp.

## Prohibited starts

Do not start active from:

- cue dispatch,
- countdown state entry,
- `go` completion,
- a fixed three-second timer,
- or a guessed audio delay.

## Failure

If required setup/countdown/go:

- is missing,
- cannot resolve,
- fails player creation,
- fails playback start,
- times out,
- is cancelled unexpectedly,
- or becomes stale,

then:

- active does not start,
- result cannot complete,
- visible audio failure state appears,
- Retry and Discard/Exit remain available.

## Voice switch

During countdown:

- cancel old countdown,
- invalidate old `go`,
- restart at Three in the new voice.

Physical speaker onset remains deferred device QA.

---

# 16. Chair-power runtime contract

Independently verify the current live source.

Expected current intent:

```text
five accepted chair stands
or current hard cap, expected around 45 seconds
```

Do not change the prescription or metric.

## Required behavior

- side-independent;
- exact chair instruction;
- final-position readiness;
- active starts at `go` playback start;
- accepted reps use the current canonical rep grader;
- one rep-credit SFX per accepted rep;
- no spoken count;
- no halfway/five-left voice progress;
- fifth accepted rep ends the measurement according to current controller semantics;
- current hard cap ends the attempt safely;
- current valid/invalid result semantics are preserved;
- rejected/stale/duplicate reps receive no SFX;
- pause/tracking loss invalidates the current measurement attempt;
- restart begins from zero unless current source proves an interruption-safe protocol;
- previously interrupted partial reps are not retained as one continuous five-rep test.

## Hard-cap outcome

Verify whether a partial nonzero rep result at the cap is currently valid, invalid, or incomplete.

Preserve the current intended result contract.

Do not invent a result classification.

## Completion

- no result value is spoken;
- valid result persists;
- then `microcheck-complete-v21`.

If the hard cap produces no valid measurement:

- do not say complete;
- show Retry/Discard.

---

# 17. Single-leg balance runtime contract

Independently verify current:

- target,
- hard cap,
- end conditions,
- result acceptance.

Prior audit expected:

```text
40-second target
45-second hard cap
```

Use current source as truth.

## Required behavior

- selected standing leg pinned;
- exact left/right instruction;
- support nearby;
- final-position readiness;
- active starts at `go` playback start;
- hold result uses current canonical grader;
- early stance loss/touchdown/user stop follows current valid-result policy;
- hard/target cap ends at canonical boundary;
- no unsupported spoken progress;
- use `times-up-v21` only at a true timed cap/end boundary;
- no progress cue is invented for 40/45 seconds unless an approved current contract explicitly defines one;
- tracking loss/pause invalidates the current attempt;
- recovery retries the same selected leg;
- no side change;
- no partial hold time carries into the restarted attempt.

## Result

First valid result establishes the side/protocol micro-check series.

Opposite-side result remains separate/reduced.

No direct comparison to official Balance V2 or old MPV2 metrics.

---

# 18. Mobility-reach runtime contract

Independently verify current:

- active window, expected around 12 seconds from prior runtime evidence,
- result acceptance,
- required orientation/landmarks,
- ROM metric.

## Required behavior

- selected extended leg pinned;
- exact left/right instruction;
- final-position readiness;
- active starts at `go` playback start;
- current ROM evidence remains canonical;
- no active progress cue;
- no spoken countdown of remaining time;
- partial tracking/pause/interruption invalidates the current attempt;
- recovery retries the same selected extended leg;
- no partial ROM window resumes.

## End cue

The setup promises:

```text
until I say relax
```

At the canonical active-window end:

- stop measurement immediately;
- play the exact appropriate stop cue.

Preferred:

```text
micro-relax-v21
Relax.
```

if no exact current generic cue exists.

Do not use:

```text
relax-arm-v21
```

for a leg reach.

Do not let active measurement continue while the stop cue plays.

After valid result persistence:

```text
microcheck-complete-v21
```

No result value is spoken.

---

# 19. Control behavior

Use current approved shared control scripts where semantically appropriate.

## Pause

```text
paused-v21
Paused.
```

Rules:

- controller enters paused/restart-required state first;
- active measurement attempt becomes invalid/interrupted;
- speech confirms;
- no active clock continues;
- no result persists;
- duplicate pause is ignored.

## Resume

```text
resuming-v21
Resuming.
```

Rules:

- resume only from paused;
- preserve type and pinned side;
- do not resume partial measurement;
- return to setup/final position;
- fresh countdown;
- duplicate resume is ignored.

## Repeat Instructions

- allowed in setup/paused/audio-failure states;
- not available during active work unless controller first leaves active safely;
- replays exact type/side instruction;
- does not change side;
- does not start countdown;
- remains paused if invoked while paused.

## Retry

```text
retry-v21
Let's try that again.
```

Rules:

- accepted Retry creates one new attempt;
- retry cue is optional transition confirmation;
- exact setup/final-position/countdown remain required;
- rapid taps deduplicate;
- selected side remains;
- current invalid/partial evidence is discarded;
- stale callbacks are ignored.

## Discard

```text
micro-discard-v21
Check discarded.
```

Rules:

- controller discards first;
- no valid result is created;
- no series/anchor is established;
- no trend/progression credit;
- confirmation plays once;
- missing asset uses visible confirmation;
- after accepted discard, stale completion cannot persist a result.

## Cancel/unmount

- silent state exit;
- cancel all voice scopes;
- invalidate callbacks;
- no result;
- no completion cue.

Do not use training skip or check-up skip for a micro check.

---

# 20. Tracking loss and recovery

Create one recovery episode model.

A suitable structure is:

```ts
interface MicroCheckRecoveryEpisodeV21 {
  recoveryId: string;
  flowId: string;
  type: MicroCheckTypeV21;
  selectedSide: BodySide | null;
  sourceAttemptId: string;
  sourceAttemptEpoch: number;
  lossConfirmedAtMs: number;
  lossCueRequested: boolean;
  lossCueCompleted: boolean;
  stableRecoveryReached: boolean;
  recoveredCueRequested: boolean;
  recoveredCueCompleted: boolean;
  freshCountdownRequired: true;
}
```

## Active loss

Immediately:

1. Invalidate current attempt.
2. Stop active time/grading.
3. Cancel optional speech.
4. Create one recovery id.
5. Emit/plan `tracking-loss-v21` once.
6. Preserve type and selected side.
7. Enter visible recovery.
8. Reject old attempt callbacks.
9. Require fresh setup/final position/countdown.

The stop does not wait for speech.

## Setup low confidence

During ordinary setup:

- use current preflight/readiness prompts;
- do not create a critical active-loss episode.

## Repeated loss

Within one episode:

- no duplicate cue,
- no duplicate invalidation,
- no duplicate result.

## Stable recovery

After current movement readiness is stable:

- `tracking-recovered-v21` may play;
- visible fallback is allowed if missing;
- it does not start active;
- full setup/final-position/countdown still applies.

## New attempt

A new restarted attempt may create a later new recovery episode.

---

# 21. Result, completion, and comparability ordering

Use one deterministic order.

## Valid result

```text
controller accepts result
→ normalize measurement metadata
→ persist locally
→ enqueue backend sync
→ update history/progress state
→ mark completion id
→ speak microcheck-complete-v21
→ show completed screen/navigation
```

If current UI shows completion before backend network success:

- local canonical persistence must already be complete;
- backend sync may remain queued;
- do not block on network.

## Invalid/no measurement

```text
no valid result persistence
→ visible Retry / Discard
→ no microcheck-complete-v21
```

## Completion cue failure

- valid result remains saved;
- visible completion remains;
- no duplicate result on Retry;
- completion cue may use visible fallback;
- no stale cue on later screen.

## Comparability

Preserve:

- same protocol + same side -> comparable series;
- opposite side -> separate/reduced;
- cross protocol -> separate/raw-only;
- unknown side -> raw-only;
- first valid result -> new baseline;
- no official-anchor overwrite.

No completion copy may imply improvement.

---

# 22. Protocol and result persistence

Trace through:

- result object,
- local serialization,
- history,
- backend micro-check sync,
- restore,
- duplicate merge,
- account export,
- progress/trends/reports.

Requirements:

- type/protocol id/version round-trip;
- selected side round-trip;
- side source/anchor/comparability round-trip;
- attempt/result identity round-trip;
- no old history rewrite;
- richer side/protocol metadata wins over sparse duplicate;
- malformed metadata fails closed;
- no remote migration unless current architecture truly requires one;
- do not execute remote schema changes.

## Active attempt persistence

A micro check is short.

Do not add complex backend active-attempt resume unless current architecture already supports it.

Preferred lifecycle:

- app background/unmount during active invalidates current attempt;
- foreground returns to safe setup;
- app restart does not auto-resume;
- pinned side/type may be re-derived through canonical setup;
- no partial result is restored as valid.

If current source already persists active micro-check draft state, reconcile it safely rather than creating a second model.

---

# 23. Mounted voice switching

Maintain:

- desired voice,
- active voice,
- pending voice,
- channel generation id.

## Setup/instruction

- cancel old required sequence;
- rebuild/switch;
- replay the complete current exact sequence;
- next boundary remains blocked.

## Countdown

- cancel;
- invalidate old `go`;
- restart at Three.

## Active

- do not interrupt the physical micro-check solely for preference change;
- defer to safe completion/recovery boundary;
- critical stop remains owned by the active attempt’s current channel policy.

## Paused/recovery/audio failure

- apply switch safely;
- replay required current context.

## Completion

- avoid mixed-voice completion;
- old callback cannot navigate or mark completion.

## Rapid changes

Only latest desired voice survives.

No two active voice channels.

---

# 24. Feature flags and readiness

Add or reuse a narrow feature flag:

```text
EXPO_PUBLIC_ENABLE_MICRO_CHECK_VOICE_V2_1
```

Equivalent naming is acceptable.

Expected successful state:

```text
Micro-Check Voice V2.1 behavior ready:
true

Micro-Check Voice V2.1 audio ready:
false

Micro-Check Voice V2.1 feature:
default off

Micro-Check V2.1 selectable type count:
0

Training Voice V2.1 behavior ready:
true

Training Voice V2.1 audio ready:
false

Training Voice V2.1 feature:
default off

Balance V2:
default closed / audio pending
```

## Selection rule

V2.1 micro runtime may run only when:

- feature enabled,
- behavior ready,
- current contract valid,
- type/side plan valid,
- protocol compatibility valid,
- required physical bindings available,
- internal readiness injected,
- no legacy voice owner.

Ordinary app routes remain legacy while audio is false.

Enabling only the micro feature flag must not create a half-active path.

Existing in-progress legacy micro checks remain legacy.

---

# 25. Logical assets

Keep logical pending keys separate from physical assets.

At minimum audit:

```text
micro-chair-power-v21
micro-single-leg-left-v21
micro-single-leg-right-v21
micro-mobility-left-v21
micro-mobility-right-v21
micro-relax-v21 if required
microcheck-complete-v21
micro-discard-v21
final-position-set-v21
paused-v21
resuming-v21
retry-v21
tracking-loss-v21
tracking-recovered-v21
countdown-three
countdown-two
countdown-one
go
times-up-v21
```

Also include current V2.1 setup prompts used by preflight if the micro runtime references them.

For every row record:

- logical key,
- exact script,
- category,
- policy,
- requiredness,
- micro-check types,
- side variant,
- current candidate,
- current candidate script,
- Clara exists,
- Marcus exists,
- semantic match,
- reuse decision,
- generation required,
- timing budget,
- notes.

Allowed decisions:

```text
reuse_exact_existing_pair
new_pair_required
existing_pair_script_mismatch
not_required
conditional_legacy_only
```

Do not:

- add pending keys to physical `VoiceCueId`,
- add nonexistent files to runtime manifests,
- create placeholders,
- weaken `verify:audio`,
- generate audio.

---

# 26. Timing budgets

Use:

## Micro-check setup

```text
target:
7,000 ms

hard max:
10,000 ms
```

Model:

- exact instruction,
- final-position cue,
- both voices,
- 0 / 100 / 250 ms gaps,
- left/right variants.

Chair and balance may exceed target but must pass hard max under the approved scripts.

## Control confirmation

```text
target:
2,000 ms

hard max:
3,500 ms
```

Applies to:

- pause,
- resume,
- retry,
- discard,
- completion,
- relax where applicable.

## Tracking loss

```text
target:
3,500 ms

hard max:
5,000 ms
```

## Tracking recovery

```text
target:
2,500 ms

hard max:
4,000 ms
```

## Loss + recovery

```text
target:
6,500 ms

hard max:
9,000 ms
```

## Countdown

Model current exact asset durations and software cadence.

Do not claim physical onset validation.

Hard-max failures must be zero for intended scripts.

---

# 27. UI and accessibility

Implement only UI required for truthful internal behavior.

## Existing side setup

Preserve current:

- no-anchor choice,
- anchor recommendation,
- opposite-side warning.

Do not redesign it.

## Setup

Show:

- type name,
- pinned side where applicable,
- exact visible instruction,
- camera/readiness state,
- `I'm ready` where conservative confirmation is required.

## Controls

Show current appropriate controls:

- Pause
- Resume
- Repeat instructions
- Retry
- Discard check
- Cancel/Back

## Failure

Show:

```text
Audio guidance couldn't start.
Try again before beginning the check.
```

Use current Hale style and wording conventions.

## Completion

Show:

```text
Check complete
```

only for valid persisted result.

## Invalid result

Show calm Retry/Discard copy.

Do not say:

- failed,
- bad balance,
- fall risk,
- frail,
- diagnosis,
- medical-grade.

## Accessibility

- side included in labels,
- selected state announced,
- large touch targets,
- Dynamic Type tolerance,
- no color-only status,
- current paused/recovery state announced,
- no technical runtime language.

---

# 28. Diagnostics

Add bounded privacy-safe diagnostics for:

- micro V2.1 mode selected,
- contract resolved,
- protocol compatibility classification,
- side source resolved,
- instruction key selected,
- final position pending/ready,
- countdown requested,
- go playback start accepted/rejected,
- active attempt created,
- rep SFX emitted,
- stop boundary accepted,
- pause/resume/retry/discard accepted,
- tracking recovery episode created/deduplicated,
- result accepted/invalid,
- local persistence completed,
- backend sync queued,
- completion cue requested/completed/failed,
- voice switch requested/applied,
- stale callback ignored.

Do not log:

- raw video,
- raw landmarks,
- account identifiers,
- user name,
- detailed health/result values,
- free-text health notes.

---

# 29. Required tests

Do not weaken or delete existing tests.

## 29.1 Entry baseline

1. Training Voice controls/progress/recovery audit remains green.
2. Training behavior ready remains true.
3. Training audio ready remains false.
4. Measurement-side post-UX audit remains green.
5. Balance V2 audit remains green.
6. `npm run verify:audio` remains green.

## 29.2 Contract registry

1. Exactly three current micro-check contracts.
2. Chair contract exists.
3. Balance contract exists.
4. Mobility contract exists.
5. No generic microcheck-intro contract.
6. No missing contract.
7. No stale extra contract.
8. Cue keys are stable/unique.
9. Side roles are correct.
10. Current type ids match production.

## 29.3 Protocol compatibility

For all three:

1. Old descriptor resolves.
2. New/current descriptor resolves.
3. Timing semantics are classified.
4. Side semantics are classified.
5. Interruption semantics are classified.
6. Direct comparison policy is explicit.
7. Version change occurs when required.
8. Old history remains readable.
9. No false same-protocol bridge.
10. First new-protocol result starts new series where required.

## 29.4 Side setup

1. Chair shows no side selector.
2. Balance no-anchor requires choice.
3. Mobility no-anchor requires choice.
4. Balance prefers same micro anchor.
5. Balance may use official standing-leg recommendation.
6. Mobility does not borrow official side.
7. Selected side is pinned before runner creation.
8. Side cannot change after runner creation.
9. Voice key matches selected side.
10. Visible copy matches selected side.
11. Measurement context matches selected side.
12. Retry preserves side.
13. Recovery preserves side.
14. Voice switch preserves side.
15. Discard does not establish anchor.
16. Invalid result does not establish anchor.
17. Opposite side does not overwrite usual anchor.
18. Chair remains side-independent.

## 29.5 Final position

For each type:

1. General framing is not final-position ready.
2. Exact instruction occurs first.
3. Final-position cue waits for readiness.
4. User confirmation alone cannot bypass required visibility.
5. Visibility alone cannot bypass required explicit confirmation where needed.
6. Rapid ready taps deduplicate.
7. Countdown blocked before final position.
8. Active blocked before final position.
9. Retry resets final-position readiness.
10. Pause/resume resets current attempt readiness.
11. Tracking recovery resets readiness.
12. Background invalidates stale callback.
13. Restore does not auto-ready.
14. Voice change does not mark ready.

## 29.6 Countdown/go

1. Three/two/one/go order.
2. Active starts from go playback-start.
3. Speak dispatch does not start active.
4. Go completion does not start active.
5. Active starts exactly once.
6. Missing go blocks.
7. Resolution failure blocks.
8. Playback-start failure blocks.
9. Completion timeout blocks.
10. Pause during countdown cancels.
11. Discard during countdown cancels.
12. Background during countdown cancels.
13. Voice switch restarts at Three.
14. Old go callback ignored.
15. Retry uses a fresh countdown.

## 29.7 Chair power

1. Exact instruction selected.
2. No side.
3. Accepted rep emits one SFX.
4. Rejected rep emits none.
5. Duplicate/stale rep emits none.
6. No spoken rep count.
7. Fifth accepted rep ends according to controller semantics.
8. Hard cap ends safely.
9. Current partial-at-cap validity is preserved.
10. Pause invalidates attempt.
11. Tracking loss invalidates attempt.
12. Retry starts from zero.
13. Partial reps do not carry across attempts.
14. Valid result persists once.
15. Invalid result does not speak completion.

## 29.8 Single-leg balance

1. Left script.
2. Right script.
3. Selected standing leg matches runner.
4. Current target/hard cap preserved.
5. No unsupported progress cue.
6. Early stance end follows current result policy.
7. Cap uses correct stop behavior.
8. Tracking loss discards partial hold.
9. Pause discards partial hold.
10. Retry same side.
11. Fresh countdown.
12. First valid result establishes micro series.
13. Opposite-side result is separate/reduced.
14. No official metric comparison.
15. No anchor overwrite.

## 29.9 Mobility reach

1. Left script.
2. Right script.
3. Selected extended leg matches runner.
4. Current window preserved.
5. No progress cue.
6. Active starts at go playback start.
7. Canonical end stops measurement immediately.
8. Exact relax cue is planned.
9. `relax-arm-v21` is not used.
10. Tracking loss discards partial ROM window.
11. Pause discards partial ROM window.
12. Retry same selected leg.
13. First valid result establishes series.
14. Opposite side remains separate.
15. Completion after persistence.

## 29.10 Controls

1. Pause controller-first.
2. Pause cue once.
3. Duplicate pause deduplicated.
4. Resume only from paused.
5. Resume cue once.
6. Resume does not directly start active.
7. Repeat available in setup.
8. Repeat available paused.
9. Repeat blocked active.
10. Repeat exact instruction/side.
11. Repeat no generic intro.
12. Repeat no countdown.
13. Retry creates one attempt.
14. Rapid retry deduplicates.
15. Retry cue failure does not skip required setup.
16. Discard controller-first.
17. Discard creates no result.
18. Discard cue once.
19. Duplicate discard deduplicated.
20. Cancel silent.
21. Cancel invalidates callbacks.

## 29.11 Tracking recovery

1. Active loss creates one recovery id.
2. Repeated loss deduplicates.
3. Setup low confidence is not active-loss episode.
4. Current attempt invalidated.
5. No partial result persisted.
6. Type preserved.
7. Side preserved.
8. Tracking-loss cue once.
9. Stable readiness required.
10. Recovered cue does not start active.
11. Fresh full countdown.
12. New attempt id.
13. Old callback ignored.
14. Later restarted attempt may create new episode.
15. Missing loss audio still stops.
16. Missing recovered audio uses visible fallback.

## 29.12 Completion/result

1. Valid result normalized.
2. Local persistence completes before completion cue.
3. Backend sync queued.
4. Completion id created once.
5. Completion cue once.
6. Completion cue failure does not roll back.
7. Invalid result no completion cue.
8. Discarded result no completion cue.
9. Stale completion cannot persist duplicate.
10. No result value spoken.
11. No false improvement claim.
12. History/comparability remains correct.

## 29.13 Persistence/backend

1. Chair result local round trip.
2. Balance result local round trip.
3. Mobility result local round trip.
4. Protocol id/version survives.
5. Side context survives.
6. Comparability survives.
7. Backend sync round trip.
8. Restore round trip.
9. Richer side/protocol metadata wins.
10. Legacy result remains readable.
11. Malformed metadata fails closed.
12. Active attempt does not restore as completed.
13. App restart does not auto-start.

## 29.14 Voice switching

1. Setup replays in new voice.
2. Countdown restarts at Three.
3. Old go ignored.
4. Active switch deferred.
5. Paused switch applies safely.
6. Recovery switch replays current context.
7. Completion does not mix voices.
8. Rapid switches keep latest desired voice.
9. One channel.
10. Old callback ignored.

## 29.15 Type selection/path parity

1. Strength focus selects chair.
2. Balance focus selects balance.
3. Mobility focus selects mobility.
4. Selected type pins at launch.
5. Type cannot drift after launch.
6. Existing scheduling/cadence unchanged.
7. Legacy path remains with flag off.
8. V2.1 internal test path uses exact contract.
9. No legacy/V2.1 mixed voice.
10. Existing active legacy micro check remains legacy.

## 29.16 Asset/readiness

1. Every logical key has asset-requirement row.
2. Existing exact reuse requires semantic match.
3. Pending key is absent from physical manifest.
4. `microcheck-intro` remains retired/inactive V2.1.
5. Micro behavior ready true.
6. Micro audio ready false.
7. Micro feature off.
8. Selectable type count zero.
9. Training behavior remains true.
10. Training feature remains off.
11. Balance V2 remains closed.
12. Step-up remains off.
13. Floor V2.1 remains off.
14. No audio diff.

## 29.17 Timing

1. Chair setup under hard max.
2. Balance left setup under hard max.
3. Balance right setup under hard max.
4. Mobility left setup under hard max.
5. Mobility right setup under hard max.
6. Control lines under hard max.
7. Recovery under hard max.
8. Completion under hard max.
9. Both voices modeled.
10. 0/100/250 ms gaps modeled.
11. Estimates labelled.
12. No timing state difference by voice.

## 29.18 Regression

Re-run relevant current suites for:

- micro-check runner,
- MicroCheckScreen,
- side setup,
- measurement metadata,
- protocol registry,
- comparability,
- micro-check sync/restore,
- history/trends/progress,
- VoiceChannel,
- Training Voice V2.1 shared runtime,
- MPV2,
- Balance V2,
- step-up closure,
- floor readiness.

Preserve all completed P0/P1/P2 gates.

---

# 30. Required audit scenarios

Create at least these canonical scenarios.

## Type selection and contracts

- `micro_strength_focus_selects_chair`
- `micro_balance_focus_selects_balance`
- `micro_mobility_focus_selects_mobility`
- `micro_type_pinned_after_launch`
- `micro_generic_intro_absent`

## Side setup

- `chair_side_not_applicable`
- `balance_no_anchor_left_choice`
- `balance_no_anchor_right_choice`
- `balance_existing_micro_anchor`
- `balance_official_anchor_recommendation`
- `balance_opposite_side_reduced`
- `mobility_no_anchor_left_choice`
- `mobility_no_anchor_right_choice`
- `mobility_existing_micro_anchor`
- `mobility_does_not_borrow_official_side`
- `side_pinned_before_runner`
- `side_change_after_runner_rejected`

## Final position

- `chair_final_position`
- `balance_left_final_position`
- `balance_right_final_position`
- `mobility_left_final_position`
- `mobility_right_final_position`
- `framing_not_final_position`
- `confirmation_without_visibility_blocked`
- `visibility_without_required_confirmation_blocked`
- `rapid_ready_tap_deduplicated`

## Countdown/go

- `chair_countdown_go_start`
- `balance_countdown_go_start`
- `mobility_countdown_go_start`
- `go_dispatch_does_not_start`
- `go_completion_does_not_start`
- `missing_go_blocks`
- `go_start_failure_blocks`
- `pause_during_countdown`
- `discard_during_countdown`
- `background_during_countdown`
- `voice_switch_countdown_restart`

## Chair

- `chair_five_accepted_reps`
- `chair_rep_sfx_only`
- `chair_rejected_rep_no_sfx`
- `chair_duplicate_rep_no_sfx`
- `chair_hard_cap`
- `chair_pause_invalidates_attempt`
- `chair_tracking_invalidates_attempt`
- `chair_retry_starts_zero`
- `chair_valid_persist_then_complete`
- `chair_invalid_no_completion`

## Balance

- `balance_left_script_alignment`
- `balance_right_script_alignment`
- `balance_no_progress`
- `balance_early_end`
- `balance_cap_end`
- `balance_tracking_restart_same_side`
- `balance_pause_restart_same_side`
- `balance_first_result_new_series`
- `balance_opposite_side_separate_series`
- `balance_no_official_metric_bridge`

## Mobility

- `mobility_left_script_alignment`
- `mobility_right_script_alignment`
- `mobility_no_progress`
- `mobility_window_end`
- `mobility_relax_cue`
- `mobility_no_relax_arm_reuse`
- `mobility_tracking_restart_same_side`
- `mobility_pause_restart_same_side`
- `mobility_first_result_new_series`
- `mobility_opposite_side_separate_series`

## Controls

- `micro_pause_controller_first`
- `micro_resume_fresh_setup`
- `micro_repeat_setup`
- `micro_repeat_paused`
- `micro_repeat_active_blocked`
- `micro_retry_audio_failure`
- `micro_retry_tracking_recovery`
- `micro_rapid_retry_deduplicated`
- `micro_discard_controller_first`
- `micro_discard_no_result`
- `micro_rapid_discard_deduplicated`
- `micro_cancel_silent`

## Recovery

- `micro_tracking_loss_active`
- `micro_tracking_loss_setup_not_episode`
- `micro_repeated_loss_deduplicated`
- `micro_recovery_fresh_countdown`
- `micro_recovery_old_callback_ignored`
- `micro_loss_audio_missing_visible_recovery`
- `micro_recovered_audio_missing_visible_fallback`

## Completion/persistence

- `micro_completion_after_local_persist`
- `micro_backend_sync_queued`
- `micro_completion_audio_failure_result_preserved`
- `micro_invalid_result_no_completion`
- `micro_discard_no_anchor`
- `micro_local_roundtrip_all_types`
- `micro_backend_roundtrip_all_types`
- `micro_richer_metadata_merge`
- `micro_legacy_result_readable`
- `micro_restore_no_auto_start`

## Voice switching/defaults

- `micro_voice_switch_setup`
- `micro_voice_switch_active_deferred`
- `micro_voice_switch_recovery`
- `micro_rapid_voice_switch_latest_wins`
- `micro_one_voice_channel`
- `micro_legacy_mode_unchanged`
- `micro_v21_default_off`
- `micro_audio_ready_false`
- `micro_selectable_count_zero`
- `training_behavior_remains_true`
- `balance_v2_remains_closed`
- `step_up_remains_off`
- `floor_v21_remains_off`
- `physical_manifest_unchanged`

The audit may add more.

---

# 31. Audit evidence quality

The audit must be grounded in current production source.

Requirements:

1. Derive all three contracts from the current micro-check registry/runtime.
2. Execute the current side resolver.
3. Execute the current sequence planner.
4. Execute the current tracked runtime with fake logical/physical bindings.
5. Execute current graders/controller where practical.
6. Execute current local serializer.
7. Execute production backend micro-check sync/restore mappers.
8. Derive metrics from written rows.
9. Reopen generated CSV/JSON artifacts and independently recompute.
10. Do not assign defect metrics directly to zero.
11. Verdict derives from completion gates.
12. Failed scenarios remain visible.
13. Estimate-only timing is labelled.
14. Device/listening/audio boundaries remain P3.

Do not inflate scenario counts with copied expected rows.

---

# 32. Required artifacts

Create:

1. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_IMPLEMENTATION.md`
2. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.md`
3. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.json`
4. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_CONTRACT_MATRIX.csv`
5. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_PROTOCOL_COMPATIBILITY_MATRIX.csv`
6. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
7. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_COMPOSED_TIMELINES.csv`
8. `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
9. `docs/audits/HALE_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md`

You may add one audit-only harness:

- `scripts/audits/audit-micro-check-voice-v21.mjs`

Do not overwrite earlier artifacts.

## Contract matrix columns

Use columns similar to:

```text
microCheckType,displayName,currentProtocolId,currentProtocolVersion,finalProtocolId,finalProtocolVersion,comparisonGroup,sideRole,sideRequired,setupCueKeyLeft,setupCueKeyRight,setupCueKeyNoSide,finalPositionRequired,endPolicy,targetDescription,hardCapMs,repSfxOnly,progressCueKeys,stopCueKey,completionCueKey,behaviorReady,audioReady,remainingBlockers,sourceFiles,notes
```

## Protocol matrix columns

Use columns similar to:

```text
microCheckType,oldProtocolId,oldProtocolVersion,newProtocolId,newProtocolVersion,activeStartSemantics,interruptionSemantics,sideSemantics,resultSemantics,classification,directComparisonAllowed,oldHistoryPreserved,newSeriesRequired,reason,tests,notes
```

## Runtime scenario columns

Use columns similar to:

```text
scenarioId,category,microCheckType,protocolId,selectedSide,sideSource,phaseBefore,event,eventAcceptedAtMs,plannedCueKeys,trackedOutcome,phaseAfter,activeStarted,activeStopped,acceptedRepCount,sfxCount,resultValid,resultPersisted,completionSpoken,recoveryId,countdownRestarted,comparabilityOutcome,legacyVoiceEmitted,v21VoiceEmitted,passed,testCoverage,notes
```

## Timeline columns

Use columns similar to:

```text
scenarioId,microCheckType,sideVariant,voiceId,gapMs,budgetClass,cueKeys,scripts,assetStatus,estimatedSpeechMs,estimatedTotalMs,targetMs,hardMaxMs,passesTarget,passesHardMax,activeStartBoundary,stopBoundary,notes
```

## Asset columns

Use columns similar to:

```text
logicalCueKey,exactScript,category,policyId,requiredness,microCheckTypes,sideVariant,currentCandidateKey,currentCandidateScript,claraExists,marcusExists,semanticMatch,reuseDecision,generationRequiredLater,budgetClass,notes
```

---

# 33. Audit metrics

Report at minimum:

```text
liveMicroCheckTypeCount
contractCount
missingContractCount
staleExtraContractCount

sideDependentTypeCount
sideIndependentTypeCount
sideSelectionBypassCount
chairSideSelectorCount
voiceUiControllerSideMismatchCount
officialAnchorOverwriteCount
falseSameSideComparisonCount
falseCrossProtocolComparisonCount

genericMicroIntroEmissionCount
missingExactInstructionCount
prematureFinalPositionCount
countdownBeforeFinalPositionCount
activeBeforeFinalPositionCount

goDispatchStartCount
goCompletionStartCount
missingGoActiveStartCount
duplicateActiveStartCount

chairSpokenRepCountCount
chairRepSfxMismatchCount
chairPartialAttemptCarryoverCount

balanceUnexpectedProgressCount
balanceSideDriftCount
balancePartialAttemptCarryoverCount

mobilityUnexpectedProgressCount
mobilityMissingRelaxCount
mobilityWrongRelaxCueCount
mobilitySideDriftCount
mobilityPartialAttemptCarryoverCount

pausePartialAttemptResumeCount
retryDuplicateAttemptCount
discardPersistedResultCount
discardEstablishedAnchorCount
cancelStaleCallbackMutationCount

trackingEpisodeDuplicateCount
trackingRecoveryWithoutFreshCountdownCount
trackingWrongSideCount
staleRecoveryCallbackMutationCount

invalidResultCompletionCueCount
completionBeforeLocalPersistenceCount
completionDuplicateCount
completionFailureResultLossCount

localResultRoundTripFailureCount
backendResultRoundTripFailureCount
restoreAutoActiveStartCount
richerMetadataLossCount
legacyResultParseFailureCount

mixedVoiceRequiredSequenceCount
twoLiveVoiceChannelCount
oldVoiceCallbackMutationCount

protocolCompatibilityUnresolvedCount
falseProtocolBridgeCount

microBehaviorReadyValue
microAudioReadyValue
microFeatureDefault
microSelectableTypeCount

trainingBehaviorReadyValue
trainingAudioReadyValue
trainingFeatureDefault

timingHardMaxFailureCount
physicalManifestChangeCount
audioAssetChangeCount

p0
p1
p2
p3
```

Severity counts derive from findings.

---

# 34. Findings and verdicts

## P1 examples

- wrong side is spoken or persisted,
- active begins without valid `go` playback start,
- invalid/discarded result is persisted,
- completion is spoken for invalid result,
- stale callback persists duplicate result,
- tracking recovery resumes partial measurement,
- two voice systems own one flow,
- direct incompatible protocol comparison is allowed.

## P2 examples

- one type lacks an exact contract,
- final-position model is not connected,
- one control/recovery path is model-only,
- local/backend metadata is lost,
- protocol compatibility is unresolved,
- required blocker remains after claimed completion,
- setup exceeds hard maximum,
- internal runtime is not connected end to end.

## P3 boundaries

- pending physical V2.1 assets,
- human listening waived,
- physical speaker onset/device timing deferred,
- physical camera/readiness usability deferred.

Issue exactly one primary verdict.

### `MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE`

Use when:

- all three contracts are complete,
- side/protocol/comparability behavior is correct,
- runtime is connected end to end,
- controls/recovery/persistence pass,
- only audio/schema/listening/device work remains.

### `MICRO_CHECK_VOICE_V2_1_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING`

Use when pure contracts/planners pass but the live internal micro-check runtime does not consume them end to end.

### `MICRO_CHECK_VOICE_V2_1_REMEDIATION_REQUIRED`

Use when a side, timing, result, persistence, compatibility, control, recovery, or isolation gate fails.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when current/concurrent source cannot be reconciled safely.

Expected successful verdict:

```text
MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE
```

---

# 35. Completion gates

## Contracts

```text
live types = 3
contracts = 3
missing = 0
stale extras = 0
generic intro emission = 0
missing exact instructions = 0
```

## Side/comparability

```text
side-selection bypass = 0
chair side selector = 0
voice/UI/controller side mismatch = 0
official-anchor overwrite = 0
false same-side comparison = 0
false cross-protocol comparison = 0
```

## Readiness/start

```text
premature final-position = 0
countdown before final-position = 0
active before final-position = 0
start from go dispatch = 0
start from go completion = 0
missing-go active starts = 0
duplicate active starts = 0
```

## Type behavior

```text
chair spoken rep counts = 0
chair SFX mismatches = 0
chair partial carryover = 0

balance unexpected progress = 0
balance side drift = 0
balance partial carryover = 0

mobility unexpected progress = 0
mobility missing relax = 0
mobility wrong relax cue = 0
mobility side drift = 0
mobility partial carryover = 0
```

## Controls/recovery

```text
pause partial resume = 0
retry duplicate attempts = 0
discarded persisted results = 0
discard-established anchors = 0
cancel stale mutations = 0
duplicate recovery episodes = 0
recovery without fresh countdown = 0
recovery wrong side = 0
stale recovery mutations = 0
```

## Result/persistence

```text
invalid result completion cues = 0
completion before local persistence = 0
duplicate completion = 0
completion failure result loss = 0
local round-trip failures = 0
backend round-trip failures = 0
restore auto-active starts = 0
richer metadata loss = 0
legacy parse failures = 0
```

## Voice/isolation

```text
mixed required sequences = 0
two live channels = 0
old voice callback mutation = 0
```

## Protocol

```text
unresolved protocol compatibility = 0
false protocol bridges = 0
```

## Readiness/defaults

```text
micro behavior ready = true
micro audio ready = false
micro feature = off
micro selectable types = 0

training behavior ready = true
training audio ready = false
training feature = off
```

- Balance V2 remains closed/audio pending.
- Step-up remains default off.
- Floor V2.1 remains default off.

## Timing/integrity

```text
hard-max failures = 0
physical manifest changes = 0
audio changes = 0
audio generated = false
external speech/audio API called = false
```

Human listening and physical QA remain deferred.

---

# 36. Implementation report structure

Use:

# Hale Micro-Check Voice V2.1 Implementation

## 1. Result

## 2. Entry Baseline

## 3. Current Micro-Check Runtime Reconciliation

## 4. Canonical Three-Type Contracts

## 5. Protocol Compatibility and Versioning

## 6. Side Resolution and Comparability

## 7. Setup and Final-Position Readiness

## 8. Runtime Phases and Scopes

## 9. Audible Countdown and Go Start

## 10. Chair-Power Runtime

## 11. Single-Leg Balance Runtime

## 12. Mobility-Reach Runtime

## 13. Pause, Resume, Repeat, Retry, Discard, and Cancel

## 14. Tracking-Loss and Recovery

## 15. Result Persistence and Completion

## 16. Mounted Voice Switching

## 17. Feature Flags and Legacy Isolation

## 18. Logical Asset Requirements

## 19. Timing Budgets

## 20. UI and Accessibility

## 21. Diagnostics

## 22. Tests

## 23. Audit Results

## 24. Remaining Audio/Schema/Device Boundaries

## 25. Files Changed

## 26. Worktree Integrity

## 27. Exact Next Phase

---

# 37. Handoff

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md`

If successful, the exact next task is:

```text
Final Voice V2.1 cue schema and physical manifest reconciliation
```

Include:

- micro contract registry API,
- sequence-planner API,
- runtime phase/scope API,
- side-resolution API,
- protocol compatibility decisions,
- final-position API,
- countdown/go API,
- control/recovery API,
- result-completion ordering,
- logical asset requirement list,
- pending `micro-relax-v21` decision/status if added,
- behavior/audio/default readiness,
- tests that must remain green.

Later order:

1. final cue schema and physical manifest reconciliation
2. consolidated Clara/Marcus generation, including Balance V2
3. whole-project static/runtime audit
4. final consolidated Android/iOS physical-device QA

Do not implement the schema/manifest phase in this task.

---

# 38. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run:

- current Training Voice V2.1 controls/progress/recovery audit
- current live-safety audit
- measurement-side post-UX audit
- Balance V2 audit
- new micro-check audit harness

Run focused Jest suites covering:

- MicroCheckRunner
- MicroCheckScreen
- micro-check side setup
- measurement metadata/comparability
- protocol registry
- tracked voice player
- micro V2.1 contracts/planner/runtime
- chair/balance/mobility graders
- pause/resume/retry/discard
- tracking recovery
- local serialization
- backend micro-check sync/restore
- history/trends/progress

Run relevant regression suites for:

- training voice runtime
- MPV2
- Balance V2
- step-up closure
- floor readiness

Run the repository full Jest command.

Parse all generated JSON/CSV artifacts.

Independently recompute audit metrics from written artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
git diff --check
```

Do not modify tests merely to make them pass.

Existing Watchman/open-handle warnings may be reported if commands exit successfully.

---

# 39. Final Codex response

When finished, respond with:

- summary of implementation,
- paths to all nine generated artifacts,
- audit harness path,
- all production files changed/added,
- all tests changed/added,
- confirmation that no audio changed or was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether worktree was already dirty,
- entry baseline results,
- current live micro-check type count,
- contract count,
- final protocol id/version for each type,
- protocol compatibility classification for each type,
- side role/policy for each type,
- exact setup cue keys/scripts,
- final-position readiness strategy for each type,
- countdown cadence,
- active-start boundary,
- chair stop/cap/SFX behavior,
- balance target/cap/end behavior,
- mobility window/end/relax behavior,
- pause/resume semantics,
- Repeat Instructions contents,
- retry behavior,
- discard behavior,
- tracking recovery behavior,
- completion/persistence ordering,
- mounted voice-switch behavior,
- local/backend round-trip behavior,
- feature/default values,
- micro behavior-ready value,
- micro audio-ready value,
- micro selectable count,
- training behavior/audio/default values,
- pending logical asset count,
- timing hard-max failure count,
- all critical defect metrics,
- P0/P1/P2/P3 counts,
- verdict,
- whether final schema/manifests are unblocked,
- exact next task,
- `npm run verify:audio` result,
- typecheck result,
- prior audit results,
- focused/full Jest results,
- audit recomputation result,
- concise confidence statement.

Do not generate audio, change physical manifests, enable Micro-Check Voice V2.1, enable Training Voice V2.1, enable Balance V2, enable step-up/floor V2.1 by default, begin final schema/manifest work, or perform physical-device QA in this task.
