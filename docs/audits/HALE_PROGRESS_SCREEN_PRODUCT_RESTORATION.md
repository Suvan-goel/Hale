# Hale Progress Screen Product Restoration

Date: 2026-06-27

## 1. Scope

This was a narrow Progress page product/UI restoration pass. The work restored user-facing Progress dashboard surfaces while preserving Movement Profile V2 as the canonical Progress authority.

Changed production runtime surface:

- `src/screens/ProgressScreen.tsx`
- `src/screens/progressProductPresentation.ts`
- `App.tsx` only for the Progress "View current plan" navigation callback.

Changed Progress-specific tests:

- `src/screens/__tests__/ProgressAndManualRestoration.test.ts`
- `src/screens/__tests__/progressProductPresentation.test.ts`

Created this audit report only:

- `docs/audits/HALE_PROGRESS_SCREEN_PRODUCT_RESTORATION.md`

No Movement Profile V2 measurement/reference logic, official source eligibility, block/report creation, scheduler credit, progression, HF coordinator behavior, release flags, audio assets/manifests/cues, package metadata, lockfiles, prior audit reports, or `docs/decisions.md` were changed.

## 2. Why this restoration was needed

After the V2 Movement Profile migration, Progress remained functionally correct but read too much like a saved-artifact viewer. The public page overemphasized the hero/latest-profile/history stack, showed a full Movement Profile history card even with one official profile, and exposed technical reference labels such as published-comparison/reference-engine wording on the summary rows.

The restored page now answers the product questions:

- Where am I now?
- What am I working on?
- When do I check again?
- What can I do next?
- What has Hale saved over time?

## 3. Current H5/HF constraints carried forward

Read and preserved before editing:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md`
- `docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md`
- `docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md`
- `docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md`

Carried-forward constraints:

- Progress is V2-canonical when V2 state exists.
- V1 Progress remains rollback-only.
- Public normal Check-Up remains unified V2.
- Official Movement Profile history includes only `baseline`, `baseline_retake`, and `official_retest`.
- Micro-checks and optional check-ups remain excluded from official Movement Profile history.
- Read-only profile/report routes remain side-effect free.
- Public V1 Movement Age flow remains retired from normal builds.
- H5B/H5B.1 micro-check policy remains preserved.
- H5C public V1 route retirement remains preserved.
- H5D release flag behavior remains preserved.
- HF1/HF2/HF3 hands-free behavior remains preserved.
- Warden remains deferred.
- Chair remains raw-only.
- Physical-device validation is not claimed.
- Public release remains blocked.

## 4. Initial Git status

`git status --short --untracked-files=all`

```text
 M .gitignore
 M App.tsx
 M src/checkup/measurementContext.ts
 M src/checkup/protocolSetup.ts
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseRendererReplay.ts
 M src/haleFlow/__tests__/appLifecycle.test.ts
 M src/haleFlow/__tests__/copyGuardrails.test.ts
 M src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts
 M src/haleFlow/__tests__/planViewModel.test.ts
 M src/haleFlow/appLifecycle.ts
 M src/haleFlow/movementProfileV2ProgressViewModel.ts
 M src/haleFlow/planViewModel.ts
 M src/movementProfileV2/__tests__/liveCoordinator.test.ts
 M src/movementProfileV2/liveCoordinator.ts
 M src/movementProfileV2/voiceRuntime.ts
 M src/reference/movementProfileV2/snapshot.ts
 M src/render/PoseAvatarRenderer.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/__tests__/softDigitalTwinGeometry.test.ts
 M src/render/poseAvatarTypes.ts
 M src/render/softDigitalTwinGeometry.ts
 M src/screens/MicroCheckScreen.tsx
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/__tests__/CheckUpRecordingShell.test.ts
 M src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/services/backend/AuthProvider.tsx
 M src/training/__tests__/microCheckSideSetup.test.ts
 M src/training/__tests__/sessionPlayer.test.ts
 M src/training/microCheckSideSetup.ts
 M src/training/sessionPlayer.ts
?? docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
?? docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
?? docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
?? docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
?? docs/audits/Hale_HF1_Hands_Free_V2_CheckUp_Implementation_Prompt.md
?? docs/audits/Hale_HF2_Hands_Free_Micro_Check_Implementation_Prompt.md
?? docs/audits/Hale_HF3_Hands_Free_Training_Implementation_Prompt.md
?? docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
?? docs/audits/Hale_Progress_Screen_Product_Restoration_Prompt.md
?? src/render/PrivacyShadowRenderer.tsx
?? src/render/__tests__/privacyShadowGeometry.test.ts
?? src/render/privacyShadowGeometry.ts
```

`git diff --name-only`

```text
.gitignore
App.tsx
src/checkup/measurementContext.ts
src/checkup/protocolSetup.ts
src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
src/diagnostics/poseRendererReplay.ts
src/haleFlow/__tests__/appLifecycle.test.ts
src/haleFlow/__tests__/copyGuardrails.test.ts
src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts
src/haleFlow/__tests__/planViewModel.test.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/movementProfileV2ProgressViewModel.ts
src/haleFlow/planViewModel.ts
src/movementProfileV2/__tests__/liveCoordinator.test.ts
src/movementProfileV2/liveCoordinator.ts
src/movementProfileV2/voiceRuntime.ts
src/reference/movementProfileV2/snapshot.ts
src/render/PoseAvatarRenderer.tsx
src/render/__tests__/poseAvatarConfig.test.ts
src/render/__tests__/softDigitalTwinGeometry.test.ts
src/render/poseAvatarTypes.ts
src/render/softDigitalTwinGeometry.ts
src/screens/MicroCheckScreen.tsx
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
src/screens/PlanScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/__tests__/CheckUpRecordingShell.test.ts
src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
src/services/backend/AuthProvider.tsx
src/training/__tests__/microCheckSideSetup.test.ts
src/training/__tests__/sessionPlayer.test.ts
src/training/microCheckSideSetup.ts
src/training/sessionPlayer.ts
```

`git diff --stat`

```text
 .gitignore                                         |   1 +
 App.tsx                                            | 115 +++++---
 src/checkup/measurementContext.ts                  |   8 +
 src/checkup/protocolSetup.ts                       |   8 +-
 ...poseLatencyDiagnostics.test.ts                  |   7 +
 src/diagnostics/poseRendererReplay.ts              |  25 ++
 src/haleFlow/__tests__/appLifecycle.test.ts        |  31 ++
 src/haleFlow/__tests__/copyGuardrails.test.ts      |   1 +
 ...movementProfileV2ProgressViewModel.test.ts      |  42 +--
 src/haleFlow/__tests__/planViewModel.test.ts       |   4 +
 src/haleFlow/appLifecycle.ts                       |  15 +
 src/haleFlow/movementProfileV2ProgressViewModel.ts | 131 +--------
 src/haleFlow/planViewModel.ts                      |  10 +-
 ...liveCoordinator.test.ts                         | 159 ++++++++++-
 src/movementProfileV2/liveCoordinator.ts           | 314 ++++++++++++++++++++-
 src/movementProfileV2/voiceRuntime.ts              |  11 +-
 src/reference/movementProfileV2/snapshot.ts        |   7 +-
 src/render/PoseAvatarRenderer.tsx                  |   3 +
 src/render/__tests__/poseAvatarConfig.test.ts      |   5 +
 ...softDigitalTwinGeometry.test.ts                 |  39 +++
 src/render/poseAvatarTypes.ts                      |   1 +
 src/render/softDigitalTwinGeometry.ts              | 218 +++++++++++---
 src/screens/MicroCheckScreen.tsx                   | 136 ++++++++-
 ...MovementProfileV2ReferenceDetailsScreen.tsx     |  16 +-
 ...MovementProfileV2UnifiedCheckUpScreen.tsx       |  32 ++-
 src/screens/PlanScreen.tsx                         |  32 ++-
 src/screens/PoseOverlayBenchmarkScreen.tsx         |  27 ++
 src/screens/ProgressScreen.tsx                     | 236 +++++++++-------
 src/screens/TodayScreen.tsx                        |  26 +-
 src/screens/TrainingSessionScreen.tsx              |  17 +-
 ...CheckUpRecordingShell.test.ts                   |   2 +
 ...MicroCheckScreen.sideSetup.test.ts              |  14 +-
 ...PoseOverlayBenchmarkScreen.constellationV2.test.ts | 20 ++
 src/services/backend/AuthProvider.tsx              |   6 +-
 src/training/__tests__/microCheckSideSetup.test.ts | 224 +++++++++++++++
 src/training/__tests__/sessionPlayer.test.ts       | 125 ++++----
 src/training/microCheckSideSetup.ts                | 272 +++++++++++++++++-
 src/training/sessionPlayer.ts                      | 245 +++++++++++++---
 38 files changed, 2078 insertions(+), 507 deletions(-)
```

`git ls-files --others --exclude-standard`

```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/Hale_HF1_Hands_Free_V2_CheckUp_Implementation_Prompt.md
docs/audits/Hale_HF2_Hands_Free_Micro_Check_Implementation_Prompt.md
docs/audits/Hale_HF3_Hands_Free_Training_Implementation_Prompt.md
docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
docs/audits/Hale_Progress_Screen_Product_Restoration_Prompt.md
src/render/PrivacyShadowRenderer.tsx
src/render/__tests__/privacyShadowGeometry.test.ts
src/render/privacyShadowGeometry.ts
```

All pre-existing tracked and untracked changes were treated as user-owned.

## 5. Baseline validation

Before edits:

- `npm run typecheck`: passed.
- `npm run verify:audio`: passed.
  - `safety`: required cues 44, voices `clara,marcus`, required assets 88, total bytes 4,944,110, duration range 1.904-5.805s.
  - `movementProfileV2`: required cues 31, voices `clara,marcus`, required assets 62, total bytes 3,350,553, duration range 0.743-7.430s.
  - `voiceV21`: required assets 352.
  - Total required assets 502.
- Focused baseline slice: 34 suites passed, 273 tests passed.
- `npm test -- --runInBand`: 166 suites passed, 1345 tests passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed.
  - Warning observed: Sentry project/org env not configured; source maps will not be uploaded.
  - Local env produced diagnostics booleans in public config.
- `git diff --check`: passed with no output.
- Baseline `npx --no-install expo export --platform all --output-dir /tmp/hale-progress-restoration-baseline-export`: passed.
  - Warning observed: known Sentry missing org/project warning.
  - Warning observed: `NO_COLOR` ignored because `FORCE_COLOR` is set.
  - Web bundle: 2066 modules.
  - iOS bundle: 2383 modules.
  - Android bundle: 2380 modules.
  - Assets: 1592.
  - Web bundles: 2.
  - iOS bundles: 1.
  - Android bundles: 1.
  - Files: 2 (`index.html`, `metadata.json`).
  - Temp export directory was removed after the command.

Expected recurring warnings/logs during Jest:

- Watchman recrawl warning.
- Jest open-handle notice.
- Expected backend sync warning logs.

## 6. Current Progress inventory

| Surface | Current component/function | Current data authority | Current visual source | Keep / remove / restore / rewrite | Reason |
| --- | --- | --- | --- | --- | --- |
| Page header | `ProgressScreen` header/settings mark | App tab state | Existing Progress shell | Keep | Preserves current premium top chrome and settings affordance. |
| Hero card | `MovementProfileV2HeroSection` | `MovementProfileV2ProgressViewModel` | Existing V2 Progress hero | Keep | It answers "where am I now" without changing authority. |
| Latest Movement Profile card | `MovementProfileV2ProfileCard` | V2 canonical progress view model | Existing V2 card | Rewrite copy | Keeps saved result authority but removes artifact/reference wording. |
| Metric rows | `MovementProfileV2ProgressRow` | V2 domain summary cards | Existing row layout plus new presentation helper | Rewrite labels | Public summary now shows short user-facing labels or `Saved result`. |
| Current plan/source card | Former V2 source card | V2 profile/block source metadata | Removed source-card concept | Remove | Founder removed the redundant source explanation; it was not restored. |
| Next check-up card | `MovementProfileV2NextCheckUpCard` | Stage 5 block schedule state and V2 block/report context | Restored old Progress card pattern | Restore | Restores dashboard answer for "when do I check again" without V1 logic. |
| Movement Profile history card | `MovementProfileV2OfficialHistoryCard` | V2 official history only | Existing V2 history card | Gate | Hidden until two or more official profiles to avoid repeating the latest card. |
| Block-report history card | `MovementProfileV2ReportHistoryCard` | V2 block reports | Existing V2 report card | Keep/gate | Shows only when at least one valid report exists. |
| Micro-check section | No separate public section added | H5B/H5B.1 micro-check policy | Existing micro-check containment elsewhere | Keep absent | Only meaningful micro-check state should surface; no new micro-check authority added. |
| Extra check-up action | `MovementProfileV2ExtraCheckUpCard` | Existing manual/extra Check-Up route | Restored old Progress affordance | Restore | Gives a safe optional action that remains non-official/non-credit. |
| What you are practicing now | `TrainingProgressCard` | Current training/progression view model | Existing old card pattern | Restore/rewrite | Shows simple practice state without official interpretation. |
| Pending/recovery state | `MovementProfileV2PendingCard`, recovery/empty surfaces | H5A V2 recovery/pending states | Existing Progress cards | Preserve/rewrite copy where needed | Keeps continuation/recovery behavior without technical public copy. |
| Empty state | `ProgressEmptyState` | App lifecycle/onboarding authority | Founder-restored empty state | Preserve | No-profile start remains unchanged. |
| Read-only detail routes | `onViewMovementProfileV2Profile`, `onViewMovementProfileV2Report` | H5A read-only profile/report selectors | Existing routes | Preserve | Viewing saved details remains side-effect free. |
| Tab/safe-area layout | Progress screen container and bottom tab shell | App navigation state | Existing shell | Preserve | No layout/system navigation redesign. |

## 7. Old Progress cards located/reused

Searched current code and Git history/current diffs for:

- `Your next check-up`
- `Check-up history`
- `Last 4-week plan`
- `Extra check-up`
- `What you are practicing now`

Relevant old/polished card language and layout patterns existed in the current Progress screen/V1 rollback areas and prior history around commits including `0b382e1`, `5f85326`, `d8b55e1`, and `97de1a5`. The restoration reused the Progress card style and row treatment where useful, but did not restore V1 Movement Age, V1 result logic, V1 history, weakest-domain language, improvement/decline logic, or old V1 authority.

## 8. Final Progress information architecture

For a user with one completed Movement Profile and an active plan, the V2 Progress page now orders the public cards as:

1. Header.
2. Hero card.
3. Latest Movement Profile.
4. Your next check-up, when active block/retest state makes it meaningful.
5. Current 4-week plan or Last 4-week plan summary.
6. What you are practicing now.
7. Extra check-up.
8. Movement Profile history only when there are two or more official profiles.
9. Block-report history only when at least one report exists.

No separate card whose main purpose is "this plan was formulated from X Movement Profile" was restored.

## 9. Latest Movement Profile copy simplification

Implemented:

- Public card body now uses `Your latest Movement Check-Up results.`
- `progressSummaryStatusLabel` maps V2 technical/reference statuses into public labels.
- Strength/chair remains `Saved result`.
- Balance uses plain labels such as `Strong hold`, `Building hold`, and `Starting point`.
- Mobility uses plain labels such as `Within typical range`, `Below typical range`, `Above typical range`, or `Saved result`.
- Public metric labels wrap instead of truncating into meaningless fragments.

Source scan of public Progress summary files returned no matches for:

- `Published compar`
- `Published age-gro`
- `Typical range saved`
- `Reference eligible`
- `Raw-only`
- `IQR`
- `Benchmark`
- `Schema`
- `Fingerprint`
- `reference labels`
- `current plan is based on your previous`

## 10. Next check-up card

Added `buildProgressNextCheckUpCard` and `MovementProfileV2NextCheckUpCard`.

Behavior:

- Hidden when there is no ready V2 profile/block context.
- Hidden when the active V2 block is already completed or a report already exists.
- Uses Stage 5 block schedule state for date gating.
- Not-yet-open state shows neutral copy such as `Opens in X days.`
- Due-now state shows `Ready now.` and CTA `Start Movement Check-Up`.
- CTA routes through the existing public V2 official retest callback.

No V1 route or V1 Check-Up authority was introduced.

## 11. Current/last 4-week plan card

Added `buildProgressPlanSummaryCard` and `MovementProfileV2PlanSummaryCard`.

Behavior:

- Shows `Current 4-week plan` for an active V2 block.
- Can show `Last 4-week plan` for the latest completed/reported V2 block.
- Uses simple summary copy such as `Strength / Power - 2 of 12 sessions completed.`
- Balanced blocks render as `Balanced`.
- CTA is `View current plan` and only navigates to the Plan tab.

No session start, block creation, block replacement, report creation, or source-card restoration occurs from this card.

## 12. What you are practicing now card

Updated `TrainingProgressCard` public copy and statuses.

Behavior:

- Title remains `What you are practicing now`.
- Body now says `Hale adjusts these movements based on your completed sessions.`
- Status labels pass through `progressPracticeStatusLabel` and collapse to short public labels: `Ready`, `Building`, or `Available`.
- Rows continue to use the existing training/progression card data already provided to Progress.

No hidden optional levels were exposed, no ladder IDs were shown, no official improvement/decline interpretation was added, and no progression state was mutated.

## 13. Extra check-up card

Added `MovementProfileV2ExtraCheckUpCard`.

Behavior:

- Shows `Extra check-up`.
- Copy says optional checking will not change the plan.
- CTA navigates to the existing Manual / Extra Check-Up screen through `onBeginAdditionalCheckUp`.
- Optional full Check-Up and optional micro-check containment remain governed by existing H5/HF policies.

No official history, report, plan, training credit, or V1 route mutation was added.

## 14. Movement Profile history visibility rule

Implemented:

- Official profile count 0: no full Movement Profile history card.
- Official profile count 1: no full Movement Profile history card.
- Official profile count 2 or more: show full Movement Profile history card.

Official history continues to come from the H5A V2 Progress view model and excludes micro-checks and optional check-ups.

## 15. Report history visibility rule

Preserved:

- V2 block report history is shown only when `viewModel.reports.length > 0`.
- No empty report history card is rendered when there are no reports.

## 16. Pending/recovery state preservation

Preserved:

- No-profile Progress empty state.
- Raw Check-Up saved but reference details pending.
- Snapshot/assessment pending.
- Malformed V2 recovery.
- Plan/profile mismatch handling.
- Accepted V2 with release flag off behavior.
- Rollback-only V1 state behind explicit rollback flag.

One public pending note was simplified from technical reference-label wording to optional-details wording.

## 17. Visual design preservation

Preserved:

- Warm stone background and card treatment.
- Serif headings and existing typography scale.
- Dark text and green accent actions.
- Existing header mark and settings icon.
- Existing card radius, separators, spacing, and premium Progress visual treatment.
- Existing bottom tab/safe-area behavior.

No generic list redesign was introduced.

## 18. Copy guardrails

Public V2 Progress summary copy was guarded against:

- Movement Age / body age.
- Weakest-domain language.
- V1/V2/internal artifact language on public summary cards.
- Schema/fingerprint/protocol/frozen/reference-label wording.
- Published-comparison/published-age-group/IQR/benchmark wording on public summary rows.
- Percentile claims.
- Improvement/decline/better/worse/younger/older language.
- `changed in latest check-up`.
- Fall-risk/diagnosis/pass-fail wording.

The source-level regression test was extended to assert public Progress copy does not bring back removed technical/source-card phrasing.

## 19. Data authority/containment

Preserved:

- Latest Movement Profile and official history: H5A V2 canonical Progress view model.
- Next Check-Up: Stage 5 block schedule state plus active V2 block/report context.
- Current/last plan summary: V2 block state plus Stage 5 schedule-credited sessions.
- Practice rows: existing training/progression view model card data.
- Extra Check-Up: existing Manual / Extra Check-Up route.
- Read-only details: existing profile/report read-only navigation.

Containment preserved:

- No official source eligibility changes.
- No optional Check-Up or micro-check promotion into official history.
- No micro-check target policy/slot identity changes.
- No training scheduler credit/progression changes.
- No block/report creation changes.
- No HF1/HF2/HF3 coordinator changes.

## 20. Tests added/changed

Added:

- `src/screens/__tests__/progressProductPresentation.test.ts`
  - Technical Movement Profile labels map to public labels.
  - Practice statuses map to short public labels.
  - Next Check-Up card hides without active context.
  - Next Check-Up date-gated and due-now states.
  - Plan card session count uses schedule-credited sessions and excludes unrelated completion noise.

Changed:

- `src/screens/__tests__/ProgressAndManualRestoration.test.ts`
  - Asserts restored V2 dashboard card structure exists in source.
  - Asserts full Movement Profile history is gated behind `officialHistory.length >= 2`.
  - Asserts simplified Latest Movement Profile copy.
  - Asserts separate plan-source card copy is not restored.
  - Asserts summary row uses `progressSummaryStatusLabel`.

Existing focused and full regression suites cover H5A/H5B/H5C/H5D/HF1/HF2/HF3 behaviors.

## 21. Files changed

Files touched by this restoration pass:

- `App.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/screens/progressProductPresentation.ts`
- `src/screens/__tests__/ProgressAndManualRestoration.test.ts`
- `src/screens/__tests__/progressProductPresentation.test.ts`
- `docs/audits/HALE_PROGRESS_SCREEN_PRODUCT_RESTORATION.md`

Important note: the repository already had substantial tracked and untracked user-owned changes before this pass. They were not reverted.

## 22. Focused validation

Post-implementation focused tests:

`npm test -- --runInBand src/screens/__tests__/ProgressAndManualRestoration.test.ts src/screens/__tests__/progressProductPresentation.test.ts`

- 2 suites passed.
- 8 tests passed.
- Watchman recrawl warning observed.

Broader focused regression slice:

`npm test -- --runInBand src/screens/__tests__/ProgressAndManualRestoration.test.ts src/screens/__tests__/progressProductPresentation.test.ts src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts src/haleFlow/__tests__/progressDataAuthority.test.ts src/haleFlow/__tests__/progressViewModel.test.ts src/haleFlow/__tests__/copyGuardrails.test.ts src/haleFlow/__tests__/appLifecycle.test.ts src/haleFlow/__tests__/planViewModel.test.ts src/haleFlow/__tests__/microCheckPolicy.test.ts src/haleFlow/__tests__/microCheckPolicyH5B1.test.ts src/services/backend/__tests__/microCheckPersistenceH5B1.integration.test.ts src/training/__tests__/microCheck.test.ts src/training/__tests__/microCheckSideSetup.test.ts src/services/backend/__tests__/microCheckSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/config/__tests__/releaseFlagAudit.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/voiceRuntime.test.ts src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts src/training/__tests__/sessionPlayer.test.ts src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts src/training/__tests__/store.test.ts src/haleFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts src/haleFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts src/haleFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts`

- 35 suites passed.
- 279 tests passed.
- Watchman recrawl warning observed.
- Expected backend sync warning logs observed.

H5A/H5B/H5B.1/H5C/H5D/HF1/HF2/HF3 regression result: passed in the focused slice.

## 23. Full validation

Post-implementation full validation:

- `npm run verify:audio`: passed.
  - `safety`: required cues 44, voices `clara,marcus`, required assets 88, total bytes 4,944,110, duration range 1.904-5.805s.
  - `movementProfileV2`: required cues 31, voices `clara,marcus`, required assets 62, total bytes 3,350,553, duration range 0.743-7.430s.
  - `voiceV21`: required assets 352.
  - Total required assets 502.
- `npm test -- --runInBand`: 167 suites passed, 1351 tests passed.
  - Watchman recrawl warning observed.
  - Jest open-handle notice observed.
  - Expected backend sync warning logs observed.
- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed.
  - Warning observed: Sentry project/org env not configured; source maps will not be uploaded.
  - Local env produced diagnostics booleans in public config.
- `git diff --check`: passed with no output.
- `npx --no-install expo export --platform all --output-dir /tmp/hale-progress-restoration-export`: passed with exit code 0.
  - Web bundle: 2067 modules.
  - iOS bundle: 2269 modules.
  - Android bundle: 2348 modules.
  - Assets: 1592.
  - Web bundles: 2.
  - iOS bundles: 1.
  - Android bundles: 1.
  - Files: 2 (`index.html`, `metadata.json`).
  - Temp export directory was removed after the command.

## 24. Initial/final Git status

Initial Git status is recorded in section 4.

Final Git status after report creation is inserted below.

### Final `git status --short --untracked-files=all`

```text
 M .gitignore
 M App.tsx
 M src/checkup/measurementContext.ts
 M src/checkup/protocolSetup.ts
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseRendererReplay.ts
 M src/haleFlow/__tests__/appLifecycle.test.ts
 M src/haleFlow/__tests__/copyGuardrails.test.ts
 M src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts
 M src/haleFlow/__tests__/planViewModel.test.ts
 M src/haleFlow/appLifecycle.ts
 M src/haleFlow/movementProfileV2ProgressViewModel.ts
 M src/haleFlow/planViewModel.ts
 M src/movementProfileV2/__tests__/liveCoordinator.test.ts
 M src/movementProfileV2/liveCoordinator.ts
 M src/movementProfileV2/voiceRuntime.ts
 M src/reference/movementProfileV2/snapshot.ts
 M src/render/PoseAvatarRenderer.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/__tests__/softDigitalTwinGeometry.test.ts
 M src/render/poseAvatarTypes.ts
 M src/render/softDigitalTwinGeometry.ts
 M src/screens/MicroCheckScreen.tsx
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/__tests__/CheckUpRecordingShell.test.ts
 M src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/screens/__tests__/ProgressAndManualRestoration.test.ts
 M src/services/backend/AuthProvider.tsx
 M src/training/__tests__/microCheckSideSetup.test.ts
 M src/training/__tests__/sessionPlayer.test.ts
 M src/training/microCheckSideSetup.ts
 M src/training/sessionPlayer.ts
?? docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
?? docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
?? docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
?? docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
?? docs/audits/HALE_PROGRESS_SCREEN_PRODUCT_RESTORATION.md
?? docs/audits/Hale_HF1_Hands_Free_V2_CheckUp_Implementation_Prompt.md
?? docs/audits/Hale_HF2_Hands_Free_Micro_Check_Implementation_Prompt.md
?? docs/audits/Hale_HF3_Hands_Free_Training_Implementation_Prompt.md
?? docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
?? docs/audits/Hale_Progress_Screen_Product_Restoration_Prompt.md
?? src/render/PrivacyShadowRenderer.tsx
?? src/render/__tests__/privacyShadowGeometry.test.ts
?? src/render/privacyShadowGeometry.ts
?? src/screens/__tests__/progressProductPresentation.test.ts
?? src/screens/progressProductPresentation.ts
```

### Final `git diff --name-only`

```text
.gitignore
App.tsx
src/checkup/measurementContext.ts
src/checkup/protocolSetup.ts
src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
src/diagnostics/poseRendererReplay.ts
src/haleFlow/__tests__/appLifecycle.test.ts
src/haleFlow/__tests__/copyGuardrails.test.ts
src/haleFlow/__tests__/movementProfileV2ProgressViewModel.test.ts
src/haleFlow/__tests__/planViewModel.test.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/movementProfileV2ProgressViewModel.ts
src/haleFlow/planViewModel.ts
src/movementProfileV2/__tests__/liveCoordinator.test.ts
src/movementProfileV2/liveCoordinator.ts
src/movementProfileV2/voiceRuntime.ts
src/reference/movementProfileV2/snapshot.ts
src/render/PoseAvatarRenderer.tsx
src/render/__tests__/poseAvatarConfig.test.ts
src/render/__tests__/softDigitalTwinGeometry.test.ts
src/render/poseAvatarTypes.ts
src/render/softDigitalTwinGeometry.ts
src/screens/MicroCheckScreen.tsx
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
src/screens/PlanScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/__tests__/CheckUpRecordingShell.test.ts
src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
src/screens/__tests__/ProgressAndManualRestoration.test.ts
src/services/backend/AuthProvider.tsx
src/training/__tests__/microCheckSideSetup.test.ts
src/training/__tests__/sessionPlayer.test.ts
src/training/microCheckSideSetup.ts
src/training/sessionPlayer.ts
```

### Final `git diff --stat`

```text
 .gitignore                                         |   1 +
 App.tsx                                            | 119 ++++---
 src/checkup/measurementContext.ts                  |   8 +
 src/checkup/protocolSetup.ts                       |   8 +-
 .../__tests__/poseLatencyDiagnostics.test.ts       |   7 +
 src/diagnostics/poseRendererReplay.ts              |  25 ++
 src/haleFlow/__tests__/appLifecycle.test.ts        |  31 ++
 src/haleFlow/__tests__/copyGuardrails.test.ts      |   1 +
 .../movementProfileV2ProgressViewModel.test.ts     |  42 +--
 src/haleFlow/__tests__/planViewModel.test.ts       |   4 +
 src/haleFlow/appLifecycle.ts                       |  15 +
 src/haleFlow/movementProfileV2ProgressViewModel.ts | 131 +-------
 src/haleFlow/planViewModel.ts                      |  10 +-
 .../__tests__/liveCoordinator.test.ts              | 159 +++++++++-
 src/movementProfileV2/liveCoordinator.ts           | 314 ++++++++++++++++++-
 src/movementProfileV2/voiceRuntime.ts              |  11 +-
 src/reference/movementProfileV2/snapshot.ts        |   7 +-
 src/render/PoseAvatarRenderer.tsx                  |   3 +
 src/render/__tests__/poseAvatarConfig.test.ts      |   5 +
 .../__tests__/softDigitalTwinGeometry.test.ts      |  39 +++
 src/render/poseAvatarTypes.ts                      |   1 +
 src/render/softDigitalTwinGeometry.ts              | 218 ++++++++++---
 src/screens/MicroCheckScreen.tsx                   | 136 +++++++-
 .../MovementProfileV2ReferenceDetailsScreen.tsx    |  16 +-
 .../MovementProfileV2UnifiedCheckUpScreen.tsx      |  32 +-
 src/screens/PlanScreen.tsx                         |  32 +-
 src/screens/PoseOverlayBenchmarkScreen.tsx         |  27 ++
 src/screens/ProgressScreen.tsx                     | 342 +++++++++++++++------
 src/screens/TodayScreen.tsx                        |  26 +-
 src/screens/TrainingSessionScreen.tsx              |  17 +-
 .../__tests__/CheckUpRecordingShell.test.ts        |   2 +
 .../__tests__/MicroCheckScreen.sideSetup.test.ts   |  14 +-
 ...eOverlayBenchmarkScreen.constellationV2.test.ts |  20 ++
 .../__tests__/ProgressAndManualRestoration.test.ts |  18 ++
 src/services/backend/AuthProvider.tsx              |   6 +-
 src/training/__tests__/microCheckSideSetup.test.ts | 224 ++++++++++++++
 src/training/__tests__/sessionPlayer.test.ts       | 125 ++++----
 src/training/microCheckSideSetup.ts                | 272 +++++++++++++++-
 src/training/sessionPlayer.ts                      | 245 +++++++++++++--
 39 files changed, 2214 insertions(+), 499 deletions(-)
```

### Final `git ls-files --others --exclude-standard`

```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/HALE_PROGRESS_SCREEN_PRODUCT_RESTORATION.md
docs/audits/Hale_HF1_Hands_Free_V2_CheckUp_Implementation_Prompt.md
docs/audits/Hale_HF2_Hands_Free_Micro_Check_Implementation_Prompt.md
docs/audits/Hale_HF3_Hands_Free_Training_Implementation_Prompt.md
docs/audits/Hale_Hands_Free_Flow_Audit_Prompt.md
docs/audits/Hale_Progress_Screen_Product_Restoration_Prompt.md
src/render/PrivacyShadowRenderer.tsx
src/render/__tests__/privacyShadowGeometry.test.ts
src/render/privacyShadowGeometry.ts
src/screens/__tests__/progressProductPresentation.test.ts
src/screens/progressProductPresentation.ts
```

## 25. No-change confirmations

Confirmed:

- No package install occurred.
- No lockfile change occurred.
- No audio regeneration occurred.
- No audio asset, manifest, or cue change occurred.
- No staging occurred.
- No commit occurred.
- No branch was created or changed.
- No push occurred.
- No PR was opened.
- No Warden work occurred.
- No H5 routing rollback occurred.
- No public V1 route reintroduction occurred.
- No official Movement Profile containment change occurred.
- No training credit/progression change occurred.
- No scheduled micro-check policy change occurred.
- No HF1/HF2/HF3 regression was introduced in focused validation.
- No physical-device validation claim is made.
- No prior audit reports were edited.
- `docs/decisions.md` was not edited.
- No package manager lockfiles were edited.
- No `.env` values or provider credentials were inspected or exposed.
- No fonts or assets were modified.

## Final Verdict

PROGRESS SCREEN PRODUCT RESTORATION COMPLETE

V2 PROGRESS AUTHORITY PRESERVED
PROGRESS EMPTY STATE PRESERVED
LATEST MOVEMENT PROFILE COPY SIMPLIFIED
NEXT CHECK-UP CARD RESTORED
CURRENT 4-WEEK PLAN SUMMARY RESTORED
WHAT YOU ARE PRACTICING NOW RESTORED
EXTRA CHECK-UP ACTION RESTORED
MOVEMENT PROFILE HISTORY HIDDEN UNTIL MULTIPLE OFFICIAL PROFILES
TECHNICAL REFERENCE LABELS REMOVED FROM PROGRESS SUMMARY
NO H5 ROUTING ROLLBACK
NO V1 PUBLIC ROUTE REINTRODUCTION
NO OFFICIAL PROFILE CONTAINMENT CHANGE
NO TRAINING CREDIT / PROGRESSION CHANGE
NO SCHEDULED MICRO-CHECK POLICY CHANGE
NO AUDIO REGENERATION
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
