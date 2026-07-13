# Pearl Voice Project Post-Side-Persistence Handoff

Generated: 2026-06-24

## Status

Measurement-side protocol metadata foundation is implemented in code and persistence, with audit verdict `REMEDIATION_REQUIRED` for deferred UI/voice side-selection follow-ups.

No audio was generated. No audio files were changed. No external API calls were made. Physical Android/iOS QA remains deferred.

## Current Protocol-Registry API

Use:

- `listMeasurementProtocols()`
- `getMeasurementProtocolDescriptor(protocolId, version?)`
- `descriptorForMovementMeasurement({ movementId, policyId, protocolVariant })`
- `descriptorForMicroCheck(type)`
- `protocolRefForDescriptor(descriptor, variant?)`

The registry lives in `src/checkup/measurementProtocolRegistry.ts`.

## Current Side Metadata API

Use:

- `MeasurementContext`
- `normalizeCheckUpMeasurementMetadata(checkUp, { checkupType })`
- `normalizeMicroCheckMeasurementMetadata(result, options)`
- `deriveMeasurementComparability(...)`
- `measurementSeriesKey(...)`
- `comparableMeasurementSeriesKey(...)`
- `findOfficialMeasurementAnchor(...)`
- `deriveOfficialMeasurementSide(...)`

## How To Register The New Balance Protocol

Add a new descriptor to `MEASUREMENT_PROTOCOLS` with a new protocol id/version. Do not reuse `mpv2_single_leg_balance_45s_v1`.

Expected future shape:

- `movementId`: the new eyes-open balance movement id
- `sideRole`: `standing_leg` if the protocol records a selected standing leg
- `sideRequired`: `true`
- `comparisonGroup`: a new stable balance comparison group
- `officialEvidenceEligible`: `true`

## New Protocol Results Start A New Series

Series keys include comparison group, protocol id, protocol version, side role, and side/NA. A new balance protocol id/version will not silently bridge to current MPV2 single-leg history.

## Existing MPV2 History

Current MPV2 single-leg balance history remains preserved under `mpv2_single_leg_balance_45s_v1`. It must continue to render as its own raw/check-up series.

## Reusing Official Standing-Leg Anchor

If product wants the new eyes-open protocol to reuse a comfortable standing-leg anchor, derive it from valid official side-known evidence with `findOfficialMeasurementAnchor`/`deriveOfficialMeasurementSide`. Do not overwrite old MPV2 results.

## Voice Cues

Existing MPV2 side-aware shoulder cues and generic balance setup cues remain available. The new eyes-open balance protocol will still need reviewed script/audio assets for its exact stage sequence.

## Ungenerated Assets

No new Clara or Marcus assets were generated in this phase. The future balance protocol must list any new required cue ids before audio generation.

## Tests To Preserve

Preserve:

- measurement protocol registry tests
- measurement comparability tests
- check-up and micro-check round-trip tests
- backend sync/restore metadata tests
- history trend suppression tests
- progress/report comparability suppression tests
- MPV2 live coordinator, voice runtime, recovery, internal flow, and cue tests

## Exact Next Task

Approved eyes-open balance protocol V2 reconciliation.
