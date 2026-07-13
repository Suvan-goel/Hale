You are implementing Stage 4A of Pearl’s production-readiness work:

CATALOGUE INTEGRITY, SAFETY GATING, FLOOR/STAIR/SUPPORT CONSTRAINTS, AND DOMAIN/EQUIPMENT CONSISTENCY

This is a focused production-code remediation task following the Stage 4 exercise-catalogue audit.

Do not begin Stage 4B, Stage 4C, Stage 4D, Stage 4E, Stage 4F, Stage 4G, Stage 5, Stage 3D-B, workout-generation strategy redesign, or beta-device validation in this task.

## Required prior reading

Read these documents in full before changing code:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md

Treat the current working tree as the source of truth. Re-verify relevant call paths before editing because report line numbers may no longer be exact.

## Stage 4 audit baseline

Stage 4 was a read-only audit. It found:

- 37 registered exercise definitions.
- 11 product-facing ladders.
- 37 ladder levels.
- No dangling exercise definitions.
- No ladder levels without registered definitions.
- Strong architecture for registry, ladders, generated sessions, presets, manual ladder practice, and Explore cards.
- Stage 4 audit complete.
- Stage 4 remediation required.
- Stage 5 catalogue inputs blocked.
- Stage 3D-B still required before public beta.

The largest Stage 4 blockers were not syntax/reachability but trust/safety/semantic risks:

1. Floor work is allowed without floor-transfer screening.
2. Step-up lacks explicit step height/support/stable-surface gating.
3. Balance/march variants can be selected without sufficient support metadata.
4. Upper-body pull without bands falls back to shoulder mobility, preserving session flow but losing pull stimulus.
5. True no-equipment sessions can skip or dilute focus-domain stimulus.
6. Ladder and exercise-definition metadata sometimes disagree.
7. `overhead-press-band` is a strength/power level inside a mobility/flexibility ladder.
8. Progression and substitutions are too generic for Stage 5.
9. Cueing/stop rules are too generic.

Stage 4A should fix the structural/safety blockers that Stage 5 depends on first. Do not try to fix every Stage 4 finding in one pass.

## Primary objective

Implement the first Stage 4 remediation batch:

1. Make floor access explicit and prevent floor exercises unless floor work is allowed.

2. Add explicit stair/step-up safety gating and prevent step-up when stair/support constraints are missing.

3. Make balance support requirements consistent across ladder metadata and exercise definitions.

4. Fix obvious catalogue domain/equipment inconsistencies that can mislead generation.

5. Prevent no-equipment sessions from silently selecting unsafe or semantically wrong substitutes where a focus-domain slot cannot be safely served.

6. Add semantic tests proving the catalogue no longer allows the highest-risk Stage 4 safety failures.

7. Preserve all Stage 1–3D protections and existing passing behavior outside this narrow safety/catalogue scope.

This is not a full workout-generation redesign. It is a safety and integrity hardening pass for the catalogue and selection constraints.

## Scope boundary

This task may change:

- exercise catalogue metadata;
- ladder metadata;
- exercise equipment tags;
- exercise safety tags or constraints;
- equipment/support filtering logic;
- minimal profile/setup types if needed;
- session generation’s equipment filtering;
- session-generation skipped-slot behavior where safety constraints require skipping;
- manual ladder practice filtering;
- Explore practice availability if unsafe prerequisites are missing;
- tests for catalogue integrity, equipment filtering, workout generation, session planning, Explore, and safety gating;
- the Stage 4A remediation report.

This task must not change:

- scoring formulas.
- norm tables.
- norm anchors.
- movement-age calculations.
- Stage 3A malformed-input validation.
- Stage 3B officialness/manual isolation.
- Stage 3C frozen historical behavior.
- Stage 3C source-identity hardening.
- Stage 3D-A copy/display softening.
- Stage 3D-C exact-tie behavior.
- Stage 3D-D near-tie/meaningful-change policy.
- Check-Up measurement logic.
- camera readiness.
- broad UI redesign.
- dynamic workout-generation strategy beyond safety filtering.
- exercise progression algorithms except where a safety prerequisite must block a level.
- backend schema.
- dependencies.
- assets.

Do not perform opportunistic refactors.

## Product rules for Stage 4A

### 1. Floor work must be explicit

Exercises requiring the user to get down to the floor must not be selected unless the user profile/session constraints explicitly allow floor work.

Floor exercises include at minimum:

- glute bridge hold.
- glute bridge reps.
- standard push-up.
- any future floor exercise.

Current problem from Stage 4:

- `floor` was treated as always supported.
- `floor` was filtered out of session equipment labels.
- This hides a real access/safety requirement.

Stage 4A expected behavior:

- Floor access must be represented as a real requirement.
- If floor work is not confirmed/available, floor exercises must be skipped or substituted.
- Session equipment labels should not hide floor requirements when floor work is selected.
- There should be a safe fallback or honest skipped-slot reason.
- Do not add a UI screening flow unless already trivial. It is acceptable to add metadata and generator constraints now, and document any remaining UI/profile decision.

### 2. Step-up must require stair and support safety

Step-up should not be selected merely because `stair` is present.

Stage 4 found missing constraints for:

- step height,
- rail/counter/support availability,
- stable surface,
- space clearance,
- safety setup.

Stage 4A expected behavior:

- Step-up requires a safe step/stair plus nearby support or explicit stair-safe capability.
- If prerequisites are absent, step-up falls back to a safer lower-body option such as sit-to-stand.
- The skipped/substitution reason should be honest.
- Do not create advanced stair progression yet; that belongs later.

### 3. Balance support must be consistent

Balance ladder levels require support/counter, but some exercise definitions list no equipment.

Stage 4A expected behavior:

- Balance exercises that require a counter/chair/wall support must declare that support consistently.
- Static balance holds and supported side-step should not be treated as true no-equipment when safety requires support.
- Manual ladder practice and Explore should respect support requirements.
- No-equipment balance sessions should not silently choose support-dependent exercises.

### 4. Domain/equipment metadata must not contradict itself

Fix obvious inconsistencies that can confuse Stage 5:

- `overhead-press-band` should not live as a strength/power level inside a mobility ladder without clear handling.
- If kept, its domain/later-stage exposure must not make a mobility ladder appear to progress into strength work.
- `loaded-march` source/display/stimulus naming should not imply external load if no load is required.
- Ladder level indices and exercise definition levels should be documented or normalized if tests can catch mismatch.
- Definition equipment and ladder equipment should either agree or have a documented hierarchy.

Do not redesign the whole catalogue. Fix the highest-confidence inconsistencies.

### 5. No-equipment does not mean no safety constraints

True no-equipment sessions should not be “safe by default” if the exercise needs environmental support, floor access, stairs, or clear space.

If no safe exercise exists for a focus-domain slot:

- skip the slot honestly;
- record a clear skipped reason;
- avoid substituting into a completely different stimulus unless explicitly marked as maintenance/supporting;
- tests should prove focus-domain work is not silently diluted without a reason.

### 6. Preserve Stage 5 future flexibility

Do not implement Stage 5 generation.

But the data contracts after Stage 4A should be stricter and clearer so Stage 5 can later trust:

- exercise IDs;
- exercise domain;
- ladder domain;
- equipment requirements;
- support/floor/stair constraints;
- skipped-slot reasons.

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

## Step 1: Reconstruct current catalogue and filtering architecture

Before editing, inspect:

- src/exercises/index.ts
- src/exercises/ladders.ts
- src/exercises/registry.ts
- src/exercises/types.ts
- every src/exercises/*.ts exercise-definition file
- src/training/workoutGeneration.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/exploreViewModel.ts
- src/pearlFlow/planViewModel.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- tests under src/exercises, src/training, src/pearlFlow, src/adherence relevant to catalogue/session generation.

Document:

- current equipment type union;
- where floor is represented;
- why floor currently passes filtering;
- where equipment labels are shown/hidden;
- how step-up prerequisites are represented;
- how support/counter/wall/chair are represented;
- how no-equipment profiles are represented;
- how ladder-level equipment and exercise-definition equipment interact;
- where substitution reasons are created;
- how skipped slots are recorded;
- how Explore/manual practice filters equipment;
- which exercises require floor/stair/support.

Do not edit until this trace is complete.

## Step 2: Add or harden explicit safety/equipment requirements

Add the smallest safe data model change needed to represent:

- floor work allowed / floor access required;
- safe stair/step availability;
- nearby support required;
- counter/chair/wall support required;
- optional but recommended support vs required support, if the current model can support it.

Prefer extending existing equipment/constraints metadata over inventing parallel systems.

Possible approaches:

- Add `floor` as a real equipment requirement and stop treating it as automatically supported.
- Add a `requiresFloorAccess` boolean.
- Add `requiresSupport` / `supportType`.
- Add `stair_with_support` or equivalent if the existing equipment model is too coarse.
- Add safety constraint tags if more appropriate.

Requirements:

- Type-safe.
- Backward-compatible where possible.
- Easy to test.
- Does not require backend migration.
- Does not force broad UI changes.
- Documented in comments or report.

Do not add a large screening/profile system unless the current app already has the right profile/preferences place and it is narrow.

## Step 3: Floor-work gating

Implement floor-work gating.

Required behavior:

- If floor work is not available/allowed, floor exercises are not selected by generated sessions.
- Manual ladder practice does not select floor exercises when floor work is not available.
- Explore practice does not present floor levels as available when floor work is not available.
- If a floor slot cannot be substituted safely, the slot is skipped with a clear reason.
- Session equipment labels include floor/mat/floor-space if a floor exercise is selected.
- Tests cover no-floor profile and floor-allowed profile.

Exercises to check at minimum:

- glute-bridge-hold.
- glute-bridge-reps.
- push-up-standard.
- any other floor exercise found by audit.

Do not remove these exercises from the catalogue. Gate them.

## Step 4: Step-up safety gating

Implement step-up gating.

Required behavior:

- `step-up` requires more than generic `stair` if current metadata can distinguish it.
- If support/step safety is missing, step-up falls back to sit-to-stand or another safer lower-body option.
- Generated sessions do not include step-up when prerequisites are missing.
- Manual practice/Explore do not offer step-up as available without prerequisites.
- Tests cover:
  - stair absent -> no step-up.
  - stair present but support/safety absent -> no step-up.
  - stair and support/safety present -> step-up allowed.
  - fallback reason is clear.

Do not implement new step height progression yet. Just require safety gating.

## Step 5: Balance support metadata consistency

Fix consistency between ladder-level and exercise-definition metadata.

Required behavior:

- balance-feet-together-hold, balance-tandem-hold, balance-single-leg-hold, supported-side-step, and any similar exercise declare required support consistently.
- no-equipment profile does not get support-dependent balance drills unless support is considered available.
- generated balance sessions with no support should either choose genuinely no-support-safe content or skip with clear reason.
- manual ladder practice respects support requirement.
- Explore ladder availability reflects support requirement.
- tests cover balance generated sessions under:
  - counter/chair/wall support available;
  - true no-equipment;
  - wall only;
  - chair only, if relevant.

Do not remove balance exercises. Gate them and clarify metadata.

## Step 6: Domain and ladder consistency cleanup

Fix obvious Stage 4 consistency issues.

At minimum evaluate and remediate:

### `overhead-press-band`

Problem:
- It is a strength/power level in a ladder declared mobility/flexibility.

Acceptable remediations:
- move it to a strength/power ladder if architecture supports this cleanly;
- split the shoulder mobility ladder from overhead strength;
- keep it but mark it clearly as cross-domain/supporting and ensure Stage 5 cannot treat it as a mobility progression endpoint;
- document a temporary V1 decision if movement would be larger than Stage 4A.

Tests must prove the chosen policy.

### `loaded-march`

Problem:
- ID/name implies load, but display is March in Place and equipment is none.

Acceptable remediations:
- rename display/source metadata if possible without breaking IDs;
- add comments/tests clarifying this is an unloaded march;
- do not break existing persisted IDs.

### ladder level vs definition level

Problem:
- Some definition levels are one-based while ladder ordinals are zero-based.

Acceptable remediations:
- add integrity tests documenting the canonical source;
- normalize where safe;
- do not create broad migration risk.

### equipment metadata hierarchy

Problem:
- ladder and exercise definitions can disagree.

Acceptable remediations:
- make ladder and definition equipment match for high-risk exercises;
- add tests that reject mismatches unless explicitly allowed.

Do not over-expand this task into a full catalogue redesign.

## Step 7: Honest skipped-slot and substitution behavior

Update filtering/substitution so safety gating cannot silently dilute focus-domain work.

Required behavior:

- If a focus-domain slot cannot be served because floor/stair/support is unavailable, record a clear skipped reason.
- Do not substitute upper-body pull with shoulder mobility as if it were equivalent strength work unless explicitly marked as maintenance/supporting.
- Do not hide skipped focus-domain work from generated-session metadata.
- Tests should assert skipped-slot reasons and session guidance.

Stage 4A does not need to solve upper-body pull fully with new exercises unless there is already an obvious safe no-equipment alternative. It may instead make the skip explicit and recommend Stage 4C/4D remediation.

## Step 8: Tests

Add/update tests for:

### Catalogue integrity

- every registered exercise has valid domain/equipment metadata.
- every ladder level points to a registered exercise.
- no duplicate IDs.
- ladder and definition equipment agree for safety-critical exercises.
- floor/stair/support constraints are represented.

### Floor gating

- no-floor profile excludes floor exercises.
- floor-allowed profile can include floor exercises where appropriate.
- session equipment labels show floor requirement when selected.
- manual practice and Explore respect floor gating.

### Step-up gating

- no stair -> no step-up.
- stair without support/safety -> no step-up.
- stair with support/safety -> step-up allowed.
- fallback/skipped reason is clear.

### Balance support gating

- true no-equipment excludes support-dependent balance drills.
- support available allows balance holds.
- manual practice respects support.
- Explore respects support.

### Domain consistency

- `overhead-press-band` policy is tested.
- `loaded-march` naming/stimulus policy is tested.
- high-risk ladder/domain mismatches fail or are explicitly allowed.

### No silent dilution

- no-equipment strength/balance/mobility scenarios do not silently replace focus-domain work with unrelated stimulus.
- skipped slots carry clear reasons.
- upper-pull without band is not presented as equivalent pull work.

### Regression

- existing generated-session tests still pass.
- Stage 3A/3B/3C/3D tests still pass through full suite.
- no scoring/norm/snapshot changes.

## Validation commands

Run targeted tests for:

- exercise catalogue;
- workout generation;
- session planning;
- Explore view model;
- adherence/block service;
- relevant training/session tests;
- Stage 3D focus metadata regression if touched.

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

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Stage 4 findings addressed.
4. Stage 4 findings not addressed.
5. Training-content architecture changes.
6. Equipment/safety data model changes.
7. Floor-work gating behavior.
8. Step-up gating behavior.
9. Balance-support gating behavior.
10. Domain/equipment consistency changes.
11. Skipped-slot/substitution behavior changes.
12. Files changed.
13. Tests added/changed.
14. Exact validation results.
15. Regression verification for Stage 1–3D protections.
16. Remaining Stage 4 blockers.
17. Whether Stage 5 catalogue inputs are ready or still blocked.
18. Initial and final Git status.
19. Concurrent external changes.
20. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 4A:

1. Floor exercises are not selected unless floor work is explicitly available/allowed.
2. Floor requirement is visible in session equipment labels when floor work is selected.
3. Step-up requires stair/support safety prerequisites.
4. Step-up falls back or skips safely when prerequisites are missing.
5. Support-dependent balance drills require support metadata consistently.
6. True no-equipment profiles do not get support-dependent balance drills.
7. Manual ladder practice respects floor/stair/support constraints.
8. Explore practice respects floor/stair/support constraints.
9. `overhead-press-band` domain/life-cycle ambiguity is resolved or explicitly guarded.
10. `loaded-march` naming/stimulus ambiguity is resolved or explicitly guarded.
11. Safety-critical ladder/definition equipment mismatches are fixed or tested as intentional.
12. Focus-domain work is not silently diluted without a clear skipped/substitution reason.
13. Upper-pull without band is not presented as equivalent pull stimulus if it falls back to mobility.
14. No scoring formulas changed.
15. No norm tables changed.
16. No Stage 3D focus semantics changed.
17. No Check-Up measurement/camera readiness logic changed.
18. Full tests pass.
19. Typecheck passes.
20. Expo config passes.
21. git diff --check passes.

## Acceptance criteria

Do not mark Stage 4A complete unless all are true:

1. Floor gating is implemented and tested.
2. Step-up gating is implemented and tested.
3. Balance support consistency is implemented and tested.
4. High-confidence domain/equipment inconsistencies are remediated or explicitly guarded.
5. No-equipment session dilution is at least detected and honestly surfaced.
6. Manual practice and Explore respect the new constraints.
7. Safety-critical catalogue integrity tests exist.
8. Targeted tests pass.
9. Full tests pass.
10. Typecheck passes.
11. Expo config passes.
12. git diff --check passes.
13. No unrelated user work is reverted or overwritten.
14. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 4A COMPLETE
- STAGE 4A BLOCKED

Also state exactly one:

- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 4 REMEDIATION COMPLETE

Also state exactly one:

- STAGE 5 CATALOGUE INPUTS READY
- STAGE 5 CATALOGUE INPUTS BLOCKED

Also state:

- STAGE 3D-B REQUIRED

Stage 4 remediation is likely still required after Stage 4A because upper-pull substitution, progression specificity, pain/readiness rules, and cueing may still need later batches.

Use STAGE 5 CATALOGUE INPUTS READY only if the current catalogue is now safe and semantically stable enough for Stage 5 to audit generation against it.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Floor gating implemented.
- Step-up gating implemented.
- Balance support gating implemented.
- Domain/equipment consistency fixes.
- Skipped-slot/substitution behavior changes.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full suite result.
- Typecheck result.
- Expo config result.
- git diff --check result.
- Confirmation that scoring/norms/Stage 3D semantics were unchanged.
- Remaining Stage 4 blockers.
- STAGE 4A COMPLETE or STAGE 4A BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED or STAGE 4 REMEDIATION COMPLETE.
- STAGE 5 CATALOGUE INPUTS READY or STAGE 5 CATALOGUE INPUTS BLOCKED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
