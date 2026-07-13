You are carrying out a new read-only comparative product, scientific, UX, and software-architecture audit of Pearl:

CURRENT MOVEMENT CHECK-UP AND RESULTS AUDIT — V1 VS MOVEMENT PROFILE V2 VS A UNIFIED HYBRID

The purpose of this audit is to determine what Pearl should actually ship as its canonical Movement Check-Up and result experience.

The allowed final recommendations are:

1. Promote Movement Profile V2 as the canonical product and retain V1 only for legacy history.
2. Keep the current V1 flow as the canonical product and selectively backport V2 improvements.
3. Build one explicitly defined unified hybrid that combines specific V1 and V2 components.
4. Defer the decision only if a clearly identified missing piece of evidence prevents a responsible choice.

Do not assume V2 is better because it is newer.

Do not assume V1 is better because it is currently the public/default route.

Do not recommend maintaining two permanent competing Check-Up systems.

The audit must reconstruct and test the current working tree as it exists now. Prior reports are historical context, not current truth.

## Current context entering this audit

The latest V2 implementation reportedly includes:

- a live pose-driven internal V2 Check-Up;
- V2-specific voice/text guidance;
- chair, 45-second balance, selected-side shoulder, and supporting hinge protocols;
- immutable V2 snapshots and assessments;
- ordinal suggested-focus logic with a true balanced mode;
- automatic local 4-week plan creation;
- domain-focused and genuine balanced blocks;
- a navigation-only `View my 4-week plan` CTA;
- Stage 5 training lifecycle reuse;
- V2 remaining behind an internal/closed-beta gate;
- V1 remaining the public/default Check-Up;
- physical-device validation not yet performed;
- public release remaining blocked.

The latest implementation report states that V2 automatically creates or reuses a block before the Movement Profile results screen, uses `balanced-A -> strength-A`, `balanced-B -> balance-B`, and `balanced-C -> mobility-C`, and leaves V1 as the public/default Check-Up.

Verify all of this in current code. Do not simply repeat the reports.

The current V1 implementation has also changed substantially during the same period. Reconstruct it from current code and current diffs before comparing it with V2.

## Audit mode

This is a read-only audit and decision task.

Do not implement any recommendation.

Do not refactor code.

Do not fix defects.

Do not change tests.

Do not modify UI, copy, scoring, protocols, source tables, snapshots, blocks, backend services, feature flags, audio, dependencies, lockfiles, or assets.

Do not enable V2 publicly.

Do not disable V1.

Do not perform physical-device validation.

Do not claim Pearl is production-ready or physically validated.

The only intended repository change is one new report:

```text
docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md
```

Temporary probes may exist only under:

```text
/tmp/pearl-checkup-v1-v2-audit/
```

Delete them before finishing.

Do not edit earlier reports or `docs/decisions.md`.

## Decision standard

The final recommendation must distinguish:

- scientific and claim validity;
- protocol appropriateness;
- actual software maturity;
- user experience and friction;
- lifecycle completeness;
- device-validation status;
- maintainability and migration cost.

A highly tested system with a weak measurement/claim model is not automatically preferable.

A scientifically stronger design with incomplete lifecycle or unverified live-device behavior is not automatically preferable.

The audit must identify the best whole-product path, not merely the most elegant isolated module.

# PART A — WORKTREE SAFETY AND CURRENT-STATE AUTHORITY

## Step 1: Capture exact initial state

Before analysis, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record the exact outputs in the report.

Important:

- Treat tracked and untracked current implementation files as part of the current working tree.
- Do not audit only committed `HEAD`.
- Treat every pre-existing modification as user-owned.
- Inspect current diffs before making any claim about a subsystem.
- Do not revert, delete, stage, commit, branch, or push.
- Do not use destructive Git commands.
- Do not inspect or expose `.env` values.
- Do not expose provider credentials.
- Do not modify or share font files.

## Step 2: Establish source-of-truth hierarchy

Use this order:

1. Current production code and current untracked production files.
2. Current tests and runtime probes.
3. Current UI/view-model copy.
4. Latest implementation reports.
5. Older reports as historical explanation only.

When a report and current code disagree, current code wins and the disagreement must be recorded.

## Step 3: Locate every relevant current implementation file

Do not rely only on the lists below.

Use repository search to locate all current V1/V2 entry points, policies, controllers, view models, persistence, and plan consumers.

Search at minimum for:

```text
legacy_movement_age_v1
movement_profile_v2
Movement Age
Movement Profile
weakestDomain
focusDomain
movementProfileV2Snapshot
movementProfileV2Assessment
movement-block-v2
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
View my 4-week plan
Build my plan
balance-ladder
one-leg-balance-45s-v2
chair-stand-30s
chair-rise-30s-v2
shoulder-flexion-peak
active-shoulder-reach-v2
```

Create a current module inventory classified as:

- shared/canonical;
- V1-only;
- V2-only;
- compatibility/legacy-only;
- duplicated;
- apparently dead or unreachable;
- uncertain.

# PART B — REQUIRED PRIOR READING

Read the latest versions of these reports in full where present:

## Current V2 line

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md`
- `docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md`

## Current V1/scoring line

- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D_B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md`

## Shared training/safety line

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4C_R.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4E_R.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`

## Voice and camera

Read current approved voice specifications and current pose-pipeline/latency reports where present.

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`.

Do not treat any old stage status as current without code verification.

# PART C — BASELINE VALIDATION

## Step 4: Run current baseline before analytical probes

Run a targeted current slice covering:

- V1 Check-Up controller and flow;
- V1 scoring, snapshot, focus, results, and assessment eligibility;
- V2 protocol policy and controllers;
- V2 live coordinator;
- V2 reference engine;
- V2 snapshot and assessment;
- V2 persistence/materialisation;
- V2 block materialisation;
- current Results/Onboarding Results/Progress view models;
- block/session planning;
- Stage 5 lifecycle.

Then run:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run a non-publishing export:

```bash
rm -rf /tmp/pearl-checkup-v1-v2-audit-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-checkup-v1-v2-audit-export
rc=$?
rm -rf /tmp/pearl-checkup-v1-v2-audit-export
exit $rc
```

Record:

- exact targeted command;
- suite/test counts;
- full-suite counts;
- audio matrices;
- typechecks;
- Expo config/export;
- warnings;
- whether any validation command changed files.

Do not install packages.

# PART D — CURRENT PRODUCT ENTRY AND ROUTING AUDIT

## Step 5: Reconstruct the actual new-user path

Trace the current code from:

```text
fresh install/sign-in
-> onboarding
-> camera explanation/setup
-> baseline Check-Up
-> results
-> block/plan creation
-> first session
```

Answer exactly:

- Does a normal new user currently enter V1 or V2?
- What flags affect this?
- Can a restored backend/profile value enable V2?
- Is V2 reachable only through Settings/developer tooling?
- Does onboarding ever call V2?
- What happens when the internal V2 flag is disabled?
- What happens when it is enabled?
- Can V1 and V2 both create artifacts for the same user?
- How does an existing active block affect V2?
- What does the user see after either flow?

## Step 6: Reconstruct all current Check-Up entry points

Inventory:

- onboarding baseline;
- normal manual Check-Up;
- baseline retake;
- official retest;
- micro-check;
- Settings/internal V2;
- recovery/resume;
- deep links/internal routes;
- any diagnostics/test-only routes.

For each entry, record:

| Entry | V1/V2 | User-visible | Source type | Can create score/snapshot/assessment/block/report | Feature gate |
| --- | --- | --- | --- | --- | --- |

## Step 7: Reconstruct results and Progress routing

Determine:

- which results screen each flow opens;
- which view model each screen uses;
- what Progress shows when only V1 exists;
- what Progress shows when only V2 exists;
- what happens when both exist;
- whether V1/V2 histories can be confused;
- whether any current screen recomputes frozen V2 interpretation or focus;
- whether V1 data can leak into V2 copy or vice versa.

# PART E — CURRENT V1 END-TO-END RECONSTRUCTION

## Step 8: Reconstruct V1 as it exists now

Trace:

```text
V1 entry
-> battery
-> per-movement preflight/instructions/countdown/active/result
-> raw Check-Up
-> validation
-> scoring
-> score snapshot
-> focus selection
-> MovementAssessment
-> block creation
-> results/progress/report
```

Inspect at minimum:

- V1 battery construction;
- generic `SessionController`;
- current movement definitions;
- preflight/readiness;
- Check-Up orchestration;
- current V1 score validation;
- norms;
- scoring;
- focus selection;
- score snapshots;
- assessment/block eligibility;
- Results;
- Onboarding Results;
- Progress;
- block report;
- current plan-creation CTA and timing.

## Step 9: V1 protocol inventory

For every V1 movement, record:

- movement ID;
- domain;
- camera orientation;
- setup requirements;
- practice behavior;
- active duration;
- retry/interruption behavior;
- raw metric;
- metric bounds;
- supporting metrics;
- whether it is in the default battery;
- whether it affects the score;
- whether it affects focus;
- whether it is shown to the user.

Include:

- chair stand;
- balance ladder/single-leg metric;
- shoulder flexion;
- hinge reach;
- TUG if present but hidden/supporting.

## Step 10: V1 claim and result inventory

Inventory every current V1 user-facing result claim:

- raw metric;
- age/range language;
- product band;
- beta/provisional label;
- focus wording;
- plan wording;
- trend wording;
- report wording.

Search production surfaces for:

```text
age
Movement Age
movement age
Typical
Strong
Building
Starting point
weakest
suggested focus
improved
declined
held steady
younger
older
```

Classify each claim as:

- direct raw fact;
- source-backed comparison;
- Pearl product interpretation;
- historical/legacy label;
- softened but still derived from unsupported V1 age inversion;
- potentially misleading;
- safe.

## Step 11: V1 plan-creation behavior

Determine whether current V1:

- creates the block automatically;
- creates it only after a CTA;
- creates both legacy and current blocks;
- can create duplicate blocks;
- supports balanced focus;
- uses exact/near-tie metadata;
- handles active-block conflict;
- syncs/restores correctly.

# PART F — CURRENT V2 END-TO-END RECONSTRUCTION

## Step 12: Reconstruct V2 as it exists now

Trace the actual code path:

```text
internal V2 entry
-> dedicated live Check-Up
-> raw V2 Check-Up persistence
-> reference details
-> immutable snapshot
-> immutable assessment
-> automatic block materialisation
-> Movement Profile results/detail
-> Plan/Today/Progress
```

Verify:

- internal gate;
- diagnostics gate;
- source-type selection;
- live coordinator;
- movement/attempt epochs;
- timer source;
- voice sequencing;
- raw completeness;
- reference-profile handling;
- snapshot/assessment creation;
- block creation;
- CTA behavior;
- sync/restore;
- active-block conflict.

## Step 13: V2 protocol inventory

For every V2 movement, record the same fields as V1.

Include:

- chair rise 30s;
- one-leg balance 45s adaptive best-of-three;
- active shoulder reach;
- supporting hinge.

Confirm exact current behavior for:

- chair practice;
- final rep boundary;
- selected balance leg;
- rest timing;
- invalid-tracking attempts;
- selected shoulder side;
- pain-limited results;
- no-measurement hinge;
- backgrounding/resume.

## Step 14: V2 claim and result inventory

Inventory current V2 output:

- chair raw result and raw-only reason;
- balance raw seconds/task band/benchmark;
- shoulder raw angle/IQR category;
- suggested focus;
- balanced focus;
- plan-ready copy;
- detail copy;
- Progress copy;
- recovery copy.

Verify that current code does not reintroduce:

- Movement Age;
- exact unsupported chair percentile;
- balance percentile/range;
- higher-is-better shoulder copy;
- weakest-domain claims;
- improvement/decline claims.

## Step 15: V2 plan behavior

Verify:

- automatic local block creation;
- stable V2 block identity;
- domain block mapping;
- genuine balanced A/B/C templates;
- planned primary domain;
- credit behavior;
- CTA navigation only;
- active-block conflict;
- persistence/sync/restore.

Record all V2 lifecycle gaps that still exist, including:

- official retest routing;
- block report;
- next block;
- balanced micro-checks;
- public onboarding;
- physical-device validation.

# PART G — SHARED VS DUPLICATED ARCHITECTURE

## Step 16: Create a subsystem ownership matrix

For each subsystem, state whether V1 and V2:

- share one implementation;
- use an adapter around one implementation;
- duplicate logic;
- have incompatible contracts;
- have legacy compatibility only.

Subsystems:

- camera/native pose;
- landmark pipeline;
- readiness;
- state machine;
- timer;
- chair geometry;
- balance geometry;
- shoulder geometry;
- hinge geometry;
- voice;
- raw Check-Up type;
- scoring/reference interpretation;
- snapshot;
- assessment/focus;
- block;
- plan generation;
- history;
- sync/restore;
- results UI;
- Progress;
- recovery;
- diagnostics.

## Step 17: Identify duplication and drift risk

Measure where practical:

- production files;
- lines of code;
- test files/tests;
- state machines;
- snapshot/assessment types;
- audio cues/assets;
- route/screen count.

Do not use raw LOC as quality proof.

Identify:

- duplicate bugs likely to require two fixes;
- places where one flow has already drifted;
- current consumers that branch on V1/V2;
- current code that can become canonical shared infrastructure;
- code that should become legacy read-only if one path is selected.

# PART H — PROTOCOL-BY-PROTOCOL COMPARISON

## Step 18: Chair comparison

Compare current V1 and V2 for:

- setup friction;
- chair-height handling;
- practice;
- arms/hand use;
- counting semantics;
- partial final rep;
- tracking interruptions;
- raw metrics;
- velocity;
- source compatibility;
- user-facing interpretation;
- focus contribution;
- device-validation needs.

Give a verdict:

- V1 better;
- V2 better;
- combine exact components;
- insufficient evidence.

## Step 19: Balance comparison

Compare:

- V1 ladder/stages and effective scored ceiling;
- V2 45-second adaptive attempts;
- source protocol match;
- user friction and total duration;
- support/manual controls;
- selected leg;
- rest;
- retry;
- tracking loss;
- raw result;
- interpretation;
- focus contribution;
- safety;
- device risk.

Explicitly determine whether any proposed hybrid using V1 balance measurements with V2 reference interpretation would be scientifically invalid.

## Step 20: Shoulder/mobility comparison

Compare:

- V1 peak shoulder flexion;
- V2 selected-side active shoulder reach;
- side persistence;
- torso compensation;
- retry;
- pain limitation;
- source-table match;
- whole-domain naming;
- hinge supporting role;
- user-facing interpretation.

## Step 21: Hinge and TUG role

Determine:

- whether either should remain headline;
- whether either should remain supporting;
- whether current UI overgeneralises them;
- whether either should influence focus.

# PART I — MATCHED-SCENARIO RUNTIME PROBES

## Step 22: Build temporary read-only probes

Use current production helpers through temporary scripts/tests under:

```text
/tmp/pearl-checkup-v1-v2-audit/
```

Do not add repository tests.

Do not use actual camera hardware.

Use deterministic timestamps and current parsers/builders.

## Step 23: Matched scenarios

Run comparable V1 and V2 scenarios where protocol differences permit.

At minimum:

1. Broadly average results.
2. Clearly low balance, other domains ordinary.
3. Clearly low chair, other domains ordinary.
4. Shoulder below reference, other domains ordinary.
5. Exact/near-equivalent domains.
6. Missing exact age/reference group.
7. Chair setup uncertain.
8. Balance valid raw result but incomplete reference protocol.
9. Shoulder pain-limited.
10. One invalid headline movement.
11. No unique life-goal tie-break.
12. A uniquely mapped life goal.
13. Existing different active block.
14. Same Check-Up/materialisation replay.
15. Restore from frozen history.

For each record:

| Scenario | V1 raw result | V1 displayed result | V1 focus | V1 block | V2 raw result | V2 displayed result | V2 focus | V2 block | Trust/product difference |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Do not force one protocol’s raw metric into another protocol’s source model if it is not valid.

## Step 24: Output divergence analysis

Identify scenarios where V1 and V2 would tell the same user materially different stories.

Classify divergence as:

- expected due to improved protocol;
- expected due to different claim policy;
- unsupported V1 artifact;
- V2 loss of useful information;
- focus-policy difference;
- bug/inconsistency;
- unresolved device uncertainty.

# PART J — SCIENTIFIC AND CLAIM VALIDITY

## Step 25: Re-evaluate current claims, not old designs

Use the existing source-provenance reports as the evidence baseline.

Do not redo broad literature research unless current code introduces a claim not covered by those reports.

For each system determine:

- raw metric validity;
- protocol/source compatibility;
- source provenance;
- extrapolation;
- sex/reference-group handling;
- false precision;
- cross-domain comparability;
- focus justification;
- longitudinal-claim readiness.

## Step 26: Separate four different questions

For V1 and V2 separately answer:

1. Is the raw measurement meaningful?
2. Is the external comparison defensible?
3. Is the cross-domain suggested focus defensible?
4. Is month-to-month change interpretation defensible?

Do not collapse these into one “scientific” score.

## Step 27: Claim-risk register

Create findings with severity:

- P0: harmful or fundamentally false product behavior/data corruption.
- P1: public-release blocker or major trust/safety problem.
- P2: closed-beta limitation/architecture risk.
- P3: polish/documentation.

Include exact code/surface evidence.

# PART K — SOFTWARE MATURITY AND LIVE MEASUREMENT

## Step 28: Compare controller architecture

Compare:

### V1

- generic `SessionController`;
- item flow;
- timing;
- interruption/reset;
- direct movement grader integration;
- resume behavior.

### V2

- dedicated flow/live coordinator;
- movement/attempt epochs;
- monotonic timer bridge;
- stale/duplicate/out-of-order frame rejection;
- manual support controls;
- recovery;
- diagnostics.

Assess:

- determinism;
- complexity;
- stale-event risk;
- testability;
- maintainability;
- likely real-device failure modes.

## Step 29: Geometry and pose-pipeline reuse

Determine exactly:

- which V2 adapters reuse V1 geometry;
- which algorithms are duplicated;
- whether outputs differ for the same landmark sequence;
- whether one implementation is more conservative;
- whether a unified geometry layer is feasible.

## Step 30: Device-validation evidence

Inventory actual evidence for both systems:

- automated synthetic replay;
- emulator;
- physical device;
- human-count agreement;
- stopwatch agreement;
- shoulder repeatability;
- latency;
- multi-device coverage.

Do not treat long deployment age or test count as physical validation.

# PART L — USER EXPERIENCE AND FRICTION

## Step 31: Model Check-Up duration

From current code, calculate best-case, plausible typical, and worst-reasonable duration for:

- V1;
- V2.

Include:

- setup;
- voice;
- countdown;
- active measurement;
- rests;
- retries;
- transitions;
- reference details.

State assumptions.

## Step 32: Interaction burden

Compare:

- number of screens;
- number of required choices;
- number of taps;
- side/leg choices;
- reference details;
- retries;
- result comprehension;
- plan transition.

Assess for adults aged approximately 45–65.

## Step 33: Trust and comprehensibility

Compare how easily a user can answer:

- What was measured?
- Why did Pearl give this result?
- Why did Pearl choose this focus?
- What should I do next?
- Is this medical?
- Can I compare this with last time?

Use current copy, not intended copy.

## Step 34: Accessibility and responsive behavior

Review current screen code/tests for:

- dynamic text;
- compact phones;
- touch targets;
- voice/text parity;
- color-only meaning;
- long copy;
- timer/attempt announcements.

# PART M — LIFECYCLE COMPLETENESS

## Step 35: Build a feature-parity matrix

For V1 and V2:

| Lifecycle capability | V1 status | V2 status | Shared implementation | Evidence |
| --- | --- | --- | --- | --- |
| Normal onboarding entry | | | | |
| Baseline Check-Up | | | | |
| Results | | | | |
| Focus | | | | |
| Automatic plan | | | | |
| First session | | | | |
| Four-week schedule | | | | |
| Weekly micro-check | | | | |
| Official retest due | | | | |
| Official retest UI | | | | |
| Re-test results | | | | |
| Block report | | | | |
| Next block | | | | |
| History | | | | |
| Offline | | | | |
| Sync/restore | | | | |
| Account switch/clear | | | | |
| Recovery | | | | |
| Diagnostics | | | | |

Distinguish:

- production wired;
- internal wired;
- pure contract only;
- tested only;
- absent.

## Step 36: Full-lifecycle risk

Determine whether V2 can currently replace V1 without regressing:

- onboarding;
- official retest;
- report;
- next block;
- micro-check;
- active-user migration.

Do not treat the initial plan as the whole product lifecycle.

# PART N — DATA, HISTORY, AND MIGRATION

## Step 37: Compare artifact models

Compare:

### V1

- raw Check-Up;
- score snapshot;
- MovementAssessment;
- MovementBlock;
- reports.

### V2

- raw Check-Up;
- reference snapshot;
- V2 assessment;
- V2 block origin/focus;
- no/current reports.

Assess:

- immutability;
- source binding;
- versioning;
- conflict handling;
- recomputation;
- sync/restore;
- payload safety.

## Step 38: Migration cases

For each candidate recommendation, define behavior for:

1. New user with no history.
2. Existing V1 user with no active block.
3. Existing V1 user with an active block.
4. User with V1 history and new V2 Check-Up.
5. User with V2 internal history.
6. User with malformed/incomplete artifacts.
7. Offline user.
8. User on an older app version.
9. Rollback from new canonical flow.

Do not recommend recomputing historical V1 or V2 results.

## Step 39: History presentation

Determine:

- what old V1 Movement Age should display;
- whether V1 should be labelled legacy;
- whether V1/V2 raw metrics can be shown together;
- which longitudinal comparisons are compatible;
- how Progress should avoid confusing users.

# PART O — MAINTAINABILITY AND RELEASE RISK

## Step 40: Dual-system cost

Audit the ongoing cost of retaining both:

- feature changes need two implementations;
- voice/copy duplication;
- camera/controller duplication;
- results/history branches;
- block compatibility;
- test matrix;
- release QA;
- migrations.

Estimate relative maintenance burden:

- low;
- medium;
- high;
- unsustainable.

## Step 41: Finish-to-production gap

For each option, list the remaining work and classify:

- already complete;
- small;
- medium;
- large;
- research/device dependent.

Options:

- V1 canonical;
- V2 canonical;
- unified hybrid.

Do not provide unsupported calendar estimates.

## Step 42: Rollback and kill-switch quality

Assess:

- can V2 be disabled safely?
- what happens to V2 blocks/artifacts after disabling?
- can users continue training?
- does V1 reappear cleanly?
- can a chosen hybrid be rolled back without data loss?

# PART P — HYBRID OPTIONS

## Step 43: Evaluate specific hybrids

Evaluate at least:

### Hybrid A — V1 protocol + V2 reference/results

Determine whether it is scientifically valid for each domain.

Reject it where protocol mismatch makes it invalid.

### Hybrid B — V2 protocol + V1 Movement Age/results

Determine whether this reintroduces invalid or false-precision claims.

### Hybrid C — V1 onboarding/shell + V2 protocols/results/artifacts + shared Stage 5 training

This may be a migration strategy rather than a permanent dual system.

Assess exact feasibility.

### Hybrid D — V2 protocols and artifacts + selected V1 UI components

Assess which UI can be shared safely without reusing V1 interpretation.

### Hybrid E — unified canonical Check-Up player with protocol-version adapters

Assess whether V1 becomes legacy-history only while current measurement uses one player.

### Hybrid F — per-domain best-of-both

For example:

- V2 balance;
- one of V1/V2 chair implementations;
- one of V1/V2 shoulder implementations;
- V2 results/focus;
- shared training.

Assess whether this creates a coherent protocol and version contract or an unmaintainable “V3 by accident.”

## Step 44: Hybrid safety rule

A hybrid is acceptable only if it has:

- one canonical new-user flow;
- one canonical current protocol per domain;
- one canonical result engine;
- one canonical focus policy;
- one canonical block origin;
- explicit legacy-history handling.

Do not recommend a hybrid that simply keeps both complete systems alive.

# PART Q — WEIGHTED DECISION MATRIX

## Step 45: Score three candidate products

Score:

1. Current V1 as canonical.
2. Current V2 as canonical.
3. Best coherent unified hybrid found by the audit.

Use this default weighting unless current evidence justifies a documented adjustment:

| Dimension | Weight |
| --- | ---: |
| Raw measurement/protocol validity | 15 |
| External claim validity | 15 |
| Focus/plan justification | 10 |
| Product clarity and user trust | 10 |
| Live software maturity/reliability | 12 |
| Safety/fail-closed behavior | 10 |
| Lifecycle completeness | 10 |
| UX friction/accessibility | 6 |
| Data/version/migration quality | 5 |
| Maintainability | 4 |
| Release/rollback risk | 3 |
| Total | 100 |

For each score:

- give 0–10;
- cite evidence;
- distinguish verified fact from inference;
- include confidence.

Do not let test count dominate the score.

## Step 46: Sensitivity analysis

Show whether the recommendation changes when:

- scientific validity is weighted more heavily;
- immediate closed-beta readiness is weighted more heavily;
- public-production completeness is weighted more heavily;
- maintenance cost is weighted more heavily.

# PART R — REQUIRED RECOMMENDATION

## Step 47: Make one primary recommendation

Choose exactly one:

```text
RECOMMEND PROMOTE V2 AS THE CANONICAL CHECK-UP
RECOMMEND KEEP V1 AS THE CANONICAL CHECK-UP
RECOMMEND BUILD A UNIFIED HYBRID
DECISION BLOCKED BY SPECIFIC MISSING EVIDENCE
```

Do not give three equally weighted options.

If recommending a hybrid, define it precisely by subsystem.

## Step 48: Provide two time-horizon recommendations

State separately:

### Invite-only closed beta

What should testers receive now?

### Public production

What should become the final canonical architecture?

These may differ, but the transition must be explicit.

## Step 49: State what to deprecate

List:

- code to keep canonical;
- code to keep read-only for legacy history;
- code to migrate;
- code to retire after migration;
- code that must not be reused.

## Step 50: Confidence and evidence gaps

Give:

- recommendation confidence: low/medium/high;
- top five evidence gaps;
- which gap could reverse the decision;
- which gaps only affect rollout timing.

# PART S — IMPLEMENTATION ROADMAP, WITHOUT IMPLEMENTING

## Step 51: Dependency-ordered roadmap

For the chosen recommendation, provide staged implementation batches.

Each batch must include:

| Batch | Purpose | Main files/subsystems | Migration behavior | Tests | Rollback | Release gate |
| --- | --- | --- | --- | --- | --- | --- |

The first batch should be small enough to become the next Codex prompt.

## Step 52: Avoid premature migration

Do not recommend deleting V1 data or code before:

- current-user migration is proven;
- rollback works;
- V1 history remains readable;
- V2/full hybrid lifecycle reaches retest/report/next block;
- required physical-device evidence exists.

## Step 53: Founder decision packet

End the report with a concise packet:

- recommendation;
- why;
- what ships to first testers;
- what remains blocked;
- top three risks;
- next implementation batch;
- decisions requiring founder approval.

# PART T — FINDING REGISTER

## Step 54: Findings

Create a full finding register:

| ID | System | Priority | Finding | User impact | Evidence | Recommendation | Decision impact |
| --- | --- | --- | --- | --- | --- | --- | --- |

Use prefixes:

```text
MC-V1-
MC-V2-
MC-SHARED-
MC-MIG-
MC-UX-
MC-SCI-
```

Priorities:

- P0;
- P1;
- P2;
- P3.

# PART U — REQUIRED REPORT

Create exactly:

```text
docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md
```

Required sections:

1. Executive recommendation.
2. Scope and read-only rules.
3. Initial Git status.
4. Validation baseline.
5. Current source-of-truth hierarchy.
6. Current module inventory.
7. Current entry/routing map.
8. Current V1 end-to-end flow.
9. Current V2 end-to-end flow.
10. Current V1 protocol inventory.
11. Current V2 protocol inventory.
12. Chair comparison.
13. Balance comparison.
14. Shoulder/mobility comparison.
15. Hinge/TUG role.
16. V1 result/claim inventory.
17. V2 result/claim inventory.
18. V1 focus and plan behavior.
19. V2 focus and plan behavior.
20. Shared/duplicated architecture.
21. Matched-scenario probe results.
22. Scientific/claim validity.
23. Software/controller maturity.
24. Live-device evidence.
25. UX/friction comparison.
26. Accessibility/responsive comparison.
27. Lifecycle feature-parity matrix.
28. Data/snapshot/history comparison.
29. Migration cases.
30. Dual-system maintenance cost.
31. Hybrid-option analysis.
32. Weighted decision matrix.
33. Sensitivity analysis.
34. Finding register.
35. Invite-only beta recommendation.
36. Public-production recommendation.
37. Deprecation/canonical module map.
38. Dependency-ordered roadmap.
39. Founder decision packet.
40. Remaining evidence gaps.
41. Final stage decisions.
42. Final Git status.
43. Temporary-file cleanup.

# PART V — ACCEPTANCE CRITERIA

Do not mark the audit complete unless:

1. Current code, including untracked production files, was inspected.

2. Current V1 is reconstructed from actual code rather than old reports.

3. Current V2 is reconstructed from actual code rather than implementation summaries.

4. Every normal and internal entry point is mapped.

5. V1 and V2 protocols are compared movement by movement.

6. Current user-facing claims are inventoried.

7. Current focus and plan behavior are compared.

8. Matched scenarios use current production helpers.

9. Protocol-invalid hybrids are explicitly rejected.

10. A coherent hybrid, if recommended, has one canonical path and engine.

11. Scientific validity and software maturity are scored separately.

12. Lifecycle completeness includes re-test/report/next block, not only initial plan creation.

13. Device-validation evidence is reported honestly.

14. Migration/rollback behavior is specified.

15. One primary recommendation is made.

16. Invite-only beta and public-production recommendations are stated separately.

17. A next implementation batch is defined.

18. No production code, test, config, UI, copy, source table, audio, dependency, lockfile, or asset is changed.

19. Targeted tests pass.

20. Full Jest passes.

21. Audio verification passes.

22. App typecheck passes.

23. Website typecheck passes.

24. Expo config passes.

25. Android/iOS export passes.

26. `git diff --check` passes.

27. Temporary probes are removed.

28. No package install, staging, commit, branch, or push occurs.

# PART W — FINAL STAGE DECISIONS

At the end of the report, state exactly one:

```text
MOVEMENT CHECK-UP V1/V2 CURRENT-STATE AUDIT COMPLETE
MOVEMENT CHECK-UP V1/V2 CURRENT-STATE AUDIT BLOCKED
```

State exactly one recommendation:

```text
RECOMMEND PROMOTE V2 AS THE CANONICAL CHECK-UP
RECOMMEND KEEP V1 AS THE CANONICAL CHECK-UP
RECOMMEND BUILD A UNIFIED HYBRID
DECISION BLOCKED BY SPECIFIC MISSING EVIDENCE
```

Also state:

```text
NO IMPLEMENTATION PERFORMED
V1 PUBLIC DEFAULT STATUS VERIFIED
V2 INTERNAL-GATE STATUS VERIFIED
PHYSICAL DEVICE VALIDATION STATUS VERIFIED FROM EVIDENCE
PUBLIC RELEASE READINESS NOT ASSUMED
```

Then state exactly one:

```text
NEXT IMPLEMENTATION BATCH READY
NEXT IMPLEMENTATION BATCH BLOCKED
```

Do not claim production readiness merely because automated validation passes.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether any production/test/config/asset file changed.
- Current V1 entry and role.
- Current V2 entry and role.
- Current V1 flow summary.
- Current V2 flow summary.
- Most important chair comparison.
- Most important balance comparison.
- Most important shoulder comparison.
- Biggest V1 scientific risk.
- Biggest V2 product/software risk.
- Lifecycle-completeness winner.
- Maintainability winner.
- Best hybrid, if any.
- Weighted scores.
- Invite-only beta recommendation.
- Public-production recommendation.
- Primary recommendation verdict.
- Confidence.
- Top evidence gaps.
- Next implementation batch.
- Targeted validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config/export.
- `git diff --check`.
- Initial and final Git status.
- Temporary-file cleanup.
- Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.
