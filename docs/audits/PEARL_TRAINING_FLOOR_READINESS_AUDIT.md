# Pearl Training Floor-Transfer Readiness Audit

## Verdict

`TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE`

## Baseline

- currentPhaseBaseline: post_safety_integration
- safetyIntegrationCompleteValue: true
- trainingVoiceSafetyReadyValue: true
- trainingVoiceBehaviorReadyValue: true
- trainingVoiceAudioReadyValue: false

## Metrics

- floorExerciseCount: 3
- floorContractCount: 3
- irVoiceFloorGateRemainingCount: 0
- irVoiceFinalPositionRemainingCount: 0
- irVoiceSafetySubsumptionRemainingCount: 0
- trainingVoiceFeatureDefault: off
- trainingVoiceSelectableExerciseCount: 0
- floorGateLeakCount: 0
- floorSpaceOnlyLeakCount: 0
- unconfirmedFloorExerciseLeakCount: 0
- avoidFloorExerciseLeakCount: 0
- confirmedWithoutFloorSpaceLeakCount: 0
- directHelperBypassCount: 0
- prematureFinalPositionCueCount: 0
- countdownBeforeFinalPositionCount: 0
- activeBeforeFinalPositionCount: 0
- staleFloorSetupMutationCount: 0
- restoreAutoStartCount: 0
- legacyFloorAuditStaleExpectationCount: 0
- postSafetyRebaseAppliedCount: 1
- postSafetyExpectationMismatchCount: 0
- verifyAudioFailureCount: 0
- audioHashChangedCount: 0
- audioGeneratedCount: 0
- externalSpeechAudioApiCallCount: 0
- physicalManifestChangeCount: 0
- gitAudioDiffAgainstHeadCount: 0
- p0/p1/p2/p3: 0/0/0/4

## Findings

- P3-PHYSICAL-DEVICE-QA [P3] deferred: Physical device floor setup reliability remains deferred.
- P3-HUMAN-LISTENING [P3] waived: Human listening remains waived; regenerated corpus not human-listened in this task.
- P3-REGENERATED-CORPUS-LISTENING [P3] waived: Regenerated audio corpus is verified by manifest/hash only; human listening remains outside this task.
- P3-PHYSICAL-SPEAKER-TIMING [P3] deferred: Physical speaker/device timing remains deferred.
