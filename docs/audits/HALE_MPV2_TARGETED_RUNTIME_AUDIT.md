# Hale MPV2 Targeted Runtime Audit

## 1. Executive Verdict

- Primary verdict: RUNTIME_REMEDIATION_REQUIRED_BEFORE_PREVIEW
- Secondary flags: ADD_AUDIBLE_COUNTDOWN_GO, BLOCK_USER_ACTION_UNTIL_INSTRUCTION_COMPLETE, MAKE_REQUIRED_CUES_CONTROLLER_BLOCKING, ADD_TRACKING_RECOVERY_VOICE, ADD_RETRY_VOICE, CANCEL_STALE_STAGE_SPEECH, REBUILD_CHANNEL_ON_VOICE_CHANGE, REBASE_V21_CHECKUP_SPEC, DEVICE_LATENCY_QA_REQUIRED, LISTENING_REVIEW_WAIVED
- Founder listening status: waived_assumed_pass_by_founder; human verified: false
- Input freshness: current_exact
- Current branch/commit: dev / 1ff532d
- Canonical scenarios: 42
- Total simulated variants: 378
- Total timeline rows: 910
- Deterministic drops: 90
- Deterministic interruptions: 84
- Stale-speech cases: 36
- Missing-start-signal cases: 48
- Required-cue silent-continuation cases: 10
- Clara/Marcus outcome differences: 0
- Finding counts: P0 0, P1 4, P2 7, P3 1
- Preview safe: no
- Exact next action: Implement audible countdown/go with active timing aligned to audible onset before integrated device preview.

## 2. Listening Review Waiver

Founder listening decision: waived for this stage.
Runtime-audit assumption: every current MPV2 Clara and Marcus asset is assumed to contain its source-expected wording, be intelligible, and have acceptable pronunciation, tone, level, and technical quality.
Verification status: assumed-pass-by-founder, not human-verified.
Residual risk: audible wording or quality defects may still be discovered later during device QA or beta use.

This is an audit overlay only. It does not mark any asset as human-verified and does not authorize additional audio generation.

## 3. Scope and Method

This audit covers only the current Movement Profile V2 check-up path. The harness reads the prepared handoff, canonical cue map, asset QC, live source, and actual MP3 durations/hashes. It models the current voice channel with L0, L100, and L250 playback/callback latency profiles and user-action timing variants. It does not instantiate native `expo-audio` or implement fixes.

## 4. Live Repository and Input Freshness

- Worktree state: dirty_before_audit_work
- HEAD: 1ff532db38850db1d2b254719836dd147826ea43
- Upstream: origin/dev
- expo-audio: ~56.0.12
- Freshness classification: current_exact
- Drift differences: 0

## 5. Current MPV2 Runtime Architecture

The screen owns a single `VoiceChannel` created from the initial `voiceId` prop. Initial speech is a mount-effect `speak()` call. Transition speech is emitted from a live-snapshot effect through `MovementProfileV2VoiceSequencer`. The coordinator never waits for cue completion.

## 6. Timing and VoiceChannel Model

`VoiceChannel` allows one sequence at a time. Lower-or-equal priority incoming speech is dropped. Higher priority stops current playback and clears pending cues. Missing required MPV2 assets throw during resolution, but `playCue` catches the error, skips the cue, and continues pending cues.

## 7. Full Normal Clara Timeline

See `docs/audits/HALE_MPV2_RUNTIME_TIMELINES.csv` rows for `full_normal_mpv2_checkup_clara`. In the wait-for-speech normal path, cues play in order, but chair active still starts from the internal timer before an explicit spoken go.

## 8. Full Normal Marcus Timeline

See `docs/audits/HALE_MPV2_RUNTIME_TIMELINES.csv` rows for `full_normal_mpv2_checkup_marcus`. Marcus has different asset durations but the same outcome classes as Clara.

## 9. Chair Practice, Countdown, Active Window, and Result

Practice start can be dropped if chair setup is confirmed while the initial intro is still busy. Practice completion submits `mpv2_chair_official_ready`, starts the internal 3000 ms countdown, and then chair active begins without `three/two/one/go`. The official-ready cue is longer than 3000 ms for both voices before added startup latency.

## 10. Balance Attempt and Rest Branches

Current balance is eyes-open single-leg, max 45 seconds per trial, up to 3 valid trials. Attempt-start can be emitted from both ready and trial transitions; the second instance can be dropped while the first is busy. Rest narration is safely shorter than the 30-second minimum rest, but use-best can be pressed while rest narration is busy and drop the use-best/completion sequence.

## 11. Shoulder Left/Right Consistency

Selected shoulder side determines both turn and raise cues, and the grader reads the same flow side. The risk is not side mismatch; it is that side-specific setup speech can be dropped if the user confirms shoulder setup while balance completion speech is still busy.

## 12. Hinge and Completion Branches

Valid hinge speaks `mpv2_hinge_complete -> checkup-complete-v21`; no-measurement speaks `mpv2_hinge_no_measurement -> checkup-complete-v21`. Both are one sequence. Navigation can occur before completion narration finishes.

## 13. User Actions, Retry, Recovery, and Navigation

The current live screen has visual controls for retry-like paths but does not wire `retry-v21`, `tracking-loss-v21`, or `tracking-recovered-v21` into emitted MPV2 transitions. The recovery screen is visual only.

## 14. Priority, Drop, and Interruption Matrix

- 50: final-position-set-v21;tracking-recovered-v21 — lowest MPV2 setup/recovery reassurance; dropped by almost everything while busy
- 60: intro/setup/active-transition cues — drops against equal intro/setup and all completion/recovery/critical cues
- 70: completion/rest/retry-v21 — interrupts setup 60, drops against other 70, interrupted by 90/100
- 90: mpv2_chair_official_ready — interrupts setup/completion, interrupted/dropped by critical 100
- 100: times-up-v21;tracking-loss-v21;mpv2_*_tracking_retry — critical; equal 100 collisions drop incoming cue

## 15. Required-Cue and Playback-Failure Injection

The audit model injects missing selected-voice assets, resolver throws, player creation failure, playback start failure, absent completion callback, late callback after stop, and first/middle/final failures in multi-cue sequences. Current behavior skips failed cues and lets controller state continue; this is not fail-closed end to end.

## 16. State Exit and Stale-Speech Analysis

Unmount/background calls `voice.stop()`, clears pending cues, and the player identity guard prevents released callbacks from mutating the new state. Meaningful stage transitions without unmount do not automatically cancel prior speech, so lower-priority next-stage guidance can be dropped while prior transition speech continues.

## 17. Clara/Marcus Outcome Parity

Outcome-difference count: 0. Duration differences change timing margins but did not change simulated controller outcome classes.

## 18. V2.1 Runtime and Protocol Impact

The current MPV2 balance protocol remains an eyes-open single-leg attempt flow rather than the future V2.1 staged ladder. That is not the main preview blocker, but it must be documented as a current-protocol divergence.

## 19. Prioritised Findings

- MPV2-RT-001 [P1] Chair active measurement starts without spoken countdown or audible go — blocks preview: true
- MPV2-RT-002 [P1] User actions can deterministically drop essential setup guidance — blocks preview: true
- MPV2-RT-003 [P1] Required MPV2 cue failure is not fail-closed end to end — blocks preview: true
- MPV2-RT-004 [P1] State progression does not observe voice completion for timed captures — blocks preview: true
- MPV2-RT-005 [P2] Completion or transition speech can be cancelled or stale across meaningful state exit — blocks preview: false
- MPV2-RT-006 [P2] Shared tracking-loss/recovered/retry cues are bundled but not emitted — blocks preview: false
- MPV2-RT-007 [P2] Missing playback completion callback can leave VoiceChannel busy indefinitely — blocks preview: false
- MPV2-RT-008 [P2] Background/foreground does not replay essential context and may model transition speech after stop — blocks preview: false
- MPV2-RT-009 [P2] Mounted VoiceChannel does not rebuild when selected voice changes — blocks preview: false
- MPV2-RT-010 [P2] Current MPV2 balance protocol differs from future V2.1 staged ladder — blocks preview: false
- MPV2-RT-011 [P2] Higher-priority recovery can interrupt useful in-progress instructions — blocks preview: false
- MPV2-RT-012 [P3] No audit-regression test locks the full voice timeline — blocks preview: false

## 20. Preview Readiness Decision

Integrated preview is not safe yet. The missing audible start for a timed measurement and non-blocking required-cue failures are P1 preview blockers.

## 21. Remediation Sequence

See `docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md`.

## 22. Physical-Device QA Plan

- DQA-01: Run Clara and Marcus full MPV2 check-up on Android physical device using phone speaker.
- DQA-02: Run Clara and Marcus full MPV2 check-up on iOS physical device using phone speaker and silent switch enabled.
- DQA-03: Repeat chair countdown/go path over Bluetooth and compare callback latency.
- DQA-04: Measure UI/controller timestamp, playback request timestamp, audible waveform onset, and first accepted movement timestamp.
- DQA-05: Perform rapid button action tests immediately when controls enable.
- DQA-06: Background/foreground during chair, balance, shoulder, and hinge active windows.
- DQA-07: Inject missing required asset in dev build without deleting files and confirm controller blocks.
- DQA-08: Change selected voice while screen is mounted and after remount.
- DQA-09: Record full check-up screen/audio/video for timing review; do not use self-view in product UI.

## 23. Validation, Limitations, and Source Index

Validation status: pass; hard failures: 0.

Limitations:

- Listening review was waived; audio wording and quality are assumed for this audit and not human-verified.
- The timing model uses measured MP3 durations plus synthetic startup/completion callback delays; it is not native playback-onset measurement.
- The harness models React/controller event order from source and tests but does not instantiate React Native or expo-audio.
- The current worktree was already dirty and contains unrelated source changes; this audit only adds audit artifacts and an audit-only harness.

Source index:

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
- `src/movements/chairRiseV2.ts`
- `src/movements/oneLegBalanceV2.ts`
- `src/movements/activeShoulderReachV2.ts`
- `src/movements/hingeReach.ts`
- `App.tsx`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`
- `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv`
