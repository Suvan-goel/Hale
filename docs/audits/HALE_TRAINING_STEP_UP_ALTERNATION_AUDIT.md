# Hale Training Step-Up Alternation Audit

Generated: 2026-06-25T12:02:39.014Z

## Primary Verdict

TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE_DEFAULT_CLOSED

## Metrics

| Metric | Value |
|---|---:|
| scenarioCount | 27 |
| passedScenarioCount | 27 |
| failedScenarioCount | 0 |
| canonicalTargetTotalReps | 12 |
| canonicalLeftLeadReps | 6 |
| canonicalRightLeadReps | 6 |
| validSetAcceptedRepCount | 12 |
| validSetRepSfxCount | 12 |
| wrongLeadNoCreditScenarioCount | 1 |
| invalidNoCreditScenarioCount | 4 |
| staleOrDuplicateSuppressionScenarioCount | 3 |
| acceptedRepEvidenceCount | 12 |
| rejectedRepEvidenceCount | 5 |
| generatedSessionDefaultClosedCount | 1 |
| seedFlipScenarioCount | 2 |
| voiceStartLeadCueScenarioCount | 1 |
| voiceWrongLeadCueScenarioCount | 1 |
| irVoiceStepAlternationRemaining | 0 |
| safetyBlockerStillPresentCount | 1 |
| trainingVoiceSelectableCount | 0 |
| audioAssetDiffCount | 0 |
| p0 | 0 |
| p1 | 0 |
| p2 | 0 |
| p3 | 0 |

## Gates

- Step-up alternation feature default: off
- Training Voice V2.1 default: off
- Training Voice V2.1 audio ready: false
- Training Voice V2.1 behavior ready: false
- Balance V2 default closed: true
- Balance V2 audio ready: false

## Scenario Evidence

See `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv` and `docs/audits/HALE_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv`.

Next task: Training floor-transfer readiness gate implementation
