You are implementing the next lifecycle stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H4
PUBLIC V2 OFFICIAL RETEST, CLAIM-NEUTRAL PREVIOUS/CURRENT COMPARISON,
V2 BLOCK REPORT, PRIOR-BLOCK COMPLETION, AND AUTOMATIC NEXT BLOCK

This is the first complete V2 block-transition stage.

Its purpose is to replace the temporary H3 V2-retest-unavailable boundary with one production-quality, source-bound, idempotent lifecycle:

```text
V2 block reaches scheduler retest_due
-> public unified V2 official retest
-> new raw V2 Check-Up
-> frozen current V2 snapshot and assessment
-> claim-neutral previous/current comparison
-> one immutable V2 block report
-> prior V2 block completed
-> one automatic next V2 block
-> current Movement Profile
-> block report
-> next plan
```

Do not migrate the main Progress hero/history in this task.

Do not implement Warden chair percentiles.

Do not add improvement, decline, meaningful-change, “younger,” or “older” claims.

Do not begin H5.

## H3.1 prerequisite and current baseline

Stage H3.1 is verified.

Required report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

Recorded H3.1 outcomes include:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3.1 VERIFIED
FLAG-OFF PUBLIC V1 PATH VERIFIED
FLAG-ON PUBLIC UNIFIED ONBOARDING PATH VERIFIED
DOMAIN AND BALANCED ONBOARDING VERIFIED
PUBLIC UNIFIED IDEMPOTENCY / RESUME / RESTORE VERIFIED
ROLLBACK / KILL-SWITCH DATA PRESERVATION VERIFIED
V2 OFFICIAL-RETEST CONTAINMENT VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED
```

H3.1 added production-faithful integration coverage proving:

- release flag off preserves the V1 onboarding path;
- release flag on completes a live-coordinator-derived V2 domain baseline;
- release flag on completes a genuine Balanced baseline;
- raw V2 Check-Up saves before reference details;
- snapshot, assessment, and V2 block are created once;
- no V1 score, V1 assessment, or V1-origin block leaks into the unified path;
- duplicate callbacks are idempotent;
- local-first/sync-pending remains usable;
- restore parses frozen artifacts rather than recomputing them;
- completed and partial V2 states survive release-flag rollback;
- V2-origin official retest is currently contained across Today, Plan, Progress, Home/direct actions.

H3.1 validation reportedly passed:

- new H3.1 suite: 11 tests;
- focused H3/H3.1: 18 suites / 176 tests;
- full Jest: 140 suites / 1,158 tests;
- audio: 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- `git diff --check`.

Re-run the current baseline. Do not assume these counts remain unchanged.

## Founder/product decisions locked

### One canonical current measurement system

All new public official measurements under the unified release flag use:

```text
polished shared Check-Up shell
+
V2 live protocols
+
frozen V2 snapshots and assessments
+
automatic V2-origin plans
```

Do not route a V2-origin official retest through V1.

### No V1-user migration requirement

No real user completed a V1 Check-Up.

Do not add:

- a public legacy Movement Age section;
- V1-to-V2 conversion;
- mixed V1/V2 trend graphs;
- permanent dual current-result logic.

Keep the V1 flag-off rollback path intact during H4. Do not delete V1 in this stage.

### Plan creation remains automatic

The next block is created automatically during the successful official-retest transition.

The user does not build, create, generate, or personalise it manually.

Required UX:

```text
Current Movement Profile
-> View my block report
-> Your next 4-week plan is ready
-> View my next 4-week plan
```

The CTAs only navigate.

They must not create, regenerate, replace, sync, or start a block.

### Claim-neutral comparison

H4 may show compatible previous and current raw measurements side by side.

H4 must not say:

- improved;
- declined;
- increased;
- decreased;
- better;
- worse;
- stronger;
- steadier;
- more mobile;
- younger;
- older;
- meaningful change;
- protected progress;
- percentage change;
- percentile change;
- passed/failed.

Do not use green/red arrows or success/failure coloring to imply direction.

Do not display a numeric delta in H4.

Use labels such as:

```text
Previous Check-Up
Current Check-Up
```

When a domain is not directly comparable, show the current result normally and use calm copy such as:

```text
This result used a different standing leg, so Hale is showing it separately rather than comparing it directly.
```

### Warden chair policy

The future Warden product policy is approved, but implementation remains deferred.

H4 must not:

- embed Warden parameters;
- add an approximate substitute;
- enable a chair percentile;
- alter chair focus eligibility;
- add a percentile placeholder.

Chair remains raw-only.

### Physical-device posture

Physical-device validation is not claimed.

Public release remains blocked after H4 until H5/release hardening and physical-device validation are complete.

## Current architectural truths to preserve

### V2 official artifacts

Current V2 official artifacts are immutable and source-bound:

```text
raw V2 Check-Up
-> MovementProfileV2Snapshot
-> MovementProfileV2Assessment
-> V2 MovementBlock
```

Restore parses and never recomputes accepted frozen artifacts.

### V2 focus behavior

The pure V2 assessment policy already supports official-retest context:

- prior V2 domain or Balanced focus may be preserved only for official retests;
- clear current evidence may select a new domain;
- goal tie-breaking remains frozen into the new assessment;
- Balanced remains first-class;
- chair remains raw-only while Warden is disabled.

Do not duplicate or alter this policy.

### V2 protocol continuity

Current V2 protocol contracts already preserve:

- prior standing-leg selection;
- prior shoulder-side selection;
- changed-from-prior metadata;
- per-Check-Up reference profile;
- official source types including `official_retest`.

Reuse these contracts.

### Stage 5 schedule authority

A block becomes eligible for official retest only when the scheduler says:

```text
retest_due
```

The verified schedule requires:

- four sequential training weeks;
- 12 honest A/B/C schedule credits;
- minimum calendar timing;
- day after the final scheduled credit;
- schedule evidence rather than stale block counters.

Do not use raw `block.status`, `completedSessions`, or a stale retest flag as authority.

### Existing Stage 5 transition mechanics

Existing V1 Stage 5 lifecycle already demonstrates stable concepts for:

- retest completion identity;
- report identity;
- block completion;
- next-block creation;
- replay/idempotency;
- backend sync/restore.

Reuse claim-neutral lifecycle mechanics where compatible.

Do not cast V2 artifacts into V1 score snapshots or V1 `MovementAssessment`.

## Primary objectives

Stage H4 must:

1. Replace H3’s V2-origin retest-unavailable route with a real unified V2 official-retest path when eligible.

2. Keep the H3 unavailable path when:
   - the release flag is off;
   - scheduler status is not `retest_due`;
   - V2 source artifacts are missing/malformed/conflicting;
   - a different active block makes transition unsafe.

3. Freeze explicit official-retest context at launch:
   - current block;
   - prior source Check-Up;
   - prior snapshot;
   - prior assessment;
   - source type `official_retest`;
   - prior standing leg/shoulder side;
   - prior frozen reference profile.

4. Route official retest through the existing H1 polished Check-Up shell and V2 live coordinator.

5. Save raw V2 retest evidence before reference details.

6. Prefill reference details from the prior frozen snapshot and require confirmation/edit.

7. Create one new immutable V2 snapshot and assessment through the existing materialiser.

8. Use existing official-retest prior-focus policy.

9. Add one versioned, pure, claim-neutral V2 comparison contract.

10. Use the existing V2/V2 snapshot compatibility helper as the authority for per-domain comparability.

11. Add one immutable V2 block-report contract without fabricating V1 score data.

12. Add one pure V2 official-retest transition helper that:
    - validates scheduler and artifact authority;
    - creates/reuses the report;
    - records one retest completion;
    - marks the prior block completed;
    - creates/reuses one next V2 block;
    - returns one deterministic updated lifecycle state.

13. Make the transition replay-safe and resumable after partial local/remote persistence.

14. Persist locally before remote sync.

15. Add backend sync/restore/export support for the V2 report and transition metadata through existing bounded JSON architecture where possible.

16. Show the current frozen Movement Profile after retest.

17. Add a claim-neutral previous/current comparison section to the polished H2 result presentation.

18. Reuse the polished current block-report visual language for a V2 report without V1 Movement Age/change claims.

19. Automatically prepare the next domain or Balanced block.

20. Add exact navigation-only CTAs:
    - `View my block report`;
    - `View my next 4-week plan`.

21. Keep main Progress migration out of scope.

22. Preserve H0/H1/H2/H3/H3.1, Stage 3D-B, Stage 4, and Stage 5 regressions.

## Required prior reading

Read in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`
- current V1 report/block-transition reports and tests;
- current backend report/sync/restore reports.

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- `App.tsx`;
- `src/haleFlow/blockSchedule.ts`;
- current check-up transition helpers;
- current reports types/builders/view models;
- `BlockReportScreen`;
- block-report sync service;
- restore service;
- data export;
- H1/H2 shared shells;
- H3 public engine selector;
- V2 snapshot compatibility helpers;
- V2 prior side/leg/reference-profile selectors;
- V2 block materialiser;
- current Today/Plan/Progress/Home retest actions;
- current one-active-block policy.

Treat current code, including current untracked production files, as source of truth.

## Scope boundary

This task may change:

- public Check-Up engine selection for eligible V2 official retest;
- official-retest launch context/types;
- H1 unified V2 Check-Up wrapper props for retest;
- V2 reference-details prefill/confirmation integration;
- V2 comparison contract/parser/view model;
- V2 block-report contract/parser/builder;
- V2 official-retest transition helper;
- local adherence/report persistence;
- backend report/sync/restore/export JSON;
- H2 result presentation, narrowly, for claim-neutral comparison and report CTA;
- current block-report visual shell/adapters;
- Today/Plan/Progress/Home retest routing;
- tests;
- the H4 report.

This task may reuse but must not change the semantics of:

- V2 live coordinator;
- V2 protocol controllers;
- V2 reference engine;
- V2 snapshot builder/parser;
- V2 assessment builder/parser/focus policy;
- V2 block factory/materialiser;
- Stage 5 scheduler;
- Stage 5 credit/progression;
- equipment/capability/safety/release policies.

This task must not change:

- public baseline behavior from H3;
- V1 scoring/norm/focus;
- V2 source tables/transforms;
- Warden status;
- balance task-band thresholds;
- shoulder IQR tables;
- life-goal mapping;
- Check-Up visual design;
- exercise catalogue;
- training session generation policy;
- main Progress hero/history;
- weekly micro-check policy;
- public V1 route retirement;
- audio text/assets;
- native pose/camera configuration;
- website;
- dependencies;
- lockfiles;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

## Step 1: Capture exact initial state

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact outputs in the report.

Rules:

1. Treat all current tracked/untracked changes as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent App, report, Progress, backend, training, website, and pose work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent work makes safe lifecycle mutation ambiguous, stop mutation and mark H4 blocked.

## Step 2: Run current baseline before edits

Run a focused baseline covering:

- H3.1 public lifecycle;
- H3 public selector;
- V2 live coordinator;
- V2 snapshot/assessment/persistence;
- V2 block materialisation;
- V2 results adapters;
- block scheduler;
- V1 reports/block transition;
- report sync/restore/export;
- Today/Plan/Progress/Home retest actions;
- Stage 5H lifecycle.

Then run:

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
rm -rf /tmp/hale-unified-h4-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h4-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h4-baseline-export
exit $rc
```

Record exact counts and warnings.

If baseline fails for unrelated concurrent work:

- do not repair unrelated code;
- continue only if H4 can be fully validated safely;
- otherwise mark H4 blocked.

# PART B — RECONSTRUCT CURRENT RETEST / REPORT ARCHITECTURE

## Step 3: Trace every current retest entry

Trace exact production behavior for:

- Today;
- Plan;
- Progress;
- Home/next-best-action;
- direct `beginCheckUp('official_retest')`;
- manual Check-Up options;
- internal routes;
- crafted/direct route requests.

Create:

| Entry | Current V1-origin behavior | Current V2-origin behavior | H4 required behavior |
| --- | --- | --- | --- |

## Step 4: Trace current V1 official transition

Document:

```text
scheduler retest_due
-> V1 Check-Up
-> V1 score snapshot
-> V1 assessment
-> retest completion
-> block report
-> complete block
-> next block
```

Identify reusable claim-neutral lifecycle mechanics and V1-only score/claim mechanics.

## Step 5: Trace current report architecture

Inspect:

- report types;
- report IDs;
- local report storage/upsert;
- report view model;
- `BlockReportScreen`;
- report sync;
- restore;
- data export;
- next-best action/report-ready state.

Create:

| Report field/consumer | Claim-neutral/shared | V1 score-specific | H4 action |
| --- | --- | --- | --- |

Do not extend V1 score fields with fake V2 values.

# PART C — PUBLIC OFFICIAL-RETEST ENGINE SELECTION

## Step 6: Extend the pure public selector

Update the existing public engine selector rather than adding a second routing authority.

Inputs must explicitly include:

- source type;
- release flag;
- entry context;
- active/current block origin;
- scheduler status;
- accepted prior V2 Check-Up/snapshot/assessment availability;
- unsupported/conflict state if needed.

### V2-origin block + release flag on

Ready only when:

- requested source is `official_retest`;
- active/current block origin is `movement_profile_v2_assessment`;
- scheduler status is exactly `retest_due`;
- prior V2 source artifacts are valid and bound;
- no unsupported future policy;
- no conflicting active block.

Select:

```text
engine = unified_movement_profile
sourceType = official_retest
entryContext = public_official_retest
```

### V2-origin block + release flag off

Return typed unavailable.

Do not launch V1.

### V2-origin block not retest due

Return typed unavailable/early.

Do not downgrade to manual official evidence.

### V1-origin rollback block

Preserve current V1 official-retest behavior according to current release/rollback policy.

### Unknown/malformed origin

Fail closed.

## Step 7: Freeze official-retest launch context

At launch freeze a typed context containing at minimum:

- prior block ID/fingerprint;
- prior block focus;
- prior source Check-Up ID/type/fingerprint;
- prior snapshot ID/fingerprint;
- prior assessment ID/fingerprint;
- scheduler retest-not-before/date key;
- source type `official_retest`;
- entry context;
- prior standing leg;
- prior shoulder side;
- prior frozen reference profile/fingerprint;
- launch Check-Up ID/start time.

No ambient re-selection after launch.

A launched V2 retest never switches to V1.

# PART D — PUBLIC UNIFIED RETEST CHECK-UP

## Step 8: Reuse the H1 unified shell

Route eligible public V2 official retest through:

```text
MovementProfileV2UnifiedCheckUpScreen
-> CheckUpRecordingShell
-> existing V2 live coordinator
```

Do not create a separate retest player.

Public copy must not show:

- V2;
- internal;
- developer;
- diagnostics;
- policy/fingerprint IDs.

## Step 9: Prior standing-leg behavior

Prefill the prior official V2 standing leg.

The user must be able to confirm or deliberately change it.

If changed:

- current measurement remains valid;
- changed-from-prior metadata is frozen;
- direct balance comparison becomes unavailable;
- no warning blocks the Check-Up;
- use calm copy before confirmation.

## Step 10: Prior shoulder-side behavior

Prefill the prior official V2 shoulder side.

The user must confirm or deliberately change it.

If changed:

- current measurement remains valid;
- changed-from-prior metadata is frozen;
- direct shoulder comparison becomes unavailable;
- no far-side substitution;
- no claim that the result changed.

## Step 11: Chair setup

Chair setup is collected again.

Do not assume the same chair/setup.

Current raw result remains valid according to current V2 policy.

Reference comparison remains disabled because Warden is deferred.

## Step 12: Incomplete/invalid retest

If a headline domain is invalid/missing:

- save raw evidence according to current policy;
- do not create an official current assessment;
- do not create a report;
- do not complete the prior block;
- do not create a next block;
- prior block remains `retest_due`;
- route to typed retake/recovery;
- never fall back to V1.

# PART E — RETEST REFERENCE DETAILS

## Step 13: Prefill from prior frozen snapshot

Use the prior accepted V2 snapshot’s frozen reference profile as a draft:

- exact age at prior test may prefill;
- published reference group may prefill;
- mark draft as prefilled, not silently confirmed.

The user must confirm/edit for the new Check-Up.

Do not mutate the old snapshot or global profile.

## Step 14: Age at current test

Use the explicit submitted age for the new retest snapshot.

Do not automatically increment age from elapsed time.

Do not infer from a legacy representative age.

Skip remains allowed.

## Step 15: Reference-profile changes

A changed age/reference group:

- creates a new frozen reference profile;
- does not rewrite prior interpretation;
- may make reference categories non-comparable;
- does not invalidate compatible raw comparison;
- is recorded in comparison compatibility reasons.

# PART F — CURRENT RETEST ARTIFACT MATERIALISATION

## Step 16: Reuse the existing V2 artifact orchestrator

Use:

```text
materializeOfficialMovementProfileV2Artifacts
```

with:

- source type `official_retest`;
- explicit current reference profile;
- explicit current life goal;
- explicit timestamps;
- accepted prior V2 focus context from the block’s source assessment.

Do not add a second snapshot or focus engine.

## Step 17: Prior-focus context

Only the accepted prior block/source assessment may provide official-retest prior focus.

Do not use:

- V1 focus;
- current block display labels;
- current life goal as a substitute for frozen prior focus;
- arbitrary latest assessment from another block.

## Step 18: Current artifact requirements

H4 transition requires:

- valid current raw-complete official V2 Check-Up;
- valid current source-bound snapshot;
- valid current source-bound assessment with domain or Balanced focus;
- valid prior source artifacts;
- current block matching prior assessment;
- scheduler `retest_due`.

# PART G — CLAIM-NEUTRAL V2 COMPARISON CONTRACT

## Step 19: Reuse compatibility authority

Inspect and use the existing V2/V2 snapshot compatibility helper, including current support for:

- protocol/display/source policy compatibility;
- raw comparability;
- reference comparability;
- changed standing leg;
- changed shoulder side;
- missing reference profile.

Do not duplicate these rules in the UI.

If the helper has a proven defect, add a failing test and make the narrowest pure fix.

## Step 20: Add a versioned comparison artifact/view model

Create a pure strict contract, conceptually:

```ts
type MovementProfileV2RetestComparison = {
  kind: 'movement_profile_v2_retest_comparison';
  schemaVersion: number;
  comparisonPolicyVersion: number;
  comparisonPolicyFingerprint: string;

  comparisonId: string;
  comparisonFingerprint: string;

  prior: {
    checkUpId: string;
    snapshotId: string;
    snapshotFingerprint: string;
    assessmentId: string;
    assessmentFingerprint: string;
    completedAt: string;
  };

  current: {
    checkUpId: string;
    snapshotId: string;
    snapshotFingerprint: string;
    assessmentId: string;
    assessmentFingerprint: string;
    completedAt: string;
  };

  domains: {
    strength_power: ...;
    balance_stability: ...;
    mobility_flexibility: ...;
  };

  overallStatus: 'comparable' | 'partially_comparable' | 'not_comparable';
};
```

Adapt to current domain names.

Requirements:

- deterministic;
- JSON-safe;
- no ambient clock;
- strict parser;
- exact source binding;
- no V1 fields;
- no score;
- no ranking;
- no delta;
- no direction label;
- no diagnosis;
- no raw frames/landmarks.

## Step 21: Domain comparison states

Use a union such as:

```ts
type MovementProfileV2DomainComparison =
  | {
      status: 'raw_comparable';
      previousValue: number;
      currentValue: number;
      unit: 'reps' | 'seconds' | 'degrees';
      referenceComparable: boolean;
      previousInterpretation?: string;
      currentInterpretation?: string;
      reasonCodes: readonly string[];
    }
  | {
      status: 'shown_separately';
      previousValue?: number;
      currentValue?: number;
      unit: ...;
      reasonCodes: readonly string[];
    }
  | {
      status: 'unavailable';
      reasonCodes: readonly string[];
    };
```

Do not store a numeric difference.

## Step 22: Chair comparison policy

Chair may show:

```text
Previous Check-Up: 12 rises in 30 seconds
Current Check-Up: 14 rises in 30 seconds
```

only when current compatibility policy says raw comparison is permitted.

Do not show:

- `+2`;
- improved;
- stronger;
- percentile;
- age comparison.

If setup/protocol makes comparison unsuitable, show current result and a separate/non-comparable note.

## Step 23: Balance comparison policy

Direct raw comparison requires current compatibility approval, including the same standing leg and compatible protocol.

If standing leg changed:

- show current result normally;
- prior result may be shown separately in detail;
- state that a different standing leg was used;
- do not display a direct comparison panel as if equivalent.

Do not infer direction from task-band movement.

## Step 24: Shoulder comparison policy

Direct raw comparison requires the same selected side and compatible protocol.

If side changed:

- current result remains valid;
- show separate/non-comparable copy;
- do not infer direction.

`Above the published middle range` remains neutral.

## Step 25: Reference interpretation comparison

Reference categories may be displayed side by side only when the existing compatibility helper says reference interpretation is comparable.

Do not create:

- percentile change;
- category improvement;
- better/worse;
- meaningful-change claim.

Current result cards still display their frozen current interpretation.

## Step 26: Supporting hinge

Hinge remains supporting only.

Do not include it as a headline comparison or focus result in H4.

It may appear in technical detail only if existing product design already supports it.

# PART H — V2 BLOCK-REPORT CONTRACT

## Step 27: Do not fake a V1 report

Inspect the current `BlockReport` architecture.

Choose one safe architecture:

### Preferred when current report type can be versioned cleanly

Add a discriminated report union:

```ts
type BlockReport =
  | LegacyV1BlockReport
  | MovementProfileV2BlockReport;
```

### Otherwise

Add a parallel strict V2 report contract and adapt the report store/view layer.

Do not:

- create a V1 score snapshot;
- populate V1 Movement Age fields;
- set `weakestDomain`;
- reinterpret V2 data as V1;
- attach V1 meaningful-change copy.

## Step 28: V2 report identity

Prefer the current stable report identity policy when safe:

```text
block-report-<prior-block-id>
```

A V2 block ID is already distinct.

Requirements:

- one report per completed prior block;
- same material reuses;
- same ID/different fingerprint is immutable conflict;
- no random UUID;
- no callback-time identity;
- created/completed timestamp anchored to immutable retest Check-Up time.

## Step 29: V2 report material

Freeze at minimum:

- report kind/schema/version/fingerprint;
- report ID;
- prior block ID/fingerprint;
- prior block focus;
- prior source Check-Up/snapshot/assessment IDs/fingerprints;
- current official-retest Check-Up/snapshot/assessment IDs/fingerprints;
- V2 comparison ID/fingerprint/content or exact reference;
- schedule summary:
  - 4 training weeks;
  - 12 schedule credits;
  - first/final credited dates;
  - block start date;
  - retest eligibility date;
- prior suggested focus;
- current suggested focus;
- next block ID/fingerprint;
- explicit created/completed time;
- policy versions/fingerprints.

Do not store:

- raw pose data;
- video;
- landmarks;
- free-text health notes;
- source PDFs/tables;
- provider secrets;
- V1 age ranges.

## Step 30: Report copy model

Create a pure V2 report presentation model.

Recommended headline:

```text
Your 4-week block is complete
```

Recommended supporting copy:

```text
You completed the plan and finished your next Movement Check-Up.
```

Training summary may state:

```text
12 plan sessions completed
```

Current/previous results use claim-neutral labels.

Next-plan panel:

```text
Your next 4-week plan is ready
Hale prepared it from your latest Movement Profile.
```

CTA:

```text
View my next 4-week plan
```

Do not say the user improved or prevented decline.

# PART I — PURE OFFICIAL-RETEST TRANSITION

## Step 31: Add one pure V2 transition helper

Create a pure helper, conceptually:

```ts
transitionMovementProfileV2OfficialRetest({
  priorState,
  priorBlock,
  schedule,
  priorArtifacts,
  currentCheckUp,
  currentSnapshot,
  currentAssessment,
  explicitTransitionTimestamp,
})
```

Return a typed union:

```ts
type MovementProfileV2OfficialRetestTransitionResult =
  | {
      status: 'ready';
      action: 'created' | 'reused' | 'resumed';
      comparison: MovementProfileV2RetestComparison;
      report: MovementProfileV2BlockReport;
      retestCompletion: TrainingSessionCompletion;
      completedPriorBlock: MovementBlock;
      nextBlock: MovementBlock;
      nextState: AdherenceState;
      diagnostics: readonly Diagnostic[];
    }
  | {
      status:
        | 'not_retest_due'
        | 'source_mismatch'
        | 'prior_artifact_invalid'
        | 'current_artifact_invalid'
        | 'active_block_conflict'
        | 'immutable_conflict'
        | 'next_block_ineligible'
        | 'unsupported_policy';
      diagnostics: readonly Diagnostic[];
    };
```

Adapt to current stores/types.

## Step 32: Transition authority order

The pure transition must validate before lifecycle mutation:

1. Scheduler is `retest_due`.
2. Prior block is the current V2-origin block.
3. Prior block source artifacts are valid/bound.
4. Current Check-Up is valid official V2 retest.
5. Current snapshot/assessment are valid/bound.
6. Current assessment can create a V2 block.
7. Comparison can be created.
8. Report can be created/reused.
9. Stable retest completion can be created/reused.
10. Prior block can be completed.
11. Next block can be created/reused without another active-block conflict.

Only then return a ready updated lifecycle state.

Do not partially mutate input.

## Step 33: Stable timestamp policy

Use immutable retest Check-Up identity/time:

```text
checkUp.startedAt
```

or the current verified `checkUpCompletionTimestamp` helper.

Do not use callback time for:

- report ID;
- report createdAt;
- retest completion identity;
- next-block start date;
- transition identity.

Equal accepted inputs must produce equal output.

## Step 34: Existing active-block handling

The prior due block is allowed to transition.

Any other active/paused block fails closed.

Do not silently replace it.

## Step 35: Next block

Create through the existing V2 block factory/material policy.

The next block:

- binds to the current retest assessment/snapshot/Check-Up;
- uses the current frozen domain or Balanced focus;
- gets a stable ID from the current assessment;
- starts from the explicit retest transition date;
- retains all current equipment/capability/safety/release/progression planning behavior;
- is automatic.

Do not create a V1 block.

## Step 36: Prior block completion

The prior block becomes completed only as part of a valid ready transition.

Do not complete it merely because a raw retest exists.

Do not mark it completed if next-block creation is ineligible/conflicted.

## Step 37: Retest completion evidence

Create one stable completion/evidence record that the Stage 5 scheduler recognises.

Requirements:

- exact prior block ID;
- source `official_retest`;
- planned date/identity according to current policy;
- no main-plan schedule credit;
- not progression-eligible;
- deduped;
- source-bound to current official retest.

# PART J — LOCAL APPLICATION SERVICE

## Step 38: Add one application boundary

After current V2 snapshot/assessment materialisation:

1. Call the pure official-retest transition.
2. On `ready`, persist the updated local lifecycle state once.
3. Persist/update the current Check-Up with frozen artifacts.
4. Persist the V2 report locally.
5. Preserve the completed prior block and active next block.
6. Navigate to the retest result.
7. Sync in the background.
8. Return plan/report readiness.

Do not put transition construction in the screen.

## Step 39: Local-first atomicity

Prefer one local adherence-state update containing:

- retest completion;
- report;
- completed prior block;
- next block.

If current stores are split, use deterministic ordered upserts and an idempotent resume selector.

A process crash at any point must be recoverable from stable artifacts.

## Step 40: No transition on failure

When the transition is not ready:

- preserve raw current retest;
- preserve any valid current snapshot/assessment;
- preserve prior block as `retest_due`;
- do not create report;
- do not complete prior block;
- do not create next block;
- show typed recovery;
- allow safe replay when the cause is resolved.

# PART K — IDEMPOTENCY AND PARTIAL-STATE RECOVERY

## Step 41: Replay same official-retest callback

Repeated identical callback must produce:

- one current retest Check-Up;
- one current snapshot;
- one current assessment;
- one comparison;
- one retest completion;
- one report;
- one completed prior block;
- one active next block;
- stable timestamps/fingerprints.

## Step 42: Existing partial states

Add pure selectors/recovery for:

1. Current retest raw complete, no snapshot.
2. Current snapshot, no assessment.
3. Current assessment, no report transition.
4. Report exists, prior block not completed.
5. Prior block completed, next block missing.
6. Next block exists, report sync pending.
7. Local transition complete, remote state stale.
8. Same-ID report conflict.
9. Same-ID next-block conflict.

Rules:

- resume from accepted frozen truth;
- never recompute accepted snapshot/assessment;
- never duplicate report/next block;
- immutable conflict fails closed;
- no V1 fallback.

## Step 43: Flag rollback during transition

If the public unified release flag becomes off:

- a new V2 official retest cannot start;
- an already locally completed transition remains readable/trainable;
- a local transition pending only remote sync continues sync/recovery;
- a raw/partial V2 retest never becomes V1;
- no artifacts are deleted.

Document exact continuation policy for partial local states.

# PART L — BACKEND SYNC / RESTORE / EXPORT

## Step 44: Report sync

Extend the existing report sync path using bounded JSON where possible.

Preserve:

- report kind/schema;
- V2 report/comparison fingerprints;
- source IDs;
- schedule summary;
- next-block identity.

Do not add compact V1 score columns for V2.

## Step 45: Transition sync ordering

Best-effort remote sync may include:

- current retest Check-Up/snapshot/assessment;
- retest completion;
- completed prior block;
- V2 report;
- next block;
- training state.

Local truth remains usable if any remote call fails.

## Step 46: Restore

Restore must:

- parse V2 report strictly;
- preserve source binding;
- parse current retest artifacts;
- restore prior completed block;
- restore one active next block;
- dedupe identical rows;
- preserve first accepted immutable truth on conflict;
- never recreate V1 score/assessment;
- never recompute comparison from raw data when a valid frozen report exists.

## Step 47: Data export/account clearing

Verify:

- V2 reports appear in data export through bounded JSON;
- no raw media/landmarks;
- local account clear removes V2 report with the account’s other local state;
- no orphan comparison store remains.

Do not add a separate database migration unless the existing JSON architecture is genuinely insufficient.

# PART M — RETEST RESULT PRESENTATION

## Step 48: Extend the shared H2 result presentation narrowly

Add an optional official-retest comparison section to the protocol-neutral result shell/types.

Requirements:

- V1 standard/onboarding output unchanged;
- V2 baseline output unchanged;
- official-retest variant only;
- adapters consume the frozen V2 comparison/view model;
- shell does not compute comparison;
- no score/reference engine import.

## Step 49: Retest result header

Use:

```text
Your Movement Profile
```

Add a calm subtitle such as:

```text
Your latest Check-Up is saved.
```

Do not say improvement/decline.

## Step 50: Domain cards

Current domain cards remain the frozen current V2 result cards.

Below or after them, render a compact previous/current comparison only for compatible domains.

Example:

```text
Chair-rise capacity
Previous Check-Up: 12 rises in 30 seconds
Current Check-Up: 14 rises in 30 seconds
```

No delta or direction label.

## Step 51: Non-comparable domain

Use a neutral note and do not present equivalent-column styling.

Examples:

```text
A different standing leg was used this time, so Hale is showing the current balance result separately.
```

```text
A different shoulder was tested this time, so Hale is showing the current reach result separately.
```

## Step 52: Current suggested focus

Show the current frozen focus or Balanced.

It may differ from the prior plan.

Do not say the old focus was wrong.

## Step 53: Retest result action

Primary CTA:

```text
View my block report
```

It only navigates to the already-created report.

A direct `View my next 4-week plan` action may appear only after the report according to the flow below.

# PART N — V2 BLOCK-REPORT PRESENTATION

## Step 54: Reuse the polished report visual system

Inspect `BlockReportScreen`.

Extract/reuse a protocol-neutral visual shell only if necessary.

Preserve V1 rollback behavior.

Do not create a generic low-quality replacement.

## Step 55: V2 report sections

Recommended order:

1. Header:
   - `Your 4-week block is complete`.

2. Training summary:
   - `12 plan sessions completed`;
   - training dates/weeks where current design supports them.

3. Movement Profile comparison:
   - claim-neutral previous/current values;
   - non-comparable notes.

4. Latest suggested focus:
   - domain or Balanced.

5. Next plan:
   - `Your next 4-week plan is ready`;
   - domain or balanced explanation.

6. CTA:
   - `View my next 4-week plan`.

## Step 56: Next-plan CTA

The report CTA:

- opens the already-created next block intro/Plan;
- does not create/upsert/sync a block;
- does not change the next block start date;
- does not start Session A automatically;
- is idempotent.

## Step 57: Report replay/read-only

Opening the report later:

- reads the stored V2 report;
- does not rerun comparison;
- does not recreate the next block;
- does not change prior/current focus;
- does not mutate lifecycle.

# PART O — TODAY / PLAN / PROGRESS / HOME ROUTING

## Step 58: Eligible V2 retest

When scheduler says `retest_due` and release flag is on:

- Today action starts public unified V2 official retest;
- Plan action does the same;
- Progress action does the same;
- Home/next-best-action does the same;
- direct official-retest action uses the same selector.

No consumer implements its own gate.

## Step 59: Early/ineligible V2 retest

All consumers show consistent typed recovery/unavailable state.

Do not launch V1.

## Step 60: After successful transition

Consumers must agree:

- prior block completed;
- report ready;
- one next block active;
- Today/Plan now use the next block;
- Home may show report-ready or next-session state according to current product order;
- Progress remains visually unchanged except existing data plumbing needed for correctness.

Do not perform H5 Progress redesign.

# PART P — V1 ROLLBACK CONTAINMENT

## Step 61: V1-origin official retest

Preserve current V1 official-retest/report/next-block behavior under the flag-off rollback path.

Do not regress V1 tests.

## Step 62: No cross-protocol transition

V2 official retest must never create:

- V1 score snapshot;
- V1 `MovementAssessment`;
- V1 block report;
- V1 next block;
- Movement Age copy.

V1 official retest must not create V2 artifacts.

# PART Q — COPY / ACCESSIBILITY / RESPONSIVE

## Step 63: Copy guardrails

Scope V2 H4 guardrails to new modules/screens.

Disallow:

- improved;
- declined;
- increased;
- decreased;
- better;
- worse;
- stronger;
- steadier;
- more mobile;
- younger;
- older;
- meaningful change;
- passed;
- failed;
- protected progress;
- percentage change;
- percentile change;
- Movement Age;
- weakest;
- Build/Create/Generate/Personalise plan;
- V2/internal/schema/fingerprint wording.

Allow exact factual labels:

```text
Previous Check-Up
Current Check-Up
Your 4-week block is complete
12 plan sessions completed
Your next 4-week plan is ready
View my block report
View my next 4-week plan
```

## Step 64: Accessibility

Required:

- comparison values announced with domain and date/context;
- non-comparable reason announced;
- no color-only direction;
- no arrows read as trend;
- focus and next-plan text announced;
- report CTA says it opens an existing prepared plan;
- touch targets and text scaling preserved.

## Step 65: Responsive

Verify:

- compact phone;
- standard Android;
- large phone;
- large text;
- long non-comparable notes;
- Balanced focus/plan copy;
- three comparison domains;
- report CTA safe area.

Use existing responsive helpers.

# PART R — OBSERVABILITY / PRIVACY

## Step 66: Bounded diagnostics

Use stable codes such as:

- `v2_official_retest_started`;
- `v2_official_retest_not_due`;
- `v2_retest_artifacts_ready`;
- `v2_retest_comparison_created`;
- `v2_retest_report_created`;
- `v2_retest_transition_reused`;
- `v2_retest_transition_resumed`;
- `v2_retest_next_block_ready`;
- `v2_retest_sync_pending`;
- `v2_retest_immutable_conflict`.

Include only:

- block/report/check-up/snapshot/assessment IDs;
- focus mode;
- comparison status;
- policy versions/fingerprints;
- action/reason codes.

Exclude:

- landmarks;
- video/images;
- raw body coordinates;
- full profile;
- free-text health data;
- auth tokens;
- provider secrets.

Pure helpers do not log.

# PART S — REQUIRED TEST MATRIX

## A. Public selector and gate

- V2-origin + retest_due + release on -> unified official retest.
- V2-origin + release off -> unavailable.
- V2-origin + early -> unavailable.
- V2-origin + stale block status but scheduler not due -> unavailable.
- V1-origin rollback -> current V1 behavior.
- malformed origin -> unavailable.
- decision frozen.

## B. Launch context

- exact prior block/artifact binding;
- prior leg/side/reference profile;
- source type official_retest;
- deterministic Check-Up ID/start;
- stale/mismatched prior context blocked.

## C. Live official retest

- domain prior block;
- Balanced prior block;
- prior leg confirmed;
- leg changed;
- prior shoulder confirmed;
- shoulder changed;
- chair setup collected again;
- raw saved before reference details;
- no V1 controller/artifact.

## D. Reference details

- prior prefill;
- explicit confirmation;
- age edit;
- reference group edit;
- skip;
- no old snapshot mutation;
- no global profile mutation.

## E. Current artifacts

- valid domain assessment;
- valid Balanced assessment;
- prior-focus preservation;
- clear new focus;
- invalid headline fail-closed;
- duplicate materialisation reuse.

## F. Comparison

- all domains comparable;
- balance leg changed;
- shoulder side changed;
- reference profile changed;
- protocol/display/source incompatibility;
- raw comparable/reference not comparable;
- no delta/direction fields;
- strict parser/fingerprint;
- input non-mutation.

## G. V2 report

- domain report;
- Balanced report;
- stable ID;
- strict parser;
- same material reuse;
- immutable conflict;
- schedule summary exactly 12 credits/four weeks;
- no V1 score/age fields;
- JSON-safe.

## H. Transition

- scheduler due;
- early blocked;
- source mismatch;
- valid full transition;
- current report;
- retest completion;
- prior block completed;
- next block active;
- domain next block;
- Balanced next block;
- no second active block.

## I. Idempotency

- repeated raw callback;
- repeated reference submit;
- repeated artifact materialisation;
- repeated transition;
- repeated report route;
- repeated next-plan CTA;
- different fallback clocks;
- stable timestamps/IDs/fingerprints.

## J. Partial persistence / resume

- current assessment no report;
- report no completed block;
- completed prior block no next block;
- next block local/report sync pending;
- stale remote state;
- same-ID report conflict;
- same-ID next block conflict;
- no V1 fallback.

## K. Offline/sync/restore/export

- every remote call fails after local ready;
- local report/results/next block usable;
- retry no duplicates;
- restore complete transition;
- restore partial transition;
- export includes bounded V2 report;
- account clear removes report.

## L. Result UI

- current V2 cards;
- compatible previous/current raw display;
- non-comparable notes;
- no direction labels/delta;
- current focus/Balanced;
- exact `View my block report`;
- navigation only.

## M. Report UI

- V2 report shell;
- 12-session summary;
- neutral comparison;
- next focus;
- exact `View my next 4-week plan`;
- navigation only;
- later reopening read-only.

## N. Consumer consistency

- Today;
- Plan;
- Progress;
- Home;
- direct action;
- scheduler authority;
- after transition next block consistency.

## O. V1 rollback

- V1 official retest unchanged;
- V1 report unchanged;
- no V2 artifacts from V1.

## P. Copy/accessibility/privacy

- prohibited terms absent;
- no arrows/color-only direction;
- semantic labels;
- bounded diagnostics;
- no pose/media/health text/secrets.

## Q. Product containment

- no Progress redesign;
- no micro-check policy change;
- no Warden;
- no audio;
- no public V1 retirement;
- no protocol/reference/focus policy change.

## R. Regression

- H0;
- H1;
- H2;
- H3;
- H3.1;
- Stage 3D-B artifacts;
- V2 automatic block;
- Stage 4;
- Stage 5G.1/H;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

## Test-quality requirements

Tests must:

- use the production public selector;
- use scheduler-derived `retest_due`;
- produce at least one current retest raw Check-Up through the live coordinator/synthetic replay;
- use real V2 snapshot/assessment materialisation;
- use real V2 block materialisation;
- use real local report/adherence stores;
- use deterministic IDs/timestamps;
- test domain and Balanced transitions;
- test actual wrappers/view models;
- assert no V1 artifact leak;
- assert no hidden change claims.

Tests must not:

- mock every layer;
- use arbitrary casted artifacts;
- use real camera hardware;
- use network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- weaken scheduler/source/immutability guards.

# PART T — VALIDATION COMMANDS

## Step 67: Focused H4 validation

Run focused tests for:

- public selector;
- V2 official-retest context;
- live V2 retest flow;
- V2 comparison;
- V2 report;
- transition/idempotency;
- backend sync/restore/export;
- H2 result adapter;
- BlockReport screen/adapter;
- Today/Plan/Progress/Home;
- Stage 5G.1/H.

Record exact command and counts.

## Step 68: Full release gate

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
rm -rf /tmp/hale-unified-h4-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h4-export
rc=$?
rm -rf /tmp/hale-unified-h4-export
exit $rc
```

Do not install dependencies.

Record:

- focused suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
- app typecheck;
- website typecheck;
- Expo config;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART U — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Eligible domain retest

```text
domain V2 block scheduler retest_due
-> Today/Plan/Progress/Home
-> public selector
-> unified V2 official retest
-> raw saved
-> reference profile confirmed
-> current snapshot + assessment
-> neutral comparison
-> V2 report
-> prior block completed
-> domain next block
-> Movement Profile
-> View my block report
-> View my next 4-week plan
```

## Eligible Balanced retest

Trace the same lifecycle with:

- prior Balanced block;
- current domain or Balanced focus according to frozen assessment;
- genuine next block focus;
- no fake domain.

## Incomplete retest

```text
invalid headline
-> raw saved
-> no transition
-> prior block remains retest_due
-> no report
-> no next block
```

## Replay

```text
same official-retest callback twice
-> one report
-> one retest completion
-> one next block
```

## Offline

```text
local transition ready
-> remote failures
-> report and next block usable
-> later sync retry
```

## V1 rollback

```text
true V1 block
-> current V1 retest/report path unchanged
```

# PART V — REPORT

Create exactly one report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. H3.1 prerequisite evidence.
3. Founder decisions carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current retest-entry map.
7. Current V1 report/transition architecture.
8. Public V2 official-retest selector.
9. Frozen retest launch context.
10. Unified V2 retest Check-Up.
11. Prior leg/side behavior.
12. Reference-details prefill/confirmation.
13. Current artifact materialisation.
14. Comparison compatibility authority.
15. V2 comparison contract.
16. Chair comparison behavior.
17. Balance comparison behavior.
18. Shoulder comparison behavior.
19. V2 block-report contract.
20. Report identity/fingerprint.
21. Report presentation.
22. Pure official-retest transition.
23. Transition authority/order.
24. Prior-block completion.
25. Next-block creation.
26. Local application service.
27. Idempotency.
28. Partial-state recovery.
29. Offline/sync/restore/export.
30. Retest result presentation.
31. Block-report presentation.
32. Today/Plan/Progress/Home consistency.
33. V1 rollback containment.
34. Copy/accessibility/responsive.
35. Observability/privacy.
36. Product containment.
37. Files changed.
38. Tests added/changed.
39. Exact focused validation.
40. Exact full validation.
41. Audio verification.
42. App/website typechecks.
43. Expo config/export.
44. H0-H3.1/Stage 3D-B/Stage 4/Stage 5 regression.
45. Remaining H5/release work.
46. Whether H5 is unblocked.
47. Initial/final Git status.
48. Complete files-changed inventory.
49. Concurrent external changes.
50. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H4:

1. V2-origin official retest uses scheduler `retest_due`.
2. V2-origin official retest never launches V1.
3. Release flag off does not start a new V2 retest.
4. V1-origin rollback retest remains unchanged.
5. Retest launch freezes prior block/artifact context.
6. Prior standing leg and shoulder side prefill.
7. User can deliberately change side/leg.
8. Changed side/leg suppresses direct domain comparison.
9. Raw current retest saves before reference details.
10. Reference details prefill but require confirmation/edit.
11. Old artifacts remain immutable.
12. Current snapshot/assessment are created once.
13. Official-retest prior-focus policy is reused.
14. Invalid headline evidence creates no transition.
15. One versioned comparison exists.
16. Comparison uses existing compatibility authority.
17. Comparison stores no delta/direction claim.
18. Chair remains raw-only.
19. One V2 report exists per prior block.
20. V2 report contains no V1 score/age fields.
21. One stable retest completion exists.
22. Prior block completes only in a valid transition.
23. One automatic next V2 block exists.
24. Next block binds to the current retest assessment.
25. Balanced remains first-class.
26. No second active block exists.
27. Repeated callbacks are idempotent.
28. Partial transitions are resumable.
29. Local-ready works when remote sync fails.
30. Restore does not recompute accepted comparison/report.
31. Retest result uses frozen current V2 data.
32. Previous/current UI is claim-neutral.
33. Retest CTA is exactly `View my block report`.
34. Report CTA is exactly `View my next 4-week plan`.
35. Both CTAs navigate only.
36. No improvement/decline language exists.
37. Today/Plan/Progress/Home agree.
38. Main Progress redesign is not performed.
39. Weekly micro-check policy is unchanged.
40. Warden remains deferred.
41. Audio remains 150 assets.
42. Full repository gate passes.
43. Physical-device validation is not claimed.
44. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H4 complete unless:

1. Eligible V2 official retest is public-routed through the unified shell.

2. Early/ineligible V2 retest remains fail-closed.

3. A production-faithful live-derived official retest completes the full transition.

4. Domain and Balanced cases pass.

5. The comparison is strict, immutable, and claim-neutral.

6. No numeric delta or directional claim appears.

7. One immutable V2 report is stored and restored.

8. One retest completion is scheduler-recognised.

9. Prior block completes exactly once.

10. Next block is automatically created exactly once.

11. Transition replay/partial recovery/offline restore pass.

12. V1 rollback behavior remains.

13. Result/report CTAs are navigation-only.

14. Today/Plan/Progress/Home agree.

15. Targeted tests pass.

16. Full Jest passes.

17. Audio verification passes.

18. App typecheck passes.

19. Website typecheck passes.

20. Expo config passes.

21. Android/iOS export passes.

22. `git diff --check` passes.

23. No new warning is introduced without explanation.

24. No unrelated work is overwritten.

25. No package install or lockfile change occurs.

26. No audio regeneration occurs.

27. No staging, commit, branch, or push occurs.

Do not mark H4 complete if:

- V2 retest is converted to V1;
- report uses V1 Movement Age fields;
- a raw retest completes the block without a valid assessment;
- next block is created by a CTA;
- next block is duplicated;
- side/leg changes are compared directly;
- “improved” or equivalent language appears;
- Progress is redesigned;
- Warden output is enabled;
- H5 is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4 COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H4 BLOCKED
```

Also state exactly one:

```text
PUBLIC V2 OFFICIAL RETEST IMPLEMENTED
PUBLIC V2 OFFICIAL RETEST BLOCKED
```

Also state exactly one:

```text
CLAIM-NEUTRAL V2 RETEST COMPARISON IMPLEMENTED
V2 RETEST COMPARISON BLOCKED
```

Also state exactly one:

```text
V2 BLOCK REPORT IMPLEMENTED
V2 BLOCK REPORT BLOCKED
```

Also state exactly one:

```text
V2 PRIOR-BLOCK COMPLETION AND AUTOMATIC NEXT BLOCK VERIFIED
V2 BLOCK TRANSITION BLOCKED
```

Also state exactly one:

```text
V2 RETEST IDEMPOTENCY / RESUME / RESTORE VERIFIED
V2 RETEST LIFECYCLE RECOVERY BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5 BLOCKED
```

Use H5 unblocked only when:

- domain and Balanced official-retest lifecycles pass;
- comparison/report/next block are immutable and idempotent;
- offline/restore passes;
- V1 rollback remains;
- no P0/P1 lifecycle defect remains.

Also state:

```text
PLAN CREATION REMAINS AUTOMATIC
RETEST RESULT CTA IS NAVIGATION-ONLY
NEXT-PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
NO IMPROVEMENT OR DECLINE CLAIMS
NO V1 LEGACY-RESULT MIGRATION REQUIRED
MAIN PROGRESS MIGRATION NOT PERFORMED
WEEKLY MICRO-CHECK POLICY UNCHANGED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED
STAGE 4 REMEDIATION COMPLETE
STAGE 5 REMEDIATION COMPLETE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE DEFINITION

If H4 completes, H5 is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5
V2-CANONICAL PROGRESS, CURRENT/HISTORICAL MOVEMENT PROFILE PRESENTATION,
BALANCED MICRO-CHECK PRODUCT POLICY, PUBLIC V1 ROUTE RETIREMENT,
AND RELEASE-CANDIDATE HARDENING
```

H5 should:

- make V2 the canonical Progress current state;
- present V2 history with protocol-compatible raw comparisons only;
- decide and implement Balanced weekly micro-check behavior;
- remove public V1 Check-Up/result entry while retaining a temporary rollback build option if required;
- remove beta-facing developer entries;
- harden release diagnostics/build flags;
- run full multi-block lifecycle verification;
- retain Warden deferral unless separately approved and implemented;
- prepare—but not fabricate—physical-device/release sign-off.

Do not begin H5 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Public selector/retest routing.
- Frozen retest launch context.
- Prior standing-leg/shoulder-side behavior.
- Reference-details prefill behavior.
- Current snapshot/assessment result.
- Comparison contract and compatibility authority.
- Chair comparison behavior.
- Balance comparison behavior.
- Shoulder comparison behavior.
- V2 report contract/identity.
- Report presentation.
- Pure transition architecture.
- Prior-block completion behavior.
- Automatic next-block behavior.
- Domain lifecycle result.
- Balanced lifecycle result.
- Idempotency result.
- Partial-state recovery.
- Offline/sync/restore/export result.
- Retest-result CTA behavior.
- Block-report CTA behavior.
- Today/Plan/Progress/Home consistency.
- V1 rollback result.
- Copy/accessibility/privacy result.
- Files changed.
- Tests added/changed.
- Focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0/H1/H2/H3/H3.1, Stage 3D-B, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4 COMPLETE` or blocked.
- Official-retest verdict.
- Comparison verdict.
- Report verdict.
- Block-transition verdict.
- Lifecycle-recovery verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED` or blocked.
- `PLAN CREATION REMAINS AUTOMATIC`.
- `NO IMPROVEMENT OR DECLINE CLAIMS`.
- `MAIN PROGRESS MIGRATION NOT PERFORMED`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
