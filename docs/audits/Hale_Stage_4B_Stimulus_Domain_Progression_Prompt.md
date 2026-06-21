You are implementing Stage 4B of Hale’s production-readiness work:

DOMAIN MAPPING, PROGRESSION LADDER CLEANUP, STIMULUS QUALITY, AND NO-STIMULUS SUBSTITUTION HARDENING

This is a focused production-code remediation task following Stage 4 and Stage 4A.

Do not begin Stage 4C, Stage 4D, Stage 4E, Stage 4F, Stage 4G, Stage 5, Stage 3D-B, beta-device validation, or broad workout-generation redesign in this task.

## Required prior reading

Read these documents in full before changing code:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_2.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4A.md

Treat the current working tree as the source of truth. Re-verify relevant call paths before editing because report line numbers may no longer be exact.

## Stage 4A baseline

Stage 4A completed the first safety-gating pass:

- Added explicit `floor_space` gating.
- Step-up now requires stair plus support.
- Support-dependent balance/march work requires support.
- Generated workouts, manual practice, and Explore share the same safety gate.
- Upper-body pull no longer silently degrades into shoulder mobility; if no band is available, Hale skips the upper-pull slot honestly.
- Overhead band press was marked as cross-domain/supporting rather than a mobility progression endpoint.
- Full validation passed: 84 suites, 606 tests.
- Stage decisions:
  - STAGE 4A COMPLETE.
  - STAGE 4 REMEDIATION STILL REQUIRED.
  - STAGE 5 CATALOGUE INPUTS BLOCKED.
  - STAGE 3D-B REQUIRED.

Stage 4A made the catalogue safer, but not yet strong enough for Stage 5. Stage 4B should now make sure the catalogue still produces useful training stimulus after the safety gates.

## Primary objective

Implement the second Stage 4 remediation batch:

1. Clean up domain mapping and ladder semantics so Stage 5 can trust the catalogue.

2. Prevent “safe but useless” sessions where focus-domain work disappears or is replaced by unrelated movement.

3. Harden upper-body pull behavior so no-band users get honest handling and, if possible, a safe posture/scapular alternative that is not falsely labelled as equivalent pull strength.

4. Strengthen balance progression semantics enough for V1 beta.

5. Make mobility ladders semantically honest: mobility drills can be a collection, but they should not pretend to be a single linear progression unless they actually are.

6. Add tests proving generated sessions preserve focus-domain stimulus or clearly report why they cannot.

7. Preserve Stage 4A safety gating and all Stage 1–3D protections.

This is not Stage 5. Do not audit/implement full dynamic generation yet. The goal is to make the building blocks safe and semantically trustworthy enough for Stage 5 to audit generation.

## Scope boundary

This task may change:

- exercise metadata;
- ladder metadata;
- ladder/domain role metadata;
- fallback/substitution policy for upper-body pull, balance, and mobility;
- skipped-slot reason taxonomy;
- stimulus classification metadata;
- session generation’s slot acceptance checks;
- minimal-equipment scenario behavior where current output is diluted or misleading;
- manual practice and Explore metadata only if needed to keep domain semantics consistent;
- tests for catalogue integrity, workout generation, session planning, Explore, and semantic stimulus checks;
- the Stage 4B remediation report.

This task must not change:

- scoring formulas.
- norm tables.
- score snapshots.
- Check-Up measurement.
- camera readiness.
- Stage 3A malformed-input validation.
- Stage 3B officialness/manual isolation.
- Stage 3C frozen historical behavior.
- Stage 3D exact-tie/near-tie/focus semantics.
- Stage 4A floor/stair/support gating, except to preserve or strengthen it.
- broad UI redesign.
- workout-generation strategy beyond semantic slot acceptance/substitution hardening.
- exercise progression algorithms except for catalogue/ladders semantics required to avoid misleading progression.
- backend schema.
- dependencies.
- assets.

Do not perform opportunistic refactors.

## Stage 4 findings this task addresses

Stage 4 and 4A left these important blockers:

1. Upper-body pull is band-dependent. Stage 4A made missing-band pull honest, but the product still lacks a good no-band strategy.

2. No-equipment sessions can still become focus-diluted or under-stimulating.

3. Balance progression is thin and needs clearer ladder semantics.

4. Mobility/flexibility is useful coverage, but the current mobility ladder is a collection of different drills rather than a true progression.

5. Some ladder/domain semantics remain too ambiguous for Stage 5.

6. Stage 5 should not treat skipped focus-domain slots as acceptable without explicit product semantics.

7. Tests need to assert semantic stimulus quality, not just syntactic reachability.

## Product rules for Stage 4B

### 1. Preserve focus-domain stimulus or be honest

A generated session should not silently replace the focus-domain slot with an unrelated movement and still look successful.

For each session slot, classify the selected exercise relationship to the intended slot as one of:

- `primary`: directly trains the intended stimulus/domain.
- `supporting`: related/maintenance, but not equivalent.
- `fallback`: safer alternative, lower stimulus, acceptable only with explanation.
- `skipped`: no safe/equipment-compatible option.
- `invalid`: should not happen.

Use existing structures if possible. Add a minimal metadata field only if needed.

Required behavior:

- Primary focus-domain slots should prefer `primary`.
- If only `supporting`/`fallback` is possible, the session should say so.
- If a focus-domain slot is skipped, the reason must be visible in generated session metadata.
- Tests should fail if upper-pull becomes shoulder mobility as if it were primary pull work.
- Tests should fail if no-equipment balance silently becomes unsafe or unrelated work.

### 2. Upper-body pull strategy

Stage 4A stopped silent shoulder-mobility substitution. Stage 4B should decide the V1 handling.

Approved options:

A. Keep upper-pull band-required and skip honestly when no band is available.
B. Add a safe no-band posture/scapular alternative, but classify it as `supporting`, not equivalent pulling.
C. Gate upper-body-pull slots behind band availability.
D. Recommend the Hale Movement Kit / resistance band for upper-back work.

Do not invent a fake bodyweight pulling exercise if it is not feasible at home without equipment.

If adding or using a no-band alternative, it must:

- be safe for adults 45–65;
- require no floor unless `floor_space` is available;
- not require door anchoring;
- not be labelled as true pulling strength;
- have clear domain role metadata.

If not adding an alternative, make the skip/product copy explicit.

### 3. Balance progression semantics

Balance should have clear progression semantics beyond “random balance drills.”

Stage 4B should ensure:

- static balance ladder order is coherent;
- support requirements are clear;
- dynamic/lateral balance drills are classified correctly;
- loaded/unloaded march naming is not misleading;
- no-equipment balance output is honest;
- optional mini-band lateral walk is not required for V1 core;
- Stage 5 can distinguish static balance, dynamic balance, and lateral stability if needed.

Do not implement eyes-closed balance progression in this task unless already present and safe.

### 4. Mobility ladder semantics

Mobility can remain a collection of drills, but the data should not imply it is a strict linear difficulty progression if it is not.

Stage 4B should either:

- mark mobility ladder as a `collection`/`mobility_set` rather than progression; or
- split mobility ladders into coherent sub-ladders; or
- add metadata that tells Stage 5 not to use the ladder as a linear progression.

Do not overbuild. The minimal goal is to prevent Stage 5 from treating hamstring reach -> thoracic rotation -> hip flexor stretch -> calf stretch as increasing difficulty.

### 5. Domain metadata consistency

For Stage 5, each exercise/level should have clear metadata for:

- primary domain;
- movement pattern;
- stimulus role;
- whether it is primary/supporting/fallback for a slot;
- equipment requirements;
- safety constraints;
- V1 status.

Do not add fields just to add fields. Add only what makes generation/test semantics safer.

### 6. No-equipment sessions

True no-equipment sessions should:

- not select floor work without floor_space;
- not select support-dependent balance drills without support;
- not select upper-pull if no pull stimulus exists;
- not claim complete focus-domain training when the key slot is skipped;
- include honest guidance/recommendation when equipment limits the session.

Do not force every no-equipment session to be perfect. It is okay for no-equipment output to be partial, but it must be transparent and useful.

## Working-tree safety

Before editing:

1. Run:

   git status --short --untracked-files=all

   git diff --name-only

   git diff --stat

2. Record exact outputs in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file this task may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify prior audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during this task:
    - record them;
    - do not overwrite them;
    - continue only if task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct post-4A catalogue semantics

Before editing, inspect:

- src/training/equipmentSafety.ts
- src/exercises/types.ts
- src/exercises/ladders.ts
- all exercise definition files touched by Stage 4A
- src/training/workoutGeneration.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/exploreViewModel.ts
- src/adherence/types.ts
- Stage 4A tests:
  - src/exercises/__tests__/catalog.test.ts
  - src/training/__tests__/workoutGeneration.test.ts
  - src/haleFlow/__tests__/sessionPlanning.test.ts
  - src/haleFlow/__tests__/exploreViewModel.test.ts

Document:

- current equipment/safety gate behavior;
- how skipped slots are represented;
- current upper-pull missing-band behavior;
- current no-equipment session behavior by focus domain;
- current balance ladder semantics;
- current mobility ladder semantics;
- current domainRole / cross-domain metadata;
- current session guidance generated for skipped slots;
- current tests covering semantic stimulus.

Do not edit until this trace is complete.

## Step 2: Add or harden stimulus-role metadata

If current metadata is not enough, add a minimal field or helper to classify slot/exercise relationship.

Possible concepts:

```ts
type SlotStimulusRole = 'primary' | 'supporting' | 'fallback' | 'skipped';

type SlotStimulusReason =
  | 'direct_match'
  | 'equipment_limited'
  | 'safety_limited'
  | 'supporting_maintenance'
  | 'no_safe_option'
  | 'band_required'
  | 'floor_required'
  | 'support_required'
  | 'stair_support_required';
```

Adapt to the actual codebase.

Requirements:

- Type-safe.
- Small.
- Easy to test.
- Does not require backend migration.
- Does not rewrite the whole generator.
- Does not break existing session consumers.

If existing skipped-slot metadata is enough, extend it rather than creating a parallel system.

## Step 3: Upper-pull handling

Implement one of the approved V1 strategies.

Preferred V1 behavior:

- Keep true upper-back pull as band-required.
- Do not replace it with shoulder mobility or overhead pressing.
- If no band is available, mark the pull slot as skipped with reason `band_required`.
- Add clear session guidance:
  - “Upper-back pulling needs a resistance band, so Hale skipped that slot rather than replacing it with a different movement.”
- If an existing safe no-band posture/scapular drill exists, it may be offered as supporting maintenance only, not primary pull.

Tests:

- no band -> upper-pull slot skipped or supporting, not primary.
- long band but no door anchor -> seated row allowed if appropriate; standing row/door-anchor drills blocked.
- long band + door anchor -> standing row allowed.
- no band session guidance is honest.
- no shoulder mobility/overhead press is counted as primary upper-pull.
- Explore upper-back preset requires band or is disabled honestly.
- manual practice respects band requirements.

Do not add a fake no-equipment pulling exercise unless it is already present and safe.

## Step 4: Balance progression semantics

Harden balance/lateral ladder metadata.

Required behavior:

- Static balance ladder levels are clearly static balance progression.
- Lateral stability/march levels are classified as dynamic/lateral support, not the same as static balance hold.
- Support-dependent drills remain support-gated from Stage 4A.
- No-equipment balance sessions either:
  - use genuinely no-equipment-safe content classified as supporting/fallback; or
  - skip with honest reason.
- Stage 5 can distinguish:
  - static balance;
  - lateral/dynamic balance;
  - strength/power;
  - mobility.

Tests:

- balance focus with support includes primary balance work.
- balance focus without support does not pretend marching/strength/mobility equals primary static balance if not primary.
- no-equipment balance session has clear skipped/supporting metadata.
- lateral stability ladder is not used as a direct static-balance progression endpoint unless explicitly marked.
- manual balance practice respects support and ladder semantics.

## Step 5: Mobility collection semantics

Make mobility ladder semantics honest.

Options:

A. Add metadata marking the mobility-flexibility ladder as a `collection` rather than linear progression.
B. Split mobility into smaller coherent ladders if that is minimal and safe.
C. Add comments/tests that Stage 5 must not treat the ladder as linear progression.

Preferred Stage 4B behavior:

- Add a lightweight `progressionModel` or equivalent metadata:
  - `linear_progression`
  - `collection`
  - `supporting_set`
- Mark the mixed mobility ladder as `collection`.
- Keep true linear ladders marked as `linear_progression`.
- Tests assert mobility ladder is not treated as linear difficulty progression.

Do not redesign all mobility content.

## Step 6: No-equipment stimulus scenario tests

Add scenario tests that generate sessions for:

- strength focus with true no equipment.
- balance focus with true no equipment.
- mobility focus with true no equipment.
- strength focus with chair+wall.
- balance focus with support.
- mobility focus with chair+wall.
- upper-pull preset with no band.
- upper-pull preset with long band.
- upper-pull preset with long band + door anchor.
- short-session no equipment.

For each scenario, assert:

- no unsafe exercise is selected;
- focus-domain primary slots are present when feasible;
- when not feasible, skipped/supporting metadata is explicit;
- no unrelated stimulus is counted as primary;
- session guidance includes equipment limitation where relevant;
- Stage 4A floor/stair/support gates still apply.

## Step 7: Domain consistency tests

Add or update integrity tests so Stage 5 can trust catalogue semantics.

Tests should cover:

- every ladder has a progression model.
- every ladder level has a valid domain role.
- cross-domain/supporting levels are explicitly marked.
- mobility collection is not linear.
- overhead band press is not a mobility progression endpoint.
- loaded/unloaded march naming is documented or tested.
- exercise definition equipment and ladder equipment agree for safety-critical requirements.
- no level silently changes primary domain without metadata.

## Step 8: Session guidance and skipped-slot copy

Ensure generated-session guidance distinguishes:

- skipped due to band required;
- skipped due to floor required;
- skipped due to support required;
- skipped due to stair support required;
- supporting maintenance due to equipment limitation;
- primary work completed.

Copy must stay Stage 3D-A-safe:

- no overclaiming;
- no shame;
- no “failure” language;
- clear and calm.

Examples:

- “Upper-back pulling needs a resistance band, so Hale skipped that slot rather than replacing it with a different movement.”
- “This session skips floor work because floor space is not marked available.”
- “Balance holds need nearby support, so Hale used a safer supporting option today.”
- “A stair drill needs both a stable step and support nearby, so Hale used chair-rise work instead.”

Do not redesign the UI.

## Step 9: Regression matrix

Run and/or add tests proving:

### Stage 4A
- floor gating still works.
- step-up gating still works.
- balance support gating still works.
- manual/Explore use shared gate.

### Stage 3D
- exact/near tie behavior unaffected.
- movement-age copy softening unaffected.

### Stage 3A/3B/3C
- scoring, officialness, snapshots unaffected through full suite.

### Stage 4B
- stimulus roles are explicit.
- no-equipment sessions are honest.
- upper-pull without band is not mislabeled.
- mobility collection semantics are explicit.
- balance progression semantics are explicit.

## Validation commands

Run targeted tests for:

- exercise catalogue.
- workout generation.
- session planning.
- Explore view model.
- adherence/block service.
- training/session tests.
- Stage 4A safety-gating regression.
- Stage 3D focus/copy regression if touched.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test count;
- full suite/test count;
- typecheck result;
- Expo config result;
- diff-check result;
- warnings;
- skipped tests;
- whether any validation command changed files.

## Remediation report

Create exactly one new report:

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4B.md

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Stage 4 findings addressed.
4. Stage 4 findings not addressed.
5. Post-4A architecture trace.
6. Stimulus role/data model changes.
7. Upper-pull behavior.
8. Balance progression semantics.
9. Mobility progression/collection semantics.
10. No-equipment session behavior.
11. Skipped-slot/session guidance behavior.
12. Catalogue/domain consistency changes.
13. Files changed.
14. Tests added/changed.
15. Exact validation results.
16. Regression verification for Stage 1–4A protections.
17. Remaining Stage 4 blockers.
18. Whether Stage 5 catalogue inputs are ready or still blocked.
19. Initial and final Git status.
20. Concurrent external changes.
21. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 4B:

1. Upper-pull without band is never treated as equivalent primary pull work.
2. Missing-band upper-pull behavior is honest and tested.
3. No-equipment sessions either preserve focus-domain primary work or explicitly report skipped/supporting stimulus.
4. Balance support and balance progression semantics are clear.
5. Mobility mixed drills are not treated as a linear progression ladder.
6. Cross-domain/supporting levels are explicitly marked and tested.
7. Session guidance communicates equipment/stimulus limitations calmly.
8. Stage 4A floor/stair/support gates still work.
9. No scoring formulas changed.
10. No norm tables changed.
11. No Stage 3D focus semantics changed.
12. No Check-Up measurement/camera readiness logic changed.
13. Full tests pass.
14. Typecheck passes.
15. Expo config passes.
16. git diff --check passes.

## Acceptance criteria

Do not mark Stage 4B complete unless all are true:

1. Upper-pull strategy is implemented and tested.
2. Stimulus role/skipped-slot semantics are explicit and tested.
3. No-equipment dilution is detected or honestly surfaced.
4. Balance progression semantics are clarified and tested.
5. Mobility collection/progression semantics are clarified and tested.
6. High-confidence domain inconsistencies are resolved or explicitly guarded.
7. Stage 4A safety-gating tests still pass.
8. Targeted tests pass.
9. Full tests pass.
10. Typecheck passes.
11. Expo config passes.
12. git diff --check passes.
13. No unrelated user work is reverted or overwritten.
14. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 4B COMPLETE
- STAGE 4B BLOCKED

Also state exactly one:

- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 4 REMEDIATION COMPLETE

Also state exactly one:

- STAGE 5 CATALOGUE INPUTS READY
- STAGE 5 CATALOGUE INPUTS BLOCKED

Also state:

- STAGE 3D-B REQUIRED

Use STAGE 5 CATALOGUE INPUTS READY only if the catalogue now has enough safe/stable/stimulus-honest semantics for Stage 5 to audit dynamic generation against it. It is acceptable for Stage 4C/4E cueing and pain/readiness polish to remain required before beta, as long as Stage 5 can safely reason over the catalogue.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Upper-pull strategy implemented.
- Stimulus role/skipped-slot behavior.
- Balance progression semantics.
- Mobility collection semantics.
- No-equipment session behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full suite result.
- Typecheck result.
- Expo config result.
- git diff --check result.
- Confirmation that scoring/norms/Stage 3D semantics were unchanged.
- Remaining Stage 4 blockers.
- STAGE 4B COMPLETE or STAGE 4B BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED or STAGE 4 REMEDIATION COMPLETE.
- STAGE 5 CATALOGUE INPUTS READY or STAGE 5 CATALOGUE INPUTS BLOCKED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
