# Codex Prompt: Hale Training Voice V2.1 Live Safety-Family Integration

Read this entire prompt before changing anything.

Hale’s floor-transfer readiness phase is complete at the software/static level.

Current verified project state:

```text
Floor readiness verdict:
TRAINING_FLOOR_READINESS_SOFTWARE_COMPLETE

Canonical floor authority:
MovementCapabilityProfile.floorTransfer.status

Floor exercise inventory:
glute-bridge-hold
glute-bridge-reps
push-up-standard

Removed floor blockers:
IR-VOICE-FLOOR-GATE
IR-VOICE-FINAL-POSITION-READINESS

Remaining floor/training blocker:
IR-VOICE-SAFETY-SUBSUMPTION

Training Voice V2.1:
default off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

Balance V2:
default closed / audio pending

Step-up alternation:
default off

Human listening:
waived, not completed

Physical-device QA:
deferred
```

The exact next phase is:

```text
Training Voice V2.1 live safety-family integration
```

This phase must connect the existing pure V2.1 safety-family policy to Hale’s actual default-closed Training Voice V2.1 runtime.

It must preserve Hale’s existing canonical safety profiles, equipment/capability gates, plan snapshots, legacy safety voice path, and current release rules.

It must not create a second safety authority and must not generate audio.

---

# 1. Authoritative design contract

The approved V2.1 safety model is:

```text
Universal safety:
spoken once per session.

Normal equipment/setup safety:
at most one most-specific family action per setup.

Exact exercise instruction:
may absorb the family action.

Later sets:
do not repeat universal or equipment-family safety.

Repeat Instructions:
replays the exact movement instruction, current side, and target;
it does not replay universal safety or unrelated equipment safety.

Reactive stop/recovery safety:
remains distinct from normal first-use family narration.
```

Approved safety families:

```ts
type TrainingVoiceSafetyFamilyV21 =
  | 'none'
  | 'chair_seat'
  | 'generic_support'
  | 'balance_support'
  | 'step_or_stair'
  | 'long_band_handheld_or_foot_anchored'
  | 'door_anchor_band'
  | 'mini_band_above_knees'
  | 'floor_eligible_user';
```

Approved subsumption rules:

```text
balance_support
subsumes generic_support

step_or_stair
subsumes generic_support

door_anchor_band
subsumes long_band_handheld_or_foot_anchored

floor_eligible_user
subsumes repeated floor-transfer and generic-support narration

mini_band_above_knees
is stated once inside the exact mini-band instruction

chair_seat
is absorbed when the exact instruction already specifies a sturdy chair
or controlled chair use

generic_support
is absorbed when the exact instruction already says support is close
```

Hard invariant:

```text
No normal setup may emit more than one separate equipment-family cue.
```

The family hierarchy is a narration policy. It does not replace safety eligibility or exercise safety requirements.

---

# 2. Existing artifacts to read

## Floor readiness

- `docs/audits/HALE_TRAINING_FLOOR_READINESS_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.json`
- `docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX.csv`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_SCENARIOS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md`
- `scripts/audits/audit-training-floor-readiness.mjs`

Canonical floor APIs include:

```text
MovementCapabilityProfile.floorTransfer.status
deriveFloorExerciseEligibility(...)
plannedMovementCapabilitySnapshotFromProfile(...)
validatePlanMovementCapabilitySnapshot(...)
TrainingFloorSessionMemory
TrainingFloorSetupSnapshot
confirmFloorStartPosition(...)
```

The floor family must integrate with this existing memory and capability system. Do not add a second `floorFamilyIntroduced` authority.

## Training Voice V2.1 foundation

- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_FOUNDATION_HANDOFF.md`
- `scripts/audits/audit-training-voice-v21-foundation.mjs`

Expected APIs include, or have repository-equivalent names:

```text
listTrainingVoiceContractsV21()
getTrainingVoiceContractV21(...)
resolveTrainingVoiceTargetV21(...)
resolveTrainingVoiceSafetyV21(...)
planTrainingVoiceSequenceV21(...)
resolveTrainingVoiceRuntimeReadinessV21(...)
selectTrainingVoiceRuntimeModeV21(...)
TrainingVoiceRuntimeV21
```

The foundation already contains a pure most-specific-wins safety planner. Reconcile and extend it; do not build a parallel planner.

## Current canonical safety system

Read current source and relevant audit evidence, including:

- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- current exercise safety profiles
- current session safety snapshots/fingerprints
- current start-time validation
- current Explore/manual safety metadata
- current safety tests
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md`, if present
- voice inventory/runtime audit artifacts

The existing canonical system currently covers:

- global stop rules,
- chair,
- generic support,
- balance,
- floor,
- step/stair,
- band,
- door anchor,
- mobility/range,
- active safety,
- repeated-set reminders,
- tracking/setup recovery.

This source remains authoritative for safety requirements and legacy narration.

## Completed behavioural foundations

Read and preserve current code/tests for:

- both-sides rounds,
- step-up alternation/runtime,
- floor readiness/final position,
- measurement side,
- Eyes-Open Balance V2,
- MPV2 tracked voice runtime.

## Approved specification

Read:

- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv`

Do not modify these approved specification artifacts in this task.

---

# 3. Approved logical safety scripts

Use these exact V2.1 scripts as the software contract unless current source proves that an approved wording update already exists.

## Session universal safety

```text
safe-session-start-v21

Clear the space around you. Stop for sharp pain, dizziness, or feeling unwell.
```

## Chair

```text
equip-chair-stable-v21

Use a sturdy chair that will not slide.
```

## Generic support

```text
equip-support-close-v21

Keep sturdy support within easy reach.
```

## Balance support

```text
equip-balance-support-v21

Keep support within easy reach.
```

## Step or stair

```text
equip-step-stable-v21

Use the lowest stable step, with support nearby.
```

## Long band

```text
equip-long-band-v21

Check the band first and keep it away from your face.
```

## Door anchor

```text
equip-door-anchor-v21

Use a secure closed door anchor and test light tension first.
```

## Floor transition

```text
equip-floor-transition-v21

Move down to the floor and settle into the start position.
```

## Mini-band

There is no separate normal family cue.

The exact mini-band instruction must state:

```text
the band is above the knees
and the steps are small and controlled
```

Do not assemble new runtime speech from unrelated legacy fragments.

Do not add these pending logical cues to the physical `VoiceCueId` union or manifest unless exact Clara and Marcus files already exist and are independently verified. Current evidence says these V2.1 safety assets are generally pending.

---

# 4. Objective

Implement a canonical live safety-family layer that guarantees:

1. Existing `SafetyCueProfile`/safety snapshot logic remains the authority for what safety requirements apply.
2. V2.1 safety families are the concise narration policy for the internal V2.1 path.
3. Every live exact exercise contract maps to one normal safety family or `none`.
4. Every current atomic safety cue receives an explicit migration classification.
5. No current safety requirement disappears silently.
6. Session intro and universal safety are one required tracked sequence.
7. Universal safety completes before the first item can proceed into setup/countdown.
8. Universal safety is spoken once per session.
9. Universal safety is marked complete only after tracked speech completes successfully.
10. Cancellation, interruption, missing asset, playback failure, or stale callback does not mark universal safety complete.
11. The first use of an equipment family plans at most one separate family cue.
12. Most-specific family selection is deterministic.
13. Subsumed parent-family cues are not emitted.
14. An exact instruction may absorb a family only through explicit contract metadata.
15. Absorbed safety is considered fulfilled only after the required exact instruction completes.
16. A family is marked introduced only after its required spoken obligation completes.
17. Plan creation, `speak()` dispatch, or visible rendering alone cannot mark a family introduced.
18. Later sets do not repeat the family cue.
19. A later exercise in the same family does not repeat the family cue.
20. A later exercise in a genuinely different family may introduce that family once.
21. Repeat Instructions does not replay universal safety.
22. Repeat Instructions does not replay already introduced equipment-family safety.
23. Repeat Instructions does not insert an unrelated family cue.
24. New sessions reset universal and family memory.
25. Pause/background/restore preserves completed session safety memory safely.
26. Malformed V2.1 safety memory fails closed for the V2.1 path.
27. Floor-family introduction uses the existing canonical `TrainingFloorSessionMemory`.
28. Floor safety memory cannot disagree with general V2.1 safety memory.
29. Continuous floor items do not repeat `equip-floor-transition-v21`.
30. Leaving and later returning to floor follows the already documented minimal floor behavior.
31. Current legacy safety narration remains unchanged when V2.1 is off.
32. The V2.1 path never emits legacy atomic normal safety and V2.1 family safety for the same setup.
33. Only one voice system owns a session.
34. Required safety speech blocks the relevant setup/countdown boundary.
35. Missing required safety audio fails closed for the V2.1 path.
36. Tracked-request completion, cancellation, stage/scope identity, stale guards, and mounted voice change follow the existing tracked voice contract.
37. Generated, short, restart, supporting, manual, and Explore paths derive safety from the final selected exercise and equipment.
38. A substituted exercise does not retain the original exercise’s safety family.
39. Current safety snapshot/fingerprint validation still protects start-time integrity.
40. A stale or changed safety profile makes the internal V2.1 plan nonselectable/replan-required.
41. All 37 exact contracts have a valid safety plan.
42. No active V2.1 contract retains `IR-VOICE-SAFETY-SUBSUMPTION` after genuine completion.
43. Current reactive stop/recovery requirements remain explicitly mapped to the later controls/recovery phase.
44. `IR-VOICE-TRAINING-CONTROLS` and `IR-VOICE-TRAINING-RECOVERY` remain where still true.
45. `IR-VOICE-AUDIO-ASSETS` remains.
46. Training Voice V2.1 global behaviour ready remains false.
47. Training Voice V2.1 audio ready remains false.
48. Training Voice V2.1 remains default off.
49. Balance V2 remains default closed/audio pending.
50. Step-up alternation remains default off.
51. Floor V2.1 remains default off.
52. No audio is generated or changed.
53. The exact next phase becomes:
    - Training Voice V2.1 controls, progress, and recovery runtime integration.

---

# 5. Strict scope

## In scope

- Existing safety-authority reconciliation.
- Atomic-safety-to-V2.1 migration classification.
- Safety family mapping for all 37 contracts.
- Explicit absorption metadata.
- Session universal-safety state.
- Introduced-family state.
- Floor memory bridge.
- Generated-item safety plan/snapshot where needed.
- Runtime sequence integration.
- Required tracked safety outcomes.
- Countdown/setup gating.
- First-use, later-set, and Repeat Instructions behavior.
- Legacy/V2.1 isolation.
- Generated/manual/Explore parity.
- Persistence/restore of V2.1 session safety memory.
- Runtime readiness/blocker updates.
- Asset-requirement updates.
- Composed logical timing audit.
- Focused tests.
- Post-implementation audit.
- Handoff to controls/progress/recovery.

## Out of scope

Do not implement:

- audio generation,
- ElevenLabs calls,
- runtime TTS,
- physical manifest entries for nonexistent assets,
- human listening review,
- physical-device QA,
- live activation of Training Voice V2.1,
- live activation of Balance V2,
- live activation of step-up alternation,
- live activation of floor V2.1,
- full pause/resume/skip/retry voice completion,
- full tracking-loss/recovery voice completion,
- reactive equipment-shift voice integration,
- active progress cues,
- rest/completion/control cue migration,
- Micro-Check Voice V2.1,
- final cue-schema retirement,
- deletion of legacy safety cue definitions/assets,
- removal of legacy safety snapshots,
- exercise programming changes,
- release-policy changes,
- progression changes,
- medical claims,
- package installation,
- lockfile changes,
- destructive Git operations.

This phase integrates normal session/setup safety. Reactive safety/control narration remains a later, explicit phase.

---

# 6. Worktree safety

The repository is heavily dirty and contains important uncommitted work.

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

1. Treat all current modifications as user-owned.
2. Do not reset, checkout, stash, clean, rebase, or discard anything.
3. Do not delete or rename existing audio.
4. Do not overwrite unrelated renderer, check-up, website, profile, or audit work.
5. Do not regenerate manifests wholesale.
6. Do not commit or push.
7. Inspect current diffs before editing a modified file.
8. Make the smallest safe change.
9. At completion distinguish this task’s footprint from pre-existing work.

---

# 7. Current source to inspect

Inspect current source, imports, and runtime call paths.

## Existing safety authority

At minimum inspect:

- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- all safety profile types
- all exercise safety-profile mappings
- safety cue schema version
- safety snapshot/fingerprint logic
- safety start-time validation
- Explore/manual safety notes
- safety tests

## Training Voice V2.1

Inspect every current file under:

```text
src/training/voiceV21/
```

At minimum:

- `types.ts`
- `contracts.ts`
- `safetyPolicy.ts`
- `sequencePlanner.ts`
- `targetGrammar.ts`
- `readiness.ts`
- `runtime.ts`
- `assets.ts`
- `index.ts`
- tests

## Training runtime

- `src/training/sessionPlayer.ts`
- `src/training/setRuntime.ts`
- `src/screens/TrainingSessionScreen.tsx`
- current `VoiceUpdate` path
- current session intro path
- current setup and countdown path
- current repeat-instructions path
- current pause/background/unmount handling
- current voice selection handling
- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`

## Generation/planning

- `src/training/workoutGeneration.ts`
- `src/training/dynamicState.ts`
- `src/training/dailyTrainingContext.ts`
- `src/haleFlow/sessionPlanning.ts`
- manual practice planning
- Explore detail/preset planning
- restored generated session handling
- current safety snapshots on generated items

## Persistence/backend

- `src/training/serialize.ts`
- active training-state serialization
- backend training-state sync/restore
- account export/restore
- duplicate/merge helpers

## Completed behavioral modules

- `src/training/bothSidesRounds/`
- `src/training/stepUpAlternation/`
- floor-readiness/floor-setup modules
- feature flags and readiness selectors

Search for:

```text
IR-VOICE-SAFETY-SUBSUMPTION
resolveTrainingVoiceSafetyV21
TrainingVoiceSafetyFamilyV21
safetyFamily
safetyAbsorbed
sessionMemory
introducedFamilies
universalSafety
SafetyCueProfile
safetyCueSnapshot
globalCueIds
setupCueIds
activeCueIds
repeatCueIds
recoveryCueIds
floorFamilyIntroduced
equip-chair-stable-v21
equip-support-close-v21
equip-balance-support-v21
equip-step-stable-v21
equip-long-band-v21
equip-door-anchor-v21
equip-floor-transition-v21
safe-session-start-v21
training-intro-v21
speakTracked
Repeat Instructions
```

---

# 8. Reconcile the two safety layers

Create one explicit source-of-truth table:

```text
Safety concern
Canonical requirement source
Legacy spoken cue(s)
V2.1 normal destination
Reactive destination
Absorbed by exact instruction?
Persistence/snapshot source
Action in this task
```

## Required authority rule

Use:

```text
Current SafetyCueProfile and current equipment/capability/profile gates
= authority for applicable safety requirements.

Training Voice V2.1 safety-family plan
= concise narration and de-duplication policy for the internal V2.1 path.
```

The V2.1 plan must not make an exercise eligible.

It consumes an already eligible final exercise plus its current canonical safety profile.

## Atomic cue classification

Every current canonical safety cue must be classified as exactly one of:

```text
mapped_to_universal_v21
mapped_to_normal_family_v21
absorbed_into_exact_instruction_v21
reactive_control_recovery_later_phase
legacy_only
retired_later_after_asset_migration
not_applicable_to_current_v21
```

Do not leave any active canonical safety cue unclassified.

## No silent safety loss

For every legacy atomic cue classified away from normal V2.1 speech, document where its safety meaning remains:

- universal line,
- concise family line,
- exact instruction,
- existing eligibility gate,
- visible setup,
- later reactive controls/recovery phase,
- or conditional legacy path.

If no destination exists, keep `IR-VOICE-SAFETY-SUBSUMPTION` and return remediation required.

---

# 9. Canonical safety-plan types

Extend current V2.1 types rather than duplicating them.

A suitable conceptual model is:

```ts
export type TrainingVoiceSafetyFulfilmentV21 =
  | 'not_required'
  | 'separate_family_cue'
  | 'absorbed_into_exact_instruction';

export interface TrainingVoiceSafetyPlanV21 {
  version: 1;
  exerciseId: string;

  family: TrainingVoiceSafetyFamilyV21;
  parentFamily: TrainingVoiceSafetyFamilyV21 | null;
  subsumedFamilies: readonly TrainingVoiceSafetyFamilyV21[];

  fulfilment: TrainingVoiceSafetyFulfilmentV21;
  logicalCueKey: string | null;
  exactScript: string | null;

  sourceSafetyProfileSchemaVersion: number;
  sourceSafetyProfileFingerprint: string;
  sourceSafetyCueIds: readonly string[];

  requiredForVoiceFirst: boolean;
  policyId: 'instruction';

  reasonCodes: readonly string[];
  reactiveSafetyCueIdsDeferred: readonly string[];
}
```

Equivalent repository-consistent naming is acceptable.

## Generated/session plan

Where current architecture requires plan pinning, include:

```ts
interface GeneratedTrainingVoiceSafetyPlanV21 {
  contractVersion: number;
  safetyPlan: TrainingVoiceSafetyPlanV21;
  planFingerprint: string;
}
```

Requirements:

- immutable/readonly where practical,
- JSON-safe,
- deterministic fingerprint,
- no free-text-only behavior,
- no duplicated eligibility authority,
- derived from the final substituted exercise,
- source safety profile fingerprint retained.

---

# 10. Canonical session memory

Create or extend one canonical V2.1 training voice session memory.

A suitable conceptual shape is:

```ts
export interface TrainingVoiceSafetySessionMemoryV21 {
  version: 1;

  universalSafety:
    | 'not_started'
    | 'completed';

  introducedFamilies: readonly Exclude<
    TrainingVoiceSafetyFamilyV21,
    'none' | 'floor_eligible_user'
  >[];

  floor: TrainingFloorSessionMemory;
}
```

Equivalent naming is acceptable.

## Critical no-duplication rule

`floor_eligible_user` introduction must derive from:

```text
TrainingFloorSessionMemory.floorFamilyIntroduced
```

Do not also store floor introduction independently in `introducedFamilies`.

Provide canonical helpers such as:

```ts
isTrainingVoiceSafetyFamilyIntroduced(...)
markTrainingVoiceSafetyFamilyIntroduced(...)
```

For the floor family these helpers must delegate to the existing floor memory.

## Completion semantics

A universal/family obligation becomes completed only after:

```text
tracked required sequence outcome === completed
```

It does not become completed after:

- planning,
- rendering,
- request creation,
- request acceptance,
- first cue start,
- visible user confirmation,
- or partial playback.

## Restore

Persist completed memory.

Do not persist an in-flight request as completed.

Malformed memory makes the internal V2.1 path fail closed or replay the complete required obligation according to one documented safe policy.

Do not guess.

---

# 11. Safety-plan resolution

Reconcile and harden:

```ts
resolveTrainingVoiceSafetyV21(...)
```

The resolver must use:

- final exercise contract,
- final canonical safety profile,
- current equipment,
- current capabilities,
- floor eligibility,
- session memory,
- exposure type,
- exact-instruction absorption metadata.

## Required algorithm

1. Verify the canonical safety profile matches the final exercise.
2. Verify schema/fingerprint.
3. Determine all applicable normal safety concerns.
4. Remove concerns represented only as later reactive behavior.
5. Apply explicit contract absorption.
6. Apply family subsumption.
7. Select at most one separate normal family cue.
8. Check whether the selected family is already introduced.
9. Return:
   - separate cue,
   - absorbed obligation,
   - or no due safety.
10. Keep reactive cue ids in deferred metadata for the next phase.

## Required reason codes

Use stable codes such as:

```text
NO_NORMAL_FAMILY_REQUIRED
FAMILY_ALREADY_INTRODUCED
FAMILY_ABSORBED_IN_EXACT_INSTRUCTION
BALANCE_SUBSUMES_GENERIC_SUPPORT
STEP_SUBSUMES_GENERIC_SUPPORT
DOOR_ANCHOR_SUBSUMES_LONG_BAND
FLOOR_SUBSUMES_GENERIC_SUPPORT
MINI_BAND_ABSORBED_IN_INSTRUCTION
CHAIR_ABSORBED_IN_INSTRUCTION
GENERIC_SUPPORT_ABSORBED_IN_INSTRUCTION
SAFETY_PROFILE_MISMATCH
SAFETY_PROFILE_STALE
MULTIPLE_UNRESOLVED_FAMILIES
UNKNOWN_SAFETY_FAMILY
FLOOR_NOT_ELIGIBLE
```

If multiple non-subsumed, nonabsorbed normal families remain, fail closed.

Do not silently pick one by array order.

---

# 12. Exercise-family reconciliation

Independently derive the live mapping for all 37 exact levels.

For each contract record:

- current canonical safety cue profile,
- normal V2.1 family,
- parent family,
- absorbed families,
- separate family cue if due,
- reactive cue ids deferred,
- setup model,
- first-use sequence position,
- remaining implementation blockers.

## Important source-truth cases

Verify carefully:

### Chair-as-seat

Examples likely include sit-to-stand variants and seated movements.

Do not classify a chair used only as fingertip support as `chair_seat`.

### Balance support

Balance family subsumes generic support.

### Step-up

Step family subsumes generic support.

Preserve the approved step-up exact instruction and alternation semantics.

### Door-anchor work

Door-anchor family subsumes long-band family.

Do not speak both.

### Handheld/foot-anchored band

Use long-band family where the exact instruction does not absorb it.

### Seated band row

Reconcile chair seating plus foot-anchored band truthfully.

At most one separate family cue may be emitted.

Any secondary requirement must be absorbed explicitly by the exact instruction or remain a blocker.

### Mini-band lateral walk

No separate safety-family cue.

The exact instruction states above-knees placement and controlled steps.

### Floor

Use the completed canonical floor gate and floor session memory.

Do not repeat transfer warnings.

### Supported exercises

Generic support is emitted only if no specific family applies and the exact instruction does not already include support proximity.

### Exercises with no family

Do not invent a safety cue merely to make every exercise speak one.

---

# 13. Sequence-planner integration

Update:

```text
planTrainingVoiceSequenceV21(...)
```

to use the live safety plan and canonical session memory.

## Session entry

Plan:

```text
training-intro-v21
safe-session-start-v21
```

This is one required tracked session-entry sequence.

No equipment detail or set count appears here.

## First-use ordinary standing setup

Canonical order:

```text
transition/orientation
visibility
exact instruction
side setup if required
separate family cue if due and not material-first
actual start position
final-position readiness if required
target
countdown
```

## First-use material setup

For chair, floor, step, band, door anchor, or equivalent:

```text
transition/equipment context
separate family cue if due
exact instruction
side setup if required
user assumes actual start position
final-position readiness if required
target
countdown
```

If the family is absorbed:

- omit the separate cue,
- keep the exact instruction in its normal place,
- mark the family complete only after that required instruction completes.

## Later set/round

Plan:

```text
concise later-set reminder
current side/lead context if required
current target if required
fresh countdown
```

No universal or equipment-family cue.

## New exercise in same family

- exact first-use instruction still plays,
- family cue does not repeat.

## New exercise in new family

- family cue may play once.

## Repeat Instructions

Plan:

- exact instruction,
- current side/lead context,
- current target.

Do not include:

- universal safety,
- an already introduced family,
- a capability question,
- total set count,
- unrelated equipment safety.

## Reactive safety

Do not insert deferred reactive safety cue ids into normal first-use sequences.

---

# 14. Live runtime integration

Extend the existing default-closed `TrainingVoiceRuntimeV21` rather than creating a second voice runtime.

Use `VoiceChannel.speakTracked` or the existing tracked adapter.

## Required scopes

Use stable semantic scopes, for example:

```text
training:session:entry
training:item:<itemId>:first-use
training:item:<itemId>:set:<setIndex>
training:item:<itemId>:repeat
```

## Session entry

- run once before first item setup,
- required,
- tracked,
- blocks progression,
- marks universal safety completed only on full completion.

## First-use safety obligation

- run inside the required setup sequence,
- tracked,
- blocks countdown,
- marks family introduced only on full completion.

## Failure

For missing asset, resolver failure, player failure, interruption, cancellation, or timeout:

- do not mark obligation complete,
- do not enter countdown,
- preserve a visible internal error/retry state,
- do not fall back to broad legacy audio inside the V2.1 session,
- retain legacy whole-session fallback only through runtime selection before the session begins.

Full control/recovery voice is later; this task must at least fail closed and expose structured state.

## State exit

- cancel the old scope,
- ignore stale completion,
- do not introduce a family from an old item.

## Mounted voice change

- cancel the required sequence,
- rebuild/switch through the existing voice lifecycle,
- replay the entire current required sequence in the new voice,
- do not mark safety complete from the old request.

## No dual authority

In V2.1 internal mode:

- normal legacy atomic safety voice updates must be suppressed,
- V2.1 family safety is the sole normal safety voice authority.

In legacy mode:

- current atomic safety behavior remains unchanged.

Do not partially combine them.

---

# 15. Training runtime gating

Connect the safety runtime to the actual internal/default-closed training path.

Required trace:

```text
generated final exercise
→ canonical SafetyCueProfile
→ pinned V2.1 safety plan
→ TrainingSessionPlayer internal V2.1 mode
→ session-entry safety
→ item setup safety
→ tracked completion
→ session safety memory update
→ countdown eligibility
→ persistence/restore
```

## Selection rule

The V2.1 internal path may require:

- Training Voice V2.1 feature enabled,
- internal readiness capability injected,
- valid contract,
- valid target plan,
- valid side/laterality plan,
- valid final-position plan,
- valid safety plan,
- current safety snapshot,
- complete test asset bindings,
- no legacy voice owner.

Normal user routing remains legacy because audio and global behavior are false.

## No half activation

Enabling only a safety feature flag must not:

- suppress legacy safety,
- emit logical V2.1 cues without assets,
- or mix two safety systems.

Prefer no separate feature flag if the existing V2.1 runtime gate is sufficient.

If a narrow internal flag is necessary, default it off and require full internal V2.1 readiness.

---

# 16. Generated, manual, Explore, and substitution parity

Safety planning must use the final selected exercise.

Cover:

- normal generated main-plan session,
- short session,
- restart session,
- supporting session,
- readiness scaling,
- pain substitution,
- equipment substitution,
- equipment skip,
- manual ladder practice,
- Explore ladder start,
- Explore preset start,
- restored generated plan.

## Requirements

- A substituted exercise gets its own family.
- An omitted exercise introduces no family.
- Manual/Explore uses the same planner when internal V2.1 is injected.
- Current safety eligibility and credit rules remain unchanged.
- Optional/hidden release policy remains unchanged.
- No family plan makes an ineligible exercise eligible.
- Current safety snapshot remains canonical.
- Stale snapshot blocks/replans the V2.1 path.

---

# 17. Persistence and restore

Persist the V2.1 safety session memory only where current active training state requires it.

At minimum preserve:

- memory schema version,
- universal safety completion,
- introduced nonfloor families,
- canonical floor session memory,
- current runtime mode,
- current required safety scope/epoch only as safe restart metadata,
- generated item safety-plan fingerprint.

## Restore rules

- completed obligations remain completed,
- in-flight obligations do not become completed,
- stale callbacks are ignored,
- malformed memory fails closed,
- safety-plan fingerprint mismatch prevents V2.1 continuation,
- legacy session remains legacy,
- restore does not replay every family,
- restore does not skip an uncompleted required obligation.

## Backend

Use additive compact JSON only if current active training state is already synchronized.

Do not add a remote migration unless required by current architecture.

Do not execute remote schema changes.

---

# 18. Reactive safety handoff

Create a typed, auditable handoff for current safety cues that are not normal family narration.

At minimum classify:

- active stop-if-equipment-shifts cues,
- band tension/release warnings,
- support movement,
- tracking pause/reset,
- active pain/dizziness stop behavior,
- recovery setup cues,
- repeated-set reminders.

This task does not implement their V2.1 runtime speech.

They must remain:

- active in the legacy path,
- represented as deferred reactive requirements,
- and blockers under `IR-VOICE-TRAINING-CONTROLS` or `IR-VOICE-TRAINING-RECOVERY` where necessary.

Do not remove legacy assets or current safety profile fields.

---

# 19. Asset requirements

Update logical safety asset requirements.

At minimum include:

```text
safe-session-start-v21
equip-chair-stable-v21
equip-support-close-v21
equip-balance-support-v21
equip-step-stable-v21
equip-long-band-v21
equip-door-anchor-v21
equip-floor-transition-v21
```

For each record:

- exact script,
- category,
- policy,
- requiredness,
- family,
- current candidate key,
- current candidate script,
- Clara exists,
- Marcus exists,
- semantic match,
- reuse decision,
- generation required later,
- exercise contracts using it,
- absorption alternatives,
- timing budget.

Allowed decisions:

```text
reuse_exact_existing_pair
new_pair_required
existing_pair_script_mismatch
not_required_because_absorbed
conditional_legacy_only
```

Do not:

- add pending keys to the physical manifest,
- create placeholder files,
- weaken audio verification,
- alias a verbose legacy safety pack to one concise V2.1 family key.

---

# 20. Timing budgets

Recompute logical composed timelines using current exact contract scripts.

Budgets:

```text
training intro + universal safety:
target 12,000 ms
hard max 16,000 ms

ordinary first-use pre-countdown:
target 12,000 ms
hard max 16,000 ms

complex equipment first-use pre-countdown:
target 16,000 ms
hard max 20,000 ms

later-set reminder:
target 4,000 ms
hard max 6,000 ms

repeat instructions:
target 10,000 ms
hard max 14,000 ms
```

Model:

- Clara and Marcus estimates/current exact assets where available,
- 0 ms gaps,
- 100 ms gaps,
- 250 ms gaps,
- cold family first use,
- warm already-introduced family,
- absorbed family,
- repeat instructions,
- later set.

Requirements:

- hard-max failures: 0,
- duplicate family cues: 0,
- more than one family cue per setup: 0,
- universal repeated in item setup: 0.

Do not call estimates physical-duration verification for ungenerated assets.

---

# 21. Runtime readiness reconciliation

After genuine completion:

## Remove

```text
IR-VOICE-SAFETY-SUBSUMPTION
```

from every affected current production contract and logical cue row.

## Preserve where true

```text
IR-VOICE-AUDIO-ASSETS
IR-VOICE-TRAINING-CONTROLS
IR-VOICE-TRAINING-RECOVERY
IR-VOICE-NEW-CUE-SCHEMA
```

and any other current unresolved dependency.

## Add/derive

A safety-specific readiness value, such as:

```text
TRAINING_VOICE_V2_1_SAFETY_READY = true
```

or an equivalent derived property.

Expected project state:

```text
Safety integration software ready:
true

Training Voice V2.1 global behaviour ready:
false

Training Voice V2.1 audio ready:
false

Training Voice V2.1 feature default:
off

V2.1 selectable exercises:
0
```

Do not set global behavior ready true merely because safety is complete.

---

# 22. Diagnostics

Add bounded, privacy-safe diagnostics for:

- safety plan derived,
- source safety profile fingerprint,
- universal sequence requested/completed/failed,
- family selected,
- parent family subsumed,
- family absorbed,
- family already introduced,
- family request completed/failed,
- family memory updated,
- stale safety callback ignored,
- floor memory delegated,
- legacy safety suppressed in internal mode,
- V2.1 safety suppressed in legacy mode,
- safety snapshot mismatch,
- restore memory accepted/rejected.

Do not log:

- raw video,
- landmarks,
- health result values,
- account ids,
- user name,
- free-text medical notes.

---

# 23. Required tests

Do not weaken or delete existing tests.

## 23.1 Authority and migration

1. Existing SafetyCueProfile remains canonical.
2. V2.1 family plan cannot make an exercise eligible.
3. Every current canonical safety cue has one migration classification.
4. No active cue is unclassified.
5. Every current exact exercise has one family or `none`.
6. No duplicate safety authority exists.
7. Safety profile schema/fingerprint is retained.
8. Stale profile blocks the internal V2.1 path.
9. Legacy safety profile tests remain green.

## 23.2 Family hierarchy

1. Balance support subsumes generic support.
2. Step/stair subsumes generic support.
3. Door anchor subsumes long band.
4. Floor subsumes generic support.
5. Mini-band emits no separate family cue.
6. Chair may be absorbed explicitly.
7. Generic support may be absorbed explicitly.
8. Unknown family fails closed.
9. Multiple unresolved families fail closed.
10. Family selection is independent of registry iteration order.

## 23.3 Contract mapping

For all 37 contracts:

1. Family mapping exists.
2. Mapping matches live equipment/support/setup truth.
3. Exact absorption metadata is explicit.
4. Reactive cue ids are retained.
5. Setup model is compatible.
6. No floor family without floor eligibility.
7. Optional release policy is unchanged.
8. Final substituted exercise determines the plan.
9. No broad inaccurate family fallback.

## 23.4 Universal safety

1. Session entry plans intro + universal.
2. Universal is required.
3. Universal blocks first item progression.
4. Full completion marks it complete.
5. Request dispatch does not mark it complete.
6. Partial playback does not mark it complete.
7. Missing asset does not mark it complete.
8. Interruption does not mark it complete.
9. Cancellation does not mark it complete.
10. New session resets it.
11. Valid restore preserves it.
12. Malformed restore fails closed.
13. Universal is never inserted into item setup.
14. Universal is absent from Repeat Instructions.

## 23.5 Family completion memory

1. Cold family first use plans one cue.
2. Completed cue marks family introduced.
3. Failed cue does not mark family introduced.
4. Cancelled cue does not mark family introduced.
5. Stale completion cannot mark a later item’s family.
6. Later set does not repeat.
7. New exercise same family does not repeat.
8. New family introduces once.
9. New session resets.
10. Restore preserves introduced families.
11. Duplicate introduced entries normalize safely.
12. At most one separate family cue per setup.

## 23.6 Absorption

1. Absorbed family emits no separate cue.
2. Exact instruction remains required.
3. Family is marked introduced only after instruction completion.
4. Instruction failure leaves family unintroduced.
5. Mini-band placement is represented once.
6. Chair absorption is correct.
7. Generic-support absorption is correct.
8. No separate family and absorbed duplicate coexist.

## 23.7 Floor bridge

1. Floor-family lookup delegates to TrainingFloorSessionMemory.
2. No duplicate floor flag exists.
3. First floor entry plans transition.
4. Contiguous floor item does not repeat.
5. Later set does not repeat.
6. Leaving/returning follows documented behavior.
7. Restore preserves floor introduction.
8. General family memory cannot disagree with floor memory.
9. Floor ineligible item cannot plan floor family.
10. Floor capability remains profile-owned.

## 23.8 Sequence planner

1. Session-entry sequence is deterministic.
2. Ordinary first-use order is correct.
3. Material first-use order is correct.
4. Side cue ordering remains correct.
5. Final-position ordering remains correct.
6. Target follows final position.
7. Later set omits safety.
8. Repeat Instructions omits safety.
9. Same-family new exercise omits family cue.
10. New-family exercise includes family cue.
11. No total set count.
12. No reactive cue inserted into normal setup.
13. No more than one normal family cue.

## 23.9 Runtime tracked speech

1. Session safety uses tracked required speech.
2. Family safety uses tracked required speech.
3. Missing safety binding blocks countdown.
4. Playback failure blocks countdown.
5. Timeout blocks countdown.
6. State exit cancels request.
7. Stale completion is ignored.
8. Voice change replays full required sequence.
9. Old voice completion cannot update memory.
10. Only one safety voice authority is active.
11. Legacy path remains unchanged with V2.1 off.
12. Internal V2.1 path suppresses legacy normal safety voice.

## 23.10 Generated/manual/Explore parity

1. Main-plan final item gets correct family.
2. Short session gets correct family.
3. Restart session gets correct family.
4. Supporting session gets correct family.
5. Pain substitution uses substituted family.
6. Equipment substitution uses substituted family.
7. Skipped item introduces no family.
8. Manual practice uses same planner.
9. Explore ladder uses same planner.
10. Explore preset uses same planner.
11. Restored item uses stored plan.
12. Stale plan fails closed.
13. Safety family does not alter credit/progression.

## 23.11 Persistence/backend

1. Universal completion round-trips locally.
2. Introduced families round-trip locally.
3. Floor memory round-trips without duplication.
4. In-flight request does not restore as completed.
5. Plan fingerprint round-trips.
6. Backend compact state preserves memory where supported.
7. Malformed family id fails safely.
8. Richer current memory is not overwritten by sparse stale state.
9. Legacy session remains legacy.
10. No remote migration is required unless explicitly documented.

## 23.12 Runtime readiness

1. `IR-VOICE-SAFETY-SUBSUMPTION` remaining count is zero after completion.
2. Safety-plan-ready is true for all current contracts.
3. Audio blockers remain.
4. Control/recovery blockers remain where true.
5. Global behavior ready remains false.
6. Audio ready remains false.
7. V2.1 selectable count remains zero.
8. Balance V2 remains closed.
9. Step-up remains closed.
10. Floor V2.1 remains closed.
11. Physical manifest is unchanged.

## 23.13 Timing

1. Intro/universal is below hard max.
2. Every ordinary first-use scenario is below hard max.
3. Every complex first-use scenario is below hard max.
4. Later-set scenarios are below hard max.
5. Repeat scenarios are below hard max.
6. Cold/warm family variants are modeled.
7. Absorbed-family variants are modeled.
8. Clara/Marcus estimates do not alter sequence outcome.
9. No duplicate family cues appear.

## 23.14 Regression

Re-run relevant suites for:

- canonical safety profiles,
- safety snapshots/start validation,
- exercise registry/release policy,
- workout generation,
- session planning,
- manual/Explore,
- training session player,
- TrainingSessionScreen,
- Training Voice V2.1,
- both-sides rounds,
- step-up runtime/evidence closure,
- floor readiness,
- progression/valid time,
- serialization/backend,
- MPV2,
- measurement side,
- Balance V2.

Preserve completed-foundation P0/P1/P2 zeros.

---

# 24. Required audit scenarios

Create at least these canonical scenarios.

## Session universal

- `session_entry_universal_safety_once`
- `universal_not_marked_on_dispatch`
- `universal_completed_after_tracked_completion`
- `universal_missing_asset_blocks`
- `universal_interrupted_not_completed`
- `universal_cancelled_not_completed`
- `universal_valid_restore_no_repeat`
- `universal_malformed_restore_fails_closed`
- `new_session_resets_universal`

## Hierarchy

- `balance_subsumes_generic_support`
- `step_subsumes_generic_support`
- `door_anchor_subsumes_long_band`
- `floor_subsumes_generic_support`
- `mini_band_absorbs_family`
- `chair_instruction_absorbs_family`
- `generic_support_instruction_absorbs_family`
- `multiple_unresolved_families_block`
- `unknown_family_blocks`

## Family memory

- `cold_family_first_use_once`
- `family_not_marked_on_dispatch`
- `family_completed_after_sequence`
- `family_failure_not_introduced`
- `family_cancel_not_introduced`
- `same_family_new_exercise_no_repeat`
- `different_family_new_exercise_introduces`
- `later_set_no_family_repeat`
- `repeat_instructions_no_family`
- `new_session_resets_families`
- `restore_preserves_families`
- `stale_family_callback_ignored`

## Floor

- `floor_family_uses_floor_memory`
- `first_floor_entry_transition`
- `contiguous_floor_item_no_repeat`
- `later_floor_set_no_repeat`
- `floor_ineligible_no_family`
- `floor_restore_no_duplicate`
- `floor_memory_cannot_disagree`

## Exercise families

- `chair_seat_contract_mapping`
- `balance_contract_mapping`
- `step_up_contract_mapping`
- `long_band_contract_mapping`
- `door_anchor_contract_mapping`
- `mini_band_contract_mapping`
- `floor_contract_mapping`
- `generic_support_contract_mapping`
- `no_family_contract_mapping`
- `seated_band_row_multi_requirement_resolution`

## Paths and substitutions

- `main_plan_safety_plan`
- `short_session_safety_plan`
- `restart_session_safety_plan`
- `supporting_session_safety_plan`
- `pain_substitution_uses_final_family`
- `equipment_substitution_uses_final_family`
- `skipped_item_introduces_no_family`
- `manual_practice_safety_plan`
- `explore_ladder_safety_plan`
- `explore_preset_safety_plan`
- `stale_safety_snapshot_blocks`

## Runtime isolation

- `legacy_mode_uses_legacy_safety_only`
- `internal_v21_uses_family_safety_only`
- `no_legacy_v21_double_speak`
- `missing_family_asset_blocks_countdown`
- `family_voice_change_replays_sequence`
- `old_voice_completion_ignored`
- `state_exit_cancels_family_sequence`

## Timing/defaults

- `session_entry_timing_budget`
- `ordinary_first_use_timing_budget`
- `complex_first_use_timing_budget`
- `later_set_timing_budget`
- `repeat_instructions_timing_budget`
- `training_voice_remains_default_closed`
- `training_voice_audio_remains_false`
- `training_voice_behavior_remains_false`
- `balance_v2_remains_closed`
- `step_up_remains_closed`
- `floor_v21_remains_closed`
- `physical_manifest_unchanged`

The audit may add scenarios.

---

# 25. Audit evidence quality

The audit must be grounded in current production source.

Requirements:

1. Derive the 37-contract mapping from the current production registry.
2. Derive current blockers from current production contracts/readiness.
3. Execute current pure safety resolver/planner.
4. Execute current sequence planner.
5. Execute current runtime with fake tracked voice bindings where physical assets are pending.
6. Execute current local serializer/restore functions.
7. Execute current backend mapper where active state is synchronized.
8. Derive metrics from written scenario/family/migration/timeline rows.
9. Reopen generated CSV/JSON artifacts and independently recompute counts.
10. Do not assign defect counts directly to zero.
11. Verdict must derive from completion gates.
12. Failed scenarios remain in artifacts.
13. Estimate-only timing rows must be labelled as estimates.
14. Physical/listening uncertainty is P3, not silently closed.

Do not create artificial scenario volume without executable evidence.

---

# 26. Required artifacts

Create:

1. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_IMPLEMENTATION.md`
2. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.md`
3. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.json`
4. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_FAMILY_MATRIX.csv`
5. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_CUE_MIGRATION.csv`
6. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_RUNTIME_SCENARIOS.csv`
7. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_COMPOSED_TIMELINES.csv`
8. `docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_ASSET_REQUIREMENTS.csv`
9. `docs/audits/HALE_VOICE_PROJECT_POST_SAFETY_INTEGRATION_HANDOFF.md`

You may add one audit-only harness:

- `scripts/audits/audit-training-voice-v21-safety-integration.mjs`

Do not overwrite prior artifacts.

## Family matrix columns

Use columns similar to:

```text
exerciseId,displayName,releaseStatus,setupModel,canonicalSafetyProfileSchema,canonicalSafetyCueIds,normalFamily,parentFamily,subsumedFamilies,fulfilment,separateLogicalCueKey,absorbedIntoCueKey,reactiveCueIdsDeferred,sourceSafetyFingerprint,removedBlockers,remainingBlockers,safetyPlanReady,runtimeStatus,notes
```

## Migration CSV columns

Use columns similar to:

```text
legacyCueId,legacyScript,legacyTier,exerciseOrGlobalScope,currentRuntimeReachability,v21Classification,v21DestinationKey,v21Family,absorbedIntoCueKey,deferredRequirementId,legacyPathPreserved,retireLater,reason,sourceFiles,testCoverage,notes
```

## Runtime scenario columns

Use columns similar to:

```text
scenarioId,category,exerciseId,exposure,runtimeMode,universalBefore,introducedFamiliesBefore,floorIntroducedBefore,resolvedFamily,fulfilment,separateCueKey,plannedCueKeys,trackedOutcome,universalAfter,introducedFamiliesAfter,floorIntroducedAfter,countdownAllowed,legacySafetyEmitted,v21SafetyEmitted,passed,testCoverage,notes
```

## Timeline columns

Use columns similar to:

```text
scenarioId,exerciseId,voiceId,gapMs,exposure,budgetClass,cueKeys,scripts,assetStatus,estimatedSpeechMs,estimatedTotalMs,targetMs,hardMaxMs,passesTarget,passesHardMax,familyCueCount,universalCueCount,notes
```

## Asset requirements columns

Use columns similar to:

```text
logicalCueKey,exactScript,category,policyId,family,exerciseIds,currentCandidateKey,currentCandidateScript,claraExists,marcusExists,semanticMatch,reuseDecision,generationRequiredLater,requiredForVoiceFirst,budgetClass,notes
```

---

# 27. Audit metrics

Report at minimum:

```text
liveExerciseCount
contractCount
contractsWithSafetyPlan
contractsWithoutSafetyPlan

legacyCanonicalSafetyCueCount
classifiedLegacySafetyCueCount
unclassifiedLegacySafetyCueCount

familyNoneContractCount
chairFamilyContractCount
genericSupportFamilyContractCount
balanceFamilyContractCount
stepFamilyContractCount
longBandFamilyContractCount
doorAnchorFamilyContractCount
miniBandFamilyContractCount
floorFamilyContractCount

universalRepeatCount
universalPrematureCompletionCount
universalSilentContinuationCount

duplicateFamilyEmissionCount
multipleFamilyCueSetupCount
subsumptionViolationCount
absorptionDuplicateCount
familyPrematureCompletionCount
familyFailureMarkedCompleteCount
staleFamilyCallbackMutationCount

laterSetFamilyRepeatCount
repeatInstructionsSafetyRepeatCount
sameFamilyExerciseRepeatCount

floorMemoryAuthorityCount
duplicateFloorMemoryAuthorityCount
floorMemoryMismatchCount
floorTransitionRepeatCount

legacyV21DoubleSafetyCount
legacyBehaviorChangeWithFlagOffCount

generatedPathSafetyMismatchCount
manualPathSafetyMismatchCount
explorePathSafetyMismatchCount
substitutionWrongFamilyCount
staleSafetyPlanStartCount

localSafetyMemoryRoundTripFailureCount
backendSafetyMemoryRoundTripFailureCount
safetyPlanFingerprintDriftCount

irVoiceSafetySubsumptionRemainingCount
safetyPlanNotReadyCount
safetyReadyValue
globalBehaviorReadyValue
audioReadyValue
v21SelectableExerciseCount

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

# 28. Findings and verdicts

## P1 examples

- required universal/family safety silently skipped while countdown proceeds,
- legacy and V2.1 safety both speak in one setup,
- stale callback marks a family introduced,
- floor family memory disagreement bypasses required transition,
- unclassified current safety requirement disappears from the V2.1 plan.

## P2 examples

- one generated/manual/Explore path does not use the live safety plan,
- one contract has no valid safety mapping,
- persistence loses safety memory,
- timing exceeds hard max,
- `IR-VOICE-SAFETY-SUBSUMPTION` remains after claimed completion,
- runtime integration is model-only rather than connected.

## P3

- physical-device audio timing deferred,
- human listening waived,
- ungenerated physical V2.1 safety assets pending.

Issue exactly one verdict.

### `TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_SOFTWARE_COMPLETE`

Use when:

- all 37 contracts map correctly,
- live internal runtime integration is complete,
- memory/gating/isolation pass,
- the safety blocker is removed,
- only audio, controls/recovery, listening, and device work remain.

### `TRAINING_VOICE_V2_1_SAFETY_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING`

Use when pure mapping/planning passes but the live internal runtime does not consume it end to end.

### `TRAINING_VOICE_V2_1_SAFETY_REMEDIATION_REQUIRED`

Use when a software safety, de-duplication, memory, path-parity, or persistence gate fails.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when current/concurrent source cannot be reconciled safely.

Expected successful verdict:

```text
TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_SOFTWARE_COMPLETE
```

Do not call Training Voice V2.1 globally complete.

---

# 29. Completion gates

## Authority and mapping

```text
live contracts = current registry count
contracts without safety plan = 0
unclassified canonical safety cues = 0
duplicate safety authority = 0
```

## Universal safety

```text
universal repeat = 0
premature universal completion = 0
silent continuation after universal failure = 0
```

## Family safety

```text
duplicate family emissions = 0
more than one family cue per setup = 0
subsumption violations = 0
absorption duplicates = 0
premature family completion = 0
failed family marked complete = 0
stale family callback mutation = 0
```

## Repetition

```text
later-set family repeats = 0
Repeat Instructions safety repeats = 0
same-family new-exercise repeats = 0
```

## Floor

```text
floor memory authorities = 1
duplicate floor memory authorities = 0
floor memory mismatches = 0
duplicate floor transitions = 0
```

## Isolation

```text
legacy/V2.1 double safety = 0
legacy behavior change with flag off = 0
```

## Path parity

```text
generated mismatches = 0
manual mismatches = 0
Explore mismatches = 0
substitution wrong-family cases = 0
stale safety-plan starts = 0
```

## Persistence

```text
local round-trip failures = 0
backend round-trip failures = 0
safety-plan fingerprint drift = 0
```

## Runtime readiness

```text
IR-VOICE-SAFETY-SUBSUMPTION remaining = 0
safety-plan-not-ready contracts = 0
safety ready = true
global behavior ready = false
audio ready = false
V2.1 selectable exercises = 0
```

## Timing/integrity

```text
hard-max timing failures = 0
physical manifest changes = 0
audio changes = 0
audio generated = false
external speech/audio API called = false
```

## Defaults

- Training Voice V2.1 remains off.
- Balance V2 remains closed/audio pending.
- Step-up alternation remains off.
- Floor V2.1 remains off.
- Legacy safety remains the live default.
- Human listening remains waived.
- Physical QA remains deferred.

---

# 30. Implementation report structure

Use:

# Hale Training Voice V2.1 Safety Integration Implementation

## 1. Result

## 2. Current Safety Architecture Reconciliation

## 3. Canonical Authority Boundary

## 4. Atomic Cue Migration Classification

## 5. Safety Family Mapping Across 37 Contracts

## 6. Subsumption and Absorption

## 7. Universal Safety Runtime

## 8. Family Session Memory

## 9. Floor Memory Bridge

## 10. Sequence Planner Integration

## 11. Live Tracked Runtime Integration

## 12. Generated, Manual, Explore, and Substitution Parity

## 13. Persistence and Restore

## 14. Reactive Safety Handoff

## 15. Asset Requirements

## 16. Timing Budgets

## 17. Runtime Readiness and Blocker Reconciliation

## 18. Feature Flags and Legacy Isolation

## 19. Diagnostics

## 20. Tests

## 21. Audit Results

## 22. Remaining Device/Audio Boundaries

## 23. Files Changed

## 24. Worktree Integrity

## 25. Exact Next Phase

---

# 31. Handoff

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_SAFETY_INTEGRATION_HANDOFF.md`

If successful, the exact next task is:

```text
Training Voice V2.1 controls, progress, and recovery runtime integration
```

Include:

- canonical safety authority,
- safety-plan API,
- session-memory API,
- family-completion API,
- floor-memory bridge,
- runtime scope/gating API,
- current family matrix,
- removed blocker counts,
- remaining control/recovery/audio blockers,
- deferred reactive safety cue mapping,
- feature/default state,
- tests that must remain green.

Later order:

1. controls, progress, and recovery runtime integration
2. Micro-Check Voice V2.1
3. final cue schema/manifests
4. consolidated Clara/Marcus generation, including Balance V2
5. whole-project static/runtime audit
6. final consolidated physical-device QA

Do not implement controls/progress/recovery in this task.

---

# 32. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run focused Jest suites covering:

- canonical safety profiles,
- safety definitions/mappings,
- safety snapshots/start validation,
- Training Voice V2.1 safety policy,
- contract registry/readiness,
- sequence planner,
- tracked runtime,
- session player,
- TrainingSessionScreen,
- workout generation,
- manual/Explore,
- substitution paths,
- floor session memory,
- local serialization,
- backend training state.

Run regression suites for:

- both-sides rounds,
- step-up runtime/evidence closure,
- floor readiness,
- progression/valid time,
- MPV2,
- measurement side,
- Balance V2.

Run the full Jest suite where practical.

Run the audit harness.

Parse generated JSON/CSV artifacts.

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

# 33. Final Codex response

When finished, respond with:

- summary of implementation,
- paths to all nine generated artifacts,
- audit harness path,
- all production files changed/added,
- all test files changed/added,
- confirmation that no audio changed or was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether the worktree was already dirty,
- canonical safety authority,
- live exercise/contract count,
- canonical legacy safety cue count,
- classified/unclassified legacy cue count,
- family distribution across contracts,
- universal safety completion rule,
- family completion rule,
- floor memory bridge,
- subsumption rules implemented,
- absorption rules implemented,
- generated/manual/Explore behavior,
- runtime tracked-speech behavior,
- behavior after missing/failing safety audio,
- persistence/restore behavior,
- legacy/V2.1 isolation behavior,
- removed `IR-VOICE-SAFETY-SUBSUMPTION` count,
- remaining blockers,
- safety-ready value,
- global behavior-ready value,
- audio-ready value,
- V2.1 selectable count,
- universal repeat count,
- duplicate-family count,
- multi-family setup count,
- subsumption violation count,
- absorption duplicate count,
- premature-completion count,
- stale-callback count,
- later-set/repeat safety-repeat counts,
- floor-memory mismatch count,
- path-parity mismatch counts,
- local/backend round-trip failure counts,
- timing hard-max failure count,
- P0/P1/P2/P3 counts,
- verdict,
- whether controls/progress/recovery is unblocked,
- exact next task,
- `npm run verify:audio` result,
- typecheck result,
- focused/full test results,
- audit recomputation result,
- concise confidence statement.

Do not generate audio, enable Training Voice V2.1, enable Balance V2, enable step-up alternation or floor V2.1 by default, implement controls/progress/recovery, or perform physical-device QA in this task.
