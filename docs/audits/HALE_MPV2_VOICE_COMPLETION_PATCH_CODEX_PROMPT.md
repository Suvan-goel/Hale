# Codex Prompt: Hale MPV2 Voice Completion Patch — Tracking, Recovery, Retry, and Mounted Voice Switching

Read this entire prompt before changing anything.

Hale’s MPV2 voice-runtime foundation is now implemented and has passed the post-foundation static/runtime gates.

Current verified foundation state:

- 42 canonical scenarios
- 378 simulated variants
- 604 timeline rows
- P0/P1/P2/P3: `0 / 0 / 2 / 1`
- Missing audible-start cases: `0`
- Required-cue silent continuations: `0`
- Essential deterministic drops: `0`
- Stale cross-stage speech: `0`
- Clara/Marcus state-outcome differences: `0`
- Chair measurement starts from the `go` playback-start event
- Required tracked speech blocks dependent progression
- Required failures enter a visible retry state
- Stage-scoped cancellation and stale-callback guards are active

The two remaining P2 MPV2 voice findings are:

1. **MPV2-RT-006 — tracking/recovery narration is incomplete**
   - `tracking-loss-v21`, `tracking-recovered-v21`, and `retry-v21` exist for Clara and Marcus.
   - Full active tracking-loss, recovery, retry, and recovery-screen voice behaviour is not yet wired consistently.

2. **MPV2-RT-009 — mounted voice switching is incomplete**
   - A mounted MPV2 screen/channel does not yet apply a Clara/Marcus preference change safely and deterministically.

Physical-device QA is intentionally deferred until the entire Hale voice-cue project is implemented.

This task must finish the remaining MPV2 voice behaviour **without performing device QA** and without reopening the approved product decisions.

---

# 1. Source artifacts

Read and use:

## Foundation implementation and post-fix audit

- `docs/audits/HALE_MPV2_RUNTIME_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.json`
- `docs/audits/HALE_MPV2_POST_FOUNDATION_TIMELINES.csv`
- `docs/audits/HALE_MPV2_POST_FOUNDATION_FINDINGS.csv`
- `scripts/audits/audit-mpv2-runtime-foundation.mjs`

## Previous targeted audit and remediation plan

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.json`
- `docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`

## Cue reconciliation and current assets

- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.md`
- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.json`
- `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv`

## Approved voice specification

- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`

The listening-review waiver remains in effect:

```text
Founder listening status: waived_assumed_pass_by_founder.
Human verified: false.
```

Do not claim the recordings have been human-approved.

---

# 2. Objective

Complete the current MPV2 voice layer so that:

1. Confirmed active tracking loss immediately stops or invalidates the current measured attempt according to the movement contract.
2. Tracking-loss narration is spoken once per recovery episode.
3. Repeated lost-frame events do not spam or duplicate narration.
4. Recovery guidance gives the user enough context to return to the required setup without looking at the screen.
5. Stable recovery is acknowledged once.
6. Every recovered measured attempt starts from a **fresh full countdown**.
7. No partial measurement resumes after tracking loss.
8. Retry actions have deterministic narration and replay the full required prerequisite.
9. The recovery screen has a complete voice path.
10. Missing recovery narration cannot silently start a measured attempt.
11. Voice changes between Clara and Marcus are applied safely while the MPV2 screen remains mounted.
12. A voice change never mixes voices within one critical sequence or measured attempt.
13. Old-channel callbacks cannot affect the new voice or current stage.
14. The existing foundation gates remain at zero.
15. The extended post-completion runtime audit has zero P0/P1 findings.
16. Physical-device-only questions remain explicitly deferred to the final whole-project QA pass.

---

# 3. Strict scope

## In scope

- Wiring existing MPV2 tracking-loss/recovery/retry assets.
- Item-specific tracking recovery for chair, balance, shoulder, and hinge.
- Recovery-screen narration and retry orchestration.
- Fresh countdown after recovery.
- Recovery episode identity and deduplication.
- Precedence between tracking loss, times-up, completion, cancel, and retry.
- Safe mounted Clara/Marcus switching.
- Voice-channel replacement or equivalent active-voice lifecycle.
- Deferred voice switching during active measurement.
- Replay of a cancelled prerequisite in the new voice where required.
- Development-only diagnostics.
- Focused tests.
- Extended static/runtime audit.
- A handoff document for the broader training and micro-check voice implementation.

## Out of scope

Do not implement in this task:

- Physical Android or iOS QA.
- Audio regeneration.
- ElevenLabs calls.
- Listening review.
- Copy rewrites.
- New voice assets.
- Full V2.1 eyes-open staged balance protocol.
- Measurement-side persistence.
- Training voice V2.1.
- Micro-check voice V2.1.
- Both-sides training rounds.
- Step-up alternating-leg changes.
- Floor-transfer readiness gate.
- Safety narration overhaul outside MPV2.
- General legacy training/check-up/micro-check architecture migration.
- TUG changes.
- Broad priority redesign unrelated to these two P2 findings.

Do not claim production/device readiness after this task.

---

# 4. Worktree safety

The repository was already heavily dirty before the foundation patch.

Before editing:

- Record branch, full/short `HEAD`, upstream, and `git status --short --branch`.
- Identify pre-existing changes.
- Do not reset, checkout, stash, clean, or overwrite unrelated work.
- Do not delete untracked MP3s or audit/spec files.
- Do not regenerate manifests wholesale.
- Do not commit or push.
- Touch only files required for this completion patch, its tests, and requested reports.

At the end, distinguish pre-existing changes from this task’s footprint.

---

# 5. Current source to inspect

At minimum inspect:

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/voiceRuntime.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/voiceRuntime.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts`
- any recovery-screen tests
- `src/checkup/movementProfileV2.ts`
- the chair, balance, shoulder, and hinge graders used by MPV2
- `src/config/movementProfileV2VoiceRuntimeFoundation.ts`
- current voice/profile state plumbing
- `App.tsx`
- current audio-mode and AppState handling
- all files referenced by the post-foundation audit

Inspect exact current scripts for:

- `tracking-loss-v21`
- `tracking-recovered-v21`
- `retry-v21`
- `mpv2_balance_tracking_retry`
- `mpv2_shoulder_tracking_retry`

Do not assume these cues are interchangeable.

---

# 6. Preserve the foundation contract

Do not regress any established foundation behaviour.

Required invariants:

- Legacy `VoiceChannel.speak()` remains compatible.
- Tracked requests resolve exactly once.
- Required speech failures remain fail-closed.
- Required prerequisites gate measured attempts.
- Chair countdown remains `three / two / one / go`.
- Chair active begins from `go` playback-start.
- Old scope callbacks cannot advance current state.
- Meaningful stage changes cancel stale tracked speech.
- Visible audio failure/retry remains available.
- The old silent chair-start timer remains disabled in the foundation path.
- The foundation feature flag does not run old and new systems simultaneously.

Any regression is a task failure.

---

# 7. Tracking-loss event model

Create one explicit, testable MPV2 tracking-loss model.

A suitable type is:

```ts
type Mpv2TrackingLossPhase =
  | 'none'
  | 'loss_confirmed'
  | 'loss_voice'
  | 'awaiting_recovery_position'
  | 'recovery_instruction'
  | 'recovery_ready'
  | 'recovery_countdown'
  | 'restarted_attempt';
```

A suitable recovery episode record is:

```ts
interface Mpv2RecoveryEpisode {
  recoveryId: string;
  itemId: 'chair' | 'balance' | 'shoulder' | 'hinge';
  attemptId: string;
  stageEpoch: number;
  lossConfirmedAtMs: number;
  reason: string;
  originalVoiceId: VoiceId;
  trackingLossCueEmitted: boolean;
  recoveryInstructionCueKeys: VoiceCueId[];
  recoveredCueEmitted: boolean;
  retryCount: number;
}
```

Equivalent repository-consistent naming is acceptable.

## 7.1 Confirmed loss, not raw low confidence

Do not trigger `tracking-loss-v21` from every low-confidence frame.

Use the existing movement/coordinator definition of a **confirmed interruption** or add a deterministic debounced threshold consistent with current grader validity rules.

Document:

- source signal,
- dwell/debounce,
- which stages can confirm loss,
- which setup states continue using ordinary preflight prompts instead.

## 7.2 Active measurement only

`tracking-loss-v21` is primarily an active-attempt stop/recovery cue.

During ordinary setup:

- continue using setup/readiness prompts,
- do not announce critical tracking loss for routine framing corrections,
- do not create a recovery episode until a measured attempt has actually started or an explicit current contract requires it.

## 7.3 On confirmed active loss

The following must happen deterministically:

1. Freeze or end the active measurement immediately.
2. Invalidate the partial attempt unless the movement contract explicitly accepts data before interruption.
3. Cancel optional/progress narration.
4. Create one recovery episode id.
5. Enter a recovery scope tied to the item and attempt.
6. Emit `tracking-loss-v21` once at critical-stop priority.
7. Prevent all stale grader/timer callbacks from completing the invalid attempt.
8. Prevent a new attempt from starting until recovery prerequisites and a fresh countdown complete.

The stop/freeze must not wait for speech playback.

## 7.4 Repeated loss events

While the same recovery episode is active:

- ignore duplicate confirmed-loss events,
- do not replay `tracking-loss-v21`,
- do not increment attempts repeatedly,
- do not create new recovery ids,
- record a bounded diagnostic counter.

A new tracking-loss cue is allowed only after a genuinely restarted attempt begins.

---

# 8. Tracking-loss versus terminal-event precedence

Define deterministic timestamp/order precedence.

At minimum cover:

- tracking loss before times-up,
- times-up before tracking loss,
- same-frame tracking loss and times-up,
- tracking loss before target completion,
- target completion before tracking loss,
- cancel before tracking loss,
- tracking loss before cancel,
- app background during active attempt,
- state completion while a loss callback is pending.

Use one authoritative monotonic event ordering.

Recommended rule:

1. A terminal event already accepted by the coordinator at an earlier monotonic timestamp wins.
2. If confirmed loss is accepted first, the attempt is invalid/recoverable and later times-up/completion callbacks are stale.
3. If valid times-up/target completion is accepted first, the result completes normally and a later loss signal does not reopen it.
4. Same-timestamp ties use an explicit deterministic precedence documented in code and tests.

Do not let React effect order decide implicitly.

---

# 9. Recovery voice policy

Use no more than:

1. One immediate loss cue.
2. One item-specific recovery instruction where needed.
3. One short recovered confirmation.
4. One fresh countdown.

Do not stack redundant recovery lines.

## 9.1 Immediate loss

Use:

- `tracking-loss-v21`

This is a critical-stop cue.

The measurement is already frozen/invalidated before or at the same coordinator transition; speech does not control the stop itself.

## 9.2 Item-specific recovery instruction

Inspect the actual current source scripts.

Use current assets only where they add necessary item-specific context.

### Chair

No chair-specific tracking asset currently exists.

Recommended recovery sequence:

- immediate `tracking-loss-v21`
- return to chair final setup/readiness
- replay the required chair prerequisite needed for this stage
- `tracking-recovered-v21`
- fresh full countdown

Do not replay the entire check-up intro.

### Balance

Evaluate:

- `mpv2_balance_tracking_retry`

Use it only if it gives necessary balance-specific setup context not already conveyed by `tracking-loss-v21` or visible state.

Do not speak both a generic and item-specific sentence that say the same thing.

The restarted balance attempt must be a new attempt identity.

### Shoulder

Evaluate:

- `mpv2_shoulder_tracking_retry`

The recovery instruction must preserve the already selected side.

It must not silently switch from left to right or right to left.

After stable side-specific setup:

- `tracking-recovered-v21`
- fresh countdown or the exact current start-boundary sequence
- new capture attempt

### Hinge

No hinge-specific tracking retry asset currently exists.

Replay only the essential current hinge setup prerequisite needed to restart safely, followed by recovered confirmation and a fresh countdown/start boundary.

## 9.3 Stable recovery

`tracking-recovered-v21` may play only after:

- current item final-position readiness is stable,
- the recovery episode is still current,
- the selected side/stance remains valid,
- no cancel/exit/new loss has occurred.

It must play once per recovery episode.

## 9.4 Fresh attempt

After recovery:

- discard partial active-window state,
- reset grader state required for a fresh valid attempt,
- create a new attempt id,
- run a complete countdown,
- begin only from the correct start boundary,
- never resume remaining seconds from the interrupted attempt.

---

# 10. Retry semantics

Use `retry-v21` deliberately.

## 10.1 User-triggered retry

When the user chooses Retry after:

- required-audio failure,
- invalid measurement,
- recovery screen,
- no-measurement branch,
- or another supported retry state,

the system must:

1. Cancel the current scope.
2. Invalidate stale callbacks.
3. Create a new stage epoch/attempt where appropriate.
4. Optionally speak `retry-v21` as a short transition confirmation.
5. Replay the full required setup prerequisite for the current item.
6. Re-establish final-position readiness.
7. Run a fresh full countdown.
8. Start a new attempt.

## 10.2 Requiredness

`retry-v21` itself is not a safety-critical prerequisite if the full setup and countdown are subsequently spoken.

Recommended classification:

- `optional_transition` or visible-fallback transition.

If `retry-v21` fails:

- continue to the required setup prerequisite,
- do not silently skip the required setup/countdown,
- record the failure diagnostically.

## 10.3 Duplicate taps

Rapid Retry taps must:

- create at most one new recovery/retry transaction,
- cancel prior retry work deterministically,
- never start duplicate countdowns,
- never create duplicate attempts.

---

# 11. Recovery screen narration

Complete the voice path in:

- `MovementProfileV2RecoveryScreen.tsx`

Requirements:

- On entry, determine whether the preceding screen already emitted `tracking-loss-v21`.
- Never speak the same loss cue twice for one recovery id.
- Speak one relevant recovery instruction when needed.
- Keep Retry and Exit visible.
- Retry uses the retry contract above.
- Exit cancels all voice and recovery work.
- Unmount clears tracked requests.
- A screen remount for the same recovery id does not replay narration unless the user explicitly requests it or the previous request never started.
- A new recovery id may speak again.
- Recovery-screen narration is stage-scoped and cannot continue into the restarted attempt.
- Do not add a new audio asset.

If the recovery screen is not used by every MPV2 interruption path, make ownership explicit so exactly one layer owns each cue.

---

# 12. Mounted Clara/Marcus switching

Finish live voice switching without mixing or stale callbacks.

The current selected voice preference may change while MPV2 remains mounted.

Implement a safe model with:

- `desiredVoiceId`
- `activeVoiceId`
- `pendingVoiceId`
- voice-generation/channel identity
- explicit safe switch boundaries

Equivalent naming is acceptable.

## 12.1 General invariants

- Only one `VoiceChannel` may be active.
- The old channel is stopped/released before the new channel becomes active.
- Old tracked requests resolve as cancelled with a voice-change reason.
- Old callbacks cannot dispatch coordinator actions.
- A critical sequence never mixes Clara and Marcus.
- A measured attempt never changes voice halfway through its active window.
- The new preference is eventually applied without requiring screen remount.
- Diagnostics record requested, deferred, and applied voice changes.

## 12.2 Safe switch behaviour by state

### Idle/result/noncritical transition

If no required sequence, countdown, or active measurement is running:

- switch immediately,
- cancel optional old-voice speech,
- next cue uses the new voice.

### Blocking setup instruction

If a blocking prerequisite is playing:

- cancel the old request,
- rebuild the channel,
- replay the **entire current prerequisite** in the new voice,
- keep dependent actions disabled,
- do not continue from the middle of a sequence.

### Countdown

If the voice changes during countdown:

- cancel the current countdown,
- invalidate the old `go` callback,
- rebuild the channel,
- restart from `countdown-three` in the new voice,
- do not start measurement from the old countdown.

### Active measurement

If the voice changes during active measurement:

- do not interrupt or alter the measured attempt solely for the preference change,
- defer application until the attempt reaches a safe boundary,
- use the current active voice for any immediate critical stop/times-up cue belonging to that attempt,
- apply the pending new voice before the next setup/recovery/result sequence as defined by one consistent rule.

Choose and document the exact safe boundary.

### Recovery

If the voice changes during recovery:

- cancel incomplete noncritical recovery narration,
- rebuild,
- replay the current required recovery prerequisite in the new voice,
- never duplicate `tracking-loss-v21`,
- restart countdown in the new voice if countdown had begun.

### Rapid multiple changes

If the user changes Clara → Marcus → Clara quickly:

- only the latest desired voice survives,
- no multiple channels remain,
- no duplicate replay,
- no stale intermediate voice callback.

## 12.3 Preference plumbing

Inspect how voice preference reaches the screen.

Do not solve this with a stale constructor-captured prop.

The mounted runtime must observe current preference state.

Do not introduce a second independent profile source of truth.

---

# 13. Priority and policy mapping

Preserve the canonical policy classes.

Required mappings:

| Cue/event | Policy |
|---|---|
| `tracking-loss-v21` | `critical_stop` |
| `tracking-recovered-v21` | `setup_recovery` or `result_transition`, choose once and justify |
| `retry-v21` | `optional_transition` mapped to the current result-transition priority without becoming a blocking safety prerequisite |
| `mpv2_balance_tracking_retry` | `instruction` or `result_transition`, based on actual script purpose |
| `mpv2_shoulder_tracking_retry` | `instruction` or `result_transition`, based on actual script purpose |
| fresh countdown / `go` | existing `critical_window` |
| active times-up | existing `critical_stop` |

Do not make every recovery cue priority 100.

The immediate stop is critical; setup/recovered narration is not.

Ensure lower-priority optional recovery narration cannot delay or invalidate a start/stop boundary.

---

# 14. Failure behaviour

Explicitly test and handle:

- missing `tracking-loss-v21`,
- missing `tracking-recovered-v21`,
- missing `retry-v21`,
- missing item-specific tracking-retry asset,
- playback creation failure,
- playback-start failure,
- no completion callback,
- late callback after voice change,
- late callback after recovery cancellation,
- voice change during failed required speech,
- app background during recovery,
- app foreground with pending recovery,
- unmount while switching voice.

Recommended semantics:

- Missing immediate loss audio must not prevent the measurement from stopping.
- The user must still see a recovery state.
- Missing recovered/setup prerequisite must block the restarted measured attempt where that speech is required.
- Missing optional `retry-v21` must not block the subsequent required setup.
- No failure may produce a partial resumed attempt.

---

# 15. Feature flag and rollback

Keep the existing:

```text
EXPO_PUBLIC_ENABLE_MPV2_VOICE_RUNTIME_FOUNDATION
```

as the foundation gate unless repository conventions require a subordinate internal flag.

Preferred approach:

- Extend the enabled foundation path.
- Do not create a parallel third voice system.
- Preserve old internal rollback only for debugging.
- The old unsafe path must not become the default.

If adding a completion sub-flag is necessary, use a narrowly scoped name and default it on only inside the already-enabled foundation path.

Report exact evaluation order.

---

# 16. Diagnostics

Extend bounded, privacy-safe diagnostics with:

- recovery id,
- attempt id,
- loss confirmed,
- duplicate loss suppressed,
- loss cue requested/started/completed/failed,
- recovery readiness achieved,
- recovered cue requested/started/completed/failed,
- fresh countdown started,
- retry requested,
- retry deduplicated,
- voice switch requested,
- voice switch deferred,
- voice switch applied,
- old channel cancelled,
- old callback ignored,
- active/desired voice ids,
- safe-boundary reason.

Do not log:

- raw video,
- landmarks,
- health results,
- account identifiers,
- personal profile data.

---

# 17. Required tests

Do not weaken or delete existing tests.

## 17.1 Tracking-loss coordinator tests

Add deterministic tests for:

1. Confirmed active loss freezes/invalidates chair attempt.
2. Confirmed active loss freezes/invalidates balance attempt.
3. Confirmed active loss freezes/invalidates shoulder attempt.
4. Confirmed active loss freezes/invalidates hinge attempt.
5. Setup framing noise does not trigger active tracking-loss narration.
6. Loss cue emits once per recovery id.
7. Repeated loss signals are deduplicated.
8. New restarted attempt may emit a new loss cue.
9. Partial attempt is not resumed.
10. Fresh attempt id is created after recovery.
11. Stale grader callbacks from the interrupted attempt are ignored.
12. Tracking loss before times-up wins.
13. Times-up before tracking loss wins.
14. Same-frame tie follows documented precedence.
15. Cancel invalidates pending loss/recovery work.

## 17.2 Recovery voice tests

Add tests for:

1. Chair recovery replays the correct setup prerequisite.
2. Balance uses `mpv2_balance_tracking_retry` only when semantically necessary.
3. Shoulder recovery preserves selected side.
4. Shoulder uses the matching left/right setup after recovery.
5. Hinge recovery replays the essential setup.
6. `tracking-recovered-v21` emits once after stable readiness.
7. Recovered cue never emits before stable readiness.
8. Recovered cue is cancelled by a new loss.
9. Fresh full countdown follows recovery.
10. Missing required recovered/setup cue blocks restart.
11. Missing immediate loss cue still stops measurement and shows visual recovery.
12. Recovery sequence does not duplicate semantically equivalent lines.

## 17.3 Retry tests

Add tests for:

1. Retry cancels current scope.
2. Retry creates one new transaction.
3. Rapid double Retry does not create duplicate countdowns.
4. `retry-v21` may fail without skipping required setup.
5. Required setup failure after retry remains fail-closed.
6. Retry from required-audio error.
7. Retry from no-measurement result.
8. Retry from recovery screen.
9. Retry preserves prior completed item results.
10. Retry does not reuse partial active time.

## 17.4 Recovery-screen tests

Add tests for:

1. Existing recovery id does not replay loss cue twice.
2. New recovery id can speak.
3. Entry narration ownership is unambiguous.
4. Retry invokes fresh prerequisite/countdown.
5. Exit cancels speech.
6. Unmount cancels speech.
7. Remount does not duplicate narration.
8. Missing optional retry cue retains visual controls.
9. No stale recovery cue crosses into active attempt.

## 17.5 Mounted voice-switch tests

Add tests for:

1. Idle switch applies immediately.
2. Setup switch cancels and replays prerequisite in new voice.
3. Countdown switch restarts at three in new voice.
4. Old `go` callback cannot start measurement.
5. Active-attempt switch is deferred.
6. Active attempt retains one voice through its critical stop boundary.
7. Pending voice applies at the documented safe boundary.
8. Recovery switch replays only current required recovery context.
9. Loss cue is not duplicated by switching.
10. Rapid Clara → Marcus → Clara keeps only final preference.
11. Old-channel completion callback is ignored.
12. No two channels remain active.
13. No mixed-voice sequence.
14. No duplicate attempt start.
15. Voice preference changes without screen remount.
16. Clara/Marcus durations do not alter state outcome.

## 17.6 Regression tests

Re-run and preserve all foundation tests for:

- tracked outcomes,
- required failure,
- stage cancellation,
- chair countdown,
- go playback-start,
- button guards,
- visible audio retry,
- watchdog,
- legacy `speak()` compatibility.

---

# 18. Extended post-completion runtime audit

Do not overwrite the post-foundation audit.

Create:

1. `docs/audits/HALE_MPV2_VOICE_COMPLETION_IMPLEMENTATION.md`
2. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
3. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.json`
4. `docs/audits/HALE_MPV2_POST_COMPLETION_TIMELINES.csv`
5. `docs/audits/HALE_MPV2_POST_COMPLETION_FINDINGS.csv`
6. `docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md`

Add or update an audit-only harness such as:

- `scripts/audits/audit-mpv2-runtime-completion.mjs`

## 18.1 Preserve original scenarios

Retain all 42 original canonical scenario ids and verify that all foundation gates remain zero.

## 18.2 Add required completion scenarios

Add at least these canonical scenarios:

### Tracking and recovery

- `tracking_loss_during_chair_active`
- `tracking_recovery_chair_fresh_countdown`
- `tracking_loss_during_balance_active`
- `balance_specific_recovery_guidance`
- `tracking_loss_during_shoulder_active_left`
- `tracking_loss_during_shoulder_active_right`
- `shoulder_recovery_preserves_side`
- `tracking_loss_during_hinge_active`
- `hinge_recovery_fresh_attempt`
- `repeated_tracking_loss_same_episode`
- `new_loss_after_restarted_attempt`
- `tracking_loss_before_times_up`
- `times_up_before_tracking_loss`
- `same_frame_loss_times_up_precedence`
- `recovery_lost_again_before_countdown`
- `missing_tracking_loss_asset`
- `missing_tracking_recovered_asset`
- `missing_item_specific_recovery_asset`

### Retry and recovery screen

- `retry_from_required_audio_failure`
- `retry_from_invalid_measurement`
- `retry_from_recovery_screen`
- `rapid_double_retry`
- `retry_optional_audio_failure`
- `recovery_screen_remount_same_id`
- `recovery_exit_during_speech`

### Mounted voice switching

- `voice_switch_idle`
- `voice_switch_during_blocking_setup`
- `voice_switch_during_countdown`
- `voice_switch_during_active_measurement`
- `voice_switch_during_recovery`
- `voice_switch_during_result_transition`
- `rapid_multiple_voice_switches`
- `old_voice_callback_after_switch`
- `voice_switch_and_tracking_loss_same_window`
- `voice_switch_clara_marcus_state_parity`

Minimum expected canonical scenario count:

```text
42 existing + at least 35 completion scenarios = at least 77
```

If equivalent scenarios are grouped, preserve the explicit ids and explain equivalence.

## 18.3 Variant model

For timing-sensitive scenarios model:

- Clara and Marcus
- L0, L100, and L250
- immediate/250ms/after-current-speech user actions where relevant

The harness must derive outcomes from current source helpers or a faithful model, not hard-code passes.

---

# 19. Post-completion gates

Do not claim completion unless all static/modelled gates pass.

## Foundation regression gates

- P0: `0`
- P1: `0`
- Missing audible start: `0`
- Required-cue silent continuation: `0`
- Essential deterministic drop: `0`
- Stale cross-stage speech: `0`
- Clara/Marcus state-outcome difference: `0`
- Duplicate active start: `0`
- Hung tracked request: `0`

## New completion gates

- Confirmed tracking loss followed by partial-attempt resume: `0`
- Duplicate loss cue within one recovery episode: `0`
- Recovery cue before stable readiness: `0`
- Recovery without fresh countdown: `0`
- Retry-created duplicate countdown: `0`
- Silent retry path lacking required setup: `0`
- Recovery-screen stale cue crossing restart: `0`
- Mixed Clara/Marcus cues within one critical sequence: `0`
- Old voice callback affecting new channel/stage: `0`
- Voice switch causing measurement start/stop change: `0`
- Voice switch leaving two live channels: `0`
- Selected shoulder side changed by recovery or voice switch: `0`
- P2 finding for incomplete tracking/recovery narration: resolved
- P2 finding for mounted voice switching: resolved

Device-only audible-onset uncertainty may remain P3 and must not be falsely closed.

---

# 20. Handoff to the broader voice project

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md`

It must state what remains after MPV2 voice completion, ordered for the next phase:

1. Measurement-side persistence and protocol metadata.
2. Approved eyes-open balance protocol V2 reconciliation.
3. Training Voice V2.1 implementation for all 37 exact levels.
4. Safety-family consolidation.
5. Both-sides round state and dose preservation.
6. Step-up alternating-leg support.
7. Floor-transfer readiness gate.
8. Training controls/progress/recovery cues.
9. Micro-check Voice V2.1.
10. Final cue schema and manifests.
11. Generation of missing/rewritten Clara and Marcus assets.
12. Whole-project static/runtime re-audit.
13. One final consolidated Android/iOS physical-device QA pass.

Do not perform those phases in this task.

The exact next task after successful completion should be the first broader implementation phase, not device QA.

---

# 21. Implementation report structure

Use:

# Hale MPV2 Voice Completion Implementation

## 1. Result

## 2. Remaining Findings Addressed

Map:

- MPV2-RT-006
- MPV2-RT-009

to exact code and tests.

## 3. Tracking-Loss State Model

## 4. Terminal-Event Precedence

## 5. Recovery Episode and Deduplication

## 6. Item-Specific Recovery

## 7. Retry Semantics

## 8. Recovery-Screen Narration

## 9. Mounted Voice Switching

## 10. Priority and Failure Behaviour

## 11. Diagnostics

## 12. Foundation Regression Safety

## 13. Tests

## 14. Extended Runtime Audit

## 15. Remaining Device-Only Risks

## 16. Files Changed

## 17. Worktree Integrity

## 18. Exact Next Project Phase

---

# 22. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit
```

Run focused Jest suites covering:

- `src/audio/__tests__/voicePlayer.test.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/voiceRuntime.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts`
- recovery-screen tests
- mounted voice-switch tests
- all new completion tests

Also run the broader relevant repository test command where practical.

Run the extended audit-only harness.

Parse all generated JSON and CSV artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
```

Do not modify tests merely to make them pass.

---

# 23. Final Codex response

When finished, respond with:

- Summary of the implemented MPV2 voice completion
- Paths to all six generated artifacts
- All production files changed
- All test files changed/added
- Any audit-only harness changed/added
- Confirmation that no audio changed or was generated
- Confirmation that no external API was called
- Confirmation that listening remains waived, not completed
- Confirmation that physical-device QA was deferred
- Current branch and commit
- Whether the worktree was already dirty
- Tracking-loss confirmation rule
- Recovery episode/deduplication mechanism
- Item-specific recovery mappings
- Retry requiredness and failure behaviour
- Recovery-screen narration ownership
- Voice-switch behaviour in:
  - idle/setup
  - countdown
  - active measurement
  - recovery
- Safe boundary used for deferred active-measurement switching
- Old-channel cancellation/stale-callback mechanism
- Feature flag/rollback behaviour
- Focused test results
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Canonical scenario count
- Simulated variant count
- Timeline row count
- Post-completion P0/P1/P2/P3 counts
- Foundation regression-gate counts
- Duplicate tracking-loss cue count
- Partial-attempt resume count
- Recovery-without-fresh-countdown count
- Retry duplicate-countdown count
- Mixed-voice critical-sequence count
- Old-channel stale-callback count
- Voice-switch state-outcome difference count
- Whether MPV2 static/runtime voice completion gates pass
- Device-only questions remaining
- Exact next task from the broader-project handoff
- A concise confidence statement

Do not claim physical audible-onset accuracy or full Hale voice-project completion in this task.
