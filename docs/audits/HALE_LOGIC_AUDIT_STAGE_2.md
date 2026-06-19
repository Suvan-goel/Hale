# Hale Logic Audit Stage 2: Movement Check-Up Orchestration And Measurement

Date: 2026-06-19  
Scope: production Movement Check-Up path only: `CheckUpScreen` -> native `PoseDetectionView` -> `PosePipeline` -> `PreflightCheck` -> `CheckUpOrchestrator` / `SessionController` -> four V1 assessments -> scoring / Stage 1A handoff.

This is an evidence-only audit. No production code, tests, fixtures, snapshots, config, dependencies, native generated files, or prior audit files were changed.

## Executive Summary

Stage 2 found a strong orchestration spine with real safety rails: no camera preview, native-only frame ownership, bundled audio, warmup gating, windowed chain reliability, subject-gone reset, body-unit calibration, deterministic replay, and Stage 1A invalid-assessment gating. The full JS validation suite passes.

The audit still does **not** clear the Movement Check-Up for beta measurement use. There are four P1 blockers:

1. Movement `cameraView` requirements are not enforced by the preflight/session gate. The app speaks side/front transitions, but the controller starts items from generic full-body framing, and tests prove a generic standing feed can advance the battery.
2. Shoulder flexion can return a measured mobility result from fallback ROM even when the valid-capture gate has not completed.
3. Hinge reach has the same fallback official-measurement path; an existing test explicitly accepts standing-only as a measured large reach.
4. Chair-stand rise velocity has synthetic replay confidence, but the documented real-device noise-floor experiment is still pending; this remains the product's headline measurement risk.

Stage 1A remains correct at its boundary: it rejects invalid/no-domain assessments before block/report creation. Its remaining exposure is upstream: if Stage 2 graders incorrectly mark weak ROM evidence as measured, Stage 1A will reasonably trust that score.

## Initial Repository State

Initial `git status --short --untracked-files=all`:

```text
 M App.tsx
 M src/adherence/blockService.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/types.ts
 M src/haleFlow/__tests__/appLifecycle.test.ts
 M src/haleFlow/appLifecycle.ts
 M src/haleFlow/assessments.ts
 M src/haleFlow/index.ts
 M src/haleFlow/planViewModel.ts
 M src/haleFlow/reports.ts
 M src/navigation/TabBar.tsx
 M src/navigation/icons.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/theme/index.ts
?? assets/images/hale-home-hero-premium.png
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
?? docs/audits/Hale_Stage_1A_Assessment_Validity_Remediation_Prompt.md
?? src/adherence/__tests__/blockServiceEligibility.test.ts
?? src/haleFlow/__tests__/assessmentEligibility.test.ts
?? src/haleFlow/__tests__/assessmentResultState.test.ts
?? src/haleFlow/assessmentEligibility.ts
?? src/haleFlow/assessmentResultState.ts
```

Initial `git diff --name-only`:

```text
App.tsx
src/adherence/blockService.ts
src/adherence/screens/BlockReportScreen.tsx
src/adherence/types.ts
src/haleFlow/__tests__/appLifecycle.test.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/assessments.ts
src/haleFlow/index.ts
src/haleFlow/planViewModel.ts
src/haleFlow/reports.ts
src/navigation/TabBar.tsx
src/navigation/icons.tsx
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/state.ts
src/screens/ExploreScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/TodayScreen.tsx
src/theme/index.ts
```

Initial `git diff --stat`:

```text
 App.tsx                                     | 111 ++++-
 src/adherence/blockService.ts               |  95 +++-
 src/adherence/screens/BlockReportScreen.tsx |   6 +-
 src/adherence/types.ts                      |   1 +
 src/haleFlow/__tests__/appLifecycle.test.ts |  53 ++
 src/haleFlow/appLifecycle.ts                |  17 +-
 src/haleFlow/assessments.ts                 |  38 +-
 src/haleFlow/index.ts                       |   2 +
 src/haleFlow/planViewModel.ts               |   2 +-
 src/haleFlow/reports.ts                     |   6 +-
 src/navigation/TabBar.tsx                   |  72 ++-
 src/navigation/icons.tsx                    |  66 ++-
 src/onboarding/__tests__/onboarding.test.ts |  21 +
 src/onboarding/state.ts                     |   6 +-
 src/screens/ExploreScreen.tsx               | 570 +++++++++++++++------
 src/screens/OnboardingResultsScreen.tsx     |  58 ++-
 src/screens/PlanScreen.tsx                  | 671 +++++++++++++++++++------
 src/screens/ResultsScreen.tsx               |  23 +-
 src/screens/TodayScreen.tsx                 | 738 +++++++++++++++-------------
 src/theme/index.ts                          |  19 +
 20 files changed, 1802 insertions(+), 773 deletions(-)
```

The worktree was already dirty before Stage 2. I treated all pre-existing changes as user-owned. Additional user-owned changes beyond Stage 1A were visible in `src/haleFlow/planViewModel.ts`, `src/screens/ExploreScreen.tsx`, and `src/screens/PlanScreen.tsx`; none were touched.

## Prior Audit Inputs Read

- Stage 0: `docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md` (954 lines). Relevant carry-forward: app-level flow, physical-device checklist, measurement audit scope, TUG/default battery concerns, and device-only validation debt.
- Stage 1: `docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md` (957 lines). Relevant carry-forward: normal Stage 2 scope is `CheckUpScreen` with `DEFAULT_BATTERY`; TUG is beta-hidden/historical-support only; ROM fallback semantics explicitly deferred to Stage 2.
- Stage 1A: `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md` (209 lines). Relevant carry-forward: invalid/no-measurement assessments are blocked before block creation, onboarding retry remains available, and official retest invalid attempts stop before report/next-block creation.

## Validation Commands

| Command | Exit | Result | Notes |
|---|---:|---|---|
| `npm test -- --runInBand src/checkup src/assessment src/pose src/preflight src/movements src/replay src/scoring src/history/__tests__/history.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/haleFlow/__tests__/assessmentResultState.test.ts` | 0 | 24 suites passed, 123 tests passed, 0 snapshots | Watchman recrawl warning. No skipped tests reported. |
| `npm test -- --runInBand` | 0 | 78 suites passed, 491 tests passed, 0 snapshots | Watchman recrawl warning. Expected console logs/warnings from backend/session sync tests. Jest warned it did not exit one second after completion, implying an open handle. |
| `npm run typecheck` | 0 | `tsc --noEmit` passed | No type errors. |
| `npx --no-install expo config --json >/tmp/hale-expo-config-stage2.json && node -e "..."` | 0 | Parsed app config: name `Hale`, slug `hale`, scheme `hale`, plugins `6`, iOS `com.suvangoel.hale`, Android `com.suvangoel.hale` | Temporary `/tmp/hale-expo-config-stage2.json` was deleted. |
| `git diff --check` | 0 | No whitespace errors | No output. |

Validation commands did not intentionally change repo files.

## Production Path Trace

`App.tsx` begins check-ups through `beginCheckUp`, which sets a pending check-up type and enters `flow='checkup'` (`App.tsx:1222-1235`). The production render path mounts `<CheckUpScreen onComplete={handleCheckUpComplete} onCancel={goHome} voiceId={...} />` (`App.tsx:2177-2178`).

`CheckUpScreen` constructs one `PosePipeline`, one `PreflightCheck`, and one `CheckUpOrchestrator` over the default battery (`src/screens/CheckUpScreen.tsx:85-92`). It passes `modelVariant="lite"` to native pose detection (`src/screens/CheckUpScreen.tsx:228-234`), processes each landmark event synchronously (`src/screens/CheckUpScreen.tsx:114-130`), speaks returned cues (`src/screens/CheckUpScreen.tsx:131`), plays rep SFX (`src/screens/CheckUpScreen.tsx:132`), and one-shots completion via `completedRef` (`src/screens/CheckUpScreen.tsx:134-138`).

The official V1 battery is four items: chair stand, balance ladder, shoulder flexion, hinge reach (`src/checkup/checkup.ts:35-41`). `BETA_BATTERY_WITH_TUG` exists separately (`src/checkup/checkup.ts:43-50`), but the production `CheckUpScreen` uses the default orchestrator construction, so normal production does not activate TUG. Historical TUG rows remain supported by scoring and trends.

## Native Pose Boundary

The JS contract says events contain 33 landmarks as flat `[x,y,z,visibility,presence]`, or an empty array if no pose; x/y are normalized upright portrait image coordinates; timestamps are monotonic milliseconds comparable within a session (`modules/expo-pose-detection/src/ExpoPoseDetection.types.ts:3-22`). The JS view defaults to front camera, lite model, and 0.35 confidence thresholds (`modules/expo-pose-detection/src/PoseDetectionView.tsx:14-27`).

Android owns CameraX and MediaPipe on a single-thread executor, does not push image frames over the bridge, uses `STRATEGY_KEEP_ONLY_LATEST`, rotates bitmaps physically upright before `detectForVideo`, emits the first pose as a 33x5 flat array, and sends empty landmarks on no pose (`modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt:168-286`). It enforces monotonic timestamps by bumping duplicate/out-of-order timestamps by 1 ms (`PoseDetectionView.kt:215-219`).

iOS owns AVFoundation and MediaPipe on capture/session queues, fixes capture orientation to portrait, disables mirroring at the native coordinate layer, emits the first pose as the same flat array, and sends empty landmarks on no pose (`modules/expo-pose-detection/ios/PoseDetectionView.swift:152-316`). It also bumps duplicate/out-of-order timestamps by 1 ms (`PoseDetectionView.swift:256-284`).

The boundary is architecturally correct, but timestamp correction needs device validation because rise velocity is timestamp-sensitive.

## Pose Pipeline And Preflight

`PosePipeline` is the right central gate: parse, smooth, update chain reliability, validate plausible subject, warmup, emit subject-gone, handle stream gaps, and calibrate body unit (`src/pose/pipeline.ts:152-230`). It requires a 1500 ms warmup and treats gaps over 500 ms as interruptions (`src/pose/pipeline.ts:67-79`, `src/pose/pipeline.ts:233-244`). Chain reliability is windowed over 15 frames and uses the weakest landmark in each chain (`src/pose/chains.ts:37-79`). Body-unit calibration locks a median hip-to-ankle length over 45 still samples on the best side (`src/pose/calibration.ts:23-94`).

`PreflightCheck` verifies whole-body framing, distance, center, and a 2 s visibility/jitter sample (`src/preflight/preflight.ts:46-76`, `src/preflight/preflight.ts:111-177`). It restarts on subject loss and can prompt for lighting (`src/preflight/preflight.ts:118-124`, `src/preflight/preflight.ts:223-239`).

The major gap: `PreflightCheck` does not consume `MovementDefinition.cameraView` or `requiredReliableSideChains`. `SessionController` starts instructions once `status.phase === 'ready'` and `bodyUnit != null` (`src/assessment/sessionController.ts:137-147`), not once the item-specific view requirements are satisfied. Therefore the camera-view spec is metadata and voice guidance, not an enforced measurement gate.

## Orchestration State Machine

`CheckUpOrchestrator` starts in intro, enters transitions, constructs a fresh `SessionController` per item, records measured/unmeasured/skipped status, and completes after all items (`src/checkup/checkup.ts:82-202`). It explicitly does not reset `PosePipeline` between items so the body-unit scale remains stable (`src/checkup/checkup.ts:12-13`). It resets preflight on each transition (`src/checkup/checkup.ts:218-225`) and supports retry/skip (`src/checkup/checkup.ts:136-152`).

`SessionController` sequences `preflight -> instructions -> countdown -> active -> result -> done` (`src/assessment/sessionController.ts:137-238`). It resets the grader at `go` so pre-countdown movement does not seed a result (`src/assessment/sessionController.ts:184-198`). Fixed-duration assessments close by item duration; balance closes by grader completion (`src/assessment/sessionController.ts:201-223`).

This orchestration is generally production-shaped. The issue is not phase sequencing; it is that generic preflight readiness can admit wrong-view or insufficient-chain conditions.

## Assessment Audit

### 30-Second Chair Stand

Definition: side view, chair, 30 s fixed duration (`src/movements/chairStand.ts:232-242`).

Positive evidence:

- Counts on near-side knee angle with hysteresis through `RepVelocityTracker` (`src/movements/chairStand.ts:146-150`, `src/grading/repCycle.ts:100-150`).
- Rise velocity uses hip height in body units and stores per-rep/session means (`src/movements/chairStand.ts:147-150`, `src/grading/repVelocity.ts:91-159`).
- Subject-gone resets half-rep state while preserving credited reps (`src/movements/chairStand.ts:114-123`, `src/grading/repVelocity.ts:195-205`).
- Side selection is sticky during a rep and can re-evaluate between reps (`src/movements/chairStand.ts:134-181`).
- Push-off is logged, not voiced (`src/movements/chairStand.ts:160-172`, `src/movements/chairStand.ts:243-246`).

Risks:

- Side-view requirement is not enforced by session preflight. A front-facing user can be preflight-ready and enter the item.
- Native timestamp bumping to 1 ms can theoretically inflate instantaneous velocity if a pose jump and duplicate/out-of-order timestamp coincide.
- Real same-person, real-device rise-velocity coefficient of variation is still pending (`docs/noise-floor-report.md:12-14`, `docs/noise-floor-report.md:86-131`).

Beta readiness: **conditional, not cleared**. JS replay is strong; physical noise-floor recordings and camera-view enforcement are required.

### Balance Ladder

Definition: front view, two reliable side chains by metadata, no equipment, staged schedule (`src/movements/balanceLadder.ts:289-298`).

Positive evidence:

- Stages are deterministic and voice-driven (`src/movements/balanceLadder.ts:79-94`, `src/movements/balanceLadder.ts:194-209`).
- Holds use `HoldTracker` debounce and Welford sway SD (`src/grading/hold.ts:62-135`).
- Single-leg not attempted or interrupted yields `NaN` for the headline hold (`src/movements/balanceLadder.ts:247-271`).
- Interruption flags the current stage and calls `tracker.interrupt()` (`src/movements/balanceLadder.ts:140-145`).

Risks:

- The front-view/two-chain requirement is not enforced before the stage starts. `PreflightCheck` only needs a plausible subject and generic framing.
- The stage schedule runs from first active frame (`elapsed = ts - activeStartMs`) and does not pause while tracking is absent (`src/movements/balanceLadder.ts:148-159`). Interruption time is not counted as hold time, but it can consume the fixed ladder schedule and shorten later opportunities. This may be acceptable as a product rule, but it is currently implicit.

Beta readiness: **conditional**. Needs view/chain enforcement and product decision on whether interruption should consume the ladder clock.

### Shoulder Flexion Peak

Definition: side view, 9 s fixed capture, target 3 s valid capture (`src/movements/shoulderFlexion.ts:49-53`, `src/movements/shoulderFlexion.ts:159-169`).

Positive evidence:

- Angle is side-selected and EMA-smoothed through `MaxRomTracker` (`src/movements/shoulderFlexion.ts:105-125`, `src/grading/maxRom.ts:39-60`).
- Valid-time accumulator tracks upright torso and angle threshold (`src/movements/shoulderFlexion.ts:116-124`, `src/exercises/validTime.ts:160-210`).
- Interruption resets tracker state and flags the result (`src/movements/shoulderFlexion.ts:83-89`, `src/movements/shoulderFlexion.ts:129-144`).

Blocker:

- Fallback ROM updates on every tracking frame before valid-time gating (`src/movements/shoulderFlexion.ts:114-115`).
- The official result returns primary ROM if available, otherwise fallback ROM (`src/movements/shoulderFlexion.ts:132-136`).
- A finite fallback peak avoids the `no-measurement` flag (`src/movements/shoulderFlexion.ts:137-144`).
- Scoring trusts measured shoulder results unless they carry `no-measurement` (`src/scoring/scoring.ts:69-72`, `src/scoring/scoring.ts:172-189`).
- Tests only require `validTime.accumulatedValidSeconds > 0`, not completion of the 3 s gate (`src/movements/__tests__/shoulderFlexion.test.ts:21-52`).

Beta readiness: **not ready**. Valid capture must become a hard requirement for official mobility measurement, or fallback must be explicitly non-official.

### Hinge Reach

Definition: side view, 9 s fixed capture, target 3 s valid capture (`src/movements/hingeReach.ts:45-49`, `src/movements/hingeReach.ts:162-172`).

Positive evidence:

- Reach is body-unit normalized using wrist-to-floor distance (`src/movements/hingeReach.ts:115-118`).
- Valid-time accumulator tracks trunk angle <= 165 degrees (`src/movements/hingeReach.ts:119-127`).
- Synthetic tests cover monotonicity, scale invariance, and interruption (`src/movements/__tests__/hingeReach.test.ts:18-55`).

Blocker:

- Fallback reach updates on every tracking frame before valid-time gating (`src/movements/hingeReach.ts:115-118`).
- The official result returns fallback reach when gated ROM is absent (`src/movements/hingeReach.ts:135-139`).
- A finite fallback avoids `no-measurement` (`src/movements/hingeReach.ts:140-147`).
- The existing standing-only test expects a measured large distance rather than `no-measurement` (`src/movements/__tests__/hingeReach.test.ts:34-37`).

Beta readiness: **not ready**. Same remediation as shoulder flexion.

## Result Classification And Stage 1A Handoff

`CheckUpOrchestrator.recordResult` marks null results as `unmeasured`, results with `no-measurement` as `unmeasured`, and all other results as `measured` (`src/checkup/checkup.ts:284-292`). `scoreCheckUp` then ignores skipped/unmeasured/no-measurement items (`src/scoring/scoring.ts:69-72`).

Stage 1A eligibility is correct at this layer. `createMovementAssessment` marks no-domain scores as low/invalid (`src/haleFlow/assessments.ts:21-47`), and `getBlockCreationEligibility` rejects non-completed assessments, no measured domains, missing focus, invalid focus, and score/assessment disagreement (`src/haleFlow/assessmentEligibility.ts:28-64`). `App.tsx` blocks invalid retests before session completion, block report, or next block creation (`App.tsx:1297-1304`), and blocks start-plan creation for ineligible assessments (`App.tsx:1400-1414`).

Stage 1A handoff remains correct. Stage 2 must repair upstream measurement classification so Stage 1A receives truthful `measured` status.

## Visual And Voice Alignment

No camera self-view is rendered in the JS path. The native view owns camera/inference, and `CheckUpScreen` renders a skeleton/figure overlay, status HUD, and controls (`src/screens/CheckUpScreen.tsx:228-317`). The native Android/iOS backgrounds are held to the product canvas per AGENTS history and decisions.

Audio is bundled and one-channel: `VoiceChannel` uses pregenerated manifest assets, never runtime TTS, drops lower/equal priority cues while busy, and configures mix-with-others with recording disabled (`src/audio/voicePlayer.ts:1-31`, `src/audio/voicePlayer.ts:55-91`). `SessionController` waits for voice not busy before countdown/active/result transitions (`src/assessment/sessionController.ts:166-238`).

The voice says view-change cues through orchestrator transitions (`src/checkup/checkup.ts:236-249`), but there is no measurement gate confirming the user actually changed view. This is the largest voice/measurement mismatch.

## Interruptions And Recovery

Strengths:

- Pipeline emits `subject-gone` after sustained absence and resets smoothing/windows (`src/pose/pipeline.ts:210-216`, `src/pose/pipeline.ts:233-244`).
- Chair stand resets rep/velocity state on subject-gone (`src/movements/chairStand.ts:114-123`).
- Balance interrupts the active hold and marks the current stage interrupted (`src/movements/balanceLadder.ts:140-145`, `src/grading/hold.ts:109-122`).
- Shoulder and hinge reset EMA state and flag interruptions (`src/movements/shoulderFlexion.ts:83-89`, `src/movements/hingeReach.ts:79-85`).
- User pause shifts orchestrator, preflight, and controller timers (`src/screens/CheckUpScreen.tsx:114-130`, `src/checkup/checkup.ts:154-160`, `src/assessment/sessionController.ts:261-269`).

Gaps:

- App backgrounding is only indirectly handled by stream-gap detection. There is no explicit app-state pause/resume policy in `CheckUpScreen`.
- Balance interruption does not pause the stage schedule; it only prevents hold time from accumulating.

## Synthetic Scenario Ledger

| Area | Covered By Tests | What It Proves | Remaining Gap |
|---|---|---|---|
| Orchestrator battery | `src/checkup/__tests__/checkup.test.ts:84-114` | Four default items, no TUG, intro/complete and transition cues | Uses generic standing feed; does not prove view-specific readiness. |
| Orchestrator skip | `src/checkup/__tests__/checkup.test.ts:116-143` | Setup issue can be skipped and battery completes | Does not test retry recovery to measured. |
| Session controller | `src/assessment/__tests__/sessionController.test.ts:75-142` | Phase order, countdown, result voice, prompt throttling | Chair-only flow; no wrong-view active rejection. |
| Pose pipeline | `src/pose/__tests__/pipeline.test.ts:29-171` | Warmup, subject-gone, stream gap, calibration, side-view one-chain, determinism | No malformed/non-finite payload case. |
| Preflight | `src/preflight/__tests__/preflight.test.ts:36-105` | Framing, distance, off-center, lighting fail/retry, subject loss | Generic framing only; no camera-view spec. |
| Chair stand | `src/movements/__tests__/chairStand.test.ts:22-131` | Counts, velocity, jitter, partials, interruption, push-off, side parity, zero reps | Real recordings and timestamp anomaly coverage missing. |
| Balance ladder | `src/movements/__tests__/balanceLadder.test.ts:46-113` | Completed ladder, touchdown, step, not attempted, interruption, stage voice | Does not assert two-chain front-view enforcement or pause policy. |
| Shoulder | `src/movements/__tests__/shoulderFlexion.test.ts:21-52` | Peak capture, side parity, reduced ROM, interrupted peak survives | Does not require valid-time completion for official measurement. |
| Hinge | `src/movements/__tests__/hingeReach.test.ts:18-55` | Deep vs shallow, scale invariance, interrupted reach survives | Standing-only measurement is accepted; no valid-time completion contract. |
| Noise floor | `src/replay/__tests__/noiseFloor.test.ts`, `docs/noise-floor-report.md:1-131` | Synthetic normalization budget | Real same-person device CV still pending. |

## Findings

| ID | Severity | Type | Finding | Evidence | Required Before |
|---|---|---|---|---|---|
| F2-001 | P1 | Confirmed software defect | Item-specific camera-view and reliable-chain requirements are not enforced by preflight/session start. | Movement definitions carry `cameraView`, but `PreflightCheck` does not accept a spec and `SessionController` only gates on generic `ready` + `bodyUnit`; generic standing feed advances all default items in test. | Stage 3 / beta |
| F2-002 | P1 | Confirmed measurement defect | Shoulder flexion can return an official measured result from fallback ROM despite incomplete valid-capture evidence. | `shoulderFlexion.ts:114-144`, `scoring.ts:69-72`, `shoulderFlexion.test.ts:21-52`. | Stage 3 / beta |
| F2-003 | P1 | Confirmed measurement defect | Hinge reach can return an official measured result from fallback ROM despite incomplete valid-capture evidence. | `hingeReach.ts:115-147`; standing-only test accepts measured result at `hingeReach.test.ts:34-37`. | Stage 3 / beta |
| F2-004 | P1 | Device-validation blocker | Chair-stand rise velocity is synthetically stable, but real same-person, multi-setup device CV is still pending. | `docs/noise-floor-report.md:12-14`, `docs/noise-floor-report.md:86-131`. | Beta |
| F2-005 | P2 | Product decision / measurement policy | Balance interruption consumes stage schedule time even though hold time stops. | `balanceLadder.ts:148-159`, `balanceLadder.ts:217-235`. | Before beta copy/UX freeze |
| F2-006 | P2 | Latent device defect | Native timestamp coercion can hide duplicate/out-of-order camera timestamps from JS; velocity code remains sensitive to very small dt. | Android/iOS timestamp bump; `repVelocity.ts:97-105`, `repVelocity.ts:128-138`. | Device validation |
| F2-007 | P2 | Latent measurement defect | The app uses MediaPipe first pose only and has no subject identity continuity once calibrated. A second person entering frame can become the measured subject. | Native `setNumPoses(1)` / first pose dispatch; subject validity checks plausibility, not identity. | Beta home testing |
| F2-008 | P2 | Testability / robustness defect | Non-finite landmark coordinates are not sanitized and can bypass subject-validity numeric comparisons. | `parseLandmarkEvent` copies values directly (`src/pose/types.ts:96-113`); validity ratio checks do not reject NaN (`src/pose/subjectValidity.ts:97-129`). | Hardening |
| F2-009 | P2 | Device-validation gap | Full four-item battery has no recorded Android/iOS release-device pass after recent native background/rotation/render changes. | `docs/decisions.md:120-135`, `docs/decisions.md:197-201`, `docs/decisions.md:247-262`. | Beta |
| F2-010 | P3 | Data hygiene | History filenames derive from `startedAt`; duplicate timestamps overwrite the prior check-up file. | `src/history/store.ts:50-54`. | Later hardening |

Counts: P0 = 0, P1 = 4, P2 = 5, P3 = 1.

## Product Decisions Required

Count: 6.

1. Should generic full-body preflight be replaced by item-specific camera readiness, or should each movement own a second readiness gate?
2. Should ROM fallback values be shown as non-official diagnostics, discarded, or converted into "try again" guidance?
3. Should balance ladder interruptions pause/restart the current stage or consume the fixed schedule as currently implemented?
4. Should a wrong-view user be blocked silently, prompted repeatedly, or allowed with a non-standard flag?
5. What is the beta acceptance threshold for real chair-stand velocity CV, and who signs off the physical recordings?
6. Should manual/extra check-up measurement quality have the same official evidence requirements as baseline/retest, or a separate "practice result" affordance?

## Domain Review Required

Count: 4.

1. Shoulder flexion valid position: `torsoUpright && angle >= 35` needs clinical/product review for a 3 s official capture.
2. Hinge reach valid position: `trunkAngle <= 165` needs review, especially because standing-only currently becomes measured.
3. Balance single-leg touchdown thresholds (`singleLegLiftBu = 0.18`, `stepOutBu = 0.55`) need physical recordings and domain review.
4. Chair stand rep thresholds (`110`/`155` degrees) and velocity segmentation need review against real chair heights and body types.

## Physical Device Validation Matrix

Count: 12 required validations. Completed during this audit: 0, because no physical device run was requested or available.

| ID | Validation | Android | iOS | Status |
|---|---|---|---|---|
| DV-001 | Full default battery, release build, no camera preview | Required | Required | Pending |
| DV-002 | Side-view chair stand orientation and non-mirrored landmarks | Required | Required | Pending |
| DV-003 | Chair-stand 6-session same-person noise-floor CV | Required first | Required follow-up | Pending |
| DV-004 | Front-view balance requires two reliable side chains | Required | Required | Pending |
| DV-005 | Wrong-view prompts prevent active measurement | Required | Required | Pending until fixed |
| DV-006 | Shoulder valid capture vs fallback behavior | Required | Required | Pending until fixed |
| DV-007 | Hinge valid capture vs fallback behavior | Required | Required | Pending until fixed |
| DV-008 | Warm/dim lighting fails preflight before measurement | Required | Required | Pending |
| DV-009 | App background/resume during active item | Required | Required | Pending |
| DV-010 | Audio mix-with-camera stability during session | Required | Required | Pending |
| DV-011 | Two-person frame intrusion / subject identity continuity | Required | Required | Pending |
| DV-012 | Native timestamp monotonicity and frame-gap traces from recordings | Required | Required | Pending |

## Invariant Ledger

Failed invariants: 15 of 60.

| ID | Invariant | Status | Evidence / Note |
|---|---|---|---|
| INV-001 | Normal production check-up uses exactly chair, balance, shoulder, hinge. | Holds | `DEFAULT_BATTERY` has four items. |
| INV-002 | TUG cannot enter normal production battery. | Holds | `CheckUpScreen` uses default orchestrator; tests assert no TUG. |
| INV-003 | TUG historical rows do not corrupt shared scoring. | Holds | TUG is supporting balance row only; single-leg remains primary. |
| INV-004 | Active grading cannot begin before preflight ready and body-unit calibration where needed. | Holds | `SessionController` gates on `ready` + `bodyUnit`; chair/hinge require bodyUnit in graders. |
| INV-005 | Side-view requirements are enforced before side-view items start. | Fails | `cameraView` is not consumed by preflight/controller. |
| INV-006 | Front-view bilateral requirements enforce two reliable side chains before balance starts. | Fails | Balance metadata says 2; generic preflight does not enforce it. |
| INV-007 | No self-view camera video is displayed. | Holds | Native view owns camera; JS renders skeleton/figure. |
| INV-008 | Runtime session path does not call TTS APIs. | Holds | `VoiceChannel` uses bundled assets. |
| INV-009 | Voice state gates countdown and result phases. | Holds | Controller waits for `voiceBusy` false. |
| INV-010 | Completion callback fires once. | Holds | `completedRef` one-shot. |
| INV-011 | User pause shifts measurement timers. | Holds | CheckUpScreen + orchestrator/controller shift timing. |
| INV-012 | Skip produces explicit skipped item. | Holds | `skipCurrentItem` records skipped. |
| INV-013 | Retry resets setup and current item controller. | Holds | `retrySetup` resets preflight/controller. |
| INV-014 | Stream gaps reset stale smoothing/window state. | Holds | Pipeline gap handler resets. |
| INV-015 | Subject-gone resets half-finished rep/hold/ROM state. | Holds | All four graders handle `subject-gone`. |
| INV-016 | Body-unit scale is not reset between items. | Holds | Orchestrator comment and construction preserve pipeline. |
| INV-017 | Chair stand uses hysteresis and avoids jitter double counts. | Holds | RepCycle + tests. |
| INV-018 | Partial chair rises do not count. | Holds | Chair test covers partials. |
| INV-019 | Chair velocity is in body units/sec. | Holds | Hip height divided by bodyUnit. |
| INV-020 | Timestamp anomalies cannot distort rise velocity. | Fails | Native 1 ms bump and velocity dt sensitivity need hardening/recording. |
| INV-021 | Push-off is logged only, never voiced as critique. | Holds | Result cues omit push-off. |
| INV-022 | Chair rise velocity is stable on real devices under setup variation. | Device-unverified | Real-data noise-floor pending. |
| INV-023 | Balance touchdown/step conditions are debounced. | Holds | HoldTracker start/end debounce. |
| INV-024 | Balance not-attempted produces no headline hold. | Holds | `singleLegEyesOpenSec` NaN when not attempted/interrupted. |
| INV-025 | Balance interruption does not keep accumulating hold time. | Holds | `interrupt()` ends at last observed frame. |
| INV-026 | Balance interruption pause policy is explicit. | Product decision | Current schedule consumes interruption time. |
| INV-027 | Balance stage voice order matches ladder order. | Holds | Balance voice test. |
| INV-028 | Shoulder official result requires completed valid-capture window. | Fails | Fallback can become official. |
| INV-029 | Shoulder fallback ROM is diagnostic-only. | Fails | Fallback returned as `peakFlexionDeg`. |
| INV-030 | Shoulder interruption is flagged. | Holds | Test and code. |
| INV-031 | Hinge official result requires completed valid-capture window. | Fails | Fallback can become official. |
| INV-032 | Standing-only hinge is unmeasured. | Fails | Test expects measured large distance. |
| INV-033 | Hinge reach is body-unit normalized. | Holds | Test covers camera-distance invariance. |
| INV-034 | Scoring ignores `no-measurement` results. | Holds | `usableResult`. |
| INV-035 | Scoring ignores non-finite metrics. | Holds | Domain functions guard with `Number.isFinite`. |
| INV-036 | Mobility age rests on shoulder primary metric. | Holds with caveat | True, but shoulder may be fallback-derived. |
| INV-037 | `measured` status means a usable measurement exists. | Fails | ROM fallback can make weak evidence measured. |
| INV-038 | Invalid/no-domain assessments cannot create a block. | Holds | Stage 1A eligibility. |
| INV-039 | Invalid official retest cannot create report/next block. | Holds | App retest eligibility guard. |
| INV-040 | Manual extra is non-official for progress by default. | Holds | `beginCheckUp` official flag. |
| INV-041 | Check-up history is schema-versioned. | Holds | `HISTORY_SCHEMA_VERSION`. |
| INV-042 | NaN serialization does not crash scoring on reload. | Holds | NaN -> null; consumers finite-guard. |
| INV-043 | Duplicate check-up timestamps cannot overwrite history. | Fails | Filename derives only from startedAt. |
| INV-044 | Landmark recorder is dev-only. | Holds | CheckUpScreen starts recorder behind `__DEV__`. |
| INV-045 | Hot path keeps heavy camera frames off JS bridge. | Holds | Native emits landmarks only. |
| INV-046 | UI state updates are throttled. | Holds | CheckUpScreen UI interval 100 ms. |
| INV-047 | Native model/confidence defaults match AGENTS constraints. | Holds | Lite model and 0.35 defaults. |
| INV-048 | Native timestamps reflect camera time without silent correction. | Fails | Android/iOS bump duplicates/out-of-order by 1 ms. |
| INV-049 | Android/iOS orientation parity is currently verified. | Device-unverified | Recent Android rotation fix marked unverified. |
| INV-050 | Preflight catches dim/jittery lighting before measurement. | Holds in synthetic | Physical validation pending. |
| INV-051 | Low-light thresholds hold in real homes. | Device-unverified | Requires recordings. |
| INV-052 | Subject identity remains the same after calibration. | Fails | First pose only; no identity continuity. |
| INV-053 | Non-finite landmark payloads fail closed. | Fails | No finite sanitization. |
| INV-054 | Replay harness covers each production assessment. | Holds | Movement tests + gradeRecording. |
| INV-055 | Tests cover wrong camera view for each item. | Fails | No wrong-view rejection tests. |
| INV-056 | Tests cover malformed/non-finite native payloads. | Fails | No such tests found. |
| INV-057 | Real device recordings are committed for highest-risk failures. | Device-unverified | Fixture set is synthetic/current replay. |
| INV-058 | Lower-priority stale voice cues are dropped while busy. | Holds | VoiceChannel priority behavior. |
| INV-059 | App background/resume behavior is verified. | Device-unverified | Only stream-gap unit coverage. |
| INV-060 | Movement Check-Up has no open P1s before beta. | Fails | Four P1s listed above. |

## Remediation Batches

Batch A, before Stage 3:

1. Enforce `MovementDefinition.cameraView.requiredReliableSideChains` in the session readiness gate.
2. Add wrong-view / insufficient-chain tests for chair, balance, shoulder, hinge.
3. Make shoulder and hinge official results depend on valid-time completion, or emit explicit non-official diagnostic flags that scoring ignores.
4. Replace the hinge standing-only expectation with an unmeasured/try-again expectation if product agrees.

Batch B, before beta:

1. Run the real chair-stand noise-floor protocol and add representative JSONL recordings as fixtures.
2. Run full Android and iOS release-device battery passes.
3. Verify low-light, app background/resume, audio/camera stability, and two-person intrusion.
4. Record native timestamp distributions and decide whether JS should reject suspicious dt.

Batch C, hardening:

1. Sanitize non-finite landmark payloads at parse or validity gate.
2. Add check-up history collision protection.
3. Clarify balance interruption schedule policy in code/tests/copy.

## Stage 3 Inputs

Stage 3 should not assume assessment evidence is trustworthy until Batch A is complete. It can still audit downstream flow, but any plan/block correctness conclusion should carry an explicit dependency on:

- F2-001 camera-view readiness enforcement.
- F2-002 / F2-003 ROM official-measurement gating.
- Stage 1A eligibility remaining in place.

## Final Status Before Report Write

Immediately before writing this report, after deleting the temporary Expo config file, `git status --short --untracked-files=all`, `git diff --name-only`, and `git diff --stat` matched the initial dirty state exactly. The only intended subsequent repo change is this new report file.

## Bottom Line

Proceeding to Stage 3 without remediation would risk building more product logic on assessment evidence that can be produced from the wrong camera view or inadequate ROM capture. Recommended next step: a narrow Stage 2A remediation of camera-view readiness and ROM valid-capture semantics, then rerun the Stage 2 validation slice and begin physical-device recording.
