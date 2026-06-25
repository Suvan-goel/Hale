# Hale Measurement Side UX Completion Implementation

Date: 2026-06-24

Verdict target: `SIDE_PROTOCOL_FOUNDATION_COMPLETE`

## 1. Scope

This patch closes the two P2 findings from the side protocol metadata audit:

- `MSP-P2-001`: side-dependent micro-checks now require a pinned side before camera capture unless an existing side-known micro-check series or supported official balance anchor supplies a recommendation.
- `MSP-P2-002`: side-dependent official MPV2 retests now expose a dedicated "Use the other side" path with explicit reduced-comparability warning copy before dispatching the opposite side.

Eyes-open balance protocol V2 was not implemented.

## 2. Micro-Check Side Resolution

New pure API:

- `deriveMicroCheckSideSetup(input)`
- `createMicroCheckMeasurementContextForSide(input)`
- `oppositeMicroCheckSide(side)`

Resolution order:

1. Existing valid side-known micro-check series for the same micro-check protocol.
2. Compatible official Movement Check-Up anchor only where explicitly supported. Current support is balance micro-check from MPV2 one-leg balance standing leg.
3. Explicit left/right user choice.
4. Side is pinned before the runner is created.
5. Measurement metadata is persisted only after a valid runner result.

## 3. Micro-Check Policy

- `chair-power`: side-independent; no side setup screen.
- `single-leg-balance`: prefers existing micro-check series, then MPV2 official standing-leg recommendation, then explicit left/right choice.
- `mobility-reach`: prefers existing mobility micro-check series only. It does not borrow shoulder, hinge, or balance official side metadata.

## 4. Micro-Check UX

No-anchor copy:

- Heading: `Which side will you use?`
- Balance body: `Choose the leg you can hold most comfortably today. Use the same leg each time for clearer progress.`
- Mobility body: `Choose the leg you can extend comfortably. Use the same leg each time for clearer progress.`
- Actions: `Left leg`, `Right leg`

Anchor copy:

- Existing micro-check: `Use your left leg` / `This matches your earlier micro checks.`
- Official recommendation: `Use your left leg` / `This matches your Movement Check-Up.`

Established micro-check opposite side warning:

```text
Use the other side? This check will start or continue a separate side comparison. Your usual side will stay unchanged.
```

## 5. Official Retest UX

MPV2 balance and shoulder setup now show the normal retest path when a prior side anchor exists:

```text
We'll use your left side again
This keeps the result comparable with your earlier checks.
```

The secondary action is:

```text
Use the other side
```

Confirmation copy:

```text
Use the other side? This result may not be directly comparable with your earlier checks. Your usual side will remain unchanged.
```

Confirmed fallback dispatches the opposite side into the existing MPV2 coordinator. Normalization then marks the result as `opposite_side_fallback` with `reduced_comparability`. The prior anchor is not overwritten.

## 6. Lifecycle

- Micro-check side setup renders before camera activation.
- `SafePoseDetectionView` stays inactive until a side-dependent micro-check has a pinned side and runner.
- The micro-check runner receives a fixed `MeasurementContext` at construction time.
- No side-change UI is present during framing, instructions, countdown, active capture, pause, retry, recovery, or app-state transitions.
- MPV2 retry/recovery reuses the side already stored in `flow.standingLeg` or `flow.shoulderSide`.

## 7. Persistence

Micro-check result metadata now receives the pinned side context at runner construction:

- selected side
- observed side, currently equal to selected side because the current micro-check graders do not independently classify side
- side source
- anchor side
- anchor result id
- comparability status

Existing serializers, backend sync payloads, restore merge richness, trend suppression, progress, and report logic continue to use the metadata layer added in the prior task.

## 8. Voice

No audio assets were generated or changed.

No ElevenLabs call, runtime TTS call, or external speech/audio API call was made.

MPV2 shoulder continues to use existing left/right voice cue assets. Balance and micro-check side setup rely on visible copy plus existing generic cues. Future micro-check side-specific voice assets remain a Voice V2.1 gap.

## 9. Diagnostics

Added audit-only harness:

- `scripts/audits/audit-measurement-side-ux.mjs`

The harness validates the post-UX audit JSON, scenario CSV, and source-level side UX contracts.

## 10. Tests

Added:

- `src/training/__tests__/microCheckSideSetup.test.ts`
- `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts`

Existing focused suites remain responsible for measurement context, protocol registry, comparability, history/trends, backend sync/restore, and MPV2 coordinator/recovery behavior.

## 11. Accessibility

All new interactive actions use existing `Pressable`, `PrimaryButton`, `SecondaryButton`, or `ControlButton` paths with accessibility roles and labels inherited from those primitives. The no-anchor micro-check state has no default selected side.

## 12. Files Changed

Production:

- `App.tsx`
- `src/screens/MicroCheckScreen.tsx`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/training/index.ts`
- `src/training/microCheckSideSetup.ts`

Tests:

- `src/training/__tests__/microCheckSideSetup.test.ts`
- `src/screens/__tests__/MicroCheckScreen.sideSetup.test.ts`

Audit/docs:

- `docs/audits/HALE_MEASUREMENT_SIDE_UX_COMPLETION_IMPLEMENTATION.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.md`
- `docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.json`
- `docs/audits/HALE_MEASUREMENT_SIDE_UX_SCENARIOS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_SIDE_UX_HANDOFF.md`
- `scripts/audits/audit-measurement-side-ux.mjs`
- `docs/decisions.md`

## 13. Worktree Integrity

The worktree was already dirty before this patch. Unrelated pre-existing renderer, protocol metadata, backend, history, and audit changes were not reverted.

## 14. Exact Next Phase

```text
Approved eyes-open balance protocol V2 reconciliation
```
