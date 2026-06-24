# Hale Logic Remediation Stage 3D-B.2D.2C

Automatic Movement Profile V2 plan creation, V2 `MovementBlock` origin contract, balanced block integration, and Stage 5 lifecycle wiring under the product-owner closed-beta device-validation waiver.

## Waiver Truth

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA
DEVICE BEHAVIOUR NOT YET VERIFIED
BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT
PUBLIC RELEASE REMAINS BLOCKED
```

This report records software implementation and automated validation only. It does not claim physical-device validation, broad beta readiness, public release readiness, medical accuracy, improvement/decline evidence, or live-device behavior verification.

## Pre-Edit Baseline

The working tree was already dirty before this remediation. Existing modified and untracked files were treated as user-owned and were not reverted.

Baseline validation was run before implementation and passed:

```text
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
npx --no-install expo export --platform ios --output-dir /tmp/hale-stage3db2d2c-waiver-export
```

## Implementation Summary

- Added V2 `MovementBlock` origin and focus metadata, including a domain focus kind and a balanced focus kind. `balanced` is not a `MovementDomain`.
- Added deterministic V2 block materialization from frozen V2 snapshot and assessment artifacts:
  - stable id `movement-block-v2:<encoded-assessment-id>`;
  - source-bound snapshot and assessment validation;
  - deterministic block fingerprint;
  - same-id/same-fingerprint reuse;
  - fail-closed handling for malformed artifacts, future policy/schema, source mismatch, needs-retake, active-block conflict, and immutable same-id/different-fingerprint conflict.
- Wired the internal V2 flow so block creation happens automatically after artifact freeze and before the Movement Profile results screen is shown.
- Kept the Movement Profile CTA as navigation only. The ready-state CTA is exactly:

```text
View my 4-week plan
```

- Added genuine balanced templates with explicit source provenance:

```text
balanced-A -> strength-A
balanced-B -> balance-B
balanced-C -> mobility-C
```

- Reused Stage 5 planning, schedule, focus-stimulus evidence, session completion, progression, Plan/Today, serialization, sync, and restore paths. No parallel training lifecycle was added.
- Added local-first sync behavior: the local V2 block is persisted before the best-effort remote block sync. Remote sync failure does not roll back local plan creation.
- Preserved closed-beta posture: V2 remains behind the existing internal gate; V1 remains the public/default Check-Up.

## Balanced Block Safeguards

- Balanced blocks do not persist `focusDomain`.
- Balanced blocks use `focus.kind = "balanced"` plus balanced template policy version and fingerprint.
- Primary focus credit for balanced sessions is based on the concrete planned session template, not a block-level fake domain:
  - `balanced-A` plans strength primary stimulus;
  - `balanced-B` plans balance primary stimulus;
  - `balanced-C` plans mobility primary stimulus.
- Weekly Plan/Today labels read the scheduled template focus so balanced weeks display strength, balance, and mobility session purposes.
- Weekly micro-checks remain domain-specific and are suppressed for balanced blocks.

## Failure Boundaries

The V2 block materializer fails closed and leaves the Movement Profile available when:

- snapshot parsing fails;
- assessment parsing fails;
- snapshot or assessment schema is from a future policy;
- source check-up, check-up type, snapshot, and assessment do not match;
- the frozen assessment says `needs_retake`;
- another active or paused block already exists;
- a block with the expected id exists but carries different immutable material.

Bounded breadcrumbs record the failure reason and block ids without raw pose data or health text.

## Files Added

- `src/adherence/blockFocus.ts`
- `src/haleFlow/blockTrainingPlan.ts`
- `src/haleFlow/movementProfileV2Block.ts`
- `src/haleFlow/__tests__/movementProfileV2Block.test.ts`

## Validation

Targeted validation during implementation passed:

```text
npm test -- --runInBand src/haleFlow/__tests__/movementProfileV2Block.test.ts
npm test -- --runInBand src/haleFlow/__tests__/movementProfileV2Block.test.ts src/haleFlow/__tests__/appLifecycle.test.ts
npm run typecheck
```

Final required validation after documentation updates:

```text
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
npx expo export --platform ios --output-dir /tmp/hale-stage3db2d2c-waiver-export
```

Result: passed. An initial full Jest run surfaced a legacy fixture compatibility issue where
older blocks used `focusDomain` as the authoritative field; the focus normalizer was corrected
to preserve legacy/domain-block behavior while balanced V2 blocks remain clean because they do
not carry `focusDomain`. The full required validation sequence was then rerun successfully.

## Release Posture

Software implementation is complete for invite-only closed beta evaluation only.

Public release remains blocked until later physical-device validation and full lifecycle verification are completed and recorded.
