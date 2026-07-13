You are implementing Stage 3D-B.2D.2C of Pearl’s production-readiness work:

AUTOMATIC MOVEMENT PROFILE V2 PLAN CREATION, V2 MOVEMENTBLOCK ORIGIN CONTRACT, DOMAIN-FOCUSED BLOCK INTEGRATION, GENUINE BALANCED-BLOCK TEMPLATES, AND STAGE 5 LIFECYCLE WIRING

This stage must begin only after the Movement Profile V2 physical-device validation gate has passed.

The central product rule is locked:

```text
The user does not build or generate the plan manually.

A valid frozen Movement Profile V2 assessment automatically creates or reuses the user’s 4-week plan.

The results screen then lets the user view or continue to the plan.
```

Do not add a `Build my plan`, `Create my plan`, or `Generate my plan` action.

The user explicitly starts a training session later, but Pearl owns the personalisation and plan-creation step automatically.

## Stage relationship

This stage follows:

- Stage 3D-B.2A: internal V2 assessment protocols/controllers;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshots, persistence, sync, and restore;
- Stage 3D-B.2D.1: V2 domain evidence, suggested focus, balanced fallback, and assessment contract;
- Stage 3D-B.2D.2A: V2 assessment persistence and artifact orchestration;
- Stage 3D-B.2D.2B: internal V2 Check-Up, reference details, results/detail UI, and Progress surface;
- Stage 3D-B.2E-A: live V2 pose integration and diagnostics;
- Stage 3D-B.2E-A.1: complete live artifact chain, V2 voice parity, JSON-safe no-measurement, and recovery.

It must integrate those frozen V2 artifacts with Pearl’s already-verified Stage 5 training lifecycle.

## Physical-device validation is a hard precondition

Before changing production code, search `docs/audits/` for the latest completed Movement Profile V2 physical-device validation report.

Likely names may include:

```text
PEARL_MOVEMENT_PROFILE_V2_PHYSICAL_DEVICE_VALIDATION.md
PEARL_LOGIC_VERIFICATION_STAGE_3D_B_2E_B.md
PEARL_MOVEMENT_PROFILE_V2_DEVICE_VALIDATION_REPORT.md
```

Do not assume a filename. Locate the actual latest report by content and date.

The validation report must explicitly cover, at minimum:

- one clean full Clara run;
- one clean full Marcus run;
- live chair practice and 30-second count;
- live 45-second balance timing;
- balance touchdown/support/stop behavior;
- 30-second rest unlock;
- 60-second default-ready behavior;
- invalid-tracking retry behavior;
- selected-side shoulder capture and retry;
- background/foreground handling;
- local/offline raw Check-Up -> snapshot -> assessment -> Movement Profile;
- no duplicate/lost artifacts;
- diagnostics privacy review;
- all P0/P1 findings resolved or formally accepted with a documented product decision.

### If no completed report exists

Do not implement Stage 3D-B.2D.2C.

Create only:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md
```

Mark:

```text
STAGE 3D-B.2D.2C BLOCKED
PHYSICAL DEVICE VALIDATION GATE BLOCKED
V2 AUTOMATIC PLAN CREATION NOT STARTED
```

Explain what report/evidence is missing.

### If unresolved P0/P1 device findings remain

Do not implement this stage.

Create the blocked report only.

### If the device gate passes

Record the exact validation report path, verdict, device inventory, accepted residual P2/P3 caveats, and proceed.

Do not broaden a one-device engineering pass into a public multi-device readiness claim.

## Current verified software baseline

### V2 measurement and artifacts

The current internal V2 flow can produce:

```text
live V2 Check-Up
-> complete raw V2 Check-Up
-> frozen reference profile
-> immutable V2 snapshot
-> immutable V2 assessment
-> Movement Profile V2 view model
```

The frozen V2 assessment contains one of:

```text
domain focus:
  strength_power
  balance_stability
  mobility_flexibility

balanced focus:
  balanced_insufficient_reference
```

`balanced` is a first-class focus mode and is not a `MovementDomain`.

### Current reference behavior

- Chair remains raw-only while the Warden transform is disabled.
- Balance task bands may drive Pearl-band focus.
- Shoulder below-IQR may drive reference focus.
- Raw-only evidence does not masquerade as a reference deficit.
- Suggested focus is frozen in the assessment.
- No live life-goal/profile read may recalculate historical focus.

### Current artifact persistence

- V2 snapshots and assessments are source-bound.
- Same-ID/different-fingerprint artifacts are immutable conflicts.
- Restore parses and never recomputes.
- V1 and V2 artifacts are separate.

### Current Stage 5 training system

Stage 5 is software-ready for controlled beta and currently provides:

- current-planner authority;
- fail-closed session generation;
- honest work evidence;
- primary-focus stimulus evidence;
- schedule credit;
- deterministic A/B/C scheduling;
- 4 sequential weeks;
- 12 main-plan credits;
- daily context/readiness/discomfort policy;
- canonical equipment;
- movement-capability gates;
- immutable plan equipment/capability/safety/release/progression snapshots;
- idempotent progression;
- local/backend restore;
- restart/lapse handling;
- official retest timing;
- adversarial lifecycle coverage.

This stage must reuse those contracts rather than creating a second training lifecycle.

## Product decisions locked for this stage

### Automatic plan creation

When a valid persisted V2 assessment is first materialised and block eligibility passes:

1. Create or reuse the corresponding V2 MovementBlock automatically.
2. Persist it locally before the user leaves the results flow.
3. Attempt backend sync through existing services.
4. Show the Movement Profile even if remote sync is pending.
5. Show that the plan is ready.
6. Let the user choose when to view the plan or start a later session.

The results CTA must be one of:

```text
View my 4-week plan
Continue to my plan
View my plan
```

Use one canonical choice based on current product style.

Do not use:

```text
Build my plan
Create my plan
Generate my plan
Personalise my plan
```

### Domain-focused assessment

Map:

```text
strength_power -> domain-focused Strength block
balance_stability -> domain-focused Balance block
mobility_flexibility -> domain-focused Mobility block
```

Use the frozen assessment focus.

Do not recalculate it.

### Balanced assessment

A balanced assessment must create a genuine balanced block.

Do not:

- convert balanced to strength;
- add `balanced` to `MovementDomain`;
- choose the first domain;
- use a hidden strength -> balance -> mobility fallback;
- create a domain block while only changing display copy.

The approved balanced A/B/C primary-domain schedule is:

```text
Balanced A -> strength_power primary domain
Balanced B -> balance_stability primary domain
Balanced C -> mobility_flexibility primary domain
```

Across four weeks, this yields:

```text
4 Strength-primary sessions
4 Balance-primary sessions
4 Mobility-primary sessions
```

Supporting work may still span the other domains through existing template/stimulus rules.

### Plan creation timing

The plan should be automatically materialised after the frozen assessment exists.

Preferred product sequence:

```text
Movement Check-Up completes
-> snapshot and assessment freeze
-> V2 block automatically materialises locally
-> Movement Profile is displayed
-> "View my 4-week plan"
```

The user must not wait on remote sync to view the locally prepared plan.

### Starting a session

Automatic plan creation does not automatically start Session A.

The user explicitly starts the first session later from:

- plan introduction;
- Plan;
- Today.

### Existing active block

Do not silently replace a different active block.

For this stage:

- identical existing V2 block for the same assessment -> reuse;
- no active block -> create;
- another active block -> preserve it and return typed `active_block_conflict`;
- do not archive, complete, or supersede a started block;
- do not rewrite a V1 active block;
- do not let an internal V2 run silently replace real user training history.

If a future baseline-retake replacement policy is needed, record it as deferred rather than inventing it here.

### Official V2 retest

The pure V2 block factory may support `official_retest` source validation if current contracts make this safe.

However, do not add the official V2 retest UI/report/next-block transition in this stage.

This stage’s user-routed product flow remains the initial automatic V2 block.

### Copy

Allowed:

- `Your 4-week plan is ready.`
- `Pearl prepared this plan from your Movement Profile.`
- `Suggested focus: Balance.`
- `Balanced plan.`
- `View my 4-week plan.`

Disallowed:

- `Build my plan.`
- `Pearl is building your plan` as a required user action.
- `Weakest domain.`
- `Scientifically weakest.`
- `Movement Age.`
- `Diagnosis.`
- `Fall risk.`
- `This plan will prevent decline.`
- improvement/decline claims.

## Required prior reading

Read these reports in full:

- the latest completed physical-device validation report;
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5G.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4E_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4C_R.md

Also inspect:

- AGENTS.md;
- CLAUDE.md;
- current MovementBlock types/builders;
- current block persistence/sync/restore;
- current dynamic template definitions;
- current schedule-credit identity;
- current focus-stimulus evidence;
- current block/plan view models;
- current Movement Profile results screen;
- current plan-intro flow;
- current internal gate conventions.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2D.2C must:

1. Verify the physical-device gate before mutation.

2. Add a separate V2 block-source/origin contract.

3. Add a first-class domain/balanced block-focus contract without changing `MovementDomain`.

4. Add deterministic V2 block eligibility.

5. Add stable V2 block ID and block fingerprinting.

6. Create a pure V2 block factory from a persisted frozen V2 assessment.

7. Add idempotent immutable attachment/upsert behavior.

8. Add automatic local block materialisation after V2 assessment materialisation.

9. Preserve locally created plan when remote sync fails.

10. Add domain-focused V2 blocks using existing domain generator policy.

11. Add genuine balanced A/B/C templates with explicit per-template primary domains.

12. Update focus-stimulus/main-plan credit to use template primary domain for balanced blocks.

13. Preserve Stage 5 schedule-credit, progression, safety, equipment, capability, release, daily-context, restore, and lapse contracts.

14. Persist/sync/restore V2 block origin and balanced metadata.

15. Update Movement Profile results to show an automatically prepared plan.

16. Use `View my 4-week plan` or `Continue to my plan`, never `Build my plan`.

17. Add V2 block-intro/Plan/Today support.

18. Keep V1 behavior unchanged.

19. Keep official V2 retest/report/public rollout out of scope.

20. Add end-to-end V2 baseline -> block -> Session A planning coverage.

21. Add a full four-week balanced-block software lifecycle test.

22. Preserve all earlier regressions.

## Scope boundary

This task may change:

- MovementBlock types/versioning;
- V2 block-origin types;
- block focus-mode types;
- V2 block eligibility/factory/parser;
- block persistence/sync/restore;
- dynamic template selection;
- balanced template definitions;
- focus-stimulus evidence;
- main-plan classification where required for balanced templates;
- plan/session metadata;
- block view models;
- Movement Profile results plan-ready state;
- V2 block-intro flow;
- Plan/Today handling for balanced/V2 blocks;
- tests;
- the Stage 3D-B.2D.2C report.

This task must not change:

- V1 score/focus behavior;
- V2 measurement protocols;
- V2 reference tables/transforms;
- Warden chair status;
- frozen V2 assessment focus policy;
- life-goal mapping;
- physical-device measurement algorithms;
- audio assets unless a truly new plan-intro cue is required and approved;
- official V2 retest UI;
- V2 report generation;
- public V2 rollout;
- improvement/decline policy;
- optional-level visibility;
- exercise catalogue IDs;
- dependencies;
- lockfiles;
- unrelated images/fonts.

Do not perform opportunistic refactors.

# PART A — WORKTREE AND PRECONDITION

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Rules:

1. Treat every existing change as user-owned.

2. Inspect diffs before touching any file.

3. Do not revert, overwrite, broadly reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not regenerate unrelated audio.

9. Do not stage, commit, create a branch, or push.

10. Do not inspect or expose `.env` values or provider credentials.

11. Do not modify or share font files.

## Physical-device gate report

Record:

- report path;
- date;
- devices;
- voices;
- scenarios;
- P0/P1/P2/P3 findings;
- retest results;
- final gate verdict.

The only allowed gate outcomes are:

```text
passed_for_internal_block_integration
blocked
```

Do not convert `software ready for testing` into a passed device gate.

## Baseline validation

Before edits, run a targeted slice covering:

- V2 snapshot/assessment/persistence;
- V2 internal results flow;
- existing V1 block creation;
- block schedule;
- session planning;
- focus-stimulus evidence;
- progression;
- equipment/capabilities;
- Stage 5H;
- Stage 4 closure.

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
rm -rf /tmp/pearl-stage3db2d2c-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d2c-export
rc=$?
rm -rf /tmp/pearl-stage3db2d2c-export
exit $rc
```

Record current counts.

# PART B — RECONSTRUCT CURRENT BLOCK ARCHITECTURE

## Step 1: Inspect the current MovementBlock contract

Inspect at minimum:

- src/adherence/types.ts
- src/adherence/blockService.ts
- src/adherence/adherenceService.ts
- src/pearlFlow/assessmentEligibility.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/blockSchedule.ts
- src/pearlFlow/focusStimulusEvidence.ts
- src/pearlFlow/mainPlanEvents.ts
- src/pearlFlow/progressionEvidence.ts
- src/pearlFlow/appLifecycle.ts
- src/pearlFlow/planViewModel.ts
- src/pearlFlow/progressViewModel.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- block/session sync and restore services
- App.tsx
- block intro/Plan/Today screens
- all relevant tests.

Document:

- block ID authority;
- block focus authority;
- template IDs;
- focus-domain assumptions;
- scheduler assumptions;
- main-plan credit assumptions;
- backend fields;
- restore behavior;
- one-active-block policy.

## Step 2: Identify every concrete-focus assumption

Search for:

- `block.focusDomain`;
- `weakestDomain`;
- focus-prefix mapping;
- template IDs derived from focus;
- main-plan credit matching block focus;
- UI copy assuming one domain;
- serialisers requiring a domain;
- block-report assumptions.

Create a table:

| Consumer | Current assumption | Domain block action | Balanced action |
| --- | --- | --- | --- |

Do not implement balanced mode until this trace is complete.

# PART C — BLOCK ORIGIN AND FOCUS CONTRACT

## Step 3: Add an explicit block origin union

Conceptually:

```ts
type MovementBlockOrigin =
  | {
      kind: 'legacy_v1_assessment';
      assessmentId?: string;
      sourceCheckUpId?: string;
    }
  | {
      kind: 'movement_profile_v2_assessment';
      assessmentId: string;
      assessmentFingerprint: string;
      snapshotId: string;
      snapshotFingerprint: string;
      sourceCheckUpId: string;
      sourceCheckUpType:
        | 'baseline'
        | 'baseline_retake'
        | 'official_retest';
      focusPolicyVersion: number;
      focusPolicyFingerprint: string;
    };
```

Adapt to current conventions.

Requirements:

- missing legacy origin normalises to V1;
- V2 origin is strict;
- V1 origin cannot masquerade as V2;
- source IDs/fingerprints round-trip;
- no live profile/reference input;
- no copy strings;
- no raw health/media data.

## Step 4: Add an explicit block focus union

Conceptually:

```ts
type MovementBlockFocus =
  | {
      kind: 'domain';
      domain: MovementDomain;
    }
  | {
      kind: 'balanced';
      balancedPolicyVersion: number;
      balancedPolicyFingerprint: string;
    };
```

Requirements:

- do not add `balanced` to `MovementDomain`;
- V1 missing focus union normalises from existing `focusDomain`;
- domain mode requires concrete domain;
- balanced mode must not carry a fake domain;
- impossible combinations fail closed;
- no hidden fallback.

Preserve the old `focusDomain` field only if needed for backward compatibility.

If retained:

- it is required/authoritative only for legacy/domain blocks;
- balanced blocks must not fill it with a fake value;
- current consumers must migrate to the focus union.

## Step 5: Version/fingerprint policy

Add explicit constants, conceptually:

```ts
MOVEMENT_PROFILE_V2_BLOCK_POLICY_VERSION
MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION
MOVEMENT_PROFILE_V2_BLOCK_SCHEMA_VERSION
```

Add deterministic fingerprints for:

- V2 block creation policy;
- balanced template policy;
- block source material.

No clock/environment/device input.

# PART D — V2 BLOCK ELIGIBILITY

## Step 6: Add pure V2 block eligibility

Conceptually:

```ts
getMovementProfileV2BlockCreationEligibility({
  checkUp,
  snapshot,
  assessment,
  existingBlocks,
  physicalValidationGate,
})
```

Eligible only when:

- physical-device gate passed;
- V2 Check-Up is official and source-bound;
- V2 snapshot valid and source-bound;
- V2 assessment valid and source-bound;
- assessment focus is:
  - domain;
  - balanced;
- focus is not `needs_retake`;
- no unsupported/future policy;
- no conflicting block already exists.

Missing age/reference sex is allowed.

Chair transform disabled is allowed.

Ineligible:

- V1 artifact;
- malformed/future artifact;
- source mismatch;
- needs-retake;
- manual/quick/micro/legacy Check-Up;
- active-block conflict;
- physical-device gate blocked;
- same expected block ID with conflicting material.

Return stable reasons.

## Step 7: Existing block policy

### Identical expected V2 block exists

Reuse it.

### Same V2 block ID, different fingerprint

Immutable conflict.

Preserve accepted block.

### Another active block exists

Do not replace it.

Return:

```text
active_block_conflict
```

The Movement Profile remains available.

### No active block

Create automatically.

# PART E — STABLE V2 BLOCK CONTRACT

## Step 8: Stable V2 block ID

Use one stable block identity per V2 assessment.

Conceptual format:

```text
movement-block-v2:<encoded-assessment-id>
```

Requirements:

- no random UUID;
- no ambient clock;
- same assessment -> same block ID;
- different assessment -> different block ID;
- URI safe;
- no focus mode in ID.

## Step 9: Block fingerprint

Fingerprint material fields:

- block schema;
- block ID;
- V2 origin;
- focus union;
- explicit start date;
- duration/week/session policy;
- template policy;
- source assessment;
- relevant planning-policy fingerprints.

Do not include mutable completion counters.

Equal source/material -> equal fingerprint.

## Step 10: V2 block fields

A V2 block should freeze, at minimum:

- block ID/fingerprint;
- origin;
- focus;
- start date;
- four-week policy;
- three-templates-per-week policy;
- template IDs;
- balanced template metadata when applicable;
- creation-policy version/fingerprint;
- status/current lifecycle fields using existing conventions.

Do not duplicate the full assessment.

# PART F — DOMAIN BLOCK FACTORY

## Step 11: Add a pure block factory

Conceptually:

```ts
createMovementBlockFromMovementProfileV2Assessment({
  checkUp,
  snapshot,
  assessment,
  startDate,
})
```

Requirements:

- revalidate source binding;
- use frozen assessment focus only;
- explicit start date;
- no ambient clock;
- no persistence;
- no sync;
- no reference-engine/focus recomputation;
- deterministic;
- parser round-trip;
- no V1 MovementAssessment creation.

## Step 12: Domain-focused behavior

For domain focus, reuse existing domain training semantics.

Map exactly:

```text
strength_power -> Strength
balance_stability -> Balance
mobility_flexibility -> Mobility
```

Preserve:

- current domain templates;
- release caps;
- movement capabilities;
- equipment;
- daily context;
- safety cues;
- progression policy;
- main-plan credit;
- schedule credit.

Do not rebuild a second domain generator.

# PART G — GENUINE BALANCED BLOCK

## Step 13: Add a canonical balanced template policy

The balanced template policy must be explicit and pure.

Required primary-domain mapping:

```text
balanced-A -> strength_power
balanced-B -> balance_stability
balanced-C -> mobility_flexibility
```

Conceptually:

```ts
type BalancedTemplateDefinition = {
  templateId: 'balanced-A' | 'balanced-B' | 'balanced-C';
  primaryDomain: MovementDomain;
  sourceTemplateId?: string;
  slotPolicyFingerprint: string;
};
```

Requirements:

- deterministic order A/B/C;
- explicit primary domain;
- source-template reuse must be explicit;
- no display-name parsing;
- no array-index domain inference;
- policy fingerprint;
- all three domains exactly once per A/B/C cycle;
- no hidden concrete block focus.

## Step 14: Reuse current template content safely

Audit current Strength, Balance, and Mobility templates.

Choose one explicit existing safe template composition for each balanced primary session.

Preferred policy:

```text
balanced-A derives from one current Strength template
balanced-B derives from one current Balance template
balanced-C derives from one current Mobility template
```

The exact source templates must be documented and tested.

Do not invent new exercises.

Do not expose hidden optional levels.

Do not copy by mutable display name.

Supporting slots may retain existing cross-domain support.

## Step 15: Balanced generator behavior

A balanced block uses:

```text
A -> strength primary
B -> balance primary
C -> mobility primary
```

Every week repeats the same primary-domain schedule.

The generator must:

- choose `balanced-A/B/C` from scheduler state;
- select the explicit source template composition;
- stamp:
  - block focus mode;
  - template primary domain;
  - balanced policy version/fingerprint;
- apply all existing equipment/capability/daily-context/release/safety/progression gates;
- return typed supporting/unavailable states when a safe primary cannot be planned.

Do not silently switch a blocked primary session to another domain and still grant main-plan credit.

## Step 16: Balanced no-primary behavior

If the planned template primary domain cannot provide a safe playable primary exercise:

- the session may become a supporting session under existing policy;
- it does not earn main-plan credit;
- scheduler does not advance;
- do not credit a different domain;
- do not rewrite the balanced schedule;
- use existing calm recovery/supporting copy.

# PART H — FOCUS-STIMULUS AND MAIN-PLAN CREDIT

## Step 17: Add an authoritative planned primary domain

For every current plan, expose one authoritative:

```ts
plannedPrimaryDomain: MovementDomain
```

Rules:

### Domain block

```text
plannedPrimaryDomain = block.focus.domain
```

### Balanced block

```text
plannedPrimaryDomain = balanced template primaryDomain
```

Persist it in plan/session metadata.

Start-time validation must confirm it matches:

- block focus mode;
- template ID;
- balanced policy snapshot;
- selected primary exercise metadata.

## Step 18: Update planned focus-stimulus evidence

Current Stage 5B logic must use `plannedPrimaryDomain`.

For domain blocks, behavior must remain semantically unchanged.

For balanced blocks:

- the primary exercise must match the current balanced template’s primary domain;
- supporting work in other domains is not enough for main-plan credit;
- fallback/cross-domain-only remains non-credit.

Do not use block-level fake focus.

## Step 19: Completion and schedule credit

A balanced session earns main-plan/schedule credit only when:

- current block-generated source;
- correct block/template/date;
- valid completed work;
- completed primary exercise;
- primary exercise intended domain matches planned primary domain;
- all Stage 5A/B/G rules pass.

A/B/C schedule credit remains one per date and template.

## Step 20: Progression evidence

Progression remains exercise-local and schedule-credit-gated.

Balanced mode must not:

- multiply progression events;
- progress supporting-only work as primary;
- create one fake balanced ladder;
- bypass movement-specific progression policy.

# PART I — SESSION PLANNING AND START VALIDATION

## Step 21: Extend current planner

`planTodayPearlSession` must support:

- legacy/domain V1 block;
- V2 domain block;
- V2 balanced block.

It must not use legacy fallback.

Balanced sessions must still carry:

- equipment snapshot;
- movement-capability snapshot;
- release-policy snapshot;
- progression-policy snapshot;
- safety-cue snapshot;
- daily context;
- schedule metadata;
- planned primary domain;
- V2 block source metadata.

## Step 22: Start-time validation

Before player launch, validate:

- block source;
- focus mode;
- template identity;
- planned primary domain;
- balanced policy snapshot;
- existing equipment/capability/release/progression/safety snapshots.

Stale/malformed balanced metadata routes to refresh/recovery.

Do not repair it silently.

# PART J — AUTOMATIC BLOCK MATERIALISATION

## Step 23: Add a pure block materialiser

Conceptually:

```ts
materializeMovementProfileV2Block({
  checkUp,
  snapshot,
  assessment,
  existingBlocks,
  startDate,
  physicalValidationGate,
})
```

Return:

```ts
type MovementProfileV2BlockMaterialisationResult =
  | {
      status: 'ready';
      block: MovementBlock;
      action: 'created' | 'reused';
      diagnostics: readonly ...[];
    }
  | {
      status:
        | 'physical_validation_blocked'
        | 'assessment_ineligible'
        | 'active_block_conflict'
        | 'immutable_conflict'
        | 'unsupported_policy';
      diagnostics: readonly ...[];
    };
```

Requirements:

- pure;
- no persistence;
- no sync;
- no ambient clock;
- no block replacement;
- input non-mutation.

## Step 24: Add the application service

After successful V2 snapshot/assessment materialisation:

1. Call the V2 block materialiser automatically.
2. Persist a newly created block locally.
3. Reuse an existing identical block.
4. Attempt existing block backend sync.
5. Preserve local block on sync failure.
6. Return plan-readiness state to the results flow.
7. Do not wait for the user to request plan creation.

Repeated completion/materialisation callbacks must remain idempotent.

## Step 25: Atomic local ordering

Preferred local ordering:

```text
save raw Check-Up
-> save snapshot/assessment
-> materialise block
-> save block
-> navigate to Movement Profile
-> sync in background
```

If block creation fails:

- snapshot/assessment remain valid;
- Movement Profile still opens;
- plan card shows a specific recovery state;
- no artifact is lost.

# PART K — BLOCK PERSISTENCE, SYNC, AND RESTORE

## Step 26: Local persistence

Update block serialization for:

- origin;
- focus mode;
- optional domain;
- balanced policy;
- block fingerprint;
- source assessment/snapshot/check-up identity.

Requirements:

- V1 old blocks remain readable;
- malformed V2 origin/focus fails closed;
- balanced cannot gain a fake focus domain;
- same block ID/different fingerprint is conflict;
- no read-time block creation.

## Step 27: Backend sync

Use existing block JSON architecture if sufficient.

Do not add a database migration unless necessary.

Preserve:

- V2 origin;
- V2 source fingerprints;
- focus union;
- balanced policy;
- block fingerprint.

Do not populate V1 weakest-domain fields for balanced V2 blocks.

Do not sync source documents/media.

## Step 28: Restore

Restore:

- parses V1 blocks unchanged;
- parses V2 domain blocks;
- parses V2 balanced blocks;
- validates origin/focus/fingerprint;
- preserves accepted local block on conflict;
- never rebuilds block from assessment during restore;
- never converts balanced to domain;
- never recalculates focus.

## Step 29: One-active-block policy

Existing one-active-block rules remain authoritative.

A V2 block cannot coexist as a second active block behind current UI.

Conflict must be explicit.

# PART L — RESULTS AND PLAN-READY UX

## Step 30: Add a plan-readiness view model

The Movement Profile result view model should include:

```ts
type MovementProfileV2PlanState =
  | {
      status: 'ready';
      blockId: string;
      action: 'created' | 'reused';
      focusMode: 'domain' | 'balanced';
      focusLabel: string;
      ctaLabel: string;
    }
  | {
      status:
        | 'active_block_conflict'
        | 'plan_unavailable'
        | 'sync_pending_local_ready';
      recovery: ...;
    };
```

The view model must not create the block.

## Step 31: Plan-ready copy

When ready:

```text
Your 4-week plan is ready
Pearl prepared it from your Movement Profile.
```

Domain detail may say:

```text
The plan gives extra attention to balance while still training strength and mobility.
```

Balanced detail:

```text
Your plan gives strength, balance, and mobility equal attention across each week.
```

CTA:

```text
View my 4-week plan
```

or:

```text
Continue to my plan
```

Choose one and centralise it.

## Step 32: Forbidden CTA guardrail

Add a V2 UI guardrail that fails if production V2 plan-ready copy includes:

- Build my plan;
- Create my plan;
- Generate my plan;
- Personalise my plan.

Do not globally ban those words in audit documents.

## Step 33: Plan creation state

Do not show a persistent plan-building spinner as though the user initiated generation.

A brief automatic materialisation state may say:

```text
Preparing your 4-week plan
```

only while the local automatic process is running.

If local creation is synchronous/fast, skip this screen.

## Step 34: Plan intro/navigation

When the user taps the plan-ready CTA:

- open the existing compatible block-intro flow or Plan;
- do not create another block;
- do not start Session A automatically;
- show focus mode truthfully.

Domain:

```text
Suggested focus: Balance
```

Balanced:

```text
Plan focus: Balanced
```

Avoid `weakest`.

# PART M — PLAN, TODAY, AND PROGRESS

## Step 35: Plan view model

Support:

### V2 domain block

- existing domain focus presentation;
- V2 origin/source type where needed internally;
- no Movement Age.

### V2 balanced block

- label `Balanced`;
- A/B/C template primary domains;
- weekly equal-attention explanation;
- no fake focus domain.

## Step 36: Today

Today must plan from the current V2 block through the existing Stage 5 scheduler.

For balanced block, Today should know the due template’s primary domain.

Example internal display:

```text
Balanced plan · Strength session
```

Do not imply the block itself became Strength-focused.

## Step 37: Progress

Progress may show:

- current block focus mode;
- completed schedule credits;
- current week;
- latest Movement Profile.

Do not add improvement/decline claims.

Do not compare V1 and V2 interpretations.

# PART N — BASELINE RETAKE AND CONFLICT BEHAVIOR

## Step 38: Active block conflict UX

If a different active block already exists:

- preserve it;
- do not create a second block;
- show the Movement Profile;
- explain:

```text
Your current plan is unchanged.
You can still view this Movement Profile in Progress.
```

Do not offer a hidden replacement.

## Step 39: Same assessment repeat

If the same V2 assessment is materialised again:

- reuse the same block;
- show the ready plan;
- no duplicate sync/upsert;
- no changed start date.

# PART O — NO OFFICIAL RETEST/REPORT YET

## Step 40: Preserve stage boundary

Do not add:

- public official V2 retest scheduling;
- official V2 retest transition;
- V2 block report;
- next V2 block after retest;
- interpreted change claims.

Pure source types may remain compatible with future official retest work.

# PART P — OBSERVABILITY AND PRIVACY

## Step 41: Stable diagnostics

Use bounded codes such as:

- `v2_block_physical_validation_blocked`;
- `v2_block_assessment_ineligible`;
- `v2_block_created`;
- `v2_block_reused`;
- `v2_block_active_conflict`;
- `v2_block_immutable_conflict`;
- `v2_block_sync_pending`;
- `v2_balanced_template_primary_mismatch`;
- `v2_block_start_snapshot_stale`.

Include only:

- block ID/fingerprint;
- assessment/snapshot/check-up IDs;
- focus mode;
- template ID;
- primary domain;
- policy versions/fingerprints;
- reason code.

Exclude:

- frames/landmarks/video;
- source documents;
- free-text health notes;
- full profile;
- auth data;
- provider secrets.

Pure helpers do not log.

# PART Q — REQUIRED TEST MATRIX

## A. Physical validation gate

- report absent -> blocked/no mutation;
- report failed -> blocked/no mutation;
- unresolved P0/P1 -> blocked/no mutation;
- passed report -> implementation path;
- accepted P2/P3 recorded.

## B. Block origin/focus parser

- legacy V1;
- V2 domain;
- V2 balanced;
- malformed origin;
- malformed focus;
- balanced with fake domain;
- domain without domain;
- future policy.

## C. V2 block eligibility

- valid strength;
- valid balance;
- valid mobility;
- valid balanced;
- needs-retake;
- source mismatch;
- V1 artifact;
- active block conflict;
- same existing block;
- immutable conflict;
- chair raw-only allowed;
- missing reference details allowed.

## D. Stable ID/fingerprint

- same assessment;
- different assessment;
- changed focus provenance;
- changed balanced policy;
- explicit start date;
- no ambient clock;
- JSON round-trip.

## E. Domain block factory

- strength;
- balance;
- mobility;
- existing templates;
- V1 behavior unchanged.

## F. Balanced templates

- exactly A/B/C;
- A strength primary;
- B balance primary;
- C mobility primary;
- deterministic source-template composition;
- no hidden optional exercise;
- policy fingerprint;
- no fake block focus domain.

## G. Balanced generation

- session A;
- session B;
- session C;
- equipment filtering;
- capability filtering;
- daily discomfort;
- no-primary -> supporting/non-credit;
- source metadata;
- start validation.

## H. Focus-stimulus evidence

- domain block unchanged;
- balanced A strength credit;
- balanced B balance credit;
- balanced C mobility credit;
- wrong-domain primary non-credit;
- supporting-only non-credit;
- fallback-only non-credit;
- missing primary-domain metadata non-credit.

## I. Schedule credit

- balanced A/B/C one week;
- one per date;
- correct next template;
- four weeks;
- 12 credits;
- same-day retry;
- restart;
- no supporting credit.

## J. Progression

- eligible primary exercise;
- supporting exercise behavior unchanged;
- schedule credit required;
- one event per ladder;
- no balanced fake progression state;
- policy caps remain.

## K. Automatic materialisation

- assessment creates block automatically;
- same callback reuses;
- remote sync failure keeps local;
- active block conflict;
- immutable conflict;
- results still available on plan failure.

## L. Persistence/sync/restore

- V1 old block;
- V2 domain block;
- V2 balanced block;
- local round-trip;
- remote round-trip;
- conflict;
- no read-time creation;
- no balanced-to-domain conversion.

## M. Results UI

- plan-ready domain;
- plan-ready balanced;
- created/reused;
- CTA;
- forbidden Build/Create/Generate copy absent;
- active-block conflict;
- accessibility.

## N. Plan/Today/Progress

- V2 domain;
- V2 balanced;
- due primary domain;
- no weakest copy;
- no Movement Age;
- no trend claims.

## O. End-to-end baseline

```text
live/frozen V2 artifacts
-> automatic block
-> results plan-ready
-> plan intro
-> Session A plan
```

Both domain and balanced cases.

## P. Four-week balanced lifecycle

Use production helpers:

```text
balanced block
-> 12 valid A/B/C schedule credits
-> 4 strength-primary
-> 4 balance-primary
-> 4 mobility-primary
-> training-complete waiting-retest
```

Do not create the official V2 retest/report in this stage.

## Q. Containment

- no public V2 rollout;
- no official V2 retest UI;
- no V2 report;
- no Warden transform;
- no improvement claims;
- V1 unchanged.

## R. Regression

- Stage 3D-B.2A through 2E-A.1;
- Stage 2A.1;
- V1 scoring/focus/block;
- Stage 4 closure;
- Stage 5H;
- safety and V2 audio;
- navigation;
- TypeScript boundaries.

## Test-quality requirements

Tests must:

- use real parsed V2 snapshots/assessments;
- use production block factory/materialiser;
- use production generator/planner/credit/scheduler;
- use deterministic dates/IDs;
- assert no hidden fallback;
- assert automatic creation;
- assert no duplicate block;
- assert balanced primary-domain honesty;
- assert no manual build CTA.

Tests must not:

- mock every layer;
- assert only helper calls;
- use camera hardware;
- use network;
- install packages;
- embed Warden data;
- change focus policy;
- weaken Stage 5 credit rules;
- depend on wall-clock sleeps.

# PART R — VALIDATION COMMANDS

Run targeted tests for:

- V2 block origin/focus;
- V2 eligibility/factory;
- balanced templates/generation;
- focus-stimulus evidence;
- schedule credit;
- progression;
- block persistence/sync/restore;
- automatic materialisation;
- Movement Profile plan-ready UI;
- Plan/Today/Progress;
- Stage 5H;
- Stage 4 closure.

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
rm -rf /tmp/pearl-stage3db2d2c-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d2c-export
rc=$?
rm -rf /tmp/pearl-stage3db2d2c-export
exit $rc
```

Do not install dependencies.

Record:

- physical validation report and gate;
- targeted suite/test counts;
- full suite/test counts;
- audio verification:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART S — MANUAL SOFTWARE TRACE

Retrace:

## Domain

```text
frozen V2 balance assessment
-> V2 block eligibility
-> stable balance block
-> automatic local save
-> results: plan ready
-> View my 4-week plan
-> balance Session A planning
```

## Balanced

```text
frozen balanced assessment
-> stable balanced block
-> balanced A/B/C policy
-> automatic local save
-> results: balanced plan ready
-> balanced-A strength-primary session
```

## Idempotency

```text
same materialisation callback twice
-> one block
```

## Conflict

```text
different active block
-> preserve it
-> no second block
```

## Restore

```text
V2 balanced block
-> serialize/sync
-> restore
-> same focus mode/templates/fingerprint
```

## Containment

Confirm:

- no Build my plan;
- no V2 report;
- no official V2 retest route;
- no public rollout;
- no Warden transform;
- no improvement claims.

# PART T — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Physical-device validation report/gate.
3. Accepted residual device caveats.
4. Product automatic-plan decision.
5. Initial Git status.
6. Existing block architecture.
7. Concrete-focus assumption inventory.
8. V2 block origin contract.
9. Block focus union.
10. Version/fingerprint policy.
11. V2 block eligibility.
12. Stable block identity.
13. Domain block factory.
14. Balanced template policy.
15. Exact balanced source-template compositions.
16. Balanced generation behavior.
17. Planned primary-domain contract.
18. Main-plan/focus-stimulus credit behavior.
19. Schedule/progression behavior.
20. Automatic materialisation.
21. Local persistence.
22. Backend sync/restore.
23. Active-block conflict behavior.
24. Movement Profile plan-ready UX.
25. CTA decision and copy guardrail.
26. Plan-intro behavior.
27. Plan/Today/Progress behavior.
28. V1 containment.
29. No official retest/report/public boundary.
30. Payload/diagnostic safety.
31. Files changed.
32. Tests added/changed.
33. Exact targeted validation.
34. Exact full validation.
35. Audio verification.
36. App/website typechecks.
37. Expo config/export.
38. Stage 3D-B/4/5 regression verification.
39. Remaining V2 lifecycle work.
40. Initial and final Git status.
41. Complete files-changed inventory.
42. Concurrent external changes.
43. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2D.2C:

1. Physical-device gate was explicitly passed before mutation.
2. V1 remains public/default.
3. V2 remains internal.
4. One V2 block origin contract exists.
5. V1 origin remains readable.
6. One explicit block focus union exists.
7. Balanced is not a MovementDomain.
8. V2 assessment focus is never recomputed.
9. Domain assessment creates matching domain block.
10. Balanced assessment creates genuine balanced block.
11. Balanced block has no fake focus domain.
12. Balanced A is strength-primary.
13. Balanced B is balance-primary.
14. Balanced C is mobility-primary.
15. Each four-week balanced block schedules four primary sessions per domain.
16. One authoritative planned primary domain exists per session.
17. Domain block credit remains unchanged.
18. Balanced credit requires current template primary work.
19. Supporting/fallback/wrong-domain balanced work is non-credit.
20. Schedule credit remains honest.
21. Progression remains exercise-local and schedule-credit-gated.
22. Equipment/capability/daily-context/release/safety/progression gates remain.
23. One stable block ID exists per V2 assessment.
24. Same assessment callback is idempotent.
25. Same-ID/different-fingerprint conflict cannot overwrite.
26. Another active block is preserved.
27. Plan is created automatically.
28. User does not manually build/create/generate the plan.
29. Results show that the 4-week plan is ready.
30. CTA is View/Continue to plan.
31. CTA does not create a second block.
32. CTA does not auto-start a session.
33. Local block survives remote sync failure.
34. Domain and balanced blocks round-trip locally/remotely.
35. Restore never converts balanced to domain.
36. No V1 weakest-domain field is populated for balanced V2 block.
37. No V2 official retest UI is added.
38. No V2 report is added.
39. No Warden transform is embedded.
40. No improvement/decline claim is added.
41. Stage 4 remains complete.
42. Stage 5 remains green.
43. Safety audio remains 44/88.
44. V2 audio remains 31/62.
45. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2D.2C complete unless:

1. Physical-device validation gate passes.

2. V2 block origin/focus contracts are strict.

3. V2 domain block creation works.

4. Genuine balanced block creation works.

5. Balanced A/B/C primary-domain policy is explicit and tested.

6. Main-plan credit is honest for balanced sessions.

7. Stage 5 scheduling/progression remains intact.

8. Automatic block materialisation is idempotent.

9. Active-block conflict is safe.

10. Persistence/sync/restore work.

11. Movement Profile shows plan-ready state.

12. No Build/Create/Generate plan CTA remains.

13. V1 remains unchanged.

14. No official V2 retest/report/public rollout is introduced.

15. Targeted tests pass.

16. Full Jest passes.

17. `npm run verify:audio` passes.

18. App typecheck passes.

19. Website typecheck passes.

20. Expo config passes.

21. Expo export passes.

22. `git diff --check` passes.

23. No new warning is introduced without explanation.

24. No unrelated user work is reverted or overwritten.

25. No package install or lockfile change occurs.

26. No source PDF/workbook is committed.

27. No staging, commit, branch, or push occurs.

Do not mark the stage complete if:

- balanced mode is implemented as a fake domain;
- balanced mode secretly selects Strength;
- the user still has to tap `Build my plan`;
- a CTA creates the block rather than only navigating;
- same callback creates duplicate blocks;
- balanced sessions can earn credit from the wrong primary domain;
- physical-device validation has not passed.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2D.2C COMPLETE`
- `STAGE 3D-B.2D.2C BLOCKED`

Also state exactly one:

- `PHYSICAL DEVICE VALIDATION GATE PASSED`
- `PHYSICAL DEVICE VALIDATION GATE BLOCKED`

Also state one for each:

- `V2 AUTOMATIC PLAN CREATION IMPLEMENTED`
- `V2 AUTOMATIC PLAN CREATION BLOCKED`

- `V2 DOMAIN BLOCK INTEGRATION IMPLEMENTED`
- `V2 DOMAIN BLOCK INTEGRATION BLOCKED`

- `V2 BALANCED BLOCK INTEGRATION IMPLEMENTED`
- `V2 BALANCED BLOCK INTEGRATION BLOCKED`

- `V2 PLAN READY UX IMPLEMENTED`
- `V2 PLAN READY UX BLOCKED`

Also state:

- `PLAN CREATION IS AUTOMATIC`
- `NO BUILD MY PLAN ACTION`
- `USER EXPLICITLY STARTS TRAINING SESSIONS`
- `MOVEMENT PROFILE V2 INTERNAL ONLY`
- `V1 PUBLIC DEFAULT UNCHANGED`
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY`
- `NO OFFICIAL V2 RETEST UI`
- `NO V2 REPORT`
- `NO PUBLIC V2 ROLLOUT`
- `NO IMPROVEMENT OR DECLINE CLAIMS`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `V2 FULL LIFECYCLE VERIFICATION REQUIRED`
- `OVERALL BETA RELEASE STILL BLOCKED`

Do not declare Pearl beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Physical-device validation report and gate verdict.
- Whether production code changed.
- V2 block origin architecture.
- Block focus union.
- Stable V2 block ID/fingerprint.
- Domain block factory behavior.
- Balanced A/B/C policy.
- Exact balanced source templates.
- Planned primary-domain behavior.
- Balanced main-plan credit behavior.
- Schedule/progression result.
- Automatic materialisation behavior.
- Idempotency/conflict behavior.
- Local persistence result.
- Backend sync/restore result.
- Results plan-ready behavior.
- Exact CTA wording.
- Confirmation that no Build/Create/Generate plan action remains.
- Plan/Today/Progress behavior.
- V1 containment.
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
- Confirmation that Stage 3D-B.2A through 2E-A.1, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, safety audio, and V2 audio remain green.
- Remaining V2 lifecycle work.
- `STAGE 3D-B.2D.2C COMPLETE` or blocked.
- Physical-device gate verdict.
- Automatic-plan verdict.
- Domain-block verdict.
- Balanced-block verdict.
- Plan-ready UX verdict.
- `PLAN CREATION IS AUTOMATIC`.
- `NO BUILD MY PLAN ACTION`.
- `USER EXPLICITLY STARTS TRAINING SESSIONS`.
- `MOVEMENT PROFILE V2 INTERNAL ONLY`.
- `V1 PUBLIC DEFAULT UNCHANGED`.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `NO OFFICIAL V2 RETEST UI`.
- `NO V2 REPORT`.
- `NO PUBLIC V2 ROLLOUT`.
- `V2 FULL LIFECYCLE VERIFICATION REQUIRED`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
