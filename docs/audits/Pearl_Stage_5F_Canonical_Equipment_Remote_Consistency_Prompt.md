You are implementing Stage 5F of Pearl’s production-readiness work:

CANONICAL EQUIPMENT STATE, CAPABILITY NORMALIZATION, LOCAL/REMOTE CONFLICT RESOLUTION, PLAN-SNAPSHOT CONSISTENCY, AND REMOTE STIMULUS-METADATA COMPLETENESS

This is a focused production-code remediation task following the completed and verified Stage 5A–5E work.

Do not begin Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or broad workout-generation redesign in this task.

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
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5E_1.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 5F

Stage 5A is complete:

- only explicit active-block, block-generated, valid-template A/B/C events can count;
- non-training events do not affect rotation;
- zero-work, all-skipped, malformed, unmatched, and missing-result attempts receive no main-plan credit;
- explicit planning dates are authoritative;
- duplicate credit is deduped.

Stage 5B and Stage 5B.1 are complete and verified:

- main-plan credit requires explicit completed primary work matching the concrete MovementBlock focus;
- supporting-only, fallback-only, wrong-domain, missing-metadata, and legacy-fallback work is non-credit;
- restored rows cannot claim credit without positive focus-stimulus evidence.

Stage 5C is complete:

- current dynamic planning never silently falls back to the legacy planner;
- failures return typed recovery states;
- valid current supporting plans remain distinct and non-credit.

Stage 5D and Stage 5D.1 are complete and verified:

- `ladderProgressById` plus `appliedProgressionEventIds` is the sole current progression state;
- current sessions do not mutate legacy progression;
- progression application is exercise-local, per-ladder, and idempotent;
- restore does not replay progression;
- canonical tab order is Today → Plan → Progress → Explore.

Stage 5E and Stage 5E.1 are complete and verified:

- daily readiness/discomfort is normalized once;
- discomfort movement-pattern constraints are centralized;
- safety precedes readiness and credit;
- temporary daily regressions do not mutate persistent ladder state;
- progression policy is `normal`, `hold_only`, or `ineligible`;
- full app typecheck and website typecheck are separated and green;
- full release validation is green at 90 suites / 695 tests.

Stage 4A/4B and Stage 3D protections remain authoritative.

Do not weaken or bypass any of these contracts.

## Confirmed findings being addressed

### F5-008 — P2, beta-blocking state-consistency risk

Equipment availability still has multiple sources of truth.

Historically identified sources include:

1. The current profile/safety equipment selection, with capabilities such as:
   - chair;
   - wall/support;
   - stairs;
   - resistance band;
   - mini band;
   - door anchor;
   - floor space;
   - explicit no-equipment.

2. Legacy/current training-state equipment flags, conceptually including:
   - stair;
   - band;
   - miniBand;
   - load;
   - other old booleans.

3. Plan/session metadata and generated equipment summaries.

4. Local and remote profile/training-state restore payloads.

Earlier behavior allowed the training-state equipment flags to add or remove capabilities from the user’s explicit profile selection.

Examples:

- legacy stair state could add stair access even when the current safety/profile selection omitted it;
- a legacy false band flag could remove resistance-band and door-anchor capability even when Settings said they were available;
- floor access could be treated implicitly rather than as an explicit capability;
- stale restored equipment state could produce a different session from the current Settings selection.

This violates the trust rule that the user’s current explicit equipment setup must determine planning.

### F5-009 — P2, persistence/completeness risk

Backend training-state sync historically omitted some structured Stage 4B generated-exercise fields, including:

- `intendedDomain`;
- `stimulusRole`;
- `stimulusReason`.

Later stages added more metadata, so Stage 5F must re-verify the current mapper rather than assuming the finding is still unchanged.

The remote compact snapshot must preserve enough structured context to restore:

- exercise identity;
- intended domain;
- selected domain where represented;
- primary/supporting/fallback/skipped role;
- stimulus reason;
- equipment/safety reason;
- focus-stimulus evidence;
- main-plan credit state;
- readiness/discomfort/progression policy;
- source/block/template/date identity.

Remote restore must not reconstruct these semantics from display names.

Stage 5F must close F5-008 and F5-009, or explicitly prove any part was already closed by later work.

## Approved Stage 5F product policy

The following policy is locked for this task.

### 1. One canonical equipment authority

The user’s explicit current equipment profile is the sole authority for current planning.

Use the repository’s current profile/safety equipment field as the canonical persisted source. Re-verify the exact path before editing.

Conceptually:

```text
profile/safety availableEquipment
-> normalized canonical equipment capabilities
-> current dynamic planning
```

Current dynamic planning must not merge mutable legacy training-equipment booleans into this profile.

### 2. Legacy equipment is migration-only

Legacy training equipment may remain for:

- historical readability;
- old schema parsing;
- explicit one-time conservative migration when no canonical profile exists.

It must not:

- override a valid canonical profile;
- add capabilities to a canonical profile;
- remove capabilities from a canonical profile;
- steer current planning after canonical profile confirmation;
- be treated as equally authoritative.

### 3. Explicit none differs from unknown

A user explicitly selecting no equipment is valid and should normalize to an empty capability set.

Missing, malformed, unsupported, or legacy-unknown equipment state is not the same as explicit none.

Use explicit status such as:

- `confirmed`;
- `needs_confirmation`;
- `legacy_migrated`;
- `malformed_fail_closed`.

For `needs_confirmation` or malformed state:

- do not assume equipment exists;
- do not silently mark the profile as confirmed no-equipment;
- fail conservatively;
- route toward equipment confirmation when needed;
- a safe no-equipment supporting plan may be allowed only if the existing Stage 5B/5C contracts make its non-credit status explicit.

### 4. Canonical capabilities are normalized

Create one stable normalized capability set using actual repository tokens.

At minimum cover:

- chair;
- wall/support;
- stairs/step;
- resistance band;
- mini band;
- door anchor;
- floor space;
- explicit no equipment;
- any currently supported external load capability.

Requirements:

- deduped;
- stable ordering;
- unknown tokens rejected or ignored with diagnostics;
- explicit `none` cannot coexist semantically with other capabilities;
- door anchor does not imply resistance band;
- resistance band does not imply door anchor;
- stairs do not imply nearby support;
- floor access is never inferred;
- support is derived only through explicit supported capabilities;
- no display-name parsing.

### 5. One-way legacy migration only

When no canonical equipment profile exists:

- a legacy record may be mapped conservatively once;
- only direct high-confidence mappings may be retained;
- migrated state must be marked `legacy_migrated` and `needs_confirmation`;
- it must not be treated as an explicit user-confirmed profile.

Conservative mappings may include, if exact current fields support them:

- legacy band -> resistance band;
- legacy miniBand -> mini band;
- legacy stair -> stairs.

Do not infer:

- door anchor from band;
- floor space from any legacy state;
- nearby support from stair;
- safe step height;
- external load from ambiguous legacy booleans;
- chair/wall unless explicitly represented.

If a mapping is not unambiguous, fail closed.

### 6. Current profile wins over legacy state

If a valid canonical profile exists:

- ignore legacy equipment for planning;
- log a safe conflict diagnostic when legacy disagrees;
- do not mutate the canonical profile from legacy;
- do not silently “merge the union”;
- do not silently “take the intersection”;
- do not delete legacy history merely because it conflicts.

### 7. Deterministic local/remote resolution

Create one pure resolver for canonical equipment records.

Use the repository’s existing profile sync timestamps/version metadata where possible.

Preferred precedence:

1. Valid explicit local user selection with a newer authoritative update marker.
2. Valid explicit remote profile with a newer authoritative update marker.
3. If markers are equal, preserve the local explicit value and treat the records as equivalent/conflict-safe.
4. If only one explicit valid record exists, use it.
5. If no explicit valid record exists, use conservative legacy migration and require confirmation.
6. If no valid data exists, return `needs_confirmation` with empty safe capabilities.

Do not resolve conflicts by array order.

Do not use the training-state equipment snapshot as a competing current authority.

If the current sync model has a server `updated_at`, prefer it for remote ordering. If no trustworthy marker exists, implement and document the narrowest deterministic safe rule rather than inventing certainty.

### 8. User edits update the canonical record

Onboarding and Settings equipment changes must:

- write the canonical profile;
- normalize before persistence;
- update the profile’s authoritative revision/timestamp marker;
- sync through the profile/safety service;
- not require updating legacy training equipment to make current planning work.

If legacy fields still need a compatibility mirror for old non-production code:

- derive them one-way from the canonical profile;
- never read them back into current planning;
- clearly mark the mirror as legacy/derived.

### 9. Current planning reads only canonical normalized equipment

Every current dynamic planning entrypoint must receive the same normalized equipment object.

Generated workouts, manual practice, and Explore safety availability should use the same canonical capability interpretation where they represent the current user setup.

Do not maintain separate interpretations in:

- session planning;
- workout generation;
- Explore;
- manual practice;
- preview;
- backend restore.

Stage 4A’s shared equipment/safety gate remains authoritative after normalization.

### 10. Plan equipment snapshot

Every newly generated current session plan must preserve the canonical equipment state used at planning time.

Store narrow metadata such as:

```ts
type PlannedEquipmentSnapshot = {
  schemaVersion: number;
  capabilities: CanonicalEquipmentCapability[];
  status: CanonicalEquipmentStatus;
  fingerprint: string;
  sourceRevision?: string | number;
  sourceUpdatedAt?: string;
};
```

Adapt to current architecture.

Requirements:

- JSON-safe;
- deterministic;
- stable ordering;
- no sensitive profile text;
- enough to explain equipment selection;
- survives local serialization;
- survives compact backend metadata where relevant;
- does not become a second mutable authority.

### 11. Deterministic equipment fingerprint

Create one pure fingerprint helper from:

- equipment snapshot schema version;
- normalized sorted capability set;
- confirmation status;
- authoritative revision if necessary.

It may be a stable plain string; no cryptographic dependency is required.

Requirements:

- same canonical equipment -> same fingerprint;
- ordering does not change fingerprint;
- changed capability -> changed fingerprint;
- explicit none differs from unknown/needs-confirmation;
- no current timestamp included merely to force uniqueness.

### 12. Stale-plan invalidation

Before a planned session begins:

- compare the plan’s equipment fingerprint with the current canonical equipment fingerprint;
- if they match, continue;
- if they differ, do not launch the stale plan;
- return a structured refresh/replan state;
- preserve the active block, A/B/C template, history, and progression;
- generate a fresh current plan through Stage 5C when the user retries.

This protects cases such as:

- user removes a band after preview;
- user disables floor space;
- user adds a door anchor;
- restored profile differs from an already cached plan.

Do not silently edit the existing planned exercise list in place.

### 13. Mid-session equipment changes

A session already started should use its immutable plan equipment snapshot.

Do not mutate a running session because Settings changed elsewhere.

On completion/history:

- preserve the plan snapshot actually used;
- future sessions use the new canonical profile.

### 14. Profile sync owns current equipment

Canonical current equipment should be synced through the profile/safety backend path.

Training-state sync may preserve:

- immutable plan equipment snapshots;
- generated exercise/stimulus metadata;
- historical session context.

Training-state sync must not restore a mutable equipment profile that overrides the canonical profile.

### 15. Remote generated metadata must be complete

Re-verify and preserve all current generated-exercise/session fields needed by Stage 4B and Stage 5A–5E.

At minimum inspect:

- exercise id;
- ladder id;
- selected level;
- requested level;
- selected daily level;
- intended domain;
- selected/current domain where represented;
- stimulus role;
- stimulus reason;
- slot id;
- skipped/fallback reasons;
- primary-focus evidence;
- work evidence;
- main-plan credit;
- progression-evidence policy;
- daily context;
- adjustment reasons;
- equipment snapshot/fingerprint;
- source/block/template/planned-date identity.

Requirements:

- no semantics reconstructed from display names;
- remote round-trip preserves the structured fields;
- malformed remote fields fail closed;
- compact sanitization remains bounded;
- no raw pose/video/frame data;
- no free-text health notes.

If some fields are already preserved, add explicit regression tests rather than rewriting working code.

### 16. Restore ordering

On fresh restore:

1. Restore/resolve canonical profile equipment.
2. Restore active MovementBlock/current training state.
3. Restore generated summaries/history.
4. Plan only after canonical equipment resolution is complete.

If canonical equipment is still unknown:

- return an explicit equipment-confirmation/recovery state;
- do not let legacy training flags decide current planning;
- do not generate a creditable plan with unknown equipment state.

Use current restore architecture; do not add an unnecessary global state framework.

### 17. Same state before and after restore must generate the same plan

For the same:

- MovementBlock;
- ladder progress;
- completion history;
- planning date;
- daily context;
- canonical equipment profile;

generation before sync/restore and after sync/restore must produce equivalent:

- planning-result kind;
- A/B/C template;
- exercise ids/order;
- equipment eligibility;
- primary/supporting/fallback/skipped roles;
- skipped reasons;
- primary-focus credit potential;
- progression policy;
- equipment snapshot/fingerprint.

This is a core Stage 5F invariant.

### 18. Equipment changes do not rewrite historical sessions

Historical plans/completions keep the equipment snapshot used at that time.

Changing current equipment:

- affects future planning;
- invalidates stale unstarted plans;
- does not rewrite old summaries;
- does not change old completion credit;
- does not re-run old progression.

### 19. Fail-closed behavior

The following must never enable equipment:

- unknown token;
- malformed array/object;
- stale legacy true flag when canonical says unavailable;
- missing profile interpreted as all equipment;
- door anchor without band;
- stair without support;
- absent floor-space capability;
- remote training-state equipment field without canonical profile authority.

### 20. Safe observability

Emit structured diagnostics for:

- legacy equipment ignored;
- legacy migration used;
- local/remote conflict resolved;
- malformed equipment failed closed;
- plan fingerprint mismatch;
- stale plan invalidated;
- missing canonical equipment;
- remote stimulus field rejected;
- restore ordering blocked planning.

Include only:

- reason code;
- capability enum tokens;
- confirmation status;
- revision/timestamp metadata;
- plan/block/template ids where safe;
- fingerprint values if non-sensitive.

Exclude:

- free-text profile data;
- health notes;
- pose/video/landmarks;
- auth data;
- raw payload dumps.

Keep pure normalizers/resolvers side-effect free.

## Primary objective

Implement one canonical, deterministic, restore-stable equipment boundary so that:

1. Current profile equipment is the only authority for current planning.

2. Legacy training equipment cannot override current user choices.

3. Explicit no-equipment differs from missing/unknown state.

4. Local/remote conflicts resolve deterministically.

5. All planning surfaces consume the same normalized capabilities.

6. New plans store the exact equipment snapshot/fingerprint used.

7. Stale unstarted plans are invalidated after equipment changes.

8. Training-state restore cannot promote legacy equipment authority.

9. Remote generated stimulus/safety metadata round-trips completely.

10. Equal pre/post-restore inputs generate equivalent sessions.

11. F5-008 is closed.

12. F5-009 is closed or explicitly proven already closed and regression-pinned.

## Scope boundary

This task may change:

- canonical equipment types/normalizer/resolver;
- profile/safety serialization;
- onboarding/settings equipment writes;
- session planning’s equipment input;
- Stage 4A equipment-safety adapter;
- Explore/manual-practice equipment source;
- plan equipment snapshot metadata;
- plan-start stale-equipment validation;
- local training serialization;
- profile sync/restore;
- training-state/session sync/restore metadata;
- focused recovery copy/state;
- tests;
- the Stage 5F remediation report.

This task must not change:

- exercise catalogue content;
- Stage 4A safety rules;
- Stage 4B stimulus-role semantics;
- Stage 5A credit;
- Stage 5B focus credit;
- Stage 5C legacy fallback containment;
- Stage 5D progression thresholds/idempotency;
- Stage 5E pain/readiness policy;
- Stage 5G timing/lapse policy;
- scoring;
- norms;
- Check-Up logic;
- score snapshots;
- exact/near focus policy;
- broad UI redesign;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

1. Run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

2. Record exact output in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file Stage 5F may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not modify lockfiles.

10. Do not stage, commit, create a branch, or push.

11. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct every equipment source and consumer

Before editing, inspect at minimum:

- App.tsx
- src/profile/types.ts
- src/profile/serialize.ts
- profile/settings stores/providers
- safety-profile types/state
- src/screens/OnboardingEquipmentScreen.tsx
- src/screens/SettingsScreen.tsx
- src/screens/SafetyProfileScreen.tsx
- src/adherence/types.ts
- src/training/state.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/equipmentSafety.ts
- src/training/workoutGeneration.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/exploreViewModel.ts
- src/pearlFlow/types.ts
- src/screens/SessionPreviewScreen.tsx
- src/services/backend/profileSyncService.ts or equivalent
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/sessionSyncService.ts
- src/services/backend/restoreService.ts
- all equipment/profile/planning/sync/restore tests.

Search for:

- `availableEquipment`
- `EquipmentProfile`
- `training.equipment`
- `band`
- `miniBand`
- `stair`
- `stairs`
- `door_anchor`
- `floor_space`
- `resistance_band`
- `none`
- `load`
- `counter`
- `availableEquipmentFor`
- `equipmentSnapshot`
- `equipmentFingerprint`
- profile sync/restore timestamps/revisions.

Produce a source-of-truth table:

| Source | Fields | Writable by | Read by | Persisted where | Current authority | Risk |

Document:

- every current writer;
- every current reader;
- merge/precedence logic;
- profile sync shape;
- training-state sync shape;
- restore order;
- current timestamp/revision fields;
- whether plan equipment snapshots already exist;
- every stale/multiple-source behavior.

Do not edit until this trace is complete.

## Step 2: Define canonical equipment types

Create or harden a narrow canonical module in the profile/safety layer, conceptually:

```ts
type CanonicalEquipmentCapability =
  | 'chair'
  | 'wall'
  | 'stairs'
  | 'resistance_band'
  | 'mini_band'
  | 'door_anchor'
  | 'floor_space'
  | ...actual supported tokens;

type CanonicalEquipmentStatus =
  | 'confirmed'
  | 'needs_confirmation'
  | 'legacy_migrated'
  | 'malformed_fail_closed';

type CanonicalEquipmentProfile = {
  schemaVersion: number;
  capabilities: CanonicalEquipmentCapability[];
  status: CanonicalEquipmentStatus;
  revision?: number;
  updatedAt?: string;
  source: 'local_user' | 'remote_profile' | 'legacy_migration' | 'default_unknown';
};
```

Adapt to current types.

Requirements:

- JSON-safe;
- stable ordering;
- no `none` capability mixed into actual capability set;
- current UI tokens map explicitly;
- unknown tokens fail closed;
- pure normalization;
- no mutation;
- no parallel duplicate canonical type.

If the current profile type already fits, extend/harden it rather than replacing it.

## Step 3: Implement one canonical normalizer

Directly test:

- explicit none;
- chair;
- wall;
- stairs;
- resistance band;
- mini band;
- door anchor;
- floor space;
- full kit;
- duplicates;
- arbitrary ordering;
- unknown token;
- malformed non-array;
- null/undefined;
- `none` plus other tokens;
- door anchor without band;
- legacy token spellings;
- input non-mutation.

Required:

- explicit none -> confirmed empty capabilities;
- missing/malformed -> needs confirmation or malformed fail-closed;
- door anchor may be stored but eligibility still requires band;
- stable deterministic output;
- no inferred floor/support/stair safety.

## Step 4: Implement conservative legacy migration

Create one pure migration helper.

Test:

- legacy band true;
- miniBand true;
- stair true;
- load true;
- all false;
- malformed legacy object;
- canonical profile also present;
- legacy conflicts with canonical.

Required:

- legacy used only when canonical absent;
- direct mappings only;
- source marked legacy migration;
- status requires confirmation;
- no floor/door-anchor/support inference;
- ambiguous load does not enable current external-load capability unless exact repository semantics prove it safe;
- canonical always wins.

## Step 5: Implement deterministic local/remote resolver

Create one pure resolver.

Test matrix:

1. valid local explicit only;
2. valid remote explicit only;
3. local newer;
4. remote newer;
5. same revision/time and same capabilities;
6. same revision/time but conflict;
7. malformed local, valid remote;
8. valid local, malformed remote;
9. neither explicit, valid legacy;
10. no valid data;
11. explicit none vs stale legacy full equipment;
12. explicit band/door anchor vs stale legacy false;
13. current no stairs vs legacy stair true.

Requirements:

- deterministic;
- no array-position precedence;
- no training-state authority;
- tie behavior documented;
- conflict diagnostic returned;
- no mutation.

Use current trustworthy timestamp/revision fields. If timestamps are missing or invalid, fail conservatively and document the fallback rule.

## Step 6: Make profile equipment the sole current planning source

Remove/harden any current merge such as:

```text
profile availableEquipment
+/- training.equipment
```

Required:

- current planner reads only the resolved canonical profile;
- legacy training equipment is ignored after canonical resolution;
- Stage 4A `equipmentSafety` consumes canonical normalized capabilities;
- Explore and manual practice use the same capability object;
- no one-way legacy false flag deletes a canonical capability;
- no legacy true flag adds a canonical capability.

Tests must prove the historic conflict cases are closed.

## Step 7: Update equipment UI writes

Verify onboarding and Settings:

- read canonical profile;
- write canonical profile;
- normalize before persistence;
- increment/update authoritative metadata;
- preserve explicit none correctly;
- maintain stable capability ordering;
- do not require legacy training equipment to make current planning work.

If a legacy mirror remains necessary:

- derive one-way from canonical;
- label it legacy;
- never read it into current planning;
- test that mirror disagreement cannot affect planning.

Do not redesign the UI.

## Step 8: Add immutable plan equipment snapshot and fingerprint

For every newly generated current dynamic plan, stamp:

- schema version;
- normalized capabilities;
- confirmation status;
- deterministic fingerprint;
- source revision/timestamp where useful.

Requirements:

- plan snapshot equals the canonical state used during generation;
- plan snapshot survives local serialization;
- generated summary preserves it;
- session completion/history preserves the snapshot or fingerprint where needed;
- no current planner reads the plan snapshot as the mutable current profile;
- no sensitive text.

Direct tests:

- same capabilities, different input order -> same fingerprint;
- changed capability -> changed fingerprint;
- explicit none vs unknown -> different fingerprint;
- restore round-trip;
- historical plan snapshot remains unchanged after current profile edit.

## Step 9: Add stale-plan validation before session start

Create one pure validator comparing:

- planned equipment fingerprint;
- current canonical equipment fingerprint;
- plan source/block/template/date identity.

Required states:

- `current` -> session may start;
- `equipment_changed` -> refresh/replan required;
- `missing_plan_snapshot` -> fail closed for new current plans;
- `canonical_equipment_unknown` -> confirmation/recovery;
- `legacy_plan` -> Stage 5C non-current recovery.

At the App/preview/start boundary:

- do not start a stale plan;
- preserve active block and A/B/C position;
- do not mutate history/progression;
- show calm recovery copy;
- retry invokes current planning.

Tests:

- band removed;
- band added;
- floor space removed;
- stair/support changed;
- door anchor added/removed;
- no actual change but array order changed;
- current explicit none;
- unknown canonical profile;
- running session unaffected by later changes.

## Step 10: Handle unknown equipment state safely

For `needs_confirmation`, `legacy_migrated`, or malformed status:

- do not create a normal creditable current plan solely from unknown equipment assumptions;
- route to equipment confirmation or return a Stage 5C recovery state;
- if current product allows a safe supporting no-equipment preview, it must remain explicitly non-credit and must not mark the profile confirmed;
- do not let legacy flags make it creditable.

Add tests for:

- fresh user before equipment onboarding;
- old restored legacy user;
- malformed remote profile;
- explicit confirmed no equipment.

## Step 11: Make profile sync authoritative

Trace and harden the profile/safety sync service.

Requirements:

- canonical equipment metadata syncs with profile;
- exact normalized capabilities preserved;
- status/revision/update marker preserved where appropriate;
- remote payload is sanitized;
- unknown tokens rejected;
- training-state sync does not override canonical equipment;
- fresh-device restore obtains canonical equipment before planning;
- local/remote resolver is used consistently.

Do not add raw health notes or free text.

Do not add a database migration unless existing JSON columns cannot safely preserve the record.

## Step 12: Remove equipment authority from training-state restore

Training-state restore may retain:

- historical legacy equipment;
- immutable plan equipment snapshots;
- generated summary equipment metadata.

It must not:

- overwrite the resolved canonical profile;
- mutate Settings equipment;
- add/remove current planning capabilities;
- mark unknown equipment confirmed.

Tests:

- remote training state says band false; profile says band true -> band remains true;
- remote training state says stair true; profile says no stair -> no stair;
- profile explicit none; legacy full equipment -> none;
- training state restored before profile -> planning waits/fails conservatively until profile resolution;
- repeated restore is deterministic.

## Step 13: Re-verify and close F5-009 remote metadata

Inspect current local and remote mappers.

Create an explicit field matrix:

| Field | Local plan | Local summary | Training-state remote | Session-completion remote | Restore | Required |

At minimum cover:

- `exerciseId`;
- `ladderId`;
- selected level;
- requested level;
- selected daily level;
- `intendedDomain`;
- selected/current domain where represented;
- `stimulusRole`;
- `stimulusReason`;
- slot id;
- skipped/fallback reason;
- work evidence;
- focus-stimulus evidence;
- main-plan credit;
- progression-evidence policy;
- normalized daily context;
- adjustment reasons;
- equipment snapshot/fingerprint;
- source/block/template/planned date;
- applied progression event ids where applicable.

If a field is already preserved:

- add tests;
- do not duplicate it.

If missing:

- add compact sanitized mapping;
- restore it explicitly;
- fail closed on malformed value.

Do not rebuild semantics from display names.

## Step 14: Pre/post-restore generation equivalence

Create an integration-style deterministic test.

Given fixed:

- canonical equipment;
- active MovementBlock;
- ladder progress;
- applied event ids;
- completion history;
- planning date;
- daily context;
- focus;

Generate a plan.

Then:

1. serialize/sync the relevant state;
2. restore into a fresh local state;
3. generate again.

Assert equivalence of:

- result kind;
- template id;
- exercise ids/order;
- required equipment;
- skipped slots/reasons;
- stimulus roles/reasons;
- focus-credit potential;
- progression policy;
- equipment fingerprint;
- planned date key.

Cover at least:

- explicit no equipment;
- chair + wall;
- band without anchor;
- band + anchor;
- stairs + support;
- floor space;
- full kit;
- legacy migration requiring confirmation.

## Step 15: Equipment change scenario matrix

Test current planning and stale-plan behavior for:

1. Add chair.
2. Remove chair.
3. Add wall support.
4. Remove support.
5. Add stairs only.
6. Add stairs + support.
7. Remove stairs.
8. Add band.
9. Remove band.
10. Add door anchor without band.
11. Add band + door anchor.
12. Add mini band.
13. Remove floor space.
14. Explicit none.
15. Unknown/malformed.
16. Local/remote conflict.
17. Legacy conflict.

For each record:

- canonical result;
- available exercises;
- planning result;
- plan fingerprint;
- stale-plan outcome;
- main-plan-credit potential;
- diagnostic reason.

## Step 16: User-facing recovery copy

Add/update narrow copy for:

### Equipment confirmation required

- “Review your available equipment before Pearl prepares today’s session.”

### Equipment changed after planning

- “Your equipment setup changed, so Pearl needs to refresh today’s session.”
- “Your plan and progress are unchanged.”

### Legacy-migrated equipment

- “Confirm your equipment setup before continuing.”

### No equipment confirmed

- normal no-equipment planning;
- do not imply an error.

Tone:

- calm;
- non-blaming;
- non-technical;
- no lost-streak/shame;
- no “corrupt state.”

Do not redesign screens.

## Step 17: Observability

Add safe structured diagnostics at:

- canonical normalization;
- legacy migration;
- local/remote resolution;
- conflict;
- profile/training-state disagreement;
- stale-plan invalidation;
- restore waiting for equipment;
- remote field rejection.

Keep pure helpers side-effect free.

## Step 18: Regression verification

Prove:

### Stage 4A

- floor gating;
- stair + support gating;
- balance support;
- band/door-anchor gating.

### Stage 4B

- stimulus roles/reasons;
- upper-pull honesty;
- mobility collection;
- static/dynamic balance.

### Stage 5A/5B

- non-training exclusion;
- zero-work exclusion;
- primary-focus credit.

### Stage 5C

- current-planner authority;
- recovery states.

### Stage 5D

- authoritative progression and idempotency.

### Stage 5E

- readiness/discomfort and progression policy.

### Other

- canonical tab order;
- app and website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Normalization

- every capability;
- explicit none;
- unknown;
- malformed;
- duplicates/order;
- dependency cases.

### B. Legacy migration

- direct mappings;
- ambiguous flags;
- canonical conflict;
- confirmation status.

### C. Local/remote resolution

- local newer;
- remote newer;
- equal;
- malformed;
- explicit none;
- legacy fallback.

### D. Planning authority

- canonical profile only;
- legacy ignored;
- profile/training conflict;
- Explore/manual/generator consistency.

### E. Snapshot/fingerprint

- deterministic;
- changed capabilities;
- explicit none vs unknown;
- local/remote round-trip;
- history immutability.

### F. Stale plan

- add/remove each major capability;
- no-op reorder;
- unknown profile;
- running-session immutability.

### G. Sync/restore

- profile round-trip;
- training-state cannot override;
- restore order;
- malformed remote;
- no promotion.

### H. F5-009 fields

- full field matrix local -> remote -> restore;
- malformed fields fail closed;
- no name-based reconstruction.

### I. Generation equivalence

- before/after restore scenarios.

### J. Regression

- Stage 4A/4B;
- Stage 5A–5E;
- Stage 3D;
- navigation;
- typecheck boundary;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real production normalizers/resolvers;
- exercise real planning entrypoints;
- exercise actual profile/training-state sync and restore;
- assert selected exercises and metadata;
- assert stale plan does not launch;
- assert training-state conflicts cannot override profile;
- assert exact remote field preservation;
- assert pre/post-restore equivalence.

Tests must not:

- mock every layer;
- assert only helper calls;
- infer semantics from names;
- install dependencies;
- alter Stage 5G timing/lapse policy;
- change exercise content;
- change scoring/norms;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic timestamps, revisions, ids, blocks, dates, profiles, and remote rows.

## Validation commands

Run targeted tests for:

- canonical equipment normalization/resolution;
- profile serialization/sync;
- equipment safety;
- workout generation;
- session planning;
- Explore/manual practice;
- stale-plan validation/recovery;
- training-state/session sync;
- restore;
- Stage 4A/4B;
- Stage 5A–5E;
- Stage 3D focus;
- navigation.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

The website typecheck is a regression guard for the verified project boundary. Do not modify the website unless Stage 5F unexpectedly touches shared root config, which it should not.

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite count;
- targeted test count;
- full suite count;
- full test count;
- snapshots;
- skipped tests;
- app typecheck result;
- website typecheck result;
- Expo config result;
- diff-check result;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warnings;
- whether validation changed files.

## Manual source verification after tests

Retrace:

### Current profile planning

```text
user equipment selection
-> canonical profile
-> normalizer/resolver
-> current planning
-> Stage 4A safety gate
-> generated plan equipment snapshot
```

### Legacy conflict

Confirm canonical profile wins.

### Equipment edit

```text
settings update
-> canonical profile revision
-> stale plan fingerprint mismatch
-> replan
```

Confirm block/progress unchanged.

### Restore

```text
remote profile
-> canonical resolver
-> training state
-> generated summaries
-> plan
```

Confirm same plan for same inputs.

### Remote metadata

Confirm Stage 4B/Stage 5 structured semantics survive round-trip.

## Remediation report

Create exactly one new report:

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F5-008.
   - F5-009.
4. Findings/policies deferred to Stage 5G/H, Stage 4, Stage 3D-B, and device validation.
5. Equipment architecture before remediation.
6. Canonical equipment data model.
7. Normalization rules.
8. Explicit-none vs unknown policy.
9. Legacy migration behavior.
10. Local/remote resolution policy.
11. UI write path.
12. Current planning authority.
13. Legacy training-equipment containment.
14. Plan equipment snapshot.
15. Equipment fingerprint.
16. Stale-plan invalidation.
17. Mid-session immutability.
18. Profile sync/restore.
19. Training-state sync/restore.
20. F5-009 field matrix and outcome.
21. Pre/post-restore generation equivalence.
22. User-facing recovery copy.
23. Observability.
24. Files changed.
25. Tests added/changed.
26. Exact validation results.
27. Stage 1–5E regression verification.
28. Remaining Stage 5 blockers.
29. F5-008 status.
30. F5-009 status.
31. Whether Stage 5G is unblocked.
32. Whether beta automatic plan generation remains blocked.
33. Initial and final Git status.
34. Concurrent external changes.
35. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 5F:

1. One canonical equipment profile is authoritative.
2. Current planning does not merge legacy training equipment.
3. Explicit none differs from missing/unknown.
4. Normalized capabilities are deterministic.
5. Unknown/malformed equipment fails closed.
6. Door anchor does not imply band.
7. Band does not imply door anchor.
8. Stair does not imply support.
9. Floor space is never inferred.
10. Legacy migration is conservative and confirmation-required.
11. Valid canonical profile always wins over legacy.
12. Local/remote conflict resolution is deterministic.
13. Onboarding/Settings write the canonical profile.
14. Explore/manual/generator use the same normalized capabilities.
15. Every new plan stores the equipment snapshot used.
16. Equipment fingerprint is deterministic.
17. Stale unstarted plan cannot launch after equipment changes.
18. Running session preserves its original equipment snapshot.
19. Historical sessions are not rewritten after equipment changes.
20. Profile sync owns mutable current equipment.
21. Training-state restore cannot override current equipment.
22. Missing canonical equipment blocks or limits planning conservatively.
23. Remote generated stimulus metadata round-trips.
24. Semantics are not reconstructed from names.
25. Same inputs before/after restore generate equivalent plans.
26. Stage 4A/4B safety and stimulus semantics remain.
27. Stage 5A–5E credit/planning/progression/readiness semantics remain.
28. Stage 3D focus remains.
29. Canonical tab order remains.
30. App and website typechecks remain.
31. No scoring/norm/Check-Up changes.
32. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5F complete unless:

1. One canonical equipment authority exists.

2. One pure normalizer exists.

3. One pure local/remote resolver exists.

4. Legacy equipment cannot override current planning.

5. Explicit none/unknown behavior is tested.

6. All planning surfaces use canonical capabilities.

7. New plans preserve equipment snapshots/fingerprints.

8. Stale plan invalidation is enforced before start.

9. Profile sync/restore preserves canonical equipment.

10. Training-state restore cannot override profile equipment.

11. F5-009 structured fields are preserved and regression-tested.

12. Pre/post-restore generation equivalence is proven.

13. Stage 4A/4B and Stage 5A–5E regressions pass.

14. Targeted tests pass.

15. Full suite passes.

16. App typecheck passes.

17. Website typecheck passes.

18. Expo config passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is reverted or overwritten.

22. No package install or lockfile change occurs.

23. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5F COMPLETE
- STAGE 5F BLOCKED

Also state exactly one:

- STAGE 5G UNBLOCKED
- STAGE 5G BLOCKED

Use `STAGE 5G UNBLOCKED` only if no P0/P1 canonical-equipment/restore-metadata gap remains.

Also state:

- STAGE 5G REQUIRED
- STAGE 5H REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5F must not declare beta readiness. Block timing/lapse semantics, broad adversarial scenario testing, remaining Stage 4 work, norm provenance, and beta-device validation remain.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Canonical equipment authority.
- Normalization behavior.
- Explicit-none vs unknown behavior.
- Legacy migration behavior.
- Local/remote resolution rule.
- UI write behavior.
- Current planning equipment source.
- Legacy equipment containment.
- Plan equipment snapshot/fingerprint.
- Stale-plan behavior.
- Profile sync/restore behavior.
- Training-state sync/restore behavior.
- F5-009 remote metadata outcome.
- Pre/post-restore generation equivalence.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- App typecheck result.
- Website typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 4A/4B, Stage 5A–5E, Stage 3D, navigation, and TypeScript-boundary protections remain.
- F5-008 status.
- F5-009 status.
- Remaining Stage 5 blockers.
- STAGE 5F COMPLETE or STAGE 5F BLOCKED.
- STAGE 5G UNBLOCKED or STAGE 5G BLOCKED.
- STAGE 5G REQUIRED.
- STAGE 5H REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
