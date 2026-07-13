# Pearl Movement Check-Up Physical-Device Bug Audit

## 1. Scope

This was an audit and root-cause pass for the current public Movement Profile V2 Movement Check-Up. It investigated the product-owner physical-device observations around balance auto-start, balance foot-down/timer/attempt advance, and the Warden age-19 chair-rise percentile result.

This pass did not implement production fixes. It did not change Warden source/formula/data/fingerprints/golden examples, audio assets, product logic, movement policy, training policy, release flags, routing, packages, lockfiles, branches, commits, or PR state.

Temporary deterministic probes were written and run only under `/tmp`:

- `/tmp/pearl_balance_probe.ts`
- `/tmp/pearl_warden_age19_probe.ts`

Those probes are not part of the repo worktree.

## 2. Physical-device observations

The product owner observed these real-device issues during the V2 Movement Check-Up:

1. Balance countdown did not start on first leg lift. The user lifted one leg, the flow did not start the attempt, then it responded only after the user put the foot down and lifted again.
2. Foot-down at about 20 seconds played "attempt saved" audio, but the visible timer appeared to keep running and the flow did not clearly move to rest/next attempt.
3. No further balance attempts were offered after the saved about-20-second attempt.
4. Chair result for exact age 19, 11 chair rises in 30 seconds displayed "Below the 10th percentile."

## 3. Current baseline and constraints

Baseline carried forward from the recent reports:

- Normal public Check-Up is unified Movement Profile V2.
- Public V1 Movement Age flow is retired from normal builds and retained only for explicit rollback conditions.
- HF1 made public V2 Check-Up hands-free in software.
- HF2/HF3 hands-free work for micro-check and training remains out of scope for this audit.
- Warden chair percentile transform is source-faithful and approved.
- Exact age and reference sex onboarding are implemented.
- Warden low chair evidence can influence Strength / Power focus and plan creation.
- H5A/H5B/H5C/H5D and safe-beta release-flag hardening are expected to remain unchanged.
- Public release remains blocked.
- Physical-device validation is not claimed.

Reports reviewed before analysis included the requested H5/HF/Warden/release-candidate/cleanup audit files under `docs/audits/`.

## 4. Initial Git status

Required initial inventory:

```text
$ git status --short --untracked-files=all
 M App.tsx
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/render/__tests__/artDirectedHumanGeometry.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts

$ git diff --name-only
App.tsx
docs/decisions.md
src/adherence/screens/BlockIntroScreen.tsx
src/audio/safetyAudio.ts
src/audio/voiceV21Audio.ts
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
src/results/CheckUpResultsShell.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts

$ git diff --stat
 App.tsx                                            | 221 +++++++++++
 docs/decisions.md                                  |   8 +
 src/adherence/screens/BlockIntroScreen.tsx         | 113 ++++--
 src/audio/safetyAudio.ts                           |  13 +-
 src/audio/voiceV21Audio.ts                         |   3 +-
 .../__tests__/artDirectedHumanGeometry.test.ts     |   6 +-
 src/render/artDirectedHumanGeometry.ts             | 423 +++++++++++++++++----
 src/results/CheckUpResultsShell.tsx                | 204 ++++++----
 src/screens/PoseOverlayBenchmarkScreen.tsx         |   4 +-
 ...eOverlayBenchmarkScreen.constellationV2.test.ts |   2 +-
 10 files changed, 812 insertions(+), 185 deletions(-)

$ git ls-files --others --exclude-standard
<no output>
```

All tracked modifications above were treated as user-owned and were not reverted.

## 5. Baseline validation

Validation before report writing:

- `npm run typecheck`: passed.
- `npm run verify:audio`: failed with `AUDIO VERIFICATION FAIL issues=502`. The failures were stale safety audio fingerprints, stale Movement Profile V2 audio fingerprints, and stale Voice V2.1 fingerprints across Clara and Marcus. No audio was regenerated or edited.
- `npm run verify:safe-beta-flags`: passed. Sanitized safe-beta public config showed `enablePoseLatencyDiagnostics: false` and `allowDiagnosticsInRelease: false`.
- Focused Jest slice: passed, 19 suites / 173 tests. Covered live coordinator, voice runtime/cues/view model/recovery, screen voice-runtime guard, Movement Profile V2 protocol tests, reference engine/snapshot/assessment, results adapter, public V2 lifecycle, H5/HF-related retest/block/micro-check/session-player tests.
- `npm test -- --runInBand`: passed, 170 suites / 1387 tests. Jest printed the existing post-run open-handle warning.
- `npm --prefix website run typecheck`: passed.
- `npm --prefix website run test`: passed, 5 files / 17 tests.
- `npx --no-install expo config --type public`: passed in the local environment. Local `.env` had diagnostics enabled, while the sanitized safe-beta command above verified beta-safe flags off.
- `git diff --check`: passed.

## 6. Expected current balance state machine

Current balance ownership is split between `src/movementProfileV2/liveCoordinator.ts`, `src/movements/oneLegBalanceV2.ts`, `src/movementProfileV2/voiceRuntime.ts`, `src/movementProfileV2/voiceCues.ts`, and `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`.

State map:

| Stage | Entry condition | Voice/audio | Pose evidence | Timer/deadline | Events | Next state | UI | Cleanup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `balance_setup` | Chair result recorded via `recordChairResult`; movement epoch becomes `balance`; setup voice reset | `times-up-v21`, `checkup-balance-intro-v21`, `checkup-balance-single-leg-v21`; voice completion dispatches `balance_setup_voice_completed` | Hands-free requires both side chains reliable, body unit present, and inferred standing leg from raised-foot geometry; 1200 ms dwell | No active attempt timer; fallback after 10000 ms waiting | `confirm_balance_setup` from camera/user | `balance_ready` | Skeleton setup state; status says lift other foot to set attempt | Clears hands-free readiness on transition |
| `balance_ready` | Setup confirmed; `attemptEpochId` set to `balance-ready-*`; `balanceAttemptVoiceCompleted=false`; `balanceRaisedFrames=0` | `mpv2_balance_attempt_start`; voice completion dispatches `balance_attempt_voice_completed` | Selected leg must remain raised; hands-free requires 4 raised frames before starting trial | No active timer until trial starts | Stable raised foot after voice boundary | `balance_trial` | Ready state; if prior best exists, best metric can display | Raised-frame count resets on entry |
| `balance_trial` | `balance.startTrial(nowMs)` succeeds; `balanceTrialStartedAtMs=nowMs`; attempted-trial count increments | No new cue on start in voice runtime after stage is active; legacy cue resolver can map transition to attempt-start | Raised foot updates sway; foot down requires 4 consecutive not-raised frames; tracking loss requires 4 frames | 45000 ms max trial from `balanceTrialStartedAtMs` | Touchdown/user stop/support touch/ceiling/tracking invalid/background | `balance_rest`, `shoulder_setup`, or recovery/rest depending outcome | Time metric from `timerRemainingMs` | On valid touchdown, `balanceTrialStartedAtMs=null`; on invalid, same plus recovery |
| `balance_rest` | Valid non-ceiling trial or first invalid tracking trial | `mpv2_balance_attempt_saved` + `mpv2_balance_rest`; invalid uses `mpv2_balance_tracking_retry` | Pose frames do not start next trial in rest | 30000 ms minimum rest; 60000 ms default rest | Manual `balance_ready` only in non-hands-free; hands-free default timer auto-accepts best if any valid trial exists | Non-hands-free can go to `balance_ready`; hands-free currently records best at 60 s and goes `shoulder_setup` | Rest metric from `restMinimumRemainingMs`; hands-free controls only cancel | No trial timer active |
| `shoulder_setup` after balance completion | `recordBalanceResult` records result and moves movement epoch to shoulder | `mpv2_balance_complete` or use-best/full-hold variant | N/A | No balance timer | Balance complete/auto-best/user best | Shoulder setup | Mobility setup state | `attemptEpochId=null` |

Ownership:

- Standing-leg inference: `inferBalanceStandingLeg` in `liveCoordinator.ts`.
- Prior leg guidance and changed-leg metadata: `createOneLegBalanceV2Setup` in `protocolSetup.ts`; `sourceForCameraInferredSide`.
- Foot-lift readiness: `selectedLegRaised`, `noteHandsFreeReadiness`, `updateBalance`.
- Countdown/start of balance trial: `balance_attempt_voice_completed` gate plus raised-foot debounce in `updateBalance`.
- Trial active timer: `balanceTrialStartedAtMs` plus `timerRemaining()`.
- Foot-down/touchdown detection: 4-frame `balanceLostFrames` debounce in `updateBalance`.
- Valid trial result: `completeBalanceTrial` plus `OneLegBalanceV2ProtocolController.completeTrial`.
- Attempt-saved audio: `voiceRuntime.ts` plan for `balance_rest`; `voiceCues.ts` transition mapping.
- Rest transition: `enterBalanceRest`.
- Next attempt eligibility: `balance_rest` minimum/default rest policy in `receiveTimerTick` and `balance_ready` action.
- Auto-best acceptance: `receiveTimerTick` in `balance_rest` when `handsFreeMode && balanceBestHoldSec !== null`.
- Hard cap/section completion: `OneLegBalanceV2ProtocolController` and `completeBalanceTrial`.

## 7. Issue A reproduction/root cause

Deterministic replay results from `/tmp/pearl_balance_probe.ts`:

- A1, leg raised before setup voice boundary completes: current coordinator did not start while setup voice was incomplete. After `balance_setup_voice_completed`, it confirmed setup after the 1200 ms dwell, entered `balance_ready`, then after `balance_attempt_voice_completed` and 4 raised frames entered `balance_trial`.
- A2, leg already raised at ready transition: current coordinator entered `balance_trial` after `balance_attempt_voice_completed` and 4 raised frames. This is level-triggered after the voice boundary, not edge-trigger-only.
- A3, prior leg mismatch/user lifts other leg: current coordinator accepted the changed leg, set `flowStandingLeg` to the camera-inferred standing leg, and then started the trial after the ready voice boundary. The setup metadata marks changed side through the setup source/changed-from-prior path when a result is eventually recorded.
- A4, ambiguous/low reliability: current coordinator remained in `balance_setup`. It does not provide a specific live waiting reason beyond the generic setup cue and fallback availability.

Root cause identified for the countdown-start confusion:

- The first physical leg lift in hands-free balance is consumed as `balance_setup` confirmation, not as the measured trial start.
- The state machine then enters `balance_ready` and requires a second blocking voice boundary, `balance_attempt_voice_completed`, before it will start the trial.
- In hands-free mode it also requires 4 raised frames after the ready boundary.
- The coordinator is level-triggered once those gates complete, but the user-facing interaction uses the same physical gesture for setup and start. On device this can feel like "I lifted my leg and nothing happened," especially if the user drops and re-lifts while waiting through the ready cue.

This is not proven to be a raw coordinator edge-trigger-only bug. It is a real state-machine/UX bug around gesture reuse, voice-boundary opacity, and waiting feedback. The future fix should accept an already-lifted stable foot cleanly after the setup and ready boundaries, and should avoid making the user feel that the first lift was ignored.

Severity: P2 confirmed by code/probe as a confusing hands-free state-machine gate; P1 risk if physical-device replay proves a true stalled state after voice completion.

## 8. Issue B reproduction/root cause

Deterministic replay from `/tmp/pearl_balance_probe.ts` simulated a valid hold, then foot-down at about 20 seconds.

Observed in replay:

- At trial start: `stage=balance_trial`, `timer=45000`.
- At about 20 seconds: `stage=balance_trial`, `timer=25000`.
- After first 3 down frames: still `balance_trial`, timer continues. This is expected because touchdown debounce requires 4 down frames.
- On the 4th down frame: `stage=balance_rest`, `reason=balance_valid_trial_rest`, `timer=null`, `restMin=30000`, `best=20.132`, `validTrials=1`.
- After a timer tick in rest: still `balance_rest`, timer remains null, rest countdown decreases.
- After the 60000 ms default rest in hands-free mode: `stage=shoulder_setup`, `reason=balance_auto_best_after_rest`.

Root cause for the physical-device "saved attempt audio but timer kept running" symptom was not identified in deterministic coordinator replay. The coordinator/protocol path clears the trial deadline before the saved-attempt/rest state is visible.

Likely remaining explanations:

- The user may have seen the rest countdown after the saved-attempt audio and interpreted it as the hold timer. The footer label is `Rest`, but hands-free mode hides action controls, so the state may still feel like the attempt timer is continuing.
- A real-device stale snapshot/render path may have displayed an old `balance_trial` `stageDisplay` despite the coordinator entering `balance_rest`. The footer itself is direct props and has no memoized timer cache.
- Native/JS frame sequencing or React scheduling may have delayed the visible refresh; existing diagnostics are not sufficient to prove this after the fact.
- If only 1 to 3 down frames are accepted, the hold timer will continue by design, but the saved-attempt audio should not play before the 4th down frame and `balance_rest` transition.

Severity: P1 if reproducible on device because it undermines trust in the measured hold and state transition. Root cause remains incomplete pending instrumentation/device replay.

## 9. Issue C reproduction/root cause

The "no further attempts" behavior is explained by current hands-free policy:

- Protocol max valid trials: 3 (`DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxValidTrials`).
- Minimum rest: 30000 ms (`BALANCE_REST_MIN_MS`).
- Default rest: 60000 ms (`BALANCE_REST_DEFAULT_MS`).
- In non-hands-free mode, `balance_ready` can be pressed after the minimum rest.
- In hands-free mode, `balance_rest` controls are hidden except cancel, and `receiveTimerTick` auto-accepts the best result at the 60000 ms default rest if `balanceBestHoldSec !== null`.

This means a valid non-ceiling 20-second trial is saved, then hands-free mode advances to shoulder after default rest with `balance_auto_best_after_rest`, rather than offering a second/third attempt. The protocol controller supports 3 valid attempts, but the hands-free coordinator policy declines remaining trials automatically after one valid trial.

Root cause identified: HF1 hands-free auto-best policy is too aggressive for product-owner expectation and for the reference protocol. It creates a raw-only/incomplete balance result after one valid non-ceiling trial and gives no clear user agency to attempt again.

Severity: P1 for beta readiness if the intended Check-Up should normally offer additional attempts after a non-ceiling valid trial.

## 10. Balance attempt/auto-best intended policy

Current implemented policy:

- Up to 3 valid trials are allowed by `OneLegBalanceV2ProtocolController`.
- Any ceiling trial or 3 valid trials completes the balance section as reference-protocol complete.
- User can manually save best from `balance_rest` or `balance_ready`.
- Hands-free mode auto-saves best after the 60000 ms default rest whenever a valid trial exists.
- A 20-second trial counts as valid, but not reference-protocol complete by itself unless remaining trials are declined.
- After auto-best, `declinedRemainingTrials=true`, and evidence status becomes `raw_only_protocol_incomplete`.

Product issue:

- Product expectation is that a user who loses balance before the ceiling should normally be offered another attempt unless the policy intentionally says otherwise.
- Current hands-free behavior gives the opposite impression: "Rest before the next attempt. Pearl will continue automatically" but then saves best and advances after default rest.
- Future product decision needed: either truly auto-offer attempts after rest, or intentionally auto-best with much clearer copy and artifact implications.

## 11. Related chair/shoulder/hinge issue search

Chair:

- Setup auto-readiness is level-triggered through `chairSetupReady` after voice completion.
- Practice to official transition is separate by design.
- Official 30-second timer is owned by `chairActiveStartedAtMs`; deadline completion records result and moves to `balance_setup`.
- Post-window chair frames do not inflate displayed count; existing tests cover this.
- Tracking loss resets chair active state and returns to countdown recovery.
- No same-class stale timer bug found.

Shoulder:

- Setup inference is level-triggered after `shoulder_transition_voice_completed`.
- Auto-capture from already-raised arm is level-triggered after `shoulder_setup_voice_completed` and dwell.
- Changed-side metadata is preserved through setup.
- Capture timer cleanup goes through `finishShoulderAttempt`; tracking loss clears active capture fields and retries once.
- Same UX class exists: moving early can be blocked by voice/dwell without a detailed waiting reason. Classified P3 unless device evidence shows a hard stall.

Hinge:

- Hands-free hinge setup starts capture when the user is already folded after voice completion and dwell.
- Capture timer is `hingeStartedAtMs + HINGE_CAPTURE_MS`; finish clears into `raw_complete`.
- Tracking loss resets capture state and returns to `hinge_setup`.
- No same-class stale timer bug found.
- Same UX class exists: early fold waits on voice/dwell and generic copy. Classified P3.

Reference/Warden/focus:

- Exact age/reference sex are used by the reference engine when present.
- Warden ineligible ages fall back to raw-only; age 19 is eligible for both female and male.
- Chair percentile display uses public ranges, not exact percentile.
- `below_10` maps to Strength / Power `below_reference` and is focus-eligible.

Additional issue found:

- Existing diagnostics cannot reconstruct a joined physical-device timeline. See section 14.

## 12. Warden age 19 / 11 chair-rise verification

Verification used committed source-faithful code:

- `wardenChairPercentileFor`
- `buildChairPercentileRange`
- `interpretMovementProfileV2`

Raw source workbook/PDF were not inspected in this audit; the committed transform/data/fingerprints were used.

Target result:

| Reference sex | Exact age | Reps | Internal percentile | Public percentile range | Engine claim eligibility | Supported source age range |
| --- | ---: | ---: | ---: | --- | --- | --- |
| female | 19 | 11 | 1.8415747856968145 | `below_10` | `reference_eligible` | 18 to 80 |
| male | 19 | 11 | 1.269062730427234 | `below_10` | `reference_eligible` | 18 to 79.3 |

Neighboring values:

| Sex | Reps | Internal percentile | Public range |
| --- | ---: | ---: | --- |
| female | 10 | 0.5168872303615402 | `below_10` |
| female | 11 | 1.8415747856968145 | `below_10` |
| female | 12 | 4.828002173005391 | `range 0-20` |
| female | 13 | 10.0675551023169 | `range 0-20` |
| female | 14 | 17.655040784482157 | `range 10-30` |
| female | 15 | 27.12456992322274 | `range 10-40` |
| male | 10 | 0.3331266213198125 | `below_10` |
| male | 11 | 1.269062730427234 | `below_10` |
| male | 12 | 3.5266611370484813 | `below_10` |
| male | 13 | 7.7358839011815395 | `range 0-20` |
| male | 14 | 14.174846355448834 | `range 0-30` |
| male | 15 | 22.619140610987408 | `range 10-40` |

Evidence/focus category:

- Public result `below_10`.
- Assessment maps this to Strength / Power `below_reference`.
- Focus eligibility is true for the chair evidence category.

Verdict: "Below the 10th percentile" is mathematically correct under the committed Warden transform for both female and male at exact age 19 with 11 reps.

## 13. Product interpretation of age-19 Warden result

The result is surprising mainly because Pearl is intended for adults about 45-65 while the product owner tested with exact age 19. The Warden source supports age 18+, so the current app is mathematically allowed to compare a 19-year-old.

Policy options for a later product pass:

- Restrict beta/onboarding age to 45+ or clearly warn under-target-age testers that comparison labels use young-adult references.
- Keep 18+ allowed but soften the under-target-age display label for beta testers.
- Keep Warden as-is and accept that young-adult comparisons can be stark.

No policy change was implemented.

## 14. Diagnostics/logging gap

Existing non-secret diagnostics:

- Live coordinator counters for frames, dropped frames, tracking quality, interruptions, and bounded state transitions.
- Balance counters for attempted/valid/invalid trials, rest count, ceiling, hard cap.
- Voice runtime timing diagnostics for request creation, cue start evidence, completion, cancellation, coordinator actions, and failures.
- Pose latency diagnostics can expose native frame timing and event coalescing when enabled.
- Serialized live diagnostics strip raw pose payloads.

Gap:

- There is no single bounded event timeline that joins stage, transition reason, accepted/rejected pose frame reason, attempt epoch, timer deadline, visible metric mode/value, voice cue/scope, readiness reason, and auto-best decision.
- The current diagnostics cannot prove after the fact whether Issue B was a coordinator transition, stale UI render, rest-timer misinterpretation, native event delay, or dropped foot-down frames.

Recommended future diagnostics pass:

- Internal-only, safe-beta off by default.
- No raw landmarks, video, images, or secret values.
- Bounded event timeline, developer-exportable only.
- Include stage, action, attempt epoch, movement epoch, timer/rest deadlines, pose-quality/readiness reason, selected standing leg, raised/not-raised state, touchdown debounce count, voice cue/scope, display mode/value, and auto-best action.

## 15. Severity classification

- Issue A, balance countdown not starting on first lift: P2 confirmed as state-machine/UX confusion; P1 risk if physical-device instrumentation proves a hard stall after voice completion.
- Issue B, saved-attempt audio with timer apparently continuing: P1 if reproducible on device. Coordinator root cause not reproduced; instrumentation required.
- Issue C, no further attempts after a valid non-ceiling trial: P1 product/policy issue for beta readiness if additional attempts are expected.
- Warden age 19 / 11 reps below 10th percentile: P3 product-surprise/policy issue, not a transform defect.
- Ambiguous low-reliability balance setup waiting: P2 because it can silently stall the balance section until fallback.
- Shoulder/hinge early-position waiting copy: P3.
- Diagnostics gap: P2 for beta debugging.

## 16. Recommended fix plan

MC-FIX1 - Balance state-machine fix:

- Make the hands-free balance flow explicitly carry an already-lifted posture from setup to ready.
- Remove the felt double-use of the same lift where possible, or merge setup-confirmation and attempt-start into a clear single hands-free path after voice safety requirements.
- Ensure a stable lifted foot present before/at voice boundary starts the trial without requiring a down/up edge.
- Add deterministic replay tests for A1/A2/A3/A4.
- Keep Warden, H5/HF/training policy, and routing unchanged unless separately approved.

MC-FIX2 - Balance touchdown/rest/attempt policy:

- Ensure touchdown immediately clears visible trial timer and displays an unmistakable rest/attempt-saved state.
- Add tests proving saved-attempt audio cannot coexist with active trial timer in UI-facing snapshot.
- Change hands-free rest policy to offer a second/third attempt after non-ceiling valid trials, or intentionally auto-best only under explicit approved criteria.
- Add explicit tests for 20-second touchdown, rest, next attempt, and auto-best.

MC-FIX3 - UX/copy/fallback:

- Add clear waiting reasons for voice boundary, low reliability, no raised foot, changed leg, and rest.
- Make "attempt saved" copy occur with the rest/next-attempt state, not before user-visible transition.
- Clarify whether "Pearl will continue automatically" means next attempt or best saved.

MC-FIX4 - Internal diagnostics:

- Add the bounded joined timeline described in section 14.
- Keep off in safe beta/release by default.

MC-FIX5 - Warden under-target-age product policy:

- Product owner decision: restrict beta to target ages, soften under-45 labels, or keep current source-faithful behavior.
- No Warden formula/data change recommended.

## 17. Required tests for implementation

Add or extend deterministic tests for:

- Leg already lifted before setup boundary starts the flow after voice boundary.
- Leg already lifted at ready transition starts the trial after boundary/dwell.
- Prior-leg mismatch accepts changed leg with metadata or gives clear waiting copy.
- Low-reliability leg lift gives clear waiting/fallback state.
- Foot-down at 20 seconds stops trial timer and enters rest/next-attempt state.
- Attempt-saved audio cannot leave active trial timer visible.
- Second/third attempt is offered after valid non-ceiling trial if policy says so.
- Auto-best fires only under explicit approved conditions.
- No stale deadline after any balance stage change.
- `balance_rest` hands-free controls/copy match policy.
- Official artifact materialization unchanged.
- Warden 19/11 current transform check for female and male.
- H5/HF/training/micro-check/progress/public V2 lifecycle regressions.

## 18. Files changed

This audit intentionally changed exactly one repository file:

- `docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md`

Existing user-owned modified files were not edited by this audit.

Temporary probe files were created under `/tmp` only and are outside the repo.

## 19. Validation results

Commands run:

```text
npm run typecheck
```

Passed.

```text
npm run verify:audio
```

Failed: `AUDIO VERIFICATION FAIL issues=502`, all reported as stale fingerprints across safety audio, Movement Profile V2 audio, and Voice V2.1 audio. No audio fix was performed.

```text
npm run verify:safe-beta-flags
```

Passed. Safe-beta sanitized config had diagnostics off.

```text
npm test -- --runInBand <focused slice>
```

Passed: 19 suites / 173 tests.

```text
npm test -- --runInBand
```

Passed: 170 suites / 1387 tests. Jest printed the existing open-handle warning after completion.

```text
npm --prefix website run typecheck
```

Passed.

```text
npm --prefix website run test
```

Passed: 5 files / 17 tests.

```text
npx --no-install expo config --type public
```

Passed in local environment; local config showed diagnostics enabled through local env, while the sanitized safe-beta command separately passed with diagnostics disabled.

```text
git diff --check
```

Passed.

## 20. Final Git status

Actual final status after writing this report:

```text
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/render/__tests__/artDirectedHumanGeometry.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
?? docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
```

No files were staged, committed, branched, pushed, or PR'd.

## 21. Confirmation

- No production fix was implemented.
- No Warden formula/data/source/fingerprint/golden-example change occurred.
- No chair percentile policy change occurred.
- No focus/assessment/plan creation policy change occurred.
- No official Movement Profile artifact eligibility change occurred.
- No micro-check containment, training credit, Progress, release-flag, routing, or public V1 rollback change occurred.
- No audio regeneration occurred.
- No package install occurred.
- No lockfile changed.
- No files were staged.
- No commit was created.
- No branch was created or switched.
- No push or PR was created.
- Physical-device validation is not claimed.
- Public release remains blocked.

MOVEMENT CHECK-UP PHYSICAL-DEVICE BUG AUDIT COMPLETE

BALANCE COUNTDOWN ROOT CAUSE IDENTIFIED

BALANCE FOOT-DOWN / TIMER ROOT CAUSE NOT IDENTIFIED

BALANCE NEXT-ATTEMPT POLICY ISSUE IDENTIFIED

WARDEN AGE-19 CHAIR RESULT VERIFIED

MOVEMENT CHECK-UP FIX PASS RECOMMENDED BEFORE BETA

NO PRODUCTION FIX IMPLEMENTED
NO WARDEN FORMULA / DATA CHANGE
NO AUDIO REGENERATION
NO H5/HF/TRAINING POLICY CHANGE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
