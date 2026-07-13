# Pearl Voice Experience Specification V2

## 1. Status and Executive Summary

Status: proposed for founder review. This V2 spec corrects V1 but does not authorize production changes, test changes, manifest changes, or audio generation.
It covers 37 exact training levels, 172 active cue assets/fragments, and 966 composed duration rows.
Human script approval and founder decisions precede implementation.

## 2. V1 Correction Ledger

- SIDE-001: corrected. Training laterality table uses bilateral_simultaneous, alternating_within_set, bilateral_sequential_within_set, or both_sides_not_scored_separately; no bilateral movement receives a left/right alternating set policy. Validation: Generated exerciseContracts contain no "official side schedule" phrase and no bilateral_simultaneous row has sideSwitchRequired=true.
- SIDE-002: converted_to_founder_decision. Rows are blocked by FD-001 or FD-005 instead of silently assigning left-right-left. Validation: Every affected contract has freezeStatus=blocked_by_decision and blockingDecisionIds populated.
- PRIORITY-001: corrected. One cuePolicies table defines six policies; every manifest row references policyId and inherits interrupt/drop/block fields. Validation: Manifest validation checks every policy id and category mapping.
- DURATION-001: corrected. PEARL_VOICE_COMPOSED_TIMELINES_V2.csv models full sequences for both voices and 0/100/250ms gaps. Validation: Timeline rows include cold-equipment and warm-equipment variants; standing-band-row has door-anchor family cue in cold-equipment timeline.
- DECISION-001: converted_to_founder_decision. Founder decision sheet includes FD-001 through FD-007 with recommendations and blank decision fields. Validation: No unresolved decision is reported as resolved; blocked scripts point to decision ids.
- REVIEW-001: corrected. Phase 0/1 require founder/protocol decisions and human line review before implementation or audio generation. Validation: Implementation plan begins with no-production-code approval gates.
- COPY-001: corrected. Proposed scripts remove logged/framed/reset/internal language from active scripts and use concise mature wording. Validation: Manifest active exactScript search excludes prohibited implementation phrases.
- COPY-002: corrected. V2 scripts specify verified current behavior where safe and mark unresolved choices with FD ids. Validation: Static stretch targets use hold language; mini-band/step/shoulder rows are blocked by decisions.
- PROGRESS-001: corrected. V2 active guidance defines exact timed moments and drop-if-busy behavior for optional progress. Validation: Progress cue manifest rows use low_reassurance and blocksProgression=false.

## 3. Product and Voice Principles

- Voice-first, not voice-saturated.
- Camera measurement is silent unless a high-confidence user action is needed.
- Training laterality and official measurement-side comparability are separate models.
- No production or audio change is authorized by this spec.
- Human script approval comes before implementation and full audio generation.

## 4. Remaining Founder/Protocol Decisions

- FD-001: How should unilateral or asymmetric training work be balanced inside a session? Recommendation: Define equal left/right work within a round; until implemented, avoid freezing side-specific scripts for affected items. Blocks freeze: yes.
- FD-002: How should baseline measurement side be selected and persisted for official measurements and micro-checks? Recommendation: Use reliable comfortable side at baseline, persist exact side, retest same side, and mark reduced comparability for fallback. Blocks freeze: yes.
- FD-003: Should eyes-closed balance remain in an unsupervised default home check-up? Recommendation: Do not expand or remove in this task; require explicit founder/protocol approval before script freeze. Blocks freeze: yes.
- FD-004: Where should the mini band be placed for the initial lateral-walk level? Recommendation: Use above knees for the initial level; treat ankle placement as a later progression. Blocks freeze: yes.
- FD-005: What are step-up rep semantics and the leg-switch schedule? Recommendation: Alternate legs within the set if the grader can support it; otherwise use even side-specific sets. Blocks freeze: yes.
- FD-006: Should set count be spoken on first exposure? Recommendation: Do not speak set count by default. Blocks freeze: no.
- FD-007: Do floor exercises require an explicit transfer-readiness gate or only concise setup copy? Recommendation: Add a transfer-readiness gate before broad rollout; keep floor scripts blocked until approved. Blocks freeze: yes.

## 5. Canonical Cue Policy and Priority Model

| Policy | Priority | Blocks Progression | Droppable | Purpose |
|---|---:|---|---|---|
| critical_stop | 100 | yes | no | Immediate stop, active tracking loss, times-up, and safety-critical interruption. |
| critical_window | 90 | yes | no | Countdown, go, and active timing boundary cues. |
| result_transition | 70 | yes | no | Pause, resume, retry, skip, discard, completion, result, and between-item transitions. |
| instruction | 60 | yes | no | Exact movement instructions, target fragments, and due first-use safety. |
| setup_recovery | 50 | no | yes | Preflight, framing, orientation correction, visibility, and stable recovery confirmation. |
| low_reassurance | 20 | no | yes | Optional progress and nonessential reassurance. |

Mandatory mappings: countdown/go use critical_window; times-up and active tracking loss use critical_stop; pause/resume/retry/skip/discard/results/completion use result_transition; exact instructions/targets/due safety use instruction; preflight/framing/orientation use setup_recovery; optional progress uses low_reassurance.

## 6. Timing and Complete-Sequence Budgets

| Budget | Target | Hard Max |
|---|---:|---:|
| training_intro_universal_safety | 12000 | 16000 |
| ordinary_first_use_pre_countdown | 12000 | 16000 |
| complex_equipment_first_use_pre_countdown | 16000 | 20000 |
| later_set_reminder | 4000 | 6000 |
| repeat_instructions | 10000 | 14000 |
| checkup_assessment_setup | 12000 | 16000 |
| micro_check_setup | 7000 | 10000 |
| control_confirmation | 2000 | 3500 |
| tracking_loss | 3500 | 5000 |
| tracking_recovery | 2500 | 4000 |

Duration method: V2 estimates use measured existing asset duration when reusing an unchanged key; new or rewritten lines use a conservative linear model calibrated from the V1 duration estimator and checked against measured corpus cadence: Clara = 420 ms + 360 ms/word, Marcus = 420 ms + 350 ms/word, minimum 900 ms. Gaps are modelled separately at 0, 100, and 250 ms.
Longest ordinary first-use sequence: training-seated-band-row-first-use-cold-equipment-gap250 clara 22900 ms (hard max 16000, passes=false).
Longest complex-equipment sequence: training-step-up-first-use-cold-equipment-gap250 clara 23260 ms (hard max 20000, passes=false).
Longest repeat-instructions sequence: training-step-up-repeat-instructions-gap250 clara 11170 ms (hard max 14000, passes=true).
Longest check-up setup: checkup-chair-stand-30s-setup-gap250 clara 15800 ms (hard max 16000, passes=true).
Longest micro-check setup: micro-chair-power-setup-gap250 clara 10090 ms (hard max 10000, passes=false).
Standing band row was explicitly re-evaluated: cold equipment includes framing-ready, standing band row instruction, target, and door-anchor safety, with general band safety de-duplicated by the door-anchor family.

## 7. Training Laterality Model

| Exercise | Laterality | Target Semantics | Side Schedule | Freeze |
|---|---|---|---|---|
| balance-feet-together-hold | both_sides_not_scored_separately | hold duration per set | none | ready_for_founder_review |
| balance-single-leg-hold | unilateral_single_side_per_set | hold duration for selected side; side policy unresolved | not specified in production; do not assign left-right-left | blocked_by_decision (FD-001) |
| balance-tandem-hold | asymmetric_stance_single_side_per_set | hold duration for selected side; side policy unresolved | not specified in production | blocked_by_decision (FD-001) |
| band-pull-apart | bilateral_simultaneous | timed movement window | none | ready_for_founder_review |
| chair-supported-split-squat | asymmetric_stance_single_side_per_set | total accepted reps/events per set | not specified in production | blocked_by_decision (FD-001) |
| glute-bridge-hold | bilateral_simultaneous | hold duration per set | none | blocked_by_decision (FD-007) |
| glute-bridge-reps | bilateral_simultaneous | total accepted reps/events per set | none | blocked_by_decision (FD-007) |
| heel-raise-free | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| heel-raise-supported | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| hip-hinge-free | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| hip-hinge-wall | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| loaded-march | alternating_within_set | total accepted reps/events per set | alternate naturally within the set; no left/right set schedule | ready_for_founder_review |
| loaded-sit-to-stand | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| mini-band-lateral-walk | bilateral_sequential_within_set | timed movement window | move laterally within the set; no left/right set schedule | blocked_by_decision (FD-001;FD-004) |
| neck-rotation | alternating_within_set | peak capture per window | alternate naturally within the set; no left/right set schedule | ready_for_founder_review |
| overhead-press-band | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| overhead-reach | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| push-up-incline | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| push-up-standard | bilateral_simultaneous | total accepted reps/events per set | none | blocked_by_decision (FD-007) |
| push-up-wall | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| seated-band-row | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| seated-hamstring-reach | unilateral_single_side_per_set | peak capture on selected side; side policy unresolved | not specified in production | blocked_by_decision (FD-001) |
| squat-free | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| squat-loaded | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| squat-slow-eccentric | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| squat-supported | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| standing-band-row | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| step-up | unilateral_single_side_per_set | currently total accepted events; per-side semantics require decision | not specified in production; do not assign left-right-left | blocked_by_decision (FD-005) |
| sts-cushion | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| sts-power | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| sts-slow-eccentric | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| sts-standard | bilateral_simultaneous | total accepted reps/events per set | none | ready_for_founder_review |
| supported-hip-flexor-stretch | asymmetric_stance_single_side_per_set | timed hold window | not specified in production | blocked_by_decision (FD-001) |
| supported-side-step | both_sides_not_scored_separately | timed movement window | move laterally within the set; no left/right set schedule | ready_for_founder_review |
| thoracic-rotation | alternating_within_set | timed movement window | alternate naturally within the set; no left/right set schedule | ready_for_founder_review |
| toe-raise-supported | bilateral_simultaneous | timed movement window | none | ready_for_founder_review |
| wall-calf-stretch | asymmetric_stance_single_side_per_set | timed hold window | not specified in production | blocked_by_decision (FD-001) |

## 8. Official Measurement-Side Policy

- baselineSideSelectionRule: Recommended V2: choose the side that is most reliably visible and comfortable in the required camera orientation.
- persistedSide: Required for official retest comparability; partially represented by Movement Profile V2 setup types, not by the default legacy battery.
- officialRetestRule: Use the same persisted side as baseline. If not possible, mark reduced comparability.
- manualExtraCheckRule: Manual extra checks may use either side but must be labelled non-official unless side matches persisted official side.
- oppositeSideFallback: Allowed only with reduced-comparability marking.
- comparabilityMarking: same_side_comparable, opposite_side_reduced_comparability, side_unknown_raw_only
- protocolVersionImplications: Side persistence changes the protocol contract and must be reflected in result schema/protocol policy.
- currentDataModelSupport: src/checkup/protocolSetup.ts supports selectedSide/standingLeg for Movement Profile V2; CheckUp legacy MovementResultBase does not store side for default shoulder/hinge/balance results.
- requiredFutureDataModelChanges: Persist selected side per official result.; Store prior side in setup confirmation.; Expose comparability marker in history/result serialization.

## 9. Training Session Timeline

intro -> universal safety -> per-item transition -> preflight -> instructions/safety -> countdown -> set -> rest -> next item -> complete

## 10. Active Guidance Rules

- rep_sets: Accepted reps use rep-credit SFX; no spoken count, no two-reps-left cue by default.
- 15_second_holds: Five seconds left at 10 seconds elapsed. No halfway cue.
- 20_second_holds: Halfway at 10 seconds; five seconds left at 15 seconds.
- 30_second_timed_windows: Halfway at 15 seconds; five seconds left at 25 seconds. No ten-seconds-left cue.
- 12_or_14_second_rom_windows: No active progress cue; end/return cue only.
- suppression: Optional progress uses low_reassurance. If busy with higher priority at the scheduled moment, drop and never replay.

## 11. Exact Training-Level Contracts

### Feet-Together Hold (balance-feet-together-hold)

Release: v1_core. Set type: hold. Sets: 3. Target: 20 sec hold. Rest: 30s.
Equipment: counter. Support: counter, nearby sturdy support. Orientation: front.
Laterality: both_sides_not_scored_separately. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Feet-together hold. Stand with feet together, fingertips near support, eyes open."
Later-set script: "Feet-together hold." Target: "Hold for twenty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: generic_support, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-balance-feet-together-hold-first-v2 -> target-balance-feet-together-hold-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/balanceRung.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Single-Leg Hold (balance-single-leg-hold)

Release: v1_core. Set type: hold. Sets: 3. Target: 15 sec hold. Rest: 30s.
Equipment: counter. Support: counter, nearby sturdy support. Orientation: front.
Laterality: unilateral_single_side_per_set. Side schedule: not specified in production; do not assign left-right-left. Production supports proposed side behavior: no.
First-use script: "Single-leg hold. Stand on the approved leg, lift the other foot slightly, fingertips near support."
Later-set script: "Single-leg hold." Target: "Hold for fifteen seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Five seconds left at 10 seconds elapsed.
Safety: generic_support, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-balance-single-leg-hold-first-v2 -> target-balance-single-leg-hold-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/balanceRung.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Tandem Hold (balance-tandem-hold)

Release: v1_core. Set type: hold. Sets: 3. Target: 20 sec hold. Rest: 30s.
Equipment: counter. Support: counter, nearby sturdy support. Orientation: front.
Laterality: asymmetric_stance_single_side_per_set. Side schedule: not specified in production. Production supports proposed side behavior: no.
First-use script: "Tandem hold. Use the approved lead foot, heel to toe, fingertips near support."
Later-set script: "Tandem hold." Target: "Hold for twenty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: generic_support, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-balance-tandem-hold-first-v2 -> target-balance-tandem-hold-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/balanceRung.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Band Pull-Apart (band-pull-apart)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 40s.
Equipment: long_band. Support: none. Orientation: front.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Band pull-apart. Hold a light band at chest height. Pull your hands wide, then return slowly."
Later-set script: "Band pull-apart." Target: "Move for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: long_band_handheld_or_foot_anchored; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-band-pull-apart-first-v2 -> target-band-pull-apart-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/pullUpperBack.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Chair-Supported Split Squat (chair-supported-split-squat)

Release: v1_optional. Set type: reps. Sets: 2. Target: 8 reps. Rest: 75s.
Equipment: chair, counter. Support: chair, counter. Orientation: side.
Laterality: asymmetric_stance_single_side_per_set. Side schedule: not specified in production. Production supports proposed side behavior: no.
First-use script: "Supported split squat. Use the approved stance side, fingertips near support. Bend both knees slightly, then stand tall."
Later-set script: "Supported split squat." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-chair-supported-split-squat-first-v2 -> target-chair-supported-split-squat-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/supportedSquat.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Bridge Hold (glute-bridge-hold)

Release: v1_core. Set type: hold. Sets: 3. Target: 20 sec hold. Rest: 40s.
Equipment: floor. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Bridge hold. Lie on your back, knees bent, feet flat. Lift your hips and hold."
Later-set script: "Bridge hold." Target: "Hold for twenty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: floor_transfer; Floor-transfer readiness is unresolved; see FD-007.
Repeat sequence: ex-glute-bridge-hold-first-v2 -> target-glute-bridge-hold-v2.
Freeze: blocked_by_decision (FD-007). Sources: src/exercises/gluteBridge.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Glute Bridge (glute-bridge-reps)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 45s.
Equipment: floor. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips, then lower with control."
Later-set script: "Glute bridge." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: floor_transfer; Floor-transfer readiness is unresolved; see FD-007.
Repeat sequence: ex-glute-bridge-reps-first-v2 -> target-glute-bridge-reps-v2.
Freeze: blocked_by_decision (FD-007). Sources: src/exercises/gluteBridge.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Heel Raise (heel-raise-free)

Release: v1_core. Set type: reps. Sets: 3. Target: 18 reps. Rest: 40s.
Equipment: none. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly."
Later-set script: "Heel raise." Target: "Aim for eighteen reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-heel-raise-free-first-v2 -> target-heel-raise-free-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/heelRaise.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Supported Heel Raise (heel-raise-supported)

Release: v1_core. Set type: reps. Sets: 2. Target: 15 reps. Rest: 40s.
Equipment: wall, counter. Support: wall, counter. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Supported heel raise. Fingertips near support. Rise onto the balls of your feet, then lower slowly."
Later-set script: "Supported heel raise." Target: "Aim for fifteen reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-heel-raise-supported-first-v2 -> target-heel-raise-supported-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/heelRaise.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Hip Hinge (hip-hinge-free)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 45s.
Equipment: none. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Hip hinge. Feet under hips. Send hips back with a long spine, then stand tall."
Later-set script: "Hip hinge." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-hip-hinge-free-first-v2 -> target-hip-hinge-free-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/hipHinge.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Wall-Tap Hinge (hip-hinge-wall)

Release: v1_core. Set type: reps. Sets: 2. Target: 10 reps. Rest: 45s.
Equipment: wall. Support: wall. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Wall-tap hinge. Stand a step from the wall. Send hips back to tap the wall, then stand tall."
Later-set script: "Wall-tap hinge." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-hip-hinge-wall-first-v2 -> target-hip-hinge-wall-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/hipHinge.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### March in Place (loaded-march)

Release: v1_core. Set type: reps. Sets: 3. Target: 16 reps. Rest: 45s.
Equipment: counter. Support: counter. Orientation: side.
Laterality: alternating_within_set. Side schedule: alternate naturally within the set; no left/right set schedule. Production supports proposed side behavior: yes.
First-use script: "March in place. Stand tall near support and march with a steady rhythm."
Later-set script: "March in place." Target: "Aim for sixteen reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-loaded-march-first-v2 -> target-loaded-march-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/loadedMarch.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Loaded Sit-to-Stand (loaded-sit-to-stand)

Release: v1_optional. Set type: reps. Sets: 3. Target: 8 reps. Rest: 75s.
Equipment: chair, backpack_or_weight. Support: chair. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Loaded sit-to-stand. Hold the load close to your chest. Stand fully, then sit with control."
Later-set script: "Loaded sit-to-stand." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-loaded-sit-to-stand-first-v2 -> target-loaded-sit-to-stand-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/sitToStand.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Mini-Band Lateral Walk (mini-band-lateral-walk)

Release: v1_optional. Set type: timer. Sets: 2. Target: 30 sec. Rest: 35s.
Equipment: mini_band. Support: nearby sturdy support. Orientation: front.
Laterality: bilateral_sequential_within_set. Side schedule: move laterally within the set; no left/right set schedule. Production supports proposed side behavior: no.
First-use script: "Mini-band lateral walk. Place the mini band above your knees. Take small controlled side steps."
Later-set script: "Mini-band lateral walk." Target: "Move for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: mini_band, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-mini-band-lateral-walk-first-v2 -> target-mini-band-lateral-walk-v2.
Freeze: blocked_by_decision (FD-001;FD-004). Sources: src/exercises/lateralStability.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Neck Rotations (neck-rotation)

Release: v1_optional. Set type: rom. Sets: 1. Target: 14 sec capture. Rest: 15s.
Equipment: none. Support: none. Orientation: front.
Laterality: alternating_within_set. Side schedule: alternate naturally within the set; no left/right set schedule. Production supports proposed side behavior: yes.
First-use script: "Neck rotations. Face the phone, sit or stand tall, and slowly look over one shoulder, then the other."
Later-set script: "Neck rotations." Target: "Capture for fourteen seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: No progress cue; end cue only.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-neck-rotation-first-v2 -> target-neck-rotation-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/neckRotation.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Band Overhead Press (overhead-press-band)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 50s.
Equipment: long_band. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Band overhead press. Stand tall with light band tension. Press overhead, then return slowly."
Later-set script: "Band overhead press." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: long_band_handheld_or_foot_anchored; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-overhead-press-band-first-v2 -> target-overhead-press-band-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/overheadPress.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Overhead Reach (overhead-reach)

Release: v1_core. Set type: reps. Sets: 2. Target: 12 reps. Rest: 40s.
Equipment: none. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower."
Later-set script: "Overhead reach." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-overhead-reach-first-v2 -> target-overhead-reach-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/overheadPress.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Incline Push-Up (push-up-incline)

Release: v1_core. Set type: reps. Sets: 3. Target: 10 reps. Rest: 50s.
Equipment: chair, counter. Support: chair, counter. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Incline push-up. Hands on a stable counter or sturdy chair. Lower in with control, then press away."
Later-set script: "Incline push-up." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; If using a chair, it must be sturdy and not slide; a counter is preferred when available.
Repeat sequence: ex-push-up-incline-first-v2 -> target-push-up-incline-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/pushUp.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Push-Up (push-up-standard)

Release: v1_optional. Set type: reps. Sets: 3. Target: 8 reps. Rest: 60s.
Equipment: floor. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Push-up. Hands under your shoulders. Lower with control, then press up."
Later-set script: "Push-up." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: floor_transfer; Floor-transfer readiness is unresolved; see FD-007.
Repeat sequence: ex-push-up-standard-first-v2 -> target-push-up-standard-v2.
Freeze: blocked_by_decision (FD-007). Sources: src/exercises/pushUp.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Wall Push-Up (push-up-wall)

Release: v1_core. Set type: reps. Sets: 2. Target: 10 reps. Rest: 45s.
Equipment: wall. Support: wall. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Wall push-up. Hands on the wall. Lower in with control, then press away."
Later-set script: "Wall push-up." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-push-up-wall-first-v2 -> target-push-up-wall-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/pushUp.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Seated Band Row (seated-band-row)

Release: v1_core. Set type: reps. Sets: 2. Target: 10 reps. Rest: 45s.
Equipment: chair, long_band. Support: chair. Orientation: side_oblique.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Seated band row. Sit tall with the band secure under your feet or a low anchor. Pull elbows back, then return slowly."
Later-set script: "Seated band row." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair, long_band_handheld_or_foot_anchored; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-seated-band-row-first-v2 -> target-seated-band-row-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/pullUpperBack.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Seated Hamstring Reach (seated-hamstring-reach)

Release: v1_core. Set type: rom. Sets: 2. Target: 12 sec capture. Rest: 20s.
Equipment: chair. Support: chair. Orientation: side.
Laterality: unilateral_single_side_per_set. Side schedule: not specified in production. Production supports proposed side behavior: no.
First-use script: "Seated hamstring reach. Sit tall at the chair edge, one leg straight. Reach gently toward your toes and hold."
Later-set script: "Seated hamstring reach." Target: "Capture for twelve seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: No progress cue; end cue only.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-seated-hamstring-reach-first-v2 -> target-seated-hamstring-reach-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/seatedHamstringReach.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Squat (squat-free)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 60s.
Equipment: none. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Squat. Feet about hip width. Lower as if to sit, then stand with control."
Later-set script: "Squat." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-squat-free-first-v2 -> target-squat-free-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/supportedSquat.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Loaded Squat (squat-loaded)

Release: v1_optional. Set type: reps. Sets: 3. Target: 8 reps. Rest: 75s.
Equipment: backpack_or_weight. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Loaded squat. Hold the load close to your chest. Lower into a squat, then stand with control."
Later-set script: "Loaded squat." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-squat-loaded-first-v2 -> target-squat-loaded-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/supportedSquat.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Slow-Lower Squat (squat-slow-eccentric)

Release: v1_optional. Set type: reps. Sets: 3. Target: 8 reps. Rest: 60s.
Equipment: none. Support: none. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Slow-lower squat. Lower slowly, then stand with control."
Later-set script: "Slow-lower squat." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-squat-slow-eccentric-first-v2 -> target-squat-slow-eccentric-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/supportedSquat.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Supported Squat (squat-supported)

Release: v1_core. Set type: reps. Sets: 2. Target: 10 reps. Rest: 45s.
Equipment: chair, counter. Support: chair, counter. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Supported squat. Stand near sturdy support. Lower as if to sit, then stand with control."
Later-set script: "Supported squat." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-squat-supported-first-v2 -> target-squat-supported-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/supportedSquat.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Standing Band Row (standing-band-row)

Release: v1_core. Set type: reps. Sets: 3. Target: 10 reps. Rest: 50s.
Equipment: long_band, door_anchor. Support: none. Orientation: side_oblique.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Standing band row. Face the anchored band with a stable stance. Pull elbows back, then return slowly."
Later-set script: "Standing band row." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: door_anchor_band; Door-anchor first-use cue subsumes the general band warning for this setup.
Repeat sequence: ex-standing-band-row-first-v2 -> target-standing-band-row-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/pullUpperBack.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Step-Up (step-up)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 60s.
Equipment: stair, counter. Support: counter. Orientation: side.
Laterality: unilateral_single_side_per_set. Side schedule: not specified in production; do not assign left-right-left. Production supports proposed side behavior: no.
First-use script: "Step-up. Use the approved leading foot. Step up, bring the other foot to meet it, then step down leading with the same foot."
Later-set script: "Step-up." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: step_or_stair, generic_support; Stop if the step, surface, support, or balance feels unstable.
Repeat sequence: ex-step-up-first-v2 -> target-step-up-v2.
Freeze: blocked_by_decision (FD-005). Sources: src/exercises/stepUp.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Cushion Sit-to-Stand (sts-cushion)

Release: v1_core. Set type: reps. Sets: 2. Target: 8 reps. Rest: 45s.
Equipment: chair, cushion. Support: chair. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit with control."
Later-set script: "Cushion sit-to-stand." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-sts-cushion-first-v2 -> target-sts-cushion-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/sitToStand.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Power Sit-to-Stand (sts-power)

Release: v1_core. Set type: reps. Sets: 3. Target: 12 reps. Rest: 75s.
Equipment: chair. Support: chair. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Power sit-to-stand. Sit tall, drive up briskly to standing, then sit with control."
Later-set script: "Power sit-to-stand." Target: "Aim for twelve reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-sts-power-first-v2 -> target-sts-power-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/sitToStand.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Slow-Lower Sit-to-Stand (sts-slow-eccentric)

Release: v1_core. Set type: reps. Sets: 3. Target: 8 reps. Rest: 60s.
Equipment: chair. Support: chair. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Slow-lower sit-to-stand. Stand fully, then lower slowly and steadily before the next rep."
Later-set script: "Slow-lower sit-to-stand." Target: "Aim for eight reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-sts-slow-eccentric-first-v2 -> target-sts-slow-eccentric-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/sitToStand.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Sit-to-Stand (sts-standard)

Release: v1_core. Set type: reps. Sets: 3. Target: 10 reps. Rest: 45s.
Equipment: chair. Support: chair. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Sit-to-stand. Sit tall in the middle of the chair, feet flat. Stand fully, then sit with control."
Later-set script: "Sit-to-stand." Target: "Aim for ten reps."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-sts-standard-first-v2 -> target-sts-standard-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/sitToStand.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Supported Hip Flexor Stretch (supported-hip-flexor-stretch)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 15s.
Equipment: chair, counter. Support: chair, counter. Orientation: side.
Laterality: asymmetric_stance_single_side_per_set. Side schedule: not specified in production. Production supports proposed side behavior: no.
First-use script: "Supported hip-flexor stretch. Use the approved stance side, fingertips near support. Shift forward gently and hold."
Later-set script: "Hip-flexor stretch." Target: "Hold for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support; Use actual sturdy support, not chair-specific copy.
Repeat sequence: ex-supported-hip-flexor-stretch-first-v2 -> target-supported-hip-flexor-stretch-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/mobilityDrills.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Supported Side Step (supported-side-step)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 30s.
Equipment: counter. Support: counter, nearby sturdy support. Orientation: front.
Laterality: both_sides_not_scored_separately. Side schedule: move laterally within the set; no left/right set schedule. Production supports proposed side behavior: yes.
First-use script: "Supported side step. Stand near a counter. Step to the side, bring the other foot in, and continue with control."
Later-set script: "Supported side step." Target: "Move for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support, balance_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-supported-side-step-first-v2 -> target-supported-side-step-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/lateralStability.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Thoracic Rotation (thoracic-rotation)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 20s.
Equipment: none. Support: none. Orientation: front.
Laterality: alternating_within_set. Side schedule: alternate naturally within the set; no left/right set schedule. Production supports proposed side behavior: yes.
First-use script: "Thoracic rotation. Sit or stand tall with arms crossed. Rotate one way, return to center, then rotate the other way."
Later-set script: "Thoracic rotation." Target: "Move for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: none; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-thoracic-rotation-first-v2 -> target-thoracic-rotation-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/mobilityDrills.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Supported Toe Raise (toe-raise-supported)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 30s.
Equipment: wall, counter. Support: wall, counter. Orientation: side.
Laterality: bilateral_simultaneous. Side schedule: none. Production supports proposed side behavior: yes.
First-use script: "Supported toe raise. Keep heels down, lift the front of your feet, then lower slowly."
Later-set script: "Supported toe raise." Target: "Move for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-toe-raise-supported-first-v2 -> target-toe-raise-supported-v2.
Freeze: ready_for_founder_review. Sources: src/exercises/heelRaise.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

### Wall Calf Stretch (wall-calf-stretch)

Release: v1_core. Set type: timer. Sets: 2. Target: 30 sec. Rest: 15s.
Equipment: wall. Support: wall. Orientation: side.
Laterality: asymmetric_stance_single_side_per_set. Side schedule: not specified in production. Production supports proposed side behavior: no.
First-use script: "Wall calf stretch. Hands on the wall, approved leg back, heel down. Lean forward gently and hold."
Later-set script: "Calf stretch." Target: "Hold for thirty seconds."
Set-plan policy: Do not speak set count by default. Rest and final-set logic provide pacing; see FD-006.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support; No extra exercise-specific line beyond family safety and exact instruction.
Repeat sequence: ex-wall-calf-stretch-first-v2 -> target-wall-calf-stretch-v2.
Freeze: blocked_by_decision (FD-001). Sources: src/exercises/mobilityDrills.ts; src/exercises/ladders.ts; src/training/safetyCues.ts.

## 12. Safety and Equipment-Family Policy

- Layer A universal_session_safety: once per training session.
- Layer B equipment_family_first_use: once per relevant family per session.
- Layer C exercise_specific_safety: only where material risk is not covered by instruction/family cue.
- Layer D reactive_recovery: only on actual problem.
- Door-anchor safety subsumes general long-band safety for the anchored setup.
- Balance support subsumes generic support when both would repeat the same action.
- Chair family is only used when sitting on a chair, not merely when a chair could be optional support.
- Static stretch safety uses support/comfort language, not chair-specific lines unless the chair is actually used.

## 13. Shared Camera, Orientation, and Recovery

Preflight prompts remain action-only. Framing readiness says "You're in position. Stay there." Tracking loss uses direct action language and a fresh countdown after recovery.

## 14. Countdown and Audible-Go Contract

Countdown is three, two, one, go. The active measurement window starts on audible go, not at countdown scheduling time. A recovery after active interruption requires a fresh countdown.

## 15. Movement Check-Up Contracts

- chair-stand-30s: chair-stand-intro-v2 -> chair-stand-setup-v2. Side policy: Current legacy grader dynamically selects the reliable near side and does not persist side metadata. Freeze: ready_for_founder_review.
- balance-ladder: balance-intro-v2 -> balance-setup-v2. Side policy: Current legacy ladder does not select a standing side except single-leg stage; side is not persisted. Freeze: blocked_by_decision (FD-003).
- shoulder-flexion-peak: shoulder-intro-v2 -> shoulder-setup-v2. Side policy: Current legacy grader dynamically selects the reliable near side; V2 recommends baseline selected side plus persistence before official retest comparability. Freeze: blocked_by_decision (FD-002).
- hinge-reach: hinge-intro-v2 -> hinge-setup-v2. Side policy: Current legacy grader dynamically selects the reliable near side; V2 should persist selected side or mark reduced comparability. Freeze: blocked_by_decision (FD-002).
- timed-up-and-go: tug-intro-v2 -> tug-setup-v2. Side policy: Not side-comparable; path geometry and standard/short-path flag matter more than limb side. Freeze: ready_for_founder_review.

## 16. Micro-Check Contracts

- chair-power: microcheck-chair-v2. Stops at five accepted chair stands or 45s hard cap. Side policy: Dynamic near side; no official side claim. Freeze: ready_for_founder_review.
- single-leg-balance: microcheck-balance-v2. Single hold with 40s target and 45s hard cap. Side policy: Standing leg is not currently persisted; use FD-002 policy before official comparability copy. Freeze: blocked_by_decision.
- mobility-reach: microcheck-mobility-v2. RomSetGrader until hard cap; no fixed valid-time cue in current runner. Side policy: Extended leg side is not persisted; use FD-002/FD-001 policy before official comparability copy. Freeze: blocked_by_decision.

## 17. Pause, Resume, Repeat, Retry, Skip, Discard, and Cancel

- pause: result_transition, cue pause-v2. Current behavior: Screen stops voice and shifts timing on resume..
- resume: result_transition, cue resume-v2. Current behavior: Frame timestamps are shifted to preserve timers..
- repeat: instruction, cue firstUseCue + targetCue. Current behavior: Repeats current movement instruction keys and safety in training; movement instructions in check-up..
- retry_setup: result_transition, cue retry-setup-v2. Current behavior: retrySetup resets preflight/setup issue state..
- skip: result_transition, cue skip-v2. Current behavior: Records skipped item and advances; no voice line currently emitted by player..
- discard: result_transition, cue discard-v2. Current behavior: Visible modal cancellation; voice stopped..

## 18. Existing Cue Migration

- framing-ready: rewrite_existing_key. Replace technical phrasing with "You're in position. Stay there."
- microcheck-complete: rewrite_existing_key. Replace logged language with "Check complete."
- training-intro: rewrite_existing_key. Remove defensive screen-for-backup phrasing.
- session-complete: rewrite_existing_key. Remove generic hydration/day sign-off.
- tracking_pause_and_reset: rewrite_existing_key. Replace reset/tracking jargon in user-facing recovery copy.
- ex-step-up: rewrite_existing_key. Blocked by FD-005 until leg-switch semantics are approved.
- ex-balance: rewrite_existing_key. Exact balance levels need stance/side-specific scripts.
- ex-hamstring-reach: rewrite_existing_key. Training and micro-check side policy require FD-001/FD-002.
- balance-semi-tandem: conditional_only. Asset exists but semi-tandem is not in DEFAULT_BALANCE_STAGES.

## 19. V2 Cue Manifest and Asset Count

V1 proposed count: 186. V2 proposed active count: 172. Net change: -14. Estimated two-voice recordings: 344.
Count by category:
- session_intro: 1
- safety.universal: 1
- setup.prompt: 6
- orientation: 3
- countdown: 4
- active_stop: 1
- tracking_loss: 1
- tracking_recovery: 1
- control_or_completion: 9
- progress: 2
- safety.equipment_family: 8
- assessment_instruction: 11
- result: 2
- assessment_stage: 8
- micro_check_instruction: 3
- exact_training_instruction: 37
- later_set_reminder: 37
- target: 37

## 20. Script Freeze Criteria

Freeze only after founder decisions, line-by-line human review, a small Clara preview, listening revisions, and cue-key/script lock. Blocked rows remain out of preview and generation.

## 21. Corrected Implementation Order

- Phase 0: founder/protocol decisions: No production code. Review FD-001 through FD-007 and record decisions. Approval gate: Founder decisions completed.
- Phase 1: script line review and freeze: Human line-by-line review of script review V2. No external audio API. Approval gate: Approved script manifest and freeze list.
- Phase 2: small Clara preview pack: Generate representative Clara sample only after explicit later approval. Approval gate: Listening review request.
- Phase 3: preview listening revisions: Revise scripts based on listening review. Approval gate: Approved revisions.
- Phase 4: cue schema and feature flag: Add V2 cue keys/policies behind a feature flag. Approval gate: Script freeze.
- Phase 5: exact training mapping: Map exact training levels to approved V2 cues. Approval gate: Phase 4 complete.
- Phase 6: safety and controls: Implement de-duplicated family safety and control confirmations. Approval gate: Approved safety copy.
- Phase 7: assessment side metadata and protocol version work: Persist side metadata and comparability markers. Approval gate: FD-002 approved.
- Phase 8: both-voice generation: Generate full Clara and Marcus V2 pack after implementation is ready. Approval gate: Final manifest freeze.
- Phase 9: timeline re-audit and automated tests: Re-run timeline audit with real durations and update docs. Approval gate: Full audio generated.
- Phase 10: Android/iOS QA and beta rollout: Device QA on camera/audio behavior before beta. Approval gate: Automated checks pass.

## 22. Preview and Audio Generation Plan

Do not generate audio now. After explicit later approval, generate a small Clara preview pack covering session intro, universal safety, one bodyweight instruction, one balance instruction, one band instruction, one door-anchor instruction, one check-up instruction, one micro-check instruction, framing ready, tracking lost/recovered, pause, skip, completion, and one composable target sequence. Full Clara and Marcus generation waits until after preview revisions and implementation readiness.

## 23. Physical-Device QA

- Android physical-device QA: first-use training sequence, pause/resume, tracking loss, and rep SFX overlap.
- iOS physical-device QA: audio mode does not interrupt camera session; Release build sanity check.
- Camera readiness QA: side and front orientation prompts recover without stale speech.
- Audio QA: Clara preview first, then Marcus parity after script freeze.

## 24. Acceptance Criteria

- Founder decisions FD-001 through FD-007 reviewed before script freeze.
- No production code or audio generation happens from this V2 documentation task.
- Every exact training level has a contract row.
- Every active manifest row resolves to one canonical policy id.
- No bilateral training movement is assigned a left/right alternating set schedule.
- Complete composed timelines exist for both voices and 0/100/250 ms gaps.
- Blocked scripts carry blockingDecisionIds and are not marked ready for preview.
- Human line-by-line script approval precedes implementation and full audio generation.

## 25. Validation and Source Index

Validation summary: {"duplicateActiveCueKeys":[],"missingPolicyIds":[],"blockedRowsMarkedReadyForPreview":[],"bilateralRowsWithSideSwitch":[],"activeScriptsWithProhibitedImplementationLanguage":[],"allExactTrainingLevelsCovered":true,"exactTrainingLevelCount":37,"defaultBattery":["chair-stand-30s","balance-ladder","shoulder-flexion-peak","hinge-reach"],"betaBatteryWithTug":["chair-stand-30s","timed-up-and-go","balance-ladder","shoulder-flexion-peak","hinge-reach"],"movementProfileV2Battery":["chair-rise-30s-v2","one-leg-balance-45s-v2","active-shoulder-reach-v2","hinge-reach"]}.
Source index:
- docs/audits/PEARL_VOICE_CUE_INVENTORY.md
- docs/audits/PEARL_VOICE_CUE_INVENTORY.json
- docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md
- docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json
- docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv
- docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.md
- docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.json
- docs/specs/PEARL_VOICE_SCRIPT_REVIEW.md
- docs/specs/PEARL_VOICE_SCRIPT_MANIFEST.csv
- src/audio/cues.ts
- src/audio/manifest.ts
- src/audio/voicePlayer.ts
- src/training/sessionPlayer.ts
- src/training/safetyCues.ts
- src/training/safetyCueDefinitions.ts
- src/assessment/sessionController.ts
- src/checkup/checkup.ts
- src/training/microCheck.ts
- src/exercises/*
- src/movements/*
