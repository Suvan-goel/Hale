# Parity review DRAFT — old catalog → programme v2 (prepared 2026-07-07)

Prepared so the founder sign-off on docs/specs/ladder-migration-map.md is a read-and-approve,
not an archaeology session. Each promotion-time check is verified against the code as of
2026-07-07 (commits through the bridge + cadence work). **Two findings need action or a
ruling before the box can be ticked — everything else verifies clean.**

## Check 1 — every v1_core old level mapped/absorbed/retired deliberately: VERIFIES

Cross-checked the migration table against the live old catalog (37 registered exercises,
`src/exercises/`). Every `v1_core` level has a table row; the "retired" rows each carry a
reason anchored in the ladder spec (loaded levels → backpack tier; overhead press → returns
with the equipment tier; mini-band work → v1 drop). Net-new coverage (core ladder, pull
L1–L3/L6–L8, hinge bridge progressions, the finisher block) is listed and deliberate.
No silent losses found.

## Check 2 — old stored training state never read by the new engine: VERIFIES

`src/programme` has zero imports of TrainingStore/TrainingState (grep-clean, 2026-07-07);
programme state lives in its own `programme.json` via its own store; placement is fresh via
onboarding §6. Internal testers re-onboard; no live migration exists by ruling (ambiguity 5).

## Check 3 — decommission list (promotion-time change): READY, one precondition now met

Blocks, block progress views, and micro-check scheduling decommission with the promotion
commit (C4). Precondition newly satisfied: the **routine 4–6-week check-up cadence now
exists** (`routineCheckupDue`, 28-day clock stamped by `applyAssessmentPlacement`, home
surface wired 2026-07-07) — level-up progress + this cadence are the stated replacements.

## Check 4 — ported capabilities: RESOLVED BY RULINGS 2026-07-07 (was: two gaps)

**Founder rulings (2026-07-07): Floor A — v1 ships floor-required (no floor-avoidance
routing; the types.ts comment is corrected; a floor-comfort question is a v2 candidate,
re-entry on beta feedback). Pain A — the old engine's 2-strike auto-exclusion is DEFERRED
by decision (the §12 pain regression answers the safety need; re-entry if beta telemetry
shows repeated pain on one movement despite regression). Both recorded in decisions.md.**
The original findings are preserved below for the record:

- **Policy-snapshot governance: VERIFIES.** `programmePolicyFingerprint()` covers ladders,
  schemes, gateways, prereqs, finisher, adaptation branches, and promotion config; stored
  state pins it and a mismatch marks the state stale (serialize.ts discipline, tested).
- **Equipment substitution: PARTIAL — floor routing is MISSING.** No-stairs substitution is
  built and tested (generation swaps `noStairsAlternativeId`; C1 skip = conservative
  no-stairs). But the old engine's **floor-eligibility opt-in is not consulted anywhere in
  v2 generation**: `requiresFloor` is carried onto the plan (session.ts) and used for
  safety cues, yet a floor-averse user is still prescribed floor work (hinge L1–L4, pull
  L1–L3, core L1–L6, push floor levels). The types.ts comment ("routed through the existing
  floor-eligibility opt-in") describes intent, not implementation. **Action: build
  floor-aware substitution (or an explicit ruling that v1 asks everyone to the floor and
  the comment is corrected).** Note the spec's own zero-equipment law: "every exercise must
  have a zero-equipment regression so a missing item substitutes, never blocks" — floor
  comfort is the same class of constraint.
- **Pain-recurrence auto-exclusion: NOT PORTED — open ruling.** The old engine excludes a
  movement from generation after two pain events; v2 relies on §12 pain regression alone
  (pain → drop to last pain-free level). Engineering recommendation: defer the exclusion
  (regression already answers the safety need; exclusion interacts with ladder identity),
  but this is a founder call — the checklist names it explicitly, so it needs either a port
  or a recorded deferral before sign-off.

## Check 5 — measurement surfaces byte-identical: VERIFIES IN SOFTWARE, device pass owed

The `batterySequence` change is pinned byte-identical on the default path (untouched
original code branch + explicit default-order pins; existing movementProfileV2 suites pass
unchanged). Partial-battery records are structurally excluded from official
assessments/trends by `checkupType` (pinned 2026-07-07, partialBatteryTolerance.test.ts).
The on-device confirmation is Pass A in docs/device-pass-protocol.md — already scheduled.

## Sign-off state

| Check | State |
|---|---|
| 1. Mapping completeness | ☑ verifies |
| 2. Old-state isolation | ☑ verifies |
| 3. Decommission list | ☑ ready (executes at promotion) |
| 4. Ported capabilities | ☑ resolved by 2026-07-07 rulings (Floor A, Pain A) |
| 5. Measurement byte-identical | ☑ in software; Pass A on device |
