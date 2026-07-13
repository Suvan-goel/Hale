# Pearl UI Restoration: Progress Empty State and Optional Extra Check-Up

Date: 2026-06-26

## Scope

Restored the pre-profile Progress empty-state experience and Manual / Extra Check-Up choice surface while keeping H5A-H5D Movement Profile V2 architecture intact. Public V1 Check-Up and result routes remain retired outside the explicit rollback flag.

## Restored Progress Empty State

- V2 Progress `no_profile` now renders the richer founder-designed `ProgressEmptyState` instead of the sparse recovery card.
- The CTA remains `Start Movement Check-Up`.
- The incorrect read-only subtitle was replaced with `Opens camera setup for your Movement Check-Up.` for any recovery action using that CTA label.
- The CTA still routes through the existing public V2 selector and unified Movement Check-Up baseline path. It does not mount V1 and does not create artifacts directly from Progress.

## Restored Manual / Extra Check-Up Screen

- The polished `ManualCheckupStartScreen` layout remains active with header mark, recommended card, secondary option row, premium card styling, responsive padding, and existing theme tokens.
- The screen always exposes:
  - `Quick micro check-up`
  - `Full Movement Check-Up`
- Legacy V1 public manual entries (`manual_extra`, `quick_recheck`) remain unavailable.
- Public copy avoids Movement Age, weakest-domain language, improvement/decline claims, and V1/V2/internal labels.

## Optional Full Check-Up Containment

- Added `manual_extra_v2` as the non-official optional full Check-Up source type.
- Optional full Check-Up launches through the unified V2 recording shell and live protocols.
- Optional full Check-Up bypasses reference-profile materialization and goes to a raw optional result screen.
- `manual_extra_v2` is explicitly ineligible for official V2 snapshots, assessments, block creation, reports, and official history rows.

## Optional Micro Check-Up Containment

- Manual / Extra micro-check launches are tagged as optional and separate from scheduled H5B launches.
- Scheduled micro-check CTAs still store the H5B slot target and use the existing completion path.
- Optional micro-check completion saves a tagged local result without slot metadata, session completion, schedule credit, main-plan credit, microChecksCompleted, or progression evidence.
- Optional micro-check results are excluded from the recent backend micro-check sync batch to avoid accidental scheduled-completion matching.
- Target selection follows the requested priority: due scheduled target as optional, active block focus, Balanced current-week target, then domain-choice fallback when no active block exists.

## Validation

- Focused tests: passed, 8 suites / 71 tests.
- `npm run verify:audio`: passed.
- `npm test -- --runInBand`: passed, 162 suites / 1317 tests.
- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with existing Sentry missing organization/project warning.
- `git diff --check`: passed.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-ui-restoration-export`: passed; temp export directory removed.

Notes: Jest still prints the existing Watchman recrawl warning and open-handle notice; neither produced a failing test.
