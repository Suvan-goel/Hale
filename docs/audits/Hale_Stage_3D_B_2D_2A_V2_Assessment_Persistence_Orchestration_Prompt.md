You are implementing Stage 3D-B.2D.2A of Hale’s production-readiness work:

IMMUTABLE MOVEMENT PROFILE V2 ASSESSMENT PERSISTENCE, OFFICIAL ARTIFACT ORCHESTRATION, LOCAL HISTORY, BACKEND SYNC/RESTORE, CONFLICT PROTECTION, AND PRIOR-V2-FOCUS SELECTION

This stage follows:

- Stage 3D-B.2A: internal V2 assessment protocols;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshot persistence/sync/restore;
- Stage 3D-B.2D.1: pure V2 domain-evidence, suggested-focus, balanced-fallback, and V2 assessment contract.

Implement only persistence and internal orchestration for the already-defined V2 assessment contract.

Do not implement Movement Profile screens, reference-details/profile UI, CheckUpScreen V2 wiring, V2 block creation, balanced workout generation, V2 reports, public routing, rollout flags, Warden chair transform, longitudinal improvement claims, or physical-device validation in this task.

## Why this stage is required

Stage 3D-B.2D.1 created a deterministic immutable assessment contract, but intentionally did not attach or persist it anywhere.

Before UI or block creation can consume V2 results, Hale must prove this invariant:

```text
one exact official V2 Check-Up
-> one exact immutable V2 snapshot
-> one exact immutable V2 assessment
```

The assessment shown or used later must not be recalculated from:

- live profile data;
- a changed life goal;
- a changed source table;
- current focus state;
- current block state;
- remote row ordering;
- restore-time recomputation.

This stage must freeze and preserve the assessment while keeping all user-facing and training integrations out of scope.

## Current verified baseline

### Stage 3D-B.2A

Internal V2 protocol layer:

- `movement_profile_v2`;
- `chair-rise-30s-v2`;
- `one-leg-balance-45s-v2`;
- `active-shoulder-reach-v2`;
- raw completeness;
- setup/evidence metadata;
- V1 scoring/block/report containment.

### Stage 3D-B.2B

Pure V2 interpretation engine:

- chair remains raw-only in production;
- no Warden formulas or workbook data embedded;
- balance Hale task bands and Springer benchmark metadata;
- shoulder Gill IQR categories;
- explicit reference-profile input;
- deterministic source and transformation fingerprints;
- no focus, snapshot, block, UI, backend write, network, environment read, or hidden clock.

### Stage 3D-B.2C

Immutable V2 snapshot layer:

- separate snapshot schema/version;
- stable snapshot ID and fingerprint;
- exact source-Check-Up binding;
- explicit frozen reference profile;
- full frozen V2 interpretation;
- local persistence/history;
- backend sync/restore;
- export preservation;
- immutable conflict policy;
- V1/V2 longitudinal incompatibility;
- no focus, MovementAssessment, MovementBlock, report, or UI.

### Stage 3D-B.2D.1

Pure V2 assessment contract:

- evidence categories:
  - `below_reference`;
  - `within_reference`;
  - `above_reference_or_ceiling`;
  - `hale_starting_point`;
  - `hale_building`;
  - `raw_only_valid`;
  - `invalid_or_missing`;
- chair production evidence remains raw-only and cannot drive reference focus;
- balance starting-point task bands may drive Hale-band focus;
- Springer benchmark means do not drive severity;
- shoulder below-IQR may drive reference focus;
- shoulder above-IQR is neutral;
- existing life-goal mapping is reused;
- true first-class `balanced` focus mode;
- official-retest-only prior V2 focus preservation;
- immutable `movement_profile_v2_assessment`;
- stable assessment ID/fingerprint;
- strict parser;
- no persistence, sync, UI, block, report, or public routing.

Stage 3D-B.2D.1 validation passed:

- targeted: 19 suites / 222 tests;
- full Jest: 112 suites / 961 tests;
- audio: 44 cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

Re-run the current baseline rather than assuming those counts remain unchanged.

## Product policy already approved

1. A V2 assessment is frozen historical truth, not a live view model.

2. One V2 snapshot has one stable V2 assessment identity.

3. The life goal used for the decision is frozen in assessment provenance.

4. The prior V2 focus context used for an official re-test is frozen in provenance.

5. A later life-goal/profile change must not rewrite a historical assessment.

6. A same-ID/different-fingerprint assessment is an immutable conflict.

7. Existing frozen local truth must not be silently replaced by remote conflict data.

8. Missing or malformed assessment data must not destroy:
   - the raw V2 Check-Up;
   - a valid V2 snapshot.

9. Restore must parse; it must never rerun:
   - the V2 reference engine;
   - domain-evidence derivation;
   - focus selection;
   - assessment creation.

10. V1 and V2 histories remain separate.

11. No V2 assessment may populate V1 `weakestDomain`, V1 score fields, or V1 focus columns.

12. The balanced focus mode remains a contract only until the later block-generation stage.

13. Chair remains raw-only and cannot drive production reference focus while the Warden transform is disabled.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect:

- repository instructions such as AGENTS.md and CLAUDE.md;
- current Check-Up/history serialization;
- Stage 3D-B.2C snapshot attachment pattern;
- current check-up backend sync/restore;
- data export/account-data flows;
- current local-scope/account-scoping helpers;
- current duplicate/upsert authority rules;
- current life-goal storage and mapping;
- all relevant tests.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2D.2A must:

1. Define a persistence/orchestration policy version for V2 assessments.

2. Add a strict assessment attachment validator.

3. Bind an assessment to:
   - one exact V2 snapshot;
   - one exact source V2 Check-Up.

4. Attach at most one immutable V2 assessment to a source Check-Up/history artifact.

5. Add idempotent same-fingerprint behavior.

6. Add same-ID/different-fingerprint conflict protection.

7. Freeze the explicit life-goal context used at creation.

8. Select prior V2 focus for official re-tests deterministically from valid earlier V2 assessments only.

9. Never use V1 focus as prior V2 context.

10. Add a pure official artifact orchestrator:

```text
official complete V2 Check-Up
-> existing or newly created V2 snapshot
-> existing or newly created V2 assessment
-> updated immutable Check-Up/history artifact
```

11. Preserve an existing frozen snapshot/assessment instead of recalculating it.

12. Persist V2 assessment locally.

13. Sync it through bounded existing backend JSON.

14. Restore it without recomputation.

15. Resolve local/remote duplicates deterministically.

16. Preserve it through account-data export.

17. Clear it with the source Check-Up.

18. Add selectors for valid official V2 assessments and prior-focus context.

19. Keep the assessment out of current UI, reports, blocks, and public routing.

20. Preserve all Stage 2A/3/4/5 regressions.

## Scope boundary

This task may change:

- V2 assessment persistence/orchestration constants;
- V2 assessment source-binding validator;
- V2 assessment attachment helper;
- V2 official-assessment persistence eligibility;
- V2 prior-assessment/focus selectors;
- V2 official-artifact orchestrator;
- Check-Up type to hold an optional V2 assessment;
- local history serialization/normalization;
- check-up history selectors;
- backend check-up sync sanitization;
- backend restore/deduplication;
- data export/account-data mapping where necessary;
- focused tests;
- the Stage 3D-B.2D.2A remediation report.

This task must not change:

- V2 assessment focus rules;
- V2 assessment schema semantics;
- V2 snapshot schema semantics;
- V2 protocol controllers;
- V2 reference source tables/transforms;
- Warden transform status;
- V1 focus selection;
- V1 MovementAssessment;
- V1 MovementBlock;
- exact-age/reference-sex profile fields;
- life-goal definitions or mappings;
- UI/screens/navigation;
- suggested-focus copy;
- Movement Profile result cards;
- block creation;
- balanced training templates;
- reports;
- public/default battery;
- feature flags;
- workout generation;
- exercise catalogue;
- native pose code;
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

- The repository has contained a heavily dirty user-owned worktree throughout the Stage 3D-B/4/5 programme.
- Stage 3D-B.2D.1 reported that a larger initial dirty set was externally cleaned during its run; do not assume ownership of current remaining changes.
- Unrelated screen/theme/native/diagnostic/auth/website work may remain.
- The 88 Clara/Marcus safety MP3s and manifests are intended assets.
- Do not delete or regenerate them.
- Do not inspect or expose `.env` values.
- Do not expose provider credentials.
- Do not modify or share font files.

Rules:

1. Treat every existing modified/untracked file as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not regenerate audio.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe and unambiguous;
    - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted existing slice covering:

- Stage 3D-B.2A protocols;
- Stage 3D-B.2B reference engine;
- Stage 3D-B.2C snapshots/history/sync/restore;
- Stage 3D-B.2D.1 assessment;
- V1 focus/assessment/block eligibility;
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
rm -rf /tmp/hale-stage3db2d2a-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2a-export
rc=$?
rm -rf /tmp/hale-stage3db2d2a-export
exit $rc
```

Do not install dependencies.

Record current counts and warnings.

# PART B — RECONSTRUCT THE CURRENT ARTIFACT ARCHITECTURE

## Step 1: Inspect the Stage 3D-B.2C snapshot persistence pattern

Inspect at minimum:

- src/checkup/types.ts
- src/reference/movementProfileV2/snapshot.ts
- src/reference/movementProfileV2/assessment.ts
- src/reference/movementProfileV2/index.ts
- src/history/serialize.ts
- src/haleFlow/checkupHistory.ts
- src/services/backend/checkupSyncService.ts
- src/services/backend/restoreService.ts
- src/services/backend/dataExportService.ts
- src/services/backend/accountDataService.ts
- relevant tests.

Document:

- how snapshot is held in memory;
- how snapshot is stored in serialized history;
- whether nested raw-Check-Up copies are stripped;
- how source binding is validated;
- how sync/restore represent snapshot;
- how conflicts are resolved;
- how local/remote duplicate Check-Ups are selected.

Mirror the current validated pattern rather than inventing a parallel storage system.

## Step 2: Inspect the V2 assessment contract

Document exact current:

- assessment kind/schema;
- ID format;
- fingerprint;
- source snapshot/check-up fields;
- source type;
- createdAt;
- focus union;
- life-goal context;
- prior-focus context;
- provenance;
- parser;
- diagnostics.

Do not hand-copy the contract into a second divergent stored type unless a narrow storage wrapper is required.

# PART C — PERSISTENCE AND ORCHESTRATION VERSIONS

## Step 3: Add narrow policy constants

Conceptually:

```ts
export const MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_VERSION = 1;
export const MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_VERSION = 1;
```

Requirements:

- separate from assessment schema;
- separate from snapshot schema;
- deterministic policy fingerprints if persisted;
- no ambient time/environment/device input;
- do not bump V1 versions;
- do not change Stage 3D-B.2D.1 focus policy.

Only add constants that are materially useful to validate persisted/orchestrated data.

# PART D — ASSESSMENT SOURCE BINDING

## Step 4: Add strict source-binding validation

Create a pure validator, conceptually:

```ts
validateMovementProfileV2AssessmentSource({
  checkUp,
  snapshot,
  assessment,
})
```

It must verify:

- Check-Up is `movement_profile_v2`;
- Check-Up source type is official:
  - baseline;
  - baseline retake;
  - official retest;
- snapshot parses;
- snapshot binds to the exact Check-Up;
- assessment parses;
- assessment `sourceSnapshotId` equals snapshot ID;
- assessment `sourceSnapshotFingerprint` equals snapshot fingerprint;
- assessment `sourceCheckUpId` equals Check-Up ID;
- assessment source type equals snapshot/Check-Up source type;
- assessment provenance source IDs/fingerprints match;
- assessment ID has the stable expected derivation from the snapshot ID;
- no V1 object satisfies the validator.

Return stable reasons.

Do not rerun:

- the reference engine;
- domain-evidence derivation;
- focus selection.

## Step 5: Official assessment persistence eligibility

Create one pure helper.

Eligible:

- valid source-bound V2 assessment;
- official V2 source Check-Up;
- valid V2 snapshot;
- focus kind:
  - `domain`;
  - `balanced`.

Ineligible:

- `needs_retake`;
- V1;
- manual/quick/micro/legacy source;
- partial/malformed source;
- unsupported/future schema;
- source mismatch;
- snapshot mismatch;
- malformed provenance;
- conflicting IDs/fingerprints.

Missing exact age/reference sex is allowed because the snapshot may legitimately contain raw-only interpretation.

Chair transform disabled is allowed.

# PART E — ATTACHMENT AND IMMUTABILITY

## Step 6: Add the optional assessment field

Mirror the Stage 3D-B.2C snapshot pattern.

Conceptually:

```ts
movementProfileV2Assessment?: MovementProfileV2Assessment;
```

Requirements:

- V1 Check-Ups cannot carry a valid V2 assessment;
- V2 Check-Up may carry:
  - raw only;
  - raw + snapshot;
  - raw + snapshot + assessment;
- assessment without a valid matching snapshot fails closed;
- old records without the field remain readable;
- no V1 `MovementAssessment` is nested or converted.

If history uses a top-level artifact separate from raw `checkUp`, preserve the same anti-duplication pattern used by V2 snapshot storage.

## Step 7: Add immutable attach helper

Conceptually:

```ts
attachMovementProfileV2Assessment({
  checkUp,
  snapshot,
  assessment,
})
```

Rules:

1. Validate source binding.

2. No existing assessment:
   - attach.

3. Existing assessment with same ID and same fingerprint:
   - idempotent no-op.

4. Existing assessment with same ID but different fingerprint:
   - immutable conflict;
   - preserve existing;
   - return conflict diagnostic.

5. Existing assessment with a different ID:
   - reject;
   - preserve existing.

6. Assessment referencing a different snapshot:
   - reject.

7. Assessment without snapshot:
   - reject.

Never silently overwrite.

# PART F — PRIOR V2 ASSESSMENT SELECTION

## Step 8: Add official V2 assessment selectors

Add pure selectors analogous to V2 snapshot selectors:

- all valid official V2 assessments;
- latest valid official V2 assessment;
- assessment for source Check-Up ID;
- assessment for source snapshot ID;
- latest valid official V2 assessment before a given source Check-Up.

Requirements:

- exact source/snapshot validation;
- official V2 only;
- V1 excluded;
- malformed/mismatched assessment excluded;
- deterministic ordering;
- input order independent;
- duplicate identical artifacts deduped;
- same-ID conflict handled deterministically and surfaced;
- no focus/block/UI creation.

## Step 9: Build prior-focus context deterministically

Create a pure helper for official re-test creation.

Conceptually:

```ts
priorMovementProfileV2FocusContextForCheckUp({
  currentCheckUp,
  acceptedHistory,
})
```

Rules:

### Baseline / baseline retake

- return `none`.

### Official retest

- select the latest valid earlier V2 assessment;
- source Check-Up must predate the current source Check-Up by the repository’s stable Check-Up chronology;
- exclude the current source;
- exclude future/equal ambiguous sources;
- exclude V1;
- exclude malformed/conflicted assessments;
- convert:
  - prior domain focus -> domain prior context;
  - prior balanced focus -> balanced prior context.

Do not use:

- current V1 MovementBlock focus;
- V1 MovementAssessment;
- current live profile;
- current active training state;
- domain-order fallback.

## Step 10: Missing prior artifact on restore

A frozen current assessment may reference a prior V2 assessment ID/fingerprint not currently present on the device.

Policy:

- the current assessment remains structurally valid when its own source binding/fingerprint passes;
- missing prior artifact produces a non-blocking `prior_context_artifact_unavailable` diagnostic;
- do not recompute or discard the current assessment solely because older history has not restored;
- when creating a new assessment, prior context must come from an actually accepted prior artifact.

# PART G — OFFICIAL ARTIFACT ORCHESTRATION

## Step 11: Add one pure orchestration result union

Conceptually:

```ts
type MovementProfileV2ArtifactOrchestrationResult =
  | {
      status: 'ready';
      checkUp: CheckUp;
      snapshot: StoredMovementProfileV2Snapshot;
      assessment: MovementProfileV2Assessment;
      snapshotAction: 'created' | 'reused';
      assessmentAction: 'created' | 'reused';
      diagnostics: readonly ...[];
    }
  | {
      status:
        | 'unsupported_source'
        | 'snapshot_ineligible'
        | 'snapshot_conflict'
        | 'assessment_ineligible'
        | 'assessment_conflict'
        | 'needs_retake';
      checkUp: CheckUp;
      diagnostics: readonly ...[];
    };
```

Adapt to repository conventions.

## Step 12: Add the pure orchestrator

Conceptually:

```ts
materializeOfficialMovementProfileV2Artifacts({
  checkUp,
  referenceProfile,
  lifeGoalId,
  acceptedHistory,
  snapshotCreatedAt,
  assessmentCreatedAt,
})
```

Required sequence:

1. Validate official V2 source.

2. Inspect existing attached/stored snapshot.

3. If valid existing snapshot:
   - reuse it;
   - do not rerun the reference engine.

4. If no snapshot:
   - create through the existing Stage 3D-B.2C builder using explicit reference profile and explicit timestamp;
   - attach immutably.

5. If an existing snapshot conflicts with the newly proposed reference profile/material:
   - preserve existing frozen snapshot;
   - return conflict;
   - do not rewrite.

6. Inspect existing attached/stored assessment.

7. If valid existing assessment:
   - reuse it;
   - do not rerun focus selection.

8. If no assessment:
   - freeze life-goal context from explicit `lifeGoalId`;
   - derive prior V2 focus through the accepted-history selector;
   - call the existing Stage 3D-B.2D.1 assessment builder with explicit timestamp;
   - attach immutably.

9. If existing assessment conflicts with a newly proposed life goal/prior context:
   - preserve existing frozen assessment;
   - return/reveal conflict;
   - do not overwrite.

10. Return an updated in-memory Check-Up/history artifact.

Requirements:

- no persistence side effect inside the pure orchestrator;
- no backend call;
- no ambient clock;
- no live profile read;
- no current block read;
- no UI;
- no MovementBlock;
- deterministic.

## Step 13: Snapshot/profile conflict semantics

When an existing valid snapshot is already frozen:

- the orchestrator must use the snapshot’s frozen reference profile;
- a newly supplied different reference profile must not trigger recomputation;
- return a stable conflict/ignored-live-input diagnostic;
- existing snapshot remains authority.

This protects historical truth when age/reference inputs later change.

## Step 14: Assessment/life-goal conflict semantics

When an existing valid assessment is already frozen:

- a changed life goal must not create a second assessment for the same snapshot;
- a changed prior-focus history must not rewrite it;
- same ID/different proposed fingerprint is a conflict;
- existing assessment remains authority.

# PART H — LOCAL SERIALIZATION AND HISTORY

## Step 15: Local history serialization

Update the current Check-Up/history serializer.

Requirements:

- raw V2 Check-Up round-trips;
- V2 snapshot round-trips;
- V2 assessment round-trips;
- V1 snapshot/history unchanged;
- old records without V2 assessment remain readable;
- malformed assessment is omitted while valid raw/snapshot remain;
- assessment without matching snapshot is omitted;
- no read-time assessment creation;
- no read-time focus recomputation;
- no live life-goal/profile read.

If the serialized history artifact stores snapshot top-level, store assessment top-level beside it.

Avoid duplicate nested copies.

## Step 16: History selector behavior

Selectors must:

- use accepted parsed artifacts only;
- verify source binding;
- preserve official chronology;
- ignore malformed/mismatched assessment;
- keep snapshot-only Check-Ups usable for later remediation/UI states;
- not fabricate an assessment when missing.

# PART I — BACKEND SYNC

## Step 17: Preserve V2 assessment through bounded Check-Up JSON

Use the existing Check-Up JSON architecture.

Do not add a database migration unless current JSON cannot preserve the bounded assessment.

Requirements:

- explicit sanitizer;
- preserve assessment kind/schema/ID/fingerprint;
- preserve source binding;
- preserve focus union;
- preserve full bounded provenance;
- preserve life-goal and prior-focus contexts;
- no arbitrary object spread;
- no functions;
- no source PDFs/table content;
- no frames/landmarks/video;
- no auth data;
- no provider secrets;
- no user-facing prose.

## Step 18: Do not populate V1 compact fields

For a V2 Check-Up/assessment:

- do not populate V1 age scores;
- do not populate V1 weakest-domain field;
- do not populate V1 focus-selection metadata;
- do not create a V1 MovementAssessment row;
- do not create a MovementBlock row;
- do not create a report row.

If the backend schema has a generic focus column used by V1, leave it null/absent for V2 unless the current schema explicitly stores arbitrary V2 JSON there without V1 consumers. Prefer bounded JSON only.

## Step 19: Sync behavior

- valid attached assessment -> sync;
- no assessment -> sync raw + snapshot only;
- malformed/mismatched assessment -> omit assessment, preserve raw + snapshot;
- assessment conflict -> preserve accepted frozen local artifact and emit safe diagnostic;
- sync must not call:
  - V2 reference engine;
  - focus selector;
  - assessment builder.

V1 sync remains unchanged.

# PART J — BACKEND RESTORE

## Step 20: Restore behavior

Restore must:

1. Restore raw V2 Check-Up.

2. Parse and validate V2 snapshot.

3. Parse and validate V2 assessment.

4. Validate assessment against the accepted snapshot and source Check-Up.

5. Attach valid assessment.

6. Omit invalid/mismatched/future assessment.

7. Preserve valid raw/snapshot when assessment is omitted.

8. Never recreate an assessment from snapshot.

9. Never rerun focus selection.

10. Never create V1 assessment/block/report output.

## Step 21: Local/remote duplicate resolution

For the same Check-Up identity:

### Local valid assessment, remote missing

Keep local.

### Local missing, remote valid

Use remote if source/snapshot binding passes.

### Identical valid fingerprints

Deduplicate.

### Same assessment ID, different fingerprints

Immutable conflict.

Recommended policy:

- preserve already accepted local assessment when present;
- otherwise choose deterministically under current restore authority/order;
- emit conflict diagnostic;
- do not merge focus/provenance fields;
- do not recompute.

### Snapshot conflict first

An assessment may be accepted only if it references the snapshot selected by the restore conflict policy.

A remote assessment referencing a rejected conflicting snapshot must be rejected.

## Step 22: Unsupported future versions

- do not crash;
- restore raw Check-Up;
- restore supported snapshot if valid;
- omit/quarantine unsupported assessment according to current conventions;
- do not downgrade/rewrite;
- do not infer focus from payload fields.

# PART K — EXPORT, ACCOUNT DATA, AND CLEAR

## Step 23: Data export

If export includes Check-Up JSON:

- preserve bounded V2 assessment;
- label kind/schema;
- preserve source/focus provenance;
- do not add user-facing interpretation text;
- do not add source documents;
- do not expose provider secrets;
- do not include frames/landmarks/video.

If existing export already preserves sanitized JSON, prove with tests.

## Step 24: Account/local clear

Verify the V2 assessment is removed with the source Check-Up under:

- sign-out-and-clear;
- local account-data deletion;
- full local reset.

Do not create an orphan assessment store.

# PART L — V1/V2 AND LONGITUDINAL BOUNDARIES

## Step 25: Preserve strict V1 separation

Tests must prove:

- V2 assessment is not a V1 `MovementAssessment`;
- V1 assessment is not parsed as V2;
- V2 assessment does not make V1 block eligibility pass;
- V2 assessment does not populate V1 focus fields;
- V2 assessment does not enter V1 reports;
- V2 assessment does not change current V1 UI.

## Step 26: Assessment compatibility helper

Add only if materially useful for later UI.

Allowed structured output:

- same V2 assessment policy/fingerprint family;
- incompatible V1/V2;
- changed source snapshot;
- changed policy version;
- raw/reference comparability remains delegated to snapshot compatibility.

Do not calculate:

- improvement;
- decline;
- focus improvement;
- percentile change;
- effect size.

# PART M — NO UI, BLOCK, OR FEATURE LEAKAGE

## Step 27: Architecture containment

Do not import or call the new orchestrator from:

- App.tsx;
- CheckUpScreen;
- ResultsScreen;
- OnboardingResultsScreen;
- ProgressScreen;
- Home/Today;
- reports;
- current block creation;
- current navigation.

Do not add:

- a V2 route;
- reference-details UI;
- Movement Profile cards;
- user-facing copy;
- feature flag;
- profile fields;
- balanced block template.

Architecture tests should protect this boundary without brittle whole-repository snapshots.

# PART N — OBSERVABILITY AND PRIVACY

## Step 28: Stable diagnostics

Use bounded codes such as:

- `v2_assessment_source_mismatch`;
- `v2_assessment_snapshot_mismatch`;
- `v2_assessment_ineligible`;
- `v2_assessment_needs_retake`;
- `v2_assessment_conflict`;
- `v2_assessment_future_schema`;
- `v2_assessment_omitted_on_sync`;
- `v2_assessment_omitted_on_restore`;
- `v2_assessment_prior_context_unavailable`;
- `v2_artifact_snapshot_reused`;
- `v2_artifact_assessment_reused`;
- `v2_artifact_reference_profile_conflict`;
- `v2_artifact_life_goal_conflict`.

Include only:

- Check-Up ID;
- snapshot ID/fingerprint;
- assessment ID/fingerprint;
- source type;
- policy versions/fingerprints;
- goal ID;
- domain IDs;
- reason codes.

Exclude:

- raw frames/landmarks/video;
- auth data;
- source document content;
- free-text symptoms;
- full profile payloads;
- provider secrets.

Pure helpers do not log.

# PART O — REQUIRED TEST MATRIX

## A. Source binding

- valid Check-Up/snapshot/assessment;
- wrong Check-Up;
- wrong snapshot ID;
- wrong snapshot fingerprint;
- wrong source type;
- V1 source;
- malformed/future assessment;
- provenance mismatch.

## B. Persistence eligibility

- domain focus;
- balanced focus;
- needs-retake rejected;
- baseline;
- baseline retake;
- official retest;
- manual/quick/micro/legacy rejected;
- missing exact age allowed;
- unknown reference sex allowed;
- chair transform disabled allowed.

## C. Attachment immutability

- attach once;
- identical reattach idempotent;
- same ID/different fingerprint conflict;
- different ID rejected;
- no snapshot rejected;
- source mismatch rejected;
- existing assessment preserved.

## D. Prior assessment selectors

- baseline returns none;
- baseline retake returns none;
- official retest selects latest prior V2;
- multiple prior assessments;
- equal/future timestamps excluded;
- V1 excluded;
- malformed excluded;
- duplicate identical deduped;
- conflicting prior excluded/surfaced;
- domain prior;
- balanced prior.

## E. Orchestration

- no snapshot/no assessment -> creates both;
- existing snapshot/no assessment -> reuses snapshot, creates assessment;
- existing snapshot/existing assessment -> reuses both;
- existing snapshot with different live reference profile -> preserves snapshot/conflict;
- existing assessment with changed life goal -> preserves assessment/conflict;
- baseline ignores prior;
- retest uses prior V2 focus;
- no prior retest context;
- clear new candidate replaces prior through existing 2D.1 policy;
- deterministic explicit timestamps;
- no input mutation;
- no persistence side effect.

## F. Local serialization/history

- raw + snapshot + assessment round-trip;
- assessment malformed -> raw + snapshot remain;
- assessment without snapshot omitted;
- V1 unchanged;
- old record without assessment;
- selectors deterministic;
- no read-time creation.

## G. Backend sync

- valid assessment sanitized;
- missing assessment;
- malformed assessment omitted;
- no V1 compact focus/age fields;
- V1 sync unchanged;
- no sensitive payloads;
- no builder/reference-engine calls.

## H. Backend restore

- valid restore;
- raw + snapshot only;
- malformed/future assessment;
- source mismatch;
- local valid/remote missing;
- local missing/remote valid;
- identical duplicate;
- conflict;
- conflicting snapshot/assessment;
- no recomputation;
- raw/snapshot preservation.

## I. Export/clear

- bounded assessment exported;
- sensitive keys stripped;
- account clear removes assessment with source Check-Up;
- no orphan store.

## J. Containment

- no App/UI imports;
- no MovementBlock;
- no report;
- no feature flag;
- no profile field;
- public/default Check-Up remains V1.

## K. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 3D-B.2C;
- Stage 3D-B.2D.1;
- V1 focus/assessment/block;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- navigation;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise production attach/orchestrator/serializer/sync/restore helpers;
- use real parsed V2 snapshots and assessments;
- use explicit deterministic IDs/timestamps;
- assert exact source binding;
- assert frozen life-goal/prior context;
- assert no recomputation;
- assert conflict preservation;
- assert raw/snapshot survival when assessment fails;
- assert V1 compact fields remain empty for V2.

Tests must not:

- mock every layer;
- assert only helper calls;
- use network;
- use camera hardware;
- install packages;
- embed Warden data;
- change focus rules;
- add UI snapshots;
- depend on wall-clock sleeps.

# PART P — VALIDATION COMMANDS

Run targeted tests for:

- V2 assessment contract;
- V2 assessment persistence/orchestration;
- V2 snapshot;
- local history serialization;
- check-up history selectors;
- check-up backend sync;
- backend restore;
- data export/account clear;
- V1 focus/assessment/block containment;
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
rm -rf /tmp/hale-stage3db2d2a-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2a-export
rc=$?
rm -rf /tmp/hale-stage3db2d2a-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
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

# PART Q — MANUAL SOURCE TRACE AFTER TESTS

Retrace:

### New baseline artifacts

```text
official V2 baseline
-> snapshot builder
-> frozen life goal
-> no prior focus
-> V2 assessment
-> local serialized history
```

### Official retest artifacts

```text
official V2 retest
-> valid V2 snapshot
-> latest prior valid V2 assessment
-> frozen prior focus
-> V2 assessment
```

### Existing frozen artifacts

```text
existing snapshot + existing assessment
-> orchestrator
-> reuse without recomputation
```

### Changed live inputs

```text
existing frozen assessment
+ changed life goal/reference profile
-> immutable conflict
-> existing frozen artifacts preserved
```

### Backend restore

```text
raw Check-Up + snapshot + assessment
-> parse
-> source-bind
-> restore
```

Confirm no reference/focus engine call.

### Containment

Confirm no UI, block, report, profile, or public route.

# PART R — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product policies implemented.
3. Initial Git status.
4. Existing snapshot/assessment architecture.
5. Persistence/orchestration versioning.
6. Assessment source-binding validation.
7. Official assessment persistence eligibility.
8. Assessment attachment/immutability.
9. Prior V2 assessment selectors.
10. Prior-focus context derivation.
11. Official artifact orchestrator.
12. Existing snapshot/reference-profile conflict behavior.
13. Existing assessment/life-goal conflict behavior.
14. Local serialization/history.
15. Backend sync.
16. Backend restore.
17. Duplicate/conflict resolution.
18. Export/account-clear behavior.
19. V1/V2 containment.
20. No UI/block/report/feature boundary.
21. Payload/diagnostic safety.
22. Files changed.
23. Tests added/changed.
24. Exact targeted validation.
25. Exact full validation.
26. Audio verification.
27. App/website typechecks.
28. Expo config/export.
29. Stage 3D-B.2A/2B/2C/2D.1 and Stage 2A.1/3/4/5 regression verification.
30. Remaining Stage 3D-B work.
31. Whether Stage 3D-B.2D.2B is unblocked.
32. Initial and final Git status.
33. Complete files-changed inventory.
34. Concurrent external changes.
35. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2D.2A:

1. One V2 assessment persistence policy exists.
2. One V2 artifact orchestration policy exists.
3. V2 assessment binds to exact snapshot.
4. V2 assessment binds to exact source Check-Up.
5. Only official V2 sources may persist an assessment.
6. Needs-retake assessment is not persisted as an official result.
7. Missing age/reference sex does not block persistence.
8. Chair transform disabled does not block persistence.
9. One snapshot has one stable assessment ID.
10. Same assessment fingerprint is idempotent.
11. Same ID/different fingerprint is a conflict.
12. Existing frozen assessment is never silently overwritten.
13. Existing frozen snapshot is never silently recomputed.
14. Changed live reference profile cannot rewrite snapshot.
15. Changed live life goal cannot rewrite assessment.
16. Prior focus comes from earlier valid V2 assessment only.
17. V1 focus is never used as prior V2 focus.
18. Baseline/baseline retake ignore prior focus.
19. Official retest may use prior V2 focus.
20. Missing prior artifact does not invalidate an already frozen current assessment.
21. Pure orchestrator uses explicit timestamps.
22. Pure orchestrator has no persistence side effect.
23. Local history round-trips assessment.
24. Malformed assessment preserves raw + snapshot.
25. Assessment without snapshot fails closed.
26. Backend sync preserves bounded assessment.
27. V2 sync does not populate V1 focus/age fields.
28. Restore parses and never recomputes assessment.
29. Local valid assessment beats remote missing.
30. Identical duplicates dedupe.
31. Conflicts are deterministic and surfaced.
32. Assessment referencing a rejected snapshot is rejected.
33. Export preserves bounded assessment.
34. Account clear removes it with source Check-Up.
35. V2 assessment remains separate from V1 MovementAssessment.
36. No V2 MovementBlock/report is created.
37. No UI/profile/route/feature flag is added.
38. Public/default Check-Up remains V1.
39. Stage 3D-B.2A/2B/2C/2D.1 remain green.
40. Stage 4/5 remain green.
41. Safety audio remains 44 cues / 88 assets.
42. No source workbook/PDF data is added.
43. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2D.2A complete unless:

1. Strict source binding exists.

2. Official persistence eligibility exists.

3. Immutable attachment exists.

4. Prior V2 focus selection is deterministic.

5. Pure snapshot-to-assessment orchestration exists.

6. Existing frozen artifacts are reused without recomputation.

7. Changed live inputs cannot overwrite frozen artifacts.

8. Local persistence/history works.

9. Backend sync/restore works.

10. Export/account clear works.

11. Raw/snapshot survive invalid assessment.

12. V1 remains unchanged.

13. No UI/block/report/feature integration exists.

14. Targeted tests pass.

15. Full Jest passes.

16. `npm run verify:audio` passes.

17. App typecheck passes.

18. Website typecheck passes.

19. Expo config passes.

20. Expo export passes.

21. `git diff --check` passes.

22. No new warning is introduced without explanation.

23. No unrelated user work is reverted or overwritten.

24. No package install or lockfile change occurs.

25. No source PDF/workbook is committed.

26. No staging, commit, branch, or push occurs.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2D.2A COMPLETE`
- `STAGE 3D-B.2D.2A BLOCKED`

Also state one for each:

- `V2 ASSESSMENT PERSISTENCE IMPLEMENTED`
- `V2 ASSESSMENT PERSISTENCE BLOCKED`

- `V2 OFFICIAL ARTIFACT ORCHESTRATION IMPLEMENTED`
- `V2 OFFICIAL ARTIFACT ORCHESTRATION BLOCKED`

- `V2 ASSESSMENT BACKEND SYNC/RESTORE IMPLEMENTED`
- `V2 ASSESSMENT BACKEND SYNC/RESTORE BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2D.2B UNBLOCKED`
- `STAGE 3D-B.2D.2B BLOCKED`

Use `STAGE 3D-B.2D.2B UNBLOCKED` only if:

- frozen V2 assessment round-trips deterministically;
- snapshot/assessment source binding is strict;
- conflicts cannot overwrite accepted history;
- prior V2 focus selection is deterministic;
- no recomputation occurs;
- UI/block/report boundaries remain contained.

Also state:

- `BALANCED FOCUS MODE PERSISTED AS CONTRACT ONLY`
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR CANNOT DRIVE PRODUCTION REFERENCE FOCUS`
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`
- `NO MOVEMENT PROFILE UI IMPLEMENTED`
- `NO REFERENCE PROFILE INPUT UI IMPLEMENTED`
- `NO V2 MOVEMENTBLOCK CREATED`
- `NO V2 REPORT CREATED`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Hale beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Assessment persistence/orchestration versions.
- Assessment source-binding behavior.
- Official persistence eligibility.
- Immutable attachment/conflict behavior.
- Prior V2 assessment/focus selection.
- Artifact orchestrator behavior.
- Changed reference-profile/life-goal behavior.
- Local history result.
- Backend sync result.
- Backend restore result.
- Duplicate/conflict result.
- Export/account-clear result.
- V1/UI/block/report containment.
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
- Confirmation that Stage 3D-B.2A/2B/2C/2D.1, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2D.2A COMPLETE` or blocked.
- Assessment persistence verdict.
- Artifact orchestration verdict.
- Backend sync/restore verdict.
- `STAGE 3D-B.2D.2B UNBLOCKED` or blocked.
- `BALANCED FOCUS MODE PERSISTED AS CONTRACT ONLY`.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR CANNOT DRIVE PRODUCTION REFERENCE FOCUS`.
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`.
- `NO MOVEMENT PROFILE UI IMPLEMENTED`.
- `NO REFERENCE PROFILE INPUT UI IMPLEMENTED`.
- `NO V2 MOVEMENTBLOCK CREATED`.
- `NO V2 REPORT CREATED`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
