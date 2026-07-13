You are carrying out Stage 3C.1 of Pearl’s production-readiness work:

VERSIONED SCORE SNAPSHOT VERIFICATION, HISTORICAL-RESCORING PROOF, AND CROSS-VERSION FLOW HARDENING

This is a narrow verification-and-remediation pass following Stage 3C.

Do not begin Stage 3D, Stage 4, Stage 5, or any later audit in this task.

The default expectation is that this task will primarily add tests and a detailed verification report.

Modify production code only when a new authoritative test proves that the current Stage 3C implementation violates a locked contract.

## Required prior reading

Read these documents in full before changing anything:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md

Treat the current working tree as the final source of truth. Re-verify every relevant path because report line numbers and implementation details may no longer be exact.

## Why this verification pass exists

Stage 3C reports that it implemented:

- Centralized `CURRENT_SCORING_VERSION = 1`.
- Centralized `CURRENT_NORM_VERSION = 1`.
- Centralized `SCORE_SNAPSHOT_SCHEMA_VERSION = 1`.
- JSON-safe frozen score snapshots.
- Snapshot-bearing typed local history.
- Version metadata on MovementAssessments.
- Version-gated block creation.
- Snapshot-backed Progress and report flows.
- Backend snapshot persistence and restore.
- Legacy-unversioned handling.
- Comparison-unavailable reports for incompatible endpoints.
- Continued next-block creation from a current-version official re-test.
- Removal of silent historical rescoring.

The full suite reportedly passed with:

- 83 suites.
- 552 tests.
- Typecheck passed.
- Expo config passed.

However, the Stage 3C report is too abbreviated to prove every required acceptance condition.

It does not provide sufficiently explicit evidence for:

1. Exact initial and final Git status.
2. Exact files changed by Stage 3C.
3. Exact targeted validation command, suite count, and test count.
4. `git diff --check`.
5. A test where raw historical measurements would score differently under the current scorer but the frozen historical snapshot is still displayed and restored unchanged.
6. A test proving history reads and restore reads do not rewrite local files.
7. A complete legacy-origin active-block flow:
   - legacy/unversioned baseline,
   - existing active block,
   - current-version official re-test,
   - comparison-unavailable report,
   - current block completed,
   - next block created from the current re-test.
8. Source-ID and version-mismatch behavior across:
   - raw Check-Up,
   - score snapshot,
   - MovementAssessment,
   - local history,
   - backend payload,
   - report endpoints.
9. Explicit Stage 3A regression evidence.
10. Explicit Stage 3B regression evidence.
11. An inventory showing every historical call to `scoreCheckUp` was removed or justified.
12. The required final stage decisions.

Stage 3C.1 must verify these contracts before Stage 3D is allowed to proceed.

## Primary objectives

This task has six objectives:

1. Verify that frozen historical score snapshots—not the current scorer—are authoritative after save, load, sync, restore, Progress rendering, and report construction.

2. Verify that missing, malformed, mismatched, unsupported, and incompatible version metadata fail closed without inventing version `1`.

3. Verify that reading or restoring history never silently rewrites or upgrades historical records.

4. Verify that a user with a legacy-origin active block can complete a current-version re-test and enter a new current-version block without receiving a false progress comparison.

5. Verify that every current-version new Check-Up creates one internally consistent interpretation shared by:
   - raw Check-Up identity,
   - frozen score snapshot,
   - MovementAssessment,
   - local history,
   - backend metadata,
   - block eligibility.

6. Produce a complete evidence report establishing whether Stage 3C is truly complete and whether Stage 3D is unblocked.

## Locked Stage 3C product rules

Do not change these rules during verification.

### Current versions

The current canonical versions are:

```text
scoringVersion = 1
normVersion = 1
scoreSnapshotSchemaVersion = 1
```

The implementation may use different constant names, but all new snapshots must use one centralized source of truth.

### Frozen historical interpretation

The score interpretation originally stored with a Check-Up is authoritative for historical display.

Historical records must not change because:

- scoring code changes,
- norm tables change,
- a new app version loads them,
- backend restoration occurs,
- Progress is opened,
- or a report is revisited.

### No silent historical rescoring

Raw historical Check-Ups must not be passed through the current scorer to recreate their original interpretation.

Raw measurements may remain stored, but future re-analysis must be explicit and produce a new interpretation record.

Stage 3C.1 must not add a re-analysis workflow.

### Legacy unversioned

A record missing either scoring or norm version is:

```text
legacy_unversioned
```

It must not:

- default to version 1,
- create a new block,
- become a current official Progress comparison endpoint,
- silently acquire a current score,
- generate a direct trend.

### Exact comparison compatibility

Two score snapshots are directly comparable only when:

- both snapshots are valid;
- both use a supported snapshot schema;
- both use the same scoring version;
- both use the same norm version;
- both are otherwise Stage 3B-usable official results.

Exact equality is required.

### Current block eligibility

A newly created block requires:

- complete official Stage 3B evidence;
- valid Stage 3A scoring evidence;
- a valid frozen snapshot;
- current scoring version;
- current norm version;
- supported snapshot schema;
- consistent source identities;
- a finite explicit focus domain.

No raw historical rescore may be used to make an old record eligible.

### Active-block continuity

An existing active block is not deleted merely because its originating assessment is legacy or incompatible.

A current-version official re-test may:

- complete the active block;
- seed the next block;
- produce a comparison-unavailable report when its start endpoint is incompatible.

### Incompatible report behavior

When report endpoints are incompatible:

- no improved claim;
- no declined claim;
- no held-steady claim;
- no misleading age delta;
- no silent rescore of the older endpoint;
- re-test completion remains valid;
- next-block creation remains possible from the current re-test.

### No changes to scoring content

Do not change:

- scoring formulas;
- norm tables;
- norm anchors;
- headline-domain composition;
- Stage 3A plausibility bounds;
- Stage 3B completeness rules;
- manual/quick Check-Up isolation;
- exact Check-Up-type semantics;
- tie handling;
- meaningful-change rules;
- movement-age claims;
- exercise logic;
- workout generation.

## Scope boundary

This task may change:

- Stage 3C version/snapshot helpers if a failing test proves a gap.
- Snapshot runtime validation if a failing test proves a gap.
- Local-history read behavior if it silently rescored or rewrote records.
- MovementAssessment version consistency checks.
- Block-eligibility version checks.
- Official snapshot selectors.
- Progress snapshot selection.
- Report compatibility logic.
- Backend snapshot mapping/restore.
- Narrow comparison-unavailable UI wiring.
- Tests.
- The Stage 3C.1 verification report.

This task must not change:

- scoring formulas;
- norms;
- evidence sufficiency;
- Check-Up measurement;
- retry measurement logic;
- exercise catalogue;
- workout-generation behavior;
- progression;
- training-session logic;
- tie policy;
- meaningful-change thresholds;
- movement-age wording except where comparison-unavailable copy is already part of Stage 3C;
- account isolation;
- broad UI design;
- backend schema unless a current migration is objectively required and already supported.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Save the exact outputs in the verification report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect all current diffs in files that Stage 3C.1 may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit previous audit or remediation reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during this task:
    - record the change;
    - do not overwrite it;
    - continue only if task-owned files remain safe and unambiguous;
    - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct the actual Stage 3C architecture

Before changing code, inspect at minimum:

- `src/scoring/versions.ts`
- `src/scoring/scoreSnapshot.ts`
- `src/scoring/scoring.ts`
- `src/scoring/scoringInputValidation.ts`
- `src/scoring/index.ts`
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
- `src/history/trends.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`
- `src/services/backend/blockReportSyncService.ts`
- `App.tsx`
- Progress/result/report screens.
- Every Stage 3C test file.

Document:

- Exact current version constants.
- Exact score-snapshot schema.
- Exact JSON-safe missing-value representation.
- Exact snapshot parser and compatibility states.
- Exact fields stored in local history.
- Exact fields stored in MovementAssessment.
- Exact fields stored in MovementBlockReport.
- Exact fields sent to backend.
- Exact restore precedence.
- Exact block-eligibility version gate.
- Exact Progress selector behavior.
- Exact report compatibility behavior.
- Exact legacy-unversioned behavior.
- Exact active-block continuity behavior.
- Every current production caller of:
  - `scoreCheckUp`
  - `scoreCheckUpWithDiagnostics`
  - current-version score-snapshot creation
  - snapshot parsing
  - report comparison creation.

Do not modify code until this architecture trace is complete.

## Step 2: Produce a historical-scoring call-site inventory

Search the full repository for every call to:

- `scoreCheckUp(`
- `scoreCheckUpWithDiagnostics(`
- any movement/domain scoring helper
- any “score from raw Check-Up” helper
- any assessment reconstruction helper.

Classify every call as:

- New Check-Up scoring — allowed.
- Targeted retry merged Check-Up scoring — allowed.
- Test-only scoring — allowed.
- Explicit future re-analysis — not expected in Stage 3C.
- Historical read-time scoring — prohibited.
- Backend restore-time historical scoring — prohibited.
- Progress historical scoring — prohibited.
- Report historical scoring — prohibited.
- Block-eligibility historical scoring — prohibited.
- Ambiguous — investigate.

Create a table:

| Call site | Runtime path | Input age/type | Classification | Allowed? | Evidence |

Requirements:

- Every production call must be classified.
- No historical call may remain merely because a raw Check-Up is available.
- If a historical rescore remains, add a failing test and remediate it.
- Do not rely only on a grep count; trace callers.

## Step 3: Verify centralized version constants

Add or strengthen direct tests proving:

- scoring version is a finite positive integer;
- norm version is a finite positive integer;
- snapshot schema version is a finite positive integer;
- current snapshot creation always uses the centralized constants;
- caller-provided values cannot override current versions for a new score;
- remote metadata cannot override current constants during new local score creation;
- version literals are not independently written at persistence call sites.

Do not create brittle string-search tests when behavior or type tests can prove the rule.

## Step 4: Verify frozen snapshot authority using deliberately divergent raw data

This is a mandatory test.

Construct a stored historical record containing:

- a raw Check-Up that the current scorer would interpret as Score A;
- a valid frozen score snapshot containing a deliberately different but internally valid historical Score B;
- matching source identity and valid version metadata.

Then prove, separately, that:

1. Local history load returns Score B.

2. Progress latest-result display uses Score B.

3. Progress domain cards use Score B.

4. Backend restore returns Score B.

5. Historical result view uses Score B.

6. Report endpoint selection uses Score B.

7. Opening or restoring the record does not replace Score B with Score A.

8. No current scoring call is required for these read paths.

Do not alter norms or scoring formulas to create this divergence.

The test may construct a valid frozen snapshot directly.

The purpose is to prove that frozen interpretation—not current raw rescoring—is authoritative.

This is one of the core acceptance conditions.

## Step 5: Verify no read-time history rewrite

Add authoritative tests around the actual storage adapter.

For a legacy, current, incompatible, and malformed history file:

1. Record original serialized content or adapter write count.

2. Call the normal history-load path.

3. Call official selectors and Progress view-model construction.

4. Call restore normalization where applicable.

5. Assert:
   - no history save/write occurred;
   - file content is unchanged;
   - no version field was injected;
   - no score snapshot was generated;
   - no schema migration was written merely by reading.

If the current history architecture performs an approved non-destructive migration write:

- identify it explicitly;
- verify it is atomic and intentional;
- verify it never assigns current scoring/norm versions to unversioned data;
- document it.

The preferred behavior is no write on read.

## Step 6: Verify snapshot JSON safety and invariants

Exercise the actual serializer/parser for:

- fully measured current score;
- partial score;
- invalid score;
- manual score;
- supporting rows;
- null/unmeasured fields;
- weakest domain;
- estimate flags;
- interpretation fields;
- empty detail rows;
- malformed domain bounds;
- string numeric fields;
- `NaN`;
- Infinity;
- `undefined`;
- unknown keys;
- unsupported schema;
- missing scoring version;
- missing norm version;
- negative version;
- fractional version;
- future schema;
- known different scoring version;
- known different norm version.

Required:

- valid current snapshot round-trips semantically unchanged;
- stored snapshot is JSON-safe;
- parser never trusts a TypeScript cast;
- malformed measured domain cannot remain measured;
- missing either scoring or norm version is legacy unversioned;
- unsupported schema fails closed;
- no missing version defaults to `1`;
- parser does not mutate input;
- repeated parse/serialize remains deterministic.

## Step 7: Verify compatibility matrix exhaustively

Create a table-driven compatibility test matrix.

At minimum:

| A | B | Expected |
|---|---|---|
| schema1 score1 norm1 | schema1 score1 norm1 | compatible |
| schema1 score1 norm1 | schema1 score2 norm1 | incompatible |
| schema1 score1 norm1 | schema1 score1 norm2 | incompatible |
| schema1 score1 norm1 | schema2 score1 norm1 | unsupported/incompatible |
| current | missing scoring version | legacy/incompatible |
| current | missing norm version | legacy/incompatible |
| current | malformed snapshot | invalid |
| current | future schema | unsupported |
| old same-version pair | old same-version pair | compatible only if explicitly supported |
| legacy | legacy | not directly comparable unless an explicitly supported frozen schema exists |
| current | current with source mismatch | invalid/incompatible |

Do not infer compatibility from version ordering.

Exact supported equality is required.

## Step 8: Verify source-identity consistency

Add a source-mismatch matrix across:

- raw Check-Up ID.
- typed local history record ID.
- frozen snapshot source Check-Up ID.
- MovementAssessment source Check-Up ID.
- MovementAssessment source snapshot/interpretation ID where present.
- backend raw payload source ID.
- backend derived snapshot source ID.
- block-report start endpoint ID.
- block-report end endpoint ID.

Test at minimum:

1. History raw ID differs from snapshot source ID.

2. Assessment source ID differs from history raw ID.

3. Assessment version metadata differs from snapshot metadata.

4. Backend exact-type metadata belongs to one Check-Up while snapshot belongs to another.

5. Report start snapshot ID differs from start assessment ID.

6. Report end snapshot ID differs from end assessment ID.

7. Matching IDs and versions.

Required:

- mismatch fails closed;
- mismatch never becomes block eligible;
- mismatch never becomes directly comparable;
- mismatch never falls back to raw rescoring;
- mismatch never selects first/last arbitrarily;
- unrelated valid records remain unaffected;
- safe diagnostics use stable reason codes.

## Step 9: Verify MovementAssessment version consistency

Test:

- current complete official baseline;
- current complete official re-test;
- current complete manual extra;
- current incomplete official attempt;
- legacy unversioned assessment;
- missing snapshot metadata;
- scoring-version mismatch;
- norm-version mismatch;
- schema mismatch;
- source-ID mismatch;
- status/evidence mismatch.

Assert:

- current complete official assessment is current usable;
- current manual remains non-official;
- incomplete remains incomplete;
- legacy remains historical/non-current;
- no old assessment is assigned version 1;
- mismatch is non-usable;
- Stage 3B all-three-domain rule remains intact;
- assessment creation for new Check-Ups does not independently score raw data a second time.

## Step 10: Verify new Check-Up scoring occurs once

Trace the current new Check-Up completion path:

```text
raw Check-Up
-> Stage 3A score + diagnostics
-> frozen score snapshot
-> MovementAssessment
-> typed local history
-> backend payload
-> result screen
```

Add a test using the smallest authoritative orchestration helper available.

Prove:

- the current scorer runs once for the completed Check-Up;
- score and snapshot come from that same operation;
- assessment receives the same score/snapshot metadata;
- history stores the same snapshot;
- backend mapper receives or stores the same snapshot;
- source IDs match;
- scoring/norm/schema versions match;
- no second score operation occurs merely for sync or assessment creation.

Do not introduce a large App-level test harness if a pure orchestration helper is safer.

If the architecture currently scores more than once but produces identical values:

- treat this as a Stage 3C architecture gap;
- consolidate only the necessary path;
- add regression tests.

## Step 11: Verify block eligibility version gate

Add direct tests for:

- current complete official baseline -> eligible;
- current complete official baseline retake -> eligible under Stage 3B rules;
- current complete official re-test -> eligible;
- current complete manual -> non-official/ineligible;
- current incomplete official -> incomplete/ineligible;
- legacy unversioned complete official -> version-ineligible;
- known old scoring version -> version-ineligible;
- known old norm version -> version-ineligible;
- unsupported snapshot schema -> ineligible;
- malformed snapshot -> ineligible;
- source mismatch -> ineligible;
- assessment/snapshot version mismatch -> ineligible;
- missing history snapshot -> ineligible;
- direct block-service call cannot bypass;
- no automatic raw rescore makes an old record eligible.

Verify stable ineligibility reason codes.

Do not change current valid block content.

## Step 12: Verify frozen-snapshot Progress semantics

Create chronological tests:

1. Current baseline only.

2. Current baseline -> current compatible re-test.

3. Current baseline -> current incompatible-version re-test.

4. Legacy unversioned baseline only.

5. Legacy baseline -> current re-test.

6. Current baseline -> manual current.

7. Current baseline -> incomplete current re-test.

8. Current baseline -> malformed snapshot.

9. Current baseline -> unsupported future snapshot.

10. Current baseline -> current re-test -> later manual extra.

Assert:

- latest historical official selector;
- latest current-version usable selector;
- latest comparable pair;
- latest official card value;
- domain card values;
- trend presence/absence;
- manual isolation;
- incomplete isolation;
- no raw historical rescoring;
- no fallback to an arbitrary pair.

For incompatible endpoints:

- no trend delta;
- no improved/declined/steady claim;
- historical results may remain visible;
- current result remains current block-usable if otherwise eligible.

## Step 13: Verify compatible reports remain unchanged

Construct a fully valid current-version baseline and official re-test.

Prove:

- report before values match frozen baseline snapshot;
- report after values match frozen re-test snapshot;
- existing current report calculations are unchanged;
- report compatibility is `compatible`;
- current comparison labels remain unchanged;
- endpoint IDs and versions are stored;
- report local round-trip is stable;
- report backend round-trip is stable;
- reloading does not recompute from raw Check-Ups.

Use existing valid fixtures where possible.

## Step 14: Verify the legacy-active-block continuity path

This is mandatory.

Construct:

1. A legacy/unversioned official baseline or source assessment.

2. An already active block associated with that historical source.

3. A new complete current-version official re-test.

Run the authoritative completion path.

Required outcome:

- existing active block is not discarded before the re-test;
- current-version re-test is accepted as complete official evidence;
- old active block is completed exactly once;
- comparison is classified unavailable/legacy;
- no age delta is interpreted as improved, declined, or steady;
- no old raw Check-Up is rescored;
- report records comparison-unavailable state;
- next block is created exactly once;
- next-block focus comes from the current re-test;
- next block references current snapshot/assessment metadata;
- user is not trapped;
- Progress begins a new current-version comparable series from the current result;
- reload preserves this state.

Also test the negative counterpart:

```text
legacy/unversioned baseline
+ no active block
-> attempt first-block creation
```

Required:

- block creation fails closed;
- a new current-version baseline is required;
- legacy raw data is not rescored.

## Step 15: Verify incompatible known-version continuity

Construct a valid frozen start snapshot using a known but non-current scoring or norm version and a current-version official re-test.

Required:

- current re-test remains valid;
- current block may complete;
- next block may be created from current re-test;
- direct comparison unavailable;
- no false trend;
- no old endpoint rescore;
- report persists incompatibility;
- historical old snapshot remains viewable if parser supports it.

This must be separate from missing-version legacy behavior.

## Step 16: Verify history and backend restore precedence

For backend restore, create a remote row where:

- raw Check-Up would score as Score A under current code;
- frozen snapshot stores Score B;
- exact Check-Up type metadata is valid;
- assessment metadata matches Score B.

Required:

- restored history uses Score B;
- restored assessment uses Score B;
- Progress uses Score B;
- no scorer call is made for the historical restore;
- no local history rewrite occurs after restore;
- no derived score is regenerated from Score A.

Also test:

- missing snapshot -> legacy unversioned;
- missing scoring version -> legacy;
- missing norm version -> legacy;
- malformed snapshot -> preserved/non-usable;
- unsupported future schema -> preserved/non-usable;
- source mismatch -> non-usable;
- exact Stage 3B Check-Up type remains preserved;
- manual remains non-official;
- incomplete remains incomplete.

## Step 17: Verify backend sync does not score twice or overwrite versions

Test current Check-Up sync with an already-created frozen snapshot.

Assert:

- mapper uses the supplied snapshot;
- no second score operation;
- exact scoring version stored;
- exact norm version stored;
- exact snapshot schema version stored;
- exact Check-Up type stored;
- source IDs consistent;
- JSON is sanitized;
- no NaN/Infinity;
- no raw frames/landmarks/video;
- caller-supplied or remote version cannot override current constants for new local score creation.

Also test:

- malformed supplied snapshot fails closed;
- legacy record sync, if supported, remains explicitly legacy and is not upgraded.

## Step 18: Verify backend block-report sync/restore

Test:

- compatible report exact round-trip;
- comparison-unavailable report exact round-trip;
- legacy old report without version metadata;
- malformed endpoint metadata;
- source mismatch;
- future schema;
- no report recomputation on restore;
- no duplicate report identity/upsert changes.

Assert that comparison-unavailable remains neutral after restore.

## Step 19: Verify targeted retry snapshot behavior

Construct:

1. Partial current official attempt with a current snapshot.

2. Targeted retry for the missing domain.

3. Merged new complete Check-Up.

Required:

- original partial snapshot remains unchanged;
- original raw attempt remains preserved;
- merged attempt receives a new source ID/timestamp;
- merged attempt receives a new current-version snapshot;
- Stage 3A validation runs on merged data;
- Stage 3B all-three-domain completion runs on merged score;
- no snapshot is reused across different Check-Up identities;
- no duplicate known movement IDs;
- backend payload uses the merged attempt’s snapshot.

Failed retry:

- creates or preserves the appropriate incomplete attempt according to the current Stage 3B contract;
- does not rewrite the base snapshot;
- does not create a block.

## Step 20: Verify unsupported and malformed future data fails safely

Test records containing:

- future score snapshot schema;
- future scoring version;
- future norm version;
- malformed score domain;
- malformed detail row;
- missing source ID;
- mismatched exact Check-Up type;
- invalid compatibility field;
- unknown additional fields.

Required:

- no crash;
- no raw rescore;
- no block;
- no direct trend;
- no false comparison;
- raw/snapshot metadata preserved where safe;
- other unrelated valid records remain usable;
- diagnostic classification is stable.

Do not attempt forward migration.

## Step 21: Verify user-facing comparison-unavailable behavior

At the view-model or screen level, prove:

- incompatible report title/body are neutral;
- no “improved” copy;
- no “declined” copy;
- no “held steady” copy;
- no misleading delta;
- current re-test result remains visible;
- next-block CTA remains available when appropriate;
- no technical version numbers shown to ordinary users;
- no “failure” or “corrupt data” wording;
- historical result can be labelled as recorded with an earlier scoring method.

Do not redesign the screen.

## Step 22: Stage 3A regression verification

Run and explicitly document tests proving:

- missing chair reps fail closed;
- string reps fail closed;
- missing/malformed flags do not crash;
- duplicate known movement items fail closed;
- impossible balance and shoulder values fail closed;
- malformed supporting metrics remain local;
- unrelated valid domains survive;
- no malformed metric reaches a frozen snapshot as measured;
- malformed-only evidence cannot become block eligible.

Do not rely solely on the full suite count.

## Step 23: Stage 3B regression verification

Run and explicitly document tests proving:

- zero domains invalid;
- one/two domains incomplete;
- three domains completed;
- manual/quick remain non-official;
- partial official attempt cannot create a block;
- manual result cannot affect official Progress;
- manual result cannot seed next block;
- exact Check-Up type round-trips locally/remotely;
- unresolved legacy type remains non-official;
- targeted retry remains correct;
- next-block source remains complete official evidence.

Again, do not rely solely on the full suite count.

## Step 24: Production-code restraint

Only change production code when a new test demonstrates a real violation.

Likely allowable production changes are limited to:

- score-snapshot parsing/validation;
- compatibility classification;
- source-ID consistency;
- historical selectors;
- Progress/report snapshot use;
- backend restore/sync snapshot use;
- block eligibility;
- neutral comparison-unavailable UI state.

Do not assume all these areas require changes.

Prefer adding verification tests when the current code already satisfies the contract.

Document every production change and the exact failing invariant that required it.

## Required automated test matrix

At minimum, the verification suite must cover:

### Version and snapshot core

- centralized constants;
- current snapshot creation;
- JSON round-trip;
- partial/unmeasured round-trip;
- malformed snapshot;
- unsupported schema;
- missing versions;
- future versions;
- no mutation.

### Frozen authority

- divergent raw Score A versus snapshot Score B;
- local history uses B;
- Progress uses B;
- backend restore uses B;
- report uses B;
- no rescore.

### No write on read

- current record;
- legacy record;
- incompatible record;
- malformed record.

### Source consistency

- raw/snapshot mismatch;
- assessment/snapshot mismatch;
- report endpoint mismatch;
- backend metadata mismatch.

### Eligibility

- current complete official;
- legacy unversioned;
- known incompatible;
- unsupported schema;
- malformed snapshot;
- direct service guard.

### Progress

- compatible pair;
- incompatible pair;
- legacy/current pair;
- manual/partial isolation;
- no trend when incompatible.

### Reports

- compatible unchanged;
- incompatible neutral;
- legacy active-block continuity;
- current next-block creation;
- report persistence.

### Backend

- sync exact metadata;
- restore frozen snapshot;
- no score-twice;
- no silent rescore;
- report round-trip.

### Retry

- original snapshot preserved;
- merged attempt gets new snapshot;
- failed retry remains incomplete.

### Regression

- Stage 3A malformed corpus;
- Stage 3B completeness and officialness;
- Stage 2A ROM fallback unmeasured;
- norms unchanged;
- scoring formulas unchanged;
- ties unchanged;
- meaningful-change behavior unchanged;
- TUG beta-hidden;
- hinge supporting-only.

## Test-quality requirements

Tests must:

- Exercise real production serializers, parsers, selectors, and mappers.
- Deliberately make raw data disagree with a valid frozen snapshot.
- Assert observable values, mutations, and non-mutations.
- Assert exact source-ID/version consistency.
- Prove no read-time storage write.
- Prove no silent current scorer call for historical restore/display.
- Prove next-block continuity after incompatible history.
- Preserve Stage 3A and Stage 3B behavior.

Tests must not:

- Change norm tables.
- Change scoring formulas.
- Mock every production boundary.
- Assert only that a helper was called.
- Update snapshots merely to force a pass.
- Add a re-analysis workflow.
- Implement tie or meaningful-change policy.
- Depend on network access.
- Depend on wall-clock sleeps.
- Default missing versions to current.

Use deterministic IDs and timestamps.

## Validation commands

Run a targeted Stage 3C.1 test command covering at minimum:

- scoring versions;
- score snapshots;
- Stage 3A scoring input validation;
- Stage 3B assessment evidence and eligibility;
- typed history serialization/store;
- official history selectors;
- Progress view models;
- lifecycle;
- reports;
- block eligibility/service;
- Check-Up sync;
- Check-Up restore;
- block-report sync/restore;
- targeted retry integration;
- relevant result/report screen tests.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted exit code;
- targeted suite count;
- targeted test count;
- full-suite exit code;
- full suite count;
- full test count;
- snapshot count;
- skipped tests;
- typecheck exit code;
- Expo config exit code;
- diff-check exit code;
- Watchman warning status;
- Jest open-handle warning status;
- Sentry Expo warning status;
- any new warning;
- whether any validation command changed files.

Stage 3C reported:

- 83 suites passed.
- 552 tests passed.

Verify the current baseline rather than assuming it is unchanged.

## Verification report

Create exactly one new report:

`docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md`

Do not edit previous reports.

The report must contain:

1. Scope.
2. Reason Stage 3C.1 was required.
3. Initial Git status.
4. Initial diff name/stat output.
5. Current Stage 3C architecture.
6. Current version constants.
7. Frozen snapshot schema.
8. JSON-safe representation.
9. Historical scoring call-site inventory.
10. Frozen-snapshot authority test.
11. Divergent raw-versus-snapshot results.
12. No-write-on-read verification.
13. Compatibility matrix.
14. Source-ID/version mismatch matrix.
15. New Check-Up score-once verification.
16. MovementAssessment consistency.
17. Block-eligibility verification.
18. Progress snapshot verification.
19. Compatible report verification.
20. Incompatible report verification.
21. Legacy-active-block continuity verification.
22. Legacy baseline without active block behavior.
23. Backend Check-Up sync verification.
24. Backend Check-Up restore verification.
25. Backend report sync/restore verification.
26. Targeted retry snapshot verification.
27. Unsupported/malformed future-data handling.
28. User-facing comparison-unavailable behavior.
29. Stage 3A regression results.
30. Stage 3B regression results.
31. Production files changed, if any.
32. Exact reason for each production change.
33. Tests added/changed.
34. Exact targeted validation command/results.
35. Exact full validation results.
36. `git diff --check` result.
37. Remaining Stage 3 blockers.
38. Whether F3-004 remains closed.
39. Whether Stage 3D is unblocked.
40. Initial and final Git status.
41. Complete files-changed inventory.
42. Concurrent external changes.
43. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3C.1:

1. Historical frozen snapshot is authoritative over divergent raw data.
2. Local history read does not silently rescore.
3. Progress does not silently rescore.
4. Backend restore does not silently rescore.
5. Report construction does not silently rescore.
6. Reading history does not rewrite history.
7. Missing versions do not become version 1.
8. Legacy unversioned remains non-current.
9. Known incompatible versions remain non-comparable.
10. Unsupported schema fails closed.
11. Malformed snapshot fails closed.
12. Source mismatch fails closed.
13. New Check-Up score/snapshot/assessment/history/backend metadata are consistent.
14. New Check-Up is not independently rescored at persistence boundaries.
15. Current complete official result remains block eligible.
16. Legacy/incompatible result remains block-ineligible.
17. Compatible Progress pair remains unchanged.
18. Incompatible Progress pair produces no trend.
19. Compatible report remains unchanged.
20. Incompatible report makes no progress claim.
21. Legacy-origin active block survives until current re-test.
22. Current re-test can complete the legacy-origin active block.
23. Current re-test can seed the next block.
24. Next-block focus comes from the current re-test.
25. Legacy baseline without active block cannot create a new block.
26. Original partial retry snapshot remains unchanged.
27. Merged retry receives a new current snapshot.
28. Backend sync preserves exact snapshot/version metadata.
29. Backend restore prefers frozen snapshot.
30. Report restore preserves compatibility state.
31. Stage 3A malformed-input protections remain.
32. Stage 3B all-three-domain completeness remains.
33. Manual/quick isolation remains.
34. Exact Check-Up types remain.
35. Stage 2A ROM fallback remains unmeasured.
36. Norm tables remain unchanged.
37. Scoring formulas remain unchanged.
38. Tie behavior remains unchanged.
39. Meaningful-change behavior remains unchanged.
40. No automatic re-analysis workflow exists.
41. No historical file is upgraded merely by reading.
42. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 3C.1 complete unless all are true:

1. Every historical scoring call site is classified.

2. No prohibited historical rescoring path remains.

3. Divergent raw-versus-snapshot tests prove frozen authority.

4. Local history read is proven non-mutating.

5. Restore is proven non-rescoring.

6. Missing versions are proven not to default to version 1.

7. Compatibility matrix is fully tested.

8. Source-ID/version mismatches fail closed.

9. Current new Check-Up metadata is internally consistent.

10. Current new Check-Up is scored once at the authoritative boundary.

11. Current complete official evidence remains block eligible.

12. Legacy/incompatible evidence cannot create a block.

13. Compatible Progress/report behavior remains unchanged.

14. Incompatible Progress/report behavior is neutral.

15. Legacy-active-block continuity is proven end to end.

16. Current re-test can seed the next block after incompatible history.

17. Legacy baseline without active block requires a new current baseline.

18. Backend snapshot sync and restore are verified.

19. Backend report compatibility round-trip is verified.

20. Retry snapshot behavior is verified.

21. Stage 3A regressions are explicitly verified.

22. Stage 3B regressions are explicitly verified.

23. Targeted tests pass.

24. Full suite passes.

25. Typecheck passes.

26. Expo config passes.

27. `git diff --check` passes.

28. No new warning is introduced without explanation.

29. No unrelated user work is reverted or overwritten.

30. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 3C VERIFIED`
- `STAGE 3C VERIFICATION BLOCKED`

Use `STAGE 3C VERIFIED` only if:

- F3-004 remains closed;
- frozen historical authority is explicitly proven;
- no read-time historical rewrite occurs;
- no silent historical rescoring remains;
- mismatch and compatibility matrices fail closed;
- legacy-active-block continuity works;
- all validation passes.

Also state exactly one:

- `STAGE 3D UNBLOCKED`
- `STAGE 3D BLOCKED`

Use `STAGE 3D UNBLOCKED` only if no P0/P1 software gap remains in Stage 3C’s versioning architecture.

Also state:

- `STAGE 4 REMAINS BLOCKED`
- `STAGE 5 INPUTS REMAIN BLOCKED`

Stage 4 and Stage 5 remain blocked because norm provenance, movement-age claims, tie semantics, and meaningful-change/reporting policy still require Stage 3D and later decisions.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact reason for each production change.
- Current scoring version.
- Current norm version.
- Snapshot schema version.
- Targeted test command and result.
- Full-suite result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Historical scoring call-site count and classifications.
- Confirmation that divergent raw data cannot override a frozen snapshot.
- Confirmation that history reads do not rewrite records.
- Confirmation that restore does not silently rescore.
- Confirmation that missing versions do not default to version 1.
- Confirmation that source/version mismatches fail closed.
- Confirmation that compatible reports remain unchanged.
- Confirmation that incompatible reports remain neutral.
- Confirmation that legacy-origin active-block continuity works.
- Confirmation that a current re-test can seed the next block after incompatible history.
- Confirmation that Stage 3A protections remain.
- Confirmation that Stage 3B protections remain.
- F3-004 status.
- Remaining Stage 3 blockers.
- `STAGE 3C VERIFIED` or `STAGE 3C VERIFICATION BLOCKED`.
- `STAGE 3D UNBLOCKED` or `STAGE 3D BLOCKED`.
- `STAGE 4 REMAINS BLOCKED`.
- `STAGE 5 INPUTS REMAIN BLOCKED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
