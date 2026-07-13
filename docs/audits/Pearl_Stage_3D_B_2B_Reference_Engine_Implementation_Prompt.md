You are implementing Stage 3D-B.2B of Pearl’s production-readiness work:

MOVEMENT PROFILE V2 REFERENCE ENGINE, CLAIM-ELIGIBILITY COMPOSITION, BALANCE TASK BANDS, SOURCE BENCHMARKS, SHOULDER IQR CLASSIFICATION, CHAIR PERCENTILE-RANGE ARCHITECTURE, AND SOURCE-FINGERPRINT INTEGRITY

This is the second production implementation stage following the approved Stage 3D-B.1 design and the completed Stage 3D-B.2A raw assessment protocols.

Implement only the pure reference/interpretation engine and its source-data contracts.

Do not implement the Movement Profile UI, suggested-focus selection, profile-input screens, score snapshots, backend snapshot migration, block creation, reports, feature-flag rollout, public V2 routing, longitudinal change claims, or physical-device validation in this task.

## Current stage relationship

Stage 3D-B.2A is implemented as an internal raw-only protocol layer.

It added:

- frozen Check-Up protocol policies:
  - `legacy_movement_age_v1`;
  - `movement_profile_v2`;
- an internal V2 battery:
  - `chair-rise-30s-v2`;
  - `one-leg-balance-45s-v2`;
  - `active-shoulder-reach-v2`;
  - `hinge-reach` as supporting only;
- typed setup metadata;
- typed protocol evidence states;
- deterministic V2 chair, balance, and shoulder protocol controllers;
- V2 raw completeness;
- V1 scoring/snapshot/block/report containment.

The public/default Check-Up remains V1.

V2 raw Check-Ups cannot currently create:

- a V1 Movement Age score;
- a V1 score snapshot;
- a MovementAssessment;
- a MovementBlock;
- a block report.

Stage 3D-B.2B must preserve that containment.

## Product-owner decisions already approved

The following controlled-beta interpretation direction is locked:

### Overall

- Replace exact Movement Age with a future `Movement Profile`.
- Raw result is always primary.
- Reference claims appear only when source, protocol, setup, profile, and tracking eligibility all pass.
- No exact Movement Age output.
- No diagnosis, risk score, or impairment label.
- No longitudinal `improved`, `declined`, `younger`, or meaningful-change claim before device repeatability/MDC validation.
- No cross-domain suggested-focus algorithm in Stage 3D-B.2B.

### Chair rise

- Raw result: full chair rises in 30 seconds.
- Future reference claim: broad percentile range, not exact percentile.
- Exact age and optional reference-sex group are required for an eligible percentile claim.
- Setup uncertainty, hand push-off, or tracking uncertainty suppresses the reference claim.
- The Warden et al. centile transform must not be embedded until its use has an approved legal/product basis.
- Stage 3D-B.2B must implement the safe architecture and raw-only fallback, but must not copy workbook formulas, hidden-table parameters, or calculator data into production code without explicit approval.

### One-leg balance

- Raw result: best valid hold in seconds, maximum 45 seconds.
- Headline interpretation: Pearl task band.
- No exact percentile.
- No Movement Age.
- Optional source context: a published age-group best-of-three benchmark mean.
- Do not construct a `normal range` from ambiguous dispersion fields.
- Do not infer a percentile from a mean and standard deviation.
- Reference sex is not required for the Springer benchmark.
- Changed standing leg suppresses future longitudinal comparison but does not automatically invalidate the current cross-sectional benchmark.

### Active shoulder reach

- Raw result: active shoulder flexion angle in degrees.
- Reference claim: age-, reference-sex-, and side-specific published IQR category.
- Categories:
  - below published middle range;
  - within published middle range;
  - above published middle range.
- No exact percentile.
- No Movement Age.
- `Above` must remain neutral; it is not automatically better.
- Pain-limited or tracking-uncertain captures remain raw-only.

### Profile/reference inputs

Stage 3D-B.2B may define pure input types for:

- frozen age-at-test;
- age basis;
- optional reference-sex group.

It must not add those fields to onboarding, profile UI, local profile persistence, or backend profile sync yet.

### Rollout

- Movement Profile V2 remains internal.
- V1 remains the default public Check-Up.
- No public V2 result route.
- No user-facing switch.
- No backend/profile-controlled activation.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect repository instructions:

- AGENTS.md;
- CLAUDE.md;
- existing scoring/versioning conventions;
- deterministic fingerprint utilities;
- current sanitization and JSON-safe type conventions.

Treat the current working tree as the source of truth.

## Narrow external-source lookup is authorised

Internet access is authorised only to verify the exact primary-source numeric data needed for:

- Springer et al. one-leg stance age-group best-of-three means;
- Gill et al. shoulder-flexion age/sex/side IQR values;
- source metadata, DOI, table number, protocol, and open-access/licensing metadata.

Use only:

- peer-reviewed primary papers;
- publisher full text;
- PubMed;
- official institutional repositories;
- DOI/Crossref metadata.

Do not use:

- blogs;
- commercial fitness sites;
- AI summaries;
- search snippets as evidence;
- Wikipedia;
- unauthorised copies;
- secondary tables when the primary table is accessible.

The Warden workbook may be inspected only to confirm source status and metadata. Do not extract or commit its formulas, hidden tables, coefficients, or derived parameter arrays in this task.

Temporary source files may exist only under:

```text
/tmp/pearl-stage3db2b/
```

Delete them before finishing.

Do not commit PDFs, screenshots, workbooks, or copyrighted table images.

## Verified source direction

### Chair source

Warden SJ, Liu Z, Moe SM.

`Sex- and Age-Specific Centile Curves and Downloadable Calculator for Clinical Muscle Strength Tests to Identify Probable Sarcopenia`

Physical Therapy, 2022.

DOI:

```text
10.1093/ptj/pzab299
```

Current status:

- exact centile model exists;
- official calculator exists;
- sex-specific;
- age range approximately 18–80;
- transform use is not approved for embedding;
- no production percentile calculation may be enabled in Stage 3D-B.2B.

### Balance source

Springer BA, Marin R, Cyhan T, Roberts H, Gill NW.

`Normative Values for the Unipedal Stance Test with Eyes Open and Closed`

Journal of Geriatric Physical Therapy, 2007.

DOI:

```text
10.1519/00139143-200704000-00003
```

Use only exact directly verified:

- eyes-open;
- best-of-three;
- total age-group benchmark means;
- source age groups;
- 45-second ceiling/protocol metadata.

Do not use the ambiguous parenthetic dispersion field to create a range.

### Shoulder source

Gill TK et al.

`Shoulder range of movement in the general population: age and gender stratified normative data using a community-based cohort`

BMC Musculoskeletal Disorders, 2020.

DOI:

```text
10.1186/s12891-020-03665-9
```

Use exact Table 1:

- active shoulder flexion;
- age group;
- reference sex;
- left/right side;
- Q1;
- median;
- Q3.

Do not use passive ROM or a different shoulder-motion table.

## Primary objectives

Stage 3D-B.2B must:

1. Add one pure Movement Profile V2 interpretation engine.

2. Accept only V2 raw Check-Up records or V2 raw result contracts.

3. Define explicit frozen reference-profile inputs without adding UI/profile persistence.

4. Compose protocol evidence with profile/source eligibility.

5. Produce JSON-safe per-domain interpretation results.

6. Implement balance task bands exactly.

7. Implement source-direct balance age-group benchmark metadata without percentile/range inference.

8. Implement shoulder IQR lookup and neutral category classification.

9. Implement chair percentile-range interfaces, eligibility, rounding, and claim structure without embedding an unapproved transform.

10. Keep chair results raw-only when no approved transform is supplied.

11. Add a strict interface for a future approved chair transform.

12. Add immutable source and transformation registries/fingerprints.

13. Fail closed for malformed source tables, unsupported source versions, missing profile inputs, unsupported ages, and protocol deviations.

14. Keep the engine separate from V1 scoring.

15. Do not create a weakest/suggested-focus result.

16. Do not create a score snapshot.

17. Do not sync or display the output.

18. Preserve all Stage 2A/3/4/5 regressions.

## Scope boundary

This task may change:

- new V2 reference-engine types;
- source registry;
- source data modules for Springer and Gill;
- chair transform interface and disabled production adapter;
- reference-profile input normalization;
- protocol/source claim-eligibility composition;
- chair percentile-range structuring helpers;
- balance task-band helpers;
- balance benchmark lookup;
- shoulder IQR lookup;
- Movement Profile V2 interpretation engine;
- exports;
- focused tests;
- the Stage 3D-B.2B remediation report.

This task must not change:

- current V1 norm tables;
- current V1 scoring formulas;
- current V1 bands;
- current V1 focus selection;
- current V1 score snapshots;
- V2 assessment protocols;
- CheckUpScreen/UI routes;
- Results/Progress/Home/Onboarding UI;
- suggested-focus policy;
- MovementAssessment or MovementBlock creation;
- profile fields or onboarding;
- backend schema;
- check-up sync payloads;
- reports;
- workout generation;
- exercise catalogue;
- native pose code;
- feature flags;
- dependencies;
- lockfiles;
- audio assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE AND BASELINE

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Important cautions:

- The repository is heavily dirty with user-owned work.
- Stage 3D-B.2A reported pre-existing diagnostics/settings/app-config changes.
- Stage 4/5 and pose/native/auth/website work may also be present.
- The 88 Clara/Marcus safety MP3s and manifests are intended current assets.
- Do not delete or regenerate them.
- Do not inspect or expose `.env` values.
- Do not expose ElevenLabs credentials.
- Do not modify or share font files.

Rules:

1. Treat every existing change as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe;
   - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted existing test slice covering at minimum:

- V2 protocol policy;
- V2 raw protocol controllers;
- V2 battery/registry;
- V2 raw completeness;
- V1 scoring rejection;
- V1 score snapshots;
- assessment eligibility;
- check-up sync containment;
- source/version helpers;
- Stage 4 closure;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Run a local non-publishing Expo export because new production TypeScript modules must remain Metro-compatible:

```bash
rm -rf /tmp/pearl-stage3db2b-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2b-export
rc=$?
rm -rf /tmp/pearl-stage3db2b-export
exit $rc
```

Do not install dependencies.

The Stage 3D-B.2A reference baseline was:

- focused: 7 suites / 77 tests;
- full Jest: 109 suites / 908 tests;
- audio: 44 cues / 88 assets;
- app typecheck passed;
- website typecheck passed;
- Expo config/export passed;
- git diff check passed.

Verify current counts rather than assuming them.

# PART B — RECONSTRUCT THE CURRENT V2 RAW CONTRACT

## Step 1: Inspect current V2 implementation

Before editing, inspect at minimum:

- src/checkup/protocolPolicy.ts or current equivalent;
- src/checkup/checkup.ts;
- src/checkup/types.ts;
- src/movements/types.ts;
- src/movements/registry.ts;
- src/movements/movementProfileV2.ts or current equivalent;
- V2 chair controller;
- V2 balance controller;
- V2 shoulder controller;
- V2 protocol-evidence types;
- V2 raw completeness helpers;
- scoring containment;
- score snapshot containment;
- assessment/block eligibility;
- check-up sync containment;
- all Stage 3D-B.2A tests.

Document exact current names and shapes for:

- V2 movement IDs;
- protocol policy;
- raw result metadata;
- protocol evidence status;
- setup metadata;
- selected leg/side;
- changed-from-prior;
- attempt histories;
- validity flags;
- raw completeness.

Do not duplicate an existing type under a second name.

## Step 2: Define the engine input boundary

The engine must accept a frozen V2 raw result and explicit reference-profile input.

Conceptually:

```ts
type ReferenceAgeBasis =
  | 'exact_age_at_test'
  | 'birth_year_month_derived'
  | 'age_group_only'
  | 'legacy_age_band_representative'
  | 'unknown';

type ReferenceSexForPublishedComparisons =
  | 'female'
  | 'male'
  | 'prefer_not_to_say'
  | 'unknown';

type MovementProfileV2ReferenceProfile = {
  ageAtTest?: number;
  ageBasis: ReferenceAgeBasis;
  ageGroupLabel?: string;
  referenceSex: ReferenceSexForPublishedComparisons;
};

type MovementProfileV2InterpretationInput = {
  checkUp: CheckUpRecord;
  referenceProfile: MovementProfileV2ReferenceProfile;
};
```

Adapt to current repository types.

Requirements:

- no ambient current age;
- no reading live profile inside the pure engine;
- no inference from name, voice, account, photo, or provider profile;
- age-at-test is explicit and frozen by caller;
- deterministic normalization;
- JSON-safe;
- malformed input fails closed;
- input non-mutating.

Do not add these fields to `UserProfile` in this task.

# PART C — REFERENCE ENGINE TYPE SYSTEM

## Step 3: Define result kinds without a generic score

Do not introduce a universal numeric `score`.

Use explicit result kinds.

Conceptually:

```ts
type ReferenceResultKind =
  | 'raw_only'
  | 'percentile_range'
  | 'pearl_task_band'
  | 'published_age_group_benchmark'
  | 'published_iqr_category';

type ReferenceClaimEligibility =
  | 'reference_eligible'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_reference_unavailable'
  | 'raw_only_profile_incomplete'
  | 'raw_only_pain_limited'
  | 'raw_only_outside_reference_age'
  | 'raw_only_source_transform_unapproved'
  | 'invalid_measurement';
```

Adapt names to existing V2 protocol evidence.

Requirements:

- preserve original V2 protocol evidence status separately;
- claim eligibility may only become stricter;
- no result may upgrade `raw_only_*` protocol evidence into `reference_eligible`;
- no result may upgrade `invalid_measurement`;
- stable reason codes;
- no user-facing copy strings in the engine;
- no `movementAge`;
- no `weakestDomain`;
- no generic higher-is-better flag.

## Step 4: Define raw metric contracts

Conceptually:

```ts
type RawMetric =
  | {
      metricId: 'chair_rises_30s';
      value: number;
      unit: 'repetitions';
    }
  | {
      metricId: 'one_leg_balance_best';
      value: number;
      unit: 'seconds';
      ceiling: 45;
    }
  | {
      metricId: 'active_shoulder_reach';
      value: number;
      unit: 'degrees';
      side: 'left' | 'right';
    };
```

Requirements:

- derive only from validated V2 result fields;
- finite;
- domain-specific bounds;
- no fallback to V1 metrics;
- no hinge substitution for shoulder;
- no TUG interpretation.

# PART D — SOURCE REGISTRY AND FINGERPRINTS

## Step 5: Add one canonical source registry

Create one source registry under the V2 reference/scoring domain.

Conceptually:

```ts
type ReferenceSourceId =
  | 'warden_2022_30s_sts'
  | 'springer_2007_unipedal_eyes_open'
  | 'gill_2020_active_shoulder_flexion';

type ReferenceSourceDefinition = {
  sourceId: ReferenceSourceId;
  sourceVersion: number;
  title: string;
  authors: string;
  year: number;
  doi: string;
  protocolIds: readonly string[];
  populationSummary: string;
  statisticKind: string;
  publicUseStatus:
    | 'approved_numeric_table'
    | 'approved_benchmark_only'
    | 'transform_use_pending_approval';
  sourceFingerprint: string;
};
```

Requirements:

- stable deterministic source order;
- immutable values;
- no URLs required at runtime unless existing conventions support them;
- no source PDF content;
- no source prose copied beyond short factual metadata;
- no copyrighted table images;
- every production source data module links to one source ID;
- source fingerprints change when numeric source data or material metadata changes;
- use a React-Native-compatible deterministic fingerprint method;
- do not use Node-only crypto in runtime modules unless it is already supported by the project.

## Step 6: Add transformation registry

Conceptually:

```ts
type ReferenceTransformationId =
  | 'chair_percentile_range_v1_pending_transform'
  | 'balance_task_band_v1'
  | 'balance_age_group_benchmark_v1'
  | 'shoulder_iqr_category_v1';

type ReferenceTransformationDefinition = {
  transformationId: ReferenceTransformationId;
  transformationVersion: number;
  sourceIds: readonly ReferenceSourceId[];
  transformationFingerprint: string;
  enabled: boolean;
  reasonIfDisabled?: string;
};
```

Requirements:

- chair percentile transform disabled by default;
- balance task band explicitly marked Pearl-created product interpretation;
- balance benchmark source-direct;
- shoulder IQR source-direct;
- no hidden environment variable can enable chair transform;
- no backend/profile field can enable it;
- no `__DEV__` accidental enablement.

# PART E — CLAIM-ELIGIBILITY COMPOSITION

## Step 7: Compose protocol, profile, and source eligibility

Create one pure helper that takes:

- V2 protocol evidence;
- V2 raw validity;
- age/reference inputs;
- source availability;
- domain-specific requirements.

Precedence:

1. invalid raw measurement;
2. protocol evidence not reference complete;
3. pain-limited;
4. tracking/setup/protocol uncertainty;
5. missing profile input;
6. outside source age;
7. source/transform unavailable;
8. reference eligible.

Requirements:

- deterministic;
- reason-preserving;
- does not hide the more specific earlier reason;
- no source claim when protocol is incomplete;
- no chair/shoulder reference claim without female/male reference group;
- no chair percentile without exact-age basis;
- balance benchmark may use exact age or an unambiguous source age group;
- no extrapolation beyond source bins;
- no age-band representative masquerading as exact age.

Direct tests must cover every precedence pair.

# PART F — CHAIR PERCENTILE-RANGE ARCHITECTURE

## Step 8: Do not embed the Warden transform

Hard rule:

- do not commit workbook formulas;
- do not commit hidden-sheet tables;
- do not commit extracted LMS arrays;
- do not implement a numerical Warden transform in production;
- do not add a source file copied from the workbook;
- do not enable chair percentile output.

The production reference engine must return:

```text
raw_only_source_transform_unapproved
```

or the nearest stable equivalent when every other chair criterion passes.

The output must retain:

- raw repetitions;
- source ID;
- intended transformation ID;
- transform enabled: false;
- transform-unavailable reason;
- eligibility reasons.

## Step 9: Define an approved-transform interface

Add a narrow future-facing interface.

Conceptually:

```ts
type ApprovedChairPercentileTransform = {
  sourceId: 'warden_2022_30s_sts';
  sourceFingerprint: string;
  transformationId: string;
  transformationFingerprint: string;
  approvalId: string;
  percentileFor(input: {
    repetitions: number;
    ageAtTest: number;
    referenceSex: 'female' | 'male';
  }): number | null;
};
```

Requirements:

- no default production implementation;
- provider must explicitly identify approval;
- wrong source/fingerprint/approval fails closed;
- percentile must be finite and between 0 and 100;
- equal inputs deterministic;
- engine may accept the provider through explicit dependency injection only;
- default exported engine must have no provider;
- no global mutable registration;
- no runtime network.

## Step 10: Implement percentile-range structuring

Use a fake approved transform only in tests.

Deterministic range algorithm:

1. Calculate percentiles for:
   - `repetitions - 1`;
   - `repetitions`;
   - `repetitions + 1`.
2. Clamp repetition inputs at 0.
3. Take the minimum and maximum valid percentiles.
4. Round low downward to nearest 10.
5. Round high upward to nearest 10.
6. Enforce a minimum width of 20 percentile points.
7. Clamp to 0–100.
8. If the entire uncertainty interval is below 10:
   - structured kind `below_10`.
9. If the entire interval is above 90:
   - structured kind `above_90`.
10. Otherwise:
   - structured bounded range.

Output only structured data:

```ts
type ChairPercentileRange =
  | { kind: 'below_10' }
  | { kind: 'above_90' }
  | { kind: 'range'; low: number; high: number };
```

Do not add user-facing strings.

Tests:

- lower boundary;
- upper boundary;
- minimum-width expansion;
- clamp;
- integer reps;
- missing provider;
- unapproved provider;
- wrong fingerprint;
- NaN/out-of-range provider result;
- no exact percentile exposed.

## Step 11: Chair claim requirements

Chair percentile-range eligibility requires all:

- V2 chair raw result valid;
- protocol evidence `reference_protocol_complete`;
- confirmed rough knee-height setup;
- practice completed;
- no hand push-off;
- count tracking trustworthy;
- exact age basis;
- age within approved transform source range;
- reference sex `female` or `male`;
- approved transform present and validated.

Until the last condition exists:

- raw only;
- no placeholder percentile;
- no approximate result derived from the old V1 norms.

# PART G — BALANCE TASK BANDS

## Step 12: Implement the exact Pearl balance task band

Use the approved thresholds:

```text
45.0 seconds:
  ceiling_complete

20.0 <= seconds < 45.0:
  building

5.0 <= seconds < 20.0:
  starting_point

0.0 <= seconds < 5.0:
  starting_point_low
```

Structured output:

```ts
type BalanceTaskBand =
  | 'ceiling_complete'
  | 'building'
  | 'starting_point'
  | 'starting_point_low';
```

Requirements:

- task band is available for every valid raw V2 balance result;
- task band is product-created, not normative;
- task band does not require age/reference sex;
- no `Strong` label;
- no age claim;
- no risk claim;
- 45 seconds is a ceiling, not the user’s true maximum;
- values greater than 45 fail closed rather than silently clamp;
- negative/non-finite values invalid.

Boundary tests:

- 0;
- just below 5;
- exactly 5;
- just below 20;
- exactly 20;
- just below 45;
- exactly 45;
- above 45;
- NaN/infinity.

## Step 13: Balance source benchmark data

Re-open the exact primary Springer table.

Embed only the directly verified total eyes-open best-of-three mean for each source age group.

Do not embed:

- sex-specific values unless needed;
- eyes-closed values;
- mean-of-three values;
- ambiguous dispersion fields;
- inferred SD;
- percentile;
- range.

Data shape:

```ts
type BalanceAgeGroupBenchmark = {
  sourceAgeGroupId: string;
  minAge: number;
  maxAge: number;
  meanBestOfThreeSeconds: number;
  trialCeilingSeconds: 45;
};
```

Requirements:

- exact source values;
- test each row against a source fixture;
- source table/page recorded in comments/report;
- deterministic age-group lookup;
- inclusive, non-overlapping age boundaries;
- no interpolation between groups;
- no extrapolation;
- no `below/within/above` classification.

## Step 14: Balance benchmark eligibility

A source benchmark may be returned only when:

- raw balance result valid;
- protocol evidence `reference_protocol_complete`;
- source age is known;
- age maps exactly to a source group;
- attempt protocol is complete;
- no unapproved protocol deviation;
- source data version/fingerprint valid.

Changed standing leg:

- current cross-sectional benchmark may remain eligible;
- set `longitudinalComparableToPrior: false`.

Output:

```ts
type PublishedAgeGroupBenchmarkResult = {
  kind: 'published_age_group_benchmark';
  sourceId: 'springer_2007_unipedal_eyes_open';
  ageGroupId: string;
  meanBestOfThreeSeconds: number;
  measuredSeconds: number;
  trialCeilingSeconds: 45;
};
```

Do not calculate:

- percentile;
- z score;
- standardised deficit;
- normative range;
- focus severity;
- difference label such as below/above.

When benchmark is ineligible:

- task band still remains;
- source benchmark omitted;
- raw result retained.

# PART H — SHOULDER IQR REFERENCE ENGINE

## Step 15: Verify and encode the Gill source table

Re-open Gill et al. Table 1.

Encode exact active shoulder-flexion:

- five-year age group;
- reference sex;
- side;
- Q1;
- median;
- Q3.

Requirements:

- use active flexion only;
- use degrees;
- use correct left/right cells;
- include all source age groups required by the table or, at minimum, the complete supported age range used by production;
- no interpolation between age groups;
- no pooling;
- no inferred values;
- no full observed range as the primary category;
- comments/report cite exact table;
- source fingerprint covers every numeric value.

Add table-integrity tests:

- no duplicate age/sex/side key;
- Q1 <= median <= Q3;
- finite degrees;
- plausible 0–180 range;
- contiguous documented age bins where the source is contiguous;
- all supported sex/side combinations present.

## Step 16: Shoulder IQR classification

Structured output:

```ts
type ShoulderIqrCategory =
  | 'below_published_middle_range'
  | 'within_published_middle_range'
  | 'above_published_middle_range';

type ShoulderIqrReferenceResult = {
  kind: 'published_iqr_category';
  sourceId: 'gill_2020_active_shoulder_flexion';
  sourceAgeGroupId: string;
  referenceSex: 'female' | 'male';
  side: 'left' | 'right';
  q1Degrees: number;
  medianDegrees: number;
  q3Degrees: number;
  measuredDegrees: number;
  category: ShoulderIqrCategory;
};
```

Boundary rules:

- measured < Q1 -> below;
- Q1 <= measured <= Q3 -> within;
- measured > Q3 -> above.

Requirements:

- equality at Q1/Q3 is within;
- above is neutral;
- no generic “higher is better” metadata;
- no percentile;
- no age;
- no score inversion.

## Step 17: Shoulder eligibility

IQR comparison requires:

- V2 shoulder raw result valid;
- protocol evidence `reference_protocol_complete`;
- not pain-limited;
- tracking reliable;
- selected side present;
- exact age or an unambiguous supported source age group;
- reference sex female/male;
- source row exists.

Changed shoulder side:

- current source comparison may remain eligible using the selected side;
- set longitudinal comparison false.

Raw-only cases:

- prefer not to say/unknown reference sex;
- outside source age;
- pain-limited;
- tracking uncertain;
- incomplete protocol;
- unsupported side;
- missing source row.

# PART I — REFERENCE PROFILE NORMALIZATION

## Step 18: Normalize age input

Create a pure normalizer.

Requirements:

- finite integer or explicitly documented decimal-age support;
- no current-date calculation inside the engine;
- exact-age basis remains exact;
- `legacy_age_band_representative` is not exact;
- `age_group_only` must carry a valid source-compatible group identifier;
- malformed values -> unknown;
- no mutation.

Domain policy:

### Chair

Requires:

- exact age or birth-year/month-derived exact age;
- approved source age range;
- no legacy representative.

### Balance

May use:

- exact age mapped to source group;
- explicit source-compatible age group.

### Shoulder

May use:

- exact age mapped to five-year bin;
- explicit exact source bin only.

Do not guess a bin from an ambiguous broad Pearl onboarding band.

## Step 19: Normalize reference sex

Requirements:

- accept only female/male/prefer-not-to-say/unknown;
- no arbitrary strings;
- no inference;
- chair/shoulder require female or male for source claim;
- balance ignores reference sex;
- raw result always remains.

# PART J — MOVEMENT PROFILE V2 INTERPRETATION ENGINE

## Step 20: Add one pure interpretation engine

Conceptually:

```ts
type MovementProfileV2Interpretation = {
  engineSchemaVersion: number;
  engineVersion: number;
  protocolPolicyId: 'movement_profile_v2';
  protocolPolicyVersion: number;
  sourceSetId: string;
  sourceSetFingerprint: string;

  rawCompleteness: MovementProfileV2RawCompleteness;

  chair: ChairInterpretation;
  balance: BalanceInterpretation;
  shoulder: ShoulderInterpretation;

  diagnostics: readonly ReferenceEngineDiagnostic[];
};
```

Requirements:

- accepts V2 only;
- V1 returns typed unsupported result;
- no exception on malformed input;
- per-domain fail-local behavior;
- a bad shoulder row does not erase valid chair/balance raw output;
- no focus result;
- no overall score;
- no average;
- no movement age;
- no persistent snapshot;
- no side effect;
- no network;
- no hidden clock;
- deterministic diagnostics order.

## Step 21: Domain output requirements

### Chair

Always include:

- raw metric when valid;
- protocol evidence;
- claim eligibility;
- source metadata;
- transformation metadata/status;
- percentile range only when an approved injected transform exists.

Default production output remains raw-only.

### Balance

Include:

- raw seconds;
- task band;
- protocol evidence;
- claim eligibility;
- optional source benchmark;
- reached-ceiling flag;
- selected standing leg;
- longitudinal comparability flag.

### Shoulder

Include:

- raw degrees;
- selected side;
- protocol evidence;
- claim eligibility;
- optional IQR result;
- pain-limited flag;
- longitudinal comparability flag.

## Step 22: Fail-local engine behavior

Examples:

- missing chair reference sex:
  - chair raw-only;
  - balance and shoulder still evaluated independently.
- shoulder source row missing:
  - shoulder raw-only with diagnostic;
  - no crash.
- malformed balance attempt history but valid normalized best value unavailable:
  - balance invalid;
  - other domains retained.
- chair transform unavailable:
  - chair raw-only;
  - not a whole-engine failure.

# PART K — SOURCE AND TRANSFORMATION INTEGRITY

## Step 23: Source-set fingerprint

Create a deterministic source-set fingerprint from:

- source registry versions/fingerprints;
- enabled transformation definitions;
- source data fingerprints;
- engine version.

Requirements:

- no timestamp;
- no environment;
- no device;
- stable ordering;
- changed source value changes fingerprint;
- changed disabled/enabled transform state changes fingerprint;
- test exact expected fingerprint or stable recomputation.

## Step 24: Runtime validation

Add pure validation for:

- source registry;
- source data table;
- transformation registry;
- approved chair provider;
- source-set fingerprint.

Production engine should fail raw-only, not throw, if source integrity is invalid.

Tests should be able to inject malformed registries/tables.

# PART L — NO FOCUS, SNAPSHOT, OR UI LEAKAGE

## Step 25: Preserve stage boundaries

Stage 3D-B.2B must not:

- call current V1 `scoreCheckUp`;
- call current V1 norm inversion;
- call current V1 `focusSelection`;
- create a `CheckUpScore`;
- create a `ScoreSnapshot`;
- create a `MovementAssessment`;
- create a `MovementBlock`;
- write backend rows;
- expose UI copy;
- add a public V2 route.

Add architecture/grep-style tests where appropriate to ensure:

- V2 reference modules do not import V1 norms;
- default public battery remains V1;
- V2 reference engine is not invoked from App/CheckUpScreen/ResultsScreen.

Do not make brittle source-text tests when type-level/module-boundary tests suffice.

# PART M — SERIALIZATION BOUNDARY

## Step 26: JSON-safe result validation

Although Stage 3D-B.2C owns snapshots/sync, the ephemeral 2B output must already be JSON-safe.

Tests:

- JSON stringify/parse;
- no functions inside output;
- no undefined required fields;
- no Date objects;
- no NaN/infinity;
- no source URLs with query secrets;
- no raw source document content;
- no video/frames/landmarks;
- bounded diagnostics.

Do not add local persistence or backend mapping in this task.

# PART N — OBSERVABILITY

## Step 27: Diagnostic contract

Use bounded stable diagnostics such as:

- `unsupported_checkup_protocol`;
- `invalid_raw_measurement`;
- `protocol_not_reference_complete`;
- `reference_profile_incomplete`;
- `outside_reference_age`;
- `source_row_missing`;
- `source_integrity_invalid`;
- `chair_transform_unapproved`;
- `chair_transform_rejected`;
- `balance_benchmark_unavailable`;
- `shoulder_iqr_unavailable`;
- `longitudinal_side_changed`;
- `longitudinal_leg_changed`.

Include only:

- domain;
- reason;
- source ID;
- protocol ID/version;
- age group ID;
- side/leg when safe;
- transformation ID/version.

Exclude:

- auth data;
- free-text symptoms;
- raw profile payloads;
- source document text;
- video/frames/landmarks.

Pure helpers do not log.

# PART O — TEST MATRIX

## Required automated test matrix

### A. Reference-profile normalization

- exact age;
- birth-derived exact age input;
- age-group-only;
- legacy representative;
- unknown/malformed;
- female/male/prefer-not-to-say/unknown;
- input non-mutation.

### B. Source registry

- all three sources;
- unique IDs;
- DOI metadata;
- protocol mappings;
- deterministic fingerprints;
- changed source data changes fingerprint.

### C. Transformation registry

- balance task band enabled;
- balance benchmark enabled;
- shoulder IQR enabled;
- chair transform disabled;
- no hidden enablement.

### D. Claim eligibility

- every V2 protocol evidence state;
- every profile missing state;
- outside source age;
- source unavailable;
- precedence;
- per-domain requirements.

### E. Chair

- raw valid;
- setup uncertain;
- hand push-off;
- tracking uncertain;
- missing exact age;
- missing reference sex;
- outside source age;
- default transform unavailable;
- injected approved fake transform;
- wrong source/fingerprint/approval;
- range rounding;
- no exact percentile output.

### F. Balance task band

- all thresholds and invalid values.

### G. Balance benchmark

- every source age group;
- exact-age lookup;
- explicit age-group lookup;
- ambiguous age group;
- protocol incomplete;
- changed leg;
- no percentile/range output;
- exact source fixture values.

### H. Shoulder source table

- every age/sex/side row;
- table invariants;
- exact source fixtures;
- fingerprint.

### I. Shoulder classification

- below Q1;
- Q1;
- median;
- Q3;
- above Q3;
- missing sex;
- prefer-not-to-say;
- outside age;
- pain-limited;
- tracking uncertain;
- changed side;
- no higher-is-better output.

### J. Full engine

- complete eligible V2 record;
- mixed eligible/raw-only domains;
- one invalid domain;
- all raw-only;
- malformed V2 record;
- V1 rejected;
- future protocol rejected;
- deterministic output;
- JSON round-trip;
- no focus/score/snapshot fields.

### K. Architecture boundaries

- V1 scoring unchanged;
- V2 still rejected by V1 scorer;
- no V2 block/report;
- public battery V1;
- no UI integration.

### L. Regression

- Stage 3D-B.2A;
- Stage 2A.1;
- Stage 3B/3C/3D;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- navigation;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise production reference helpers;
- derive V2 raw results from real current V2 result types;
- verify exact source data fixtures;
- assert structured outputs;
- assert no mutation;
- assert fail-local behavior;
- use deterministic inputs;
- fail if chair reference becomes enabled accidentally;
- fail if a balance percentile/range appears;
- fail if shoulder above-range is marked better;
- fail if V1 norms are imported/used.

Tests must not:

- contact source websites;
- depend on network;
- use real camera hardware;
- install packages;
- use spreadsheet libraries at runtime;
- embed Warden workbook data;
- add UI snapshots;
- alter V1 expected scores.

# PART P — VALIDATION

## Targeted validation

Run targeted tests for:

- V2 reference-profile normalization;
- source registry;
- transformation registry;
- chair reference architecture;
- balance task band/benchmark;
- shoulder source/IQR;
- full V2 reference engine;
- Stage 3D-B.2A;
- V1 scoring containment;
- Stage 4 closure;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/pearl-stage3db2b-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2b-export
rc=$?
rm -rf /tmp/pearl-stage3db2b-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- source table row counts;
- source fingerprints;
- transform statuses;
- full suite/test counts;
- audio counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- git diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART Q — MANUAL SOURCE VERIFICATION AFTER TESTS

## Manual source trace

Retrace:

### Chair

```text
V2 chair raw result
-> protocol eligibility
-> reference profile
-> Warden source registry
-> transform unavailable
-> raw-only structured result
```

Then verify a test-only approved fake provider:

```text
explicit injected provider
-> provider identity validation
-> percentile uncertainty range
-> structured percentile-range output
```

Confirm no production provider exists.

### Balance

```text
V2 best valid seconds
-> Pearl task band
-> source-age-group lookup
-> published mean benchmark
```

Confirm no percentile/range.

### Shoulder

```text
V2 selected-side degrees
-> protocol eligibility
-> exact age bin
-> reference sex
-> side
-> Gill IQR row
-> neutral category
```

### Containment

Confirm no score, focus, snapshot, block, report, UI, or backend output.

# PART R — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product decisions implemented.
3. Initial Git status.
4. Current V2 raw input contract.
5. Reference engine architecture.
6. Reference-profile input types.
7. Result-kind and eligibility types.
8. Source registry.
9. Transformation registry.
10. Source/fingerprint integrity.
11. Chair source status.
12. Chair transform containment.
13. Chair percentile-range architecture.
14. Balance task-band behavior.
15. Balance source table and benchmark behavior.
16. Shoulder source table.
17. Shoulder IQR behavior.
18. Claim-eligibility composition.
19. Full engine behavior.
20. Fail-local behavior.
21. JSON/payload safety.
22. V1/UI/snapshot/focus containment.
23. Files changed.
24. Tests added/changed.
25. Exact source values/row counts used.
26. Exact targeted validation.
27. Exact full validation.
28. Audio verification.
29. App/website typechecks.
30. Expo config/export.
31. Stage 2A.1/3/4/5 regression verification.
32. Chair transform approval dependency.
33. Remaining Stage 3D-B work.
34. Whether Stage 3D-B.2C is unblocked.
35. Initial and final Git status.
36. Complete files-changed inventory.
37. Concurrent external changes.
38. Temporary-source cleanup.
39. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2B:

1. One pure V2 reference engine exists.
2. V1 input is rejected.
3. V2 raw metrics remain primary.
4. No Movement Age output exists.
5. No weakest/suggested focus output exists.
6. No score snapshot is created.
7. Claim eligibility never upgrades protocol evidence.
8. Missing profile data yields raw-only.
9. Outside-source age yields raw-only.
10. Chair transform is disabled by default.
11. No Warden formulas/parameters are embedded.
12. No chair percentile appears without an explicit approved provider.
13. Wrong chair provider identity fails closed.
14. Chair output never exposes an exact percentile.
15. Balance task bands use exact approved thresholds.
16. Balance values above 45 fail closed.
17. Balance benchmark uses exact primary-source age-group means.
18. Balance benchmark is not called a percentile or range.
19. Balance benchmark does not require reference sex.
20. Shoulder lookup uses exact Gill age/sex/side IQR.
21. Shoulder Q1/Q3 equality is within.
22. Shoulder above-range is neutral.
23. Shoulder missing sex yields raw-only.
24. Pain-limited shoulder yields raw-only.
25. Changed leg/side is marked longitudinally non-comparable.
26. Per-domain failure is local.
27. Source registry/fingerprints are deterministic.
28. Output is JSON-safe.
29. No runtime network is used.
30. Public/default Check-Up remains V1.
31. V2 remains rejected by V1 scoring/block/report paths.
32. No profile/UI/backend fields are added.
33. Stage 4/5 contracts remain.
34. Safety audio remains 44 cues / 88 assets.
35. App/website typechecks pass.
36. Expo config/export pass.
37. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2B complete unless:

1. Exact Springer benchmark values are verified from the primary source.

2. Exact Gill IQR values are verified from the primary source.

3. Source data integrity tests pass.

4. Chair transform remains unembedded and disabled.

5. Chair architecture safely supports a future approved transform.

6. Balance task bands are implemented and tested.

7. Balance benchmark metadata is implemented without percentile/range inference.

8. Shoulder IQR classification is implemented and tested.

9. Claim eligibility is deterministic and fail-closed.

10. Full V2 engine works with mixed eligibility.

11. V1 scoring/blocks/reports remain unchanged.

12. No UI/focus/snapshot/backend integration is added.

13. Targeted tests pass.

14. Full Jest passes.

15. `npm run verify:audio` passes.

16. App typecheck passes.

17. Website typecheck passes.

18. Expo config passes.

19. Expo export passes.

20. `git diff --check` passes.

21. No new warning is introduced without explanation.

22. No unrelated user work is reverted or overwritten.

23. No package install or lockfile change occurs.

24. No source PDF/workbook is committed.

25. Temporary source files are removed.

26. No staging, commit, branch, or push occurs.

If exact Springer or Gill source values cannot be directly verified, mark Stage 3D-B.2B blocked rather than inventing values.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2B COMPLETE`
- `STAGE 3D-B.2B BLOCKED`

Also state one for each:

- `V2 REFERENCE ENGINE IMPLEMENTED`
- `V2 REFERENCE ENGINE BLOCKED`

- `BALANCE TASK BAND AND BENCHMARK IMPLEMENTED`
- `BALANCE REFERENCE IMPLEMENTATION BLOCKED`

- `SHOULDER IQR REFERENCE IMPLEMENTED`
- `SHOULDER REFERENCE IMPLEMENTATION BLOCKED`

Also state exactly one:

- `CHAIR PERCENTILE-RANGE ARCHITECTURE READY, TRANSFORM DISABLED`
- `CHAIR PERCENTILE-RANGE ARCHITECTURE BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2C UNBLOCKED`
- `STAGE 3D-B.2C BLOCKED`

Use `STAGE 3D-B.2C UNBLOCKED` only if:

- V2 interpretation output is complete and JSON-safe;
- source/transformation identity is stable;
- raw-only chair behavior is explicit;
- balance and shoulder source outputs are deterministic;
- V1 containment remains green.

Also state:

- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION`
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`
- `NO SUGGESTED-FOCUS IMPLEMENTATION`
- `NO V2 SNAPSHOT OR BACKEND MIGRATION`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Pearl beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Reference engine architecture.
- V2 input contract.
- Source registry and fingerprints.
- Chair transform status.
- Chair percentile-range architecture result.
- Balance task-band thresholds/result.
- Balance source benchmark result.
- Shoulder source-table row count.
- Shoulder IQR classification result.
- Claim-eligibility behavior.
- Mixed-domain fail-local behavior.
- JSON-safety result.
- V1/UI/focus/snapshot/backend containment.
- Files changed.
- Tests added/changed.
- Exact primary sources used.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 3D-B.2A, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2B COMPLETE` or blocked.
- V2 reference-engine verdict.
- Balance verdict.
- Shoulder verdict.
- Chair architecture verdict.
- `STAGE 3D-B.2C UNBLOCKED` or blocked.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION`.
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`.
- `NO SUGGESTED-FOCUS IMPLEMENTATION`.
- `NO V2 SNAPSHOT OR BACKEND MIGRATION`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Temporary-source cleanup.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
