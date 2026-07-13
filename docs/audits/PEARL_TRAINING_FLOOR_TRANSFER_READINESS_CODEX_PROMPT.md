# Codex Prompt: Pearl Training Floor-Transfer Readiness and Final-Position Gate

Read this entire prompt before changing anything.

Pearl’s step-up alternation software/runtime phase is now closed at the software/static level.

Current verified step-up status:

```text
Primary verdict:
TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED

Required canonical scenarios:
118 / 118

P0 / P1 / P2 / P3:
0 / 0 / 0 / 2

Step-up alternation:
default off

Training Voice V2.1:
default off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

Balance V2:
default closed / audio pending
```

The remaining P3 boundaries are intentional:

- physical-device QA is deferred,
- human listening is waived rather than completed.

The exact next approved phase is:

```text
Training floor-transfer readiness gate implementation
```

However, Pearl already appears to contain a canonical movement-capability system from earlier safety work. Current source is expected to include:

```text
MovementCapabilityProfile
floorTransfer.status
stepUpEnvironment
singleLegBalance
movement-capability snapshot/fingerprint
start-time stale-plan validation
generated/manual/Explore capability gating
local/backend safety-profile persistence
```

This task must **reuse and reconcile the existing canonical system**.

Do not create a second `floorTransferCapability` authority merely because the Voice V2.1 specification used that conceptual name.

The actual remaining work is expected to be:

1. verify and, where necessary, complete the approved FD-007 product gate;
2. connect the canonical gate to all current planning/start paths;
3. add the missing Training Voice V2.1 floor-transition and final-position software contract;
4. ensure Pearl never says the user is ready before they are actually settled in the floor start position;
5. close `IR-VOICE-FLOOR-GATE` and `IR-VOICE-FINAL-POSITION-READINESS` for the affected training contracts;
6. keep safety-family live integration and physical audio as later blockers;
7. keep the new V2.1 runtime default-closed.

Do not generate audio.

---

# 1. Authoritative product decision

Approved founder decision `FD-007` is authoritative:

```text
Before a user can receive floor exercises, ask:

“Can you safely get down to the floor and back up without assistance?”

Answer options:
- Yes
- No
- Not sure

Yes:
floor exercises may be eligible.

No:
substitute or omit floor exercises.

Not sure:
substitute or omit floor exercises.

The answer is editable in Safety/Profile settings.

Do not ask before every floor set or every floor session.

Eligible users hear one concise first-use floor transition per session.

Do not say “You’re set” until the user is actually in the floor start position.

Do not imply that Pearl can assist the transfer.

Do not use medical-clearance, frailty, diagnosis, fall-risk, or failure language.
```

`Yes` does not bypass:

- the separate `floor_space` equipment/environment requirement,
- current daily readiness/discomfort rules,
- release/optional-level policy,
- current pain/stop controls,
- current exercise eligibility rules.

No supporter, family member, or Support Circle notification is sent by default.

---

# 2. Existing artifacts to read

## Step-up closure and handoff

- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.json`
- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_CLOSURE_HANDOFF.md`
- current step-up integration/runtime tests

Preserve all completed step-up gates.

## Training Voice V2.1 foundation

- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`
- current source under `src/training/voiceV21/`

Expected affected contracts:

```text
glute-bridge-hold
glute-bridge-reps
push-up-standard
```

Independently discover every current exercise that genuinely requires the user to move to the floor.

Do not assume there are only three if the live registry has changed.

## Approved voice specification

- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`

Expected floor-related logical concepts include:

```text
equip-floor-transition-v21
final-position-set-v21
exact floor-exercise first-use instructions
exact floor-exercise later-set reminders
targets
```

Do not add nonexistent physical assets to the runtime manifest.

## Existing movement-capability work

Read the current source and any available reports, including:

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4C_R.md`, if present
- current movement-capability profile files
- current capability normalization/fingerprint files
- current equipment/capability eligibility files
- current profile sync/restore files
- current Safety/Profile and Settings UI
- current manual/Explore planning/start flows
- current stale-plan validation

Expected current architecture, to verify rather than assume:

```text
floor_space
+ floorTransfer.status === confirmed
+ daily context
+ release policy
+ existing safety/equipment gates
→ floor exercise eligible
```

## Completed foundations that must remain green

- MPV2 tracked voice/runtime completion
- measurement-side metadata and UX
- Eyes-Open Balance Protocol V2
- Training Voice V2.1 exact 37-level foundation
- both-sides rounds
- step-up alternation model/runtime/evidence closure

---

# 3. Founder review and QA boundaries

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

Do not represent any recording as listened to or approved.

Do not claim production readiness after this task.

---

# 4. Objective

Implement or verify one canonical floor-transfer and floor-start-position system that guarantees:

1. Pearl has exactly one authoritative movement-capability source for floor transfer.
2. Existing `MovementCapabilityProfile.floorTransfer` or its live equivalent remains that authority.
3. No second profile field can disagree with it.
4. Missing or malformed legacy capability fails closed.
5. `floor_space` alone never unlocks floor exercise eligibility.
6. Confirmed floor-transfer capability alone never bypasses missing `floor_space`.
7. A floor exercise is eligible only when all current safety, release, equipment, daily-context, and discomfort rules pass.
8. A user who answers No or Not sure does not receive floor exercises.
9. A user whose answer is unknown/not confirmed does not receive floor exercises.
10. Generated main-plan sessions respect the gate.
11. Short/restart/supporting sessions respect the gate.
12. Manual ladder practice respects the gate.
13. Explore detail and preset starts respect the gate.
14. Direct planning/helper calls cannot bypass the gate.
15. Same-domain safe regression/substitution is used where current product logic supports one.
16. Otherwise the slot is skipped honestly with a typed reason.
17. No floor denial mutates ladder progress or claims user failure.
18. Existing optional `push-up-standard` remains optional/hidden according to current release policy.
19. Confirming floor transfer does not promote it to core.
20. A capability change invalidates an unstarted stale plan.
21. Local and backend profile round trips preserve the canonical capability.
22. Training state cannot override or confirm the safety profile.
23. The first floor entry in an eligible session has one concise logical transition.
24. The floor transition is not repeated before every set.
25. Exact floor-exercise instructions remain distinct.
26. `final-position-set-v21` is emitted/planned only after the user is actually settled in the exercise start position.
27. No countdown or active set begins before final-position readiness.
28. A user action alone cannot bypass required camera/setup readiness where reliable evidence exists.
29. A fragile new pose classifier is not invented merely to automate floor posture detection.
30. If the camera cannot robustly verify a start posture, Pearl uses explicit user confirmation plus stable visibility/readiness rather than false confidence.
31. Retry, pause, background, tracking recovery, app restart, and mounted voice change preserve the floor setup state safely.
32. A stale final-position callback cannot start a later item or set.
33. The three known floor contracts, and any newly discovered affected contracts, no longer carry:
    - `IR-VOICE-FLOOR-GATE`
    - `IR-VOICE-FINAL-POSITION-READINESS`
    after the implementation is genuinely complete.
34. They continue to carry valid remaining blockers such as:
    - `IR-VOICE-SAFETY-SUBSUMPTION`
    - `IR-VOICE-AUDIO-ASSETS`
    - control/recovery blockers where still applicable.
35. Training Voice V2.1 remains globally default-closed.
36. Audio-ready remains false.
37. No audio is generated or changed.
38. The exact next phase becomes:
    - live Training Voice V2.1 safety-family integration.

---

# 5. Re-entry rule: reconcile before adding

Before writing production code, reconstruct the current floor-capability surface.

Create a source-of-truth table:

```text
Concept
Current type/field
Writer
Reader
Persistence
Backend form
Planning role
UI role
Current deficiency
Action
```

At minimum cover:

- `floor_space`
- `movementCapabilities`
- `floorTransfer`
- capability status enum
- capability normalization
- capability fingerprint
- safety profile serialization
- backend profile sync/restore
- generated plan capability snapshot
- start-time stale-plan validation
- generated plan eligibility
- manual practice eligibility
- Explore eligibility/start
- SafetyProfile UI
- Settings edit path
- any onboarding collection
- current floor safety cue family
- Training Voice V2.1 blockers
- current final-position readiness

## Required decision

If the current canonical floor gate is already complete:

- reuse it;
- do not rewrite it;
- add only missing FD-007 UX/voice/final-position behavior;
- report which requirements were already satisfied.

If the current system is incomplete:

- make the smallest compatible changes to the existing authority;
- do not introduce a parallel model.

If concurrent work makes the source ambiguous:

- preserve it,
- stop only the ambiguous mutation,
- return `CURRENT_SOURCE_REBASE_REQUIRED` with exact files.

---

# 6. Strict scope

## In scope

- Canonical floor-transfer capability reconciliation.
- Narrow profile model extension only if genuinely required.
- Approved one-time question/options.
- Safety/Profile and Settings edit path.
- Contextual gate for direct floor practice where current UX requires it.
- Generated/manual/Explore/direct-helper eligibility.
- Same-domain substitution or typed skip.
- Plan capability snapshot/fingerprint.
- Stale-plan validation.
- Local/backend profile round trip.
- Training-state non-authority verification.
- Floor session-entry memory.
- Floor transition logical plan.
- Final-position readiness model.
- Floor-item setup integration in the default-closed V2.1 path.
- Retry/pause/background/restore semantics.
- V2.1 contract/readiness blocker reconciliation.
- Accessibility.
- Focused tests.
- Post-implementation audit.
- Handoff to live safety-family integration.

## Out of scope

Do not implement:

- live catalogue-wide safety-family narration integration,
- band or door-anchor safety integration,
- full training controls/progress/recovery voice completion,
- Micro-Check Voice V2.1,
- audio generation,
- ElevenLabs calls,
- runtime TTS,
- human listening review,
- physical-device QA,
- enabling Training Voice V2.1,
- enabling Balance V2,
- enabling step-up alternation by default,
- changing exercise registry count,
- promoting optional exercises,
- changing current scoring/norms,
- changing progression thresholds,
- changing floor exercise prescriptions,
- a broad onboarding redesign,
- family/support notifications,
- medical screening,
- package installation,
- lockfile changes,
- destructive Git operations.

Do not opportunistically refactor the capability architecture.

---

# 7. Worktree safety

The repository is heavily dirty and contains concurrent user-owned work.

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
- current dirty state,
- pre-existing relevant diffs,
- pre-existing untracked audio/audit files.

Rules:

1. Do not reset, checkout, stash, clean, rebase, or discard anything.
2. Do not delete untracked files.
3. Do not overwrite unrelated renderer, check-up, website, audit, or profile work.
4. Do not regenerate audio manifests wholesale.
5. Do not commit or push.
6. Inspect current diffs before touching a modified file.
7. Make the smallest safe edit.
8. At the end distinguish this task’s footprint from pre-existing changes.

---

# 8. Current source to inspect

Follow current imports and actual symbols.

## Profile/capability authority

At minimum inspect:

- `src/profile/types.ts`
- `src/profile/serialize.ts`
- `src/profile/movementCapabilities.ts`
- `src/profile/equipment.ts`
- profile/safety stores/providers
- `src/screens/SafetyProfileScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- current onboarding safety/equipment screens
- `src/services/backend/profileSyncService.ts`
- `src/services/backend/restoreService.ts`
- account export/restore

## Training eligibility and generation

- `src/training/equipmentSafety.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/workoutGeneration.ts`
- `src/training/dynamicState.ts`
- `src/pearlFlow/sessionPlanning.ts`
- `src/pearlFlow/exploreViewModel.ts`
- manual practice planning
- preset planning
- start-time plan validation
- generated exercise/session types
- capability snapshot/fingerprint
- `src/screens/SessionPreviewScreen.tsx`
- `src/screens/ExploreScreen.tsx`
- `src/screens/ExploreDetailScreens.tsx`
- `App.tsx`

## Training runtime

- `src/training/sessionPlayer.ts`
- `src/training/setRuntime.ts`
- `src/screens/TrainingSessionScreen.tsx`
- current camera/preflight readiness
- `src/preflight/movementCameraReadiness.ts`
- current movement-specific start/readiness helpers
- current pause/resume/skip/cancel/background behavior
- current active-state serialization

## Floor exercises

Inspect all registered exercises whose actual execution requires the floor.

At minimum:

- `glute-bridge-hold`
- `glute-bridge-reps`
- `push-up-standard`

Also inspect:

- exercise definitions,
- ladder entries,
- equipment tags,
- release policy,
- set graders,
- camera orientation,
- movement setup copy,
- substitutions/regressions.

## Training Voice V2.1

Inspect all current source under:

```text
src/training/voiceV21/
```

At minimum:

- contracts
- types
- sequence planner
- safety planner
- readiness
- runtime
- assets/logical cue requirements
- tests

Search for:

```text
floorTransfer
movementCapabilities
CapabilityConfirmationStatus
floor_space
floor
movementCapabilitySnapshot
movementCapabilityFingerprint
movement_capability_changed
missing_movement_capability_snapshot
IR-VOICE-FLOOR-GATE
IR-VOICE-FINAL-POSITION-READINESS
floor_eligible_user
equip-floor-transition-v21
final-position-set-v21
framing-ready
glute-bridge
push-up-standard
manual
Explore
countsTowardMainPlan
```

---

# 9. Canonical capability contract

Prefer the existing canonical model.

The expected live shape is conceptually:

```ts
type CapabilityConfirmationStatus =
  | 'confirmed'
  | 'avoid_for_now'
  | 'not_confirmed';

interface MovementCapabilityProfile {
  floorTransfer: {
    status: CapabilityConfirmationStatus;
  };

  // existing step and balance fields remain unchanged
}
```

Adapt to current code.

## Required eligibility mapping

```text
confirmed:
eligible subject to all other rules

avoid_for_now:
not eligible

not_confirmed:
not eligible

missing:
normalize to not_confirmed

malformed:
normalize/fail closed to not_confirmed
```

## Approved user answer mapping

Required UI choices:

```text
Yes
No
Not sure
```

Map:

```text
Yes -> confirmed
No -> avoid_for_now
Not sure -> avoid_for_now
```

The current canonical status remains the sole eligibility authority.

Do not introduce a competing `yes/no/unsure` planning field.

If preserving the exact negative choice is useful for UI and can be added safely:

- store it only as non-authoritative response provenance inside the canonical floor-transfer object;
- eligibility must still derive solely from canonical status;
- legacy records without provenance remain valid;
- no second writer/reader may treat provenance as capability authority.

If current UI already uses semantically equivalent two-option copy and changing it would create unnecessary migration risk:

- implement the approved three visible actions for new answers where safe;
- preserve current stored status compatibility;
- document the mapping.

---

# 10. Gate placement and UX

The canonical edit surface should remain the existing Safety/Profile architecture.

## Question

Use:

```text
Can you safely get down to the floor and back up without assistance?
```

Optional supporting copy:

```text
Choose “Not sure” if you would rather use standing alternatives for now.
```

Do not promise assistance.

## Actions

- `Yes`
- `No`
- `Not sure`

Use calm adult UI.

## Placement

Required:

- canonical Safety/Profile collection surface,
- Settings edit path.

Contextual prompt:

- may appear when the user directly requests a floor exercise through Manual/Explore and the status is `not_confirmed`;
- must not appear repeatedly before each floor set;
- must not interrupt an already active measured set;
- must not write an answer until the user explicitly chooses;
- cancellation leaves capability unchanged and starts no floor exercise.

Generated main-plan behavior:

- remains fail-closed when not confirmed;
- may continue with current safe substitution/skip semantics;
- do not force an unexpected modal in the middle of a planned session.

## Edit behavior

Changing from confirmed to avoid/not confirmed:

- affects future planning,
- invalidates an unstarted plan through the existing capability fingerprint,
- does not retroactively rewrite completed sessions,
- does not mutate progression history.

---

# 11. Floor exercise inventory and release policy

Create one derived current inventory.

For each floor-requiring exercise record:

```text
exerciseId
displayName
releaseStatus
equipment
orientation
setType
target
current substitutions/regressions
generated reachability
manual reachability
Explore reachability
current voice blockers
```

Expected known rows:

```text
glute-bridge-hold
glute-bridge-reps
push-up-standard
```

## Rules

- Do not remove floor exercises from the catalogue.
- Do not promote `push-up-standard`.
- A confirmed gate does not bypass optional/hidden release policy.
- Any future/new floor-tagged exercise is automatically governed by the same central policy.
- Do not rely on a manually maintained three-id allowlist if current equipment/constraint metadata can derive floor requirement safely.
- If an exercise has a `floor` tag but does not require a transfer, document and encode the exception explicitly rather than ignoring the tag globally.

---

# 12. Eligibility, substitution, and honest skipping

Centralize or reuse one pure eligibility function.

A suitable conceptual API is:

```ts
deriveFloorExerciseEligibility({
  exercise,
  canonicalEquipment,
  movementCapabilities,
  dailyContext,
  releasePolicy,
  progressionContext,
}): {
  eligible: boolean;
  reasonCodes: readonly string[];
};
```

Equivalent naming is acceptable.

## Required eligibility

A floor exercise is eligible only when:

```text
floor_space present
AND floorTransfer confirmed
AND daily context permits it
AND release policy permits it
AND existing exercise/equipment/progression gates pass
```

## Substitution policy

When ineligible:

1. Prefer an existing same-ladder or same-domain safe regression only when current product logic already treats it as a valid substitute.
2. Preserve the intended domain/stimulus role where possible.
3. Require explicit user confirmation before replacing a manually requested level.
4. Do not silently claim an unrelated movement is equivalent.
5. Otherwise use current typed skipped/supporting semantics.
6. No floor-denied slot gains primary-focus credit unless the selected substitute genuinely qualifies under existing policy.
7. User copy remains calm:
   - `This movement isn’t included with your current setup.`
   - `A standing option is available.`
   - `Your plan and progress are unchanged.`

Do not hard-code a new cross-ladder substitution without source justification.

## Direct-path parity

The rule must hold for:

- main plan,
- short session,
- restart session,
- supporting session,
- manual ladder practice,
- Explore ladder start,
- Explore preset start,
- direct production helper calls,
- restored plans,
- offline state.

---

# 13. Capability snapshot and stale-plan behavior

Reuse the existing capability snapshot/fingerprint.

Every new floor-containing plan must preserve:

- canonical floor-transfer status,
- capability fingerprint,
- equipment fingerprint,
- relevant profile revision/source markers where current architecture uses them.

Before player launch:

1. validate equipment snapshot;
2. validate movement-capability snapshot;
3. validate final floor eligibility;
4. launch only if current state still matches.

Required failure reasons may reuse:

```text
movement_capability_changed
movement_capability_not_confirmed
missing_movement_capability_snapshot
```

Do not expose internal codes directly.

## Rules

- Capability change after plan generation invalidates an unstarted plan.
- Do not mutate the stale plan in place.
- Re-plan from current canonical profile and daily context.
- New current plans missing a capability snapshot fail closed.
- Legacy plans follow the existing conservative legacy refresh path.
- Training state cannot add or remove capability.

---

# 14. Floor transition session memory

Create or extend explicit session memory for floor environment/setup.

A suitable conceptual model is:

```ts
interface TrainingFloorSessionMemory {
  floorFamilyIntroduced: boolean;
  currentEnvironment: 'standing' | 'floor' | 'unknown';
  currentFloorItemId: string | null;
  currentFloorSetupEpoch: number;
}
```

Equivalent naming is acceptable.

## Required behavior

- The first transition from standing/unknown into a floor item may plan one `equip-floor-transition-v21`.
- Later sets of the same floor item do not repeat it.
- A second floor item in the same continuous floor block does not repeat the family transition.
- Exact exercise instructions still play for each new exercise.
- If the session leaves the floor and later returns:
  - do not repeat the long safety-family explanation;
  - use the smallest truthful visible/setup transition required by current flow;
  - document the chosen behavior.
- Session memory resets for a new session.
- Pause/background/restore preserves it safely.
- It is not persisted as long-term user capability.

Do not confuse:

```text
floorTransfer capability
```

with:

```text
floor transition already introduced this session
```

---

# 15. Correct floor setup and final-position sequence

Implement the software contract:

```text
floor capability already confirmed before planning
→ floor transition logical cue if first floor entry this session
→ exact exercise instruction
→ user moves to floor/start position
→ floor/movement-specific visibility and readiness
→ final-position confirmation
→ target
→ countdown
→ active work
```

## Critical invariant

`final-position-set-v21` must not be planned, emitted, or considered complete before the user is actually settled in the movement’s start position.

## Do not misuse framing readiness

General body visibility is not the same as final exercise position.

Do not treat an earlier standing `framing-ready` event as proof that:

- the user is lying in bridge start position,
- the user is in push-up start position,
- the camera can see the required floor landmarks.

## Readiness strategy

Inspect current movement/grader evidence.

Preferred order:

1. Reuse a reliable current movement-specific start-position signal.
2. Require the current required landmarks/orientation/visibility.
3. Require a stable dwell using existing timing conventions.
4. If exact posture cannot be robustly verified:
   - use explicit user confirmation after following the instruction,
   - then require stable visibility/current movement readiness,
   - do not fabricate a posture classifier.

Do not create a fragile clinical/form-analysis system.

## User actions

Suitable actions where needed:

- `I’m on the floor`
- `I’m ready`
- existing Cancel/Back

Requirements:

- large accessible target,
- programmatic handler guard,
- rapid-tap deduplication,
- no bypass of required logical speech/setup,
- cancel exits safely,
- no shame copy.

## Final-position state

A suitable conceptual state is:

```ts
type TrainingFinalPositionPhase =
  | 'not_required'
  | 'transition_instruction'
  | 'awaiting_user_transition'
  | 'movement_setup'
  | 'awaiting_visibility'
  | 'stabilizing'
  | 'ready'
  | 'audio_failure'
  | 'cancelled';
```

Equivalent naming is acceptable.

State should include:

- item id,
- set index,
- setup epoch,
- capability fingerprint,
- floor transition requirement,
- user-confirmation state,
- movement readiness state,
- final-position ready timestamp,
- stale callback guard.

---

# 16. Runtime and lifecycle semantics

## Retry

- Preserve confirmed profile capability.
- Cancel stale setup work.
- Re-enter current floor item setup.
- Do not replay the one-time family transition unless the session environment truly reset.
- Require fresh final-position readiness.
- Require a fresh countdown in the future V2.1 runtime.
- Do not credit partial active work.

## Pause/background

If active:

- follow current safe set semantics,
- retire partial attempt where current grader/runtime requires it.

If still in floor setup:

- preserve capability and session memory,
- invalidate stale readiness callbacks,
- resume at a safe setup boundary.

## Tracking loss

- Tracking loss during setup does not revoke floor capability.
- It returns to visibility/readiness.
- Tracking loss during active work follows current set-runtime recovery.
- Recovery cannot bypass final position if the user left the position.

## Restore

Persist only safe session/runtime state:

- floor family introduced,
- current environment,
- current floor item,
- setup phase/epoch where needed,
- user confirmation only if current architecture can prove it remains valid,
- never persist a stale camera-ready callback as truth.

On restore:

- capability revalidates from current canonical profile,
- stale plan validation still runs,
- if the app cannot prove the user remains in position, return to setup/readiness,
- do not start countdown automatically.

## Mounted voice change

Logical V2.1 voice change:

- does not alter capability,
- does not mark final position ready,
- cancels/replans pending required logical speech at a safe boundary,
- does not create duplicate transition memory.

---

# 17. Training Voice V2.1 integration

This task updates logical software planning only.

Do not generate or register physical assets.

## Affected floor contracts

Expected:

```text
glute-bridge-hold
glute-bridge-reps
push-up-standard
```

Independently reconcile current list.

## First floor entry

Plan:

1. `equip-floor-transition-v21` if due
2. exact floor-exercise first-use instruction
3. wait for actual floor/start readiness
4. `final-position-set-v21`
5. exact target
6. countdown in the eventual runtime

## Later set

Plan:

1. concise later-set reminder
2. re-establish final-position readiness if needed
3. target where needed
4. countdown

Do not repeat the floor-transition family line.

## Repeat instructions

Include:

- exact exercise instruction,
- current target,
- current setup action.

Do not include:

- total set count,
- repeated universal safety,
- repeated floor capability question,
- a claim that the user is already in position.

## Runtime readiness

After genuine completion:

Remove from affected contracts:

```text
IR-VOICE-FLOOR-GATE
IR-VOICE-FINAL-POSITION-READINESS
```

Keep remaining true blockers:

```text
IR-VOICE-SAFETY-SUBSUMPTION
IR-VOICE-AUDIO-ASSETS
IR-VOICE-TRAINING-CONTROLS
IR-VOICE-TRAINING-RECOVERY
```

according to current readiness policy.

Training Voice V2.1 remains globally not selectable.

## Asset requirements

Classify:

- `equip-floor-transition-v21`
- `final-position-set-v21`
- exact floor instructions
- targets

as:

- exact existing physical pair,
- existing pair script mismatch,
- new pair required,
- or not required.

Do not add pending keys to the physical manifest.

---

# 18. Safety-family boundary

The next phase is live safety-family integration.

This task must not accidentally complete or duplicate that entire phase.

For floor items:

- ensure the logical `floor_eligible_user` family can be resolved,
- ensure one family transition is due at most once per session,
- ensure exact instructions may absorb duplicated wording,
- ensure existing legacy atomic floor safety cues remain untouched,
- do not switch the live default training narration yet.

Keep `IR-VOICE-SAFETY-SUBSUMPTION` until the later live integration task proves the complete safety hierarchy.

---

# 19. UI and accessibility

Use Pearl’s premium, calm component system.

## Capability question

Requirements:

- large touch targets,
- accessible role/labels,
- selected state,
- Dynamic Type tolerance,
- no colour-only meaning,
- concise copy,
- explicit Save where current Safety/Profile UX requires it.

Suggested accessible labels:

- `Yes, floor exercises can be included`
- `No, use standing alternatives`
- `Not sure, use standing alternatives`

## Floor setup

Show:

- current exercise,
- concise transition instruction,
- visible action where user confirmation is required,
- current camera/readiness state,
- Cancel/Back.

Do not show technical terms such as:

- tracking pipeline,
- capability fingerprint,
- posture classifier,
- eligibility gate.

Do not label the user unsafe or incapable.

---

# 20. Persistence and backend

Trace the canonical capability through:

- local profile serialization,
- backend `safety_json` or live equivalent,
- restore,
- account export,
- conflict resolution.

Trace session setup state through:

- active training serialization,
- restore,
- compact backend training state where current architecture supports it.

## Requirements

- Existing canonical profile remains authoritative.
- Training state cannot confirm capability.
- Missing/malformed remote capability fails closed.
- Explicit local/remote conflict follows current authority rules.
- Existing confirmed profiles remain confirmed after migration.
- Existing `avoid_for_now` remains ineligible.
- Capability snapshot/fingerprint round-trips.
- Session floor-transition memory round-trips only where needed.
- Richer current metadata is not replaced by an older sparse copy.
- No remote migration unless current architecture genuinely requires it.
- Do not execute a remote schema change.

---

# 21. Feature flags and rollout

Do not put the existing live capability safety gate behind a new feature flag.

It must remain active.

For the new V2.1 floor setup/final-position runtime, add or reuse a narrow internal flag only if required:

```text
EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1
```

Expected state after this task:

```text
Canonical floor capability gate:
active

Floor V2.1 software:
ready

Floor V2.1 runtime feature:
default off

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
```

## Isolation

- Flag off leaves current live training behavior unchanged.
- New floor setup cannot run simultaneously with legacy setup for the same item.
- An ordinary user route cannot activate the V2.1 floor path without the complete internal readiness context.
- Existing sessions remain pinned to their runtime mode.
- Capability safety still blocks floor work regardless of voice feature flags.

---

# 22. Diagnostics

Add bounded privacy-safe diagnostics for:

- capability answer selected,
- capability normalized,
- floor eligibility resolved,
- floor substitution/skip reason,
- capability snapshot created,
- stale plan rejected,
- floor transition due/skipped,
- floor environment entered,
- user floor confirmation,
- movement readiness pending/passed,
- final position ready,
- stale readiness callback ignored,
- countdown unblocked,
- setup cancelled,
- setup restored,
- V2.1 blockers removed/remaining.

Do not log:

- raw video,
- landmarks,
- health result values,
- account ids,
- user name,
- free-text medical/safety notes.

Use stable reason codes.

---

# 23. Required tests

Do not weaken or delete existing tests.

## 23.1 Canonical authority tests

1. Exactly one floor-transfer capability authority exists.
2. `floor_space` is not treated as transfer capability.
3. Missing capability normalizes to not confirmed.
4. Malformed capability fails closed.
5. Confirmed maps to eligible status.
6. Avoid-for-now maps to ineligible.
7. Training state cannot override profile capability.
8. Capability fingerprint changes only on eligibility-relevant change.
9. A duplicate conceptual field is rejected by integrity tests.

## 23.2 Capability UI tests

1. Approved question appears.
2. Yes is available.
3. No is available.
4. Not sure is available.
5. Yes writes confirmed.
6. No writes avoid-for-now.
7. Not sure writes avoid-for-now.
8. Cancel writes nothing.
9. Settings can revise answer.
10. Existing confirmed profile renders truthfully.
11. Existing avoid-for-now profile renders truthfully.
12. Accessibility labels/selected state exist.
13. No supporter notification is emitted.
14. No medical language appears.

## 23.3 Eligibility matrix

For each current floor exercise:

1. floor space + confirmed -> eligible subject to other gates.
2. floor space + avoid -> ineligible.
3. floor space + not confirmed -> ineligible.
4. confirmed without floor space -> ineligible.
5. neither -> ineligible.
6. hip/back discomfort blocks bridge where current policy says so.
7. optional push-up remains optional.
8. release policy still applies.
9. direct helper cannot bypass.
10. malformed capability fails closed.

## 23.4 Generated-plan behavior

1. Eligible main plan may include floor work.
2. Ineligible main plan excludes floor work.
3. Safe current substitution is used where valid.
4. Otherwise typed skip/supporting semantics are used.
5. No false primary-focus credit.
6. Short session respects gate.
7. Restart session respects gate.
8. Supporting session respects gate.
9. Plan snapshot includes capability.
10. Plan fingerprint is deterministic.

## 23.5 Manual and Explore

1. Manual floor request with confirmed capability can proceed subject to other gates.
2. Manual unconfirmed request does not start player.
3. Contextual prompt may collect explicit answer.
4. Negative answer starts no floor exercise.
5. Changed-level substitute requires confirmation.
6. Manual remains non-credit.
7. Explore detail respects gate.
8. Explore preset respects gate.
9. Direct Explore helper cannot bypass.
10. Daily-context policy remains enforced.

## 23.6 Stale plan and restore

1. Capability change invalidates unstarted plan.
2. Missing current-plan capability snapshot fails closed.
3. Legacy plan uses current conservative refresh path.
4. Local profile round-trip.
5. Backend profile round-trip.
6. Account restore preserves confirmed/avoid status.
7. Training-state restore cannot promote capability.
8. Richer current capability wins over stale sparse copy under current authority rules.
9. No completed history is rewritten.
10. Re-planning uses current daily context.

## 23.7 Floor session memory

1. First floor entry plans one transition.
2. Later set does not repeat transition.
3. Second contiguous floor item does not repeat family transition.
4. New session resets memory.
5. Pause preserves memory.
6. Background preserves or safely re-establishes memory.
7. Restore does not duplicate transition incorrectly.
8. Capability status and session memory remain separate.
9. Leaving/returning to floor follows documented minimal behavior.
10. Stale item callback cannot mark a new floor item introduced.

## 23.8 Final-position readiness

For each floor exercise:

1. Standing framing-ready does not equal floor final-position ready.
2. Exact instruction occurs before final confirmation.
3. Final-position cue cannot emit before actual floor setup.
4. Required landmarks/orientation/visibility are checked.
5. Stable dwell is required where current conventions support it.
6. User confirmation alone does not bypass required visibility.
7. Camera readiness alone does not bypass required explicit transition where needed.
8. Countdown cannot begin before final-position readiness.
9. Active set cannot begin before final-position readiness.
10. Rapid confirmation taps are deduplicated.
11. Retry returns to fresh setup.
12. Tracking loss during setup returns to readiness.
13. Background during setup invalidates stale callback.
14. Restore does not auto-start countdown.
15. Voice change does not mark ready.
16. Unsupported exact posture detection uses conservative confirmation rather than false automatic readiness.

## 23.9 Training Voice V2.1 planner

1. First floor entry includes floor transition logical cue.
2. Later set omits floor transition.
3. Contiguous next floor item omits repeated family transition.
4. Exact exercise instruction is preserved.
5. Final-position cue appears after readiness boundary.
6. Target appears after final-position cue.
7. No total set count.
8. Repeat Instructions does not re-ask capability.
9. No broad inaccurate family cue is substituted.
10. `IR-VOICE-FLOOR-GATE` is removed only when gate is complete.
11. `IR-VOICE-FINAL-POSITION-READINESS` is removed only when readiness is complete.
12. `IR-VOICE-SAFETY-SUBSUMPTION` remains.
13. Audio blocker remains.
14. Physical manifest is unchanged.

## 23.10 Feature isolation

1. Canonical capability gate remains active regardless of V2.1 flag.
2. Floor V2.1 flag off leaves live voice/setup unchanged.
3. Floor V2.1 flag alone cannot half-activate an ordinary user path.
4. Training Voice V2.1 remains off.
5. Audio ready remains false.
6. Global behavior ready remains false.
7. Balance V2 remains closed.
8. Step-up remains default off.
9. No two setup systems own the same item.
10. Existing active legacy session remains legacy.

## 23.11 Regression

Re-run relevant suites for:

- movement capability normalization,
- profile serialization/sync/restore,
- equipment safety,
- daily context,
- workout generation,
- session planning,
- manual practice,
- Explore,
- stale-plan validation,
- training player,
- Training Voice V2.1,
- both-sides rounds,
- step-up integration/evidence closure,
- progression/valid time,
- MPV2,
- measurement-side,
- Balance V2.

Preserve all completed software P0/P1/P2 zeros.

---

# 24. Required audit scenarios

Create at least these canonical scenarios.

## Capability and UI

- `floor_capability_yes`
- `floor_capability_no`
- `floor_capability_unsure`
- `floor_capability_cancel`
- `floor_capability_missing_legacy`
- `floor_capability_malformed`
- `floor_capability_settings_edit`

## Eligibility

- `floor_space_confirmed_eligible`
- `floor_space_unconfirmed_blocked`
- `floor_space_avoid_blocked`
- `confirmed_without_floor_space_blocked`
- `bridge_blocked_by_hip_back_discomfort`
- `optional_pushup_stays_optional`
- `direct_helper_cannot_bypass`

## Planning/substitution

- `main_plan_floor_eligible`
- `main_plan_floor_substituted`
- `main_plan_floor_skipped_honestly`
- `short_session_floor_gate`
- `restart_session_floor_gate`
- `supporting_session_floor_gate`
- `manual_floor_gate`
- `explore_detail_floor_gate`
- `explore_preset_floor_gate`
- `manual_substitute_requires_confirmation`
- `floor_denial_no_false_focus_credit`

## Persistence/stale plan

- `local_profile_roundtrip`
- `backend_profile_roundtrip`
- `restore_does_not_promote_capability`
- `capability_change_invalidates_plan`
- `missing_snapshot_fails_closed`
- `legacy_plan_refreshes_conservatively`
- `richer_capability_metadata_preserved`

## Session transition memory

- `first_floor_item_transition_once`
- `later_floor_set_no_transition`
- `contiguous_floor_item_no_duplicate_family_transition`
- `new_session_resets_transition_memory`
- `pause_preserves_floor_memory`
- `restore_preserves_floor_memory`
- `stale_item_transition_callback_ignored`

## Final-position readiness

- `standing_framing_not_floor_ready`
- `bridge_hold_final_position`
- `bridge_reps_final_position`
- `pushup_standard_final_position`
- `user_confirmation_without_visibility_blocked`
- `visibility_without_required_confirmation_blocked`
- `final_position_then_target_then_countdown`
- `rapid_ready_tap_deduplicated`
- `tracking_loss_during_floor_setup`
- `background_during_floor_setup`
- `restore_floor_setup_no_auto_start`
- `voice_change_does_not_mark_ready`

## Voice/readiness/defaults

- `floor_first_use_logical_sequence`
- `floor_later_set_logical_sequence`
- `repeat_instructions_no_capability_question`
- `floor_contract_blockers_reconciled`
- `safety_subsumption_blocker_remains`
- `physical_manifest_unchanged`
- `training_voice_stays_closed`
- `balance_v2_stays_closed`
- `step_up_stays_closed`

The audit may add scenarios.

---

# 25. Audit evidence quality

Do not repeat earlier hard-coded audit weaknesses.

Requirements:

1. Derive inventory and blocker counts from current production registries.
2. Execute current pure production helpers where possible.
3. Execute real profile serializer/sync/restore mappers.
4. Execute current planners for generated/manual/Explore scenarios.
5. Execute current sequence planner for logical voice scenarios.
6. Derive metrics from written scenario rows.
7. Do not assign defect metrics directly to zero.
8. Reopen generated CSV/JSON artifacts and independently recompute metrics.
9. Verdict derives from completion gates.
10. Failed scenarios remain visible.
11. Report physical/device-only uncertainties as P3, not as software completion failures.

A compact, honest audit is preferable to synthetic scenario inflation.

---

# 26. Required artifacts

Create:

1. `docs/audits/PEARL_TRAINING_FLOOR_READINESS_IMPLEMENTATION.md`
2. `docs/audits/PEARL_TRAINING_FLOOR_READINESS_AUDIT.md`
3. `docs/audits/PEARL_TRAINING_FLOOR_READINESS_AUDIT.json`
4. `docs/audits/PEARL_TRAINING_FLOOR_READINESS_SCENARIOS.csv`
5. `docs/audits/PEARL_TRAINING_FLOOR_CONTRACT_MATRIX.csv`
6. `docs/audits/PEARL_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md`

You may add one audit-only harness:

- `scripts/audits/audit-training-floor-readiness.mjs`

Do not overwrite prior reports.

## Contract matrix columns

Use columns similar to:

```text
exerciseId,displayName,releaseStatus,requiresFloorTransfer,requiresFloorSpace,currentGateSource,eligibleWhenConfirmed,substituteOrSkipPolicy,setupModel,transitionCueKey,firstUseInstructionKey,finalPositionRequirement,targetKey,removedBlockers,remainingBlockers,runtimeStatus,notes
```

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,category,exerciseId,capabilityStatus,floorSpace,dailyContext,releaseStatus,entryPath,planOutcome,substituteExerciseId,skipReason,capabilitySnapshotValid,floorTransitionDue,finalPositionPhase,countdownAllowed,activeAllowed,voiceCueKeys,blockers,passed,testCoverage,notes
```

---

# 27. Audit metrics

Report at minimum:

```text
floorExerciseCount
coreFloorExerciseCount
optionalFloorExerciseCount

canonicalFloorAuthorityCount
duplicateFloorAuthorityCount

confirmedEligibleScenarioCount
unconfirmedFloorExerciseLeakCount
avoidFloorExerciseLeakCount
floorSpaceOnlyLeakCount
confirmedWithoutFloorSpaceLeakCount
directHelperBypassCount

generatedPathBypassCount
manualPathBypassCount
explorePathBypassCount
restorePromotionCount
stalePlanStartCount

falsePrimaryFocusCreditCount
silentUnrelatedSubstitutionCount
optionalPushupPromotionCount

firstFloorTransitionCount
duplicateFloorTransitionCount
laterSetTransitionRepeatCount

prematureFinalPositionCueCount
countdownBeforeFinalPositionCount
activeBeforeFinalPositionCount
staleReadinessMutationCount
restoreAutoStartCount

localProfileRoundTripFailureCount
backendProfileRoundTripFailureCount
capabilitySnapshotRoundTripFailureCount

irVoiceFloorGateRemainingCount
irVoiceFinalPositionRemainingCount
safetySubsumptionBlockerRemovedIncorrectlyCount
physicalManifestChangeCount

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 28. Findings and verdicts

## P1 examples

- floor exercise starts without confirmed capability,
- floor exercise starts without floor space,
- countdown/active begins before final position,
- stale callback starts a different item,
- restore promotes missing capability,
- direct helper bypasses gate.

## P2 examples

- one entry path lacks parity,
- unsafe/semantically unrelated substitution,
- persistence loses capability,
- one affected contract still has an implementation blocker after claimed completion,
- final-position readiness is model-only and not connected to the internal runtime.

## P3

- physical-device confirmation of floor pose/readiness,
- human listening waived,
- phone-camera setup usability deferred.

Issue exactly one verdict.

### `TRAINING_FLOOR_READINESS_SOFTWARE_COMPLETE`

Use when:

- canonical capability gate is complete,
- all paths respect it,
- final-position software is integrated behind default-off V2.1 gates,
- the affected blockers are removed,
- only safety live integration/audio/device P3 work remains.

### `TRAINING_FLOOR_READINESS_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING`

Use when:

- pure models/planners pass,
- but final-position or session runtime is not connected end to end.

### `TRAINING_FLOOR_READINESS_REMEDIATION_REQUIRED`

Use when a software safety/comparability/persistence gate fails.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when concurrent/current source cannot be reconciled safely.

Expected successful verdict:

```text
TRAINING_FLOOR_READINESS_SOFTWARE_COMPLETE
```

Do not choose it merely because the older Stage 4C-R capability gate already exists; the new floor transition and final-position contract must also be complete.

---

# 29. Completion gates

## Canonical capability

- canonical floor authorities: `1`
- duplicate authorities: `0`
- missing/malformed permissive defaults: `0`

## Eligibility

- unconfirmed floor exercise leaks: `0`
- avoid-for-now leaks: `0`
- floor-space-only leaks: `0`
- confirmed-without-floor-space leaks: `0`
- direct-helper bypasses: `0`

## Path parity

- generated bypasses: `0`
- manual bypasses: `0`
- Explore bypasses: `0`
- restore promotions: `0`
- stale plans started: `0`

## Substitution/credit

- false primary-focus credits: `0`
- silent unrelated substitutions: `0`
- optional push-up promotions: `0`

## Transition/final position

- duplicate first-floor transitions: `0`
- later-set transition repeats: `0`
- premature final-position cues: `0`
- countdown before final position: `0`
- active before final position: `0`
- stale readiness mutations: `0`
- restore auto-starts: `0`

## Persistence

- local profile round-trip failures: `0`
- backend profile round-trip failures: `0`
- capability snapshot failures: `0`

## Voice readiness

- `IR-VOICE-FLOOR-GATE` remaining on completed affected contracts: `0`
- `IR-VOICE-FINAL-POSITION-READINESS` remaining: `0`
- safety blocker incorrectly removed: `0`
- pending logical key added to physical manifest: `0`

## Project defaults

- capability gate remains active
- floor V2.1 feature remains default off
- Training Voice V2.1 remains off
- audio ready remains false
- global behavior ready remains false
- Balance V2 remains closed
- step-up remains closed

## Integrity

- tests pass
- no audio changed
- no audio generated
- no external speech/audio API called
- listening remains waived
- physical QA remains deferred

---

# 30. Implementation report structure

Use:

# Pearl Training Floor-Transfer Readiness Implementation

## 1. Result

## 2. Approved FD-007 Contract

## 3. Existing Capability System Reconciliation

## 4. Canonical Capability Authority

## 5. Capability Question and Settings UX

## 6. Floor Exercise Inventory

## 7. Eligibility and Substitution

## 8. Generated, Manual, and Explore Path Parity

## 9. Capability Snapshot and Stale Plans

## 10. Floor Session Transition Memory

## 11. Final-Position Readiness

## 12. Training Voice V2.1 Integration

## 13. Safety-Family Boundary

## 14. Persistence and Backend

## 15. Feature Flags and Legacy Isolation

## 16. Accessibility

## 17. Diagnostics

## 18. Tests

## 19. Audit Results

## 20. Remaining Device-Only Risks

## 21. Files Changed

## 22. Worktree Integrity

## 23. Exact Next Phase

---

# 31. Handoff

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md`

If successful, the exact next task is:

```text
Training Voice V2.1 live safety-family integration
```

Include:

- canonical capability API,
- floor eligibility API,
- capability snapshot/fingerprint API,
- floor session-memory API,
- final-position readiness API,
- sequence-planner integration,
- affected contracts,
- removed blockers,
- remaining safety/audio/control blockers,
- feature/default state,
- tests that must remain green.

Later order:

1. live safety-family integration
2. training controls/progress/recovery
3. Micro-Check Voice V2.1
4. final cue schema/manifests
5. consolidated Clara/Marcus generation, including Balance V2
6. whole-project static/runtime audit
7. final consolidated physical-device QA

Do not implement safety-family integration in this task.

---

# 32. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run focused Jest suites covering:

- movement capabilities,
- profile serialization,
- profile sync/restore,
- equipment/capability eligibility,
- daily context,
- workout generation,
- session planning,
- manual practice,
- Explore,
- stale-plan validation,
- floor final-position runtime,
- TrainingSessionScreen floor setup,
- Training Voice V2.1 contracts/planner/readiness,
- backend training/profile state.

Run regression suites for:

- both-sides rounds,
- step-up runtime/evidence closure,
- training session player,
- progression/valid time,
- MPV2,
- measurement-side,
- Balance V2.

Run the full Jest suite where practical.

Run the audit harness.

Parse generated JSON/CSV artifacts.

Independently recompute audit metrics from the scenario CSV.

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
- paths to all six artifacts,
- audit harness path,
- all production files changed/added,
- all tests changed/added,
- confirmation that no audio changed or was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether the worktree was already dirty,
- current canonical floor capability type/field,
- whether a duplicate field was avoided,
- user-facing question/options,
- mapping of Yes/No/Not sure,
- floor exercise inventory,
- generated/manual/Explore behavior,
- substitution/skip behavior,
- stale-plan behavior,
- first-floor transition rule,
- final-position readiness rule,
- behavior on retry/pause/background/restore,
- feature flag/default,
- removed V2.1 blockers,
- remaining V2.1 blockers,
- floor exercise leak counts,
- direct-helper bypass count,
- false-credit/substitution counts,
- duplicate transition count,
- premature final-position count,
- countdown/active-before-ready counts,
- local/backend round-trip failures,
- P0/P1/P2/P3 counts,
- verdict,
- whether live safety-family integration is unblocked,
- exact next task,
- `npm run verify:audio` result,
- typecheck result,
- focused/full test results,
- audit recomputation result,
- concise confidence statement.

Do not generate audio, enable Training Voice V2.1, enable Balance V2, enable step-up alternation by default, implement live safety-family integration, or perform physical-device QA in this task.
