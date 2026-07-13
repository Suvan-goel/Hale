# Codex Prompt: Pearl Voice Specification V2.1 — Apply Approved Founder Decisions and Prepare Final Human Script Review

Read this entire prompt before starting.

Pearl has completed the following voice-analysis and specification work:

- `docs/audits/PEARL_VOICE_CUE_INVENTORY.md`
- `docs/audits/PEARL_VOICE_CUE_INVENTORY.json`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json`
- `docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST.csv`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2.csv`
- `docs/specs/PEARL_VOICE_FOUNDER_DECISIONS.md`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2.csv`

The founder has now explicitly approved **all seven V2 founder decisions**.

This task must apply those approvals, correct the remaining V2 defects, remove all founder-decision blockers, and produce the final documentation candidate for line-by-line human script review.

This task still does **not** authorize production implementation or audio generation.

---

# 1. Objective

Create Pearl Voice Specification V2.1 as the corrected, internally consistent, decision-complete specification.

V2.1 must:

1. Record all seven founder decisions as approved.
2. Apply each approved decision consistently across training, Movement Check-Up, micro checks, scripts, cue manifest, protocol definitions, and composed timelines.
3. Remove all `blocked_by_decision` states caused by FD-001 through FD-007.
4. Replace founder-decision blockers with explicit future implementation requirements where production cannot yet support the approved design.
5. Fix every remaining hard-duration failure.
6. Fully enforce safety-cue subsumption and de-duplication.
7. Correct setup sequencing so “ready” or “in position” is spoken only after the user reaches the actual movement start position.
8. Remove technical, awkward, redundant, or placeholder language.
9. Remove all active default eyes-closed balance stages and define a versioned eyes-open home protocol.
10. Produce a final human-review script document in actual spoken order.
11. Produce a small, representative Clara preview-pack plan, but do not generate audio.
12. Leave every active cue either:
    - `ready_for_human_review`,
    - `implementation_required_before_preview`,
    - `conditional_legacy_only`, or
    - `retired`.

No cue should remain blocked by an unresolved founder decision.

---

# 2. Strict scope

## Do not

- Change production TypeScript or React Native code
- Change current exercise definitions or prescriptions in source
- Change assessment graders or scoring
- Change persistence schemas
- Change feature flags
- Change runtime cue selection
- Change audio priorities in production
- Change queue behaviour
- Modify production manifests
- Modify tests
- Generate, overwrite, rename, move, or delete MP3s
- Call ElevenLabs or any external API
- Add npm dependencies
- Change `package.json` or `package-lock.json`
- Implement the floor-readiness gate
- Implement side persistence
- Implement unilateral round state
- Implement the new balance protocol
- Implement audible-`go` onset alignment
- Overwrite V1 or V2 specification artifacts
- Commit unrelated changes

## You may

- Add the V2.1 artifacts listed below
- Inspect production code and tests
- Programmatically parse existing JSON and CSV artifacts
- Use temporary local analysis scripts and delete them before finishing
- Run existing validation and type-check commands
- Make final proposed scripts and implementation requirements
- Mark a script as requiring implementation support before preview when the approved product behaviour is not yet representable in production

Production behaviour and audio assets must remain unchanged.

---

# 3. Required deliverables

Create these seven files:

1. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
2. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
3. `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
4. `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
5. `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
6. `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
7. `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

Do not edit the V2 files.

## Artifact roles

### `PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`

The corrected product and engineering specification.

### `PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`

The canonical machine-readable source of truth. The other V2.1 artifacts must agree with it exactly.

### `PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`

The founder-facing line-by-line script review document. It must show actual proposed runtime order and complete composed sequence duration.

### `PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`

One row per active, conditional, reused, rewritten, new, or retired cue.

### `PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`

Complete timelines for both voices and 0/100/250 ms inter-asset gap assumptions.

### `PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`

A concise immutable decision record showing the seven approvals, the exact interpretation used in V2.1, and the resulting production requirements.

### `PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

A plan for a later limited Clara preview generation task. It must identify the smallest representative cue set that validates tone, pace, whole-line recordings, composition seams, side fragments, safety, recovery, and assessment instructions.

Do not generate the preview pack now.

---

# 4. Evidence requirements

Treat V2 as a draft, not authority.

Independently verify all affected behaviour against production source, including at minimum:

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
- `src/checkup/protocolSetup.ts`
- `src/preflight/preflight.ts`
- `src/preflight/movementCameraReadiness.ts`
- `src/preflight/promptTiming.ts`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/releasePolicy.ts`
- `src/exercises/common.ts`
- `src/exercises/setGraders.ts`
- Every exact exercise definition
- Every assessment definition
- Result/persistence types relevant to protocol version and selected side
- The three session screens
- Relevant tests

Verify:

- Current set and target semantics
- Which exercises are truly unilateral or asymmetric
- Which already move in both directions within a set
- Which graders can support alternating sides
- Which data models can persist side
- Which balance stages are currently default
- Which equipment-safety lines are genuinely necessary
- Whether the current setup state can represent pre-instruction and final-position readiness separately
- Which cue fields are runtime-composable
- Which scripts can be frozen independently of pending implementation work

Do not hide implementation gaps by writing authoritative spoken copy that production cannot yet honour.

---

# 5. Approved founder decisions

All seven decisions below are approved. Record them as `approved` in V2.1.

## FD-001 — Unilateral and asymmetric training uses a both-sides round

Approved product rule:

- A training `round` is not complete until the prescribed work has been completed on both sides.
- Complete one side, speak a concise side-change cue, complete the other side, then enter rest.
- Never use an odd left-right-left side-specific set schedule.
- Both sides must receive equal prescribed work within the session.
- The side that goes first may alternate by round to avoid permanent order bias:
  - Round 1: left then right
  - Round 2: right then left
  - Round 3: left then right
- Do not speak total round count by default.
- Do not use the phrase `approved leg`, `approved side`, or `official side schedule`.
- Mini-band lateral walk is not blocked by FD-001 because it already moves in both directions within one timed set.

Important dose constraint:

- Do not silently double current training volume by reinterpreting every existing side-specific set as a full both-sides round.
- V2.1 must separate the **voice/state architecture** from the final dose conversion.
- Create a dose-preservation table for every affected exercise:
  - current total programmed dose,
  - proposed both-sides structure,
  - whether target or round count must change,
  - implementation owner,
  - validation required.
- Scripts must use dynamic target phrases where final dose conversion is not yet encoded.
- A script may be ready for human review even when the new round state requires implementation, provided it does not hard-code an unverified round count or doubled target.

Affected exercises must be independently discovered. At minimum inspect:

- Single-leg hold
- Tandem hold
- Chair-supported split squat
- Seated hamstring reach
- Supported hip-flexor stretch
- Wall calf stretch
- Any other unilateral/asymmetric level

## FD-002 — Reliable, comfortable baseline side is persisted for official comparability

Approved product rule:

- At baseline, Pearl selects or confirms a side that is:
  - comfortable for the user, and
  - reliably measurable in the required camera orientation.
- Persist the exact selected side with the official result.
- Official re-tests use the same side.
- Relevant micro checks use the same persisted side where they are intended to be longitudinally comparable.
- If the opposite side must be used, mark the result as reduced comparability.
- Manual extra checks do not silently replace the official side.
- Do not claim same-side progress before side metadata is implemented.
- Do not hard-code left.

Required V2.1 side-aware voice design:

- Use natural side-specific whole lines or short composable side fragments.
- The spoken side and the side nearest the phone must agree.
- Define both left and right variants.
- Avoid awkward fragments that sound robotic.
- Example concepts to support:
  - left side nearest the phone
  - right side nearest the phone
  - raise the selected arm
  - stand on the selected leg
  - extend the selected leg
  - switch sides
- Clearly distinguish training-side state from official measurement-side persistence.

Protocol implications:

- Add a protocol-version requirement.
- Add result metadata requirements.
- Add history/comparability requirements.
- Existing legacy results with unknown side remain `side_unknown_raw_only`.
- Do not silently compare unknown-side legacy values with same-side V2.1 values as equivalent.

## FD-003 — Default unsupervised home balance is eyes-open only

Approved product rule:

- Remove eyes-closed stages from the new default unsupervised home Movement Check-Up.
- The new default progression is:
  1. Feet together, eyes open
  2. Semi-tandem, eyes open
  3. Tandem, eyes open
  4. Single-leg, eyes open
- Keep sturdy support within easy reach.
- Eyes-closed stages may remain only as:
  - `conditional_legacy_only`, or
  - a future separately approved supervised/optional protocol.
- Do not emit `close-your-eyes` in the V2.1 default home protocol.
- Do not delete existing assets in this task.
- Give the new protocol an explicit new version/id.
- Historical balance results from the old protocol must remain identifiable as old-protocol results.
- Do not make direct score-change claims across the old and new balance protocols without an explicit comparability rule.
- If no valid cross-version mapping exists, the first new-protocol official result becomes the new balance baseline.

V2.1 must define:

- New stage ids
- Stage order
- Stage spoken scripts
- Support wording
- Progression/termination behaviour
- Protocol version
- Legacy handling
- Result history behaviour
- Tests required later

Preserve current scoring only where valid. Do not invent a direct old-to-new conversion.

## FD-004 — Initial mini-band lateral walk uses the band above the knees

Approved product rule:

- The initial mini-band lateral-walk level uses the band above the knees.
- Ankle placement is not an alternative in the same level.
- Ankle placement may become a later, explicitly named progression.
- Remove FD-001 from this exercise.
- The exercise moves in both directions within the timed set.
- Avoid repeating band placement and controlled-step language in both the instruction and safety line.

## FD-005 — Step-ups alternate leading leg every repetition

Approved product rule:

- The target is 12 total repetitions.
- Alternate the leading leg every repetition.
- This produces six repetitions led by each leg.
- Each repetition returns both feet to the floor before the opposite leg leads the next repetition.
- The voice must explain the alternating pattern clearly but concisely.
- No left-right-left set schedule.
- If the current grader cannot reliably support alternating leading legs:
  - the intended script may still be frozen,
  - but the exercise must be marked `implementation_required_before_preview` or withheld from the V2.1 runtime until the grader/session state supports the approved contract.
- Do not ship misleading voice that claims alternating-leg measurement if production cannot enforce it.

## FD-006 — Do not speak total set count during setup

Approved product rule:

- Do not speak `Two sets today`, `Three sets today`, or equivalent setup lines.
- Remove active set-plan cue assets from V2.1.
- Keep set count visible in the interface.
- Retain a concise `last set` cue only where useful.
- Do not replay set count through Repeat Instructions.
- This approval should reduce asset count and setup duration.

## FD-007 — Add a one-time floor-transfer readiness gate

Approved product rule:

- Before a user can receive floor exercises, ask:
  - `Can you safely get down to the floor and back up without assistance?`
- Answer options:
  - Yes
  - No
  - Not sure
- `No` or `Not sure` substitutes floor exercises.
- `Yes` makes the user eligible, but does not remove ordinary stop/pain controls.
- The gate belongs in capability/safety planning, not as a long repeated voice warning before each floor set.
- Eligible users hear one concise first-use floor transition/setup cue per session.
- Do not tell a user they are “in position” before they have moved onto the floor.
- Do not promise that Pearl can assist a floor transfer.

V2.1 must identify:

- Recommended product placement of the gate
- Persistence field
- Substitution behaviour
- Re-check/edit path
- Voice implications
- Tests required later

Do not implement the gate now.

---

# 6. V2-to-V2.1 correction ledger

Create a correction ledger in Markdown and JSON.

At minimum include:

## V21-001 — All founder decisions approved

- Replace blank founder fields with approved records.
- Remove founder-decision blocking ids from active scripts.
- Replace them with implementation requirements where needed.

## V21-002 — Hard-duration failures

The V2 report contains active sequence hard-limit breaches, including examples such as:

- Seated band row
- Step-up
- Chair-power micro check

V2.1 must have **zero active hard-max failures at the 250 ms inter-asset gap assumption**.

## V21-003 — Safety de-duplication

Correct duplicate stacks such as:

- `generic_support` plus `balance_support`
- `generic_support` plus `step_or_stair`
- mini-band instruction plus duplicate mini-band safety
- door-anchor plus general band safety when the specific line subsumes it
- chair/support warnings already fully expressed by the exact setup instruction

## V21-004 — Final-position sequencing

Correct sequences that say a user is ready before they have assumed the actual position, especially:

- Floor exercises
- Chair exercises
- Step exercises
- Door-anchor exercises
- Any movement that materially changes body position after initial preflight

## V21-005 — Technical copy

Remove active proposed use of:

- `capture`
- `approved leg`
- `approved side`
- `logged`
- `framed`
- `reset`
- `V1`
- `official side schedule`
- implementation-state wording

## V21-006 — Mini-band misclassification

- Remove FD-001 from mini-band lateral walk.
- Mark it as both directions within one timed set.
- Use above-knees placement.

## V21-007 — Balance protocol

- Remove eyes-closed stages from new default.
- Add semi-tandem eyes-open.
- Version the new protocol.
- Keep old cues conditional legacy only.

## V21-008 — Set-plan surface

- Remove active set-count lines and assets.
- Recompute asset count and timelines.

## V21-009 — Human review readiness

- No cue is automatically audio-approved.
- Active scripts become `ready_for_human_review` only after all consistency and duration checks pass.
- The preview plan is documentation-only.

---

# 7. Correct runtime sequence model

V2.1 must model the desired future sequence, not merely repeat the current flawed order.

## A. General standing exercise

1. Item transition and required orientation
2. General visibility preflight
3. First-use setup instruction or later-set reminder
4. Movement-specific final-position readiness
5. Short confirmation only if useful
6. Target phrase if not already naturally integrated
7. Countdown
8. Active work

## B. Exercise requiring material setup or position change

For chair, floor, step, door-anchor, band placement, or another material setup:

1. Item/equipment transition
2. One applicable first-use equipment instruction or safety line
3. Movement setup instruction
4. User assumes final start position
5. Movement-specific readiness evaluates the actual start position
6. Short final confirmation, such as `You're set.`, only after readiness passes
7. Target phrase
8. Countdown
9. Active work

Do not say `You're in position` before:

- lying on the floor,
- sitting on the chair,
- attaching the band,
- facing the step,
- assuming tandem/split stance,
- turning the selected side toward the phone.

## C. Later sets

If the user remains in a valid start position:

1. Concise later-set reminder
2. Side cue if the next side differs
3. Dynamic target only if needed
4. Fresh countdown

Do not replay:

- universal safety,
- equipment first-use safety,
- total set count,
- long first-use instructions.

## D. Recovery

After active tracking loss:

1. Stop/freeze active timing
2. Speak a short direct recovery action
3. Re-establish final-position readiness
4. Speak a short recovery confirmation
5. Restart a complete countdown
6. Resume with a fresh valid attempt according to the movement contract

Never replay stale optional progress cues.

---

# 8. Framing and readiness language

Use natural user-facing language.

Recommended active scripts to evaluate:

- Final-position confirmation: `You're set.`
- General visibility issue: `I need a clearer view. Make sure your whole body is visible.`
- Confirmed low light only: `Please turn on the main light.`
- Tracking loss: `Pause. Return to the setup position.`
- Tracking recovery: `You're back in position. We'll restart.`
- Enter view: `Step into view so your whole body is visible.`
- Centre: `Move to the centre of the view.`
- Farther back: `Move a little farther back.`
- Closer: `Move a little closer.`
- Stability: `Hold still for a moment.`

These are recommendations, not mandatory exact wording, but final lines must be:

- short,
- natural,
- non-technical,
- semantically accurate for the trigger.

`You're set.` should not play automatically when the user does not need an acknowledgement.

---

# 9. Safety-family subsumption

Create an explicit most-specific-wins safety hierarchy.

## Rules

1. Only one equipment-family safety cue may normally play for one setup.
2. A more-specific family subsumes its parent.
3. If the exact exercise setup line already communicates the safety action naturally, do not repeat it as a separate cue.
4. Universal safety is not repeated by an equipment cue.
5. Reactive safety is event-driven only.
6. Balance support subsumes generic support.
7. Step/stair safety subsumes generic support.
8. Door-anchor safety subsumes general long-band safety for that setup.
9. Floor eligibility gate subsumes repeated transfer-readiness narration; eligible users receive one concise first-use floor setup line.
10. Mini-band placement/control should be stated once.

## Required family model

At minimum define:

- `chair_seat`
- `generic_support`
- `balance_support`
- `step_or_stair`
- `long_band_handheld_or_foot_anchored`
- `door_anchor_band`
- `mini_band_above_knees`
- `floor_eligible_user`

For every exact exercise record:

- chosen family
- parent family
- subsumed families
- whether instruction absorbs the family cue
- final emitted safety cue count
- reason

## Hard validation

Fail V2.1 if a normal first-use sequence includes:

- both generic support and balance support,
- both generic support and step safety,
- both general band safety and door-anchor safety,
- duplicate mini-band placement wording,
- duplicate chair stability wording already contained in the setup instruction.

---

# 10. Script and duration optimisation rules

V2.1 must fix duration failures through better product sequencing and writing, not by hiding cues from the model.

## Allowed techniques

- Integrate target into a natural whole instruction where the target is fixed.
- Keep a separate target phrase where readiness scaling or dynamic prescription requires it.
- Integrate required equipment stability into the exact setup instruction.
- Move once-per-session equipment preparation outside the per-exercise countdown path.
- Remove redundant `You're set.` acknowledgements.
- Remove set-count lines.
- Use one most-specific safety line.
- Use concise whole recordings rather than many small fragments where composition would sound robotic.
- Reuse exact identical scripts safely.

## Do not

- Omit a required cue from duration calculations.
- Mark a sequence passing because a cue is “first-use” while still emitting it in the scenario.
- Move a required safety line to a place where the user cannot act on it.
- Shorten by removing essential side, target, equipment, or start information.
- Use unnatural fragments solely to reduce word count.

## Strict duration budgets

Use these budgets:

| Sequence | Target | Hard maximum |
|---|---:|---:|
| Training intro + universal safety | 12 s | 16 s |
| Ordinary first-use pre-countdown sequence | 12 s | 16 s |
| Complex equipment first-use pre-countdown sequence | 16 s | 20 s |
| Later-set reminder including side/target | 4 s | 6 s |
| Repeat-instructions sequence | 10 s | 14 s |
| Check-up assessment setup after general visibility | 12 s | 16 s |
| Micro-check setup after general visibility | 7 s | 10 s |
| Pause/resume/skip/discard/retry confirmation | 2 s | 3.5 s |
| Tracking-loss line | 3.5 s | 5 s |
| Tracking-recovery line | 2.5 s | 4 s |

At the 250 ms inter-asset gap assumption:

- zero active sequence may exceed its hard maximum,
- conditional legacy-only sequences may be reported separately,
- implementation-required intended scripts still need a valid duration model.

If a sequence still exceeds a hard maximum, rewrite or merge it until it passes.

---

# 11. Exercise-level requirements

Create one exact contract for every currently registered exercise.

## Required fields

For each level record:

- Exercise id
- Display name
- Release status
- Current production reachability
- Intended V2.1 reachability
- Set type
- Current set count
- Current target
- Current total programmed dose
- Target semantics
- Approved laterality class
- Approved side/round model
- Proposed dose-preserving migration requirement
- Whether production supports the intended behaviour
- Implementation requirement
- Equipment
- Support
- Orientation
- First-use spoken sequence
- Later-set sequence
- Side-change sequence
- Dynamic target grammar
- Active progress rule
- Safety family
- Whether safety is absorbed into instruction
- Repeat-instructions sequence
- Clara duration estimate
- Marcus duration estimate
- 0/100/250 ms complete sequence totals
- Human-review status
- Preview eligibility status
- Sources

## Unilateral round scripts

Do not use placeholders such as `approved side`.

Use side-aware natural scripts.

Examples of acceptable architecture:

### Single-leg hold

- Exercise line: `Single-leg hold. Keep support close.`
- Side line, left-first variant: `Start on your left leg. Lift your right foot slightly.`
- Side line, right-first variant: `Start on your right leg. Lift your left foot slightly.`
- Target: `Hold for [duration].`
- Side change: `Switch legs.`
- After second side: rest

### Tandem hold

- Exercise line: `Tandem hold. Keep support close.`
- Side line variants:
  - `Place your left foot in front, heel to toe.`
  - `Place your right foot in front, heel to toe.`
- Side change: `Switch foot positions.`

### Split stance or stretch

Use explicit left/right foot-forward variants and a concise `Switch sides.` cue.

### Seated hamstring reach

Use explicit extended-leg variants and `Switch legs.`

Choose whole-line or composable variants based on acoustic naturalness and cue count.

## Mini-band lateral walk

Required meaning:

- Band above knees
- Small controlled side steps
- Move in both directions within the timed set
- No FD-001 dependency
- No duplicate mini-band safety sentence

## Step-up

Required meaning:

- Lowest stable step
- Support nearby
- 12 total reps
- Alternate leading leg every rep
- Both feet return to floor before next rep
- No side-specific set schedule

Proposed concise script should communicate the alternating rule without becoming overly long.

If production cannot enforce it, mark:

- intended script: `ready_for_human_review`
- runtime eligibility: `implementation_required_before_preview`

Do not leave it as a founder decision.

## Static ROM and stretch wording

Do not use `Capture for twelve seconds` or `Capture for fourteen seconds`.

Prefer direct user actions such as:

- `Move slowly until I say stop.`
- `Reach gently and hold until I say relax.`
- `Hold there until I say stand tall.`

The exact wording must match whether the grader wants:

- repeated movement,
- peak capture,
- a static hold,
- or return to neutral.

---

# 12. Movement Check-Up V2.1 protocol requirements

## A. Chair stand

Specify:

- Final setup script
- Arms position
- Audible-`go` onset timing
- 30-second active window
- Times-up
- Exact result support through accepted maximum
- Zero result
- Singular/plural
- Retry
- Tracking loss

No spoken result may differ from accepted result.

## B. New default home balance protocol

Create a new protocol id and version, for example:

- `home_balance_eyes_open_v2`

Do not use that exact id if repository naming conventions suggest a better stable id.

Required default stages:

1. Feet together, eyes open
2. Semi-tandem, eyes open
3. Tandem, eyes open
4. Single-leg, eyes open

For each stage specify:

- Setup cue
- Selected/lead side where relevant
- Support rule
- Stage duration from production or proposed protocol
- Success/termination rule
- Transition
- Tracking interruption
- Result metadata

Required copy principles:

- Do not say `Close your eyes`.
- Do not hard-code a leg that conflicts with persisted side policy.
- Use short stance-specific instructions.
- Keep support nearby.
- Do not over-narrate each stage.

Legacy eyes-closed cues:

- remain bundled but `conditional_legacy_only`,
- are absent from the V2.1 default manifest flow,
- are not regenerated unless a later legacy-support task requires them.

Protocol migration:

- version new results,
- preserve old results,
- make first new-protocol result a new balance baseline unless a validated mapping exists.

## C. Shoulder assessment

Use the persisted selected side.

Required semantic alignment:

- selected side is nearest the phone,
- spoken arm matches selected side,
- grader evaluates selected side,
- official result stores selected side,
- retest reuses selected side.

Proposed structure:

1. `Turn so your [selected] side is nearest the phone.`
2. `Raise your [selected] arm as high as comfortable.`
3. `Hold there until I say relax.`
4. `Relax your arm.`

Use natural whole variants or fragments.

## D. Hinge/forward reach

Use battery-order-independent wording.

Do not say `Last one`.

Use a direct action and return cue.

If the grader dynamically uses a near side, document how selected-side metadata and camera orientation reconcile.

## E. TUG

Keep beta/custom only unless current release policy proves otherwise.

Do not add it to the default battery.

---

# 13. Micro-check V2.1 requirements

## Chair power

- Keep it quick.
- Say the five-stand target once.
- Do not immediately repeat it in a second target line.
- End on five accepted stands or the existing safety cap.
- Rep progress remains SFX-only.
- Use concise completion such as `Check complete.`
- Total setup must pass 10 seconds at the 250 ms gap model.

## Single-leg balance

- Use the persisted official standing leg where available.
- If no official side exists, establish and persist a micro-check baseline side before claiming longitudinal comparability.
- Speak the exact leg.
- Keep support nearby.
- Do not use `approved leg`.

## Mobility reach

- Use the persisted selected leg where intended for comparability.
- Speak the exact extended leg.
- Replace technical capture language.
- Ensure the grader measures the same side the voice requests.

## General micro-check copy

- No long generic intro.
- No `logged`.
- No duplicate target.
- Concise completion.
- Tracking recovery follows the same fresh-countdown policy.

---

# 14. Floor-readiness gate specification

V2.1 must include a product contract for FD-007.

## Required gate

Prompt:

`Can you safely get down to the floor and back up without assistance?`

Options:

- Yes
- No
- Not sure

## Required behaviour

- `Yes`: floor exercises may be eligible.
- `No`: substitute floor exercises.
- `Not sure`: substitute floor exercises.
- User can revise the answer in safety/profile settings.
- Re-ask only when the profile answer is missing, not before every floor session.
- No supporter or family member is notified by default.
- No medical claim is made.
- No floor exercise is inserted when eligibility is false or unknown.

## Recommended persistence

Define a stable field such as:

- `floorTransferCapability: 'yes' | 'no' | 'unsure' | 'unknown'`

Use repository naming conventions if a better field already exists.

## Voice consequence

Eligible user's first floor item per session:

- one concise transition/setup line,
- then final-position readiness,
- then `You're set.` only after the user is actually in position.

Do not repeat a long transfer warning before every floor set.

---

# 15. Audible-`go` timing contract

Preserve the approved rule:

- Active timing aligns to the audible onset of `go`.
- Do not wait for the entire `go` file to finish.
- Do not start merely when `speak()` is dispatched.
- Preferred implementation: actual playback-start/onset callback.
- Fallback: measured per-platform calibration.
- No blind 604 ms delay.
- Clara and Marcus must produce the same active-state outcome.
- Retry, resume, and tracking recovery use a fresh countdown.

V2.1 must list:

- required production changes,
- device measurements,
- test cases,
- acceptable onset error budget,
- fallback behaviour if the `go` asset is missing.

Do not implement now.

---

# 16. Control and recovery scripts

Produce concise final proposed scripts for:

- Pause
- Resume
- Repeat instructions
- Retry
- Training skip
- Check-up skip
- Micro-check discard
- Tracking loss
- Tracking recovered
- Set complete
- Rest
- Last set
- Exercise transition
- Session complete
- Check-up complete
- Micro-check complete

Use calm direct language.

Recommended style:

- `Paused.`
- `Resuming.`
- `Let's try that again.`
- `Skipped. Moving on.`
- `Check discarded.`
- `Pause. Return to the setup position.`
- `You're back in position. We'll restart.`
- `Session complete.`

Do not blindly use these exact scripts if a more natural line better fits the runtime.

Avoid:

- unnecessary praise,
- hydration advice,
- `logged`,
- `tracking`,
- `reset`,
- technical state language.

---

# 17. Deterministic progress rules

Retain the approved V2 rules:

## Rep sets

- Accepted rep SFX only.
- No spoken rep-by-rep counting.
- No default `two reps left`.
- No optional progress cue.

## 15-second holds

- `Five seconds left` at 10 seconds elapsed.

## 20-second holds

- `Halfway` at 10 seconds.
- `Five seconds left` at 15 seconds.

## 30-second timed movement or hold

- `Halfway` at 15 seconds.
- `Five seconds left` at 25 seconds.
- No default `Ten seconds left`.

## 12- or 14-second ROM windows

- No progress cue.
- End/return cue only.

## Suppression

- Progress uses `low_reassurance`.
- Drop if a higher-priority cue is active.
- Never replay stale progress.
- Do not delay the active timer for progress audio.

---

# 18. Cue policy model

Retain one canonical policy table.

Required policies:

- `critical_stop`
- `critical_window`
- `result_transition`
- `instruction`
- `setup_recovery`
- `low_reassurance`

Every active manifest row must reference one valid policy id.

Mandatory mappings:

| Category | Policy |
|---|---|
| Active stop / times-up / active tracking loss | critical_stop |
| Countdown / go | critical_window |
| Pause / resume / retry / skip / discard | result_transition |
| Results / completion / transitions | result_transition |
| Exact setup instruction / target / first-use safety | instruction |
| Preflight / orientation correction / final-position readiness | setup_recovery |
| Optional halfway / five-seconds-left | low_reassurance |

Fail validation if:

- a row has no policy,
- category conflicts with policy,
- critical stop is droppable,
- low reassurance blocks progression,
- a blocked implementation cue is presented as currently runtime-ready.

---

# 19. V2.1 manifest requirements

Use these columns:

```text
newCueKey,action,oldCueKeys,flow,category,policyId,proposedNumericPriority,trigger,exactScript,isComposable,compositionRole,firstUseOrRepeat,blocksProgression,mayInterrupt,mayBeInterruptedBy,dropIfBusy,cancelOnStateExit,estimatedClaraMs,estimatedMarcusMs,targetMaxMs,hardMaxMs,wordCount,requiredForVoiceFirst,sourceContract,implementationPhase,humanReviewStatus,runtimeReadiness,implementationRequirementIds,legacyStatus,notes
```

## Allowed values

### `action`

- `reuse_existing`
- `rewrite_existing_key`
- `new_asset`
- `new_composable_fragment`
- `retire`
- `conditional_only`

### `humanReviewStatus`

- `ready_for_human_review`
- `conditional_legacy_only`
- `retired`

### `runtimeReadiness`

- `ready_after_audio_generation`
- `implementation_required_before_preview`
- `conditional_legacy_only`
- `retired`

No `blocked_by_decision` value is allowed.

## Required validation

Fail if:

- duplicate active cue key,
- missing policy,
- duplicate exact active script with unnecessary separate keys,
- active set-plan cue remains,
- eyes-closed default cue remains,
- mini-band references FD-001,
- `capture` appears in active user-facing scripts,
- `approved side/leg` appears,
- a cue marked ready after audio generation still depends on unimplemented side/round/protocol state,
- CSV and JSON disagree.

---

# 20. Complete timeline requirements

The composed timeline CSV must model both voices and:

- 0 ms gaps,
- 100 ms gaps,
- 250 ms gaps.

For every exact training level include:

1. First use with equipment family not yet introduced
2. First use after family already introduced
3. Later set/round, same side context
4. Side-change path where applicable
5. Repeat instructions
6. Tracking-loss recovery
7. Pause/resume where materially different

Also include:

- Training intro + universal safety
- Every new default check-up assessment
- Every micro check
- Floor eligible first use
- Step first use
- Door-anchor first use
- Mini-band first use
- Chair first use
- Balance first use
- Long-band first use

## Required fields

```text
scenarioId,flow,itemId,voiceId,exposureType,implementationState,gapAssumptionMs,sequenceOrder,cueKeys,scripts,assetCount,estimatedSpeechMs,estimatedTotalMs,countdownStartsAtMs,audibleGoAtMs,budgetClass,targetMs,hardMaxMs,passesTarget,passesHardMax,notes
```

## Hard rule

At 250 ms gaps:

- every active intended scenario must pass hard max,
- no cue may be omitted from its actual sequence,
- implementation-required scenarios still need a passing intended timeline,
- legacy-only scenarios are reported separately and do not affect active V2.1 pass/fail.

---

# 21. Human script review document

Use this exact structure:

# Pearl Voice Script Review V2.1

## Review Status

State that all founder decisions are approved, but no script or audio is yet human-approved.

## Session Entry and Universal Safety

Show exact lines and complete duration.

## Equipment First-Use Lines

Show only lines still emitted after instruction absorption and subsumption.

## Shared Setup and Final-Position Readiness

## Exact Training Instructions

One subsection per exact level:

- Intended release/runtime status
- First-use spoken sequence in actual order
- Later-set/round sequence
- Side-change sequence
- Target
- Progress cues
- Safety
- Repeat-instructions sequence
- Complete Clara and Marcus duration at 100 ms and 250 ms gaps
- Human-review status
- Implementation requirements

## Movement Check-Up

Show exact default runtime order for:

- Chair stand
- New eyes-open balance protocol
- Shoulder
- Hinge/forward reach

## Conditional Legacy Protocols

Show eyes-closed balance and TUG only as conditional legacy/beta content.

## Micro Checks

## Controls and Recovery

## Completion Lines

## Reused Existing Lines

## Rewritten Lines

## New Lines

## Retired Lines

## Implementation-Required Before Preview

Do not include source-code tables in this review document.

---

# 22. Approved decision record

`PEARL_VOICE_APPROVED_DECISIONS_V2_1.md` must include for each FD:

- Decision id
- Status: approved
- Approved rule
- Interpretation used in V2.1
- Script consequences
- Protocol consequences
- Production changes required later
- Migration/versioning consequences
- Validation criteria

It must explicitly state:

- There are zero unresolved founder decisions for V2.1.
- Some approved behaviours still require implementation before runtime preview.
- Approval of the product decision is not approval of generated audio.

---

# 23. Clara preview pack plan

Do not generate audio.

Create a small representative preview pack plan.

The pack should be large enough to validate:

- Clara's tone and pacing
- Short shared prompts
- One ordinary bodyweight instruction
- One unilateral side-aware sequence
- One balance instruction
- One chair exercise
- One long-band instruction
- One door-anchor instruction
- One floor transition
- Step-up alternating-leg instruction
- One check-up instruction
- One micro-check instruction
- Tracking loss/recovery
- Pause/resume/skip
- Completion
- One composable target sequence
- Left/right side variants
- Halfway/five-seconds-left

Keep it deliberately small.

For every preview cue include:

- cue key
- exact script
- why selected
- whole/composable
- expected duration
- review question
- dependency
- whether production integration is required merely to listen

The preview pack must not include every V2.1 cue.

---

# 24. V2.1 JSON structure

Use a top-level structure similar to:

```json
{
  "specVersion": "2.1",
  "generatedAt": "...",
  "status": "ready_for_human_script_review",
  "sourceArtifacts": [],
  "approvedFounderDecisions": [],
  "v2CorrectionLedger": [],
  "principles": [],
  "timingBudgets": [],
  "cuePolicies": [],
  "safetySubsumption": [],
  "setupSequenceModels": [],
  "trainingLateralityModel": [],
  "dosePreservationRequirements": [],
  "officialMeasurementSidePolicy": {},
  "balanceProtocolV2": {},
  "floorReadinessGate": {},
  "flowTimelines": {},
  "exerciseContracts": [],
  "assessmentContracts": [],
  "microCheckContracts": [],
  "controlContracts": [],
  "progressRules": [],
  "cueManifest": [],
  "composedTimelines": [],
  "retiredCues": [],
  "conditionalLegacyCues": [],
  "implementationRequirements": [],
  "claraPreviewPackPlan": [],
  "cueCountSummary": {},
  "acceptanceCriteria": [],
  "deviceQaPlan": [],
  "validation": {}
}
```

Keep JSON valid and comment-free.

---

# 25. V2.1 Markdown structure

Use this exact high-level structure:

# Pearl Voice Experience Specification V2.1

## 1. Status and Executive Summary

## 2. Approved Founder Decisions

## 3. V2-to-V2.1 Correction Ledger

## 4. Product and Voice Principles

## 5. Human Review and Implementation Status Model

## 6. Canonical Cue Policy

## 7. Correct Setup and Final-Position Sequence

## 8. Timing Budgets and Complete Timelines

## 9. Safety Subsumption and Equipment Families

## 10. Training Laterality and Both-Sides Round Model

## 11. Dose-Preservation Requirements

## 12. Exact Training-Level Contracts

## 13. Active Guidance Rules

## 14. Shared Camera and Recovery Guidance

## 15. Audible-Go Timing Contract

## 16. Movement Check-Up V2.1

## 17. Eyes-Open Balance Protocol V2

## 18. Official Measurement-Side Persistence

## 19. Micro Checks

## 20. Floor-Transfer Readiness Gate

## 21. Controls, Recovery, and Completion

## 22. Cue Migration and Asset Surface

## 23. Implementation Requirements Before Preview

## 24. Human Script Review Gate

## 25. Clara Preview Pack Plan

## 26. Later Production Implementation Order

## 27. Acceptance Criteria

## 28. Device QA

## 29. Validation and Source Index

---

# 26. Implementation requirement model

Founder approval removes product ambiguity, but production may still not support the design.

Create stable implementation requirement ids, for example:

- `IR-VOICE-ROUND-STATE`
- `IR-VOICE-SIDE-PERSISTENCE`
- `IR-VOICE-BALANCE-PROTOCOL-V2`
- `IR-VOICE-STEP-ALTERNATION`
- `IR-VOICE-FLOOR-GATE`
- `IR-VOICE-FINAL-POSITION-READINESS`
- `IR-VOICE-AUDIBLE-GO`
- `IR-VOICE-NEW-CUE-SCHEMA`

For every requirement include:

- Purpose
- Approved decision source
- Affected flows
- Likely production files
- Data migration/versioning
- Test requirements
- Feature flag
- Rollback
- Whether it blocks:
  - script review,
  - audio-only preview,
  - integrated runtime preview,
  - beta rollout

Do not call an implementation requirement an unresolved product decision.

---

# 27. Later implementation order

Propose, but do not execute:

1. V2.1 human line review
2. Targeted revisions
3. Clara preview-pack generation in a separately authorised task
4. Listening review
5. Script and cue-key freeze
6. Cue schema + feature flag
7. Final-position setup sequencing
8. Safety-family de-duplication
9. Both-sides training round state
10. Step-up alternating-leg grader support
11. Side persistence and protocol metadata
12. Eyes-open balance protocol V2
13. Floor-readiness gate and substitutions
14. Audible-`go` timing
15. Full Clara and Marcus generation
16. Automated timeline re-audit
17. Android/iOS QA
18. Controlled beta rollout

For every phase specify:

- input approval,
- scope,
- likely files,
- risk,
- tests,
- audio dependency,
- rollback,
- completion gate.

---

# 28. Acceptance criteria

V2.1 is complete only if all of the following hold.

## Decisions

- FD-001 through FD-007 are all recorded as approved.
- Zero unresolved founder decisions.
- Zero `blocked_by_decision` rows.
- Mini-band has no FD-001 dependency.

## Side and laterality

- No bilateral exercise has a side-specific set schedule.
- Every unilateral/asymmetric training item uses the intended both-sides round architecture.
- Scripts contain no `approved side`, `approved leg`, or `official side schedule`.
- Side-specific lines have valid left and right variants.
- Dose is not silently doubled.
- Step-up is exactly 12 total alternating reps in the intended contract.

## Balance protocol

- New default balance stages are eyes-open only.
- Semi-tandem is present.
- `close-your-eyes` is absent from active default flow.
- Old eyes-closed stages are conditional legacy only.
- New protocol version and migration rule are explicit.

## Floor gate

- Gate question and three answers are specified.
- No/unsure excludes floor exercises.
- Voice does not claim readiness before floor position.
- No repeated long floor-transfer warning.

## Safety

- Most-specific-wins hierarchy is enforced.
- No duplicate support-family stack.
- Door-anchor subsumes general band for that setup.
- Mini-band placement/control is spoken once.
- Exact instruction absorption is documented.

## Copy

- No active use of:
  - capture
  - logged
  - framed
  - reset
  - V1
  - approved side
  - approved leg
  - official side schedule
- Chair-power target is spoken once.
- Session completion is concise.
- Static holds use hold language.
- Final-position confirmation occurs at the correct time.

## Set count and progress

- No active set-count setup cues.
- Last-set cue may remain.
- Progress rules are deterministic.
- No 10-seconds-left cue for default 30-second windows.

## Durations

At 250 ms gaps:

- zero active hard-max failures,
- zero implementation-required intended hard-max failures,
- all complete sequences include all emitted cues,
- both voices are modelled.

## Manifest

- Unique active cue keys.
- Valid policy ids.
- Valid category-policy mapping.
- JSON/CSV exact-script agreement.
- No retired cue in active flow.
- Runtime readiness accurately reflects implementation gaps.

## Scope integrity

- No production file changed.
- No test changed.
- No audio changed or generated.
- No external API called.

---

# 29. Validation requirements

Before finishing:

1. Parse all source V2 JSON/CSV artifacts.
2. Parse generated V2.1 JSON.
3. Parse both V2.1 CSV files.
4. Verify all 37 current registered exercise ids appear exactly once.
5. Verify all seven founder decisions are approved.
6. Verify no `blocked_by_decision` remains.
7. Verify every implementation requirement id referenced exists.
8. Verify mini-band has no FD-001 dependency.
9. Verify no bilateral exercise has a side schedule.
10. Verify each unilateral/asymmetric exercise has a both-sides round contract.
11. Verify dose-preservation row exists for every affected exercise.
12. Verify step-up contract is 12 total alternating reps.
13. Verify no set-plan active cue exists.
14. Verify eyes-closed cues are absent from the default active balance flow.
15. Verify semi-tandem is present in the new default.
16. Verify balance protocol version exists.
17. Verify selected-side metadata requirements exist.
18. Verify left/right script variants are complete.
19. Verify floor gate contract exists.
20. Verify no/no-sure substitution behaviour.
21. Verify safety-family subsumption.
22. Verify no duplicate family stack.
23. Verify all prohibited active words/phrases are absent.
24. Verify every active and implementation-required sequence passes hard max at 250 ms gaps.
25. Verify seated band row, step-up, and chair-power micro check specifically pass.
26. Verify both voice estimates.
27. Verify manifest and JSON cue counts agree.
28. Verify script review and manifest exact scripts agree.
29. Verify preview pack is small and representative.
30. Run relevant existing tests.
31. Run `npx tsc --noEmit`.
32. Inspect `git status`.
33. Inspect `git diff --stat`.
34. Confirm only V2.1 docs were added by this task.
35. Confirm no audio asset changed.
36. Confirm no external API was called.
37. Remove temporary files.

Do not modify tests merely to make validation pass.

---

# 30. Final Codex response

When finished, respond with:

- Paths to all seven V2.1 artifacts
- Confirmation that no production code changed
- Confirmation that no tests changed
- Confirmation that no audio was changed or generated
- Confirmation that all seven founder decisions are recorded as approved
- Number of V2 corrections applied
- Number of exact training contracts
- Number of unilateral/asymmetric contracts using both-sides rounds
- Number of implementation requirements
- Number of active cue assets/fragments in V2 versus V2.1
- Number reused unchanged
- Number rewritten
- Number new
- Number retired
- Number conditional legacy only
- Number ready for human review
- Number requiring implementation before integrated preview
- Number of hard-duration failures at 250 ms gaps
- Longest ordinary first-use sequence
- Longest complex-equipment first-use sequence
- Longest check-up setup
- Longest micro-check setup
- New default balance protocol id/version
- Confirmation that default eyes-closed stages are zero
- Confirmation that set-count setup cues are zero
- Confirmation that bilateral side-policy errors are zero
- Confirmation that founder-decision blockers are zero
- Clara preview-pack cue count
- Validation commands run
- The five most important V2.1 changes
- A concise confidence statement

Do not implement production changes or generate audio in this task.
