# Pearl Voice Project Post Training Foundation Handoff

## Exact Next Task

`Training both-sides round state and dose-preservation implementation`

## APIs Now Available

- Contract registry: `listTrainingVoiceContractsV21()`, `getTrainingVoiceContractV21(exerciseId)`
- Sequence planner: `planTrainingVoiceSequenceV21(input)`
- Target planner: `resolveTrainingVoiceTargetV21(input)`
- Safety planner: `resolveTrainingVoiceSafetyV21(input)`
- Runtime readiness: `resolveTrainingVoiceRuntimeReadinessV21(input)`
- Runtime selection: `selectTrainingVoiceRuntimeModeV21(input)`
- Runtime adapter: `TrainingVoiceRuntimeV21`

## Gates

- Feature flag: `EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1`
- Audio ready: false
- Behaviour ready: false
- V2.1 selectable exercises today: 0

## Both-Sides Round Work

| Exercise id | Current programmed dose | Intended both-sides structure | Current blockers |
|---|---|---|---|
| balance-single-leg-hold | 3 x 15 sec hold | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |
| balance-tandem-hold | 3 x 20 sec hold | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |
| chair-supported-split-squat | 2 x 8 reps | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |
| seated-hamstring-reach | 2 x 12 sec ROM window | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |
| supported-hip-flexor-stretch | 2 x 30 sec timed | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |
| wall-calf-stretch | 2 x 30 sec timed | One round contains work on both sides before rest; first side may alternate by round. | IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION |

Live programming was not changed in this phase because dose-preserving round state, side alternation, and progression evidence semantics need a dedicated implementation pass.

## Tests That Must Remain Green

- `src/training/voiceV21/__tests__/foundation.test.ts`
- Existing training session player, workout generation, safety cue, release policy, progression, serialization, audio player, MPV2 runtime, measurement-side, and Balance V2 suites.

## Later Phases Still Required

1. both-sides round state and dose preservation
2. alternating-leg step-up
3. floor-transfer readiness gate
4. safety-family live integration
5. training controls/progress/recovery
6. micro-check Voice V2.1
7. final cue schema/manifests
8. consolidated Clara/Marcus generation, including Balance V2
9. whole-project runtime audit
10. final physical-device QA
