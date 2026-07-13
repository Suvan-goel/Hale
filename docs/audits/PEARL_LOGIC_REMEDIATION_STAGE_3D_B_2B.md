# Pearl Logic Remediation - Stage 3D-B.2B Reference Engine

Date: 2026-06-23

## 1. Scope

Implemented Stage 3D-B.2B only: a pure Movement Profile V2 reference interpretation engine for `chair-rise-30s-v2`, `one-leg-balance-45s-v2`, and `active-shoulder-reach-v2`.

Out of scope and not implemented: UI, profile persistence, backend migration, score snapshots, block/report output, suggested focus, public V2 routing, Warden workbook formulas, Warden LMS arrays, and any production chair percentile transform.

## 2. Product decisions implemented

- V2 raw metrics remain primary.
- V1 Movement Age scoring remains isolated.
- Chair reference output is raw-only in production until a separately approved Warden transform is injected.
- Balance receives a Pearl task band and an optional source age-group benchmark mean only.
- Shoulder receives a neutral Gill IQR category only.
- Missing profile data, outside-source ages, incomplete protocols, tracking uncertainty, setup uncertainty, pain limitation, and invalid raw values fail closed.

## 3. Initial Git status

Initial `git status --short` recorded at Stage 3D-B.2B start:

```text
 M src/checkup/checkup.ts
 M src/checkup/index.ts
 M src/checkup/types.ts
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseLatencyDiagnostics.ts
 M src/pearlFlow/__tests__/assessmentEligibility.test.ts
 M src/pearlFlow/assessmentEligibility.ts
 M src/history/serialize.ts
 M src/movements/__tests__/registry.test.ts
 M src/movements/index.ts
 M src/scoring/__tests__/scoreSnapshot.test.ts
 M src/scoring/__tests__/scoringInputValidation.test.ts
 M src/scoring/scoreSnapshot.ts
 M src/scoring/scoringInputValidation.ts
 M src/screens/SettingsScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/checkupSyncService.ts
?? app.config.js
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
?? docs/audits/Pearl_Stage_3D_B_2A_Assessment_Protocol_State_Machine_Implementation_Prompt.md
?? docs/audits/Pearl_Stage_3D_B_2B_Reference_Engine_Implementation_Prompt.md
?? src/checkup/__tests__/protocolPolicy.test.ts
?? src/checkup/movementProfileV2.ts
?? src/checkup/protocolEvidence.ts
?? src/checkup/protocolPolicy.ts
?? src/checkup/protocolSetup.ts
?? src/movements/__tests__/movementProfileV2Protocols.test.ts
?? src/movements/activeShoulderReachV2.ts
?? src/movements/chairRiseV2.ts
?? src/movements/oneLegBalanceV2.ts
?? src/movements/protocolOnlyGrader.ts
```

Initial `git diff --stat` recorded at Stage 3D-B.2B start:

```text
 src/checkup/checkup.ts                             | 22 ++++++
 src/checkup/index.ts                               | 48 ++++++++++++
 src/checkup/types.ts                               |  6 ++
 .../__tests__/poseLatencyDiagnostics.test.ts       | 88 ++++++++++++++++++++--
 src/diagnostics/poseLatencyDiagnostics.ts          | 70 ++++++++++++++++-
 .../__tests__/assessmentEligibility.test.ts        | 28 +++++++
 src/pearlFlow/assessmentEligibility.ts              | 11 +++
 src/history/serialize.ts                           |  3 +-
 src/movements/__tests__/registry.test.ts           | 25 +++++-
 src/movements/index.ts                             | 32 ++++++++
 src/scoring/__tests__/scoreSnapshot.test.ts        | 14 ++++
 .../__tests__/scoringInputValidation.test.ts       | 32 ++++++++
 src/scoring/scoreSnapshot.ts                       | 16 ++--
 src/scoring/scoringInputValidation.ts              | 10 +++
 src/screens/SettingsScreen.tsx                     | 26 +++++++
 .../backend/__tests__/checkupSyncService.test.ts   | 36 ++++++++-
 src/services/backend/checkupSyncService.ts         | 15 +++-
 17 files changed, 462 insertions(+), 20 deletions(-)
```

## 4. Current V2 raw input contract

The pure engine accepts:

- a `CheckUp` record whose `protocolPolicy.id` is `movement_profile_v2`;
- explicit frozen `MovementProfileV2ReferenceProfile`;
- optional explicit dependency injection for a future approved chair percentile transform.

It reads V2 raw result fields only:

- chair: repetitions, practice completion, setup confirmation, push-off flag, tracking interruptions, protocol evidence;
- balance: best valid hold seconds, selected standing leg, changed-leg metadata, protocol evidence;
- shoulder: peak flexion degrees, selected side, changed-side metadata, pain-limited flag, protocol evidence.

It does not read live profile state, current date, backend state, UI state, or environment variables.

## 5. Reference engine architecture

New pure domain:

- `src/reference/movementProfileV2/types.ts`
- `src/reference/movementProfileV2/fingerprint.ts`
- `src/reference/movementProfileV2/sources.ts`
- `src/reference/movementProfileV2/transformations.ts`
- `src/reference/movementProfileV2/referenceProfile.ts`
- `src/reference/movementProfileV2/chair.ts`
- `src/reference/movementProfileV2/balance.ts`
- `src/reference/movementProfileV2/shoulder.ts`
- `src/reference/movementProfileV2/engine.ts`
- `src/reference/movementProfileV2/index.ts`

Primary entry point: `interpretMovementProfileV2(input, dependencies?)`.

Default production dependencies contain no chair transform provider.

## 6. Reference-profile input types

Implemented age basis:

- `exact_age_at_test`
- `birth_year_month_derived`
- `age_group_only`
- `legacy_age_band_representative`
- `unknown`

Implemented reference sex:

- `female`
- `male`
- `prefer_not_to_say`
- `unknown`

Normalization is pure, deterministic, non-mutating, and does not calculate age from the clock.

## 7. Result-kind and eligibility types

Implemented result kinds:

- `raw_only`
- `percentile_range`
- `pearl_task_band`
- `published_age_group_benchmark`
- `published_iqr_category`

Implemented claim eligibility:

- `reference_eligible`
- `raw_only_setup_uncertain`
- `raw_only_protocol_incomplete`
- `raw_only_tracking_uncertain`
- `raw_only_reference_unavailable`
- `raw_only_profile_incomplete`
- `raw_only_pain_limited`
- `raw_only_outside_reference_age`
- `raw_only_source_transform_unapproved`
- `invalid_measurement`

Protocol evidence remains separate on each domain output.

## 8. Source registry

Source registry IDs:

- `warden_2022_30s_sts`
- `springer_2007_unipedal_eyes_open`
- `gill_2020_active_shoulder_flexion`

Primary sources verified:

- Warden 2022 metadata: Crossref/OUP DOI metadata, DOI `10.1093/ptj/pzab299`.
- Springer 2007 balance table: primary PDF, Table 1, total eyes-open best-of-three means.
- Gill 2020 shoulder table: BMC/Springer PDF, Table 1, active shoulder flexion IQR by five-year age group, sex, and side.

No source PDF, source workbook, source image, hidden table, formula, or copied copyrighted table image was committed.

## 9. Transformation registry

Transformations:

- `chair_percentile_range_v1_pending_transform`: disabled, reason `source_transform_unapproved`.
- `balance_task_band_v1`: enabled, Pearl-created product interpretation.
- `balance_age_group_benchmark_v1`: enabled, source-direct benchmark.
- `shoulder_iqr_category_v1`: enabled, source-direct IQR category.

No environment variable, backend value, profile field, or `__DEV__` path can enable the chair transform.

## 10. Source/fingerprint integrity

Runtime-compatible deterministic fingerprints use canonical JSON plus FNV-1a style hashing, avoiding Node crypto.

Current fingerprints:

```text
sourceSetFingerprint: mpv2-source-set-v1-0r09281
warden_2022_30s_sts data: warden-source-data-v1-0o181v1 source: reference-source-v1-1moqmdp
springer_2007_unipedal_eyes_open data: balance-source-data-v1-1lqzpe2 source: reference-source-v1-0eczf83
gill_2020_active_shoulder_flexion data: shoulder-source-data-v1-1pdtwhw source: reference-source-v1-0zrdkls
chair_percentile_range_v1_pending_transform: reference-transform-v1-1ndp3xi enabled=false
balance_task_band_v1: reference-transform-v1-14x2s48 enabled=true
balance_age_group_benchmark_v1: reference-transform-v1-15iz9p8 enabled=true
shoulder_iqr_category_v1: reference-transform-v1-1qjftcc enabled=true
```

Tests verify deterministic recomputation and that corrupted source identity fails reference claims closed.

## 11. Chair source status

Warden 2022 is registered as metadata and intended transform source only. The production code records:

- adult source age range: 18 to 80;
- 30-second STS repetitions outcome;
- sex-specific centile calculator status;
- transform data not embedded;
- centile calculator not embedded.

No Warden formulas, LMS parameters, workbook cells, hidden sheets, or calculator logic are present.

## 12. Chair transform containment

Default production output for an otherwise eligible chair result is:

```text
raw_only_source_transform_unapproved
```

Output still retains:

- raw repetitions;
- source metadata/fingerprint;
- intended transformation metadata/fingerprint;
- disabled transform reason;
- protocol evidence.

## 13. Chair percentile-range architecture

Implemented future-facing interface `ApprovedChairPercentileTransform` with required:

- source ID and fingerprint;
- transformation ID and fingerprint;
- approval ID;
- deterministic `percentileFor` function.

Provider validation fails closed for missing provider, disabled transform, wrong source, wrong source fingerprint, wrong transformation, wrong transformation fingerprint, wrong approval, NaN, infinity, or out-of-range percentiles.

Range structuring:

- queries reps - 1, reps, reps + 1;
- clamps repetition inputs at 0;
- keeps min/max valid percentiles;
- rounds low down and high up to nearest 10;
- enforces minimum width 20;
- clamps 0 to 100;
- emits only `{ kind: 'below_10' }`, `{ kind: 'above_90' }`, or `{ kind: 'range', low, high }`;
- never exposes an exact percentile.

## 14. Balance task-band behavior

Implemented exact Pearl task bands:

```text
45.0 seconds -> ceiling_complete
20.0 <= seconds < 45.0 -> building
5.0 <= seconds < 20.0 -> starting_point
0.0 <= seconds < 5.0 -> starting_point_low
```

Negative, non-finite, and values above 45 seconds are invalid. The task band is product-created, not normative, and does not require age or reference sex.

## 15. Balance source table and benchmark behavior

Springer 2007 Table 1 values encoded: total rows only, eyes-open best of three trials, mean seconds only, 45 second ceiling.

```text
springer_18_39: 44.7
springer_40_49: 41.9
springer_50_59: 41.2
springer_60_69: 32.1
springer_70_79: 21.5
springer_80_99: 9.4
```

No sex-specific rows, eyes-closed rows, mean-of-three rows, dispersion fields, inferred SDs, percentiles, z scores, normative ranges, or below/above labels are encoded.

## 16. Shoulder source table

Gill 2020 Table 1 active shoulder flexion IQR rows encoded: 56 rows total.

Compact row values are listed as left Q1/median/Q3 and right Q1/median/Q3:

```text
20-24 male: left 160/174/178, right 170/179/180
20-24 female: left 160/169/174, right 160/165.8/174
25-29 male: left 158/162/175, right 160/164/174
25-29 female: left 152/166/180, right 155/170/180
30-34 male: left 160/170/176, right 160/170/177
30-34 female: left 156/162/172, right 156/166.3/173
35-39 male: left 160/166/176, right 160/168/176
35-39 female: left 158/168/180, right 158/168/180
40-44 male: left 152/160/170, right 156/166/174
40-44 female: left 150/160/170, right 156/164/176
45-49 male: left 155/162/174, right 160/168/176
45-49 female: left 150/160/166, right 150/160/170
50-54 male: left 154/167.1/178, right 160/170/176
50-54 female: left 150/160/168, right 150/160/170
55-59 male: left 149/160/170, right 150/160/171
55-59 female: left 144/154/168, right 149/160/170
60-64 male: left 144/159.5/169, right 150/160/170
60-64 female: left 134/150/160, right 140/150/163
65-69 male: left 140/151.8/162, right 144/156.1/162
65-69 female: left 143/153.9/160, right 144/152/162
70-74 male: left 130/150/160, right 130/147.5/161
70-74 female: left 136/150/160, right 131/150.8/162
75-79 male: left 133/142/158, right 130/145.1/160
75-79 female: left 130/141.8/153, right 136/145/152
80-84 male: left 123/140/151, right 125/142.4/156
80-84 female: left 119/132/149, right 120/140/150
85-plus male: left 112/136.1/150, right 111/123.7/151
85-plus female: left 100/138/154, right 80/130/160
```

No pooling, interpolation, percentile inference, full observed range category, or higher-is-better flag is encoded.

## 17. Shoulder IQR behavior

Classification:

- measured < Q1 -> `below_published_middle_range`
- Q1 <= measured <= Q3 -> `within_published_middle_range`
- measured > Q3 -> `above_published_middle_range`

Above-range is neutral structured data. Q1/Q3 equality is within.

## 18. Claim-eligibility composition

Composition order is fail-closed:

1. invalid raw measurement;
2. protocol evidence not reference complete;
3. pain-limited;
4. tracking/setup/protocol uncertainty;
5. missing profile input;
6. outside source age;
7. source/transform unavailable;
8. reference eligible.

Claim eligibility can only become stricter than protocol evidence; it never upgrades a raw-only or invalid protocol result.

## 19. Full engine behavior

Engine output includes:

- engine schema/version;
- protocol support status;
- source-set ID/fingerprint;
- raw completeness;
- chair interpretation;
- balance interpretation;
- shoulder interpretation;
- deterministic diagnostics.

Engine output excludes:

- score;
- movement age;
- weakest domain;
- suggested focus;
- snapshot;
- block;
- backend row;
- UI copy.

## 20. Fail-local behavior

Verified cases:

- missing chair/shoulder reference sex leaves balance benchmark eligible;
- invalid balance seconds does not erase chair raw or shoulder raw;
- pain-limited shoulder remains raw-only while chair raw remains present;
- corrupted source identity removes source claims while retaining raw metrics;
- missing chair transform leaves chair raw-only without affecting balance/shoulder.

## 21. JSON/payload safety

Outputs are composed from JSON-safe primitives, arrays, and plain objects. Invalid numeric raw values are omitted from raw metrics rather than serialized as NaN or infinity. The engine has no side effects, runtime network, hidden clock, global mutable transform registration, or environment reads.

## 22. V1/UI/snapshot/focus containment

Grep-style tests verify the V2 reference modules do not import or call:

- V1 norms;
- `inferAge`;
- `scoreCheckUp`;
- focus selection;
- movement blocks;
- score snapshots.

Public/default Check-Up remains the V1 battery. `CheckUpScreen`, `OnboardingResultsScreen`, and `ProgressScreen` do not call `interpretMovementProfileV2`.

## 23. Files changed

Stage 3D-B.2B production files added:

- `src/reference/movementProfileV2/types.ts`
- `src/reference/movementProfileV2/fingerprint.ts`
- `src/reference/movementProfileV2/balance.ts`
- `src/reference/movementProfileV2/shoulder.ts`
- `src/reference/movementProfileV2/sources.ts`
- `src/reference/movementProfileV2/transformations.ts`
- `src/reference/movementProfileV2/referenceProfile.ts`
- `src/reference/movementProfileV2/chair.ts`
- `src/reference/movementProfileV2/engine.ts`
- `src/reference/movementProfileV2/index.ts`

Stage 3D-B.2B tests added:

- `src/reference/movementProfileV2/__tests__/referenceEngine.test.ts`

## 24. Tests added/changed

Added 26 focused tests covering:

- engine raw-first outputs;
- mixed eligibility;
- age-group-only profile handling;
- legacy representative age rejection;
- invalid raw metric fail-local behavior;
- changed side/leg longitudinal comparability;
- unsupported V1 record handling;
- balance band boundaries;
- exact Springer values;
- Gill row count and representative exact rows;
- chair percentile structuring;
- chair provider identity/approval gating;
- source-set fingerprinting;
- corrupted source fail-closed behavior;
- V1/UI/snapshot/focus containment.

## 25. Exact source values/row counts used

- Balance: 6 rows, values listed in section 15.
- Shoulder: 56 rows, values listed in section 16.
- Chair: 0 production numeric transform rows; Warden metadata and age range only.

## 26. Exact targeted validation

Command:

```text
npm test -- --runInBand src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/movements/__tests__/registry.test.ts
```

Result:

```text
Test Suites: 8 passed, 8 total
Tests: 103 passed, 103 total
Snapshots: 0 total
```

Observed warning: Watchman recrawl warning and Jest post-run open-handle notice after successful exit.

## 27. Exact full validation

Command:

```text
npm test -- --runInBand
```

Result:

```text
Test Suites: 110 passed, 110 total
Tests: 934 passed, 934 total
Snapshots: 0 total
```

Observed warnings/logs: Watchman recrawl warning, backend test console logs/warns from existing sync tests, and Jest post-run open-handle notice after successful exit.

Diff whitespace command:

```text
git diff --check
```

Result: passed before report finalization and again after the report final-status update.

## 28. Audio verification

Command:

```text
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

## 29. App/website typechecks

App command:

```text
npm run typecheck
```

Result: passed.

Website command:

```text
npm --prefix website run typecheck
```

Result: passed.

## 30. Expo config/export

Config command:

```text
npx --no-install expo config --type public
```

Result: passed.

Observed warning: Sentry Expo plugin reports missing organization/project config and fallback to environment variables. The command printed environment variable names but no secret values were inspected.

Export command:

```text
rm -rf /tmp/pearl-stage3db2b-export && npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2b-export
```

Result: passed; Android and iOS bundles exported to `/tmp/pearl-stage3db2b-export`.

Cleanup:

```text
rm -rf /tmp/pearl-stage3db2b-export
```

Result: `/tmp/pearl-stage3db2b-export` removed.

Observed warnings: same Sentry config fallback warning and Node `NO_COLOR` ignored due to `FORCE_COLOR`.

## 31. Stage 2A.1/3/4/5 regression verification

Full Jest includes the Stage 2A.1 camera readiness/countdown/interruption coverage, Stage 3 scoring/history/focus containment coverage, Stage 4 training/progression coverage, and Stage 5 lifecycle/progression automation coverage. All passed in the full 110-suite run.

Audio verification remained at 44 cues / 88 assets.

## 32. Chair transform approval dependency

A production chair percentile requires a future explicit approved provider and enabled transformation registry entry with matching:

- source ID;
- source fingerprint;
- transformation ID;
- transformation fingerprint;
- approval ID.

Until then, production chair reference claims remain raw-only.

## 33. Remaining Stage 3D-B work

Remaining work is Stage 3D-B.2C and later integration decisions: decide how/when V2 interpretation output is surfaced, persisted, snapshotted, or used for any future product copy without violating raw-first and no-focus constraints. Physical device validation remains required before beta readiness.

## 34. Whether Stage 3D-B.2C is unblocked

Stage 3D-B.2C is unblocked from the reference-engine side because:

- V2 interpretation output is complete and JSON-safe;
- source/transformation identity is stable;
- raw-only chair behavior is explicit;
- balance and shoulder source outputs are deterministic;
- V1 containment remains green.

## 35. Initial and final Git status

Initial status is recorded in section 3.

Final `git status --short --untracked-files=all` after report creation and temporary-source cleanup:

```text
 M src/checkup/checkup.ts
 M src/checkup/index.ts
 M src/checkup/types.ts
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseLatencyDiagnostics.ts
 M src/pearlFlow/__tests__/assessmentEligibility.test.ts
 M src/pearlFlow/assessmentEligibility.ts
 M src/history/serialize.ts
 M src/movements/__tests__/registry.test.ts
 M src/movements/index.ts
 M src/navigation/TabBar.tsx
 M src/render/PoseAvatarRenderer.tsx
 M src/render/SkeletonView.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/poseAvatarConfig.ts
 M src/render/poseAvatarTypes.ts
 M src/scoring/__tests__/scoreSnapshot.test.ts
 M src/scoring/__tests__/scoringInputValidation.test.ts
 M src/scoring/scoreSnapshot.ts
 M src/scoring/scoringInputValidation.ts
 M src/screens/SettingsScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/checkupSyncService.ts
 M src/theme/responsive.ts
?? app.config.js
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
?? docs/audits/Pearl_Stage_3D_B_2A_Assessment_Protocol_State_Machine_Implementation_Prompt.md
?? docs/audits/Pearl_Stage_3D_B_2B_Reference_Engine_Implementation_Prompt.md
?? src/checkup/__tests__/protocolPolicy.test.ts
?? src/checkup/movementProfileV2.ts
?? src/checkup/protocolEvidence.ts
?? src/checkup/protocolPolicy.ts
?? src/checkup/protocolSetup.ts
?? src/movements/__tests__/movementProfileV2Protocols.test.ts
?? src/movements/activeShoulderReachV2.ts
?? src/movements/chairRiseV2.ts
?? src/movements/oneLegBalanceV2.ts
?? src/movements/protocolOnlyGrader.ts
?? src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
?? src/reference/movementProfileV2/balance.ts
?? src/reference/movementProfileV2/chair.ts
?? src/reference/movementProfileV2/engine.ts
?? src/reference/movementProfileV2/fingerprint.ts
?? src/reference/movementProfileV2/index.ts
?? src/reference/movementProfileV2/referenceProfile.ts
?? src/reference/movementProfileV2/shoulder.ts
?? src/reference/movementProfileV2/sources.ts
?? src/reference/movementProfileV2/transformations.ts
?? src/reference/movementProfileV2/types.ts
?? src/render/MediaPipeSkeletonRenderer.tsx
```

## 36. Complete files-changed inventory

Stage 3D-B.2B files:

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md`
- `src/reference/movementProfileV2/__tests__/referenceEngine.test.ts`
- `src/reference/movementProfileV2/balance.ts`
- `src/reference/movementProfileV2/chair.ts`
- `src/reference/movementProfileV2/engine.ts`
- `src/reference/movementProfileV2/fingerprint.ts`
- `src/reference/movementProfileV2/index.ts`
- `src/reference/movementProfileV2/referenceProfile.ts`
- `src/reference/movementProfileV2/shoulder.ts`
- `src/reference/movementProfileV2/sources.ts`
- `src/reference/movementProfileV2/transformations.ts`
- `src/reference/movementProfileV2/types.ts`

Pre-existing Stage 3D-B.2A files remain in the worktree and are not restated here as Stage 3D-B.2B changes.

## 37. Concurrent external changes

Additional worktree changes observed during final status gathering but not edited as part of Stage 3D-B.2B:

- `src/navigation/TabBar.tsx`
- `src/render/PoseAvatarRenderer.tsx`
- `src/render/SkeletonView.tsx`
- `src/render/__tests__/poseAvatarConfig.test.ts`
- `src/render/poseAvatarConfig.ts`
- `src/render/poseAvatarTypes.ts`
- `src/theme/responsive.ts`
- `src/render/MediaPipeSkeletonRenderer.tsx`

They were left untouched.

## 38. Temporary-source cleanup

Temporary source files were stored under `/tmp/pearl-stage3db2b/` during verification. This directory was removed before final response.

Temporary Expo export was stored under `/tmp/pearl-stage3db2b-export` and was removed after export validation.

## 39. No package/install/git/source artifact actions

Confirmed:

- no package install;
- no lockfile change;
- no source PDF commit;
- no Warden workbook commit;
- no staging;
- no commit;
- no branch creation;
- no push.

## Required invariant outcomes

- One pure V2 reference engine exists.
- V1 input is rejected.
- V2 raw metrics remain primary.
- No Movement Age output exists.
- No weakest/suggested focus output exists.
- No score snapshot is created.
- Claim eligibility never upgrades protocol evidence.
- Missing profile data yields raw-only.
- Outside-source age yields raw-only.
- Chair transform is disabled by default.
- No Warden formulas/parameters are embedded.
- No chair percentile appears without an explicit approved provider.
- Wrong chair provider identity fails closed.
- Chair output never exposes an exact percentile.
- Balance task bands use exact approved thresholds.
- Balance values above 45 fail closed.
- Balance benchmark uses exact primary-source age-group means.
- Balance benchmark is not called a percentile or range.
- Balance benchmark does not require reference sex.
- Shoulder lookup uses exact Gill age/sex/side IQR.
- Shoulder Q1/Q3 equality is within.
- Shoulder above-range is neutral.
- Shoulder missing sex yields raw-only.
- Pain-limited shoulder yields raw-only.
- Changed leg/side is marked longitudinally non-comparable.
- Per-domain failure is local.
- Source registry/fingerprints are deterministic.
- Output is JSON-safe.
- No runtime network is used.
- Public/default Check-Up remains V1.
- V2 remains rejected by V1 scoring/block/report paths.
- No profile/UI/backend fields are added.
- Stage 4/5 contracts remain.
- Safety audio remains 44 cues / 88 assets.
- App/website typechecks pass.
- Expo config/export pass.
- No unrelated product logic changes were made by this stage.

## Stage decisions

STAGE 3D-B.2B COMPLETE

V2 REFERENCE ENGINE IMPLEMENTED

BALANCE TASK BAND AND BENCHMARK IMPLEMENTED

SHOULDER IQR REFERENCE IMPLEMENTED

CHAIR PERCENTILE-RANGE ARCHITECTURE READY, TRANSFORM DISABLED

STAGE 3D-B.2C UNBLOCKED

CHAIR WARDEN TRANSFORM NOT EMBEDDED

CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION

MOVEMENT PROFILE V2 NOT USER-ENABLED

NO SUGGESTED-FOCUS IMPLEMENTATION

NO V2 SNAPSHOT OR BACKEND MIGRATION

STAGE 4 REMEDIATION COMPLETE

STAGE 5 REMEDIATION COMPLETE

OVERALL BETA RELEASE STILL BLOCKED

PHYSICAL DEVICE VALIDATION REQUIRED
