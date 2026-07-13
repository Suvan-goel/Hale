# Pearl Unified Movement Check-Up — Stage H5B Balanced Micro-Check Policy

Date: 2026-06-25

## Verdict

Stage H5B is implemented and verified.

Balanced V2 blocks now resolve weekly micro-checks from the authoritative Stage 5 schedule week, without writing or faking `focusDomain`:

- Week 1: `strength_power` -> `chair-power`
- Week 2: `balance` -> `single-leg-balance`
- Week 3: `mobility` -> `mobility-reach`
- Week 4: no micro-check, `balanced_week_4_official_retest`

The due window is now schedule-authoritative: current schedule week active, at least one schedule-credited main-plan session in that week, week not complete, and the stable micro-check slot not completed. There is no carry-over or backfill.

## Implementation

Added `src/pearlFlow/microCheckPolicy.ts` as the pure policy source for:

- Balanced rotation by `BlockScheduleState.currentWeekIndex`.
- Domain-focused block behavior through the same target resolver.
- Stable slot identity by block/week/source/domain/type/policy fingerprint.
- Slot-backed completion detection.
- Week-4 Balanced suppression for official retest.

Updated launch/copy surfaces to consume the resolved target instead of guessing from block focus:

- Today lifecycle and next-best-action copy expose the actual domain target.
- Manual check-up options only recommend a micro-check when the current slot is due.
- App launch paths refuse stale `microcheck` routes when no slot is available.

Updated persistence/sync/restore:

- `MicroCheckResult` and `TrainingSessionCompletion` carry additive slot metadata.
- Local micro-check store overwrites slot-backed files by stable slot id.
- Completion dedupe and `microChecksCompleted` count unique slots.
- Backend micro-check upsert uses slot-first identity and syncs slot metadata.
- Restore dedupes remote micro-checks by slot id before falling back to legacy type/start time.

Micro-checks remain optional and non-blocking. They do not create schedule credit, main-plan credit, official Movement Profile artifacts, reports, focus changes, or next-block effects.

## Notes

The worktree was already dirty before H5B work began, including unrelated tracked and untracked changes. Those were preserved. `docs/decisions.md` was not edited for H5B.

Existing side/protocol behavior is reused: chair power remains side-independent, and balance/mobility continue through the existing side setup and measurement-context path. No substitution path was added.

## Validation

Passed:

- `npm run typecheck`
- Focused H5B/adjacent Jest slice: 13 suites, 139 tests
- `npm test -- --runInBand`: 154 suites, 1263 tests
- `npm run verify:audio`: 150 required assets verified
- `npm --prefix website run typecheck`
- `npx --no-install expo config --type public`
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5b-export`
- `git diff --check`

Known recurring warnings observed during validation:

- Watchman recrawl warning during Jest.
- Jest open-handle notice after completion.
- Expo/Sentry missing org/project warning, with environment fallback.
- Expo export `NO_COLOR` ignored because `FORCE_COLOR` is set.

The temporary export directory was removed after export.
