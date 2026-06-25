# Hale Voice Project Post Both-Sides Rounds Handoff

## Exact Next Task

`Training step-up alternating-leading-leg implementation`

## APIs Now Available

- Dose planner: `deriveBothSidesDosePlan`, `deriveBothSidesDosePlanForExerciseId`
- Round state: `createBothSidesRoundRuntimeState`, `advanceBothSidesRoundState`, `restoreBothSidesRoundRuntimeState`
- Semantic side: `semanticSideRoleForExercise`, `voiceSideVariantForExercise`, `sideLabelForExercise`
- Aggregation: `summarizeBothSidesProgression`, `bothSidesRoundResultsToLegacySetResults`
- Persisted start-side seed: `bothSidesStartSideSeed`, `applyBothSidesExerciseCompletionToStartSideSeed`

## Resolved Contracts

- `balance-single-leg-hold`: `standing_leg`, 3 rounds, 7500 hold_ms each side per round.
- `balance-tandem-hold`: `lead_foot`, 3 rounds, 10000 hold_ms each side per round.
- `chair-supported-split-squat`: `front_leg`, 2 rounds, 4 reps each side per round.
- `seated-hamstring-reach`: `extended_leg`, 2 rounds, 6000 rom_window_ms each side per round.
- `supported-hip-flexor-stretch`: `stretched_hip_side`, 2 rounds, 15000 timer_ms each side per round.
- `wall-calf-stretch`: `stretched_calf_side`, 2 rounds, 15000 timer_ms each side per round.

## Remaining Blockers

- Training Voice V2.1 audio assets remain pending.
- Training Voice V2.1 global behaviour ready remains false.
- Safety-family live integration, training controls/recovery, floor gate, and micro-check V2.1 remain later phases.
- Balance V2 remains default-closed/audio-pending.

## Approved Step-Up Contract

- 12 total reps.
- Alternate lead leg every rep.
- Both feet return to floor.

## Step-Up Still Needs

- Alternating-leading-leg grader/session semantics.
- Per-rep lead-leg state.
- Voice setup/progress planning for alternating reps.
- Progression aggregation that preserves one set and 12 total reps.

## Tests That Must Remain Green

- Both-sides dose planner/state/seed/progression tests.
- Training Voice V2.1 foundation/planner/readiness tests.
- Training session player, workout generation, dynamic state, progression, valid-time progression, serialization/restore, backend sync/restore, MPV2, measurement-side, and Balance V2 regressions.

## Later Sequence

1. step-up alternation
2. floor-transfer gate
3. live safety-family integration
4. training controls/progress/recovery
5. micro-check Voice V2.1
6. final cue schema/manifests
7. consolidated Clara/Marcus generation, including Balance V2
8. whole-project runtime audit
9. final physical-device QA
