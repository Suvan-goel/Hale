# Pearl Training Floor-Transfer Readiness Implementation

## 1. Result

Verdict: `TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE`.

## 2. Current Baseline

Current phase baseline: `post_safety_integration`.

The original floor-readiness phase removed `IR-VOICE-FLOOR-GATE` and `IR-VOICE-FINAL-POSITION-READINESS` while safety-family integration was still pending. Current source has completed live Training Voice V2.1 safety integration, so `IR-VOICE-SAFETY-SUBSUMPTION` is now also expected to be absent from the three floor contracts.

## 3. Approved FD-007 Contract

The Safety/Profile surface asks: "Can you safely get down to the floor and back up without assistance?" Options are Yes, No, and Not sure. Yes maps to `confirmed`; No and Not sure map to `avoid_for_now`.

## 4. Existing Capability System Reconciliation

The existing `MovementCapabilityProfile.floorTransfer.status` remains the sole authority. No second floor-transfer capability field was added.

## 5. Floor Exercise Inventory

- glute-bridge-hold: Bridge Hold, v1_core, floor, side, hold, 20 seconds
- glute-bridge-reps: Glute Bridge, v1_core, floor, side, reps, 12 reps
- push-up-standard: Push-Up, v1_optional, floor, side, reps, 8 reps

## 6. Eligibility and Substitution

`deriveFloorExerciseEligibility` centralizes floor-space, canonical capability, release-policy, equipment, and discomfort checks. Optional `push-up-standard` remains release-blocked.

## 7. Final-Position Readiness

The default-off floor V2.1 path requires explicit user confirmation plus movement-camera readiness before `final-position-set-v21`, countdown, or active work.

## 8. Training Voice V2.1 Integration

Affected contracts no longer carry `IR-VOICE-FLOOR-GATE`, `IR-VOICE-FINAL-POSITION-READINESS`, or `IR-VOICE-SAFETY-SUBSUMPTION`.

## 9. Feature Flags and Legacy Isolation

Floor V2.1 feature flag: `EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1`, default off. Training Voice V2.1 remains default off with audio ready false and behavior ready true.

## 10. Audit Results

P0/P1/P2/P3: 0/0/0/4.

## 11. Remaining Boundaries

Physical-device floor setup QA, human listening, regenerated corpus listening, and physical speaker/device timing remain P3 boundaries.

## 12. Exact Next Phase

Final Voice V2.1 cue schema and physical manifest reconciliation.
