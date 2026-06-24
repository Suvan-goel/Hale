You are implementing Stage 3D-B.2C of Hale’s production-readiness work:

VERSIONED MOVEMENT PROFILE V2 SNAPSHOTS, OFFICIAL-EVIDENCE ELIGIBILITY, IMMUTABLE LOCAL PERSISTENCE, BACKEND SYNC/RESTORE, SOURCE-CHECK-UP BINDING, AND LEGACY V1 CONTAINMENT

This is the third production implementation stage following:

- Stage 3D-B.2A: internal V2 raw assessment protocols;
- Stage 3D-B.2B: pure V2 reference interpretation engine.

Implement only the immutable V2 snapshot, persistence, sync, restore, and compatibility layer.

Do not implement the Movement Profile UI, exact-age/reference-group onboarding, suggested-focus selection, MovementAssessment V2, MovementBlock creation from V2, reports, public V2 routing, feature-flag rollout, chair Warden transform, longitudinal improvement claims, or physical-device validation in this task.

## Current implemented baseline

### Stage 3D-B.2A

The internal V2 protocol layer currently provides:

- protocol policy:
  - `legacy_movement_age_v1`;
  - `movement_profile_v2`;
- internal V2 battery:
  - `chair-rise-30s-v2`;
  - `one-leg-balance-45s-v2`;
  - `active-shoulder-reach-v2`;
  - `hinge-reach` as supporting only;
- setup metadata;
- selected standing leg and shoulder side;
- changed-from-prior metadata;
- raw protocol evidence states;
- deterministic chair, balance, and shoulder controllers;
- V2 raw completeness;
- V1 scoring, V1 score-snapshot, V1 block, report, and derived-sync containment.

V1 remains the public/default Check-Up.

### Stage 3D-B.2B

The pure V2 reference engine currently provides:

- explicit frozen `MovementProfileV2ReferenceProfile`;
- source registry:
  - `warden_2022_30s_sts`;
  - `springer_2007_unipedal_eyes_open`;
  - `gill_2020_active_shoulder_flexion`;
- deterministic source and transformation fingerprints;
- chair raw-only behavior in production;
- disabled future chair percentile-range transform architecture;
- balance Hale task bands:
  - `starting_point_low`;
  - `starting_point`;
  - `building`;
  - `ceiling_complete`;
- Springer age-group benchmark means;
- Gill active-shoulder-flexion IQR categories;
- fail-closed claim eligibility;
- mixed-domain fail-local behavior;
- JSON-safe, deterministic output;
- no score, Movement Age, suggested focus, snapshot, block, UI, backend write, clock, environment read, or network access.

Current source-set fingerprint reported by Stage 3D-B.2B:

```text
mpv2-source-set-v1-0r09281
```

Read the current code and recompute the actual current value rather than blindly hardcoding this report value.

Stage 3D-B.2B validation passed:

- targeted: 8 suites / 103 tests;
- full Jest: 110 suites / 934 tests;
- audio: 44 cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

## Product policy already approved

1. Exact Movement Age is no longer the future V2 result model.

2. Raw movement results remain primary.

3. Reference interpretation is frozen at Check-Up completion.

4. Existing V1 Movement Age snapshots remain immutable and readable.

5. V1 snapshots and V2 snapshots are separate contracts.

6. A future source/table/policy change must not recompute a historical V2 result on restore or display.

7. Missing age/reference-sex data must not invalidate an otherwise complete V2 raw Check-Up.

8. Chair remains raw-only until an approved Warden transform is explicitly implemented in a later stage.

9. Balance and shoulder source interpretations from Stage 3D-B.2B may be frozen in V2 snapshots when eligible.

10. No V1-to-V2 longitudinal comparison may be presented as improvement, decline, or equivalent change.

11. No public V2 UI, suggested focus, block creation, or user-enabled route is added in Stage 3D-B.2C.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect repository instructions:

- AGENTS.md;
- CLAUDE.md;
- current Check-Up local serialization;
- current V1 score-snapshot creation/parsing;
- current check-up sync/restore services;
- current official-evidence selectors;
- current history/source-mismatch guards;
- current compact JSON sanitizers;
- current duplicate/upsert identity conventions.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2C must:

1. Define a separate immutable Movement Profile V2 snapshot contract.

2. Create an exact official-evidence eligibility boundary for persisted V2 snapshots.

3. Bind every V2 snapshot to one exact source Check-Up by stable identity and fingerprint.

4. Freeze the explicit reference-profile input used by Stage 3D-B.2B.

5. Freeze the complete structured Stage 3D-B.2B interpretation output.

6. Freeze protocol, engine, source-set, transformation, and display-policy metadata.

7. Create deterministic snapshot identity and content fingerprinting.

8. Persist V2 snapshots locally without changing V1 snapshot semantics.

9. Sync V2 snapshots through existing backend JSON safely, without deriving V1 scores.

10. Restore and parse V2 snapshots without recomputation.

11. Preserve raw V2 Check-Ups even when a snapshot is missing or malformed.

12. Reject source-Check-Up mismatches and unsupported future versions.

13. Resolve duplicate local/remote representations deterministically.

14. Preserve historical V1 snapshots unchanged.

15. Explicitly mark V1 and V2 as longitudinally incompatible.

16. Keep V2 unavailable to current UI, focus, block, and report paths.

17. Add comprehensive deterministic tests.

18. Preserve Stage 2A, Stage 3, Stage 4, Stage 5, safety-audio, navigation, and TypeScript-boundary regressions.

## Scope boundary

This task may change:

- V2 snapshot types;
- V2 snapshot version constants;
- V2 snapshot builder/parser/validator;
- V2 source-Check-Up fingerprinting;
- V2 snapshot eligibility helper;
- V2 snapshot compatibility helper;
- Check-Up type to hold an optional V2 snapshot;
- Check-Up local serialization/normalization;
- check-up history selectors;
- check-up backend sync sanitization;
- backend restore parsing/deduplication;
- data export/account-data mapping if required to preserve the snapshot;
- focused tests;
- the Stage 3D-B.2C remediation report.

This task must not change:

- V1 norm tables;
- V1 scoring formulas;
- V1 score-snapshot semantics;
- V1 focus selection;
- V2 assessment protocols;
- V2 reference source tables or transforms;
- chair Warden transform status;
- profile/onboarding fields;
- exact-age/reference-sex UI;
- CheckUpScreen/Results/Progress/Home UI;
- suggested-focus policy;
- MovementAssessment creation;
- MovementBlock creation;
- block reports;
- training generation;
- exercise catalogue;
- public/default battery;
- feature flags;
- native pose code;
- dependencies;
- lockfiles;
- audio assets.

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

Important cautions:

- The repository is heavily dirty with user-owned Stage 3D-B.2A/2B, Stage 4/5, diagnostics, settings, pose/native, auth, and website work.
- The 88 Clara/Marcus safety MP3s and manifests are intended current assets.
- Do not delete or regenerate them.
- Do not inspect or expose `.env` values.
- Do not expose provider credentials.
- Do not modify or share font files.
- Stage 3D-B.2B source modules under `src/reference/movementProfileV2` are current task dependencies; inspect their diffs before touching adjacent exports.

Rules:

1. Treat every existing modified/untracked file as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted existing slice covering:

- Stage 3D-B.2A protocol policy/controllers;
- Stage 3D-B.2B reference engine;
- V1 score snapshots;
- scoring containment;
- official assessment eligibility;
- Check-Up history/serialization;
- check-up backend sync/restore;
- Stage 4 closure;
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

Also run:

```bash
rm -rf /tmp/hale-stage3db2c-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2c-export
rc=$?
rm -rf /tmp/hale-stage3db2c-export
exit $rc
```

Do not install dependencies.

Record current counts rather than assuming the 110-suite / 934-test Stage 3D-B.2B baseline remains unchanged.

# PART B — RECONSTRUCT CURRENT SNAPSHOT AND PERSISTENCE ARCHITECTURE

## Step 1: Inspect the current V1 snapshot contract

Inspect at minimum:

- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/scoring/scoring.ts
- src/scoring/scoringInputValidation.ts
- src/history/serialize.ts
- src/haleFlow/assessments.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/checkupHistory.ts
- src/haleFlow/reports.ts
- src/services/backend/checkupSyncService.ts
- src/services/backend/restoreService.ts
- src/services/backend/dataExportService.ts
- src/services/backend/accountDataService.ts
- Check-Up types and serializers
- all snapshot/sync/restore tests.

Document:

- V1 snapshot ID;
- source Check-Up binding;
- schema/scoring/norm versions;
- parser behavior;
- source mismatch behavior;
- sync payload shape;
- restore mapping;
- duplicate handling;
- current derived-score fields;
- current raw `checkup_json` behavior.

Do not weaken V1 validation.

## Step 2: Inspect the current V2 contracts

Inspect:

- Stage 3D-B.2A Check-Up/protocol/result types;
- Stage 3D-B.2B interpretation types;
- source/transform registry;
- engine/source-set versions;
- engine output JSON shape;
- current exports.

Document which existing types can be reused directly.

Do not duplicate the entire interpretation type under a second hand-maintained shape unless a frozen stored representation requires a narrower schema.

# PART C — V2 SNAPSHOT TYPE AND VERSION BOUNDARY

## Step 3: Add separate V2 snapshot constants

Create explicit constants, conceptually:

```ts
export const MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION = 1;
export const MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION = 1;
export const MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION = 1;
```

Reuse the current Stage 3D-B.2B engine schema/version and source-set metadata rather than duplicating them.

Requirements:

- V2 snapshot versions do not reuse `SCORE_SNAPSHOT_SCHEMA_VERSION`;
- V1 scoring/norm versions remain untouched;
- no V1 parser accepts a V2 snapshot;
- no V2 parser accepts a V1 snapshot;
- future unsupported schema fails closed;
- old supported V2 schema can remain readable after source-set evolution.

## Step 4: Define the V2 snapshot contract

Conceptually:

```ts
type StoredMovementProfileV2Snapshot = {
  kind: 'movement_profile_v2_snapshot';

  schemaVersion: number;
  snapshotId: string;
  snapshotFingerprint: string;

  sourceCheckUpId: string;
  sourceCheckUpType:
    | 'baseline'
    | 'baseline_retake'
    | 'official_retest';
  sourceCheckUpFingerprint: string;

  createdAt: string;

  protocolPolicy: {
    id: 'movement_profile_v2';
    version: number;
  };

  officialEvidencePolicyVersion: number;

  referenceProfile: MovementProfileV2ReferenceProfile;
  referenceProfileFingerprint: string;

  engine: {
    schemaVersion: number;
    engineVersion: number;
  };

  sourceSet: {
    sourceSetId: string;
    sourceSetFingerprint: string;
  };

  displayPolicyVersion: number;

  interpretation: MovementProfileV2Interpretation;
};
```

Adapt to current exact types.

Requirements:

- plain JSON-safe data only;
- no functions/providers;
- no `Date` objects;
- no `undefined` required fields;
- no NaN/infinity;
- no source PDF text;
- no URLs with query secrets;
- no raw video/frames/landmarks;
- no auth data;
- no suggested focus;
- no block/report;
- no longitudinal change statement;
- no exact chair percentile in production while transform remains disabled.

## Step 5: Deterministic snapshot ID

Use one stable ID per source V2 Check-Up.

Conceptual format:

```text
movement-profile-v2-snapshot:<encoded-source-checkup-id>
```

Requirements:

- no ambient clock;
- no random UUID;
- no reference-profile value in the identity;
- one official snapshot identity per source Check-Up;
- same source Check-Up always produces the same snapshot ID;
- different Check-Ups produce different IDs;
- URI-safe or use existing stable-ID helpers.

A different interpretation for the same snapshot ID is a conflict, not a second historical truth.

## Step 6: Snapshot fingerprint

Compute a deterministic canonical fingerprint over all material snapshot fields except `snapshotFingerprint`.

Include:

- schema;
- snapshot ID;
- source identity/type/fingerprint;
- createdAt;
- protocol policy;
- official evidence policy;
- normalized reference profile/fingerprint;
- engine metadata;
- source-set metadata;
- display-policy version;
- complete interpretation output.

Requirements:

- stable key ordering;
- no timestamp generated internally;
- equal inputs -> equal fingerprint;
- one changed raw metric/source/profile/version -> changed fingerprint;
- React-Native-compatible implementation;
- reuse Stage 3D-B.2B canonical fingerprint utilities where safe;
- no Node-only runtime crypto unless already supported.

# PART D — SOURCE CHECK-UP BINDING

## Step 7: Add canonical V2 source-Check-Up fingerprinting

Create a pure canonical representation of the V2 source Check-Up fields that materially support the snapshot.

Include at minimum:

- Check-Up ID;
- official Check-Up type;
- protocol policy ID/version;
- V2 movement IDs;
- normalized V2 raw results;
- protocol setup metadata;
- protocol evidence states;
- selected leg/side and changed metadata;
- raw completeness;
- relevant completion timestamp/identity.

Exclude:

- mutable UI state;
- transient screen state;
- raw frames/landmarks;
- unrelated profile/training data;
- current source registry;
- current clock.

Requirements:

- deterministic;
- input-order independent where result arrays can arrive reordered;
- duplicate known V2 movement IDs make the source ineligible;
- malformed source data fails closed;
- same Check-Up after JSON round-trip produces same fingerprint.

## Step 8: Source-match validation

Add:

```ts
validateMovementProfileV2SnapshotSource(snapshot, checkUp)
```

or equivalent.

It must verify:

- source ID matches;
- protocol policy matches;
- official Check-Up type matches;
- source fingerprint matches;
- required V2 raw movement evidence remains present;
- no V1 source can satisfy the snapshot.

A source mismatch must fail closed for:

- history selectors;
- sync;
- restore;
- later UI;
- later assessment/block creation.

Do not silently repair or rebind a snapshot to another Check-Up.

# PART E — OFFICIAL V2 SNAPSHOT ELIGIBILITY

## Step 9: Add one official V2 snapshot eligibility helper

Create a pure helper.

Eligible persisted snapshot source types:

- baseline;
- baseline retake;
- official retest.

Use the exact current repository values and names.

Ineligible:

- manual extra;
- quick/manual Check-Up;
- micro-check;
- legacy;
- partial official attempt;
- malformed source;
- V1 protocol;
- future unsupported protocol;
- duplicate headline movement result;
- missing chair raw result;
- missing balance raw result;
- missing shoulder raw result.

Important:

- missing age/reference sex does not make the raw official Check-Up ineligible;
- chair transform being disabled does not make the snapshot ineligible;
- raw-only reference interpretation is valid snapshot content;
- hinge is supporting and cannot substitute for missing shoulder evidence.

Return stable reasons.

Conceptually:

```ts
type MovementProfileV2SnapshotEligibility =
  | {
      eligible: true;
      sourceType: 'baseline' | 'baseline_retake' | 'official_retest';
      rawCompleteness: MovementProfileV2RawCompleteness;
    }
  | {
      eligible: false;
      reason: string;
      missingDomains?: readonly string[];
    };
```

## Step 10: Reference-profile input policy

Snapshot creation accepts an explicit `MovementProfileV2ReferenceProfile`.

Requirements:

- normalize through the Stage 3D-B.2B normalizer;
- do not read the live user profile;
- do not use the current clock;
- unknown/missing fields are preserved as explicit unknown;
- no sex inference;
- no old age-band representative promoted to exact age;
- store the exact normalized input used by the engine;
- store a deterministic reference-profile fingerprint.

# PART F — SNAPSHOT CREATION

## Step 11: Add one pure snapshot builder

Conceptually:

```ts
createMovementProfileV2Snapshot({
  checkUp,
  referenceProfile,
  createdAt,
  dependencies?,
})
```

Requirements:

1. Validate official V2 snapshot eligibility.

2. Normalize the explicit reference profile.

3. Run the current production Stage 3D-B.2B reference engine.

4. Reject unsupported V1/future protocol output.

5. Verify engine/source registry integrity.

6. Build the stored snapshot.

7. Fingerprint it.

8. Return typed diagnostics.

9. Never mutate the Check-Up.

10. Never persist by itself.

11. Never use ambient time.

12. Never create focus/block/report output.

### `createdAt`

Use an explicit immutable input or the repository’s existing stable Check-Up completion timestamp helper.

Do not call `new Date()` inside the pure builder.

Validate ISO format.

The snapshot ID must remain stable even if a caller supplies a different attempted creation timestamp. Persistence conflict handling must prevent replacement of an already frozen snapshot.

## Step 12: Chair containment

The stored chair interpretation must preserve:

- raw repetitions;
- protocol evidence;
- reference-profile status;
- Warden source identity;
- disabled chair transformation identity;
- `raw_only_source_transform_unapproved`;
- no exact percentile;
- no percentile range unless an explicitly approved provider was injected.

Default production snapshot creation must not inject a chair provider.

Tests may inject the existing Stage 3D-B.2B fake approved provider only to prove the schema can preserve a future percentile range.

No workbook data may be added.

# PART G — SNAPSHOT PARSING AND VALIDATION

## Step 13: Add strict parser

Conceptually:

```ts
parseStoredMovementProfileV2Snapshot(value)
```

Validate:

- kind;
- schema version;
- snapshot ID;
- source type;
- source identity;
- ISO timestamps;
- protocol policy;
- official-evidence policy;
- reference profile;
- reference-profile fingerprint;
- engine schema/version;
- source-set ID/fingerprint;
- display-policy version;
- interpretation shape;
- per-domain numeric bounds;
- chair transform status;
- balance task-band consistency;
- balance benchmark consistency;
- shoulder IQR consistency;
- source-Check-Up fingerprint;
- snapshot fingerprint.

Requirements:

- no partial promotion;
- malformed domain data invalidates the stored snapshot as a whole;
- raw source Check-Up remains recoverable separately;
- unsupported future schema fails closed;
- unknown result kinds fail closed;
- no recomputation;
- no current-source-set comparison that would invalidate a valid historical supported snapshot merely because the app later adds a new source set.

## Step 14: Cross-field consistency

At minimum verify:

### Chair

- raw repetitions match interpretation raw metric;
- transform-disabled status cannot coexist with percentile-range output;
- exact percentile field does not exist;
- source/transform IDs are known to the snapshot schema.

### Balance

- raw seconds match;
- 0–45 seconds;
- task band matches thresholds;
- benchmark age group/source metadata is internally consistent when present;
- no percentile/z-score/range fields.

### Shoulder

- raw degrees match;
- side matches source V2 result;
- IQR row contains `q1 <= median <= q3`;
- category matches measured degrees;
- above category has no higher-is-better flag;
- pain-limited raw result cannot be reference eligible.

# PART H — ATTACHMENT AND IMMUTABILITY

## Step 15: Add optional V2 snapshot to the Check-Up record

Add the narrowest field, conceptually:

```ts
movementProfileV2Snapshot?: StoredMovementProfileV2Snapshot;
```

Do not replace `scoreSnapshot`.

Requirements:

- V1 Check-Up may carry V1 `scoreSnapshot`, not V2 snapshot;
- V2 Check-Up may carry V2 snapshot, not a current V1 `scoreSnapshot`;
- malformed cross-kind fields are dropped/fail closed during normalization;
- old records without the field remain readable.

## Step 16: Attach helper with conflict protection

Add a pure helper such as:

```ts
attachMovementProfileV2Snapshot(checkUp, snapshot)
```

Rules:

- source validation required;
- no existing snapshot -> attach;
- identical existing snapshot fingerprint -> idempotent no-op;
- same snapshot ID with different fingerprint -> conflict, preserve the existing frozen snapshot;
- different snapshot ID on the same source Check-Up -> reject;
- never silently overwrite;
- never recompute.

Return stable conflict diagnostics.

# PART I — LOCAL SERIALIZATION AND HISTORY

## Step 17: Local serialization

Update the current Check-Up/history serializer.

Requirements:

- V2 raw Check-Up round-trips;
- V2 snapshot round-trips;
- V1 snapshot round-trips unchanged;
- old schema without V2 field remains readable;
- malformed V2 snapshot is omitted with diagnostic, while valid raw V2 Check-Up remains;
- no read-time snapshot creation;
- no read-time source interpretation;
- no read-time source-table lookup required to preserve the snapshot.

## Step 18: Official V2 snapshot selectors

Add pure selectors for later UI/flow use, such as:

- latest valid official V2 snapshot;
- all valid official V2 snapshots in chronological order;
- snapshot for source Check-Up ID.

Requirements:

- source match verified;
- exact official V2 source types only;
- no V1 snapshot;
- malformed/mismatched V2 snapshot excluded;
- input order independent;
- deterministic tie-break;
- no suggested focus or block creation.

Do not wire selectors into current screens.

# PART J — BACKEND SYNC

## Step 19: Preserve V2 snapshot through existing check-up JSON

Prefer the existing JSON payload/column architecture.

Do not add a database migration unless the current existing JSON column cannot preserve the bounded snapshot.

Requirements:

- sanitize V2 snapshot through explicit field mapping;
- do not blindly spread arbitrary objects;
- preserve numeric/string/enum/array fields required by the snapshot;
- no functions;
- no source PDFs/table text;
- no raw video/landmarks/frames;
- no auth tokens;
- no URLs with secrets;
- no provider configuration;
- no chair transform implementation.

### V1 compact fields

For a V2 Check-Up:

- do not derive/populate V1 domain age scores;
- do not populate V1 score-snapshot metadata as if V2;
- leave V1 derived-score columns null/absent according to current service conventions;
- preserve protocol policy and raw Check-Up JSON;
- preserve V2 snapshot in the bounded JSON payload.

## Step 20: Sync eligibility

Raw V2 Check-Ups may sync according to the current Check-Up sync policy.

Snapshot behavior:

- valid attached V2 snapshot -> sync it;
- no V2 snapshot -> sync raw V2 Check-Up without inventing one;
- malformed/mismatched snapshot -> omit snapshot and emit safe diagnostic;
- V1 Check-Up behavior unchanged.

Sync must not call the reference engine.

# PART K — BACKEND RESTORE

## Step 21: Restore policy

Restore must:

- restore raw V2 Check-Up;
- parse attached V2 snapshot;
- validate source binding;
- attach valid snapshot;
- omit invalid/mismatched snapshot;
- never recompute interpretation;
- never query current reference tables to rebuild a missing snapshot;
- never promote raw V2 into V1 score;
- preserve V1 behavior.

## Step 22: Duplicate local/remote resolution

For the same Check-Up identity:

### One valid snapshot, one missing snapshot

Keep the valid snapshot.

### Two identical valid snapshot fingerprints

Deduplicate.

### Two valid snapshots with same ID but different fingerprints

Treat as immutable conflict.

Recommended policy:

- preserve the already accepted local frozen snapshot when present;
- otherwise choose deterministically by current restore authority rules;
- emit conflict diagnostic;
- do not merge domain fields;
- do not recompute;
- do not overwrite silently.

### Valid raw source mismatch

Do not attach the mismatched snapshot.

## Step 23: Unsupported future versions

A remote future V2 snapshot:

- must not crash restore;
- must not be interpreted by the current app;
- raw Check-Up remains available;
- snapshot remains omitted/quarantined according to current restore conventions;
- no downgrade/rewrite.

Do not add a generic “accept future fields” bypass.

# PART L — EXPORT AND ACCOUNT DATA

## Step 24: Data export

If account-data export includes raw Check-Ups:

- preserve the bounded V2 snapshot as structured JSON;
- label snapshot kind/version;
- do not add source documents;
- do not add hidden Warden data;
- do not expose provider secrets;
- do not fabricate interpreted prose.

If no change is required because existing export already carries sanitized Check-Up JSON, prove it with tests.

## Step 25: Account deletion/clear

Verify V2 snapshots are deleted/cleared with their source Check-Up under existing account-data/local clear flows.

Do not create an orphan snapshot store.

# PART M — COMPATIBILITY AND LONGITUDINAL BOUNDARY

## Step 26: Add snapshot compatibility helper

Create one pure helper that does not compute change.

Conceptually:

```ts
type MovementProfileSnapshotCompatibility =
  | { compatible: true; kind: 'v2_same_policy'; domainComparability: ... }
  | { compatible: false; reason: string };
```

Required outcomes:

### V1 versus V2

Always incompatible for interpreted longitudinal comparison.

Reason:

```text
snapshot_policy_changed
```

### V2 versus V2

Whole-snapshot interpretation comparability requires at minimum:

- same V2 snapshot schema family;
- same protocol policy/version;
- compatible engine/reference/display policies.

Per-domain raw comparability must record:

- chair: same chair protocol/count rule;
- balance: same standing leg and protocol version;
- shoulder: same side and protocol version.

Changed leg/side:

- current cross-sectional snapshot remains valid;
- per-domain longitudinal comparability false.

Missing reference profile:

- raw comparability may remain;
- reference-interpretation comparability false.

Do not calculate improvement, decline, percentile change, or effect size.

## Step 27: Legacy display metadata

Add only structured metadata needed for later UI to distinguish:

- V1 legacy Movement Age snapshot;
- V2 Movement Profile snapshot.

Do not modify user-facing copy in this task.

Future UI should be able to label V1 as a legacy beta estimate without rewriting it.

# PART N — CONTAINMENT FROM V1 FLOW

## Step 28: Preserve V1 boundaries

Tests must prove:

- V2 snapshot cannot satisfy V1 `isStoredScoreSnapshot`;
- V1 score snapshot cannot satisfy V2 parser;
- V2 snapshot does not make `validateCheckUpForScoring` pass;
- V2 snapshot does not create V1 `CheckUpScore`;
- V2 snapshot does not create `MovementAssessment`;
- V2 snapshot does not create `MovementBlock`;
- V2 snapshot does not create block report;
- current Results/Progress/Home do not consume it;
- public/default Check-Up remains V1.

## Step 29: No suggested focus

The stored V2 snapshot must not contain:

- weakest domain;
- suggested focus;
- focus selection;
- life-goal tie break;
- block focus;
- exact/near-tie metadata.

Stage 3D-B.2D owns those policies.

# PART O — OBSERVABILITY AND PAYLOAD SAFETY

## Step 30: Stable diagnostics

Use bounded diagnostics such as:

- `v2_snapshot_ineligible_source_type`;
- `v2_snapshot_raw_incomplete`;
- `v2_snapshot_source_mismatch`;
- `v2_snapshot_fingerprint_invalid`;
- `v2_snapshot_future_schema`;
- `v2_snapshot_conflict`;
- `v2_snapshot_malformed`;
- `v2_snapshot_omitted_on_sync`;
- `v2_snapshot_omitted_on_restore`;
- `v2_snapshot_policy_incompatible`.

Include only:

- Check-Up ID;
- snapshot ID;
- snapshot kind/version;
- reason code;
- protocol ID/version;
- source-set ID/fingerprint;
- domain key where relevant.

Exclude:

- raw video;
- landmarks;
- frames;
- free-text health notes;
- auth data;
- full profile payload;
- source document text;
- provider secrets.

Pure helpers do not log.

# PART P — REQUIRED TEST MATRIX

## A. Version/type separation

- V1 snapshot parses as V1 only.
- V2 snapshot parses as V2 only.
- unknown kind.
- future V2 schema.
- missing kind/version.
- no V1 regression.

## B. Official eligibility

- baseline.
- baseline retake.
- official retest.
- manual extra.
- quick/manual.
- micro-check.
- legacy.
- V1 protocol.
- partial V2.
- duplicate headline movement.
- missing chair.
- missing balance.
- missing shoulder.
- missing reference profile still eligible.
- chair transform disabled still eligible.

## C. Source Check-Up fingerprint

- deterministic.
- result order independent.
- changed raw metric changes fingerprint.
- changed selected leg/side changes fingerprint.
- changed protocol evidence changes fingerprint.
- duplicate ID fail closed.
- JSON round-trip.
- no unrelated mutable field effect.

## D. Snapshot creation

- fully reference-eligible V2 snapshot.
- mixed raw-only/reference-eligible domains.
- all raw-only but raw complete.
- explicit unknown profile.
- deterministic ID.
- deterministic fingerprint.
- explicit createdAt.
- no ambient clock.
- default no chair provider.
- test-only approved fake chair provider.
- no focus/block/report fields.

## E. Parser/cross-field validation

- exact valid snapshot.
- bad fingerprint.
- bad source ID.
- bad source fingerprint.
- bad reference-profile fingerprint.
- bad engine/source-set metadata.
- chair disabled plus percentile conflict.
- balance band mismatch.
- balance benchmark mismatch.
- shoulder category mismatch.
- non-finite numeric.
- unknown result kind.
- future schema.

## F. Attachment immutability

- attach once.
- identical reattach idempotent.
- different fingerprint conflict.
- wrong source rejected.
- different snapshot ID rejected.
- existing frozen snapshot preserved.

## G. Local serialization/history

- V2 raw + snapshot round-trip.
- raw V2 + malformed snapshot restores raw only.
- V1 round-trip unchanged.
- old record without V2 field.
- latest official selector.
- source mismatch excluded.
- deterministic ordering.

## H. Backend sync

- V2 snapshot sanitized.
- V2 raw without snapshot.
- malformed snapshot omitted.
- no V1 derived age fields for V2.
- V1 sync unchanged.
- no source docs/secrets/frames.

## I. Backend restore

- valid V2 restore.
- missing snapshot.
- malformed snapshot.
- source mismatch.
- future schema.
- duplicate identical.
- local valid plus remote missing.
- local/remote conflicting fingerprint.
- no recomputation.
- raw preserved.

## J. Compatibility

- V1/V2 incompatible.
- same-policy V2 compatible.
- changed balance leg.
- changed shoulder side.
- protocol version mismatch.
- source/display policy mismatch.
- raw versus reference comparability.
- no change interpretation.

## K. Containment

- no V1 scoring.
- no MovementAssessment.
- no MovementBlock.
- no report.
- no UI imports.
- no public V2 route.
- no suggested focus.

## L. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 2A.1;
- Stage 3B/3C/3D;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- canonical tab order;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise production builder/parser/sanitizers;
- use real V2 Check-Up and interpretation types;
- use deterministic IDs/timestamps;
- assert full source binding;
- assert no recomputation on restore;
- assert immutable conflict behavior;
- assert V1 containment;
- assert JSON-safe output;
- fail if chair reference becomes enabled by default;
- fail if suggested focus appears.

Tests must not:

- mock every layer;
- assert only helper calls;
- use real network;
- use camera hardware;
- install packages;
- embed Warden workbook data;
- modify UI snapshots;
- weaken V1 expectations;
- depend on wall-clock sleeps.

# PART Q — VALIDATION COMMANDS

Run targeted tests for:

- V2 snapshot versions;
- V2 eligibility;
- V2 source binding;
- snapshot builder/parser;
- local history serialization;
- check-up backend sync;
- restore;
- compatibility;
- Stage 3D-B.2A;
- Stage 3D-B.2B;
- V1 snapshot/scoring containment;
- Stage 4 closure;
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

Also run:

```bash
rm -rf /tmp/hale-stage3db2c-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2c-export
rc=$?
rm -rf /tmp/hale-stage3db2c-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- audio verification counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- git diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART R — MANUAL SOURCE TRACE AFTER TESTS

Retrace:

### Official V2 snapshot creation

```text
official complete V2 Check-Up
-> normalized explicit reference profile
-> Stage 3D-B.2B interpretation
-> source Check-Up fingerprint
-> immutable V2 snapshot
```

### Raw-only chair

Confirm chair remains raw-only with disabled transform.

### Local round-trip

```text
V2 Check-Up + snapshot
-> serialize
-> deserialize
-> same IDs/fingerprints/content
```

### Backend round-trip

```text
V2 Check-Up + snapshot
-> sanitized sync payload
-> remote row
-> restore
-> parsed snapshot
```

Confirm no reference-engine invocation on restore.

### Conflict

Confirm existing frozen snapshot is preserved.

### Legacy

Confirm V1 snapshot and history remain unchanged.

### Containment

Confirm no assessment, block, report, focus, or UI path.

# PART S — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product policies implemented.
3. Initial Git status.
4. Existing V1 snapshot architecture.
5. Existing V2 protocol/reference contracts.
6. V2 snapshot version architecture.
7. V2 snapshot schema.
8. Snapshot ID/fingerprint policy.
9. Source Check-Up fingerprint.
10. Official V2 eligibility.
11. Reference-profile freezing.
12. Snapshot builder.
13. Chair raw-only containment.
14. Strict parser/cross-field validation.
15. Attachment immutability/conflict policy.
16. Local serialization/history.
17. Backend sync.
18. Backend restore.
19. Duplicate/conflict resolution.
20. Export/account-data behavior.
21. V1/V2 compatibility policy.
22. V1/UI/focus/block/report containment.
23. Payload/observability safety.
24. Files changed.
25. Tests added/changed.
26. Exact targeted validation.
27. Exact full validation.
28. Audio verification.
29. App/website typechecks.
30. Expo config/export.
31. Stage 2A.1/3/4/5 regression verification.
32. Remaining Stage 3D-B work.
33. Whether Stage 3D-B.2D is unblocked.
34. Initial and final Git status.
35. Complete files-changed inventory.
36. Concurrent external changes.
37. Confirmation that no package install, lockfile change, source workbook/PDF commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2C:

1. V1 and V2 snapshots are separate types.
2. V1 snapshot behavior is unchanged.
3. One official V2 Check-Up has one stable V2 snapshot ID.
4. V2 snapshot creation requires official complete V2 raw evidence.
5. Missing age/reference sex does not block snapshot creation.
6. Chair transform disabled does not block snapshot creation.
7. Manual/quick/micro/legacy/partial sources cannot create official V2 snapshots.
8. V2 snapshot is bound to exact source Check-Up ID and fingerprint.
9. Snapshot stores normalized reference profile used by the engine.
10. Snapshot stores engine/source-set identity.
11. Snapshot stores complete structured interpretation.
12. Snapshot stores display-policy version.
13. Snapshot contains no suggested focus.
14. Snapshot contains no Movement Age.
15. Snapshot contains no block/report.
16. Snapshot ID is deterministic.
17. Snapshot fingerprint is deterministic.
18. Builder uses no ambient clock.
19. Parser rejects malformed/future snapshots.
20. Parser validates domain cross-field consistency.
21. Existing snapshot is immutable.
22. Conflicting same-ID snapshot cannot overwrite.
23. Local serialization round-trips V2 snapshot.
24. Backend sync preserves V2 snapshot safely.
25. V2 sync does not populate V1 derived-age fields.
26. Restore parses and never recomputes V2 snapshot.
27. Missing/malformed remote snapshot preserves raw V2 Check-Up.
28. Source mismatch fails closed.
29. Duplicate identical snapshots dedupe.
30. Local/remote conflict is surfaced and deterministic.
31. V1/V2 longitudinal comparison is incompatible.
32. Changed leg/side is marked per-domain non-comparable.
33. No improvement/decline calculation exists.
34. V2 still cannot enter V1 scoring.
35. V2 still cannot create MovementAssessment.
36. V2 still cannot create MovementBlock/report.
37. Public/default Check-Up remains V1.
38. No UI/profile/reference-sex onboarding is added.
39. Safety audio remains 44 cues / 88 assets.
40. Stage 4/5 contracts remain green.
41. No source PDF/workbook data is added.
42. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2C complete unless:

1. One strict V2 snapshot schema exists.

2. Official snapshot eligibility is exact and fail-closed.

3. Source Check-Up binding is deterministic.

4. Reference-profile input is frozen.

5. Stage 3D-B.2B interpretation is frozen without recomputation.

6. Snapshot ID/fingerprint behavior is deterministic.

7. Attachment is immutable and conflict-protected.

8. Local serialization/history work.

9. Backend sync/restore work.

10. Raw V2 Check-Up survives missing/malformed snapshot.

11. V1 remains unchanged.

12. V1/V2 compatibility helper exists without change claims.

13. No focus/block/report/UI integration exists.

14. Targeted tests pass.

15. Full Jest passes.

16. `npm run verify:audio` passes.

17. App typecheck passes.

18. Website typecheck passes.

19. Expo config passes.

20. Expo export passes.

21. `git diff --check` passes.

22. No new warning is introduced without explanation.

23. No unrelated user work is reverted or overwritten.

24. No package install or lockfile change occurs.

25. No source PDF/workbook is committed.

26. No staging, commit, branch, or push occurs.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2C COMPLETE`
- `STAGE 3D-B.2C BLOCKED`

Also state one for each:

- `V2 SNAPSHOT CONTRACT IMPLEMENTED`
- `V2 SNAPSHOT CONTRACT BLOCKED`

- `V2 LOCAL PERSISTENCE IMPLEMENTED`
- `V2 LOCAL PERSISTENCE BLOCKED`

- `V2 BACKEND SYNC/RESTORE IMPLEMENTED`
- `V2 BACKEND SYNC/RESTORE BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2D UNBLOCKED`
- `STAGE 3D-B.2D BLOCKED`

Use `STAGE 3D-B.2D UNBLOCKED` only if:

- official V2 snapshots are immutable;
- source binding is verified;
- local/backend round-trips are deterministic;
- legacy V1 remains intact;
- no recomputation occurs;
- UI/focus/block boundaries remain contained.

Also state:

- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION`
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`
- `NO SUGGESTED-FOCUS IMPLEMENTATION`
- `NO V2 MOVEMENTASSESSMENT OR MOVEMENTBLOCK`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Hale beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- V2 snapshot schema/version.
- Snapshot ID/fingerprint behavior.
- Official eligibility behavior.
- Source Check-Up binding.
- Reference-profile freezing.
- Chair raw-only containment.
- Local persistence result.
- Backend sync result.
- Backend restore result.
- Duplicate/conflict policy.
- V1/V2 compatibility result.
- V1/UI/focus/block/report containment.
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
- Confirmation that Stage 3D-B.2A, Stage 3D-B.2B, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2C COMPLETE` or blocked.
- V2 snapshot verdict.
- Local persistence verdict.
- Backend sync/restore verdict.
- `STAGE 3D-B.2D UNBLOCKED` or blocked.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION`.
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`.
- `NO SUGGESTED-FOCUS IMPLEMENTATION`.
- `NO V2 MOVEMENTASSESSMENT OR MOVEMENTBLOCK`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
