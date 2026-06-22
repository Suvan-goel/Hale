You are implementing Stage 4C-R of Hale’s production-readiness work:

MOVEMENT-CAPABILITY SCREENING, FLOOR-TRANSFER SAFETY, STEP-UP ENVIRONMENT CONFIRMATION, SINGLE-LEG BALANCE CONFIDENCE, AND EXPLORE/MANUAL SAFETY PARITY

“Stage 4C-R” means the first remediation batch arising from the post-Stage-5 Stage 4 Remaining-Findings Verification.

This is a focused production-code remediation task.

Do not begin Stage 4D-R band/stop-rule cue remediation, Stage 4E-R optional-level policy, Stage 4F-R movement-specific progression review, Stage 3D-B, physical-device validation, store-release work, or unrelated UI/product work in this task.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md

Also read the relevant upstream safety contracts:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 4C-R

Stage 4R re-inventoried the current catalogue:

- 37 registered exercises.
- 11 ladders.
- 37 ladder levels.
- 30 V1 core levels.
- 7 V1 optional levels.
- 8 linear-progression ladders.
- 2 supporting-set ladders.
- 1 collection ladder.
- 0 dangling definitions.
- 0 dangling ladder levels.

Stage 4R confirmed that Stage 4A/4B and Stage 5 closed most structural generator risks.

Current verified strengths include:

- one shared equipment/safety gate for generated sessions, Explore, and manual practice;
- explicit `floor_space`, stair, support, band, mini-band, door-anchor, and load capabilities;
- canonical profile equipment authority;
- no legacy equipment override;
- explicit primary/supporting/fallback/skipped stimulus semantics;
- no primary-focus credit for supporting/fallback-only sessions;
- centralized daily readiness/discomfort policy for generated main-plan sessions;
- authoritative and idempotent progression;
- current-planner authority;
- controlled four-week scheduling;
- broad Stage 5H lifecycle/property coverage.

Stage 5 is complete and dynamic workout generation is software-ready for controlled beta.

However, Stage 4R found that the exercise catalogue remains software/content-blocked for beta.

## Findings addressed by Stage 4C-R

### F4R-001 — P1

`floor_space` proves there is room on the floor. It does not prove that the user is comfortable and able to get down to and up from the floor.

Current core floor exercises include:

- `glute-bridge-hold`;
- `glute-bridge-reps`.

Optional floor work includes:

- `push-up-standard`;
- any other floor level discovered in the current registry.

A user can currently have `floor_space` and still lack a safe floor-transfer capability.

### F4R-002 — P1

`step-up` currently requires stairs plus support, but that does not fully establish a safe home setup.

The app does not currently prove all of:

- low, stable step or bottom stair;
- dry and uncluttered stepping area;
- fixed/sturdy nearby support;
- phone positioned outside the stepping path;
- sufficient lighting;
- suitable footwear or bare-foot surface suitability;
- user comfort with the setup.

The phone camera cannot infer these conditions reliably.

### F4R-006 — P2

`balance-single-leg-hold` can become reachable through generic ladder progression, but there is no explicit user-confidence/capability gate beyond equipment support and progression history.

### F4R-007 — P2

Explore/manual practice is equipment-gated and non-credit, but it does not consistently consume and enforce the same daily readiness/discomfort policy as generated main-plan sessions.

A user may be able to start manual practice for a movement pattern that the main plan would have blocked today.

## Findings explicitly deferred

This task must not attempt to close:

### F4R-003

Band and door-anchor safety cueing.

This belongs to Stage 4D-R.

### F4R-004

Catalogue-wide spoken/text stop-rule and cue standard.

This belongs to Stage 4D-R.

### F4R-005

External-load selection and load-specific stop rules.

Loaded optional levels remain hidden/gated under existing policy.

### F4R-008

Movement-specific progression prerequisites beyond the capability gates in this task.

This belongs to Stage 4F-R/domain review.

### F4R-009

Mobility collection labels/rotation polish.

### F4R-010

Final minimal-equipment product-positioning copy.

Do not broaden Stage 4C-R into all remaining catalogue work.

## Approved Stage 4C-R product policy

The following policy is locked for this task.

### 1. Environmental equipment and movement capability are different

Do not overload canonical equipment tokens with physical capability.

Examples:

- `floor_space` means usable floor area exists.
- It does not mean the user is comfortable getting down/up.
- `stairs` means a step/stair exists.
- It does not mean the step environment is appropriate for training.
- `wall` or `chair` means support equipment exists.
- It does not mean a support is fixed/sturdy enough for step-up.
- Generic progression to single-leg balance does not prove the user is comfortable attempting it.

Create one narrow movement-capability layer in the safety/profile domain.

### 2. Explicit status, not permissive booleans

Use explicit status values so missing old data fails closed.

Conceptually:

```ts
type CapabilityConfirmationStatus =
  | 'confirmed'
  | 'avoid_for_now'
  | 'not_confirmed';

type MovementCapabilityProfile = {
  schemaVersion: number;

  floorTransfer: {
    status: CapabilityConfirmationStatus;
  };

  stepUpEnvironment: {
    status: CapabilityConfirmationStatus;
    lowStableStep: boolean;
    fixedSupport: boolean;
    clearDryArea: boolean;
    phoneOutOfPath: boolean;
  };

  singleLegBalance: {
    status:
      | 'confirmed_with_support'
      | 'supported_balance_only'
      | 'not_confirmed';
  };

  revision?: number;
  updatedAt?: string;
};
```

Adapt to the actual codebase.

Requirements:

- JSON-safe.
- Typed.
- Stable enum values.
- Missing legacy fields become `not_confirmed`.
- No field defaults to confirmed.
- No free-text safety data is used by planning.
- Profile sync/restore preserves the structure.
- Do not create multiple competing capability types.

### 3. Floor-transfer policy

A floor exercise is eligible only when all are true:

- canonical equipment includes `floor_space`;
- `floorTransfer.status === 'confirmed'`;
- Stage 5E daily discomfort/readiness permits the exercise;
- exercise release status permits it;
- all existing Stage 4/5 gates pass.

Approved user-facing confirmation:

**Question**

> Are you comfortable getting down to and up from the floor?

**Supporting copy**

> You can use a sturdy chair or support if you need it. Choose “Not right now” if you are unsure.

Options:

- `Yes, I’m comfortable`
- `Not right now`

Do not use medical-clearance language.

If not confirmed:

- core bridge exercises are unavailable;
- optional standard floor push-up remains unavailable;
- Explore/manual practice cannot bypass the gate;
- generated planning uses a same-domain safe alternative where current logic supports one;
- otherwise the slot is skipped/supporting under existing Stage 4B/5B semantics.

Do not infer floor-transfer capability from:

- floor space;
- age;
- prior completion;
- camera visibility;
- exercise interest;
- legacy state.

### 4. Step-up environment policy

`step-up` is eligible only when all are true:

- canonical equipment includes `stairs`;
- the existing support/equipment gate passes;
- `stepUpEnvironment.status === 'confirmed'`;
- every required setup field is true:
  - `lowStableStep`;
  - `fixedSupport`;
  - `clearDryArea`;
  - `phoneOutOfPath`;
- Stage 5E daily discomfort/readiness permits step-up;
- current release/progression policy permits it.

Approved setup confirmation:

> I have a low, stable step or bottom stair, a fixed support nearby, a clear dry area, and I can place my phone outside the stepping path.

Use a compact checklist if the existing design supports it:

- Low, stable step or bottom stair.
- Fixed rail or sturdy counter/support nearby.
- Clear, dry stepping area.
- Phone can be placed outside the stepping path.

Do not treat an unstable chair as automatically equivalent to a fixed step-up support.

If existing equipment vocabulary cannot distinguish fixed support:

- add a narrow step-up capability field;
- do not broaden generic support semantics for all exercises.

Lighting and footwear are session-time setup reminders and belong in Stage 4D-R’s cue pack, but the Stage 4C-R confirmation must not imply the app verified them.

If the environment is not confirmed:

- generated planning must not select step-up;
- Explore/manual must not start step-up;
- use existing safer lower-body alternatives such as sit-to-stand when appropriate;
- do not silently reclassify another exercise as step-up stimulus.

### 5. Single-leg balance confidence policy

`balance-single-leg-hold` is eligible only when all are true:

- current support/equipment gate passes;
- `singleLegBalance.status === 'confirmed_with_support'`;
- current ladder/progression logic makes the level reachable;
- Stage 5E daily context permits single-leg balance;
- current release policy permits it.

Approved confirmation:

**Question**

> Are you comfortable trying a brief one-leg balance hold with sturdy support within reach?

Options:

- `Yes, with support nearby`
- `Keep me on supported two-foot balance for now`

If not confirmed:

- keep the user on eligible supported feet-together/tandem work;
- do not permanently regress ladder state merely because capability is not confirmed;
- do not show single-leg practice as startable in Explore/manual;
- do not relabel marching/lateral work as equivalent static single-leg progression.

This is a conservative capability gate, not a medical assessment.

### 6. Canonical profile authority

Store the movement-capability profile alongside the existing safety/profile state.

The current explicit local/remote profile-resolution architecture remains authoritative.

Requirements:

- local user update writes the canonical profile;
- backend profile sync preserves it in existing profile/safety JSON where possible;
- training state does not override it;
- legacy training state cannot confirm a capability;
- missing remote/current fields fail closed;
- no database migration unless existing JSON cannot safely preserve the fields.

Do not add movement capability to the equipment capability array.

### 7. Revision and stale-plan behavior

A generated current plan must preserve the movement-capability snapshot/fingerprint used at planning time.

Conceptually:

```ts
type PlannedMovementCapabilitySnapshot = {
  schemaVersion: number;
  floorTransferStatus: CapabilityConfirmationStatus;
  stepUpEnvironmentConfirmed: boolean;
  singleLegBalanceStatus: SingleLegBalanceStatus;
  fingerprint: string;
  sourceRevision?: number;
  sourceUpdatedAt?: string;
};
```

Requirements:

- deterministic.
- JSON-safe.
- stable field order.
- no sensitive free text.
- immutable on the plan.
- survives local summary/serialization.
- survives compact remote metadata where the plan is persisted.
- changing capability after plan generation invalidates the unstarted plan.
- running session remains immutable.
- historical session snapshots are not rewritten.

Extend the Stage 5F start-time stale-plan validator rather than creating a conflicting second launch architecture.

### 8. Existing plans missing capability snapshots

For newly generated current plans:

- missing movement-capability snapshot fails closed at start.

For historical plans:

- remain readable;
- do not become current startable plans merely by inferring capability;
- use Stage 5C recovery/refresh behavior.

Do not rewrite historical plans on read.

### 9. Explore/manual daily-context parity

All production routes that start:

- manual ladder practice;
- Explore movement practice;
- Explore presets/extra sessions;
- optional practice;

must use an explicit daily readiness/discomfort context before the player starts.

Reuse the existing Stage 5E daily-context type and normalizer.

Do not create a second pain/readiness model.

The user must explicitly select or confirm today’s context.

Do not silently default a manual/Explore start to fully ready/no discomfort.

If the current UI already has a start-session menu/readiness sheet:

- reuse it.

If not:

- add the smallest narrow interstitial using existing components and tone.

### 10. Manual practice safety policy

Manual practice remains:

- non-main-plan;
- non-schedule-credit;
- progression-ineligible under current Stage 5D policy.

Before manual practice starts:

- canonical equipment must be confirmed;
- movement-capability gates must pass;
- daily context must be explicit and valid;
- Stage 5E movement-pattern discomfort policy must permit the requested exercise;
- readiness policy must not make the requested exercise unsafe;
- release/optional policy must permit the level.

If the requested level is blocked:

- do not silently start it;
- do not infer that the user accepts the risk because they selected it;
- return a typed unavailable/adjustment state;
- optionally suggest a lower eligible level in the same ladder;
- require the user to confirm any changed level before start;
- do not automatically switch to an unrelated ladder/domain.

### 11. Explore preset safety policy

Explore preset sessions must:

- use canonical equipment;
- use canonical movement capabilities;
- consume explicit daily readiness/discomfort;
- use the same Stage 5E movement-pattern exclusions;
- preserve Stage 4B stimulus semantics;
- remain non-main-plan/non-progression unless already explicitly defined otherwise.

If the preset has no safe useful exercise:

- return Stage 5C typed recovery/unavailable;
- do not launch an empty player;
- do not bypass daily context.

### 12. Deep-link/direct-call fail-closed behavior

Tests and direct internal callers may bypass UI.

Therefore production planning helpers themselves must enforce:

- capability confirmation;
- daily context presence/validity;
- discomfort exclusions;
- equipment constraints.

Do not rely only on a screen having asked a question.

Missing daily context for manual/Explore current starts should return:

- `daily_context_required`;
- or the nearest existing typed recovery reason.

Missing capability should return a stable typed reason.

### 13. Safety precedence

For generated, Explore, and manual session starts, preserve this order:

1. Source/session type.
2. Catalogue/release validity.
3. Canonical equipment.
4. Movement capabilities.
5. Daily discomfort exclusions.
6. Readiness/autoregulation.
7. Optional/short adjustments.
8. Stimulus role.
9. Credit/progression policy.

No later layer may reintroduce an exercise excluded by an earlier layer.

### 14. Main-plan credit and progression remain unchanged

Stage 4C-R must not change:

- Stage 5A work evidence;
- Stage 5B primary-focus credit;
- Stage 5G schedule credit;
- Stage 5D progression authority;
- Stage 5E `normal`/`hold_only`/`ineligible` policy.

Expected effects:

- a safely regressed generated primary exercise may still earn main-plan credit;
- a capability-blocked primary slot may produce supporting/non-credit planning;
- manual/Explore remains non-credit and progression-ineligible;
- capability selection itself does not mutate ladder state.

### 15. Optional levels remain conservative

Do not enable currently optional high-risk levels in Stage 4C-R.

Preserve or strengthen current hidden/gated status for:

- `loaded-sit-to-stand`;
- `squat-loaded`;
- `chair-supported-split-squat`;
- `push-up-standard`;
- `mini-band-lateral-walk`;
- `neck-rotation`;
- any other current V1 optional level.

Floor capability confirmation does not automatically make optional standard push-up a core level.

Stage 4E-R will decide optional-level beta visibility.

### 16. User-facing tone

Use Hale’s established tone:

- calm;
- mature;
- non-medical;
- non-shaming;
- clear;
- conservative.

Avoid:

- “risk score”;
- “frailty”;
- “fall risk”;
- “medical clearance”;
- “failed”;
- “unsafe person”;
- “lost progress.”

Suitable recovery copy:

- “This movement isn’t included with your current setup.”
- “Review your movement setup before starting this practice.”
- “Choose a supported option today.”
- “Your plan and progress are unchanged.”

## Primary objective

Implement one canonical movement-capability and non-main safety boundary so that:

1. `floor_space` cannot unlock floor work without confirmed floor-transfer comfort.

2. `stairs + support` cannot unlock step-up without confirmed safe step environment.

3. Single-leg balance cannot unlock without explicit supported-balance confidence.

4. Capability state is canonical, persisted, restored, and fail-closed.

5. New plans preserve a capability snapshot/fingerprint.

6. Stale unstarted plans fail closed after capability changes.

7. Explore/manual/preset starts require explicit daily readiness/discomfort.

8. Explore/manual use the centralized Stage 5E discomfort policy.

9. Direct planning calls cannot bypass the UI gates.

10. Manual/Explore remain non-credit and progression-ineligible.

11. Existing Stage 4A–5H contracts remain intact.

12. F4R-001, F4R-002, F4R-006, and F4R-007 are closed or explicitly statused.

## Scope boundary

This task may change:

- safety/profile capability types;
- profile serialization and sync;
- onboarding/settings/safety-profile controls for these capabilities;
- capability normalization/fingerprint;
- plan metadata;
- start-time stale-plan validation;
- equipment/safety eligibility adapter;
- session planning;
- Explore view models/start flow;
- manual practice planning/start flow;
- narrow recovery copy;
- tests;
- the Stage 4C-R remediation report.

This task must not change:

- band/anchor cue content;
- catalogue-wide stop-rule system;
- loaded exercise guidance;
- movement-specific progression thresholds;
- exercise registry count unless a defect makes a level unreachable and hiding is required;
- scoring;
- norms;
- Check-Up measurement;
- exact/near focus;
- four-week schedule;
- progression thresholds;
- broad navigation/UI design;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the remediation report.

Rules:

1. Treat all current modified/untracked files as user-owned.

2. Inspect current diffs in every file Stage 4C-R may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior audit/remediation reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only if task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct all current capability and non-main start paths

Before editing, inspect at minimum:

- App.tsx
- src/profile/types.ts
- src/profile/serialize.ts
- src/profile/equipment.ts
- src/profile/index.ts
- src/screens/SafetyProfileScreen.tsx
- src/screens/SettingsScreen.tsx
- src/screens/OnboardingEquipmentScreen.tsx
- src/screens/ExploreScreen.tsx
- src/screens/ExploreDetailScreens.tsx
- src/haleFlow/exploreViewModel.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/types.ts
- src/training/equipmentSafety.ts
- src/training/dailyTrainingContext.ts
- src/training/workoutGeneration.ts
- src/exercises/ladders.ts
- src/exercises/types.ts
- src/services/backend/profileSyncService.ts
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/restoreService.ts
- every relevant test.

Search for:

- `floor_space`;
- `floor`;
- `step-up`;
- `stairs`;
- `counter`;
- `support`;
- `single-leg`;
- `PlanLadderPracticeSessionInput`;
- `planLadderPracticeSession`;
- Explore preset start;
- daily context;
- readiness;
- discomfort;
- start menu;
- `beginPlannedSession`;
- equipment fingerprint;
- profile/safety serialization.

Document:

- every current capability-like field;
- every writer;
- every reader;
- every manual/Explore start route;
- every direct helper caller;
- current stale-plan validation;
- current local/remote profile shape;
- current default behavior for missing fields.

Do not edit until this trace is complete.

## Step 2: Add the canonical movement-capability profile

Create or harden one canonical type in the profile/safety domain.

Requirements:

- explicit statuses;
- deterministic normalization;
- schema version;
- optional revision/update metadata aligned with current profile sync;
- old profile default = not confirmed;
- no free-text planning input;
- no equipment-token overload;
- no competing duplicate type.

Add a pure normalizer.

Direct tests:

- fully confirmed profile;
- all avoid/not-confirmed;
- partial step checklist;
- missing object;
- malformed object;
- unknown status;
- duplicate/irrelevant fields;
- stable ordering;
- non-mutation;
- legacy profile with no capability fields.

## Step 3: Add profile serialization and sync

Update:

- local profile serialization/deserialization;
- canonical defaults;
- backend profile mapping;
- remote hydration/resolution;
- export if relevant.

Requirements:

- fields round-trip;
- missing remote data defaults not-confirmed;
- malformed remote data fails closed;
- training state cannot confirm capabilities;
- local explicit user update remains authoritative under current profile resolution;
- no database migration unless existing JSON cannot preserve the fields;
- no raw free text.

Tests:

- local round-trip;
- remote round-trip;
- local/remote merge;
- malformed remote;
- old remote profile;
- explicit avoid;
- confirmation update;
- no training-state override.

## Step 4: Add floor-transfer gating

Centralize the rule.

At minimum, verify every current floor exercise.

Required behavior:

- `floor_space` without confirmed transfer -> unavailable;
- confirmed transfer without `floor_space` -> unavailable;
- both -> eligible subject to daily context/release;
- hip/back discomfort still blocks bridge where Stage 5E says so;
- optional standard push-up remains optional/hidden;
- generated main plan uses safe alternative or honest skipped/supporting semantics;
- Explore/manual cannot bypass.

Tests:

- all combinations;
- restore;
- stale plan;
- manual practice;
- Explore detail/start;
- direct helper call.

## Step 5: Add step-up environment gating

Centralize the rule.

Required:

- stairs alone -> unavailable;
- stairs + generic support but no step confirmation -> unavailable;
- partial checklist -> unavailable;
- fully confirmed checklist + canonical equipment -> eligible subject to daily context;
- knee/hip/back/ankle discomfort still blocks step-up;
- safe lower-body alternative remains available where current generator supports it;
- Explore stairs preset and manual step-up respect the same gate.

Do not silently treat a chair as fixed step-up support unless the explicit step environment confirmation says the support is sturdy/fixed for this use.

Tests cover all checklist combinations and direct calls.

## Step 6: Add single-leg balance confidence gating

Required:

- support available but status not confirmed -> single-leg unavailable;
- supported-balance-only -> feet-together/tandem remain eligible, single-leg unavailable;
- confirmed-with-support + ladder eligibility -> single-leg eligible;
- ankle/foot discomfort still blocks;
- malformed/missing capability -> single-leg unavailable;
- Explore/manual respect the gate;
- no persistent ladder mutation from capability denial.

Tests cover generated, Explore, manual, restore, and daily context.

## Step 7: Add movement-capability snapshot/fingerprint

Create pure snapshot/fingerprint helpers.

Tests:

- same profile -> same fingerprint;
- ordering/irrelevant field changes do not alter;
- capability change alters fingerprint;
- missing vs confirmed differs;
- local/remote round-trip;
- historical plan immutable.

Stamp new current generated plans and relevant manual/Explore plans.

Extend start-time validation.

Required recovery reasons:

- `movement_capability_changed`;
- `movement_capability_not_confirmed`;
- `missing_movement_capability_snapshot`;
- or equivalent stable typed codes.

Do not expose these internal codes directly to users.

## Step 8: Add or reuse the daily-context interstitial

Inspect existing session-start UI.

Preferred:

- reuse the existing main-plan readiness/discomfort start menu or component.

Requirements for Explore/manual:

- explicit readiness selection;
- explicit discomfort selection, including “none”;
- current daily-context normalization;
- no default fully-ready/no-discomfort in direct production path;
- cancellation returns without mutation;
- selected context passes into planning helper;
- context is immutable for the started session;
- no main-plan or progression authority.

If an existing daily context is already fresh and explicitly selected for today, reuse may be allowed only if the code can prove:

- same canonical date key;
- explicit user source;
- not malformed;
- not legacy-restored.

Document the freshness rule.

## Step 9: Harden manual practice planning

Extend `PlanLadderPracticeSessionInput` or equivalent.

Require:

- explicit normalized daily context;
- canonical equipment;
- canonical movement capability;
- requested ladder/level identity;
- release eligibility.

Apply:

- Stage 4A equipment gate;
- Stage 4C-R capability gate;
- Stage 5E discomfort policy;
- readiness adjustment only where meaningful;
- current optional-level policy.

When blocked:

- return typed reason;
- do not start player;
- do not silently choose an unrelated exercise;
- a lower same-ladder suggestion may be returned separately;
- require user confirmation before any changed level starts.

Manual remains:

- `countsTowardMainPlan: false`;
- schedule non-credit;
- progression-ineligible.

## Step 10: Harden Explore preset and movement starts

Ensure every Explore start route passes:

- current canonical equipment;
- movement capability;
- explicit daily context.

Tests:

- preset with shoulder discomfort blocks upper-body work;
- hip/back discomfort blocks bridge/hinge;
- ankle/foot discomfort blocks single-leg/step/lateral/calf;
- knee discomfort blocks step/squat under current Stage 5E policy;
- floor/step/single-leg capabilities are enforced;
- no-safe-work returns typed recovery;
- non-credit metadata remains.

Do not change the Explore catalogue content or artwork.

## Step 11: Update Safety/Profile/Settings UI narrowly

Add a compact movement-setup section in the most appropriate existing screen.

Prefer:

- SafetyProfileScreen;
- with a Settings entry/edit path;
- onboarding only if the current flow already collects safety setup and the change is narrow.

Collect:

### Floor

- comfortable getting down/up;
- not right now.

### Step-up

- all required checklist fields.

### Balance

- comfortable trying one-leg hold with support;
- supported two-foot balance only.

Requirements:

- large accessible controls;
- clear plain language;
- no medical claim;
- explicit save;
- canonical profile write;
- no automatic confirmation;
- existing users see unconfirmed and are prompted only when relevant or through Settings.

Do not add a long mandatory onboarding sequence if it would disrupt existing users. It is acceptable to prompt contextually when an affected exercise would first be used.

Document the chosen UX.

## Step 12: Recovery and adjustment copy

Add narrow copy for:

- floor transfer not confirmed;
- step environment not confirmed;
- single-leg confidence not confirmed;
- daily context required;
- requested manual level blocked today;
- same-ladder easier option available.

Examples:

- “Confirm your floor setup before Hale includes floor exercises.”
- “Step-up needs a low stable step and fixed support nearby.”
- “Choose a supported balance option today.”
- “Tell Hale how you’re feeling before starting this practice.”
- “This level isn’t available with today’s setup. A supported option is available.”

Keep copy calm and non-medical.

## Step 13: Persistence and restore

Ensure:

- canonical capability profile round-trips;
- plan snapshots round-trip;
- restored missing capability fails closed;
- restored stale plan cannot start;
- historical completion remains readable;
- no old plan gains capability through inference;
- no training-state override;
- current profile resolves before planning.

Add integration tests with Stage 5F equipment restore.

## Step 14: Backend payload safety

Verify profile/session/training payloads preserve only bounded capability enums/booleans/fingerprints.

Exclude:

- free-text safety notes;
- medical notes;
- symptoms;
- pose/video/landmarks;
- auth data.

No broad backend schema change.

## Step 15: Regression matrix

Prove these remain green:

### Stage 4A

- floor-space equipment gate;
- stairs/support equipment gate;
- balance support;
- band/door anchor.

### Stage 4B

- stimulus roles;
- no-band honesty;
- mobility collection;
- static/dynamic balance.

### Stage 5A/5B

- work/primary-focus credit.

### Stage 5C

- typed unavailable/recovery.

### Stage 5D

- progression authority and idempotency.

### Stage 5E

- daily context and discomfort exclusions.

### Stage 5F

- canonical equipment and stale-plan invalidation.

### Stage 5G/5H

- schedule/lifecycle software readiness.

### Other

- canonical tab order;
- app and website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Capability normalization

- valid/missing/malformed/old profiles.

### B. Floor

- equipment/capability combinations;
- discomfort;
- generated/manual/Explore;
- stale plan;
- restore.

### C. Step-up

- all checklist combinations;
- equipment;
- discomfort;
- generated/manual/Explore;
- direct call.

### D. Balance confidence

- supported-only;
- confirmed single-leg;
- support absent;
- discomfort;
- ladder state;
- Explore/manual.

### E. Daily-context parity

- manual;
- Explore preset;
- direct helper call;
- malformed/missing;
- readiness/discomfort combinations.

### F. Credit/progression

- generated safe primary still creditable;
- capability-blocked supporting remains non-credit;
- manual/Explore remains non-credit/ineligible;
- capability change does not mutate ladder.

### G. Serialization/sync/restore

- profile;
- snapshot;
- stale plan;
- no promotion;
- historical immutability.

### H. UI/copy

- capability controls;
- contextual prompt;
- unavailable/adjustment copy;
- accessibility.

### I. Regression

- Stage 4A/4B;
- Stage 5A–5H;
- Stage 3D;
- navigation;
- typechecks.

## Test-quality requirements

Tests must:

- exercise real production normalizers and planning helpers;
- exercise actual start-time validation;
- exercise actual manual/Explore entrypoints where practical;
- assert selected/excluded exercise ids;
- assert non-credit/progression-ineligible metadata;
- assert local/remote round-trips;
- fail if missing capability defaults permissively;
- fail if manual/Explore bypasses daily context;
- fail if excluded exercise reappears.

Tests must not:

- mock every layer;
- assert only helper invocation;
- enable optional levels;
- add band cueing;
- change progression thresholds;
- install dependencies;
- depend on wall-clock sleeps;
- use network access.

Use deterministic ids, dates, profiles, and contexts.

## Validation commands

Run targeted tests for:

- profile capability normalization/serialization;
- profile sync/restore;
- equipment safety;
- daily training context;
- workout generation;
- session planning;
- Explore view model/start;
- manual practice;
- stale-plan validation;
- progression evidence;
- Stage 5H lifecycle regression.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- snapshots;
- skipped tests;
- app typecheck;
- website typecheck;
- Expo config;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

The Stage 4R/Stage 5H baseline is:

- 95 suites;
- 764 tests.

Verify the current baseline rather than assuming it.

## Manual source verification after tests

Retrace:

### Floor

```text
profile floor_space
+ floorTransfer confirmed
+ daily context
-> floor exercise eligibility
```

Confirm both are required.

### Step-up

```text
stairs/support
+ full step setup confirmation
+ daily context
-> step-up eligibility
```

Confirm no partial checklist passes.

### Single-leg balance

Confirm explicit supported confidence is required.

### Manual/Explore

```text
start
-> explicit daily context
-> equipment
-> movement capability
-> discomfort
-> readiness
-> player or typed recovery
```

Confirm no bypass.

### Stale plan

Confirm changed capability invalidates unstarted plan.

### Restore

Confirm missing/legacy capability remains unconfirmed.

## Remediation report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F4R-001.
   - F4R-002.
   - F4R-006.
   - F4R-007.
4. Findings explicitly deferred.
5. Prior architecture.
6. Movement-capability data model.
7. Normalization/default policy.
8. Profile serialization/sync.
9. Floor-transfer behavior.
10. Step-up environment behavior.
11. Single-leg balance confidence behavior.
12. Capability snapshot/fingerprint.
13. Stale-plan behavior.
14. Explore/manual daily-context parity.
15. Manual-practice behavior.
16. Explore preset behavior.
17. UI/UX collection flow.
18. Recovery/adjustment copy.
19. Local/backend restore.
20. Payload safety.
21. Files changed.
22. Tests added/changed.
23. Exact validation results.
24. Stage 4A/4B and Stage 5 regression verification.
25. F4R-001 status.
26. F4R-002 status.
27. F4R-006 status.
28. F4R-007 status.
29. Remaining Stage 4 findings.
30. Whether Stage 4D-R is unblocked.
31. Whether exercise catalogue remains beta-blocked.
32. Initial and final Git status.
33. Concurrent external changes.
34. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 4C-R:

1. Floor space alone cannot unlock floor work.
2. Floor-transfer confirmation alone cannot unlock floor work without floor space.
3. Missing/legacy floor capability fails closed.
4. Step-up requires stairs, support, and full environment confirmation.
5. Partial step confirmation fails closed.
6. Step-up discomfort gates remain.
7. Single-leg balance requires support and explicit confidence.
8. Supported two-foot balance remains available when single-leg is not confirmed.
9. Capability denial does not mutate persistent ladder state.
10. Canonical capability profile persists/restores.
11. Training state cannot override capability profile.
12. New plans carry capability snapshot/fingerprint.
13. Capability changes invalidate unstarted plans.
14. Running/history sessions remain immutable.
15. Manual practice requires explicit daily context.
16. Explore starts require explicit daily context.
17. Manual/Explore use Stage 5E discomfort policy.
18. Direct helper calls cannot bypass gates.
19. Manual/Explore remain non-credit.
20. Manual/Explore remain progression-ineligible.
21. Optional levels remain hidden/gated.
22. Stage 4A/4B semantics remain.
23. Stage 5A–5H semantics remain.
24. Stage 3D focus remains.
25. App/website typechecks remain.
26. No scoring/norm/Check-Up changes.
27. No medical claims are introduced.
28. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4C-R complete unless:

1. One canonical movement-capability profile exists.

2. Missing old data fails closed.

3. Floor-transfer gating is implemented and tested.

4. Step-up environment gating is implemented and tested.

5. Single-leg confidence gating is implemented and tested.

6. Capability state sync/restore is implemented and tested.

7. Plan snapshots/fingerprints and stale-plan validation are implemented.

8. Explore/manual daily-context parity is enforced in production helpers, not only UI.

9. Direct internal calls fail closed.

10. Main-plan credit/progression contracts remain unchanged.

11. Stage 4A/4B and Stage 5A–5H regressions pass.

12. Targeted tests pass.

13. Full suite passes.

14. App typecheck passes.

15. Website typecheck passes.

16. Expo config passes.

17. `git diff --check` passes.

18. No new warning is introduced without explanation.

19. No unrelated user work is reverted or overwritten.

20. No package install or lockfile change occurs.

21. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4C-R COMPLETE`
- `STAGE 4C-R BLOCKED`

Also state exactly one:

- `STAGE 4D-R UNBLOCKED`
- `STAGE 4D-R BLOCKED`

Use `STAGE 4D-R UNBLOCKED` only if no P0/P1 capability/parity defect remains.

Also state:

- `STAGE 4D-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4C-R must not declare the exercise catalogue ready while F4R-003 and F4R-004 remain open.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Movement-capability model.
- Floor-transfer policy.
- Step-up environment policy.
- Single-leg balance policy.
- Capability persistence/restore.
- Snapshot/fingerprint/stale-plan behavior.
- Explore/manual daily-context behavior.
- Manual-practice blocked/adjusted behavior.
- UI collection flow.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- Confirmation that Stage 4A/4B, Stage 5A–5H, Stage 3D, navigation, and TypeScript-boundary protections remain.
- F4R-001 status.
- F4R-002 status.
- F4R-006 status.
- F4R-007 status.
- Remaining Stage 4 blockers.
- `STAGE 4C-R COMPLETE` or blocked.
- `STAGE 4D-R UNBLOCKED` or blocked.
- `STAGE 4D-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
