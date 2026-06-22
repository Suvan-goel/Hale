# Hale Logic Remediation Stage 4E-R

Date: 2026-06-22

## 1. Scope

Stage 4E-R implemented the controlled-beta optional-level policy for training exercises. The remediation closes F4R-005 for controlled beta by containment: optional levels remain registered and historically readable, but are not reachable by controlled-beta users through generation, progression, Explore, manual practice, presets, restore, direct helper calls, or stale current plans.

No Stage 4F-R movement-specific progression/domain review, Stage 4G-R mobility/product polish, Stage 3D-B, device validation, app-store work, audio regeneration, dependency install, staging, commit, branch, or push was performed.

## 2. Initial Git Status

Commands run before Stage 4E-R editing:

```text
$ git status --short --untracked-files=all
A  docs/audits/Hale_Stage_4E_R_Optional_Level_Controlled_Beta_Policy_Prompt.md
M  src/screens/TrainingSessionScreen.tsx

$ git diff --name-only

$ git diff --stat
```

`git diff --cached --name-only`, `git diff --cached --stat`, and a cached diff check for `src/screens/TrainingSessionScreen.tsx` produced no patch output at task start.

## 3. Finding Addressed

F4R-005 - P2: optional loaded and advanced levels lacked a complete controlled-beta exposure policy.

Status: closed for controlled beta by hard containment. Optional levels are not approved for user reachability.

## 4. Findings Explicitly Deferred

- F4R-008: movement-specific progression prerequisites and domain-reviewed advancement criteria remain deferred to Stage 4F-R.
- F4R-009: mobility collection labels and rotation polish remain deferred.
- F4R-010: final minimal-equipment positioning and Hale Movement Kit copy remain deferred.

## 5. Prior Optional-Level Architecture

Before this remediation, optional access was controlled by scattered `releaseStatus` checks and a legacy `includeOptionalLevels` boolean. This created bypass risk in generated sessions, debug scenarios, direct helper calls, restored progress, and progression adjacency.

## 6. Approved Controlled-Beta Policy

Controlled beta exposes only `v1_core` levels. All current `v1_optional` levels are hidden, regardless of equipment, movement-capability confirmation, restored progress, previous completion, safety cues, debug build status, or caller-provided legacy optional flags.

Internal-development channel types exist for future isolation, but production generation/planning does not accept a release-channel parameter and does not infer access from `__DEV__`.

## 7. Canonical Release-Policy Architecture

Added `src/exercises/releasePolicy.ts` as the single pure policy source:

- `TrainingReleaseChannel = 'controlled_beta' | 'internal_development'`.
- explicit seven-level hidden optional inventory.
- stable availability reasons:
  - `load_policy_not_approved`;
  - `future_domain_review_required`;
  - `capability_prerequisite_not_approved`;
  - `optional_hidden_in_controlled_beta`;
  - `unsupported_release_status`;
  - `unknown_level`.
- effective-level derivation for restored optional progress.
- adjacent available level selection for progression.
- deterministic release-policy fingerprints and plan snapshots.

`listVisibleExerciseLadders()` now means controlled-beta visible. The deprecated `includeOptional` argument no longer changes the visible set.

## 8. Complete Optional-Level Inventory

| Optional level | Controlled-beta reason | Status |
|---|---:|---|
| `loaded-sit-to-stand` | `load_policy_not_approved` | hidden |
| `squat-slow-eccentric` | `future_domain_review_required` | hidden |
| `squat-loaded` | `load_policy_not_approved` | hidden |
| `chair-supported-split-squat` | `capability_prerequisite_not_approved` | hidden |
| `push-up-standard` | `capability_prerequisite_not_approved` | hidden |
| `mini-band-lateral-walk` | `future_domain_review_required` | hidden |
| `neck-rotation` | `future_domain_review_required` | hidden |

Registry IDs and definitions were preserved.

## 9. Per-Ladder Beta Ceilings

| Ladder | Core levels | Hidden optional levels | Beta ceiling / behavior |
|---|---:|---:|---|
| `sit-to-stand` | 4 | `loaded-sit-to-stand` | `sts-power`; restored loaded state selects `sts-power` |
| `squat` | 2 | `squat-slow-eccentric`, `squat-loaded`, `chair-supported-split-squat` | `squat-free` |
| `step-up` | 1 | none | `step-up` |
| `heel-toe-raise` | 3 | none | highest available core in ladder order |
| `push` | 2 | `push-up-standard` | `push-up-incline` |
| `pull-upper-back` | 3 | none | highest available core in ladder order |
| `hinge-glutes` | 4 | none | highest available core in ladder order |
| `shoulder-reach-press` | 2 | none | highest available core in ladder order |
| `balance` | 3 | none | `balance-single-leg-hold` |
| `lateral-stability` | 2 | `mini-band-lateral-walk` | optional rung omitted; available core levels remain selectable by policy |
| `mobility-flexibility` | 4 | `neck-rotation` | `wall-calf-stretch` |

## 10. Generated-Session Level Resolution

`src/training/workoutGeneration.ts` now consumes the canonical policy:

- generator selection filters with `isExerciseLevelAvailableForRelease`;
- legacy `includeOptionalLevels` is deprecated and ignored;
- restored optional progress derives the nearest lower beta-available same-ladder level;
- `requestedLevelId` remains the historical/current requested value;
- `selectedDailyLevelId` records the actual beta-safe exercise;
- `controlled_beta_release_cap` is recorded in adjustment metadata;
- planning does not mutate persistent progress merely because the release cap exists.

## 11. Progression Ceiling

Automatic progression now uses `adjacentAvailableLevelId`, so it skips hidden optional levels. At a beta ceiling, positive evidence is applied idempotently but the current level holds. `progressionEvidence` records `release_cap_reached` when an otherwise positive progression attempt reaches the controlled-beta cap.

Pain, poor tracking, valid-time, duplicate-event, fallback-role, hold-only, and schedule-credit behavior remain governed by existing Stage 5 policies.

## 12. Main-Plan Maintenance Behavior At Ceiling

Main-plan credit and schedule credit remain possible at the highest beta level. A user can complete and receive credit for `sts-power`, `squat-free`, `push-up-incline`, etc. without being promoted into hidden optional levels. No false level-up copy was added.

## 13. Plan Release Metadata

New current plans include `metadata.releasePolicySnapshot`:

- schema version;
- `controlled_beta` channel;
- release-policy fingerprint;
- per-exercise selected level;
- requested level when capped;
- availability reason;
- adjustment reasons.

The snapshot is JSON-safe and deterministic. It does not duplicate the full catalogue and does not accept user-controlled release channels.

## 14. Start-Time Validation

`App.tsx` now validates release policy after equipment and movement-capability snapshots and before safety-cue validation. Current plans fail closed when:

- release metadata is missing;
- the release channel is unsupported;
- the release policy fingerprint is stale;
- any planned exercise is unavailable in controlled beta.

Recovery copy says the session needs refresh, the level is not available in beta yet, and plan/progress are unchanged.

## 15. Explore Behavior

Explore cards and ladder details use the policy:

- optional levels are omitted;
- restored optional current markers derive the beta-safe effective level;
- easier/harder navigation stops at the beta-visible list;
- optional instructions are not presented as startable actions.

## 16. Manual-Practice Behavior

Manual practice now rejects direct optional-level requests with `exercise_level_not_available_in_controlled_beta`. Ladder-level practice remains non-credit and progression-ineligible. If restored progress points to optional state and the user starts a ladder-level practice, planning derives the beta-safe level and records release-cap metadata.

## 17. Preset/Extra Behavior

Presets and extra sessions flow through the same generator policy. Optional levels cannot appear because a preset, equipment profile, restored progress, or legacy `includeOptionalLevels` flag requests them. Empty/unsafe sessions continue to use existing typed recovery semantics.

## 18. Restore/Backend Behavior

Restore does not read or restore a release channel from profile/training/backend data. Restored optional ladder progress remains stored as historical/current state, but current planning derives an effective beta level and does not rewrite progress on read. A restore test now verifies `loaded-sit-to-stand` remains in restored `ladderProgressById` while current planning selects `sts-power`.

No backend schema migration was added.

## 19. Loaded-Level Containment

Loaded levels remain defined but are not user-reachable in the controlled beta. Enabling them later requires a separate approved load-selection, securement, breathing, effort, and stop-rule policy plus domain review.

Proof points:

- generator filters `loaded-sit-to-stand` and `squat-loaded`;
- Explore omits them;
- manual direct requests fail closed;
- progression cannot enter them;
- equipment such as backpack/dumbbells cannot enable them;
- restore caps current planning without historical rewrite;
- no load-prescription algorithm was added.

## 20. Other Optional-Level Containment

- `squat-slow-eccentric`: hidden pending Stage 4F-R progression review.
- `chair-supported-split-squat`: hidden pending prerequisite and lower-limb/balance review.
- `push-up-standard`: hidden despite confirmed floor transfer.
- `mini-band-lateral-walk`: hidden pending progression/domain review; mini-band availability alone does not enable it.
- `neck-rotation`: hidden pending mobility/domain review.

## 21. User-Facing Copy

Added narrow recovery copy only:

- "This level is not available in the beta yet."
- "Hale can use the closest supported level."
- "Your plan and progress are unchanged."

No shame, medical, failure, age, or internal `v1_optional` copy was added.

## 22. Safety-Audio Non-Regression

No audio was regenerated. No MP3 files, audio manifests, or safety cue copy were edited. `npm run verify:audio` passed with:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

Optional safety cue metadata remains defined for future safety without making optional levels reachable.

## 23. Files Changed By Stage 4E-R

- `App.tsx`
- `src/exercises/releasePolicy.ts`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/__tests__/releasePolicy.test.ts`
- `src/exercises/__tests__/catalog.test.ts`
- `src/training/workoutGeneration.ts`
- `src/training/debugWorkoutScenarios.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/serialize.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/training/__tests__/store.test.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/haleFlow/progressionEvidence.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/screens/SessionPlanningRecoveryScreen.tsx`
- `src/services/backend/__tests__/restoreService.test.ts`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md`

## 24. Tests Added/Changed

Added:

- `src/exercises/__tests__/releasePolicy.test.ts`

Changed:

- catalogue visibility assertions;
- workout generation cap/property-style tests;
- progression cap diagnostic tests;
- session planning release snapshot/start validation/manual tests;
- Explore restored optional current marker tests;
- restore optional progress cap test;
- local serialization cap-reason preservation test.

## 25. Exact Validation Results

Targeted command:

```bash
npm test -- --runInBand src/audio/__tests__/safetyAudio.test.ts src/audio/__tests__/voicePlayer.test.ts src/training/__tests__/safetyCues.test.ts src/training/__tests__/sessionPlayer.test.ts src/exercises/__tests__/releasePolicy.test.ts src/exercises/__tests__/catalog.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/store.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts src/services/backend/__tests__/restoreService.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts src/profile/__tests__/equipment.test.ts src/profile/__tests__/movementCapabilities.test.ts
```

Result: 16 suites passed, 236 tests passed.

Required validation:

| Command | Result |
|---|---|
| `npm run verify:audio` | passed; 44 cues, 88 required assets |
| `npm test -- --runInBand` | passed; 101 suites, 823 tests |
| `npm run typecheck` | passed |
| `npm --prefix website run typecheck` | passed |
| `npx --no-install expo config --type public` | passed |
| `git diff --check` | passed |
| Expo export to `/tmp/hale-stage4er-export` | passed; Android and iOS bundles exported; temp output removed |

Warnings observed:

- Watchman recrawl warning during Jest, already present style of local warning.
- Jest open-handle notice after targeted and full runs.
- Existing backend sync tests printed expected console logs/warnings.
- Expo config/export printed `.env` variable names but no values, plus existing Sentry missing organization/project warning.
- Expo export printed repeated `NO_COLOR`/`FORCE_COLOR` node warnings.

Validation changed no Stage 4E-R assets. Expo export created and removed only `/tmp/hale-stage4er-export`.

## 26. Stage 4A-4D-R And Stage 5 Regression Verification

Covered by targeted and full suites:

- Stage 4A/4B equipment gates, stimulus roles, no-band honesty, mobility collection.
- Stage 4C-R floor transfer, step-up environment, supported balance, daily context, stale equipment/movement setup.
- Stage 4D-R/4D-R.1 cue coverage, safety audio, static mappings, voice player, session player, start cue validation.
- Stage 5A-5H work evidence, focus credit, schedule credit, progression authority, readiness/discomfort, lifecycle, restore, adversarial lifecycle.
- App and website TypeScript boundaries.

No scoring, norms, or Check-Up logic was changed by Stage 4E-R.

## 27. F4R-005 Status

F4R-005 is closed for controlled beta by hard containment.

This does not approve optional levels for beta users. Future enablement still requires Stage 4F-R/domain review and, for loaded levels, a separate load policy.

## 28. Remaining Stage 4 Findings

F4R-008, F4R-009, and F4R-010 remain unresolved and explicitly deferred.

## 29. Stage 4F-R Unblock Status

Stage 4F-R is unblocked from the Stage 4E-R optional-exposure blocker, but Stage 4F-R remains required for movement-specific progression/domain approval.

## 30. Exercise Catalogue Beta Status

The exercise catalogue remains software/content-blocked for broad beta readiness because F4R-008, F4R-009, and F4R-010 remain open. Dynamic workout generation is software-ready for controlled beta with optional levels contained.

## 31. Initial And Final Git Status

Initial status is recorded in section 2.

Final status after implementation and validation, before this report was added, included Stage 4E-R edits plus concurrent/external changes:

```text
 M App.tsx
 M src/checkup/checkup.ts
 M src/exercises/__tests__/catalog.test.ts
 M src/exercises/index.ts
 M src/exercises/ladders.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/progressionEvidence.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/progressionEvidence.ts
 M src/haleFlow/sessionPlanning.ts
 M src/haleFlow/types.ts
 M src/screens/CheckUpScreen.tsx
 M src/screens/SessionPlanningRecoveryScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/services/backend/__tests__/restoreService.test.ts
 M src/training/__tests__/store.test.ts
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dailyTrainingContext.ts
 M src/training/debugWorkoutScenarios.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
 M website/next-env.d.ts
 M website/package-lock.json
?? src/exercises/__tests__/releasePolicy.test.ts
?? src/exercises/releasePolicy.ts
```

This report file adds:

```text
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
```

## 32. Complete Files-Changed Inventory

Stage 4E-R changed/added the files in section 23. No binary assets were generated or edited by this stage.

Current worktree also contains concurrent/external changes listed in section 33.

## 33. Concurrent External Changes

The following files were modified in the worktree but were not part of the Stage 4E-R release-policy edits:

- `src/checkup/checkup.ts`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `website/next-env.d.ts`
- `website/package-lock.json`

These were preserved and not reverted. The `website/package-lock.json` modification is not Stage 4E-R-owned; no package install was run.

## 34. Safety Confirmations

- No package install was run.
- No Stage 4E-R-owned lockfile change was made.
- No audio was regenerated.
- No `.env` contents or provider secret values were printed, copied, committed, or exposed.
- No staging, commit, branch creation, or push occurred.
- No generated audio assets, safety cue text, or audio manifests were edited.

## Required Outcome Summary

- All seven current optional levels are hidden in controlled beta.
- Optional levels remain registered.
- Generated current, short, restart, supporting, preset, and manual paths cannot expose optional levels.
- Direct optional manual requests fail closed.
- Progression cannot enter optional levels.
- Restored optional progress is capped for current planning without read-time rewrite.
- Stale/missing release metadata fails closed at start.
- Historical optional records remain readable.
- Loaded levels remain hidden pending future approved load policy.
- Stage 4D-R.1 safety audio remains verified.

STAGE 4E-R COMPLETE

STAGE 4F-R UNBLOCKED

STAGE 4F-R REQUIRED

STAGE 4 REMEDIATION STILL REQUIRED

EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED
