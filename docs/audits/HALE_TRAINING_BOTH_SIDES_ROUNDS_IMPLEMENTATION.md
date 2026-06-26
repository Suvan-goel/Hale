# Hale Training Both-Sides Rounds Implementation

## 1. Result

Primary verdict: `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE`.

Implemented a canonical, persisted, testable both-sides round and dose-preservation model for the six FD-001 training levels. The live legacy training path remains unchanged and Training Voice V2.1 remains default-closed.

## 2. Approved FD-001 Contract

A unilateral or asymmetric round contains work on both sides before rest. Both sides receive equal total prescribed work, the first side alternates by round, and the source programmed active dose is preserved exactly.

## 3. Source Prescription Reconciliation

All six source prescriptions were read from the live exercise registry after current scaling hooks: single-leg 3 x 15 sec, tandem 3 x 20 sec, split squat 2 x 8 reps, hamstring reach 2 x 12 sec ROM, hip-flexor stretch 2 x 30 sec, calf stretch 2 x 30 sec.

## 4. Dose-Preservation Algorithm

`deriveBothSidesDosePlan` works in explicit units: reps, hold ms, timer ms, and ROM-window ms. Time plans require 250 ms precision. Rep plans require exact whole-rep left/right totals. Proven minimum targets reduce round count deterministically; no default target is treated as a minimum.

## 5. Final Six-Exercise Conversion Matrix

| Exercise | Source | Rounds | Per-side target | Left | Right | Total |
|---|---:|---:|---:|---:|---:|---:|
| `balance-single-leg-hold` | 3 x 15000 hold_ms | 3 | 7500 | 22500 | 22500 | 45000 |
| `balance-tandem-hold` | 3 x 20000 hold_ms | 3 | 10000 | 30000 | 30000 | 60000 |
| `chair-supported-split-squat` | 2 x 8 reps | 2 | 4 | 8 | 8 | 16 |
| `seated-hamstring-reach` | 2 x 12000 rom_window_ms | 2 | 6000 | 12000 | 12000 | 24000 |
| `supported-hip-flexor-stretch` | 2 x 30000 timer_ms | 2 | 15000 | 30000 | 30000 | 60000 |
| `wall-calf-stretch` | 2 x 30000 timer_ms | 2 | 15000 | 30000 | 30000 | 60000 |

## 6. Semantic Side Roles

- `balance-single-leg-hold`: `standing_leg`
- `balance-tandem-hold`: `lead_foot`
- `chair-supported-split-squat`: `front_leg`
- `seated-hamstring-reach`: `extended_leg`
- `supported-hip-flexor-stretch`: `stretched_hip_side`
- `wall-calf-stretch`: `stretched_calf_side`

## 7. Round State Machine

The new state machine enforces side setup, readiness, fresh countdown, active work, side completion, side switch, second-side setup, second-side active work, round completion, then rest or exercise completion. It ignores stale attempt callbacks and cannot complete a round with one side missing.

## 8. Side Order Across Rounds and Sessions

Generated internal items pin `initialStartSide`. Round starts alternate inside the session. Main-plan seed state defaults left and flips only after successful main-plan completion with an idempotent event id.

## 9. Interruption and Restore

Current-side partial work is discarded on tracking loss, background, or active restore. A completed opposite side in the same round is preserved. Restore resumes at side setup without regenerating the plan.

## 10. Result Aggregation and Progression

One completed both-sides round maps to one legacy set result. Side segments do not double set count, valid time, reps, or session completion. Progression uses the conservative lower side-completion ratio.

## 11. Workout Generation Integration

The internal helper `attachBothSidesDosePlansToGeneratedSession` annotates generated exercises only when the both-sides flag and an internal V2.1-ready runtime context are both true. The round flag alone returns the original session and leaves legacy voice semantics unchanged.

## 12. Training Voice V2.1 Reconciliation

The six contracts no longer carry `IR-VOICE-ROUND-STATE` or `IR-VOICE-DOSE-CONVERSION`. Side setup uses the semantic side role, including rear stretched-side language for hip-flexor and calf stretches. Voice target planning consumes the side-segment dose plan.

## 13. Feature Flags and Legacy Isolation

- Both-sides rounds flag: `EXPO_PUBLIC_ENABLE_TRAINING_BOTH_SIDES_ROUNDS`, default off.
- Training Voice V2.1 flag: `EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1`, default off.
- Training Voice V2.1 audio ready: false.
- Training Voice V2.1 global behaviour ready: true.

## 14. Persistence and Sync

Plan metadata is JSON-safe and fingerprinted. Training state now carries additive `bothSidesStartSideSeed`; generated summaries may carry additive dose-plan metadata. Old sessions remain readable.

## 15. Diagnostics

Bounded diagnostic event names were added for source prescription, plan creation, minimum adjustment, side/round transitions, restore checkpoints, seed flips, unrepresentable plans, and progression aggregation. No landmarks, video, account ids, or names are logged.

## 16. Tests

Focused Jest coverage: `src/training/bothSidesRounds/__tests__/bothSidesRounds.test.ts` and updated V2.1 foundation coverage.

## 17. Files Changed

Production: `src/training/bothSidesRounds/*`, `src/training/voiceV21/*`, additive training persistence/types exports.

## 18. Worktree Integrity

Branch: `dev`; HEAD: `aa7ab05` (`aa7ab05fc28925e02fc8b1088976afd829095e0e`); upstream: `origin/dev`. The worktree was already dirty. No audio was generated or changed.

## 19. Exact Next Phase

`Training step-up alternating-leading-leg implementation`.
