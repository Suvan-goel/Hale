You are implementing Stage 4E-R of Pearl’s production-readiness work:

CONTROLLED-BETA OPTIONAL-LEVEL POLICY, ADVANCED-EXERCISE CONTAINMENT, RELEASE-CAP ENFORCEMENT, RESTORE/DEEP-LINK FAIL-CLOSED BEHAVIOR, AND F4R-005 CLOSURE

“Stage 4E-R” is the third remediation batch arising from the post-Stage-5 Stage 4 Remaining-Findings Verification.

This is a focused production-code and product-policy remediation task.

Do not begin Stage 4F-R movement-specific progression/domain review, Stage 4G-R mobility/product-positioning polish, Stage 3D-B, physical-device validation, app-store release work, or unrelated UI/product work in this task.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md

Also read the relevant upstream safety/copy contracts:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 4E-R

Stage 4C-R is complete:

- floor transfer is separate from floor space;
- step-up requires a confirmed environment;
- single-leg balance requires explicit supported confidence;
- Explore/manual starts require explicit daily readiness/discomfort;
- movement-capability snapshots and stale-plan validation exist.

Stage 4D-R and Stage 4D-R.1 are complete and verified:

- one canonical typed safety-cue system exists;
- text and voice share canonical cue definitions;
- every current registered exercise has a safety profile;
- global/setup/active/repeat/recovery cue sequencing is implemented;
- pause/repeat/help/skip/stop controls exist;
- Explore/manual cue parity exists;
- 44 safety cues exist for both Clara and Marcus;
- 88/88 MP3 assets validate;
- 88/88 static Metro mappings exist;
- Expo export passed for iOS and Android;
- `npm run verify:audio` passes;
- full Jest passed at 100 suites / 801 tests;
- app and website typechecks passed.

Stage 5 remains complete and dynamic workout generation remains software-ready for controlled beta.

The exercise catalogue remains software/content-blocked because the optional/advanced beta policy and later Stage 4 progression/content decisions remain unresolved.

## Finding addressed by Stage 4E-R

### F4R-005 — P2

Optional loaded and advanced levels lack a complete controlled-beta exposure policy.

The current catalogue contains 37 levels:

- 30 `v1_core`;
- 7 `v1_optional`.

The current optional levels identified by Stage 4R are:

1. `loaded-sit-to-stand`
2. `squat-slow-eccentric`
3. `squat-loaded`
4. `chair-supported-split-squat`
5. `push-up-standard`
6. `mini-band-lateral-walk`
7. `neck-rotation`

Risks include:

- optional levels becoming reachable through generic progression;
- Explore/manual practice exposing them directly;
- restored or historical progression state pointing above the controlled-beta ceiling;
- stale plans containing optional levels;
- direct helper calls bypassing UI visibility;
- optional levels becoming visible merely because safety cues now exist;
- loaded levels lacking approved load-selection and load-specific stop rules;
- advanced floor, split-squat, mini-band, and neck levels lacking domain-reviewed prerequisites.

Stage 4D-R intentionally added cue profiles to optional levels for future safety, but did not make them beta-approved.

Stage 4E-R must define and enforce the controlled-beta boundary.

## Findings explicitly deferred

This task must not attempt to close:

### F4R-008

Movement-specific progression prerequisites and domain-reviewed advancement criteria.

Stage 4F-R remains required.

### F4R-009

Mobility collection labels and rotation polish.

### F4R-010

Final minimal-equipment positioning and Pearl Movement Kit copy.

Do not broaden Stage 4E-R into all remaining catalogue work.

## Approved controlled-beta product policy

The following policy is locked for this task.

### 1. All seven current `v1_optional` levels are hidden in the controlled beta

The seven current optional levels must not be user-reachable in the controlled-beta production experience.

They must not be:

- selected by generated main-plan sessions;
- selected by short sessions;
- selected by restart sessions;
- selected by supporting sessions;
- selected by Explore presets;
- listed as startable Explore levels;
- selected by manual ladder practice;
- opened through a direct internal route/deep link;
- restored as a startable current plan;
- reached through automatic progression;
- enabled by equipment or movement-capability confirmation alone.

Their definitions remain in the registry for:

- historical readability;
- future domain review;
- development/test scenarios;
- future release channels.

Do not delete them.

### 2. Controlled-beta availability is a first-class typed policy

Do not rely on scattered checks such as:

```ts
releaseStatus !== 'v1_optional'
```

Create or harden one central release policy.

Conceptually:

```ts
type TrainingReleaseChannel =
  | 'controlled_beta'
  | 'internal_development';

type ExerciseLevelAvailability =
  | {
      available: true;
      channel: TrainingReleaseChannel;
      reason: 'v1_core';
    }
  | {
      available: false;
      channel: TrainingReleaseChannel;
      reason:
        | 'optional_hidden_in_controlled_beta'
        | 'future_domain_review_required'
        | 'load_policy_not_approved'
        | 'capability_prerequisite_not_approved'
        | 'unsupported_release_status'
        | 'unknown_level';
    };
```

Adapt to the actual codebase.

Requirements:

- pure;
- deterministic;
- stable reason codes;
- no display-name parsing;
- one source of truth;
- used by generator, progression, Explore, manual practice, start validation, restore, and tests.

### 3. Explicit allowlist, not accidental inheritance

For controlled beta, define the user-reachable level set from explicit `v1_core` status plus current safety/capability rules.

Do not make a level available because:

- it has safety cues;
- equipment exists;
- the user previously completed it;
- restored ladder state points to it;
- a direct caller passes `includeOptionalLevels: true`;
- the app is in a debug build;
- `devMockDataEnabled` is true.

Any internal-development exception must be explicit, non-persisted, and impossible to activate through production UI or restored user state.

### 4. No production user toggle for optional levels

Do not add:

- an “advanced mode” setting;
- a beta-user toggle;
- a hidden multi-tap unlock;
- a remote profile flag;
- a backend field that can enable optional levels;
- a user-facing warning-and-continue bypass.

Stage 4F-R/domain review must occur before any optional level is enabled for beta users.

### 5. Internal-development access is isolated

Existing internal tests/debug scenarios may use optional levels only through an explicit internal channel.

Requirements:

- explicit `releaseChannel: 'internal_development'` or equivalent;
- never inferred from `__DEV__` alone in production planning;
- never persisted to user profile/training state;
- never accepted from backend restore;
- never enabled by deep link;
- unavailable in production UI;
- tests prove controlled-beta callers cannot pass the internal channel accidentally.

If the current architecture does not require internal access, keep optional levels unavailable everywhere except direct catalogue/unit tests.

### 6. Generated-session behavior

Current controlled-beta generation must:

- select only beta-available levels;
- preserve Stage 4A–4D-R safety/cue gates;
- choose the nearest eligible lower core level in the same ladder when authoritative progress points above the beta ceiling;
- never jump to an unrelated ladder/domain to preserve difficulty;
- record a stable adjustment reason such as:
  - `controlled_beta_release_cap`;
- preserve requested/current ladder state separately from the selected beta-safe level;
- avoid mutating stored ladder progress merely because a release cap exists.

If no eligible lower core level exists:

- skip/support honestly using Stage 4B semantics;
- return supporting/non-credit if primary focus is lost;
- or return typed unavailable if no safe useful work remains.

### 7. Progression ceiling

Automatic progression in controlled beta must never advance into an optional level.

For each linear ladder:

- derive the highest controlled-beta-available level;
- if evidence would progress beyond that level:
  - hold at the highest beta level;
  - record a stable decision such as `release_cap_reached`;
  - preserve idempotent progression-event handling;
  - do not mark the optional level reached;
  - do not mutate legacy progression;
  - do not imply that the user failed.

If restored authoritative ladder progress already points to an optional level:

- do not rewrite historical state on read;
- derive an effective controlled-beta level at or below the cap;
- current planning uses the effective beta level;
- positive progression remains capped;
- diagnostics record the mismatch;
- future release policy can still inspect the historical value.

Do not silently downgrade the persisted ladder state unless the existing architecture requires an explicit migration and the prompt is amended.

### 8. Main-plan credit remains possible at the beta cap

A user at the highest available controlled-beta level may still:

- receive a normal current main-plan session;
- earn Stage 5A/5B main-plan credit;
- receive schedule credit;
- receive honest “maintaining this level” behavior.

They must not receive:

- a false “levelled up” message;
- optional-level exposure;
- a fabricated progression event.

Existing Stage 5D/E hold and idempotency semantics remain authoritative.

### 9. Explore policy

In controlled beta:

- optional levels are not shown as startable ladder levels;
- they should preferably be omitted from the user-facing level list;
- do not show a tempting disabled card with detailed advanced instructions unless current product design explicitly needs “coming later” visibility;
- current level markers must not point to a hidden optional level;
- easier/harder navigation must stop at the highest beta level;
- collection/supporting-set UI must not imply hidden optional access;
- direct route parameters requesting optional levels fail closed.

If a historical completion references an optional level:

- history may display the recorded exercise name;
- current Explore actions remain unavailable.

### 10. Manual-practice policy

Manual practice must:

- reject optional-level requests in controlled beta;
- return a typed unavailable reason;
- not silently start the optional level;
- not silently switch to an unrelated movement;
- may suggest the nearest lower beta-available level in the same ladder;
- require explicit user confirmation before starting the lower suggestion;
- preserve Stage 4C-R daily-context/capability gates;
- remain non-credit and progression-ineligible.

### 11. Preset/extra-session policy

Explore presets and extra sessions must use controlled-beta availability.

An optional level must not appear because:

- the preset requests a high level;
- equipment exists;
- current stored progress is optional;
- a restored preset plan contains it.

If optional removal empties a preset:

- return typed recovery/unavailable;
- do not launch an empty player;
- do not silently use an unrelated exercise.

### 12. Start-time plan validation

Extend current start validation.

New current plans must fail closed if any exercise level is not available for the plan’s release channel.

Typed reason may be:

- `exercise_level_not_available_in_controlled_beta`;
- `optional_level_hidden`;
- `unsupported_release_channel`;
- or equivalent stable code.

Requirements:

- stale generated plan with optional level cannot start;
- stale manual/preset plan cannot start;
- historical plan remains readable;
- running session remains immutable;
- no user-facing internal reason code.

### 13. Restore and backend policy

Remote/local restore must not promote optional levels into current availability.

Requirements:

- release channel is not restored from user-controlled data;
- missing release metadata defaults to controlled beta for current planning;
- optional historical summaries remain historical;
- current generated plan containing optional level becomes refresh-required;
- restored progress above beta cap uses derived effective beta level;
- no read-time rewrite of historical completion or ladder state;
- training-state/profile payload cannot enable optional levels.

No backend schema migration is expected.

### 14. Loaded-level policy

For controlled beta:

- `loaded-sit-to-stand` is hidden;
- `squat-loaded` is hidden.

The presence of:

- dumbbells;
- backpack;
- another weight;
- camera tracking;
- prior strength performance

does not enable these levels.

Stage 4E-R closes F4R-005 for controlled beta by containment, not by approving load prescription.

The report must state:

> Loaded levels remain defined but are not user-reachable in the controlled beta. Enabling them later requires a separate approved load-selection, securement, breathing, effort, and stop-rule policy plus domain review.

Do not add a load-prescription algorithm in this task.

### 15. Other optional-level policy

For controlled beta:

#### `squat-slow-eccentric`

- hidden pending Stage 4F-R progression review.

#### `chair-supported-split-squat`

- hidden pending prerequisite, knee/hip/ankle, and balance review.

#### `push-up-standard`

- hidden despite confirmed floor transfer;
- Stage 4C-R floor capability does not approve this advanced level.

#### `mini-band-lateral-walk`

- hidden pending progression/domain review;
- mini-band availability alone does not enable it.

#### `neck-rotation`

- hidden pending mobility/domain review;
- user discomfort selection or equipment does not enable it.

### 16. User-facing copy

Because optional levels are hidden by default, avoid unnecessary warning copy.

Where recovery copy is required:

- “This level isn’t available in the beta yet.”
- “Pearl will use the closest supported level.”
- “Your plan and progress are unchanged.”
- “A supported level is available.”

Avoid:

- “too advanced for you”;
- “failed”;
- “locked because of age”;
- shame;
- medical claims;
- internal release terminology beyond plain “beta” where appropriate.

### 17. No catalogue deletion

Preserve:

- registry count;
- ladder count;
- level IDs;
- historical serializers;
- safety cue profiles;
- generated audio assets.

Do not rename level IDs.

Do not delete optional-level MP3 safety assets if any cue pack references them.

### 18. Safety audio remains a release gate

Stage 4D-R.1 verified 88 safety assets.

Stage 4E-R must preserve:

- `npm run verify:audio`;
- Clara/Marcus parity;
- static asset mapping;
- safety cue fingerprints;
- Expo bundling;
- text fallback.

Do not regenerate audio.

Do not modify `.env` or reveal provider credentials.

## Primary objective

Implement one fail-closed controlled-beta release boundary so that:

1. All seven current optional levels remain hidden from beta users.

2. Generated sessions cannot select optional levels.

3. Progression cannot advance into optional levels.

4. Restored optional progression cannot steer current planning above the beta cap.

5. Explore cannot expose optional levels as startable.

6. Manual practice cannot start optional levels.

7. Presets/extras cannot include optional levels.

8. Direct/deep-link/internal calls cannot bypass the policy.

9. Stale plans containing optional levels cannot start.

10. Historical records remain readable.

11. Main-plan credit and maintenance at the highest beta level remain honest.

12. F4R-005 is closed for controlled beta by containment.

13. Stage 4A–5H and Stage 4D-R.1 audio contracts remain intact.

## Scope boundary

This task may change:

- exercise release-policy types/helpers;
- ladder-level availability helpers;
- generator level resolution;
- progression cap handling;
- session-plan metadata;
- start-time plan validation;
- Explore level filtering/view models;
- manual-practice planning;
- preset/extra planning;
- local serialization normalization where needed;
- restore normalization where needed;
- narrow recovery copy;
- tests;
- the Stage 4E-R remediation report.

This task must not change:

- exercise registry count;
- exercise/level IDs;
- optional levels to core;
- exercise content;
- safety cue wording/audio;
- movement-capability gates;
- equipment authority;
- readiness/discomfort policy;
- progression thresholds below the cap;
- credit/schedule rules;
- scoring;
- norms;
- Check-Up logic;
- exact/near focus;
- broad UI design;
- dependencies;
- lockfiles;
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

Important:

- The 88 generated safety MP3s, `src/audio/manifest.ts`, and `src/audio/safetyAudioManifest.ts` are part of the intended current change set.
- Do not delete, regenerate, rename, or omit them.
- Do not expose `.env` contents.

Rules:

1. Treat all current modified/untracked files as user-owned.

2. Inspect current diffs in every file Stage 4E-R may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only if task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct every current release-status consumer

Before editing, inspect at minimum:

- src/exercises/types.ts
- src/exercises/ladders.ts
- src/exercises/registry.ts
- every current optional exercise definition
- src/exercises/__tests__/catalog.test.ts
- src/training/workoutGeneration.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/pearlFlow/progressionEvidence.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/exploreViewModel.ts
- src/pearlFlow/types.ts
- src/screens/ExploreDetailScreens.tsx
- src/screens/ExploreScreen.tsx
- manual-practice start path
- preset/extra-session planning
- local training serialization
- backend training-state restore
- App start-time validation
- all release/optional/progression tests.

Search for:

- `v1_optional`;
- `v1_core`;
- `releaseStatus`;
- `includeOptional`;
- `optional`;
- `allowOptional`;
- `level + 1`;
- `currentLevel`;
- `nextLevel`;
- `progressTo`;
- `manual`;
- `preset`;
- `deep link`;
- `requestedLevelId`;
- `selectedDailyLevelId`;
- `ladderProgressById`.

Document:

- every current optional-level writer/reader;
- every current production route that could select a level;
- every progression path;
- every Explore/manual path;
- every direct caller;
- current restore behavior;
- current tests that assume optional access;
- any debug/dev bypass.

Do not edit until this trace is complete.

## Step 2: Add one canonical controlled-beta release policy

Create or harden one pure policy module in the exercise/training domain.

Direct tests must cover:

- all 30 current core levels;
- all 7 current optional levels;
- unknown level;
- unknown release status;
- controlled-beta channel;
- internal-development channel if retained;
- deterministic output;
- no mutation;
- no display-name parsing.

Create an explicit expected optional-level set test so adding or removing an optional level requires deliberate review.

The test should fail if:

- an eighth optional level is added without policy;
- an optional level becomes core accidentally;
- a core level becomes optional accidentally without test update.

Do not hard-code catalogue behavior in multiple modules.

## Step 3: Add per-ladder controlled-beta ceilings

For each ladder, derive:

- beta-available level IDs;
- highest beta-available linear level;
- whether no beta level exists;
- whether hidden optional levels follow the beta ceiling.

Direct tests for all 11 ladders.

Requirements:

- collection/supporting-set semantics remain;
- optional entries are omitted from beta user lists;
- no false linear progression for collections;
- no invalid index when the final catalogue level is optional;
- stable order.

Create a report table:

| Ladder | Core levels | Hidden optional levels | Beta ceiling | Behavior |

## Step 4: Harden generated-session level resolution

Update the current generator to consume the canonical policy.

Scenarios:

1. Stored progress at core entry level.
2. Stored progress at highest core level.
3. Stored progress pointing to optional level.
4. Requested level is optional.
5. Readiness regression from optional state.
6. Pain/equipment/capability filtering.
7. No beta-safe level remains.

Required:

- select nearest valid lower same-ladder core level where possible;
- preserve requested level separately;
- record `controlled_beta_release_cap` or equivalent;
- no unrelated substitution;
- no persistent progress mutation during planning;
- Stage 4B stimulus semantics remain accurate;
- Stage 5B focus credit remains accurate.

Tests for strength, balance, mobility/supporting ladders where applicable.

## Step 5: Enforce the progression ceiling

Update Stage 5D progression application/decision integration narrowly.

Required:

- positive evidence below ceiling behaves exactly as before;
- positive evidence at ceiling holds;
- decision reason is stable;
- no optional level becomes authoritative current progress;
- one applied event remains idempotent;
- repeated feedback remains one event;
- pain/tracking/valid-time conservative regress/hold behavior remains;
- restored progress above cap uses effective cap without read-time rewrite;
- no false “progressed” copy.

Do not change numeric thresholds below the cap.

Tests:

- two easy exposures at penultimate core may progress to final core;
- two easy exposures at final core hold at final core;
- optional next level remains hidden;
- duplicate event;
- restored optional state;
- supporting exercise own-ladder cap;
- fallback remains ineligible;
- hold-only session remains hold-only.

## Step 6: Add plan metadata for release policy

For new current plans, preserve narrow metadata such as:

```ts
type PlannedExerciseReleaseSnapshot = {
  schemaVersion: number;
  channel: 'controlled_beta';
  requestedLevelId?: string;
  selectedLevelId: string;
  availabilityReason: string;
  releasePolicyFingerprint: string;
};
```

Adapt to current structures.

Requirements:

- JSON-safe;
- deterministic;
- no user-controlled channel;
- survives local generated summary where needed;
- compact remote mapping if current plan metadata is synced;
- used by start validation;
- no full catalogue duplication.

A current plan with missing required release metadata must refresh/fail closed.

Historical plans remain readable.

## Step 7: Start-time fail-closed validation

Extend current start validation after:

- equipment;
- movement capability;
- safety cues;

or in the narrowest consistent order.

Validate:

- supported release schema;
- controlled-beta channel;
- every planned level is beta-available;
- requested/selected metadata is consistent;
- no optional level;
- release-policy fingerprint current.

Recovery reasons:

- `optional_level_hidden`;
- `exercise_level_not_available_in_controlled_beta`;
- `unsupported_release_policy`;
- `stale_release_policy`;
- or equivalent.

Tests:

- stale generated optional plan;
- stale manual optional plan;
- stale preset optional plan;
- missing release snapshot;
- unknown level;
- historical plan;
- running session immutability.

## Step 8: Explore filtering and identity

Update Explore view models/details.

Required:

- optional levels omitted from startable list;
- current-level marker uses effective beta level;
- easier/harder navigation stops at beta ceiling;
- no “Level 8” gap caused by hidden items;
- no direct route to optional level;
- historical optional completion may be displayed read-only;
- collection/supporting-set labels remain semantically correct;
- no optional audio/cue metadata loss.

Do not redesign Explore.

Tests must cover all seven optional levels.

## Step 9: Manual-practice containment

Update manual planning.

Required:

- optional request returns typed unavailable;
- optional request does not launch player;
- optional request does not mutate progress;
- same-ladder lower beta suggestion may be returned;
- suggestion requires explicit confirmation;
- direct helper call cannot bypass;
- daily context/capability/cue gates remain;
- manual remains non-credit/ineligible.

Tests:

- each optional level;
- unknown level;
- restored optional current level;
- lower suggestion;
- user declines suggestion;
- user accepts lower suggestion;
- no unrelated substitution.

## Step 10: Preset/extra-session containment

Re-verify every preset/extra route.

Required:

- optional levels filtered;
- preset remains useful when core alternatives exist;
- no empty player;
- typed recovery when all requested levels are unavailable;
- supporting/focus metadata remains honest;
- extra remains non-main-plan/non-progression;
- direct caller cannot set internal development channel.

Tests cover any preset touching:

- loaded strength;
- floor push;
- split squat;
- mini-band lateral work;
- neck mobility;
- slow eccentric squat.

## Step 11: Restore and schema behavior

Test:

- old progress at optional level;
- old current plan containing optional;
- old generated summary containing optional;
- remote training state with optional current level;
- malformed release metadata;
- unsupported future release schema;
- missing release metadata;
- local/remote duplicate.

Required:

- historical data remains readable;
- current planning uses effective beta cap;
- current plan refreshes;
- no backend/user field enables optional levels;
- no read-time rewrite;
- no progression replay.

## Step 12: User-facing copy

Add only narrow recovery/maintenance copy.

### At beta ceiling

- “You’re maintaining the highest level currently included in the beta.”
- “Pearl will keep this level steady for now.”

### Optional request

- “This level isn’t available in the beta yet.”
- “A supported level is available.”

### Stale plan

- “This session needs to be refreshed before it can start.”
- “Your plan and progress are unchanged.”

Do not show internal IDs or `v1_optional`.

Do not imply inability, age, or failure.

## Step 13: Loaded-level containment proof

For:

- `loaded-sit-to-stand`;
- `squat-loaded`;

prove:

- generator never selects them;
- Explore never starts them;
- manual never starts them;
- progression cannot enter them;
- equipment/profile cannot enable them;
- restore cannot promote them;
- direct caller fails closed;
- historical record remains readable.

Do not add load-selection logic.

The report must mark F4R-005:

- closed for controlled beta by hard containment;
- still requiring a future approved enablement policy before public availability.

## Step 14: Other optional-level containment proof

Repeat the complete proof for:

- `squat-slow-eccentric`;
- `chair-supported-split-squat`;
- `push-up-standard`;
- `mini-band-lateral-walk`;
- `neck-rotation`.

Document each reason for deferral.

## Step 15: Optional-level non-reachability property test

Add a deterministic property/table-driven test across:

- all production planning entrypoints;
- all current profiles/equipment combinations;
- all readiness/discomfort combinations used in bounded tests;
- every ladder progress index;
- controlled-beta channel.

Universal invariant:

> No returned startable current plan contains a `v1_optional` level.

Include at least:

- generated main;
- short;
- restart;
- supporting;
- preset;
- manual;
- restored state.

Use bounded deterministic cases; do not add a dependency.

## Step 16: Stage 4D-R.1 audio regression

Run and preserve:

```bash
npm run verify:audio
```

Tests must prove:

- optional-level containment does not delete safety MP3s;
- static mappings remain 88/88;
- Clara/Marcus parity remains;
- cue profiles remain valid;
- optional cue metadata can remain defined without making levels reachable.

Do not regenerate audio.

## Step 17: Regression verification

Prove these remain green:

### Stage 4A/4B

- equipment gates;
- stimulus roles;
- mobility collection;
- no-band honesty.

### Stage 4C-R

- floor transfer;
- step environment;
- single-leg confidence;
- Explore/manual daily context.

### Stage 4D-R/4D-R.1

- cue coverage;
- safety audio;
- start cue validation;
- player controls.

### Stage 5A–5H

- work/focus/schedule credit;
- current planner;
- progression authority;
- readiness/discomfort;
- equipment authority;
- schedule/lifecycle;
- adversarial suite.

### Other

- Stage 3D copy/focus;
- canonical tab order;
- app and website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Release policy

- 30 core;
- 7 optional;
- unknown;
- channel behavior;
- no accidental status drift.

### B. Ladder ceilings

- all 11 ladders;
- linear/supporting/collection.

### C. Generated planning

- core progress;
- beta ceiling;
- restored optional progress;
- no safe core level;
- readiness/pain/equipment interactions.

### D. Progression

- progress below cap;
- hold at cap;
- idempotency;
- restored above cap;
- no false level-up copy.

### E. Explore

- optional omitted;
- route blocked;
- current-level effective cap;
- historical read-only.

### F. Manual

- optional denied;
- lower suggestion;
- direct helper;
- no credit/progression.

### G. Presets/extras

- optional filtered;
- useful core fallback;
- typed unavailable if empty.

### H. Start validation

- optional plan;
- missing/stale metadata;
- unsupported schema;
- historical behavior.

### I. Restore/backend

- no promotion;
- no user-controlled release channel;
- no read-time rewrite.

### J. Property tests

- no startable controlled-beta plan contains optional level.

### K. Audio/regression

- `verify:audio`;
- Stage 4C/4D;
- Stage 5H.

## Test-quality requirements

Tests must:

- exercise the production release-policy helper;
- derive optional levels from the actual catalogue;
- exercise real planning/progression/start-validation paths;
- fail if any optional level becomes startable;
- assert no persistent progress mutation during planning;
- assert honest effective-level metadata;
- preserve history;
- cover direct helper/deep-link-style inputs.

Tests must not:

- mock every layer;
- assert only helper invocation;
- enable loaded levels;
- add a user toggle;
- change progression thresholds;
- regenerate audio;
- install packages;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic ids, dates, profiles, contexts, and progress states.

## Validation commands

Run targeted tests for:

- release policy/catalogue;
- workout generation;
- progression evidence/application;
- session planning/start validation;
- Explore;
- manual practice;
- presets/extras;
- serialization/restore;
- Stage 4C-R/4D-R;
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

Also run a local non-publishing Expo export to prove the verified safety assets remain bundle-resolvable:

```bash
rm -rf /tmp/pearl-stage4er-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage4er-export
rc=$?
rm -rf /tmp/pearl-stage4er-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- audio verification counts;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

Stage 4D-R.1 continuation baseline:

- audio: 44 cues / 88 assets / 88 mappings;
- targeted cue/audio tests: 6 suites / 83 tests;
- full Jest: 100 suites / 801 tests;
- both typechecks passed;
- Expo export passed.

Verify current counts rather than assuming them.

## Manual source verification after tests

Retrace:

### Generated main session

```text
authoritative progress
-> controlled-beta release policy
-> effective level
-> safety/equipment/capability/readiness
-> plan
-> start validation
```

Confirm no optional level.

### Progression at ceiling

Confirm honest hold and no hidden-level mutation.

### Explore/manual

Confirm all seven optional levels are unavailable.

### Restored optional progress

Confirm current effective beta cap without historical rewrite.

### Loaded levels

Confirm no equipment or direct caller enables them.

### Audio

Confirm safety assets and mappings remain intact.

## Remediation report

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4E_R.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Finding addressed:
   - F4R-005.
4. Findings explicitly deferred:
   - F4R-008.
   - F4R-009.
   - F4R-010.
5. Prior optional-level architecture.
6. Approved controlled-beta policy.
7. Canonical release-policy architecture.
8. Complete optional-level inventory.
9. Per-ladder beta ceilings.
10. Generated-session level resolution.
11. Progression ceiling.
12. Main-plan maintenance behavior at ceiling.
13. Plan release metadata.
14. Start-time validation.
15. Explore behavior.
16. Manual-practice behavior.
17. Preset/extra behavior.
18. Restore/backend behavior.
19. Loaded-level containment.
20. Other optional-level containment.
21. User-facing copy.
22. Safety-audio non-regression.
23. Files changed.
24. Tests added/changed.
25. Exact validation results.
26. Stage 4A–4D-R and Stage 5 regression verification.
27. F4R-005 status.
28. Remaining Stage 4 findings.
29. Whether Stage 4F-R is unblocked.
30. Whether exercise catalogue remains beta-blocked.
31. Initial and final Git status.
32. Complete files-changed inventory.
33. Concurrent external changes.
34. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

## Required invariant outcomes

After Stage 4E-R:

1. All seven current optional levels remain hidden in controlled beta.
2. Optional levels remain in the registry.
3. Generated current plans contain no optional levels.
4. Short/restart/supporting plans contain no optional levels.
5. Explore exposes no optional start action.
6. Manual practice cannot start optional levels.
7. Presets/extras cannot include optional levels.
8. Direct calls cannot bypass the policy.
9. Equipment/capability confirmation cannot enable optional levels.
10. Progression cannot enter optional levels.
11. Highest beta level holds honestly.
12. Restored optional progress does not steer current planning above cap.
13. Planning does not rewrite persistent progress.
14. Stale optional plans cannot start.
15. Historical optional records remain readable.
16. No user/backend field enables internal release channel.
17. Loaded levels remain hidden.
18. Standard push-up remains hidden.
19. Split squat remains hidden.
20. Mini-band lateral walk remains hidden.
21. Neck rotation remains hidden.
22. Slow-eccentric squat remains hidden.
23. Main-plan credit remains possible at the beta ceiling.
24. No false level-up copy appears.
25. Safety cue profiles/assets remain intact.
26. Stage 4C-R/4D-R gates remain.
27. Stage 5A–5H contracts remain.
28. App/website typechecks remain.
29. No scoring/norm/Check-Up changes.
30. No package/lockfile/audio regeneration.
31. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4E-R complete unless:

1. One canonical controlled-beta release policy exists.

2. All seven optional levels are explicitly inventoried and unavailable.

3. Every production planning path consumes the policy.

4. Progression is capped before optional levels.

5. Explore/manual/presets cannot expose optional levels.

6. Direct/deep-link-style calls fail closed.

7. Start validation rejects stale optional plans.

8. Restore cannot promote optional availability.

9. Historical data remains readable.

10. Loaded levels are contained without adding a load algorithm.

11. Optional-level property tests pass.

12. `npm run verify:audio` passes.

13. Stage 4A–4D-R and Stage 5 regressions pass.

14. Targeted tests pass.

15. Full suite passes.

16. App typecheck passes.

17. Website typecheck passes.

18. Expo config passes.

19. Expo export passes.

20. `git diff --check` passes.

21. No new warning is introduced without explanation.

22. No unrelated user work is reverted or overwritten.

23. No package install or lockfile change occurs.

24. No audio regeneration occurs.

25. No staging, commit, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4E-R COMPLETE`
- `STAGE 4E-R BLOCKED`

Also state exactly one:

- `STAGE 4F-R UNBLOCKED`
- `STAGE 4F-R BLOCKED`

Use `STAGE 4F-R UNBLOCKED` only if no P0/P1/P2 optional-level exposure defect remains.

Also state:

- `STAGE 4F-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4E-R must not declare the exercise catalogue ready while F4R-008, F4R-009, and F4R-010 remain unresolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Controlled-beta release policy.
- Complete optional-level list.
- Per-ladder beta ceilings.
- Generated-session behavior.
- Progression-cap behavior.
- Explore behavior.
- Manual-practice behavior.
- Preset/extra behavior.
- Start-time validation.
- Restore/backend behavior.
- Loaded-level containment result.
- Other optional-level containment result.
- Safety-audio regression result.
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
- Confirmation that Stage 4A–4D-R, Stage 5A–5H, Stage 3D, navigation, TypeScript boundaries, and safety audio remain.
- F4R-005 status.
- Remaining Stage 4 blockers.
- `STAGE 4E-R COMPLETE` or blocked.
- `STAGE 4F-R UNBLOCKED` or blocked.
- `STAGE 4F-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
