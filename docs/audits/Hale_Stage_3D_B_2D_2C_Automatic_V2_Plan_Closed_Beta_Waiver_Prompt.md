You are implementing Stage 3D-B.2D.2C of Hale’s production-readiness work:

AUTOMATIC MOVEMENT PROFILE V2 PLAN CREATION, V2 MOVEMENTBLOCK ORIGIN CONTRACT, DOMAIN-FOCUSED BLOCK INTEGRATION, GENUINE BALANCED-BLOCK TEMPLATES, AND STAGE 5 LIFECYCLE WIRING — UNDER AN EXPLICIT CLOSED-BETA DEVICE-VALIDATION WAIVER

## Product-owner decision and truthfulness requirement

The product owner has explicitly decided to proceed with this implementation before physical-device validation.

This is an accepted risk for an invite-only closed beta.

Do not claim or imply that physical-device validation passed.

Record the decision exactly as:

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA
DEVICE BEHAVIOUR NOT YET VERIFIED
BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT
PUBLIC RELEASE REMAINS BLOCKED
```

Do not invent a retrospective QA report, fake device results, or mark a device-validation gate as passed.

This waiver permits Stage 3D-B.2D.2C software implementation only.

It does not permit:

- public V2 rollout;
- medical/accuracy claims;
- improvement/decline claims;
- disabling fail-closed measurement behavior;
- bypassing malformed or incomplete evidence;
- describing Hale as physically validated;
- describing Hale as beta-ready for broad distribution.

## Central product rule

The plan is created automatically.

The user does not manually ask Hale to build, create, generate, or personalise the plan.

The intended flow is:

```text
Movement Check-Up completes
-> snapshot and assessment freeze
-> Hale automatically creates or reuses the 4-week block locally
-> Movement Profile is shown
-> user taps "View my 4-week plan"
-> user explicitly starts a training session later
```

Do not add any action labelled:

```text
Build my plan
Create my plan
Generate my plan
Personalise my plan
```

The CTA should navigate to an already-prepared plan. It must not be the trigger that creates the block.

## Stage relationship

This stage follows:

- Stage 3D-B.2A: internal V2 assessment protocols/controllers;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshots, persistence, sync, and restore;
- Stage 3D-B.2D.1: V2 domain evidence, suggested focus, balanced fallback, and assessment contract;
- Stage 3D-B.2D.2A: V2 assessment persistence and artifact orchestration;
- Stage 3D-B.2D.2B: internal V2 Check-Up, reference details, results/detail UI, and Progress surface;
- Stage 3D-B.2E-A: live V2 pose integration and diagnostics;
- Stage 3D-B.2E-A.1: complete live snapshot -> assessment -> Movement Profile chain, V2 voice parity, JSON-safe no-measurement, and recovery;
- Stage 4 remediation: complete;
- Stage 5 remediation: complete and software-ready for controlled beta.

This stage integrates frozen V2 assessment artifacts with Hale’s verified Stage 5 training lifecycle.

## Current verified software baseline

### V2 artifact authority

A valid internal V2 flow can now produce:

```text
live V2 Check-Up
-> complete raw V2 Check-Up
-> immutable V2 snapshot
-> immutable V2 assessment
-> Movement Profile V2 view model
```

The frozen V2 assessment contains exactly one focus outcome:

```text
domain:
  strength_power
  balance_stability
  mobility_flexibility

balanced:
  balanced_insufficient_reference
```

`balanced` is not a `MovementDomain`.

The focus decision is historical frozen truth. Do not recalculate it from live profile data, current life goal, current source tables, current block, or current UI state.

### Reference posture

- Chair remains raw-only while the Warden transform is disabled.
- Balance Hale task bands may drive Hale-band focus.
- Shoulder below-IQR may drive published-reference focus.
- Raw-only evidence never masquerades as a reference deficit.
- No Movement Age output is reintroduced.

### Artifact persistence

- V2 snapshots and assessments are source-bound.
- Same-ID/different-fingerprint artifacts are immutable conflicts.
- Restore parses and never recomputes.
- V1 and V2 artifacts remain separate.

### V2 voice/audio baseline

Current verified matrices:

```text
safety:
  44 cues
  88 assets

movementProfileV2:
  31 cues
  62 assets

total:
  150 assets
```

Do not regenerate these assets in this task unless a genuinely new plan-intro cue is required and already approved.

### Stage 5 lifecycle baseline

Reuse the current verified contracts for:

- current-planner authority;
- fail-closed generation;
- honest work evidence;
- primary-focus stimulus evidence;
- schedule credit;
- deterministic A/B/C scheduling;
- four sequential weeks;
- 12 credited main-plan sessions;
- daily readiness/discomfort policy;
- canonical equipment;
- movement-capability gates;
- release-policy snapshots;
- progression-policy snapshots;
- safety-cue snapshots;
- idempotent progression;
- local/backend persistence and restore;
- lapse/restart behavior;
- retest timing.

Do not create a parallel training lifecycle.

## Closed-beta safeguards that must remain

1. V2 remains behind the existing internal/closed-beta compile-time gate.

2. V1 remains the public/default Check-Up.

3. No backend, profile, restore, or user setting may enable V2.

4. A measurement needing retake cannot create a block.

5. A malformed, mismatched, unsupported, or future V2 artifact cannot create a block.

6. A different existing active block cannot be silently replaced.

7. Local plan creation must survive remote sync failure.

8. Plan-generation errors must fail closed and leave the Movement Profile available.

9. Existing diagnostics/Sentry-safe breadcrumbs should record bounded plan-materialisation failures without raw pose data or health text.

10. Public release remains blocked until later physical-device validation and full lifecycle verification.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5G.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md

Also inspect:

- AGENTS.md;
- CLAUDE.md;
- current MovementBlock types/builders;
- current block local persistence;
- current block backend sync/restore;
- current dynamic A/B/C templates;
- current scheduler;
- current main-plan and focus-stimulus evidence;
- current progression evidence;
- current Plan/Today/Progress view models;
- Movement Profile V2 results screen;
- internal V2 flow/materialisation service;
- current one-active-block policy;
- current feature-gate conventions.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2D.2C must:

1. Record the explicit device-validation waiver honestly in the report.

2. Add a separate V2 block-origin contract.

3. Add a first-class block-focus union supporting:
   - domain;
   - balanced.

4. Keep `balanced` out of `MovementDomain`.

5. Add deterministic V2 block eligibility.

6. Add stable V2 block ID and block fingerprinting.

7. Create a pure V2 block factory from a persisted frozen V2 assessment.

8. Add idempotent immutable block materialisation.

9. Automatically materialise the V2 block after snapshot/assessment creation.

10. Persist locally before showing the completed Movement Profile flow as plan-ready.

11. Preserve a locally created block when remote sync fails.

12. Integrate domain-focused V2 blocks with existing Stage 5 generation.

13. Add genuine balanced A/B/C templates with explicit primary domains.

14. Update planned-primary-domain, focus-stimulus, main-plan-credit, schedule-credit, and progression consumers for balanced blocks.

15. Preserve all existing equipment, movement-capability, daily-context, release, progression, and safety gates.

16. Persist/sync/restore V2 origin and balanced metadata.

17. Update Movement Profile results to state that the plan is already ready.

18. Use a navigation CTA such as:
   - `View my 4-week plan`;
   - or `Continue to my plan`.

19. Ensure the CTA only navigates; it must not create a block.

20. Add V2 domain/balanced support to Plan, Today, and Progress.

21. Keep official V2 retest/report/next-block/public rollout out of scope.

22. Add full domain and balanced lifecycle software tests.

23. Preserve all earlier regressions.

## Scope boundary

This task may change:

- MovementBlock types/versioning;
- V2 block-origin types;
- block-focus union;
- V2 block eligibility/factory/parser;
- block local persistence;
- block backend sync/restore;
- dynamic template selection;
- balanced template definitions;
- focus-stimulus evidence;
- main-plan/session metadata;
- planned-primary-domain handling;
- block/session view models;
- automatic materialisation application service;
- Movement Profile plan-ready UI;
- block intro/Plan/Today/Progress handling;
- focused tests;
- the Stage 3D-B.2D.2C report.

This task must not change:

- V1 scoring/norm/focus behavior;
- V2 measurement protocols;
- V2 reference tables/transforms;
- Warden chair-transform status;
- frozen V2 assessment focus rules;
- life-goal mappings;
- live pose algorithms;
- audio assets unless a truly new approved cue is unavoidable;
- official V2 retest UI;
- V2 block reports;
- public V2 rollout;
- longitudinal improvement/decline policy;
- exercise catalogue IDs;
- optional-level visibility;
- dependencies;
- lockfiles;
- unrelated images/fonts.

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

Rules:

1. Treat every existing change as user-owned.

2. Inspect current diffs before touching a file.

3. Do not revert, overwrite, broadly reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not regenerate unrelated audio.

9. Do not stage, commit, create a branch, or push.

10. Do not inspect or expose `.env` values or provider credentials.

11. Do not modify or share font files.

## Baseline validation

Before edits, run a targeted slice covering:

- V2 snapshot/assessment/persistence;
- V2 internal results/materialisation flow;
- V1 block creation;
- block schedule;
- session planning;
- focus-stimulus evidence;
- main-plan classification;
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
rm -rf /tmp/hale-stage3db2d2c-waiver-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2c-waiver-export
rc=$?
rm -rf /tmp/hale-stage3db2d2c-waiver-export
exit $rc
```

Record current counts and warnings.

# PART B — RECONSTRUCT CURRENT BLOCK ARCHITECTURE

## Step 1: Trace the current MovementBlock contract

Inspect at minimum:

- src/adherence/types.ts
- src/adherence/blockService.ts
- src/adherence/adherenceService.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/blockSchedule.ts
- src/haleFlow/focusStimulusEvidence.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/progressionEvidence.ts
- src/haleFlow/appLifecycle.ts
- src/haleFlow/planViewModel.ts
- src/haleFlow/progressViewModel.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- block/session/training-state sync and restore services
- App.tsx
- block intro/Plan/Today screens
- all relevant tests.

Document:

- block identity;
- block focus authority;
- template identity;
- scheduler assumptions;
- focus-stimulus assumptions;
- main-plan-credit assumptions;
- one-active-block behavior;
- persistence/sync shape;
- every consumer that assumes a concrete focus domain.

## Step 2: Inventory concrete-focus assumptions

Search for:

- `focusDomain`;
- `weakestDomain`;
- template prefix derivation;
- block focus used as primary-domain authority;
- view-model copy requiring one domain;
- block serialization requiring one domain;
- progression/main-plan credit matching the block focus.

Create:

| Consumer | Existing assumption | Domain-block policy | Balanced-block policy |
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

- old blocks missing origin normalize to V1;
- V2 origin is strict and source-bound;
- V1 cannot masquerade as V2;
- source IDs/fingerprints round-trip;
- no live reference/profile data;
- no pose/media payload.

## Step 4: Add an explicit block-focus union

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
- old V1 blocks normalize from current `focusDomain`;
- domain mode requires a valid domain;
- balanced mode carries no fake domain;
- impossible combinations fail closed;
- no hidden strength fallback.

If backward compatibility requires retaining `focusDomain`:

- legacy/domain blocks may keep it;
- balanced blocks must leave it absent/null according to current type conventions;
- new code must treat the focus union as authority.

## Step 5: Version and fingerprint policy

Add explicit constants for:

- V2 block schema/policy;
- balanced template policy;
- automatic materialisation policy.

Add deterministic fingerprints covering material policy.

Exclude:

- clock;
- environment;
- device;
- completion counters;
- mutable progress.

# PART D — V2 BLOCK ELIGIBILITY

## Step 6: Add pure V2 block eligibility

Conceptually:

```ts
getMovementProfileV2BlockCreationEligibility({
  checkUp,
  snapshot,
  assessment,
  existingBlocks,
})
```

Eligible only when:

- V2 Check-Up is official and source-bound;
- snapshot is valid and source-bound;
- assessment is valid and source-bound;
- assessment focus is `domain` or `balanced`;
- assessment is not `needs_retake`;
- no unsupported/future policy;
- no conflicting expected block;
- no different active block.

Missing exact age/reference sex is allowed.

Chair transform disabled is allowed.

The device-validation waiver is not a runtime eligibility field. Record it in the report and release posture; do not pretend it is passed in the block.

Ineligible:

- V1 artifact;
- malformed/future artifact;
- source mismatch;
- needs-retake;
- manual/quick/micro/legacy Check-Up;
- active-block conflict;
- immutable expected-block conflict.

Return stable reasons.

## Step 7: Existing block policy

### Identical expected block exists

Reuse it.

### Same expected block ID, different fingerprint

Immutable conflict.

Preserve accepted block.

### Different active block exists

Preserve it and return:

```text
active_block_conflict
```

Do not archive, complete, replace, or rewrite the existing active block.

### No active block

Create automatically.

# PART E — STABLE V2 BLOCK CONTRACT

## Step 8: Stable V2 block ID

Use one stable ID per V2 assessment.

Conceptual format:

```text
movement-block-v2:<encoded-assessment-id>
```

Requirements:

- no random UUID;
- no ambient clock;
- same assessment -> same block ID;
- different assessment -> different ID;
- no focus mode in identity;
- URI-safe.

## Step 9: Block fingerprint

Fingerprint material fields:

- block schema;
- block ID;
- V2 origin;
- focus union;
- explicit start date;
- duration/week/session policy;
- template policy;
- source assessment identity;
- relevant planning-policy snapshots.

Do not include mutable completion counters.

## Step 10: V2 block fields

Freeze at minimum:

- block ID/fingerprint;
- origin;
- focus;
- explicit start date;
- four-week policy;
- three-templates-per-week policy;
- template IDs;
- balanced-template metadata when relevant;
- creation-policy version/fingerprint;
- existing lifecycle/status fields.

Do not duplicate the entire assessment object.

# PART F — PURE V2 BLOCK FACTORY

## Step 11: Add a pure factory

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
- no live profile read;
- no reference-engine/focus recomputation;
- deterministic;
- strict parser round-trip;
- no V1 MovementAssessment creation.

## Step 12: Domain-focused behavior

Map exactly:

```text
strength_power -> domain-focused Strength block
balance_stability -> domain-focused Balance block
mobility_flexibility -> domain-focused Mobility block
```

Reuse current domain training semantics.

Preserve:

- current template content;
- equipment/capability gates;
- daily context;
- safety cues;
- release caps;
- movement-specific progression;
- focus-stimulus evidence;
- schedule credit.

Do not create a second domain generator.

# PART G — GENUINE BALANCED BLOCK

## Step 13: Add a canonical balanced template policy

Required mapping:

```text
balanced-A -> strength_power primary
balanced-B -> balance_stability primary
balanced-C -> mobility_flexibility primary
```

Conceptually:

```ts
type BalancedTemplateDefinition = {
  templateId: 'balanced-A' | 'balanced-B' | 'balanced-C';
  primaryDomain: MovementDomain;
  sourceTemplateId: string;
  sourceTemplateFingerprint: string;
};
```

Requirements:

- deterministic A/B/C order;
- explicit primary domain;
- no display-name parsing;
- no array-index inference;
- no hidden block focus domain;
- all three domains exactly once per weekly cycle;
- policy fingerprint.

## Step 14: Choose explicit existing source templates

Audit current safe Strength, Balance, and Mobility templates.

Choose one explicit current source template composition for each balanced template.

Requirements:

- exact template IDs documented;
- source-template content is current controlled-beta safe content;
- no new exercise IDs;
- no hidden optional levels;
- no broad copy/paste of mutable labels;
- supporting slots remain honest;
- source-template fingerprints or policy snapshots allow stale detection.

Do not silently choose the first template in an array.

## Step 15: Balanced generation behavior

A balanced block uses:

```text
A -> strength primary
B -> balance primary
C -> mobility primary
```

Every week repeats the same primary-domain schedule.

The generated plan must stamp:

- V2 block origin;
- balanced block focus;
- balanced template ID;
- template primary domain;
- source template;
- balanced policy version/fingerprint;
- all existing equipment/capability/daily-context/release/progression/safety snapshots.

## Step 16: No-safe-primary behavior

If a balanced template cannot provide a safe playable primary exercise for its required primary domain:

- return the existing typed supporting/unavailable path;
- do not silently change the primary domain;
- do not grant main-plan credit;
- do not advance the scheduler;
- do not rewrite the balanced policy;
- preserve calm recovery copy.

# PART H — PLANNED PRIMARY DOMAIN AND CREDIT

## Step 17: Add authoritative planned primary domain

Every current block-generated plan must carry:

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
plannedPrimaryDomain = current balanced template primaryDomain
```

Persist it in plan/session metadata.

Start-time validation must confirm it matches:

- block focus mode;
- template ID;
- balanced policy;
- generated primary exercise metadata.

## Step 18: Update focus-stimulus evidence

Stage 5B focus evidence must consume `plannedPrimaryDomain`.

Domain-block behavior must remain semantically unchanged.

For balanced blocks:

- completed primary work must match the current balanced template’s primary domain;
- supporting work in another domain cannot substitute;
- fallback-only, skipped, malformed, missing, or wrong-domain evidence is non-credit;
- no fake block-level focus domain.

## Step 19: Main-plan and schedule credit

A balanced session earns credit only when all existing Stage 5 rules pass, including:

- current block-generated source;
- exact block/template/planned-date identity;
- valid completed work;
- completed primary exercise;
- intended domain matches `plannedPrimaryDomain`;
- no duplicate/malformed/unmatched evidence;
- schedule-credit rules pass.

A/B/C schedule credit remains one per date.

## Step 20: Progression

Progression remains:

- exercise-local;
- ladder-local;
- schedule-credit-gated;
- idempotent.

Balanced mode must not:

- create a fake balanced ladder;
- progress all three domains from one session;
- treat supporting work as primary;
- bypass movement-specific progression ceilings.

# PART I — SESSION PLANNING AND START VALIDATION

## Step 21: Extend the current planner

`planTodayHaleSession` must support:

- legacy/current V1 domain block;
- V2 domain block;
- V2 balanced block.

It must preserve the Stage 5C no-legacy-fallback contract.

Balanced plans must carry:

- template primary domain;
- V2 block origin;
- balanced policy;
- equipment snapshot;
- capability snapshot;
- release-policy snapshot;
- progression-policy snapshot;
- safety-cue snapshot;
- daily context;
- schedule metadata.

## Step 22: Start-time validation

Before player launch, validate:

- block origin;
- focus mode;
- template identity;
- planned primary domain;
- balanced policy snapshot;
- source-template identity;
- existing equipment/capability/release/progression/safety snapshots.

Missing/stale/inconsistent metadata routes to typed recovery.

Do not repair silently.

# PART J — AUTOMATIC BLOCK MATERIALISATION

## Step 23: Add a pure block materialiser

Conceptually:

```ts
type MovementProfileV2BlockMaterialisationResult =
  | {
      status: 'ready';
      block: MovementBlock;
      action: 'created' | 'reused';
      diagnostics: readonly Diagnostic[];
    }
  | {
      status:
        | 'assessment_ineligible'
        | 'active_block_conflict'
        | 'immutable_conflict'
        | 'unsupported_policy';
      diagnostics: readonly Diagnostic[];
    };
```

The materialiser:

- validates artifacts;
- creates/reuses;
- has no persistence;
- has no sync;
- uses explicit start date;
- uses no ambient clock;
- never replaces another active block;
- never recalculates focus.

## Step 24: Add the application service

After successful V2 snapshot/assessment materialisation:

1. Automatically call the V2 block materialiser.
2. Persist a newly created block locally.
3. Reuse an identical block.
4. Attempt existing backend block sync.
5. Preserve the local block if sync fails.
6. Return plan-readiness state to the Movement Profile results flow.
7. Do not wait for a user CTA to create the block.

Repeated callbacks must remain idempotent.

## Step 25: Local ordering

Preferred order:

```text
save raw Check-Up
-> save snapshot/assessment
-> materialise V2 block
-> save block locally
-> show Movement Profile with plan-ready state
-> sync in background
```

If block creation fails:

- raw Check-Up/snapshot/assessment remain valid;
- Movement Profile still opens;
- plan section shows typed recovery;
- no artifact is lost.

# PART K — PERSISTENCE, SYNC, AND RESTORE

## Step 26: Local block serialization

Preserve:

- origin;
- focus union;
- optional concrete domain;
- balanced policy;
- block fingerprint;
- assessment/snapshot/check-up identity.

Requirements:

- old V1 blocks remain readable;
- malformed V2 origin/focus fails closed;
- balanced cannot acquire a fake domain;
- same-ID/different-fingerprint conflict is immutable;
- no read-time block creation.

## Step 27: Backend sync

Use current JSON architecture where possible.

Preserve:

- V2 origin;
- source fingerprints;
- focus union;
- balanced policy;
- block fingerprint.

Do not populate a V1 weakest-domain field for balanced V2 blocks.

Do not sync source documents, pose data, or media.

## Step 28: Restore

Restore must:

- parse V1 unchanged;
- parse V2 domain blocks;
- parse V2 balanced blocks;
- validate origin/focus/fingerprint;
- preserve accepted local block on conflict;
- never rebuild from assessment during restore;
- never convert balanced to domain;
- never recompute focus.

## Step 29: One-active-block policy

Existing one-active-block policy remains authoritative.

Do not permit a hidden second active V2 block.

# PART L — RESULTS PLAN-READY UX

## Step 30: Add plan-readiness view model

Conceptually:

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
      recovery: RecoveryViewModel;
    };
```

The view model must not create the block.

## Step 31: Ready copy

Use:

```text
Your 4-week plan is ready
Hale prepared it from your Movement Profile.
```

Domain supporting text:

```text
The plan gives extra attention to balance while still training strength and mobility.
```

Balanced supporting text:

```text
Your plan gives strength, balance, and mobility equal attention across each week.
```

Canonical CTA recommendation:

```text
View my 4-week plan
```

Centralise it.

## Step 32: Forbidden CTA guardrail

Add focused V2 copy guardrails that fail when plan-ready production copy contains:

- Build my plan;
- Create my plan;
- Generate my plan;
- Personalise my plan.

Do not globally ban these words in docs/tests.

## Step 33: CTA behavior

The CTA:

- navigates to the already-created block intro or Plan;
- does not create/upsert the block;
- does not change the start date;
- does not start Session A;
- remains idempotent.

## Step 34: Automatic preparation state

A brief automatic state may say:

```text
Preparing your 4-week plan
```

only while local automatic materialisation is occurring.

Do not frame it as a user-requested generation action.

Skip the state if creation is synchronous and fast.

# PART M — BLOCK INTRO, PLAN, TODAY, AND PROGRESS

## Step 35: Block intro

Support:

### V2 domain

```text
Suggested focus: Balance
```

### V2 balanced

```text
Plan focus: Balanced
```

Do not show:

- weakest;
- Movement Age;
- scientific certainty.

## Step 36: Plan

For balanced blocks, show:

- `Balanced`;
- equal attention across strength, balance, and mobility;
- A/B/C primary-domain labels where useful;
- no fake focus domain.

## Step 37: Today

Today plans through the existing Stage 5 scheduler.

For a balanced block, it may display:

```text
Balanced plan · Strength session
```

when balanced-A is due.

Do not imply the whole block became Strength-focused.

## Step 38: Progress

Progress may show:

- current block focus mode;
- current week;
- schedule credits;
- latest Movement Profile.

Do not add:

- improvement/decline;
- V1/V2 comparison;
- focus-change interpretation.

# PART N — ACTIVE BLOCK CONFLICT

## Step 39: Conflict UX

When a different active block exists:

- preserve it;
- do not create a second block;
- show the Movement Profile;
- show calm copy:

```text
Your current plan is unchanged.
You can still view this Movement Profile in Progress.
```

Do not offer a silent replacement.

## Step 40: Same assessment replay

Repeated materialisation of the same V2 assessment:

- reuses the same block;
- retains the original start date;
- produces no duplicate local/remote rows;
- shows plan ready.

# PART O — BETA WAIVER AND OBSERVABILITY

## Step 41: Do not create a fake device-validation field

Do not store `deviceValidationPassed: true`.

Do not label the block as physically validated.

The waiver belongs in:

- this stage report;
- safe release/diagnostic posture;
- future beta operations.

If a bounded software metadata field is genuinely needed, use truthful language such as:

```text
validationPosture: 'closed_beta_device_validation_deferred'
```

Only add this if it has a real consumer and does not expand schema unnecessarily.

## Step 42: Safe diagnostics

Use bounded codes such as:

- `v2_block_created`;
- `v2_block_reused`;
- `v2_block_active_conflict`;
- `v2_block_immutable_conflict`;
- `v2_block_sync_pending`;
- `v2_balanced_primary_mismatch`;
- `v2_block_start_snapshot_stale`.

Include only:

- block/assessment/snapshot/check-up IDs;
- focus mode;
- template ID;
- planned primary domain;
- policy versions/fingerprints;
- reason code.

Exclude:

- pose frames/landmarks/video;
- source documents;
- free-text health notes;
- full profile;
- auth data;
- provider secrets.

# PART P — NO OFFICIAL RETEST/REPORT/PUBLIC ROLLOUT

## Step 43: Preserve boundaries

Do not add:

- official V2 retest scheduling UI;
- V2 re-test transition;
- V2 block report;
- V2 next-block-after-retest flow;
- public V2 onboarding;
- public V2 feature enablement;
- improvement/decline claims.

The pure contracts may remain compatible with future official-retest work.

# PART Q — REQUIRED TEST MATRIX

## A. Waiver/report truthfulness

- report states physical validation not performed;
- report states waiver;
- no `gate passed` claim;
- no fake QA/device data;
- public release remains blocked.

## B. Origin/focus parser

- legacy V1;
- V2 domain;
- V2 balanced;
- malformed origin;
- malformed focus;
- balanced with fake domain;
- domain without domain;
- future policy.

## C. V2 block eligibility

- strength;
- balance;
- mobility;
- balanced;
- needs-retake;
- source mismatch;
- V1 artifact;
- active block conflict;
- identical existing block;
- immutable conflict;
- raw-only chair allowed;
- missing reference details allowed.

## D. Stable ID/fingerprint

- same assessment;
- different assessment;
- changed source material;
- changed balanced policy;
- explicit start date;
- no ambient clock;
- JSON round-trip.

## E. Domain factory

- strength;
- balance;
- mobility;
- current templates;
- V1 behavior unchanged.

## F. Balanced templates

- exactly A/B/C;
- A strength primary;
- B balance primary;
- C mobility primary;
- explicit source templates;
- deterministic;
- no hidden optional level;
- no fake focus domain.

## G. Balanced generation

- A;
- B;
- C;
- equipment filtering;
- capability filtering;
- discomfort/readiness;
- no-safe-primary -> supporting/non-credit;
- metadata/start validation.

## H. Focus-stimulus/main-plan credit

- domain behavior unchanged;
- balanced-A strength credit;
- balanced-B balance credit;
- balanced-C mobility credit;
- wrong-domain primary non-credit;
- supporting-only non-credit;
- fallback-only non-credit;
- missing planned-primary metadata non-credit.

## I. Schedule credit

- balanced A/B/C one week;
- one credit per date;
- correct next template;
- four weeks;
- 12 credits;
- same-day retry;
- no supporting credit.

## J. Progression

- eligible primary exercise;
- schedule credit required;
- one event per ladder;
- no fake balanced progression;
- existing policy caps preserved.

## K. Automatic materialisation

- assessment automatically creates block;
- no user action needed;
- repeated callback reuses;
- remote sync failure keeps local;
- active block conflict;
- immutable conflict;
- results remain available when plan unavailable.

## L. Persistence/sync/restore

- V1 old block;
- V2 domain;
- V2 balanced;
- local round-trip;
- remote round-trip;
- conflict;
- no read-time creation;
- no balanced-to-domain conversion.

## M. Results UI

- plan-ready domain;
- plan-ready balanced;
- created/reused;
- exact CTA;
- forbidden CTA absent;
- CTA navigation only;
- active-block conflict;
- accessibility.

## N. Plan/Today/Progress

- V2 domain;
- V2 balanced;
- due primary domain;
- no weakest copy;
- no Movement Age;
- no trend claims.

## O. End-to-end domain

```text
frozen V2 domain assessment
-> automatic block
-> results plan ready
-> View my 4-week plan
-> Session A planning
```

## P. End-to-end balanced

```text
frozen balanced assessment
-> automatic balanced block
-> balanced-A strength-primary session
```

## Q. Four-week balanced lifecycle

Using production helpers:

```text
balanced block
-> 12 valid schedule credits
-> 4 strength-primary
-> 4 balance-primary
-> 4 mobility-primary
-> training_complete_waiting_retest
```

Do not implement the retest/report transition here.

## R. Containment

- V1 default unchanged;
- no official V2 retest UI;
- no V2 report;
- no public rollout;
- no Warden transform;
- no improvement claims.

## S. Regression

- Stage 3D-B.2A through 2E-A.1;
- Stage 2A.1;
- V1 scoring/focus/block;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- V2 audio;
- navigation;
- TypeScript boundaries.

## Test-quality requirements

Tests must:

- use real parsed V2 snapshots/assessments;
- use production factory/materialiser;
- use production generator/planner/credit/scheduler;
- use deterministic dates/IDs;
- assert no hidden fallback;
- assert automatic creation;
- assert no duplicate block;
- assert balanced primary-domain honesty;
- assert CTA does not create the plan;
- assert report does not claim device validation passed.

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
- main-plan/schedule credit;
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
rm -rf /tmp/hale-stage3db2d2c-waiver-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2c-waiver-export
rc=$?
rm -rf /tmp/hale-stage3db2d2c-waiver-export
exit $rc
```

Do not install dependencies.

Record:

- targeted suite/test counts;
- full suite/test counts;
- audio verification:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- `git diff --check`;
- warnings;
- whether validation changed files.

# PART S — MANUAL SOFTWARE TRACE

Retrace:

## Domain

```text
frozen V2 balance assessment
-> V2 block eligibility
-> stable balance block
-> automatic local save
-> Movement Profile plan-ready state
-> View my 4-week plan
-> balance Session A planning
```

## Balanced

```text
frozen balanced assessment
-> stable balanced block
-> balanced A/B/C policy
-> automatic local save
-> plan-ready UI
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
-> same focus/templates/fingerprint
```

## Containment

Confirm:

- no Build my plan;
- no V2 report;
- no official V2 retest route;
- no public rollout;
- no Warden transform;
- no improvement claims;
- no physical-validation pass claim.

# PART T — CLOSED-BETA DEVICE-VALIDATION HANDOFF

Do not perform physical-device validation in this task.

The report must define the closed-beta validation posture:

- beta testers are the first device-validation cohort;
- invite-only distribution;
- V2 remains gated;
- structured device model/OS/build collection;
- Sentry and safe diagnostics review;
- tester reports for:
  - Check-Up completion;
  - chair counts;
  - balance timing/rest/retry;
  - shoulder side/tracking;
  - voice;
  - artifact chain;
  - automatic plan creation;
  - first-session start;
- P0/P1 issues stop further invitations until fixed;
- public rollout remains blocked.

Do not claim that tester validation has occurred.

# PART U — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product-owner device-validation waiver.
3. Explicit statement that device validation was not performed.
4. Closed-beta-only risk posture.
5. Initial Git status.
6. Existing block architecture.
7. Concrete-focus assumption inventory.
8. V2 block origin.
9. Block focus union.
10. Version/fingerprint policy.
11. V2 block eligibility.
12. Stable block identity.
13. Domain block factory.
14. Balanced template policy.
15. Exact balanced source-template compositions.
16. Balanced generation.
17. Planned primary domain.
18. Main-plan/focus-stimulus credit.
19. Schedule/progression behavior.
20. Automatic materialisation.
21. Local persistence.
22. Backend sync/restore.
23. Active-block conflict.
24. Movement Profile plan-ready UX.
25. Exact CTA and forbidden-copy guardrail.
26. Block intro/Plan/Today/Progress.
27. V1 containment.
28. No official retest/report/public boundary.
29. Observability/privacy.
30. Closed-beta device-validation handoff.
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

1. The report truthfully states device validation was not performed.
2. The report records the product-owner closed-beta waiver.
3. No device-validation pass is claimed.
4. V1 remains public/default.
5. V2 remains internal/closed-beta gated.
6. One strict V2 block origin exists.
7. One explicit block-focus union exists.
8. Balanced is not a MovementDomain.
9. Frozen V2 focus is never recomputed.
10. Domain assessment creates matching domain block.
11. Balanced assessment creates a genuine balanced block.
12. Balanced block has no fake focus domain.
13. Balanced A is strength-primary.
14. Balanced B is balance-primary.
15. Balanced C is mobility-primary.
16. Four weeks contain four primary sessions per domain.
17. One authoritative planned primary domain exists per session.
18. Domain-block credit remains unchanged.
19. Balanced credit requires correct current-template primary work.
20. Wrong-domain/supporting/fallback work remains non-credit.
21. Schedule credit remains honest.
22. Progression remains exercise-local and schedule-credit-gated.
23. Equipment/capability/daily-context/release/safety/progression gates remain.
24. One stable block ID exists per V2 assessment.
25. Repeated materialisation is idempotent.
26. Same-ID/different-fingerprint conflict cannot overwrite.
27. Another active block is preserved.
28. Plan creation is automatic.
29. User does not manually build/create/generate the plan.
30. Results show that the plan is ready.
31. CTA only navigates.
32. CTA does not start a session.
33. Local plan survives remote sync failure.
34. Domain and balanced blocks round-trip.
35. Restore never converts balanced to domain.
36. No V1 weakest-domain field is populated for balanced V2.
37. No official V2 retest UI is added.
38. No V2 report is added.
39. No Warden transform is embedded.
40. No improvement/decline claim is added.
41. Stage 4 remains complete.
42. Stage 5 remains green.
43. Safety audio remains 44/88.
44. V2 audio remains 31/62.
45. Public release remains blocked.
46. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2D.2C complete unless:

1. The device-validation waiver is recorded honestly.

2. No fake validation evidence is created.

3. V2 block origin/focus contracts are strict.

4. V2 domain block creation works.

5. Genuine balanced block creation works.

6. Balanced A/B/C primary-domain policy is explicit and tested.

7. Main-plan credit is honest for balanced sessions.

8. Stage 5 scheduling/progression remains intact.

9. Automatic block materialisation is idempotent.

10. Active-block conflict is safe.

11. Persistence/sync/restore work.

12. Movement Profile shows plan-ready state.

13. No Build/Create/Generate plan CTA remains.

14. V1 remains unchanged.

15. No official V2 retest/report/public rollout is introduced.

16. Targeted tests pass.

17. Full Jest passes.

18. `npm run verify:audio` passes.

19. App typecheck passes.

20. Website typecheck passes.

21. Expo config passes.

22. Expo export passes.

23. `git diff --check` passes.

24. No new warning is introduced without explanation.

25. No unrelated user work is reverted or overwritten.

26. No package install or lockfile change occurs.

27. No source PDF/workbook is committed.

28. No staging, commit, branch, or push occurs.

Do not mark the stage complete if:

- balanced mode is a fake domain;
- balanced secretly selects Strength;
- the user still taps `Build my plan`;
- a CTA creates the block;
- repeated callbacks create duplicate blocks;
- balanced sessions earn credit from the wrong primary domain;
- the report claims physical-device validation passed;
- V2 becomes public/default.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2D.2C COMPLETE`
- `STAGE 3D-B.2D.2C BLOCKED`

Also state exactly:

- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`
- `PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA`
- `DEVICE BEHAVIOUR NOT YET VERIFIED`
- `BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT`
- `PUBLIC RELEASE REMAINS BLOCKED`

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
- `MOVEMENT PROFILE V2 INTERNAL/CLOSED-BETA ONLY`
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

Do not declare Hale broadly beta-ready or physically validated.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Device-validation waiver statement.
- Confirmation that no device-validation pass was claimed.
- Whether production code changed.
- V2 block-origin architecture.
- Block-focus union.
- Stable V2 block ID/fingerprint.
- Domain-block factory behavior.
- Balanced A/B/C policy.
- Exact balanced source templates.
- Planned-primary-domain behavior.
- Balanced main-plan-credit behavior.
- Schedule/progression result.
- Automatic materialisation behavior.
- Idempotency/conflict behavior.
- Local persistence.
- Backend sync/restore.
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
- Automatic-plan verdict.
- Domain-block verdict.
- Balanced-block verdict.
- Plan-ready UX verdict.
- `PLAN CREATION IS AUTOMATIC`.
- `NO BUILD MY PLAN ACTION`.
- `USER EXPLICITLY STARTS TRAINING SESSIONS`.
- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`.
- `PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA`.
- `DEVICE BEHAVIOUR NOT YET VERIFIED`.
- `BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- `MOVEMENT PROFILE V2 INTERNAL/CLOSED-BETA ONLY`.
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
