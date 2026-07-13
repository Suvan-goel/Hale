You are implementing Stage 3C of Pearl’s production-readiness work:

SCORING/NORM VERSIONING, FROZEN HISTORICAL INTERPRETATIONS, AND CROSS-VERSION COMPARISON SAFETY

This is a focused production-code remediation task.

Do not begin Stage 3D, Stage 4, Stage 5, or any later audit in this task.

## Required prior reading

Read these documents in full before changing code:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md

The current working tree is the final source of truth. Re-verify all relevant paths before editing because report line numbers may no longer be exact.

## Stage 3B baseline

Stage 3B is complete.

It established:

- Official baseline, baseline retake, and official re-test completion requires all three headline domains.
- Zero domains -> invalid.
- One or two domains -> incomplete.
- Three domains -> completed.
- Manual extra, quick recheck, micro-check, and unresolved legacy records are non-official.
- Partial official attempts remain saved and retryable.
- Only complete, exact-type official evidence can create blocks or official Progress.
- Typed local Check-Up history exists.
- Exact Check-Up type is preserved in local history and remote JSON metadata.
- Official history selectors no longer fall back to raw/manual history.
- Targeted retry and retry merge preserve prior valid evidence.
- Stage 3A malformed-input hardening remains authoritative.

Do not weaken or bypass any Stage 3A or Stage 3B contract.

## Approved product decisions

The product owner has approved the following versioning policy.

### Current versions

Introduce explicit current version constants:

```text
scoringVersion = 1
normVersion = 1
```

Use numeric integer versions unless the existing architecture provides a clearly safer equivalent.

The constants must be centralized and imported wherever versions are written or checked.

Do not copy literal `1` throughout the codebase.

### Frozen official interpretation

When Pearl scores a Check-Up, the resulting interpretation must be frozen with the Check-Up record.

An official historical result must not silently change because:

- scoring code changes,
- norm tables change,
- interpretation copy changes,
- a newer app version restores the record,
- the user changes devices,
- or backend restoration occurs.

The frozen result must include enough information to reproduce the result the user originally saw without rescoring raw measurements.

### No silent historical rescoring

Raw Check-Up measurements may remain stored for future research or explicit re-analysis.

However:

- loading history must not silently call the current scorer and replace the original interpretation;
- backend restore must not silently rescore old raw Check-Ups;
- Progress must not derive old official ages from the current scorer;
- reports must not compare a current score against an implicitly rescored historical score;
- an explicit future re-analysis must create a new versioned interpretation rather than rewriting the original one.

There is no user-facing re-analysis workflow in Stage 3C.

Do not add one merely to satisfy this policy.

### Legacy unversioned data

Existing records without both a scoring version and a norm version are:

```text
legacy_unversioned
```

They may remain viewable as historical records where sufficient stored information exists.

They must not:

- be treated as current-version official evidence;
- create a new block;
- become a next-block source;
- become a baseline/re-test comparison endpoint;
- generate an official trend;
- silently receive version `1`;
- be silently rescored and presented as their original result.

If a legacy unversioned record has no preserved derived interpretation, retain the raw record but show no authoritative historical movement-age interpretation.

Because Pearl has not launched publicly, fail closed rather than guessing.

### Cross-version compatibility

Two Check-Up interpretations are directly comparable only when all are true:

- both have valid frozen snapshots;
- both have the same supported score-snapshot schema;
- both have the same `scoringVersion`;
- both have the same `normVersion`;
- both are otherwise eligible official results under Stage 3B.

Do not attempt semantic-version ordering or “close enough” compatibility.

Exact equality is required.

A known different version and an unversioned record are both non-comparable.

### Current-version block creation

A newly created or replacement training block must use:

- a complete official Stage 3B assessment;
- a valid frozen score snapshot;
- `scoringVersion === CURRENT_SCORING_VERSION`;
- `normVersion === CURRENT_NORM_VERSION`;
- a consistent source Check-Up/assessment/snapshot relationship.

A legacy, unsupported, future, malformed, or mismatched snapshot is block-ineligible.

Do not rescore it automatically to make it eligible.

### Active-block continuity

Do not destroy or archive an existing active block merely because its originating historical score is unversioned or incompatible.

The user may continue an already active block.

When a complete current-version official re-test is later completed:

- the current block may complete normally;
- the next block may be created from the current-version re-test;
- a normal before/after comparison is allowed only if the start and end interpretations are version-compatible;
- otherwise the report must use a neutral comparison-unavailable state.

### Cross-version reports

When report endpoints are incompatible:

- do not claim improved;
- do not claim declined;
- do not claim held steady;
- do not calculate or display misleading age deltas;
- do not silently rescore the older endpoint.

The re-test itself may still complete, and the next block may still use the current-version re-test.

The report should calmly state that a direct comparison is unavailable because Pearl’s scoring method changed.

Do not expose technical version numbers to ordinary users unless the current UI architecture already has an appropriate diagnostic surface.

### Historical display

A recognized frozen snapshot from an older supported schema/version may be displayed as the historical result originally recorded.

It must be labelled or treated as historical and excluded from current longitudinal comparisons unless exact versions match.

An unsupported future snapshot or malformed snapshot must fail closed:

- preserve the stored record;
- do not crash;
- do not rescore silently;
- do not use it for official decisions.

### Future changes

Stage 3C must make version changes operationally explicit.

Future changes to:

- scoring formulas,
- domain composition,
- weakest-domain calculation,
- interpretation boundaries,
- or other scorer semantics

must increment `scoringVersion`.

Future changes to:

- norm anchors,
- norm populations,
- interpolation/extrapolation tables,
- or age-band lookup data

must increment `normVersion`.

Do not change the current formulas or norms in Stage 3C.

## Confirmed finding being addressed

### F3-004 — P1: scoring/norm versions are not pinned

Stage 3 confirmed:

- local history stores raw Check-Up data but no scorer/norm version;
- derived backend score metadata has no explicit scorer/norm version;
- MovementAssessments do not pin the scorer/norm interpretation;
- block reports do not pin endpoint versions;
- restore can recreate assessments by rescoring raw Check-Ups with current code;
- the same historical Check-Up can therefore produce a different movement-age interpretation after an app update;
- incompatible historical and current outputs can be compared without any compatibility check.

Stage 3C must close F3-004.

## Primary objective

Create one authoritative versioned-score architecture so that:

1. Every newly scored Check-Up receives centralized current scoring and norm versions.

2. The exact score interpretation is stored as a JSON-safe frozen snapshot.

3. New local history, MovementAssessments, block reports, and backend metadata carry consistent versions.

4. History, Progress, block reports, lifecycle, and block creation use frozen snapshots rather than silently rescoring historical raw Check-Ups.

5. Legacy unversioned records remain preserved but non-authoritative.

6. Cross-version comparisons fail closed.

7. A current-version complete official re-test can still create the next block even when its historical comparison endpoint is incompatible.

8. Existing valid current-version flows and Stage 3A/3B protections remain intact.

## Scope boundary

This task may change:

- centralized scoring/norm version constants;
- score snapshot types;
- JSON-safe score serialization/deserialization;
- current score creation helpers;
- typed local Check-Up history;
- MovementAssessment version metadata;
- assessment normalization;
- block eligibility version checks;
- official history selectors;
- Progress score selection;
- report compatibility and report metadata;
- block report persistence;
- backend Check-Up metadata;
- backend block-report metadata;
- restore logic;
- local migrations/read compatibility;
- safe diagnostics;
- narrow user-facing comparison-unavailable copy;
- relevant tests;
- the Stage 3C remediation report.

This task must not change:

- current scoring formulas;
- current norm tables;
- current norm anchors;
- movement-age calculations;
- headline-domain composition;
- Stage 3A input bounds;
- Stage 3B evidence sufficiency;
- Stage 3B official/manual semantics;
- Check-Up measurement logic;
- camera readiness;
- exercise catalogue;
- workout-generation rules;
- exercise progression;
- training-session completion semantics;
- weakest-domain exact-tie or near-tie policy;
- meaningful-change thresholds;
- improvement/decline thresholds for compatible current-version records;
- movement-age scientific claims;
- norm provenance documentation beyond version metadata;
- user demographic scoring;
- account-local-data isolation;
- TUG release status;
- broad UI redesign.

Do not perform opportunistic refactors.

## Locked Stage 3C contracts

### 1. Central version constants

Create one authoritative module, such as:

- `src/scoring/versions.ts`
- or another narrow existing scoring module.

It should export conceptually:

```ts
export const CURRENT_SCORING_VERSION = 1 as const;
export const CURRENT_NORM_VERSION = 1 as const;
export const SCORE_SNAPSHOT_SCHEMA_VERSION = 1 as const;
```

Adapt names to the repository.

Requirements:

- Values are finite positive integers.
- No mutable runtime configuration.
- No date-based version.
- No app-build number used as scoring version.
- No duplicated literals at write sites.
- Tests assert new snapshots use these constants.
- Current versions are not read from remote payloads or user input.
- Unknown remote versions never override current constants.

### 2. JSON-safe frozen score snapshot

Create one authoritative snapshot representation.

A conceptual structure may resemble:

```ts
type VersionedCheckUpScoreSnapshot = {
  schemaVersion: number;
  scoringVersion: number;
  normVersion: number;
  createdAt: string;
  score: JsonSafeCheckUpScore;
};
```

Adapt this to the current `CheckUpScore` shape.

The snapshot must preserve enough to display the original interpretation without calling `scoreCheckUp` again.

Preserve, where present:

- each domain’s measured state;
- age lower and upper bounds;
- estimate status;
- interpretation text or a stable interpretation key;
- supporting/detail rows shown to the user;
- weakest domain for complete results;
- any fields used by Progress, reports, block focus, or result screens.

Requirements:

- JSON-safe.
- No `NaN`.
- No Infinity.
- No `undefined`.
- Unmeasured numeric fields use `null` or another explicit JSON-safe representation.
- Stable schema version.
- Pure serialization/deserialization helpers.
- Runtime validation on deserialize.
- No trust in TypeScript casts alone.
- No mutation of the source score.
- Deterministic output.
- Re-serialization produces equivalent data.
- Malformed snapshot fails closed.
- Unknown snapshot schema fails closed.
- Snapshot contains no raw frames, landmarks, images, video, or sensitive profile text.

Do not store functions, class instances, or React copy objects.

If interpretation text is currently computed directly in the score and is part of what the user saw, preserve it in the snapshot.

If using stable interpretation keys is clearly safer and already supported, use them, but do not perform a broad localization refactor.

### 3. Current score creation

Create or identify one authoritative helper that produces the current versioned snapshot from a raw Check-Up.

Conceptually:

```ts
createCurrentVersionedScoreSnapshot(checkUp)
-> {
     score,
     snapshot,
     diagnostics
   }
```

Requirements:

- Uses Stage 3A `scoreCheckUpWithDiagnostics`.
- Uses centralized current versions.
- Produces the runtime score and frozen JSON-safe snapshot from the same scoring operation.
- Does not score twice.
- Does not mutate the Check-Up.
- Preserves Stage 3A diagnostic issues.
- Does not create a snapshot if scoring output violates required invariants.
- Works for official and non-official Check-Up types.
- Partial/invalid Check-Ups may have a frozen snapshot; Stage 3B still controls official usability.
- Supporting-only and unmeasured states remain accurately represented.
- Existing `scoreCheckUp` compatibility wrapper may remain for pure immediate calculations, but persistent official flows must use the versioned helper.

### 4. Score compatibility classification

Create one pure compatibility helper.

Conceptually:

```ts
type ScoreSnapshotCompatibility =
  | 'current'
  | 'compatible'
  | 'legacy_unversioned'
  | 'incompatible_version'
  | 'unsupported_schema'
  | 'invalid_snapshot';
```

Use a smaller or different union if it better fits the code.

Required semantics:

- Current snapshot:
  - valid schema;
  - current scoring version;
  - current norm version.

- Compatible pair:
  - both valid;
  - same supported schema;
  - exact same scoring version;
  - exact same norm version.

- Legacy unversioned:
  - either scoring or norm version missing.

- Incompatible:
  - known version mismatch.

- Unsupported:
  - unknown snapshot schema.

- Invalid:
  - malformed fields or internal score invariant failure.

Requirements:

- Pure.
- Deterministic.
- Exact equality.
- No implicit migration.
- No “assume version 1.”
- No semantic-version parsing.
- No ordering assumption that higher is always readable.
- A future version is incompatible unless explicitly supported by code.

### 5. Typed local history

Extend the Stage 3B typed local history record.

Newly saved scored Check-Ups must include:

- raw Check-Up;
- exact Check-Up type;
- source assessment relationship;
- retry lineage where already supported;
- frozen score snapshot;
- scoring version;
- norm version, either within the snapshot or mirrored only if required for indexing;
- snapshot schema version.

Prefer one canonical version source inside the snapshot.

Do not create multiple independently writable version fields without consistency validation.

Requirements:

- New records always store a valid snapshot.
- Partial and manual records also store a snapshot.
- Old records still load.
- Missing snapshot -> legacy unversioned.
- Snapshot/version mismatch -> invalid/incompatible, not guessed.
- History store APIs can return the snapshot and compatibility state.
- Saving a record does not call scoring more than once.
- Retry merge produces a new current-version snapshot.
- The original partial attempt keeps its original snapshot.
- Local history filenames/IDs remain stable.
- Do not overwrite previous attempts.

Increment the local history schema only if the current serializer architecture requires it.

Add a backward-compatible migration/read path.

### 6. Legacy local records

For an old typed or untyped local record without a versioned score snapshot:

- preserve raw Check-Up data;
- preserve exact Check-Up type if Stage 3B can resolve it;
- mark score compatibility as `legacy_unversioned`;
- do not call the current scorer automatically for historical display, official Progress, report comparison, or block eligibility;
- use existing stored MovementAssessment derived values for limited historical display only if they can be associated unambiguously;
- do not label those values current-version;
- do not synthesize a full snapshot from incomplete derived fields;
- do not silently write back version 1.

If the record is required to start a new block:

- fail closed;
- direct the user toward a new current-version official Check-Up.

If an active block already exists:

- preserve it;
- do not invalidate the active plan merely because the originating record is legacy.

### 7. MovementAssessment version metadata

Extend `MovementAssessment` or its raw/metadata structure so every newly created assessment carries:

- score snapshot schema version;
- scoring version;
- norm version;
- source snapshot/check-up identity;
- enough consistency metadata to prove it was derived from the matching frozen score.

Requirements:

- `createMovementAssessment` consumes the score and versioned snapshot from one authoritative operation.
- Do not independently rescore inside assessment creation.
- Assessment versions must match the source history snapshot.
- Missing/mismatched version metadata fails official usability.
- Stage 3B status and officialness remain unchanged.
- A manual complete assessment is still non-official even with current versions.
- A partial official assessment is still incomplete even with current versions.
- Old assessments without versions normalize to legacy unversioned.
- Do not silently mutate old stored assessments to version 1.

If `MovementAssessment.rawMetrics` already stores derived values, retain them for compatibility but make the frozen score snapshot/version relationship authoritative.

### 8. Block eligibility version gate

Extend Stage 3B block eligibility.

Automatic block creation requires:

- complete official assessment;
- all three headline domains;
- Stage 3A-valid evidence;
- matching typed raw record;
- valid frozen score snapshot;
- snapshot/assessment version consistency;
- current scoring version;
- current norm version;
- current supported snapshot schema;
- finite explicit focus domain;
- existing source-ID consistency.

Add stable ineligibility reasons where appropriate:

- `missing_score_snapshot`
- `legacy_unversioned_score`
- `incompatible_scoring_version`
- `incompatible_norm_version`
- `unsupported_score_snapshot_schema`
- `invalid_score_snapshot`
- `score_version_mismatch`

Adapt names to the code.

Defend:

- first-block creation;
- baseline-retake replacement;
- official re-test next-block creation;
- direct block-service callers;
- legacy block creation in `App.tsx`.

Do not rescore an old raw Check-Up to satisfy the gate.

### 9. Official selectors and current usability

Stage 3B’s `latestUsableOfficialAssessment` and typed Check-Up selectors must now distinguish:

- complete official historical result;
- current-version block-usable official result;
- comparable official result pair.

A frozen older version may remain an official historical result, but it is not current-version block-usable.

Create or harden explicit selectors such as:

- latest official attempt;
- latest historical official result;
- latest current-version usable official result;
- latest incomplete official attempt;
- latest comparable pair;
- latest extra Check-Up.

Do not overload one helper with ambiguous semantics.

Required behaviour:

- Newer incompatible official result may be displayed historically.
- It must not become a current-version block source.
- Legacy unversioned does not become current usable.
- Manual/quick remain non-official.
- Incomplete/invalid remain non-usable.
- Current-version complete official result is usable.
- A newer incompatible or legacy result does not cause a current-compatible older result to be misrepresented as “latest” without clear selector naming.
- UI callers use the selector matching their purpose.

### 10. Result-screen behavior

The immediate result of a newly completed Check-Up is always scored with current versions.

Result screens should receive:

- frozen snapshot;
- compatibility state;
- Stage 3B assessment status;
- exact Check-Up type.

For a newly completed current-version result:

- existing result presentation remains unchanged;
- partial/manual rules remain unchanged;
- block CTA remains governed by Stage 3B plus current-version eligibility.

For a historical recognized older snapshot:

- display frozen values, not rescored values;
- do not show a current block CTA;
- do not imply direct comparability with current results.

For legacy unversioned/malformed/unsupported snapshots:

- do not crash;
- do not show invented ages;
- use calm historical-unavailable copy where necessary.

Do not broadly redesign result screens.

### 11. Progress must use frozen snapshots

Update Progress and trend selectors.

Official Progress must never call the current scorer for historical official records when a frozen snapshot should be used.

Requirements:

- Latest official result card uses the stored frozen snapshot.
- Historical domain cards use stored frozen snapshots.
- Compatible trend pairs require exact version match.
- Manual/quick remain excluded.
- Incomplete/invalid remain excluded.
- Legacy unversioned remains excluded from official longitudinal comparisons.
- Incompatible versions remain excluded from direct trends.
- If only one comparable current-version result exists, show no trend.
- A frozen older result may remain visible in historical listings.
- Do not fabricate improvement/decline.
- Do not silently choose a different comparison pair that misrepresents the user’s block lifecycle.
- Existing Stage 3B official type matching remains required.

Do not introduce meaningful-change thresholds in this task.

For exact compatible pairs, preserve the current comparison calculations until Stage 3D.

### 12. Block report compatibility

Extend `MovementBlockReport` or its metadata to store:

- start assessment/check-up ID;
- end assessment/check-up ID;
- start snapshot schema/scoring/norm versions;
- end snapshot schema/scoring/norm versions;
- comparison compatibility status;
- frozen compatible comparison output where applicable.

Required compatibility states may include:

- `compatible`
- `legacy_unversioned`
- `incompatible_version`
- `missing_snapshot`
- `invalid_snapshot`

Adapt names to the architecture.

For compatible endpoints:

- preserve current report calculations;
- preserve current before/after values;
- preserve current next-focus behavior, subject to later tie work;
- freeze the report’s derived comparison.

For incompatible endpoints:

- complete the valid current-version official re-test;
- complete the active block;
- allow next-block creation from the current-version re-test;
- create a report or report state that says direct comparison is unavailable;
- do not compute misleading deltas;
- do not mark improved/declined/steady;
- do not silently rescore the older endpoint;
- do not block the user from continuing into the next block.

A report generated from incompatible endpoints must remain stable after reload.

### 13. Existing reports

For old block reports without version metadata:

- classify comparison as legacy unversioned;
- preserve the report for history;
- do not treat its deltas as current authoritative comparison;
- do not silently attach version 1;
- do not recompute it automatically.

Do not delete old reports.

### 14. Backend Check-Up sync

Persist the versioned score snapshot and exact versions in sanitized backend JSON metadata.

Prefer existing JSON columns rather than a live schema migration unless a migration is already necessary and safely supported.

At minimum, new remote Check-Up rows should preserve:

- exact Check-Up type from Stage 3B;
- frozen JSON-safe score snapshot;
- score snapshot schema version;
- scoring version;
- norm version;
- source Check-Up ID;
- source assessment ID where applicable;
- Stage 3B status/officialness metadata needed for restore consistency.

Requirements:

- No raw frames, landmarks, images, video, or sensitive free-form profile data.
- Remote payload uses the same snapshot produced locally.
- Do not score again in the mapper when a valid snapshot is supplied.
- If the mapper is invoked without a snapshot for a new current Check-Up, use the authoritative current-version helper exactly once.
- Snapshot and raw Check-Up IDs must match.
- Malformed supplied snapshot fails closed.
- Current version constants cannot be overridden by remote values during new local score creation.

### 15. Backend Check-Up restore

Restore must prefer the frozen snapshot.

Required precedence:

1. Valid recognized frozen snapshot in exact metadata.
2. Valid recognized frozen snapshot in another existing sanitized metadata location.
3. No snapshot -> legacy unversioned.

Do not use:

- current rescoring of raw history as a fallback;
- remote coarse enum to infer score versions;
- “missing means version 1”;
- current norm tables to recreate an old interpretation.

Restore behavior:

- valid current snapshot -> restore current-compatible result;
- valid older known snapshot -> restore historical frozen result, incompatible for current comparison/block use;
- missing versions -> legacy unversioned;
- version mismatch between record and assessment -> fail closed;
- malformed snapshot -> preserve raw record, mark invalid snapshot;
- unsupported future schema -> preserve raw metadata where safe, do not crash or use;
- Stage 3B exact Check-Up type restoration remains intact;
- Stage 3A malformed raw data remains non-scoreable;
- no silent score replacement.

### 16. Backend assessment restore

Restore MovementAssessments from versioned metadata without silently deriving a new official interpretation from current scoring.

Requirements:

- restore stored assessment status/type/officialness only after consistency checks;
- validate matching source Check-Up and snapshot IDs;
- validate version consistency;
- normalize Stage 3B evidence status against the frozen snapshot, not a current rescore;
- old unversioned assessment -> legacy unversioned;
- malformed/mismatched assessment -> non-usable;
- manual remains non-official;
- partial remains incomplete;
- complete current official remains usable.

### 17. Backend block-report sync and restore

Persist version compatibility metadata with block reports.

Requirements:

- compatible report round-trips exactly;
- incompatible comparison-unavailable state round-trips exactly;
- old report without metadata restores as legacy unversioned;
- restore does not recompute report changes with current code;
- source endpoint IDs and versions remain associated;
- malformed report metadata fails closed;
- no duplicate report creation due solely to version metadata.

Prefer existing report JSON storage if available.

Do not add a database migration unless required by the repository’s existing schema mechanism and demonstrably safe.

### 18. App startup and local restore

Audit every startup path that currently rescored raw Check-Ups.

Replace silent historical rescoring with snapshot-based resolution.

Required behavior:

- local current-version official records restore identically;
- remote current-version records restore identically;
- legacy records remain available but non-authoritative;
- active blocks remain active;
- a user with only a legacy baseline and no active block is asked to complete a new current-version official baseline before creating a new block;
- a user with an active legacy-origin block may continue it;
- after a current-version re-test, the next block may use the current re-test;
- Progress does not compare legacy and current interpretations;
- startup does not rewrite history files merely by reading them.

### 19. Current re-test after legacy baseline

Add an explicit tested path:

```text
legacy/unversioned baseline
-> existing active block continues
-> current-version complete official re-test
-> current block completes
-> comparison unavailable report
-> next block created from current re-test
```

Confirm:

- no historical rescore;
- no false improvement/decline;
- no loss of the current re-test;
- next-block focus comes from the current re-test;
- the user is not trapped.

Also test:

```text
legacy/unversioned baseline
-> no active block
-> attempt to create first block
```

Required:

- fail closed;
- require new current-version baseline;
- do not rescore legacy raw data.

### 20. Explicit future re-analysis boundary

There is no Stage 3C re-analysis UI.

Document and enforce:

- no automatic reanalysis on read/restore;
- no mutation of original snapshot;
- any future reanalysis must create a new record/interpretation with:
  - a new interpretation ID,
  - current versions,
  - reference to source raw Check-Up,
  - explicit user or migration action.

It is acceptable to encode this only as architecture, tests preventing silent re-score, and report documentation.

Do not add unused speculative product screens.

### 21. Safe observability

At high-trust boundaries, record structured diagnostics for:

- legacy unversioned score rejected for block creation;
- incompatible comparison blocked;
- malformed snapshot;
- unsupported snapshot schema;
- history/assessment version mismatch;
- remote snapshot/raw ID mismatch;
- restore skipped silent rescoring;
- report comparison unavailable.

Include only:

- stable reason code;
- snapshot schema version where safe;
- scoring version where safe;
- norm version where safe;
- Check-Up type;
- source IDs already considered safe;
- compatibility classification.

Exclude:

- raw movement values;
- pose frames;
- landmarks;
- video/images;
- free-form profile data;
- auth tokens.

Expected legacy data is a recoverable state, not a fatal exception.

Keep pure snapshot and compatibility helpers side-effect free.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record the complete initial state.

3. Inspect current diffs in every file this task may touch.

4. Treat all existing modifications and untracked files as user-owned.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify previous audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install dependencies.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during the task:
    - record the change;
    - do not overwrite it;
    - continue only if task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Re-verify the current architecture

Before changing code, inspect at minimum:

- `src/scoring/scoring.ts`
- `src/scoring/scoringInputValidation.ts`
- `src/scoring/norms.ts`
- `src/scoring/index.ts`
- any existing scoring version module
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/assessmentEvidence.ts`
- `src/pearlFlow/assessmentEligibility.ts`
- `src/pearlFlow/checkupHistory.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/pearlFlow/reports.ts`
- `src/pearlFlow/appLifecycle.ts`
- `src/adherence/types.ts`
- `src/adherence/blockService.ts`
- `src/history/serialize.ts`
- `src/history/store.ts`
- `src/history/index.ts`
- `src/history/trends.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`
- `src/services/backend/blockReportSyncService.ts`
- `App.tsx`
- result/progress/report screens
- relevant tests.

Establish:

- Current `CheckUpScore` runtime shape.
- Current unmeasured representation.
- Current `StoredCheckUp` schema.
- Current local history schema number.
- Current `MovementAssessment` shape.
- Current `MovementBlockReport` shape.
- Current backend JSON payload shapes.
- Every location that calls `scoreCheckUp` on historical/raw data.
- Every location that reconstructs an assessment from raw Check-Up.
- Every location that recomputes Progress from raw history.
- Every location that recomputes block reports.
- Every location that chooses before/after report endpoints.
- Every location that creates a block from a score.
- Whether any existing score snapshot or version field already exists.
- Whether reports currently store derived changes or recompute them.
- Whether local and remote serializers already sanitize NaN.
- How exact Stage 3B Check-Up type metadata is stored.
- How active blocks reference source assessments.
- Whether backend JSON can preserve the snapshot without a database migration.

Document all material deviations from Stage 3 and Stage 3B before editing.

## Step 2: Add centralized version constants

Implement the current constants.

Add direct tests proving:

- current scoring version is a positive integer;
- current norm version is a positive integer;
- score snapshot schema version is a positive integer;
- current snapshot creation uses those constants;
- no caller-supplied version overrides them;
- constants are exported from one authoritative module.

Do not derive versions from package/app version.

## Step 3: Implement JSON-safe snapshot conversion

Add pure helpers conceptually similar to:

```ts
toStoredScoreSnapshot(score, metadata)
fromStoredScoreSnapshot(value)
```

Test:

- fully measured score;
- partial score;
- invalid score;
- supporting rows;
- weakest domain;
- estimate flags;
- interpretations;
- `NaN` fields;
- null round-trip;
- malformed arrays/objects;
- string numeric fields;
- missing versions;
- unsupported schema;
- future versions;
- extra unknown keys;
- no mutation;
- deterministic round-trip.

Requirements:

- fully valid current score round-trips deep-equivalent;
- partial/unmeasured score round-trips semantically equivalent;
- no non-JSON numeric values remain;
- malformed snapshot never becomes a measured domain;
- unknown schema is not accepted as current;
- issue/result diagnostics remain safe.

## Step 4: Implement the authoritative current-version scoring helper

Use Stage 3A scoring and snapshot creation together.

Tests:

- scorer called once per helper invocation;
- valid Check-Up returns unchanged current score;
- partial Check-Up snapshot is versioned;
- manual Check-Up snapshot is versioned;
- malformed Check-Up preserves Stage 3A fail-closed behavior;
- input not mutated;
- diagnostic issues preserved;
- snapshot IDs/source IDs match the raw Check-Up;
- versions equal centralized constants.

Do not alter current score values.

## Step 5: Extend typed local history

Update history serialization and store APIs.

Test:

- current complete baseline round-trip;
- current incomplete baseline round-trip;
- current official re-test round-trip;
- current manual/quick round-trip;
- targeted retry merged record round-trip;
- snapshot/source ID consistency;
- duplicate/mismatched version fields fail closed;
- old Stage 3B record without snapshot -> legacy unversioned;
- old untyped record remains governed by Stage 3B type migration and legacy versioning;
- read does not rescore;
- read does not rewrite;
- invalid snapshot preserves raw record;
- no raw sensitive data added beyond existing Check-Up payload.

## Step 6: Extend MovementAssessment

Test:

- new current baseline assessment includes versions;
- new current official re-test includes versions;
- new manual assessment includes versions but remains non-official;
- incomplete assessment includes versions but remains incomplete;
- assessment/source snapshot mismatch is unusable;
- missing versions -> legacy unversioned;
- old completed assessment is not assigned version 1;
- Stage 3B status normalization remains correct;
- Stage 3A malformed score remains invalid;
- assessment creation does not rescore.

## Step 7: Harden block eligibility

Update tests:

- complete current baseline -> eligible;
- complete current baseline retake -> eligible under existing confirmation rules;
- complete current official re-test -> eligible;
- complete manual current -> non-official/ineligible;
- incomplete current official -> incomplete/ineligible;
- complete legacy unversioned official -> version-ineligible;
- complete known old scoring version -> version-ineligible;
- complete known old norm version -> version-ineligible;
- unsupported snapshot schema -> ineligible;
- invalid snapshot -> ineligible;
- score/assessment version mismatch -> ineligible;
- raw record/snapshot source mismatch -> ineligible;
- direct block-service call cannot bypass;
- current valid behavior unchanged.

Prove no implicit rescore path makes an old record eligible.

## Step 8: Replace historical rescoring

Search the repository for historical uses of:

- `scoreCheckUp(`
- `scoreCheckUpWithDiagnostics(`
- direct domain scoring helpers
- assessment reconstruction from raw Check-Up.

Classify every call as:

- new Check-Up scoring;
- explicit test;
- prohibited historical rescore;
- compatibility-only.

Replace prohibited historical rescoring with frozen snapshot access.

The report must list every historical rescoring path removed or retained with justification.

Do not remove scoring from new completion flows.

## Step 9: Update official selectors

Test chronological sequences:

1. Current baseline only.
2. Legacy baseline only.
3. Current baseline -> current re-test.
4. Current baseline -> different-version re-test.
5. Legacy baseline -> current re-test.
6. Current baseline -> manual current.
7. Current baseline -> incomplete current re-test.
8. Current baseline -> future/unsupported snapshot.
9. Current baseline -> malformed snapshot.
10. Mixed local and restored records.

Assert:

- latest historical official;
- latest current-version usable official;
- latest comparable pair;
- block source;
- Progress latest card;
- no fallback to raw rescoring.

## Step 10: Update Progress

Add tests proving:

- stored snapshot values are displayed even when raw Check-Up would score differently under current scorer;
- restore does not alter historical ages;
- compatible current pair uses existing trend logic;
- same old-version pair may be comparable only if that schema/version is explicitly supported by current code;
- current vs old version is not compared;
- current vs legacy unversioned is not compared;
- unsupported future version is not compared;
- manual/quick remains excluded;
- partial/invalid remains excluded;
- one current result produces no trend;
- historical record can remain listed without official trend;
- no hidden current rescore occurs.

Do not add meaningful-change thresholds.

## Step 11: Update report creation

Test:

### Compatible current endpoints

- normal report values unchanged;
- current comparison labels unchanged;
- versions stored;
- report round-trip stable.

### Incompatible endpoint versions

- valid re-test completes;
- current block completes;
- next block is created from current re-test;
- report state says comparison unavailable;
- no domain delta is treated as improved/declined/steady;
- no old endpoint rescore;
- no crash;
- reload preserves the unavailable state.

### Legacy start endpoint

- same neutral behavior;
- next block still proceeds from current re-test.

### Invalid current endpoint

- Stage 3B continues to block re-test completion.

Do not change next-focus logic for compatible current reports except where required to use the frozen current score.

For incompatible reports, next block focus must come from the current re-test, not from a comparison delta.

## Step 12: Extend block-report persistence

Test:

- current compatible report local round-trip;
- incompatible report local round-trip;
- old report without versions -> legacy unversioned;
- endpoint IDs preserved;
- endpoint versions preserved;
- malformed compatibility metadata fails closed;
- no automatic recomputation on load;
- no duplicate report due to metadata changes.

## Step 13: Update backend Check-Up sync

Table-driven tests for:

- current baseline;
- current baseline retake;
- current official re-test;
- current manual extra;
- current quick recheck;
- current incomplete official attempt;
- legacy unversioned local record, if sync is permitted;
- malformed snapshot.

Assert:

- exact type preserved;
- snapshot schema/version metadata present;
- score snapshot present and sanitized;
- source IDs consistent;
- no second scoring when snapshot supplied;
- no NaN/Infinity;
- no raw frames/landmarks/video;
- malformed snapshot not promoted;
- current constants not overridden.

Decide from current architecture whether legacy raw records should sync as legacy metadata.

Do not make them current.

## Step 14: Update backend Check-Up restore

Add tests:

- current snapshot restores exact frozen score;
- raw Check-Up intentionally differs from snapshot, but restore uses snapshot;
- missing snapshot -> legacy unversioned;
- missing one version -> legacy unversioned;
- old known version -> historical incompatible;
- unsupported future schema -> preserved/non-usable;
- malformed score snapshot -> preserved/non-usable;
- assessment/snapshot version mismatch -> non-usable;
- exact type restoration from Stage 3B remains;
- manual remains non-official;
- partial remains incomplete;
- no call to current scorer for historical restore;
- no history rewrite merely from restore.

## Step 15: Update backend report sync/restore

Add tests:

- compatible report exact round-trip;
- comparison-unavailable report exact round-trip;
- old unversioned report remains legacy;
- versions stored in sanitized JSON;
- endpoint IDs preserved;
- no current recomputation on restore;
- malformed metadata fails closed;
- no duplicate upsert key changes.

## Step 16: App-level completion and retry flow

Verify new Check-Up completion performs exactly one authoritative scoring operation and stores one matching snapshot.

Test or extract the smallest pure orchestration helper proving:

- raw Check-Up;
- current frozen snapshot;
- assessment;
- typed history record;
- backend payload

all share:

- same source ID;
- same scoring version;
- same norm version;
- same score interpretation.

Targeted retry completion must create a new current-version snapshot for the merged new attempt.

The base partial attempt retains its original snapshot.

Do not introduce a large App harness if a pure orchestration helper is safer.

## Step 17: Startup/lifecycle behavior

Test:

### Only legacy baseline, no active block

- legacy record visible historically;
- not current-version block eligible;
- lifecycle requires new current baseline;
- no silent rescore.

### Legacy-origin active block

- active block remains usable;
- lifecycle does not discard it;
- current re-test remains due according to existing rules.

### Legacy-origin active block + current re-test

- re-test complete;
- report comparison unavailable;
- next current block created;
- Progress starts a new compatible series from the current result.

### Current baseline

- existing lifecycle unchanged.

### Manual current result

- still does not affect official lifecycle.

## Step 18: User-facing comparison-unavailable state

Add only the narrow UI needed.

Suitable copy:

Title:

“Re-test complete”

Body:

“Your latest result has been saved. Pearl’s scoring method has changed since your earlier Check-Up, so a direct comparison isn’t available.”

CTA:

Continue to next block using the current re-test.

Avoid:

- Technical version numbers.
- “Data corrupted.”
- “Failure.”
- Claiming improvement/decline.
- Blaming the user.
- Medical wording.

Historical result screens may use calm wording such as:

“Historical result”

or:

“This result was recorded with an earlier scoring method.”

Do not broadly redesign Progress or report screens.

## Step 19: Guard against accidental future rescoring

Add tests or architecture checks so future code cannot easily reintroduce silent historical rescoring.

Examples:

- history selector accepts stored record/snapshot rather than raw Check-Up alone;
- Progress view model requires snapshot-bearing records;
- restore tests spy on or structurally avoid `scoreCheckUp`;
- report creation accepts snapshots, not raw Check-Ups;
- block eligibility requires versions;
- helper names distinguish `scoreNewCheckUp` from `readStoredScore`.

Do not add brittle source-code string tests unless there is no better option.

Prefer type boundaries and direct behavior tests.

## Required automated test matrix

### A. Version constants

- Positive integer constants.
- Centralized usage.
- Current snapshot uses exact constants.

### B. Snapshot serialization

- Complete score.
- Partial score.
- Invalid score.
- Supporting rows.
- JSON round-trip.
- Null unmeasured values.
- Malformed snapshot.
- Unknown schema.
- Old version.
- Future version.
- No mutation.

### C. Local history

- New current records.
- Retry records.
- Manual/quick records.
- Old Stage 3B records.
- Unversioned records.
- Invalid snapshots.
- No read-time rescoring.

### D. Assessments

- Current official.
- Current manual.
- Current incomplete.
- Legacy unversioned.
- Version mismatch.
- Source mismatch.

### E. Eligibility

- Current complete official eligible.
- All incompatible/unversioned/malformed cases ineligible.
- Direct service guard.

### F. Progress

- Frozen-score display.
- Compatible pair.
- Incompatible pair.
- Legacy pair.
- Manual/partial isolation.
- No trend when incompatible.
- No silent rescore.

### G. Reports

- Compatible report.
- Incompatible report.
- Legacy report.
- Current re-test continuity.
- Next block still created from current re-test.
- No false claims.

### H. Backend sync

- Exact versions and snapshot in payload.
- Sanitization.
- No duplicate scoring.
- Exact type retained.

### I. Backend restore

- Frozen snapshot wins over raw.
- Missing snapshot legacy.
- Future/invalid snapshot safe.
- No current rescore.
- Stage 3B officialness preserved.

### J. Regression

- Stage 3A malformed-input corpus remains safe.
- Stage 3B all-three-domain requirement remains.
- Manual/quick isolation remains.
- Targeted retry remains.
- Exact Check-Up types remain.
- Stage 2A fallback ROM remains unmeasured.
- Valid current baseline score unchanged.
- Valid current block unchanged.
- Valid compatible current report unchanged.
- Norm tables unchanged.
- Tie behavior unchanged.
- Meaningful-change behavior unchanged.
- TUG remains beta-hidden/supporting only.
- Hinge remains supporting only.

## Test-quality requirements

Tests must:

- Exercise real production serializers and selectors.
- Exercise real Stage 3A scoring for new Check-Ups.
- Use deliberately different raw and frozen scores to prove restore/display does not rescore.
- Assert source-ID and version consistency.
- Assert exact compatibility classification.
- Assert no historical rewrite.
- Assert active-block continuity.
- Fail if missing versions default to 1.
- Fail if raw restore calls current scoring.
- Fail if incompatible records create trends.
- Fail if incompatible records create new blocks.
- Fail if incompatible report endpoints claim change.
- Preserve Stage 3A and Stage 3B regression suites.

Tests must not:

- Change norm tables to simulate a version change.
- Mock every serializer/selector boundary.
- Assert only that a helper was called.
- Add scoring/norm versioning to measurement logic.
- Add a re-analysis UI.
- Update snapshots merely to force a pass.
- Change tie or meaningful-change policy.
- Depend on network access.
- Depend on wall-clock sleeps.

Use deterministic IDs and timestamps.

## Validation commands

Run targeted suites for:

- scoring versions.
- score snapshot serialization.
- Stage 3A scoring.
- MovementAssessment creation/normalization.
- Stage 3B evidence and eligibility.
- typed history serialization/store.
- official history selectors.
- Progress view models.
- lifecycle.
- reports.
- block service.
- onboarding/re-test orchestration helpers.
- Check-Up sync mapping.
- Check-Up restore mapping.
- block-report sync/restore.
- result/report screens.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install packages.

Record:

- Exact targeted command.
- Targeted suite count.
- Targeted test count.
- Full suite count.
- Full test count.
- Snapshot count.
- Skipped tests.
- Exit codes.
- Watchman warning status.
- Jest open-handle warning status.
- Sentry Expo warning status.
- Any new warning.
- Any file unexpectedly changed by validation.

Stage 3B ended with:

- 82 suites passed.
- 543 tests passed.
- Typecheck passed.
- Expo config passed with the existing Sentry warning.
- `git diff --check` passed.

Verify the actual current baseline rather than assuming it is unchanged.

## Manual source verification after tests

Retrace these paths.

### New complete baseline

```text
raw Check-Up
-> Stage 3A scoring once
-> current frozen snapshot
-> completed Stage 3B assessment
-> typed local history
-> backend payload
-> block eligibility
```

Confirm all IDs and versions match.

### Historical restore

```text
remote/local raw Check-Up + frozen snapshot
-> snapshot validation
-> assessment/history restore
-> Progress
```

Confirm no current rescore occurs.

### Legacy unversioned record

```text
legacy raw record
-> compatibility classification
-> historical preservation
```

Confirm no version is invented and no block/trend is created.

### Compatible official pair

```text
baseline snapshot v1/1
-> re-test snapshot v1/1
-> report
```

Confirm current report output remains unchanged.

### Incompatible pair

```text
older snapshot different version
-> current re-test
-> compatibility gate
-> comparison-unavailable report
-> next block from current re-test
```

Confirm no false delta and no user dead end.

### Retry

```text
partial current snapshot
-> targeted retry
-> merged new raw Check-Up
-> new current snapshot
```

Confirm original snapshot remains unchanged.

## Remediation report

Create exactly one new report:

`docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md`

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Finding addressed: F3-004.
4. Approved versioning policy implemented.
5. Current scoring/norm/snapshot schema versions.
6. Frozen score snapshot architecture.
7. JSON-safe representation.
8. Snapshot runtime validation.
9. Compatibility classification.
10. New Check-Up scoring flow.
11. Local history versioning.
12. Legacy local behavior.
13. MovementAssessment version metadata.
14. Block eligibility version gate.
15. Official selector changes.
16. Historical rescoring paths removed.
17. Progress snapshot usage.
18. Compatible report behavior.
19. Incompatible report behavior.
20. Active-block continuity.
21. Backend Check-Up sync.
22. Backend Check-Up restore.
23. Backend report sync/restore.
24. Future explicit re-analysis boundary.
25. Observability.
26. Files changed.
27. Tests added/changed.
28. Exact targeted/full validation.
29. Stage 3A regression status.
30. Stage 3B regression status.
31. Remaining Stage 3 blockers.
32. F3-004 status.
33. Initial/final Git status.
34. Concurrent external changes.
35. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3C:

1. Current scoring version is centralized.
2. Current norm version is centralized.
3. Snapshot schema version is centralized.
4. Every new scored Check-Up has a frozen snapshot.
5. Every new snapshot is JSON-safe.
6. New assessment versions match source snapshot versions.
7. New history stores the frozen snapshot.
8. New backend metadata stores the frozen snapshot and versions.
9. Historical restore prefers the frozen snapshot.
10. Historical restore does not silently rescore raw data.
11. Legacy unversioned data never defaults to version 1.
12. Legacy unversioned data cannot create a block.
13. Legacy unversioned data cannot create an official trend.
14. Known incompatible versions cannot create a block.
15. Known incompatible versions cannot create a direct comparison.
16. Unsupported schema fails closed.
17. Malformed snapshot fails closed.
18. Current complete official evidence remains block eligible.
19. Manual current evidence remains non-official.
20. Partial current official evidence remains incomplete.
21. Stage 3A malformed-input safety remains.
22. Stage 3B all-three-domain rule remains.
23. Stored historical result does not change when current scorer output differs.
24. Compatible report behavior is unchanged.
25. Incompatible report makes no improvement/decline/steady claim.
26. Current re-test after legacy baseline may still complete the block.
27. Next block may use the current re-test after an incompatible comparison.
28. Existing active legacy-origin block is not deleted.
29. Old reports remain preserved as legacy.
30. Retry creates a new snapshot and does not rewrite the original.
31. No automatic re-analysis exists.
32. Norm tables remain unchanged.
33. Scoring formulas remain unchanged.
34. Tie behavior remains unchanged.
35. Meaningful-change behavior for compatible records remains unchanged.
36. Exact Check-Up types remain preserved.
37. TUG remains beta-hidden/supporting only.
38. Hinge remains supporting only.
39. No unrelated product logic changes.
40. No historical file is rewritten merely by reading it.

## Acceptance criteria

Do not mark Stage 3C complete unless all are true:

1. Central current scoring and norm versions exist.

2. A validated JSON-safe frozen score snapshot exists.

3. New Check-Up completion stores one matching score/snapshot interpretation.

4. Local history persists the snapshot and versions.

5. MovementAssessments persist consistent versions.

6. Block reports persist endpoint versions and compatibility.

7. Backend Check-Up metadata preserves snapshot and versions.

8. Backend report metadata preserves compatibility and versions.

9. Restore uses frozen snapshots instead of current rescoring.

10. Missing versions become legacy unversioned, not version 1.

11. Incompatible records are excluded from block creation.

12. Incompatible records are excluded from direct progress/report comparisons.

13. A current re-test can continue the user into the next block after an incompatible historical endpoint.

14. No misleading comparison claim is produced.

15. Valid current-version baseline flow remains unchanged.

16. Valid compatible current-version re-test/report flow remains unchanged.

17. Stage 3A malformed-input hardening remains intact.

18. Stage 3B officialness and partial-result policy remains intact.

19. Scoring formulas and norms are unchanged.

20. Targeted tests pass.

21. Full tests pass.

22. Typecheck passes.

23. Expo config passes.

24. `git diff --check` passes.

25. No new warning is introduced without explanation.

26. No unrelated user work is reverted or overwritten.

27. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- `STAGE 3C COMPLETE`
- `STAGE 3C BLOCKED`

Use `STAGE 3C COMPLETE` only if:

- F3-004 is closed;
- silent historical rescoring is removed;
- frozen snapshots persist locally and remotely;
- incompatible comparisons fail closed;
- current re-test continuity works;
- full validation passes.

Also state:

- `STAGE 3D REQUIRED`
- `STAGE 4 REMAINS BLOCKED`
- `STAGE 5 INPUTS REMAIN BLOCKED`

Stage 3D will address norm provenance and user-facing movement-age claims, followed by tie and meaningful-change/reporting semantics as required by the approved audit plan.

Stage 4 and Stage 5 remain blocked until those remaining Stage 3 inputs are resolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Current scoring version.
- Current norm version.
- Snapshot schema version.
- Frozen snapshot architecture.
- Legacy unversioned policy.
- Cross-version compatibility rule.
- Historical restore behavior.
- Block eligibility version rule.
- Progress comparison rule.
- Incompatible report behavior.
- Active-block/current-retest continuity behavior.
- Backend persistence approach.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck/config/diff results.
- Confirmation that historical records are no longer silently rescored.
- Confirmation that missing versions do not default to version 1.
- Confirmation that incompatible records cannot create blocks or direct trends.
- Confirmation that current re-tests can still seed next blocks after incompatible history.
- Confirmation that valid current-version flows remain unchanged.
- Confirmation that Stage 3A and Stage 3B remain intact.
- F3-004 status.
- Remaining Stage 3 blockers.
- `STAGE 3C COMPLETE` or `STAGE 3C BLOCKED`.
- `STAGE 3D REQUIRED`.
- `STAGE 4 REMAINS BLOCKED`.
- `STAGE 5 INPUTS REMAIN BLOCKED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
