You are implementing Pearl’s approved Warden chair-stand percentile integration:

PEARL WARDEN CHAIR-STAND FULL INTEGRATION
AUTHOR-PERMISSION SOURCE INGESTION,
EXACT AGE + REFERENCE SEX ONBOARDING,
WARDEN 30-SECOND CHAIR-STAND PERCENTILE-RANGE TRANSFORM,
STRENGTH / POWER FOCUS INTEGRATION,
4-WEEK PLAN CREATION INFLUENCE,
AND CONSUMER-SAFE RESULT / PROGRESS / REPORT SURFACING

This is a full implementation stage.

The product owner has confirmed that Pearl has written permission from the Warden study authors to use the relevant percentile data / calculator / formula in the app.

## Executive product decision

Implement Warden fully in Pearl:

1. Replace the old onboarding age-range input with mandatory exact age input.
2. Add mandatory reference sex input in onboarding.
3. Freeze exact age-at-test and reference sex into every official Movement Profile V2 Check-Up.
4. Implement the approved Warden 30-second chair-stand percentile transform using the source-faithful permitted data/formula.
5. Surface chair percentile ranges in a consumer-safe way.
6. Allow Warden-backed chair evidence to influence V2 Strength / Power suggested focus.
7. Allow that updated focus to influence automatic 4-week plan creation.
8. Preserve all H5/HF public routing, hands-free, Progress, micro-check, training, report, and release-hardening guarantees.

Do not implement a “similar but different” formula. Now that permission exists, use the source-faithful approved transform and version/fingerprint it.

## Current product baseline to preserve

Read and preserve the latest state:

```text
docs/audits/PEARL_PROGRESS_SCREEN_PRODUCT_RESTORATION.md
docs/audits/PEARL_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
docs/audits/PEARL_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
docs/audits/PEARL_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md
docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
```

Current truths to preserve:

```text
Normal public Check-Up is unified Movement Profile V2.
Public V1 Movement Age flow is retired from normal builds.
V1 is retained only for explicit rollback builds.
Accepted V2 state never falls back to V1.
H5A V2 Progress is canonical.
Progress restoration is preserved.
H5B/H5B.1 micro-check policy is preserved.
HF1 V2 Check-Up hands-free behavior is preserved.
HF2 micro-check hands-free behavior is preserved.
HF3 training floor setup hands-free behavior is preserved.
H4 official retest/report/next-block lifecycle is preserved.
Training credit/progression policy is preserved.
Audio asset fingerprint gate passed.
Physical-device validation is not claimed.
Public release remains blocked.
```

Current Warden state before this task:

```text
Warden source is registered as metadata.
Production Warden transform is disabled.
Chair output is raw-only.
Chair cannot drive production reference focus.
Chair cannot drive Strength / Power plan focus from source-backed percentiles.
```

This task changes that Warden state only.

## Permission / source truth

The product owner states Pearl has all required written permission.

Do not commit private email threads, signatures, phone numbers, private addresses, or full correspondence.

Create a short redacted permission summary, recommended:

```text
docs/sources/PEARL_WARDEN_PERMISSION_SUMMARY.md
```

or, if `docs/sources` does not exist, create it.

The summary should include only non-private facts:

```text
Permission received from Warden study authors.
Date received: <fill if available from supplied evidence, otherwise "product-owner confirmed before implementation">
Scope: use of approved 30-second chair-stand percentile data/calculator/formula in Pearl app.
Private permission evidence stored outside repository.
```

If exact permission date/scope evidence is present in a local file, summarize it. Do not copy private correspondence verbatim.

## Source data / formula availability gate

Before implementing the transform, locate the approved Warden transform material.

Search likely paths:

```text
docs/sources/**
docs/reference/**
docs/audits/**
src/reference/movementProfileV2/**
/tmp/**
```

Look for:

```text
Warden
30s STS
30-second sit-to-stand
chair stand
centile
centile calculator
percentile
LMS
formula
workbook
calculator
pzab299
```

If the approved source data/formula/calculator is not available in the repo or supplied local files:

1. Do not invent a formula.
2. Do not approximate from memory.
3. Do not scrape or download unauthorized data.
4. Create a blocked report explaining exactly what source file/data is missing.
5. Stop before marking implementation complete.

If the material is available, implement only the minimum necessary data/formula in source code. Do not commit the source PDF/workbook itself unless it is already in the repo and explicitly intended for source control.

## Non-negotiable product guardrails

Do not add:

```text
Movement Age
body age
strength age
younger/older
improved/declined
better/worse
fall-risk
diagnosis
sarcopenia diagnosis
pass/fail
medical risk
exact headline percentile
percentile-change claim
Warden internal formula labels
technical schema/fingerprint labels in public UI
```

User-facing output should be simple and conservative:

```text
12 rises in 30 seconds
Around the 40th–60th percentile for your age and reference group
```

or:

```text
12 rises in 30 seconds
Within the typical range for your age and reference group
```

Raw result remains first.

No exact percentile as the main public label.

No percentile change across Check-Ups until future repeatability/MDC work exists.

## Reference sex wording

Do not ask “gender” for Warden reference calculation.

Use product copy like:

```text
Which reference group should Pearl use for published movement comparisons?
Female
Male
```

Supporting copy:

```text
Published movement reference data is usually grouped this way. Pearl uses this only to compare your movement results with the right reference data.
```

Internally use:

```ts
referenceSex: 'female' | 'male'
```

Do not store broad identity/gender values in this Warden reference field.

## Exact age wording

Replace age-band onboarding with exact age.

Use product copy like:

```text
How old are you?
Pearl uses your age to compare your check-up results with published movement reference data.
```

Requirements:

- exact integer age required in onboarding before first official Movement Profile;
- no age-band selector in normal onboarding;
- reasonable validation, e.g. 18-100 or repository-consistent adult range;
- Warden percentile eligibility only within the Warden source’s supported age range;
- outside Warden source age range -> raw-only Warden fallback but user can still use Pearl.

## Age-at-test freezing

For every official Movement Profile V2 Check-Up, freeze:

```text
exactAgeAtTest
referenceSex
ageBasis: exact_age_at_test
referenceProfileFingerprint
sourceSetFingerprint
wardenTransformFingerprint
```

The frozen official snapshot must not reinterpret later if the user edits profile details.

If the user changes age/reference sex later, that affects future official Check-Ups only.

## Source eligibility

Warden chair percentile output may be produced only when all pass:

```text
official V2 source type: baseline | baseline_retake | official_retest
valid chair-rise-30s-v2 raw result
valid 30-second chair protocol evidence
valid chair setup/tracking evidence according to existing protocol
exact age at test present
reference sex present
age within Warden source range
approved transform source/fingerprint match
non-future schema/policy versions
JSON-safe finite output
```

Fail closed to raw-only if:

```text
missing age
missing reference sex
outside source age
setup uncertain
tracking uncertain
protocol incomplete
pain-limited where applicable
invalid reps
unknown source/fingerprint
future transform schema
non-finite output
```

Optional full extra Check-Ups remain non-official and must not create official Warden snapshots/assessments/blocks/reports/history.

Optional micro-checks remain non-official and must not use Warden for official profile/focus/plan creation.

## Desired Warden UI policy

Use raw first + simple range.

Recommended public summary labels:

```text
Saved result
Starting point
Building
Within typical range
Above typical range
Around the 10th–25th percentile
Around the 25th–40th percentile
Around the 40th–60th percentile
Around the 60th–75th percentile
Around the 75th–90th percentile
Above the 90th percentile
```

Avoid:

```text
Published comparison
Published age-group
Warden
LMS
centile
raw_only_source_transform_unapproved
reference_eligible
IQR
schema
fingerprint
```

## Warden focus policy

Implement a conservative explicit chair percentile evidence mapping.

Suggested default, unless the existing V2 evidence policy already has a better source-compatible mapping:

```text
< 10th percentile:
  source/reference low evidence may map to below_reference, but public copy must not be clinical.

10th to <25th percentile:
  pearl_starting_point for Strength / Power.

25th to <40th percentile:
  pearl_building for Strength / Power.

40th to <75th percentile:
  within_reference / neutral for Strength / Power.

>=75th percentile:
  above_reference_or_ceiling / neutral for Strength / Power.
```

If using percentile ranges instead of point percentiles:

- use the conservative bound that avoids overstating severity;
- document whether lower, midpoint, or upper bound is used for focus evidence;
- prefer not to classify as below_reference unless the range is clearly low.

This policy must be versioned and fingerprinted.

Expected focus behavior:

```text
Low Warden chair percentile evidence can select Strength / Power as suggested focus.
Neutral/high chair percentile evidence does not force Strength / Power.
Missing/ineligible Warden keeps chair raw-only and cannot drive reference focus.
Existing Balance and Shoulder focus rules remain unchanged.
Balanced remains first-class.
Prior-focus official retest stability remains unchanged.
```

## Plan creation behavior

Automatic V2 block creation already uses the frozen V2 assessment focus.

After this task:

```text
Warden low chair evidence -> Strength / Power assessment focus when it is the clear strongest focus candidate -> Strength / Power 4-week plan.
```

Balanced blocks remain genuine Balanced blocks.

Do not fake `focusDomain` for Balanced.

Do not change Stage 5 session scheduler, training credit, progression, or A/B/C schedule.

## Required code inspection

Inspect at minimum:

```text
src/profile/types.ts
src/profile/index.ts
src/profile/serialize.ts
src/profile/__tests__/*
src/adherence/screens/LifeGoalOnboardingScreen.tsx
src/onboarding/*
src/screens/WelcomeScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/movementProfileV2/referenceDetailsDraft.ts
src/reference/movementProfileV2/referenceProfile.ts
src/reference/movementProfileV2/chair.ts
src/reference/movementProfileV2/sources.ts
src/reference/movementProfileV2/transformations.ts
src/reference/movementProfileV2/engine.ts
src/reference/movementProfileV2/snapshot.ts
src/reference/movementProfileV2/assessment.ts
src/reference/movementProfileV2/persistence.ts
src/results/movementProfileV2ResultsAdapter.ts
src/movementProfileV2/viewModel.ts
src/pearlFlow/movementProfileV2ProgressViewModel.ts
src/screens/ProgressScreen.tsx
src/screens/progressProductPresentation.ts
src/pearlFlow/movementProfileV2Block.ts
src/pearlFlow/movementProfileV2BlockReport.ts
src/services/backend/profileSyncService.ts
src/services/backend/checkupSyncService.ts
src/services/backend/restoreService.ts
src/services/backend/dataExportService.ts
src/services/backend/accountDataService.ts
```

Search broadly for:

```text
ageBand
age band
ageRange
age range
representative age
legacy_age_band_representative
reference sex
referenceSex
sex
gender
UserProfile.age
MovementProfileV2ReferenceProfile
raw_only_source_transform_unapproved
chair_percentile_range_v1_pending_transform
warden_2022_30s_sts
Warden
percentile_range
percentileFor
below_reference
pearl_starting_point
chair remains raw-only
```

Treat current code and untracked production files as source of truth.

# PART A — WORKTREE SAFETY AND BASELINE

## Step 1: Capture exact initial state

Before analysis or edits, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all current tracked/untracked changes as user-owned.
2. Inspect diffs before touching any file.
3. Preserve Progress restoration.
4. Preserve HF1/HF2/HF3.
5. Preserve H5A/H5B/H5C/H5D.
6. Do not revert unrelated changes.
7. Do not edit prior audit reports or `docs/decisions.md`.
8. Do not install packages.
9. Do not modify lockfiles.
10. Do not regenerate audio.
11. Do not stage, commit, branch, push, or open a PR.
12. Do not inspect or expose `.env` values/provider credentials.
13. Do not modify fonts/assets.
14. Do not commit private permission correspondence.
15. If source data/formula is missing, stop and mark Warden integration blocked.

## Step 2: Baseline validation

Before edits, run:

```bash
npm run typecheck
npm run verify:audio
```

Run focused baseline tests for:

- reference profile
- Warden/chair reference engine
- snapshot
- assessment/focus policy
- V2 artifact materialization
- V2 block materialization
- onboarding
- profile serialization/sync/restore/export
- results/progress/report presentation
- H5A/H5B/H5C/H5D
- HF1/HF2/HF3
- Stage 5 scheduler/training

Then run:

```bash
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/pearl-warden-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-warden-baseline-export
rc=$?
rm -rf /tmp/pearl-warden-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — REFERENCE PROFILE / ONBOARDING

## Step 3: Replace age-band onboarding with exact age

Find the current age-range/age-band onboarding step.

Replace it with mandatory exact age input.

Requirements:

- no age band selector in normal onboarding;
- exact integer age required;
- validation and helpful error copy;
- no progress to Check-Up until valid;
- stored in the canonical local profile/preferences reference profile;
- synced/restored/exported through existing bounded JSON architecture;
- no free text;
- no medical claim copy.

Suggested copy:

```text
How old are you?
Pearl uses your age to compare your check-up results with published movement reference data.
```

## Step 4: Add mandatory reference sex onboarding

Add a mandatory reference-sex step or combine with exact-age step.

Options:

```text
Female
Male
```

Suggested copy:

```text
Which reference group should Pearl use?
Published movement reference data is usually grouped this way. Pearl uses this only for movement comparisons.
```

Requirements:

- mandatory before first official Movement Profile;
- stored separately from identity/gender;
- no `prefer_not_to_say` for official source-backed reference flow unless product owner later approves raw-only fallback;
- no plan/check-up official materialization without reference sex;
- backend/profile sync/export/account clear covered.

## Step 5: Profile/settings edit path

Add or update Settings/Profile UI so user can edit:

```text
exact age
reference sex
```

Copy must say changes affect future Movement Check-Ups only.

Do not rewrite previous Movement Profiles.

## Step 6: Reference details screen behavior

Update `MovementProfileV2ReferenceDetailsScreen` / draft helpers:

- If official Check-Up source and saved reference profile is complete, prefill with exact age and reference sex.
- Prefer automatic materialization after raw Check-Up when official reference profile is already complete and no user confirmation is needed.
- If reference profile is missing or invalid, route to reference details and require exact age/reference sex.
- Remove / disable skip for official Movement Profile sources once Warden is enabled.
- Optional full extra Check-Up may stay non-official and must not create official Warden artifacts.
- Retakes/official retests freeze the age/reference sex present at that test.

If automatic materialization would be risky in current architecture, keep the reference details screen but make it a simple confirmation/edit screen with mandatory fields. Document the choice.

# PART C — WARDEN SOURCE / TRANSFORM

## Step 7: Source and permission summary

Create:

```text
docs/sources/PEARL_WARDEN_PERMISSION_SUMMARY.md
```

Do not include private correspondence.

If approved transform data/formula is committed as code, include source citation metadata and permission summary references.

## Step 8: Implement approved source-faithful transform

Use the exact approved Warden calculator/data/formula.

Recommended path:

```text
src/reference/movementProfileV2/wardenChairTransform.ts
```

or repository-consistent equivalent.

Implement a pure deterministic transform:

```ts
type WardenChairPercentileInput = {
  exactAgeAtTest: number;
  referenceSex: 'female' | 'male';
  chairRises30s: number;
};

type WardenChairPercentileOutput = {
  pointPercentile?: number; // internal only if source supports exact point
  percentileRange: { min: number; max: number; label: string };
  evidenceBand: ...;
  sourceId: 'warden_2022_30s_sts';
  sourceFingerprint: string;
  transformId: ...;
  transformFingerprint: string;
  approvalId: ...;
};
```

Adapt to existing result types.

Requirements:

- pure;
- deterministic;
- no ambient date/env/backend;
- no network;
- JSON-safe;
- no non-finite values;
- strict supported age/sex/reps bounds;
- source and transform fingerprints;
- golden tests against known approved calculator examples;
- fail closed if source/transform fingerprint mismatches.

If the source formula uses LMS/centile curves, implement source-faithfully and test against the approved calculator.

## Step 9: Enable Warden transform in reference registry

Update:

```text
src/reference/movementProfileV2/sources.ts
src/reference/movementProfileV2/transformations.ts
src/reference/movementProfileV2/chair.ts
src/reference/movementProfileV2/engine.ts
```

or current equivalents.

Change chair from:

```text
raw_only_source_transform_unapproved
```

to:

```text
percentile_range
```

only when eligible.

Do not remove raw-only fallback.

Update source-set fingerprint and tests.

Existing old snapshots with prior source-set fingerprint should remain parseable/read-only if current parser supports them, but new official snapshots should use the Warden-enabled source-set.

## Step 10: Warden output policy

User-facing output:

- raw reps first;
- percentile range/band second;
- simple label.

Examples:

```text
12 rises in 30 seconds
Around the 25th–40th percentile for your age and reference group
```

or:

```text
12 rises in 30 seconds
Building
```

Do not show exact point percentile as the headline.

Do not show Warden, LMS, formula, schema, fingerprint in public UI.

# PART D — SNAPSHOT / ASSESSMENT / FOCUS

## Step 11: Freeze Warden material in snapshot

For new official Movement Profile V2 snapshots, freeze:

- exact age at test;
- reference sex;
- Warden source and transform IDs/fingerprints;
- Warden percentile range result;
- chair reference eligibility state;
- chair focus/evidence category;
- raw chair reps;
- setup/tracking/protocol evidence.

Snapshot builder must remain pure and source-bound.

Snapshot parser must reject malformed/non-finite/future Warden material.

## Step 12: Assessment domain-evidence integration

Update V2 domain evidence classification so chair/Warden can influence Strength / Power focus.

Rules:

- Warden eligible low chair percentile range -> Strength / Power can become suggested focus.
- Warden neutral/high chair percentile range -> no Strength priority.
- Warden missing/ineligible -> chair remains raw-only and cannot drive reference focus.
- Balance and Shoulder existing domain evidence unchanged.
- Pain-limited/invalid/tracking-uncertain chair cannot become a clear focus candidate.
- Balanced remains first-class.

Version/fingerprint the updated domain-evidence and focus policy if required by current architecture.

## Step 13: Focus tie behavior

Preserve existing V2 focus policy:

- single clear candidate -> that focus;
- multiple candidates -> prior official focus/goal/balanced tie rules;
- domain -> Balanced intentionally unsupported in focus policy v1 unless current approved policy already changed;
- prior focus only influences official retests;
- life-goal tie-break only where current policy permits.

Add tests where Warden low Strength competes with Balance/Mobility.

## Step 14: Automatic plan creation

Because plan creation consumes the frozen V2 assessment, Strength / Power plans should now be created when Warden chair evidence selects Strength.

Tests:

```text
low Warden chair + neutral balance/mobility
-> assessment focus Strength / Power
-> V2 MovementBlock focus Strength / Power
-> plan uses strength templates

neutral/high Warden chair + low balance
-> Balance focus
-> Balance plan

all neutral
-> Balanced
```

Do not change Stage 5 scheduler/credit/progression.

# PART E — UI SURFACING

## Step 15: Results screen

Update Movement Profile results:

- chair row/card shows raw reps + Warden percentile range/simple band when eligible;
- raw-only fallback still says saved result / no reference comparison when ineligible;
- no technical Warden labels;
- no exact headline percentile;
- no Movement Age.

CTA behavior unchanged.

## Step 16: Progress screen

Update Progress latest Movement Profile card:

- Strength / Power row no longer always says `Saved result` when Warden eligible;
- use consumer labels:
  - `Starting point`
  - `Building`
  - `Within typical range`
  - `Above typical range`
  - or percentile range if space permits.
- no technical labels.
- preserve recently restored Progress cards and visibility rules.

## Step 17: Saved Movement Profile detail

Read-only saved profile detail should show Warden chair context if eligible.

It must not recompute from live profile; it reads frozen snapshot/view model.

## Step 18: V2 block report

If the report displays chair/Strength context, show Warden percentile range neutrally.

Do not add improvement/decline or percentile change.

If prior/current comparability is incompatible, show neutral non-comparable copy.

## Step 19: Settings/Profile copy

User can edit future reference profile fields.

Copy:

```text
These details are used for published movement comparisons. Changes apply to future Movement Check-Ups only.
```

# PART F — OPTIONAL / MANUAL / MICRO-CHECK CONTAINMENT

## Step 20: Optional full extra Check-Up

Optional full extra V2 Check-Up remains non-official.

Even if it can calculate a practice Warden range for user curiosity, it must not:

- create official snapshot;
- create assessment;
- create focus;
- create/replace block;
- update latestProfile;
- enter official history;
- enter report history;
- affect Progress official history;
- affect plan.

If showing Warden in optional result is risky, keep optional result raw-only and document it.

## Step 21: Micro-check containment

Micro-checks remain separate.

Do not apply Warden to chair-power micro-check as official reference evidence.

Do not make chair-power micro-check influence focus/plan/report/history.

# PART G — PERSISTENCE / SYNC / RESTORE / EXPORT / ACCOUNT CLEAR

## Step 22: Profile persistence

Exact age/reference sex must round-trip through:

- local preferences;
- backend profile sync/restore;
- data export;
- account clear.

No free text.

Do not rely on legacy age bands.

## Step 23: Check-Up artifacts

Warden-enabled snapshots/assessments must round-trip through:

- local history serialization;
- backend check-up sync;
- restore;
- export;
- account clear.

Remote/malformed/future Warden material fails closed.

Do not recompute old snapshots on restore.

## Step 24: Privacy

Do not export or sync:

- source workbook/PDF content;
- permission correspondence;
- raw landmarks;
- frames/video/images;
- credentials/secrets;
- free-text health notes.

Bounded Warden metadata is okay:

```text
source ID/fingerprint
transform ID/fingerprint
approval ID
age at test
reference sex
raw reps
percentile range
eligibility state
```

# PART H — COPY GUARDRAILS

Public copy must not include:

```text
Warden
LMS
centile calculator
sarcopenia
diagnosis
fall risk
Movement Age
body age
strength age
weakest
V1
V2
schema
fingerprint
raw_only_source_transform_unapproved
IQR on Progress summary
published comparison on Progress summary
```

Source/detail screens for internal/developer docs/tests may include Warden.

Normal user screens must use consumer copy.

# PART I — TEST MATRIX

## A. Permission/source gate

- permission summary created;
- private correspondence not committed;
- transform data/formula present;
- missing source data blocks implementation rather than inventing formula.

## B. Onboarding exact age/reference sex

- age-band selector removed from normal onboarding;
- exact age mandatory;
- invalid age blocked;
- reference sex mandatory;
- cannot start official Movement Profile without valid exact age/reference sex;
- copy uses reference group / published movement comparison wording;
- no gender identity conflation.

## C. Settings/profile

- edit exact age/reference sex;
- changes apply to future Check-Ups only;
- old snapshots not recomputed;
- local/sync/restore/export/account-clear round-trip.

## D. Warden transform

- golden calculator examples;
- female/male examples;
- age bounds;
- rep bounds;
- deterministic fingerprint;
- malformed/non-finite fail closed;
- exact same input -> same output;
- source/transform mismatch fail closed.

## E. Reference engine

- eligible chair result returns percentile_range;
- missing profile -> raw_only_profile_incomplete;
- outside age -> raw_only_outside_reference_age;
- setup uncertain -> raw_only_setup_uncertain;
- tracking uncertain -> raw_only_tracking_uncertain;
- protocol incomplete -> raw_only_protocol_incomplete;
- invalid measurement -> invalid_measurement;
- no Warden output from optional/non-official source.

## F. Snapshot

- official snapshot freezes exactAgeAtTest/referenceSex/Warden output;
- parser rejects malformed/future Warden material;
- old raw-only snapshots remain readable where supported;
- no ambient profile reinterpretation.

## G. Assessment/focus

- low Warden -> Strength / Power focus;
- neutral Warden does not force Strength;
- high Warden neutral/above;
- Warden ineligible -> raw-only no Strength focus from chair;
- low Warden vs low balance/mobility follows existing tie policy;
- official retest prior focus preservation unchanged;
- Balanced fallback unchanged.

## H. Plan creation

- low Warden Strength focus creates Strength V2 block;
- Balanced block remains genuine Balanced;
- no fake focusDomain;
- Stage 5 schedule unchanged;
- session templates unchanged except selected focus.

## I. Results/Progress/report UI

- chair row shows raw reps + consumer percentile range/band;
- no technical labels;
- no Movement Age/diagnosis/fall-risk;
- Progress restored cards preserved;
- Movement Profile history visibility unchanged;
- read-only saved details use frozen Warden output;
- reports are neutral.

## J. Containment

- optional full extra Check-Up does not create official Warden artifacts;
- optional/micro check-up does not affect focus/plan/history;
- public V1 route retirement preserved;
- H5A/H5B/H5C/H5D preserved;
- HF1/HF2/HF3 preserved.

## K. Regression

- Stage 3D-B snapshot/assessment/reference tests;
- H3/H4 lifecycle;
- H5A Progress;
- H5B/H5B.1 micro-check;
- H5C public selector;
- H5D release flags;
- HF1/HF2/HF3;
- Stage 5G/5H scheduler/training;
- audio verification.

# PART J — VALIDATION

## Step 25: Focused validation

Run focused tests for:

- profile reference details;
- onboarding exact age/reference sex;
- reference profile normalization;
- Warden chair transform;
- reference engine;
- snapshot;
- assessment;
- artifact materialization;
- block creation;
- results adapter;
- Progress presentation;
- report presentation;
- sync/restore/export/account clear;
- optional full extra containment;
- H5/HF regressions.

Record exact command and counts.

## Step 26: Full gate

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then:

```bash
rm -rf /tmp/pearl-warden-full-integration-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-warden-full-integration-export
rc=$?
rm -rf /tmp/pearl-warden-full-integration-export
exit $rc
```

Record:

- focused suites/tests;
- full suites/tests;
- audio required assets;
- typechecks;
- Expo config/export;
- asset count;
- known warnings;
- new warnings.

# PART K — REPORT

Create exactly one new report:

```text
docs/audits/PEARL_WARDEN_CHAIR_PERCENTILE_FULL_INTEGRATION.md
```

Do not edit prior audit reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Product-owner permission decision.
3. Permission summary location and privacy handling.
4. Source data/formula availability.
5. H5/HF constraints carried forward.
6. Initial Git status.
7. Baseline validation.
8. Onboarding exact age/reference sex changes.
9. Profile/settings reference details changes.
10. Reference details screen behavior.
11. Warden source/transform implementation.
12. Source/fingerprint/approval IDs.
13. Golden calculator validation.
14. Reference engine integration.
15. Snapshot freezing/parsing.
16. Assessment/focus integration.
17. Plan-creation integration.
18. Results UI.
19. Progress UI.
20. Saved profile/report UI.
21. Optional/micro-check containment.
22. Persistence/sync/restore/export/account clear.
23. Copy guardrails.
24. Tests added/changed.
25. Files changed.
26. Focused validation.
27. Full validation.
28. Remaining limitations / device QA.
29. Initial/final Git status.
30. Confirmation no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden formula approximation, public V1 route rollback, H5/HF regression, training credit/progression change, or physical-device validation claim occurred.

If source data/formula is missing, the report should be a blocked report and explicitly say what file/data is needed.

# REQUIRED INVARIANTS

After successful implementation:

1. Age-band onboarding removed from normal flow.
2. Exact age mandatory before official Movement Profile.
3. Reference sex mandatory before official Movement Profile.
4. Exact age/reference sex stored in profile safely.
5. Official snapshot freezes age at test/reference sex.
6. Warden approved transform implemented source-faithfully.
7. Warden transform version/fingerprint deterministic.
8. Warden golden tests pass.
9. Eligible chair returns percentile range.
10. Ineligible chair remains raw-only.
11. Chair raw reps remain first in UI.
12. No exact headline percentile.
13. Warden low chair evidence can drive Strength / Power focus.
14. Strength focus can create Strength V2 block.
15. Balance/Shoulder focus rules preserved.
16. Balanced preserved.
17. Optional full extra Check-Up remains non-official.
18. Micro-checks remain non-official.
19. Progress restoration preserved.
20. H5A/H5B/H5C/H5D preserved.
21. HF1/HF2/HF3 preserved.
22. No Movement Age/diagnosis/fall-risk/improvement claims.
23. Audio unchanged and verification passes.
24. Full repository gate passes.
25. Physical-device validation not claimed.
26. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark complete unless:

1. Approved source data/formula was actually found and implemented.
2. Exact age/reference sex onboarding is mandatory and tested.
3. Warden transform has golden tests.
4. Reference engine returns Warden percentile ranges only when eligible.
5. Assessment/focus/plan integration is tested.
6. UI surfaces are consumer-safe.
7. Optional/micro-check containment is tested.
8. Sync/restore/export/account clear are tested.
9. H5/HF regressions pass.
10. Full Jest passes.
11. Typechecks pass.
12. Audio verification passes.
13. Expo config/export pass.
14. `git diff --check` passes.

Do not mark complete if:

- source formula/data is missing;
- a synthetic/approximate formula is invented;
- exact public percentile is shown as headline;
- Movement Age or diagnosis/fall-risk copy appears;
- optional check-up creates official Warden artifacts;
- public V1 route returns;
- training credit/progression changes;
- audio gate fails.

# FINAL VERDICTS

At the end of the report state exactly one:

```text
WARDEN CHAIR PERCENTILE FULL INTEGRATION COMPLETE
WARDEN CHAIR PERCENTILE FULL INTEGRATION BLOCKED
```

Also state exactly one:

```text
WARDEN SOURCE / PERMISSION GATE SATISFIED
WARDEN SOURCE / PERMISSION GATE BLOCKED
```

Also state exactly one:

```text
EXACT AGE AND REFERENCE SEX ONBOARDING IMPLEMENTED
REFERENCE PROFILE ONBOARDING BLOCKED
```

Also state exactly one:

```text
WARDEN CHAIR PERCENTILE TRANSFORM IMPLEMENTED
WARDEN TRANSFORM BLOCKED
```

Also state exactly one:

```text
WARDEN STRENGTH FOCUS INTEGRATION IMPLEMENTED
WARDEN STRENGTH FOCUS INTEGRATION BLOCKED
```

Also state exactly one:

```text
WARDEN-INFLUENCED PLAN CREATION VERIFIED
WARDEN-INFLUENCED PLAN CREATION BLOCKED
```

Also state:

```text
NO MOVEMENT AGE REINTRODUCTION
NO DIAGNOSIS / FALL-RISK CLAIMS
NO EXACT HEADLINE PERCENTILE
OPTIONAL CHECK-UP CONTAINMENT PRESERVED
MICRO-CHECK CONTAINMENT PRESERVED
H5A PROGRESS PRESERVED
H5B MICRO-CHECK POLICY PRESERVED
H5C PUBLIC V1 ROUTE RETIREMENT PRESERVED
H5D RELEASE HARDENING PRESERVED
HF1/HF2/HF3 HANDS-FREE BEHAVIOR PRESERVED
NO AUDIO REGENERATION
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# FINAL CODEX RESPONSE

Return a concise summary containing:

- report path;
- whether production runtime code changed;
- permission/source summary path;
- whether source data/formula was found;
- onboarding age/reference-sex changes;
- settings/profile changes;
- Warden transform path/version/fingerprint;
- golden validation;
- reference engine behavior;
- snapshot behavior;
- assessment/focus behavior;
- plan-creation behavior;
- results/progress/report UI behavior;
- optional/micro-check containment;
- persistence/sync/restore/export/account clear;
- tests added/changed;
- focused validation;
- full Jest;
- typechecks;
- audio verification;
- Expo config/export;
- `git diff --check`;
- H5/HF regression result;
- final verdicts;
- files changed;
- confirmation no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden formula approximation, public V1 route rollback, H5/HF regression, training credit/progression change, or physical-device validation claim occurred.
