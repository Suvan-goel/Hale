# Hale Hands-Free Flow Audit

Date: 2026-06-26

Scope: audit only. This report inventories required touch interactions in the current Movement
Check-Up, micro-check, training, and Explore/manual-practice flows, then recommends the
smallest safe path to an audio-first, camera-readiness-driven experience. No runtime behavior,
production source, prior audit report, decision log, route, training credit policy, micro-check
policy, or audio asset was changed.

## 1. Scope

The audit covers the current required touch interactions for these surfaces:

- Onboarding/public V2 baseline Movement Check-Up.
- Baseline retake.
- Official retest.
- Optional full extra Check-Up.
- Scheduled micro-check.
- Optional micro-check.
- Training session.
- Explore/manual practice.

It specifically asks whether the app can move from "tap to proceed" to "voice instructs, camera
readiness confirms, timers/capture auto-advance, user touches only for safety, exit, accessibility,
or before-phone-placement choices."

## 2. Audit Method

I inspected the active public routing, unified V2 Movement Check-Up shell, live coordinator,
voice runtime, micro-check runner and side setup, training session screen/player, Progress/TODAY
launch surfaces, and prior H5/H4/H3 audit reports. I also ran baseline validation before writing
the report and will run the full final validation sweep after the report exists.

This audit intentionally does not claim physical-device behavior. It reasons from code, tests, and
the documented native/pose architecture.

## 3. Current Public Product Baseline

The current public Check-Up path is the unified Movement Profile V2 flow. Public V1 Check-Up and
V1 results are retired from normal builds and remain available only through the explicit legacy
rollback gate documented in prior H5 reports.

Public route and authority constraints preserved by this audit:

- Normal public baseline, baseline retake, official retest, and optional full extra Check-Up route
  through the unified Movement Profile V2 Check-Up when V2 authority is available.
- `manual_extra_v2` is non-official and does not create official reference artifacts.
- Official retest remains V2-only when the active block is V2-origin and the retest is due.
- Accepted V2 state does not fall back to V1 in normal builds.
- H5A V2 Progress authority and H5B micro-check policy remain unchanged.
- Warden transform remains deferred.

## 4. Worktree Safety Snapshot

Captured before analysis:

Command: `git status --short --untracked-files=all`

```text
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/ProgressScreen.tsx
?? docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
```

Command: `git diff --name-only`

```text
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/ProgressScreen.tsx
```

Command: `git diff --stat`

```text
 .../MovementProfileV2ReferenceDetailsScreen.tsx    |  16 ++-
 src/screens/ProgressScreen.tsx                     | 145 ++++++++++++++++-----
 2 files changed, 125 insertions(+), 36 deletions(-)
```

Command: `git ls-files --others --exclude-standard`

```text
docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
```

The two modified production files and the prompt file were treated as user-owned state. This
audit creates only `docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md`.

## 5. Baseline Validation Before Report

Command: `npm run typecheck`

Result: passed.

```text
> hale@0.1.0 typecheck
> tsc --noEmit
```

Command: `npm run verify:audio`

Result: passed.

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s voiceV21: requiredAssets=352 total: requiredAssets=502
```

Command: focused tests for V2 Check-Up, voice runtime, live coordinator, public routing,
micro-check policy, micro-check runner, training session player, Progress authority, voice
settings, and release flags.

Result: passed.

```text
Test Suites: 24 passed, 24 total
Tests:       158 passed, 158 total
Snapshots:   0 total
```

Observed warning: Watchman recrawl warning and Jest's open-handle notice after completion. The
focused suites passed.

## 6. Current Unified V2 Check-Up Flow

The public unified V2 Check-Up uses `MovementProfileV2UnifiedCheckUpScreen`, backed by
`MovementProfileV2LiveCoordinator` and `MovementProfileV2VoiceRuntime`.

Current live stages and touch posture:

- `chair_setup`: requires `Confirm setup`.
- `chair_practice`: no required tap after setup; practice stand starts from pose after voice.
- `chair_countdown` and `chair_active`: no required tap; voice and timer drive official start.
- `balance_setup`: requires standing-leg confirmation or selection.
- `balance_ready`: attempt starts from lifted foot after voice; `Use this result` can be required
  to finish early with an accepted best.
- `balance_trial`: `I touched support` and `Stop attempt` are user-reported safety/termination
  controls, not normal progression controls.
- `balance_rest`: `I'm ready` accelerates rest after the minimum rest; 60 seconds auto-advances.
  `Use this result` can finish early with best result.
- `shoulder_setup`: requires shoulder-side confirmation or selection.
- `shoulder_ready` and `shoulder_retry_ready`: require `Start reach`.
- `shoulder_active`: auto-finishes at the capture deadline; `I felt limited` is optional metadata.
- `hinge_setup`: requires `Start capture`.
- `hinge_active`: auto-finishes at the deadline; `Finish capture` is early-stop acceleration.
- `raw_complete`: no required control.

The voice runtime already owns audio boundary events for chair practice, official chair countdown,
balance attempt, shoulder setup, hinge setup, and recovery. It does not currently confirm setup,
choose side/leg, start shoulder capture, start hinge capture, or auto-accept best balance result.

## 7. Onboarding/Public V2 Baseline Touch Inventory

The baseline Check-Up currently requires touch after the user has entered the Check-Up flow:

- `Confirm setup` in chair setup.
- Standing-leg selection or confirmation in balance setup.
- Shoulder-side selection or confirmation in shoulder setup.
- `Start reach` for shoulder capture.
- `Start capture` for hinge capture.
- Potential `Use this result` for balance if the user has a best trial and the flow should end
  before max trials, ceiling, or other auto-completion.

Normal chair practice, chair official countdown, chair active window, balance attempt start,
balance trial termination by touchdown/ceiling, balance rest default advance, shoulder capture
deadline, and hinge capture deadline are already timer, pose, or voice driven.

Conclusion: the public V2 baseline is not hands-free today.

## 8. Baseline Retake Touch Inventory

Baseline retake uses the same unified V2 shell and has the same required touch points as the
public baseline:

- Chair setup confirmation.
- Balance leg confirmation or selection.
- Shoulder side confirmation or selection.
- Shoulder capture start.
- Hinge capture start.
- Possible balance best-result acceptance.

The retake context does not add a unique touch requirement. It does, however, increase the
importance of same-side/same-setup measurement hygiene because users are comparing against their
own prior baseline.

Conclusion: baseline retake is not hands-free today.

## 9. Official Retest Touch Inventory

Official retest uses the same unified V2 shell when the schedule is retest-due and V2 source
artifacts are available. It has the same required touch points as baseline and baseline retake.

Official retest adds a stricter comparability concern:

- If the app infers a different standing leg or shoulder side than the accepted official anchor,
  the product should either prompt the same prior side by voice and wait for that movement, or
  accept the inferred side but mark direct comparison as reduced/not comparable.
- The current manual confirmation creates explicit metadata. A hands-free version must preserve
  equivalent metadata with a new source such as camera-inferred/prior-confirmed-by-readiness.

Conclusion: official retest is not hands-free today.

## 10. Optional Full Extra Check-Up Touch Inventory

The optional full extra Check-Up launches as `manual_extra_v2` and routes through the same unified
V2 Check-Up shell. It is non-official and completes into practice-style results rather than
official reference materialization.

Required touch points are the same as the unified V2 shell:

- Chair setup confirmation.
- Balance leg confirmation or selection.
- Shoulder side confirmation or selection.
- Shoulder capture start.
- Hinge capture start.
- Possible balance best-result acceptance.

Because it is non-official, it can be more permissive about inferred side changes, but it still
should avoid claiming official longitudinal comparability when setup differs.

Conclusion: optional full extra Check-Up is not hands-free today.

## 11. Scheduled Micro-Check Touch Inventory

Scheduled micro-checks follow the H5B weekly policy:

- Week 1: Strength/chair-power.
- Week 2: Balance/single-leg-balance.
- Week 3: Mobility/mobility-reach.
- Week 4: no micro-check; official retest.

Current active capture runner behavior is mostly hands-free:

- Preflight, instructions, countdown, active capture, and done are automated.
- V2.1 countdown waits for required tracked audio and then advances without a tap.
- During capture, available controls are pause/help/back/cancel style controls.

Current required touches before active capture:

- Chair-power does not require side setup.
- Single-leg-balance can require a side selection or confirmation when no compatible official or
  previous micro-check anchor exists.
- Mobility-reach can require a side selection or confirmation; official anchor support is not
  currently equivalent for this setup path.

Conclusion: scheduled micro-check active capture is hands-free after runner start, but scheduled
balance/mobility micro-checks can require mid-flow side setup today.

## 12. Optional Micro-Check Touch Inventory

Optional micro-checks use the same `MicroCheckScreen`, runner, and side-setup policy as scheduled
micro-checks. The difference is launch intent and result policy, not capture mechanics.

Required touches:

- Optional chair-power: no side setup.
- Optional single-leg-balance: can require side selection/confirmation.
- Optional mobility-reach: can require side selection/confirmation.

Conclusion: optional micro-check active capture is hands-free after runner start, but optional
balance/mobility micro-checks can require mid-flow side setup today.

## 13. Training Session Touch Inventory

The ordinary training session player is audio-first:

- Session intro, transition, preflight, instructions, countdown, active set, rest, next set, next
  exercise, and completion are designed to auto-advance.
- Pause/resume, repeat, skip, help, and leave-session are optional safety, recovery, or
  accessibility controls.

The current required touch gap is floor setup:

- When V2.1 floor setup is enabled and an exercise requires floor transition, the player enters a
  floor setup state with an action label such as `I'm ready`.
- `TrainingSessionScreen` renders that action while in transition/floor setup states.
- `TrainingSessionPlayer.confirmFloorStartPosition(...)` is required before final camera
  readiness can proceed.

Conclusion: non-floor training sessions do not require normal progression taps today, but training
sessions with the floor V2.1 setup path can require a mid-session touch.

## 14. Explore And Manual Practice Touch Inventory

Explore/manual practice routes into existing session or Check-Up surfaces:

- Extra sessions and ladder practice route through session preview into `TrainingSessionScreen`.
- Manual full Check-Up routes to non-official `manual_extra_v2`.
- Quick manual micro-check routes to the micro-check surface.

Therefore Explore/manual practice inherits the same touch posture:

- Session practice inherits the training floor setup gap.
- Manual full Check-Up inherits the unified V2 Check-Up required touches.
- Manual quick micro-check inherits micro-check side setup requirements.

Conclusion: Explore/manual practice is not independently hands-free; it depends on the destination
surface.

## 15. Complete Required-Touch Table

| Surface | Touch point | Required today? | Classification | Recommended replacement |
| --- | --- | ---: | --- | --- |
| Today/Onboarding/Progress | Start Check-Up, Start session, Start micro-check | Yes, before placement | KEEP_BEFORE_PHONE_PLACEMENT | Keep as explicit user intent before the phone is propped. |
| Unified V2 Check-Up | `Confirm setup` at chair setup | Yes | REMOVE_REPLACE_WITH_CAMERA_READINESS | Stable seated/chair-start readiness dwell after voice prompt, with fallback button. |
| Unified V2 Check-Up | Chair practice stand | No tap | Already hands-free | Keep pose-started practice and official countdown. |
| Unified V2 Check-Up | Chair cancel | Optional | KEEP_OPTIONAL_SAFETY_CONTROL | Keep. |
| Unified V2 Check-Up | Balance standing-leg choose/confirm | Yes | REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE | Use prior side by voice when present; otherwise infer from lifted foot/reliable stance. |
| Unified V2 Check-Up | Balance attempt start | No tap | Already hands-free | Keep lifted-foot start after voice. |
| Unified V2 Check-Up | `I touched support` | No for normal flow | KEEP_OPTIONAL_SAFETY_CONTROL / NEEDS_PRODUCT_DECISION | Keep optional unless support contact can be measured confidently; record user-reported metadata. |
| Unified V2 Check-Up | `Stop attempt` | No for normal flow | KEEP_OPTIONAL_SAFETY_CONTROL | Keep as safety termination. |
| Unified V2 Check-Up | `I'm ready` during balance rest | No, accelerates rest | REMOVE_REPLACE_WITH_VOICE_TIMER for primary path | Keep hidden/secondary accessibility fallback; default timer remains voice-driven. |
| Unified V2 Check-Up | `Use this result` | Sometimes required to end early | REMOVE_REPLACE_WITH_TIMEOUT_OR_BEST_RESULT | Auto-accept best after max trials, ceiling, no-improvement timeout, or section timeout. |
| Unified V2 Check-Up | Shoulder side choose/confirm | Yes | REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE | Use prior side by voice when present; otherwise infer near/reliable raised arm. |
| Unified V2 Check-Up | `Start reach` | Yes | REMOVE_REPLACE_WITH_AUTO_CAPTURE | Auto-start after setup voice and stable ready/upright arm-ready dwell. |
| Unified V2 Check-Up | `I felt limited` | Optional metadata | KEEP_OPTIONAL_SAFETY_CONTROL / NEEDS_PRODUCT_DECISION | Keep optional; decide whether pain-limited is pre-placement, post-result, or voice-confirmed. |
| Unified V2 Check-Up | Hinge `Start capture` | Yes | REMOVE_REPLACE_WITH_AUTO_CAPTURE | Auto-start after setup voice and side/upright readiness dwell. |
| Unified V2 Check-Up | Hinge `Finish capture` | No, early stop only | REMOVE_REPLACE_WITH_TIMEOUT_OR_BEST_RESULT | Let deadline/stability finish; keep optional fallback. |
| Unified V2 Check-Up | Diagnostics/export | No public path | KEEP_INTERNAL_ONLY | Keep internal/dev only. |
| Micro-check | Side setup for balance/mobility | Sometimes required | REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE | Infer side from anchor or first valid lifted/reaching side; mark comparability. |
| Micro-check | Runner preflight/instruction/countdown/active | No tap | Already hands-free | Keep. |
| Micro-check | Pause/help/back | Optional | KEEP_OPTIONAL_SAFETY_CONTROL | Keep. |
| Training | Session preview start | Yes, before placement | KEEP_BEFORE_PHONE_PLACEMENT | Keep. |
| Training | Active set/rest/transition for ordinary exercises | No tap | Already hands-free | Keep. |
| Training | Floor setup `I'm ready` | Yes when floor V2.1 path active | REMOVE_REPLACE_WITH_CAMERA_READINESS | Detect floor/start position readiness with dwell; keep fallback. |
| Training | Pause/resume/repeat/skip/help/leave | Optional | KEEP_OPTIONAL_SAFETY_CONTROL / KEEP_ACCESSIBILITY_FALLBACK | Keep. |
| Explore/manual practice | Destination start controls | Yes, before placement | KEEP_BEFORE_PHONE_PLACEMENT | Keep. |
| Explore/manual practice | Destination in-flow controls | Inherits destination | See destination | Fix at Check-Up, micro-check, and training layers. |

## 16. Classification Summary

KEEP_BEFORE_PHONE_PLACEMENT:

- Start Check-Up, retake, retest, optional full Check-Up, quick micro-check, session, practice,
  plan, preview, settings, and profile controls.
- These are explicit intent choices before the phone is positioned and do not violate
  hands-free operation during the measured or trained flow.

KEEP_OPTIONAL_SAFETY_CONTROL:

- Cancel/exit/back, pause/resume, stop attempt, support touched, pain-limited, help, skip, leave
  session, and similar controls.
- These should remain reachable and accessible, but not be required for ordinary progress.

KEEP_ACCESSIBILITY_FALLBACK:

- Confirm setup, side selection, start capture, ready, and use-result buttons may remain as
  secondary fallback controls after the camera-first path exists.
- They should not be the primary or required path.

KEEP_INTERNAL_ONLY:

- Diagnostics export, dev replay/recording controls, internal route controls, and debug overlays.

REMOVE_REPLACE_WITH_CAMERA_READINESS:

- Chair setup confirmation.
- Floor setup readiness.
- Readiness portions of balance, shoulder, and hinge setup.

REMOVE_REPLACE_WITH_VOICE_TIMER:

- Balance rest acceleration as a required-looking primary path.
- Any waiting state where the correct behavior is "listen, wait, and continue automatically."

REMOVE_REPLACE_WITH_AUTO_CAPTURE:

- Shoulder `Start reach`.
- Hinge `Start capture`.
- Any capture start that can be safely derived from voice-completed + stable body readiness.

REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE:

- Balance standing-leg selection/confirmation.
- Shoulder side selection/confirmation.
- Micro-check side setup.

REMOVE_REPLACE_WITH_TIMEOUT_OR_BEST_RESULT:

- Balance `Use this result`.
- Hinge `Finish capture`.
- Retry loops that otherwise wait for a user tap after enough evidence exists.

NEEDS_PRODUCT_DECISION:

- Whether a user-reported support touch remains necessary for balance validity.
- How pain-limited metadata should be captured without making the session touch-dependent.
- Whether official retest must force the prior side/leg or may infer a changed side with reduced
  comparability.
- How aggressively the app should auto-accept a best balance result.

## 17. Chair Stand Feasibility

Chair is the most feasible Check-Up item to make hands-free first.

Already present:

- Side-view live coordinator.
- Chair practice state before official measurement.
- Rep-cycle tracking and rise-velocity capture.
- Warmup/tracking interruption handling.
- Push-off flag as logged metadata, not user-facing critique.
- Voice-driven practice, countdown, and official start after setup.

Recommended hands-free design:

- Replace `Confirm setup` with camera readiness: plausible human, side-view readiness, seated or
  chair-start posture, stable body-unit scale, and stable hip/knee/ankle chain for a short dwell.
- Voice: "Sit tall with your feet flat. When I can see you clearly, we will start with one
  practice stand."
- After readiness dwell, auto-enter practice.
- If no stable readiness within a timeout, voice lighting/framing prompt and keep listening.
- Keep `Confirm setup` as an accessibility fallback, not primary.

Main risks:

- Chair occlusion and clothing/furniture confusion.
- False ready if the user is standing near the chair rather than seated.
- Need replay recordings covering real chair heights, side distances, and partial occlusion.

## 18. Balance Feasibility

Balance is feasible but needs explicit product decisions around side/leg, support, and auto-best.

Already present:

- Front-view camera-view spec.
- Raised-foot attempt start after voice.
- Touchdown detection.
- Sway proxy from pelvis midpoint.
- Trial ceiling and rest timer.
- Best-hold retention.
- Optional user support/stop controls.

Recommended hands-free design:

- If an official/prior side exists, voice that side: "Stand on your left leg." Wait for camera
  evidence that the opposite foot lifts.
- If no prior side exists, infer standing leg from the first valid lifted-foot pattern after the
  voice cue.
- Start the trial when the lifted foot and standing chain are stable for a short dwell.
- End the trial on touchdown, ceiling, explicit stop, tracking interruption, or timeout.
- Auto-accept the best result after max valid trials, ceiling, section timeout, or a configured
  no-improvement path.
- Keep `I touched support` as optional user-reported metadata unless support contact becomes
  measurable with high precision.

Main risks:

- Inferring the wrong standing leg when both feet move during setup.
- Retest comparability if the inferred leg differs from the prior anchor.
- Support touch cannot be reliably observed from pose alone.
- Balance safety: optional stop/support controls must remain prominent and accessible.

## 19. Shoulder Flexion Feasibility

Shoulder can become hands-free with near-side/raised-arm inference and auto-capture.

Already present:

- Side-view capture window.
- Selected-side measurement.
- Arm-chain reliability.
- Upright torso checks.
- Deadline-based capture finish.
- Invalid retry path.
- Pain-limited metadata control.

Recommended hands-free design:

- If a prior official shoulder side exists, voice the same side and wait for that arm to prepare
  or raise.
- If no prior exists, infer the reliable near side or the first clearly raised arm.
- Replace `Start reach` with auto-start when setup voice has completed, the user is upright,
  side-view reliability is stable, and the selected/inferred arm is in a ready/low position.
- Capture peak angle until stable peak/return, deadline, tracking interruption, or timeout.
- Keep pain-limited as an optional safety/metadata fallback.

Main risks:

- Left/right mirroring and near-side ambiguity in side view.
- Retest comparability if the arm differs from prior official anchor.
- Users may start moving before voice completes; state machine must ignore early movement until
  the readiness gate opens.

## 20. Hinge Reach Feasibility

Hinge is also feasible because it already uses the most reliable side and a deadline.

Already present:

- Side-view capture.
- More reliable side selection.
- Wrist-to-floor body-unit measurement.
- Deadline-based finish.
- Invalid/no-measurement support.

Recommended hands-free design:

- Replace `Start capture` with camera readiness after the hinge setup voice: side-view stable,
  upright start posture, reliable wrist/hip/knee/ankle chain, and body-unit scale available.
- Auto-capture as the user folds.
- Finish on stable best evidence, return/upright if supported, deadline, or tracking interruption.
- Treat `Finish capture` as a fallback only.

Main risks:

- Wrist occlusion at deepest reach.
- Floor not visible or floor distance inferred from body units rather than actual surface.
- Need reliable invalid/no-measurement handling without making the user tap.

## 21. Side, Leg, Support, Pain, Retry, And Best-Result Decisions

These are the decisions that must be made before implementation:

- Official retest side/leg policy: force prior side/leg by voice and wait for matching evidence,
  or allow inferred changes and mark direct comparisons as reduced.
- Baseline first-run policy: accept first confident inferred side/leg, or use a deterministic
  default voice prompt first.
- Balance support policy: keep user-reported support touch as optional metadata, or require a
  conservative auto-invalid rule when support cannot be observed.
- Balance best-result policy: define the exact auto-accept rule after valid trials, ceiling,
  timeout, or no improvement.
- Shoulder pain-limited policy: decide whether pain-limited belongs before-phone-placement,
  optional in-flow fallback, post-result review, or voice-confirmed accessibility flow.
- Retry policy: define when invalid shoulder/hinge attempts auto-retry versus auto-record
  no-measurement after timeout.

## 22. Training Gap Analysis

Training is closer to hands-free than Check-Up. The current ordinary session player already has
audio-first auto-advance across most states.

Gap:

- Floor V2.1 setup waits for a user-confirmed `I'm ready` action before final position readiness.

Recommended replacement:

- Use `MovementCameraReadinessTracker` and exercise-specific floor/start-pose readiness as the
  primary gate.
- Voice the transition and wait for stable body evidence: subject present, floor/start posture,
  required chains visible, stable dwell, and no tracking interruption.
- Keep `I'm ready` as an accessibility fallback when the camera cannot establish readiness.

Risks:

- Floor poses can be partially occluded by phone angle, furniture, or mat position.
- False ready could start an exercise before the user is safe.
- Needs replay recordings for each floor-transition exercise before removing the tap from the
  primary path.

## 23. Micro-Check Gap Analysis

Micro-check active capture is already mostly hands-free. The gap is side setup before runner start.

Recommended replacement:

- If a compatible official or prior micro-check anchor exists, use it as the voice-instructed
  side and wait for matching evidence.
- If no anchor exists, infer side from the first valid lifted-foot or reaching-side pattern.
- If inferred side differs from an available but non-compatible anchor, store reduced
  comparability metadata.
- Keep manual side choice as a fallback before the runner starts.

Policy to preserve:

- Scheduled micro-check rotation remains H5B.
- Micro-checks remain optional/non-blocking.
- Micro-check results do not create official Movement Profile artifacts.
- Micro-checks do not award main-plan credit or alter block progression.

## 24. UI And Accessibility Implications

Hands-free does not mean control-free. It means the default measured/trained path does not depend
on touch after the phone is propped.

Recommended UI posture:

- Keep all start/intent choices before placement.
- During camera flow, show status text and skeleton/filled figure, never self-view video.
- Use controls for safety, exit, pause, help, and accessibility fallback.
- De-emphasize setup/progression buttons once camera readiness can advance.
- Preserve screen-reader labels and reachable fallbacks for users who cannot satisfy camera
  readiness reliably.
- Avoid adding new badges, streaks, social affordances, or medical-risk language.

## 25. Safety And Measurement Risks

| Risk | Severity | Likelihood | Mitigation |
| --- | --- | --- | --- |
| False readiness starts a movement before the user is prepared | High | Medium | Require voice completion, stable dwell, plausible human, movement-specific chains, timeout prompts, fallback controls. |
| Wrong standing leg or shoulder side harms longitudinal comparison | High | Medium | Prefer prior side/leg by voice; record inferred source; suppress direct comparison on mismatch. |
| Support touch is missed during balance | High | Medium | Keep user-reported support control; auto-invalid only when pose evidence is high confidence. |
| Camera cannot see floor pose safely | High | Medium | Keep fallback, use conservative readiness, add replay/device validation before release. |
| Auto-best accepts too early | Medium | Medium | Define max trials/ceiling/no-improvement/timeout policy and test it. |
| Voice/camera race starts capture before instruction completes | Medium | Medium | Voice runtime remains source of audio completion events; ignore early movement until gate opens. |
| More timers create stale queued audio | Medium | Low | Preserve one-line-at-a-time priority/drop behavior. |
| Added state paths regress public V2 authority | High | Low | Add route/release-flag tests; no H5 rollback change. |

## 26. Product Decisions Required

Before implementation, the product owner should decide:

1. For official retests, whether prior side/leg is mandatory for direct comparison.
2. For first baseline, whether balance/shoulder defaults are voice-instructed deterministic sides
   or purely inferred from the user's first valid movement.
3. For balance, the exact auto-best acceptance rule.
4. For support touch, whether user-reported support remains a validity input indefinitely.
5. For pain-limited shoulder attempts, where that metadata is collected.
6. For floor training, which exercise start poses are safe enough for camera-only readiness in
   V2.1 and which need fallback-first rollout.

## 27. HF1 Implementation Plan: V2 Check-Up Primary Hands-Free Path

Recommended first milestone:

- Add camera-readiness auto-advance for chair setup.
- Add inferred/prior-guided balance standing-leg setup.
- Add auto-best/timeout result acceptance for balance.
- Add inferred/prior-guided shoulder side setup.
- Add shoulder auto-capture start.
- Add hinge auto-capture start.
- Keep all current controls as accessibility fallbacks and safety exits.

Implementation boundaries:

- Touch only V2 Movement Profile live coordinator, voice runtime, setup metadata, screen control
  priority, and tests.
- Do not change public routing, V1 rollback gates, Progress authority, micro-check credit, training
  credit, or audio asset generation.
- Do not add heavy dependencies.

Recommendation: proceed with HF1 as the first hands-free implementation milestone.

## 28. HF2 Implementation Plan: Micro-Check Side Setup

Recommended second milestone:

- Replace required side setup with anchor-first and camera-inferred side selection.
- Preserve existing side metadata and add source/comparability fields if needed.
- Keep manual side selection as fallback before runner start.
- Preserve H5B and H5B.1 policy exactly.

Primary tests:

- Scheduled balance side inferred without tap.
- Scheduled mobility side inferred without tap.
- Optional micro-check side inferred without tap.
- Existing anchor preserved and direct comparison allowed.
- Different inferred side marks reduced comparability.
- First-accepted-wins and slot identity remain unchanged.

## 29. HF3 Implementation Plan: Training Floor Setup

Recommended third milestone:

- Replace required `I'm ready` with floor/start-pose camera readiness.
- Keep `I'm ready` as fallback.
- Gate by voice completion, subject validity, movement-specific chains, stable dwell, and timeout
  prompts.
- Add replay fixtures for each floor exercise enabled in V2.1.

Primary tests:

- Floor setup auto-advances when readiness is stable.
- Floor setup does not auto-advance before voice completion.
- Tracking interruption resets readiness.
- Fallback button still works.
- Ordinary non-floor session behavior and credit remain unchanged.

## 30. HF4 Accessibility And Device-QA Plan

Before public release:

- Validate on real Android and iOS devices in normal domestic lighting.
- Validate no self-view video is displayed.
- Validate voice/camera races in Release mode.
- Validate subject-gone handling during every auto-readiness gate.
- Validate that safety controls remain reachable while phone is propped.
- Capture landmark recordings for surprising pose behavior and add replay tests before changing
  thresholds.

Physical-device validation is not claimed by this audit.

## 31. Required Tests For Hands-Free Implementation

Add or extend tests in these areas:

- V2 live coordinator: auto chair setup, inferred balance leg, balance auto-best, inferred shoulder
  side, shoulder auto-start, hinge auto-start, recovery resets, timeout/no-measurement paths.
- V2 voice runtime: voice-completion events gate readiness and auto-start; no stale queued lines.
- Public lifecycle: baseline, baseline retake, official retest, and manual extra remain unified V2.
- Protocol setup metadata: inferred/prior/fallback sources are persisted and comparable state is
  explicit.
- Micro-check side setup: anchor-first/inferred/fallback paths preserve H5B/H5B.1.
- Training session player: floor readiness auto-advance and fallback button.
- Accessibility: fallback controls remain available and labeled.
- Release flags: no V1 public route reintroduction and no H5 rollback.

## 32. Final Validation Results

All required final validation commands were run after creating this report.

Command: `npm run typecheck`

Result: passed.

```text
> hale@0.1.0 typecheck
> tsc --noEmit
```

Command: `npm run verify:audio`

Result: passed.

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s voiceV21: requiredAssets=352 total: requiredAssets=502
```

Command: `npm test -- --runInBand`

Result: passed.

```text
Test Suites: 165 passed, 165 total
Tests:       1327 passed, 1327 total
Snapshots:   0 total
Time:        23.155 s
Ran all test suites.
```

Observed warnings during full Jest:

- Watchman recrawl warning.
- Expected mocked Supabase sync console warnings/logs in backend sync tests.
- Jest open-handle notice after the passing run.

Command: `npm --prefix website run typecheck`

Result: passed.

```text
> @hale/website@0.1.0 typecheck
> tsc --noEmit
```

Command: `npx --no-install expo config --type public`

Result: passed.

Relevant output:

```text
env: load .env.local .env
env: export ELEVENLABS_API_KEY EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS EXPO_PUBLIC_ENABLE_SENTRY EXPO_PUBLIC_SENTRY_DSN EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE
› [@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
sdkVersion: '56.0.0'
```

Note: the command printed environment variable names, not secret values.

Command: `git diff --check`

Result: passed with no output.

Command:

```sh
rm -rf /tmp/hale-hands-free-audit-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hands-free-audit-export
rc=$?
rm -rf /tmp/hale-hands-free-audit-export
exit $rc
```

Result: passed with exit code 0.

Relevant output:

```text
env: load .env.local .env
env: export ELEVENLABS_API_KEY EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS EXPO_PUBLIC_ENABLE_SENTRY EXPO_PUBLIC_SENTRY_DSN EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE
› [@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
Starting Metro Bundler
Web Bundled 10248ms index.ts (2064 modules)
Android Bundled 11259ms index.ts (2268 modules)
iOS Bundled 18133ms index.ts (2376 modules)
› Assets (1592):
› web bundles (2):
› android bundles (1):
› ios bundles (1):
› Files (2):
Exported: /tmp/hale-hands-free-audit-export
```

Observed warnings during export:

- Sentry Expo plugin missing explicit organization/project config, with environment-variable
  fallback.
- Repeated Node warning that `NO_COLOR` is ignored because `FORCE_COLOR` is set.

Cleanup verification after export:

```text
export directory cleaned
```

Final worktree status after validation:

```text
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/ProgressScreen.tsx
?? docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
?? docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
```

## 33. Files Changed By This Audit

Created:

- `docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md`

Not changed:

- Production source files.
- Prior audit reports.
- `docs/decisions.md`.
- Audio assets.
- Routes, flags, training credit, or micro-check policy.

## 34. Non-Action Confirmation

This audit did not implement behavior. It did not stage files, commit, create a branch, push, open
a PR, install dependencies, regenerate audio, inspect secrets, or change native configuration.

## Final Verdicts

HANDS-FREE FLOW AUDIT COMPLETE

V2 MOVEMENT CHECK-UP REQUIRES MID-FLOW TOUCH TODAY

TRAINING SESSIONS REQUIRE MID-SESSION TOUCH TODAY

MICRO-CHECKS REQUIRE MID-FLOW TOUCH TODAY

HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION RECOMMENDED

NO H5 ROUTING ROLLBACK

NO V1 PUBLIC ROUTE REINTRODUCTION

NO OFFICIAL PROFILE CONTAINMENT CHANGE

NO TRAINING CREDIT / PROGRESSION CHANGE

NO AUDIO REGENERATION

WARDEN TRANSFORM DEFERRED

PHYSICAL DEVICE VALIDATION NOT CLAIMED

PUBLIC RELEASE REMAINS BLOCKED
