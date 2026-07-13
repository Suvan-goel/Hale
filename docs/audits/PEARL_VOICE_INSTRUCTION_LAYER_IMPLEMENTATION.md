# Pearl Voice Instruction Layer Implementation

Date: 2026-06-28

## 1. Scope

This pass implemented the production runtime wiring for Pearl's controlled-beta voice instruction layer:

- canonical instruction profiles for training exercises, Movement Check-Up protocols, and micro-checks;
- current-instruction help/replay for Check-Up, micro-check, and training session surfaces;
- visible instruction copy aligned with the spoken instruction source;
- Explore/manual practice visible instruction alignment through the training instruction registry;
- micro-check V2.1 mobility routing so `mobility-reach` uses the V2.1 sequence instead of the legacy hinge cue path.

The implementation did not add runtime TTS, did not add packages, did not modify lockfiles, did not stage/commit/branch/push, and did not claim physical-device validation.

## 2. Voice Instruction Audit Findings Carried Forward

The implementation carried forward the findings from `docs/audits/PEARL_VOICE_INSTRUCTION_LAYER_AUDIT.md`:

- 37 training exercises, 4 Movement Check-Up protocols, and 3 micro-check types are the controlled-beta instruction targets.
- Training repeat/help relied too heavily on legacy exercise-family cues.
- Check-Up, micro-check, and training help needed to replay the current movement/exercise instruction.
- Visible setup/status text needed to be fuller and better aligned with spoken guidance.
- `micro-mobility-left-v21` and `micro-mobility-right-v21` remained the P1 audio blocker because the physical/generated metadata surface still contains the earlier left/right leg script, while the current micro-check contract expects the hinge-and-reach script.
- Public release remains blocked pending audio refresh and physical-device QA.

## 3. Current Baseline and Constraints

Preserved constraints:

- public Check-Up remains unified Movement Profile V2;
- public V1 Check-Up route was not reintroduced;
- H5/HF routing, slot policy, and hands-free behavior were not changed except for instruction/help wiring;
- Warden, Progress authority, focus/plan/report authority, training credit, schedule credit, progression, exercise generation, safety/capability gates, optional-level policy, and movement protocol logic were not changed;
- no medical, age, diagnosis, pass/fail, or comparative improvement claims were added to public instruction copy;
- no secrets were inspected or printed.

## 4. Initial Git Status

Initial worktree before edits:

```text
git status --short --untracked-files=all: no output
git diff --name-only: no output
git diff --stat: no output
git ls-files --others --exclude-standard: no output
```

The worktree was clean before this pass.

## 5. Baseline Validation

Pre-edit validation:

- `npm run typecheck`: pass.
- `npm run verify:safe-beta-flags`: pass, with the existing Sentry org/project warning and env variable names printed by Expo config.
- `npm run verify:audio`: fail, `AUDIO VERIFICATION FAIL issues=502`.

The audio failure matched the known stale-fingerprint baseline: safety audio, Movement Profile V2 audio, and Voice V2.1 audio entries are stale for Clara and Marcus. No fake assets or hand-edited fingerprints were introduced.

## 6. Instruction Registry Architecture

Added `src/training/instructionProfiles.ts` as a pure data/helper layer. It exports:

- training profile list/get helpers;
- Movement Check-Up profile list/get helpers;
- micro-check profile list/get helpers;
- cue ID extraction and visible text helpers;
- Movement Profile V2 stage-to-protocol/profile/cue/text helpers.

The registry derives all 37 training exercise profiles from existing Voice V2.1 contracts, and defines explicit profiles for the 4 Check-Up protocols and 3 micro-check types. It imports no runtime voice channel, pose pipeline, backend, file system, provider, or env access.

## 7. Exercise Instruction Coverage

Training profile count:

```text
37 registered training exercises
37 training instruction profiles
```

Each registered exercise now has first-time, repeat, help, visible setup, visible execution, safety cue IDs, and recovery cue IDs in the canonical registry. Training uses existing V2.1 first-use and later-set cue IDs rather than creating duplicate cue IDs.

## 8. Movement Check-Up Instruction Coverage

Movement Check-Up profile count:

```text
4 controlled-beta protocols
```

Covered protocols:

- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`
- `hinge-reach`

The Movement Profile V2 screen now uses registry-backed visible instruction text and can replay current movement instructions from help. Shoulder replay respects the selected shoulder side. Balance repeat/help uses the shorter balance-attempt cue when replaying during balance-ready/trial stages.

## 9. Micro-Check Instruction Coverage

Micro-check profile count:

```text
3 controlled-beta micro-check types
```

Covered types:

- `chair-power`
- `single-leg-balance`
- `mobility-reach`

Runtime sequencing now allows `mobility-reach` in V2.1 voice mode to emit the V2.1 micro mobility cue sequence before final position/countdown. Legacy voice mode still uses the prior hinge intro/setup cues.

Remaining blocker: the current physical Clara/Marcus `micro-mobility-left-v21` and `micro-mobility-right-v21` generated metadata/scripts still say:

```text
Quick mobility check. Extend your left leg and reach gently until I say relax.
Quick mobility check. Extend your right leg and reach gently until I say relax.
```

Current source contracts expect:

```text
Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall.
```

Because of that mismatch, micro-check physical spoken coverage remains blocked even though the runtime now routes to the intended cue IDs.

## 10. Training Instruction Coverage

Training session help now replays the current exercise's canonical help cue IDs when a profile exists, then appends existing safety cues separately. If a profile is unavailable, it falls back to the legacy exercise instruction list.

The top setup notice and help button now both open help and replay the current instruction. The session notice during instruction/countdown phases now shows registry-backed visible guidance for the current exercise.

Training player sequencing, credit, schedule credit, progression, generation, floor setup, pause/resume/skip/stop/recovery behavior, and safety/capability gates were not changed.

## 11. Explore/Manual Practice Instruction Coverage

Explore detail view models now pull visible instruction text from the training instruction registry when a profile exists. Safety setup and safety summary notes remain separate through the existing safety cue helpers.

Manual practice inherits the training session runtime behavior because it launches through the training session surface.

## 12. Help/Replay Behavior

Implemented current-instruction replay on:

- `MovementProfileV2UnifiedCheckUpScreen.tsx` through `MovementProfileV2VoiceRuntime.replayInstruction()` when the runtime is active, and through the legacy voice player fallback when it is not;
- `TrainingSessionScreen.tsx` by speaking the current exercise profile help cue IDs plus safety cues;
- `MicroCheckScreen.tsx` by speaking the current micro-check profile help cue IDs once side-specific setup is known.

For single-leg micro-check help before side inference is pinned, the modal still opens but no left/right-specific cue is spoken. This avoids saying the wrong side before the hands-free side setup has selected one.

## 13. Visible Instruction Alignment

Visible instruction alignment changed on:

- Movement Profile V2 shell notice;
- Training setup notice and help modal;
- Micro-check setup notice and help modal;
- Explore detail instructions.

Recording setup notices on Check-Up, Training, and Micro-check surfaces now allow two lines with font-size fitting so fuller instruction copy does not truncate awkwardly.

## 14. Audio Cue/Assets Generated

Generated audio in this pass:

```text
new cue IDs: 0
changed cue IDs: 0
Clara MP3s generated: 0
Marcus MP3s generated: 0
```

No audio files, generated manifests, static manifest mappings, fingerprints, or provider metadata were hand-edited. No external audio generation API was called.

Total required audio assets after this implementation remain:

```text
502 required assets expected by the current audio verifier
```

The verifier currently reports 502 stale-fingerprint issues.

## 15. Generator/Verifier/Manifest Changes

No generator, verifier, generated manifest, static audio manifest, or audio metadata file was changed.

The existing V2.1 generator validates backlog rows against `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_REGISTRY.csv`. That registry currently marks `micro-mobility-left-v21` and `micro-mobility-right-v21` as exact-ready/reuse pairs with the old leg-extension scripts, so the generator path cannot safely create the current hinge-and-reach physical assets until that source registry/backlog is updated and approved.

Exact unblock sequence after updating/approving the V2.1 final cue registry and backlog for the current micro-mobility script:

```bash
ELEVENLABS_API_KEY=<set in environment> npm run audio -- --dry-run --mode v2.1 --targeted --from-backlog docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv
ELEVENLABS_API_KEY=<set in environment> npm run audio -- --mode v2.1 --targeted --from-backlog docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv --force
npm run verify:audio
```

If the product owner wants to refresh all stale configured audio, also run the approved safety and Movement Profile V2 generation groups with `--force` before the final verifier:

```bash
ELEVENLABS_API_KEY=<set in environment> npm run audio -- --group safety --force
ELEVENLABS_API_KEY=<set in environment> npm run audio -- --group movementProfileV2 --force
```

## 16. Runtime Sequencing Changes

Movement Check-Up:

- help opens the support modal and replays the current movement instruction;
- replay does not dispatch coordinator actions or advance stages;
- visible shell notice uses canonical instruction text instead of compacted stage cue text.

Micro-check:

- V2.1 mode now routes `mobility-reach` through `planMicroCheckVoiceSequenceV21`;
- legacy mode remains unchanged;
- help opens the modal and replays the current micro-check instruction when the required side context is available.

Training:

- help opens the modal and replays the current exercise instruction;
- registry visible text is shown during instructions/countdown;
- safety cues remain separate and are appended through the existing safety path.

## 17. Repetition/Annoyance Control

The implementation reuses existing first-use and later-set V2.1 training cues rather than creating longer duplicate replay lines. Help uses the concise current instruction, and repeated set behavior remains with the existing session player V2.1 sequencing.

For micro-checks, no new repeated monologues were added. The side-specific single-leg replay guard avoids speaking a premature wrong-side cue during side setup.

## 18. Accessibility Behavior

The visible help affordances remain standard buttons with existing accessibility labels. Fuller visible instruction text is available in the setup notice and help modal. Audio-first behavior is preserved: users can continue without touching the screen, and the help/replay behavior is additive.

## 19. Copy Guardrails

Added tests assert that public instruction profile text avoids the forbidden public copy list from the prompt. The instruction registry uses plain movement/exercise language and keeps safety phrasing short:

- stop/pause language remains in existing safety cues;
- support and comfortable-range reminders remain separate from instruction cue metadata;
- no internal implementation labels are exposed in public instruction text.

## 20. Tests Added/Changed

Added:

- `src/training/__tests__/instructionProfiles.test.ts`

Changed:

- `src/training/__tests__/microCheck.test.ts`
- `src/movementProfileV2/__tests__/voiceRuntime.test.ts`

The new registry tests cover:

- all 37 registered training exercises;
- all 4 Check-Up protocols;
- all 3 micro-check types;
- side-specific micro-check cue selection;
- forbidden public copy guardrails;
- static/pure registry import boundaries.

The runtime tests cover:

- V2.1 micro mobility cue sequence routing vs legacy fallback;
- Movement Profile V2 instruction replay without coordinator dispatch.

## 21. Files Changed

Production/runtime files:

- `src/training/instructionProfiles.ts`
- `src/training/microCheck.ts`
- `src/movementProfileV2/voiceRuntime.ts`
- `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`
- `src/screens/CheckUpRecordingShell.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `src/screens/MicroCheckScreen.tsx`
- `src/pearlFlow/exploreViewModel.ts`

Tests:

- `src/training/__tests__/instructionProfiles.test.ts`
- `src/training/__tests__/microCheck.test.ts`
- `src/movementProfileV2/__tests__/voiceRuntime.test.ts`

Report:

- `docs/audits/PEARL_VOICE_INSTRUCTION_LAYER_IMPLEMENTATION.md`

## 22. Focused Validation

Focused validation after implementation:

```text
npx jest src/training/__tests__/instructionProfiles.test.ts src/training/__tests__/microCheck.test.ts src/movementProfileV2/__tests__/voiceRuntime.test.ts --runInBand
pass: 3 suites, 22 tests
```

Broader focused voice/runtime/regression validation:

```text
npx jest src/screens/__tests__/MovementProfileV2UnifiedCheckUpScreen.voiceRuntime.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/microCheckVoiceV21/__tests__/microCheckVoiceV21.test.ts src/training/voiceV21/__tests__/foundation.test.ts src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts src/training/__tests__/voiceExperienceRuntimeSelection.test.ts src/training/__tests__/workoutGeneration.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/exercises/__tests__/catalog.test.ts src/training/__tests__/safetyCues.test.ts src/audio/__tests__/voicePlayer.test.ts src/audio/__tests__/movementProfileV2Audio.test.ts src/audio/__tests__/safetyAudio.test.ts --runInBand
pass: 15 suites, 242 tests
```

H5/HF/Warden/release-focused validation:

```text
npx jest src/config/__tests__/voiceExperience.test.ts src/config/__tests__/releaseFlagAudit.test.ts src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/pearlFlow/__tests__/microCheckPolicy.test.ts src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/reference/movementProfileV2/__tests__/assessment.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts --runInBand
pass: 12 suites, 150 tests
```

Final focused rerun after the side-specific replay guard:

```text
npx jest src/training/__tests__/instructionProfiles.test.ts src/training/__tests__/microCheck.test.ts src/movementProfileV2/__tests__/voiceRuntime.test.ts src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts --runInBand
pass: 4 suites, 24 tests
```

Known warning: Watchman recrawl warning.

## 23. Full Validation

Final full gate results:

```text
npm run typecheck
pass

npm run verify:safe-beta-flags
pass, with existing Sentry org/project warning and Expo env-name listing

npm run verify:audio
fail, AUDIO VERIFICATION FAIL issues=502

npm test -- --runInBand
pass: 173 suites, 1416 tests

npm --prefix website run typecheck
pass

npm --prefix website run test
pass: 5 files, 17 tests

npx --no-install expo config --type public
pass, with existing Sentry org/project warning and Expo env-name listing

git diff --check
pass
```

Known warnings:

- Watchman recrawl warning during Jest.
- Jest reported the existing post-run open-handle warning.
- Expo config/export reported the existing Sentry org/project warning.
- Expo export reported `NO_COLOR` ignored due to `FORCE_COLOR` on the normal export.

## 24. Export and Safe-Beta Export Validation

Normal export:

```text
npx --no-install expo export --platform all --output-dir /tmp/pearl-voice-instruction-layer-export
pass
assets: 1592
web bundles: 2
ios bundles: 1
android bundles: 1
files: 2
temporary export directory removed after command
```

Safe-beta export:

```text
env EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0 EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0 EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0 EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0 EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0 EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS=0 npx --no-install expo export --platform all --output-dir /tmp/pearl-voice-instruction-layer-safe-beta-export
pass
assets: 1592
web bundles: 2
ios bundles: 1
android bundles: 1
files: 2
temporary export directory removed after command
```

## 25. Remaining Limitations/Device QA

Remaining blockers and QA steps:

- regenerate approved audio assets/metadata through the generator after updating the V2.1 micro-mobility source registry/backlog;
- rerun `npm run verify:audio` to a pass;
- listen-check the regenerated Clara/Marcus micro mobility lines;
- physical-device QA on Android and iOS for Check-Up, official retest, optional full Check-Up, scheduled micro-check, optional micro-check, training, and Explore/manual practice;
- confirm audio does not interrupt camera sessions on real devices;
- confirm help/replay timing on real devices under tracking loss, pause/resume, and setup timeout.

## 26. Final Git Status

Expected final dirty inventory from this pass:

```text
 M src/pearlFlow/exploreViewModel.ts
 M src/movementProfileV2/__tests__/voiceRuntime.test.ts
 M src/movementProfileV2/voiceRuntime.ts
 M src/screens/CheckUpRecordingShell.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/training/__tests__/microCheck.test.ts
 M src/training/microCheck.ts
?? docs/audits/PEARL_VOICE_INSTRUCTION_LAYER_IMPLEMENTATION.md
?? src/training/__tests__/instructionProfiles.test.ts
?? src/training/instructionProfiles.ts
```

No package files, lockfiles, generated audio files, manifests, Warden files, `docs/decisions.md`, or prior audit reports were changed.

## 27. Confirmation

Confirmed:

- no Warden formula/data/fingerprint/golden-test change;
- no movement/protocol policy change;
- no H5 routing change;
- no H5/HF/training credit/progression change;
- no public V1 route reintroduction;
- no runtime TTS;
- no package or lockfile change;
- no staging, commit, branch, push, or PR;
- no physical-device validation claim.

VOICE INSTRUCTION LAYER IMPLEMENTATION BLOCKED
EVERY CONTROLLED-BETA REACHABLE TRAINING EXERCISE HAS SPOKEN INSTRUCTION COVERAGE
MOVEMENT CHECK-UP SPOKEN INSTRUCTION COVERAGE COMPLETE
MICRO-CHECK SPOKEN INSTRUCTION COVERAGE INCOMPLETE
HELP / REPEAT INSTRUCTION REPLAY IMPLEMENTED
AUDIO ASSET / MANIFEST / VERIFIER COVERAGE BLOCKED
NO RUNTIME TTS
NO WARDEN FORMULA / DATA CHANGE
NO H5 ROUTING CHANGE
NO H5/HF/TRAINING CREDIT / PROGRESSION CHANGE
NO PUBLIC V1 ROUTE REINTRODUCTION
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
