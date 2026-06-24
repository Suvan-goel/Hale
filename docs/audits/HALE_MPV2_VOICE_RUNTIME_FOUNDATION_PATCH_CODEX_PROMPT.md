# Codex Prompt: Hale MPV2 Voice-Runtime Foundation Patch

Read this entire prompt before changing anything.

Hale’s founder-waived targeted runtime audit is complete. It found four P1 blockers in the current Movement Profile V2 (`MPV2`) check-up voice path:

1. **MPV2-RT-001 — no audible measurement start**
   - Chair measurement begins after an internal silent countdown.
   - No spoken `three`, `two`, `one`, or `go` is emitted.
   - `mpv2_chair_official_ready` is longer than the current 3000 ms timer for both Clara and Marcus, even before native playback latency.

2. **MPV2-RT-002 — essential guidance can be deterministically dropped**
   - User actions and state transitions can occur while prior speech is still active.
   - `VoiceChannel` drops incoming lower- or equal-priority requests.
   - Essential next-stage cues can therefore be lost.

3. **MPV2-RT-003 — required cue failures are not fail-closed end to end**
   - Required MPV2 asset resolution can throw.
   - `VoiceChannel` catches the error, skips the failed cue, and continues.
   - The controller can still progress into measurement without essential guidance.

4. **MPV2-RT-004 — controller progression does not observe voice completion**
   - Timers, user actions, pose events, and screen transitions are independent of required narration.
   - Essential speech can still be playing when the flow advances.

The audit verdict is:

```text
RUNTIME_REMEDIATION_REQUIRED_BEFORE_PREVIEW
```

The current integrated MPV2 preview is not safe.

This task must implement one tightly scoped **voice-runtime foundation patch** that fixes these four P1 issues together. Do not implement only a spoken countdown while leaving the controller/player contract unchanged.

---

# 1. Source artifacts

Read and use:

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.json`
- `docs/audits/HALE_MPV2_RUNTIME_TIMELINES.csv`
- `docs/audits/HALE_MPV2_RUNTIME_FINDINGS.csv`
- `docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md`
- `docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`
- `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`

The listening-review waiver remains in effect:

```text
Founder listening status: waived_assumed_pass_by_founder.
Human verified: false.
```

Do not represent the audio as human-approved.

---

# 2. Objective

Implement a deterministic MPV2 voice/controller contract that guarantees:

1. Required speech has a trackable lifecycle.
2. Required speech produces a structured outcome.
3. Essential setup speech completes before dependent user actions, timers, or measured attempts can advance.
4. Chair countdown is spoken using the existing:
   - `countdown-three`
   - `countdown-two`
   - `countdown-one`
   - `go`
5. Chair active measurement begins from a **go-playback-start lifecycle event**, not from:
   - `speak()` dispatch,
   - an unrelated three-second timer,
   - or the end of the `go` recording.
6. A required cue failure blocks the dependent transition and presents a visible retry state.
7. A user cannot silently continue into a measured attempt after required audio failure.
8. Meaningful stage changes cancel old stage speech.
9. Late callbacks and stale promises cannot advance the new stage.
10. Existing legacy training, legacy check-up, and micro-check behaviour remains unchanged unless a shared bug must be fixed safely.
11. The same current 42-scenario targeted audit is rerun after implementation.
12. The post-fix audit has zero P1 findings before Codex claims the patch is complete.

---

# 3. Scope

## In scope

- Additive tracked/awaitable playback support in `VoiceChannel`.
- Structured playback outcomes.
- Per-request identity.
- Per-stage/scope identity.
- Cue-start lifecycle reporting.
- Required versus optional failure behaviour.
- A bounded watchdog so an awaited required cue cannot leave the flow blocked forever.
- MPV2 controller/screen gating around essential voice.
- Spoken chair countdown and `go`.
- Measurement start triggered by the `go` playback-start event.
- Visible audio-failure retry state.
- Stage-scoped cancellation.
- Programmatic action guards in addition to disabled UI.
- Focused unit, fake-clock, integration, and failure-injection tests.
- A post-remediation rerun of the same targeted runtime audit.
- Documentation of remaining P2/P3 work.

## Out of scope

Do not implement in this task:

- New or regenerated audio.
- ElevenLabs calls.
- Human listening review.
- Full tracking-loss/recovery narration wiring.
- Recovery-screen voice completion beyond what is essential to the four P1 fixes.
- Voice switching while the screen is mounted.
- Full priority-policy redesign.
- New V2.1 staged balance protocol.
- Side-persistence schema changes.
- Training-session voice redesign.
- Micro-check voice redesign.
- Floor gate.
- Both-sides training rounds.
- Step-up alternation.
- Copy rewrites.
- TUG changes.
- Broad app navigation redesign.
- Physical-device QA.
- Claiming native audible onset has been measured.

Tracking, retry, recovery, voice-switching, and balance-protocol divergence should remain explicitly documented as follow-up work unless a minimal part is unavoidable for the P1 foundation.

---

# 4. Worktree safety

The repository is already dirty and contains important uncommitted and untracked MPV2 work.

Before editing:

- Record `git status --short --branch`.
- Record current branch and full/short `HEAD`.
- Identify all pre-existing relevant diffs.
- Do not reset, checkout, stash, clean, or overwrite unrelated work.
- Do not delete untracked audio or audit files.
- Do not regenerate manifests from scratch in a way that loses current additions.
- Modify only files required for this patch and its tests/reports.
- At the end, distinguish pre-existing changes from this task’s changes.

Do not commit or push.

---

# 5. Current source to inspect

At minimum inspect:

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- `App.tsx`
- current app audio configuration
- all files referenced by the targeted runtime audit

Inspect the installed `expo-audio` API and TypeScript definitions. Do not assume a playback-start callback exists under a particular name.

---

# 6. Required architecture

Implement the following concepts. Exact names may follow repository conventions, but the semantics are mandatory.

## 6.1 Preserve legacy `speak()` behaviour

Existing callers in training, legacy check-up, and micro-check must continue to work.

Do not make every old `voice.speak()` call awaitable or controller-blocking in this patch.

Add an MPV2-capable tracked API rather than silently changing every legacy call site.

A suitable shape is:

```ts
type VoicePlaybackOutcome =
  | 'completed'
  | 'dropped_busy'
  | 'interrupted'
  | 'cancelled'
  | 'asset_missing'
  | 'asset_resolution_failed'
  | 'player_creation_failed'
  | 'playback_start_failed'
  | 'completion_timeout';

type VoiceCancelReason =
  | 'explicit_stop'
  | 'stage_changed'
  | 'screen_unmounted'
  | 'app_backgrounded'
  | 'superseded'
  | 'retry';

interface VoiceCueStartedEvent {
  requestId: string;
  scopeId: string;
  cueKey: VoiceCueId;
  cueIndex: number;
  startedAtMs: number;
  startEvidence: 'native_playing_status' | 'play_call_resolved' | 'fallback_proxy';
}

interface VoicePlaybackResult {
  requestId: string;
  scopeId: string;
  outcome: VoicePlaybackOutcome;
  accepted: boolean;
  required: boolean;
  startedCueKeys: VoiceCueId[];
  completedCueKeys: VoiceCueId[];
  failedCueKey?: VoiceCueId;
  cancelReason?: VoiceCancelReason;
  errorCode?: string;
  requestedAtMs: number;
  firstCueStartedAtMs?: number;
  completedAtMs: number;
}

interface TrackedVoiceRequestOptions {
  priority: number;
  scopeId: string;
  required: boolean;
  onCueStarted?: (event: VoiceCueStartedEvent) => void;
}
```

A suitable API is:

```ts
voice.speakTracked(cues, options): {
  requestId: string;
  accepted: boolean;
  completion: Promise<VoicePlaybackResult>;
};
```

Equivalent naming is acceptable.

## 6.2 Required request outcomes

Every tracked request must resolve exactly once.

It must not:

- hang forever,
- resolve twice,
- remain pending after `stop()`,
- remain pending after interruption,
- treat missing required audio as successful,
- or allow a stale callback to mutate a newer request.

## 6.3 Required versus optional failure

For `required: true`:

- Any missing asset, resolver failure, player creation failure, or playback-start failure fails the request.
- Stop the remainder of that required sequence.
- Resolve a failure outcome.
- Do not silently skip to later cues.
- Do not begin the dependent measurement or timer.
- The MPV2 controller/screen must enter a visible retry state.

For `required: false`:

- Existing best-effort behaviour may remain.
- A failed optional cue may be skipped.
- Optional speech must not block measurement.
- Failure must still clear busy/request state safely.

## 6.4 Interruption and busy behaviour

Keep the existing priority model unless a minimal adjustment is necessary.

For tracked requests:

- If rejected because the channel is busy, return `dropped_busy`.
- If interrupted by a higher-priority request, resolve the original request as `interrupted`.
- If cancelled by stage change or stop, resolve as `cancelled`.
- The MPV2 controller must treat any non-`completed` outcome for a blocking prerequisite as failure/cancellation, never success.
- Do not automatically queue stale required stage instructions behind newer state.

## 6.5 Cue-start lifecycle

Emit `onCueStarted` once per cue when the strongest available runtime evidence shows playback has started.

Inspect `expo-audio`.

Preferred evidence:

1. A native/status event that reports active playback.
2. A reliable player lifecycle event documented by the installed API.
3. If no stronger event exists, the earliest defensible proxy after the player’s play call is accepted.

Do not call this a physically measured audible onset.

Record `startEvidence`.

The `go` event must use this cue-start lifecycle.

## 6.6 Completion watchdog

An awaitable required cue cannot leave Hale stuck forever if a completion callback never arrives.

Implement a bounded watchdog:

- Prefer player-reported duration if available.
- Add a conservative completion margin.
- If player duration is unavailable, use a clearly documented conservative fallback.
- On timeout:
  - release the player,
  - clear busy state,
  - resolve `completion_timeout`,
  - fail closed for required MPV2 speech.

Do not use an unexplained magic timeout.

Put timeout calculation in a named, tested helper.

## 6.7 Request and stage identity

Each tracked request needs a unique `requestId`.

Each meaningful MPV2 stage needs a stable `scopeId` or stage generation.

Examples:

```text
mpv2:intro
mpv2:chair:setup
mpv2:chair:practice
mpv2:chair:official-ready
mpv2:chair:countdown:<attemptId>
mpv2:chair:active:<attemptId>
mpv2:balance:setup
mpv2:balance:attempt:<attemptId>
mpv2:shoulder:setup:<side>
mpv2:hinge:setup
mpv2:complete
```

When the meaningful stage changes:

- Cancel tracked speech from the old scope.
- Resolve its request as cancelled.
- Ignore any late callback.
- Do not allow an old promise continuation to dispatch a coordinator action.

A simple monotonically increasing stage epoch is acceptable if it provides the same guarantee.

---

# 7. MPV2 voice prerequisite model

Do not continue treating every MPV2 cue as the same kind of “required” cue.

Create an explicit runtime prerequisite classification.

A suitable model is:

```ts
type Mpv2VoiceRequirement =
  | 'blocking_prerequisite'
  | 'start_boundary'
  | 'stop_boundary'
  | 'blocking_transition'
  | 'optional_transition'
  | 'optional_reassurance';
```

## 7.1 Blocking prerequisite

Must complete before a dependent action or measurement can begin.

Examples to verify and classify:

- MPV2 check-up intro before initial guided setup.
- Chair intro/setup before the user confirms setup.
- Chair practice-start guidance before practice begins.
- Chair official-ready guidance before spoken countdown begins.
- Balance intro/setup before an attempt starts.
- `mpv2_balance_attempt_start` before its attempt timer begins.
- Shoulder turn/raise instructions before shoulder capture begins.
- Hinge setup before hinge capture begins.

## 7.2 Start boundary

The active measurement starts from the cue-start event.

For this patch:

- `go` is the chair start boundary.

## 7.3 Stop boundary

The controller stops measurement independently and immediately at the time limit.

For example:

- `times-up-v21`

A stop-cue playback failure must not extend the measured window. It must show a visible stop state and be reported, but it is different from a missing setup prerequisite.

## 7.4 Blocking transition

Wait before an automatic transition where advancing immediately would cause stale or contradictory narration.

Classify only transitions that genuinely need this.

Do not make every result sentence block indefinitely.

## 7.5 Optional transition/reassurance

May be cancelled or dropped without invalidating a measurement.

Keep this category sparse.

---

# 8. MPV2 controller integration

Create a small, testable MPV2 voice-runtime coordinator or hook.

A suitable location is:

- `src/movementProfileV2/voiceRuntime.ts`
- or `src/movementProfileV2/useVoiceRuntime.ts`

Do not put all sequencing logic directly into a large screen effect.

The runtime layer should own:

- current voice scope/stage epoch,
- active tracked request,
- blocking status,
- last failure,
- required-sequence playback,
- cancellation,
- countdown orchestration,
- retry of failed required speech,
- stale-continuation guards.

The screen should render state and invoke explicit runtime methods.

Avoid multiple independent `useEffect` blocks that can speak competing required cues for the same transition.

---

# 9. User-action gating

For every action that depends on a blocking prerequisite:

- Disable the visible action while blocking speech is pending.
- Also guard the handler programmatically.
- Ignore rapid duplicate taps.
- Do not dispatch the coordinator action early.
- Keep cancel/back available.
- Show a calm loading/guidance state rather than making the app appear frozen.

Examples to verify:

- Confirm chair setup.
- Begin chair practice.
- Advance from chair practice to official attempt.
- Start/accept balance attempt.
- Use best balance attempt.
- Confirm shoulder setup.
- Begin shoulder capture.
- Begin hinge capture.
- Continue after a blocking transition where applicable.

Do not rely only on button `disabled`; handlers must fail safely if invoked programmatically or by a stale closure.

---

# 10. Spoken chair countdown and start timing

Use the existing current assets:

- `countdown-three`
- `countdown-two`
- `countdown-one`
- `go`

Do not generate new audio.

## 10.1 Required sequence

After `mpv2_chair_official_ready` completes successfully:

1. Enter a dedicated countdown scope.
2. Speak `countdown-three`.
3. Speak `countdown-two` approximately one second after the start of `three`.
4. Speak `countdown-one` approximately one second after the start of `two`.
5. Speak `go` approximately one second after the start of `one`.
6. Dispatch the chair active-start coordinator action when the `go` cue’s playback-start lifecycle event fires.
7. Start the 30-second measurement window from that coordinator timestamp.
8. Do not wait for the full `go` asset to finish before accepting movement.
9. Do not start measurement from `speak()` dispatch.

## 10.2 Cadence

Do not play all four files back-to-back with no timing control.

Use a deterministic monotonic schedule.

The assets are shorter than one second, so a one-second cadence is feasible.

Account for:

- request acceptance,
- playback-start evidence,
- cancellation,
- late start,
- missing cue,
- app background,
- retry.

If a countdown step fails:

- cancel the countdown,
- do not start measurement,
- enter the visible retry state.

If a countdown step starts too late to preserve ordering:

- do not compress or overlap later countdown cues,
- restart or fail safely according to a tested policy.

## 10.3 Current silent timer

Remove or bypass the current independent internal 3000 ms chair-start timer in the new MPV2 runtime path.

There must be exactly one source of truth for chair start.

Do not leave a silent timer racing the spoken countdown.

## 10.4 Terminology

In code and reports call the callback:

```text
go playback-start event
```

Do not claim it is a physically measured audible onset until device QA confirms the relationship.

---

# 11. Visible required-audio failure state

When blocking required speech fails, show a visible MPV2 error state.

Recommended meaning:

```text
Audio guidance couldn’t start.
Try again before continuing the check-up.
```

Required actions:

- `Try again`
- `Exit check-up` or existing safe cancel/back action

Do not offer “Continue without audio” for a measured voice-first attempt.

The retry must:

1. Cancel the old request/scope.
2. Clear the failure.
3. Re-establish the same coordinator stage.
4. Replay the required prerequisite.
5. Restart a full countdown if the failure occurred during countdown.
6. Never reuse a partial countdown or partial measurement.
7. Keep existing accepted results from earlier completed items intact unless current product logic says otherwise.

Do not add a new spoken error asset.

---

# 12. Stage-scoped cancellation

Define meaningful stage boundaries explicitly.

At minimum cancel old speech when:

- leaving intro,
- leaving chair setup,
- entering/leaving chair practice,
- entering official countdown,
- entering chair active,
- leaving chair result,
- entering/leaving balance attempts,
- accepting use-best,
- leaving balance,
- changing shoulder setup side/stage,
- entering shoulder active,
- leaving shoulder,
- entering hinge setup,
- entering hinge active,
- entering completion,
- retrying,
- cancelling,
- unmounting,
- app backgrounding.

Do not indiscriminately stop speech on every pose frame or render.

The cancellation must be tied to semantic stage changes.

---

# 13. State-machine requirements

The state machine must make these illegal:

```text
chair_active without successful official-ready prerequisite
chair_active without go playback-start event
balance_trial without successful attempt-start prerequisite
shoulder_capture without successful side-specific setup prerequisite
hinge_capture without successful hinge setup prerequisite
measured attempt after required audio failure
old stage continuation dispatching into a new stage
```

Use explicit coordinator actions or guards rather than informal screen assumptions.

Suggested chair actions:

```text
chair_practice_voice_completed
chair_official_ready_voice_completed
chair_countdown_started
chair_go_playback_started
chair_countdown_failed
required_voice_failed
required_voice_retry
```

Equivalent names are acceptable.

Do not derive active start from elapsed wall time alone.

---

# 14. Feature flag and rollback

Reuse the existing internal MPV2 gating if it provides a safe rollback.

If no suitable flag exists, add one narrowly scoped internal runtime flag, for example:

```ts
MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED
```

Requirements:

- No new public production route.
- No unrelated app behaviour change.
- Old internal MPV2 behaviour remains available as rollback during development.
- Tests cover enabled behaviour.
- Report the default and where it is read.
- Do not leave two voice systems simultaneously active for one stage.

If the old path is unsafe, it must remain internal/preview-disabled.

---

# 15. Diagnostics

Add development-only, privacy-safe MPV2 voice timing diagnostics.

Record monotonic timestamps for:

- request created,
- request accepted/rejected,
- cue playback requested,
- cue playback-start evidence,
- cue completion,
- request completion,
- cancellation,
- required failure,
- countdown step start,
- go playback-start event,
- measurement start,
- measurement end.

Include:

- request id,
- scope id,
- cue key,
- voice id,
- outcome,
- start-evidence type.

Do not log:

- raw video,
- landmarks,
- health results,
- user name,
- account identifiers.

Keep diagnostics bounded and disabled or quiet outside internal/debug use.

These timestamps will support later Android/iOS onset QA.

---

# 16. Required tests

Do not weaken or delete existing tests.

## 16.1 `VoiceChannel` tracked API tests

Add tests for:

1. Required tracked sequence completes.
2. `onCueStarted` fires once per cue.
3. Start callback records the correct cue key/index.
4. Lower-priority busy request resolves `dropped_busy`.
5. Equal-priority busy request resolves `dropped_busy`.
6. Higher-priority request resolves old request `interrupted`.
7. `stop()` resolves active request `cancelled`.
8. Stage-change cancellation resolves with the correct reason.
9. Missing required asset returns failure and does not continue pending cues.
10. Missing optional asset may skip and continue.
11. Resolver throw.
12. Player creation failure.
13. Playback-start failure.
14. No completion callback triggers watchdog timeout.
15. Watchdog clears busy state.
16. Failure of first cue in a required sequence stops the sequence.
17. Failure of middle cue stops the remainder.
18. Failure of final cue returns failure.
19. Late callback after stop is ignored.
20. Completion resolves exactly once.
21. Legacy `speak()` behaviour remains compatible.

Use fakes/mocks; do not delete physical assets.

## 16.2 Coordinator tests

Add deterministic tests proving:

1. Chair cannot enter active before official-ready speech completes.
2. Chair cannot enter active before `go` playback-start.
3. Chair active starts exactly once from `go` playback-start.
4. Missing `go` blocks the attempt.
5. Failed `mpv2_chair_official_ready` blocks countdown.
6. Retry after failure replays prerequisite and a full countdown.
7. Cancellation during countdown prevents active start.
8. A late `go` callback from an old attempt cannot start a new attempt.
9. Times-up ends measurement independently of cue completion.
10. Balance attempt cannot start before attempt-start prerequisite.
11. Shoulder capture cannot start before side-specific prerequisite.
12. Hinge capture cannot start before setup prerequisite.
13. Stage epoch prevents stale continuation.
14. Clara and Marcus use the same state transitions despite different durations.

## 16.3 Screen/integration tests

Add focused tests proving:

1. Required action buttons are disabled while blocking speech is pending.
2. Programmatic handler invocation is also guarded.
3. Rapid double taps do not advance twice.
4. Required audio failure displays retry state.
5. Continue-without-audio is unavailable for measured attempts.
6. Retry restarts the correct stage.
7. Cancel/back remains available.
8. Unmount cancels active request.
9. Background cancels active request.
10. Only one required sequence is active per stage.
11. Existing MPV2 results before the failed current item are preserved.
12. Feature-flag rollback does not run both systems.

## 16.4 Countdown tests

Use fake timers and a monotonic fake clock.

Verify:

1. Three/two/one/go order.
2. Approximately one-second start cadence.
3. Measurement starts from go-start event.
4. Measurement does not wait for go completion.
5. Missing any countdown cue blocks.
6. Interruption cancels the countdown.
7. Retry starts from three.
8. No old internal three-second timer can start measurement.
9. L0/L100/L250 modelled startup latency does not change ordering.
10. No Clara/Marcus outcome divergence.

---

# 17. Post-remediation targeted audit

Update the audit-only harness as needed so it models the implemented behaviour from current source.

Do not overwrite the original audit.

Create:

1. `docs/audits/HALE_MPV2_RUNTIME_FOUNDATION_IMPLEMENTATION.md`
2. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.md`
3. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.json`
4. `docs/audits/HALE_MPV2_POST_FOUNDATION_TIMELINES.csv`
5. `docs/audits/HALE_MPV2_POST_FOUNDATION_FINDINGS.csv`

Use the same:

- 42 canonical scenario ids,
- Clara and Marcus,
- L0/L100/L250,
- user-action timing variants,
- missing-asset injection,
- resolver failure,
- player creation failure,
- playback-start failure,
- missing completion callback,
- late callback,
- stage-exit cases.

The post-fix harness must not merely hard-code passing results.

It must derive behaviour from the new runtime contract or faithful reusable helpers.

---

# 18. Completion gates

Do not claim this task is complete unless all static/modelled gates pass.

## Required post-fix audit gates

- P0 findings: 0
- P1 findings: 0
- Missing audible-start cases: 0
- Required-cue silent-continuation cases: 0
- Essential deterministic drop cases: 0
- Stale speech crossing meaningful stage boundary: 0
- Chair active starts before go playback-start: 0
- Failed required prerequisite followed by measurement start: 0
- Clara/Marcus state-outcome differences: 0
- Duplicate active-start dispatches: 0
- Hung tracked requests after watchdog: 0

## Required code gates

- Existing voice tests pass.
- New tracked API tests pass.
- New MPV2 coordinator tests pass.
- New screen/integration tests pass.
- `npm run verify:audio` passes.
- `npx tsc --noEmit` passes.
- Relevant full Jest suites pass.
- No audio file changed.
- No audio was generated.
- No external API was called.
- No unrelated worktree file was overwritten.

If any gate fails:

- Keep integrated preview marked unsafe.
- Do not conceal the failure.
- Report the smallest remaining blocker.

---

# 19. Physical-device boundary

This task cannot prove physical audible onset.

The implementation should align measurement to the strongest available **playback-start event** and collect diagnostics.

The final report must clearly distinguish:

```text
Static/runtime contract established:
measurement begins from go playback-start event.

Still device-only:
offset between playback-start event and sound reaching the speaker.
```

Do not claim the Android/iOS completion gate from the remediation plan has been met without device measurement.

After this patch, the next stage should be a focused physical-device onset QA pass, not more static architecture work, provided all P1 gates are zero.

---

# 20. Files likely to change

Expected production files may include:

- `src/audio/voicePlayer.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- a new MPV2 voice runtime helper/hook
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- focused screen tests
- `src/movementProfileV2/liveDiagnostics.ts`
- the audit-only runtime harness
- the five requested post-fix artifacts

Change only what is necessary.

Do not modify:

- audio assets,
- audio generation source unless a type/list registration change is strictly required,
- V2.1 scripts,
- training exercise catalogue,
- training voice system,
- legacy check-up protocol,
- micro-check protocol,
- approved founder decisions.

If a manifest change is genuinely required to reference existing countdown assets in MPV2, explain why and make the smallest possible change. Do not regenerate the manifest wholesale.

---

# 21. Implementation report structure

Create:

`docs/audits/HALE_MPV2_RUNTIME_FOUNDATION_IMPLEMENTATION.md`

Use:

# Hale MPV2 Voice-Runtime Foundation Implementation

## 1. Result

## 2. P1 Findings Addressed

Map:

- MPV2-RT-001
- MPV2-RT-002
- MPV2-RT-003
- MPV2-RT-004

to exact code and tests.

## 3. VoiceChannel Tracked Contract

## 4. Required/Optional Failure Semantics

## 5. MPV2 Stage and Scope Model

## 6. User-Action Gating

## 7. Chair Countdown and Go-Start Contract

## 8. Visible Failure and Retry

## 9. Stage-Scoped Cancellation

## 10. Diagnostics

## 11. Compatibility With Legacy Flows

## 12. Tests

## 13. Post-Fix Audit Results

## 14. Remaining P2/P3 Findings

## 15. Device-Only QA

## 16. Files Changed

## 17. Worktree Integrity

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
- `src/movementProfileV2/__tests__/recovery.test.ts`
- new voice-runtime tests
- new screen integration tests

Also run the broader relevant test command used by the repository where practical.

Run the updated audit-only harness.

Parse all generated JSON and CSV artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
```

Do not modify tests just to make them pass.

---

# 23. Final Codex response

When finished, respond with:

- Summary of the implemented foundation
- Paths to all five generated reports
- All production files changed
- All test files changed/added
- Any audit-only harness changed/added
- Confirmation that no audio changed or was generated
- Confirmation that no external API was called
- Confirmation that the listening review remains waived, not completed
- Current branch and commit
- Whether the worktree was already dirty
- VoiceChannel tracked outcome types implemented
- Required failure behaviour
- Countdown cadence
- Exact event that starts chair measurement
- Whether the old silent three-second start timer remains
- Visible audio-failure behaviour
- Stage-cancellation mechanism
- Feature flag/rollback mechanism
- Focused test results
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Post-fix canonical scenario count
- Post-fix simulated variant count
- Post-fix timeline row count
- Post-fix P0/P1/P2/P3 counts
- Post-fix missing audible-start count
- Post-fix required-cue silent-continuation count
- Post-fix essential deterministic-drop count
- Post-fix stale cross-stage speech count
- Post-fix Clara/Marcus outcome-difference count
- Whether integrated static/runtime preview gates now pass
- Device-only questions remaining
- The exact next task

Do not claim physical audible-onset accuracy until Android and iOS device QA measures it.
