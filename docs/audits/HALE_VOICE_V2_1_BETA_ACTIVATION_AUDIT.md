# Hale Voice V2.1 Beta Activation Audit

## Verdict

VOICE_V2_1_BETA_ACTIVATION_COMPLETE_QA_PENDING

## Metrics

```json
{
  "defaultVoiceMode": "v21_beta",
  "forceLegacyAvailable": true,
  "settingsToggleAvailable": true,
  "trainingV21BetaEnabled": true,
  "trainingV21LegacyFallbackAvailable": true,
  "trainingSelectableExerciseCountBeta": 37,
  "trainingSelectableExerciseCountLegacy": 0,
  "microV21BetaEnabled": true,
  "microLegacyFallbackAvailable": true,
  "microSelectableTypeCountBeta": 3,
  "microSelectableTypeCountLegacy": 0,
  "mpv2V21BetaEnabled": true,
  "mpv2LegacyFallbackAvailable": true,
  "balanceV2DefaultBeta": true,
  "balanceV2DefaultLegacy": false,
  "balanceV2PhysicalAudioReady": true,
  "balanceV2AudioApprovalReady": false,
  "stepUpAlternationEnabledBeta": true,
  "floorV21EnabledBeta": true,
  "audioApprovalFalseCount": 3,
  "listeningCompletedFalseCount": 1,
  "deviceQaCompletedFalseCount": 1,
  "speakerOnsetMeasuredFalseCount": 1,
  "activeFlowHotSwapCount": 0,
  "legacyV21DoubleVoiceCount": 0,
  "missingBindingSilentContinuationCount": 0,
  "verifyAudioFailureCount": 0,
  "audioFileAddedCount": 0,
  "audioFileModifiedCount": 0,
  "audioFileDeletedCount": 0,
  "externalSpeechAudioApiCallCount": 0,
  "p0": 0,
  "p1": 0,
  "p2": 0,
  "p3": 4
}
```

## Findings

- P0/P1/P2: 0/0/0
- P3: 4 (Human listening review is not completed. Audio approval is not granted. Physical-device QA is deferred. Speaker onset is not measured.)

## Audio Integrity

- Entry snapshot available: true
- Audio files added by this task: 0
- Audio files modified by this task: 0
- Audio files deleted by this task: 0

## Rollback

- In-app: Settings -> Trainer Voice -> New voice system off.
- Env: EXPO_PUBLIC_FORCE_LEGACY_VOICE=1.
- Mode env: EXPO_PUBLIC_VOICE_EXPERIENCE_MODE=legacy.
