# Valid-Time Timer Audit

Date: 2026-06-17

## Executive summary

Pearl already has the right high-level seams for valid active time: exercise and
assessment definitions are registry-driven, graders own measurement logic, the
players are frame-timestamp driven, and the pose pipeline emits explicit
`subject-gone` events. The timer gap is narrower than a player rewrite.

The current training player still owns wall-clock windows for `rom` and `timer`
sets. `TimerSetGrader` reports elapsed time regardless of tracking, and
`RomSetGrader` samples only while tracked but still lets the player clock expire
in real time. Training `hold` sets already have strong pose predicates, but they
currently finish on the first debounced condition loss instead of accumulating
valid hold time through pauses and resumes.

Recommended path:

1. Add a shared valid-time accumulator in `src/grading/validTime.ts`, not in the
   session player.
2. Integrate it first through small grader changes: `HoldSetGrader`,
   selected `RomSetGrader` uses, and the assessment ROM graders.
3. Keep fixed clinical/protocol clocks unchanged where the wall clock is the
   measurement, especially the 30-second chair stand.
4. Defer broad setup-gated and subject-visible-only timers until after the high
   confidence holds/captures have replay tests and user-facing copy.

High-confidence Phase 1 exercises:

- Feet-Together Hold
- Tandem Hold
- Single-Leg Hold
- Bridge Hold
- Seated Hamstring Reach
- Shoulder Reach / Shoulder Flexion assessment
- Forward Reach / Hinge Reach assessment

Do not change in Phase 1:

- Rep-based training exercises.
- 30-Second Chair Stand assessment.
- Balance Ladder assessment, except optional metadata unification.
- TUG / Up and Go, which remains beta/non-V1.
- Band/tiny-foot-motion/subtle-rotation timers until a subject-visible or broad
  setup policy is proven.

## Files inspected

- `src/training/sessionPlayer.ts`
- `src/exercises/setGraders.ts`
- `src/exercises/autoregulation.ts`
- `src/training/progression.ts`
- `src/exercises/ladders.ts`
- All exercise definition files under `src/exercises/`
- `src/exercises/types.ts`
- `src/exercises/common.ts`
- `src/exercises/testing/gradeExerciseSet.ts`
- `src/pose/pipeline.ts`
- `src/preflight/preflight.ts`
- `src/checkup/checkup.ts`
- `src/assessment/sessionController.ts`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `src/grading/hold.ts`
- `src/grading/maxRom.ts`
- `src/grading/timedTask.ts`
- `src/movements/chairStand.ts`
- `src/movements/balanceLadder.ts`
- `src/movements/shoulderFlexion.ts`
- `src/movements/hingeReach.ts`
- `src/movements/tug.ts`
- `src/movements/types.ts`
- `src/training/state.ts`
- `src/training/serialize.ts`
- `src/history/serialize.ts`
- `src/audio/cues.ts`

## Current architecture summary

### Training flow

`TrainingSessionPlayer` runs:

`intro -> transition -> preflight -> instructions -> countdown -> set -> rest -> complete`

For each active set:

- It creates a grader from the current `ExerciseDefinition`.
- It sets `setDurationMs` for `rom` and `timer` kinds.
- It leaves `setDurationMs` null for `reps` and `hold`.
- It completes the set when `g.complete`, the player clock ends, or the safety
  cap fires.
- It stores one `SetResult` per completed set in `TrainingSessionResult`.

Current consequences:

- `reps` are user-paced and complete from grader progress.
- `hold` is pose-gated, but behaves like a continuous hold attempt. A loss of
  condition ends the set instead of pausing and later resuming.
- `rom` captures are fixed wall-clock windows. The ROM grader ignores untracked
  frames, but the window still expires while the user is not valid/tracked.
- `timer` sets are pure elapsed wall-clock. `TimerSetGrader` does not require
  landmarks or tracking during the set.

### Training graders

`src/exercises/setGraders.ts` wraps shared primitives:

- `RepsSetGrader`: `RepVelocityTracker`, near-side selection, subject-gone reset,
  rep target, optional velocity autoregulation.
- `HoldSetGrader`: `HoldTracker`, condition predicate, subject-gone interrupt.
- `RomSetGrader`: `MaxRomTracker`, near-side or head-yaw signal, subject-gone
  smoothing reset.
- `TimerSetGrader`: fallback elapsed timer.

`SetResult` currently stores `reps`, `meanVel`, `holdSec`, `romPeak`,
`autoregulated`, `reachedTarget`, `interruptions`, and `flags`.

### Check-up flow

`CheckUpOrchestrator` chains per-movement `SessionController` instances.
`SessionController` treats `MovementDefinition.durationMs` as the active window:

- `durationMs !== null`: controller wall clock ends the item.
- `durationMs === null`: movement grader terminates the item, with a safety cap.

Current assessment behavior:

- Chair stand is fixed 30 seconds and counts reps plus rise velocity.
- Balance ladder is grader-terminated but internally uses a staged schedule and
  hold trackers for each stance.
- Shoulder Reach and Forward Reach are fixed ROM capture windows.
- TUG is grader-terminated, beta/non-V1, and aborts on subject gone.

### Pose and preflight

`PosePipeline` provides the needed validity inputs:

- `out.state`: `no-subject`, `warmup`, `tracking`, `interrupted`.
- `out.events`: includes `subject-gone`.
- smoothed measurement landmarks in `out.frame`.
- raw landmarks for preflight quality checks.
- per-chain reliability windows.
- `bodyUnit` once calibrated.

`PreflightCheck` is intentionally coarse: subject present, framed, stable enough,
and lighting good enough. It should not become exercise-specific position
validation.

### Persistence and progression

Training progression consumes `TrainingSessionResult` immediately through
`applySessionResult`. It currently treats timer/hold sessions as measured when
`holdSec > 0`, and ROM sessions as measured when `romPeak` is finite. It does
not know whether seconds were valid active time or wall-clock time.

Check-up history stores raw `CheckUp` records behind a schema version. Training
state is schema-versioned, but completed set-level metrics are not currently a
primary persisted training history source outside session summaries/progression.

## Shorthand used in the classification table

The table below references these profiles to keep each row readable. The
profile named in a row is the recommended grace behavior, copy, and metadata for
that exercise.

### Grace profiles

- `G0 no-change`: keep current rep, hold, ROM, or timed-task behavior. Existing
  subject-gone handling remains. Do not add valid-time semantics.
- `G1 strong`: start after 750 ms continuously valid; allow 1000 ms transient
  invalid; pause after 1500 ms invalid; resume after 500 ms valid; show trouble
  state after about 20 seconds unable to reacquire a valid position; keep a
  normal set safety cap.
- `G2 broad`: start after 1000 ms broadly valid; allow 1500 ms transient
  invalid; pause after 2000 ms invalid; resume after 750 ms valid; trouble state
  after about 25 seconds without broad setup.
- `G3 visible`: start after 500 ms subject-visible/tracking; pause after 1500 ms
  tracking loss or subject-gone; resume after 500 ms tracking; do not correct
  posture or require exact movement.

### Copy profiles

- `C0 existing`: keep current cues.
- `C1 hold/capture`: "Get into position", "Hold steady", "Timer paused - return
  to position", "Good, timer resumed", "That's your hold".
- `C2 broad`: "Find the position", "Good, keep moving", "Timer paused - reset
  when ready", "Good, timer resumed".
- `C3 visible`: "I lost you for a moment", "Step back into frame", "Good,
  you're back".

All new spoken lines must be added to `src/audio/cues.ts`, synthesized once, and
bundled per voice. They must not call runtime TTS.

### Metadata profiles

- `M0 existing`: keep current `SetResult` or movement result fields.
- `M1 valid-time`: add `validTimeMode`, `targetValidSeconds`,
  `accumulatedValidSeconds`, `wallClockSeconds`, `pauseCount`,
  `longestContinuousValidSeconds`, `positionLostEvents`,
  `trackingLostSeconds`, `completedByValidTime`, `endedBySafetyCap`,
  `validPredicateId`.
- `M2 stable-ROM`: include all `M1` fields plus `stableSampleCount`,
  `romPeak`, `romPeakTimestampMs`, `romPeakCapturedWhileValid`, and optional
  `romValueAtCompletion`.
- `M3 visible-only`: add `targetValidSeconds`, `accumulatedVisibleSeconds`,
  `wallClockSeconds`, `pauseCount`, `trackingLostSeconds`,
  `completedByVisibleTime`, `endedBySafetyCap`.
- `M4 assessment-existing`: keep current assessment result shape, with optional
  future additive fields only after schema review.

## Exercise classification table

### Training exercises

| Exercise | Current behavior | Recommended mode | Why | Candidate predicate | Required landmarks | Confidence | Grace | Copy | Metadata | Complexity | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cushion Sit-to-Stand | Rep-based; knee cycle, near-hip rise velocity. | no_change | Already user-paced; changing timer adds no value. | N/A - retain rep cycle. | Near shoulder/hip/knee/ankle for side chain; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Sit-to-Stand | Rep-based with velocity autoregulation. | no_change | Already completes by reps or autoregulation. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Slow-Lower Sit-to-Stand | Rep-based with velocity autoregulation. | no_change | User-paced; tempo is voice-guided, not timer-scored. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Power Sit-to-Stand | Rep-based with velocity autoregulation. | no_change | Velocity drop already ends the set supportively. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Loaded Sit-to-Stand | Rep-based with velocity autoregulation; optional equipment. | no_change | Camera cannot infer load; rep/velocity trend is enough. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Supported Squat | Rep-based side-view knee cycle. | no_change | Already user-paced; support use cannot be judged reliably. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Squat | Rep-based side-view knee cycle. | no_change | Already user-paced; no timer problem. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Slow-Lower Squat | Rep-based side-view knee cycle. | no_change | Tempo is not robust enough to enforce with pauses. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Loaded Squat | Rep-based side-view knee cycle; optional equipment. | no_change | Load and depth should not be over-interpreted. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Chair-Supported Split Squat | Rep-based side-view knee cycle. | no_change | Optional advanced rep item; exact split-stance quality is fragile. | N/A - retain broad knee-bend cycle. | Near hip/knee/ankle. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Step-Up | Rep-based side-view knee cycle. | no_change | Already user-paced; stair height/foot placement should not be scored. | N/A - retain rep cycle. | Near hip/knee/ankle; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Supported Heel Raise | Rep-based ankle/foot cycle. | no_change | Already user-paced; tiny heel/foot landmarks are too noisy for timer gating. | N/A - retain rep cycle. | Near knee/ankle/foot/heel. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Heel Raise | Rep-based ankle/foot cycle. | no_change | Already user-paced; exact heel height should stay unscored. | N/A - retain rep cycle. | Near knee/ankle/foot/heel. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Supported Toe Raise | Clock timer. | subject_visible_only | Toe lift is subtle and foot landmarks are noisy; only tracking loss should pause. | Subject tracked in side view with body unit; ankles/feet broadly visible; do not require toe height. | Shoulders, hips, knees, ankles, heels, foot indexes. | low | G3 | C3 | M3 | medium | Later / do not implement |
| Bridge Hold | Hold-based; `bridge-up` condition ends on first debounced drop. | strong_valid_time | Hip lift angle is robust enough; valid-time would make reset/pause supportive. | Side/oblique chain reliable; shoulder-hip-knee angle above bridge threshold; hips lifted from resting posture. | Shoulder, hip, knee, ankle; body unit useful. | high | G1 | C1 | M1 | medium | Phase 1 |
| Glute Bridge | Rep-based trunk-extension cycle. | no_change | Already user-paced; rep cycle is the right primitive. | N/A - retain rep cycle. | Near shoulder/hip/knee; hip for velocity. | high | G0 | C0 | M0 | low | Later / do not implement |
| Wall Push-Up | Rep-based elbow cycle. | no_change | Already user-paced; wall distance and hand pressure are not inferable. | N/A - retain rep cycle. | Near shoulder/elbow/wrist. | high | G0 | C0 | M0 | low | Later / do not implement |
| Incline Push-Up | Rep-based elbow cycle. | no_change | Already user-paced; support height is not inferable. | N/A - retain rep cycle. | Near shoulder/elbow/wrist. | high | G0 | C0 | M0 | low | Later / do not implement |
| Push-Up | Rep-based elbow cycle. | no_change | Already user-paced; no timer issue. | N/A - retain rep cycle. | Near shoulder/elbow/wrist. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Overhead Reach | Rep-based shoulder-flexion cycle. | no_change | Current implementation is already rep-driven. If redesigned as a hold/capture, use strong valid-time. | N/A - retain rep cycle. | Near hip/shoulder/elbow/wrist. | high | G0 | C0 | M0 | low | Later / do not implement |
| Band Overhead Press | Rep-based shoulder-flexion cycle. | no_change | Already user-paced; band tension cannot be inferred. | N/A - retain rep cycle. | Near hip/shoulder/elbow/wrist. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Wall-Tap Hinge | Rep-based hip-angle cycle. | no_change | Already user-paced; wall tap itself is not visible. | N/A - retain rep cycle. | Near shoulder/hip/knee. | high | G0 | C0 | M0 | low | Later / do not implement |
| Hip Hinge | Rep-based hip-angle cycle. | no_change | Already user-paced; no timer issue. | N/A - retain rep cycle. | Near shoulder/hip/knee. | high | G0 | C0 | M0 | low | Later / do not implement |
| Feet-Together Hold | Hold-based; narrow-base predicate ends on first debounced step/lift. | strong_valid_time | Both-side front-view ankle geometry is reliable enough for valid active hold time. | Two side chains reliable; torso broadly upright; ankles close horizontally and not vertically separated; no major step. | Shoulders, hips, knees, ankles. | high | G1 | C1 | M1 | medium | Phase 1 |
| Tandem Hold | Hold-based using same narrow-base predicate as feet-together. | strong_valid_time | 2D cannot distinguish tandem depth, but it can detect gross step/lift reset. | Two side chains reliable; stance feet visible; ankles stay in narrow/grounded band; torso upright. | Shoulders, hips, knees, ankles. | medium | G1 | C1 | M1 | medium | Phase 1 |
| Single-Leg Hold | Hold-based; raised-foot predicate ends on touchdown. | strong_valid_time | Ankle vertical separation is robust enough for accumulated valid hold time. | Two side chains reliable; support side stable; raised ankle separated vertically above threshold; no major step. | Shoulders, hips, knees, ankles. | high | G1 | C1 | M1 | medium | Phase 1 |
| Seated Hamstring Reach | ROM capture over fixed 12 second window. | strong_valid_time | Seated side-view trunk/leg geometry is detectable; wall-clock expiry during reset would feel unfair. | Side chain reliable; seated hip/knee/ankle geometry; target leg extended enough; torso flexed/reach sustained before sampling peak. | Shoulder, hip, knee, ankle, heel, foot, wrist. | medium | G1 | C1 | M2 | medium | Phase 1 |
| Neck Rotations | ROM capture over fixed 14 second window using head yaw. | subject_visible_only | Yaw is measurable, but "correct rotation practice" is too subtle; pause only on lost tracking. | Front subject tracked; nose and both ears usable enough for yaw; shoulders visible; do not validate direction/tempo. | Nose, ears, shoulders; hips for broad posture. | low | G3 | C3 | M3 or M2 if ROM metadata is unified | medium | Later / do not implement |
| March in Place | Rep-based near-knee cycle. | no_change | Current implementation is rep-based, not timer-based. If redesigned as duration work, use broad setup-gated. | N/A - retain knee-cycle reps. | Near hip/knee/ankle. | high | G0 | C0 | M0 | low | Later / do not implement |
| Supported Side Step | Clock timer. | broad_setup_gated | Exact side-step quality is brittle, but broad participation is visible front-on. | Two side chains reliable; torso upright; ankle/hip lateral displacement above noise over a rolling window; support stance not gone. | Shoulders, hips, knees, ankles, feet. | medium | G2 | C2 | M1 | medium | Phase 2 |
| Mini-Band Lateral Walk | Clock timer. | broad_setup_gated | Band tension is invisible, but broad lateral stepping can gate active time. | Two side chains reliable; torso upright; repeated lateral ankle/hip displacement; no subject loss. | Shoulders, hips, knees, ankles, feet. | medium | G2 | C2 | M1 | medium | Phase 2 |
| Seated Band Row | Rep-based elbow cycle. | no_change | Already user-paced; band tension and anchor quality are invisible. | N/A - retain elbow-cycle reps. | Near shoulder/elbow/wrist. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Standing Band Row | Rep-based elbow cycle. | no_change | Already user-paced; band tension cannot be inferred. | N/A - retain elbow-cycle reps. | Near shoulder/elbow/wrist. | medium | G0 | C0 | M0 | low | Later / do not implement |
| Band Pull-Apart | Clock timer. | subject_visible_only | Arm movement can be seen, but band tension and shoulder-blade motion cannot; false pauses would frustrate. | Front subject tracked; wrists/shoulders visible; optionally broad hand separation above noise, but do not require exact range. | Shoulders, elbows, wrists, hips. | low | G3 | C3 | M3 | medium | Later / do not implement |
| Thoracic Rotation | Clock timer. | broad_setup_gated | 2D cannot truly see thoracic rotation, but broad upright setup/participation can be detected. | Front subject tracked; torso upright; shoulders/hips visible; optional alternating shoulder-line/head movement above noise. | Nose, shoulders, hips, elbows/wrists optional. | low-medium | G2 | C2 | M1 | medium | Phase 2 |
| Supported Hip Flexor Stretch | Clock timer. | broad_setup_gated | Split stance can be detected broadly; exact stretch intensity cannot. | Side chain reliable; torso upright; front/back leg split stance geometry; hips stay forward enough without scoring depth. | Shoulders, hips, knees, ankles, feet. | medium-low | G2 | C2 | M1 | medium | Phase 2 |
| Wall Calf Stretch | Clock timer. | broad_setup_gated | Broad wall/stretch stance is visible; heel-down and stretch intensity are less reliable. | Side chain reliable; split stance; back leg extended enough if detectable; torso leaning/support stance stable. | Shoulders, hips, knees, ankles, heels, feet. | medium-low | G2 | C2 | M1 | medium | Phase 2 |

### Assessment movements

| Movement | Current behavior | Recommended mode | Why | Candidate predicate | Required landmarks | Confidence | Grace | Copy | Metadata | Complexity | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 30-Second Chair Stand | Fixed 30 second assessment window; rep count and rise velocity. | no_change | The 30 second wall-clock protocol is the measurement; pausing would break norms. | N/A - retain protocol clock and rep grader. | Near hip/knee/ankle, wrist for push-off flag, body unit. | high | G0 | C0 | M4 | low | Later / do not implement |
| Balance Ladder | Grader-terminated staged schedule with hold trackers per stance. | no_change | It already measures maintained hold time within protocol stages; do not change staged schedule. | Existing stance predicates: narrow-base or single-leg ankle separation, sway via pelvis x. | Shoulders, hips, knees, ankles, body unit. | high | G0 | C0 | M4, optional additive valid-hold metadata | low-medium | Later / do not implement |
| Shoulder Reach / Shoulder Flexion | Fixed 9 second ROM capture window. | strong_valid_time | Arm/trunk angle is reliable side-view ROM; capture should wait for stable valid samples. | Side chain reliable; torso broadly upright; target arm elevated above threshold or actively moving into raise; sample peak only while valid. | Hip, shoulder, elbow, wrist optional; chain reliability. | high | G1 | C1 | M2 | medium | Phase 1 |
| Forward Reach / Hinge Reach | Fixed 9 second ROM capture window. | strong_valid_time | Side-view wrist-to-floor reach can be sampled only while valid; wall-clock loss should not erase the attempt. | Side chain reliable; torso flexed/reach posture sustained; wrist and foot cluster visible; body unit present. | Shoulder, hip, wrist, ankle, heel, foot, body unit. | medium-high | G1 | C1 | M2 | medium | Phase 1 |
| Up and Go / TUG | TimedTaskTracker; beta/non-V1; grader-terminated or aborts. | no_change | It is already a user-progress timed task and remains beta because home-space setup is fragile. | N/A - retain TimedTaskTracker; subject-gone aborts. | Hips, knees, ankles, body unit; side chain reliability. | medium | G0 | C0 | M4 | high | Later / do not implement |

## Phase 1 candidates

Phase 1 should be deliberately small and high confidence.

Training:

- Feet-Together Hold
- Tandem Hold
- Single-Leg Hold
- Bridge Hold
- Seated Hamstring Reach

Assessment:

- Shoulder Reach / Shoulder Flexion
- Forward Reach / Hinge Reach

Expected behavior:

- The timer or capture window starts only after the exercise-specific predicate
  is valid for the configured start debounce.
- The active valid counter pauses after invalid grace expires.
- It resumes after the configured resume debounce.
- Completion means accumulated valid seconds reached the target.
- Results include valid time, wall-clock time, pauses, longest continuous valid
  span, tracking loss, and safety-cap status.

Important nuance for existing `hold` exercises:

- Current `HoldTracker` is continuous-hold oriented and ends on condition loss.
- Training valid-time holds should accumulate valid time across reset/pause
  periods.
- Assessment Balance Ladder should keep the continuous hold semantics because
  touchdown/step termination is the assessment payload.

## Phase 2 candidates

Apply broad setup-gated timers only after Phase 1 is replay-tested:

- Supported Hip Flexor Stretch
- Wall Calf Stretch
- Thoracic Rotation
- Supported Side Step
- Mini-Band Lateral Walk

Potential conditional Phase 2 item:

- March in Place only if product intentionally changes it from current rep-based
  behavior to a duration drill. As currently implemented, no timer change is
  needed.

These predicates should be permissive. Their job is to avoid counting time while
the person is absent or clearly not in the broad setup, not to judge form.

## Do-not-change / later candidates

Rep-based no-change:

- Cushion Sit-to-Stand
- Sit-to-Stand
- Slow-Lower Sit-to-Stand
- Power Sit-to-Stand
- Loaded Sit-to-Stand
- Supported Squat
- Squat
- Slow-Lower Squat
- Loaded Squat
- Chair-Supported Split Squat
- Step-Up
- Supported Heel Raise
- Heel Raise
- Glute Bridge
- Wall Push-Up
- Incline Push-Up
- Push-Up
- Overhead Reach
- Band Overhead Press
- Wall-Tap Hinge
- Hip Hinge
- March in Place
- Seated Band Row
- Standing Band Row

Subject-visible-only later:

- Supported Toe Raise
- Neck Rotations
- Band Pull-Apart

Assessment no-change:

- 30-Second Chair Stand
- Balance Ladder, except optional additive metadata
- TUG / Up and Go beta

## Proposed valid-time accumulator architecture

### Should this be generic?

Yes. Implement a generic accumulator with no React, no audio imports, and no
exercise-specific landmark logic.

Suggested shape:

```ts
export interface ValidTimeAccumulatorConfig {
  targetValidMs: number;
  startValidAfterMs: number;
  invalidGraceMs: number;
  pauseAfterInvalidMs: number;
  resumeValidAfterMs: number;
  safetyCapMs: number;
}

export interface ValidTimeInput {
  timestampMs: number;
  tracking: boolean;
  positionValid: boolean;
}

export type ValidTimePhase =
  | 'waiting'
  | 'validating-start'
  | 'running'
  | 'grace'
  | 'paused'
  | 'complete'
  | 'safety-ended';
```

The accumulator should return a reused output object with:

- `phase`
- `accumulatedValidMs`
- `currentContinuousValidMs`
- `longestContinuousValidMs`
- `wallClockMs`
- `remainingValidMs`
- `pauseCount`
- `positionLostEvents`
- `trackingLostMs`
- transition flags such as `started`, `pausedNow`, `resumedNow`, `completedNow`

Do not pass `isPositionValid(frame)` into the generic utility. Keep predicates in
exercise/movement graders so landmark dependencies stay local and testable.

### Where should it live?

Best location: `src/grading/validTime.ts`.

Reason:

- Both training exercises and assessment movements need it.
- It belongs with `HoldTracker`, `MaxRomTracker`, `RepCycleTracker`, and
  `TimedTaskTracker`.
- Keeping it out of `sessionPlayer.ts` preserves the player as orchestration.
- Keeping it out of `src/exercises/setGraders.ts` avoids making assessment
  movements depend on training code.

`src/exercises/setGraders.ts` can then wrap it for training `hold`, selected
`rom`, and later `timer` variants. Assessment ROM graders can use it directly.

### Integration with `sessionPlayer.ts`

Avoid a rewrite. Make a small additive contract change:

1. Extend `SetGraderUpdate` with optional fields:
   - `remainingMs?: number`
   - `validTimeMs?: number`
   - `timerPaused?: boolean`
   - `validTimePhase?: ValidTimePhase`
2. Let valid-time graders set `complete = true` when accumulated valid time
   reaches target.
3. Add a definition-level or prescription-level clock mode, for example:
   - `timing?: { mode: 'player_clock' | 'grader_valid_time' }`
4. In `TrainingSessionPlayer`, keep the existing set phase, rest phase, voice
   handling, and result recording. Only change clock selection:
   - existing `rom`/`timer`: keep player clock.
   - valid-time-enabled definitions: set `setDurationMs = null`, use grader
     `remainingMs` for HUD, and let the grader finish the set.
5. Keep the existing `setSafetyMs` as the outer cap.

This keeps session ordering, rest, skip/retry, audio, and result storage intact.

### Integration with existing hold graders

Do not remove `HoldTracker`; it still fits assessment-style continuous holds.

For training valid-time holds:

- Add an accumulated-valid-time path in `HoldSetGrader`, or introduce a sibling
  `ValidTimeHoldSetGrader`.
- Reuse the existing `conditionMet` predicates for balance and bridge.
- Feed `conditionMet && tracking && bodyUnit` into `ValidTimeAccumulator`.
- Store both accumulated valid time and longest continuous valid time.

For assessment Balance Ladder:

- Keep `HoldTracker`.
- Optionally add metadata later, but do not convert the clinical hold payload to
  accumulated time unless product explicitly changes the protocol.

### Integration with ROM capture logic

ROM capture should use a stable-sampling wrapper, not only a timer.

Recommended approach:

- Keep `MaxRomTracker` for peak capture.
- Gate calls to `MaxRomTracker.update()` behind a movement-specific predicate.
- Use `ValidTimeAccumulator` to decide when enough valid sampling time has been
  accumulated.
- Store wall-clock and valid sample time separately.

For training `Seated Hamstring Reach`:

- Predicate: seated side-view geometry, extended target leg, torso/reach posture
  sustained.
- Completion: target valid capture time reached, not wall-clock.
- Result: `romPeak` plus `M2 stable-ROM` metadata.

For assessment Shoulder Reach and Forward Reach:

- Convert from fixed `durationMs` to grader-owned valid capture termination, or
  add a `durationMode` field if changing `durationMs` to null is too implicit.
- Keep end cues (`relax-arm`, `stand-tall`) in the controller result transition.

### Check-up ROM best stable value

Yes, this should be separate from generic valid-time timers.

The accumulator answers: "How much valid active/sampling time has elapsed?"
The ROM tracker answers: "What is the best stable value observed during valid
sampling?"

For check-up ROM:

- Require a minimum stable valid sampling duration.
- Sample only while the predicate is valid.
- Ignore isolated spikes through EMA and optional minimum-stability windows.
- Finish when enough valid samples are collected or a safety cap ends the item.
- If safety cap ends with too little valid sampling, mark `no-measurement` or
  `partial-measurement` depending on product tolerance.

### Tracking loss and subject-gone handling

Rules:

- `out.state !== 'tracking'` means invalid for accumulation.
- `subject-gone` immediately clears start/resume debounce and increments
  tracking-loss metadata.
- A gap must not bridge a continuous valid segment.
- For reps, keep current reset behavior.
- For valid-time holds/captures, do not discard already accumulated valid time
  unless the exercise predicate demands a full restart for safety.
- For ROM, keep an already earned peak but reset EMA state across the gap, as
  `MaxRomTracker.resetState()` already does.

### Metadata to add to set results

Additive, backward-friendly fields are preferred. Suggested `SetResult` addition:

```ts
export interface ValidTimeResultMetadata {
  mode: 'strong_valid_time' | 'broad_setup_gated' | 'subject_visible_only';
  targetValidSeconds: number;
  accumulatedValidSeconds: number;
  wallClockSeconds: number;
  pauseCount: number;
  longestContinuousValidSeconds: number;
  positionLostEvents: number;
  trackingLostSeconds: number;
  completedByValidTime: boolean;
  endedBySafetyCap: boolean;
  validPredicateId: string;
}
```

For ROM:

```ts
export interface StableRomMetadata extends ValidTimeResultMetadata {
  stableSampleCount: number;
  romPeakTimestampMs: number;
  romPeakCapturedWhileValid: boolean;
}
```

Do not overload `holdSec` silently. For compatibility, `holdSec` may continue to
mirror accumulated valid seconds for timer/hold kinds, but the metadata must
make the source explicit.

### What to persist for progression

Phase 1 should store metadata in `TrainingSessionResult` / `SetResult`, then let
existing progression keep using `reachedTarget` and `measured`.

Phase 3 can use:

- `accumulatedValidSeconds / targetValidSeconds` as completion rate.
- `pauseCount` and `trackingLostSeconds` as tracking-quality inputs.
- `longestContinuousValidSeconds` for balance summaries.
- `endedBySafetyCap` as "hold, do not demote" unless user feedback also says the
  exercise was too hard.

Principle: never demote solely because tracking failed.

If set-level session results become persisted beyond current state summaries,
increment the relevant schema version and make new metadata optional on read.

### UI captions and voice cues

The accumulator should emit transition flags only. The player/controller maps
those flags to existing or new cue keys:

- start pending: "Get into position"
- active: "Hold steady"
- paused by invalid position: "Timer paused - return to position"
- paused by tracking loss: "I lost you for a moment"
- resumed: "Good, timer resumed" or "Good, you're back"
- completed: "That's your hold"

Do not enqueue stale lines. Use the existing voice priority/drop behavior. Add
cooldowns so a noisy predicate cannot speak pause/resume repeatedly.

Visible captions can update immediately from `validTimePhase`, but spoken cues
should be sparse.

## Test plan

Add tests before or with implementation.

1. `src/grading/__tests__/validTime.test.ts`
   - starts only after valid debounce.
   - invalid grace does not pause immediately.
   - pause fires after invalid threshold.
   - resume requires resume debounce.
   - accumulated valid time excludes invalid and tracking-lost time.
   - subject-gone clears continuous segment and records tracking loss.
   - safety cap ends without pretending target was reached.

2. Training set-grader tests
   - Feet-Together, Tandem, Single-Leg: accumulated valid time reaches target
     across one reset; longest continuous valid time is lower than accumulated.
   - Bridge Hold: hip drop pauses, hip lift resumes.
   - Seated Hamstring Reach: ROM peak only updates during valid seated/reach
     frames.
   - Tracking loss pauses but keeps already accumulated valid time.

3. Training player tests
   - Valid-time grader owns completion without a player wall-clock.
   - HUD remaining time comes from grader update.
   - Rest and next-set transitions remain unchanged.
   - Voice cues are throttled and do not block completion.

4. Assessment ROM tests
   - Shoulder Reach and Forward Reach complete after accumulated valid sampling.
   - Fixed chair stand remains fixed 30 seconds.
   - Balance Ladder stage semantics remain unchanged.
   - TUG remains beta/grader-terminated.

5. Replay fixtures
   - Add JSONL fixtures for one clean valid hold, one hold with a reset, one ROM
     capture with tracking loss, and one invalid setup that reaches safety cap.

6. Serialization/progression tests
   - New metadata serializes with non-finite values handled.
   - Existing records without metadata still deserialize.
   - Progression does not demote on poor tracking alone.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| False pauses feel punitive. | Start with high-confidence predicates only; use grace windows; sparse supportive copy. |
| Training hold semantics change from continuous attempt to accumulated valid time. | Preserve `longestContinuousValidSeconds` and consider summaries like "30s total, longest hold 18s". Keep assessment holds unchanged. |
| ROM capture waits too long if predicates are too strict. | Use permissive broad correctness; safety cap with supportive retry/partial result handling. |
| Player clock and grader clock diverge. | Make valid-time graders own completion and expose remaining time; keep one source of truth per set. |
| Voice cue assets missing. | Add cue keys, manifest entries, and generated audio in the same implementation PR. Tests should fail on missing manifest entries if possible. |
| Schema churn. | Add optional metadata fields first; only version persistent state if these results become stored long-term. |
| Subject-gone gaps create fake continuous holds. | Reset continuous-valid segment and predicate smoothing on `subject-gone`. |
| Broad setup-gated timers become hidden form judging. | Phase 2 predicates must only detect broad participation, never exact form quality. |

## Recommended next Codex implementation prompt outline

Use this after the audit is accepted:

```text
Implement Phase 1 valid-time timers for Pearl.

Constraints:
- Do not rewrite TrainingSessionPlayer or CheckUpOrchestrator.
- Add a shared src/grading/validTime.ts utility with unit tests.
- Keep 30-Second Chair Stand, Balance Ladder assessment, and TUG behavior
  unchanged.
- Apply accumulated valid time only to:
  - Feet-Together Hold
  - Tandem Hold
  - Single-Leg Hold
  - Bridge Hold
  - Seated Hamstring Reach
  - Shoulder Reach / Shoulder Flexion assessment
  - Forward Reach / Hinge Reach assessment
- Add additive metadata to SetResult / ROM assessment results.
- Add sparse supportive pause/resume cue keys but do not call runtime TTS.
- Add replay or synthetic tests for valid, invalid, pause, resume, tracking loss,
  and safety-cap cases.
- Run npm run typecheck, npm test -- --runInBand, npx expo config --type public,
  and git diff --check.
```

