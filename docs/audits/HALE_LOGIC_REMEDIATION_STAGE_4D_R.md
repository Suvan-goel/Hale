# Hale Logic Remediation Stage 4D-R

Date: 2026-06-22

## 1. Scope

Stage 4D-R addressed safety cueing and stop-rule standardisation for V1 training sessions, Explore/manual practice, and plan start validation. It did not change exercise selection, ladder thresholds, progression policy, equipment gates, check-up scoring, norms, or beta release policy.

## 2. Initial Git Status

Initial status already contained active Stage 4C-R/Stage 5 work and untracked audit prompts. Key dirty areas included `App.tsx`, `docs/decisions.md`, session planning, profile/equipment capability files, multiple screens, backend sync files, and untracked Stage 4 prompt/report files. No existing user or generated changes were reverted.

## 3. Findings Addressed

F4R-003 and F4R-004 are software-addressed in code: band and door-anchor cue packs now exist as canonical cue IDs, and global stop rules are standardised as session-global cue IDs. Production completion remains blocked by missing bundled audio assets for those new safety cue IDs.

## 4. Deferred

Deferred: F4R-005 loaded optional expansion, F4R-008 progression changes, F4R-009 broader mobility naming/polish, F4R-010 positioning changes, and physical-device beta validation.

## 5. Prior Cue/Voice Architecture

Before this pass, training voice used pre-generated `VoiceCueKey` assets only. The player spoke session intro, framing prompts, broad exercise-family cues, rest, countdown, and completion lines. Many V1-core exercise definitions had no exercise-family voice cue, and safety notes lived as separate ladder strings.

## 6. Canonical Cue Vocabulary

Added `src/training/safetyCueDefinitions.ts` and `src/training/safetyCues.ts` with typed cue IDs, canonical text, schema version `1`, and pack resolvers. The vocabulary covers global stop rules, support, chair, floor, step, band, door-anchor, mobility/range, balance, and tracking recovery cues.

## 7. Cue Tiers And Delivery

Cue tiers are explicit: global, setup, active, repeat, and recovery. The training player now emits session-global stop cues once after the training intro, setup/active cues once after framing and before countdown, repeated-set reminders during rest, and recovery cues for tracking/setup trouble.

## 8. Catalogue Minimum

Every visible V1-core ladder level has a canonical safety profile, and the test also verifies every registered exercise ID, including optional levels, has a profile. Missing profile coverage fails tests and start-time snapshot validation.

## 9. Core Table

Core coverage includes sit-to-stand, squat, step-up, heel/toe raises, push, pull/upper-back, hinge/glutes, shoulder reach/press, balance holds, lateral stability, march, and mobility drills. Each profile contains setup, active, repeated-set, and recovery cue IDs as applicable.

## 10. Band/Anchor Pack

Standing band row includes the full band plus door-anchor pack: inspect, secure grip, face/eyes clear, controlled return, never release under tension, stop if band/grip/anchor/door/stance shifts, purpose-built anchor setup, fully closed door, light-tension test, stay out of door path, and stop if door/anchor moves. Seated band row uses the band pack plus feet-secure/no-overstretch cues without door-anchor cues.

## 11. Floor/Step/Support/Balance Packs

Floor profiles include clear floor, support for transfer, slow transition, and stop-if-transfer-unsteady cues. Step-up includes lowest stable bottom stair/step, fixed support, clear dry area, phone out of path, controlled return, and stop-if-unstable cues. Balance profiles include support within reach, eyes-open/stable-surface V1 constraint, touch support/reset, and use-support-if-needed cues.

## 12. Global Stop Rule

The session-global pack is: stop for sharp or increasing discomfort, pause/stop for dizzy/lightheaded/unwell, breathe normally, clear space, stop if support/equipment shifts, and return to setup position if tracking pauses.

## 13. Setup/Active/Repeated

Setup cues are delivered before countdown. Active cues are delivered with setup/instruction text before the first set. Repeated-set reminders are intentionally shorter and delivered during rest, avoiding a full repeated safety monologue.

## 14. Tracking

`TrainingSessionPlayer` now emits `tracking_pause_and_reset` text/voice cue IDs on setup timeout and valid-time tracking pause. The live screen keeps the latest safety text visible until an exercise changes or a new cue pack replaces it.

## 15. Explore/Manual

`Explore` ladder detail now resolves setup/safety notes from canonical cue IDs. Manual ladder practice plans carry exercise `safetyCueProfile` metadata and a session-level `safetyCueSnapshot`, matching generated Today/extra sessions.

## 16. Start Validation

Added `validateHaleSessionPlanSafetyCues` and `staleSafetyCuePlanningResult`. `App.tsx` now validates safety cue snapshots after equipment and movement capability validation and before entering the training flow. Unknown, missing, stale, unsupported schema, missing band cues, or missing stop rules route to the recovery screen.

## 17. Player Stop/Pause/Replay

The live training screen now shows pause/resume, help/repeat, skip exercise, and stop controls in normal sessions. Repeat replays current exercise instruction cue IDs plus current safety cue IDs; text remains visible even if audio assets are unavailable.

## 18. Optional Non-Regression

Optional/high-risk visibility was not expanded. Optional registered levels received cue profiles so they are safe if explicitly enabled later, but selection/default release status was unchanged.

## 19. Copy/Accessibility

Copy stays wellness-side and non-medical. The guardrail suite passes. The live safety panel uses visible text from canonical cue IDs, and controls remain accessible `Pressable` buttons with labels.

## 20. Persistence/Payload

New plans persist cue IDs, schema version, exercise profiles, and a fingerprint; they do not persist safety prose. Historical plans without the snapshot remain readable but are not allowed to start as current sessions without refresh.

## 21. Files

Primary Stage 4D-R files changed or added: `src/training/safetyCueDefinitions.ts`, `src/training/safetyCues.ts`, `src/training/sessionPlayer.ts`, `src/screens/TrainingSessionScreen.tsx`, `src/screens/SessionPreviewScreen.tsx`, `src/haleFlow/sessionPlanning.ts`, `src/haleFlow/types.ts`, `src/haleFlow/exploreViewModel.ts`, `src/audio/cues.ts`, `src/audio/voicePlayer.ts`, `scripts/generate-audio.ts`, tests, and `docs/decisions.md`.

## 22. Tests

Added `src/training/__tests__/safetyCues.test.ts`. Expanded session player, session planning, Explore view-model, and autoregulation fixture coverage. Focused Stage 4D-R command passed: 5 suites, 76 tests.

## 23. Validation

Validation passed:

- `npm test -- --runInBand`: 98 suites passed, 791 tests passed.
- `npm run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with existing Sentry config warning.
- `git diff --check`: passed.

Existing warnings remained: Watchman recrawl warning, backend sync test logs/warnings, and Jest open-handle notice.

## 24. Regression

No exercise selection, ladder threshold, equipment eligibility, movement capability gate, progression, scoring, norm, check-up, backend sync contract, or Stage 5 lifecycle behavior was intentionally changed. The autoregulation fixture lead-in was extended because required safety narration happens before countdown.

## 25. F4R-003 Status

F4R-003 is software-addressed but not production-complete. Band and door-anchor cue IDs, text, resolver tests, player delivery, preview, and manual/Explore surfaces are implemented. Missing bundled safety audio assets block full voice parity.

## 26. F4R-004 Status

F4R-004 is software-addressed but not production-complete. A coherent global stop-rule standard exists and is delivered once, with tests. Missing bundled safety audio assets block final completion.

## 27. Remaining Stage 4

Remaining Stage 4 remediation is audio generation/asset commit for all safety cue IDs, then Stage 4E-R verification. Broader deferred Stage 4 items remain outside this pass.

## 28. Stage 4E Unblocked?

No. Stage 4E-R should wait until safety cue MP3 assets are generated for Clara/Marcus and committed, or the production voice path gains an approved existing fallback.

## 29. Catalogue Beta-Blocked?

Yes. The exercise catalogue is still software/content-blocked for beta because safety cue text is present but required safety voice assets are absent.

## 30. Initial/Final Git

Initial status: dirty worktree with Stage 4C-R/Stage 5 files and untracked audit prompt/report files. Final status adds Stage 4D-R files and edits on top of that dirty tree, including this report. No staging, commit, branch, push, install, reset, checkout, or revert occurred.

## 31. Concurrent External

The worktree already contained concurrent/user-owned changes in many files before Stage 4D-R. This pass worked with those changes and did not revert them.

## 32. No Install/Git

No dependencies were installed. No git staging, commit, branch creation, push, merge, checkout, reset, or destructive command was run.

STAGE 4D-R BLOCKED
STAGE 4E-R BLOCKED
STAGE 4E-R REQUIRED
STAGE 4 REMEDIATION STILL REQUIRED
EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED
STAGE 5 REMEDIATION COMPLETE
DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA
OVERALL BETA RELEASE STILL BLOCKED
STAGE 3D-B REQUIRED
BETA DEVICE VALIDATION REQUIRED
