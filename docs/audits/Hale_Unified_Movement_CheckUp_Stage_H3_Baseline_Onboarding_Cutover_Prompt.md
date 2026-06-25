You are implementing the next execution stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H3
NORMAL BASELINE / ONBOARDING CUTOVER TO THE UNIFIED V2 ENGINE BEHIND A FAIL-CLOSED RELEASE FLAG

This is the first controlled product-routing cutover.

Its purpose is to make the existing polished unified Check-Up and unified Movement Profile flow available through Hale’s normal baseline/onboarding journey when an explicit build-time release flag is enabled.

The release flag must default off.

When the flag is off, current public V1 baseline behavior must remain unchanged.

When the flag is on, a normal baseline must use:

```text
polished H1 Check-Up shell
-> V2 live protocol engine
-> raw V2 Check-Up
-> per-Check-Up reference details
-> frozen V2 snapshot
-> frozen V2 assessment
-> automatic V2 domain or balanced block
-> polished H2 Movement Profile results
-> View my 4-week plan
```

Do not implement the official V2 re-test, V2 block report, next-block transition, or Progress migration in this stage.

## H2 prerequisite and current baseline

Stage H2 is complete.

Required report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md
```

Recorded H2 decisions:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H2 COMPLETE
SHARED POLISHED RESULTS SHELL IMPLEMENTED
V1 RESULTS AND ONBOARDING-RESULTS PARITY VERIFIED
FROZEN V2 MOVEMENT PROFILE ADAPTER IMPLEMENTED
INTERNAL UNIFIED V2 RESULTS FLOW VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H3 UNBLOCKED
PUBLIC CHECKUP AND RESULTS ROUTING UNCHANGED
V1 REMAINS PUBLIC DEFAULT
V2 REMAINS INTERNAL
EXISTING V2 RESULT REFERENCE SCREEN RETAINED
NO PROGRESS MIGRATION PERFORMED
NO V1 LEGACY-RESULT MIGRATION REQUIRED
PLAN CREATION REMAINS AUTOMATIC
V2 PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
```

H2 implemented:

- `src/results/CheckUpResultsShell.tsx`;
- `src/results/types.ts`;
- V1 standard/onboarding adapters;
- `src/results/movementProfileV2ResultsAdapter.ts`;
- `MovementProfileV2UnifiedResultsScreen`;
- internal H1 -> H2 V2 flow;
- exact CTA `View my 4-week plan`;
- retention of the standalone V2 result harness.

H2 final validation reportedly passed:

- targeted: 22 suites / 149 tests;
- full Jest: 134 suites / 1,096 tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- `git diff --check`.

Re-run current validation rather than assuming those counts remain unchanged.

## Founder decisions locked

### One canonical future product

The future canonical experience is:

```text
one public Movement Check-Up
=
polished shared Check-Up UI
+
V2 live protocols and raw-result contracts
+
frozen V2 Movement Profile
+
V2 suggested focus or Balanced
+
automatic V2-origin plan
+
shared Stage 5 training lifecycle
```

V1 is only a temporary rollback implementation while the staged cutover is completed.

### No V1-user migration

No real user completed a V1 Check-Up.

Therefore H3 must not add:

- a legacy Movement Age section;
- V1-to-V2 conversion;
- mixed V1/V2 charts;
- V1/V2 longitudinal comparison;
- migration of completed production V1 blocks;
- permanent dual-result logic.

Do not delete V1 yet. The release flag still needs a rollback path during H3 verification.

### Automatic plan creation

A valid V2 baseline creates or reuses the plan automatically before results are shown.

The user-facing CTA is exactly:

```text
View my 4-week plan
```

The CTA only navigates to the existing prepared plan.

It must not create, regenerate, replace, sync, or start a plan.

Do not use:

```text
Build my plan
Create my plan
Generate my plan
Personalise my plan
```

### Warden chair policy

The founder approved the future product policy, but implementation remains deferred.

H3 must not:

- embed Warden parameters;
- add a modified/approximate formula;
- enable chair percentile output;
- alter chair evidence/focus eligibility;
- add percentile placeholder copy.

Chair remains raw-only.

### Closed-beta/device posture

Physical-device validation has not been completed.

The prior closed-beta waiver remains truthful:

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
DEVICE BEHAVIOUR NOT YET VERIFIED
PUBLIC RELEASE REMAINS BLOCKED
```

H3 may implement a controlled-beta release flag.

It must not claim physical validation, broad public readiness, or medical accuracy.

## The H3 release flag

Add one explicit build-time public-baseline flag:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP=1
```

Use the exact repository naming convention if an equivalent current flag already exists. Do not create a second flag with the same purpose.

Required semantics:

- missing -> false;
- empty -> false;
- exact `1` -> true;
- `true`, `yes`, whitespace variants, malformed values -> false unless the repository’s existing exact parser convention deliberately normalises them;
- default in `.env.example` -> `0`;
- no user setting;
- no backend value;
- no profile value;
- no restore value;
- no remote JSON authority;
- no `__DEV__` implicit enablement;
- no public deep-link bypass;
- no runtime mutation.

Recommended exported constant:

```ts
UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED
```

Keep this separate from:

```text
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
```

The internal flag remains responsible only for developer/reference harnesses.

The release flag alone must not expose developer Settings rows.

## Public engine-selection contract

Add one pure public launch selector.

Conceptually:

```ts
type PublicMovementCheckUpEngine =
  | 'legacy_v1'
  | 'unified_movement_profile';

type PublicMovementCheckUpLaunchDecision =
  | {
      status: 'ready';
      engine: PublicMovementCheckUpEngine;
      sourceType: 'baseline' | 'baseline_retake';
      entryContext: 'onboarding' | 'standard';
    }
  | {
      status: 'unavailable';
      reason: string;
    };
```

Adapt to current types.

Required behavior:

### Baseline

- release flag off -> V1;
- release flag on -> unified V2.

### Baseline retake

- release flag off -> V1;
- release flag on -> unified V2.

### Official re-test

Official V2 re-test is not implemented in H3.

Rules:

- if the active/current block is V2-origin, never route an official re-test through V1;
- return typed unavailable/recovery:
  - `v2_official_retest_not_available_in_this_build`;
- preserve the completed block and Movement Profile;
- do not create a V1 Check-Up, V1 score, V1 report, or next block;
- if a legacy V1 block exists under the flag-off rollback path, current V1 official-retest behavior may remain unchanged.

### Manual extra / quick / micro

Do not change these entry points in H3.

### Unknown/malformed source

Fail closed.

The engine decision must be frozen for a launched Check-Up. The flow must never switch from V2 to V1 mid-run.

## What H3 must produce

H3 must result in:

1. A strict, tested release-flag module.

2. A pure public baseline engine selector.

3. Normal onboarding baseline routing through the H1 unified V2 Check-Up when the flag is enabled.

4. Normal non-onboarding baseline/baseline-retake routing through the H1 unified V2 Check-Up when the flag is enabled.

5. Existing V1 routing unchanged when the flag is disabled.

6. Existing camera explanation/setup/permission shell retained.

7. Existing V2 per-Check-Up reference-details flow used publicly without internal/developer wording.

8. Existing V2 snapshot/assessment/block materialisation reused.

9. Existing H2 polished onboarding/standard Movement Profile results used publicly.

10. Existing automatic local-first V2 block creation preserved.

11. Correct onboarding state-machine progression from V2 baseline through the already-prepared plan.

12. Resume/relaunch handling at every artifact boundary.

13. A fail-closed rollback/kill-switch policy.

14. V2-origin official retest prevented from falling into V1.

15. No public Progress migration.

16. No V2 report/next block.

17. Internal H1/H2 and standalone V2 harnesses retained.

18. No V1 legacy-result migration.

## Required prior reading

Read in full before changing code:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md`
- `docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- current `App.tsx`;
- onboarding state-machine/types/tests;
- camera explanation/setup flow;
- current `beginCheckUp` and official-retest handlers;
- H1/H2 wrappers;
- V2 pending/recovery selectors;
- V2 artifact/application materialisation service;
- current block intro/onboarding block screen;
- restore/account hydration;
- current internal flag modules;
- current Progress official-retest actions;
- current Today/Plan official-retest actions.

Treat current code, including untracked production files, as source of truth.

## Scope boundary

This task may change:

- `.env.example`;
- a new unified-release config helper and tests;
- public Check-Up engine-selection helper and tests;
- `App.tsx`, narrowly;
- onboarding route/state integration;
- camera-setup start routing;
- H1 unified V2 wrapper props/entry context, narrowly;
- V2 reference-details wrapper props/public mode, narrowly;
- H2 unified V2 results wrapper props/variant, narrowly;
- onboarding block-intro navigation for a prepared V2 block;
- typed recovery for unavailable V2 official retest;
- focused tests;
- the H3 report.

This task may consume but must not change the semantics of:

- V2 live coordinator;
- V2 flow reducer;
- V2 voice runtime;
- V2 raw Check-Up builder;
- V2 reference details;
- V2 snapshot/assessment orchestrator;
- V2 block materialiser;
- H1 Check-Up shell;
- H2 results shell;
- Stage 5 planner/scheduler.

This task must not change:

- Check-Up visual design;
- Results visual design;
- V1 scoring/norm/focus logic;
- V2 protocol algorithms;
- V2 reference tables/transforms;
- V2 snapshot/assessment schema;
- V2 focus policy;
- V2 block policy;
- exercise catalogue;
- Stage 4/5 rules;
- Progress presentation;
- official V2 retest/report;
- block-report generation;
- next-block creation after retest;
- Warden behavior;
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

Record exact output in the report.

Rules:

1. Treat every existing tracked/untracked change as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent onboarding, App, pose, backend, and training work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If a concurrent change makes safe integration ambiguous, stop mutation and document the conflict.

## Step 2: Run current baseline before edits

Run focused tests covering:

- H1 shared Check-Up shell;
- H2 shared Results shell;
- current V1 onboarding baseline;
- current V1 `beginCheckUp`;
- current V2 internal flow;
- V2 reference details;
- V2 artifact materialisation;
- V2 automatic block creation;
- onboarding state restore;
- public official-retest actions;
- internal flags/routing.

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
rm -rf /tmp/hale-unified-h3-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h3-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h3-baseline-export
exit $rc
```

Record exact counts and warnings.

If baseline fails for a concurrent unrelated reason:

- do not repair unrelated code;
- continue only if H3 can be implemented and fully revalidated safely;
- otherwise mark H3 blocked.

# PART B — RECONSTRUCT CURRENT PUBLIC ONBOARDING

## Step 3: Trace the current fresh-user journey

Trace actual current code:

```text
sign-in / fresh local state
-> welcome
-> profile/safety/life-goal/equipment
-> camera explanation
-> camera setup
-> beginCheckUp('baseline')
-> V1 CheckUpScreen
-> V1 OnboardingResultsScreen
-> block creation
-> onboarding block intro
-> first session / Today
```

Document:

- route names;
- onboarding state fields;
- persistent checkpoints;
- where baseline completion is recognised;
- where results are marked seen;
- where plan/block creation occurs;
- where onboarding is marked complete;
- where first-session readiness is derived;
- restore behavior at each boundary.

## Step 4: Identify every V1 assumption in onboarding

Search for:

- V1 `CheckUpScore`;
- V1 score snapshot;
- `MovementAssessment`;
- `weakestDomain`;
- `handleStartPlan`;
- `buildBlock`;
- `createMovementBlockFromAssessment`;
- `startBlock`;
- V1 result route;
- `hasOfficialAssessment`;
- `latestOfficialAssessment`;
- V1 completion/history predicates.

Create:

| Consumer | Current V1 assumption | H3 flag-off behavior | H3 flag-on behavior |
| --- | --- | --- | --- |

Do not route V2 artifacts through V1 types merely to satisfy onboarding.

## Step 5: Audit camera setup handoff

The existing camera explanation/setup screens remain canonical.

Determine the exact action that currently starts V1 after setup.

H3 should change only the engine selection after setup, not redesign or bypass these pages.

# PART C — RELEASE FLAG MODULE

## Step 6: Add one pure release config helper

Recommended path:

```text
src/config/unifiedMovementCheckUpRelease.ts
```

Use repository naming conventions.

Expose:

```ts
UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED
parseUnifiedMovementCheckUpReleaseFlag(...)
```

Requirements:

- exact deterministic parsing;
- default false;
- no side effects;
- no logging values;
- no backend/profile dependency;
- unit tests;
- `.env.example` documents `0`.

## Step 7: Flag precedence

Required matrix:

| Release flag | Internal V2 flag | Public baseline | Developer V2 rows |
| --- | --- | --- | --- |
| off | off | V1 | hidden |
| off | on | V1 | visible internally |
| on | off | unified V2 | hidden |
| on | on | unified V2 | visible internally |

Diagnostics flag remains independent and cannot enable public cutover.

## Step 8: No runtime remote switch

Search for any generic remote-config/profile/settings mechanism.

Prove it cannot set the release decision.

Do not add remote rollout infrastructure in H3.

# PART D — PUBLIC ENGINE SELECTION

## Step 9: Add a pure selector

Recommended path:

```text
src/checkup/publicCheckUpEngine.ts
```

or a repository-consistent equivalent.

Inputs should be explicit and pure:

- source type;
- onboarding vs standard entry;
- release flag;
- current active-block origin where official-retest safety needs it;
- optional current protocol/pending-artifact context.

No ambient history reads inside the selector.

## Step 10: Baseline rules

### Release off

Use current V1 baseline path unchanged.

### Release on

Use:

```text
MovementProfileV2UnifiedCheckUpScreen
```

through the H1 polished shared shell.

Source type:

- no accepted prior official V2 baseline -> `baseline`;
- explicit early retake / accepted previous V2 baseline according to current V2 source selector -> `baseline_retake`.

Do not infer `official_retest`.

## Step 11: Freeze launch decision

At flow launch, freeze:

- engine;
- source type;
- entry context;
- launch Check-Up ID/start time;
- relevant release-policy version if useful.

Do not reevaluate the engine during the run.

A V2 Check-Up must never continue in V1 after app state changes.

## Step 12: Unknown/malformed flow

Fail closed to typed recovery.

Do not silently default a partially started V2 flow to V1.

# PART E — PUBLIC UNIFIED CHECK-UP ROUTING

## Step 13: Reuse H1 wrapper

Do not create another Check-Up screen.

Public flag-on baseline must mount the same:

```text
MovementProfileV2UnifiedCheckUpScreen
-> CheckUpRecordingShell
```

used by the internal H1 parity path.

Add an explicit entry context, conceptually:

```ts
entryMode:
  | 'internal_comparison'
  | 'public_onboarding'
  | 'public_standard';
```

Adapt to current conventions.

## Step 14: Public mode behavior

Public mode must:

- hide internal/diagnostic labels;
- hide diagnostics export unless a separately authorised internal diagnostics build explicitly enables it;
- use normal back/exit behavior;
- preserve V2 voice/text behavior;
- preserve H1 visual shell;
- preserve one pose stream;
- preserve current reference-details handoff;
- expose no Settings/developer dependency.

## Step 15: Existing internal paths

Retain:

- internal unified H1 Check-Up;
- standalone V2 Check-Up reference harness;
- H2 unified result comparison path;
- standalone V2 result reference harness.

The release flag must not remove these when the internal flag is on.

# PART F — RAW COMPLETION AND REFERENCE DETAILS

## Step 16: Preserve raw-first persistence

Public V2 baseline must keep:

```text
live Check-Up completes
-> raw V2 Check-Up is saved locally
-> reference details are requested
```

Do not wait for reference details before saving the raw Check-Up.

## Step 17: Public reference-details mode

Reuse the existing V2 reference-details implementation.

Public copy must not show:

- V2;
- internal;
- developer;
- diagnostics;
- schema/policy wording.

Preserve current policy:

- age at test optional;
- reference group optional;
- no inference;
- no global reference-sex profile field;
- skip allowed;
- raw result remains valid;
- balance task band remains available;
- chair remains raw-only;
- later baseline-retake may prefill from the latest frozen V2 snapshot and require confirmation.

## Step 18: Entry-context routing

### Onboarding baseline

Reference details continue to H2 onboarding result variant.

### Standard baseline/baseline-retake

Reference details continue to H2 standard result variant.

No public flow should route to the standalone V2 reference screen.

# PART G — ARTIFACT AND PLAN MATERIALISATION

## Step 19: Reuse existing application service

The public flow must call the current application boundary already used internally.

Required sequence:

```text
accepted raw V2 Check-Up
-> explicit reference-details draft
-> current explicit life-goal input
-> existing artifact orchestrator
-> local snapshot + assessment
-> existing V2 block materialiser
-> local block
-> best-effort remote sync
```

Do not duplicate:

- snapshot creation;
- assessment creation;
- focus selection;
- prior-focus selection;
- block creation;
- sync logic.

## Step 20: No V1 artifacts in flag-on path

Architecture/source tests must prove the flag-on baseline path does not call:

- `scoreCheckUp`;
- V1 score snapshot creation;
- V1 `MovementAssessment`;
- V1 `createMovementBlockFromAssessment`;
- legacy `buildBlock`;
- legacy `startBlock`;
- V1 `handleStartPlan`.

A unified V2 baseline must not write a V1 score or legacy block representation.

## Step 21: Local-first behavior

The user may proceed when:

- snapshot/assessment/block are valid locally;
- remote sync is pending or failed.

Do not block results on remote sync.

## Step 22: Materialisation failures

If snapshot/assessment/block fails:

- preserve raw Check-Up;
- preserve any accepted frozen artifact;
- route typed recovery;
- do not fall back to V1 scoring;
- do not fabricate Balanced;
- do not mark onboarding complete;
- do not create a different block.

# PART H — PUBLIC H2 RESULTS ROUTING

## Step 23: Reuse H2 wrapper

Do not create another result screen.

Use:

```text
MovementProfileV2UnifiedResultsScreen
-> CheckUpResultsShell
```

with explicit variant:

```text
onboarding
standard
```

## Step 24: Onboarding result behavior

Display:

- frozen chair raw-only result;
- balance task band;
- shoulder IQR/raw-only state;
- frozen suggested focus or Balanced;
- matching automatic plan-ready state;
- exact CTA `View my 4-week plan`.

Do not:

- show Movement Age;
- show weakest domain;
- create the plan from CTA;
- mark onboarding complete merely because the result rendered.

## Step 25: Standard result behavior

Use the standard polished variant and existing plan navigation.

Do not alter Progress in H3.

## Step 26: Result retake/recovery actions

If current H2 presentation exposes retry:

- flag-on baseline retry must launch a V2 `baseline_retake`;
- never launch V1;
- do not replace an already-started active block;
- obey current immutable artifact/block conflict policy.

Do not invent a new retake policy if the current UI does not expose one.

# PART I — ONBOARDING STATE-MACHINE INTEGRATION

## Step 27: Define V2 onboarding evidence

A flag-on onboarding baseline counts as complete only when all required local evidence exists:

- raw-complete official V2 Check-Up;
- valid source-bound V2 snapshot;
- valid source-bound V2 assessment with domain or balanced focus;
- matching local V2 block ready or a documented active-block conflict recovery state.

Do not treat:

- raw-only pending Check-Up;
- snapshot-only;
- assessment `needs_retake`;
- malformed artifacts;
- unrelated active block;

as completed onboarding.

## Step 28: Protocol-neutral onboarding selectors

Add or update pure selectors so onboarding can answer:

- baseline measurement completed;
- result ready;
- plan ready;
- onboarding block intro ready;
- first session ready.

Do not cast V2 into V1 `MovementAssessment`.

## Step 29: Plan intro navigation

When the user taps:

```text
View my 4-week plan
```

during onboarding:

- navigate to the existing compatible onboarding block-intro or block-intro shell;
- use the matching already-created V2 block;
- support domain and balanced focus;
- do not create another block;
- do not change the block start date;
- do not start Session A automatically.

## Step 30: Onboarding completion

Preserve current product semantics for when onboarding becomes complete.

Do not mark complete before the user has reached the existing intended milestone.

If current onboarding completes after block intro/first session, preserve that behavior.

## Step 31: Balanced onboarding

Prove that a Balanced V2 assessment can complete onboarding and display a genuine balanced block intro without a fake focus domain.

# PART J — RESUME, RESTORE, AND IDEMPOTENCY

## Step 32: Resume matrix with release enabled

Cover:

1. exit during V2 chair;
2. exit during balance;
3. exit during shoulder;
4. raw complete before reference details;
5. reference details submitted before materialisation returns;
6. snapshot exists, assessment missing;
7. assessment exists, block missing;
8. local block ready, sync failed;
9. results shown before plan CTA;
10. plan CTA tapped before app close;
11. app restored on another signed-in device from backend artifacts.

Expected:

- no duplicate Check-Up;
- no duplicate snapshot;
- no duplicate assessment;
- no duplicate block;
- correct next screen;
- no V1 fallback.

## Step 33: Duplicate callback protection

Protect repeated:

- raw completion;
- reference-details submission;
- materialisation;
- sync completion;
- result navigation;
- plan CTA;
- app-state restore.

Use current stable IDs and immutable attachment/materialisation.

## Step 34: Restore from remote V2 baseline

A user with accepted remote V2 artifacts and block must not be sent through a new V1 baseline.

Use local/remote accepted selectors.

Do not recompute artifacts on restore.

# PART K — ROLLBACK / KILL-SWITCH POLICY

## Step 35: Release flag off after a V2 build

The release flag controls starting new public V2 measurements.

When a later build has the flag off:

### Existing complete V2 artifacts

- remain parseable;
- remain viewable through explicit existing result routes when reached;
- existing V2 block remains usable by Today/Plan/Stage 5;
- do not convert to V1.

### Existing local V2 block

- training continues;
- no second V1 block is created;
- no focus conversion.

### Raw-complete but unfinished V2 artifact

Fail closed under a typed recovery unless the current compatibility policy explicitly and safely allows completion.

Do not silently create a new V1 baseline from the same raw result.

### In-progress live V2 measurement

- do not resume through V1;
- preserve currently stored partial/raw state where current policy allows;
- route to calm recovery/restart;
- starting a new public Check-Up follows the flag-off V1 path.

## Step 36: Flag-on/off regression matrix

Test:

- fresh user flag off;
- fresh user flag on;
- partial V1 onboarding then flag on;
- partial V2 onboarding then flag off;
- completed V2 artifacts then flag off;
- active V2 block then flag off;
- internal flag combinations.

No user-facing data may be silently deleted by a flag change.

# PART L — OFFICIAL RETEST CONTAINMENT

## Step 37: Audit every official-retest entry

Inspect:

- Today;
- Plan;
- Progress;
- manual Check-Up options;
- lifecycle next-best action;
- deep/internal routes.

## Step 38: V2-origin block behavior

Until H4:

- a V2-origin active/completed block must never launch V1 official retest;
- return typed unavailable state;
- use calm copy, materially equivalent to:

```text
Your next Movement Check-Up will be available in a later beta update.
Your current plan and progress are saved.
```

Do not mention V1/V2.

Do not create report/next block.

## Step 39: V1 rollback behavior

Flag-off legacy V1 block behavior may remain as currently implemented.

Do not broadly redesign official retest in H3.

## Step 40: No false lifecycle completion

A V2 block reaching `retest_due` must not:

- become completed from stale status;
- create a V1 report;
- create a next V1 block;
- lose schedule evidence.

# PART M — INTERNAL SETTINGS AND PUBLIC COPY

## Step 41: Beta-facing Settings exposure

Release flag on, internal flag off:

- no developer V2 rows;
- no diagnostics rows;
- no “unified shell” row;
- normal users enter through onboarding/baseline.

Internal flag on:

- current comparison rows remain available under developer/internal section.

Do not remove internal harness code.

## Step 42: Public copy guardrails

Flag-on public flow must not show:

- V2;
- unified engine;
- internal;
- developer;
- diagnostics;
- schema;
- policy version;
- fingerprint;
- source ID;
- Movement Age;
- body age;
- weakest;
- Build/Create/Generate/Personalise plan;
- physical-validation claims.

User-facing names remain:

```text
Movement Check-Up
Movement Profile
Suggested focus
View my 4-week plan
```

# PART N — OBSERVABILITY AND PRIVACY

## Step 43: Safe launch/materialisation breadcrumbs

Use bounded codes such as:

- `public_checkup_engine_v1`;
- `public_checkup_engine_unified`;
- `unified_baseline_started`;
- `unified_raw_saved`;
- `unified_reference_details_pending`;
- `unified_artifacts_ready`;
- `unified_plan_ready`;
- `unified_plan_sync_pending`;
- `unified_official_retest_unavailable`;
- `unified_release_flag_disabled_recovery`.

Include only:

- Check-Up/snapshot/assessment/block IDs;
- source type;
- engine;
- entry context;
- action/reason code;
- policy version if needed.

Exclude:

- landmarks;
- video/images;
- raw pose coordinates;
- full profile;
- free-text health notes;
- auth tokens;
- provider secrets.

Pure helpers do not log.

# PART O — PUBLIC ROUTING AND DEEP-LINK SAFETY

## Step 44: Route guards

Public unified routes require:

- release flag on for starting a new measurement;
- or accepted continuation/read-only state under the explicit rollback policy.

Internal routes require the internal flag.

Unknown direct route attempts fail safely.

## Step 45: No deep-link bypass

Search current linking config.

Do not add public deep links to internal V2 screens.

A crafted route must not bypass:

- release flag;
- source eligibility;
- onboarding state;
- artifact validation.

# PART P — REQUIRED TEST MATRIX

## A. Release flag

- missing false;
- `0` false;
- `1` true;
- malformed false;
- no user/profile/backend authority;
- default `.env.example` false;
- internal/release flag matrix.

## B. Engine selector

- onboarding baseline flag off -> V1;
- onboarding baseline flag on -> unified V2;
- standard baseline flag on;
- baseline retake flag on;
- unknown source fails closed;
- decision frozen;
- input non-mutation.

## C. V1 rollback path

- current V1 onboarding route unchanged when off;
- V1 CheckUpScreen;
- V1 results;
- current V1 block callback;
- current official retest for V1 block;
- no V2 route.

## D. Public unified Check-Up

- camera explanation/setup preserved;
- H1 shared shell mounted;
- V2 live coordinator used;
- no V1 `SessionController`;
- no internal controls;
- no synthetic measurement;
- public copy;
- raw completion once.

## E. Reference details

- onboarding path;
- standard path;
- age entered/skipped;
- female/male/prefer not to say;
- no profile mutation;
- public copy;
- pending resume.

## F. Artifact/materialisation

- snapshot;
- assessment domain;
- assessment Balanced;
- automatic block;
- local-first;
- sync failure;
- idempotent;
- no V1 score/assessment/block;
- invalid headline fails closed.

## G. H2 results

- onboarding variant;
- standard variant;
- exact CTA;
- chair raw-only;
- balance task band;
- shoulder IQR/raw-only;
- domain focus;
- goal-led focus;
- Balanced;
- plan conflict/recovery.

## H. CTA and onboarding

- CTA navigates only;
- matching block ID;
- no block factory/materialiser call;
- onboarding block intro;
- domain block;
- balanced block;
- no automatic session start;
- onboarding state progression.

## I. Resume/restore

- every boundary in Step 32;
- remote restore;
- duplicate callbacks;
- no duplicated artifacts;
- no V1 fallback.

## J. Kill switch

- fresh flag-off V1;
- completed V2 artifacts remain readable;
- active V2 block remains usable;
- partial V2 does not switch to V1;
- raw pending recovery;
- no data deletion.

## K. Official retest containment

- V2-origin block re-test unavailable;
- no V1 Check-Up;
- no V1 report;
- no next block;
- V1-origin flag-off behavior unchanged;
- Today/Plan/Progress consistent.

## L. Settings/internal harness

- release on/internal off hides developer rows;
- internal on shows current rows;
- standalone H1/H2/V2 harnesses retained;
- no public deep link.

## M. Copy/privacy

- no internal terms;
- no Movement Age;
- no plan-build CTA;
- no physical-validation claim;
- breadcrumbs contain no media/health/free text.

## N. Product containment

- no Progress redesign;
- no official V2 retest;
- no report/next block;
- no Warden;
- no protocol/reference/focus/block-policy change;
- no audio generation.

## O. Regression

- H0;
- H1;
- H2;
- V1 onboarding/results;
- V2 live coordinator;
- V2 artifact chain;
- V2 automatic block;
- Stage 4;
- Stage 5H;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

## Test-quality requirements

Tests must:

- exercise production route selectors/wrappers;
- use real parsed V2 artifacts;
- use real V2 materialisation;
- use deterministic IDs/timestamps;
- exercise current onboarding reducer/store;
- assert no V1 artifact creation in flag-on path;
- assert no V2 artifact creation in flag-off V1 path;
- assert plan CTA navigation-only;
- assert official-retest fail-closed for V2 block;
- assert rollback behavior.

Tests must not:

- mock every layer;
- assert only helper calls;
- use camera hardware;
- use real network;
- install packages;
- regenerate audio;
- embed Warden data;
- weaken artifact/source validation;
- rely on wall-clock sleeps.

# PART Q — VALIDATION

## Step 46: Targeted validation

Run focused tests for:

- release flag;
- engine selector;
- App route selection;
- onboarding state;
- H1 Check-Up wrapper;
- reference details;
- H2 results wrapper;
- artifact/materialisation;
- plan-ready CTA;
- rollback;
- official-retest containment;
- internal Settings routing.

Record exact command and counts.

## Step 47: Full required validation

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then run:

```bash
rm -rf /tmp/hale-unified-h3-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h3-export
rc=$?
rm -rf /tmp/hale-unified-h3-export
exit $rc
```

Do not install dependencies.

Record:

- targeted suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
- app typecheck;
- website typecheck;
- Expo config;
- resolved release-flag default without printing secrets;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART R — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Flag off

```text
normal onboarding
-> camera setup
-> public engine selector
-> V1 CheckUpScreen
-> V1 OnboardingResultsScreen
-> current V1 plan path
```

## Flag on onboarding

```text
normal onboarding
-> camera setup
-> public engine selector
-> MovementProfileV2UnifiedCheckUpScreen
-> raw V2 Check-Up saved
-> public reference details
-> frozen snapshot + assessment
-> automatic V2 block
-> H2 onboarding Movement Profile
-> View my 4-week plan
-> matching onboarding block intro
```

## Flag on standard baseline

```text
standard baseline entry
-> unified V2 Check-Up
-> standard H2 Movement Profile
```

## Rollback

```text
completed V2 block
-> later flag-off build
-> training remains usable
-> no V1 conversion
```

## Official retest

```text
V2 block retest_due
-> typed unavailable
-> no V1 retest/report/next block
```

## Internal comparison

Confirm H1/H2/standalone V2 internal paths remain when internal flag is enabled.

# PART S — REPORT

Create exactly one new report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md
```

Do not edit prior reports or `docs/decisions.md`.

The report must contain:

1. Scope.
2. H2 prerequisite evidence.
3. Founder decisions carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current public onboarding architecture.
7. V1 assumption inventory.
8. Release-flag architecture.
9. Flag precedence matrix.
10. Public engine-selector contract.
11. Baseline/baseline-retake rules.
12. Official-retest containment rule.
13. Public H1 Check-Up routing.
14. Public reference-details routing.
15. Artifact/materialisation reuse.
16. Proof of no V1 artifacts in flag-on path.
17. Public H2 results routing.
18. Automatic plan/CTA behavior.
19. Onboarding state integration.
20. Domain and Balanced onboarding.
21. Resume/relaunch matrix.
22. Restore/idempotency.
23. Rollback/kill-switch behavior.
24. Settings/internal harness behavior.
25. Public copy guardrails.
26. Deep-link/route protection.
27. Observability/privacy.
28. Product containment.
29. Files changed.
30. Tests added/changed.
31. Exact targeted validation.
32. Exact full validation.
33. Audio verification.
34. App/website typechecks.
35. Expo config/export.
36. H0/H1/H2/Stage 3D-B/Stage 4/Stage 5 regression.
37. Remaining unified lifecycle work.
38. Whether H4 is unblocked.
39. Initial/final Git status.
40. Complete files-changed inventory.
41. Concurrent external changes.
42. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H3:

1. One strict public unified release flag exists.
2. The flag defaults off.
3. Missing/malformed values are false.
4. No user/backend/profile value enables it.
5. Flag off preserves current V1 baseline behavior.
6. Flag on routes public baseline to the H1 unified V2 shell.
7. Flag on routes baseline retake to V2.
8. Camera explanation/setup remains.
9. No internal/developer controls appear publicly.
10. V2 raw Check-Up saves before reference details.
11. Reference details remain per Check-Up and optional.
12. Snapshot/assessment/block use existing materialisers.
13. No V1 score is created in the unified path.
14. No V1 MovementAssessment is created.
15. No V1/legacy block is created.
16. Plan creation remains automatic.
17. H2 result uses frozen V2 data.
18. CTA is exactly `View my 4-week plan`.
19. CTA only navigates.
20. Domain onboarding works.
21. Balanced onboarding works without fake focus domain.
22. Onboarding completion is not marked prematurely.
23. Local-ready/sync-failed flow remains usable.
24. Duplicate callbacks create no duplicate artifacts.
25. Remote restore does not restart baseline.
26. Flag-off rollback does not convert V2 artifacts to V1.
27. Existing V2 block remains trainable after rollback.
28. A partial V2 flow never resumes as V1.
29. V2-origin official retest never launches V1.
30. No V2 report/next block is created.
31. Public Progress is unchanged.
32. Internal H1/H2/V2 harnesses remain.
33. Release flag alone does not show developer Settings rows.
34. No public deep-link bypass exists.
35. No Warden change occurs.
36. No V1 legacy-result migration is added.
37. Audio remains 150 assets.
38. App and website typechecks pass.
39. Android/iOS export pass.
40. Public release readiness is not claimed.

# ACCEPTANCE CRITERIA

Do not mark H3 complete unless:

1. Flag off preserves the V1 baseline path exactly.

2. Flag on completes a real public onboarding V2 path through the existing H1/H2 shells.

3. V2 artifacts and automatic plan are created through existing authorities.

4. No V1 scoring/assessment/block artifact is created in the flag-on path.

5. Onboarding state and plan-intro navigation work for domain and Balanced blocks.

6. Resume/relaunch/idempotency works.

7. Rollback policy is fail-closed and data-preserving.

8. V2 official retest cannot fall through to V1.

9. Internal comparison harnesses remain.

10. Public copy contains no internal/V2 terminology.

11. Public routing is controlled only by the release flag.

12. Targeted tests pass.

13. Full Jest passes.

14. Audio verification passes.

15. App typecheck passes.

16. Website typecheck passes.

17. Expo config passes.

18. Android/iOS export passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is overwritten.

22. No package install or lockfile change occurs.

23. No audio regeneration occurs.

24. No staging, commit, branch, or push occurs.

Do not mark H3 complete if:

- flag-on baseline still uses V1 scoring;
- the plan is created by the CTA;
- a V2 retest launches V1;
- public users need a Settings developer entry;
- Progress/report/next-block work is mixed into H3;
- a partial V2 flow silently becomes V1;
- the release flag defaults on;
- the unified flow exposes “V2” or internal terminology;
- Warden output is enabled.

# STAGE DECISIONS

At the end of the report, state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3 COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H3 BLOCKED
```

Also state exactly one:

```text
FAIL-CLOSED UNIFIED RELEASE FLAG IMPLEMENTED
UNIFIED RELEASE FLAG BLOCKED
```

Also state exactly one:

```text
PUBLIC BASELINE / ONBOARDING V2 CUTOVER IMPLEMENTED
PUBLIC BASELINE / ONBOARDING CUTOVER BLOCKED
```

Also state exactly one:

```text
UNIFIED ONBOARDING ARTIFACT AND PLAN FLOW VERIFIED
UNIFIED ONBOARDING FLOW BLOCKED
```

Also state exactly one:

```text
ROLLBACK / KILL-SWITCH BEHAVIOR VERIFIED
ROLLBACK / KILL-SWITCH BEHAVIOR BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H4 BLOCKED
```

Use H4 unblocked only when:

- flag-off V1 parity is green;
- flag-on public baseline reaches frozen V2 artifacts, automatic block, H2 results, and plan intro;
- no V1 artifact leaks into the unified path;
- rollback and resume are deterministic;
- V2 official retest is safely contained;
- no P0/P1 route/onboarding defect remains.

Also state:

```text
UNIFIED RELEASE FLAG DEFAULTS OFF
FLAG OFF PRESERVES V1 PUBLIC BASELINE
FLAG ON ROUTES PUBLIC BASELINE TO THE UNIFIED V2 ENGINE
PLAN CREATION REMAINS AUTOMATIC
V2 PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
NO V1 LEGACY-RESULT MIGRATION REQUIRED
PUBLIC PROGRESS MIGRATION NOT PERFORMED
OFFICIAL V2 RETEST NOT IMPLEMENTED
V2 REPORT / NEXT-BLOCK FLOW NOT IMPLEMENTED
INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
STAGE 4 REMEDIATION COMPLETE
STAGE 5 REMEDIATION COMPLETE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE DEFINITION

If H3 completes, H4 is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H4
PUBLIC V2 OFFICIAL RETEST, CLAIM-NEUTRAL PREVIOUS/CURRENT COMPARISON,
V2 BLOCK REPORT, AND AUTOMATIC NEXT BLOCK
```

H4 will:

- route a due V2-origin block into the unified V2 Check-Up as `official_retest`;
- preserve prior standing leg/shoulder side where appropriate;
- create a new frozen snapshot and assessment;
- show claim-neutral compatible raw comparisons only;
- create one V2 block report;
- complete the prior block;
- automatically create one next V2 block;
- support retries/offline/restore idempotently;
- retain Warden deferral;
- leave full Progress migration for H5.

Do not begin H4 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Release-flag path/name/default.
- Flag parsing and precedence.
- Public engine-selector path/behavior.
- Flag-off V1 parity.
- Flag-on onboarding route.
- Flag-on standard baseline route.
- H1 Check-Up shell reuse.
- Reference-details behavior.
- Artifact/materialisation behavior.
- Proof of no V1 artifacts in flag-on path.
- H2 result/onboarding variant behavior.
- Automatic plan/CTA behavior.
- Onboarding state/plan-intro behavior.
- Domain/Balanced result.
- Resume/idempotency result.
- Restore result.
- Rollback/kill-switch result.
- Official-retest containment.
- Settings/internal harness behavior.
- Public copy/deep-link containment.
- Files changed.
- Tests added/changed.
- Targeted validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0, H1, H2, Stage 3D-B V2 artifacts, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H3 COMPLETE` or blocked.
- Release-flag verdict.
- Public-cutover verdict.
- Onboarding-flow verdict.
- Rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED` or blocked.
- `UNIFIED RELEASE FLAG DEFAULTS OFF`.
- `FLAG OFF PRESERVES V1 PUBLIC BASELINE`.
- `FLAG ON ROUTES PUBLIC BASELINE TO THE UNIFIED V2 ENGINE`.
- `PLAN CREATION REMAINS AUTOMATIC`.
- `V2 PLAN CTA IS NAVIGATION-ONLY`.
- `NO BUILD MY PLAN ACTION`.
- `NO V1 LEGACY-RESULT MIGRATION REQUIRED`.
- `PUBLIC PROGRESS MIGRATION NOT PERFORMED`.
- `OFFICIAL V2 RETEST NOT IMPLEMENTED`.
- `V2 REPORT / NEXT-BLOCK FLOW NOT IMPLEMENTED`.
- `INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
