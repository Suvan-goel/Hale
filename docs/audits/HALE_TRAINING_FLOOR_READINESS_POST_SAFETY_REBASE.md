# Hale Training Floor-Readiness Post-Safety Rebase

## 1. Executive Verdict

`TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE`

## 2. Why the Original Floor Audit Became Stale

The original floor-readiness audit was correct when safety-family integration was still pending. The later Training Voice V2.1 live safety integration completed that work and removed `IR-VOICE-SAFETY-SUBSUMPTION` from active V2.1 contracts. The floor audit now uses current source readiness to distinguish the pre-safety and post-safety baselines.

## 3. Worktree and Regenerated-Audio Baseline

Task-start audio hash file: `/tmp/hale_floor_post_safety_audio_entry.sha256`. Available: true. Task-start hash count: 365. Current hash count: 365. Hash diffs this task: 0.

Git HEAD audio diff count is 364; this is documented as `baseline_audio_diff_method_stale_not_product_failure`.

## 4. Current Phase Reconciliation

Current baseline: `post_safety_integration`. Safety integration complete: true. Training safety ready: true. Training behavior ready: true.

## 5. Floor Contract Blocker State

- irVoiceFloorGateRemainingCount: 0
- irVoiceFinalPositionRemainingCount: 0
- irVoiceSafetySubsumptionRemainingCount: 0

## 6. Canonical Floor Gate Regression Check

Floor gate leak count: 0. Direct helper bypass count: 0. Unconfirmed, avoid-for-now, and confirmed-without-floor-space cases all remain blocked.

## 7. Final-Position Regression Check

Countdown before final position: 0. Active work before final position: 0. Stale setup mutation count: 0. Restore auto-start count: 0.

## 8. Training Voice Safety/Behaviour Readiness Check

Safety ready: true. Behavior ready: true. Controls/progress/recovery are ready in current source.

## 9. Feature and Audio Gate Check

Training Voice V2.1 feature default: off. Audio ready: false. Selectable V2.1 exercises: 0. Floor V2.1, Balance V2, Step-up alternation, and Micro-Check Voice V2.1 remain default closed/audio pending as applicable.

## 10. Audit Harness Update

`scripts/audits/audit-training-floor-readiness.mjs` now applies a source-derived baseline. If safety integration is complete and safety ready is true, floor contracts are expected to have zero `IR-VOICE-SAFETY-SUBSUMPTION` blockers.

## 11. Tests and Validation

The harness runs production probes through `tsx`, verifies audio with `npm run verify:audio`, and emits task-start audio hash comparison metrics. Focused validation should still run outside the harness.

## 12. Findings

- P3-PHYSICAL-DEVICE-QA [P3] deferred: Physical device floor setup reliability remains deferred.
- P3-HUMAN-LISTENING [P3] waived: Human listening remains waived; regenerated corpus not human-listened in this task.
- P3-REGENERATED-CORPUS-LISTENING [P3] waived: Regenerated audio corpus is verified by manifest/hash only; human listening remains outside this task.
- P3-PHYSICAL-SPEAKER-TIMING [P3] deferred: Physical speaker/device timing remains deferred.

## 13. Worktree Integrity

No production code changes are required by this audit rebase. No audio generation or external speech/audio API call is part of this harness. Existing regenerated audio is handled against task-start hashes rather than Git HEAD.

## 14. Exact Next Task

Final Voice V2.1 cue schema and physical manifest reconciliation.
