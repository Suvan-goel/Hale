# Pearl Unified Movement Check-Up Stage H5C Public V1 Route Retirement

## 1. Scope

Stage H5C retired normal public V1 Check-Up/result routing, made unified Movement Profile V2 the public default, added an explicit V1 rollback-build flag, and contained internal harness rows/routes behind the exact internal flag. H5D, Warden, physical-device validation, audio generation, dependency changes, lockfile changes, and prior-report edits were not performed.

## 2. H5B.1 prerequisite evidence

Read before implementation:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`

H5B.1 sign-off carried forward: audio asset fingerprint gate passed; 44 safety cues / 88 assets; 31 Movement Profile V2 cues / 62 assets; 150 required assets; micro-check first-accepted-wins, Balanced/domain policy, scheduler/slot identity, persistence/sync/restore/export, report read-only behavior, and V1 micro-check rollback verified. H5C was unblocked.

## 3. Founder/product decisions carried forward

Normal public users get one Check-Up: camera setup -> polished unified H1 shell -> V2 live protocols -> raw V2 Check-Up -> reference details -> frozen Movement Profile -> V2 block/result/report surfaces. Public V1 remains only as explicit build rollback, not a normal product option. No Movement Age/body age/weakest-domain/improvement/decline/fall-risk claims were added.

## 4. Initial Git status

The required commands were run before edits:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

The worktree was already heavily dirty and user-owned. Captured initial `git diff --stat` summary was:

```text
439 files changed, 6909 insertions(+), 1498 deletions(-)
```

The initial inventory included extensive pre-existing tracked changes in `App.tsx`, `AGENTS.md`, audio MP3s/manifests, training/runtime/render/progress/micro-check/backend files, `docs/decisions.md`, and many untracked audit/test/source files. Those external changes were preserved and not reverted.

## 5. Re-entry/baseline validation

Mandatory first command:

```bash
npm run typecheck
```

Result: passed.

Baseline validation before H5C edits:

- Focused regression slice: 29 suites / 235 tests passed.
- `npm run verify:audio`: passed, 150 required assets.
- `npm test -- --runInBand`: passed, 158 suites / 1301 tests.
- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with known Sentry missing org/project warning and local diagnostics flags in public config.
- `git diff --check`: passed.
- Baseline `expo export --platform all`: passed, Android and iOS bundles, 444 assets, known Sentry and `NO_COLOR`/`FORCE_COLOR` warnings.

## 6. Current public routing inventory

| Entry point | H5C behavior | V1 reachability |
| --- | --- | --- |
| Onboarding baseline | Selects unified Movement Profile V2 | Rollback flag exact `1` + no V2 state only |
| Standard baseline | Selects unified Movement Profile V2 | Rollback flag exact `1` + no V2 state only |
| Baseline retake | Selects unified Movement Profile V2 | Rollback flag exact `1` + no V2 state only |
| Today/Plan/Progress official retest for V2 block | V2 official retest when due; typed unavailable when early/missing source artifacts | No V1 fallback |
| True V1-origin official retest | Unavailable normally | Rollback flag exact `1` + `legacy_v1_assessment` active block + no V2 state |
| Manual extra / quick re-check | Hidden from manual options or typed unavailable | Not routed to V1 |
| Micro-check | Separate H5B policy unchanged | V1 micro-check behavior only in true V1 rollback state |
| Camera setup begin | Uses baseline or baseline retake V2 source | V1 only in rollback build |
| Settings internal rows | Hidden unless exact internal flag provides callbacks | No public row |

## 7. Current result-route inventory

| Route/screen | Normal public? | Rollback only? | Internal only? | H5C action |
| --- | --- | --- | --- | --- |
| `ResultsScreen` | No | Yes | No | Guarded by rollback availability |
| `OnboardingResultsScreen` | No | Yes | No | Guarded by rollback availability |
| `MovementProfileV2UnifiedResultsScreen` | Yes | No | No | Public V2 result default |
| `MovementProfileV2ResultsScreen` read-only | Yes | No | Internal when entry context is internal | Public Progress read-only route allowed |
| `MovementProfileV2BlockReportScreen` | Yes | No | No | H4/H5A preserved |
| `movement-profile-v2-checkup` harness | No | No | Yes | Blocked unless internal flag exact `1` |
| V1 Progress history/result | No | Yes | No | Progress authority defaults to V2 unless rollback is explicit and no V2 state exists |

## 8. Current flag inventory

| Flag | Parser/default | H5C effect |
| --- | --- | --- |
| `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK` | Exact `'1'` only; `.env.example` default `0` | Only build-time path that can enable V1 rollback |
| `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP` | Existing exact `'1'` parser retained | No longer controls normal public V2 selection |
| `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL` | Exact `'1'` only | Internal harness rows/routes only |
| `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS` | Existing diagnostics gate | Not public Check-Up routing authority |
| `EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS` / `EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE` | Existing diagnostics gates | Pose benchmark row only when diagnostics gate is explicitly active |

No user setting, backend value, profile value, restore value, or remote JSON value enables rollback.

## 9. Legacy rollback-build flag

Added `src/config/legacyV1CheckUpRollback.ts`:

- `LEGACY_V1_CHECKUP_ROLLBACK_ENV`
- `parseLegacyV1CheckUpRollbackFlag(value)`
- `LEGACY_V1_CHECKUP_ROLLBACK_ENABLED`

Semantics: missing/empty/`0`/`true`/malformed false; exact `1` true; no side effects. `.env.example` now documents `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0`.

## 10. Unified V2 default policy

Normal public baseline, onboarding, baseline retake, and V2-origin official retest selection no longer depends on `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP`. Missing/off old release flag still selects unified V2.

## 11. Public selector precedence

`selectPublicMovementCheckUpLaunch` now uses explicit input facts:

1. Malformed V2 state -> unavailable/recovery, not V1.
2. V2-origin official retest -> V2 when schedule/artifact gates pass, otherwise typed unavailable.
3. Manual/quick/micro/unknown public Check-Up source -> unsupported unavailable.
4. Baseline/baseline retake -> V2 by default.
5. Baseline/baseline retake -> V1 only with rollback flag exact `1` and no V2 authority state.
6. True V1-origin official retest -> V1 only with rollback flag exact `1`, `legacy_v1_assessment`, and no V2 authority state.
7. Accepted/pending/V2 block/report state always prevents V1 fallback.

## 12. Baseline/baseline-retake behavior

Normal `baseline` and `baseline_retake` select `unified_movement_profile`. A later baseline with accepted V2 state becomes `baseline_retake`. Rollback baseline/retake can select V1 only with exact rollback flag and no accepted/pending/malformed/V2 block/report state.

## 13. Official-retest behavior

V2-origin block + `retest_due` + source artifacts selects unified V2 official retest even if the old release flag is off. V2-origin early/missing-artifact/conflict states are typed unavailable. True V1-origin official retest is unavailable unless rollback flag exact `1`, no V2 state exists, and the active block origin is `legacy_v1_assessment`.

## 14. Manual/quick Check-Up behavior

Public V1 manual extra and quick re-check starts are retired. Manual options now expose baseline/baseline retake, official retest, or micro-check where applicable; unsupported manual/quick routes return typed unavailable through the selector. Micro-check behavior remains separate and unchanged.

## 15. App route guarding

`App.tsx` now:

- imports `LEGACY_V1_CHECKUP_ROLLBACK_ENABLED`;
- allows public V2 flows without old release flag;
- includes public read-only V2 profile/detail routes in the public V2 allow-list;
- blocks internal V2 harness flows during render and via redirect unless the internal flag is exact enabled;
- blocks V1 `checkup` and `results` render branches unless rollback is enabled and safe;
- returns home for stale V1 flow state that lacks rollback authorization.

## 16. Public onboarding behavior

New-user onboarding uses unified V2 baseline in normal builds. V1 `CheckUpScreen` / `OnboardingResultsScreen` can mount only in rollback mode with no V2 authority state.

## 17. Pending/resume behavior

Existing pending V2 raw/reference-details continuation remains V2. Pending/malformed V2 authority state prevents V1 fallback.

## 18. Rollback-build behavior

Rollback build is explicit and build-time only. Safe rollback can run V1 baseline/result/official retest in true V1 state. Accepted V2 state, pending V2 continuation, malformed V2 state, V2-origin blocks, and V2 reports keep V2 authority and block rollback.

## 19. Settings/internal harness containment

`SettingsScreen` no longer shows developer rows just because `__DEV__` is true. Mock data and replay onboarding are treated as internal developer controls. Internal V2 harness rows remain available only when `MOVEMENT_PROFILE_V2_INTERNAL_ENABLED` supplies their callbacks. Pose benchmark remains independently gated by diagnostics.

## 20. Deep-link/direct-route safety

No public linking config to V1 or internal harnesses was added. Direct App route attempts to V1 `checkup` / `results` render blank and redirect home unless rollback is authorized. Direct internal V2 harness flow attempts are blocked unless internal flag is exact enabled.

## 21. Public copy guardrails

Normal public V2 result presentation remains Movement Profile language. V1/Movement Age copy remains quarantined in V1 files and cannot render in normal builds. Existing copy guardrail tests and H5C lifecycle tests verify no public presentation text contains V2/internal/developer/schema/fingerprint/source-id/Movement Age/weakest/physical-validation or plan-building CTA language.

## 22. H5A Progress/history preservation

`selectProgressDataAuthority` now defaults to `movement_profile_v2` (`public_v2_default`) when no V2 state exists and rollback is off. Accepted V2 profiles, V2-origin blocks, V2 reports, pending continuation, and malformed state keep their previous authority precedence. Rollback only selects V1 when explicitly enabled and no V2 state exists.

## 23. H5B micro-check preservation

H5B/H5B.1 tests passed after H5C. Balanced rotation, domain micro-checks, first-accepted-wins, slot identity, credit/progression containment, sync/restore/export, and report counts were not changed.

## 24. V1 rollback isolation

Rollback selector tests cover exact flag behavior, no-V2 baseline rollback, accepted V2 overriding rollback, malformed V2 failing closed, and true V1-origin official retest rollback. V1 rollback does not create V2 artifacts; normal V2 does not create V1 artifacts.

## 25. Audio preservation

No audio text/assets/manifests were edited for H5C. `npm run verify:audio` passed before and after final validation:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s total: requiredAssets=150
```

## 26. Product containment

No H5D work, Warden work, physical-device validation claim, website edit, dependency install, lockfile edit, audio generation, package install, staging, commit, branch, push, or PR occurred.

## 27. Files changed

H5C-owned changes:

- `.env.example`
- `App.tsx`
- `src/config/legacyV1CheckUpRollback.ts`
- `src/config/__tests__/legacyV1CheckUpRollback.test.ts`
- `src/checkup/publicCheckUpEngine.ts`
- `src/checkup/__tests__/publicCheckUpEngine.test.ts`
- `src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts`
- `src/pearlFlow/progressDataAuthority.ts`
- `src/pearlFlow/__tests__/progressDataAuthority.test.ts`
- `src/pearlFlow/manualCheckup.ts`
- `src/pearlFlow/__tests__/pearlFlow.test.ts`
- `src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts`
- `src/pearlFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts`
- `src/screens/SettingsScreen.tsx`
- `src/screens/__tests__/CheckUpRecordingShell.test.ts`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md`

## 28. Tests added/changed

Added:

- `src/config/__tests__/legacyV1CheckUpRollback.test.ts`

Updated selector/routing/regression tests:

- `src/checkup/__tests__/publicCheckUpEngine.test.ts`
- `src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts`
- `src/pearlFlow/__tests__/progressDataAuthority.test.ts`
- `src/pearlFlow/__tests__/pearlFlow.test.ts`
- `src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts`
- `src/pearlFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts`
- `src/screens/__tests__/CheckUpRecordingShell.test.ts`

## 29. Exact focused validation

H5C focused slice:

```bash
npm test -- --runInBand src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts src/pearlFlow/__tests__/progressDataAuthority.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts
```

Result: 10 suites / 73 tests passed.

Focused aggregate:

```bash
npm test -- --runInBand src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts src/onboarding/__tests__/onboarding.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/microCheckPolicy.test.ts src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts src/services/backend/__tests__/microCheckPersistenceH5B1.integration.test.ts src/training/__tests__/store.test.ts src/pearlFlow/__tests__/progressDataAuthority.test.ts src/pearlFlow/__tests__/movementProfileV2ProgressViewModel.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts src/results/__tests__/movementProfileV2ResultsAdapter.test.ts src/results/__tests__/resultsArchitecture.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts src/audio/__tests__/safetyAudio.test.ts src/audio/__tests__/movementProfileV2Audio.test.ts src/audio/__tests__/voicePlayer.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/services/backend/__tests__/microCheckSyncService.test.ts
```

Result: 30 suites / 239 tests passed.

Known warnings: Watchman recrawl, expected backend sync failure logs, Jest open-handle notice.

## 30. Exact full validation

First full Jest run exposed one transient order-sensitive render benchmark mismatch in `PoseOverlayBenchmarkScreen.constellationV2.test.ts`; the same test passed in isolation immediately after. Full Jest was rerun:

```bash
npm test -- --runInBand
```

Final result: 159 suites / 1305 tests passed. Known warnings: Watchman recrawl, expected backend sync logs, Jest open-handle notice.

## 31. Audio verification

`npm run verify:audio` passed twice after H5C edits, including final pass:

- Safety: 44 cues / 88 assets.
- Movement Profile V2: 31 cues / 62 assets.
- Total: 150 required assets.

## 32. App/website typechecks

```bash
npm run typecheck
npm --prefix website run typecheck
```

Both passed.

## 33. Expo config/export

```bash
npx --no-install expo config --type public
```

Passed. Known warning: `[@sentry/react-native/expo] Missing config for organization, project`; local env names printed without values; local diagnostics flags were true in public config.

```bash
rm -rf /tmp/pearl-unified-h5c-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5c-export
rc=$?
rm -rf /tmp/pearl-unified-h5c-export
exit $rc
```

Passed. Android bundled in 8038 ms; iOS bundled in 14486 ms; assets: 444. Known warnings: Sentry config fallback and repeated `NO_COLOR` ignored because `FORCE_COLOR` is set. Temp export directory removed.

## 34. H0-H5B.1 / Stage 3D-B / Stage 4 / Stage 5 / Step-Up / audio regression

Covered by focused aggregate and full Jest:

- H3/H3.1 public baseline/onboarding green.
- H4/H4.1.1 official retest/report/next-block green.
- H5A Progress authority/history green.
- H5B/H5B.1 micro-check green.
- Stage 5G.1 / Stage 5H green.
- Step-Up runtime and training voice/runtime tests green in full Jest.
- Safety audio and Movement Profile V2 audio tests green.

## 35. Remaining H5D/device work

H5D remains future work: beta flag lockdown, stale docs/config cleanup such as old audio wording, full release-candidate hardening, physical-device QA protocol/evidence template, and closed-beta ship decision. Physical-device validation was not claimed.

## 36. Whether H5D is unblocked

H5D is unblocked from H5C routing/release-policy perspective because normal public V2 routing, V1 rollback isolation, internal harness containment, focused regression, full Jest, audio, typechecks, Expo config/export, and diff check passed.

## 37. Initial/final Git status

Initial worktree was dirty before H5C:

- Initial `git diff --stat`: 439 files changed, 6909 insertions, 1498 deletions.
- Initial untracked inventory was large and included many audit reports/prompts/tests/source files.

Near-final measured counts before writing this report:

```text
git status --short --untracked-files=all | wc -l -> 590
git diff --name-only | wc -l -> 445
git ls-files --others --exclude-standard | wc -l -> 145
```

The increase reflects H5C files plus pre-existing user-owned dirty state. No unrelated dirty files were reverted.

## 38. Complete files-changed inventory

Complete H5C inventory is listed in section 27. Complete repository dirty inventory remains large and user-owned; categories include audio MP3s/manifests, training runtime/voice/floor/step-up work, render experiments, backend sync/restore tests, Progress/H5A/H5B files, audit docs, and generated evidence CSV/JSON/MD files. Those were present before H5C or unrelated to H5C and preserved.

## 39. Concurrent external changes

Concurrent external changes affected audio assets/manifests, render benchmarks, training voice/runtime, floor/step-up evidence, backend sync/restore, Progress, diagnostics, docs/decisions, and many audit artifacts. H5C integrated only with touched routing/config/test files and did not revert or normalize external work. A transient full-Jest render benchmark mismatch appeared once and then passed in isolation and on full rerun; no H5C change was made to render files.

## 40. Negative confirmations

Confirmed:

- No package install.
- No lockfile change.
- No audio regeneration.
- No MP3/manifest edit by H5C.
- No staging, commit, branch, push, or PR.
- No H5D work.
- No Warden work.
- No physical-device validation claim.
- No prior report or `docs/decisions.md` edit by H5C.
- No `.env` value inspection or credential exposure.

## Stage decisions

UNIFIED MOVEMENT CHECK-UP STAGE H5C COMPLETE

PUBLIC V1 CHECK-UP / RESULTS ROUTES RETIRED

UNIFIED V2 PUBLIC DEFAULT ENABLED

LEGACY V1 ROLLBACK-BUILD POLICY IMPLEMENTED

INTERNAL HARNESS CONTAINMENT VERIFIED

V1 ROLLBACK PATH VERIFIED

UNIFIED MOVEMENT CHECK-UP STAGE H5D UNBLOCKED

NORMAL PUBLIC CHECK-UP IS UNIFIED V2

PUBLIC V1 MOVEMENT AGE FLOW RETIRED FROM NORMAL BUILDS

V1 RETAINED ONLY FOR EXPLICIT ROLLBACK BUILDS

ACCEPTED V2 STATE NEVER FALLS BACK TO V1

NO V1 LEGACY-RESULT MIGRATION REQUIRED

NO MIXED V1 / V2 USER HISTORY

NO IMPROVEMENT OR DECLINE CLAIMS

H5A V2 PROGRESS PRESERVED

H5B MICRO-CHECK POLICY PRESERVED

AUDIO ASSET FINGERPRINT GATE PASSED

RELEASE-CANDIDATE HARDENING NOT PERFORMED

WARDEN TRANSFORM DEFERRED

CHAIR REFERENCE CLAIM REMAINS RAW-ONLY

PHYSICAL DEVICE VALIDATION NOT CLAIMED

PUBLIC RELEASE REMAINS BLOCKED
