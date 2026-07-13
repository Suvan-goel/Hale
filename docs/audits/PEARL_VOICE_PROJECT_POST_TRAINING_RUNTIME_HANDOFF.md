# Pearl Voice Project Post Training Runtime Handoff

## Status

Verdict: TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE

Training Voice V2.1 behavior ready: true
Training Voice V2.1 audio ready: false
Training Voice V2.1 feature default: off
Training Voice V2.1 selectable exercises: 0

## APIs

- Runtime phase/scope API: `TrainingVoiceRuntimeV21`, `TrainingVoicePhaseV21`, `TrainingVoiceRuntimeEventV21`.
- Countdown/go API: `startCountdown()` plus `go` playback-start callback; live player hook `notifyCountdownGoPlaybackStarted()`.
- Control contract API: `listTrainingVoiceControlContractsV21()`.
- Progress planner API: `resolveTrainingVoiceProgressPlanV21()`.
- Transition planner API: `planTrainingVoiceTransitionV21()`.
- Recovery episode API: `createTrainingVoiceRecoveryEpisodeV21()`.
- Reactive safety API: `listTrainingVoiceReactiveSafetyContractsV21()`.
- Persistence field: `TrainingState.activeTrainingVoiceRuntime`.

## Removed Blockers

- IR-VOICE-TRAINING-CONTROLS remaining: 0
- IR-VOICE-TRAINING-RECOVERY remaining: 0

## Remaining Boundaries

- `IR-VOICE-AUDIO-ASSETS` remains.
- `IR-VOICE-NEW-CUE-SCHEMA` remains where applicable for the later schema/manifest phase.
- Human listening is waived, not completed.
- Physical-device QA is deferred.

## Tests To Keep Green

- `src/training/voiceV21/__tests__/foundation.test.ts`
- `src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts`
- `src/training/__tests__/sessionPlayer.test.ts`
- `src/training/__tests__/store.test.ts`
- `src/services/backend/__tests__/trainingStateSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`

## Later Order

1. Micro-Check Voice V2.1
2. final cue schema and physical manifests
3. consolidated Clara/Marcus generation, including Balance V2
4. whole-project static/runtime audit
5. final consolidated physical-device QA

Exact next task: Micro-Check Voice V2.1 implementation.
