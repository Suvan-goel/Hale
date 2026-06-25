# Codex Prompt: Hale Eyes-Open Balance Protocol V2 Reconciliation

Read this entire prompt before changing anything.

Hale’s measurement-side and protocol foundation is now complete.

Verified current state:

- Measurement-side UX verdict: `SIDE_PROTOCOL_FOUNDATION_COMPLETE`
- P0/P1/P2/P3: `0 / 0 / 0 / 1`
- Side-dependent micro checks always have an explicit or pinned side
- Opposite-side official retests require explicit confirmation
- Opposite-side fallback does not replace the official side anchor
- False same-side comparisons: `0`
- False cross-protocol comparisons: `0`
- Anchor overwrites: `0`
- Voice/UI/controller/grader side mismatches: `0`
- Local/backend metadata round-trip failures: `0`
- Physical Android/iOS QA remains deliberately deferred

The exact next phase is:

```text
Approved eyes-open balance protocol V2 reconciliation
```

This task implements approved founder decision `FD-003`:

```text
The default unsupervised home balance protocol is eyes-open only.

The progression is:
1. Feet together, eyes open
2. Semi-tandem, eyes open
3. Tandem, eyes open
4. Single-leg, eyes open

Eyes-closed stages are not part of the new default protocol.
They remain conditional legacy only.
```

The new protocol must integrate with the completed:

- measurement protocol registry,
- measurement-side anchor policy,
- comparability engine,
- MPV2 voice-runtime foundation,
- tracking-loss/recovery model,
- mounted Clara/Marcus switching,
- persistence/sync/restore,
- and history/trend suppression.

Do not generate audio in this task.

---

# 1. Source artifacts

Read and use:

## Completed side/protocol foundation

- `docs/audits/HALE_MEASUREMENT_SIDE_UX_COMPLETION_IMPLEMENTATION.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.json`
- `docs/audits/HALE_MEASUREMENT_SIDE_UX_SCENARIOS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_SIDE_UX_HANDOFF.md`
- `scripts/audits/audit-measurement-side-ux.mjs`

Current APIs include:

```text
src/checkup/measurementProtocolRegistry.ts
- listMeasurementProtocols()
- getMeasurementProtocolDescriptor(...)
- descriptorForMovementMeasurement(...)
- descriptorForMicroCheck(...)
- protocolRefForDescriptor(...)
- protocolVariantForMovementResult(...)

src/checkup/measurementMetadata.ts
src/checkup/measurementContext.ts
- normalizeCheckUpMeasurementMetadata(...)
- normalizeCheckUpItemMeasurementMetadata(...)
- normalizeMicroCheckMeasurementMetadata(...)
- findOfficialMeasurementAnchor(...)
- deriveOfficialMeasurementSide(...)
- measurementResultId(...)
- deriveMeasurementComparability(...)
- measurementSeriesKey(...)
- comparableMeasurementSeriesKey(...)

src/training/microCheckSideSetup.ts
- deriveMicroCheckSideSetup(...)
- createMicroCheckMeasurementContextForSide(...)
- oppositeMicroCheckSide(...)
```

## Completed MPV2 voice/runtime work

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
- `docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md`
- current MPV2 runtime/coordinator/recovery/voice tests

Preserve:

```text
MPV2 static/runtime P0/P1/P2/P3: 0 / 0 / 0 / 1
```

The remaining P3 is physical-device-only.

## Approved voice/product specification

- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`

The approved V2.1 balance contract currently proposes:

```text
Protocol: home_balance_eyes_open_v2
Version: 2

Stage 1:
feet_together_eyes_open_v2
10 seconds

Stage 2:
semi_tandem_eyes_open_v2
10 seconds

Stage 3:
tandem_eyes_open_v2
10 seconds

Stage 4:
single_leg_eyes_open_v2
12 seconds
```

Independently validate naming and integration against current repository conventions.

Do not blindly copy stale documentation where current source has since changed.

## Current asset/runtime reconciliation

Inspect current cue definitions, manifests, generation source, and MPV2 balance assets.

Known facts to verify:

- Current MPV2 balance is an eyes-open single-leg, multi-attempt protocol.
- Its current protocol id is expected to be:
  - `mpv2_single_leg_balance_45s_v1`
- It may include:
  - up to three valid attempts,
  - rest,
  - use-best,
  - threshold/ceiling narration,
  - operational MPV2 cue keys.
- It is not the approved four-stage ladder.
- Existing eyes-closed assets may still be physically bundled.
- New stage-specific V2 voice assets have not been generated.

The listening review remains waived, not completed.

---

# 2. Objective

Implement and reconcile the approved eyes-open balance protocol so that:

1. It has a new, explicit protocol id and version.
2. It does not reuse or overwrite the current MPV2 single-leg protocol identity.
3. The MPV2 check-up can execute the four eyes-open stages in order.
4. No eyes-closed stage or cue is reachable in the new default path.
5. A harder stage begins only after the preceding stage is completed successfully.
6. Early balance loss on a stage ends the ladder safely rather than automatically advancing to a harder stance.
7. Tracking failure retries the same stage and does not count as balance failure.
8. Every stage uses the existing required-speech, countdown, failure, cancellation, recovery, and voice-switching guarantees.
9. The selected standing-leg anchor is reused consistently where the protocol requires a side.
10. Semi-tandem and tandem use the selected side consistently as the lead foot.
11. Single-leg uses the selected side as the standing leg.
12. Retry, recovery, app-state changes, and mounted voice switching never change the selected side or current stage.
13. New protocol results persist full stage evidence and protocol metadata.
14. The first V2 result establishes a new protocol comparison series.
15. Old MPV2 single-leg balance history remains intact and separately queryable.
16. No direct trend claim bridges the old and new protocols.
17. Legacy eyes-closed results remain identifiable under their original protocol.
18. No legacy result is rewritten.
19. Current balance micro-check side recommendation can use the new official standing-leg anchor without treating the metrics as equivalent.
20. Current MPV2 static/runtime voice gates remain at zero.
21. No physical audio is created, changed, moved, or deleted.
22. A complete cue-reuse and pending-asset manifest is produced for the later consolidated audio-generation phase.
23. Physical-device QA remains deferred.
24. The exact next broader phase becomes:
   - Training Voice V2.1 implementation planning/foundation for all 37 exact levels.

---

# 3. Approved implementation interpretation

Use the following as the implementation contract for this task.

Do not reopen it as a founder decision.

## 3.1 Stage order

```text
feet together
→ semi-tandem
→ tandem
→ single-leg
```

All stages are eyes open.

## 3.2 Stage caps

```text
feet together: 10 seconds
semi-tandem: 10 seconds
tandem: 10 seconds
single-leg: 12 seconds
```

Use monotonic milliseconds internally.

## 3.3 Progression rule

Progress to the next harder stage only after the current stage reaches its full valid cap.

If the current stage ends early because of:

- a step,
- a clear stance break,
- the lifted foot touching down during single-leg,
- an explicit user stop,
- or a user-reported support touch,

then:

- record the valid maintained duration,
- end the balance ladder,
- do not attempt the harder remaining stages,
- complete the balance item calmly.

Do not automatically advance after an early balance loss.

## 3.4 Tracking interruption

Tracking interruption is not balance failure.

On confirmed tracking interruption:

- invalidate the partial attempt for that stage,
- enter the existing recovery flow,
- preserve stage and selected side,
- re-establish setup,
- use required recovery narration,
- run a fresh full countdown,
- restart the same stage from zero.

Do not add the interrupted partial time to the result.

## 3.5 Attempts

Use one valid attempt per stage.

Do not carry forward the current V1-style:

- best-of-three attempt model,
- use-best branch,
- rest-between-valid-trials model,
- ready-after-30/60 operational model,

into the new protocol.

Those behaviours remain conditional to the old protocol only.

## 3.6 Active guidance

The four short stages do not need halfway or time-remaining narration.

Use:

- setup instruction,
- final-position readiness,
- fresh countdown,
- `go`,
- stage end/transition.

Do not narrate every second.

## 3.7 Support

Keep sturdy support within easy reach.

Do not claim the camera can reliably detect a hand touching a counter unless current source proves that signal exists.

Where support touch cannot be detected reliably:

- provide a visible `I touched support` / stop action using existing UI patterns,
- treat explicit user input as a valid early termination reason,
- do not fabricate automatic support-touch detection.

---

# 4. Strict scope

## In scope

- New protocol registry descriptor.
- Battery/envelope protocol versioning where required.
- New four-stage balance state machine.
- New result and stage-evidence types.
- Stage setup and progression.
- Stage-specific side roles.
- Reuse of official standing-leg anchor.
- Existing opposite-side fallback UX.
- Current MPV2 voice-runtime integration.
- Required speech and countdown integration.
- Tracking-loss/recovery integration.
- Mounted Clara/Marcus switching.
- Stage-scoped cancellation.
- Persistence, serialization, sync, restore, and history.
- Protocol-series separation.
- Result/progress UI needed to represent the new protocol truthfully.
- Micro-check side recommendation compatibility.
- Feature flag and rollback.
- Existing-cue reuse analysis.
- Pending voice-asset requirement manifest.
- Tests and post-implementation audit.
- Handoff to the training Voice V2.1 phase.

## Out of scope

Do not implement in this task:

- New MP3 generation.
- ElevenLabs calls.
- Runtime TTS.
- Human listening review.
- Physical Android/iOS QA.
- Training Voice V2.1.
- Safety-family consolidation outside this balance protocol.
- Both-sides training rounds.
- Step-up alternation.
- Floor-transfer gate.
- Full micro-check voice redesign.
- New medical norms.
- New movement-age claims.
- Disease, diagnosis, treatment, fall-risk, or frailty claims.
- Destructive migration of old results.
- Retroactive inference of legacy side.
- Direct numerical conversion between old and new balance protocols.
- TUG changes.
- Changes to chair, shoulder, or hinge protocols unless needed only for battery versioning.

---

# 5. Worktree safety

The repository is heavily dirty and contains important uncommitted work.

Before editing:

- Record branch, full/short `HEAD`, upstream, and `git status --short --branch`.
- Identify pre-existing relevant changes.
- Do not reset, checkout, stash, clean, or overwrite unrelated work.
- Do not delete untracked audio, audit, spec, renderer, or protocol files.
- Do not regenerate manifests wholesale.
- Do not commit or push.
- Modify only files required for this phase and its tests/reports.

At the end:

- distinguish this task’s footprint from pre-existing changes,
- confirm no audio file changed,
- confirm no unrelated work was overwritten.

---

# 6. Current source to inspect

At minimum inspect:

## Protocol and metadata

- `src/checkup/measurementProtocolRegistry.ts`
- `src/checkup/measurementContext.ts`
- `src/checkup/measurementMetadata.ts`
- `src/checkup/measurementComparability.ts`
- `src/checkup/protocolSetup.ts`
- `src/checkup/protocolEvidence.ts`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/types.ts`
- `src/checkup/checkup.ts`

## Current and legacy balance

- `src/movements/oneLegBalanceV2.ts`
- `src/movements/balanceLadder.ts`
- any balance grader/helpers
- current MPV2 balance tests
- legacy balance tests
- reference balance assessment code
- balance scoring or domain-evidence code

## MPV2 flow

- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/voiceRuntime.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- internal MPV2 check-up flow files
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/screens/MovementProfileV2ResultsScreen.tsx`
- all related tests

## Audio

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/voicePlayer.ts`
- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- both Clara and Marcus balance assets

## Persistence/history

- check-up serializers
- local history
- backend check-up sync
- restore
- account export
- trend/history selectors
- progress cards
- block reports
- onboarding results
- scoring/domain evidence
- official evidence policy

## Micro checks

- `src/training/microCheckSideSetup.ts`
- `src/training/microCheck.ts`
- relevant micro-check tests

Search broadly for:

```text
mpv2_single_leg_balance_45s_v1
oneLegBalanceV2
balance_trial
balance_ready
balance_rest
use_best
ready_after_30
ready_after_60
full_hold
close-your-eyes
open-your-eyes
balance-feet-together
balance-semi-tandem
balance-tandem
balance-single-leg
standingLeg
leadFoot
support touch
touchdown
stance break
balance score
balance age
balance band
```

Follow actual call paths.

---

# 7. Protocol identity and versioning

Create a new protocol descriptor using repository conventions.

Preferred stable identity:

```text
protocolId: home_balance_eyes_open_v2
protocolVersion: 2
```

Use a different id only if repository naming conventions make another id clearly better.

## Required descriptor meaning

- kind: check-up movement
- side role: `standing_leg`
- side required: `true`
- official evidence eligible: `true`
- new stable comparison group
- new movement id
- no alias to `mpv2_single_leg_balance_45s_v1`
- no alias to the legacy balance ladder

## Battery protocol

The MPV2 battery changes when its balance item changes.

Implement explicit battery versioning.

Preferred approach:

```text
movement_profile_v2_battery / version 2
```

or an equivalent repository-consistent new battery protocol reference.

Requirements:

- battery V1 remains readable,
- battery V2 points to the new balance protocol,
- old check-ups continue rendering from stored metadata,
- the app never derives an old battery’s protocol from the current default,
- no existing result is rewritten.

## Registry counts

Update tests and audit counts based on the actual final descriptors.

Do not hard-code expected total count in documentation before deriving it.

---

# 8. New movement and result model

Do not overwrite `oneLegBalanceV2`.

Add a new movement/protocol implementation.

A suitable result model is:

```ts
type BalanceEyesOpenStageId =
  | 'feet_together_eyes_open_v2'
  | 'semi_tandem_eyes_open_v2'
  | 'tandem_eyes_open_v2'
  | 'single_leg_eyes_open_v2';

type BalanceStageEndReason =
  | 'completed_cap'
  | 'stance_lost'
  | 'step_detected'
  | 'touchdown'
  | 'support_touch_user_reported'
  | 'user_stopped'
  | 'tracking_interrupted'
  | 'cancelled'
  | 'invalid';

interface BalanceEyesOpenStageResult {
  stageId: BalanceEyesOpenStageId;
  order: number;
  capMs: number;
  maintainedMs: number;
  completedCap: boolean;
  endReason: BalanceStageEndReason;
  selectedSide: BodySide | null;
  sideRole: MeasurementSideRole;
  observedSide: BodySide | null;
  valid: boolean;
  startedAtMs: number;
  endedAtMs: number;
  supportingMetrics?: Record<string, number>;
}

interface BalanceEyesOpenV2Result {
  protocolId: string;
  protocolVersion: number;
  selectedStandingLeg: BodySide;
  stages: BalanceEyesOpenStageResult[];
  highestCompletedStage: BalanceEyesOpenStageId | null;
  terminalStage: BalanceEyesOpenStageId;
  totalMaintainedMs: number;
  totalCapMs: number;
  completedAllStages: boolean;
  completionReason: string;
}
```

Equivalent repository-consistent naming is acceptable.

## Requirements

- Raw per-stage evidence is canonical.
- `totalMaintainedMs` is a protocol-local raw summary, not a medical score.
- Do not feed it into a legacy balance-age formula.
- Do not fabricate a cross-protocol conversion.
- Supporting sway metrics are optional and fail-local.
- Missing optional sway data must not invalidate valid hold-time evidence.
- Tracking-interrupted attempts are not persisted as valid stage results.
- Early valid balance loss is a valid protocol outcome.
- The protocol result records the exact selected standing leg.
- All timestamps use the current monotonic clock conventions.

---

# 9. Stage descriptors

Create one immutable descriptor list.

Use:

```text
Stage 1
id: feet_together_eyes_open_v2
order: 1
cap: 10,000 ms
side role: not_applicable
selected side: null

Stage 2
id: semi_tandem_eyes_open_v2
order: 2
cap: 10,000 ms
side role: lead_foot
selected side: protocol selected side

Stage 3
id: tandem_eyes_open_v2
order: 3
cap: 10,000 ms
side role: lead_foot
selected side: protocol selected side

Stage 4
id: single_leg_eyes_open_v2
order: 4
cap: 12,000 ms
side role: standing_leg
selected side: protocol selected side
```

## Side meaning

The protocol-level selected side is the standing leg for single-leg.

For semi-tandem and tandem:

- use the same selected side as the lead/front foot,
- preserve it across retry and recovery,
- do not alternate within the official protocol,
- do not silently choose based on whichever side the pose model sees more clearly.

Feet-together remains side-independent at the stage level, while the overall protocol remains side-anchored for longitudinal consistency.

---

# 10. Stance setup and readiness

Do not build a fragile pseudo-clinical stance classifier merely to avoid a setup button.

## General rule

Use the camera as a measurement instrument, not a constant stance judge.

For all stages require:

- plausible subject,
- full required body/feet visibility,
- stable tracking,
- required camera orientation,
- stable setup dwell.

## Feet together

Use existing reliable evidence only.

If current source can robustly distinguish a narrow-base stance, it may assist readiness.

Do not fail the user on a speculative threshold without evidence/tests.

## Semi-tandem and tandem

Front-view 2D pose may not robustly distinguish forward depth.

Do not rely on fragile world-Z or perspective heuristics unless current source already validates them.

Preferred setup contract:

- show exact stance visually,
- speak or display exact selected lead foot,
- require a user confirmation such as `I'm ready` if the camera cannot robustly verify the stance,
- then require ordinary body/feet visibility and stability before countdown.

## Single-leg

Reuse the current selected-leg readiness/grader evidence where reliable.

The selected standing leg must match:

- UI,
- voice cue selection,
- controller state,
- grader,
- result metadata.

## User confirmation

If stance-specific readiness is user-confirmed:

- the action must be large and accessible,
- handler must be programmatically guarded,
- it cannot bypass required speech,
- rapid taps cannot create duplicate countdowns,
- changing stance/side after confirmation requires setup restart.

---

# 11. Stage state machine

Create an explicit state model.

A suitable conceptual shape is:

```ts
type BalanceEyesOpenPhase =
  | 'intro'
  | 'stage_setup'
  | 'stage_ready'
  | 'stage_countdown'
  | 'stage_active'
  | 'stage_complete'
  | 'ladder_complete'
  | 'tracking_recovery'
  | 'audio_failure'
  | 'cancelled';
```

State must include:

- current stage id/index,
- selected side,
- stage attempt id,
- stage epoch,
- required voice scope,
- start timestamp,
- valid accumulated time,
- terminal event,
- recovery id,
- completed stage results.

## Illegal transitions

Make these impossible:

```text
harder stage before prior cap completion
stage active before required setup speech
stage active before go playback-start
stage active with no selected side
single-leg active with a different standing leg
tracking recovery resuming partial stage time
old stage callback saving into new stage
old protocol operational cue changing new protocol state
ladder completion with an unresolved tracking interruption
```

Use explicit coordinator actions and guards.

---

# 12. Stage progression and terminal precedence

Define deterministic monotonic precedence.

## Full completion

If the stage reaches its cap first:

- stop the stage immediately,
- record `completed_cap`,
- speak/end the current stage,
- advance to the next stage setup,
- or complete the ladder after single-leg.

## Balance loss

If a valid loss event occurs first:

- stop the stage immediately,
- record maintained time,
- record the specific supported reason,
- end the ladder,
- do not attempt a harder stage.

## Tracking loss

If tracking interruption is accepted first:

- invalidate that attempt,
- do not save partial time,
- enter recovery,
- retry the same stage from zero.

## User cancel

Cancel wins when accepted before a terminal measurement event.

## Same-timestamp ties

Define explicit precedence in code and tests.

Do not let React effect order decide.

Recommended order:

1. accepted valid stage cap,
2. accepted explicit user stop/support report,
3. accepted stance/touchdown/step loss,
4. confirmed tracking interruption,
5. late/stale callbacks ignored.

Use a different order only if current movement semantics justify it and document why.

---

# 13. Detection and evidence boundaries

Inspect what current pose logic can actually detect.

## Allowed automatic signals

Only use signals supported by current code/tests, such as:

- selected-leg touchdown,
- clear foot/stance movement,
- subject gone,
- tracking interruption,
- valid hold timing,
- full-body/feet visibility.

## Unsupported claims

Do not claim automatic detection of:

- hand touching a counter,
- exact heel-to-toe depth,
- precise semi-tandem foot offset,
- unsafe instability,
- clinical sway thresholds,

unless current source and tests genuinely establish them.

## User-reported termination

Where automatic support-touch detection is unavailable, add a visible action such as:

```text
I touched support
```

or use an existing stop action with a specific reason.

It should:

- end the current stage,
- save the valid maintained time,
- end the ladder,
- avoid shame/failure language.

---

# 14. Voice-runtime integration

Preserve the completed MPV2 voice-runtime foundation.

Every stage must use:

1. required setup instruction,
2. final-position readiness,
3. countdown three/two/one/go,
4. active timing from `go` playback-start,
5. stage end,
6. transition or ladder completion.

## Required voice properties

- Blocking setup speech resolves before countdown.
- Required asset failure enters visible retry.
- Stage scope cancels stale narration.
- Tracking recovery uses a fresh setup and countdown.
- Mounted voice switching follows the existing safe-boundary rules.
- A countdown voice switch restarts from three.
- Active-stage voice switch is deferred safely.
- Clara/Marcus duration differences cannot change state outcome.

## Existing cues

Inspect exact current scripts and assets.

Potentially reusable:

- `checkup-balance-intro-v21`
- `checkup-balance-single-leg-v21`
- `balance-feet-together`
- `balance-semi-tandem`
- `balance-tandem`
- `balance-single-leg`
- `final-position-set-v21`
- `countdown-three`
- `countdown-two`
- `countdown-one`
- `go`
- `times-up-v21`
- `tracking-loss-v21`
- `tracking-recovered-v21`
- `retry-v21`
- `mpv2_balance_tracking_retry`
- `item-complete-v21`
- `mpv2_balance_complete`

Reuse only when the exact current source script is semantically correct for the new event.

Do not reuse a cue merely because its filename sounds close.

## New/pending cue concepts

The approved voice design may require:

- balance V2 intro,
- feet-together setup,
- semi-tandem left-lead setup,
- semi-tandem right-lead setup,
- tandem left-lead setup,
- tandem right-lead setup,
- single-leg left-standing setup,
- single-leg right-standing setup,
- stage complete/next stance,
- ladder complete.

Do not generate these files.

Create a pending asset manifest for any concept that lacks an exact reusable Clara/Marcus pair.

## Eyes-closed cues

The new default runtime must never emit:

- `close-your-eyes`
- `open-your-eyes`

Keep their physical assets and legacy mappings intact.

---

# 15. Audio-readiness and rollout policy

Do not weaken required-speech failure handling.

## Cue audit first

For every required new-protocol cue classify:

- `exact_existing_pair_reusable`
- `existing_pair_script_mismatch`
- `existing_generic_visible_side_required`
- `new_pair_required`
- `legacy_only`
- `not_required`

## Feature flag

Add a narrow internal flag, for example:

```text
EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2
```

Equivalent naming is acceptable.

## Default rule

If every required voice-first stage cue has an exact reusable Clara/Marcus pair:

- the flag may default on within the existing internal MPV2 path.

If one or more required stage cues lack exact assets:

- the flag must default off,
- tests may enable it with mocked/resolved assets,
- forcing it on with missing required audio must fail closed,
- the old MPV2 protocol remains the temporary runtime rollback,
- the implementation report must say `software_complete_audio_pending`.

Do not insert visible-only fallback into a measured voice-first stage and call it production-ready.

Visible side/setup copy may supplement audio, but not replace a required missing instruction in the enabled production path.

---

# 16. Old MPV2 protocol preservation

Keep the existing protocol:

```text
mpv2_single_leg_balance_45s_v1
```

for:

- existing result parsing,
- history display,
- sync/restore,
- rollback while V2 assets are pending,
- conditional legacy/internal use.

Do not:

- delete it,
- rename it in stored history,
- map it to the new protocol,
- reinterpret old trial arrays as V2 stages,
- convert old best-hold values into a V2 total,
- overwrite its cue assets.

## Old operational cues

Classify old-only cues such as:

- attempt saved,
- rest,
- ready after 30/60,
- use best,
- full hold,
- multi-attempt completion,

as conditional to the old protocol.

They must not be emitted by the new four-stage protocol.

---

# 17. Side anchor and comparability

Use the completed side metadata system.

## First V2 run

If an old official balance side anchor exists:

- it may be recommended for comfort/consistency,
- require user confirmation under the existing side UX contract,
- use it as the V2 selected side,
- but the result still establishes a new V2 protocol baseline,
- do not compare it directly to the old protocol result.

Do not mark the first V2 result as a same-protocol official retest merely because its side matches old history.

## Later V2 official retest

- preload the V2 official side anchor,
- use the existing normal-side and `Use the other side` UX,
- same side + same protocol is comparable,
- opposite side is reduced comparability,
- fallback does not replace the anchor.

## Stage side metadata

- stage 1: side not applicable
- stage 2: selected side is lead foot
- stage 3: selected side is lead foot
- stage 4: selected side is standing leg

The result envelope stores the protocol selected standing leg and per-stage side role.

## Series

New V2 results use a new comparison series.

Old MPV2 single-leg results remain in their old series.

Legacy eyes-closed ladder results remain in their legacy series.

False cross-series direct change claims must remain zero.

---

# 18. Micro-check compatibility

Update side recommendation compatibility carefully.

## Balance micro check

The balance micro check may use an official standing-leg anchor as a recommendation source.

After V2 exists:

1. Prefer the latest valid official standing-leg anchor from the new V2 protocol where appropriate.
2. If no V2 anchor exists, the current old MPV2 anchor may remain a recommendation source.
3. The first micro-check result still establishes its own micro-check series.
4. Matching side does not make micro-check and official protocol metrics directly comparable.
5. A micro check never overwrites an official anchor.

Update pure helper tests.

Do not redesign micro-check voice in this task.

---

# 19. Scoring and user-facing claims

This is a new protocol.

Do not reuse old normative scoring blindly.

## Required raw summary

At minimum derive:

- completed stage count,
- highest completed stage,
- terminal stage,
- terminal-stage maintained time,
- total maintained time,
- completed-all-stages,
- selected side.

## No legacy conversion

Do not feed new V2 evidence into:

- legacy balance-age formulas,
- old eyes-closed ladder thresholds,
- current MPV2 45-second single-leg thresholds,

unless a current, explicit, protocol-specific mapping already exists and is proven in source.

## If downstream code requires a scalar

Inspect the current architecture.

Preferred order:

1. Extend downstream code to accept raw protocol evidence and an uncalibrated/protocol-local status.
2. Use a clearly named protocol-local raw index only for ordering within this same protocol.
3. Suppress movement-age, normative band, and cross-protocol delta claims.
4. Do not use an uncalibrated number to make a confident weakest-domain claim against differently calibrated domains.

If the current plan-focus system cannot safely consume the new evidence:

- fail closed to the existing deterministic fallback/preserved focus policy,
- document the limitation,
- do not fabricate calibration.

## Result copy

Use calm non-medical language.

A suitable immediate result is:

```text
Balance check complete
You completed [n] of 4 stages.
```

Optionally show per-stage hold times.

For first V2 result:

```text
This starts a new balance comparison.
```

For old/new protocol history:

```text
This balance check used a different protocol, so it starts a new comparison series.
```

Do not say:

- failed,
- fall risk,
- frail,
- abnormal,
- clinical score,
- balance age,

unless already separately approved and valid.

---

# 20. Check-up battery integration

Preserve the default item order unless current source proves another approved order:

```text
chair
balance V2
shoulder
hinge
```

TUG remains conditional/beta only.

## Battery selection

When the V2 feature flag is enabled and voice assets are ready:

- the MPV2 battery uses the new balance protocol.

When disabled:

- the old MPV2 single-leg protocol remains the rollback path.

Never run both balance protocols in one official battery.

## Result envelope

Store:

- battery protocol id/version,
- item protocol id/version,
- stage evidence,
- measurement context,
- comparability,
- side metadata,
- feature/protocol variant where appropriate.

---

# 21. Persistence, sync, and restore

Trace every new field through:

- local save,
- serialization,
- check-up history,
- backend JSON sync,
- restore,
- duplicate merge,
- account export,
- progress/report surfaces.

## Requirements

- Stage arrays round-trip intact.
- Protocol id/version round-trip intact.
- Selected side round-trips intact.
- Old result parsing remains unchanged.
- New result parsing fails safely on malformed optional stage metrics.
- Duplicate merge does not replace richer V2 stage evidence with an older partial copy.
- Old clients can ignore additive JSON fields.
- No remote migration is required unless the live architecture genuinely demands one.
- Do not execute a remote schema change.

---

# 22. Feature-flag and rollback integrity

The new protocol feature flag must:

- select one balance protocol before attempt creation,
- pin that choice for the entire check-up,
- not change if environment/config changes mid-check-up,
- survive retry/recovery,
- be stored in battery/item protocol metadata,
- never switch an in-progress check-up between old and new balance flows.

Rollback must preserve access to:

- current old MPV2 balance,
- old results,
- old operational assets.

The old path is a temporary software/audio rollback, not the approved final default.

---

# 23. Diagnostics

Add bounded, privacy-safe diagnostics for:

- protocol selected,
- stage entered,
- setup confirmed,
- countdown started,
- go playback-start,
- stage active,
- stage cap completed,
- balance loss accepted,
- tracking interruption,
- stage retry,
- ladder completed,
- selected side,
- old/new protocol selection,
- unsupported automatic detection avoided,
- pending asset gating,
- cross-protocol comparison suppressed.

Do not log:

- raw video,
- raw landmarks,
- account identifiers,
- user name,
- detailed health values.

---

# 24. Required tests

Do not weaken or delete existing tests.

## 24.1 Protocol registry tests

1. New protocol descriptor exists.
2. New protocol id/version is unique.
3. Old MPV2 protocol remains registered.
4. New and old protocols use different series identities.
5. New protocol is side-required with `standing_leg`.
6. New battery protocol/version is registered where applicable.
7. Old battery metadata still resolves.
8. Eyes-closed legacy protocol remains separate.
9. Unknown protocol fails safely.
10. Registry count is derived and updated accurately.

## 24.2 Stage descriptor tests

1. Exactly four stages.
2. Correct order.
3. All stages eyes open.
4. Caps are 10/10/10/12 seconds.
5. Stage 1 side role is not applicable.
6. Stages 2/3 use selected side as lead foot.
7. Stage 4 uses selected side as standing leg.
8. Descriptors are immutable.
9. No eyes-closed stage is present.

## 24.3 Coordinator/state tests

1. Protocol starts at feet together.
2. Full stage completion advances one stage.
3. Early feet-together loss ends ladder.
4. Early semi-tandem loss ends ladder.
5. Early tandem loss ends ladder.
6. Early single-leg loss completes ladder.
7. Harder stage never starts after early loss.
8. All four caps complete the ladder.
9. Stage active cannot start before required speech.
10. Stage active cannot start before go playback-start.
11. Stage start occurs exactly once.
12. Tracking interruption retries same stage.
13. Tracking partial time is discarded.
14. Fresh retry begins at zero.
15. Old stage callback cannot mutate new stage.
16. Same-timestamp precedence is deterministic.
17. User support-touch report ends ladder validly.
18. Cancel ends without saving an official result.
19. Protocol selection is pinned for whole check-up.
20. Old and new balance state machines never run simultaneously.

## 24.4 Side tests

1. Existing V2 anchor preloads the same standing leg.
2. Old MPV2 anchor may recommend side for first V2 baseline.
3. First V2 result still establishes new series.
4. Opposite-side fallback is reduced comparability.
5. Fallback does not replace V2 anchor.
6. Semi-tandem lead foot matches selected side.
7. Tandem lead foot matches selected side.
8. Single-leg standing leg matches selected side.
9. Retry preserves side.
10. Recovery preserves side.
11. Mounted voice switch preserves side.
12. UI/voice/controller/grader/result mismatch is impossible.
13. First V2 run is not marked same-protocol comparable to old MPV2.

## 24.5 Voice-runtime tests

1. Intro/setup required speech gates stage.
2. Stage countdown is three/two/one/go.
3. Active time starts from go playback-start.
4. Missing required stage asset blocks.
5. Required asset failure shows retry.
6. Retry replays full setup and countdown.
7. Tracking recovery retries same stage.
8. Stage scope cancels stale speech.
9. Voice switch during setup replays in new voice.
10. Voice switch during countdown restarts at three.
11. Voice switch during active stage is deferred safely.
12. Clara/Marcus duration differences do not alter state outcome.
13. No old multi-attempt operational cue is emitted.
14. No close/open-eyes cue is emitted.
15. Legacy old-protocol cue path still works when rollback is selected.

## 24.6 Result/scoring tests

1. Per-stage raw results persist.
2. Total maintained time is deterministic.
3. Highest completed stage is deterministic.
4. Tracking-invalid attempt is absent from valid result.
5. Early balance loss is a valid protocol result.
6. New protocol never calls old score mapping.
7. No legacy balance-age claim is produced.
8. First V2 result starts new series.
9. Same-side later V2 result is comparable.
10. Opposite-side V2 result is reduced.
11. Old/new direct delta is suppressed.
12. Valid current raw result still displays.
13. Uncalibrated evidence does not create a false weakest-domain claim.
14. Plan-focus fallback follows existing deterministic policy.

## 24.7 Persistence tests

1. Local round trip.
2. Backend round trip.
3. Restore round trip.
4. Account export includes stages/protocol.
5. Duplicate merge preserves richer evidence.
6. Old result remains readable.
7. Old result is not rewritten.
8. Malformed optional supporting metrics fail locally.
9. Selected side survives.
10. Battery version survives.

## 24.8 Micro-check compatibility tests

1. New V2 official anchor can recommend micro-check side.
2. Old MPV2 anchor remains fallback recommendation only.
3. Micro-check series remains distinct.
4. Micro check does not overwrite V2 official anchor.
5. No direct metric comparison is created.

## 24.9 Regression tests

Preserve all green tests from:

- measurement-side metadata,
- side UX,
- MPV2 voice/runtime completion,
- chair,
- shoulder,
- hinge,
- micro checks,
- backend sync/restore,
- history/trends/progress/reports.

Target:

```text
MPV2/side foundation P0/P1/P2 remains 0/0/0
```

The deferred device-only P3 may remain.

---

# 25. Audio cue-reuse and pending-asset audit

Create a machine-readable row for every voice concept required by the new protocol.

For each record:

- logical event
- proposed cue key
- exact intended script
- side variant
- current candidate key
- current source script
- Clara asset exists
- Marcus asset exists
- semantic match
- runtime requiredness
- reuse decision
- generation required later
- feature-flag blocker
- notes

Suggested statuses:

- `reuse_exact_existing_pair`
- `reuse_existing_generic_with_visible_side`
- `new_pair_required`
- `legacy_only`
- `not_required`

## Script targets

Use concise scripts consistent with V2.1.

Examples to evaluate, not blindly copy:

### Intro

```text
Balance check. Keep support within easy reach. I’ll guide each stance.
```

### Feet together

```text
Feet together. Keep your eyes open and support within reach.
```

### Semi-tandem left/right

```text
Place your left foot half a step forward. Keep your eyes open.
```

```text
Place your right foot half a step forward. Keep your eyes open.
```

### Tandem left/right

```text
Place your left foot directly in front, heel to toe. Keep your eyes open.
```

```text
Place your right foot directly in front, heel to toe. Keep your eyes open.
```

### Single-leg left/right

```text
Stand on your left leg and lift your right foot slightly.
```

```text
Stand on your right leg and lift your left foot slightly.
```

### Completion

```text
Balance check complete.
```

Do not add these to the production manifest without corresponding physical pairs.

---

# 26. Required implementation artifacts

Create:

1. `docs/audits/HALE_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md`
2. `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.md`
3. `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json`
4. `docs/audits/HALE_EYES_OPEN_BALANCE_V2_SCENARIOS.csv`
5. `docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv`
6. `docs/audits/HALE_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md`

You may add an audit-only harness:

- `scripts/audits/audit-eyes-open-balance-v2.mjs`

Do not overwrite earlier audits.

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,protocolId,protocolVersion,batteryVersion,selectedSide,stageId,stageOrder,event,maintainedMs,endReason,nextStage,ladderEnded,trackingRetry,comparabilityOutcome,seriesKey,voiceCueKeys,requiredAssetStatus,resultValid,testCoverage,notes
```

## Voice requirements CSV columns

Use columns similar to:

```text
logicalEvent,proposedCueKey,sideVariant,intendedScript,currentCandidateKey,currentSourceScript,claraExists,marcusExists,semanticMatch,runtimeRequiredness,reuseDecision,generationRequiredLater,featureFlagBlocker,notes
```

---

# 27. Implementation report structure

Use:

# Hale Eyes-Open Balance Protocol V2 Implementation

## 1. Result

## 2. Approved FD-003 Contract

## 3. Old and New Protocol Separation

## 4. Protocol and Battery Versioning

## 5. Stage Descriptors

## 6. Stage State Machine

## 7. Progression and Early-Termination Rules

## 8. Tracking Recovery

## 9. Side and Lead-Foot Semantics

## 10. Voice Runtime Integration

## 11. Cue Reuse and Pending Assets

## 12. Result Evidence and Scoring Boundary

## 13. Persistence, Sync, and Restore

## 14. History and Comparability

## 15. Micro-Check Side Recommendation

## 16. Feature Flag and Rollback

## 17. Diagnostics

## 18. Tests

## 19. Files Changed

## 20. Worktree Integrity

## 21. Exact Next Phase

---

# 28. Post-implementation audit requirements

The audit must report:

- registered protocol count,
- new protocol id/version,
- new battery id/version,
- stage count,
- eyes-open stage count,
- default eyes-closed stage count,
- old protocol preserved,
- old history rewritten count,
- cross-protocol delta count,
- selected/lead/standing-side mismatch count,
- progression-after-early-loss count,
- tracking partial-time carryover count,
- missing fresh countdown count,
- required-cue silent continuation count,
- stale-stage callback count,
- old operational cue emission count in V2,
- close/open-eyes cue emission count in V2,
- persistence failures,
- micro-check false-equivalence count,
- legacy parsing failures,
- voice asset reuse count,
- pending new cue-pair count,
- P0/P1/P2/P3 counts.

Issue exactly one verdict:

- `EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE`
- `EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE_AUDIO_PENDING`
- `REMEDIATION_REQUIRED`
- `CURRENT_SOURCE_REBASE_REQUIRED`
- `DATA_REPAIR_REQUIRED`

Use `SOFTWARE_COMPLETE_AUDIO_PENDING` when software/tests pass but exact required voice pairs remain ungenerated and the feature flag stays off.

Do not choose complete if:

- an eyes-closed cue is reachable,
- old/new protocol history is mixed,
- a harder stage advances after early loss,
- tracking partial time is retained,
- selected side drifts,
- legacy scoring is silently reused,
- required audio is missing from an enabled default path.

---

# 29. Completion gates

Do not claim completion unless all applicable gates pass.

## Protocol

- New protocol identity exists.
- Old protocol identity remains.
- Battery version is explicit.
- New and old series are separate.
- Old results rewritten: `0`.

## Stages

- Stage count: `4`
- Eyes-open stages: `4`
- Default eyes-closed stages: `0`
- Semi-tandem present: `1`
- Harder-stage advancement after early loss: `0`
- Tracking interruption counted as balance failure: `0`
- Tracking partial time retained: `0`
- Recovery without fresh countdown: `0`

## Side

- Selected side drift: `0`
- Semi-tandem lead-foot mismatch: `0`
- Tandem lead-foot mismatch: `0`
- Single-leg standing-leg mismatch: `0`
- Opposite fallback replacing anchor: `0`
- First V2 result compared directly to old MPV2: `0`

## Voice/runtime

- Required-cue silent continuation: `0`
- Missing audible start: `0`
- Stale cross-stage speech: `0`
- Old multi-attempt operational cue emitted in V2: `0`
- Eyes-closed cue emitted in V2: `0`
- Clara/Marcus state-outcome difference: `0`
- Two live voice channels: `0`

## Evidence/claims

- New V2 result passed to legacy balance-age formula: `0`
- False cross-protocol trend claim: `0`
- False calibrated band/age claim: `0`
- Current raw result hidden unnecessarily: `0`

## Persistence

- Local round-trip failure: `0`
- Backend round-trip failure: `0`
- Restore failure: `0`
- Richer stage evidence lost during merge: `0`

## Regression

- Measurement-side foundation P0/P1/P2: `0/0/0`
- MPV2 voice/runtime P0/P1/P2: `0/0/0`
- Device-only P3 may remain deferred
- No audio changed
- No audio generated
- No external speech/audio API called

---

# 30. Handoff to the next voice-project phase

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md`

The handoff must state the next phase as:

```text
Training Voice V2.1 implementation foundation and exact instruction mapping for all 37 registered exercise levels
```

Include:

- balance protocol status,
- whether audio remains pending,
- protocol registry APIs,
- voice-runtime APIs that training should reuse,
- cue policy classes,
- side/laterality APIs,
- remaining approved training dependencies:
  - safety-family consolidation,
  - both-sides round state,
  - dose preservation,
  - step-up alternation,
  - floor-transfer readiness,
  - training controls/progress/recovery,
- exact training Voice V2.1 assets still ungenerated,
- tests that must remain green,
- physical-device QA still deferred.

Do not implement training voice in this task.

---

# 31. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- protocol registry,
- measurement context/comparability,
- side UX,
- old one-leg balance,
- new eyes-open balance,
- MPV2 coordinator,
- MPV2 voice runtime,
- MPV2 recovery,
- check-up internal flow,
- results/history/progress,
- check-up serialization,
- backend sync/restore,
- micro-check side setup.

Run broader relevant suites where practical.

Run the audit-only harness.

Parse all generated JSON and CSV artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

Do not modify tests merely to make them pass.

---

# 32. Final Codex response

When finished, respond with:

- Summary of implementation
- Paths to all six generated artifacts
- All production files changed
- All test files changed/added
- Any audit-only harness added
- Confirmation that no audio changed or was generated
- Confirmation that no external speech/audio API was called
- Confirmation that physical-device QA remains deferred
- Current branch and commit
- Whether the worktree was already dirty
- New protocol id/version
- New battery id/version
- Feature-flag name/default
- Whether V2 is the live default or software-complete/audio-pending
- Old protocol preservation status
- Stage ids and caps
- Stage progression rule
- Early-loss behaviour
- Tracking-recovery behaviour
- Selected-side/lead-foot/standing-leg policy
- Result raw-summary fields
- Legacy scoring boundary
- Old/new comparison-series behaviour
- Micro-check recommendation behaviour
- Existing voice pairs reused
- Pending new cue-pair count
- Default eyes-closed cue emission count
- Old operational cue emission count in V2
- Selected-side mismatch count
- Progression-after-early-loss count
- Tracking partial-time carryover count
- Local/backend/restore failure counts
- Post-patch P0/P1/P2/P3 counts
- Verdict
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused test results
- Exact next task from the handoff
- A concise confidence statement

Do not generate balance audio, implement training voice, or perform physical-device QA in this task.
