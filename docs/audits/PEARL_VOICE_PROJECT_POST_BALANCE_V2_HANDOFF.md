# Pearl Voice Project Handoff After Balance V2

## Status

Eyes-open balance V2 software is implemented as `home_balance_eyes_open_v2` version `2`, movement `balance-eyes-open-v2`, battery `movement_profile_v2_battery` version `2`. Verdict: `EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE_AUDIO_PENDING`.

## Audio Pending

The live default remains old MPV2 single-leg balance until exact V2 stage-specific Clara/Marcus pairs are generated. Do not enable the V2 live default by visible-only fallback.

## APIs To Reuse

Protocol registry: `listMeasurementProtocols`, `getMeasurementProtocolDescriptor`, `descriptorForMovementMeasurement`, `protocolRefForDescriptor`, `protocolVariantForMovementResult`.

Measurement metadata: `normalizeCheckUpMeasurementMetadata`, `normalizeCheckUpItemMeasurementMetadata`, `findOfficialMeasurementAnchor`, `deriveOfficialMeasurementSide`, `deriveMeasurementComparability`, `measurementSeriesKey`, `comparableMeasurementSeriesKey`.

V2 balance: `BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS`, `BalanceEyesOpenV2ProtocolController`, `createBalanceEyesOpenV2Setup`.

Voice runtime: preserve required-speech sequencing, countdown playback-start dispatch, recovery scope cancellation, and mounted Clara/Marcus safe-boundary switching from `src/movementProfileV2/voiceRuntime.ts`.

Side APIs: `deriveMicroCheckSideSetup`, `createMicroCheckMeasurementContextForSide`, `oppositeMicroCheckSide`.

## Cue Policy Classes

Use required setup, final-position readiness, countdown, `go`, stage cap/transition, tracking-loss recovery, retry, and completion classes. Do not use old MPV2 best-of-three operational cues in eyes-open balance V2.

## Remaining Training Dependencies

Before Training Voice V2.1 implementation, plan for safety-family consolidation, both-sides round state, dose preservation, step-up alternation, floor-transfer readiness, and training controls/progress/recovery.

## Training Voice V2.1 Assets Still Ungenerated

All exact instruction mappings for the 37 registered exercise levels remain ungenerated. Balance V2 also has pending assessment cue pairs listed in `PEARL_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv`.

## Tests To Keep Green

Keep measurement-side metadata/comparability, MPV2 voice/runtime foundation, balance eyes-open V2 controller, check-up serialization, backend sync/restore, history/progress, and micro-check side setup tests green.

## Physical QA

Physical Android/iOS QA is still deferred. Device testing must validate camera session stability, audio/camera coexistence, and countdown `go` playback-start timing.

## Exact Next Phase

Training Voice V2.1 implementation foundation and exact instruction mapping for all 37 registered exercise levels.
