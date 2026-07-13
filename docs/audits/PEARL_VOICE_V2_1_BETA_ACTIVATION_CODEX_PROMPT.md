# Codex Prompt: Pearl Voice V2.1 Full Beta Activation With Fast Legacy Rollback

Read this entire prompt before changing anything.

The founder wants to enable the new Voice V2.1 system throughout Pearl for real-device and beta-tester feedback.

The app has not yet been distributed to external users. The goal is therefore to make the new system the default in the app builds we now hand to testers, while preserving a fast, reliable way to switch back to the old/legacy voice system if issues appear.

This is not a production-approval task. It is a **beta activation** task.

---

# 1. Current project state

The post-generation whole-project audit reports:

```text
Verdict:
VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT_COMPLETE_LISTENING_PENDING

Physical audio:
ready

Training Voice V2.1 behavior:
ready

Micro-Check Voice V2.1 behavior:
ready

MPV2 / Movement Check-Up physical audio surface:
ready

Balance V2 physical audio surface:
ready

P0 / P1 / P2:
0 / 0 / 0

Human listening:
not completed

Audio approval:
not granted

Physical-device QA:
deferred

Speaker onset:
not measured

Feature gates:
currently closed
```

This task intentionally changes the beta/default runtime selection so the V2.1 voice system is used throughout the app, while leaving the review/approval truth intact.

Do **not** set:

```text
humanListeningCompleted = true
audioApprovalReady = true
physicalDeviceQaCompleted = true
speakerOnsetMeasured = true
```

Those remain false.

Do add a clear beta/QA activation distinction, such as:

```text
physicalAudioSurfaceReady = true
audioApprovalReady = false
voiceV21BetaDefaultEnabled = true
featureSelectableForBeta = true
```

Equivalent repository-consistent naming is acceptable.

---

# 2. Objective

Enable the new Voice V2.1 system throughout the app by default for beta/testing builds, while adding a fast rollback path to the legacy voice system.

After this task, a normal user receiving the app should experience Voice V2.1 by default across:

1. Movement Check-Up / MPV2
2. Eyes-Open Balance V2 inside the Movement Check-Up
3. Training sessions
4. Micro-Checks
5. Shared countdown/go/control/recovery voice behavior
6. Clara/Marcus voice selection and mounted voice switching

But the user or founder should be able to quickly switch back to the old system.

---

# 3. Activation policy

Implement an explicit activation policy with at least these modes:

```ts
type VoiceExperienceMode =
  | 'v21_beta'
  | 'legacy';
```

If the current architecture already has a feature-mode enum, use it.

## Required default

Default for new installs / fresh local state:

```text
v21_beta
```

## Required fallback

Expose a fast in-app setting:

```text
Settings → Voice guidance → Use new voice system
```

or equivalent.

Suggested UI:

```text
Voice guidance

New voice system
More specific exercise instructions, clearer countdowns, and improved recovery guidance.

[On / Off]
```

Mapping:

```text
On  -> v21_beta
Off -> legacy
```

The label can be refined to fit Pearl’s UI style.

## Active-session behavior

Do not hot-swap voice systems in the middle of a measured or active flow.

If the user changes the setting during an active check-up/training/micro-check session:

- preserve the current session’s pinned runtime mode;
- apply the new mode to the next launched flow;
- show concise copy if needed:
  - `This will apply from your next session.`
- never mix legacy and V2.1 voice inside the same flow.

## Emergency rollback

Also provide a developer/beta emergency override, using one or more of:

```text
EXPO_PUBLIC_FORCE_LEGACY_VOICE=1
EXPO_PUBLIC_VOICE_EXPERIENCE_MODE=legacy
AsyncStorage/local setting
```

The exact implementation should follow existing project conventions.

Priority order should be deterministic, for example:

```text
force legacy env override
→ persisted user setting
→ app default v21_beta
```

Document the priority order.

---

# 4. Surfaces that must switch to V2.1 by default

## 4.1 Movement Check-Up / MPV2

Enable the completed MPV2 V2.1 voice runtime by default under `v21_beta`.

Requirements:

- use tracked required speech;
- use audible countdown/go;
- active starts from `go` playback-start;
- tracking loss/retry/recovery voice paths enabled;
- Clara/Marcus switching remains safe;
- stale stage callbacks ignored;
- no default eyes-closed balance cues in the V2 path.

## 4.2 Eyes-Open Balance V2

Enable the approved eyes-open Balance V2 protocol by default under `v21_beta`.

Requirements:

- default unsupervised home balance uses eyes-open stages only;
- stage sequence:
  1. feet together, eyes open
  2. semi-tandem, eyes open
  3. tandem, eyes open
  4. single-leg, eyes open
- old MPV2 balance protocol remains readable and preserved;
- no cross-protocol trend/delta claim;
- old eyes-closed cues remain conditional legacy only;
- the legacy mode can still use the old balance behavior if that is the current fallback architecture.

## 4.3 Training Voice V2.1

Enable the Training Voice V2.1 path by default under `v21_beta`.

Requirements:

- exact 37 exercise contracts are selectable;
- both-sides round state active where implemented;
- step-up alternation active where implemented;
- floor-transfer/final-position system active where implemented;
- safety-family integration active;
- controls/progress/recovery active;
- countdown/go active-start boundary active;
- pause/resume/retry/skip/cancel semantics preserved;
- progress cues and SFX authority preserved;
- tracking recovery requires fresh setup/countdown;
- legacy training voice remains available under `legacy`.

## 4.4 Micro-Check Voice V2.1

Enable Micro-Check Voice V2.1 by default under `v21_beta`.

Requirements:

- `chair-power`
- `single-leg-balance`
- `mobility-reach`

all use their V2.1 contracts.

Side policy remains:

- chair power side-independent;
- balance uses pinned standing leg;
- mobility uses pinned extended leg;
- no side-dependent runner starts before side is pinned;
- no false same-side/cross-protocol comparisons;
- invalid/discarded attempts do not create series/trends.

## 4.5 Shared voice runtime

Use the V2.1 physical assets and runtime semantics for:

- `countdown-three`
- `countdown-two`
- `countdown-one`
- `go`
- `final-position-set-v21`
- `times-up-v21`
- `paused-v21`
- `resuming-v21`
- `retry-v21`
- `tracking-loss-v21`
- `tracking-recovered-v21`
- `session-complete-v21`
- all generated V2.1 exercise/safety/control cues.

---

# 5. Feature/default gates to update

The existing code likely has multiple independent gates, such as:

```text
EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1
EXPO_PUBLIC_ENABLE_MICRO_CHECK_VOICE_V2_1
EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2
EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION
EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1
audioReady
behaviorReady
selectable counts
```

Do not simply scatter ad-hoc `true` constants.

Create one central activation resolver, for example:

```ts
resolveVoiceV21Activation(input): {
  mode: 'v21_beta' | 'legacy';
  source: 'force_legacy_env' | 'persisted_setting' | 'default';
  trainingVoiceV21Enabled: boolean;
  microCheckVoiceV21Enabled: boolean;
  movementCheckUpV21Enabled: boolean;
  eyesOpenBalanceV2Enabled: boolean;
  stepUpAlternationEnabled: boolean;
  floorV21Enabled: boolean;
  reasonCodes: readonly string[];
}
```

Equivalent naming is acceptable.

## Beta activation requirements

Under `v21_beta`, these should become true where current behavior/audio surfaces are complete:

```text
Training Voice V2.1 enabled
Micro-Check Voice V2.1 enabled
MPV2 / Movement Check-Up V2.1 voice enabled
Eyes-Open Balance V2 enabled
Step-up alternation enabled for the internal V2.1 training path
Floor V2.1 enabled for the internal V2.1 training path
```

But these must remain false:

```text
humanListeningCompleted
audioApprovalReady
physicalDeviceQaCompleted
speakerOnsetMeasured
```

## Readiness terminology

If existing `audioReady` currently means “approved for user activation,” do not set it true.

If existing `audioReady` means “physical files exist and are verified,” it may now be true.

If the meaning is ambiguous, split it:

```text
physicalAudioSurfaceReady = true
audioApprovalReady = false
```

and use the correct one for beta activation.

## Selectable counts

For beta mode, the system should no longer report user-selectable V2.1 counts as zero.

Expected after activation:

```text
Training V2.1 selectable exercises:
37, unless current registry count differs

Micro-Check V2.1 selectable types:
3

Balance V2:
default open under v21_beta

MPV2 V2.1 voice:
enabled under v21_beta
```

Legacy mode should report V2.1 selectable counts as zero or legacy-equivalent, depending on current architecture.

---

# 6. Rollback and diagnostics

Add clear diagnostics for:

- voice activation mode resolved;
- activation source;
- persisted setting read/write;
- fallback override active;
- each flow selected V2.1 vs legacy;
- reason if V2.1 unavailable;
- audio binding missing;
- runtime selection fallback;
- legacy fallback used;
- feature mode changed;
- active-session mode pinned.

Do not log:

- raw video,
- landmarks,
- health result values,
- account ids,
- names,
- medical/free-text notes.

Add a visible or debug-accessible way to confirm the current mode, for example:

```text
Settings → Voice guidance → Current system: New / Legacy
```

---

# 7. User-facing copy

Keep copy calm and beta-appropriate.

Suggested Settings copy:

```text
Voice guidance

New voice system
Use Pearl’s latest voice guidance with clearer setup, countdowns, and recovery prompts.

Switch back if anything sounds wrong during testing.
```

Toggle labels:

```text
New voice system
Legacy voice system
```

Do not write:

- “approved”
- “clinically validated”
- “production ready”
- “AI voice beta”
- “experimental unsafe”
- “old broken system”

Optional small note:

```text
You can switch back at any time. The change applies from your next session or check-up.
```

---

# 8. Strict scope

## In scope

- Central Voice V2.1 activation resolver.
- Persisted user setting for `v21_beta` vs `legacy`.
- Settings UI toggle.
- Environment/emergency override.
- Wiring V2.1 defaults through:
  - Movement Check-Up / MPV2
  - Eyes-Open Balance V2
  - Training
  - Micro-Check
  - shared audio runtime
- Runtime mode pinning per active flow.
- Legacy fallback path.
- Diagnostics.
- Activation audit.
- Tests.
- Handoff for beta testing.

## Out of scope

Do not:

- generate audio;
- call ElevenLabs or any external audio/speech API;
- modify audio files;
- delete or rename audio;
- change scripts/copy;
- perform listening review;
- mark audio approved;
- mark physical-device QA complete;
- change scoring/protocol logic except selecting the already-implemented V2 protocol under beta mode;
- rewrite training programming;
- remove legacy voice code;
- remove legacy audio assets;
- perform broad UI redesign;
- install packages;
- change lockfiles;
- commit, push, reset, stash, clean, checkout, rebase, or discard work.

---

# 9. Worktree safety

The repository is heavily dirty.

Before editing, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
npm run verify:audio
npx tsc --noEmit --pretty false
```

Create task-start audio snapshots:

```bash
find assets/audio -type f | sort > /tmp/pearl_voice_v21_beta_activation_entry.files
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_voice_v21_beta_activation_entry.sha256
```

At task end:

```bash
find assets/audio -type f | sort > /tmp/pearl_voice_v21_beta_activation_exit.files
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_voice_v21_beta_activation_exit.sha256
diff -u /tmp/pearl_voice_v21_beta_activation_entry.files /tmp/pearl_voice_v21_beta_activation_exit.files
diff -u /tmp/pearl_voice_v21_beta_activation_entry.sha256 /tmp/pearl_voice_v21_beta_activation_exit.sha256
```

Success requires:

```text
audio files added by this task: 0
audio files modified by this task: 0
audio files deleted by this task: 0
```

The generated audio may be dirty relative to Git HEAD; that is not a failure.

---

# 10. Source to inspect

Inspect current source and follow actual imports.

At minimum:

## Activation/config

- existing feature flag/config files
- `App.tsx`
- app bootstrap
- Settings/Profile screens
- voice preference storage
- `src/profile/voices.ts`
- any beta/internal config modules

## Audio

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/voiceV21Audio.ts`
- `src/audio/voiceV21AudioManifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/audio/voicePlayer.ts`

## Training

- `src/training/voiceV21/`
- `src/training/sessionPlayer.ts`
- `src/training/setRuntime.ts`
- `src/screens/TrainingSessionScreen.tsx`
- `src/training/workoutGeneration.ts`
- both-sides, step-up, floor modules
- training serialize/backend state

## Micro-Check

- `src/training/microCheckVoiceV21/`
- `src/training/microCheck.ts`
- `src/screens/MicroCheckScreen.tsx`
- micro-check side setup
- micro-check sync/restore

## Movement Check-Up / MPV2 / Balance

- `src/movementProfileV2/`
- `src/movements/balanceEyesOpenV2.ts`
- `src/config/eyesOpenBalanceProtocolV2.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- measurement protocol registry/context/metadata

Search for:

```text
audioReady
behaviorReady
physicalAudioSurfaceReady
audioApprovalReady
selectable
featureDefault
EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1
EXPO_PUBLIC_ENABLE_MICRO_CHECK_VOICE_V2_1
EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2
EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION
EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1
Voice V2.1
voiceV21
legacy
selectTrainingVoiceRuntimeModeV21
resolveTrainingVoiceRuntimeReadinessV21
resolveMicroCheckVoiceV21Readiness
MovementProfileV2
BalanceV2
SettingsScreen
SafetyProfileScreen
```

---

# 11. Required implementation behavior

## 11.1 New installs

Fresh install / no persisted setting:

```text
VoiceExperienceMode = v21_beta
```

## 11.2 Existing installs

For local existing installs:

- If no explicit user setting exists, migrate to `v21_beta`.
- If an explicit legacy override exists, preserve it.
- If an old development flag forced legacy, respect the force override.

## 11.3 Settings toggle

Toggling off:

```text
mode = legacy
```

Toggling on:

```text
mode = v21_beta
```

The toggle should be reachable without developer tools.

## 11.4 Active-flow pinning

At flow launch, persist/pin:

```text
voiceExperienceModeAtLaunch
```

for:

- Movement Check-Up
- Training session
- Micro-Check
- Balance V2 stage flow if separate
- optional/manual training flows
- Explore training flows

Changing the setting mid-flow does not change the active flow.

## 11.5 Legacy mode

In legacy mode:

- old/default training voice path used;
- old/default micro-check voice path used;
- old/default check-up voice path used, unless current architecture has only the new MPV2 path;
- Eyes-Open Balance V2 disabled or not default;
- step-up alternation default off;
- floor V2.1 default off;
- no V2.1-only cue requested by normal user flow.

## 11.6 V2.1 beta mode

In `v21_beta`:

- Training Voice V2.1 selected for all supported training exercises.
- Micro-Check Voice V2.1 selected for all three current micro-check types.
- MPV2 V2.1 voice runtime selected for Movement Check-Up.
- Eyes-Open Balance V2 selected as the default unsupervised home balance protocol.
- Step-up alternation enabled in training V2.1 path.
- Floor V2.1 setup/final-position enabled in training V2.1 path.
- If a V2.1 runtime unexpectedly fails readiness at launch, show visible fallback and allow legacy mode switch; do not silently mix systems.

---

# 12. Beta activation audit expectations

After implementation, create a new audit showing:

```text
Training Voice V2.1:
behavior ready true
physical audio surface ready true
beta default enabled true
audio approval false
selectable exercise count 37 or live registry count

Micro-Check Voice V2.1:
behavior ready true
physical audio surface ready true
beta default enabled true
audio approval false
selectable type count 3

Movement Check-Up / MPV2:
V2.1 voice runtime default in beta mode
physical audio surface ready true

Balance V2:
default protocol under v21_beta
physical audio surface ready true
audio approval false
default closed only under legacy/production approval gates if applicable

Legacy mode:
available
all V2.1 selectable counts zero or unavailable under legacy
```

The audit should be honest about:

```text
human listening not completed
audio approval not granted
physical-device QA deferred
speaker onset not measured
```

These should be P3/beta-risk findings, not blockers to beta activation.

---

# 13. Required tests

Do not weaken existing tests.

Add/update tests for:

## Activation resolver

1. Fresh install resolves to `v21_beta`.
2. Persisted legacy resolves to `legacy`.
3. Persisted V2.1 resolves to `v21_beta`.
4. Force-legacy env override wins.
5. Invalid persisted value falls back safely.
6. Reason codes are deterministic.
7. No audio approval flag is mutated by beta mode.
8. Physical audio readiness and approval readiness are separate.

## Settings UI

1. Voice guidance setting is visible.
2. Toggle on writes `v21_beta`.
3. Toggle off writes `legacy`.
4. Current mode label is accurate.
5. Mid-active-flow copy says change applies next flow if relevant.
6. Accessibility labels exist.
7. Dynamic Type safe enough for current screen.
8. No misleading “approved/production ready” copy.

## Runtime selection

1. Training normal launch uses V2.1 in beta mode.
2. Training legacy launch uses legacy in legacy mode.
3. Training active session is pinned.
4. Micro-Check launch uses V2.1 in beta mode.
5. Micro-Check legacy launch uses legacy in legacy mode.
6. Movement Check-Up uses MPV2 V2.1 voice in beta mode.
7. Eyes-Open Balance V2 selected in beta mode.
8. Legacy mode does not default to Balance V2.
9. Step-up alternation enabled in beta Training V2.1 path.
10. Floor V2.1 enabled in beta Training V2.1 path.
11. Manual/Explore training paths respect mode.
12. Restored active flows keep their pinned mode.

## Feature isolation

1. No feature reports audio approval true.
2. No listening flag is true.
3. No physical-device QA flag is true.
4. User-selectable V2.1 counts are nonzero only in beta mode.
5. Legacy fallback remains available.
6. Missing required V2.1 binding fails closed.
7. No legacy/V2.1 double voice.

## Regression

Run existing suites for:

- post-generation whole-project voice audit
- asset generation audit
- final cue schema audit
- Training Voice V2.1
- Micro-Check Voice V2.1
- MPV2 runtime
- Eyes-Open Balance V2
- floor readiness
- step-up
- both-sides
- measurement side
- audio manifests
- VoiceChannel
- Settings screen

---

# 14. Required audit scenarios

Create at least these scenario rows.

## Activation resolver

- `fresh_install_defaults_v21_beta`
- `persisted_legacy_uses_legacy`
- `persisted_v21_uses_v21`
- `force_legacy_env_wins`
- `invalid_persisted_mode_safe_default`
- `approval_flags_remain_false`

## Settings

- `settings_toggle_visible`
- `settings_toggle_on_v21`
- `settings_toggle_off_legacy`
- `settings_current_mode_label`
- `settings_mid_flow_applies_next_flow`
- `settings_accessibility`

## Training

- `training_v21_beta_default_selects_v21`
- `training_legacy_mode_selects_legacy`
- `training_v21_selectable_count_live_registry`
- `training_step_up_alternation_enabled_beta`
- `training_floor_v21_enabled_beta`
- `training_manual_respects_mode`
- `training_explore_respects_mode`
- `training_restored_session_mode_pinned`
- `training_no_legacy_v21_double_voice`

## Micro-Check

- `micro_v21_beta_default_selects_v21`
- `micro_legacy_mode_selects_legacy`
- `micro_selectable_count_three`
- `micro_side_policy_preserved`
- `micro_restored_flow_mode_pinned`

## Movement Check-Up / Balance

- `mpv2_v21_beta_default`
- `mpv2_legacy_mode_fallback`
- `balance_v2_default_under_beta`
- `balance_old_protocol_preserved_legacy`
- `balance_no_eyes_closed_default_beta`
- `balance_no_cross_protocol_delta`

## Readiness and gates

- `training_physical_ready_approval_false`
- `micro_physical_ready_approval_false`
- `balance_physical_ready_approval_false`
- `mpv2_physical_ready`
- `listening_not_completed`
- `device_qa_deferred`
- `speaker_onset_not_measured`

## Rollback

- `switch_to_legacy_then_training_legacy`
- `switch_to_legacy_then_micro_legacy`
- `switch_to_legacy_then_checkup_legacy`
- `switch_back_to_v21_then_training_v21`
- `active_flow_does_not_hot_swap`

## Audio integrity

- `verify_audio_passes`
- `audio_files_unchanged`
- `no_audio_generation`
- `no_external_audio_api`

---

# 15. Required artifacts

Create:

1. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_IMPLEMENTATION.md`
2. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_AUDIT.md`
3. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_AUDIT.json`
4. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_SCENARIOS.csv`
5. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_READINESS_MATRIX.csv`
6. `docs/audits/PEARL_VOICE_V2_1_BETA_ACTIVATION_ROLLBACK_PLAN.md`
7. `docs/audits/PEARL_VOICE_PROJECT_POST_BETA_ACTIVATION_HANDOFF.md`

Add one audit-only harness:

```text
scripts/audits/audit-voice-v21-beta-activation.mjs
```

Do not overwrite the post-generation whole-project audit.

## Scenario CSV columns

Use columns similar to:

```text
scenarioId,category,mode,inputSource,flow,expectedRuntime,observedRuntime,selectableCount,approvalState,featureDefault,activeFlowPinned,legacyAvailable,passed,notes
```

## Readiness matrix columns

Use columns similar to:

```text
surface,mode,behaviorReady,physicalAudioSurfaceReady,audioApprovalReady,featureDefault,userReachable,selectableCount,legacyFallbackAvailable,deviceQaStatus,listeningStatus,notes
```

---

# 16. Audit metrics

Report at minimum:

```text
defaultVoiceMode
forceLegacyAvailable
settingsToggleAvailable

trainingV21BetaEnabled
trainingV21LegacyFallbackAvailable
trainingSelectableExerciseCountBeta
trainingSelectableExerciseCountLegacy

microV21BetaEnabled
microLegacyFallbackAvailable
microSelectableTypeCountBeta
microSelectableTypeCountLegacy

mpv2V21BetaEnabled
mpv2LegacyFallbackAvailable

balanceV2DefaultBeta
balanceV2DefaultLegacy
balanceV2PhysicalAudioReady
balanceV2AudioApprovalReady

stepUpAlternationEnabledBeta
floorV21EnabledBeta

audioApprovalFalseCount
listeningCompletedFalseCount
deviceQaCompletedFalseCount
speakerOnsetMeasuredFalseCount

activeFlowHotSwapCount
legacyV21DoubleVoiceCount
missingBindingSilentContinuationCount

verifyAudioFailureCount
audioFileAddedCount
audioFileModifiedCount
audioFileDeletedCount
externalSpeechAudioApiCallCount

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 17. Findings and verdicts

## P1 examples

- V2.1 beta mode cannot start a required flow.
- Legacy rollback is unavailable.
- Feature is enabled but audio verification fails.
- Missing binding silently continues.
- Legacy and V2.1 voice both speak in the same flow.
- Active flow hot-swaps voice system mid-measurement.
- Audio files changed/generated unexpectedly.
- Audio approval/listening/device QA is falsely marked complete.

## P2 examples

- A surface remains legacy in beta mode without explicit reason.
- Selectable counts inconsistent with registry.
- Settings toggle persists incorrectly.
- Restored flow loses pinned mode.
- Emergency force-legacy override unavailable.
- Audit cannot prove mode selection.

## P3 examples

- Human listening not completed.
- Audio approval not granted.
- Physical-device QA deferred.
- Speaker onset not measured.
- Beta testers may find voice/timing/tone issues.

Issue exactly one verdict.

### `VOICE_V2_1_BETA_ACTIVATION_COMPLETE_QA_PENDING`

Use when:

- V2.1 is default throughout the app for beta mode;
- legacy rollback is available;
- all relevant surfaces select V2.1 by default;
- feature/audio/listening/device truth is preserved;
- no P0/P1/P2 blockers remain.

This is the expected successful verdict.

### `VOICE_V2_1_BETA_ACTIVATION_REMEDIATION_REQUIRED`

Use when:

- any activation, rollback, runtime selection, readiness, or integrity blocker remains.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- current dirty source cannot be reconciled safely.

---

# 18. Completion gates

Successful activation requires:

```text
default voice mode = v21_beta
force legacy available = true
settings toggle available = true

training V2.1 beta enabled = true
micro V2.1 beta enabled = true
MPV2 V2.1 beta enabled = true
Balance V2 default under beta = true

training selectable count beta > 0
micro selectable count beta = 3

legacy fallback available for training/micro/check-up = true

audio approval ready = false
human listening completed = false
physical device QA completed = false
speaker onset measured = false

active flow hot swap count = 0
legacy/V2.1 double voice count = 0
missing binding silent continuation count = 0

verify:audio failures = 0
audio file added/modified/deleted by this task = 0
external speech/audio API calls = 0

P0/P1/P2 = 0
```

P3 can remain for listening/device/testing boundaries.

---

# 19. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-post-generation-whole-project.mjs
node scripts/audits/audit-voice-v21-beta-activation.mjs
```

Run adjacent audits where present:

```bash
node scripts/audits/audit-micro-check-voice-v21.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-floor-readiness.mjs
node scripts/audits/audit-eyes-open-balance-v2.mjs
```

If an old audit still has stale Git-HEAD audio-diff logic, document and supersede it with current `verify:audio` and task-start/task-end hashes.

Run focused Jest suites covering:

- activation resolver
- Settings screen voice toggle
- Training runtime selection
- Micro-Check runtime selection
- MPV2/check-up runtime selection
- Balance V2 selection
- feature flags/readiness
- VoiceChannel
- audio manifest
- post-generation audit
- final schema/generation if touched
- Settings accessibility if available

Run full Jest where practical.

Run:

```bash
git diff --check
git diff -- assets/audio
```

Compare task-start/task-end audio snapshots.

---

# 20. Implementation report structure

Use:

# Pearl Voice V2.1 Beta Activation Implementation

## 1. Result

## 2. Activation Policy

## 3. Settings Rollback Toggle

## 4. Environment Emergency Override

## 5. Training Runtime Selection

## 6. Micro-Check Runtime Selection

## 7. Movement Check-Up / MPV2 Selection

## 8. Eyes-Open Balance V2 Selection

## 9. Step-Up and Floor V2.1 Selection

## 10. Active-Flow Mode Pinning

## 11. Legacy Fallback Preservation

## 12. Readiness and Approval Truth

## 13. Diagnostics

## 14. Tests

## 15. Audit Results

## 16. Remaining QA Boundaries

## 17. Files Changed

## 18. Worktree Integrity

## 19. Exact Next Phase

---

# 21. Handoff

Create:

```text
docs/audits/PEARL_VOICE_PROJECT_POST_BETA_ACTIVATION_HANDOFF.md
```

If successful, exact next task:

```text
Real-device Voice V2.1 QA and tester feedback pass
```

The handoff must include:

- how to switch back to legacy;
- env override name;
- setting storage key;
- which flows are V2.1 by default;
- what remains unapproved;
- suggested tester checklist:
  - full Movement Check-Up
  - Balance V2
  - training session
  - floor exercise
  - step-up
  - both-sides exercise
  - micro-checks
  - pause/resume/retry/recovery
  - Clara/Marcus voice switch
- known P3 risks;
- instruction not to call audio approved until listening/device feedback passes.

---

# 22. Final Codex response

When finished, respond with:

- summary of implementation;
- paths to all 7 artifacts;
- audit harness path;
- all production files changed/added;
- all test files changed/added;
- confirmation no audio changed/generated;
- confirmation no external speech/audio API called;
- branch and commit;
- whether worktree was already dirty;
- default voice mode;
- settings rollback path;
- env force-legacy override;
- training beta/legacy selectable counts;
- micro beta/legacy selectable counts;
- MPV2 beta/legacy status;
- Balance V2 beta/legacy status;
- step-up/floor beta status;
- whether active flows are pinned;
- whether legacy fallback remains available;
- audio approval/listening/device QA status;
- P0/P1/P2/P3 counts;
- verdict;
- exact next task;
- verify:audio result;
- typecheck result;
- focused/full test results;
- audit results;
- concise confidence statement.

Do not perform listening review, physical-device QA, audio generation, or feature activation beyond the intended beta/default mode switch in this task.
