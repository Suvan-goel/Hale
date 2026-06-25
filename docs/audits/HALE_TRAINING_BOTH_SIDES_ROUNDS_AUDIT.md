# Hale Training Both-Sides Rounds Audit

Primary verdict: `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE`

## Counts

| Metric | Value |
|---|---:|
| Affected exercise count | 6 |
| Exact dose-plan count | 6 |
| Direct-half-set plan count | 6 |
| Minimum-adjusted plan count | 0 |
| Unrepresentable plan count | 0 |
| Exact source-total match failures | 0 |
| Unequal side-dose failures | 0 |
| Rest-between-sides cases | 0 |
| Round-with-one-side cases | 0 |
| Duplicate-side completion cases | 0 |
| Stale callback mutations | 0 |
| Restore duplicate-dose cases | 0 |
| Progression double-count cases | 0 |
| Main-plan seed flip failures | 0 |
| Manual-practice seed mutation cases | 0 |
| Unsupported scaled prescription count | 0 |
| Voice side/target mismatch count | 0 |
| Active spoken set-count cue count | 0 |
| Physical manifest changes | 0 |
| Remaining round/dose blocker count in six contracts | 0 |
| P0/P1/P2/P3 | 0 / 0 / 0 / 0 |

## Gates

- Both-sides rounds feature: off, software ready: true
- Training Voice V2.1 feature: off
- Training Voice V2.1 audio ready: false
- Training Voice V2.1 global behaviour ready: false
- Balance V2 default closed/audio ready: true / false
- Physical-device QA: deferred
- Human listening: waived, not completed

## Worktree

- Branch: `dev`
- HEAD: `9bcfb41`
- Upstream: `origin/dev`
- Audio diff: empty
