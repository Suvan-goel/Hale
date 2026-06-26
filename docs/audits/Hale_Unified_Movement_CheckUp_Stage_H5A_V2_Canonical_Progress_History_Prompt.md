You are implementing the first substage of Hale’s final unified Movement Check-Up migration:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5A
V2-CANONICAL PROGRESS,
CURRENT AND HISTORICAL MOVEMENT PROFILE PRESENTATION,
V2 BLOCK-REPORT HISTORY,
AND CLAIM-NEUTRAL READ-ONLY NAVIGATION

This is a focused Progress and history integration stage.

Do not implement H5B, H5C, or H5D in this task.

## H4.1.1 prerequisite and current baseline

Stage H4.1.1 is verified.

Required closure report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
```

Recorded closure decisions include:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4.1.1 VERIFIED
OFFICIAL-RETEST FOCUS-PRESERVATION POLICY VERIFIED
DOMAIN TO BALANCED INTENTIONALLY UNSUPPORTED IN FOCUS POLICY V1
SUPPORTED V2 OFFICIAL-RETEST FOCUS-TRANSITION MATRIX VERIFIED
V2 RETEST CALLBACK IDEMPOTENCY VERIFIED
V2 RETEST PARTIAL-STATE RECOVERY VERIFIED
V2 RETEST OFFLINE / SYNC / RESTORE / EXPORT VERIFIED
TODAY / PLAN / PROGRESS / HOME / DIRECT RETEST CONSISTENCY VERIFIED
V1 OFFICIAL-RETEST ROLLBACK VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED
H4.1 POLICY-ALIGNED ACCEPTANCE CLOSED
```

The report also records:

- one public unified V2 baseline/onboarding path;
- public unified V2 official retest;
- immutable V2 snapshots and assessments;
- genuine domain and Balanced V2 blocks;
- claim-neutral previous/current comparisons;
- immutable V2 block reports;
- automatic next-block creation;
- local-first persistence;
- sync/restore/export/account-clear coverage;
- no improvement or decline claims;
- chair remains raw-only;
- Warden remains deferred;
- physical-device validation is not claimed;
- public release remains blocked.

Latest reported validation:

```text
full Jest: 148 suites / 1214 tests
audio: 150 required assets
app typecheck: passed
website typecheck: passed
Expo config: passed
Android/iOS export: passed
git diff --check: passed
```

Re-run the current tree rather than assuming these counts remain unchanged.

## Why H5 is split

The broad H5 work is intentionally split:

```text
H5A — V2-canonical Progress and Movement Profile history
H5B — Balanced weekly micro-check product policy
H5C — public V1 Check-Up/results route retirement
H5D — release-candidate hardening and final software verification
```

This task is H5A only.

## Founder/product decisions locked

### One canonical current measurement model

For users with accepted Movement Profile V2 state, Progress must use V2 as its measurement, result, focus, report, and history authority.

Do not show V1 Movement Age or weakest-domain output alongside V2 current results.

### No V1-user migration requirement

No real user completed a V1 Check-Up.

Therefore H5A must not add:

- a public “Legacy Movement Age” section;
- V1-to-V2 conversion;
- mixed V1/V2 charts;
- V1/V2 longitudinal compatibility messaging;
- permanent public V1 history rendering;
- migration of completed production V1 records.

The flag-off V1 rollback Progress path must remain functional until H5C, but it is a separate rollback mode—not a section inside V2 Progress.

### Preserve the polished current Progress UI

The current `ProgressScreen` visual language is the presentation authority.

Preserve its premium design:

- page structure;
- hero treatment;
- typography;
- spacing;
- card styling;
- borders/radii/shadows;
- botanical/decorative assets where currently used;
- responsive behavior;
- safe areas;
- accessibility;
- tab/navigation behavior.

Do not replace it with a generic list or developer-style artifact browser.

H5A should adapt the polished shell to V2 data.

### Raw-first and claim-neutral history

Current and historical V2 profiles may show frozen raw results and frozen reference/task-band interpretation.

Do not add:

- numeric deltas;
- percentages;
- trend arrows;
- line graphs implying direction;
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
- pass/fail.

Previous/current factual comparison may appear only through the already-frozen H4 comparison/report contract and only where compatibility permits.

### Plan and report actions remain read-only

Progress may navigate to:

```text
View Movement Profile
View block report
View current plan
Continue Movement Check-Up
```

These actions must not:

- create/recompute snapshots;
- create/recompute assessments;
- create/recompute comparisons;
- create reports;
- create or replace blocks;
- sync as a creation side effect;
- change dates;
- start a session.

### Warden and chair policy

Warden implementation remains deferred.

Chair remains raw-only.

Do not add a percentile placeholder, approximate formula, reference category, or focus change.

### Micro-check policy

H5A must not change weekly micro-check behavior.

Current boundaries remain:

- domain-focused block micro-check behavior unchanged;
- Balanced block micro-check remains suppressed;
- micro-check data does not become an official Movement Profile;
- micro-check data does not become current official history;
- micro-check data does not drive H5A comparisons.

H5B will decide the Balanced micro-check product policy.

### Public route retirement

Do not remove V1 public routes in H5A.

H5C will handle route retirement.

### Physical validation and release

Physical-device validation is not claimed.

H5A does not make Hale public-release ready.

## Primary objectives

H5A must:

1. Add one pure, explicit Progress data-authority selector.

2. Make accepted V2 state canonical in Progress even if a later build disables the unified release flag.

3. Preserve V1 Progress only when:
   - the unified release flag is off;
   - no accepted V2 official artifacts exist;
   - no V2-origin current/completed block or V2 report exists;
   - no pending V2 continuation requires recovery.

4. Fail closed rather than falling back to V1 when V2 state exists but is malformed, conflicting, incomplete, or unsupported.

5. Add one pure V2 Progress view model.

6. Select the latest accepted official V2 Movement Profile deterministically.

7. Select the profile that originated the current active V2 block separately.

8. Handle the edge case where the latest profile differs from the current plan’s source profile.

9. Show the latest frozen Movement Profile as the Progress hero/current result.

10. Show current domain or Balanced suggested focus from the frozen assessment.

11. Show the current V2 block summary and schedule state.

12. Add a chronological V2 official Check-Up history.

13. Add a chronological V2 block-report history.

14. Reuse existing H2 Movement Profile result presentation for read-only detail.

15. Reuse the existing H4 V2 block-report presentation for read-only report detail.

16. Add no new interpretation, scoring, focus, comparison, report, or block authority.

17. Preserve pending/recovery states for unfinished V2 artifacts.

18. Keep official Movement Profile history separate from weekly micro-check data.

19. Preserve local-first/offline/restore behavior.

20. Keep V1 rollback Progress behavior unchanged.

21. Add focused integration and architecture tests.

22. Preserve all prior lifecycle and safety regressions.

## Required prior reading

Read in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- current `ProgressScreen.tsx`;
- current progress view model and tests;
- H2 shared Results shell and V2 adapter;
- H4 V2 block-report screen/view model;
- V2 history selectors;
- V2 report selectors;
- current adherence/history serialization;
- backend restore;
- App Progress props and navigation;
- current micro-check Progress surfaces;
- release and internal flag modules;
- current V1 Progress rollback path.

Treat the current code—including untracked production files—as source of truth.

## Scope boundary

This task may change:

- `src/screens/ProgressScreen.tsx`, narrowly;
- V2 Progress authority/selector modules;
- V2 Progress view model;
- V2 history selectors;
- read-only Movement Profile history detail routing;
- read-only V2 block-report history routing;
- App Progress integration;
- focused tests;
- the H5A report.

This task may reuse but must not alter semantics of:

- H2 frozen V2 Movement Profile view model;
- H2 shared Results shell;
- H4 comparison/report contracts;
- H4 V2 block-report presentation;
- Stage 5 scheduler;
- current V2 snapshot/assessment/report parsers;
- existing V2 artifact persistence/sync/restore;
- current V1 Progress rollback implementation.

This task must not change:

- Check-Up protocols;
- reference tables;
- Warden status;
- assessment/focus policy;
- block creation;
- report creation;
- official-retest transition;
- automatic next-block transition;
- training schedule/credit/progression;
- weekly micro-check policy;
- public Check-Up/result route selection;
- V1 route retirement;
- audio text/assets;
- native camera/pose code;
- website;
- dependencies;
- lockfiles;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND RE-ENTRY GATE

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
2. Inspect current diffs before touching a file.
3. Preserve concurrent App, Progress, report, Step-Up, render, backend, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent Progress work makes safe integration ambiguous, stop and mark H5A blocked.

## Step 2: Mandatory app typecheck

Run first:

```bash
npm run typecheck
```

If it fails solely in unrelated concurrent work:

- do not repair that work;
- write the H5A report as blocked;
- stop before H5A implementation.

## Step 3: Baseline validation

Run focused tests for:

- H4.1.1 continuation;
- H4 report/transition;
- V2 snapshot/assessment/history;
- V2 results adapter;
- progress view model;
- Progress screen;
- app lifecycle;
- block scheduler;
- report sync/restore;
- micro-check Progress behavior;
- V1 Progress rollback.

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
rm -rf /tmp/hale-unified-h5a-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5a-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h5a-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — RECONSTRUCT CURRENT PROGRESS ARCHITECTURE

## Step 4: Audit `ProgressScreen.tsx`

Document current ownership of:

- page/header/hero;
- latest Check-Up card;
- Movement Age/product-band surfaces;
- current block card;
- weekly progress;
- retest CTA;
- block-report card;
- micro-check card;
- history/trend surfaces;
- responsive branches;
- navigation callbacks;
- V2 internal card, if still present.

Classify each branch as:

- claim-neutral/reusable presentation;
- V1 scoring-dependent;
- V1 history-dependent;
- V2 already present;
- training lifecycle/shared;
- micro-check-only;
- obsolete/internal-only.

## Step 5: Audit current progress view models/selectors

Inspect at minimum:

- `src/haleFlow/progressViewModel.ts`;
- related types;
- `src/haleFlow/appLifecycle.ts`;
- `src/haleFlow/nextBestAction.ts`;
- V2 history selectors;
- block-report selectors;
- App Progress data construction.

Create:

| Consumer/field | Current authority | H5A V2 authority | V1 rollback behavior |
| --- | --- | --- | --- |

## Step 6: Record visual-contract invariants

Record exact token/component sources for:

- page background;
- hero asset/layout;
- title/subtitle;
- card radii/borders/shadows;
- domain icon treatment;
- current plan card;
- report card;
- history row/card;
- compact-phone behavior;
- typography;
- bottom-tab/safe-area behavior.

Do not duplicate a second complete visual tree.

# PART C — PROGRESS DATA AUTHORITY

## Step 7: Add one pure authority selector

Create a repository-consistent module, conceptually:

```ts
type ProgressDataAuthority =
  | {
      kind: 'movement_profile_v2';
      reason:
        | 'accepted_v2_profile'
        | 'v2_block_exists'
        | 'v2_report_exists'
        | 'v2_pending_continuation'
        | 'unified_release_enabled';
    }
  | {
      kind: 'legacy_v1';
      reason: 'rollback_no_v2_state';
    }
  | {
      kind: 'unavailable';
      reason: string;
    };
```

Adapt to current types.

Inputs must be explicit:

- unified release flag;
- accepted V2 official history;
- V2-origin active/completed blocks;
- accepted V2 reports;
- pending raw/reference/artifact continuation;
- V1 rollback state.

No ambient store reads inside the pure selector.

## Step 8: Authority precedence

Required order:

1. Any accepted V2 official snapshot/assessment -> V2.
2. Any V2-origin active/paused/completed block -> V2.
3. Any accepted V2 block report -> V2.
4. Any pending V2 continuation -> V2 recovery/continuation mode.
5. Unified release flag on -> V2 empty/start mode.
6. Otherwise -> V1 rollback mode.

Important:

- Turning the release flag off later does not hide accepted V2 state.
- Internal/developer flag does not determine public Progress authority.
- Backend/profile values cannot select authority.
- Malformed V2 state does not fall back to V1.
- Mixed V1/V2 dev fixtures use V2 when accepted V2 state exists.

## Step 9: V2 malformed/conflict behavior

When V2 authority is selected but artifacts are malformed, source-mismatched, future-schema, or immutable-conflicted:

- show typed recovery;
- preserve accepted raw/frozen truth;
- do not show V1 Movement Age;
- do not silently select older V1 state;
- do not create/recompute artifacts.

# PART D — V2 PROGRESS VIEW MODEL

## Step 10: Add one pure view model

Conceptually:

```ts
type MovementProfileV2ProgressViewModel =
  | {
      status: 'ready';
      hero: MovementProfileV2ProgressHero;
      currentPlan: MovementProfileV2CurrentPlanSummary | null;
      officialHistory: readonly MovementProfileV2HistoryEntry[];
      reports: readonly MovementProfileV2ReportHistoryEntry[];
      microCheck: ExistingMicroCheckProgressPresentation | null;
      actions: readonly MovementProfileV2ProgressAction[];
    }
  | {
      status:
        | 'no_profile'
        | 'pending_reference_details'
        | 'pending_artifact_materialisation'
        | 'needs_retake'
        | 'artifact_recovery'
        | 'active_block_conflict';
      recovery: ...;
      actions: readonly ...[];
    };
```

Requirements:

- pure;
- deterministic;
- JSON-safe;
- no React elements;
- no functions;
- no `Date`;
- no NaN/infinity;
- stable ordering;
- no raw landmarks/media;
- no live-profile interpretation;
- no artifact/block/report creation.

## Step 11: Inputs

Use explicit inputs:

- parsed official V2 Check-Up history;
- accepted snapshots;
- accepted assessments;
- V2 blocks;
- V2 reports;
- scheduler state;
- pending V2 continuation state;
- existing micro-check presentation input;
- explicit today/date key where needed for schedule display.

Do not read current reference tables or live life goal to reinterpret history.

# PART E — CURRENT MOVEMENT PROFILE SELECTION

## Step 12: Latest accepted profile

Define `latestProfile` as the latest valid accepted official V2 snapshot+assessment pair, ordered by:

1. source Check-Up immutable completion/start timestamp;
2. stable source Check-Up ID;
3. stable assessment ID as final deterministic tie-break.

Do not order primarily by:

- sync time;
- restore time;
- local file modification time;
- callback time;
- assessment creation retry time.

## Step 13: Current plan source profile

Define `currentPlanProfile` from the active/paused/current V2 block’s exact origin:

- assessment ID/fingerprint;
- snapshot ID/fingerprint;
- source Check-Up ID.

Validate source binding.

Do not infer from latest time.

## Step 14: Latest profile differs from plan source

This may happen after a baseline retake or active-block conflict.

Required presentation:

- latest Movement Profile remains the latest accepted official profile;
- current plan remains bound to its actual source profile;
- do not claim the plan was prepared from the latest profile;
- show calm copy materially equivalent to:

```text
Your current plan is based on your previous Movement Profile.
Your latest Movement Profile is saved.
```

Do not replace the active block automatically.

## Step 15: Normal transition

After H4 official retest:

- latest profile and active next-block source profile should match;
- Progress shows the latest profile and next block consistently;
- prior completed block report appears in history.

# PART F — PROGRESS HERO / CURRENT PROFILE

## Step 16: Preserve polished hero

Use the current premium Progress hero/card system.

Recommended current title:

```text
Movement Profile
```

or preserve the existing polished page title if already product-approved.

Do not show:

- V2;
- internal;
- schema;
- policy version;
- Movement Age;
- body age;
- weakest domain.

## Step 17: Current profile summary

Show:

- Check-Up date;
- frozen suggested focus:
  - Strength;
  - Balance;
  - Mobility;
  - Balanced;
- three frozen current domain summaries.

### Strength / chair

Show raw:

```text
<N> rises in 30 seconds
```

Use frozen raw-only copy.

No percentile.

### Balance

Show:

- raw best hold seconds;
- frozen Hale task band.

No percentile or normative range.

### Mobility / shoulder

Show:

- raw degrees;
- frozen IQR category when eligible;
- raw-only explanation otherwise.

`Above the published middle range` remains neutral.

## Step 18: Hero action

Exact action:

```text
View Movement Profile
```

It opens the existing H2 polished result presentation in read-only mode for the selected frozen profile.

It must not create or alter:

- snapshot;
- assessment;
- comparison;
- report;
- block;
- sync state.

# PART G — CURRENT PLAN SUMMARY

## Step 19: Current V2 plan card

Use existing polished training-progress/current-block presentation where possible.

Show:

- domain focus or Balanced;
- current week;
- schedule credits completed;
- next due session / waiting / retest due / report-ready state;
- block start date where current design supports it.

Do not show a fake `focusDomain` for Balanced.

## Step 20: Plan/profile source truth

When current block source matches latest profile:

```text
Prepared from your latest Movement Profile
```

may be shown if current product copy supports it.

When it differs, use the mismatch copy from Step 14.

## Step 21: Plan action

Action:

```text
View current plan
```

Navigation only.

Do not start the next session.

# PART H — OFFICIAL V2 HISTORY

## Step 22: Build official history selector

Include only valid official V2 sources:

```text
baseline
baseline_retake
official_retest
```

Exclude:

- manual extra;
- quick recheck;
- micro-check;
- legacy/V1;
- malformed/future/source-mismatched artifacts;
- raw-only records with no accepted assessment from ready history.

Pending raw records appear in recovery/continuation, not completed history.

## Step 23: Stable history entries

Each entry must contain:

- stable source Check-Up ID;
- source type;
- immutable date;
- snapshot ID/fingerprint;
- assessment ID/fingerprint;
- focus kind/title;
- three raw metric summaries;
- whether a report is associated;
- read-only detail action.

Do not store a separate mutable history cache unless required.

## Step 24: User-facing source labels

Use calm product labels, not internal enum strings.

Recommended mapping:

```text
baseline -> First Movement Check-Up
baseline_retake -> Movement Check-Up retake
official_retest -> Follow-up Movement Check-Up
```

If current approved product copy uses another neutral mapping, preserve it.

Do not expose `official_retest`, `baseline_retake`, or `movement_profile_v2`.

## Step 25: Ordering and dedupe

Order newest first in Progress.

Deterministically dedupe identical accepted artifacts.

On same-ID/different-fingerprint conflict:

- preserve first accepted frozen truth;
- fail closed for the conflicting entry;
- do not show both;
- surface typed recovery/diagnostic where appropriate.

## Step 26: History list presentation

Preserve the current premium card/list style.

Each row/card may show:

- date;
- source label;
- focus;
- compact raw metrics;
- `View Movement Profile`.

Do not show:

- delta;
- trend arrow;
- “up/down”;
- improvement/decline badge;
- green/red comparison semantics.

## Step 27: Read-only profile detail

Reuse the H2 shared result shell with an explicit read-only history mode.

The detail must:

- render the selected frozen V2 view model;
- show no plan-ready claim for an unrelated historical block;
- show no block creation action;
- show current associated report action only when source-bound;
- not recompute focus/reference interpretation;
- not change current plan.

# PART I — V2 BLOCK-REPORT HISTORY

## Step 28: Build report-history selector

Include only valid accepted:

```text
movement_profile_v2_block_report
```

Validate:

- report parser;
- prior block binding;
- prior/current Check-Up/snapshot/assessment binding;
- comparison fingerprint;
- next-block identity where present.

Exclude malformed/future/conflicting reports.

## Step 29: Report ordering

Order by immutable report/completion time anchored to the official retest Check-Up.

Do not use sync/restore time.

## Step 30: Report history entries

Each entry may show:

- `4-week block complete`;
- completion date;
- prior focus;
- current/latest focus;
- `12 plan sessions completed`;
- `View block report`.

Do not show improvement/decline summary.

## Step 31: Read-only report navigation

Reuse the existing H4 V2 block-report screen.

Opening from Progress:

- reads stored report;
- does not rebuild comparison;
- does not create next block;
- does not mutate prior/current block;
- does not sync as a creation side effect;
- does not start a session.

# PART J — CLAIM-NEUTRAL HISTORY RULES

## Step 32: No aggregate trend computation

H5A must not add:

- a chart line across chair/balance/shoulder;
- numeric trend;
- percent change;
- score change;
- color-coded direction;
- “best result”;
- “personal record”;
- “on track” based on raw result direction.

The tab may remain named Progress, but official Check-Up history is factual.

## Step 33: Compatible previous/current comparisons

Use only already-frozen H4 comparison/report data.

Do not recompute a comparison in Progress from two raw snapshots.

If a report exists, its read-only detail may show:

```text
Previous Check-Up
Current Check-Up
```

according to the stored comparison.

If no report exists, show profiles separately.

## Step 34: Incompatibility

Changed standing leg, shoulder side, reference profile, or protocol policy remains non-comparable according to existing frozen rules.

Do not override this in Progress.

# PART K — PENDING / EMPTY / RECOVERY STATES

## Step 35: No profile yet, unified release enabled

Show a polished empty state:

```text
Complete your Movement Check-Up
Your Movement Profile will appear here after your Check-Up.
```

Action:

```text
Start Movement Check-Up
```

It calls the existing public baseline selector.

It does not bypass onboarding/camera setup/release gates.

## Step 36: Pending raw/reference details

Show:

```text
Finish your Movement Profile
Your Check-Up is saved.
```

Action:

```text
Continue
```

Route to the existing reference-details continuation.

No V1 fallback.

## Step 37: Snapshot/assessment pending

Use existing typed V2 recovery/materialisation continuation.

Do not recompute from the Progress screen.

## Step 38: Needs retake / invalid headline

Show calm retake/recovery using existing classifier.

Do not show a partial official profile as ready.

## Step 39: Active-block conflict

Show the latest profile and current-plan mismatch truthfully.

Do not claim a new plan was created.

## Step 40: Malformed/future/conflicting artifact

Fail closed.

Preserve raw/accepted history.

Do not show V1 Movement Age.

# PART L — MICRO-CHECK CONTAINMENT

## Step 41: Keep official and micro history separate

Official Movement Profile history must never include weekly micro-check records.

Micro-checks:

- may remain in their existing separate Progress section;
- must retain current copy/behavior;
- must not become `latestProfile`;
- must not create V2 snapshots/assessments/reports;
- must not appear in official profile history.

## Step 42: Balanced blocks

Do not add a Balanced micro-check.

Do not rotate domain micro-checks.

Do not remove the current suppression.

H5B will decide this policy.

## Step 43: No mixed trend

Do not place official Check-Up values and micro-check values on one chart or comparison.

# PART M — V1 ROLLBACK MODE

## Step 44: Preserve current V1 Progress

When the Progress authority selector returns `legacy_v1`:

- render current V1 Progress behavior unchanged;
- preserve current V1 view model;
- preserve current V1 report/result actions;
- do not create V2 artifacts;
- do not show V2 empty state.

## Step 45: No V1 section inside V2 mode

When V2 authority is selected:

- do not render V1 Movement Age;
- do not render V1 trend/history section;
- do not compare V1/V2;
- do not label V1 as legacy for users.

Because no real users completed V1, no migration UI is required.

## Step 46: Flag rollback with existing V2 state

Release flag off + accepted V2 state still selects V2 Progress.

The user’s current V2 plan/report/history remains visible.

# PART N — APP ROUTING

## Step 47: Add explicit read-only routes

Use repository-consistent route names, conceptually:

```text
movement-profile-history-detail
movement-profile-block-report-detail
```

Reuse existing screens where possible.

Pass only stable selected IDs through App state.

The screen must reselect and validate the artifact from current accepted state.

Do not pass an unvalidated whole artifact object from a list row.

## Step 48: Route guards

Read-only V2 history routes require:

- accepted V2 authority;
- valid selected source ID;
- valid source-bound snapshot/assessment/report.

Unknown or stale IDs return safely to Progress/recovery.

No public deep link should bypass validation.

## Step 49: Back behavior

History/detail/report navigation returns to Progress without lifecycle mutation.

# PART O — OBSERVABILITY AND PRIVACY

## Step 50: Bounded diagnostics

Use codes such as:

- `progress_authority_v2`;
- `progress_authority_v1_rollback`;
- `progress_v2_latest_profile_selected`;
- `progress_v2_history_conflict`;
- `progress_v2_report_invalid`;
- `progress_v2_plan_source_differs`;
- `progress_v2_pending_continuation`.

Include only:

- Check-Up/snapshot/assessment/report/block IDs;
- source type;
- focus kind;
- reason code;
- policy versions/fingerprints where needed.

Exclude:

- landmarks;
- frames;
- video/images;
- raw body coordinates;
- free-text health notes;
- full profile;
- auth tokens;
- provider secrets.

Pure selectors return diagnostics; they do not log.

# PART P — ACCESSIBILITY AND RESPONSIVE DESIGN

## Step 51: Responsive parity

Verify:

- compact phone;
- standard Android;
- large phone;
- safe area;
- long task-band/IQR/raw-only copy;
- Balanced focus;
- plan/profile mismatch note;
- multiple history cards;
- multiple report cards;
- large text.

Use current responsive helpers.

Do not add a second breakpoint system.

## Step 52: Accessibility

Required:

- current profile hero reads date, focus, and three domain summaries;
- raw values include units;
- `Above the published middle range` is not announced as success;
- history rows announce date/source/focus;
- report rows announce completion and factual session count;
- actions state they open saved read-only content;
- no color-only meaning;
- minimum touch targets preserved;
- no per-scroll or per-render repeated announcements.

# PART Q — ARCHITECTURE GUARDS

## Step 53: Progress view-model purity

The V2 Progress view model must not import/call:

- V1 scoring/norms;
- V2 reference interpretation engine;
- V2 assessment builder;
- V2 block materialiser;
- H4 transition;
- report builder;
- backend sync;
- session start.

It may consume parsed/frozen display artifacts and pure scheduler state.

## Step 54: Screen non-authority

`ProgressScreen` and read-only detail screens must not:

- create or attach artifacts;
- build reports;
- create blocks;
- recompute focus;
- sync as a creation side effect.

They render and dispatch typed navigation/recovery actions only.

## Step 55: No new persistence schema

Prefer pure derived view models from existing accepted history/adherence/report state.

Do not add a new mutable Progress cache or database table.

If a tiny read-only selected-ID state is needed in App, keep it ephemeral.

# PART R — REQUIRED TEST MATRIX

## A. Progress authority

- release off/no V2 -> V1;
- release on/no V2 -> V2 empty;
- accepted V2 profile/release off -> V2;
- V2 active block/release off -> V2;
- V2 report/release off -> V2;
- pending V2/release off -> V2 recovery;
- mixed V1/V2 -> V2;
- malformed V2 -> unavailable, not V1;
- internal flag does not affect authority.

## B. Latest/current-plan selectors

- one baseline;
- baseline + retake;
- baseline + official retest;
- deterministic equal-time tie;
- active block source equals latest;
- active block source differs from latest;
- malformed source binding;
- Balanced source block.

## C. V2 current hero

- domain focus;
- Balanced focus;
- chair raw-only;
- balance each task band;
- shoulder below/within/above/raw-only;
- neutral tones/copy;
- exact `View Movement Profile`.

## D. Current plan

- domain block;
- Balanced block;
- week/session/scheduler states;
- profile source matches;
- profile source differs;
- no fake domain;
- navigation only.

## E. Official history

- baseline;
- baseline retake;
- official retest;
- newest-first order;
- dedupe;
- immutable conflict;
- manual/quick/micro/V1 excluded;
- invalid assessment excluded/recovery;
- user-facing source labels.

## F. Profile detail

- selected valid profile;
- stale/unknown ID;
- read-only result shell;
- no plan creation;
- no focus/reference recomputation;
- no current-plan mutation.

## G. Report history

- one report;
- multiple reports;
- newest-first;
- domain/Balanced;
- invalid/future/conflicting report;
- source mismatch;
- exact `View block report`;
- read-only reopening.

## H. Claim neutrality

- no delta;
- no percent;
- no trend arrows;
- no directional color;
- no improvement/decline terms;
- no Movement Age;
- no weakest copy;
- no Warden placeholder.

## I. Pending/recovery

- no profile;
- raw pending details;
- snapshot-only;
- assessment pending block;
- needs retake;
- active-block conflict;
- malformed/future conflict;
- no V1 fallback.

## J. Micro-check containment

- micro-check excluded from official history;
- micro-check does not become latest;
- existing domain micro-check section unchanged;
- Balanced suppression unchanged;
- no mixed chart.

## K. V1 rollback

- V1 Progress unchanged when selected;
- no V2 state created;
- accepted V2 state prevents fallback even with flag off;
- no mixed V1/V2 UI.

## L. Restore/offline

- restored accepted V2 profile/history;
- restored report history;
- local sync-pending state;
- duplicate/reordered remote artifacts;
- malformed report omitted/fail-closed;
- exact fingerprints preserved;
- no recomputation.

## M. Routing

- valid profile detail;
- valid report detail;
- unknown/stale IDs;
- back to Progress;
- no deep-link bypass;
- no lifecycle mutation.

## N. Accessibility/responsive

- compact width;
- large text;
- long copy;
- multiple entries;
- semantic labels;
- no color-only interpretation.

## O. Product containment

- no H5B micro-check change;
- no H5C route retirement;
- no H5D release hardening;
- no Warden;
- no audio;
- no protocol/reference/focus/report/block changes.

## P. Regression

- H0-H4.1.1;
- Stage 3D-B;
- Stage 4;
- Stage 5G.1/H;
- Step-Up runtime;
- navigation;
- TypeScript boundaries;
- safety/V2 audio;
- V1 Progress rollback.

## Test-quality requirements

Tests must:

- use real parsed V2 snapshots/assessments/reports;
- use current production history/adherence selectors;
- use deterministic timestamps/IDs;
- exercise actual Progress view model and screen adapters;
- test restored/offline state;
- assert no input mutation;
- assert no V1 artifact/copy leak in V2 mode;
- assert navigation-only behavior.

Tests must not:

- mock every layer;
- cast malformed objects into accepted types;
- recompute V2 reference interpretation;
- use real camera/network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- alter focus/micro-check policy.

# PART S — VALIDATION

## Step 56: Focused H5A validation

Run focused tests for:

- H5A authority selector;
- H5A V2 Progress view model;
- Progress screen;
- V2 history selectors;
- H2 result adapter/read-only detail;
- H4 report selector/screen;
- H4.1.1 continuation;
- app lifecycle;
- scheduler;
- restore/export/account clear;
- micro-check containment;
- V1 Progress rollback.

Record exact command and counts.

## Step 57: Full release gate

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
rm -rf /tmp/hale-unified-h5a-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5a-export
rc=$?
rm -rf /tmp/hale-unified-h5a-export
exit $rc
```

Do not install dependencies.

Record:

- H5A suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- known warnings;
- new warnings;
- whether validation changed files.

# PART T — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Fresh V2 user

```text
release on
-> no profile
-> Progress empty state
-> Start Movement Check-Up
-> baseline
-> latest Movement Profile hero
-> current V2 plan
```

## Current domain user

```text
latest accepted domain profile
-> current plan source matches
-> domain hero
-> official history
```

## Current Balanced user

```text
latest accepted Balanced profile
-> Balanced current plan
-> no fake focus domain
```

## Retest/report history

```text
baseline
-> 4-week block
-> official retest
-> latest current profile
-> prior profile in history
-> completed block report in report history
```

## Plan/profile mismatch

```text
new accepted baseline retake
+ prior active block preserved
-> latest profile shown
-> current plan source shown separately
-> no claim plan uses latest profile
```

## Rollback

```text
release off + accepted V2 state
-> V2 Progress remains
```

```text
release off + no V2 state
-> current V1 Progress remains
```

## Pending

```text
raw V2 saved
-> Progress continue state
-> no V1 fallback
```

# PART U — REPORT

Create exactly one new report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. H4.1.1 prerequisite evidence.
3. Founder decisions carried forward.
4. Initial Git status.
5. Re-entry/baseline validation.
6. Current Progress architecture.
7. Visual-contract inventory.
8. Progress data-authority selector.
9. Authority precedence.
10. V2 malformed/conflict policy.
11. V2 Progress view model.
12. Latest-profile selector.
13. Current-plan-source selector.
14. Latest/profile-plan mismatch behavior.
15. Current hero.
16. Current domain cards.
17. Current focus/Balanced behavior.
18. Current plan summary.
19. Official V2 history selector.
20. History labels/order/dedupe/conflict.
21. Read-only Movement Profile detail.
22. V2 block-report history.
23. Read-only report navigation.
24. Claim-neutral history policy.
25. Pending/empty/recovery states.
26. Micro-check containment.
27. V1 rollback mode.
28. App routing.
29. Observability/privacy.
30. Responsive/accessibility.
31. Architecture boundaries.
32. Product containment.
33. Files changed.
34. Tests added/changed.
35. Exact focused validation.
36. Exact full validation.
37. Audio verification.
38. App/website typechecks.
39. Expo config/export.
40. H0-H4.1.1/Stage 3D-B/Stage 4/Stage 5/Step-Up regression.
41. Remaining H5B/H5C/H5D/device work.
42. Whether H5B is unblocked.
43. Initial/final Git status.
44. Complete files-changed inventory.
45. Concurrent external changes.
46. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5B/C/D work occurred.

# REQUIRED INVARIANTS

After H5A:

1. One pure Progress authority selector exists.
2. Accepted V2 state always selects V2 Progress.
3. Release flag off does not hide accepted V2 state.
4. Internal flag does not determine public Progress authority.
5. V1 is used only for rollback with no V2 state.
6. Malformed V2 never falls back to V1.
7. Latest official V2 profile selection is deterministic.
8. Current plan source profile is independently source-bound.
9. Latest/plan-source mismatch is truthful.
10. Current hero uses frozen V2 data.
11. Chair remains raw-only.
12. Balance uses frozen task band.
13. Shoulder uses frozen IQR/raw-only interpretation.
14. Balanced remains first-class.
15. No Movement Age or weakest-domain copy appears in V2 mode.
16. Official history includes only baseline/baseline-retake/official-retest V2 artifacts.
17. Micro-checks are excluded from official history.
18. History is newest-first and deterministic.
19. Conflicts fail closed.
20. Profile detail is read-only.
21. Report history includes only valid frozen V2 reports.
22. Report opening is read-only.
23. No aggregate trend/delta/directional claim is added.
24. Stored H4 comparison is the only previous/current comparison authority.
25. No profile/report/block is created from Progress.
26. Empty/pending/recovery states never fall back to V1.
27. Existing domain micro-check behavior is unchanged.
28. Balanced micro-check remains suppressed.
29. V1 rollback Progress remains unchanged.
30. No V1 legacy-results migration is added.
31. No H5B/H5C/H5D work occurs.
32. Warden remains deferred.
33. Audio remains 150 assets.
34. Full repository gate passes.
35. Physical-device validation is not claimed.
36. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H5A complete unless:

1. V2 Progress authority and rollback precedence are explicit and tested.
2. The polished current Progress visual language is preserved.
3. Current V2 hero/focus/domain cards are truthful.
4. Current plan source binding is truthful.
5. Official V2 history is implemented and source-bound.
6. V2 report history is implemented and source-bound.
7. Profile/report details are read-only.
8. No trend/directional claim is added.
9. Pending/recovery states are fail-closed.
10. Micro-check containment is proven.
11. V1 rollback remains green.
12. Focused tests pass.
13. Full Jest passes.
14. Audio verification passes.
15. App typecheck passes.
16. Website typecheck passes.
17. Expo config passes.
18. Android/iOS export passes.
19. `git diff --check` passes.
20. No unrelated work is overwritten.
21. No package/lockfile/audio change occurs.
22. No staging/commit/branch/push occurs.

Do not mark complete if:

- V2 and V1 are mixed in one user-facing history;
- Progress recomputes reference interpretation/focus/comparison;
- a chart implies improvement/decline;
- a micro-check becomes an official profile;
- release flag off hides existing V2 state;
- V1 fallback occurs after malformed V2 state;
- Progress creates a report or block;
- H5B/C/D is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5A COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H5A BLOCKED
```

Also state exactly one:

```text
V2-CANONICAL PROGRESS AUTHORITY IMPLEMENTED
V2-CANONICAL PROGRESS AUTHORITY BLOCKED
```

Also state exactly one:

```text
CURRENT V2 MOVEMENT PROFILE PROGRESS PRESENTATION IMPLEMENTED
CURRENT V2 PROGRESS PRESENTATION BLOCKED
```

Also state exactly one:

```text
OFFICIAL V2 MOVEMENT PROFILE HISTORY IMPLEMENTED
V2 MOVEMENT PROFILE HISTORY BLOCKED
```

Also state exactly one:

```text
V2 BLOCK-REPORT HISTORY IMPLEMENTED
V2 BLOCK-REPORT HISTORY BLOCKED
```

Also state exactly one:

```text
V2 PROGRESS READ-ONLY NAVIGATION VERIFIED
V2 PROGRESS READ-ONLY NAVIGATION BLOCKED
```

Also state exactly one:

```text
V1 PROGRESS ROLLBACK VERIFIED
V1 PROGRESS ROLLBACK BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5B UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5B BLOCKED
```

Use H5B unblocked only when:

- V2 authority/hero/history/reports are source-bound;
- read-only navigation is proven;
- micro-check containment is proven;
- V1 rollback passes;
- no unresolved P0/P1 H5A defect remains.

Also state:

```text
NO V1 LEGACY-RESULT MIGRATION REQUIRED
NO MIXED V1 / V2 USER HISTORY
NO IMPROVEMENT OR DECLINE CLAIMS
NO AGGREGATE TREND CHART ADDED
OFFICIAL MICRO-CHECK HISTORY REMAINS SEPARATE
BALANCED MICRO-CHECK POLICY UNCHANGED
PUBLIC V1 ROUTE RETIREMENT NOT PERFORMED
RELEASE-CANDIDATE HARDENING NOT PERFORMED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE

If H5A completes, the next stage is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5B
BALANCED WEEKLY MICRO-CHECK PRODUCT POLICY,
DOMAIN MICRO-CHECK V2 ALIGNMENT,
AND MICRO-CHECK / OFFICIAL-PROFILE CONTAINMENT
```

H5B will decide and implement whether Balanced plans:

- rotate one domain micro-check each week;
- use a compact balanced micro-check;
- or intentionally omit weekly micro-checks.

It must keep micro-checks non-official and non-report-generating.

Do not begin H5B in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Re-entry typecheck/baseline.
- Current Progress architecture.
- Progress authority selector path/precedence.
- Release-off-with-V2 behavior.
- V1 rollback behavior.
- V2 malformed/conflict behavior.
- V2 Progress view-model path.
- Latest-profile selection.
- Current-plan-source selection.
- Latest/plan mismatch behavior.
- Current hero/domain/focus behavior.
- Balanced behavior.
- Current plan summary.
- Official history behavior.
- Report-history behavior.
- Profile-detail read-only behavior.
- Report-detail read-only behavior.
- Claim-neutral/trend guardrails.
- Empty/pending/recovery behavior.
- Micro-check containment.
- App routing.
- Accessibility/responsive result.
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
- Confirmation that H0-H4.1.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5A COMPLETE` or blocked.
- Authority verdict.
- Current-presentation verdict.
- Profile-history verdict.
- Report-history verdict.
- Read-only-navigation verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5B UNBLOCKED` or blocked.
- `NO V1 LEGACY-RESULT MIGRATION REQUIRED`.
- `NO MIXED V1 / V2 USER HISTORY`.
- `BALANCED MICRO-CHECK POLICY UNCHANGED`.
- `PUBLIC V1 ROUTE RETIREMENT NOT PERFORMED`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5B/C/D work occurred.
