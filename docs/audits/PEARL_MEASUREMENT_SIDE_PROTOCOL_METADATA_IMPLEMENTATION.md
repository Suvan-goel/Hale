# Pearl Measurement-Side Persistence and Protocol Metadata Implementation

Generated: 2026-06-24

## 1. Result

Implemented the canonical measurement protocol/side metadata foundation for check-up, micro-check, local history, backend JSON sync/restore, trend suppression, progress cards, and block-report suppression hooks.

Verdict: `REMEDIATION_REQUIRED`, because the metadata contract is in place but two UI/voice follow-ups remain: explicit side-aware micro-check selection and a dedicated opposite-side fallback action/copy.

## 2. Approved FD-002 Contract

FD-002 is represented in code as strict protocol refs, side roles, side sources, comparability statuses, and stable reason codes. Unknown legacy side defaults to raw-only.

## 3. Canonical Types

Added `src/checkup/measurementContext.ts` with `MeasurementProtocolRef`, `MeasurementSideContext`, `MeasurementComparability`, and `MeasurementContext`.

## 4. Protocol Registry

Added `src/checkup/measurementProtocolRegistry.ts`.

Registered protocols: 14.
Side-required: 6.
Side-independent: 8.

The current MPV2 balance item is registered as `mpv2_single_leg_balance_45s_v1`; the future eyes-open ladder is not registered.

## 5. Side Semantics by Measurement

Chair stand/chair power and TUG are side-independent for longitudinal comparison.

Legacy balance ladder and legacy shoulder are side-required but missing side, so older records are `side_unknown_raw_only`.

MPV2 single-leg balance uses `standing_leg`; active shoulder reach uses `measured_arm`; hinge reach remains side-independent as a standing forward-reach metric.

## 6. Official Anchor Selection

Added `findOfficialMeasurementAnchor` and `deriveOfficialMeasurementSide`. MPV2 retest selectors now prefer stored `measurementContext` and fall back to older raw `standingLeg`/`selectedSide`.

## 7. Baseline and Retest Flow

Valid side-known baseline metadata establishes a new side/protocol baseline. Official retests that carry prior setup side metadata become same-side comparable.

## 8. Opposite-Side Fallback

Existing MPV2 setup `changedFromPrior` is normalized as `opposite_side_fallback` with `reduced_comparability`; it does not replace the anchor.

Dedicated fallback UI copy/action remains a P2 follow-up.

## 9. Attempt Pinning and Runtime Guards

Protocol and side metadata are pinned on persisted result normalization. Existing MPV2 retry/recovery tests continue to preserve selected side.

## 10. MPV2 Voice/Grader Side Consistency

No MPV2 voice assets changed. MPV2 runtime regression tests pass with no voice-side mismatch found at static/runtime level.

## 11. Micro-Check Metadata

Micro-check results now persist `measurementContext`.

Chair-power is side-independent. Single-leg and mobility micro-checks fail closed to raw-only unless explicit side metadata is supplied by a later UI/voice pass.

## 12. Serialization and Legacy Defaults

Local check-up and micro-check serializers normalize metadata on save/load. Schema versions were not incremented because changes are additive inside existing JSON envelopes.

Malformed or missing metadata defaults safely to unknown/raw-only.

## 13. Backend Sync and Restore

No Supabase migration was added. Existing JSON payloads now include normalized metadata. Restore duplicate merging prefers richer side-known metadata after preserving existing V2 fingerprint conflict rules.

## 14. History and Comparability

Trend deltas now require a comparable protocol/side series. Raw points still display, but `delta` is null when metadata is unknown, opposite-side, or cross-protocol.

Progress cards and block reports suppress direct change language when raw check-up metadata proves insufficient comparability.

## 15. Feature Flag and Rollback

No runtime feature flag was needed for parsing. Rollback is safe because new fields are additive JSON properties and older readers ignore unknown object fields.

## 16. Diagnostics

Stable reason codes are stored in `MeasurementComparability.reasonCodes`. No raw video, landmarks, account identifiers, or health details are logged by this task.

## 17. Tests

Added focused registry/comparability tests and extended history, micro-check, backend sync, restore, progress, and MPV2 regression coverage.

## 18. Files Changed

Production files changed:

- `src/adherence/types.ts`
- `src/checkup/index.ts`
- `src/checkup/measurementComparability.ts`
- `src/checkup/measurementContext.ts`
- `src/checkup/measurementMetadata.ts`
- `src/checkup/measurementProtocolRegistry.ts`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolSetup.ts`
- `src/checkup/types.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/pearlFlow/reports.ts`
- `src/history/serialize.ts`
- `src/history/trends.ts`
- `src/screens/ProgressScreen.tsx`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/microCheckSyncService.ts`
- `src/services/backend/restoreService.ts`
- `src/training/microCheck.ts`
- `src/training/serialize.ts`

## 19. Worktree Integrity

No commits or pushes were made. Audio files were not changed or generated. Physical-device QA remains deferred.

Unrelated pre-existing/render work remains in the worktree and was not modified for this task.

## 20. Exact Next Phase

Approved eyes-open balance protocol V2 reconciliation.
