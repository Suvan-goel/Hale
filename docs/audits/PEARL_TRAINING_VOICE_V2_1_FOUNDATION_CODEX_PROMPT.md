# Codex Prompt: Pearl Training Voice V2.1 Foundation and Exact 37-Level Mapping

Read this entire prompt before changing anything.

Pearl’s check-up voice/runtime and measurement foundations are now substantially complete at the static/software level.

Current verified state includes:

- MPV2 required-speech gating, audible countdown/go, stage-scoped cancellation, tracking recovery, retry narration, and mounted Clara/Marcus switching
- measurement-side persistence and explicit opposite-side fallback
- protocol metadata and cross-protocol trend suppression
- eyes-open Balance Protocol V2 software:
  - `home_balance_eyes_open_v2`
  - protocol version `2`
  - battery `movement_profile_v2_battery` version `2`
  - four eyes-open stages
  - zero default eyes-closed stages
  - old MPV2 single-leg protocol preserved
- Balance V2 status:
  - `EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE_AUDIO_PENDING`
  - 11 reusable existing cue pairs
  - 9 pending exact cue pairs
  - feature remains closed by default while audio is pending
- physical Android/iOS QA remains deliberately deferred
- human listening remains waived rather than completed

The exact next phase is:

```text
Training Voice V2.1 implementation foundation and exact instruction mapping
for all 37 registered exercise levels
```

This task must implement the canonical software source of truth for Training Voice V2.1 and connect a safe, default-closed runtime foundation to the current training flow.

It must **not** generate audio or pretend that pending behavioural dependencies are already implemented.

---

# 1. Existing source artifacts

Read and use these artifacts.

## Current balance/check-up status

- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_AUDIT.md`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_AUDIT.json`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_SCENARIOS.csv`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md`, if present
- `scripts/audits/audit-eyes-open-balance-v2.mjs`

Preserve:

```text
Balance V2 P0/P1/P2/P3: 0 / 0 / 0 / 1
Balance V2 live default: false
Balance V2 audio ready: false
```

## Approved Voice V2.1 specification

- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

The approved founder decisions remain authoritative:

- `FD-001`: unilateral/asymmetric training uses a both-sides round
- `FD-002`: reliable, comfortable measurement side is persisted
- `FD-003`: default home balance is eyes-open only
- `FD-004`: initial mini-band lateral walk uses the band above the knees
- `FD-005`: step-ups alternate the leading leg every repetition, 12 total
- `FD-006`: do not speak total set count during setup
- `FD-007`: add a floor-transfer readiness gate

Do not reopen these decisions.

## Voice/runtime foundation

- current `src/audio/voicePlayer.ts`
- current MPV2 tracked-speech/runtime helpers
- MPV2 voice-runtime implementation/audit artifacts
- current preflight/readiness logic
- current training voice audits and asset-duration inventory

Use the completed tracked playback contract as the preferred architectural reference, but do not force a check-up-specific state model into training where it does not fit.

## Founder review status for this phase

Use the following explicit status:

```text
V2.1 script status for software implementation:
founder_assumed_accepted_for_implementation

Human listening status:
waived, not completed

Audio approval:
not granted
```

Use V2.1 scripts as the implementation baseline.

Do not call them human-listened or audio-approved.

---

# 2. Objective

Implement a default-closed Training Voice V2.1 foundation that guarantees:

1. Every currently registered exact training level has one canonical voice contract.
2. Exercise instructions describe the exact level, not a broad family approximation.
3. First-use, later-set, target, side, progress, safety, final-position, and repeat-instructions behaviour are represented explicitly.
4. No total set-count setup cue exists.
5. Bilateral exercises never receive a side schedule.
6. Side-dependent exercises carry explicit left/right variants and behavioural dependency metadata.
7. Current unresolved runtime dependencies are represented honestly rather than silently approximated.
8. Training target speech is derived from the actual current prescription.
9. Unsupported target values fail closed for the V2.1 path rather than producing incorrect speech.
10. Safety follows a typed most-specific-wins family model.
11. An exact setup instruction may absorb a safety family and prevent duplicate narration.
12. Every logical cue key is stable and unique.
13. Logical pending cue keys remain separate from the physical runtime `VoiceCueId`/asset manifest until audio exists.
14. A deterministic sequence planner can produce the intended spoken order for every exact level.
15. A training runtime foundation can use tracked required speech once assets and behavioural prerequisites are ready.
16. The current legacy training voice path remains unchanged and is the live rollback/default.
17. The V2.1 path cannot activate when:
    - required audio is missing,
    - an exercise behaviour prerequisite is unresolved,
    - or a contract cannot represent the live prescription truthfully.
18. Old and new voice systems never speak simultaneously for one session.
19. No audio file is generated, changed, moved, or deleted.
20. No external speech/audio API is called.
21. Balance V2 remains software-complete/audio-pending and unchanged.
22. Physical-device QA remains deferred.
23. The exact next phase is clearly identified.

This is an implementation phase, not another prose-only specification exercise.

---

# 3. Strict scope

## In scope

- Current training/exercise registry reconciliation.
- One canonical Training Voice V2.1 contract type.
- One immutable 37-level contract registry.
- Stable logical V2.1 cue keys and exact scripts.
- First-use and later-set mappings.
- Target grammar/planning.
- Side/round metadata.
- Progress-cue policy.
- Final-position/setup model.
- Repeat-instructions plans.
- Pure safety-family resolution and subsumption.
- Session-level universal safety contract.
- Equipment-family first-use memory/planning.
- Runtime-readiness validation.
- Default-closed feature flag and readiness constants.
- A tracked-speech-capable training runtime foundation or adapter.
- Safe legacy/V2.1 path selection.
- Focused tests and audits.
- Pending asset requirements.
- Handoff to the next behavioural implementation phase.

## Out of scope

Do not implement in this task:

- Audio generation.
- ElevenLabs calls.
- Runtime TTS.
- Human listening review.
- Physical-device QA.
- Final physical manifests for nonexistent assets.
- Both-sides training round execution.
- Dose conversion for unilateral/asymmetric work.
- Alternating-leg step-up grader/session execution.
- Floor-transfer gate UI/persistence/substitution.
- Full V2.1 safety narration runtime replacement in live sessions.
- Full training pause/resume/skip/retry/recovery voice completion.
- Micro-check Voice V2.1.
- New check-up audio.
- Enabling Balance V2.
- Enabling Training Voice V2.1.
- Exercise scoring changes.
- Progression changes.
- Exercise release-policy changes.
- Workout prescription changes.
- Set-count changes.
- Medical/normative claims.
- Package installation.
- Lockfile changes.
- Destructive Git operations.

This task may implement pure models and default-closed adapters for later phases, but must not silently change live training programming.

---

# 4. Worktree safety

The worktree is already heavily dirty and contains important uncommitted work.

Before editing:

```bash
git status --short --branch
git diff --name-only
git diff --stat
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- pre-existing relevant changes,
- pre-existing untracked audio and audit files.

Rules:

1. Treat all current modified/untracked files as user-owned.
2. Do not reset, checkout, stash, clean, rebase, or discard anything.
3. Do not overwrite unrelated renderer, protocol, audit, or audio work.
4. Do not delete or rename existing MP3s.
5. Do not regenerate current manifests wholesale.
6. Do not commit or push.
7. If a required file has ambiguous concurrent changes, preserve them and make the smallest safe edit.
8. At the end, distinguish this task’s footprint from pre-existing changes.

---

# 5. Current source to inspect

Inspect current source rather than trusting old line numbers.

## Exercise catalogue and prescriptions

At minimum inspect:

- `src/exercises/index.ts`
- `src/exercises/registry.ts`, if present
- `src/exercises/types.ts`
- `src/exercises/ladders.ts`
- `src/exercises/releasePolicy.ts`
- every exact exercise definition
- `src/exercises/setGraders.ts`
- `src/exercises/common.ts`
- current progression/transition policy
- current equipment and capability gates

## Training runtime

- `src/training/sessionPlayer.ts`
- `src/training/workoutGeneration.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`
- `src/training/progression.ts`
- `src/training/validTimeProgression.ts`
- any current session-plan/item types
- `src/screens/TrainingSessionScreen.tsx`
- relevant `App.tsx` routing/state
- current pause/resume/skip/cancel paths
- current camera readiness integration
- current rep/hold/ROM result paths

## Safety

- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- safety eligibility/gating modules
- pain/readiness substitution logic
- equipment gating
- floor-space/floor capability logic if any

## Audio/runtime

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/profile/voices.ts`
- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- current audio tests
- current MPV2 tracked voice runtime helpers

## Voice specifications/audits

- all V2.1 spec artifacts named above
- current voice cue inventory
- current runtime timeline audit
- current-state reconciliation
- current asset inventory

Search for:

```text
voiceInstructionKeys
instructionKeys
safetyCue
setCount
target
reps
hold
duration
capture
orientation
laterality
side
leadLeg
standingLeg
left
right
floor
door_anchor
mini_band
step-up
sessionPlayer
voice.speak
speakTracked
countdown
last-set
halfway
five-seconds
repeat instructions
```

Follow actual call paths.

---

# 6. Reconcile the current exact registry

Discover the current registered exercise-level list from production.

The expected list is 37 ids:

```text
balance-feet-together-hold
balance-single-leg-hold
balance-tandem-hold
band-pull-apart
chair-supported-split-squat
glute-bridge-hold
glute-bridge-reps
heel-raise-free
heel-raise-supported
hip-hinge-free
hip-hinge-wall
loaded-march
loaded-sit-to-stand
mini-band-lateral-walk
neck-rotation
overhead-press-band
overhead-reach
push-up-incline
push-up-standard
push-up-wall
seated-band-row
seated-hamstring-reach
squat-free
squat-loaded
squat-slow-eccentric
squat-supported
standing-band-row
step-up
sts-cushion
sts-power
sts-slow-eccentric
sts-standard
supported-hip-flexor-stretch
supported-side-step
thoracic-rotation
toe-raise-supported
wall-calf-stretch
```

## Rules

- Independently derive the live list.
- If the list differs:
  - document added, removed, or renamed ids,
  - reconcile the V2.1 contracts to current source,
  - do not force stale ids,
  - use `CURRENT_SOURCE_REBASE_REQUIRED` if the change creates product ambiguity that cannot be resolved safely.
- Preserve current release status.
- Do not promote optional/hidden exercises.
- Do not change the registry count.
- Do not modify exercise programming to fit the voice spec.
- Every current exact id must appear exactly once in the V2.1 contract registry.

---

# 7. Canonical production types

Create a focused production module using repository conventions, such as:

```text
src/training/voiceV21/
  types.ts
  contracts.ts
  targetGrammar.ts
  safetyPolicy.ts
  sequencePlanner.ts
  readiness.ts
  runtime.ts
  index.ts
```

Use fewer files if the repository style prefers it.

A suitable conceptual schema is:

```ts
export type TrainingVoiceLateralityV21 =
  | 'bilateral_simultaneous'
  | 'alternating_within_set'
  | 'bilateral_sequential_within_set'
  | 'both_sides_not_scored_separately'
  | 'both_sides_round_required'
  | 'alternating_lead_leg_each_rep'
  | 'not_applicable';

export type TrainingVoiceSetTypeV21 =
  | 'reps'
  | 'hold'
  | 'timer'
  | 'rom'
  | 'other';

export type TrainingVoiceSetupModelV21 =
  | 'standing_general'
  | 'material_setup'
  | 'chair_setup'
  | 'floor_setup'
  | 'step_setup'
  | 'band_setup'
  | 'balance_setup';

export type TrainingVoiceRuntimeStatusV21 =
  | 'software_ready_audio_pending'
  | 'behavior_dependency_pending'
  | 'conditional_legacy_only';

export type TrainingVoiceImplementationRequirementId =
  | 'IR-VOICE-ROUND-STATE'
  | 'IR-VOICE-DOSE-CONVERSION'
  | 'IR-VOICE-STEP-ALTERNATION'
  | 'IR-VOICE-FLOOR-GATE'
  | 'IR-VOICE-FINAL-POSITION-READINESS'
  | 'IR-VOICE-SAFETY-SUBSUMPTION'
  | 'IR-VOICE-TRAINING-CONTROLS'
  | 'IR-VOICE-TRAINING-RECOVERY'
  | 'IR-VOICE-NEW-CUE-SCHEMA'
  | 'IR-VOICE-AUDIO-ASSETS';

export interface TrainingVoiceLogicalCueV21 {
  key: string;
  exactScript: string;
  category:
    | 'session_intro'
    | 'universal_safety'
    | 'equipment_first_use'
    | 'exercise_first_use'
    | 'exercise_later_set'
    | 'target'
    | 'side_setup'
    | 'side_switch'
    | 'final_position'
    | 'progress'
    | 'rest_transition'
    | 'control'
    | 'recovery'
    | 'completion';
  policyId:
    | 'critical_stop'
    | 'critical_window'
    | 'result_transition'
    | 'instruction'
    | 'setup_recovery'
    | 'low_reassurance';
  requiredForVoiceFirst: boolean;
}

export interface TrainingVoiceExerciseContractV21 {
  exerciseId: string;
  displayName: string;
  releaseStatus: string;
  setType: TrainingVoiceSetTypeV21;
  currentSetCount: number;
  currentTargetSemantics: string;
  orientation: string;
  equipment: string[];
  support: string[];
  laterality: TrainingVoiceLateralityV21;
  setupModel: TrainingVoiceSetupModelV21;

  firstUseCue: TrainingVoiceLogicalCueV21;
  laterSetCue: TrainingVoiceLogicalCueV21;
  targetPlan: TrainingVoiceTargetPlanV21;
  sidePlan: TrainingVoiceSidePlanV21;
  progressPlan: TrainingVoiceProgressPlanV21;
  safetyPlan: TrainingVoiceSafetyPlanV21;
  finalPositionRequired: boolean;
  repeatInstructions: string[];

  implementationRequirements: TrainingVoiceImplementationRequirementId[];
  runtimeStatus: TrainingVoiceRuntimeStatusV21;
}
```

Equivalent names are acceptable.

## Requirements

- Use readonly/immutable data.
- Use strict unions.
- No `any`.
- Do not encode behaviour only in notes.
- Do not import JSON from `docs/` at runtime.
- The production registry is the future software source of truth.
- V2.1 documents are reconciliation inputs and audit baselines.
- Stable logical cue keys must not depend on array order.

---

# 8. Separate logical cues from physical assets

Do not add nonexistent cue keys directly to the current physical `VoiceCueId` union or static manifest.

Create a separate logical-key domain for pending V2.1 assets.

A suitable model is:

```ts
export type TrainingVoiceAssetStatusV21 =
  | 'exact_existing_pair'
  | 'existing_pair_script_mismatch'
  | 'new_pair_required'
  | 'not_required'
  | 'conditional_legacy_only';

export interface TrainingVoiceAssetRequirementV21 {
  logicalCueKey: string;
  exactScript: string;
  category: string;
  claraStatus: 'exists' | 'missing';
  marcusStatus: 'exists' | 'missing';
  existingPhysicalCueKey?: string;
  semanticMatch: boolean;
  status: TrainingVoiceAssetStatusV21;
}
```

## Rules

- Inspect current source scripts and both physical voices.
- Reuse only an exact semantic match.
- Same filename family is not proof of semantic match.
- Do not alias a broad family instruction to an exact level when meaning differs.
- Do not create placeholder MP3s.
- Do not weaken `npm run verify:audio`.
- Do not add a manifest entry without a real physical pair.
- A later generation task should be able to consume the logical asset requirements directly.

---

# 9. Contract reconciliation policy

Use the V2.1 exact exercise contracts as the implementation baseline, then verify every field against current source.

For each exercise compare:

- movement pattern,
- start position,
- equipment,
- load,
- support,
- orientation,
- set type,
- set count,
- target semantics,
- tempo,
- side/laterality,
- current grader behaviour,
- completion rule,
- release status.

## If V2.1 matches current source

Implement the contract exactly.

## If V2.1 copy is stale but the current truth is unambiguous

- Correct the production contract to the current truth.
- Add a reconciliation ledger row.
- Mark the V2.1 document as needing a later documentation refresh.
- Do not silently retain incorrect copy.

## If resolving the difference requires a new product decision

- Do not invent one.
- Keep the approved founder rule where applicable.
- Mark `behavior_dependency_pending`.
- Add a precise implementation requirement.
- Do not make the V2.1 runtime selectable for that exercise.

## Semantic gate

A contract may be `software_ready_audio_pending` only when its script truthfully describes the current intended movement behaviour.

---

# 10. Exact instruction requirements

Every exercise must have:

1. One exact first-use instruction.
2. One concise later-set reminder.
3. One target plan.
4. Side setup variants when required.
5. A side-switch cue when required by the approved intended behaviour.
6. A deterministic progress policy.
7. One safety-family decision.
8. A final-position readiness decision.
9. A repeat-instructions plan.
10. Runtime status and implementation requirements.

## Accuracy before reuse

Never reuse a broad cue if it changes:

- exercise variation,
- equipment,
- load,
- support,
- rep versus hold behaviour,
- tempo,
- side,
- stance,
- range,
- or target.

Explicitly verify the historically problematic mappings:

- squat cue versus chair-supported split squat
- heel raise versus toe raise
- bridge reps versus bridge hold
- wall hinge versus free hinge
- wall/floor push-up wording versus incline push-up
- overhead reach versus band overhead press
- unweighted march versus loaded march
- generic balance cue without a stated stance
- ordinary sit-to-stand versus cushion, slow-eccentric, power, and loaded variants
- ordinary squat versus loaded and slow-eccentric variants
- exercises with no current dedicated instruction
- loaded movements whose current cue omits load
- unilateral/asymmetric movements whose current cue omits side

The post-foundation audit must report zero semantic contract mismatches.

---

# 11. Approved laterality mapping

Use the approved V2.1 laterality model.

## No side schedule

These categories must not receive left/right set scheduling:

- `bilateral_simultaneous`
- `alternating_within_set`
- `bilateral_sequential_within_set`
- `both_sides_not_scored_separately`

## Both-sides round dependency

The following expected levels require the later `FD-001` runtime implementation; independently verify the live list:

```text
balance-single-leg-hold
balance-tandem-hold
chair-supported-split-squat
seated-hamstring-reach
supported-hip-flexor-stretch
wall-calf-stretch
```

For each:

- include exact left/right or stance variants,
- include a side-change cue,
- mark `IR-VOICE-ROUND-STATE`,
- mark `IR-VOICE-DOSE-CONVERSION`,
- do not alter live sets/targets in this task,
- do not claim runtime readiness.

## Step-up

Approved intended contract:

```text
12 total reps
alternate the leading leg every rep
return both feet to the floor before the next rep
```

Mark:

- `alternating_lead_leg_each_rep`
- `IR-VOICE-STEP-ALTERNATION`
- behavior dependency pending

Do not alter the live grader or prescription in this task.

## Mini-band lateral walk

Approved contract:

- band above knees,
- small controlled side steps,
- both directions within one timed set,
- no FD-001 dependency.

## Bilateral guard

Automated validation must fail if any bilateral exercise receives:

- a starting side,
- a side-switch cue,
- an alternating set schedule,
- or `IR-VOICE-ROUND-STATE`.

---

# 12. Target grammar and prescription truth

Create a pure target planner.

A suitable API is:

```ts
resolveTrainingVoiceTargetV21({
  contract,
  prescribedTarget,
  setType,
}): TrainingVoiceTargetPlanV21
```

The result should include:

- exact user-facing text,
- logical cue key or planned composition,
- numeric value,
- unit,
- singular/plural,
- supported/unsupported status,
- reason code.

## Requirements

- Derive from the actual session prescription, not only the exercise default.
- Account for current readiness scaling and short-session target changes.
- Inspect all currently reachable rep/time/hold/ROM values.
- Do not speak total set count.
- Use exact complete phrases where composition would sound robotic.
- Use limited composable number/unit fragments only when natural.
- Unsupported values must block the V2.1 voice path for that item.
- Do not round silently.
- Do not substitute a nearby target.
- Keep visible UI and voice target identical.

## Approved progress rules

### Rep sets

- Accepted rep SFX only.
- No spoken rep-by-rep count.
- No default “two reps left.”

### 15-second holds

- `Five seconds left` at 10 seconds.

### 20-second holds

- `Halfway` at 10 seconds.
- `Five seconds left` at 15 seconds.

### 30-second timed windows

- `Halfway` at 15 seconds.
- `Five seconds left` at 25 seconds.
- No default `Ten seconds left`.

### 12- or 14-second ROM windows

- No active progress cue.
- End/return cue only.

Optional progress:

- uses `low_reassurance`,
- drops if a higher-priority cue is active,
- is never replayed stale,
- never delays the active timer.

---

# 13. No spoken set-count setup

Implement `FD-006` as a hard invariant.

The V2.1 path must not produce:

```text
Two sets today
Three sets today
Set one of three
```

during initial setup.

Set count remains visible.

A concise `last-set` cue may remain as a later pacing event.

## Required validation

Fail if any active logical cue category or script:

- announces total set count during setup,
- appears in repeat instructions,
- or uses a retired set-plan key.

---

# 14. Safety-family source of truth

Implement a pure most-specific-wins safety resolver.

Use these families unless current source proves a more precise equivalent:

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

## Subsumption rules

- `balance_support` subsumes `generic_support`.
- `step_or_stair` subsumes `generic_support`.
- `door_anchor_band` subsumes general long-band safety.
- `floor_eligible_user` subsumes repeated floor-transfer warning.
- Mini-band placement is stated once.
- An exact instruction may absorb its equipment/safety action.
- Universal safety is not repeated by equipment safety.
- Only one normal equipment-family cue may be due for one setup.

## Pure planner

Create a pure planner such as:

```ts
resolveTrainingVoiceSafetyV21({
  contract,
  sessionMemory,
  equipment,
  capability,
}): {
  dueFamily: TrainingVoiceSafetyFamilyV21;
  absorbedIntoInstruction: boolean;
  logicalCueKey: string | null;
  reasonCodes: string[];
}
```

Create session memory for:

- universal safety already spoken,
- equipment families already introduced,
- current exercise first use.

## Scope boundary

This task implements and tests the safety source of truth and planning.

Do not replace all live legacy safety narration yet.

The V2.1 feature remains closed.

---

# 15. Final-position and setup models

Represent the required ordering explicitly.

## Standing general

```text
transition/orientation
→ visibility
→ exact instruction
→ actual start position
→ final-position readiness
→ target
→ countdown
```

## Material setup

For chair, floor, step, bands, door anchor, or another material setup:

```text
equipment transition/first-use action
→ exact setup instruction
→ user assumes actual start position
→ final-position readiness
→ target
→ countdown
```

## Rules

- Do not say “You’re set” before the user is in the actual start position.
- Floor items require `IR-VOICE-FLOOR-GATE` and `IR-VOICE-FINAL-POSITION-READINESS`.
- Step-up requires actual step-facing readiness.
- Door-anchor work requires setup before final-position confirmation.
- Chair items distinguish chair-as-seat from generic support.
- Final-position confirmation is omitted if it adds no useful information.
- Repeat instructions do not replay universal safety.

---

# 16. Sequence planner

Create a pure deterministic planner.

A suitable API is:

```ts
planTrainingVoiceSequenceV21({
  exerciseId,
  exposure: 'first_use' | 'later_set' | 'repeat_instructions',
  prescription,
  sideContext,
  sessionMemory,
  runtimeCapabilities,
}): TrainingVoiceSequencePlanV21
```

The output should include:

- logical cue keys in order,
- exact scripts in order,
- policy ids,
- required/optional status,
- target plan,
- side plan,
- safety plan,
- setup model,
- implementation blockers,
- asset blockers,
- runtime readiness,
- reason codes.

## Required sequence behaviour

### First use

- exact instruction,
- side setup where required,
- one due nonabsorbed safety family at most,
- final-position confirmation where useful,
- target,
- no total set count.

### Later set

- concise later-set reminder,
- current side only if it changes,
- current target if necessary,
- no repeated equipment safety,
- no universal safety.

### Repeat instructions

- exact instruction,
- current side,
- current target,
- no universal safety,
- no total set count,
- no unrelated equipment warning.

## No hidden approximation

If side behaviour, target, floor eligibility, or audio cannot be represented truthfully:

- return not ready,
- list blockers,
- do not silently fall back to a broad cue inside the V2.1 plan.

---

# 17. Runtime foundation and legacy isolation

Create a default-closed training voice runtime foundation or adapter.

A suitable architecture is:

```text
TrainingSessionScreen/current controller
          |
          +-- legacy voice path (current live default)
          |
          +-- TrainingVoiceRuntimeV21 (only when all readiness gates pass)
```

## Required flags/readiness

Use a narrow feature flag such as:

```text
EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1
```

Add explicit software constants or derived readiness:

```text
TRAINING_VOICE_V2_1_AUDIO_READY
TRAINING_VOICE_V2_1_BEHAVIOR_READY
```

Preferred current values after this task:

```text
AUDIO_READY = false
BEHAVIOR_READY = false
```

unless live evidence proves every dependency and physical pair already exists.

## Selection rule

The V2.1 path may run only when:

- feature flag enabled,
- software registry valid,
- all session exercises have runtime-ready contracts,
- all prescribed targets are voice-supported,
- all required physical Clara/Marcus assets exist,
- all listed behaviour prerequisites are complete.

Otherwise:

- remain on the legacy path,
- report a bounded development diagnostic,
- never mix legacy and V2.1 voice in one session.

## Tracked runtime model

Build on `VoiceChannel.speakTracked` or a shared tracked adapter.

The V2.1 runtime foundation should support:

- stage/scope identity,
- required sequence outcomes,
- cancellation,
- stale callback guards,
- eventual first-use/later-set/repeat plans,
- eventual countdown/go integration,
- mounted voice changes at safe boundaries.

Do not fully migrate live training controls/recovery in this task.

## Legacy compatibility

- Current live training voice behaviour must remain unchanged with the flag off.
- Existing tests must remain green.
- Do not change the public training route.
- Do not partially emit V2.1 logical cues through the legacy player.
- Do not add nonexistent assets to the live manifest.

---

# 18. Exercise contract runtime-readiness policy

For every exact contract derive:

```ts
interface TrainingVoiceRuntimeReadinessV21 {
  softwareContractValid: boolean;
  behaviorReady: boolean;
  targetReady: boolean;
  safetyPlanReady: boolean;
  audioReady: boolean;
  selectable: boolean;
  blockers: string[];
}
```

## Expected behavioural blockers

Independently derive and report at least:

### Both-sides round and dose

- `IR-VOICE-ROUND-STATE`
- `IR-VOICE-DOSE-CONVERSION`

### Step-up

- `IR-VOICE-STEP-ALTERNATION`

### Floor

- `IR-VOICE-FLOOR-GATE`
- `IR-VOICE-FINAL-POSITION-READINESS`

### Safety live integration

- `IR-VOICE-SAFETY-SUBSUMPTION`

### Training control/recovery integration

Where a contract/session cannot safely use the eventual runtime without it:

- `IR-VOICE-TRAINING-CONTROLS`
- `IR-VOICE-TRAINING-RECOVERY`

### Assets

- `IR-VOICE-AUDIO-ASSETS`

Do not call these unresolved founder decisions.

They are approved implementation dependencies.

---

# 19. Current generated-session coverage

Audit more than the static exercise registry.

Generate or inspect representative current sessions covering:

- each exact exercise level,
- normal generated plan,
- readiness-scaled target,
- short session,
- pain substitution,
- equipment substitution,
- equipment skip,
- manual/Explore entry where the same training player is used,
- optional/beta level where currently reachable.

For every reachable item:

- resolve the exact contract,
- resolve the target plan,
- resolve side/laterality,
- resolve safety family,
- derive runtime readiness.

Required counts:

- unmapped reachable exercise items: `0`
- incorrect family fallback in V2.1 plan: `0`
- unsupported target silently approximated: `0`
- bilateral item with side schedule: `0`

---

# 20. Pending audio requirements

Create one canonical row per logical cue required by Training Voice V2.1.

Include:

- logical cue key,
- exact script,
- category,
- policy,
- exercise ids that use it,
- first-use/later/repeat role,
- side variant,
- current physical candidate,
- current physical script,
- Clara exists,
- Marcus exists,
- semantic match,
- reuse decision,
- generation required later,
- required for voice-first,
- duration budget class,
- implementation blockers.

Suggested decisions:

- `reuse_exact_existing_pair`
- `new_pair_required`
- `existing_pair_script_mismatch`
- `not_required`
- `conditional_legacy_only`

## Consolidated backlog context

The audit should separately report:

- training pending cue pairs,
- Balance V2 pending cue pairs already recorded by its audit,
- current check-up pending pairs,
- current micro-check pending pairs from V2.1,
- without generating any of them.

Do not merge duplicate keys unless exact scripts and semantics match.

---

# 21. Prohibited active script language

Fail the foundation audit if an active intended Training V2.1 script contains unjustified use of:

```text
V1
logged
framed
reset
tracking pipeline
official side schedule
approved side
approved leg
just for the camera
workout
failed
frail
fall risk
medical-grade
```

`session` is preferred to `workout`.

Technical terms may appear in internal diagnostics but not spoken scripts.

---

# 22. Required production tests

Do not weaken or delete existing tests.

## 22.1 Registry coverage

1. Every live exact exercise id has exactly one contract.
2. No stale extra contract.
3. Expected live count reconciles to 37 unless source drift is documented.
4. Cue keys are unique.
5. First-use keys are stable.
6. Later-set keys are stable.
7. Every contract has source evidence.
8. Release status matches live source.

## 22.2 Semantic mapping

1. Every contract set type matches live source.
2. Equipment matches.
3. Load matches.
4. Support matches.
5. Orientation matches.
6. Tempo variant matches.
7. Hold versus reps matches.
8. No broad family cue is used as exact instruction when semantics differ.
9. Historically mismatched variants are all corrected.
10. Every reachable level has a dedicated exact first-use script.

## 22.3 Laterality

1. Bilateral exercises have no side plan.
2. Mini-band has no both-sides-round blocker.
3. Mini-band placement is above knees.
4. Both-sides-round items have left/right variants and dependency ids.
5. No live programming is changed.
6. Step-up intended contract is 12 total alternating reps.
7. Step-up remains behaviour-blocked.
8. No left-right-left schedule exists.

## 22.4 Target grammar

1. All reachable default targets resolve.
2. Readiness-scaled targets resolve or block explicitly.
3. Short-session targets resolve or block explicitly.
4. Singular/plural is correct.
5. No silent rounding.
6. No nearby-value substitution.
7. Spoken and visible target text match.
8. No total set count is spoken.
9. Repeat instructions omit set count.
10. Unsupported target makes V2.1 item not selectable.

## 22.5 Safety planner

1. Universal safety is once per session.
2. Most-specific family wins.
3. Balance support subsumes generic support.
4. Step safety subsumes generic support.
5. Door anchor subsumes general long band.
6. Mini-band placement is spoken once.
7. Floor family does not apply without floor eligibility.
8. Instruction absorption suppresses duplicate family cue.
9. Later sets do not repeat equipment family safety.
10. Repeat instructions do not replay universal safety.
11. At most one normal equipment-family cue per setup.

## 22.6 Sequence planner

1. First-use order is deterministic.
2. Later-set order is deterministic.
3. Repeat order is deterministic.
4. Final-position confirmation follows actual setup.
5. Side cue appears only when required.
6. No set-count cue.
7. Required/optional policies are correct.
8. Blocked behaviour returns blockers.
9. Missing audio returns asset blocker.
10. No broad fallback cue is inserted silently.

## 22.7 Runtime/feature flag

1. Flag off uses only legacy path.
2. Flag on with audio false still uses legacy/default-safe path.
3. Flag on with behaviour false does not activate V2.1.
4. One session cannot run both voice systems.
5. Runtime readiness checks every session item.
6. Unknown exercise fails closed for V2.1.
7. Unsupported target fails closed.
8. Tracked required request cancellation is safe.
9. Mounted voice changes cannot mix channels in the foundation adapter.
10. Existing training behaviour is unchanged with flag off.

## 22.8 Asset requirements

1. Every logical cue has one asset-requirement row.
2. No nonexistent cue is added to live manifest.
3. Exact existing reuse requires exact semantic match.
4. Clara/Marcus pair status is accurate.
5. Pending assets do not make `verify:audio` fail.
6. Duplicate exact scripts are reviewed for intentional reuse.
7. Balance V2 pending assets remain unchanged.

## 22.9 Regression

Re-run relevant:

- training session player tests,
- workout generation,
- equipment/pain/readiness substitutions,
- exercise registry/release policy,
- progression,
- serialization,
- audio verification,
- MPV2 voice/runtime,
- measurement-side foundation,
- Balance V2.

Preserve current P0/P1/P2 zeros for completed foundations.

---

# 23. Required audit artifacts

Create:

1. `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
2. `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
3. `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
4. `docs/audits/PEARL_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
5. `docs/audits/PEARL_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
6. `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`
7. `docs/audits/PEARL_VOICE_PROJECT_POST_TRAINING_FOUNDATION_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-training-voice-v21-foundation.mjs`

Do not overwrite the V2.1 spec or earlier audits.

## Exercise contract CSV columns

Use columns similar to:

```text
exerciseId,displayName,releaseStatus,setType,currentSetCount,currentTargetSemantics,orientation,equipment,support,laterality,setupModel,firstUseCueKey,firstUseScript,laterSetCueKey,laterSetScript,targetPlan,sideVariants,sideChangeCueKey,sideChangeScript,progressPolicy,safetyFamily,safetyAbsorbed,finalPositionRequired,repeatInstructionKeys,implementationRequirements,runtimeStatus,semanticMatch,sourceFiles,notes
```

## Asset requirements CSV columns

Use columns similar to:

```text
logicalCueKey,exactScript,category,policyId,exerciseIds,usageRole,sideVariant,currentCandidateKey,currentCandidateScript,claraExists,marcusExists,semanticMatch,reuseDecision,generationRequiredLater,requiredForVoiceFirst,budgetClass,implementationBlockers,notes
```

## Runtime readiness CSV columns

Use columns similar to:

```text
exerciseId,softwareContractValid,behaviorReady,targetReady,safetyPlanReady,audioReady,selectable,blockers,legacyFallbackAvailable,notes
```

---

# 24. Audit verdicts

Issue exactly one primary verdict.

## `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE`

Use only if:

- all 37 contracts are valid,
- all intended behaviour is already supported,
- all required audio exists,
- and the V2.1 path can safely activate.

This is not expected in the current phase.

## `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_AUDIO_PENDING`

Use when:

- contracts and behaviour are complete,
- only physical audio is pending.

## `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_BEHAVIOR_AND_AUDIO_PENDING`

Use when:

- all 37 contracts and planners are complete,
- software foundation is valid,
- approved behaviour dependencies remain,
- audio remains pending,
- feature remains default-closed.

This is the likely correct verdict.

## `REMEDIATION_REQUIRED`

Use when:

- contracts are incomplete,
- semantic mismatches remain,
- target/safety planner is inconsistent,
- or legacy isolation is unsafe.

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- live source drift prevents a truthful implementation without a new product decision.

---

# 25. Audit report requirements

Report:

- live exact exercise count,
- contract count,
- missing contract count,
- stale extra contract count,
- exact first-use mapping count,
- exact later-set mapping count,
- semantic mismatch count,
- bilateral side-policy error count,
- both-sides behaviour-blocked count,
- step-up behaviour-blocked count,
- floor-gate-blocked count,
- safety-runtime-blocked count,
- unsupported target count,
- silent target approximation count,
- active set-count cue count,
- unique logical cue count,
- exact existing pair reuse count,
- pending new pair count,
- existing pair script-mismatch count,
- sessions/items inspected,
- unmapped generated-session item count,
- duplicate safety-family count in planner,
- feature default,
- audio-ready state,
- behaviour-ready state,
- live V2.1 selectable exercise count,
- P0/P1/P2/P3 counts.

The deferred device/listening boundary may remain P3.

Do not count approved implementation dependencies as defects if they are represented honestly and block selection.

---

# 26. Completion gates

Do not claim foundation completion unless these pass.

## Registry

- Live exercise count reconciled.
- Exact contract count equals live count.
- Missing contracts: `0`
- Stale extra contracts: `0`
- Duplicate contracts: `0`
- Duplicate logical cue keys: `0`

## Semantics

- Exact instruction semantic mismatches: `0`
- Hold/reps/timer/ROM mismatch: `0`
- Equipment/load/support mismatch: `0`
- Broad family instruction fallback in V2.1 planner: `0`

## Laterality

- Bilateral side-policy errors: `0`
- Mini-band FD-001 dependency: `0`
- Left-right-left schedule: `0`
- Step-up falsely marked runtime-ready: `0`
- Both-sides item falsely marked runtime-ready: `0`

## Targets

- Silent target approximation: `0`
- Spoken/visible target mismatch: `0`
- Active total set-count setup cues: `0`
- Unsupported target marked selectable: `0`

## Safety

- Duplicate family stack in planned sequence: `0`
- More than one normal equipment family in setup: `0`
- Later-set equipment warning repeats: `0`
- Universal safety repeats inside exercise setup: `0`

## Runtime isolation

- Feature default: off
- Audio ready: false unless all physical pairs truly exist
- Behaviour ready: false while approved dependencies remain
- Legacy and V2.1 simultaneous voice: `0`
- Live behaviour change with flag off: `0`
- Pending logical key in physical manifest without asset: `0`

## Regression

- Existing training tests pass.
- MPV2 voice/runtime P0/P1/P2 remain zero.
- Measurement-side foundation P0/P1/P2 remain zero.
- Balance V2 P0/P1/P2 remain zero.
- Balance V2 audio-ready flag remains false.
- No audio changed.
- No audio generated.
- No external speech/audio API called.
- Physical QA remains deferred.

---

# 27. Handoff to the next phase

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_TRAINING_FOUNDATION_HANDOFF.md`

The handoff must identify the exact next task as:

```text
Training both-sides round state and dose-preservation implementation
```

It must include:

- contract registry API,
- sequence-planner API,
- target-planner API,
- safety-planner API,
- runtime-readiness API,
- feature/readiness gates,
- exact both-sides exercise ids,
- current programmed dose for each,
- intended both-sides structure,
- why live programming was not changed in this phase,
- tests that must remain green,
- later phases still required:
  1. both-sides round state and dose preservation
  2. alternating-leg step-up
  3. floor-transfer readiness gate
  4. safety-family live integration
  5. training controls/progress/recovery
  6. micro-check Voice V2.1
  7. final cue schema/manifests
  8. consolidated Clara/Marcus generation, including Balance V2
  9. whole-project runtime audit
  10. final physical-device QA

Do not implement those later phases here.

---

# 28. Implementation report structure

Use:

# Pearl Training Voice V2.1 Foundation Implementation

## 1. Result

## 2. Current Registry Reconciliation

## 3. Canonical Contract Types

## 4. Logical Cue and Physical Asset Separation

## 5. Exact 37-Level Mapping

## 6. Target Grammar

## 7. Laterality and Behaviour Dependencies

## 8. Safety Family Planning

## 9. Setup and Final-Position Models

## 10. Sequence Planner

## 11. Runtime Foundation and Legacy Isolation

## 12. Feature and Readiness Gates

## 13. Asset Requirement Backlog

## 14. Generated-Session Coverage

## 15. Tests

## 16. Files Changed

## 17. Worktree Integrity

## 18. Exact Next Phase

---

# 29. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- exact exercise registry
- release policy
- exercise definitions
- training session player
- workout generation
- readiness/pain/equipment substitutions
- target planning
- safety planning
- sequence planning
- runtime readiness
- feature/legacy isolation
- current audio player tests
- MPV2 voice/runtime regressions
- measurement-side regressions
- Balance V2 regressions

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

# 30. Final Codex response

When finished, respond with:

- Summary of the implemented foundation
- Paths to all seven generated artifacts
- All production files changed/added
- All test files changed/added
- Any audit-only harness added
- Confirmation that no audio changed or was generated
- Confirmation that no external speech/audio API was called
- Confirmation that listening and physical-device QA remain deferred
- Current branch and commit
- Whether the worktree was already dirty
- Live exact exercise count
- Contract count
- Missing/stale/duplicate contract counts
- Exact first-use mapping count
- Exact later-set mapping count
- Semantic mismatch count
- Bilateral side-policy error count
- Both-sides behaviour-blocked count
- Step-up behaviour-blocked count
- Floor-gate-blocked count
- Unsupported target count
- Silent target approximation count
- Active set-count cue count
- Unique logical cue count
- Exact existing pair reuse count
- Pending new pair count
- Existing pair script-mismatch count
- Generated-session unmapped item count
- Duplicate safety-family count
- Feature flag name/default
- Audio-ready value
- Behaviour-ready value
- Live V2.1 selectable exercise count
- Post-foundation P0/P1/P2/P3 counts
- Primary verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused test results
- Confirmation that Balance V2 remains audio-pending/default-closed
- Exact next task from the handoff
- A concise confidence statement

Do not generate audio, enable Training Voice V2.1, enable Balance V2, or perform physical-device QA in this task.
