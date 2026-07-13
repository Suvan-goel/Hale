# Codex Prompt: Pearl Measurement-Side UX Completion Patch

Read this entire prompt before changing anything.

Pearl’s measurement-side and protocol-metadata foundation is implemented, but its latest audit returned:

```text
Verdict: REMEDIATION_REQUIRED
P0/P1/P2/P3: 0 / 0 / 2 / 1
```

The two open P2 findings are:

1. `MSP-P2-001`
   - Side-dependent micro checks do not yet have explicit side-aware UI.
   - Single-leg balance and mobility micro-check results therefore remain raw-only unless side metadata is supplied through another path.

2. `MSP-P2-002`
   - Opposite-side fallback is represented correctly in metadata, but official retests do not yet expose a dedicated user action and calm reduced-comparability warning.

The P3 finding is intentionally deferred:

- Physical Android/iOS QA remains deferred until the whole Pearl voice project is complete.

This task must close both P2 findings without implementing the next eyes-open balance protocol and without generating audio.

---

# 1. Source artifacts

Read and use:

## Measurement-side foundation

- `docs/audits/PEARL_MEASUREMENT_SIDE_PROTOCOL_METADATA_IMPLEMENTATION.md`
- `docs/audits/PEARL_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.md`
- `docs/audits/PEARL_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.json`
- `docs/audits/PEARL_MEASUREMENT_PROTOCOL_COMPATIBILITY_MATRIX.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_SIDE_PERSISTENCE_HANDOFF.md`
- `scripts/audits/audit-measurement-side-protocol.mjs`

The current foundation provides, among other things:

- `MeasurementContext`
- `MeasurementProtocolRef`
- `MeasurementSideContext`
- `MeasurementComparability`
- `normalizeCheckUpMeasurementMetadata(...)`
- `normalizeMicroCheckMeasurementMetadata(...)`
- `deriveMeasurementComparability(...)`
- `measurementSeriesKey(...)`
- `comparableMeasurementSeriesKey(...)`
- `findOfficialMeasurementAnchor(...)`
- `deriveOfficialMeasurementSide(...)`
- the central protocol registry in `src/checkup/measurementProtocolRegistry.ts`

Current counts:

- 14 registered protocols
- 6 side-required protocols
- 8 side-independent protocols
- selected/observed mismatch count: 0
- false same-side comparison count: 0
- false cross-protocol comparison count: 0
- MPV2 voice-side mismatch count: 0
- metadata round-trip failures: 0

## Approved product decision

- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`

Approved `FD-002` remains authoritative:

```text
At baseline, select or confirm a comfortable side that is reliably measurable.
Persist the exact side.
Use the same side for official retests.
If the opposite side must be used, mark reduced comparability.
Manual and micro checks do not replace the official side anchor.
Legacy unknown-side history remains raw-only.
```

## MPV2 voice/runtime regression baseline

- `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
- `docs/audits/PEARL_VOICE_PROJECT_POST_MPV2_HANDOFF.md`
- current MPV2 voice/runtime tests

Preserve:

```text
MPV2 static/runtime P0/P1/P2/P3: 0 / 0 / 0 / 1
```

The remaining P3 is physical-device-only and may remain deferred.

The listening review remains waived, not completed. Do not generate or change audio.

---

# 2. Objective

Implement the missing measurement-side user experience so that:

1. A side-dependent micro check always has an explicit, pinned semantic side before camera setup and active measurement.
2. When a compatible side anchor exists, Pearl recommends and preselects it.
3. When no suitable anchor exists, the user explicitly chooses left or right.
4. A first valid side-known micro check establishes that micro-check protocol’s own side baseline.
5. Later micro checks use the existing compatible micro-check side baseline.
6. A micro check never overwrites an official check-up side anchor.
7. A micro check never claims comparability merely because an unrelated official protocol used the same side.
8. Chair-power micro checks remain side-independent and do not show side-selection UI.
9. Official side-dependent retests expose a dedicated secondary action to use the other side.
10. The opposite-side action requires explicit confirmation.
11. The confirmation clearly states that direct comparison may be reduced.
12. The original official side anchor remains unchanged.
13. Retry, recovery, mounted voice switching, pause/resume, and app-state transitions preserve the pinned side.
14. Visible instruction, selected side, controller state, grader-observed side, saved result, and comparability status remain consistent.
15. The two open P2 findings close.
16. The post-patch audit verdict becomes:

```text
SIDE_PROTOCOL_FOUNDATION_COMPLETE
```

17. Physical-device QA remains deferred.
18. The next task remains the approved eyes-open balance protocol V2 reconciliation.

---

# 3. Strict scope

## In scope

- Side-selection UI for side-dependent micro checks.
- Side-source recommendation and preselection.
- Micro-check-specific side-anchor derivation.
- Explicit left/right choice when no anchor exists.
- Side-change warning for comparable micro-check series.
- Dedicated official-retest “use the other side” action.
- Calm reduced-comparability confirmation UI.
- Attempt-side pinning before setup/voice/grading.
- Result metadata and comparability verification.
- Result/history note for opposite-side fallback.
- Retry/recovery preservation.
- Accessibility and large-target UI suitable for Pearl’s 45–65 audience.
- Focused tests.
- Updated post-UX audit artifacts.
- Handoff for the next balance-protocol phase.

## Out of scope

Do not implement in this task:

- The approved four-stage eyes-open balance protocol.
- New balance stages.
- Removal of current MPV2 single-leg balance.
- New voice assets.
- Audio generation.
- ElevenLabs calls.
- Runtime TTS.
- Full micro-check voice V2.1 rewrite.
- Training Voice V2.1.
- Both-sides training rounds.
- Step-up alternation.
- Floor-transfer readiness.
- Safety-family consolidation.
- Scoring changes.
- Movement-age changes.
- Medical claims.
- Supabase schema migration unless the live repository proves it is absolutely necessary.
- Physical-device QA.
- Human listening review.
- Destructive legacy migration.
- Retroactive side inference.

Use existing audio only. A visible side cue is acceptable in this patch where no side-specific voice asset exists; record that remaining voice-first gap for the later micro-check voice phase.

---

# 4. Worktree safety

The repository is already dirty and contains important uncommitted work.

Before editing:

- Record branch, full/short `HEAD`, upstream, and `git status --short --branch`.
- Identify pre-existing relevant changes.
- Do not reset, checkout, stash, clean, or overwrite unrelated work.
- Do not delete untracked audio, audits, specs, or render work.
- Do not regenerate manifests wholesale.
- Do not commit or push.
- Change only files required for this patch, its tests, and its reports.

At the end:

- distinguish this task’s footprint from pre-existing changes,
- confirm no audio changed,
- confirm no unrelated file was overwritten.

---

# 5. Current source to inspect

At minimum inspect:

## Measurement metadata

- `src/checkup/measurementContext.ts`
- `src/checkup/measurementMetadata.ts`
- `src/checkup/measurementComparability.ts`
- `src/checkup/measurementProtocolRegistry.ts`
- `src/checkup/protocolSetup.ts`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/types.ts`
- `src/checkup/protocolEvidence.ts`

## MPV2 UI/runtime

- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/screens/MovementProfileV2ResultsScreen.tsx`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/voiceRuntime.ts`
- `src/movementProfileV2/recovery.ts`
- MPV2 internal-flow/setup types
- relevant movement graders

## Micro checks

- `src/training/microCheck.ts`
- `src/pearlFlow/microCheck.ts`
- `src/screens/MicroCheckScreen.tsx`
- micro-check result/history types
- micro-check selection/planning
- micro-check persistence and restore
- micro-check tests

## History/persistence

- `src/training/serialize.ts`
- `src/history/serialize.ts`
- `src/history/trends.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/pearlFlow/reports.ts`
- `src/services/backend/microCheckSyncService.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`
- relevant account export/restore logic

Search for:

```text
measurementContext
selectedSide
observedSide
standingLeg
extendedLeg
changedFromPrior
opposite_side_fallback
deriveOfficialMeasurementSide
findOfficialMeasurementAnchor
micro_single_leg_balance_v1
micro_mobility_reach_v1
MicroCheckScreen
official_retest
baseline_retake
manual
retry
recovery
```

Follow actual runtime and persistence call paths.

---

# 6. Do not create a second conflicting side system

The current `MeasurementContext` and anchor/comparability modules remain the source of truth.

Do not introduce an unrelated profile preference such as:

```text
preferredBalanceLeg
preferredMobilityLeg
```

unless the live architecture proves such a field already exists and is canonical.

Preferred rule:

```text
Official check-up anchor:
derived from valid side-known official evidence.

Micro-check side anchor:
derived from valid side-known results in the same micro-check protocol series.

First micro-check recommendation:
use a compatible official side anchor only when the product relationship is explicitly supported; otherwise ask the user.
```

A UI selection is provisional until a valid result is saved.

Do not write a permanent anchor merely because the user opened the screen or chose a side.

---

# 7. Canonical micro-check side-resolution helper

Create a pure helper using repository conventions.

A suitable conceptual shape is:

```ts
type MicroCheckSideRecommendationSource =
  | 'existing_microcheck_series'
  | 'compatible_official_anchor'
  | 'user_choice_required'
  | 'not_applicable';

interface MicroCheckSideSetup {
  sideRequired: boolean;
  role: MeasurementSideRole;
  selectedSide: BodySide | null;
  anchorSide: BodySide | null;
  anchorResultId: string | null;
  recommendationSource: MicroCheckSideRecommendationSource;
  establishesNewSeries: boolean;
  changeWouldReduceComparability: boolean;
  reasonCodes: string[];
}
```

A suitable API is:

```ts
deriveMicroCheckSideSetup({
  microCheckType,
  history,
  officialCheckUps,
  protocolRegistry,
}): MicroCheckSideSetup
```

Equivalent naming is acceptable.

## Required resolution order

For a side-dependent micro check:

1. Find a valid side-known result in the same micro-check protocol/comparison series.
2. If found, use that side as the micro-check series anchor.
3. Otherwise, determine whether the product explicitly supports seeding this micro-check from a compatible official side anchor.
4. If supported and available, recommend/preselect the official side.
5. Otherwise require explicit left/right user choice.
6. Pin the selected side to the attempt before setup begins.
7. Persist only after a valid result.

For side-independent micro checks:

- return `sideRequired = false`,
- return `role = not_applicable`,
- do not display side UI.

---

# 8. Micro-check policy by type

## 8.1 Chair power

Current protocol:

- `micro_chair_power_5_reps_v1`

Required behaviour:

- side-independent,
- no side selector,
- no left/right copy,
- observed pose side may remain diagnostic only,
- no side-specific series split.

## 8.2 Single-leg balance micro check

Current protocol:

- `micro_single_leg_balance_v1`

Side role:

- `standing_leg`

Required behaviour:

1. Prefer an existing valid side-known balance micro-check series anchor.
2. If none exists, a valid official balance standing-leg anchor may seed the initial recommendation.
3. If neither exists, require explicit left/right selection.
4. Show the chosen standing leg before camera setup.
5. Pin it through setup, countdown, active attempt, tracking loss, retry, and recovery.
6. Save it as `selectedSide` and actual `observedSide`.
7. A first valid result establishes the micro-check protocol’s own side series.
8. Later same-side results are comparable within the micro-check protocol.
9. Opposite-side micro-check use is stored but does not silently join the original side series.
10. The micro check never changes the official check-up anchor.

## 8.3 Mobility reach micro check

Current protocol:

- independently verify the exact current registry id, expected to be similar to `micro_mobility_reach_v1`

Side role:

- `extended_leg`

Required behaviour:

1. Prefer an existing valid side-known mobility micro-check series anchor.
2. Inspect whether current product logic explicitly maps this micro check to an official check-up side anchor.
3. If no explicit compatible relation exists, do **not** borrow shoulder or hinge side merely because one is available.
4. With no micro-check series anchor, require explicit left/right leg selection.
5. Show and pin the extended leg before setup.
6. Save selected and observed side.
7. First valid result establishes the mobility micro-check side series.
8. Later opposite-side use is reduced/raw-only according to the comparability engine.
9. Never overwrite an official anchor.

Fail closed to a separate micro-check series rather than inventing cross-protocol equivalence.

---

# 9. Micro-check side-selection UX

Use Pearl’s existing premium component system.

The UX must be:

- calm,
- adult,
- large enough for 45–65-year-old users,
- accessible,
- concise,
- non-medical,
- not gamified.

## 9.1 When no side is anchored

Before camera setup, show a side-selection step or card.

Suggested heading:

```text
Which side will you use?
```

For balance:

```text
Choose the leg you can hold most comfortably today.
Use the same leg each time for clearer progress.
```

For mobility reach:

```text
Choose the leg you can extend comfortably.
Use the same leg each time for clearer progress.
```

Actions:

- `Left leg`
- `Right leg`

Do not preselect a random side.

Do not use a tiny segmented control.

Do not proceed until one side is selected.

## 9.2 When a micro-check series anchor exists

Show concise confirmation, for example:

```text
Use your left leg
This matches your earlier micro checks.
```

Primary action:

- `Continue`

Secondary action:

- `Use right leg instead`

If the other side is chosen, show the warning in section 9.4.

## 9.3 When an official anchor seeds the first micro check

Show concise context, for example:

```text
Use your left leg
This matches your Movement Check-Up.
```

Allow a secondary action to choose the other side before starting.

Because this is the first micro-check result, a valid result on the chosen side establishes the micro-check series. Do not call it directly comparable to the official protocol.

## 9.4 Changing side for an established micro-check series

Require confirmation.

Suggested copy:

```text
Use the other side?

This check will start or continue a separate side comparison. Your usual side will stay unchanged.
```

Actions:

- `Use [left/right] leg`
- `Keep [right/left] leg`

Do not say the result is invalid.

Do not overwrite the existing micro-check side anchor.

---

# 10. Official retest opposite-side fallback UX

Implement a dedicated secondary action only for side-dependent official measurements with an existing valid official side anchor.

Examples:

- current MPV2 single-leg balance,
- current MPV2 active shoulder reach,
- future compatible side-dependent official protocols.

Do not show it for:

- chair stand,
- hinge if current registered semantics remain side-independent,
- TUG,
- side-independent measurements,
- initial baseline with no anchor.

## 10.1 Normal retest path

Display concise context:

```text
We’ll use your left side again
This keeps the result comparable with your earlier checks.
```

For balance, use `leg`.

For shoulder, use `arm` or `side` according to the exact setup semantics.

The primary path should preload the anchor side.

## 10.2 Secondary action

Use a clear secondary action:

```text
Use the other side
```

Do not hide this inside a generic overflow menu if it would make the fallback difficult to discover.

## 10.3 Confirmation

On activation, show a modal, sheet, or confirmation card using existing app patterns.

Suggested copy:

```text
Use the other side?

This result may not be directly comparable with your earlier checks. Your usual side will remain unchanged.
```

Actions:

- `Use [opposite side]`
- `Keep [anchor side]`

## 10.4 Confirmed fallback behaviour

After confirmation:

- pin the opposite side to the current attempt,
- preserve `anchorSide`,
- preserve `anchorResultId`,
- set `source = opposite_side_fallback`,
- set `userConfirmed = true`,
- derive reduced comparability,
- do not replace the anchor,
- use matching visible and voice instructions,
- keep the fallback side through retry and recovery,
- save the actual side used.

## 10.5 Cancellation

If the user cancels:

- restore/retain the anchor side,
- do not create a fallback state,
- do not mutate history,
- do not emit fallback diagnostics as accepted.

---

# 11. Side-aware attempt lifecycle

A side-dependent attempt must have an explicit lifecycle such as:

```ts
type SideSelectionPhase =
  | 'resolving'
  | 'choice_required'
  | 'anchor_confirmed'
  | 'fallback_confirmation'
  | 'pinned_for_attempt'
  | 'active'
  | 'completed';
```

Equivalent naming is acceptable.

## Required rules

- Side must be pinned before required setup voice begins.
- Once countdown starts, side cannot change in place.
- A change after setup requires cancel/restart of the current attempt.
- Retry preserves the current pinned side unless the user explicitly returns to side selection.
- Tracking recovery preserves the pinned side.
- Mounted Clara/Marcus switching does not change side.
- App background/foreground does not change side.
- Stale callbacks cannot save an old side.
- A valid result saves both selected and observed side.
- Invalid/failed result does not establish a new side anchor.

---

# 12. Voice and visible-copy alignment

Do not create or generate new audio in this task.

## MPV2 shoulder

Use existing left/right assets selected from the pinned side:

- `checkup-shoulder-turn-left-v21`
- `checkup-shoulder-turn-right-v21`
- `checkup-shoulder-raise-left-v21`
- `checkup-shoulder-raise-right-v21`

Verify:

- visible side,
- selected cue,
- coordinator side,
- grader side,
- result side

all agree.

## MPV2 balance

Use current generic selected-leg audio only if it remains truthful.

The screen must show the exact standing leg prominently.

Do not hard-code left.

## Micro-check balance and mobility

If current audio does not state left/right:

- keep the existing truthful generic cue,
- show the selected leg visually,
- record the missing side-specific spoken line as a future micro-check Voice V2.1 asset requirement,
- do not claim fully eyes-off side selection in this patch.

Do not assemble awkward runtime speech from unrelated assets.

---

# 13. Comparability and result UI

The metadata engine remains authoritative.

## Required result behaviour

### Same-side same-protocol

Normal micro-check or official trend behaviour is allowed.

### Opposite-side official fallback

Show a concise note such as:

```text
A different side was used, so this result is not directly comparable with your usual series.
```

Do not show a definitive improvement/decline statement.

### Opposite-side micro check

Show:

```text
This check used a different side and is kept in a separate comparison.
```

### First side-known micro check

Show no warning.

It establishes a new micro-check side series.

### Legacy unknown

Keep existing raw-only note.

## Surfaces to inspect

- immediate check-up result
- MPV2 results
- immediate micro-check completion
- progress/history
- block report
- restored history

Do not add a large UI redesign.

---

# 14. Accessibility

Side-choice controls must include:

- accessible role,
- accessible label,
- selected state,
- sufficient touch target,
- dynamic type tolerance,
- screen-reader order,
- no colour-only distinction.

Suggested accessible labels:

```text
Use left leg
Use right leg
Use the other side
Keep left side
```

Where a side is selected, visually indicate it with text and iconography, not colour alone.

---

# 15. Diagnostics

Add bounded, privacy-safe events for:

- side setup resolved,
- micro-check anchor found,
- official anchor used as first recommendation,
- user side selected,
- side change requested,
- side-change warning shown,
- side change confirmed,
- side change cancelled,
- opposite-side fallback accepted,
- attempt side pinned,
- selected/observed mismatch,
- new micro-check side series established,
- reduced comparability saved.

Use stable reason codes.

Do not log:

- raw video,
- landmarks,
- account identifiers,
- exact health values,
- user name.

---

# 16. Feature flag and rollback

Avoid a new feature flag unless the existing architecture needs one for safe rollout.

If needed, use a narrow internal flag such as:

```text
EXPO_PUBLIC_ENABLE_MEASUREMENT_SIDE_UX
```

Requirements:

- metadata parsing remains active regardless of flag,
- no false same-side claim is allowed when the flag is off,
- old results remain readable,
- MPV2 voice foundation remains independent,
- do not run duplicate side selectors,
- document rollback.

Prefer one canonical implementation over two competing paths.

---

# 17. Required tests

Do not weaken or delete existing tests.

## 17.1 Micro-check side-resolution tests

1. Chair power returns side-not-required.
2. Balance uses existing micro-check side anchor first.
3. Balance uses compatible official anchor when no micro anchor exists.
4. Balance requires user choice when no anchor exists.
5. Mobility uses existing mobility micro-check anchor.
6. Mobility does not borrow an unrelated official side.
7. First valid micro check establishes a new series.
8. Invalid micro check does not establish a series.
9. Opposite-side micro check does not overwrite the anchor.
10. Micro check never overwrites official anchor.
11. Resolution is deterministic after restore.
12. Unknown/malformed side history fails safely to choice required.

## 17.2 Micro-check UI tests

1. Chair power does not show side UI.
2. Balance with no anchor shows left/right choice.
3. Mobility with no anchor shows left/right choice.
4. Continue is unavailable until selection.
5. Existing anchor displays selected side.
6. Official recommendation displays correct context.
7. Other-side action shows confirmation.
8. Cancel retains original side.
9. Confirm pins opposite side.
10. Rapid double tap does not create duplicate attempts.
11. Side cannot change during countdown.
12. Retry preserves selected side.
13. Tracking recovery preserves selected side.
14. Accessibility labels and selected state exist.
15. Dynamic type does not hide actions in component tests where practical.

## 17.3 Official retest fallback tests

1. Side-independent item has no fallback action.
2. Initial baseline without anchor has no “other side” fallback; it uses baseline selection.
3. Official retest preloads anchor.
4. Secondary action is visible.
5. Confirmation copy appears.
6. Cancel preserves anchor side.
7. Confirm uses opposite side.
8. Result source is `opposite_side_fallback`.
9. Comparability is reduced.
10. Anchor side remains unchanged.
11. Retry preserves fallback side.
12. Recovery preserves fallback side.
13. Mounted voice change preserves fallback side.
14. Shoulder left fallback selects matching left/right voice assets.
15. Selected/observed mismatch cannot save a comparable result.
16. Manual check fallback does not alter official anchor.

## 17.4 Persistence tests

1. Micro-check selected side survives local round trip.
2. Micro-check selected side survives backend round trip.
3. Opposite-side official result survives restore.
4. Anchor remains unchanged after fallback restore.
5. Side-known metadata wins over an older side-unknown duplicate.
6. Invalid side enum defaults safely.
7. A provisional UI selection not followed by a valid result is not persisted as an anchor.
8. Restored series anchor remains deterministic.

## 17.5 History/comparability tests

1. First valid micro check establishes new series.
2. Same-side later micro check produces comparable series.
3. Opposite-side micro check is separate/reduced.
4. Official opposite-side fallback suppresses definitive delta.
5. Original official series remains intact.
6. Current raw value still displays.
7. No false same-side trend.
8. No false cross-protocol trend.
9. Legacy unknown remains raw-only.
10. Block report does not claim improvement from fallback result.

## 17.6 MPV2 regression

Re-run and preserve:

- voice/runtime P0/P1/P2 = 0/0/0,
- shoulder voice/UI/grader mismatch = 0,
- no side change during retry/recovery,
- no side change during mounted voice switch,
- no stale callback,
- no partial-attempt resume.

---

# 18. Required implementation artifacts

Create:

1. `docs/audits/PEARL_MEASUREMENT_SIDE_UX_COMPLETION_IMPLEMENTATION.md`
2. `docs/audits/PEARL_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.md`
3. `docs/audits/PEARL_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.json`
4. `docs/audits/PEARL_MEASUREMENT_SIDE_UX_SCENARIOS.csv`
5. `docs/audits/PEARL_VOICE_PROJECT_POST_SIDE_UX_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-measurement-side-ux.mjs`

Do not overwrite the original metadata audit.

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,flow,itemId,checkupType,protocolId,sideRequired,anchorType,anchorSide,userAction,pinnedSide,sideSource,observedSide,comparabilityOutcome,anchorChanged,trendClaimAllowed,visibleCopy,voiceCueKeys,resultStatus,testCoverage,notes
```

---

# 19. Implementation report structure

Use:

# Pearl Measurement-Side UX Completion Implementation

## 1. Result

## 2. Findings Closed

Map:

- MSP-P2-001
- MSP-P2-002

to exact code and tests.

## 3. Micro-Check Side Resolution

## 4. Balance Micro-Check UX

## 5. Mobility Micro-Check UX

## 6. Official Retest Opposite-Side Fallback

## 7. Attempt Pinning

## 8. Voice/UI/Grader Alignment

## 9. Comparability and Result Copy

## 10. Accessibility

## 11. Persistence and Restore

## 12. Diagnostics

## 13. Tests

## 14. Files Changed

## 15. Worktree Integrity

## 16. Exact Next Phase

---

# 20. Post-UX audit requirements

The audit must report:

- micro-check types inspected,
- side-dependent micro-check types,
- side-independent micro-check types,
- micro-check no-anchor scenarios,
- existing micro-anchor scenarios,
- official-recommendation scenarios,
- opposite-side micro-check scenarios,
- official-retest fallback scenarios,
- cancelled fallback scenarios,
- anchor-overwrite cases,
- selected/observed mismatches,
- false trend claims,
- persistence failures,
- accessibility failures,
- MPV2 voice-side mismatches,
- P0/P1/P2/P3 findings.

Issue exactly one verdict:

- `SIDE_PROTOCOL_FOUNDATION_COMPLETE`
- `REMEDIATION_REQUIRED`
- `CURRENT_SOURCE_REBASE_REQUIRED`
- `DATA_REPAIR_REQUIRED`

Do not choose complete if either P2 finding remains open.

---

# 21. Completion gates

Do not claim completion unless all pass.

## Findings

- MSP-P2-001: closed
- MSP-P2-002: closed
- P0: 0
- P1: 0
- P2: 0
- P3 may remain 1 for deferred physical QA

## Micro checks

- Side-dependent micro check without explicit/pinned side: 0
- Chair-power side selector shown: 0
- First valid side-known micro check failing to establish series: 0
- Invalid result establishing series: 0
- Micro check overwriting official anchor: 0
- Unrelated official protocol borrowed as side authority: 0
- Side change during active attempt: 0

## Official retest

- Side-dependent official retest without normal anchor path: 0
- Fallback without explicit confirmation: 0
- Fallback overwriting anchor: 0
- Fallback reported as fully comparable: 0
- Fallback definitive trend claim: 0
- Retry/recovery changing fallback side: 0

## Runtime consistency

- Voice/UI/controller/grader side mismatch: 0
- Selected/observed mismatch accepted as comparable: 0
- Stale callback saving old side: 0
- Mounted voice switch changing side: 0

## Persistence

- Local round-trip failure: 0
- Backend round-trip failure: 0
- Restore anchor drift: 0
- Richer side-known metadata lost during merge: 0

## Regression

- MPV2 static/runtime P0/P1/P2 remains 0/0/0
- Device-only P3 may remain deferred
- No audio changed
- No audio generated
- No external speech API called

---

# 22. Handoff to the eyes-open balance protocol

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_SIDE_UX_HANDOFF.md`

It must state the exact next task:

```text
Approved eyes-open balance protocol V2 reconciliation
```

Include:

- current protocol-registry API,
- current side-anchor API,
- new micro-check side-resolution API,
- official fallback UI contract,
- how the future balance protocol should reuse the standing-leg anchor,
- how the new protocol must start a new series,
- how old MPV2 balance results remain preserved,
- current voice assets that can be reused,
- new stage cue assets still ungenerated,
- tests that must remain green,
- device QA still deferred.

Do not implement the balance protocol in this task.

---

# 23. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- measurement context
- protocol registry
- comparability
- official anchor selectors
- MPV2 setup/runtime/recovery
- MicroCheckScreen
- micro-check controller/state
- micro-check serialization
- backend micro-check sync/restore
- check-up sync/restore
- history/trends/progress/reports
- new side-resolution helper
- new fallback UI

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

# 24. Final Codex response

When finished, respond with:

- Summary of implementation
- Paths to all five generated artifacts
- All production files changed
- All test files changed/added
- Any audit-only harness added
- Confirmation that no audio changed or was generated
- Confirmation that no external speech/audio API was called
- Confirmation that physical-device QA remains deferred
- Current branch and commit
- Whether the worktree was already dirty
- Micro-check side-resolution order
- Balance micro-check no-anchor behaviour
- Mobility micro-check no-anchor behaviour
- Existing micro-check anchor behaviour
- Official-anchor recommendation behaviour
- Official retest opposite-side fallback behaviour
- Fallback confirmation copy
- Whether fallback replaces the anchor
- Retry/recovery side behaviour
- Voice/UI/grader mismatch count
- False same-side comparison count
- False cross-protocol comparison count
- Anchor-overwrite count
- Local/backend round-trip failure count
- Accessibility failure count
- Post-patch P0/P1/P2/P3 counts
- Verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused test results
- Exact next task from the handoff
- A concise confidence statement

Do not implement the eyes-open balance protocol, generate audio, or perform physical-device QA in this task.
