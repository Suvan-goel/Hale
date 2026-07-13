# Codex Prompt: Pearl Voice Experience Specification V2 Correction, Decision Review, and Script Freeze Preparation

Read this entire prompt before starting.

Pearl has completed:

- `docs/audits/PEARL_VOICE_CUE_INVENTORY.md`
- `docs/audits/PEARL_VOICE_CUE_INVENTORY.json`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json`
- `docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST.csv`

The first specification established the correct broad direction, but it is **not approved for implementation or audio generation**. It contains internal inconsistencies, invalid side policies, understated composed durations, manifest-priority mismatches, unresolved protocol choices incorrectly reported as resolved, and scripts that still need editorial refinement.

This task must produce a corrected V2 specification suitable for founder review and eventual script freeze.

Do not treat the V1 spec as authoritative. Independently verify all exercise, assessment, target, laterality, safety, and runtime claims against production source.

---

# 1. Objective

Produce a corrected, internally consistent, implementation-ready **proposed V2 voice specification**, while making no production or audio changes.

The task must:

1. Correct every known defect in the V1 specification.
2. Separate training laterality from official measurement-side policy.
3. Eliminate invalid side schedules assigned to bilateral movements.
4. Identify all genuine product/protocol choices instead of claiming none remain.
5. Reconcile the cue manifest with one canonical priority/interrupt-policy table.
6. Recalculate complete composed timelines rather than timing isolated lines.
7. Shorten and refine scripts for a premium, calm, mature experience.
8. Reduce unnecessary cue duplication and asset count where meaning can be safely reused.
9. Produce a concise founder decision sheet with recommendations and safe defaults.
10. Put human script approval before implementation or full audio generation.
11. Leave the repository ready for a later, separately authorised implementation pass.

The V2 output is still proposed for review. It is not permission to change runtime behaviour or generate audio.

---

# 2. Strict scope

## Do not

- Change production TypeScript or React Native code
- Change exercise programming
- Change assessment scoring
- Change generated plans
- Change set counts, targets, rest periods, or release flags
- Change cue priorities in production
- Change queue or interruption behaviour
- Change manifests
- Modify tests
- Generate, overwrite, rename, move, or delete MP3 assets
- Call ElevenLabs or any external API
- Add npm dependencies
- Change `package.json` or `package-lock.json`
- Implement side persistence
- Implement audible-onset timing
- Commit or format unrelated files
- Overwrite the V1 specification artifacts

## You may

- Add the V2 specification artifacts requested below
- Read and programmatically validate the audit/spec JSON and CSV files
- Use temporary local analysis scripts and remove them before finishing
- Run existing tests and static checks
- Inspect all relevant production source and tests
- Create audit-only calculations inside the generated documents
- Make clear final recommendations in the V2 documents

Production behaviour and all existing audio must remain unchanged.

---

# 3. Required deliverables

Create these six files:

1. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.md`
2. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.json`
3. `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2.md`
4. `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2.csv`
5. `docs/specs/PEARL_VOICE_FOUNDER_DECISIONS.md`
6. `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2.csv`

Do not overwrite or edit the V1 files.

## Deliverable purposes

### `PEARL_VOICE_EXPERIENCE_SPEC_V2.md`

The corrected product and engineering specification.

### `PEARL_VOICE_EXPERIENCE_SPEC_V2.json`

The canonical machine-readable V2 source of truth. The Markdown and CSV artifacts must derive from or agree exactly with it.

### `PEARL_VOICE_SCRIPT_REVIEW_V2.md`

A clean, concise human-review document containing only the proposed spoken experience, relevant context, and decision markers. It must be easy to read aloud and approve line by line.

### `PEARL_VOICE_SCRIPT_MANIFEST_V2.csv`

One row per proposed cue asset or composable fragment, with correct category, priority class, interrupt policy, trigger, and review status.

### `PEARL_VOICE_FOUNDER_DECISIONS.md`

A short decision document containing only genuine product/protocol choices. Each item must include:

- Decision id
- Question
- Why it matters
- Current production behaviour
- Options
- Codex recommendation
- Safe default
- Consequences
- Files/flows affected
- Whether it blocks script freeze
- Founder decision field left blank

Do not bury these choices in the long specification.

### `PEARL_VOICE_COMPOSED_TIMELINES_V2.csv`

Complete pre-movement and flow timelines, not isolated cue durations. It must make duration-budget validation reproducible.

Suggested columns:

```text
scenarioId,flow,itemId,voiceId,exposureType,equipmentState,sequenceOrder,cueKeys,scripts,assetCount,estimatedSpeechMs,interAssetGapAssumptionMs,estimatedTotalMs,countdownStartsAtMs,audibleGoAtMs,budgetClass,targetMs,hardMaxMs,passesTarget,passesHardMax,notes
```

Use valid CSV escaping.

---

# 4. Sources and evidence

Treat the audits and V1 specification as evidence, not truth.

Independently inspect current production definitions, including at minimum:

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/profile/voices.ts`
- `scripts/generate-audio.ts`
- `src/training/sessionPlayer.ts`
- `src/training/microCheck.ts`
- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- `src/assessment/sessionController.ts`
- `src/checkup/checkup.ts`
- `src/preflight/preflight.ts`
- `src/preflight/movementCameraReadiness.ts`
- `src/preflight/promptTiming.ts`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/releasePolicy.ts`
- `src/exercises/common.ts`
- `src/exercises/setGraders.ts`
- Every exact exercise definition
- Every current assessment definition
- The three session screens
- Persistence/result types relevant to assessment side metadata
- Relevant tests

Verify, rather than assume:

- Bilateral versus unilateral behaviour
- Whether both sides occur within one set
- Whether targets are total, per side, or per accepted event
- How many sets actually exist
- Whether a side switch occurs within or between sets
- Whether the grader observes one side or both
- Which equipment is required versus merely allowed
- Mini-band placement
- Step-up leading-leg and step-down semantics
- Door-anchor requirements
- Whether a movement is a hold, timed movement, ROM capture, or rep set
- Whether visible copy conflicts with the grader or movement definition

---

# 5. Mandatory V1 correction ledger

Create a correction ledger near the beginning of both V2 spec artifacts.

Every known issue below must receive:

- V1 issue id
- Evidence
- Affected artifact/rows
- V2 correction
- Validation proving correction
- Status: corrected, converted_to_founder_decision, or not_reproducible

At minimum cover:

## SIDE-001: bilateral movements assigned an alternating left/right schedule

The V1 JSON incorrectly assigns training side language such as:

`left_first_alternate_by_set; repeat official side schedule on replay`

to movements that are bilateral, simultaneous, or already alternate both directions within a set, including examples such as:

- Band pull-apart
- Loaded march / march in place
- Mini-band lateral walk
- Neck rotations
- Band overhead press
- Overhead reach
- Supported side step
- Thoracic rotation

Correct every instance.

Training contracts must never use the phrase `official side schedule`.

## SIDE-002: odd-set unilateral imbalance

The V1 proposes left-right-left schedules for some three-set asymmetric exercises, giving one side twice the work within a session.

Examples to verify include:

- Single-leg hold
- Tandem hold
- Step-up
- Any split-stance movement
- Any other unilateral/asymmetric exercise with an odd set count

Do not silently resolve this through voice copy. This is a programming/product decision unless production already defines a balanced within-set scheme.

## PRIORITY-001: manifest rows contradict the written priority model

The V1 narrative and V1 CSV/JSON disagree for:

- Pause
- Resume
- Retry
- Skip
- Discard
- Completion
- Framing
- Tracking loss
- Tracking recovery
- Halfway/progress
- Other controls and acknowledgements

Create one canonical mapping and derive every manifest row from it.

## DURATION-001: complete setup totals were understated

The V1 duration summaries omit separately proposed cues and stacked equipment-family warnings.

Example to verify:

Standing band row may include framing confirmation, exact instruction, target, set plan, general band safety, and door-anchor safety. The V1 reported a much lower maximum by not composing the complete sequence.

Recalculate all timelines from complete cue sequences.

## DECISION-001: zero unresolved protocol decisions is unsupported

The V1 itself acknowledges missing side persistence and dynamic near-side grader behaviour while claiming no unresolved decisions.

Convert genuine unknowns into explicit founder/protocol decisions.

## REVIEW-001: human review occurs too late

The V1 implementation plan allows substantial schema/integration work before script approval.

V2 must require script/protocol approval and a limited preview before broad implementation or full asset generation.

## COPY-001: technical or awkward phrasing remains

Correct wording such as:

- `You are framed. Stay there.`
- `Got it. That is logged.`
- `the screen is here for backup`
- Repeated `Five quick chair stands` followed by `Five quick stands`
- `Have some water, and enjoy the rest of your day`
- `Move for thirty seconds` for static stretches
- Any `logged`, `framed`, `reset`, `V1`, or implementation-facing phrasing

## COPY-002: ambiguous or incomplete exact setup remains

Verify and correct:

- Which foot steps down during step-up
- Whether step-up target is total or per side
- Mini-band location
- Which side faces the phone for a side-specific shoulder assessment
- Chair-specific safety assigned to counter-only movements
- Supported hip-flexor stretch support type
- Static stretch versus continuous movement language
- Any instruction that relies on visible copy for a material detail

## PROGRESS-001: progress policy is non-deterministic

Replace phrases such as `only when not voice-saturated` with exact deterministic rules.

---

# 6. Separate laterality models

Create two independent models.

## A. Training laterality

Use a typed classification such as:

- `bilateral_simultaneous`
- `alternating_within_set`
- `bilateral_sequential_within_set`
- `unilateral_single_side_per_set`
- `asymmetric_stance_single_side_per_set`
- `both_sides_not_scored_separately`
- `not_applicable`
- `uncertain`

For every exact training level record:

- Laterality class
- What constitutes one accepted rep/event
- Whether the target is total or per side
- Whether both sides occur in one set
- Whether a side switch is required
- When the switch occurs
- Starting-side rule
- Balance across a session
- Balance across sessions
- Whether production supports the proposed voice behaviour
- Whether a programming change would be required

Do not invent a side schedule merely to make the voice spec appear complete.

## B. Official measurement-side policy

Use a separate model for assessments and micro-checks:

- Baseline side-selection rule
- Persisted side
- Official retest rule
- Manual extra-check rule
- Opposite-side fallback
- Comparability marking
- Protocol-version implications
- Current data-model support
- Required future data-model changes

Do not reuse training language such as `sets` or `alternate by set` for official measurement comparability.

---

# 7. Provisional product recommendations

Use the following as **Codex recommendations**, not hidden assumptions.

If production evidence contradicts them, explain why and propose the nearest safe alternative.

## Recommendation R1: training unilateral balance

Preferred product model:

- A training `round` should include equal work on both sides before it is considered complete.
- If current architecture cannot express both sides within one round, use an even number of side-specific sets rather than an odd left-right-left schedule.
- Do not change production programming in this task.
- Mark affected scripts as blocked from freeze until the product/programming choice is approved.

## Recommendation R2: official measurement side

Preferred product model:

- At baseline, use the side that can be measured most reliably and comfortably in the required camera orientation.
- Persist that exact side with the official result.
- Use the same side for official retests.
- Do not hard-code left unless product/protocol evidence clearly requires it.
- If the opposite side must be used, mark reduced comparability rather than silently treating it as equivalent.
- Until persistence exists, copy must not claim same-side comparability.

## Recommendation R3: eyes-closed balance

Do not add, remove, or expand eyes-closed stages through a voice-spec task.

- Preserve current production protocol in the V2 runtime description.
- Mark unsupervised eyes-closed home balance as requiring explicit safety/protocol approval before script freeze.
- Do not present the question as already resolved.

## Recommendation R4: mini-band placement

Preferred V1 product model:

- Use one defined placement for one exercise level.
- Recommend `above the knees` for the initial mini-band lateral-walk level unless the production movement definition clearly specifies another position.
- Treat above-ankle placement as a separate progression or explicit variation rather than saying `above ankles or knees`.

Do not alter production programming in this task.

## Recommendation R5: timed progress density

Use deterministic sparse guidance:

- 15-second hold: `Five seconds left` only
- 20-second hold: `Halfway` and `Five seconds left`
- 30-second timed movement or hold: `Halfway` and `Five seconds left`
- 12- or 14-second ROM/capture window: no progress cue; end cue only
- Rep sets: accepted-rep SFX only by default
- No default `Ten seconds left` cue for a 30-second set
- No spoken rep-by-rep count
- A higher-priority cue suppresses optional progress; suppressed progress is not replayed

## Recommendation R6: equipment safety de-duplication

A more-specific equipment cue must subsume a broader one when appropriate.

Example:

- A door-anchor first-use check should include the essential band/anchor safety needed for that setup.
- Do not automatically stack both a general long-band warning and a door-anchor warning if the result repeats the same behaviour.
- General long-band safety may still apply to non-anchor band exercises.

## Recommendation R7: human approval order

Required order:

1. Correct protocol and script spec
2. Founder decision review
3. Human line-by-line script approval
4. Small Clara preview set
5. Listening review and revision
6. Cue-key/script freeze
7. Production implementation behind a feature flag
8. Full Clara and Marcus generation
9. Automated validation
10. Android and iOS device QA
11. Controlled beta rollout

---

# 8. Canonical cue-policy table

Create one canonical cue-policy table in JSON and Markdown.

Every manifest row must reference one policy id.

At minimum define:

- `critical_stop`
- `critical_window`
- `result_transition`
- `instruction`
- `setup_recovery`
- `low_reassurance`

For each policy define:

- Proposed numeric priority
- Purpose
- Can interrupt which classes
- Can be interrupted by which classes
- May be dropped while busy
- Blocks controller progression
- Cancels on state exit
- Replay behaviour
- Missing-asset behaviour

Use a coherent model such as:

### `critical_stop`

For active tracking loss, times-up, or an immediate stop event.

It must interrupt lower-priority speech and freeze the relevant active window.

### `critical_window`

For three/two/one/go and start/stop timing cues.

It must not queue behind stale setup narration.

### `result_transition`

For pause, resume, retry, skip, discard, results, transitions, and completion.

### `instruction`

For exact movement instructions, targets, set plans, and due first-use safety.

### `setup_recovery`

For preflight, framing, orientation correction, visibility, and stable recovery confirmation.

### `low_reassurance`

For optional progress and nonessential acknowledgements.

## Mandatory category mappings

At minimum enforce:

| Cue category | Required policy |
|---|---|
| Countdown and go | critical_window |
| Times-up / active stop | critical_stop |
| Active tracking loss | critical_stop |
| Pause/resume/retry/skip/discard | result_transition |
| Results/completion/transitions | result_transition |
| Exact exercise instruction | instruction |
| Target/set plan | instruction |
| Equipment first-use safety | instruction |
| Preflight/framing/orientation correction | setup_recovery |
| Tracking recovered before fresh countdown | setup_recovery or result_transition, with one justified choice |
| Halfway/five-seconds-left | low_reassurance |

Do not assign every row to `instruction`.

## Validation

Fail generation if:

- A cue category has no policy mapping
- A manifest row conflicts with the canonical policy
- The same cue key has incompatible policies without an explicit context variant
- A low-reassurance cue is marked as blocking progression
- A critical-stop cue is marked droppable while busy

---

# 9. Complete composed duration model

Do not validate only individual recordings.

For every exact training level and both voices model:

1. First occurrence in session, no equipment-family warning previously heard
2. First occurrence after relevant equipment-family warning has already been heard
3. Later set
4. Repeat instructions
5. Tracking-loss recovery
6. Pause/resume path where relevant

Also model:

- Full training intro plus universal safety
- Every default check-up assessment setup
- Every micro-check setup
- Door-anchor setup
- Step setup
- Floor-transfer setup
- Chair setup
- Balance setup
- Long-band setup
- Mini-band setup

## Sequence completeness

A first-exposure timeline must include all applicable proposed cues in actual order:

- Transition/orientation cue
- Preflight/framing-ready confirmation
- Exact exercise instruction
- Side instruction if separate
- Target
- Set plan, if retained
- Equipment-family first-use safety
- Exercise-specific safety
- Any required wait/gap
- Countdown
- Audible go onset

Do not omit a fragment merely because it is stored separately.

## Duration assumptions

Because V2 assets do not yet exist:

- Estimate Clara and Marcus durations from the measured existing corpus.
- Document the exact method.
- Include per-asset phrase overhead.
- Include inter-asset gap sensitivity at 0 ms, 100 ms, and 250 ms.
- Keep speech duration separate from native startup uncertainty.
- Do not claim millisecond precision beyond the model.

## Correct budgets

Use these V2 budgets unless evidence strongly justifies a documented exception:

| Segment | Target | Hard maximum |
|---|---:|---:|
| Training intro + universal safety | 12 s | 16 s |
| Ordinary first-use sequence from framing-ready through last pre-countdown cue | 12 s | 16 s |
| Complex equipment first-use sequence from framing-ready through last pre-countdown cue | 16 s | 20 s |
| Later-set reminder + target/side | 4 s | 6 s |
| Repeat-instructions sequence | 10 s | 14 s |
| Check-up assessment setup after framing-ready | 12 s | 16 s |
| Micro-check setup after framing-ready | 7 s | 10 s |
| Pause/resume/skip/discard confirmation | 2 s | 3.5 s |
| Tracking-loss line | 3.5 s | 5 s |
| Tracking-recovery line | 2.5 s | 4 s |

`Complex equipment` means genuinely necessary setup such as door anchor or step/stair, not every exercise using equipment.

If a sequence exceeds a hard maximum:

- Shorten or merge scripts
- Remove redundant safety
- Move reusable setup guidance earlier in the product flow
- Or mark a justified blocker requiring founder approval

Do not simply report `passes`.

## Required duration summary

Report:

- Longest ordinary first-use sequence
- Longest complex-equipment sequence
- Longest repeat-instructions sequence
- Longest check-up setup
- Longest micro-check setup
- Total initial narration before first movement in a plausible session
- Maximum narration added by all equipment-family first uses in a plausible 20-minute session
- Comparison against V1 and current production audit totals

---

# 10. Safety policy correction

Retain the four-layer approach, but make it operationally precise.

## Layer A: universal session safety

Once per training session.

It must not be repeated by equipment cues.

## Layer B: equipment-family first use

Once per relevant family per session.

Create an explicit family hierarchy and de-duplication rule.

Suggested families:

- `chair`
- `generic_support`
- `step_or_stair`
- `long_band_handheld_or_foot_anchored`
- `door_anchor_band`
- `mini_band`
- `floor_transfer`
- `balance_support`

For every exercise specify exactly which family, if any, applies.

Do not assign `chair` merely because a counter is also allowed.

## Layer C: exercise-specific safety

Use only where a material, non-obvious risk is not already addressed by the instruction or equipment-family cue.

Default maximum: one short line.

## Layer D: reactive recovery

Only when a real problem occurs.

## Mandatory corrections

- `safe-chair-first-v2` must not be used for counter-only or generic-support movements.
- Supported hip-flexor stretch must use its actual support contract.
- Incline push-up must distinguish chair versus counter if stability advice differs.
- Door-anchor safety must not duplicate general band safety unnecessarily.
- Floor safety must not tell a user to keep support nearby if the product does not actually require or provide a practical transfer plan.
- Do not use `camera`, `tracking`, `reset`, or internal-state wording where direct action language works better.

For every existing safety cue, retain the V1 migration action or correct it with evidence.

---

# 11. Exact training contract correction

Create one row for every currently registered exact level.

For each include:

- Exercise id
- Display name
- Release status
- Set type
- Set count
- Target
- Target semantics: total, per side, or per event
- Rest
- Equipment
- Support
- Orientation
- Laterality class
- Side schedule
- Whether production supports that schedule
- First-use script
- Later-set script
- Target script
- Set-plan policy
- Side-switch script if valid
- Active progress policy
- Equipment-family safety
- Exercise-specific safety
- Repeat-instructions sequence
- Full composed duration for each voice
- Voice-first verdict
- Freeze status
- Blocking decision ids
- Source files/symbols

## Set-plan policy

Reconsider whether every first exposure needs `Two sets today` or `Three sets today`.

Prefer removing set-plan speech when:

- The user does not need it to perform the current set
- It materially lengthens setup
- The UI already shows it
- `last-set` or rest logic gives sufficient later context

If set count is useful, define exactly when it is spoken.

Do not automatically preserve the V1 set-plan asset surface.

## First-use versus later-set

The later-set experience should not replay only an exercise name if side or target context has changed.

A later-set sequence may include:

- Concise exercise name
- Current side, only when needed
- Current target, only when not already obvious or unchanged
- No repeated equipment safety
- Fresh countdown

---

# 12. Mandatory script editorial pass

Rewrite proposed scripts to sound natural, premium, calm, and concise.

## Required replacements or improvements

Do not blindly use these exact alternatives, but meet their intent.

### Framing ready

Replace technical phrasing such as:

`You are framed. Stay there.`

Use natural action language such as:

`You're in position. Stay there.`

### Micro-check completion

Replace:

`Got it. That is logged.`

Use a simple completion such as:

`Check complete.`

### Training intro

Remove:

`the screen is here for backup`

Avoid defensive language. State that Pearl will guide the session without overpromising perfect eyes-off use.

### Session completion

Remove generic hydration advice and canned lifestyle sign-off unless specifically justified.

Prefer concise closure.

### Chair-power micro check

Do not say both:

- `Five quick chair stands`
- `Five quick stands`

Choose one target statement.

### Static holds and stretches

Do not use `Move for thirty seconds` for:

- Wall calf stretch
- Supported hip-flexor stretch
- Any static hold

Use hold-specific language.

### Step-up

Verify and state:

- Leading foot
- Which foot leads the step down
- Whether legs alternate within a set or between sets
- Whether target is total or per side

Do not write final copy until this is verified.

### Mini-band lateral walk

Do not say `above ankles or knees`.

Use the product-selected placement or mark the script blocked by a founder decision.

### Shoulder assessment

Do not say `left arm` without also specifying which side faces the phone.

The side selection, camera orientation, grader side, and persisted result side must agree.

### Support wording

Do not mention a chair where only a wall/counter is required.

### Implementation language

Remove or prohibit:

- framed
- logged
- reset
- V1
- tracking pipeline
- official side schedule
- just for the camera
- stale callback
- internal state terminology

### Praise

Use praise sparingly.

Do not repeat `Nicely done`, `Lovely`, or similar after every small item.

---

# 13. Deterministic active-guidance rules

Use exact rules, not subjective conditions.

## Rep sets

- Accepted reps use existing rep-credit SFX.
- No spoken rep count by default.
- No `two reps left` by default.
- Set completion cue only when needed.
- No progress cue should interrupt movement instructions, tracking recovery, or stop cues.

## 15-second holds

- `Five seconds left` at 10 seconds elapsed.
- No halfway cue.

## 20-second holds

- `Halfway` at 10 seconds elapsed.
- `Five seconds left` at 15 seconds elapsed.

## 30-second timed movements or holds

- `Halfway` at 15 seconds elapsed.
- `Five seconds left` at 25 seconds elapsed.
- No default `Ten seconds left`.

## 12- or 14-second ROM/capture windows

- No active progress.
- End/return cue only.

## Suppression

- Optional progress uses `low_reassurance`.
- If the voice channel is busy with a higher-priority cue at its scheduled moment, drop it.
- Never replay a stale progress cue.
- Do not delay the timer to make room for progress audio.
- The same rules must apply to Clara and Marcus.

---

# 14. Assessment and micro-check protocol correction

## Chair stand

Verify and specify:

- 30-second active window
- Audible-go onset contract
- Result range
- Exact number support
- Zero-rep wording
- Singular/plural
- Retry
- Tracking interruption

The spoken number must equal the accepted result.

## Balance ladder

Document current production exactly.

Do not silently approve eyes-closed home balance.

Create a founder decision for eyes-closed stages if still present in default production.

Do not add semi-tandem merely because an asset exists.

## Shoulder

Do not hard-code left without evidence.

Specify the recommended reliable-side-at-baseline and persisted-retest model, while clearly marking the production changes required later.

Define which side faces the phone.

## Hinge/forward reach

Clarify whether near-side dynamic measurement matters to comparability.

Use battery-order-independent language.

## Micro checks

For each:

- Remove redundant setup/target lines
- Keep the flow quick
- Define side policy
- Define whether side persistence is available
- Use `Check complete` or equivalent concise closure
- Do not claim result logging in spoken copy

---

# 15. Genuine founder decision sheet

Create at least these decision candidates when supported by source evidence:

1. `FD-001` — How unilateral training work is balanced within a session
2. `FD-002` — How baseline measurement side is selected and persisted
3. `FD-003` — Whether eyes-closed balance remains in an unsupervised default home check-up
4. `FD-004` — Mini-band placement for the initial lateral-walk level
5. `FD-005` — Step-up rep semantics and leg-switch schedule
6. `FD-006` — Whether set count is spoken on first exposure
7. `FD-007` — Whether floor exercises require an explicit transfer-readiness gate or only concise setup copy
8. Any additional evidence-backed decision discovered

For each:

- Make a clear recommendation
- State a safe default
- State whether the script can freeze without approval
- Avoid presenting implementation complexity as a product reason
- Do not leave a decision blank in the spec while claiming it is resolved

The founder decision sheet should be concise enough to review in one sitting.

---

# 16. Cue-count and reuse optimisation

The V1 proposed 186 cue assets/fragments.

Reassess the count.

Do not reduce count at the expense of semantic accuracy, but remove unnecessary duplication.

Evaluate:

- Whether a later-set cue can reuse a concise exercise-name cue
- Whether set-plan cues should be removed
- Whether target phrases can be safely shared
- Whether side fragments are preferable to many whole side-specific variants
- Whether equipment warnings can be shared by family
- Whether progress cues are all needed
- Whether unchanged existing assets can remain
- Whether identical scripts have duplicate keys
- Whether whole-line recordings are preferable to awkward fragment composition

Report:

- V1 proposed count
- V2 proposed count
- Net change
- Count by category
- Count requiring new audio
- Count reusing existing audio unchanged
- Count requiring rewritten audio
- Count retired
- Estimated recordings across two voices
- Reason for every major count change

Do not target an arbitrary low number.

---

# 17. Manifest V2 requirements

Every row must contain:

```text
newCueKey,action,oldCueKeys,flow,category,policyId,proposedNumericPriority,trigger,exactScript,isComposable,compositionRole,firstUseOrRepeat,blocksProgression,mayInterrupt,mayBeInterruptedBy,dropIfBusy,cancelOnStateExit,estimatedClaraMs,estimatedMarcusMs,targetMaxMs,hardMaxMs,wordCount,requiredForVoiceFirst,sourceContract,implementationPhase,freezeStatus,blockingDecisionIds,reviewStatus,notes
```

## Required values

- `freezeStatus`: `ready_for_founder_review`, `blocked_by_decision`, `ready_for_preview`, or `retired`
- `reviewStatus`: default `needs_human_review`
- `blockingDecisionIds`: semicolon-separated decision ids or empty
- `policyId`: must resolve to the canonical policy table
- `action`: must be one of:
  - `reuse_existing`
  - `rewrite_existing_key`
  - `new_asset`
  - `new_composable_fragment`
  - `retire`
  - `conditional_only`

## Validation

Fail if:

- Duplicate active cue key
- Missing policy id
- Category-policy mismatch
- Retired cue appears in active flow
- Blocked script is marked ready for preview
- Exact script differs between CSV and JSON
- Word count differs
- Duration estimate missing
- A required voice-first cue has no source contract
- A cue has incompatible interrupt fields for its policy

---

# 18. Human review document V2

Use this structure:

# Pearl Voice Script Review V2

## How to Review

Explain that lines marked `[DECISION REQUIRED: FD-xxx]` are not frozen.

## Session-Wide Training Lines

## Equipment First-Use Lines

## Exact Training Instructions

One subsection per exact level:

- First-use sequence in actual spoken order
- Later-set sequence
- Progress cues
- Side cue
- Completion/rest
- Estimated complete sequence duration, not just instruction duration
- Freeze status
- Decision marker if blocked

## Movement Check-Up

Show exact runtime order.

## Micro Checks

Show exact runtime order.

## Shared Setup and Recovery

## Controls

## Completion Lines

## Reused Existing Lines

## Retired Lines

## Decision-Blocked Lines

Do not clutter this document with source-code tables.

---

# 19. V2 implementation plan

The implementation plan must begin only after the relevant approval gates.

Use phases such as:

## Phase 0: founder/protocol decisions

No production code.

## Phase 1: script line review and freeze

No production code or external audio API.

## Phase 2: small Clara preview pack

Generate only a representative sample after explicit approval in a later task.

Suggested preview sample:

- Training intro
- Universal safety
- One bodyweight instruction
- One balance instruction
- One band instruction
- One door-anchor instruction
- One check-up instruction
- One micro-check instruction
- Framing ready
- Tracking lost
- Tracking recovered
- Pause
- Skip
- Session completion
- One composable target sequence

Do not generate it now.

## Phase 3: preview listening revisions

## Phase 4: cue schema and feature flag

## Phase 5: exact training mapping

## Phase 6: safety and controls

## Phase 7: assessment side metadata and protocol-version work

## Phase 8: both-voice generation

## Phase 9: timeline re-audit and automated tests

## Phase 10: Android/iOS QA and beta rollout

For each phase specify:

- Scope
- Inputs required
- Approval gate
- Likely files
- Risk
- Tests
- Audio requirement
- Rollback

---

# 20. V2 JSON structure

Use a top-level structure similar to:

```json
{
  "specVersion": 2,
  "generatedAt": "...",
  "status": "proposed_for_founder_review",
  "sourceArtifacts": [],
  "v1CorrectionLedger": [],
  "principles": [],
  "timingBudgets": [],
  "cuePolicies": [],
  "equipmentFamilyHierarchy": [],
  "trainingLateralityModel": [],
  "officialMeasurementSidePolicy": {},
  "flowTimelines": {},
  "exerciseContracts": [],
  "assessmentContracts": [],
  "microCheckContracts": [],
  "controlContracts": [],
  "progressRules": [],
  "safetyPolicy": {},
  "existingCueMigration": [],
  "cueManifest": [],
  "composedTimelines": [],
  "founderDecisions": [],
  "retiredCues": [],
  "conditionalCues": [],
  "cueCountSummary": {},
  "implementationPlan": [],
  "acceptanceCriteria": [],
  "deviceQaPlan": [],
  "validation": {}
}
```

Keep the JSON valid and do not include comments.

---

# 21. V2 Markdown structure

Use this exact high-level structure:

# Pearl Voice Experience Specification V2

## 1. Status and Executive Summary

## 2. V1 Correction Ledger

## 3. Product and Voice Principles

## 4. Remaining Founder/Protocol Decisions

## 5. Canonical Cue Policy and Priority Model

## 6. Timing and Complete-Sequence Budgets

## 7. Training Laterality Model

## 8. Official Measurement-Side Policy

## 9. Training Session Timeline

## 10. Active Guidance Rules

## 11. Exact Training-Level Contracts

## 12. Safety and Equipment-Family Policy

## 13. Shared Camera, Orientation, and Recovery

## 14. Countdown and Audible-Go Contract

## 15. Movement Check-Up Contracts

## 16. Micro-Check Contracts

## 17. Pause, Resume, Repeat, Retry, Skip, Discard, and Cancel

## 18. Existing Cue Migration

## 19. V2 Cue Manifest and Asset Count

## 20. Script Freeze Criteria

## 21. Corrected Implementation Order

## 22. Preview and Audio Generation Plan

## 23. Physical-Device QA

## 24. Acceptance Criteria

## 25. Validation and Source Index

---

# 22. Acceptance criteria for this task

The V2 specification is complete only if:

## Internal consistency

- JSON, Markdown, script review, manifest CSV, timeline CSV, and founder decision sheet agree.
- Every manifest row uses the canonical policy mapping.
- No bilateral exercise has a left/right alternating set policy.
- Training contracts contain no `official side schedule` language.
- No unresolved decision is reported as resolved.
- Every blocked script points to a decision id.

## Training contracts

- Every currently registered exact level has one row.
- Every row has verified target semantics.
- Every row has verified laterality.
- Every side switch is supported by production or marked as requiring programming change.
- Odd-set unilateral imbalance is not silently accepted.
- Static holds use hold language.
- Support and equipment wording match the exact movement.

## Durations

- Complete composed timelines exist for both voices.
- All proposed cue fragments are included in the totals.
- Equipment de-duplication is reflected.
- Inter-asset gaps are modelled.
- Hard failures are fixed or clearly blocked.
- Standing band row is explicitly re-evaluated.

## Copy

- No `framed`, `logged`, `reset`, `V1`, or internal-state phrasing remains in active proposed scripts unless a user-facing use is explicitly justified.
- Chair-power target is not repeated.
- Session completion is concise.
- Progress rules are deterministic.
- Mini-band and step-up ambiguity is resolved or decision-blocked.
- Shoulder side/orientation language is coherent.

## Decisions

- Founder decision sheet exists.
- Every decision includes a recommendation and safe default.
- Eyes-closed balance is not silently approved by the voice spec.
- Measurement-side persistence is not falsely claimed as current behaviour.

## Review order

- Human approval precedes implementation.
- Small Clara preview precedes full generation.
- No audio is generated during this task.

---

# 23. Validation requirements

Before finishing:

1. Parse all source JSON and CSV artifacts.
2. Parse the generated V2 JSON.
3. Parse both generated V2 CSV files.
4. Verify all current exact registered exercise ids are covered exactly once.
5. Verify every V1 manifest cue is migrated, retired, conditional, or superseded.
6. Verify every V2 active cue key is unique.
7. Verify every manifest policy id resolves.
8. Verify category-policy consistency.
9. Verify no bilateral exercise has a side switch or alternating set schedule unless the movement truly alternates direction and no side-specific work imbalance exists.
10. Verify all unilateral/asymmetric odd-set rows are either balanced by production or decision-blocked.
11. Verify target semantics against production.
12. Verify support/equipment against production.
13. Verify static hold language.
14. Verify complete timelines include every cue in actual order.
15. Verify both voices have estimates.
16. Verify 0/100/250 ms inter-asset gap sensitivities.
17. Verify all hard-duration failures are fixed or decision-blocked.
18. Verify the Markdown/JSON/CSV cue counts agree.
19. Verify founder decision ids referenced by scripts exist.
20. Verify no blocked cue is marked ready for preview.
21. Search all active proposed scripts for prohibited language.
22. Run relevant existing tests.
23. Run `npx tsc --noEmit`.
24. Inspect `git status` and `git diff --stat`.
25. Confirm no production file changed.
26. Confirm no audio asset changed.
27. Confirm no external API was called.
28. Remove temporary files.

Do not modify tests to make validation pass.

---

# 24. Final Codex response

When finished, respond with:

- Paths to all six V2 artifacts
- Confirmation that no production code changed
- Confirmation that no audio changed or was generated
- Number of V1 issues corrected
- Number converted into founder decisions
- Number of founder decisions
- Names of all script-freeze blockers
- Number of exact training contracts
- Number of cue assets/fragments in V1 versus V2
- Number ready for human review
- Number blocked by decisions
- Longest ordinary composed setup
- Longest complex-equipment composed setup
- Longest check-up setup
- Longest micro-check setup
- Confirmation that bilateral side-policy errors are zero
- Confirmation that category-policy manifest mismatches are zero
- Validation commands run
- The five most important V2 corrections
- A concise confidence statement

Do not implement production changes or generate audio in this task.
