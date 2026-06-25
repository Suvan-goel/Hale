# Codex Prompt: Hale Measurement-Side Persistence and Protocol Metadata

Read this entire prompt before changing anything.

Hale’s Movement Profile V2 (`MPV2`) voice runtime is now complete at the static/runtime level.

Verified current state:

- MPV2 voice completion gates pass
- 77 canonical scenarios
- 462 simulated variants
- 654 timeline rows
- P0/P1/P2/P3: `0 / 0 / 0 / 1`
- No partial-attempt resume after tracking loss
- No duplicate tracking-loss cue within one recovery episode
- Every recovered attempt uses a fresh start sequence
- No mixed Clara/Marcus critical sequence
- No old-channel callback affecting the current stage
- No shoulder-side change during recovery or mounted voice switching
- Physical speaker-onset QA remains intentionally deferred until the end of the entire voice project

The exact next broader implementation phase is:

```text
Measurement-side persistence and protocol metadata
```

This task implements approved founder decision `FD-002`:

```text
Use a reliably measurable, comfortable side at baseline.
Persist that exact side.
Use the same side for official retests.
If the opposite side must be used, mark reduced comparability.
Legacy results with unknown side remain raw-only.
```

This phase creates the data and runtime contract needed by:

- the future approved eyes-open balance protocol,
- final Movement Check-Up voice scripts,
- side-aware micro checks,
- progress history,
- sync/restore,
- and truthful longitudinal comparison.

Do not implement the eyes-open balance ladder itself in this task.

---

# 1. Source artifacts

Read and use:

## MPV2 completion

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
- `docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md`
- `docs/audits/HALE_MPV2_VOICE_COMPLETION_IMPLEMENTATION.md`, if present
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.json`, if present
- `docs/audits/HALE_MPV2_POST_COMPLETION_TIMELINES.csv`, if present
- `docs/audits/HALE_MPV2_POST_COMPLETION_FINDINGS.csv`, if present
- the current MPV2 runtime, coordinator, recovery, and voice tests

## Approved product decision

- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`

## Current implementation evidence

- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- `src/checkup/protocolSetup.ts`, if present
- current check-up result types and persistence
- current MPV2 chair, balance, shoulder, and hinge movement implementations
- current micro-check implementation
- current local serialization, history, sync, and restore code

The V2.1 policy to implement is:

```text
Baseline:
Select or confirm the comfortable side that is reliably measurable.

Official retest:
Use the persisted official side.

Opposite-side fallback:
Allowed only after explicit user action and marked reduced comparability.

Manual extra check:
May use another side, but must not overwrite the official side anchor.

Micro check:
Use the official side where the micro-check metric is intended to be longitudinally comparable.

Legacy:
Unknown side remains side_unknown_raw_only.
Do not infer or fabricate side from old records.
```

The listening-review waiver remains in effect and is unrelated to this metadata task:

```text
Founder listening status: waived_assumed_pass_by_founder.
Human verified: false.
```

Do not generate audio.

---

# 2. Objective

Implement one canonical measurement-context system that guarantees:

1. Every new check-up and micro-check result records its exact protocol identity.
2. Every side-dependent result records the semantic side used.
3. Official baseline side becomes the side anchor for that metric and protocol series.
4. Official retests preload and use the same side.
5. Retry, recovery, app restart, sync, and restore preserve the selected side.
6. The spoken side, visible side, controller side, and grader-observed side cannot disagree silently.
7. An opposite-side fallback is explicit and marked reduced comparability.
8. Opposite-side fallback does not overwrite the original official side anchor.
9. Manual checks do not overwrite official side metadata.
10. Comparable micro checks use the appropriate official side without claiming equivalence to a different protocol.
11. Legacy unknown-side records remain valid raw history but are never silently treated as same-side comparable.
12. Results from different protocol ids or versions are not silently placed in one trend series.
13. Current scores/bands may still be shown when valid, but change/improvement claims are suppressed when comparability is insufficient.
14. The future eyes-open balance protocol can be introduced by registering a new protocol id/version without redesigning this metadata system.
15. MPV2 voice-runtime completion gates remain unchanged.
16. No audio assets are added, changed, or generated.

---

# 3. Strict scope

## In scope

- Canonical protocol metadata types.
- Canonical measurement-side metadata types.
- A central protocol registry.
- Check-up-level and item-level protocol identity.
- Side-role semantics.
- Official side-anchor selection.
- Baseline, baseline-retake, official-retest, manual, and micro-check policies.
- MPV2 setup preloading and confirmation.
- Side-consistency guards between UI, voice cue selection, controller, and grader output.
- Additive result-schema changes.
- Local persistence and serialization.
- Restore and backend sync.
- History/trend comparability.
- Legacy compatibility.
- Data migration/defaulting.
- Focused UI copy required to select or confirm side.
- Tests and an implementation audit.
- A handoff for the next eyes-open balance protocol phase.

## Out of scope

Do not implement in this task:

- The new eyes-open four-stage balance protocol.
- New balance stages.
- Removal of current MPV2 single-leg balance.
- Training both-sides rounds.
- Step-up alternation.
- Floor-transfer readiness.
- Training Voice V2.1.
- Micro-check Voice V2.1 copy overhaul.
- Safety-family consolidation.
- New voice cues.
- Audio generation.
- ElevenLabs calls.
- Human listening review.
- Physical-device QA.
- Medical or normative scoring changes.
- New movement-age claims.
- Destructive database migrations.
- Retroactive inference of side from old videos, landmarks, voice text, or filenames.
- Rewriting old result values.

This task may make current micro-check storage side-aware, but it must not perform the later full micro-check voice redesign.

---

# 4. Worktree safety

The repository is already heavily dirty and contains important uncommitted work.

Before editing:

- Record branch, full/short `HEAD`, upstream, and `git status --short --branch`.
- Identify pre-existing relevant changes.
- Do not reset, checkout, stash, clean, or overwrite unrelated work.
- Do not delete untracked MP3s, audits, specs, or MPV2 files.
- Do not regenerate audio manifests wholesale.
- Do not commit or push.
- Modify only files needed for this phase and its tests/reports.

At the end:

- distinguish pre-existing changes from this task,
- confirm no audio changed,
- confirm no unrelated work was overwritten.

---

# 5. Current source to inspect

At minimum inspect current versions of:

## Check-up and MPV2

- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- `src/checkup/protocolSetup.ts`, if present
- `src/checkup/checkup.ts`
- all check-up result/envelope types
- all check-up serializers
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/voiceRuntime.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2ResultsScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`

## Movement implementations

- current chair-rise/chair-stand MPV2 movement
- current single-leg balance MPV2 movement
- current active shoulder reach MPV2 movement
- current hinge reach movement
- legacy shoulder, hinge, and balance movements
- relevant graders and side-chain selection helpers

## Micro checks

- `src/training/microCheck.ts`
- `src/haleFlow/microCheck.ts`
- `src/screens/MicroCheckScreen.tsx`
- micro-check result and history models

## Persistence and history

- check-up/local stores
- `src/training/serialize.ts`
- any check-up serialization/version file
- `src/history/trends.ts`
- `src/haleFlow/progressViewModel.ts`
- `src/haleFlow/reports.ts`
- block reports
- progress/history selectors
- onboarding result processing
- scoring result envelopes

## Backend

Inspect all relevant files, including likely:

- movement check-up sync service
- micro-check sync service
- restore service
- account data service
- data export service
- Supabase row mappings
- database migrations/schema, if tracked

Search broadly for:

```text
selectedSide
standingLeg
extendedLeg
nearSide
reliableSide
left
right
protocolId
protocolVersion
movement_checkups
micro_check
restore
serialize
history
trend
comparability
baseline
official_retest
baseline_retake
manual
quick
```

Follow actual call paths. Do not assume file names from this prompt exist unchanged.

---

# 6. Separate four concepts

Do not collapse these into one `side` string.

The implementation must distinguish:

1. **Selected measurement side**
   - The side intentionally chosen for longitudinal consistency.
   - Examples: measured arm, standing leg, extended leg.

2. **Observed side**
   - The body side actually used by the grader/near-camera chain.
   - This may be different from the selected side if setup is wrong.

3. **Side role**
   - The semantic meaning of the side.
   - Examples: measured arm, standing leg, extended leg, near-camera side.

4. **Protocol identity**
   - The measurement procedure and version.
   - This determines whether values belong in the same comparison series.

Chair stand may have an observed near side for pose reliability while remaining side-independent as a measurement.

Do not mark chair stand as left- or right-side comparable merely because one pose chain was used.

---

# 7. Canonical types

Create a small central module using repository naming conventions.

A suitable conceptual model is:

```ts
export type BodySide = 'left' | 'right';

export type MeasurementSideRole =
  | 'measured_arm'
  | 'standing_leg'
  | 'extended_leg'
  | 'near_camera_side'
  | 'lead_foot'
  | 'not_applicable';

export type MeasurementSideSource =
  | 'baseline_user_confirmed'
  | 'baseline_recommended_user_confirmed'
  | 'official_retest_anchor'
  | 'baseline_retake_anchor'
  | 'manual_user_selected'
  | 'microcheck_official_anchor'
  | 'opposite_side_fallback'
  | 'legacy_unknown'
  | 'not_applicable';

export type SideComparabilityStatus =
  | 'establishes_side_baseline'
  | 'same_side_comparable'
  | 'opposite_side_reduced_comparability'
  | 'side_unknown_raw_only'
  | 'not_side_dependent';

export type ProtocolComparabilityStatus =
  | 'establishes_protocol_baseline'
  | 'same_protocol_comparable'
  | 'different_protocol_raw_only'
  | 'protocol_unknown_raw_only';

export type OverallComparabilityStatus =
  | 'comparable'
  | 'reduced_comparability'
  | 'raw_only'
  | 'establishes_new_baseline'
  | 'not_applicable';
```

A suitable result payload is:

```ts
interface MeasurementProtocolRef {
  protocolId: string;
  protocolVersion: number;
  protocolVariant?: string;
}

interface MeasurementSideContext {
  role: MeasurementSideRole;
  selectedSide: BodySide | null;
  observedSide: BodySide | null;
  source: MeasurementSideSource;
  userConfirmed: boolean;
  anchorResultId: string | null;
  anchorSide: BodySide | null;
}

interface MeasurementComparability {
  sideStatus: SideComparabilityStatus;
  protocolStatus: ProtocolComparabilityStatus;
  overallStatus: OverallComparabilityStatus;
  referenceResultId: string | null;
  reasonCodes: string[];
}

interface MeasurementContext {
  protocol: MeasurementProtocolRef;
  side: MeasurementSideContext;
  comparability: MeasurementComparability;
}
```

Equivalent names are acceptable.

## Requirements

- Keep the model compact.
- Use strict unions rather than arbitrary strings.
- Do not duplicate existing equivalent repository types.
- Extend current types where safe.
- Use nullable values only where absence has clear meaning.
- Do not use `any`.
- Do not encode side semantics only in free-text notes.
- Keep JSON serialization stable.
- Add a schema/version field if the existing envelope requires one.

---

# 8. Protocol registry

Create one central registry for current measurement protocols.

Each descriptor should include, where applicable:

```ts
interface MeasurementProtocolDescriptor {
  protocolId: string;
  protocolVersion: number;
  movementId: string;
  metricIds: string[];
  sideRole: MeasurementSideRole;
  sideRequired: boolean;
  officialEvidenceEligible: boolean;
  comparisonGroup: string;
  legacyAliases?: string[];
}
```

## Required current coverage

Independently derive stable ids from current source for:

### MPV2

- chair stand / chair rise
- current MPV2 single-leg balance attempt protocol
- current MPV2 active shoulder reach
- current MPV2 hinge reach
- current MPV2 battery/check-up envelope

### Micro checks

- chair-power micro check
- single-leg balance micro check
- mobility/hamstring reach micro check

### Legacy or conditional

- legacy default check-up movements where records still exist
- TUG beta/custom protocol
- any quick/manual check protocol that persists results

## Important rules

- Protocol ids describe the actual current procedure, not the future desired procedure.
- Do not label the current MPV2 single-leg multi-attempt balance flow as the future four-stage eyes-open balance protocol.
- Do not activate `home_balance_eyes_open_v2` or equivalent in this task.
- Reserve future extensibility through the registry shape, not by pretending future code exists.
- Protocol versions are positive integers for known current protocols.
- Legacy unknown protocol records use an explicit unknown/raw-only representation.
- Protocol id/version is pinned when the attempt is created.
- Old results must render from their stored protocol metadata, not from the app’s current registry default.
- If the repository already has version fields, integrate them rather than creating conflicting version systems.
- Keep check-up/battery protocol identity separate from per-measurement protocol identity where both are useful.

---

# 9. Side semantics by current measurement

Independently verify and document the exact current semantics.

## Chair stand / chair power

- Measurement is functionally bilateral.
- Side role for longitudinal comparison: `not_applicable`.
- A grader-selected near side may be recorded as `observedSide` for diagnostics only.
- It must not create a left/right comparison series.
- Side mismatch must not invalidate an otherwise valid chair result.

## Current MPV2 single-leg balance

- Side role: `standing_leg`.
- The selected standing leg must be explicit.
- The grader/attempt state must confirm the same standing leg.
- Retry and recovery preserve the selected standing leg.
- An official retest preloads the official standing-leg anchor.
- Opposite-leg fallback is reduced comparability and does not replace the anchor.

## Active shoulder reach

- Side role: `measured_arm`.
- The selected side must be the side instructed by voice/UI.
- The selected side must be positioned as required relative to the phone.
- The grader-observed side must match the selected side.
- A mismatch must not silently produce an official comparable result.
- Retry, recovery, and voice switching preserve side.

## Hinge reach

Inspect the current grader carefully.

If the metric is derived from a selected near-side body chain:

- side role should reflect the actual semantic contract,
- selected camera-facing side must be persisted,
- observed side must match selected side for official comparability.

If side is only an implementation detail and the metric is genuinely side-independent:

- store observed side for diagnostics,
- mark the measurement side as not side-dependent,
- justify this with code and metric evidence.

Do not assume either conclusion.

## Single-leg micro check

- Side role: `standing_leg`.
- Use the official balance side when the micro check is intended to form a comparable micro-check series.
- Micro-check protocol remains distinct from official check-up protocol.
- Do not compare raw micro-check values directly to a different official protocol merely because side matches.

## Mobility/hamstring reach micro check

- Side role: `extended_leg`.
- Persist the extended leg.
- Ensure visible instruction, grader, and result agree.
- Use the relevant official side anchor only if the product metric is intended to align with that official side.
- Keep protocol identity distinct.

## TUG

- Side role: `not_applicable`.
- Preserve standard-path/short-path or other protocol variant metadata.
- Do not create side-comparison semantics.

---

# 10. Single source of truth for official side

Avoid two conflicting mutable stores.

Preferred policy:

```text
The official side anchor is derived from the latest valid official evidence
for the same metric/comparison group and protocol series.
```

Official evidence should follow the repository’s current official-evidence policy.

At minimum inspect the existing distinction among:

- baseline
- baseline_retake
- official_retest
- manual extra check
- quick check
- micro check
- legacy/imported records

## Requirements

- Only valid official evidence can establish an official side anchor.
- Invalid, skipped, partial, or failed measurements do not establish or change the anchor.
- Manual checks do not change it.
- Micro checks do not change it.
- Opposite-side official fallback does not silently change it.
- A valid baseline retake may replace the baseline anchor only according to existing baseline-retake policy.
- If no side-known official anchor exists, the next valid side-known official result establishes one.
- If the previous official result has unknown legacy side, the first side-known result starts a new side-comparison baseline.
- If a cache is added for performance, it must be derived/rebuildable from canonical results.
- Do not create a second profile preference unless the existing architecture genuinely requires it.
- If a separate anchor record is required, define exact authority, rebuild, sync, and conflict rules.

Create pure selectors such as:

```ts
findOfficialMeasurementAnchor(...)
deriveOfficialMeasurementSide(...)
```

Equivalent naming is acceptable.

---

# 11. Baseline and retest user flow

## 11.1 First side-dependent official baseline

When no official side anchor exists:

1. Determine which side or sides currently meet measurement readiness.
2. Ask the user to choose or confirm the comfortable side.
3. A reliable side may be recommended only from existing readiness evidence.
4. Do not invent a new opaque “side quality score.”
5. If only one side is reliably measurable, recommend it but still require user confirmation of comfort.
6. If neither side is reliable, do not proceed.
7. Pin the side to the attempt before required voice/setup guidance begins.
8. Persist the side only after a valid result is accepted.

## 11.2 Official retest

When an official anchor exists:

1. Preload the anchor side.
2. Show concise visual context such as:
   - `We’ll use your left side again for a fair comparison.`
3. Use matching side-specific voice where current assets exist.
4. Keep the same side through setup, countdown, active measurement, retry, and recovery.
5. Do not allow an automatic grader-side switch.

## 11.3 Opposite-side fallback

Provide an explicit secondary action only when necessary:

```text
Use the other side for this check
```

Before accepting, show calm copy:

```text
This result may not be directly comparable with your earlier checks.
```

On fallback:

- set source to `opposite_side_fallback`,
- preserve the original anchor side,
- mark reduced comparability,
- save the actual side used,
- do not make improvement/decline claims against the anchor result,
- do not replace the anchor.

Do not use fear or medical language.

## 11.4 Manual extra check

- May choose either side.
- Save actual protocol and side.
- Never replace the official anchor.
- Mark comparability honestly.
- Manual checks remain manual/non-official under the existing evidence policy.

---

# 12. Attempt pinning and runtime consistency

At attempt creation, pin:

- protocol id,
- protocol version,
- protocol variant,
- selected side,
- side role,
- side source,
- anchor result id,
- anchor side,
- check-up kind,
- attempt id.

These values must not be recomputed from latest settings midway through an attempt.

## Runtime invariants

The following must be impossible:

```text
voice says left while controller uses right
UI shows left while grader scores right
retry switches side silently
tracking recovery switches side silently
mounted voice change alters selected side
restore resumes an attempt with a different side
result protocol version differs from attempt protocol version
history derives protocol from current app instead of stored result
```

## Side mismatch policy

For side-dependent official measurements:

- if observed side does not match selected side, do not silently accept a comparable result;
- return to setup/recovery or mark the attempt invalid according to current movement semantics;
- provide visible correction;
- use existing voice assets only;
- do not generate new audio.

For side-independent measurements:

- observed side mismatch is diagnostic only.

---

# 13. Voice integration

Do not add or generate voice assets.

Use current assets where they already support the selected side.

## Shoulder

Current left/right turn and raise cues must be selected from the pinned side.

Verify:

- visual side,
- turn cue,
- raise cue,
- coordinator side,
- grader side,
- saved result side

all agree.

## Balance

If current cue says “selected leg,” the selected leg must be visible and pinned before the cue.

Do not hard-code left.

## Hinge and mobility

Where no side-specific recording exists:

- use truthful generic existing audio,
- show selected-side visual setup,
- persist the side,
- record any remaining voice-first gap for the final asset-generation phase.

Do not fake a side-specific spoken instruction.

## Retry/recovery

- Preserve pinned side.
- Replay current required side-aware setup.
- Never choose a new side automatically.

---

# 14. Comparability engine

Create pure, centrally tested comparability logic.

A suitable conceptual API is:

```ts
deriveMeasurementComparability({
  currentResult,
  referenceResult,
  protocolRegistry,
}): MeasurementComparability
```

## Required rules

### No prior comparable result

- Current valid side-known result establishes new side/protocol baseline.
- `overallStatus = establishes_new_baseline`.

### Same protocol and same required side

- `sideStatus = same_side_comparable`
- `protocolStatus = same_protocol_comparable`
- `overallStatus = comparable`

### Same protocol and opposite side

- `sideStatus = opposite_side_reduced_comparability`
- `overallStatus = reduced_comparability`

### Side required but current or reference side unknown

- `sideStatus = side_unknown_raw_only`
- `overallStatus = raw_only`

### Different protocol id or version

- `protocolStatus = different_protocol_raw_only`
- `overallStatus = raw_only` or `establishes_new_baseline` when this is the first result in the new protocol series.

### Side-independent metric

- `sideStatus = not_side_dependent`
- Protocol still determines trend comparability.

### Invalid result

- Invalid/failed result is never a comparison reference.

## Reason codes

Use stable reason codes, for example:

```text
NO_REFERENCE
SAME_PROTOCOL
DIFFERENT_PROTOCOL
SAME_SIDE
OPPOSITE_SIDE
CURRENT_SIDE_UNKNOWN
REFERENCE_SIDE_UNKNOWN
SIDE_NOT_APPLICABLE
MANUAL_NON_OFFICIAL
MICROCHECK_DISTINCT_PROTOCOL
INVALID_REFERENCE
```

Do not use user-facing sentences as logic keys.

---

# 15. Comparison series

Prevent silent cross-protocol or cross-side trend mixing.

Create a stable series identity derived from:

- metric/comparison group,
- protocol id,
- protocol version,
- side role,
- anchor side where side-dependent.

A suitable pure value is:

```text
<comparisonGroup>|<protocolId>|v<protocolVersion>|<sideRole>|<side-or-na>
```

Do not include user ids in the series key.

## Rules

- Same protocol + same side belongs to one comparable series.
- Opposite-side fallback is stored but does not silently join the anchor-side series as comparable.
- Different protocol version starts a different series.
- Micro-check series remain separate from official check-up series unless product logic explicitly defines equivalence.
- Legacy unknown-side records remain raw-only and outside a same-side series.
- Current/latest result can still display even when it is not part of a comparable trend series.

---

# 16. Result schema and serialization

Add metadata additively.

Do not destructively rewrite existing result objects.

## Requirements

- Every newly saved result includes protocol metadata.
- Every newly saved side-dependent result includes side metadata.
- Every result includes derived or reproducible comparability metadata.
- Store stable ids, not display labels.
- Store actual side used, not only requested side.
- Store reference/anchor result id where applicable.
- Preserve current raw metrics and supporting metrics unchanged.
- Preserve existing schema/version fields.
- Increment the relevant serialization schema version only if required.
- Add explicit parsers/defaults for older records.
- Malformed optional metadata must not crash history restore.
- Missing metadata defaults to unknown/raw-only, never comparable.
- Do not silently drop unknown future fields if current serialization preserves extensibility.

Create round-trip tests.

---

# 17. Local persistence, restore, and sync

Trace every path by which results are:

- saved locally,
- serialized,
- restored,
- synced to backend,
- restored from backend,
- exported,
- included in reports.

## Required behaviour

- Metadata survives app restart.
- Metadata survives sign-out/sign-in restore.
- Metadata survives backend round trip.
- Metadata survives offline completion followed by later sync.
- Conflict resolution does not overwrite a side-known result with an older side-unknown copy.
- Duplicate result handling preserves canonical metadata.
- Invalid enum values fail safely to unknown/raw-only.
- Older app records remain readable.
- Current app writes the new shape consistently.

## Backend approach

Inspect the actual Supabase schema.

Prefer:

- additive fields inside an existing versioned JSON payload when that is already the canonical result representation,

or:

- nullable additive columns only when repository architecture clearly requires queryable columns.

If a database migration is necessary:

- add a migration file,
- make it additive and nullable,
- do not execute remote migrations,
- document deployment order,
- preserve old clients.

Do not add columns merely because this prompt mentions them.

---

# 18. Official evidence and anchor selection

Integrate with the existing official evidence policy.

At minimum verify:

- baseline
- baseline_retake
- official_retest

against current evidence rules.

## Requirements

- Side anchor derives only from valid official evidence.
- A partial official check-up does not establish anchors for missing/invalid items.
- A valid item inside an otherwise partial check-up may establish an item anchor only if current official-evidence policy permits item-level official evidence; otherwise fail closed and document it.
- Manual, quick, micro, and legacy/imported results do not silently become official anchors.
- Baseline retake semantics remain consistent with existing logic.
- No change to scoring eligibility beyond metadata/comparability unless required to prevent a false trend claim.

Do not broaden official evidence policy in this task.

---

# 19. History, trends, progress, and reports

Update selectors and view models so metadata affects **change claims**, not valid current measurements.

## Current result

A valid current measurement may still display:

- raw metric,
- domain band,
- current result.

## Longitudinal claims

Only show direct change/improvement language when comparability is sufficient.

### Comparable

Normal trend/change display is allowed.

### Opposite side

Show raw values, but use calm copy such as:

```text
A different side was used, so compare these results with caution.
```

Do not calculate or narrate a definitive improvement/decline claim.

### Unknown legacy side

Show raw history with:

```text
Side was not recorded for this earlier check.
```

Do not treat it as same-side.

### Different protocol

Show:

```text
This check used a different protocol and starts a new comparison series.
```

Do not bridge score-change claims unless a validated mapping exists.

## Required surfaces to inspect

- Movement Profile results
- Progress screen
- domain trend cards
- block reports
- onboarding results
- official re-test summaries
- history selectors
- micro-check trend display
- backend-restored history

Keep copy concise and non-medical.

Do not create a large new UI redesign.

---

# 20. Legacy migration policy

Do not infer side retroactively.

## Legacy result defaults

Known protocol, side absent:

```text
sideStatus = side_unknown_raw_only
```

Unknown protocol:

```text
protocolStatus = protocol_unknown_raw_only
```

Both unknown:

```text
overallStatus = raw_only
```

## First new side-known result

When prior history is legacy unknown:

- save the new actual side,
- mark it as establishing a new side/protocol baseline,
- do not claim change from the unknown-side record,
- retain the old raw record.

## No destructive backfill

Do not:

- choose left as a default,
- infer from historical voice cues,
- infer from result sign,
- infer from device orientation alone,
- infer from missing setup state,
- overwrite legacy records.

---

# 21. Micro-check policy in this phase

Implement the metadata/side contract without redesigning all micro-check voice.

## Single-leg balance micro check

- Derive preferred standing leg from the current official balance anchor where applicable.
- Persist actual standing leg.
- Keep its micro-check protocol id/version distinct.
- Compare only within a compatible micro-check series.
- Do not overwrite official anchor.

## Mobility reach micro check

- Persist actual extended leg.
- Use an official side anchor only when the metric relation is explicitly supported by current product logic.
- Otherwise establish a micro-check-specific side baseline.
- Do not claim comparability to a different official metric/protocol.

## Chair power micro check

- Side-independent for comparison.
- Observed side may remain diagnostic only.

If exact relationship between an official metric and a micro-check metric is not encoded in current product logic, fail closed to a separate micro-check series rather than inventing equivalence.

---

# 22. Feature flag and rollout

Prefer additive schema support that is always readable.

Use a narrow internal feature flag only for new side-selection UI/runtime enforcement if needed.

A suitable name is:

```text
EXPO_PUBLIC_ENABLE_MEASUREMENT_SIDE_PERSISTENCE
```

Equivalent naming is acceptable.

## Requirements

- Metadata parsing remains enabled regardless of UI flag.
- When enforcement flag is off:
  - do not make same-side comparability claims unless stored evidence supports them.
- When on:
  - side-dependent official attempts require pinned side.
- Existing MPV2 voice foundation flag continues to work.
- Do not run two side-selection systems simultaneously.
- Document rollback.
- No public user can be left unable to access historical results because the flag is off.

---

# 23. Diagnostics

Add bounded, privacy-safe diagnostics for:

- protocol pinned,
- side recommended,
- side confirmed,
- anchor found/not found,
- fallback selected,
- selected/observed side mismatch,
- result saved,
- comparability derived,
- legacy raw-only default,
- sync round trip,
- restore defaulting,
- trend series selected.

Do not log:

- raw video,
- landmarks,
- account identifiers,
- user name,
- detailed health result values.

Use stable reason codes.

---

# 24. Required tests

Do not weaken or delete existing tests.

## 24.1 Protocol registry tests

1. Every current persisted measurement has a registered protocol.
2. Protocol ids are unique.
3. Versions are positive integers.
4. Comparison groups are stable.
5. Side-required protocols have a non-`not_applicable` side role.
6. Side-independent protocols do not create side series.
7. Current MPV2 balance is not mislabeled as the future eyes-open ladder.
8. TUG retains variant/path metadata.
9. Registry lookup fails safely for unknown legacy ids.

## 24.2 Comparability tests

1. No reference establishes new baseline.
2. Same protocol/same side is comparable.
3. Same protocol/opposite side is reduced.
4. Side unknown is raw-only.
5. Different protocol is raw-only/new series.
6. Side-independent same protocol is comparable.
7. Invalid result cannot be a reference.
8. Manual result does not become anchor.
9. Micro check does not overwrite official anchor.
10. Reason codes are deterministic.
11. Series key is stable.
12. Series key differs by protocol version.
13. Series key differs by required side.
14. Chair series does not differ by observed side.

## 24.3 Baseline/retest tests

1. First official side-dependent baseline requires confirmed side.
2. Valid baseline persists side.
3. Official retest preloads same side.
4. Retest cannot auto-switch side.
5. Opposite-side fallback requires explicit action.
6. Fallback is reduced comparability.
7. Fallback does not replace anchor.
8. Baseline retake follows current retake policy.
9. Invalid/failed attempt does not establish anchor.
10. Partial official evidence follows existing evidence policy.
11. Legacy unknown history causes new baseline rather than false trend.

## 24.4 Runtime consistency tests

1. Shoulder left UI selects left voice cues.
2. Shoulder right UI selects right voice cues.
3. Shoulder grader observed side matches selected side.
4. Shoulder mismatch fails closed to setup/retry.
5. Balance standing leg remains pinned through retry.
6. Balance standing leg remains pinned through tracking recovery.
7. Mounted Clara/Marcus switch does not change side.
8. Hinge selected/observed side policy matches implementation.
9. Attempt protocol metadata remains pinned through retry/recovery.
10. Stale callback cannot save a result with old side/protocol.
11. Voice says one side while grader uses another is impossible.

## 24.5 Persistence tests

1. New result round-trip locally.
2. Old result parses as unknown/raw-only.
3. App restart preserves metadata.
4. Backend sync preserves metadata.
5. Backend restore preserves metadata.
6. Offline-then-sync preserves metadata.
7. Malformed enum defaults safely.
8. Duplicate merge preserves richer side-known metadata.
9. Older side-unknown copy cannot overwrite newer side-known copy.
10. Data export includes metadata.
11. Account restore does not recalculate protocol from current app.

## 24.6 History tests

1. Same-side same-protocol trend is shown.
2. Opposite-side trend claim is suppressed.
3. Unknown-side trend claim is suppressed.
4. Different-protocol trend claim is suppressed.
5. Current valid score still displays.
6. First new protocol result starts new series.
7. First side-known result after legacy unknown starts new series.
8. Micro-check and official series remain distinct.
9. Block report does not claim improvement from raw-only comparison.
10. Progress view model exposes a concise comparability note.

## 24.7 MPV2 voice regression

Re-run the MPV2 post-completion tests and preserve:

- P0/P1/P2 static/runtime findings at zero, apart from deferred device-only P3.
- fresh countdown after recovery,
- no mixed voice sequence,
- no stale callback,
- selected shoulder side unchanged.

---

# 25. Implementation audit artifacts

Create:

1. `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_METADATA_IMPLEMENTATION.md`
2. `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.md`
3. `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.json`
4. `docs/audits/HALE_MEASUREMENT_PROTOCOL_COMPATIBILITY_MATRIX.csv`
5. `docs/audits/HALE_VOICE_PROJECT_POST_SIDE_PERSISTENCE_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-measurement-side-protocol.mjs`

Do not overwrite earlier MPV2 or voice audits.

## Compatibility matrix columns

Use columns similar to:

```text
flow,itemId,metricId,protocolId,protocolVersion,comparisonGroup,sideRole,sideRequired,officialEligible,baselineAnchorSource,retestRule,manualRule,microCheckRule,legacyRule,sameSideOutcome,oppositeSideOutcome,unknownSideOutcome,differentProtocolOutcome,currentRuntimeSupport,implementationStatus,notes
```

---

# 26. Implementation report structure

Use:

# Hale Measurement-Side Persistence and Protocol Metadata Implementation

## 1. Result

## 2. Approved FD-002 Contract

## 3. Canonical Types

## 4. Protocol Registry

## 5. Side Semantics by Measurement

## 6. Official Anchor Selection

## 7. Baseline and Retest Flow

## 8. Opposite-Side Fallback

## 9. Attempt Pinning and Runtime Guards

## 10. MPV2 Voice/Grader Side Consistency

## 11. Micro-Check Metadata

## 12. Serialization and Legacy Defaults

## 13. Backend Sync and Restore

## 14. History and Comparability

## 15. Feature Flag and Rollback

## 16. Diagnostics

## 17. Tests

## 18. Files Changed

## 19. Worktree Integrity

## 20. Exact Next Phase

---

# 27. Audit report requirements

The audit must report:

- number of registered protocols,
- number of side-required protocols,
- number of side-independent protocols,
- number of result types migrated,
- number of backend mappings changed,
- number of legacy/default parsers,
- number of history surfaces updated,
- number of official side-anchor scenarios,
- same-side comparable cases,
- reduced-comparability cases,
- raw-only cases,
- protocol-mismatch cases,
- selected/observed mismatch cases,
- false trend claims remaining,
- metadata round-trip failures,
- MPV2 voice-side mismatches,
- P0/P1/P2/P3 findings.

Issue one verdict:

- `SIDE_PROTOCOL_FOUNDATION_COMPLETE`
- `REMEDIATION_REQUIRED`
- `DATA_MIGRATION_REPAIR_REQUIRED`
- `CURRENT_SOURCE_REBASE_REQUIRED`

Do not choose complete if any false comparable trend remains.

---

# 28. Completion gates

Do not claim completion unless all of these pass.

## Data contract

- Every new persisted result has protocol id/version.
- Every side-dependent new result has selected side and side role.
- Actual observed side is retained where available.
- Unknown legacy side is not inferred.
- Current protocol is pinned at attempt creation.

## Official side

- First valid official result can establish anchor.
- Official retest preloads anchor.
- Retry/recovery preserves anchor.
- Opposite fallback is explicit.
- Opposite fallback does not replace anchor.
- Manual and micro checks do not replace anchor.

## Runtime consistency

- Voice/UI/controller/grader selected side mismatch: `0`
- Accepted official result with wrong observed side: `0`
- Side change during retry/recovery: `0`
- Protocol change during attempt: `0`
- Stale callback saving old side/protocol: `0`

## Comparability

- False same-side comparison: `0`
- False cross-protocol comparison: `0`
- Unknown legacy result treated comparable: `0`
- Opposite-side definitive improvement claim: `0`
- Different-protocol definitive improvement claim: `0`
- Side-independent chair result incorrectly split by side: `0`

## Persistence

- Local round-trip failures: `0`
- Backend round-trip failures: `0`
- Restore defaulting crashes: `0`
- Side-known metadata lost during merge: `0`

## Regression

- MPV2 voice completion P0/P1/P2 remains `0/0/0`
- Device-only P3 may remain deferred.
- No audio file changed.
- No audio generated.
- No external API called.

---

# 29. Next-phase handoff

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_SIDE_PERSISTENCE_HANDOFF.md`

It must identify the next task as:

```text
Approved eyes-open balance protocol V2 reconciliation
```

The handoff must include:

- current protocol-registry API,
- current side metadata API,
- how to register the new balance protocol,
- how new protocol results start a new series,
- how old MPV2 single-leg balance history remains preserved,
- how official standing-leg anchor should be reused,
- which voice cues already exist,
- which new voice assets remain ungenerated,
- tests the next phase must preserve.

Do not implement the new balance protocol in this task.

---

# 30. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites for:

- MPV2 coordinator/runtime/recovery
- check-up result types and serialization
- protocol evidence
- side policy
- micro checks
- history/trends/progress
- backend sync/restore
- any new protocol registry
- any new comparability engine

Run broader relevant tests where practical.

Run the audit-only harness.

Parse all generated JSON and CSV artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
```

Do not modify tests merely to make them pass.

---

# 31. Final Codex response

When finished, respond with:

- Summary of implementation
- Paths to all five audit/handoff artifacts
- All production files changed
- All test files changed/added
- Any audit-only harness added
- Confirmation that no audio changed or was generated
- Confirmation that no external API was called
- Confirmation that physical-device QA remains deferred
- Current branch and commit
- Whether the worktree was already dirty
- Protocol registry count
- Side-required protocol count
- Side-independent protocol count
- Result schema/version changes
- Official anchor source of truth
- Baseline side-selection behaviour
- Official retest behaviour
- Opposite-side fallback behaviour
- Manual-check behaviour
- Micro-check behaviour
- Legacy unknown-side behaviour
- Backend migration/schema changes, if any
- Local/backend round-trip results
- History/trend suppression rules
- Selected/observed side mismatch count
- False same-side comparison count
- False cross-protocol comparison count
- MPV2 voice-side mismatch count
- P0/P1/P2/P3 counts
- Verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused test results
- Exact next task from the handoff
- A concise confidence statement

Do not implement the eyes-open balance protocol, generate audio, or perform physical-device QA in this task.
