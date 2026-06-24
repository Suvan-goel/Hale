# Hale Voice Experience Specification

## 1. Executive Decision Summary

| Metric | Value |
|---|---:|
| Total existing cue templates reviewed | 110 |
| Number kept as-is | 4 |
| Number kept but retimed | 4 |
| Number rewritten | 34 |
| Number split | 16 |
| Number merged | 41 |
| Number replaced | 3 |
| Number retired | 4 |
| Number conditional protocol only | 4 |
| New cue assets/fragments proposed | 186 |
| Exact training levels with final accurate instructions | 37 |
| Fully or mostly eyes-off after implementation | 37 |
| Maximum proposed training intro duration | 14518 ms |
| Maximum proposed ordinary exercise setup duration | 13822 ms (seated-hamstring-reach) |
| Maximum proposed complex equipment setup duration | 15562 ms (step-up) |
| Unresolved protocol decisions | 0 |

Production code, tests, timers, manifests, package files, and audio assets were unchanged by this specification task. The repository already had unrelated dirty worktree changes before this spec was generated.

The five product decisions that drive the rest of this spec are: exact exercise-level cues replace broad family cues; safety moves to universal/equipment/reactive layers; default Check-Up stays four items with TUG beta-only; official side choices become deterministic and persisted; active timing starts on audible go onset.

## 2. Product and Voice Principles

- Accuracy before reuse: a line may be reused only when movement, equipment, load, support, side, target, tempo, and grader behavior all match.
- Voice-first, not voice-saturated: essential setup, target, side, and stop rules are spoken; visible UI remains reassurance and accessibility support.
- The camera is never a form judge: no rep-by-rep critique, no shame language, and no medical claims.
- Scripts must be calm, direct, adult, and short enough to finish before the user is expected to move.
- Clara and Marcus use the same script text and must not produce different state outcomes.

## 3. Final Timing Budgets

| Cue class | Target | Hard max | Notes |
|---|---:|---:|---|
| training_intro_plus_universal_safety | 15000 ms | 18000 ms | Target includes session entry plus the universal safety line before the first exercise. |
| checkup_intro | 12000 ms | 15000 ms | No long explanation; the check-up remains audio-first. |
| micro_type_intro | 8000 ms | 10000 ms | Micro checks stay quick and type-specific. |
| preflight_prompt | 3000 ms | 4000 ms | One action only; prompt repetition is throttled. |
| orientation_prompt | 3000 ms | 4000 ms | Separate next-movement transition from current-movement correction. |
| framing_ready | 2000 ms | 3000 ms | Short acknowledgement only. |
| first_set_instruction | 12000 ms | 16000 ms | Movement instruction only; target and safety may be separate fragments. |
| first_set_plus_one_safety | 16000 ms | 20000 ms | Applies to the composed first exposure for one exercise. |
| later_set_reminder | 5000 ms | 7000 ms | Name, target, side if needed. |
| rest | 4000 ms | 6000 ms | No numeric rest duration by default. |
| tracking_loss | 4000 ms | 6000 ms | Immediate recovery action, not implementation language. |
| tracking_recovery | 3000 ms | 5000 ms | Positive confirmation before a fresh countdown when needed. |
| skip_pause_resume | 2500 ms | 4000 ms | Short control confirmations. |
| completion | 5000 ms | 7000 ms | Closure without overpraise. |

Duration estimates use the prior measured MP3 corpus: Clara p75 speech rate about 348 ms/word and Marcus p75 about 342 ms/word, plus a 250 ms phrase overhead. Final implementation must remeasure generated MP3s and fail any hard-budget breach unless explicitly approved.

## 4. Final Cue Architecture and Priority Model

| Priority class | Proposed numeric | Use | Interrupt policy |
|---|---:|---|---|
| critical_window | 10 | go, times-up, active stop, countdown steps | Interrupt lower-priority speech; never queue behind setup narration. |
| result_transition | 9 | results, transitions, pause/resume/skip/retry, completion | May interrupt setup prompts; does not interrupt critical window cues. |
| instruction | 8 | movement instructions, targets, first-use safety | Must complete before countdown starts; dropped if stale after state change. |
| setup_recovery | 6 | framing, orientation correction, tracking recovery | May repeat only after throttle; cancelled on readiness or state exit. |
| low_reassurance | 4 | optional acknowledgements and nonessential progress | Dropped whenever the channel is busy. |

Cue classes are: session intro, universal safety, equipment-family safety, exercise first-use, later-set reminder, target, setup, orientation transition, orientation correction, framing ready, countdown, progress, side switch, set completion, rest, transition, tracking loss, tracking recovery, controls, assessment result, completion, and fallback.

## 5. Whole-Recording and Composable-Audio Policy

- Use whole recordings for exercise first-use lines, later-set reminders, safety lines, setup prompts, controls, and assessment instructions.
- Use limited complete target phrases for the actual production targets: 8, 10, 12, 15, 16, and 18 reps; 15 and 20 second holds; 12 and 14 second capture windows; 30 second timed sets; five quick stands.
- Use number-word fragments for chair-stand result composition only, extended from 0..40 to 0..64.
- Use side fragments only where composition remains natural; exact exercise lines should include the first side when the side is part of the setup.
- Do not speak numeric rest durations by default; rest timers are visual, followed by a fresh countdown.

## 6. Training Session Timeline

Entry speaks `training-intro`, then `safe-session-start-v2` once. Each item then runs transition, preflight, framing-ready, exact first-use or later-set cue, target phrase, set-plan phrase on first exposure, one relevant safety line if due, countdown, active set, set completion/rest, optional side switch, and next item transition. Countdown starts only after instruction speech is finished and state is still valid.

## 7. Active Guidance Policy

- Reps: accepted reps use the existing SFX. Do not speak every rep, and do not retain a two-reps-left voice prompt by default.
- Holds and timed sets: use Halfway, Ten seconds left, and Five seconds left only for windows long enough to benefit, and suppress them if another more important cue is active.
- ROM capture: keep active audio quiet; speak the end cue only.
- Autoregulation: `thats-your-set` remains the concise completion line when the grader ends a set early.

## 8. Exact Training-Level Voice Contracts

| Exercise | Target | First-use cue and script | Later-set cue | Safety | Eyes-off verdict |
|---|---|---|---|---|---|
| balance-feet-together-hold | 20 sec hold | ex-balance-feet-together-hold-first-v2: Feet-together hold. Stand with feet together, fingertips near support, and keep your eyes open. | ex-balance-feet-together-hold-next-v2: Feet-together hold. | safe-balance-first-v2 | fully_eyes_off_after_implementation |
| balance-single-leg-hold | 15 sec hold | ex-balance-single-leg-hold-first-v2: Single-leg hold. Start on your left leg, lift the right foot just off the floor, fingertips near support. | ex-balance-single-leg-hold-next-v2: Single-leg hold. | safe-balance-first-v2 | fully_eyes_off_after_implementation |
| balance-tandem-hold | 20 sec hold | ex-balance-tandem-hold-first-v2: Tandem hold. Put your left foot directly in front, heel to toe, fingertips near support. | ex-balance-tandem-hold-next-v2: Tandem hold. | safe-balance-first-v2 | fully_eyes_off_after_implementation |
| band-pull-apart | 30 sec timed set | ex-band-pull-apart-first-v2: Band pull-apart. Hold a light band at chest height with both hands. Pull wide, then return slowly. | ex-band-pull-apart-next-v2: Band pull-apart. | safe-band-first-v2 | mostly_eyes_off_after_implementation |
| chair-supported-split-squat | 8 reps | ex-chair-supported-split-squat-first-v2: Chair-supported split squat. Start with your left foot forward, fingertips near support. Bend both knees slightly, then stand tall. | ex-chair-supported-split-squat-next-v2: Chair-supported split squat. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| glute-bridge-hold | 20 sec hold | ex-glute-bridge-hold-first-v2: Bridge hold. Lie on your back, knees bent and feet flat. Lift your hips and hold. | ex-glute-bridge-hold-next-v2: Bridge hold. | safe-floor-first-v2 | mostly_eyes_off_after_implementation |
| glute-bridge-reps | 12 reps | ex-glute-bridge-reps-first-v2: Glute bridge. Lie on your back, knees bent and feet flat. Lift your hips, then lower with control. | ex-glute-bridge-reps-next-v2: Glute bridge. | safe-floor-first-v2 | mostly_eyes_off_after_implementation |
| heel-raise-free | 18 reps | ex-heel-raise-free-first-v2: Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly. | ex-heel-raise-free-next-v2: Heel raise. | none | fully_eyes_off_after_implementation |
| heel-raise-supported | 15 reps | ex-heel-raise-supported-first-v2: Supported heel raise. Stand tall, fingertips near support. Rise onto the balls of your feet, then lower slowly. | ex-heel-raise-supported-next-v2: Supported heel raise. | safe-support-first-v2 | fully_eyes_off_after_implementation |
| hip-hinge-free | 12 reps | ex-hip-hinge-free-first-v2: Hip hinge. Stand with feet under hips. Push your hips back with a long back, then stand tall. | ex-hip-hinge-free-next-v2: Hip hinge. | none | fully_eyes_off_after_implementation |
| hip-hinge-wall | 10 reps | ex-hip-hinge-wall-first-v2: Wall-tap hinge. Stand a step from the wall. Push your hips back to tap it, then stand tall. | ex-hip-hinge-wall-next-v2: Wall-tap hinge. | safe-support-first-v2 | fully_eyes_off_after_implementation |
| loaded-march | 16 reps | ex-loaded-march-first-v2: March in place. Stand tall with fingertips near support. Lift each knee to a steady rhythm. | ex-loaded-march-next-v2: March in place. | safe-support-first-v2 | fully_eyes_off_after_implementation |
| loaded-sit-to-stand | 8 reps | ex-loaded-sit-to-stand-first-v2: Loaded sit-to-stand. Hold the weight close to your chest. Stand fully, then sit down with control. | ex-loaded-sit-to-stand-next-v2: Loaded sit-to-stand. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| mini-band-lateral-walk | 30 sec timed set | ex-mini-band-lateral-walk-first-v2: Mini-band lateral walk. Band above ankles or knees. Step left and right with small controlled steps. | ex-mini-band-lateral-walk-next-v2: Mini-band lateral walk. | safe-mini-band-first-v2 | mostly_eyes_off_after_implementation |
| neck-rotation | 14 sec capture | ex-neck-rotation-first-v2: Neck rotations. Face forward, sitting or standing tall. Turn slowly to each side through a comfortable range. | ex-neck-rotation-next-v2: Neck rotations. | none | fully_eyes_off_after_implementation |
| overhead-press-band | 12 reps | ex-overhead-press-band-first-v2: Band overhead press. Stand on the band with a stable stance. Press overhead, then return slowly. | ex-overhead-press-band-next-v2: Band overhead press. | safe-band-first-v2 | mostly_eyes_off_after_implementation |
| overhead-reach | 12 reps | ex-overhead-reach-first-v2: Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower. | ex-overhead-reach-next-v2: Overhead reach. | none | fully_eyes_off_after_implementation |
| push-up-incline | 10 reps | ex-push-up-incline-first-v2: Incline push-up. Hands on a sturdy counter or chair. Keep a long line, lower in, then press away. | ex-push-up-incline-next-v2: Incline push-up. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| push-up-standard | 8 reps | ex-push-up-standard-first-v2: Push-up. Hands on the floor, body long. Lower with control, then press back up. | ex-push-up-standard-next-v2: Push-up. | safe-floor-first-v2 | mostly_eyes_off_after_implementation |
| push-up-wall | 10 reps | ex-push-up-wall-first-v2: Wall push-up. Hands on the wall at shoulder height. Bend your elbows, then press away. | ex-push-up-wall-next-v2: Wall push-up. | safe-support-first-v2 | fully_eyes_off_after_implementation |
| seated-band-row | 10 reps | ex-seated-band-row-first-v2: Seated band row. Sit tall with the band under both feet. Pull elbows back, then return slowly. | ex-seated-band-row-next-v2: Seated band row. | safe-band-first-v2 | mostly_eyes_off_after_implementation |
| seated-hamstring-reach | 12 sec capture | ex-seated-hamstring-reach-first-v2: Seated hamstring reach. Sit tall, left leg straight with heel on the floor. Reach gently toward your toes and hold. | ex-seated-hamstring-reach-next-v2: Seated hamstring reach. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| squat-free | 12 reps | ex-squat-free-first-v2: Squat. Feet hip-width. Lower as if toward a chair, then stand tall. | ex-squat-free-next-v2: Squat. | none | fully_eyes_off_after_implementation |
| squat-loaded | 8 reps | ex-squat-loaded-first-v2: Loaded squat. Hold the weight close to your chest. Lower as if toward a chair, then stand tall. | ex-squat-loaded-next-v2: Loaded squat. | none | fully_eyes_off_after_implementation |
| squat-slow-eccentric | 8 reps | ex-squat-slow-eccentric-first-v2: Slow-lower squat. Lower for about three seconds, then stand tall. | ex-squat-slow-eccentric-next-v2: Slow-lower squat. | none | fully_eyes_off_after_implementation |
| squat-supported | 10 reps | ex-squat-supported-first-v2: Supported squat. Feet hip-width, fingertips near support. Lower as if toward a chair, then stand tall. | ex-squat-supported-next-v2: Supported squat. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| standing-band-row | 10 reps | ex-standing-band-row-first-v2: Standing band row. Anchor the band securely at chest height. Step back lightly, pull elbows back, then return slowly. | ex-standing-band-row-next-v2: Standing band row. | safe-door-anchor-first-v2 | mostly_eyes_off_after_implementation |
| step-up | 12 reps | ex-step-up-first-v2: Step-up. Use the lowest stable step, support nearby. Start with your left foot, step up, meet it, then step down. | ex-step-up-next-v2: Step-up. | safe-step-first-v2 | mostly_eyes_off_after_implementation |
| sts-cushion | 8 reps | ex-sts-cushion-first-v2: Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit down with control. | ex-sts-cushion-next-v2: Cushion sit-to-stand. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| sts-power | 12 reps | ex-sts-power-first-v2: Power sit-to-stand. Stand up briskly each time, then sit down with control. | ex-sts-power-next-v2: Power sit-to-stand. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| sts-slow-eccentric | 8 reps | ex-sts-slow-eccentric-first-v2: Slow-lower sit-to-stand. Stand up normally, then take about three seconds to sit down. | ex-sts-slow-eccentric-next-v2: Slow-lower sit-to-stand. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| sts-standard | 10 reps | ex-sts-standard-first-v2: Sit-to-stand. Sit tall in the chair, feet flat. Stand fully, then sit down with control. | ex-sts-standard-next-v2: Sit-to-stand. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| supported-hip-flexor-stretch | 30 sec timed set | ex-supported-hip-flexor-stretch-first-v2: Supported hip flexor stretch. Step your left foot forward, fingertips near support. Keep tall and gently shift forward. | ex-supported-hip-flexor-stretch-next-v2: Supported hip flexor stretch. | safe-chair-first-v2 | fully_eyes_off_after_implementation |
| supported-side-step | 30 sec timed set | ex-supported-side-step-first-v2: Supported side step. Fingertips near support. Step left and right in small controlled steps. | ex-supported-side-step-next-v2: Supported side step. | safe-balance-first-v2 | fully_eyes_off_after_implementation |
| thoracic-rotation | 30 sec timed set | ex-thoracic-rotation-first-v2: Thoracic rotation. Stand tall facing the phone. Rotate your upper body gently left and right. | ex-thoracic-rotation-next-v2: Thoracic rotation. | none | fully_eyes_off_after_implementation |
| toe-raise-supported | 30 sec timed set | ex-toe-raise-supported-first-v2: Supported toe raise. Fingertips near support. Lift your toes toward your shins, then lower. | ex-toe-raise-supported-next-v2: Supported toe raise. | safe-support-first-v2 | fully_eyes_off_after_implementation |
| wall-calf-stretch | 30 sec timed set | ex-wall-calf-stretch-first-v2: Wall calf stretch. Face the wall, left foot forward and right leg back. Press the back heel down gently. | ex-wall-calf-stretch-next-v2: Wall calf stretch. | safe-support-first-v2 | fully_eyes_off_after_implementation |

## 9. Safety Narration Policy

Safety uses four layers. Universal safety plays once per training session. Equipment-family safety plays once per family per session. Exercise-specific safety is integrated into exact movement instructions unless a separate concise line is needed. Reactive recovery plays only when tracking or setup actually fails.

| Layer | Cue | Script | Frequency |
|---|---|---|---|
| Universal | safe-session-start-v2 | Before we start, clear the space around you. Stop for sharp pain, dizziness, or feeling unwell. Keep supports and equipment steady. | Once per training session |
| Equipment | safe-chair-first-v2 | Use a sturdy chair that will not slide or tip. | once per session before first chair exercise |
| Equipment | safe-support-first-v2 | Keep sturdy support within easy reach. | once per session before first supported exercise when no more specific family cue applies |
| Equipment | safe-step-first-v2 | Use the lowest stable step, with support nearby, and keep the phone out of your stepping path. | once per session before first step exercise |
| Equipment | safe-band-first-v2 | Check the band first. Keep it away from your face and return it slowly. | once per session before first long-band exercise |
| Equipment | safe-door-anchor-first-v2 | Use a purpose-built anchor on a fully closed door, and test light tension before the set. | once per session before first door-anchor exercise, in addition to long-band cue if not yet heard |
| Equipment | safe-mini-band-first-v2 | Place the mini band securely and use small controlled steps. | once per session before first mini-band exercise |
| Equipment | safe-floor-first-v2 | Use clear floor space and move slowly getting down and back up. Keep support nearby. | once per session before first floor exercise |
| Equipment | safe-balance-first-v2 | Keep fingertips near support and touch it whenever you need. | once per session before first balance exercise |
| Reactive | tracking-lost-v2 | I lost your position. Return to the setup spot and hold still. | active tracking loss or setup issue |
| Reactive | tracking-recovered-v2 | You are back in view. We will restart the count. | tracking recovered after active loss before fresh countdown |

Current safety narration can exceed 30 seconds for some exercises. The proposed maximum ordinary setup example is 13822 ms, and the proposed maximum complex-equipment setup example is 15562 ms.

## 10. Shared Camera and Orientation Guidance

| Situation | Cue | Script |
|---|---|---|
| step-into-frame | step-into-frame | Step into view so your whole body is visible. |
| center-yourself | center-yourself | Move to the center of the view. |
| step-back | step-back | Move a little farther back. |
| step-closer | step-closer | Move a little closer. |
| hold-still | hold-still | Hold still for a moment. |
| turn-on-light | turn-on-light | Turn on the main light. |
| visibility-problem-v2 | visibility-problem-v2 | I need a clearer view. Check the light and make sure your whole body is visible. |
| framing-ready | framing-ready | You are framed. Stay there. |
| camera-turn-side-next-v2 | camera-turn-side-next-v2 | Next movement: turn side-on to the phone. |
| camera-face-front-next-v2 | camera-face-front-next-v2 | Next movement: face the phone. |
| camera-turn-side-correction-v2 | camera-turn-side-correction-v2 | Turn side-on and hold still. |
| camera-face-front-correction-v2 | camera-face-front-correction-v2 | Face the phone and hold still. |
| tracking-lost-v2 | tracking-lost-v2 | I lost your position. Return to the setup spot and hold still. |
| tracking-recovered-v2 | tracking-recovered-v2 | You are back in view. We will restart the count. |

Prompt repetition is throttled: repeat the same unresolved setup prompt no more often than every 10 seconds, require at least 5 seconds between different setup prompts unless the state changes materially, and cancel any stale setup or recovery prompt when readiness is achieved or the flow generation changes.

## 11. Countdown and Audible-Start Contract

The spoken cadence remains Three, Two, One, Go. The active clock starts at the audible onset of `go`, not at the end of the file and not merely when `speak()` is called. Preferred implementation is a native playback-start/onset callback for the `go` asset. If native onset is unavailable, use a measured per-platform calibration constant produced by device QA and stored in code with tests; do not use a blind 604 ms delay. Pause, retry, resume, and tracking recovery all restart with a fresh countdown.

## 12. Movement Check-Up Voice Contracts

| Movement | Status | Runtime order | Protocol decision |
|---|---|---|---|
| chair-stand-30s | default | checkup-chair-stand-intro-v2 -> checkup-chair-stand-arms-v2 -> countdown-three -> countdown-two -> countdown-one -> go -> times-up -> you-completed -> num-0..64 -> chair-stand-singular-v2\|chair-stand-plural-v2 | 30 seconds; arms crossed; exact result supported through 64 accepted reps; hand push-off remains logged only. |
| balance-ladder | default | checkup-balance-intro-v2 -> checkup-balance-setup-v2 -> balance-feet-together -> close-your-eyes -> open-your-eyes -> balance-tandem -> close-your-eyes -> open-your-eyes -> balance-single-leg -> item-complete | Keep default stages: feet together open, feet together closed, tandem open, tandem closed, single-leg open. Semi-tandem remains conditional only. |
| shoulder-flexion-peak | default | shoulder-intro -> shoulder-setup -> countdown-three -> countdown-two -> countdown-one -> go -> relax-arm -> item-complete | Left arm is default baseline/retest side; if visibility or comfort requires right, persist side and mark comparability. |
| hinge-reach | default | hinge-intro -> hinge-setup -> countdown-three -> countdown-two -> countdown-one -> go -> stand-tall -> item-complete | Both-hand forward reach; near-side measurement side is persisted for official comparisons when implementation adds side metadata. |
| timed-up-and-go | beta_only | tug-intro -> tug-setup | Not in DEFAULT_BATTERY. Only available under BETA_BATTERY_WITH_TUG or explicit protocol flag. |
| chair-rise-30s-v2 | movement_profile_v2_conditional | checkup-chair-stand-intro-v2 -> checkup-chair-stand-arms-v2 | Raw-first V2 battery condition only. |
| one-leg-balance-45s-v2 | movement_profile_v2_conditional | checkup-balance-intro-v2 -> balance-single-leg | Left standing leg default and persisted. |
| active-shoulder-reach-v2 | movement_profile_v2_conditional | shoulder-intro -> shoulder-setup | Left arm default and persisted. |

## 13. Measurement Side-Persistence Policy

Official measurement defaults to the left side or left limb for baseline. Store the side with the measurement result and repeat it on official retest. If comfort, safety, or visibility requires the right side, mark the result as a fallback-side comparison and do not silently overwrite the official baseline side. Manual extra attempts do not overwrite official retest side. Current side-view graders dynamically choose the reliable near side, so implementation must add explicit side setup and result metadata before claiming same-side comparability.

## 14. Micro-Check Voice Contracts

| Type | Cue order | Policy |
|---|---|---|
| chair-power | framing-ready -> micro-chair-power-v2 -> target-5-fast-stands-v2 -> countdown-three -> countdown-two -> countdown-one -> go -> microcheck-complete | Ends on five accepted reps or maxActiveMs. Accepted rep progress remains SFX-only. |
| single-leg-balance | framing-ready -> micro-balance-left-v2 -> countdown-three -> countdown-two -> countdown-one -> go -> microcheck-complete | Left standing leg default; persist side for retest comparability. Touchdown ends hold. |
| mobility-reach | framing-ready -> micro-mobility-left-v2 -> countdown-three -> countdown-two -> countdown-one -> go -> microcheck-complete | Left leg extended default; persist side for retest comparability. |

## 15. Pause, Resume, Repeat, Retry, Skip, and Recovery

| State | Cue | Behavior |
|---|---|---|
| pause | pause-confirmation-v2: Paused. | Stop current speech immediately, freeze timers and graders, preserve current item/set/side context, show paused state. The pause cue may play after stop() completes. |
| resume | resume-confirmation-v2: Resuming. | Resume with a fresh countdown. Interrupted rep, hold, timer, or ROM capture is discarded from the active attempt. Full instructions replay only when the user requests repeat. |
| repeat_instructions | repeat-instructions-v2: Repeating the setup. | Replay current exact movement instruction, current side, target, and one relevant safety cue. Never replay universal safety or every equipment warning. |
| retry | retry-confirmation-v2: We will try again. | Reset speech, timer, grader, attempt data, setup readiness, countdown, and current active result. Preserve official side unless fallback side is explicitly chosen. |
| skip_training_or_checkup | skip-confirmation-v2: Skipped. Moving on. | Training skip records skipped item. Check-up skip records skipped item and the official check-up remains incomplete for that domain. Next transition begins after confirmation or immediately if voice is disabled. |
| discard_micro_check | discard-confirmation-v2: Discarded. | Micro checks are discarded rather than skipped; no official check-up invalidation. |
| tracking_loss | tracking-lost-v2: I lost your position. Return to the setup spot and hold still. | Immediately freeze active timer/grader, inject a tracking interruption, discard in-flight rep/hold/capture, require setup position, throttle repeat to at least 8 seconds and cancel stale prompts. |
| tracking_recovery | tracking-recovered-v2: You are back in view. We will restart the count. | Play only after stable readiness returns in the same flow generation. Follow with a fresh countdown; never advance an old flow after unmount/cancel. |

Cancel, discard, unmount, and navigation away must call stop/cancel on current and pending speech. Every callback must carry a flow-generation token so no stale callback can advance an old controller.

## 16. Dynamic Target and Progress Grammar

Training uses limited complete target phrases for actual production ranges rather than arbitrary number assembly. Chair-stand results use number fragments 0 through 64 plus singular/plural suffixes. Side selection uses left/right/switch fragments where needed. Progress uses SFX for accepted reps and sparse time milestones for holds/timers.

| Cue | Script |
|---|---|
| target-20-sec-hold-v2 | Hold for twenty seconds. |
| target-15-sec-hold-v2 | Hold for fifteen seconds. |
| target-30-sec-move-v2 | Move for thirty seconds. |
| target-8-reps-v2 | Aim for eight reps. |
| target-12-reps-v2 | Aim for twelve reps. |
| target-18-reps-v2 | Aim for eighteen reps. |
| target-15-reps-v2 | Aim for fifteen reps. |
| target-10-reps-v2 | Aim for ten reps. |
| target-16-reps-v2 | Aim for sixteen reps. |
| target-14-sec-capture-v2 | Move slowly for fourteen seconds. |
| target-12-sec-capture-v2 | Hold the reach for twelve seconds. |
| target-5-fast-stands-v2 | Five quick stands. |

## 17. Existing Cue Migration Map

| Existing id | Existing cue | Action | New cue key(s) | Reason |
|---|---|---|---|---|
| SHARED-001 | step-into-frame | rewrite_same_key | step-into-frame | Script needs shorter, more precise language or final timing contract. |
| SHARED-002 | center-yourself | rewrite_same_key | center-yourself | Script needs shorter, more precise language or final timing contract. |
| SHARED-003 | step-back | rewrite_same_key | step-back | Script needs shorter, more precise language or final timing contract. |
| SHARED-004 | step-closer | rewrite_same_key | step-closer | Script needs shorter, more precise language or final timing contract. |
| SHARED-005 | hold-still | rewrite_same_key | hold-still | Script needs shorter, more precise language or final timing contract. |
| SHARED-006 | turn-on-light | rewrite_same_key | turn-on-light | Script needs shorter, more precise language or final timing contract. |
| SHARED-007 | framing-ready | rewrite_same_key | framing-ready | Script needs shorter, more precise language or final timing contract. |
| SHARED-008 | turn-side-on | split_into_new_keys | camera-turn-side-next-v2, camera-turn-side-correction-v2 | Transition prompts and current-movement corrections have different meanings. |
| SHARED-009 | face-forward | split_into_new_keys | camera-face-front-next-v2, camera-face-front-correction-v2 | Transition prompts and current-movement corrections have different meanings. |
| SHARED-010 | countdown-three | keep_but_retime | countdown-three | Words are right; active timers must align to audible go onset. |
| SHARED-011 | countdown-two | keep_but_retime | countdown-two | Words are right; active timers must align to audible go onset. |
| SHARED-012 | countdown-one | keep_but_retime | countdown-one | Words are right; active timers must align to audible go onset. |
| SHARED-013 | go | keep_but_retime | go | Words are right; active timers must align to audible go onset. |
| SHARED-014 | ex-hamstring-reach | split_into_new_keys | ex-seated-hamstring-reach-first-v2, micro-mobility-left-v2 | Current shared cue is used by training and micro-check but needs side-specific contracts. |
| TRAIN-001 | training-intro | rewrite_same_key | training-intro | Script needs shorter, more precise language or final timing contract. |
| TRAIN-002 | thats-your-set | rewrite_same_key | thats-your-set | Script needs shorter, more precise language or final timing contract. |
| TRAIN-003 | rest-now | rewrite_same_key | rest-now | Script needs shorter, more precise language or final timing contract. |
| TRAIN-004 | next-up | rewrite_same_key | next-up | Script needs shorter, more precise language or final timing contract. |
| TRAIN-005 | last-set | rewrite_same_key | last-set | Script needs shorter, more precise language or final timing contract. |
| TRAIN-006 | session-complete | rewrite_same_key | session-complete | Script needs shorter, more precise language or final timing contract. |
| TRAIN-007 | set-done | retire | none | Other set-completion and rest cues cover the current flow. |
| TRAIN-008 | cooldown-now | retire | none | There is no real cooldown phase; mobility exercises are ordinary items. |
| TRAIN-009 | time-to-retest | conditional_protocol_only | none | Belongs in block-completion product flow, not ordinary session playback. |
| TRAIN-010 | exercise-skipped | replace_with_new_key | skip-confirmation-v2 | Current line is too long for an active skip confirmation. |
| TRAIN-011 | ex-sit-to-stand | split_into_new_keys | ex-loaded-sit-to-stand-first-v2, ex-sts-cushion-first-v2, ex-sts-power-first-v2, ex-sts-slow-eccentric-first-v2, ex-sts-standard-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-012 | ex-squat | split_into_new_keys | ex-chair-supported-split-squat-first-v2, ex-squat-free-first-v2, ex-squat-loaded-first-v2, ex-squat-slow-eccentric-first-v2, ex-squat-supported-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-013 | ex-step-up | split_into_new_keys | ex-step-up-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-014 | ex-heel-raise | split_into_new_keys | ex-heel-raise-free-first-v2, ex-heel-raise-supported-first-v2, ex-toe-raise-supported-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-015 | ex-glute-bridge | split_into_new_keys | ex-glute-bridge-hold-first-v2, ex-glute-bridge-reps-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-016 | ex-push-up | split_into_new_keys | ex-push-up-incline-first-v2, ex-push-up-standard-first-v2, ex-push-up-wall-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-017 | ex-overhead | split_into_new_keys | ex-overhead-press-band-first-v2, ex-overhead-reach-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-018 | ex-hip-hinge | split_into_new_keys | ex-hip-hinge-free-first-v2, ex-hip-hinge-wall-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-019 | ex-balance | split_into_new_keys | ex-balance-feet-together-hold-first-v2, ex-balance-single-leg-hold-first-v2, ex-balance-tandem-hold-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-020 | ex-neck-rotation | split_into_new_keys | ex-neck-rotation-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-021 | ex-march | split_into_new_keys | ex-loaded-march-first-v2 | A family cue is not accurate enough for exact levels, equipment, tempo, load, and side. |
| TRAIN-022 | global_stop_sharp_or_increasing_pain | merge_into_new_key | safe-session-start-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-023 | global_stop_dizzy_or_lightheaded | merge_into_new_key | safe-session-start-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-024 | global_breathe_normally | retire | none | This global cue is lower value than the consolidated universal safety line and would add avoidable narration. |
| TRAIN-025 | global_clear_space | merge_into_new_key | safe-session-start-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-026 | global_stop_if_support_moves | merge_into_new_key | safe-session-start-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-027 | global_pause_if_tracking_lost | replace_with_new_key | tracking-lost-v2, tracking-recovered-v2 | Recovery should use user-action language, not implementation language. |
| TRAIN-028 | support_use_sturdy_support | merge_into_new_key | safe-support-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-029 | support_keep_support_within_reach | merge_into_new_key | safe-support-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-030 | chair_use_sturdy_chair | merge_into_new_key | safe-chair-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-031 | chair_controlled_sit | merge_into_new_key | none | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-032 | floor_clear_space | merge_into_new_key | safe-floor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-033 | floor_use_support_for_transfer | merge_into_new_key | safe-floor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-034 | floor_slow_transition | merge_into_new_key | safe-floor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-035 | floor_stop_if_transfer_unsteady | merge_into_new_key | safe-floor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-036 | step_use_low_stable_step | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-037 | step_fixed_support_nearby | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-038 | step_clear_dry_area | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-039 | step_phone_out_of_path | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-040 | step_controlled_return | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-041 | step_stop_if_unstable | merge_into_new_key | safe-step-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-042 | band_inspect_before_use | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-043 | band_secure_grip | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-044 | band_face_and_eyes_clear | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-045 | band_controlled_return | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-046 | band_never_release_under_tension | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-047 | band_stop_if_slips_or_shifts | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-048 | band_anchor_feet_secure | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-049 | band_do_not_overstretch | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-050 | door_anchor_follow_manufacturer_setup | merge_into_new_key | safe-door-anchor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-051 | door_anchor_fully_closed | merge_into_new_key | safe-door-anchor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-052 | door_anchor_test_light_tension | merge_into_new_key | safe-door-anchor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-053 | door_anchor_stay_out_of_door_path | merge_into_new_key | safe-door-anchor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-054 | door_anchor_stop_if_moves | merge_into_new_key | safe-door-anchor-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-055 | band_stable_stance | merge_into_new_key | safe-band-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-056 | comfortable_range_only | merge_into_new_key | none | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-057 | mobility_no_forcing | merge_into_new_key | none | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-058 | balance_stop_if_unsteady | merge_into_new_key | safe-balance-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-059 | balance_support_within_reach | merge_into_new_key | safe-balance-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-060 | balance_supported_if_hesitant | merge_into_new_key | safe-balance-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-061 | balance_no_eyes_closed_or_unstable_surface | merge_into_new_key | safe-balance-first-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-062 | tracking_keep_full_body_in_view | merge_into_new_key | visibility-problem-v2 | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-063 | tracking_pause_and_reset | replace_with_new_key | tracking-lost-v2, tracking-recovered-v2 | Recovery should use user-action language, not implementation language. |
| TRAIN-064 | tracking_no_rush_or_exaggerate | merge_into_new_key | none | Consolidates safety into universal/equipment/exercise-specific layers. |
| TRAIN-065 | tracking_move_when_cued | merge_into_new_key | countdown-three, countdown-two, countdown-one, go | Consolidates safety into universal/equipment/exercise-specific layers. |
| CHECKUP-001 | checkup-intro | rewrite_same_key | checkup-intro | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-002 | checkup-complete | rewrite_same_key | checkup-complete | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-003 | next-exercise | rewrite_same_key | next-exercise | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-004 | chair-stand-intro | rewrite_same_key | chair-stand-intro | Keep behavior but include it in the final reviewed map. |
| CHECKUP-005 | chair-stand-setup | rewrite_same_key | chair-stand-setup | Keep behavior but include it in the final reviewed map. |
| CHECKUP-006 | balance-intro | rewrite_same_key | balance-intro | Keep behavior but include it in the final reviewed map. |
| CHECKUP-007 | balance-setup | rewrite_same_key | balance-setup | Keep behavior but include it in the final reviewed map. |
| CHECKUP-008 | balance-feet-together | rewrite_same_key | balance-feet-together | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-009 | balance-semi-tandem | conditional_protocol_only | none | Not in the default balance ladder; keep only if a future policy includes semi-tandem. |
| CHECKUP-010 | balance-tandem | rewrite_same_key | balance-tandem | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-011 | balance-single-leg | rewrite_same_key | balance-single-leg | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-012 | close-your-eyes | keep_as_is | close-your-eyes | Line is correct, short, and protocol-compatible. |
| CHECKUP-013 | open-your-eyes | keep_as_is | open-your-eyes | Line is correct, short, and protocol-compatible. |
| CHECKUP-014 | tug-intro | conditional_protocol_only | tug-intro | TUG remains beta-only and should not enter the default check-up. |
| CHECKUP-015 | tug-setup | conditional_protocol_only | tug-setup | TUG remains beta-only and should not enter the default check-up. |
| CHECKUP-016 | shoulder-intro | rewrite_same_key | shoulder-intro | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-017 | shoulder-setup | rewrite_same_key | shoulder-setup | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-018 | relax-arm | rewrite_same_key | relax-arm | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-019 | hinge-intro | rewrite_same_key | hinge-intro | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-020 | hinge-setup | rewrite_same_key | hinge-setup | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-021 | stand-tall | rewrite_same_key | stand-tall | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-022 | times-up | rewrite_same_key | times-up | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-023 | you-completed | keep_as_is | you-completed | Line is correct, short, and protocol-compatible. |
| CHECKUP-024 | num-{n} | split_into_new_keys | num-0..num-64 | Chair stand max is 64; current bundled range stops at 40. |
| CHECKUP-025 | stands-suffix | split_into_new_keys | chair-stand-singular-v2, chair-stand-plural-v2 | Singular/plural result grammar must be exact. |
| CHECKUP-026 | no-reps | rewrite_same_key | no-reps | Script needs shorter, more precise language or final timing contract. |
| CHECKUP-027 | item-complete | keep_as_is | item-complete | Line is correct, short, and protocol-compatible. |
| MICRO-001 | microcheck-chair | rewrite_same_key | microcheck-chair | Keep behavior but include it in the final reviewed map. |
| MICRO-002 | microcheck-balance | rewrite_same_key | microcheck-balance | Keep behavior but include it in the final reviewed map. |
| MICRO-003 | microcheck-complete | rewrite_same_key | microcheck-complete | Script needs shorter, more precise language or final timing contract. |
| MICRO-004 | microcheck-intro | retire | none | Type-specific micro-check intros provide enough context and keep the flow quick. |

## 18. New Cue Manifest

The CSV companion file contains 186 proposed new or regenerated cue assets/fragments with duration estimates and implementation phase. The JSON companion includes the same rows under `newCueManifest`.

## 19. Retired and Conditional Cues

Retired cues: set-done, cooldown-now, global_breathe_normally, microcheck-intro.

Conditional protocol-only cues: time-to-retest, balance-semi-tandem, tug-intro, tug-setup.

## 20. Implementation Phases

| Phase | Name | Scope | Risk | Tests | Gate |
|---:|---|---|---|---|---|
| 1 | Cue schema and source of truth refactor | Add final cue schema, manifest validation, and migration snapshot. | medium | cue schema tests, orphan detection | JSON/CSV manifest accepted by reviewers |
| 2 | Exact training-level instruction mapping | Map each exercise id to exact first-use and later-set cue keys. | medium | 37-level voice mapping tests | all 37 levels covered |
| 3 | Safety consolidation | Replace many atomic safety cues with universal/equipment/exercise/reactive layers. | medium | safety frequency tests, no duplicate family cue tests | max setup durations pass |
| 4 | Dynamic target and side grammar | Add complete target phrase assets, side fragments, set-plan phrases, and number range 0..64. | medium | singular/plural and side grammar tests | all voice-first-required targets spoken |
| 5 | Pause, resume, skip, retry, recovery | Make controls deterministic and cancellable; add fresh countdown on resume/retry/recovery. | medium | state-machine tests for stale callbacks | no stale callback advances old flow |
| 6 | Check-up side persistence and number accuracy | Persist side metadata and exact chair-stand result grammar. | medium-high | side persistence tests, 0/1/41/64 result tests | official retests use same side |
| 7 | Micro-check consistency | Use type-specific intros, side persistence, discard/retry behavior. | medium | micro runner replay tests | all three micro checks pass voice contract |
| 8 | One-voice preview generation | Generate Clara only for changed/new cue keys. | low | duration CSV, listening checklist | human review accepts scripts/prosody |
| 9 | Human script and audio review | Review exact scripts, pronunciation, cadence, composition joins. | low | review checklist signoff | no script marked unresolved |
| 10 | Both-voice generation | Generate Clara and Marcus for approved changed/new keys. | medium | asset completeness and duration verification | both voices complete and semantically equivalent |
| 11 | Controller integration | Wire final cue architecture into training/checkup/micro flows. | high | timeline audit replay and targeted controller tests | no deterministic drops or stale cues |
| 12 | Automated tests | Expand unit/replay coverage for cue triggers and migrations. | medium | Jest, tsc, runtime timeline audit | all acceptance tests pass |
| 13 | Android/iOS physical-device QA | Validate audible go onset, camera, and listening experience on devices. | medium-high | device timing logs, manual checklist | go onset within tolerance and no audio/camera interruption |
| 14 | Controlled beta rollout | Enable for controlled beta, monitor recordings/logs, run timeline audit after changes. | medium | post-rollout audit | beta users complete flows eyes-off |

## 21. Acceptance Criteria

- Every exact registered training level has an accurate instruction and later-set reminder.
- No training level relies on an inaccurate family cue.
- No reachable exercise has a missing movement instruction.
- Every unilateral measurement has a deterministic and persisted side rule.
- Every voice-first-required target is spoken.
- All proposed scripts meet timing budgets or have explicit documented exceptions.
- Safety narration uses universal, equipment-family, exercise-specific, and reactive layers at the specified frequency.
- Active timers align to audible go onset for Clara and Marcus without producing different state outcomes.
- Chair-stand spoken result always equals accepted result for 0 through 64 reps with singular/plural grammar.
- Pause, resume, retry, skip, tracking loss, and tracking recovery cannot advance stale flows.
- A user can complete core training, default check-up, and all three micro checks without reading essential movement instructions.
- No implementation language, medical claims, patronising repetition, V1, tracking reset, or just for the camera wording remains in active scripts.
- Every cue migration is accounted for and every generated asset exists for both voices before runtime integration.
- The runtime timeline audit can be rerun after implementation and returns zero deterministic drops or interruptions.

## 22. Audio Generation and Review Plan

Approve scripts before cue keys, then generate a Clara-only preview because Clara currently has the longest p95 duration and the largest observed Clara-Marcus timing difference. Human review checks correctness, pronunciation, prosody, warmth, composable-fragment continuity, and budget fit. After signoff, generate both voices only for changed/new keys, update manifests, verify asset completeness, detect orphans, rerun the runtime timeline audit, and perform physical-device listening tests. Do not call ElevenLabs or expose API keys during this spec task.

## 23. Physical-Device QA Plan

- Measure actual audio onset for countdown-three, countdown-two, countdown-one, and go on Android and iOS with Clara and Marcus.
- Verify active timer starts at audible go onset, not speak() dispatch time or file end time.
- Run training sessions containing chair, step, long-band, door-anchor, mini-band, floor, balance, and unilateral side switches.
- Run default Movement Check-Up and verify side-specific shoulder/balance/hinge wording and exact chair-stand result grammar.
- Run all three micro checks, including retry, discard, tracking loss, and resume.
- Confirm audio configuration does not interrupt camera capture on iOS release builds.
- Repeat in dim/warm lighting and cluttered domestic setup to validate distinct low-light versus visibility prompts.

## 24. Unresolved Protocol Decisions

No unresolved protocol decisions remain in this proposed spec. Items that stay conditional, such as TUG and semi-tandem, have explicit safe defaults.

## 25. Validation and Source Index

- Parsed both source audit JSON files and the asset-duration CSV.
- Verified 110 migration rows for 110 existing cue templates.
- Verified 37 exact training-level voice contracts.
- Verified 8 assessment contracts and 3 micro-check contracts.
- Proposed cue keys are unique: true.
- Retired cues absent from new manifest: true.
- Hard duration failures in proposed manifest: none.
- Source files inspected include src/audio/cues.ts, src/training/sessionPlayer.ts, src/assessment/sessionController.ts, src/checkup/checkup.ts, src/training/microCheck.ts, src/training/safetyCues.ts, src/training/safetyCueDefinitions.ts, src/movements/*.ts, and src/exercises/*.ts.

