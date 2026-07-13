# Pearl Voice Instruction Layer Audit

## 1. Scope

This audit covers the current voice-instruction layer for:

- Public Movement Profile V2 Check-Up flows: baseline, baseline retake, official retest, and optional full extra Check-Up.
- Scheduled and optional micro-check flows: `chair-power`, `single-leg-balance`, and `mobility-reach`.
- Training sessions, extra sessions, presets, and the registered exercise catalogue.
- Explore and manual practice entry points.
- Audio cue/asset coverage, runtime sequencing, help/replay behavior, visible instruction support, and future implementation requirements.

This is an audit and planning report only. No production runtime behavior, audio assets, manifests, fingerprints, release gates, H5/HF policies, Warden data, training policies, package files, Git state, or physical-device claims were changed.

## 2. Why The Audit Was Required

Pearl is voice-led. The intended user is away from the phone after setup, and many target users may not already know the exercises. A complete instruction layer must therefore do more than play safety cues or flow-transition prompts: each movement needs a calm name, concise setup instruction, concise execution instruction, relevant safety reminder, shorter repeat instruction, visible support text, and a help/repeat path that can replay the latest instruction.

Current hands-free, safety, and V2.1 voice work gives Pearl much of the foundation. This audit checks whether the instruction layer is complete across all public Check-Up, micro-check, training, and Explore/manual-practice surfaces.

## 3. Current Baseline And Constraints

Carried-forward baseline from the listed prior reports:

- Normal public Check-Up is unified Movement Profile V2.
- Public V1 Movement Age is retired from normal builds.
- HF1/HF balance fixes make public V2 Check-Up hands-free in software; physical-device retest remains required.
- HF2 makes scheduled/optional micro-checks hands-free in software.
- HF3 makes training floor setup hands-free in software.
- Stage 4D added canonical safety cue tiers and stop rules.
- Stage 4D-R.1 generated and verified safety audio assets.
- Movement Profile V2 voice cues already exist for the Check-Up flow.
- Warden and Progress restoration are implemented and were not touched.
- Audio verification can currently fail because the product owner changed voice settings before regenerating all audio.
- Physical-device validation is not claimed.
- Public release remains blocked.

Hard constraints observed during this task:

- No production runtime changes.
- No audio generation or asset edits.
- No manifest or fingerprint edits.
- No runtime TTS.
- No Movement Profile V2 measurement changes.
- No Warden, H5/HF, training credit, schedule credit, progression, safety/capability, optional-level, release-flag, package, lockfile, branch, staging, commit, push, or PR changes.

## 4. Initial Git Status

`git status --short --untracked-files=all`:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/checkup/__tests__/measurementProtocolRegistry.test.ts
 M src/checkup/measurementProtocolRegistry.ts
 M src/pearlFlow/index.ts
 M src/history/trends.ts
 M src/movementProfileV2/__tests__/liveCoordinator.test.ts
 M src/movementProfileV2/liveCoordinator.ts
 M src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
 M src/render/ArtDirectedHumanRenderer.tsx
 M src/render/__tests__/artDirectedHumanGeometry.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/render/poseAvatarTypes.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/CheckUpRecordingShell.test.ts
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/training/__tests__/microCheck.test.ts
 M src/training/__tests__/microCheckSideSetup.test.ts
 M src/training/__tests__/voiceExperienceRuntimeSelection.test.ts
 M src/training/microCheck.ts
 M src/training/microCheckVoiceV21/__tests__/microCheckVoiceV21.test.ts
 M src/training/microCheckVoiceV21/assets.ts
 M src/training/microCheckVoiceV21/contracts.ts
 M src/training/microCheckVoiceV21/protocolCompatibility.ts
?? docs/audits/PEARL_MOVEMENT_CHECKUP_BALANCE_DEVICE_FIX_IMPLEMENTATION.md
?? docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
?? src/pearlFlow/__tests__/microCheckSummary.test.ts
?? src/pearlFlow/microCheckSummary.ts
?? src/screens/MicroCheckSummaryScreen.tsx
```

`git diff --name-only`:

```text
App.tsx
docs/decisions.md
src/adherence/screens/BlockIntroScreen.tsx
src/audio/safetyAudio.ts
src/audio/voiceV21Audio.ts
src/checkup/__tests__/measurementProtocolRegistry.test.ts
src/checkup/measurementProtocolRegistry.ts
src/pearlFlow/index.ts
src/history/trends.ts
src/movementProfileV2/__tests__/liveCoordinator.test.ts
src/movementProfileV2/liveCoordinator.ts
src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
src/render/ArtDirectedHumanRenderer.tsx
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
src/render/poseAvatarTypes.ts
src/results/CheckUpResultsShell.tsx
src/screens/MicroCheckScreen.tsx
src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/__tests__/CheckUpRecordingShell.test.ts
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
src/training/__tests__/microCheck.test.ts
src/training/__tests__/microCheckSideSetup.test.ts
src/training/__tests__/voiceExperienceRuntimeSelection.test.ts
src/training/microCheck.ts
src/training/microCheckVoiceV21/__tests__/microCheckVoiceV21.test.ts
src/training/microCheckVoiceV21/assets.ts
src/training/microCheckVoiceV21/contracts.ts
src/training/microCheckVoiceV21/protocolCompatibility.ts
```

`git diff --stat`:

```text
 App.tsx                                            | 176 +++++++++++-
 docs/decisions.md                                  |   8 +
 src/adherence/screens/BlockIntroScreen.tsx         | 113 +++++---
 src/audio/safetyAudio.ts                           |  13 +-
 src/audio/voiceV21Audio.ts                         |   3 +-
 .../__tests__/measurementProtocolRegistry.test.ts  |  17 +-
 src/checkup/measurementProtocolRegistry.ts         |  16 +-
 src/pearlFlow/index.ts                              |   1 +
 src/history/trends.ts                              |  12 +-
 .../__tests__/liveCoordinator.test.ts              | 296 +++++++++++++++++++--
 src/movementProfileV2/liveCoordinator.ts           | 129 +++++++--
 .../__tests__/referenceEngine.test.ts              |   9 +
 src/render/ArtDirectedHumanRenderer.tsx            |   8 +-
 .../__tests__/artDirectedHumanGeometry.test.ts     |  13 +
 src/render/artDirectedHumanGeometry.ts             | 226 ++++++++++------
 src/render/poseAvatarTypes.ts                      |   2 +
 src/results/CheckUpResultsShell.tsx                | 204 +++++++++-----
 src/screens/MicroCheckScreen.tsx                   |   6 +-
 .../MovementProfileV2UnifiedCheckUpScreen.tsx      |   2 +-
 src/screens/PoseOverlayBenchmarkScreen.tsx         |  30 ++-
 .../__tests__/CheckUpRecordingShell.test.ts        |   3 +
 ...eOverlayBenchmarkScreen.constellationV2.test.ts |  16 ++
 src/training/__tests__/microCheck.test.ts          |  26 +-
 src/training/__tests__/microCheckSideSetup.test.ts |  40 ++-
 .../voiceExperienceRuntimeSelection.test.ts        |   4 +-
 src/training/microCheck.ts                         | 113 ++++++--
 .../__tests__/microCheckVoiceV21.test.ts           |  21 +-
 src/training/microCheckVoiceV21/assets.ts          |   8 +-
 src/training/microCheckVoiceV21/contracts.ts       |  28 +-
 .../microCheckVoiceV21/protocolCompatibility.ts    |   2 +-
 30 files changed, 1214 insertions(+), 331 deletions(-)
```

`git ls-files --others --exclude-standard`:

```text
docs/audits/PEARL_MOVEMENT_CHECKUP_BALANCE_DEVICE_FIX_IMPLEMENTATION.md
docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
src/pearlFlow/__tests__/microCheckSummary.test.ts
src/pearlFlow/microCheckSummary.ts
src/screens/MicroCheckSummaryScreen.tsx
```

All pre-existing tracked and untracked files were treated as user-owned and were not modified or reverted.

## 5. Baseline Validation

Required validation before writing this report:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | Pass | TypeScript passed. |
| `npm run verify:safe-beta-flags` | Pass | Expo public config resolved on SDK 56.0.0. Known Sentry warning: missing organization/project config, environment fallback used. |
| `npm run verify:audio` | Fail | `AUDIO VERIFICATION FAIL issues=502`. Failures were stale fingerprints across safety audio, Movement Profile V2 audio, and Voice V2.1 audio for Clara and Marcus. This matches the known external regeneration blocker; this audit did not edit audio. |
| Focused Jest suite for MPV2 voice, live coordinator, Check-Up shell, micro-check, training session player, safety audio/cues, voice player, exercise catalogue, workout/session planning, H5/HF, release, and copy guardrails | Fail | 24 suites passed, 1 failed. `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts` expects `Choose the leg you can extend comfortably.` but the current source contains different side-setup copy. Existing dirty-tree baseline, not caused by this audit. |
| `npm test -- --runInBand` | Fail | 169 suites passed, 2 failed. Same micro-check side-copy assertion plus `src/config/__tests__/voiceExperience.test.ts`, which expects micro-check V2.1 enabled/selectable but current activation reports `microCheckVoiceV21Enabled: false` and `microCheckSelectableTypeCount: 0` because the physical audio surface is not ready. |
| `npm --prefix website run typecheck` | Pass | Website TypeScript passed. |
| `npm --prefix website run test` | Pass | 5 files, 17 tests passed. |
| `npx --no-install expo config --type public` | Pass | Config printed successfully with the same Sentry warning. |
| `git diff --check` | Pass | No whitespace errors. |

Watchman reported a recrawl warning during Jest. Jest also reported that it did not exit one second after completion.

## 6. Current Voice Architecture Inventory

| System | Files | Cue source | Audio asset group | Runtime owner | When cues play | Visible text source | Help/replay behavior | Verification coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Generic voice player | `src/audio/cues.ts`, `src/audio/voicePlayer.ts`, `src/audio/manifest.ts` | `VoiceCueKey`, `voicePriority`, static manifest lookup | Bundled `assets/audio/voice/<voiceId>/*.mp3` | `VoiceChannel`, `SfxChannel` | All flows that call `speak` or `speakTracked` | Caller-owned | No canonical instruction replay; callers decide | `src/audio/__tests__/voicePlayer.test.ts`, `scripts/verify-audio.ts` |
| Safety cue pack | `src/training/safetyCueDefinitions.ts`, `src/training/safetyCues.ts`, `src/audio/safetyAudio.ts`, safety manifest | `SafetyCueId` profiles by exercise | Safety audio, Clara and Marcus | Training player and safety planners | Session start, setup, active/recovery, repeated-set policies | `exerciseSafetySetupText`, `exerciseSafetySummaryText`, Explore safety text | Separate from exercise instruction; sometimes the only replayable content | Safety audio/cue tests, verifier |
| Movement Profile V2 Check-Up voice | `src/movementProfileV2/voiceCues.ts`, `voiceRuntime.ts`, `liveCoordinator.ts`, `MovementProfileV2UnifiedCheckUpScreen.tsx`, `CheckUpRecordingShell.tsx` | `MovementProfileV2CueId` definitions and sequencer | `movementProfileV2` audio metadata/manifest | `MovementProfileV2VoiceRuntime` and Check-Up screen | Intro, movement setup, balance attempts/rest, recovery, completion | Compact current cue text in shell notices | Generic help modal only; no full current instruction replay control | MPV2 voice cue/runtime tests, live coordinator tests, Check-Up screen tests |
| Training Voice V2.1 | `src/training/voiceV21/*`, `src/training/sessionPlayer.ts`, `src/screens/TrainingSessionScreen.tsx` | 37 exercise contracts plus shared logical cues | `voiceV21` physical cue assets | `TrainingSessionPlayer`, `TrainingVoiceRuntimeV21` | Session intro, first-use exercise instruction, side setup, targets, countdown, rests, recovery, progress | Exercise catalogue text in Explore/preview; active player mostly name/metric | Pause screen repeat currently uses legacy `def.voice.instructions`, not canonical V2.1 metadata | Voice V2.1 foundation/readiness/assets/runtime tests; session player tests |
| Micro-check V2.1 | `src/training/microCheckVoiceV21/*`, `src/training/microCheck.ts`, `src/screens/MicroCheckScreen.tsx` | 3 micro-check contracts plus shared cues | Reused `voiceV21` corpus where exact; two mobility cues mismatch | `MicroCheckRunner`, `MicroCheckScreen` | Intended setup, final position, countdown, active stop, recovery, completion | Side setup captions and limited active footer/notice text | Generic setup help modal only; no current movement replay | Micro-check V2.1 contract/assets tests, micro-check runner/screen tests |
| Legacy V1/rollback cues | `src/audio/cues.ts`, per-exercise `def.voice.instructions`, movement definitions | Legacy family cue IDs such as `ex-sit-to-stand`, `microcheck-chair`, `hinge-setup` | Existing bundled audio | Legacy training and micro-check fallback paths | Before first set/check when V2.1 is unavailable | Catalogue or screen copy | Training repeat uses this path; 8 registered exercises have no legacy instruction cue | Legacy session/micro tests |
| Audio generator/verifier | `scripts/generate-audio.ts`, `scripts/verify-audio.ts`, `src/audio/*Audio.ts`, generated manifests | Static cue metadata/fingerprints | Clara and Marcus generated MP3s | CLI only | Build-time generation/verification, never runtime TTS | N/A | N/A | `npm run verify:audio` currently fails only with stale fingerprints |

Overlap and gaps:

- Training V2.1 already has a strong logical script corpus for all 37 registered exercises and exact physical cue pairs for 169 training requirements.
- Safety cues are mature, but they are not a substitute for "how to do the exercise" instructions.
- Movement Profile V2 Check-Up has concise spoken movement instructions, but visible/help/replay support is incomplete.
- Micro-check V2.1 is blocked from selection because the physical audio surface is not ready; mobility micro-check has two script mismatches that require new exact generated pairs.
- There is no single canonical instruction metadata registry consumed by training, Check-Up, micro-check, Explore, visible text, help/replay, generator, and verifier.

## 7. Movement Check-Up Voice Coverage

Audited Movement Profile V2 protocols:

- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`
- `hinge-reach` supporting capture

Coverage:

- Spoken name/setup/execution cues exist for each movement through `src/movementProfileV2/voiceCues.ts`.
- Voice sequencing is tied to live stage transitions and gates hands-free flow where required.
- Recovery cues exist for tracking loss/interruption, balance retry, shoulder retry, hinge completion/no-measurement, and Check-Up completion.
- Visible text exists as compact notices derived from the current cue, but the shell does not present a complete full instruction aligned to the latest spoken script.
- The help action opens generic setup/camera help rather than replaying the current movement instruction.
- No new Check-Up cue assets are required if current cues are reused for help/replay; the missing layer is metadata/UI/runtime wiring.

Flow variants:

- Baseline, baseline retake, official retest, and optional full extra Check-Up share the same public V2 shell/runtime path and therefore inherit the same strengths and gaps.

Risk:

- Core spoken Check-Up instructions are not a P0 gap.
- Help/replay and full visible instruction support are P1 before beta because users away from the phone need a way to recover if they miss an instruction.

## 8. Micro-Check Voice Coverage

Audited micro-check types:

- `chair-power`
- `single-leg-balance`
- `mobility-reach`

Current state:

- Legacy micro-check flow has basic spoken coverage: chair uses `microcheck-chair`, balance uses `microcheck-balance`, and mobility reuses legacy hinge cues.
- Micro-check V2.1 contracts exist for all 3 types.
- Runtime activation currently reports `microCheckVoiceV21Enabled: false`, `microCheckSelectableTypeCount: 0`, and `micro_physical_audio_surface_not_ready`.
- Asset requirements for micro-check V2.1: 19 logical requirements, 17 reusable exact pairs, 2 script mismatches.
- The two mismatches are `micro-mobility-left-v21` and `micro-mobility-right-v21`, both currently mapped to the older `hinge-setup` candidate instead of the exact micro mobility script.
- `MicroCheckScreen` side setup is hands-free where supported, with manual fallback copy, but help is generic setup help rather than "repeat the current check instruction."
- Visible active instruction is limited; mobility has "Reach toward the floor, then stand tall", while chair and balance rely more on phase/movement labels.

Risk:

- `mobility-reach` V2.1 exact audio is P1 before beta and currently blocks the full micro-check V2.1 surface.
- The activation/test mismatch around micro-check V2.1 is a P1 readiness issue.
- Help/replay and visible instruction alignment are P1/P2, depending on whether legacy micro-check remains the beta fallback.

## 9. Training Voice Coverage

Audited training catalogue:

- 37 registered exercise definitions.
- 37 Training Voice V2.1 exercise contracts.
- 169 Training Voice V2.1 asset requirements; all 169 report exact existing Clara/Marcus physical pairs.
- 29 exercises have legacy `def.voice.instructions`; 8 registered exercises have no legacy instruction cue.

Training strengths:

- Each registered exercise has a V2.1 first-use cue, later-set cue, target cue, release status, side plan where needed, safety plan, and visible catalogue instruction.
- V2.1 training runtime is selectable: `trainingVoiceV21Enabled: true`, `trainingSelectableExerciseCount: 37`.
- Explore/detail pages expose "How to do it" and "Before you start" text based on catalogue and safety metadata.

Training gaps:

- The active training screen does not consistently show the full current instruction text that matches the V2.1 spoken script.
- Pause/repeat currently uses legacy `def.voice.instructions` plus safety cues. For 8 exercises, legacy instruction replay may be empty or incomplete despite V2.1 contracts existing.
- Later-set V2.1 cues exist, but the normal rest-to-countdown path does not consistently speak a short later-set cue before every repeated set outside special setup paths.
- Session help is generic setup help, not current exercise instruction replay.

The 8 registered exercises with empty legacy voice instruction arrays:

- `seated-band-row`
- `standing-band-row`
- `band-pull-apart`
- `supported-side-step`
- `mini-band-lateral-walk`
- `thoracic-rotation`
- `supported-hip-flexor-stretch`
- `wall-calf-stretch`

Risk:

- Core training instruction scripts are mostly present, but replay/help wiring is P1 before beta, especially for band, balance, floor, step, and mobility items.
- Hidden optional levels are P3/deferred unless they become reachable.

## 10. Explore / Manual Practice Voice Coverage

Explore/detail coverage:

- `src/pearlFlow/exploreViewModel.ts` supplies visible exercise instructions, setup notes, safety notes, equipment, camera-placement reminders, and safety checklist items.
- `src/screens/ExploreDetailScreens.tsx` displays "How to do it" and "Before you start."
- Explore itself does not play audio. If the user starts practice through a training route, the training player supplies the spoken path.

Manual practice coverage:

- `ManualCheckupStartScreen` and manual/extra Check-Up entry points provide choices, then hand off to the selected Check-Up or micro-check flow.
- They do not independently supply movement instruction audio before the selected runtime starts.

Gaps:

- Explore visible text is good, but there is no audio/replay in Explore detail itself.
- Manual practice should consume the same canonical instruction profile as training/check-up, so voice and visible copy remain aligned once practice starts.

## 11. Complete Exercise Instruction Matrix

Coverage labels used below:

- First-time: `good` means an existing V2.1 first-use script exists. `partial` means the script exists but current runtime/UI does not consistently expose matching visible/help text.
- Repeat: `partial` means a V2.1 later-set script exists but repeated-set runtime/help behavior is incomplete.
- Help/replay: `partial` means catalogue text or legacy replay exists but not canonical V2.1 instruction replay. `missing` means legacy replay can be empty.
- New audio: `no` for training exercises because current Training Voice V2.1 asset audit reports 169 exact existing pairs.
- Hidden/deferred levels remain hidden in recommendations.

| Exercise ID | Display name | Domain / ladder | Release / beta reach | Flows | Existing spoken cue IDs | Existing visible instruction | Existing safety cue IDs | First-time | Repeat | Help/replay | Recommended first-time spoken script | Recommended repeat spoken script | Recommended help/replay script | Recommended visible text | New audio? / reuse | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sts-cushion` | Cushion Sit-to-Stand | strength_power / sit-to-stand | v1_core / yes | training, extra session, Explore practice | legacy `ex-sit-to-stand`; V2.1 `ex-sts-cushion-first-v21`, `ex-sts-cushion-next-v21`, `target-sts-cushion-v21` | Sit tall on a chair with a cushion on the seat, feet flat. Stand all the way up, then sit back down with control. | setup `chair_use_sturdy_chair`, `tracking_keep_full_body_in_view`, `tracking_move_when_cued`; active `chair_controlled_sit`, `comfortable_range_only`, `tracking_no_rush_or_exaggerate` | good | partial | partial | Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit with control. | Cushion sit-to-stand. | Replay first-use plus current target. | Reuse catalogue text. | no / yes | P1 | V2.1 exact assets present; wire help/replay to V2.1 metadata. |
| `sts-standard` | Sit-to-Stand | strength_power / sit-to-stand | v1_core / yes | training, extra session, Explore practice | legacy `ex-sit-to-stand`; V2.1 `ex-sts-standard-first-v21`, `ex-sts-standard-next-v21`, `target-sts-standard-v21` | Sit tall in the middle of a chair with your feet flat. Stand all the way up, then sit back down with control. | same chair/tracking setup and active cues as sit-to-stand family | good | partial | partial | Sit-to-stand. Sit tall in the middle of the chair, feet flat. Stand fully, then sit with control. | Sit-to-stand. | Replay first-use plus current target. | Reuse catalogue text. | no / yes | P1 | Core exercise; help/replay should be canonical. |
| `sts-slow-eccentric` | Slow-Lower Sit-to-Stand | strength_power / sit-to-stand | v1_core / yes | training, extra session, Explore practice | legacy `ex-sit-to-stand`; V2.1 `ex-sts-slow-eccentric-first-v21`, `ex-sts-slow-eccentric-next-v21`, `target-sts-slow-eccentric-v21` | Stand from the chair, then lower back down slowly and steadily before the next rep. | same chair/tracking setup and active cues as sit-to-stand family | good | partial | partial | Slow-lower sit-to-stand. Stand fully, then lower slowly and steadily before the next rep. | Slow-lower sit-to-stand. | Replay first-use plus current target. | Reuse catalogue text. | no / yes | P1 | Core strength progression. |
| `sts-power` | Power Sit-to-Stand | strength_power / sit-to-stand | v1_core / yes | training, extra session, Explore practice | legacy `ex-sit-to-stand`; V2.1 `ex-sts-power-first-v21`, `ex-sts-power-next-v21`, `target-sts-power-v21` | Sit tall, then drive up briskly to standing and sit back down with control. | same chair/tracking setup and active cues as sit-to-stand family | good | partial | partial | Power sit-to-stand. Sit tall, drive up briskly to standing, then sit with control. | Power sit-to-stand. | Replay first-use plus current target. | Reuse catalogue text. | no / yes | P1 | Important strength/power item. |
| `loaded-sit-to-stand` | Loaded Sit-to-Stand | strength_power / sit-to-stand | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-sit-to-stand`; V2.1 `ex-loaded-sit-to-stand-first-v21`, `ex-loaded-sit-to-stand-next-v21`, `target-loaded-sit-to-stand-v21` | Sit tall on a chair with your feet flat. Hold a backpack or weight close to your chest. Stand all the way up, then sit back down with control. | chair/tracking setup and active cues | good | partial | partial | Loaded sit-to-stand. Hold the load close to your chest. Stand fully, then sit with control. | Loaded sit-to-stand. | Replay first-use plus current target. | Reuse catalogue text. | no / yes | P3 | Hidden optional; do not expose as beta recommendation. |
| `squat-supported` | Supported Squat | strength_power / squat | v1_core / yes | training, extra session, Explore practice | legacy `ex-squat`; V2.1 `ex-squat-supported-first-v21`, `ex-squat-supported-next-v21`, `target-squat-supported-v21` | Stand with feet about hip width apart, fingertips near a chair or counter. Lower as if to sit, then stand back up. | setup `support_use_sturdy_support`, `support_keep_support_within_reach`, `tracking_keep_full_body_in_view`, `tracking_move_when_cued`, `chair_use_sturdy_chair`; active `global_stop_if_support_moves`, `comfortable_range_only`, `tracking_no_rush_or_exaggerate` | good | partial | partial | Supported squat. Stand near sturdy support. Lower as if to sit, then stand with control. | Supported squat. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Common first-plan movement. |
| `squat-free` | Squat | strength_power / squat | v1_core / yes | training, extra session, Explore practice | legacy `ex-squat`; V2.1 `ex-squat-free-first-v21`, `ex-squat-free-next-v21`, `target-squat-free-v21` | Stand with feet about hip width apart. Lower as if to sit, then stand back up with control. | setup tracking; active `comfortable_range_only`, `tracking_no_rush_or_exaggerate` | good | partial | partial | Squat. Feet about hip width. Lower as if to sit, then stand with control. | Squat. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core exercise. |
| `squat-slow-eccentric` | Slow-Lower Squat | strength_power / squat | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-squat`; V2.1 `ex-squat-slow-eccentric-first-v21`, `ex-squat-slow-eccentric-next-v21`, `target-squat-slow-eccentric-v21` | Lower into the squat slowly, then stand back up with control. | tracking and range safety | good | partial | partial | Slow-lower squat. Lower slowly, then stand with control. | Slow-lower squat. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P3 | Hidden optional. |
| `squat-loaded` | Loaded Squat | strength_power / squat | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-squat`; V2.1 `ex-squat-loaded-first-v21`, `ex-squat-loaded-next-v21`, `target-squat-loaded-v21` | Hold a backpack or weight close to your chest. Lower into a squat, then stand back up with control. | tracking and range safety | good | partial | partial | Loaded squat. Hold the load close to your chest. Lower into a squat, then stand with control. | Loaded squat. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P3 | Hidden optional. |
| `chair-supported-split-squat` | Chair-Supported Split Squat | strength_power / squat | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-squat`; V2.1 `ex-chair-supported-split-squat-first-v21`, `side-split-squat-left-forward-v21`, `side-split-squat-right-forward-v21`, `ex-chair-supported-split-squat-next-v21`, `target-chair-supported-split-squat-v21` | Stand in a split stance with fingertips near a chair or counter. Bend both knees slightly to lower under control, then press back up to stand tall. | support, chair, tracking, range cues | good | partial | partial | Supported split squat. Keep fingertips near sturdy support. Left or right foot forward in a small split stance. | Supported split squat. | Replay first-use plus side cue and target. | Reuse catalogue text. | no / yes | P3 | Hidden optional and higher complexity. |
| `step-up` | Step-Up | strength_power / step-up | v1_core / yes | training, extra session, Explore practice | legacy `ex-step-up`; V2.1 `ex-step-up-first-v21`, `step-up-start-left-v21`, `step-up-start-right-v21`, `ex-step-up-next-v21`, `target-step-up-v21` | Stand facing the lowest stable step with fingertips near support. Step up with one foot, bring the other to meet it, then step back down leading with the same foot. | setup `step_use_low_stable_step`, `step_fixed_support_nearby`, `step_clear_dry_area`, `step_phone_out_of_path`, tracking; active `step_controlled_return`, `step_stop_if_unstable`, tracking | good | partial | partial | Step-up. Use the lowest stable step with support nearby. Return both feet to the floor after each rep. | Step-up. Return both feet to the floor after each rep. | Replay first-use plus side/start cue and target. | Reuse catalogue text. | no / yes | P1 | High priority because setup and lead-leg behavior matter. |
| `heel-raise-supported` | Supported Heel Raise | strength_power / heel-toe-raise | v1_core / yes | training, extra session, Explore practice | legacy `ex-heel-raise`; V2.1 `ex-heel-raise-supported-first-v21`, `ex-heel-raise-supported-next-v21`, `target-heel-raise-supported-v21` | Stand tall with fingertips near a wall or counter. Rise onto the balls of your feet, then lower slowly. | support/tracking setup; support/range active | good | partial | partial | Supported heel raise. Fingertips near support. Rise onto the balls of your feet, then lower slowly. | Supported heel raise. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core strength/balance support item. |
| `heel-raise-free` | Heel Raise | strength_power / heel-toe-raise | v1_core / yes | training, extra session, Explore practice | legacy `ex-heel-raise`; V2.1 `ex-heel-raise-free-first-v21`, `ex-heel-raise-free-next-v21`, `target-heel-raise-free-v21` | Stand tall. Rise onto the balls of your feet, then lower slowly. | tracking/range cues | good | partial | partial | Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly. | Heel raise. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core. |
| `toe-raise-supported` | Supported Toe Raise | strength_power / heel-toe-raise | v1_core / yes | training, extra session, Explore practice | legacy `ex-heel-raise`; V2.1 `ex-toe-raise-supported-first-v21`, `ex-toe-raise-supported-next-v21`, `target-toe-raise-supported-v21` | Stand tall with fingertips near a wall or counter. Keep your heels on the floor, lift the toes and front of your feet, then lower slowly. | support/tracking setup; support/range active | good | partial | partial | Supported toe raise. Keep heels down, lift the front of your feet, then lower slowly. | Supported toe raise. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core. |
| `glute-bridge-hold` | Bridge Hold | strength_power / hinge-glutes | v1_core / yes | training, extra session, Explore practice | legacy `ex-glute-bridge`; V2.1 `ex-glute-bridge-hold-first-v21`, `ex-glute-bridge-hold-next-v21`, `target-glute-bridge-hold-v21` | Lie on your back, knees bent and feet flat. Lift your hips toward the ceiling and hold. | setup `floor_clear_space`, `floor_use_support_for_transfer`, `floor_slow_transition`, tracking; active `floor_stop_if_transfer_unsteady`, range/tracking cues | good | partial | partial | Bridge hold. Lie on your back, knees bent, feet flat. Lift your hips and hold. | Bridge hold. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Floor setup requires strong help/replay. |
| `glute-bridge-reps` | Glute Bridge | strength_power / hinge-glutes | v1_core / yes | training, extra session, Explore practice | legacy `ex-glute-bridge`; V2.1 `ex-glute-bridge-reps-first-v21`, `ex-glute-bridge-reps-next-v21`, `target-glute-bridge-reps-v21` | Lie on your back, knees bent and feet flat. Lift your hips, pause briefly, then lower. | floor setup and active cues | good | partial | partial | Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips, then lower with control. | Glute bridge. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Floor setup requires strong help/replay. |
| `push-up-wall` | Wall Push-Up | strength_power / push | v1_core / yes | training, extra session, Explore practice | legacy `ex-push-up`; V2.1 `ex-push-up-wall-first-v21`, `ex-push-up-wall-next-v21`, `target-push-up-wall-v21` | Place your hands shoulder width apart on a wall. Lower in with control, then press back out. | support/tracking setup; support/range active | good | partial | partial | Wall push-up. Hands on the wall. Lower in with control, then press away. | Wall push-up. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core upper push. |
| `push-up-incline` | Incline Push-Up | strength_power / push | v1_core / yes | training, extra session, Explore practice | legacy `ex-push-up`; V2.1 `ex-push-up-incline-first-v21`, `ex-push-up-incline-next-v21`, `target-push-up-incline-v21` | Place your hands shoulder width apart on a chair or counter. Lower in with control, then press back out. | support/chair/tracking setup; support/range active | good | partial | partial | Incline push-up. Hands on a stable counter or sturdy chair. Lower in with control, then press away. | Incline push-up. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core upper push. |
| `push-up-standard` | Push-Up | strength_power / push | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-push-up`; V2.1 `ex-push-up-standard-first-v21`, `ex-push-up-standard-next-v21`, `target-push-up-standard-v21` | Place your hands shoulder width apart on the floor. Lower in with control, then press back up. | floor/tracking setup and active cues | good | partial | partial | Push-up. Start from the floor position. Lower with control, then press up. | Push-up. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P3 | Hidden optional floor item. |
| `overhead-reach` | Overhead Reach | mobility_flexibility / shoulder-reach-press | v1_core / yes | training, extra session, Explore practice | legacy `ex-overhead`; V2.1 `ex-overhead-reach-first-v21`, `ex-overhead-reach-next-v21`, `target-overhead-reach-v21` | Stand tall. Reach both arms up overhead as far as comfortable, then lower. | tracking setup; range/mobility active | good | partial | partial | Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower. | Overhead reach. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core mobility. |
| `overhead-press-band` | Band Overhead Press | strength_power / shoulder-reach-press | v1_core / yes | training, extra session, Explore practice | legacy `ex-overhead`; V2.1 `ex-overhead-press-band-first-v21`, `ex-overhead-press-band-next-v21`, `target-overhead-press-band-v21` | Stand tall on a long band or hold it safely. Press both hands overhead, then return with control. | band setup and active cues plus tracking | good | partial | partial | Band overhead press. Stand tall with light band tension. Press overhead, then return slowly. | Band overhead press. | Replay first-use plus target and band safety if due. | Reuse catalogue text. | no / yes | P1 | Band setup makes help/replay important. |
| `hip-hinge-wall` | Wall-Tap Hinge | strength_power / hinge-glutes | v1_core / yes | training, extra session, Explore practice | legacy `ex-hip-hinge`; V2.1 `ex-hip-hinge-wall-first-v21`, `ex-hip-hinge-wall-next-v21`, `target-hip-hinge-wall-v21` | Stand a step in front of a wall, feet under your hips. Push your hips back to tap the wall, keeping your back long, then stand tall. | support/tracking setup; range/tracking active | good | partial | partial | Wall-tap hinge. Stand a step from the wall. Send hips back to tap the wall, then stand tall. | Wall-tap hinge. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core hinge. |
| `hip-hinge-free` | Hip Hinge | strength_power / hinge-glutes | v1_core / yes | training, extra session, Explore practice | legacy `ex-hip-hinge`; V2.1 `ex-hip-hinge-free-first-v21`, `ex-hip-hinge-free-next-v21`, `target-hip-hinge-free-v21` | Stand tall with feet under your hips. Push your hips back, then stand tall again with control. | tracking/range cues | good | partial | partial | Hip hinge. Feet under hips. Send hips back with a long spine, then stand tall. | Hip hinge. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core hinge. |
| `balance-feet-together-hold` | Feet-Together Hold | balance_stability / balance | v1_core / yes | training, extra session, Explore practice | legacy `ex-balance`; V2.1 `ex-balance-feet-together-hold-first-v21`, `ex-balance-feet-together-hold-next-v21`, `target-balance-feet-together-hold-v21` | Stand with your feet together, fingertips near a counter, and hold steady. | balance support/tracking setup; balance active | good | partial | partial | Feet-together hold. Stand with feet together, fingertips near support, eyes open. | Feet-together hold. | Replay first-use plus target and balance support reminder if due. | Reuse catalogue text. | no / yes | P1 | Balance clarity is beta-critical. |
| `balance-tandem-hold` | Tandem Hold | balance_stability / balance | v1_core / yes | training, extra session, Explore practice | legacy `ex-balance`; V2.1 `ex-balance-tandem-hold-first-v21`, `side-tandem-left-front-v21`, `side-tandem-right-front-v21`, `ex-balance-tandem-hold-next-v21`, `target-balance-tandem-hold-v21` | Place one foot directly in front of the other, heel to toe, fingertips near support, and hold steady. | balance support/tracking setup; balance active | good | partial | partial | Tandem hold. Keep support close. Place the cued foot in front, heel to toe. | Tandem hold. | Replay first-use plus side cue and target. | Reuse catalogue text. | no / yes | P1 | Side/foot-position cues must be replayable. |
| `balance-single-leg-hold` | Single-Leg Hold | balance_stability / balance | v1_core / yes | training, extra session, Explore practice | legacy `ex-balance`; V2.1 `ex-balance-single-leg-hold-first-v21`, `side-single-leg-left-v21`, `side-single-leg-right-v21`, `ex-balance-single-leg-hold-next-v21`, `target-balance-single-leg-hold-v21` | Stand on one leg, lifting the other foot just off the floor, fingertips near support. | balance support/tracking setup; balance active | good | partial | partial | Single-leg hold. Keep support close. Stand on the cued leg and lift the other foot slightly. | Single-leg hold. | Replay first-use plus side cue and target. | Reuse catalogue text. | no / yes | P1 | Beta-critical balance movement. |
| `seated-hamstring-reach` | Seated Hamstring Reach | mobility_flexibility / mobility-flexibility | v1_core / yes | training, extra session, Explore practice | legacy `ex-hamstring-reach`; V2.1 `ex-seated-hamstring-reach-first-v21`, `side-hamstring-left-extended-v21`, `side-hamstring-right-extended-v21`, `ex-seated-hamstring-reach-next-v21`, `target-seated-hamstring-reach-v21` | Sit tall on the edge of a chair, one leg straight out with heel on the floor. Reach gently toward your toes and hold. | chair/tracking setup; range/mobility active | good | partial | partial | Seated hamstring reach. Sit tall at the chair edge. Extend the cued leg, heel on the floor. | Seated hamstring reach. | Replay first-use plus side cue and target. | Reuse catalogue text. | no / yes | P1 | Side cue should be visible/replayable. |
| `neck-rotation` | Neck Rotations | mobility_flexibility / mobility-flexibility | v1_optional / hidden-deferred | extra/optional only when enabled | legacy `ex-neck-rotation`; V2.1 `ex-neck-rotation-first-v21`, `ex-neck-rotation-next-v21`, `target-neck-rotation-v21` | Sit or stand tall. Slowly turn your head to look over one shoulder, then the other. | setup `tracking_move_when_cued`; active `comfortable_range_only`, `mobility_no_forcing` | good | partial | partial | Neck rotations. Face the phone, sit or stand tall, and slowly look over one shoulder, then the other. | Neck rotations. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P3 | Hidden optional. |
| `loaded-march` | March in Place | balance_stability / lateral-stability | v1_core / yes | training, extra session, Explore practice | legacy `ex-march`; V2.1 `ex-loaded-march-first-v21`, `ex-loaded-march-next-v21`, `target-loaded-march-v21` | Stand tall with fingertips near support and march on the spot, lifting each knee with a steady rhythm. | balance support/tracking setup; balance active | good | partial | partial | March in place. Stand tall near support and march with a steady rhythm. | March in place. | Replay first-use plus target. | Reuse catalogue text. | no / yes | P1 | Core balance/dynamic item. |
| `seated-band-row` | Seated Band Row | strength_power / pull-upper-back | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-seated-band-row-first-v21`, `ex-seated-band-row-next-v21`, `target-seated-band-row-v21` | Sit tall on a chair. Loop a band around your feet or a secure low anchor. Pull your elbows back toward your ribs, pause briefly, then return with control. | chair/band/tracking setup; band active | good | partial | missing | Seated band row. Sit tall on a sturdy chair with the band anchored under both feet. Pull elbows back, then return slowly. | Seated band row. | Replay V2.1 first-use plus target and band safety if due. | Reuse catalogue text. | no / yes | P1 | No legacy instruction; repeat/help must use V2.1. |
| `standing-band-row` | Standing Band Row | strength_power / pull-upper-back | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-standing-band-row-first-v21`, `ex-standing-band-row-next-v21`, `target-standing-band-row-v21` | Stand tall with the band anchored in front of you. Pull your elbows back toward your ribs, pause briefly, then return with control. | long-band/door-anchor/tracking setup; band/door-anchor active | good | partial | missing | Standing band row. Face the secure door anchor in a stable stance. Pull elbows back, then return slowly. | Standing band row. | Replay V2.1 first-use plus target and door-anchor safety if due. | Reuse catalogue text. | no / yes | P1 | No legacy instruction; door-anchor setup raises priority. |
| `band-pull-apart` | Band Pull-Apart | strength_power / pull-upper-back | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-band-pull-apart-first-v21`, `ex-band-pull-apart-next-v21`, `target-band-pull-apart-v21` | Hold a light band at chest height with both hands. Pull the band apart until your hands move wide, then return slowly. | band/tracking setup; band/range active | good | partial | missing | Band pull-apart. Hold a light band at chest height. Pull your hands wide, then return slowly. | Band pull-apart. | Replay V2.1 first-use plus target and band safety if due. | Reuse catalogue text. | no / yes | P1 | No legacy instruction. |
| `supported-side-step` | Supported Side Step | balance_stability / lateral-stability | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-supported-side-step-first-v21`, `ex-supported-side-step-next-v21`, `target-supported-side-step-v21` | Stand tall near a counter. Step one foot out to the side, bring the other foot in, then repeat with control. | balance support/tracking setup; balance active | good | partial | missing | Supported side step. Stand near a counter. Step to the side, bring the other foot in, and continue with control. | Supported side step. | Replay V2.1 first-use plus target. | Reuse catalogue text. | no / yes | P1 | No legacy instruction; common balance item. |
| `mini-band-lateral-walk` | Mini-Band Lateral Walk | balance_stability / lateral-stability | v1_optional / hidden-deferred | extra/optional only when enabled | legacy none; V2.1 `ex-mini-band-lateral-walk-first-v21`, `ex-mini-band-lateral-walk-next-v21`, `target-mini-band-lateral-walk-v21` | Place a mini band above your knees or around your ankles. Take small controlled side steps, keeping gentle tension on the band. | band/balance/tracking setup and active cues | good | partial | missing | Mini-band lateral walk. Band above your knees. Take small controlled steps both directions. | Mini-band lateral walk. | Replay V2.1 first-use plus target. | Reuse catalogue text. | no / yes | P3 | Hidden optional; no legacy instruction. |
| `thoracic-rotation` | Thoracic Rotation | mobility_flexibility / mobility-flexibility | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-thoracic-rotation-first-v21`, `ex-thoracic-rotation-next-v21`, `target-thoracic-rotation-v21` | Sit or stand tall with your arms crossed over your chest. Slowly rotate your upper body to one side, return to centre, then rotate the other way. | tracking setup; range/mobility active | good | partial | missing | Thoracic rotation. Sit or stand tall with arms crossed. Rotate one way, return to center, then rotate the other way. | Thoracic rotation. | Replay V2.1 first-use plus target. | Reuse catalogue text. | no / yes | P1 | No legacy instruction. |
| `supported-hip-flexor-stretch` | Supported Hip Flexor Stretch | mobility_flexibility / mobility-flexibility | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-supported-hip-flexor-stretch-first-v21`, `side-hip-flexor-left-back-v21`, `side-hip-flexor-right-back-v21`, `ex-supported-hip-flexor-stretch-next-v21`, `target-supported-hip-flexor-stretch-v21` | Stand in a split stance with fingertips near support. Gently shift forward until you feel a stretch at the front of the back hip. Hold. | support/tracking setup; range/mobility/support active | good | partial | missing | Supported hip-flexor stretch. Keep fingertips near support. Step the cued foot forward so the other hip side stretches. | Supported hip-flexor stretch. | Replay V2.1 first-use plus side cue and target. | Reuse catalogue text. | no / yes | P1 | No legacy instruction; side cue needed. |
| `wall-calf-stretch` | Wall Calf Stretch | mobility_flexibility / mobility-flexibility | v1_core / yes | training, extra session, Explore practice | legacy none; V2.1 `ex-wall-calf-stretch-first-v21`, `side-calf-left-back-v21`, `side-calf-right-back-v21`, `ex-wall-calf-stretch-next-v21`, `target-wall-calf-stretch-v21` | Place your hands on a wall, step one foot back, keep the back heel down, and gently lean forward until you feel a calf stretch. Hold. | support/tracking setup; range/mobility/support active | good | partial | missing | Wall calf stretch. Hands on the wall. Step the cued leg back, heel down. | Wall calf stretch. | Replay V2.1 first-use plus side cue and target. | Reuse catalogue text. | no / yes | P1 | No legacy instruction; side cue needed. |

## 12. Check-Up / Micro-Check Instruction Matrix

| Protocol / check type | Flow | Current cue IDs | Current visible instruction | Missing instruction gap | Recommended full script | Recommended repeat/attempt script | Recommended recovery script | New audio? | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `chair-rise-30s-v2` | Public V2 baseline, retake, official retest, optional full extra Check-Up | `mpv2_checkup_intro`, `checkup-chair-stand-intro-v21`, `checkup-chair-stand-setup-v21`, `mpv2_chair_practice_start`, `mpv2_chair_official_ready`, countdown, `times-up-v21`, recovery shared cues | Compact shell notice from cue text; no full persistent instruction | Help/replay is generic setup help; visible text is compact | Chair stand. Sit in the middle of a sturdy chair, side-on to the phone. Cross your arms. When I say go, stand fully and sit with control until I say time. | Chair stand again. Cross your arms, stand fully, then sit with control until I say time. | Pause. Return to the setup position. We will restart when you are back in view. | no; reuse existing cues | P1 |
| `one-leg-balance-45s-v2` | Public V2 baseline, retake, official retest, optional full extra Check-Up | `checkup-balance-intro-v21`, `checkup-balance-single-leg-v21`, `mpv2_balance_attempt_start`, `mpv2_balance_attempt_saved`, `mpv2_balance_rest`, `mpv2_balance_ready_after_30`, `mpv2_balance_ready_after_60`, `mpv2_balance_tracking_retry` | Compact shell notice from cue text | Help/replay missing; next-attempt cue can be clearer for user-requested repeat | Balance check. Keep support within easy reach. Single-leg. Stand on your selected leg and lift the other foot slightly. | Single-leg balance again. Stand on your selected leg, lift the other foot slightly, and hold steady. | Tracking was interrupted, so this attempt will not count. Return to the setup position and we will try again. | no; reuse existing cues | P1 |
| `active-shoulder-reach-v2` | Public V2 baseline, retake, official retest, optional full extra Check-Up | `checkup-shoulder-turn-left-v21`, `checkup-shoulder-turn-right-v21`, `checkup-shoulder-raise-left-v21`, `checkup-shoulder-raise-right-v21`, `final-position-set-v21`, `mpv2_shoulder_tracking_retry` | Compact shell notice from cue text | Help/replay missing; visible side-specific instruction should remain available | Turn so your selected side is nearest the phone. Raise your selected arm as high as comfortable. Hold there until I say relax. | Shoulder reach again. Turn side-on, raise the selected arm as high as comfortable, and hold. | Tracking was interrupted. Lower your arm, return to the setup position, and we will try once more. | no; reuse existing side cues | P1 |
| `hinge-reach` supporting capture | Public V2 baseline, retake, official retest, optional full extra Check-Up | `checkup-hinge-setup-v21`, `final-position-set-v21`, `mpv2_hinge_complete`, `mpv2_hinge_no_measurement`, `checkup-complete-v21` | Compact shell notice from cue text | Help/replay missing; visible instruction is compact | Forward reach. Slowly fold from your hips and reach toward the floor. Hold there until I say stand tall. | Forward reach again. Fold from your hips and reach toward the floor until I say stand tall. | Pause. Return to standing in view and we will restart. | no; reuse existing cue | P1 |
| `chair-power` micro-check | Scheduled and optional micro-check | Legacy `microcheck-chair`; V2.1 `micro-chair-power-v21`, `final-position-set-v21`, countdown, `times-up-v21`, `microcheck-complete-v21` | Movement name and metrics; limited full instruction | V2.1 disabled globally; help/replay missing | Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable. | Chair power again. Arms crossed. Stand and sit five times as quickly as safely comfortable. | Pause. Return to the setup position. We will restart when you are back in view. | no; exact pair reusable | P1 |
| `single-leg-balance` micro-check | Scheduled and optional micro-check | Legacy `microcheck-balance`; V2.1 `micro-single-leg-left-v21`, `micro-single-leg-right-v21`, shared countdown/recovery/completion | Side setup copy and movement labels; limited full instruction | V2.1 disabled globally; help/replay missing | Quick balance check. Stand on your selected leg with support nearby. Hold as long as comfortable. | Quick balance check again. Stand on the same leg with support nearby and hold steady. | Pause. Return to the setup position. We will restart when you are back in view. | no; exact pair reusable | P1 |
| `mobility-reach` micro-check | Scheduled and optional micro-check | Legacy hinge cues; V2.1 `micro-mobility-left-v21`, `micro-mobility-right-v21`, shared countdown/recovery/completion | Active notice says reach toward the floor, then stand tall | V2.1 exact audio mismatch; help/replay missing; side copy/test baseline mismatch exists | Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall. | Quick mobility check again. Stand side-on, hinge forward, and reach until I say stand tall. | Pause. Return to standing in view. We will restart when you are ready. | yes: 2 cue IDs x 2 voices = 4 MP3s | P1 |

## 13. Current Audio Asset / Cue Inventory

Current required audio surface observed by verifier:

- Safety audio: 44 safety cues, 2 voices, 88 assets expected.
- Movement Profile V2 audio: 31 cue IDs, 2 voices, 62 assets expected.
- Training Voice V2.1 audio: 169 logical requirements, all 169 report exact existing Clara/Marcus physical pairs through `listTrainingVoiceAssetRequirementsV21`.
- Micro-check V2.1 audio: 19 logical requirements, 17 exact reusable pairs, 2 script mismatches requiring generation later.
- Overall verifier currently reports 502 stale-fingerprint issues because voice settings changed and assets/fingerprints have not been regenerated.

Micro-check asset gap:

| Cue ID | Text | Current candidate | Status | Required voices | Asset count |
| --- | --- | --- | --- | --- | --- |
| `micro-mobility-left-v21` | Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall. | `hinge-setup` | Existing pair script mismatch | Clara, Marcus | 2 |
| `micro-mobility-right-v21` | Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall. | `hinge-setup` | Existing pair script mismatch | Clara, Marcus | 2 |

Estimated new audio after script approval:

- Minimum before-beta instruction implementation: 2 new unique cue IDs already named, 4 MP3 assets for Clara/Marcus.
- If training and Check-Up help/replay reuse existing V2.1/MPV2 cue IDs, no additional cue IDs are required for those flows.
- Any decision to create separate dedicated help cue IDs would intentionally increase the required asset count and verifier surface.

## 14. Missing Instruction Gaps

P1 gaps found:

- Micro-check V2.1 is not selectable because the physical audio surface is not ready.
- `mobility-reach` micro-check needs exact `micro-mobility-left-v21` and `micro-mobility-right-v21` Clara/Marcus audio.
- Training pause/repeat uses legacy instruction arrays instead of V2.1 instruction metadata; 8 registered exercises have no legacy instruction cue.
- Movement Check-Up help opens generic setup help instead of replaying the current protocol instruction.
- Micro-check help opens generic setup help instead of replaying the current check instruction.
- Training active and paused views do not consistently show full current instruction text aligned to the spoken V2.1 cue.
- Repeated training sets have later-set cue definitions, but normal repeated-set sequencing does not consistently speak a short repeat instruction before countdown.

P2 gaps found:

- Explore has good visible guidance but no direct audio/replay outside the launched practice runtime.
- Active Check-Up and micro-check visible notices are compact rather than full instruction text.
- Audio-off fallback should guarantee visible text is complete enough to perform the movement.

P3 gaps found:

- Hidden optional exercise levels have V2.1 contracts but should remain deferred unless made reachable.
- Dedicated help-cue audio can remain deferred if help reuses first-use cue sequences.

No P0 gap was found in the current spoken core Check-Up/training paths, because core movement and exercise scripts exist. The beta readiness issue is consistency, replayability, and micro-check V2.1 audio completion.

## 15. Recommended Scripts

Script rules:

- First-time instructions should be roughly 8-18 seconds.
- Repeat instructions should be roughly 3-8 seconds.
- Say the movement/exercise name first.
- Use simple verbs: sit, stand, hold, reach, step, press, pull, breathe, pause.
- Avoid medical, diagnostic, fear-based, and internal system language.
- Keep safety reminders separate from exercise execution instructions.
- Do not repeat long setup every set.
- For hands-free camera-readiness flows, use language like "I will start when you are ready."
- Visible text should support or mirror the spoken instruction.
- Help/repeat should replay the latest relevant full instruction, not just safety setup help.

Highest priority script pack for approval:

1. Micro-check mobility exact cue text: `micro-mobility-left-v21` and `micro-mobility-right-v21`.
2. Check-Up help/replay scripts for chair stand, single-leg balance, shoulder reach, and hinge reach.
3. Training help/replay scripts for the 8 exercises with no legacy voice instruction: seated band row, standing band row, band pull-apart, supported side step, mini-band lateral walk, thoracic rotation, supported hip-flexor stretch, wall calf stretch.
4. Training later-set short repeats for common first-plan exercises: sit-to-stand, squat, step-up, balance holds, glute bridge, band row, supported side step, overhead reach, hinge, and mobility stretches.

Use the V2.1 first-use and later-set script text in Section 11 as the recommended default script source. Dedicated help scripts can usually be generated by replaying first-use cue plus side cue plus target cue, rather than writing separate new audio.

## 16. Recommended Metadata Architecture

Recommended repository-consistent model:

```ts
type InstructionCueRef = {
  cueId: VoiceCueKey;
  text: string;
  assetGroup: 'movementProfileV2' | 'voiceV21' | 'safety' | 'legacy';
  required: boolean;
};

type ExerciseInstructionProfile = {
  exerciseId: string;
  instructionSchemaVersion: number;
  displayName: string;
  releaseStatus: ReleaseStatus;
  flows: readonly string[];
  firstTimeCueIds: readonly VoiceCueKey[];
  repeatCueIds: readonly VoiceCueKey[];
  helpCueIds: readonly VoiceCueKey[];
  visibleSetupText: string;
  visibleExecutionText: string;
  safetyCueIds: readonly SafetyCueId[];
  recoveryCueIds?: readonly VoiceCueKey[];
  estimatedSpokenSeconds?: number;
};

type CheckUpInstructionProfile = {
  protocolId: string;
  instructionSchemaVersion: number;
  displayName: string;
  firstTimeCueIds: readonly VoiceCueKey[];
  attemptCueIds: readonly VoiceCueKey[];
  helpCueIds: readonly VoiceCueKey[];
  visibleInstructionText: string;
  recoveryCueIds: readonly VoiceCueKey[];
};
```

Architecture principles:

- Keep safety cue definitions separate from execution instructions.
- Put exercise instruction profiles near exercise definitions or derive them from `src/training/voiceV21/contracts.ts`.
- Put Movement Check-Up protocol profiles near `src/movementProfileV2/voiceCues.ts` and voice runtime metadata.
- Put micro-check profiles near `src/training/microCheckVoiceV21/contracts.ts`.
- Make TrainingSessionPlayer, MicroCheckRunner/Screen, MovementProfileV2 shell, Explore/manual practice, and help/replay consume the same profile source.
- Make generator/verifier know which cue IDs are required.
- Do not add runtime TTS.

## 17. Audio Asset Plan

Do not generate audio until scripts are approved.

| Group | Existing reusable cues | New cue IDs needed | Required in beta? | Voices | Estimated new assets | Generator/verifier/manifest impact |
| --- | --- | --- | --- | --- | --- | --- |
| Movement Profile V2 | Existing Check-Up cues for chair, balance, shoulder, hinge, recovery, completion | None if help reuses existing cue sequences | Yes, wiring only | Clara, Marcus | 0 | Add instruction metadata/tests only; no asset change if reused |
| Training instruction | 169 exact Training Voice V2.1 pairs | None if help/repeat reuses first/later/target/side cues | Yes, wiring only | Clara, Marcus | 0 | Add metadata consumers/tests only; no asset change if reused |
| Micro-check instruction | 17 exact reusable pairs | `micro-mobility-left-v21`, `micro-mobility-right-v21` | Yes | Clara, Marcus | 4 | After approval: generator inputs, MP3s, metadata, manifest, fingerprints, verifier |
| Safety | 88 existing safety assets expected | None | Yes | Clara, Marcus | 0 | Regenerate only as part of known stale-fingerprint audio refresh |
| Dedicated help cues | Existing first-use/side/target sequences can be replayed | None recommended initially | No | Clara, Marcus | 0 | Avoid new assets unless user testing shows replayed sequences are too long |

Audio verification currently expects 502 required assets. New instruction cues would increase this only if separate new cue IDs are introduced beyond the two micro mobility IDs.

## 18. Runtime Sequencing Plan

Movement Check-Up:

```text
movement transition
-> movement name plus concise full instruction
-> setup/camera-readiness text
-> readiness detected
-> countdown
-> active movement
-> completion/rest/retry
```

Balance attempts:

```text
balance instruction once
-> attempt instruction
-> readiness detected
-> countdown
-> trial
-> attempt saved/rest
-> short repeat cue for next attempt
```

Micro-check:

```text
check name plus instruction
-> side/setup/readiness if required
-> countdown
-> active capture
-> result
```

Training first set:

```text
exercise transition
-> exercise name plus first-time instruction
-> relevant safety reminder if due
-> setup/readiness
-> countdown
-> set
```

Training repeated set:

```text
rest
-> short repeat instruction
-> countdown
-> set
```

Explore/manual practice:

```text
visible instructions in Explore
-> practice launch
-> same training/check-up instruction profile
-> help/repeat replays same profile
```

## 19. Repetition / Annoyance-Control Policy

Recommended policy:

- First time in a session: full instruction.
- Later sets in the same exercise: short repeat instruction.
- Same exercise in a later session: concise instruction by default; do not store a persistent "user already knows this" flag yet.
- Tracking/setup trouble: recovery instruction, then repeat relevant setup instruction.
- User presses Help/Repeat: replay the full current instruction sequence, including side/target cue if relevant.
- Store only session-local instruction memory initially.
- Drop stale low-priority voice lines if the voice channel is busy; required setup/countdown boundaries should remain tracked.

## 20. Accessibility / UI Implications

Recommendations:

- Active screens should display enough current instruction text to complete the movement if audio fails.
- Visible text should support the spoken script and should not contradict it.
- Help/repeat controls should be available in Check-Up, micro-check, and training active/paused surfaces without disrupting safety exits.
- Instructions should not overlap countdown, active start, or rest timers.
- Screen reader labels should be concise and action-specific, such as "Repeat exercise instructions."
- Large text layouts should not overflow; long instruction text should wrap in a stable panel.
- If audio is unavailable, the visible instruction and setup help must be sufficient.
- Audio failure retry should stay separate from instruction replay, so users are not trapped by missing audio.

## 21. Copy Guardrails

Do not use these public instruction terms:

```text
Movement Age
body age
strength age
weakest
diagnosis
fall risk
sarcopenia
pass/fail
improved
declined
better
worse
younger
older
Warden
LMS
centile
schema
fingerprint
V1
V2
internal
medical advice
guarantee
```

Allowed safety language:

```text
Stop if you feel sharp pain, dizziness, or unwell.
Use support if needed.
Move at a comfortable pace.
Keep sturdy support within easy reach.
```

Avoid form-judge language. Pearl can say what to do and when to pause; it should not critique technique.

## 22. Risk And Priority Classification

P0:

- None found in current core spoken Check-Up/training instruction availability.

P1:

- Micro-check V2.1 not selectable because physical audio surface is incomplete.
- `micro-mobility-left-v21` and `micro-mobility-right-v21` need exact Clara/Marcus assets.
- Training help/replay path uses legacy instruction arrays and can be empty for 8 registered exercises.
- Check-Up and micro-check help/replay do not replay the current movement/check instruction.
- Active instruction visible text is not consistently full/aligned across Check-Up, micro-check, and training.
- Later-set repeat sequencing should consistently speak the short repeat cue before countdown.

P2:

- Explore direct audio/replay absent outside launched practice.
- Dedicated help cue IDs may be useful after usability testing, but can be deferred if sequence replay works.

P3:

- Hidden optional levels and post-beta refinements.

## 23. Implementation Plan VI1-VI5

VI1 - Script approval pack:

- Approve the Section 11/12 script matrix.
- Approve the two micro mobility exact cue texts.
- Decide whether help uses replayed first-use sequences or dedicated help cue IDs.
- Produce final asset list before generation.

VI2 - Instruction metadata registry:

- Add canonical instruction profiles for Movement Check-Up protocols, micro-check types, and training exercises.
- Derive training profiles from existing V2.1 contracts where possible.
- Keep safety cue IDs separate but referenced.
- Include release/reachability flags so hidden optional levels stay hidden.

VI3 - Runtime wiring:

- Wire Movement Profile V2 shell help/replay and visible instruction text to Check-Up profiles.
- Wire MicroCheckRunner/Screen help/replay and visible instruction text to micro-check profiles.
- Wire TrainingSessionPlayer repeated-set sequencing and `TrainingSessionScreen` Repeat to V2.1 profiles.
- Wire Explore/manual practice to the same visible instruction source.

VI4 - Audio generation:

- Generate only approved new Clara/Marcus assets.
- Update generator input, static Metro map, manifests, fingerprints, and verifier.
- Regenerate stale existing audio only as part of the separate product-owner-approved audio refresh.

VI5 - Device QA:

- Verify clarity, timing, no countdown overlap, help/replay behavior, hands-free readiness timing, audio failure fallback, and no physical-device regressions.
- Record physical-device validation separately; this audit does not claim it.

## 24. Required Future Tests

Add or update tests for:

- Every controlled-beta exercise has an instruction profile.
- Every controlled-beta exercise has a repeat profile or explicit reuse decision.
- Every Movement Check-Up protocol has an instruction profile.
- Every micro-check type has an instruction profile.
- Training player speaks first-use instruction before countdown.
- Training repeated sets speak short repeat instruction before countdown.
- Training Repeat replays current V2.1 exercise instruction, not legacy-only cues.
- Check-Up Help/Repeat replays the current movement instruction.
- Micro-check Help/Repeat replays the current check instruction.
- Safety cues still play separately from execution instructions.
- No instruction overlaps countdown or active start.
- Audio verifier requires approved new instruction assets.
- Static manifest maps all new assets.
- Copy guardrails block forbidden claims.
- No runtime TTS or provider call exists in the app path.
- Audio-off/unavailable visible fallback remains sufficient.
- Hidden optional exercise levels remain hidden/deferred.

## 25. Files Changed

This audit created exactly one new file:

```text
docs/audits/PEARL_VOICE_INSTRUCTION_LAYER_AUDIT.md
```

No other file was intentionally edited for this task.

## 26. Validation Results

Summary:

- `npm run typecheck`: pass.
- `npm run verify:safe-beta-flags`: pass with known Sentry config warning during Expo config output.
- `npm run verify:audio`: fail only with known stale fingerprint issues; no audio files, manifests, or fingerprints were changed by this audit.
- Focused Jest: 24 suites passed, 1 suite failed on pre-existing micro-check side setup copy assertion.
- Full Jest: 169 suites passed, 2 suites failed on pre-existing micro-check side setup copy assertion and current micro-check V2.1 activation expectations.
- Website typecheck: pass.
- Website tests: pass.
- Expo public config: pass with same Sentry warning.
- `git diff --check`: pass.

The audit is not blocked by the known stale audio fingerprint failure, because this task did not change audio and the failure matches the product-owner note. Public release remains blocked until the stale audio surface and physical-device validation are resolved.

## 27. Final Git Status

`git status --short --untracked-files=all` after writing this report:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/audio/safetyAudio.ts
 M src/audio/voiceV21Audio.ts
 M src/checkup/__tests__/measurementProtocolRegistry.test.ts
 M src/checkup/measurementProtocolRegistry.ts
 M src/pearlFlow/index.ts
 M src/history/trends.ts
 M src/movementProfileV2/__tests__/liveCoordinator.test.ts
 M src/movementProfileV2/liveCoordinator.ts
 M src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
 M src/render/ArtDirectedHumanRenderer.tsx
 M src/render/__tests__/artDirectedHumanGeometry.test.ts
 M src/render/artDirectedHumanGeometry.ts
 M src/render/poseAvatarTypes.ts
 M src/results/CheckUpResultsShell.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/__tests__/CheckUpRecordingShell.test.ts
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/training/__tests__/microCheck.test.ts
 M src/training/__tests__/microCheckSideSetup.test.ts
 M src/training/__tests__/voiceExperienceRuntimeSelection.test.ts
 M src/training/microCheck.ts
 M src/training/microCheckVoiceV21/__tests__/microCheckVoiceV21.test.ts
 M src/training/microCheckVoiceV21/assets.ts
 M src/training/microCheckVoiceV21/contracts.ts
 M src/training/microCheckVoiceV21/protocolCompatibility.ts
?? docs/audits/PEARL_MOVEMENT_CHECKUP_BALANCE_DEVICE_FIX_IMPLEMENTATION.md
?? docs/audits/PEARL_MOVEMENT_CHECKUP_PHYSICAL_DEVICE_BUG_AUDIT.md
?? docs/audits/PEARL_VOICE_INSTRUCTION_LAYER_AUDIT.md
?? src/pearlFlow/__tests__/microCheckSummary.test.ts
?? src/pearlFlow/microCheckSummary.ts
?? src/screens/MicroCheckSummaryScreen.tsx
```

`git diff --name-only` still lists only the pre-existing tracked dirty files, because this new report is untracked:

```text
App.tsx
docs/decisions.md
src/adherence/screens/BlockIntroScreen.tsx
src/audio/safetyAudio.ts
src/audio/voiceV21Audio.ts
src/checkup/__tests__/measurementProtocolRegistry.test.ts
src/checkup/measurementProtocolRegistry.ts
src/pearlFlow/index.ts
src/history/trends.ts
src/movementProfileV2/__tests__/liveCoordinator.test.ts
src/movementProfileV2/liveCoordinator.ts
src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
src/render/ArtDirectedHumanRenderer.tsx
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
src/render/poseAvatarTypes.ts
src/results/CheckUpResultsShell.tsx
src/screens/MicroCheckScreen.tsx
src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/__tests__/CheckUpRecordingShell.test.ts
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
src/training/__tests__/microCheck.test.ts
src/training/__tests__/microCheckSideSetup.test.ts
src/training/__tests__/voiceExperienceRuntimeSelection.test.ts
src/training/microCheck.ts
src/training/microCheckVoiceV21/__tests__/microCheckVoiceV21.test.ts
src/training/microCheckVoiceV21/assets.ts
src/training/microCheckVoiceV21/contracts.ts
src/training/microCheckVoiceV21/protocolCompatibility.ts
```

`git diff --stat` remained unchanged from the initial tracked dirty inventory:

```text
 App.tsx                                            | 176 +++++++++++-
 docs/decisions.md                                  |   8 +
 src/adherence/screens/BlockIntroScreen.tsx         | 113 +++++---
 src/audio/safetyAudio.ts                           |  13 +-
 src/audio/voiceV21Audio.ts                         |   3 +-
 .../__tests__/measurementProtocolRegistry.test.ts  |  17 +-
 src/checkup/measurementProtocolRegistry.ts         |  16 +-
 src/pearlFlow/index.ts                              |   1 +
 src/history/trends.ts                              |  12 +-
 .../__tests__/liveCoordinator.test.ts              | 296 +++++++++++++++++++--
 src/movementProfileV2/liveCoordinator.ts           | 129 +++++++--
 .../__tests__/referenceEngine.test.ts              |   9 +
 src/render/ArtDirectedHumanRenderer.tsx            |   8 +-
 .../__tests__/artDirectedHumanGeometry.test.ts     |  13 +
 src/render/artDirectedHumanGeometry.ts             | 226 ++++++++++------
 src/render/poseAvatarTypes.ts                      |   2 +
 src/results/CheckUpResultsShell.tsx                | 204 +++++++++-----
 src/screens/MicroCheckScreen.tsx                   |   6 +-
 .../MovementProfileV2UnifiedCheckUpScreen.tsx      |   2 +-
 src/screens/PoseOverlayBenchmarkScreen.tsx         |  30 ++-
 .../__tests__/CheckUpRecordingShell.test.ts        |   3 +
 ...eOverlayBenchmarkScreen.constellationV2.test.ts |  16 ++
 src/training/__tests__/microCheck.test.ts          |  26 +-
 src/training/__tests__/microCheckSideSetup.test.ts |  40 ++-
 .../voiceExperienceRuntimeSelection.test.ts        |   4 +-
 src/training/microCheck.ts                         | 113 ++++++--
 .../__tests__/microCheckVoiceV21.test.ts           |  21 +-
 src/training/microCheckVoiceV21/assets.ts          |   8 +-
 src/training/microCheckVoiceV21/contracts.ts       |  28 +-
 .../microCheckVoiceV21/protocolCompatibility.ts    |   2 +-
 30 files changed, 1214 insertions(+), 331 deletions(-)
```

`git diff --check`: pass.

## 28. Confirmation

- No production runtime code was changed.
- No audio generation occurred.
- No audio assets were added or edited.
- No audio manifest or fingerprint files were edited.
- No runtime TTS was added.
- No Warden formula, data, or fingerprints were changed.
- No H5/HF/training policy, release flag, safety/capability gate, schedule credit, training credit, progression, or optional-level policy was changed.
- No package or lockfile was changed.
- No staging, commit, branch, push, or PR action occurred.
- No physical-device validation is claimed.

VOICE INSTRUCTION LAYER AUDIT COMPLETE
VOICE INSTRUCTION COVERAGE GAPS FOUND
VOICE INSTRUCTION IMPLEMENTATION RECOMMENDED BEFORE BETA
NO PRODUCTION RUNTIME CHANGES
NO AUDIO GENERATION
NO AUDIO MANIFEST / FINGERPRINT CHANGE
NO RUNTIME TTS
NO WARDEN CHANGE
NO H5/HF/TRAINING POLICY CHANGE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
