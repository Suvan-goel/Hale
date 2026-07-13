You are implementing Stage 3D-B.2D.1 of Pearl’s production-readiness work:

MOVEMENT PROFILE V2 DOMAIN-EVIDENCE CLASSIFICATION, SUGGESTED-FOCUS POLICY, LIFE-GOAL TIE-BREAKING, RETEST FOCUS STABILITY, BALANCED FALLBACK, AND IMMUTABLE V2 ASSESSMENT CONTRACT

This is the first Stage 3D-B.2D implementation pass following:

- Stage 3D-B.2A: internal V2 assessment protocols;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshots, persistence, sync, and restore.

Implement only the pure domain-evidence, suggested-focus, and Movement Profile V2 assessment contract.

Do not implement the Movement Profile screens, reference-details/profile UI, V2 Check-Up screen wiring, V2 block creation, balanced workout generation, reports, public routing, feature-flag rollout, Warden transform, longitudinal improvement claims, or physical-device validation in this task.

## Why this stage is deliberately narrower than the UI stage

Stage 3D-B.2C now freezes a complete official V2 snapshot, but intentionally stores no suggested focus, MovementAssessment, MovementBlock, report, or UI state.

Before screens or blocks consume V2 results, Pearl needs one deterministic contract answering:

> Given an immutable official V2 snapshot, the user’s explicitly selected life goal, and optional prior V2 focus context, what should Pearl describe as the suggested focus—or should it use a balanced plan?

That contract must be proven before UI and training integration, because the current V1 focus system compares incompatible Movement Age midpoints and cannot be reused.

Stage 3D-B.2D.1 must create that pure contract and keep it completely separate from V1 focus selection.

## Current verified baseline

### Stage 3D-B.2A

Implemented and internal only:

- `movement_profile_v2` Check-Up protocol policy;
- `chair-rise-30s-v2`;
- `one-leg-balance-45s-v2`;
- `active-shoulder-reach-v2`;
- setup, selected leg/side, retries, raw protocol evidence, and raw completeness;
- V1 scoring/block/report containment.

### Stage 3D-B.2B

Implemented pure interpretation engine:

- chair production result remains raw-only because the Warden transform is disabled;
- balance task bands:
  - `starting_point_low`;
  - `starting_point`;
  - `building`;
  - `ceiling_complete`;
- Springer benchmark metadata only, with no percentile or range inference;
- shoulder Gill IQR categories:
  - `below_published_middle_range`;
  - `within_published_middle_range`;
  - `above_published_middle_range`;
- source and transformation fingerprints;
- fail-local, JSON-safe outputs;
- no score, Movement Age, focus, snapshot, block, or UI.

### Stage 3D-B.2C

Implemented:

- immutable V2 snapshot schema version 1;
- stable ID:
  - `movement-profile-v2-snapshot:<encoded-source-checkup-id>`;
- source Check-Up fingerprint;
- snapshot/reference-profile fingerprints;
- official eligibility;
- strict parser;
- attachment conflict policy;
- local persistence/history;
- backend sync/restore;
- V1/V2 compatibility;
- no recomputation on restore;
- no suggested focus, MovementAssessment, MovementBlock, report, or UI route.

Stage 3D-B.2C validation passed:

- targeted: 15 suites / 223 tests;
- full Jest: 111 suites / 948 tests;
- audio: 44 cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

Re-run current counts rather than assuming they are unchanged.

## Product-owner decisions already approved

The product owner approved all recommended Stage 3D-B.1 defaults, including:

1. Replace exact Movement Age with a future Movement Profile.

2. Use transparent ordinal evidence rather than comparing incompatible numbers.

3. Use the wording concepts:
   - `Suggested focus`;
   - `clearest area to build`;
   - `based on your results and goal`.

4. Never use:
   - weakest system;
   - scientifically weakest;
   - movement age;
   - body age;
   - diagnosis;
   - fall risk;
   - impairment.

5. Use life goals to resolve close, mixed, or incomplete evidence.

6. Use a true `balanced` fallback rather than a hidden strength-first priority when no single domain is justified.

7. On official re-tests:
   - preserve the current V2 focus when evidence remains tied/ambiguous or no new clear candidate appears;
   - allow a new single clear candidate to replace the previous focus.

8. Raw-only evidence must never be silently interpreted as below reference.

9. Chair remains raw-only in production until an approved Warden transform exists.

10. Do not make longitudinal improvement/decline claims before physical-device validation.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect:

- src/adherence/types.ts
- src/adherence/goalDomainMapping.ts
- existing life-goal components/tests
- current V1 MovementAssessment types/builders
- current block eligibility/builders
- Stage 3D-B.2C snapshot parser/selectors
- Stage 3D-B.2B interpretation types
- current fingerprint utilities
- repository instructions such as AGENTS.md and CLAUDE.md.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2D.1 must:

1. Define one explicit V2 domain-evidence category contract.

2. Derive those categories only from the frozen V2 snapshot.

3. Never rerun the V2 reference engine.

4. Never read live profile/reference data.

5. Never compare incompatible numeric metrics.

6. Implement the approved deterministic suggested-focus policy.

7. Reuse the existing life-goal-to-domain mapping rather than creating a second mapping.

8. Freeze the life-goal input and mapped domains in focus provenance.

9. Support a first-class `balanced` focus mode.

10. Preserve a prior V2 focus on official re-test when policy says to preserve it.

11. Never preserve a V1 focus into the V2 policy.

12. Create a separate immutable `MovementProfileV2Assessment` contract.

13. Bind that assessment to one exact V2 snapshot and source Check-Up.

14. Add deterministic assessment ID/fingerprints and a strict parser.

15. Keep the assessment separate from the existing V1 `MovementAssessment`.

16. Do not persist, sync, display, or create a block from the V2 assessment in this task.

17. Add exhaustive deterministic tests and preserve all prior regressions.

## Scope boundary

This task may change:

- V2 domain-evidence types/helpers;
- V2 focus-policy constants and fingerprint;
- life-goal mapping adapter/version metadata;
- V2 suggested-focus selector;
- V2 prior-focus context type;
- V2 assessment type;
- V2 assessment builder/parser/validator;
- V2 assessment compatibility/provenance helpers;
- exports;
- focused tests;
- the Stage 3D-B.2D.1 remediation report.

This task must not change:

- V1 focus selection;
- V1 exact/near-tie policy;
- V1 MovementAssessment;
- V1 MovementBlock;
- V2 snapshot schema;
- V2 protocol controllers;
- V2 reference source tables/transforms;
- chair transform disabled status;
- life-goal definitions or their current product mappings;
- user profile fields;
- onboarding/profile UI;
- CheckUpScreen;
- Results/Progress/Home/Onboarding screens;
- block creation;
- workout generation;
- balanced block templates;
- backend sync/restore;
- feature flags;
- public/default battery;
- copy surfaces;
- scoring/norms;
- dependencies;
- lockfiles;
- audio assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Important cautions:

- The repository is heavily dirty with user-owned Stage 3D-B.2A/2B/2C, Stage 4/5, pose/native, diagnostics, auth, screens, and website work.
- The 88 Clara/Marcus safety MP3s and manifests are intended current assets.
- Do not delete or regenerate them.
- Do not inspect or expose `.env` values.
- Do not expose provider credentials.
- Do not modify or share font files.
- Inspect every current diff before touching a file.

Rules:

1. Treat every existing modified/untracked file as user-owned.

2. Do not revert, overwrite, reformat, move, or delete unrelated work.

3. Do not edit prior reports.

4. Do not use destructive Git commands.

5. Do not install packages.

6. Do not modify lockfiles.

7. Do not regenerate audio.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted existing slice covering:

- V2 protocol policy/controllers;
- V2 reference engine;
- V2 snapshot builder/parser;
- V2 history/sync/restore;
- V1 focus selection;
- V1 MovementAssessment/block eligibility;
- life-goal mapping;
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
rm -rf /tmp/pearl-stage3db2d1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d1-export
rc=$?
rm -rf /tmp/pearl-stage3db2d1-export
exit $rc
```

Do not install dependencies.

Record current counts and warnings.

# PART B — RECONSTRUCT CURRENT FOCUS AND GOAL ARCHITECTURE

## Step 1: Inspect V1 focus and assessment architecture

Inspect at minimum:

- src/scoring/focusSelection.ts
- src/scoring/scoreSnapshot.ts
- src/pearlFlow/assessments.ts
- src/pearlFlow/assessmentEligibility.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/pearlFlow/reports.ts
- related tests.

Document:

- current V1 focus domain type;
- current exact/near-tie metadata;
- current MovementAssessment identity;
- how block focus is derived;
- which fields must not be reused by V2.

Do not modify V1 behavior.

## Step 2: Inspect life-goal mapping

Inspect:

- src/adherence/goalDomainMapping.ts
- src/adherence/types.ts
- life-goal onboarding/tests;
- any current multi-domain or deterministic mapping behavior.

Document:

- all current goal IDs;
- current mapped domain(s);
- whether mapping returns one or multiple domains;
- current fallback behavior;
- current mapping version, if one exists.

Stage 3D-B.2D.1 must reuse the actual mapping.

Do not create a second independent mapping table.

If there is no explicit mapping version, add only a V2 adapter version/fingerprint over the current mapping without altering the mappings.

## Step 3: Inspect V2 snapshot contract

Use only:

- parsed `StoredMovementProfileV2Snapshot`;
- validated source Check-Up;
- frozen interpretation;
- frozen reference profile;
- frozen source/engine/display metadata.

Do not call `interpretMovementProfileV2`.

Do not read current source tables.

Do not read the live profile.

# PART C — V2 FOCUS POLICY VERSIONING

## Step 4: Add separate policy constants

Conceptually:

```ts
export const MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION = 1;
export const MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION = 1;
export const MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION = 1;
export const MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION = 1;
```

Requirements:

- separate from V1 focus policy version;
- separate from V2 snapshot schema;
- deterministic focus-policy fingerprint;
- deterministic life-goal mapping fingerprint;
- changed evidence mapping or focus priority changes the fingerprint;
- no ambient time/device/environment in fingerprints.

# PART D — DOMAIN-EVIDENCE CONTRACT

## Step 5: Define the approved categories

Use exactly these high-level categories unless current type conventions require equivalent names:

```ts
type MovementProfileV2DomainEvidenceCategory =
  | 'below_reference'
  | 'within_reference'
  | 'above_reference_or_ceiling'
  | 'pearl_starting_point'
  | 'pearl_building'
  | 'raw_only_valid'
  | 'invalid_or_missing';
```

Add structured provenance.

Conceptually:

```ts
type MovementProfileV2DomainEvidence = {
  domain: MovementDomain;
  category: MovementProfileV2DomainEvidenceCategory;
  evidenceSource:
    | 'published_reference'
    | 'pearl_task_band'
    | 'raw_only'
    | 'invalid';
  sourceResultKind: string;
  claimEligibility: string;
  focusEligible: boolean;
  reasons: readonly string[];
};
```

Requirements:

- JSON-safe;
- stable domain order;
- deterministic;
- no generic numeric score;
- no domain ranking number;
- no age;
- no percentile midpoint;
- no cross-domain arithmetic;
- no `weakestDomain`.

## Step 6: Chair evidence mapping

Production chair remains raw-only.

Rules:

1. Default production chair snapshot:
   - category `raw_only_valid` when raw metric is valid;
   - `focusEligible: false` for Check-Up-derived ordinal focus;
   - life goal may still select strength later.

2. Chair raw-only reasons include:
   - Warden transform disabled;
   - setup uncertainty;
   - protocol incomplete;
   - profile incomplete;
   - tracking uncertainty;
   - outside source age.

3. Raw-only chair must never become:
   - `below_reference`;
   - `pearl_starting_point`;
   - a severity score.

4. Future/test-only percentile-range snapshots:
   - `below_10` may map to `below_reference`;
   - `above_90` may map to `above_reference_or_ceiling`;
   - bounded percentile ranges must not drive focus in policy version 1 unless a separately approved percentile-to-focus policy exists.
   - For policy version 1, bounded ranges should remain focus-neutral, with explicit reason such as `chair_percentile_focus_threshold_not_approved`.

5. No exact percentile is read or derived.

This ensures the future architecture can evolve without silently creating a hidden chair threshold now.

## Step 7: Balance evidence mapping

Map the frozen Pearl task band:

```text
starting_point_low -> pearl_starting_point
starting_point -> pearl_starting_point
building -> pearl_building
ceiling_complete -> above_reference_or_ceiling
```

Rules:

- task-band evidence source is `pearl_task_band`, not published reference;
- Springer benchmark mean does not alter the category;
- do not compute distance from benchmark;
- do not label below/above the benchmark;
- changed standing leg does not invalidate current focus evidence;
- protocol/raw-only/incomplete/pain-limited/invalid behavior follows frozen claim/protocol evidence;
- retained raw-only balance with a valid task band may still provide Pearl-band focus evidence only when the raw measurement is valid and not pain-limited;
- invalid measurement -> `invalid_or_missing`.

## Step 8: Shoulder evidence mapping

Map frozen Gill IQR result:

```text
below_published_middle_range -> below_reference
within_published_middle_range -> within_reference
above_published_middle_range -> above_reference_or_ceiling
```

Rules:

- evidence source is `published_reference`;
- above is neutral, not “better”;
- pain-limited -> `raw_only_valid`, `focusEligible: false`;
- tracking/protocol/profile/reference unavailable -> `raw_only_valid`;
- invalid measurement -> `invalid_or_missing`;
- changed side does not invalidate current cross-sectional category;
- no numerical distance below Q1;
- no severity ranking from degrees.

## Step 9: Domain-evidence derivation

Add one pure helper:

```ts
deriveMovementProfileV2DomainEvidence(snapshot)
```

Requirements:

- accepts parsed supported V2 snapshot only;
- does not accept V1;
- no source Check-Up recomputation;
- no current reference-engine call;
- returns all three headline domains in stable order;
- fail-local diagnostics;
- input non-mutating;
- equal input -> equal output.

# PART E — LIFE-GOAL CONTEXT

## Step 10: Freeze life-goal context

Create a narrow explicit input.

Conceptually:

```ts
type MovementProfileV2LifeGoalContext =
  | {
      kind: 'selected';
      goalId: LifeGoalId;
      mappingAdapterVersion: number;
      mappingFingerprint: string;
      mappedDomains: readonly MovementDomain[];
    }
  | {
      kind: 'none';
      mappingAdapterVersion: number;
      mappingFingerprint: string;
      mappedDomains: readonly [];
    }
  | {
      kind: 'unknown_or_unsupported';
      rawGoalId?: string;
      mappingAdapterVersion: number;
      mappingFingerprint: string;
      mappedDomains: readonly [];
    };
```

Requirements:

- input is explicit;
- use existing goal mapping;
- no live profile read in pure selector;
- unknown goal fails to no mapping;
- mapped domains deduped and sorted;
- no hidden deterministic domain fallback;
- mapping fingerprint covers the current mapping relevant to V2.

## Step 11: Goal tie-break semantics

When choosing among candidate domains:

- exactly one mapped candidate -> choose it;
- zero mapped candidates -> goal does not break the tie;
- more than one mapped candidate -> goal does not break the tie;
- do not choose the first array item;
- do not use domain order as an implicit tie-break.

When no candidate set exists and evidence is all within/above/building/raw:

- one mapped domain -> goal-led domain focus;
- zero or multiple mapped domains -> balanced.

# PART F — PRIOR V2 FOCUS CONTEXT

## Step 12: Define explicit prior-focus context

Conceptually:

```ts
type MovementProfileV2PriorFocusContext =
  | {
      kind: 'domain';
      focusDomain: MovementDomain;
      sourceAssessmentId: string;
      sourceAssessmentFingerprint: string;
    }
  | {
      kind: 'balanced';
      sourceAssessmentId: string;
      sourceAssessmentFingerprint: string;
    }
  | {
      kind: 'none';
    };
```

Requirements:

- V2 only;
- never derive from V1 MovementAssessment or V1 MovementBlock;
- supplied explicitly;
- parser/normalizer fail closed;
- no current active-block lookup in the pure selector.

Prior focus may influence only an `official_retest`.

Ignore it for:

- baseline;
- baseline retake;
- manual/quick/legacy records.

# PART G — SUGGESTED-FOCUS DECISION CONTRACT

## Step 13: Define first-class focus modes

Conceptually:

```ts
type MovementProfileV2SuggestedFocus =
  | {
      kind: 'domain';
      focusDomain: MovementDomain;
      planMode:
        | 'checkup_reference_focus'
        | 'checkup_pearl_band_focus'
        | 'goal_led_reference_supported';
      reason: string;
      candidateDomains: readonly MovementDomain[];
    }
  | {
      kind: 'balanced';
      planMode: 'balanced_insufficient_reference';
      reason: string;
      candidateDomains: readonly MovementDomain[];
    }
  | {
      kind: 'needs_retake';
      planMode: 'needs_retake';
      reason: string;
      invalidDomains: readonly MovementDomain[];
    };
```

Adapt to current naming conventions.

Important:

- `balanced` is not a fake domain.
- Do not add `balanced` to the existing `MovementDomain` union.
- No hidden strength-first fallback.
- No generic `weakest`.
- No user-facing copy in this pure contract.

## Step 14: Implement the exact decision priority

Use this exact priority.

### Rule 0 — invalid raw evidence

If any required headline domain is `invalid_or_missing`:

- return `needs_retake`;
- list invalid domains;
- do not use the goal to conceal missing official raw evidence.

This should be unreachable for a valid Stage 3D-B.2C official snapshot, but the selector must still fail closed.

### Rule 1 — below-reference candidates

Build the set of domains with category `below_reference`.

#### Exactly one

- select that domain;
- `planMode = checkup_reference_focus`;
- it overrides a conflicting life goal;
- on retest, it may replace a previous focus;
- provenance records whether the goal differed.

#### Multiple

On official retest:

1. If prior domain focus is in the candidate set:
   - preserve it.
2. If prior focus is balanced:
   - do not preserve balanced when one goal uniquely resolves the candidate set;
   - otherwise balanced may remain.

Then:

3. If life goal maps uniquely to one candidate:
   - select that domain.
4. Otherwise:
   - return balanced.

No deterministic strength/balance/mobility fallback.

### Rule 2 — Pearl starting-point candidates

Only when there are no `below_reference` candidates.

Build domains with category `pearl_starting_point`.

#### Exactly one

- select that domain;
- `planMode = checkup_pearl_band_focus`.

#### Multiple

On official retest:

1. Preserve prior domain focus when it is in the candidate set.
2. Then use a unique life-goal overlap.
3. Otherwise balanced.

### Rule 3 — no clear low candidate

This includes combinations of:

- `within_reference`;
- `above_reference_or_ceiling`;
- `pearl_building`;
- `raw_only_valid`.

On official retest:

1. Preserve prior domain focus when it remains a valid headline domain.
2. Preserve prior balanced focus when no new clear low candidate exists.

Otherwise:

3. If life goal maps uniquely to one domain:
   - return that domain;
   - `planMode = goal_led_reference_supported`.
4. Otherwise:
   - return balanced.

### Rule 4 — raw-only evidence

Raw-only evidence:

- never becomes below reference;
- never wins because of metric magnitude;
- may coexist with a goal-led domain or balanced outcome;
- must be visible in provenance as incomplete comparison evidence.

### Rule 5 — life goal conflict

When one clear below-reference domain exists:

- clear below-reference wins;
- goal mapping is preserved in provenance;
- record reason `clear_reference_signal_overrides_goal` or equivalent;
- no copy is generated in this stage.

## Step 15: No near-tie arithmetic

Do not use:

- V1 5-year near-tie margin;
- age midpoints;
- percentile differences;
- shoulder degree differences;
- balance second differences;
- benchmark difference magnitude.

The ordinal policy itself defines ambiguity.

# PART H — FOCUS PROVENANCE

## Step 16: Define complete provenance

Conceptually:

```ts
type MovementProfileV2FocusProvenance = {
  focusPolicyVersion: number;
  focusPolicyFingerprint: string;
  domainEvidencePolicyVersion: number;
  domainEvidencePolicyFingerprint: string;

  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: string;

  domainEvidence: readonly MovementProfileV2DomainEvidence[];

  lifeGoalContext: MovementProfileV2LifeGoalContext;
  priorFocusContext: MovementProfileV2PriorFocusContext;

  candidateDomains: readonly MovementDomain[];
  excludedDomains: readonly {
    domain: MovementDomain;
    reasons: readonly string[];
  }[];

  decisionReason: string;
};
```

Requirements:

- complete enough to reproduce the decision without live profile reads;
- stable ordering;
- no raw source PDFs;
- no health free text;
- no hidden ranking score;
- no copy string;
- no block/template data.

# PART I — MOVEMENT PROFILE V2 ASSESSMENT CONTRACT

## Step 17: Define a separate V2 assessment type

Do not mutate the current V1 `MovementAssessment`.

Conceptually:

```ts
type MovementProfileV2Assessment = {
  kind: 'movement_profile_v2_assessment';
  schemaVersion: number;

  assessmentId: string;
  assessmentFingerprint: string;

  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType:
    | 'baseline'
    | 'baseline_retake'
    | 'official_retest';

  createdAt: string;

  focus: MovementProfileV2SuggestedFocus;
  focusProvenance: MovementProfileV2FocusProvenance;
};
```

Requirements:

- JSON-safe;
- immutable plain data;
- no V1 score;
- no Movement Age;
- no block;
- no report;
- no training plan;
- no display copy;
- no change interpretation.

## Step 18: Stable assessment ID

Use one stable assessment identity per V2 snapshot.

Conceptual format:

```text
movement-profile-v2-assessment:<encoded-snapshot-id>
```

Requirements:

- no random ID;
- no ambient clock;
- same source snapshot -> same assessment ID;
- different source snapshot -> different ID;
- life-goal/prior-focus differences change the fingerprint, not the ID;
- a later persistence stage must treat a same-ID/different-fingerprint assessment as a conflict.

## Step 19: Assessment fingerprint

Fingerprint all material assessment fields except `assessmentFingerprint`.

Include:

- schema;
- assessment ID;
- source snapshot/check-up identity;
- source type;
- createdAt;
- focus;
- complete provenance.

Requirements:

- deterministic canonical ordering;
- explicit createdAt input;
- no `new Date()` inside builder;
- changed life goal/prior focus/policy/evidence changes fingerprint;
- reuse current React-Native-compatible fingerprint utility.

# PART J — ASSESSMENT BUILDER AND PARSER

## Step 20: Add pure builder

Conceptually:

```ts
createMovementProfileV2Assessment({
  checkUp,
  snapshot,
  lifeGoal,
  priorFocus,
  createdAt,
})
```

Builder steps:

1. Parse/validate snapshot.
2. Validate exact source Check-Up binding.
3. Confirm official V2 source type.
4. Confirm raw-complete V2 snapshot.
5. Normalize life-goal context.
6. Normalize prior V2 focus context.
7. Derive domain evidence from frozen interpretation.
8. Select focus using the exact policy.
9. Build assessment/provenance.
10. Fingerprint.
11. Return typed diagnostics.

Requirements:

- no V2 reference-engine call;
- no source-table lookup;
- no live profile read;
- no current active-block read;
- no persistence;
- no block creation;
- input non-mutating;
- explicit createdAt;
- deterministic.

## Step 21: Official-source rules

Allow only snapshots sourced from:

- baseline;
- baseline retake;
- official retest.

Baseline/baseline retake:

- ignore prior focus for policy decisions.

Official retest:

- prior V2 focus may be used.

Reject:

- V1;
- manual/quick/micro/legacy;
- malformed/future snapshot;
- source mismatch;
- incomplete raw snapshot.

## Step 22: Add strict parser

Conceptually:

```ts
parseMovementProfileV2Assessment(value)
```

Validate:

- kind/schema;
- ID format;
- fingerprint;
- source IDs/fingerprints;
- official source type;
- ISO createdAt;
- focus union;
- plan mode/reason compatibility;
- candidate domains;
- domain-evidence completeness and order;
- life-goal context;
- prior-focus context;
- policy versions/fingerprints;
- no duplicate domains;
- no unknown domain;
- no forbidden V1/age fields.

Cross-field examples:

- domain focus must appear in candidate domains when candidates exist;
- reference focus mode requires reference-origin decision;
- Pearl-band focus mode requires Pearl starting-point origin;
- goal-led mode requires unique mapped domain;
- balanced has no `focusDomain`;
- needs-retake requires invalid domains;
- baseline cannot claim prior-focus preservation;
- retest preserve reason requires prior V2 context;
- raw-only domain cannot appear as a below-reference candidate;
- assessment source snapshot ID/fingerprint must match provenance.

Unsupported future schema fails closed.

# PART K — COMPATIBILITY AND NO-PERSISTENCE BOUNDARY

## Step 23: V1/V2 separation

Tests must prove:

- V2 assessment does not satisfy V1 MovementAssessment shape/parser;
- V1 MovementAssessment is not accepted by V2 parser;
- V2 focus selector does not import V1 `focusSelection`;
- V2 focus selector does not import V1 norms;
- V2 assessment does not create a MovementBlock;
- current block eligibility does not accept it yet.

## Step 24: No persistence in this stage

Do not add V2 assessment to:

- CheckUp;
- V2 snapshot;
- local history;
- backend rows;
- export;
- account data;
- current app state.

Stage 3D-B.2D.2 or later will decide where the assessment is frozen/persisted when the V2 UI/block pathway is wired.

The contract itself must be ready for later persistence.

# PART L — NO UI, COPY, OR BLOCK LEAKAGE

## Step 25: Preserve containment

Do not:

- import the new selector in App.tsx;
- call it from CheckUpScreen;
- call it from Results/Progress/Home/Onboarding;
- create user-facing strings;
- create a block;
- add balanced templates;
- add a V2 route;
- add profile fields;
- add a feature flag.

Add architecture-boundary tests where robust.

Do not use brittle whole-repository grep assertions when module-boundary tests suffice.

# PART M — OBSERVABILITY

## Step 26: Stable diagnostics

Use bounded reason codes such as:

- `v2_assessment_snapshot_invalid`;
- `v2_assessment_source_mismatch`;
- `v2_assessment_raw_incomplete`;
- `v2_domain_evidence_raw_only`;
- `v2_focus_single_below_reference`;
- `v2_focus_multiple_below_preserve_current`;
- `v2_focus_multiple_below_goal_tiebreak`;
- `v2_focus_multiple_below_balanced`;
- `v2_focus_single_pearl_starting_point`;
- `v2_focus_starting_point_preserve_current`;
- `v2_focus_goal_led`;
- `v2_focus_preserve_current_no_clear_candidate`;
- `v2_focus_balanced_no_unique_signal`;
- `v2_focus_needs_retake`;
- `v2_focus_clear_signal_overrides_goal`.

Include only:

- assessment/snapshot/check-up IDs;
- source type;
- domain keys;
- goal ID;
- policy versions/fingerprints;
- reason codes.

Exclude:

- raw frames/landmarks/video;
- auth data;
- source document text;
- free-text health notes;
- full profile payloads.

Pure helpers do not log.

# PART N — REQUIRED TEST MATRIX

## A. Policy/fingerprint integrity

- versions;
- deterministic focus-policy fingerprint;
- deterministic domain-evidence-policy fingerprint;
- changed mapping/policy changes fingerprint;
- no V1 policy reuse.

## B. Domain evidence

### Chair

- production raw-only transform-unapproved;
- setup uncertain;
- hand use/protocol incomplete;
- tracking uncertain;
- future test `below_10`;
- future test `above_90`;
- future bounded range remains focus-neutral;
- invalid raw.

### Balance

- starting_point_low;
- starting_point;
- building;
- ceiling_complete;
- raw-only protocol incomplete;
- pain-limited if represented;
- invalid;
- benchmark mean does not affect category.

### Shoulder

- below IQR;
- Q1/Q3 within;
- above IQR;
- pain-limited;
- profile incomplete;
- tracking uncertain;
- invalid;
- changed side still cross-sectional.

## C. Life-goal context

- every existing goal;
- no goal;
- unknown goal;
- one mapped domain;
- multiple mapped domains if current mapping supports them;
- deterministic mapping fingerprint;
- input non-mutation.

## D. Baseline focus decisions

- one below-reference domain;
- multiple below-reference + unique goal overlap;
- multiple below-reference + no goal -> balanced;
- one Pearl starting-point;
- multiple Pearl starting-point + unique goal;
- multiple Pearl starting-point + no goal -> balanced;
- all within/above/building + one-domain goal;
- all within/above/building + no/ambiguous goal -> balanced;
- mixed raw-only + goal;
- mixed raw-only + no goal -> balanced;
- invalid domain -> needs retake;
- clear below signal overrides conflicting goal;
- no deterministic strength fallback.

## E. Retest focus decisions

- one new clear below candidate replaces prior domain;
- multiple below includes prior domain -> preserve;
- multiple below excludes prior domain + unique goal -> goal;
- multiple below excludes prior + no goal -> balanced;
- one starting point replaces ambiguous prior;
- multiple starting includes prior -> preserve;
- no clear candidate preserves prior domain;
- no clear candidate preserves prior balanced;
- baseline ignores prior context;
- V1 prior context rejected/ignored.

## F. Assessment builder

- baseline;
- baseline retake;
- official retest;
- explicit createdAt;
- stable ID;
- stable fingerprint;
- changed goal changes fingerprint;
- changed prior focus changes fingerprint;
- changed snapshot changes ID/fingerprint;
- source mismatch;
- V1 snapshot;
- malformed/future snapshot;
- input non-mutation;
- no reference-engine call.

## G. Parser/cross-field validation

- valid domain focus;
- valid balanced;
- valid needs retake;
- bad fingerprint;
- bad policy version;
- bad source binding;
- duplicate/missing domain evidence;
- incompatible plan mode/reason;
- balanced with focus domain;
- goal-led without unique goal mapping;
- preserve reason without retest/prior context;
- raw-only used as below candidate;
- forbidden Movement Age/weakest fields;
- future schema.

## H. JSON safety

- stringify/parse;
- no functions;
- no Date;
- no NaN/infinity;
- no source document text;
- bounded diagnostics.

## I. Containment

- no V1 focus import;
- no V1 norm import;
- no MovementBlock creation;
- no UI/App integration;
- no persistence/backend mutation;
- public/default Check-Up remains V1.

## J. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 3D-B.2C;
- V1 exact/near-tie behavior unchanged;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- navigation;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- use real parsed V2 snapshots;
- exercise production domain-evidence and focus helpers;
- use deterministic IDs/timestamps;
- assert complete provenance;
- assert no input mutation;
- fail if raw-only becomes below reference;
- fail if a hidden deterministic fallback returns strength;
- fail if a V1 focus is preserved into V2;
- fail if suggested focus is added to the V2 snapshot;
- fail if a block is created.

Tests must not:

- mock every layer;
- assert only helper calls;
- use network;
- use camera hardware;
- install packages;
- embed Warden data;
- alter source tables;
- add UI snapshots;
- depend on wall-clock sleeps.

# PART O — VALIDATION COMMANDS

Run targeted tests for:

- V2 domain evidence;
- V2 focus policy;
- V2 assessment builder/parser;
- life-goal mapping;
- Stage 3D-B.2C snapshots;
- Stage 3D-B.2B reference engine;
- Stage 3D-B.2A protocols;
- V1 focus selection/assessment eligibility;
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
rm -rf /tmp/pearl-stage3db2d1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d1-export
rc=$?
rm -rf /tmp/pearl-stage3db2d1-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- policy fingerprints;
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

# PART P — MANUAL SOURCE TRACE AFTER TESTS

Retrace:

### Baseline with shoulder below reference

```text
official V2 snapshot
-> domain evidence
-> one below-reference domain
-> mobility suggested focus
-> immutable V2 assessment
```

### Baseline with balance starting point

```text
official V2 snapshot
-> no below-reference domain
-> balance Pearl starting point
-> balance suggested focus
```

### Mixed raw-only / no clear candidate

```text
official V2 snapshot
-> raw-only chair
-> balance building
-> shoulder within
-> life goal or balanced fallback
```

### Official retest

```text
official V2 retest snapshot
-> candidate set
-> prior V2 focus
-> preserve only when policy allows
```

### V1 containment

Confirm no V1 focus, block, UI, or snapshot mutation.

# PART Q — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product policies implemented.
3. Initial Git status.
4. Current V1 focus/assessment architecture.
5. Current V2 snapshot input contract.
6. Focus/domain-evidence version architecture.
7. Domain-evidence type.
8. Chair evidence behavior.
9. Balance evidence behavior.
10. Shoulder evidence behavior.
11. Life-goal mapping adapter.
12. Prior V2 focus context.
13. Exact focus-decision priority.
14. Balanced fallback behavior.
15. Retest focus-preservation behavior.
16. Focus provenance.
17. V2 assessment schema.
18. Assessment ID/fingerprint.
19. Builder/parser behavior.
20. V1/V2 containment.
21. No-persistence/UI/block boundary.
22. Payload/diagnostic safety.
23. Files changed.
24. Tests added/changed.
25. Exact targeted validation.
26. Exact full validation.
27. Audio verification.
28. App/website typechecks.
29. Expo config/export.
30. Stage 3D-B.2A/2B/2C and Stage 2A.1/3/4/5 regression verification.
31. Remaining Stage 3D-B work.
32. Whether Stage 3D-B.2D.2 is unblocked.
33. Initial and final Git status.
34. Complete files-changed inventory.
35. Concurrent external changes.
36. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2D.1:

1. One V2 domain-evidence policy exists.
2. One V2 suggested-focus policy exists.
3. V1 focus behavior is unchanged.
4. Domain evidence comes only from the frozen V2 snapshot.
5. The V2 reference engine is not rerun.
6. No live profile data is read.
7. No cross-domain numeric arithmetic is used.
8. Raw-only chair is not below reference.
9. Chair cannot drive production focus while transform remains disabled.
10. Balance starting-point bands may drive Pearl-band focus.
11. Springer benchmark means do not drive focus severity.
12. Shoulder below-IQR may drive reference focus.
13. Shoulder above-IQR is neutral.
14. Pain-limited evidence cannot become a clear deficit.
15. One below-reference domain wins.
16. Multiple below-reference domains use prior V2 focus, unique goal overlap, or balanced.
17. One Pearl starting-point domain wins only when no below-reference domain exists.
18. Multiple starting-point domains use prior V2 focus, unique goal overlap, or balanced.
19. No clear candidate uses prior V2 focus, unique life goal, or balanced.
20. No hidden deterministic strength-first fallback exists.
21. A clear below-reference result overrides a conflicting goal.
22. Balanced is a first-class focus mode, not a domain.
23. V1 focus is never preserved into V2.
24. Prior focus influences official retests only.
25. One separate immutable V2 assessment contract exists.
26. Assessment binds to exact V2 snapshot and source Check-Up.
27. Assessment ID/fingerprint are deterministic.
28. Builder uses explicit createdAt.
29. Parser fails closed.
30. Assessment contains complete focus provenance.
31. Assessment contains no Movement Age.
32. Assessment contains no weakest-domain field.
33. Assessment contains no block/report/UI copy.
34. No V2 assessment persistence or sync is added.
35. No MovementBlock is created.
36. Public/default Check-Up remains V1.
37. Stage 3D-B.2A/2B/2C contracts remain.
38. Stage 4/5 contracts remain.
39. Safety audio remains 44 cues / 88 assets.
40. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2D.1 complete unless:

1. Domain-evidence mapping is explicit and tested.

2. Focus policy exactly follows approved priority.

3. Balanced fallback is real and tested.

4. Life-goal tie-breaking reuses current mapping.

5. Retest focus preservation is explicit and V2-only.

6. Raw-only evidence cannot masquerade as reference deficit.

7. One strict V2 assessment contract exists.

8. Assessment builder/parser/fingerprints are deterministic.

9. V1 focus/assessment/block behavior is unchanged.

10. No UI, persistence, block, report, or feature-flag integration is added.

11. Targeted tests pass.

12. Full Jest passes.

13. `npm run verify:audio` passes.

14. App typecheck passes.

15. Website typecheck passes.

16. Expo config passes.

17. Expo export passes.

18. `git diff --check` passes.

19. No new warning is introduced without explanation.

20. No unrelated user work is reverted or overwritten.

21. No package install or lockfile change occurs.

22. No source PDF/workbook is committed.

23. No staging, commit, branch, or push occurs.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2D.1 COMPLETE`
- `STAGE 3D-B.2D.1 BLOCKED`

Also state one for each:

- `V2 DOMAIN-EVIDENCE POLICY IMPLEMENTED`
- `V2 DOMAIN-EVIDENCE POLICY BLOCKED`

- `V2 SUGGESTED-FOCUS POLICY IMPLEMENTED`
- `V2 SUGGESTED-FOCUS POLICY BLOCKED`

- `V2 ASSESSMENT CONTRACT IMPLEMENTED`
- `V2 ASSESSMENT CONTRACT BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2D.2 UNBLOCKED`
- `STAGE 3D-B.2D.2 BLOCKED`

Use `STAGE 3D-B.2D.2 UNBLOCKED` only if:

- focus decisions are deterministic;
- balanced is represented explicitly;
- provenance is complete;
- the V2 assessment is immutable and source-bound;
- V1 containment remains green;
- no UI/block/persistence leakage exists.

Also state:

- `BALANCED FOCUS MODE IMPLEMENTED AS CONTRACT ONLY`
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR CANNOT DRIVE PRODUCTION REFERENCE FOCUS`
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`
- `NO MOVEMENT PROFILE UI IMPLEMENTED`
- `NO REFERENCE PROFILE INPUT UI IMPLEMENTED`
- `NO V2 MOVEMENTBLOCK CREATED`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Pearl beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Domain-evidence categories.
- Chair focus-evidence behavior.
- Balance focus-evidence behavior.
- Shoulder focus-evidence behavior.
- Life-goal mapping behavior.
- Exact focus priority.
- Balanced fallback behavior.
- Retest preservation behavior.
- V2 assessment schema/ID/fingerprint.
- Source snapshot binding.
- V1 containment.
- No-persistence/UI/block containment.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 3D-B.2A/2B/2C, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2D.1 COMPLETE` or blocked.
- Domain-evidence verdict.
- Suggested-focus verdict.
- V2 assessment verdict.
- `STAGE 3D-B.2D.2 UNBLOCKED` or blocked.
- `BALANCED FOCUS MODE IMPLEMENTED AS CONTRACT ONLY`.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR CANNOT DRIVE PRODUCTION REFERENCE FOCUS`.
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`.
- `NO MOVEMENT PROFILE UI IMPLEMENTED`.
- `NO REFERENCE PROFILE INPUT UI IMPLEMENTED`.
- `NO V2 MOVEMENTBLOCK CREATED`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
