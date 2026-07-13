# Pearl Logic Remediation Stage 2A

Date: 2026-06-19

## Scope

Stage 2A addressed the Stage 2 Movement Measurement audit findings:

- F2-001: movement-specific camera readiness was not enforced.
- F2-002: shoulder flexion fallback ROM could become official evidence.
- F2-003: hinge reach fallback ROM could become official evidence.

F2-004 remains a physical validation item. This remediation did not retune chair-stand thresholds,
rise-velocity math, timestamp handling, smoothing, norm tables, adherence logic, backend behavior,
or any Stage 3 scope.

## Initial Worktree State

The worktree was already dirty before Stage 2A work began. Pre-existing modified files included:

- `App.tsx`
- `docs/decisions.md`
- `src/adherence/blockService.ts`
- `src/adherence/screens/BlockReportScreen.tsx`
- `src/adherence/types.ts`
- `src/components/AccountAuthCard.tsx`
- `src/pearlFlow/__tests__/appLifecycle.test.ts`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/planViewModel.ts`
- `src/pearlFlow/reports.ts`
- `src/navigation/TabBar.tsx`
- `src/navigation/__tests__/TabBar.test.ts`
- `src/navigation/icons.tsx`
- `src/onboarding/__tests__/onboarding.test.ts`
- `src/onboarding/state.ts`
- `src/screens/ExploreScreen.tsx`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/screens/ResultsScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `src/theme/index.ts`

Pre-existing untracked files included Stage 0/1/1A/2 audit artifacts, Stage 1A remediation files,
new image assets, and Stage 1A tests/modules. These were treated as user-owned concurrent changes
and were not reverted.

## Rules Implemented

### Movement Camera Readiness

Added `src/preflight/movementCameraReadiness.ts` as a separate layer after generic preflight.
Generic preflight still owns subject presence, framing, lighting/stability sampling, and body-unit
calibration. The new movement gate owns:

- required movement camera view (`front` or `side`)
- detected camera view (`front`, `side`, `ambiguous`)
- required reliable side-chain count from `MovementDefinition.cameraView`
- sustained stable dwell before measurement can start
- calm prompt routing for wrong/ambiguous view or insufficient visibility

Session start now requires all of the following:

- generic preflight is `ready`
- body-unit calibration exists
- movement camera readiness is `ready`
- pipeline state is `tracking`
- instruction voice playback has gone idle before countdown begins

The same movement gate is checked during countdown. If the view or reliability becomes invalid,
the session returns to preflight instead of starting measurement.

During an active item, invalid movement readiness prevents frames from contributing to measurement.
The controller passes a synthetic interrupted frame to graders with a new narrow event type,
`tracking-interrupted`, so rep/hold/task/ROM state machines reset without falsely pretending the
subject disappeared from the generic pose pipeline. Credited results survive; in-flight state does not.

### Front/Side Detection

The detector uses only finite core torso geometry:

- shoulder width normalized by torso length
- hip width normalized by torso length
- absolute left/right separation, so mirrored side selection is accepted

Wide shoulder/hip ratios classify as `front`; collapsed ratios classify as `side`; middle geometry is
`ambiguous`. Wrong-view prompts map to existing bundled audio cue keys:

- side movement seeing front view: `turn-side-on`
- front movement seeing side view: `face-forward`
- ambiguous view or dwell not complete: `hold-still`
- insufficient reliable chains or unusable pose: `step-into-frame`

No new runtime TTS, camera preview, video display, or audio asset dependency was added.

### Stable Timing

The movement readiness dwell is 500 ms by default. Readiness only becomes true when the correct view
and required reliable-chain count are continuously valid for the configured dwell. Any wrong view,
ambiguous view, insufficient chains, invalid pose, subject interruption, or tracking loss resets the
dwell timer.

### ROM Valid Capture

Shoulder flexion and hinge reach no longer use fallback ROM as official evidence.

Official ROM output is finite only when:

- the movement's valid-time accumulator completed `completedByValidTime`
- the gated ROM tracker has a finite peak

Otherwise:

- shoulder returns `peakFlexionDeg: NaN`
- hinge returns `reachBu: NaN`
- result flags include `no-measurement`
- check-up orchestration records the item as `unmeasured` through the existing contract

## Files Changed By Stage 2A

Implementation:

- `src/preflight/movementCameraReadiness.ts`
- `src/assessment/sessionController.ts`
- `src/checkup/checkup.ts`
- `src/screens/AssessmentScreen.tsx`
- `src/screens/CheckUpScreen.tsx`
- `src/pose/pipeline.ts`
- `src/movements/chairStand.ts`
- `src/movements/balanceLadder.ts`
- `src/movements/tug.ts`
- `src/movements/shoulderFlexion.ts`
- `src/movements/hingeReach.ts`

Tests:

- `src/preflight/__tests__/movementCameraReadiness.test.ts`
- `src/assessment/__tests__/sessionController.test.ts`
- `src/checkup/__tests__/checkup.test.ts`
- `src/movements/__tests__/shoulderFlexion.test.ts`
- `src/movements/__tests__/hingeReach.test.ts`

Report:

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md`

## Tests Added Or Updated

Added movement readiness tests for:

- front, side, mirrored side, and ambiguous view classification
- exact stable dwell boundary
- wrong side-view request prompting `turn-side-on`
- wrong front-view request prompting `face-forward`
- insufficient reliable chains prompting whole-body visibility guidance

Updated session/controller tests for:

- full chair-stand flow through real movement readiness
- changed framing prompt throttling with the new controller signature
- wrong-view side movement blocked before instructions

Updated check-up tests for:

- full battery using required movement view fixtures instead of a front-only shortcut
- side-view item staying front-facing until explicit user skip

Updated ROM tests for:

- valid-time completion on normal shoulder and hinge captures
- short shoulder peak produces `no-measurement` and `NaN`
- standing-only hinge produces `no-measurement` and `NaN`
- short hinge reach produces `no-measurement` and `NaN`
- later interruption remains flagged while completed capture survives

Stage 1A integration remains covered by:

- `src/pearlFlow/__tests__/assessmentEligibility.test.ts`
- `src/scoring/__tests__/scoring.test.ts`

## Validation Results

Targeted remediation command:

```bash
npm test -- --runInBand src/preflight/__tests__/movementCameraReadiness.test.ts src/assessment/__tests__/sessionController.test.ts src/checkup/__tests__/checkup.test.ts src/movements/__tests__/shoulderFlexion.test.ts src/movements/__tests__/hingeReach.test.ts src/scoring/__tests__/scoring.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts
```

Result: 7 test suites passed, 41 tests passed.

Full Jest suite:

```bash
npm test -- --runInBand
```

Result: 79 test suites passed, 498 tests passed.

Other validation:

```bash
npm run typecheck
npx expo config --type public
git diff --check
```

Results:

- TypeScript passed.
- Expo config passed.
- Diff whitespace check passed.

Validation warnings observed:

- Watchman recrawl warning during Jest.
- Jest printed its existing post-run open-handle warning after all tests completed.
- Expo config printed a Sentry organization/project config warning and used environment fallback.
- Several backend/sync tests printed expected console logs/warnings from their test scenarios.

## Confirmations

- No self-view camera video was introduced.
- No runtime TTS was introduced.
- No new native dependency was added.
- No balance ladder schedule retune was made.
- No chair-stand velocity, threshold, smoothing, or timestamp logic was changed.
- No norms/scoring thresholds were changed.
- No backend, account, sync, notification, or Stage 3 behavior was changed.
- No previous audit reports were edited.
- No commit was created.
- No branch was created.
- No push was performed.

## Remaining Blockers And Physical Validation

F2-004 is not closed by this code remediation. Chair-stand rise velocity still requires physical
validation with landmark recordings from real chair-stand sessions, including known-count sessions
and varied camera placements. This pass confirms that Stage 2A did not alter the chair velocity path.

Recommended physical validation remains:

- capture side-view chair-stand recordings on device
- replay them through the existing harness
- compare rep count, rise windows, and session mean velocity against manually reviewed recordings
- add fixture tests before any threshold or velocity changes

## Final Worktree State

Final `git status --short --untracked-files=all`:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/blockService.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/types.ts
 M src/assessment/__tests__/sessionController.test.ts
 M src/assessment/sessionController.ts
 M src/checkup/__tests__/checkup.test.ts
 M src/checkup/checkup.ts
 M src/components/AccountAuthCard.tsx
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessments.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/planViewModel.ts
 M src/pearlFlow/reports.ts
 M src/movements/__tests__/hingeReach.test.ts
 M src/movements/__tests__/shoulderFlexion.test.ts
 M src/movements/balanceLadder.ts
 M src/movements/chairStand.ts
 M src/movements/hingeReach.ts
 M src/movements/shoulderFlexion.ts
 M src/movements/tug.ts
 M src/navigation/TabBar.tsx
 M src/navigation/__tests__/TabBar.test.ts
 M src/navigation/icons.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/pose/pipeline.ts
 M src/screens/AssessmentScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/theme/index.ts
?? assets/images/pearl-home-hero-premium.png
?? assets/images/pearl-plan-hero-mountain.png
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
?? docs/audits/Pearl_Stage_1A_Assessment_Validity_Remediation_Prompt.md
?? docs/audits/Pearl_Stage_2A_Camera_Readiness_ROM_Valid_Capture_Prompt.md
?? src/adherence/__tests__/blockServiceEligibility.test.ts
?? src/pearlFlow/__tests__/assessmentEligibility.test.ts
?? src/pearlFlow/__tests__/assessmentResultState.test.ts
?? src/pearlFlow/assessmentEligibility.ts
?? src/pearlFlow/assessmentResultState.ts
?? src/preflight/__tests__/movementCameraReadiness.test.ts
?? src/preflight/movementCameraReadiness.ts
```

Stage 2A added or modified only the files listed in "Files Changed By Stage 2A". The other modified
or untracked files were already present before this remediation or belong to the earlier Stage 1A/
UI work visible in the starting worktree.
