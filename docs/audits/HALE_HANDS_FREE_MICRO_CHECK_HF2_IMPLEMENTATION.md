# HALE HANDS-FREE MICRO-CHECK HF2 IMPLEMENTATION

## 1. Scope

HF2 implemented the public scheduled and optional micro-check active/setup path for:

- `chair-power`
- `single-leg-balance`
- `mobility-reach`

The change removes required mid-flow side/leg selection from public side-dependent micro-checks after the user launches the check and places the phone. It does not implement HF3 training hands-free work.

## 2. HF1/H5D/H5B prerequisites

HF1 V2 Check-Up hands-free behavior was treated as already implemented and preserved. H5D public release remains blocked pending physical-device validation. H5B/H5B.1 micro-check policy remains the authority for scheduled micro-check slots, first-accepted-wins behavior, stable slot identity, persistence, restore, export, and account-clear containment.

## 3. Initial Git status

Initial status was dirty before HF2. Existing modified files included `App.tsx`, V2 check-up/progress/plan files, H5/HF1 tests, backend auth, and related screens. Existing untracked files included `.codex_tmp_completed_profile_preview/*`, prior audit reports, and the HF1/HF2 prompt files. Those pre-existing changes were treated as user-owned and were not reverted.

## 4. Baseline validation

Before HF2 edits:

- `npm run typecheck` passed.
- `npm run verify:audio` passed with 502 required assets.
- Focused H5/HF1/H5B suites passed: 21 suites, 156 tests.
- `npm test -- --runInBand` passed: 165 suites, 1333 tests.
- `npm --prefix website run typecheck` passed.
- `npx --no-install expo config --type public` passed with the existing Sentry warning.
- `git diff --check` passed.
- `npx --no-install expo export --platform all --output-dir /tmp/hale-hf2-baseline-export` passed and the temp folder was removed.

## 5. Current micro-check touch points fixed

Before HF2, `single-leg-balance` and `mobility-reach` returned a required `MicroCheckSideSetupScreen` before the camera runner started. HF2 changed that path so the camera view starts immediately, the skeleton renders, preflight framing prompts can speak, side/leg evidence is inferred from pose, and the runner starts automatically after stable dwell.

The side picker still exists, but only as an optional timeout/accessibility fallback.

## 6. HF2 architecture

Added `MicroCheckCameraSideResolver` in `src/training/microCheckSideSetup.ts`. It is a pure deterministic helper that:

- uses `PipelineFrameOutput`;
- gates on tracking state, body-unit availability where needed, and smoothed chain reliability;
- applies stable dwell before readiness;
- exposes timeout fallback availability;
- returns selected/observed side plus metadata source.

`MicroCheckScreen` now uses the resolver before constructing `MicroCheckRunner` for side-dependent checks.

## 7. Scheduled vs optional launch authority

Scheduled launches still come from the existing `activeMicroCheckTarget` and continue to carry H5B slot authority. Optional launches still use `microCheckLaunch.mode === 'optional'` and the `optional:*` id path. Balanced week 4 manual optional launch now routes to domain choice instead of unavailable; scheduled Balanced week 4 remains no scheduled micro-check.

## 8. Chair-power hands-free behavior

`chair-power` remains side-independent. It still constructs `MicroCheckRunner` immediately, uses preflight, voice instructions/countdown, active measurement, and auto-finish. No new chair setup UI or side metadata was added.

## 9. Single-leg-balance leg inference

Balance leg inference requires tracking, body unit, and reliable left/right side chains. It infers standing leg from normalized ankle-height difference using the same 0.14 body-unit lift threshold family as HF1 V2 setup. Prior same-leg guidance is honored when the camera verifies that leg; otherwise camera evidence can establish the current side.

## 10. Mobility-reach side inference

Mobility side inference uses side-chain reliability for side-view evidence. A prior micro-check side is honored when that side is reliable. Without a prior side, a clearly more reliable side chain selects the measured side. Ambiguous/equal side evidence waits instead of guessing.

## 11. Camera readiness / dwell / auto-start

Side-dependent micro-check setup now starts the camera view immediately. The resolver requires 700 ms of stable side evidence before `MicroCheckRunner` is created. Existing preflight still gates the runner before instructions/countdown/active measurement.

## 12. Auto-finish / result save

Auto-finish remains owned by `MicroCheckRunner`: chair finishes on target reps or cap, balance finishes on hold completion/cap, and mobility finishes on ROM/cap. Existing `onComplete` handling is unchanged for result persistence.

## 13. Side/leg metadata and compatibility behavior

Added additive measurement side sources:

- `camera_inferred`
- `prior_record_camera_verified`
- `prior_micro_check_camera_verified`
- `user_fallback_selected`

Existing manual/default behavior is preserved. Existing micro-check series on the opposite side still records `opposite_side_fallback` and reduced comparability. Compatible official balance anchors can be camera verified as `prior_record_camera_verified` without comparing the micro-check to the official profile.

## 14. Optional micro-check containment

Optional micro-check completion still uses the existing optional path: local optional id, target domain metadata, no scheduled slot completion, no schedule/main-plan credit, no progression evidence, and no official profile history mutation.

## 15. Scheduled micro-check slot preservation

Scheduled completion still uses the existing `attachMicroCheckTargetMetadata` and `makeTrainingSessionCompletion` path with `sessionType: 'micro_check'`, `mainPlanCredit: false`, and the H5B slot identity. No scheduled slot policy code was changed.

## 16. Persistence/sync/restore/export/account clear

No persistence, sync, restore, data export, or account clear code was changed for HF2. Existing H5B.1/backend tests remain green.

## 17. UI/copy changes

`MicroCheckScreen` now shows hands-free setup notices while side inference is pending:

- balance: stand on one leg, or use the prior leg if available;
- mobility: turn side-on and reach, or use the prior side if available;
- stable evidence: hold still / side detected;
- fallback action: `Choose side manually`.

The original side setup copy remains available in the fallback screen.

## 18. Accessibility/fallback controls

After 12 seconds without sufficient side evidence, the optional `Choose side manually` control appears. Help and leave/cancel controls remain available. The fallback screen records `user_fallback_selected` when reached from hands-free mode.

## 19. Architecture/source guards

The screen still delegates grading to `MicroCheckRunner`; the new resolver only chooses side/leg setup metadata. Heavy grading remains outside React. No package, native dependency, audio asset, Warden transform, or route rollback was introduced.

## 20. Official artifact/report/plan containment

HF2 does not create or mutate Movement Profile V2 snapshots, official assessments, focus selection, comparisons, reports, plan/current/next block state, official history/latest profile, retest timing, schedule credit, main-plan credit, or progression evidence.

## 21. H5A/H5B/H5C/H5D/HF1 regression

H5A Progress authority tests, H5B/H5B.1 micro-check policy tests, H5C V1 route retirement tests, H5D release-flag tests, and HF1 V2 live coordinator tests passed. Public V1 route was not reintroduced. H5D public release remains blocked.

## 22. Tests added/changed

Changed:

- `src/training/__tests__/microCheckSideSetup.test.ts`
- `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts`

Added deterministic coverage for balance leg inference, mobility side inference, stable dwell, fallback timeout, source metadata, prior official anchor verification, prior micro-check verification, and hands-free screen source guards.

## 23. Files changed

HF2 implementation files:

- `App.tsx`
- `src/checkup/measurementContext.ts`
- `src/screens/MicroCheckScreen.tsx`
- `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts`
- `src/training/__tests__/microCheckSideSetup.test.ts`
- `src/training/microCheckSideSetup.ts`
- `docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md`

Other modified/untracked files in the final worktree were pre-existing user-owned HF1/H5 work and were not reverted.

## 24. Focused validation

Focused command passed:

```text
npm test -- --runInBand src/training/__tests__/microCheck.test.ts src/training/__tests__/microCheckSideSetup.test.ts src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts src/haleFlow/__tests__/microCheckPolicy.test.ts src/haleFlow/__tests__/microCheckPolicyH5B1.test.ts src/services/backend/__tests__/microCheckPersistenceH5B1.integration.test.ts src/services/backend/__tests__/microCheckSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/accountDataService.test.ts src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts src/haleFlow/__tests__/appLifecycle.test.ts src/haleFlow/__tests__/haleFlow.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/config/__tests__/releaseFlagAudit.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
```

Result: 21 suites passed, 161 tests passed. Existing Watchman recrawl and Jest open-handle notices remained.

## 25. Full validation

Final validation:

- `npm run typecheck` passed.
- `npm test -- --runInBand` passed: 165 suites, 1338 tests.
- `npm run verify:audio` passed with 502 required assets.
- `npm --prefix website run typecheck` passed.
- `npx --no-install expo config --type public` passed with the existing Sentry warning.
- `npx --no-install expo export --platform all --output-dir /tmp/hale-hf2-final-export` passed: web 2064 modules, iOS 2381 modules, Android 2378 modules, 1592 assets, 2 web bundles, 1 iOS bundle, 1 Android bundle, 2 files. Temp folder was removed.
- `git diff --check` passed.

## 26. Manual software trace

Scheduled trace:

1. H5B due surface launches scheduled micro-check target.
2. `MicroCheckScreen` opens camera view.
3. Chair starts runner immediately; balance/mobility wait for camera side resolver.
4. Stable camera side/leg evidence pins measurement context.
5. Runner speaks instructions/countdown, measures, auto-finishes.
6. Existing scheduled completion path saves result and H5B slot completion.

Optional trace:

1. Manual check-up starts optional micro-check or optional domain choice.
2. The same hands-free camera runner path is used.
3. Completion uses the existing optional result id path and does not complete a scheduled slot.

## 27. Known limitations and HF3 follow-up

No physical device validation was performed or claimed. The setup phase reuses existing framing voice prompts and existing runner instructions; no new side-setup audio assets were generated. HF3 training hands-free work remains deferred.

## 28. Initial/final Git status

Initial status was dirty with pre-existing modified HF1/H5 files and untracked audit/preview files.

Final status remains dirty because those user-owned files are still present and HF2 added/modified the implementation/report files listed above. No temp export folder remains.

## 29. Confirmation

No package install occurred. No lockfile changed. No audio was regenerated. No files were staged. No commit was created. No branch was created or switched. No push or PR was created. No Warden work occurred. No H5 route rollback occurred. No public V1 route was reintroduced. No training credit/progression change occurred. No physical-device validation claim is made.

```text
HF2 HANDS-FREE MICRO-CHECK IMPLEMENTATION COMPLETE
SCHEDULED MICRO-CHECK MID-FLOW TOUCH REMOVED
OPTIONAL MICRO-CHECK MID-FLOW TOUCH REMOVED
SINGLE-LEG MICRO-CHECK LEG INFERENCE IMPLEMENTED
MOBILITY MICRO-CHECK SIDE INFERENCE IMPLEMENTED
OPTIONAL MICRO-CHECK NON-SCHEDULED CONTAINMENT PRESERVED
SCHEDULED MICRO-CHECK POLICY PRESERVED
NO H5 ROUTING ROLLBACK
NO V1 PUBLIC ROUTE REINTRODUCTION
NO OFFICIAL PROFILE CONTAINMENT CHANGE
NO TRAINING CREDIT / PROGRESSION CHANGE
NO SCHEDULED MICRO-CHECK POLICY CHANGE
NO AUDIO REGENERATION
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
HF3 TRAINING HANDS-FREE NOT STARTED
```
