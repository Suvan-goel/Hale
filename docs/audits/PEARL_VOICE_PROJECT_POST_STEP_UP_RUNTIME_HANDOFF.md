# Pearl Voice Project Post Step-Up Runtime Handoff

## Runtime Status

TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING

## Preserve

- Runtime selector: `selectTrainingSetRuntime(...)`
- Runtime owner: `TrainingSessionPlayer` owns one `TrainingSetRuntime`
- Pose evidence adapter: `createStepUpAlternationEvidenceAdapter()`
- Live SetResult path: `StepUpAlternationSetRuntime.finish()`
- Backend fields: `stepUpAlternationPlan`, `stepUpInitialLeadSide`, `activeSetRuntime`, `bothSidesStartSideSeed`
- Seed integration: successful main-plan `step-up` completion flips once
- Defaults: step-up alternation, Training Voice V2.1, and Balance V2 remain closed

## Tests To Preserve

- `src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts`
- Backend training-state sync and restore tests
- Existing isolated step-up, both-sides, voice V2.1, session-player, and generation suites

## Exact Next Task

Training floor-transfer readiness gate implementation
