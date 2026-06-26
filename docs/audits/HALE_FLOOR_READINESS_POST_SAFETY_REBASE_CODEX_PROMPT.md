# Codex Prompt: Hale Floor-Readiness Audit Post-Safety Rebase

Read this entire prompt before changing anything.

The previous attempt to run the final Voice V2.1 cue schema task stopped at the entry baseline because:

```text
node scripts/audits/audit-training-floor-readiness.mjs
```

returned:

```text
TRAINING_FLOOR_READINESS_REMEDIATION_REQUIRED

Blocking finding:
FLOOR-safetySubsumptionBlockerRemovedIncorrectlyCount [P2]

Detail:
safetySubsumptionBlockerRemovedIncorrectlyCount is 3
```

This is expected source drift from later completed work, not a product regression.

The floor-readiness phase happened before live Training Voice V2.1 safety-family integration. At that time, the floor audit correctly required the three floor contracts to keep:

```text
IR-VOICE-SAFETY-SUBSUMPTION
```

because safety-family integration was still the next phase.

After that later safety-family phase, `IR-VOICE-SAFETY-SUBSUMPTION` was intentionally removed from active V2.1 contracts. The current floor audit is therefore stale: it is still enforcing the pre-safety-integration baseline.

This task must rebase/supersede the floor-readiness audit to the **current post-safety-integration baseline**.

Do **not** re-add `IR-VOICE-SAFETY-SUBSUMPTION` to the floor contracts.

Do **not** modify production behavior unless the audit finds a genuine floor-readiness regression unrelated to the expected safety-blocker state.

This is primarily an audit/harness rebase task so the final cue schema task can safely pass its entry baseline.

---

# 1. Current expected project state

The intended current state is:

```text
Floor readiness:
software complete

Canonical floor authority:
MovementCapabilityProfile.floorTransfer.status

Floor inventory:
glute-bridge-hold
glute-bridge-reps
push-up-standard

IR-VOICE-FLOOR-GATE:
removed from the three floor contracts

IR-VOICE-FINAL-POSITION-READINESS:
removed from the three floor contracts

IR-VOICE-SAFETY-SUBSUMPTION:
removed from the three floor contracts because live safety-family integration is now complete

Training Voice V2.1 safety ready:
true

Training Voice V2.1 controls/progress/recovery ready:
true

Training Voice V2.1 global behaviour ready:
true

Training Voice V2.1 audio ready:
false

Training Voice V2.1 feature:
default off

Training Voice V2.1 selectable exercises:
0

Floor V2.1 feature:
default off

Balance V2:
default closed / audio pending

Step-up alternation:
default off

Micro-Check Voice V2.1:
software complete / audio false / feature off

Human listening:
waived, not completed

Physical-device QA:
deferred
```

---

# 2. Why this rebase is required

The old floor-readiness audit output/handoff says the floor phase removed:

```text
IR-VOICE-FLOOR-GATE
IR-VOICE-FINAL-POSITION-READINESS
```

but kept:

```text
IR-VOICE-SAFETY-SUBSUMPTION
```

because live safety-family integration was explicitly the next task.

That was correct at the time.

The later Training Voice V2.1 live safety-family integration then made safety ready and removed the safety-subsumption blocker from active V2.1 contracts.

The floor audit must now accept the current phase order:

```text
floor gate complete
→ safety-family integration complete
→ controls/progress/recovery complete
→ micro-check V2.1 complete
→ final cue schema
```

So for the current baseline, the three floor contracts should have:

```text
IR-VOICE-FLOOR-GATE remaining = 0
IR-VOICE-FINAL-POSITION-READINESS remaining = 0
IR-VOICE-SAFETY-SUBSUMPTION remaining = 0
```

The audit must not flag that as incorrect.

---

# 3. Strict scope

## In scope

- Reconcile the current post-safety state of the floor-readiness audit.
- Update `scripts/audits/audit-training-floor-readiness.mjs` if it currently encodes stale pre-safety expectations.
- Regenerate the existing floor-readiness audit artifacts if the harness owns them.
- Add explicit post-safety rebase artifacts.
- Add or update audit-only tests if needed.
- Run relevant validation commands.
- Prove the canonical floor gate still works.
- Prove final-position readiness still blocks countdown/active work.
- Prove current Training Voice V2.1 safety/behaviour readiness remains true.
- Prove audio remains false and features remain off.
- Preserve regenerated-audio task-start baseline.

## Out of scope

Do not:

- re-add `IR-VOICE-SAFETY-SUBSUMPTION`,
- modify production floor eligibility behavior unless a genuine regression is found,
- modify production Training Voice runtime behavior,
- modify Micro-Check code,
- modify MPV2 code,
- modify Balance V2 code,
- generate audio,
- call ElevenLabs or any external speech/audio API,
- change audio files,
- change physical manifests,
- enable any feature flag,
- change exercise programming,
- change final cue schema,
- begin final cue schema work,
- commit, push, reset, stash, clean, checkout, rebase, or discard work.

If a true production regression is found, report it and return remediation required. Do not silently patch product code as part of an audit rebase unless the fix is clearly tiny, safe, and necessary to make the floor gate truthful.

---

# 4. Worktree and regenerated-audio safety

The worktree is dirty and includes a user-owned regenerated audio corpus.

At task start record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
git diff -- src/audio scripts/generate-audio.ts scripts/verify-audio.ts
npm run verify:audio
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/hale_floor_post_safety_audio_entry.sha256
```

At task completion record:

```bash
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/hale_floor_post_safety_audio_exit.sha256
diff -u /tmp/hale_floor_post_safety_audio_entry.sha256 /tmp/hale_floor_post_safety_audio_exit.sha256
```

Requirements:

- `npm run verify:audio` must pass.
- Audio file hashes must not change relative to task start.
- Do not treat regenerated audio dirty relative to Git HEAD as a task failure.
- If an older audit compares audio against Git HEAD and fails only because of regenerated audio baseline, document it as:
  - `baseline_audio_diff_method_stale_not_product_failure`

---

# 5. Source artifacts to read

## Current floor-readiness artifacts

Read:

- `docs/audits/HALE_TRAINING_FLOOR_READINESS_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.json`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md`
- `scripts/audits/audit-training-floor-readiness.mjs`

Important historical fact:

- In the original floor-readiness implementation, `IR-VOICE-SAFETY-SUBSUMPTION` was intentionally still present because live safety-family integration was next.
- In the current post-safety state, its absence is expected and correct.

## Training Voice V2.1 safety integration

Read current artifacts if present:

- `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.json`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_FAMILY_MATRIX.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_CUE_MIGRATION.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_SAFETY_INTEGRATION_HANDOFF.md`
- `scripts/audits/audit-training-voice-v21-live-safety-integration.mjs`

Expected current result:

```text
TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_SOFTWARE_COMPLETE
```

and safety ready true.

## Training controls/progress/recovery

Read:

- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json`
- `docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`
- `scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs`

Expected current result:

```text
TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE
```

with global behaviour ready true and audio ready false.

## Micro-Check Voice V2.1

Read:

- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.md`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.json`
- `docs/audits/HALE_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md`
- `scripts/audits/audit-micro-check-voice-v21.mjs`

Expected current result:

```text
MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE
```

with audio false and feature off.

## Current production source

Inspect current source for:

- `src/training/floorExerciseEligibility.ts`
- `src/profile/movementCapabilities.ts`
- `src/screens/SafetyProfileScreen.tsx`
- `src/training/sessionPlayer.ts`
- `src/screens/TrainingSessionScreen.tsx`
- `src/training/voiceV21/contracts.ts`
- `src/training/voiceV21/readiness.ts`
- `src/training/voiceV21/safetyPolicy.ts`
- `src/training/voiceV21/runtime.ts`
- floor final-position setup source
- `src/training/serialize.ts`
- backend profile/training-state sync/restore as relevant

Search for:

```text
IR-VOICE-FLOOR-GATE
IR-VOICE-FINAL-POSITION-READINESS
IR-VOICE-SAFETY-SUBSUMPTION
glute-bridge-hold
glute-bridge-reps
push-up-standard
floorFamilyIntroduced
TrainingFloorSessionMemory
deriveFloorExerciseEligibility
MovementCapabilityProfile.floorTransfer.status
TRAINING_VOICE_V2_1_SAFETY_READY
TRAINING_VOICE_V2_1_BEHAVIOR_READY
```

---

# 6. Required reconciliation logic

Update/supersede the floor audit so it distinguishes these two historical states:

## Pre-safety-integration floor baseline

Valid at the end of the original floor-readiness task:

```text
IR-VOICE-FLOOR-GATE = removed
IR-VOICE-FINAL-POSITION-READINESS = removed
IR-VOICE-SAFETY-SUBSUMPTION = still present
safety integration = not complete
```

## Post-safety-integration floor baseline

Valid now:

```text
IR-VOICE-FLOOR-GATE = removed
IR-VOICE-FINAL-POSITION-READINESS = removed
IR-VOICE-SAFETY-SUBSUMPTION = removed
safety integration = complete
Training Voice V2.1 safety ready = true
Training Voice V2.1 behavior ready = true
```

The audit should use the current source to determine which baseline applies.

A suitable rule:

```text
If Training Voice V2.1 safety integration is complete and safety ready is true,
then the three floor contracts must not carry IR-VOICE-SAFETY-SUBSUMPTION.

If safety integration is not complete,
then the old pre-safety floor audit may require that blocker to remain.
```

Do not hard-code success by date.

---

# 7. Required scenario checks

Create or update scenario evidence for at least:

## Contract blocker state

- `post_safety_floor_gate_blocker_removed`
- `post_safety_final_position_blocker_removed`
- `post_safety_safety_subsumption_removed`
- `floor_contracts_no_stale_safety_blocker`
- `floor_contracts_no_new_unknown_blocker`

## Floor gate still active

- `floor_space_only_still_blocked`
- `unconfirmed_floor_transfer_still_blocked`
- `avoid_floor_transfer_still_blocked`
- `confirmed_without_floor_space_still_blocked`
- `confirmed_with_floor_space_eligible_subject_to_other_gates`
- `direct_helper_cannot_bypass_floor_gate`

## Final-position still active

- `floor_final_position_blocks_countdown`
- `floor_final_position_blocks_active`
- `floor_confirmation_plus_readiness_allows_countdown`
- `stale_floor_setup_callback_ignored`
- `restore_floor_setup_no_auto_start`

## Post-safety integration sanity

- `training_safety_ready_true`
- `training_behavior_ready_true`
- `training_audio_ready_false`
- `training_feature_default_off`
- `v21_selectable_exercises_zero`
- `floor_v21_default_off`
- `balance_v2_default_closed`
- `step_up_default_off`
- `micro_check_v21_software_complete_audio_false`

## Audio baseline

- `verify_audio_passes_regenerated_baseline`
- `audio_hashes_unchanged_this_task`
- `no_external_audio_api_called`

The audit may add more scenarios.

---

# 8. Metrics

Report at minimum:

```text
floorExerciseCount
floorContractCount

irVoiceFloorGateRemainingCount
irVoiceFinalPositionRemainingCount
irVoiceSafetySubsumptionRemainingCount

safetyIntegrationCompleteValue
trainingVoiceSafetyReadyValue
trainingVoiceBehaviorReadyValue
trainingVoiceAudioReadyValue
trainingVoiceFeatureDefault
trainingVoiceSelectableExerciseCount

floorGateLeakCount
floorSpaceOnlyLeakCount
unconfirmedFloorExerciseLeakCount
avoidFloorExerciseLeakCount
confirmedWithoutFloorSpaceLeakCount
directHelperBypassCount

prematureFinalPositionCueCount
countdownBeforeFinalPositionCount
activeBeforeFinalPositionCount
staleFloorSetupMutationCount
restoreAutoStartCount

legacyFloorAuditStaleExpectationCount
postSafetyRebaseAppliedCount
postSafetyExpectationMismatchCount

verifyAudioFailureCount
audioHashChangedCount
audioGeneratedCount
externalSpeechAudioApiCallCount
physicalManifestChangeCount

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 9. Findings and verdicts

## P1 examples

- floor exercise can start without confirmed floor transfer or floor space;
- countdown or active work can begin before final-position readiness;
- stale setup callback can start a later floor item;
- training state can promote floor capability.

## P2 examples

- `IR-VOICE-FLOOR-GATE` remains on a completed floor contract;
- `IR-VOICE-FINAL-POSITION-READINESS` remains on a completed floor contract;
- current post-safety baseline still carries `IR-VOICE-SAFETY-SUBSUMPTION`;
- old audit still flags safety-subsumption removal as incorrect;
- final schema entry baseline remains blocked by stale floor audit expectation;
- audio baseline handling is not task-start safe.

## P3 examples

- physical-device floor setup reliability deferred;
- human listening waived;
- regenerated corpus not human-listened;
- physical speaker/device timing deferred.

Issue exactly one verdict.

### `TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE`

Use when:

- the floor gate still works;
- final-position readiness still works;
- the current post-safety blocker state is accepted;
- floor audit/harness no longer blocks on stale safety-subsumption expectation;
- audio/task-start hash integrity passes;
- only P3 boundaries remain.

This is the expected successful verdict.

### `TRAINING_FLOOR_READINESS_POST_SAFETY_REMEDIATION_REQUIRED`

Use when:

- a real floor-gate/final-position/path-parity/source-regression exists;
- or the stale audit expectation remains unfixed.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- current dirty source cannot be safely reconciled.

---

# 10. Required artifacts

Create new post-safety rebase artifacts:

1. `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.md`
2. `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.json`
3. `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_SCENARIOS.csv`
4. `docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX_POST_SAFETY.csv`
5. `docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_POST_SAFETY_HANDOFF.md`

Update the existing floor-readiness audit artifacts if and only if the existing harness is the entry-baseline source for later tasks:

- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.json`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md`

The existing harness command must pass:

```bash
node scripts/audits/audit-training-floor-readiness.mjs
```

If you choose to add a new supplemental harness, it must not replace that requirement.

Allowed harness changes:

- update `scripts/audits/audit-training-floor-readiness.mjs` so it detects the current post-safety baseline correctly;
- add an audit-only helper if needed.

Do not change production code solely to satisfy stale audit logic.

---

# 11. CSV columns

## Post-safety scenarios CSV

Use columns similar to:

```text
scenarioId,category,exerciseId,currentPhaseBaseline,trainingSafetyReady,trainingBehaviorReady,blockersBefore,blockersAfter,capabilityStatus,floorSpace,entryPath,finalPositionPhase,countdownAllowed,activeAllowed,expectedOutcome,observedOutcome,passed,notes
```

## Post-safety contract matrix CSV

Use columns similar to:

```text
exerciseId,displayName,releaseStatus,requiresFloorTransfer,requiresFloorSpace,currentGateSource,irVoiceFloorGateRemaining,irVoiceFinalPositionRemaining,irVoiceSafetySubsumptionRemaining,postSafetyExpected,eligibleWhenConfirmed,finalPositionRuntimeStatus,trainingSafetyReady,remainingBlockers,runtimeStatus,notes
```

---

# 12. Required validation

Run:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-training-floor-readiness.mjs
```

Run if present:

```bash
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-micro-check-voice-v21.mjs
```

Run relevant focused tests for:

- floor exercise eligibility;
- SafetyProfileScreen floor transfer;
- TrainingSessionScreen floor setup/final position;
- Training Voice V2.1 safety readiness;
- Training Voice V2.1 controls/progress/recovery readiness;
- Micro-Check Voice V2.1 readiness;
- audio verification tests if present.

Run full Jest if practical.

Run:

```bash
git diff --check
git diff -- assets/audio
```

and compare task-start/task-exit audio hashes.

Do not modify tests merely to make them pass.

---

# 13. Completion gates

Successful rebase requires:

```text
irVoiceFloorGateRemainingCount = 0
irVoiceFinalPositionRemainingCount = 0
irVoiceSafetySubsumptionRemainingCount = 0

safetyIntegrationCompleteValue = true
trainingVoiceSafetyReadyValue = true
trainingVoiceBehaviorReadyValue = true
trainingVoiceAudioReadyValue = false
trainingVoiceFeatureDefault = off
trainingVoiceSelectableExerciseCount = 0

floorSpaceOnlyLeakCount = 0
unconfirmedFloorExerciseLeakCount = 0
avoidFloorExerciseLeakCount = 0
confirmedWithoutFloorSpaceLeakCount = 0
directHelperBypassCount = 0

prematureFinalPositionCueCount = 0
countdownBeforeFinalPositionCount = 0
activeBeforeFinalPositionCount = 0
staleFloorSetupMutationCount = 0
restoreAutoStartCount = 0

legacyFloorAuditStaleExpectationCount = 0
postSafetyExpectationMismatchCount = 0

verifyAudioFailureCount = 0
audioHashChangedCount = 0
audioGeneratedCount = 0
externalSpeechAudioApiCallCount = 0
physicalManifestChangeCount = 0

P0/P1/P2 = 0
```

P3 may remain for:

- physical-device QA,
- human listening,
- regenerated corpus not human-listened,
- physical speaker/device timing.

---

# 14. Report structure

Use:

# Hale Training Floor-Readiness Post-Safety Rebase

## 1. Executive Verdict

## 2. Why the Original Floor Audit Became Stale

## 3. Worktree and Regenerated-Audio Baseline

## 4. Current Phase Reconciliation

## 5. Floor Contract Blocker State

## 6. Canonical Floor Gate Regression Check

## 7. Final-Position Regression Check

## 8. Training Voice Safety/Behaviour Readiness Check

## 9. Feature and Audio Gate Check

## 10. Audit Harness Update

## 11. Tests and Validation

## 12. Findings

## 13. Worktree Integrity

## 14. Exact Next Task

---

# 15. Handoff

Create:

```text
docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_POST_SAFETY_HANDOFF.md
```

If successful, the exact next task is again:

```text
Final Voice V2.1 cue schema and physical manifest reconciliation
```

Include:

- current floor contract blocker state;
- current safety readiness state;
- current training behaviour/audio/default state;
- regenerated-audio baseline note;
- instruction that final schema should run the existing floor audit successfully;
- instruction that no blocker should be re-added.

---

# 16. Final Codex response

When finished, respond with:

- summary of what changed;
- paths to all new post-safety artifacts;
- whether existing floor audit artifacts/harness were updated;
- all files changed/added;
- confirmation that no production code changed unless explicitly necessary;
- confirmation that no audio changed relative to task start;
- confirmation that no audio was generated;
- confirmation that no external speech/audio API was called;
- branch and commit;
- whether worktree was already dirty;
- task-start `verify:audio` result;
- final `verify:audio` result;
- task-start/final audio hash counts and diff count;
- floor exercise count;
- floor contract count;
- `IR-VOICE-FLOOR-GATE` remaining count;
- `IR-VOICE-FINAL-POSITION-READINESS` remaining count;
- `IR-VOICE-SAFETY-SUBSUMPTION` remaining count;
- whether safety-ready is true;
- whether behavior-ready is true;
- whether audio-ready remains false;
- feature defaults;
- floor gate leak counts;
- final-position premature/counter/active counts;
- stale expectation count;
- P0/P1/P2/P3 counts;
- verdict;
- whether final cue schema is unblocked;
- exact next task;
- validation command results;
- concise confidence statement.

Do not start final cue schema work in this task.
