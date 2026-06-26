# Hale Voice Project Post Floor Readiness Handoff

## Status

Verdict: `TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE`.

## Canonical APIs

- Capability: `MovementCapabilityProfile.floorTransfer.status`
- Eligibility: `deriveFloorExerciseEligibility`
- Snapshot/fingerprint: `plannedMovementCapabilitySnapshotFromProfile`, `validatePlanMovementCapabilitySnapshot`
- Runtime memory: `TrainingFloorSessionMemory`
- Final-position setup: `TrainingFloorSetupSnapshot`, `confirmFloorStartPosition`

## Affected Contracts

- glute-bridge-hold
- glute-bridge-reps
- push-up-standard

Removed blockers: `IR-VOICE-FLOOR-GATE`, `IR-VOICE-FINAL-POSITION-READINESS`, `IR-VOICE-SAFETY-SUBSUMPTION`.

## Defaults

- Floor V2.1 feature: `EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1`, default off
- Training Voice V2.1: default off
- Safety ready: true
- Audio ready: false
- Global behavior ready: true
- Balance V2: default_closed_audio_pending
- Step-up alternation: default_off
- Micro-Check Voice V2.1: software_complete_audio_false_feature_off

## Exact Next Task

Final Voice V2.1 cue schema and physical manifest reconciliation.
