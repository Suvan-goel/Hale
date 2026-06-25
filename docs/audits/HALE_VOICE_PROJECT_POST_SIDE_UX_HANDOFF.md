# Hale Voice Project Post Side UX Handoff

Date: 2026-06-24

Exact next task:

```text
Approved eyes-open balance protocol V2 reconciliation
```

## Current Protocol-Registry API

Use the canonical measurement registry in `src/checkup/measurementProtocolRegistry.ts`:

- `listMeasurementProtocols()`
- `getMeasurementProtocolDescriptor(protocolId, protocolVersion?)`
- `descriptorForMovementMeasurement(input)`
- `descriptorForMicroCheck(type)`
- `protocolRefForDescriptor(descriptor, protocolVariant?)`
- `protocolVariantForMovementResult(movementId, result)`

The registry currently has 14 protocols. Do not register the future eyes-open balance protocol until the reconciliation task explicitly does so.

## Current Side-Anchor API

Use the metadata layer in `src/checkup/measurementMetadata.ts` and `src/checkup/measurementContext.ts`:

- `normalizeCheckUpMeasurementMetadata(checkUp, options)`
- `normalizeCheckUpItemMeasurementMetadata(checkUp, item, policyId, options)`
- `normalizeMicroCheckMeasurementMetadata(result, options)`
- `findOfficialMeasurementAnchor(input)`
- `deriveOfficialMeasurementSide(input)`
- `measurementResultId(checkUpStartedAt, movementId)`
- `deriveMeasurementComparability(input)`
- `measurementSeriesKey(context, comparisonGroup)`
- `comparableMeasurementSeriesKey(context, comparisonGroup)`

Side-dependent results must persist selected side, observed side when available, side source, anchor side, anchor result id, and comparability status.

## New Micro-Check Side-Resolution API

Use `src/training/microCheckSideSetup.ts`:

- `deriveMicroCheckSideSetup(input)`
- `createMicroCheckMeasurementContextForSide(input)`
- `oppositeMicroCheckSide(side)`

Resolution order:

1. Existing valid side-known micro-check series.
2. Compatible official Movement Check-Up anchor only where explicitly supported.
3. Explicit left/right user choice.
4. Pin side before setup/camera capture.
5. Persist only after valid result.

Current official seeding support is balance micro-check from MPV2 one-leg balance. Mobility micro-check does not borrow official side metadata.

## Official Fallback UI Contract

For side-dependent official retests with an existing official side anchor:

- Normal copy: `We'll use your left side again` and `This keeps the result comparable with your earlier checks.`
- Secondary action: `Use the other side`
- Confirmation copy: `Use the other side? This result may not be directly comparable with your earlier checks. Your usual side will remain unchanged.`
- Confirm action: `Use right side`
- Cancel action: `Keep left side`

Confirmed fallback must persist `opposite_side_fallback` and `reduced_comparability`. It must not replace the official anchor.

## Eyes-Open Balance Protocol Reuse

The future eyes-open balance protocol should reuse the standing-leg anchor policy, but it must not silently merge with the existing MPV2 one-leg balance protocol.

Required behavior:

- Read the existing standing-leg anchor through the side-anchor API.
- Recommend the same standing leg when the new protocol can safely do so.
- Persist the future protocol with a new protocol id/version.
- Start a new comparison series because the eyes-open protocol changes the measurement contract.
- Preserve old MPV2 balance results and keep them queryable by the existing protocol id.
- Do not rewrite existing MPV2 raw results, snapshots, assessments, or micro-check history.

## Current Voice Assets

Reusable today:

- MPV2 shoulder left/right setup and raise cues already exist and are used by the voice runtime.
- MPV2 balance generic attempt/retry cues can remain truthful when paired with visible standing-leg copy.
- Existing micro-check intro cues remain generic.

Still ungenerated:

- Eyes-open balance stage-specific setup cue.
- Eyes-open balance stage transition cues.
- Future micro-check side-specific confirmation cues.
- Any new side-specific balance cue variants required by Voice V2.1.

No audio was generated in the side UX completion task.

## Tests That Must Remain Green

- `npm run verify:audio`
- `npx tsc --noEmit`
- `src/checkup/__tests__/measurementProtocolRegistry.test.ts`
- `src/checkup/__tests__/measurementComparability.test.ts`
- `src/training/__tests__/microCheck.test.ts`
- `src/training/__tests__/microCheckSideSetup.test.ts`
- `src/training/__tests__/store.test.ts`
- `src/history/__tests__/history.test.ts`
- `src/services/backend/__tests__/microCheckSyncService.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/movementProfileV2/__tests__/internalCheckupFlow.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/movementProfileV2/__tests__/voiceRuntime.test.ts`
- `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts`
- `src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts`

## Device QA

Physical Android/iOS device QA remains deferred. The future eyes-open balance reconciliation must still treat device QA as a release blocker before public release.
