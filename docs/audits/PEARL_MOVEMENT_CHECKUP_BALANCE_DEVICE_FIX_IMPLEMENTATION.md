# Pearl Movement Check-Up Balance Device Fix Implementation

Date: 2026-06-28

## 1. Scope

This was a targeted production fix pass for the public unified Movement Profile V2 Movement Check-Up balance flow after physical-device testing found balance hands-free issues.

Implemented scope:

- repair the first-lift balance setup-to-ready countdown behavior;
- harden foot-down, active-timer clearing, rest-state display, and stale timer tick handling;
- revise hands-free balance multi-attempt policy so non-ceiling valid attempts continue to attempt 2/3;
- clarify visible balance setup, ready, trial, and rest copy without regenerating audio;
- add regression tests for the balance bug class and Warden age-19 chair result treatment.

Out of scope and unchanged:

- Warden formula/data/fingerprints/golden examples;
- chair percentile policy;
- official Movement Profile artifact eligibility;
- focus, plan creation, micro-check, training credit, schedule, and progression policy;
- public V1 rollback policy and release flags;
- packages, lockfiles, fonts, assets, audio generation, and audio fingerprints.

## 2. Physical-Device Audit Findings Carried Forward

Carried forward truths from the required prior reports:

- Normal public Check-Up is unified Movement Profile V2.
- Public V1 Movement Age flow remains retired from normal builds.
- HF1 made V2 Movement Check-Up hands-free in software, but the physical-device balance bugs required this targeted HF1 balance fix.
- HF2 micro-check hands-free behavior is preserved.
- HF3 training floor setup hands-free behavior is preserved.
- Warden chair percentile transform remains source-faithful and mathematically correct.
- Age 19 / 11 chair rises below the 10th percentile is verified correct for female and male reference groups.
- Closed beta was software-go before this physical-device balance bug except that physical-device QA remained required.
- Public release remains blocked.
- Physical-device validation is not claimed.

Physical-device bug findings carried into this implementation:

- Issue A: first lifted leg could be consumed by balance setup confirmation, causing the user to lower and lift again before the measured trial started.
- Issue B: deterministic replay already cleared the trial timer on touchdown, but the UI/state binding needed defensive hardening so a stale active countdown could not remain visible after a saved attempt.
- Issue C: hands-free balance could auto-save the best result after one non-ceiling valid trial and the default rest, skipping attempts 2/3.

## 3. Initial Git Status

Initial status was dirty and treated as user-owned. Inventory captured before edits:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/pearlFlow/index.ts
 M src/render/__tests__/artDirectedHumanGeometry.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
?? docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
?? src/pearlFlow/__tests__/microCheckSummary.test.ts
?? src/pearlFlow/microCheckSummary.ts
?? src/screens/MicroCheckSummaryScreen.tsx
```

Initial untracked inventory:

```text
docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
src/pearlFlow/__tests__/microCheckSummary.test.ts
src/pearlFlow/microCheckSummary.ts
src/screens/MicroCheckSummaryScreen.tsx
```

The existing modified `docs/decisions.md`, audio TypeScript files, render files, app shell files, and micro-check files were preserved as user-owned changes. This pass did not stage, commit, branch, push, or open a PR.

## 4. Baseline Validation

Baseline commands before edits:

- `npm run typecheck`: passed.
- `npm run verify:safe-beta-flags`: passed.
- `npm run verify:audio`: failed with `AUDIO VERIFICATION FAIL issues=502`, all stale safety, Movement Profile V2, and Voice V2.1 fingerprints for Clara/Marcus. This matched the known external audio-regeneration blocker and no audio files were edited by this pass.
- Focused baseline slice: passed, 26 suites / 236 tests.
- `npm test -- --runInBand`: passed, 171 suites / 1391 tests. Warnings: Watchman recrawl warning and Jest open-handle warning.
- `npm --prefix website run typecheck`: passed.
- `npm --prefix website run test`: passed, 5 files / 17 tests.
- `npx --no-install expo config --type public`: passed. Warning: Sentry org/project config missing; local public config reflected the local diagnostics env values.
- `git diff --check`: passed.

## 5. Balance First-Lift/Countdown Root Cause and Fix

Root cause:

- In hands-free balance setup, a stable lifted-leg posture could confirm setup.
- After transition to `balance_ready`, readiness effectively required a fresh stable lift after the attempt-start voice boundary.
- On device, that could make the first lift feel ignored and require a lower/lift cycle.

Fix:

- Added carried lifted-foot evidence across `balance_setup -> balance_ready` when the posture remains reliable and matches the selected standing leg.
- Preserved the voice boundary: the measured trial still cannot start before the attempt-start voice completes.
- Converted the ready check to level-triggered readiness so an already-raised foot can continue satisfying dwell once the voice boundary is clear.
- Cleared carried evidence on tracking loss, body-unit loss, chain reliability failure, foot-down state, ambiguous leg state, app backgrounding, or standing-leg mismatch.
- Preserved standing-leg inference metadata, including prior-leg comparison and `changedFromPrior` handling.

## 6. Balance Foot-Down/Timer/Rest Hardening

Hardened behavior:

- Added explicit balance timer kind on the live snapshot: `active_trial`, `rest`, or `none`.
- Cleared active trial timer state whenever a trial records, rests, stops, or support-touch/termination moves the flow out of active hold.
- Guarded stale timer ticks after touchdown so old active-trial deadlines cannot reappear in UI after the coordinator has moved to rest.
- Bound the visible footer timer label to `balanceTimerKind`; rest is rendered as `Rest`, not an active hold countdown.
- Added tests for touchdown after a valid 20s hold, stale active timer tick after touchdown, support-touched/stop paths, and rest timer visibility.

## 7. Balance Multi-Attempt/Auto-Best Policy Fix

Previous policy problem:

- Hands-free mode could auto-save the current best after the default 60s rest following one non-ceiling valid attempt.

New implemented policy:

- Up to 3 valid balance attempts are offered unless the 45s ceiling is reached.
- A 45s ceiling attempt auto-saves best and advances to shoulder setup.
- A non-ceiling valid attempt enters rest, then returns to balance ready when attempts remain.
- After the third valid attempt, best is auto-saved and the flow advances.
- Hard cap with at least one valid best auto-saves best; hard cap with no valid attempt records the existing no-measurement/protocol-incomplete recovery path.
- Invalid tracking attempts do not count as valid attempts.
- Normal hands-free path does not require a `Use this result` tap after a single non-ceiling valid attempt.

## 8. Balance UI/Copy Changes

Updated visible status copy only; no new audio assets were added.

- Setup: `Lift one foot when you're ready. I'll start when you're steady.`
- Ready with no prior saved best: `Hold steady - starting soon.`
- Ready after a saved best in hands-free mode: `Lift one foot again when you're ready.`
- Active trial: `Keep holding.`
- Rest after saved attempt: `Attempt saved. Rest before the next try.`

Existing voice cues remain in use. Future audio-copy alignment may be desirable after the known audio regeneration pass, but this implementation intentionally did not regenerate or modify audio assets/manifests/fingerprints.

## 9. Internal Diagnostics Changes, If Any

No new internal diagnostics timeline was added in this pass.

Reasoning:

- The bug class was addressed with explicit timer kind state, state-machine guards, UI binding guards, and deterministic tests.
- Adding a diagnostics export path would be a separate internal-tooling change and was not necessary to complete the targeted balance fix.

Remaining note:

- If Issue B reproduces again on a physical device, a bounded internal-only balance timeline may be useful. It should remain gated behind existing diagnostics flags, exclude raw landmarks/images/video/free text/secrets, and be off in safe beta.

## 10. Related Chair/Shoulder/Hinge Regression Search

The related movement surfaces were inspected through source review and regression slices covering Movement Profile V2 protocols, voice runtime/cues, snapshot/assessment, lifecycle, H5/HF flows, micro-check, training, and progress restoration.

No code changes were made to chair, shoulder, or hinge readiness/timer behavior. The validation slices listed below passed and did not show regressions in chair setup, shoulder/hinge measurement materialization, public route containment, or training/micro-check policies.

## 11. Warden Age-19 Result Handling

No Warden transform, reference data, percentile policy, golden example, or fingerprint changed.

Regression tests were added for the verified edge case:

- female, age 19, 11 chair rises: exact percentile locked near `1.8415747857`, public band `below_10`;
- male, age 19, 11 chair rises: exact percentile locked near `1.2690627304`, public band `below_10`.

This confirms the physical-device tester result treatment remains mathematically correct and unchanged.

## 12. Tests Added/Changed

Changed tests:

- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/screens/__tests__/CheckUpRecordingShell.test.ts`
- `src/reference/movementProfileV2/__tests__/referenceEngine.test.ts`

Coverage added or updated:

- first lifted leg during setup carries through ready and starts after the attempt voice boundary without foot-down/up;
- leg appearing at ready transition starts after dwell;
- ambiguous low-reliability setup waits and exposes fallback after timeout;
- tracking loss clears carried readiness evidence;
- changed-leg metadata and camera-inferred source are preserved;
- foot-down at about 20s transitions to rest and clears active trial timer;
- stale active timer tick after touchdown is ignored;
- visible timer kind is rest after touchdown;
- support-touched/stop paths clear active timer and enter rest;
- first and second non-ceiling valid attempts continue to next attempt;
- third valid attempt auto-saves best and advances;
- first 45s ceiling attempt auto-saves best and advances;
- invalid tracking attempt does not increment valid attempt count;
- hard cap with valid best auto-saves; hard cap with no valid attempt records no-measurement/protocol-incomplete;
- Warden age 19 / 11 reps female and male remain `below_10`.

## 13. Files Changed

Files intentionally changed by this pass:

- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`
- `src/screens/__tests__/CheckUpRecordingShell.test.ts`
- `src/reference/movementProfileV2/__tests__/referenceEngine.test.ts`
- `docs/audits/PEARL_MOVEMENT_CHECKUP_BALANCE_DEVICE_FIX_IMPLEMENTATION.md`

Existing user-owned dirty files were preserved and not reverted.

## 14. Focused Validation

Small focused balance/reference/UI check:

- Command: `npm test -- --runInBand src/movementProfileV2/__tests__/liveCoordinator.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts`
- Result: passed, 3 suites / 68 tests.
- Warning: Watchman recrawl warning.

Required focused regression slice:

- Command included live coordinator, Movement Profile V2 protocols, CheckUpRecordingShell, MovementProfileV2UnifiedCheckUpScreen voice runtime, V2 voice runtime/cues, reference snapshot/assessment/referenceEngine/persistence, results adapter, public unified Check-Up lifecycle, H4/H5/HF micro-check/training/progress/release-flag slices.
- Result: passed, 26 suites / 248 tests.
- Warning: Watchman recrawl warning and Jest open-handle warning.

## 15. Full Validation

Post-fix full gate:

- `npm run typecheck`: passed.
- `npm run verify:safe-beta-flags`: passed.
- `npm run verify:audio`: failed with the known stale fingerprint blocker only; see section 16.
- `npm test -- --runInBand`: passed, 171 suites / 1403 tests.
- `npm --prefix website run typecheck`: passed.
- `npm --prefix website run test`: passed, 5 files / 17 tests.
- `npx --no-install expo config --type public`: passed. Warning: Sentry org/project config missing; local public config reflected local diagnostics env values.
- `git diff --check`: passed.

Full Jest warnings:

- Watchman recrawl warning.
- Expected backend sync logs in the existing test suite.
- Jest open-handle warning.

## 16. Audio Verification Status and Known External Blocker

`npm run verify:audio` failed before and after this pass with the same known class of failure:

```text
AUDIO VERIFICATION FAIL issues=502
```

The failures are stale safety, Movement Profile V2, and Voice V2.1 fingerprints for Clara/Marcus after external voice-setting changes. This pass did not regenerate audio and did not edit audio assets, manifests, or fingerprints.

This remains an external audio-regeneration blocker and is not treated as a balance-fix implementation blocker.

## 17. Expo Config/Export and Safe-Beta Export

Expo config:

- `npx --no-install expo config --type public`: passed.
- Warning: Sentry org/project config missing; environment variables used as fallback.

Standard export:

- Command used the required `/tmp/pearl-movement-checkup-balance-fix-export` output dir and removed it afterward.
- Result: passed.
- Counts: Assets 1592; web bundles 2; iOS bundles 1; Android bundles 1; files 2.
- Warnings: Sentry org/project config missing; Node noted `NO_COLOR` was ignored because `FORCE_COLOR` was set.

Safe-beta export:

- Command used the required safe-beta env overrides with diagnostics/internal/legacy flags disabled, exported to `/tmp/pearl-movement-checkup-balance-fix-safe-beta-export`, and removed it afterward.
- Result: passed.
- Counts: Assets 1592; web bundles 2; iOS bundles 1; Android bundles 1; files 2.
- Warning: Sentry org/project config missing; environment variables used as fallback.

## 18. Remaining Device QA Requirements

Physical-device validation is still required before beta.

Retest steps:

- balance setup with one foot lifted once, held through setup and attempt voice boundary, should start without lower/lift cycle;
- first non-ceiling valid hold around 20s should save, immediately switch to rest UI, and never continue showing active hold countdown;
- after rest, attempt 2 should be offered and start hands-free;
- after a second non-ceiling valid hold, attempt 3 should be offered;
- after the third valid hold, best should auto-save and advance;
- first-attempt 45s ceiling should auto-save and advance;
- invalid tracking/lost subject should preserve retry/no-measurement behavior;
- safe-beta build should remain free of internal diagnostics surfaces.

Physical-device validation is not claimed in this report.

## 19. Final Git Status

Final status after implementation report creation:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/pearlFlow/index.ts
 M src/movementProfileV2/__tests__/liveCoordinator.test.ts
 M src/movementProfileV2/liveCoordinator.ts
 M src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/CheckUpRecordingShell.test.ts
?? docs/audits/PEARL_MOVEMENT_CHECKUP_BALANCE_DEVICE_FIX_IMPLEMENTATION.md
?? docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
?? src/pearlFlow/__tests__/microCheckSummary.test.ts
?? src/pearlFlow/microCheckSummary.ts
?? src/screens/MicroCheckSummaryScreen.tsx
```

Tracked diff inventory after this pass included existing user-owned changes plus the targeted balance files. Untracked inventory included the pre-existing physical-device bug audit and micro-check files plus this new implementation report.

## 20. Final Confirmations

- No Warden formula, source data, fingerprints, or golden examples changed.
- No chair percentile policy changed.
- No audio regeneration occurred.
- No audio assets, manifests, or fingerprints were edited by this pass.
- No package or lockfile changed.
- No H5/HF/training policy changed outside the targeted HF1 balance fix.
- No HF2 micro-check behavior change.
- No HF3 training floor setup behavior change.
- No public V1 route reintroduction or rollback policy change.
- No prior audit report or `docs/decisions.md` was edited by this pass.
- No fonts/assets changed.
- No secret env values were inspected or printed.
- No staging, commit, branch, push, or PR occurred.
- No physical-device validation pass is claimed.
- Public release remains blocked pending physical-device QA and the known audio-regeneration blocker.

## Final Verdicts

MOVEMENT CHECK-UP BALANCE DEVICE FIX IMPLEMENTATION COMPLETE

BALANCE FIRST-LIFT COUNTDOWN FIXED

BALANCE FOOT-DOWN TIMER / REST TRANSITION HARDENED

BALANCE MULTI-ATTEMPT POLICY FIXED

MOVEMENT CHECK-UP FIX PASS READY FOR PHYSICAL DEVICE RETEST

NO WARDEN FORMULA / DATA CHANGE

NO AUDIO REGENERATION

NO H5/HF/TRAINING POLICY CHANGE OUTSIDE TARGETED BALANCE FIX

NO PUBLIC V1 ROUTE REINTRODUCTION

PHYSICAL DEVICE VALIDATION NOT CLAIMED

PUBLIC RELEASE REMAINS BLOCKED
