# Hale Voice Experience Specification V2.1

## 1. Status and Executive Summary

Status: ready for human script review. All seven founder decisions are approved. This document does not authorize production implementation, production manifest changes, tests, package changes, audio generation, or external API calls.
V2.1 covers 37 exact training contracts, 189 active intended cue assets/fragments, 4 conditional legacy cues, and 1656 timeline rows. Hard-duration failures at 250 ms gaps: 0. Founder-decision blockers: 0.

## 2. Approved Founder Decisions

- FD-001: approved. Unilateral and asymmetric training uses a both-sides round. Interpretation: A round contains work on both sides before rest; first side may alternate by round; dose conversion is separate.
- FD-002: approved. Reliable, comfortable baseline side is persisted for official comparability. Interpretation: Baseline confirms the measurable comfortable side; retests reuse it; opposite side is reduced comparability; unknown legacy side remains raw-only.
- FD-003: approved. Default unsupervised home balance is eyes-open only. Interpretation: Default protocol has feet-together, semi-tandem, tandem, and single-leg eyes-open stages; eyes-closed is conditional legacy only.
- FD-004: approved. Initial mini-band lateral walk uses the band above the knees. Interpretation: Above-knees placement is part of the first level; ankle placement is a later progression; both directions occur inside one timed set.
- FD-005: approved. Step-ups alternate leading leg every repetition. Interpretation: Target is 12 total reps, alternating lead leg each rep, returning both feet to the floor before the opposite leg leads.
- FD-006: approved. Do not speak total set count during setup. Interpretation: No setup line announces set count. Set count remains visual; last-set cue may remain.
- FD-007: approved. Add a one-time floor-transfer readiness gate. Interpretation: Gate asks whether the user can safely get down to the floor and back up without assistance; no/unsure substitutes floor exercises.

## 3. V2-to-V2.1 Correction Ledger

| Issue | Correction | Status |
| --- | --- | --- |
| V21-001 | FD-001 through FD-007 are recorded as approved and former decision blockers are replaced by implementation requirements. | corrected |
| V21-002 | Seated band row, step-up, chair-power micro check, and all active timelines are rewritten to pass hard maximums at 250 ms gaps. | corrected |
| V21-003 | Most-specific-wins hierarchy subsumes duplicate equipment-family safety lines. | corrected |
| V21-004 | Ready confirmation is now a final-position cue after the movement start position is reached. | corrected |
| V21-005 | Active scripts remove technical, placeholder, and implementation-state wording. | corrected |
| V21-006 | Mini-band lateral walk is classified as both directions inside one timed set, with above-knees placement. | corrected |
| V21-007 | New default balance protocol is eyes-open only, includes semi-tandem, and preserves eyes-closed content as conditional legacy. | corrected |
| V21-008 | Total set-count setup lines are retired; last-set remains only as a pacing cue. | corrected |
| V21-009 | No cue is audio-approved; active scripts are ready for human review or marked implementation-required before integrated preview. | corrected |

## 4. Product and Voice Principles

- Voice-first, not voice-saturated.
- Camera measurement remains silent unless a high-confidence user action is needed.
- General visibility and final start-position readiness are separate gates.
- Training-side both-sides rounds and official measurement-side persistence are separate models.
- No generated line is audio-approved until human listening review occurs.
- No runtime TTS or external API call belongs in the session path.

## 5. Human Review and Implementation Status Model

- `ready_for_human_review`: script is internally consistent and ready for line review, but not audio-approved.
- `implementation_required_before_preview`: script can be reviewed, but integrated runtime preview must wait for the listed requirement.
- `conditional_legacy_only`: preserved only for legacy/beta flows and absent from the default path.
- `retired`: should not be generated or emitted for V2.1.

## 6. Canonical Cue Policy

| Policy | Priority | Blocks | Droppable | Purpose |
| --- | --- | --- | --- | --- |
| critical_stop | 100 | true | false | Immediate stop, active tracking loss, active window close. |
| critical_window | 90 | true | false | Countdown, go, and active timing boundary cues. |
| result_transition | 70 | true | false | Pause, resume, retry, skip, discard, completion, result, and between-item transitions. |
| instruction | 60 | true | false | Exact setup instruction, target, and first-use safety. |
| setup_recovery | 50 | false | true | Preflight, orientation correction, final-position readiness, and recovery setup. |
| low_reassurance | 20 | false | true | Optional progress and nonessential reassurance. |

## 7. Correct Setup and Final-Position Sequence

- standing_general: item transition/orientation -> general visibility preflight -> first-use setup or later reminder -> movement-specific final-position readiness -> target if needed -> countdown -> active work
- material_setup: item/equipment transition -> one most-specific first-use safety line if not absorbed -> movement setup instruction -> user assumes final start position -> movement-specific readiness -> final confirmation only after readiness passes -> target -> countdown -> active work
- later_sets: concise later-set reminder -> side cue if side changes -> dynamic target if needed -> fresh countdown
- recovery: stop active timing -> short recovery action -> re-establish final-position readiness -> recovery confirmation -> fresh countdown -> fresh valid attempt

## 8. Timing Budgets and Complete Timelines

| Budget | Target ms | Hard max ms | Notes |
| --- | --- | --- | --- |
| training_intro_universal_safety | 12000 | 16000 | Training session entry plus one universal safety line. |
| ordinary_first_use_pre_countdown | 12000 | 16000 | Normal first-use setup after visibility passes. |
| complex_equipment_first_use_pre_countdown | 16000 | 20000 | Chair, floor, step, door-anchor, or band setup. |
| later_set_reminder | 4000 | 6000 | Later set or round reminder. |
| repeat_instructions | 10000 | 14000 | Repeat instructions excluding set count. |
| checkup_assessment_setup | 12000 | 16000 | Assessment setup after visibility. |
| micro_check_setup | 7000 | 10000 | Micro-check setup after visibility. |
| control_confirmation | 2000 | 3500 | Pause/resume/skip/retry/complete. |
| tracking_loss | 3500 | 5000 | Tracking-loss action. |
| tracking_recovery | 2500 | 4000 | Tracking-recovery confirmation. |

Longest ordinary first-use: training-neck-rotation-first-use-cold-clara-gap250 at 11120 ms. Longest complex-equipment first-use: training-step-up-first-use-cold-clara-gap250 at 15390 ms. Longest check-up setup: checkup-chair-stand-setup-clara-gap250 at 14000 ms. Longest micro-check setup: micro-chair-power-setup-clara-gap250 at 7570 ms.

## 9. Safety Subsumption and Equipment Families

| Family | Parent | Cue | Subsumes | Rule |
| --- | --- | --- | --- | --- |
| chair_seat |  | equip-chair-stable-v21 |  | Chair instruction absorbs stability when it already says sturdy chair or controlled sit. |
| generic_support |  | equip-support-close-v21 |  | Used only when no more-specific support family applies and the instruction does not already say support is near. |
| balance_support | generic_support | equip-balance-support-v21 | generic_support | Balance support subsumes generic support. |
| step_or_stair | generic_support | equip-step-stable-v21 | generic_support | Step/stair safety subsumes generic support. |
| long_band_handheld_or_foot_anchored |  | equip-long-band-v21 |  | Used for handheld or foot-anchored band setup unless exact instruction absorbs it. |
| door_anchor_band | long_band_handheld_or_foot_anchored | equip-door-anchor-v21 | long_band_handheld_or_foot_anchored | Door-anchor safety subsumes general long-band safety. |
| mini_band_above_knees |  |  | balance_support | Mini-band placement/control is stated once in the exact instruction. |
| floor_eligible_user |  | equip-floor-transition-v21 | generic_support | Floor gate subsumes repeated transfer warnings; eligible users hear one concise transition. |

## 10. Training Laterality and Both-Sides Round Model

A unilateral/asymmetric training round is complete only after both sides finish. Round 1 may start left, round 2 right, round 3 left. Rest follows the second side. Mini-band lateral walk is excluded because both directions happen inside the timed set. Step-up uses alternating lead leg per rep rather than a side round.

## 11. Dose-Preservation Requirements

| Exercise | Current dose | Proposed structure | Must change | Validation |
| --- | --- | --- | --- | --- |
| balance-single-leg-hold | 45 total hold seconds | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |
| balance-tandem-hold | 60 total hold seconds | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |
| chair-supported-split-squat | 16 total reps/events | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |
| seated-hamstring-reach | 24 total ROM-window seconds | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |
| supported-hip-flexor-stretch | 60 total timed seconds | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |
| wall-calf-stretch | 60 total timed seconds | One round contains the prescribed work on both sides, then rest. | true | Confirm total time/reps are not silently doubled; compare perceived effort and progression evidence after conversion. |

## 12. Exact Training-Level Contracts

### Feet-Together Hold (balance-feet-together-hold)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: hold. Current sets: 3. Target: 20 sec hold. Current total dose: 60 total hold seconds.
Laterality: both_sides_not_scored_separately. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Feet-together hold. Stand with feet together, fingertips near support, eyes open. / You're set. / Hold for twenty seconds.
Later-set order: Feet-together hold. / Hold for twenty seconds.
Side change: None.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: balance_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Feet-together hold. Stand with feet together, fingertips near support, eyes open. / Hold for twenty seconds.
Durations: Clara 8240 ms, Marcus 8060 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Single-Leg Hold (balance-single-leg-hold)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: hold. Current sets: 3. Target: 15 sec hold. Current total dose: 45 total hold seconds.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Single-leg hold. Keep support close. / Start on your left leg. Lift your right foot slightly. / You're set. / Hold for [duration].
Later-set order: Single-leg hold. / Hold for [duration].
Side change: Switch legs.
Progress: Five seconds left at 10 seconds elapsed.
Safety: balance_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Single-leg hold. Keep support close. / Start on your left leg. Lift your right foot slightly. / Hold for [duration].
Durations: Clara 9990 ms, Marcus 9780 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

### Tandem Hold (balance-tandem-hold)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: hold. Current sets: 3. Target: 20 sec hold. Current total dose: 60 total hold seconds.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Tandem hold. Keep support close. / Place your left foot in front, heel to toe. / You're set. / Hold for [duration].
Later-set order: Tandem hold. / Hold for [duration].
Side change: Switch foot positions.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: balance_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Tandem hold. Keep support close. / Place your left foot in front, heel to toe. / Hold for [duration].
Durations: Clara 9270 ms, Marcus 9080 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

### Band Pull-Apart (band-pull-apart)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Band pull-apart. Hold a light band at chest height. Pull your hands wide, then return slowly. / Check the band first and keep it away from your face. / You're set. / Move for thirty seconds.
Later-set order: Band pull-apart. / Move for thirty seconds.
Side change: None.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: long_band_handheld_or_foot_anchored; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Band pull-apart. Hold a light band at chest height. Pull your hands wide, then return slowly. / Move for thirty seconds.
Durations: Clara 14670 ms, Marcus 14330 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Chair-Supported Split Squat (chair-supported-split-squat)

Release: v1_optional. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 8 reps. Current total dose: 16 total reps/events.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported split squat. Keep fingertips near support. / Left foot forward, small split stance. / You're set. / Aim for [reps] reps.
Later-set order: Supported split squat. / Aim for [reps] reps.
Side change: Switch sides.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported split squat. Keep fingertips near support. / Left foot forward, small split stance. / Aim for [reps] reps.
Durations: Clara 11430 ms, Marcus 11180 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

### Bridge Hold (glute-bridge-hold)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: hold. Current sets: 3. Target: 20 sec hold. Current total dose: 60 total hold seconds.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Bridge hold. Lie on your back, knees bent, feet flat. Lift your hips and hold. / Move down to the floor and settle into the start position. / You're set. / Hold for twenty seconds.
Later-set order: Bridge hold. / Hold for twenty seconds.
Side change: None.
Progress: Halfway at 10 seconds; five seconds left at 15 seconds.
Safety: floor_eligible_user; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Bridge hold. Lie on your back, knees bent, feet flat. Lift your hips and hold. / Hold for twenty seconds.
Durations: Clara 13950 ms, Marcus 13630 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-FLOOR-GATE, IR-VOICE-FINAL-POSITION-READINESS, IR-VOICE-SAFETY-SUBSUMPTION.

### Glute Bridge (glute-bridge-reps)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 12 reps. Current total dose: 36 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips, then lower with control. / Move down to the floor and settle into the start position. / You're set. / Aim for twelve reps.
Later-set order: Glute bridge. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: floor_eligible_user; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips, then lower with control. / Aim for twelve reps.
Durations: Clara 14670 ms, Marcus 14330 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-FLOOR-GATE, IR-VOICE-FINAL-POSITION-READINESS, IR-VOICE-SAFETY-SUBSUMPTION.

### Heel Raise (heel-raise-free)

Release: v1_core. Intended V2.1 reachability: v1_core. Set type: reps. Current sets: 3. Target: 18 reps. Current total dose: 54 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly. / You're set. / Aim for eighteen reps.
Later-set order: Heel raise. / Aim for eighteen reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly. / Aim for eighteen reps.
Durations: Clara 8960 ms, Marcus 8760 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Supported Heel Raise (heel-raise-supported)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 15 reps. Current total dose: 30 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported heel raise. Fingertips near support. Rise onto the balls of your feet, then lower slowly. / You're set. / Aim for fifteen reps.
Later-set order: Supported heel raise. / Aim for fifteen reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported heel raise. Fingertips near support. Rise onto the balls of your feet, then lower slowly. / Aim for fifteen reps.
Durations: Clara 9680 ms, Marcus 9460 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Hip Hinge (hip-hinge-free)

Release: v1_core. Intended V2.1 reachability: v1_core. Set type: reps. Current sets: 3. Target: 12 reps. Current total dose: 36 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Hip hinge. Feet under hips. Send hips back with a long spine, then stand tall. / You're set. / Aim for twelve reps.
Later-set order: Hip hinge. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Hip hinge. Feet under hips. Send hips back with a long spine, then stand tall. / Aim for twelve reps.
Durations: Clara 9320 ms, Marcus 9110 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Wall-Tap Hinge (hip-hinge-wall)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 10 reps. Current total dose: 20 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Wall-tap hinge. Stand a step from the wall. Send hips back to tap the wall, then stand tall. / You're set. / Aim for ten reps.
Later-set order: Wall-tap hinge. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Wall-tap hinge. Stand a step from the wall. Send hips back to tap the wall, then stand tall. / Aim for ten reps.
Durations: Clara 10760 ms, Marcus 10510 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### March in Place (loaded-march)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 16 reps. Current total dose: 48 total reps/events.
Laterality: alternating_within_set. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: March in place. Stand tall near support and march with a steady rhythm. / You're set. / Aim for sixteen reps.
Later-set order: March in place. / Aim for sixteen reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: balance_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: March in place. Stand tall near support and march with a steady rhythm. / Aim for sixteen reps.
Durations: Clara 8600 ms, Marcus 8410 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Loaded Sit-to-Stand (loaded-sit-to-stand)

Release: v1_optional. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 8 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Loaded sit-to-stand. Hold the load close to your chest. Stand fully, then sit with control. / You're set. / Aim for eight reps.
Later-set order: Loaded sit-to-stand. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Loaded sit-to-stand. Hold the load close to your chest. Stand fully, then sit with control. / Aim for eight reps.
Durations: Clara 10040 ms, Marcus 9810 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Mini-Band Lateral Walk (mini-band-lateral-walk)

Release: v1_optional. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: bilateral_sequential_within_set. Side/round model: both directions inside one timed set. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Mini-band lateral walk. Band above your knees. Take small controlled steps both directions. / You're set. / Move for thirty seconds.
Later-set order: Mini-band lateral walk. / Move for thirty seconds.
Side change: None.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: mini_band_above_knees; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Mini-band lateral walk. Band above your knees. Take small controlled steps both directions. / Move for thirty seconds.
Durations: Clara 8960 ms, Marcus 8760 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Neck Rotations (neck-rotation)

Release: v1_optional. Intended V2.1 reachability: v1_optional. Set type: rom. Current sets: 1. Target: 14 sec capture. Current total dose: 14 total ROM-window seconds.
Laterality: alternating_within_set. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Neck rotations. Face the phone, sit or stand tall, and slowly look over one shoulder, then the other. / You're set. / Move slowly until I say stop.
Later-set order: Neck rotations. / Move slowly until I say stop.
Side change: None.
Progress: No active progress cue; end or return cue only.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Neck rotations. Face the phone, sit or stand tall, and slowly look over one shoulder, then the other. / Move slowly until I say stop.
Durations: Clara 11120 ms, Marcus 10860 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Band Overhead Press (overhead-press-band)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 12 reps. Current total dose: 36 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Band overhead press. Stand tall with light band tension. Press overhead, then return slowly. / Check the band first and keep it away from your face. / You're set. / Aim for twelve reps.
Later-set order: Band overhead press. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: long_band_handheld_or_foot_anchored; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Band overhead press. Stand tall with light band tension. Press overhead, then return slowly. / Aim for twelve reps.
Durations: Clara 13590 ms, Marcus 13280 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Overhead Reach (overhead-reach)

Release: v1_core. Intended V2.1 reachability: v1_core. Set type: reps. Current sets: 2. Target: 12 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower. / You're set. / Aim for twelve reps.
Later-set order: Overhead reach. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower. / Aim for twelve reps.
Durations: Clara 8960 ms, Marcus 8760 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Incline Push-Up (push-up-incline)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 10 reps. Current total dose: 30 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Incline push-up. Hands on a stable counter or sturdy chair. Lower in with control, then press away. / You're set. / Aim for ten reps.
Later-set order: Incline push-up. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Incline push-up. Hands on a stable counter or sturdy chair. Lower in with control, then press away. / Aim for ten reps.
Durations: Clara 10400 ms, Marcus 10160 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Push-Up (push-up-standard)

Release: v1_optional. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 8 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Push-up. Start from the floor position. Lower with control, then press up. / Move down to the floor and settle into the start position. / You're set. / Aim for eight reps.
Later-set order: Push-up. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: floor_eligible_user; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Push-up. Start from the floor position. Lower with control, then press up. / Aim for eight reps.
Durations: Clara 13230 ms, Marcus 12930 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-FLOOR-GATE, IR-VOICE-FINAL-POSITION-READINESS, IR-VOICE-SAFETY-SUBSUMPTION.

### Wall Push-Up (push-up-wall)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 10 reps. Current total dose: 20 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Wall push-up. Hands on the wall. Lower in with control, then press away. / You're set. / Aim for ten reps.
Later-set order: Wall push-up. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: generic_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Wall push-up. Hands on the wall. Lower in with control, then press away. / Aim for ten reps.
Durations: Clara 8960 ms, Marcus 8760 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Seated Band Row (seated-band-row)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 10 reps. Current total dose: 20 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Seated band row. Sit tall with the band anchored under both feet. Pull elbows back, then return slowly. / You're set. / Aim for ten reps.
Later-set order: Seated band row. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: long_band_handheld_or_foot_anchored; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Seated band row. Sit tall with the band anchored under both feet. Pull elbows back, then return slowly. / Aim for ten reps.
Durations: Clara 10400 ms, Marcus 10160 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Seated Hamstring Reach (seated-hamstring-reach)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: rom. Current sets: 2. Target: 12 sec capture. Current total dose: 24 total ROM-window seconds.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Seated hamstring reach. Sit tall at the chair edge. / Extend your left leg, heel on the floor. / You're set. / Reach gently and hold until I say relax.
Later-set order: Seated hamstring reach. / Reach gently and hold until I say relax.
Side change: Switch legs.
Progress: No active progress cue; end or return cue only.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Seated hamstring reach. Sit tall at the chair edge. / Extend your left leg, heel on the floor. / Reach gently and hold until I say relax.
Durations: Clara 12150 ms, Marcus 11880 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

### Squat (squat-free)

Release: v1_core. Intended V2.1 reachability: v1_core. Set type: reps. Current sets: 3. Target: 12 reps. Current total dose: 36 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Squat. Feet about hip width. Lower as if to sit, then stand with control. / You're set. / Aim for twelve reps.
Later-set order: Squat. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Squat. Feet about hip width. Lower as if to sit, then stand with control. / Aim for twelve reps.
Durations: Clara 8960 ms, Marcus 8760 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Loaded Squat (squat-loaded)

Release: v1_optional. Intended V2.1 reachability: v1_optional. Set type: reps. Current sets: 3. Target: 8 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Loaded squat. Hold the load close to your chest. Lower into a squat, then stand with control. / You're set. / Aim for eight reps.
Later-set order: Loaded squat. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Loaded squat. Hold the load close to your chest. Lower into a squat, then stand with control. / Aim for eight reps.
Durations: Clara 10040 ms, Marcus 9810 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Slow-Lower Squat (squat-slow-eccentric)

Release: v1_optional. Intended V2.1 reachability: v1_optional. Set type: reps. Current sets: 3. Target: 8 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Slow-lower squat. Lower slowly, then stand with control. / You're set. / Aim for eight reps.
Later-set order: Slow-lower squat. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Slow-lower squat. Lower slowly, then stand with control. / Aim for eight reps.
Durations: Clara 7160 ms, Marcus 7010 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Supported Squat (squat-supported)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 10 reps. Current total dose: 20 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported squat. Stand near sturdy support. Lower as if to sit, then stand with control. / You're set. / Aim for ten reps.
Later-set order: Supported squat. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported squat. Stand near sturdy support. Lower as if to sit, then stand with control. / Aim for ten reps.
Durations: Clara 9320 ms, Marcus 9110 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Standing Band Row (standing-band-row)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 10 reps. Current total dose: 30 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Standing band row. Face the secure door anchor in a stable stance. Pull elbows back, then return slowly. / Use a secure closed door anchor and test light tension first. / You're set. / Aim for ten reps.
Later-set order: Standing band row. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: door_anchor_band; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Standing band row. Face the secure door anchor in a stable stance. Pull elbows back, then return slowly. / Aim for ten reps.
Durations: Clara 15030 ms, Marcus 14680 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Step-Up (step-up)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 12 total alternating reps per set. Current total dose: 36 total reps/events.
Laterality: alternating_lead_leg_each_rep. Side/round model: alternate leading leg every rep within the set. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Step-up. Use the lowest stable step with support nearby. Alternate the leading leg each rep, returning both feet to the floor. / Use the lowest stable step, with support nearby. / You're set. / Do twelve total reps.
Later-set order: Step-up. Alternate the leading leg each rep. / Do twelve total reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: step_or_stair; emitted family cue count 1. Most-specific family cue remains because setup action is not fully contained in the instruction.
Repeat instructions: Step-up. Use the lowest stable step with support nearby. Alternate the leading leg each rep, returning both feet to the floor. / Do twelve total reps.
Durations: Clara 15390 ms, Marcus 15030 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-STEP-ALTERNATION, IR-VOICE-SAFETY-SUBSUMPTION.

### Cushion Sit-to-Stand (sts-cushion)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 2. Target: 8 reps. Current total dose: 16 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit with control. / You're set. / Aim for eight reps.
Later-set order: Cushion sit-to-stand. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit with control. / Aim for eight reps.
Durations: Clara 10040 ms, Marcus 9810 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Power Sit-to-Stand (sts-power)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 12 reps. Current total dose: 36 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Power sit-to-stand. Sit tall, drive up briskly to standing, then sit with control. / You're set. / Aim for twelve reps.
Later-set order: Power sit-to-stand. / Aim for twelve reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Power sit-to-stand. Sit tall, drive up briskly to standing, then sit with control. / Aim for twelve reps.
Durations: Clara 9320 ms, Marcus 9110 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Slow-Lower Sit-to-Stand (sts-slow-eccentric)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 8 reps. Current total dose: 24 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Slow-lower sit-to-stand. Stand fully, then lower slowly and steadily before the next rep. / You're set. / Aim for eight reps.
Later-set order: Slow-lower sit-to-stand. / Aim for eight reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Slow-lower sit-to-stand. Stand fully, then lower slowly and steadily before the next rep. / Aim for eight reps.
Durations: Clara 9680 ms, Marcus 9460 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Sit-to-Stand (sts-standard)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: reps. Current sets: 3. Target: 10 reps. Current total dose: 30 total reps/events.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Sit-to-stand. Sit tall in the middle of the chair, feet flat. Stand fully, then sit with control. / You're set. / Aim for ten reps.
Later-set order: Sit-to-stand. / Aim for ten reps.
Side change: None.
Progress: Accepted reps use rep-credit SFX only; no spoken rep count by default.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Sit-to-stand. Sit tall in the middle of the chair, feet flat. Stand fully, then sit with control. / Aim for ten reps.
Durations: Clara 10760 ms, Marcus 10510 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Supported Hip Flexor Stretch (supported-hip-flexor-stretch)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported hip-flexor stretch. Keep fingertips near support. / Step your left foot forward and shift gently into the stretch. / You're set. / Hold for [duration].
Later-set order: Supported hip-flexor stretch. / Hold for [duration].
Side change: Switch sides.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: chair_seat; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported hip-flexor stretch. Keep fingertips near support. / Step your left foot forward and shift gently into the stretch. / Hold for [duration].
Durations: Clara 11070 ms, Marcus 10830 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

### Supported Side Step (supported-side-step)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: both_sides_not_scored_separately. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported side step. Stand near a counter. Step to the side, bring the other foot in, and continue with control. / You're set. / Move for thirty seconds.
Later-set order: Supported side step. / Move for thirty seconds.
Side change: None.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: balance_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported side step. Stand near a counter. Step to the side, bring the other foot in, and continue with control. / Move for thirty seconds.
Durations: Clara 11120 ms, Marcus 10860 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Thoracic Rotation (thoracic-rotation)

Release: v1_core. Intended V2.1 reachability: v1_core. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: alternating_within_set. Side/round model: no side-specific schedule. Runtime readiness: ready_after_audio_generation.
First-use spoken order: Thoracic rotation. Sit or stand tall with arms crossed. Rotate one way, return to center, then rotate the other way. / You're set. / Move for thirty seconds.
Later-set order: Thoracic rotation. / Move for thirty seconds.
Side change: None.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: none; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Thoracic rotation. Sit or stand tall with arms crossed. Rotate one way, return to center, then rotate the other way. / Move for thirty seconds.
Durations: Clara 11120 ms, Marcus 10860 ms at 250 ms gap model for first-use sequence.
Implementation requirements: None.

### Supported Toe Raise (toe-raise-supported)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: bilateral_simultaneous. Side/round model: no side-specific schedule. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Supported toe raise. Keep heels down, lift the front of your feet, then lower slowly. / You're set. / Move for thirty seconds.
Later-set order: Supported toe raise. / Move for thirty seconds.
Side change: None.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Supported toe raise. Keep heels down, lift the front of your feet, then lower slowly. / Move for thirty seconds.
Durations: Clara 9320 ms, Marcus 9110 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-SAFETY-SUBSUMPTION.

### Wall Calf Stretch (wall-calf-stretch)

Release: v1_core. Intended V2.1 reachability: withheld_until_implementation_requirement_met. Set type: timer. Current sets: 2. Target: 30 sec. Current total dose: 60 total timed seconds.
Laterality: both_sides_round_required. Side/round model: round_complete_after_left_and_right_work; first side may alternate by round. Runtime readiness: implementation_required_before_preview.
First-use spoken order: Wall calf stretch. Hands on the wall. / Step your left leg back, heel down. / You're set. / Hold for [duration].
Later-set order: Wall calf stretch. / Hold for [duration].
Side change: Switch sides.
Progress: Halfway at 15 seconds; five seconds left at 25 seconds.
Safety: generic_support; emitted family cue count 0. Exact setup instruction absorbs the needed family action or no family cue is needed.
Repeat instructions: Wall calf stretch. Hands on the wall. / Step your left leg back, heel down. / Hold for [duration].
Durations: Clara 9270 ms, Marcus 9080 ms at 250 ms gap model for first-use sequence.
Implementation requirements: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION, IR-VOICE-SAFETY-SUBSUMPTION.

## 13. Active Guidance Rules

- rep_sets: Accepted rep SFX only; no spoken rep-by-rep counting; no default two-reps-left cue.
- 15_second_holds: Five seconds left at 10 seconds elapsed.
- 20_second_holds: Halfway at 10 seconds; five seconds left at 15 seconds.
- 30_second_timed_windows: Halfway at 15 seconds; five seconds left at 25 seconds; no default ten-seconds-left cue.
- 12_or_14_second_rom_windows: No progress cue; end or return cue only.
- suppression: Progress uses low_reassurance, drops if busy, and never delays active timing.

## 14. Shared Camera and Recovery Guidance

- setup-enter-view-v21: Step into view so your whole body is visible.
- setup-clearer-view-v21: I need a clearer view. Make sure your whole body is visible.
- setup-center-v21: Move to the centre of the view.
- setup-back-v21: Move a little farther back.
- setup-closer-v21: Move a little closer.
- setup-hold-still-v21: Hold still for a moment.
- setup-light-v21: Please turn on the main light.
- tracking-loss-v21: Pause. Return to the setup position.
- tracking-recovered-v21: You're back in position. We'll restart.

## 15. Audible-Go Timing Contract

Active timing aligns to audible onset of the go cue. Preferred implementation: Playback-start/onset callback from the voice player.. Acceptable onset error budget: 80 ms. Requirement: IR-VOICE-AUDIBLE-GO.

## 16. Movement Check-Up V2.1

- 30-Second Chair Stand: Chair stand. Sit in the middle of a sturdy chair, side-on to the phone. / Cross your arms. When I say go, stand fully and sit with control until I say time. Runtime readiness: implementation_required_before_preview.
- Eyes-Open Balance Protocol: Balance check. Keep support within easy reach. I will guide each stance. / Feet together. Eyes open. Keep support within reach. / Semi-tandem. Slide one foot half a step forward. Eyes open. / Tandem. Place one foot directly in front, heel to toe. Eyes open. / Single-leg. Stand on your selected leg and lift the other foot slightly. Runtime readiness: implementation_required_before_preview.
- Shoulder Reach: Turn so your left side is nearest the phone. / Turn so your right side is nearest the phone. / Raise your left arm as high as comfortable. Hold there until I say relax. / Raise your right arm as high as comfortable. Hold there until I say relax. Runtime readiness: implementation_required_before_preview.
- Forward Reach: Slowly fold from your hips and reach toward the floor. Hold there until I say stand tall. Runtime readiness: implementation_required_before_preview.

## 17. Eyes-Open Balance Protocol V2

Protocol id/version: home_balance_eyes_open_v2 / 2. Default eyes-closed stages: 0.
| Order | Stage | Duration | Script | Side |
| --- | --- | --- | --- | --- |
| 1 | feet_together_eyes_open_v2 | 10 | Feet together. Eyes open. Keep support within reach. |  |
| 2 | semi_tandem_eyes_open_v2 | 10 | Semi-tandem. Slide one foot half a step forward. Eyes open. | lead foot follows persisted balance side when available |
| 3 | tandem_eyes_open_v2 | 10 | Tandem. Place one foot directly in front, heel to toe. Eyes open. | lead foot follows persisted balance side when available |
| 4 | single_leg_eyes_open_v2 | 12 | Single-leg. Stand on your selected leg and lift the other foot slightly. | standing leg persisted for comparability |

## 18. Official Measurement-Side Persistence

Select or confirm the comfortable side that is reliably measurable in the required camera orientation. Metadata: protocolId, protocolVersion, selectedSide, standingLeg, sideSource, sideConfidence, comparabilityStatus. Legacy handling: Legacy unknown-side records remain side_unknown_raw_only and are not silently compared as same-side records.

## 19. Micro Checks

- chair-power: Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable. Side policy: not side-specific. Runtime readiness: implementation_required_before_preview.
- single-leg-balance: Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable. / Quick balance check. Stand on your right leg with support nearby. Hold as long as comfortable. Side policy: uses persisted official standing leg where available; otherwise establishes micro baseline side before comparison. Runtime readiness: implementation_required_before_preview.
- mobility-reach: Quick mobility check. Extend your left leg and reach gently until I say relax. / Quick mobility check. Extend your right leg and reach gently until I say relax. Side policy: uses persisted selected leg where intended for comparability. Runtime readiness: implementation_required_before_preview.

## 20. Floor-Transfer Readiness Gate

Prompt: Can you safely get down to the floor and back up without assistance? Field: floorTransferCapability. No or unsure substitutes floor exercises. Unknown also substitutes until answered. Eligible users hear one concise floor transition line per session.

## 21. Controls, Recovery, and Completion

- pause: Paused.
- resume: Resuming.
- retry: Let's try that again.
- training_skip: Skipped. Moving on.
- checkup_skip: Skipped. Moving on.
- micro_discard: Check discarded.
- tracking_loss: Pause. Return to the setup position.
- tracking_recovered: You're back in position. We'll restart.

## 22. Cue Migration and Asset Surface

V2 active count: 172. V2.1 active count: 189. Reused unchanged: 5. Rewritten: 43. New whole assets: 99. New fragments: 42. Retired: 6. Conditional legacy only: 4.

## 23. Implementation Requirements Before Preview

- IR-VOICE-NEW-CUE-SCHEMA: Add V2.1 cue keys, policy metadata, human-review status, runtime-readiness fields, and manifest validation. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-FINAL-POSITION-READINESS: Separate general visibility readiness from movement-specific final start-position readiness. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-SAFETY-SUBSUMPTION: Implement most-specific-wins family selection so safety lines do not stack redundantly. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-ROUND-STATE: Represent one training round as both sides for unilateral/asymmetric training items. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-DOSE-CONVERSION: Convert current side-specific prescriptions into dose-preserving both-sides rounds. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-SIDE-PERSISTENCE: Persist official measurement side, selected standing leg, selected arm, and comparability marker. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-BALANCE-PROTOCOL-V2: Implement the default eyes-open home balance protocol. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-STEP-ALTERNATION: Support and validate 12 total step-up reps with alternating lead leg each repetition. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-FLOOR-GATE: Add floor-transfer capability gate and substitution path. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.
- IR-VOICE-AUDIBLE-GO: Align active timer start to audible onset of the go cue. Blocks integrated preview: true. Likely files: src/audio/cues.ts, src/audio/manifest.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/training/microCheck.ts.

## 24. Human Script Review Gate

All active scripts are ready for human line review, but no script or audio is human-approved. Targeted revisions should update the JSON first, then regenerate derivative docs.

## 25. Clara Preview Pack Plan

Preview cue count: 21. Documentation only; no audio generated.
| Cue | Script | Why | Question | Dependency |
| --- | --- | --- | --- | --- |
| training-intro-v21 | Time to train. I will guide the setup, work, and rests. Follow my voice and pause whenever you need. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| safe-session-start-v21 | Clear the space around you. Stop for sharp pain, dizziness, or feeling unwell. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| ex-squat-free-first-v21 | Squat. Feet about hip width. Lower as if to sit, then stand with control. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| side-single-leg-left-v21 | Start on your left leg. Lift your right foot slightly. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-ROUND-STATE |
| side-single-leg-right-v21 | Start on your right leg. Lift your left foot slightly. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-ROUND-STATE |
| checkup-balance-semi-tandem-v21 | Semi-tandem. Slide one foot half a step forward. Eyes open. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-BALANCE-PROTOCOL-V2 |
| checkup-chair-stand-setup-v21 | Cross your arms. When I say go, stand fully and sit with control until I say time. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| ex-seated-band-row-first-v21 | Seated band row. Sit tall with the band anchored under both feet. Pull elbows back, then return slowly. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-SAFETY-SUBSUMPTION |
| equip-door-anchor-v21 | Use a secure closed door anchor and test light tension first. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| equip-floor-transition-v21 | Move down to the floor and settle into the start position. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| ex-step-up-first-v21 | Step-up. Use the lowest stable step with support nearby. Alternate the leading leg each rep, returning both feet to the floor. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-STEP-ALTERNATION;IR-VOICE-SAFETY-SUBSUMPTION |
| micro-chair-power-v21 | Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-SIDE-PERSISTENCE |
| tracking-loss-v21 | Pause. Return to the setup position. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| tracking-recovered-v21 | You're back in position. We'll restart. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| paused-v21 | Paused. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| resuming-v21 | Resuming. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| training-skip-v21 | Skipped. Moving on. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| session-complete-v21 | Session complete. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| target-balance-single-leg-hold-v21 | Hold for [duration]. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | IR-VOICE-ROUND-STATE;IR-VOICE-DOSE-CONVERSION;IR-VOICE-SAFETY-SUBSUMPTION |
| halfway-v21 | Halfway. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |
| five-seconds-left-v21 | Five seconds left. | Representative V2.1 tone, timing, composition, or safety case. | Does this line sound clear, calm, and natural in context? | none |

## 26. Later Production Implementation Order

1. V2.1 human line review: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
2. Targeted revisions: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
3. Clara preview-pack generation in a separately authorised task: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
4. Listening review: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
5. Script and cue-key freeze: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
6. Cue schema plus feature flag: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
7. Final-position setup sequencing: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
8. Safety-family de-duplication: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
9. Both-sides training round state: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
10. Step-up alternating-leg grader support: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
11. Side persistence and protocol metadata: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
12. Eyes-open balance protocol V2: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
13. Floor-readiness gate and substitutions: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
14. Audible-go timing: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
15. Full Clara and Marcus generation: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
16. Automated timeline re-audit: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
17. Android/iOS QA: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.
18. Controlled beta rollout: input approval required; scope limited to that phase; rollback keeps current production voice path until its gate passes.

## 27. Acceptance Criteria

- All seven founder decisions approved with zero unresolved founder decisions.
- No founder-decision blocker state remains.
- All 37 registered exercise ids appear exactly once.
- All unilateral/asymmetric affected training items use both-sides round architecture and have dose-preservation rows.
- Mini-band lateral walk has above-knees placement, both directions inside a timed set, and no side-round dependency.
- Step-up intended contract is 12 total alternating reps.
- Default balance protocol is eyes-open only and includes semi-tandem.
- Set-count setup cues are retired.
- At 250 ms gaps, zero active or implementation-required intended sequence exceeds its hard maximum.
- No production, tests, manifests, package files, or audio assets are changed by this documentation task.

## 28. Device QA

- Measure go onset for Clara and Marcus on Android and iOS devices.
- Verify final-position readiness for floor, chair, step, door-anchor, and side-facing assessment setup.
- Replay landmark recordings for tracking loss and recovery with fresh countdown.
- Run eyes-open balance V2 protocol on-device and confirm no default eyes-closed cue.
- Confirm safety-family de-duplication in first-use and later-set paths.

## 29. Validation and Source Index

Generated validation summary: {
  "allSevenFounderDecisionsApproved": true,
  "founderDecisionBlockers": 0,
  "exactTrainingContractCount": 37,
  "expectedTrainingContractCount": 37,
  "unilateralAsymmetricBothSidesRoundCount": 6,
  "miniBandHasNoFd001Dependency": true,
  "stepUpContract": "12 total reps, alternate leading leg every rep",
  "defaultEyesClosedStageCount": 0,
  "setCountSetupCueCount": 0,
  "bilateralSidePolicyErrors": 0,
  "hardDurationFailuresAt250Ms": 0,
  "longestOrdinaryFirstUseSequence": {
    "scenarioId": "training-neck-rotation-first-use-cold-clara-gap250",
    "estimatedTotalMs": 11120,
    "hardMaxMs": 16000,
    "passesHardMax": true
  },
  "longestComplexEquipmentFirstUseSequence": {
    "scenarioId": "training-step-up-first-use-cold-clara-gap250",
    "estimatedTotalMs": 15390,
    "hardMaxMs": 20000,
    "passesHardMax": true
  },
  "longestCheckupSetup": {
    "scenarioId": "checkup-chair-stand-setup-clara-gap250",
    "estimatedTotalMs": 14000,
    "hardMaxMs": 16000,
    "passesHardMax": true
  },
  "longestMicroCheckSetup": {
    "scenarioId": "micro-chair-power-setup-clara-gap250",
    "estimatedTotalMs": 7570,
    "hardMaxMs": 10000,
    "passesHardMax": true
  },
  "prohibitedActiveScriptHits": [],
  "implementationRequirementReferencesValid": true,
  "manifestCueCount": 199,
  "activeCueCount": 189,
  "timelineRows": 1656,
  "sourceFilesInspected": [
    "src/audio/cues.ts",
    "src/audio/manifest.ts",
    "src/audio/voicePlayer.ts",
    "src/audio/safetyAudio.ts",
    "src/audio/safetyAudioManifest.ts",
    "src/profile/voices.ts",
    "scripts/generate-audio.ts",
    "src/training/sessionPlayer.ts",
    "src/training/microCheck.ts",
    "src/training/safetyCueDefinitions.ts",
    "src/training/safetyCues.ts",
    "src/assessment/sessionController.ts",
    "src/checkup/checkup.ts",
    "src/checkup/protocolPolicy.ts",
    "src/checkup/protocolSetup.ts",
    "src/checkup/types.ts",
    "src/preflight/preflight.ts",
    "src/preflight/movementCameraReadiness.ts",
    "src/preflight/promptTiming.ts",
    "src/exercises/index.ts",
    "src/exercises/ladders.ts",
    "src/exercises/releasePolicy.ts",
    "src/exercises/common.ts",
    "src/exercises/setGraders.ts",
    "src/exercises/types.ts",
    "src/exercises/sitToStand.ts",
    "src/exercises/supportedSquat.ts",
    "src/exercises/stepUp.ts",
    "src/exercises/heelRaise.ts",
    "src/exercises/gluteBridge.ts",
    "src/exercises/pushUp.ts",
    "src/exercises/overheadPress.ts",
    "src/exercises/hipHinge.ts",
    "src/exercises/balanceRung.ts",
    "src/exercises/seatedHamstringReach.ts",
    "src/exercises/neckRotation.ts",
    "src/exercises/loadedMarch.ts",
    "src/exercises/pullUpperBack.ts",
    "src/exercises/lateralStability.ts",
    "src/exercises/mobilityDrills.ts",
    "src/movements/chairStand.ts",
    "src/movements/balanceLadder.ts",
    "src/movements/shoulderFlexion.ts",
    "src/movements/hingeReach.ts",
    "src/movements/tug.ts",
    "src/movements/chairRiseV2.ts",
    "src/movements/oneLegBalanceV2.ts",
    "src/movements/activeShoulderReachV2.ts",
    "src/movementProfileV2/internalCheckupFlow.ts",
    "src/movementProfileV2/liveCoordinator.ts",
    "src/screens/TrainingSessionScreen.tsx",
    "src/screens/CheckUpScreen.tsx",
    "src/screens/MicroCheckScreen.tsx",
    "src/screens/MovementProfileV2CheckUpScreen.tsx",
    "src/training/__tests__/sessionPlayer.test.ts",
    "src/training/__tests__/microCheck.test.ts",
    "src/training/__tests__/safetyCues.test.ts",
    "src/assessment/__tests__/sessionController.test.ts",
    "src/checkup/__tests__/checkup.test.ts",
    "src/preflight/__tests__/preflight.test.ts",
    "src/preflight/__tests__/movementCameraReadiness.test.ts"
  ],
  "validationCommandsPlanned": [
    "node artifact validator",
    "npm test selected session/audio tests",
    "npx tsc --noEmit"
  ]
}

Source files inspected:
- src/audio/cues.ts
- src/audio/manifest.ts
- src/audio/voicePlayer.ts
- src/audio/safetyAudio.ts
- src/audio/safetyAudioManifest.ts
- src/profile/voices.ts
- scripts/generate-audio.ts
- src/training/sessionPlayer.ts
- src/training/microCheck.ts
- src/training/safetyCueDefinitions.ts
- src/training/safetyCues.ts
- src/assessment/sessionController.ts
- src/checkup/checkup.ts
- src/checkup/protocolPolicy.ts
- src/checkup/protocolSetup.ts
- src/checkup/types.ts
- src/preflight/preflight.ts
- src/preflight/movementCameraReadiness.ts
- src/preflight/promptTiming.ts
- src/exercises/index.ts
- src/exercises/ladders.ts
- src/exercises/releasePolicy.ts
- src/exercises/common.ts
- src/exercises/setGraders.ts
- src/exercises/types.ts
- src/exercises/sitToStand.ts
- src/exercises/supportedSquat.ts
- src/exercises/stepUp.ts
- src/exercises/heelRaise.ts
- src/exercises/gluteBridge.ts
- src/exercises/pushUp.ts
- src/exercises/overheadPress.ts
- src/exercises/hipHinge.ts
- src/exercises/balanceRung.ts
- src/exercises/seatedHamstringReach.ts
- src/exercises/neckRotation.ts
- src/exercises/loadedMarch.ts
- src/exercises/pullUpperBack.ts
- src/exercises/lateralStability.ts
- src/exercises/mobilityDrills.ts
- src/movements/chairStand.ts
- src/movements/balanceLadder.ts
- src/movements/shoulderFlexion.ts
- src/movements/hingeReach.ts
- src/movements/tug.ts
- src/movements/chairRiseV2.ts
- src/movements/oneLegBalanceV2.ts
- src/movements/activeShoulderReachV2.ts
- src/movementProfileV2/internalCheckupFlow.ts
- src/movementProfileV2/liveCoordinator.ts
- src/screens/TrainingSessionScreen.tsx
- src/screens/CheckUpScreen.tsx
- src/screens/MicroCheckScreen.tsx
- src/screens/MovementProfileV2CheckUpScreen.tsx
- src/training/__tests__/sessionPlayer.test.ts
- src/training/__tests__/microCheck.test.ts
- src/training/__tests__/safetyCues.test.ts
- src/assessment/__tests__/sessionController.test.ts
- src/checkup/__tests__/checkup.test.ts
- src/preflight/__tests__/preflight.test.ts
- src/preflight/__tests__/movementCameraReadiness.test.ts
