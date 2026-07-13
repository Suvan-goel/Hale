# Pearl Measurement Side Protocol Post-UX Audit

Date: 2026-06-24

Verdict: `SIDE_PROTOCOL_FOUNDATION_COMPLETE`

## Summary

The post-UX patch closes the measurement-side protocol foundation for local, backend, and restore metadata paths. Side-dependent micro-checks now have an explicit side-resolution contract and side-dependent official MPV2 retests now require a dedicated opposite-side fallback confirmation before reduced-comparability capture.

## Inspected Surface

- Micro-check types inspected: 3
- Side-dependent micro-check types: 2 (`single-leg-balance`, `mobility-reach`)
- Side-independent micro-check types: 1 (`chair-power`)
- Official side-dependent retest surfaces inspected: 2 (MPV2 one-leg balance, MPV2 active shoulder reach)
- Persistence surfaces inspected: local micro-check serialization, backend micro-check sync, restore merge richness, check-up sync/restore, history/trends/progress/reports

## Findings

| ID | Severity | Status | Notes |
| --- | --- | --- | --- |
| MSP-P2-001 | P2 | Closed | Micro-check side setup now pins side before camera activation. |
| MSP-P2-002 | P2 | Closed | Official retest opposite-side fallback now requires explicit warning confirmation. |
| MSP-P3-001 | P3 | Deferred | Physical Android/iOS device QA remains deferred. |

Post-patch counts:

- P0: 0
- P1: 0
- P2: 0
- P3: 1

## Micro-Check Audit

- Micro-check no-anchor scenarios: 2
- Existing micro-anchor scenarios: 2
- Official-recommendation scenarios: 1
- Opposite-side micro-check scenarios: 2
- Side-dependent micro-check without explicit/pinned side: 0
- Chair-power side selector shown: 0
- First valid side-known micro-check failing to establish series: 0
- Invalid result establishing series: 0
- Micro-check overwriting official anchor: 0
- Unrelated official protocol borrowed as side authority: 0
- Side change during active attempt: 0

Balance no-anchor behavior: user must choose left or right leg; no default is selected. The first valid result establishes the micro-check series.

Mobility no-anchor behavior: user must choose left or right extended leg; no official shoulder, hinge, or balance side is borrowed. The first valid result establishes the mobility micro-check series.

Existing micro-anchor behavior: the existing side is recommended. Continuing the same side is comparable; choosing the other side is stored as `opposite_side_fallback` with reduced comparability.

Official recommendation behavior: MPV2 balance can recommend a first balance micro-check side, but the first valid micro-check result establishes its own micro-check series and is not directly compared to the official result.

## Official Retest Audit

- Official-retest fallback scenarios: 2
- Cancelled fallback scenarios: 2
- Side-dependent official retest without normal anchor path: 0
- Fallback without explicit confirmation: 0
- Fallback overwriting anchor: 0
- Fallback reported as fully comparable: 0
- Fallback definitive trend claim: 0
- Retry/recovery changing fallback side: 0

Official fallback confirmation copy:

```text
Use the other side? This result may not be directly comparable with your earlier checks. Your usual side will remain unchanged.
```

The fallback does not replace the anchor.

## Runtime Consistency

- Voice/UI/controller/grader side mismatch: 0
- Selected/observed mismatch accepted as comparable: 0
- Stale callback saving old side: 0
- Mounted voice switch changing side: 0
- MPV2 voice-side mismatches: 0

## Comparability

- False same-side comparison count: 0
- False cross-protocol comparison count: 0
- Anchor-overwrite count: 0
- False trend claims: 0

## Persistence

- Local round-trip failure: 0
- Backend round-trip failure: 0
- Restore anchor drift: 0
- Richer side-known metadata lost during merge: 0
- Persistence failures: 0

## Accessibility

- Accessibility failures: 0

New actions use existing button primitives or accessible `Pressable` controls. No-anchor side choice has no default selected side.

## Audio

- No audio changed
- No audio generated
- No ElevenLabs call
- No runtime TTS call
- No external speech/audio API call

## Deferred QA

Physical Android/iOS QA remains deferred. This is the only remaining P3.

## Next Task

```text
Approved eyes-open balance protocol V2 reconciliation
```
