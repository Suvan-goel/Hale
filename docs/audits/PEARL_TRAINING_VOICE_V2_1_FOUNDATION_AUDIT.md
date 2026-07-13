# Pearl Training Voice V2.1 Foundation Audit

Primary verdict: `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_BEHAVIOR_AND_AUDIO_PENDING`

## Counts

| Metric | Value |
|---|---:|
| Live exact exercise count | 37 |
| Contract count | 37 |
| Missing contract count | 0 |
| Stale extra contract count | 0 |
| Duplicate contract count | 0 |
| Exact first-use mapping count | 37 |
| Exact later-set mapping count | 37 |
| Semantic mismatch count | 0 |
| Bilateral side-policy error count | 0 |
| Both-sides behaviour-blocked count | 6 |
| Step-up behaviour-blocked count | 1 |
| Floor-gate-blocked count | 3 |
| Safety-runtime-blocked count | 29 |
| Unsupported target count | 0 |
| Silent target approximation count | 0 |
| Active set-count cue count | 0 |
| Unique logical cue count | 163 |
| Exact existing pair reuse count | 10 |
| Pending new pair count | 133 |
| Existing pair script-mismatch count | 20 |
| Sessions/items inspected | 8 / 37 |
| Unmapped generated-session item count | 0 |
| Duplicate safety-family count | 0 |
| Live V2.1 selectable exercise count | 0 |
| P0/P1/P2/P3 | 0 / 0 / 0 / 3 |

## Gates

- Feature flag/default: `EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1` / off
- Audio ready: false
- Behaviour ready: false
- Legacy fallback remains available for every item: true
- Balance V2 remains default-closed/audio-pending: true

## Worktree

- Branch: `dev`
- HEAD: `9bcfb41`
- Upstream: `origin/dev`
- Audio diff: empty

Approved implementation dependencies are represented as blockers and are not counted as defects. Physical-device QA and human listening remain deferred.
