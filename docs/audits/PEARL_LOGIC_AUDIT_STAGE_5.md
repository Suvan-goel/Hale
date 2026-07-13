# Pearl Logic Audit Stage 5: Dynamic Workout Generation And Completion Semantics

Date: 2026-06-20

Scope: read-only audit and product-decision report for dynamic workout generation, 4-week block
logic, A/B/C session rotation, autoregulation/progression, completion credit, local persistence,
backend sync/restore, and realistic user-state generation. The only intended repository change is
this report.

## 1. Executive Verdict

Stage 5 remediation is required before beta users can trust automatic plan generation.

The current implementation has a much stronger catalogue and assessment input layer than earlier
stages: official block creation now requires complete current-version Check-Up evidence; generated
sessions carry slot-level stimulus roles; floor, stair, support, band, and door-anchor gates are
mostly explicit; A/B/C templates are deterministic; and the installed validation suite is green.

However, the completion and recent-session contracts are still not strong enough for a production
training loop. The highest-risk defects are:

| ID | Priority | Verdict |
| --- | --- | --- |
| F5-001 | P0 | Non-training events can contaminate dynamic A/B/C rotation and make a week look complete. |
| F5-002 | P0 | A session where every exercise was skipped can receive main-plan completion credit. |
| F5-003 | P1 | Missing exercise results default to completed for ladder progression. |
| F5-004 | P1 | Generated plan `plannedDateKey` uses ambient current date, not the explicit planning date. |
| F5-005 | P1 | Dynamic generation failures fall back to the legacy planner, which bypasses Stage 4B stimulus/safety semantics. |
| F5-006 | P1 | Focus-domain primary stimulus can be absent or skipped while the session still counts toward the main block. |
| F5-007 | P2 | Two progression systems mutate in parallel and can diverge, especially when fallback is used. |
| F5-008 | P2 | Equipment availability still has multiple sources of truth. |
| F5-009 | P2 | Remote training-state sync omits the new Stage 4B generated-exercise stimulus fields. |

Stage decision:

- STAGE 5 REMEDIATION REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- Stage 4B catalogue semantics are useful, but completion credit and rotation do not yet consume
  them honestly.

## 2. Required Prior Reading

Read before runtime tracing:

- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md`

Carry-forward context used:

- Stage 1A/3A/3B/3C now make complete current-version official Check-Up evidence the source for
  block creation.
- Stage 3D-A/3D-C/3D-D make focus inputs beta-safer, but Stage 3D-B norm provenance remains open.
- Stage 4A/4B make catalogue safety and stimulus semantics explicit enough for this Stage 5 audit.
- Historical Stage 1 risks around non-training completions, all-skipped credit, missing results,
  fallback, date keys, and equipment stores all needed re-verification against current code.

## 3. Initial Repository State

Initial `git status --short --untracked-files=all`:

```text
 M src/adherence/types.ts
 M src/exercises/__tests__/catalog.test.ts
 M src/exercises/balanceRung.ts
 M src/exercises/heelRaise.ts
 M src/exercises/ladders.ts
 M src/exercises/loadedMarch.ts
 M src/exercises/mobilityDrills.ts
 M src/exercises/pullUpperBack.ts
 M src/exercises/pushUp.ts
 M src/exercises/stepUp.ts
 M src/exercises/supportedSquat.ts
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/movements/types.ts
 M src/profile/serialize.ts
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/debugWorkoutScenarios.ts
 M src/training/dynamicState.ts
 M src/training/index.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? assets/pearl-logo-icon-groove-connected.png
?? assets/pearl-logo-icon-groove.png
?? assets/pearl-logo-icon.png
?? assets/images/explore-library-balance.png
?? assets/images/explore-library-heel-toe-raise.png
?? assets/images/explore-library-hero.png
?? assets/images/explore-library-hinge-glutes.png
?? assets/images/explore-library-lateral-stability.png
?? assets/images/explore-library-mobility-flexibility.png
?? assets/images/explore-library-pull-upper-back.png
?? assets/images/explore-library-push.png
?? assets/images/explore-library-shoulder-reach-press.png
?? assets/images/explore-library-sit-to-stand.png
?? assets/images/explore-library-squat.png
?? assets/images/explore-library-step-up.png
?? assets/images/progress-hero-botanical.png
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
?? docs/audits/Pearl_Stage_4A_Catalogue_Safety_Gating_Prompt.md
?? docs/audits/Pearl_Stage_4B_Stimulus_Domain_Progression_Prompt.md
?? docs/audits/Pearl_Stage_5_Dynamic_Workout_Generation_Audit_Prompt.md
?? src/pearlFlow/extraSessionCopy.ts
?? src/training/equipmentSafety.ts
?? tmp/logo/pearl-flat-traced-candidate.png
?? tmp/logo/pearl-flat-traced-smooth-hires.png
?? tmp/logo/pearl-flat-traced-smoothed.png
```

Initial `git diff --name-only`:

```text
src/adherence/types.ts
src/exercises/__tests__/catalog.test.ts
src/exercises/balanceRung.ts
src/exercises/heelRaise.ts
src/exercises/ladders.ts
src/exercises/loadedMarch.ts
src/exercises/mobilityDrills.ts
src/exercises/pullUpperBack.ts
src/exercises/pushUp.ts
src/exercises/stepUp.ts
src/exercises/supportedSquat.ts
src/pearlFlow/__tests__/exploreViewModel.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/exploreViewModel.ts
src/pearlFlow/sessionPlanning.ts
src/pearlFlow/types.ts
src/movements/types.ts
src/profile/serialize.ts
src/screens/ExploreScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SettingsScreen.tsx
src/training/__tests__/workoutGeneration.test.ts
src/training/debugWorkoutScenarios.ts
src/training/dynamicState.ts
src/training/index.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

Initial `git diff --stat`:

```text
 src/adherence/types.ts                           |   2 +
 src/exercises/__tests__/catalog.test.ts          |  86 ++++
 src/exercises/balanceRung.ts                     |   8 +-
 src/exercises/heelRaise.ts                       |   4 +-
 src/exercises/ladders.ts                         |  59 ++-
 src/exercises/loadedMarch.ts                     |  10 +-
 src/exercises/mobilityDrills.ts                  |   2 +-
 src/exercises/pullUpperBack.ts                   |   2 +-
 src/exercises/pushUp.ts                          |   2 +-
 src/exercises/stepUp.ts                          |  10 +-
 src/exercises/supportedSquat.ts                  |   4 +-
 src/pearlFlow/__tests__/exploreViewModel.test.ts  | 106 +++++
 src/pearlFlow/__tests__/sessionPlanning.test.ts   | 176 ++++++-
 src/pearlFlow/exploreViewModel.ts                 | 118 +++--
 src/pearlFlow/sessionPlanning.ts                  |  76 ++-
 src/pearlFlow/types.ts                            |  28 +-
 src/movements/types.ts                           |   7 +-
 src/profile/serialize.ts                         |   2 +
 src/screens/ExploreScreen.tsx                    | 442 +++++++++++++----
 src/screens/OnboardingEquipmentScreen.tsx        |   6 +
 src/screens/PlanScreen.tsx                       |  12 +-
 src/screens/ProgressScreen.tsx                   | 582 +++++++++++++++--------
 src/screens/SettingsScreen.tsx                   |  10 +
 src/training/__tests__/workoutGeneration.test.ts | 252 +++++++++-
 src/training/debugWorkoutScenarios.ts            |   2 +-
 src/training/dynamicState.ts                     |   5 +
 src/training/index.ts                            |   3 +
 src/training/serialize.ts                        |  28 ++
 src/training/workoutGeneration.ts                | 306 ++++++++++--
 29 files changed, 1932 insertions(+), 418 deletions(-)
```

All existing modifications and untracked files were treated as user-owned. Current diffs were
inspected for every materially cited modified file.

## 4. How The First 4-Week Block Is Created

Authoritative first-block path:

```text
Results / OnboardingResults CTA
  -> App.handleStartPlan
  -> getBlockCreationEligibility(score, snapshot, source assessment)
  -> buildBlock(score, training.equipment, now)
  -> createMovementBlockFromAssessment(current snapshot-backed assessment)
  -> upsertMovementBlock(adherence, movementBlock)
  -> startBlock(training, legacyTrainingBlock)
  -> optional syncMovementBlockToRemote
```

Runtime evidence:

- `App.tsx:1492-1557` gates block creation through `getBlockCreationEligibility`, then writes both
  a MovementBlock and legacy TrainingBlock.
- `src/adherence/blockService.ts:41-74` fails closed for ineligible assessments and constructs the
  MovementBlock focus from the eligibility result.
- `src/training/block.ts:108-125` still builds the legacy block from `score.weakestDomain`.
- `src/training/workoutGeneration.ts:346-367` builds a dynamic block with 4 weeks, 3 sessions/week,
  12 total planned sessions, focus domain, secondary domains, and three templates.

Verdict: first-block creation is correctly blocked from invalid/no-domain or stale-version Check-Up
evidence by prior remediation. Stage 5 did not find a new first-block eligibility defect.

Remaining architectural risk: App still creates and persists two block representations. The
MovementBlock drives dynamic focus/templates; the legacy TrainingBlock drives fallback, legacy
progress, and some training-state persistence.

## 5. How A/B/C Session Rotation Works

Runtime path:

```text
App.handleStartSession
  -> planTodayPearlSession
  -> recentSessionsFor(adherence.completions + training.generatedSessionSummaries)
  -> toDynamicTrainingBlock(active MovementBlock)
  -> generateTodaySession
  -> getTemplateSelection
  -> select next uncompleted template in current week
  -> adaptGeneratedSessionToPearlSessionPlan
```

Template logic:

- `src/training/workoutGeneration.ts:660-727` defines three A/B/C templates per focus domain.
- `src/training/workoutGeneration.ts:375-415` filters recent sessions by matching `blockId`,
  counts every non-skipped session overall and in the current week, returns `week_complete` at
  `sessionsPerWeek`, and chooses the first template whose id is not in the current week.
- `src/pearlFlow/sessionPlanning.ts:557-580` adapts both adherence completions and generated session
  summaries into the `recentSessions` array used by template selection.

Intended behavior: Session A, then B, then C inside each week; after 3 main sessions in a week,
return week-complete/retest-prep behavior; after 12 main sessions, return block-complete.

Actual defect: the recent-session adapter and template selector do not enforce "main training
session" semantics. See F5-001.

## 6. Findings

### F5-001 - Non-training events contaminate A/B/C rotation

Priority: P0

Classification: confirmed software defect.

Exact trigger:

- Complete a micro-check for the active block, or
- complete Explore preset/manual ladder practice while an active block exists, or
- complete any restored/synced completion/summary carrying the active block id but not a main
  block-generated A/B/C session.

Runtime chain:

```text
App.handleStartSession passes adherence.completions
  -> planTodayPearlSession
  -> recentSessionsFor maps every completion to status completed
  -> recentSessionsFor also maps every completed generatedSessionSummary, including source preset/manual
  -> generateTodaySession
  -> getTemplateSelection counts every non-skipped block session
  -> completedThisWeek can reach 3 without A/B/C training
```

Evidence:

- App passes all completions into planning: `App.tsx:1569-1586`.
- Completion adapter has no `sessionType` filter: `src/pearlFlow/sessionPlanning.ts:557-566`.
- Generated summary adapter has no source filter: `src/pearlFlow/sessionPlanning.ts:568-580`.
- Template selector counts every non-skipped block session: `src/training/workoutGeneration.ts:380-415`.
- In contrast, adherence helper `completedTrainingSessions` filters to starter/standard/restart:
  `src/adherence/dateUtils.ts:45-51`. The generator does not use that helper.

Counterexample from diagnostic probe:

```text
clean -> template strength-A, completedThisWeek 0, status session_due
after micro_check-like recent session -> completedThisWeek 1, status session_due
after manual practice-like summary -> completedThisWeek 1, status session_due
after preset-like summary -> completedThisWeek 1, status session_due
after three non-training recent sessions -> template null, completedThisWeek 3, status week_complete
```

User impact:

- A user can do a micro-check, a mobility reset, and a manual practice, then Pearl can say the planned
  week is complete even though no A/B/C main session was completed.
- A/B/C order can be skipped or delayed.
- Block-complete/retest state can be reached earlier than the user actually trained if enough
  contaminating rows accumulate.

Existing test status:

- `src/pearlFlow/__tests__/sessionPlanning.test.ts` verifies `countsTowardMainPlan` for preset/manual,
  but does not verify that preset/manual summaries are excluded from `recentSessionsFor`.
- `src/training/__tests__/workoutGeneration.test.ts` tests A/B/C selection with simple generated
  recent sessions, not typed/non-training recent sessions.
- Targeted and full suites passed, so this defect is not currently protected.

### F5-002 - All-skipped sessions receive main-plan credit

Priority: P0

Classification: confirmed software defect / product-policy blocker.

Exact trigger:

1. User starts a starter/standard/restart main-plan session.
2. Setup cannot frame one or more exercises, or the user manually skips every item.
3. TrainingSessionPlayer reaches `done` with all items `status: 'skipped'`.
4. App records completion because source/type counts toward the main plan.

Runtime chain:

```text
TrainingSessionPlayer.skipCurrentItem
  -> results.push(status skipped)
  -> finish returns all skipped items
  -> TrainingSessionScreen onComplete(result)
  -> App.handleSessionComplete
  -> countsTowardMainPlan true for starter/standard/restart block-generated plan
  -> recordCompletedSession increments legacy training progress
  -> recordTrainingSessionCompletion records adherence completion
```

Evidence:

- Skips are valid player results: `src/training/sessionPlayer.ts:173-187`.
- `finish()` fills remaining items as skipped: `src/training/sessionPlayer.ts:457-461`.
- `TrainingSessionScreen` one-shots any `done` result to App: `src/screens/TrainingSessionScreen.tsx:142-145`.
- App credits the session without checking completed item count or stimulus credit:
  `App.tsx:1650-1725`.
- Legacy training progress increments unconditionally: `src/training/state.ts:36-50`.
- Adherence completion is recorded without a skipped/all-skipped check:
  `src/adherence/adherenceService.ts:85-95`.

Counterexample:

- Existing `src/training/__tests__/sessionPlayer.test.ts` intentionally proves a no-landmarks feed can
  skip both items and still end with a result containing two skipped items. That is valid player
  behavior, but App-level credit does not distinguish it from training completion.

User impact:

- Pearl can advance the block, generate milestones, and eventually trigger retest after sessions where
  no exercise was actually trained.
- This undermines the product law that the camera is a measuring instrument and training evidence
  should be conservative.

Existing test status:

- Player-level skipped-session behavior is tested and passing.
- No App/service test asserts that all-skipped or zero-primary-stimulus sessions receive no main-plan
  completion credit.

### F5-003 - Missing exercise results default to completed for ladder progression

Priority: P1

Classification: confirmed latent defect.

Exact trigger:

- A dynamic main-plan session reaches feedback with `lastSessionResult` missing, null, or missing one
  planned exercise item.
- User submits feedback without explicitly marking incomplete. Current completion feedback always
  defaults `completed: true`.

Runtime chain:

```text
SessionCompletionScreen.buildSessionFeedback -> completed true
  -> App.handleSessionFeedback
  -> updateExerciseProgressionFromSession
  -> completedExerciseResultsForPlan
  -> missing item => completed true
  -> completionRate 1
  -> updateLadderProgressAfterSession can mark readyToProgress or progress after two easy exposures
```

Evidence:

- Feedback defaults completed to true: `src/adherence/screens/SessionCompletionScreen.tsx:150-161`.
- App passes `feedback.completed ?? true`: `App.tsx:1848-1858`.
- Missing result item defaults to completed: `src/pearlFlow/sessionPlanning.ts:594-614`.
- Ladder progression treats completion rate >= 0.85 with easy effort as progress evidence:
  `src/training/workoutGeneration.ts:596-605`.

Counterexample:

- For any planned generated exercise with metadata, if `sessionResult.items` omits that exercise and
  the user reports easy effort/no pain, `completedExerciseResultsForPlan` emits
  `completionRate: 1`.

User impact:

- A level can progress from absent evidence after one or two feedback submissions.
- Missing tracking payloads are not fail-closed, which conflicts with the measurement philosophy used
  in Check-Up stages.

Existing test status:

- Existing tests cover skipped items and successful generated completions.
- No test covers absent item, null session result, or partial `sessionResult.items` mapping to zero
  completion.

### F5-004 - Generated completion keys use ambient date

Priority: P1

Classification: confirmed software defect.

Exact trigger:

- Call `planTodayPearlSession({ today: someExplicitDate })`, or generate for a target day around
  midnight/time-zone boundaries, then complete the session.

Runtime chain:

```text
planTodayPearlSession(input.today)
  -> generateTodaySession receives today and uses it for generated.id
  -> adaptGeneratedSessionToPearlSessionPlan
  -> metadata.plannedDateKey = plannedDateKey(generated.templateId)
  -> plannedDateKey uses new Date(), not input.today or generated date
  -> completion plannedDate/dedupe key is ambient date
```

Evidence:

- `today` is passed to the raw generator: `src/pearlFlow/sessionPlanning.ts:107-120`.
- Adapter discards it for `plannedDateKey`: `src/pearlFlow/sessionPlanning.ts:274-279`.
- `plannedDateKey` calls `dateKey(new Date())`: `src/pearlFlow/sessionPlanning.ts:861-863`.
- Completion ids and dedupe use `plannedDate`: `src/adherence/adherenceService.ts:68-82` and
  `src/adherence/adherenceService.ts:85-95`.

User impact:

- Same explicit planning inputs can produce different completion keys depending on wall-clock date.
- A session planned for a future/restored/test date can record under today instead.
- Duplicate/overwrite behavior can be wrong because completion identity is date-keyed.

Existing test status:

- No test asserts app-level `plannedDateKey` equals the injected planning date.
- Raw generator tests are insufficient because raw `generateTodaySession` uses `input.today` for ids.

### F5-005 - Legacy fallback bypasses dynamic constraints

Priority: P1

Classification: confirmed software defect / beta policy blocker.

Exact trigger:

- No active MovementBlock, generator throws, generator returns empty exercises, or generator returns an
  unsupported exercise id.

Runtime chain:

```text
planTodayPearlSession
  -> catch/empty/unsupported path
  -> legacyFallbackPlan
  -> nextSessionExercises(training)
  -> legacy TrainingBlock/progression/equipment path
  -> metadata.source legacy_fallback
  -> countsTowardMainPlan returns true unless sessionType is retest_prep
```

Evidence:

- Fallback is entered on empty/unsupported/errors: `src/pearlFlow/sessionPlanning.ts:127-146`.
- Fallback uses legacy `nextSessionExercises`: `src/pearlFlow/sessionPlanning.ts:521-554`.
- Legacy resolver only uses `training.equipment`, not current safety profile, pain, readiness, or
  slot stimulus: `src/training/state.ts:23-28`, `src/training/block.ts:142-160`.
- `countsTowardMainPlan` does not exclude `legacy_fallback`: `src/pearlFlow/sessionPlanning.ts:289-294`.
- Existing tests intentionally assert fallback on unsupported generated IDs.

User impact:

- Stage 4B slot semantics (`primary/supporting/fallback/skipped`) are lost.
- Pain/readiness constraints and honest skipped-slot guidance can be bypassed.
- Fallback output can still advance the main block.

Existing test status:

- Fallback behavior is tested as a compatibility success.
- No test asserts fallback parity with dynamic safety/pain/equipment constraints or production
  observability/recovery.

### F5-006 - Missing focus-domain stimulus can still earn plan credit

Priority: P1

Classification: confirmed product-policy/software integration defect.

Exact trigger:

- Balance-focused user has no support equipment (`availableEquipment: ['none']`), or another focus slot
  is skipped by equipment/pain/readiness.
- Generator returns a session with at least one non-focus exercise, but no primary focus-domain slot.
- User completes the playable exercises.

Runtime chain:

```text
generateTodaySession
  -> skipped focus slots recorded in slotStimulus
  -> adaptGeneratedSessionToPearlSessionPlan still returns exercises if any are playable
  -> beginPlannedSession only requires exercises.length > 0
  -> countsTowardMainPlan ignores slotStimulus roles
  -> App records main-plan completion
```

Evidence:

- Stage 4B tests intentionally show true no-equipment balance sessions have no
  `balance_stability` exercises and support-required skipped slots.
- `beginPlannedSession` only checks non-empty exercises: `App.tsx:1642-1648`.
- Main-plan credit checks only source/session type: `src/pearlFlow/sessionPlanning.ts:289-294`.

User impact:

- A Balance block can advance after a session that trained no primary balance stimulus.
- The new transparent `slotStimulus` metadata is not yet used for completion honesty.

Existing test status:

- Tests cover transparency of skipped stimulus, but not whether those sessions should count toward
  main-plan completion.

### F5-007 - Parallel progression systems can diverge

Priority: P2

Classification: confirmed architectural risk.

Runtime chain:

- On session completion, App always calls legacy `recordCompletedSession` for main-plan sessions
  before feedback: `App.tsx:1659-1661`.
- That updates legacy `training.progression` using only set results:
  `src/training/state.ts:36-50`, `src/training/progression.ts:194-204`.
- On feedback, App separately calls `updateExerciseProgressionFromSession` to update
  `ladderProgressById` using RPE, pain, tracking, and valid-time data: `App.tsx:1842-1864`.
- Dynamic generation uses `ladderProgressById`; legacy fallback uses `training.progression`.

User impact:

- Normal dynamic sessions and fallback sessions can select different levels from the same history.
- Pain/RPE can affect ladder progression but not legacy fallback progression.

Existing test status:

- Both systems have tests.
- No test asserts equivalence or defines which state is authoritative when fallback occurs.

### F5-008 - Equipment state still has multiple sources of truth

Priority: P2

Classification: confirmed state/policy risk.

Runtime chain:

- Safety profile stores `availableEquipment`, including `stairs`, `resistance_band`, `door_anchor`,
  `floor_space`, and `none`.
- Training state separately stores legacy `EquipmentProfile` (`stair`, `band`, `miniBand`, `load`).
- `availableEquipmentFor` starts from safety profile, then mutates it using training equipment:
  `src/pearlFlow/sessionPlanning.ts:666-694`.

Observed behavior:

- Legacy training equipment can add `stairs` even if safety profile omitted it.
- Legacy training equipment can delete `resistance_band` and `door_anchor` even if safety profile
  includes them.
- There is no single canonical equipment model for planning.

User impact:

- Restored or migrated state can make session planning disagree with Settings/onboarding equipment.
- A conservative UI answer can be overridden by stale training flags.

Existing test status:

- Current tests cover many specific equipment gates.
- No invariant test proves safety profile and training equipment cannot disagree after restore or
  migration.

### F5-009 - Backend training-state sync omits Stage 4B stimulus fields

Priority: P2

Classification: confirmed persistence/sync gap.

Runtime chain:

- Local generated exercise summaries now include `intendedDomain`, `stimulusRole`, and
  `stimulusReason`.
- Local training serialization preserves those fields.
- `mapLocalTrainingStateToRemotePayload` sanitizes generated summaries for backend sync but omits
  these three fields in `sanitizeGeneratedExerciseSummary`.
- Restore can only restore fields present in the compact remote training-state snapshot.

Evidence:

- Local fields exist in `src/training/dynamicState.ts`.
- Local deserialize preserves them in `src/training/serialize.ts`.
- Backend sync omission is visible in `src/services/backend/trainingStateSyncService.ts:151-162`.

User impact:

- A restored device can lose the structured reason why a generated exercise was primary,
  supporting, fallback, or skipped.
- Current rotation mainly uses `templateId`, so this is not as severe as F5-001, but it prevents
  exact restoration of the Stage 4B generated-session context.

Existing test status:

- Backend training-state sync tests assert compaction and sanitization, not preservation of Stage 4B
  stimulus fields.

## 7. Historical Risk Re-Verification

| Historical risk | Current result |
| --- | --- |
| Micro-checks and official re-tests may enter dynamic completion history | Micro-check completions still enter `recentSessionsFor`; retests complete/archive blocks, so less relevant to rotation. Confirmed for micro-checks. |
| All-skipped session may receive main-plan credit | Confirmed F5-002. |
| Missing exercise results may be interpreted as completed | Confirmed F5-003. |
| Dynamic generation failure silently falls back to legacy planner | Confirmed F5-005. Preview has a fallback badge/dev note, but runtime still permits main-plan credit and bypasses dynamic constraints. |
| Legacy progression and dynamic ladder progression may diverge | Confirmed F5-007. |
| Equipment state represented in multiple stores and can disagree | Confirmed F5-008. |
| Generated session date key may use current date instead of supplied planning date | Confirmed F5-004. |
| Non-training completions affect progression or next-session selection | Confirmed for next-session selection through completions and summaries, F5-001. Progression is gated by `countsTowardMainPlan`, but summaries still contaminate rotation. |
| Skipped/equipment-limited focus slots may still make a session look complete | Confirmed F5-006. |
| Repeated completion/retry/restore/sync may duplicate mutations | Partially mitigated: TrainingSessionScreen has `completedRef`, adherence completions dedupe by block/type/plannedDate, generated summaries upsert by id. Legacy `recordCompletedSession` itself is not idempotent, but no normal double-callback path was found. |

## 8. Product-Readiness Answers

1. First block creation: evidence-gated and current-version snapshot backed. No new Stage 5 defect.
2. A/B/C rotation: deterministic for clean main-session inputs, but contaminated by non-training rows.
3. Focus stimulus: templates include focus work, but equipment/pain can skip it and completion credit
   ignores slot stimulus.
4. Equipment constraints: Stage 4B gates are meaningful, but canonical equipment state remains split.
5. Readiness/pain/short-on-time: generator scales sets and orders slots, but fallback bypasses this.
6. Completion credit: not honest yet for all-skipped, missing-result, or no-primary-focus sessions.
7. Progression/regression: ladder progression uses RPE/pain/valid-time after feedback, but missing
   results fail open and legacy progression mutates in parallel.
8. Extra sessions/manual/micro-checks: can contaminate rotation through recent-session adapters.
9. Determinism: raw generator is deterministic for explicit inputs; app-level planned completion key
   is not because it uses ambient date.
10. Generation failures: visible enough for developers/preview, but recover by legacy fallback rather
    than fail closed or constrained dynamic recovery.
11. Persistence/sync/restore: local state mostly preserves active block, ladder progress, summaries,
    and completion history; backend compact training-state sync loses new stimulus fields and restore
    can preserve split-state mismatches.
12. Realistic user states: many scenarios produce useful sessions, but true no-support balance and
    no-band upper pull can produce skipped focus slots that still count if completed.
13. Beta remediation: see section 11.

## 9. Existing-Test And False-Confidence Analysis

Green tests do not prove the Stage 5 product contracts:

- `countsTowardMainPlan` tests verify preset/manual plans do not directly record adherence
  completions, but do not test whether their generated summaries affect later rotation.
- `sessionPlayer.test.ts` proves all-skipped sessions can finish, but no App/service test prevents
  those results from receiving main-plan credit.
- `workoutGeneration.test.ts` proves transparent skipped slot metadata, but no completion test uses
  that metadata to decide credit.
- `sessionPlanning.test.ts` verifies fallback exists for unsupported IDs, but not whether fallback
  is safe enough for production.
- Backend sync tests verify compact snapshots, but not exact preservation of Stage 4B stimulus
  semantics.

## 10. Validation Results

Diagnostic probe:

- Command: `npx --no-install tsx -e '<direct getTemplateSelection probe>'`
- Exit: 0
- Result: three non-training recent-session shapes with the active block id made
  `getTemplateSelection` return `status: "week_complete"` and `completedThisWeek: 3`.
- Temporary files: none created.

Targeted validation command:

```bash
npm test -- --runInBand src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/freshUser.integration.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/training/__tests__/block.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/autoregulationFlow.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/__tests__/store.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/sessionSyncService.test.ts src/services/backend/__tests__/blockSyncService.test.ts src/exercises/__tests__/catalog.test.ts src/scoring/__tests__/focusSelection.test.ts
```

Result:

- Exit: 0
- Targeted suites: 15 passed, 15 total
- Targeted tests: 126 passed, 126 total
- Snapshots: 0
- Skipped tests: 0 reported
- Warnings/logs: Watchman recrawl warning, expected session-planning fallback warnings, backend sync
  console logs, Jest open-handle notice.

Full suite:

```bash
npm test -- --runInBand
```

Result:

- Exit: 0
- Full suites: 84 passed, 84 total
- Full tests: 613 passed, 613 total
- Snapshots: 0
- Skipped tests: 0 reported
- Warnings/logs: Watchman recrawl warning, expected backend sync/session-planning console logs and
  warnings, Jest open-handle notice.

Typecheck:

```bash
npm run typecheck
```

Result: exit 0.

Expo config:

```bash
npx --no-install expo config --type public
```

Result: exit 0. Existing warning:

```text
[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
```

Expo config resolved `name: Pearl`, `slug: pearl`, `scheme: pearl`, SDK `56.0.0`, iOS
`com.suvangoel.pearl`, Android `com.suvangoel.pearl`, and 6 plugins.

Diff check:

```bash
git diff --check
```

Result: exit 0, no output.

Validation commands did not intentionally change repository files.

## 11. Required Remediation Before Beta

Recommended remediation order:

1. Define a single `countsAsMainPlanTraining` contract used by adherence, generated summaries,
   template selection, progression, backend sync, and reports.
2. Filter `recentSessionsFor` and `getTemplateSelection` to count only completed main-plan
   block-generated A/B/C sessions for the active block.
3. Record preset/manual/retest-prep summaries separately or mark them `status: skipped`/non-counting
   for rotation.
4. Add a completion-credit gate requiring at least one completed item and, for main-plan sessions,
   at least one primary stimulus for the block focus unless product explicitly grants partial credit.
5. Treat absent exercise results as unknown/zero, not completed, for ladder progression.
6. Pass the explicit planning date through `adaptGeneratedSessionToPearlSessionPlan` and
   `plannedDateKey`.
7. Replace legacy fallback with either fail-closed recovery UI or a constrained fallback that applies
   the same equipment, pain, readiness, release, and slot-stimulus semantics.
8. Choose one canonical equipment availability model and migrate/derive legacy booleans from it.
9. Either remove legacy progression from dynamic completion or make its relationship to
   `ladderProgressById` explicit and tested.
10. Preserve Stage 4B stimulus metadata in backend training-state sync/restore.

Minimum new tests:

- Micro-check, preset, manual practice, and retest-prep rows do not affect A/B/C rotation.
- Three non-training events cannot make a week complete.
- All-skipped main-plan result does not increment training/adherence block progress.
- Missing generated exercise item maps to incomplete/unknown and does not progress ladder.
- No-primary-focus generated session is either blocked from main credit or explicitly partial.
- `plannedDateKey` uses injected `today`.
- Legacy fallback cannot bypass pain/equipment/safety constraints, or it fails closed.
- Backend training-state sync preserves `intendedDomain`, `stimulusRole`, and `stimulusReason`.

## 12. Final Repository State

Final status:

```text
 M src/adherence/types.ts
 M src/exercises/__tests__/catalog.test.ts
 M src/exercises/balanceRung.ts
 M src/exercises/heelRaise.ts
 M src/exercises/ladders.ts
 M src/exercises/loadedMarch.ts
 M src/exercises/mobilityDrills.ts
 M src/exercises/pullUpperBack.ts
 M src/exercises/pushUp.ts
 M src/exercises/stepUp.ts
 M src/exercises/supportedSquat.ts
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/movements/types.ts
 M src/profile/serialize.ts
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/debugWorkoutScenarios.ts
 M src/training/dynamicState.ts
 M src/training/index.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? assets/pearl-logo-icon-groove-connected.png
?? assets/pearl-logo-icon-groove.png
?? assets/pearl-logo-icon.png
?? assets/images/explore-library-balance.png
?? assets/images/explore-library-heel-toe-raise.png
?? assets/images/explore-library-hero.png
?? assets/images/explore-library-hinge-glutes.png
?? assets/images/explore-library-lateral-stability.png
?? assets/images/explore-library-mobility-flexibility.png
?? assets/images/explore-library-pull-upper-back.png
?? assets/images/explore-library-push.png
?? assets/images/explore-library-shoulder-reach-press.png
?? assets/images/explore-library-sit-to-stand.png
?? assets/images/explore-library-squat.png
?? assets/images/explore-library-step-up.png
?? assets/images/pearl-home-hero-botanical.png
?? assets/images/progress-hero-botanical.png
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
?? docs/audits/Pearl_Stage_4A_Catalogue_Safety_Gating_Prompt.md
?? docs/audits/Pearl_Stage_4B_Stimulus_Domain_Progression_Prompt.md
?? docs/audits/Pearl_Stage_5_Dynamic_Workout_Generation_Audit_Prompt.md
?? src/pearlFlow/extraSessionCopy.ts
?? src/screens/exploreImages.ts
?? src/training/equipmentSafety.ts
?? tmp/logo/component-mask-colored.png
?? tmp/logo/pearl-flat-traced-candidate.png
?? tmp/logo/pearl-flat-traced-smooth-hires.png
?? tmp/logo/pearl-flat-traced-smoothed.png
?? tmp/logo/mask-threshold-sheet.png
?? tmp/logo/reference-shoulder-crop.png
```

Final tracked diff names:

```text
src/adherence/types.ts
src/exercises/__tests__/catalog.test.ts
src/exercises/balanceRung.ts
src/exercises/heelRaise.ts
src/exercises/ladders.ts
src/exercises/loadedMarch.ts
src/exercises/mobilityDrills.ts
src/exercises/pullUpperBack.ts
src/exercises/pushUp.ts
src/exercises/stepUp.ts
src/exercises/supportedSquat.ts
src/pearlFlow/__tests__/exploreViewModel.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/exploreViewModel.ts
src/pearlFlow/sessionPlanning.ts
src/pearlFlow/types.ts
src/movements/types.ts
src/profile/serialize.ts
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/training/__tests__/workoutGeneration.test.ts
src/training/debugWorkoutScenarios.ts
src/training/dynamicState.ts
src/training/index.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

Final tracked diff stat:

```text
 src/adherence/types.ts                           |   2 +
 src/exercises/__tests__/catalog.test.ts          |  86 ++++
 src/exercises/balanceRung.ts                     |   8 +-
 src/exercises/heelRaise.ts                       |   4 +-
 src/exercises/ladders.ts                         |  59 ++-
 src/exercises/loadedMarch.ts                     |  10 +-
 src/exercises/mobilityDrills.ts                  |   2 +-
 src/exercises/pullUpperBack.ts                   |   2 +-
 src/exercises/pushUp.ts                          |   2 +-
 src/exercises/stepUp.ts                          |  10 +-
 src/exercises/supportedSquat.ts                  |   4 +-
 src/pearlFlow/__tests__/exploreViewModel.test.ts  | 106 +++++
 src/pearlFlow/__tests__/sessionPlanning.test.ts   | 176 ++++++-
 src/pearlFlow/exploreViewModel.ts                 | 118 +++--
 src/pearlFlow/sessionPlanning.ts                  |  76 ++-
 src/pearlFlow/types.ts                            |  28 +-
 src/movements/types.ts                           |   7 +-
 src/profile/serialize.ts                         |   2 +
 src/screens/ExploreDetailScreens.tsx             | 489 +++++++++++++++----
 src/screens/ExploreScreen.tsx                    | 459 +++++++++++++-----
 src/screens/OnboardingEquipmentScreen.tsx        |   6 +
 src/screens/PlanScreen.tsx                       |  12 +-
 src/screens/ProgressScreen.tsx                   | 582 +++++++++++++++--------
 src/screens/SettingsScreen.tsx                   |  10 +
 src/screens/TodayScreen.tsx                      |   2 +-
 src/training/__tests__/workoutGeneration.test.ts | 252 +++++++++-
 src/training/debugWorkoutScenarios.ts            |   2 +-
 src/training/dynamicState.ts                     |   5 +
 src/training/index.ts                            |   3 +
 src/training/serialize.ts                        |  28 ++
 src/training/workoutGeneration.ts                | 306 ++++++++++--
 31 files changed, 2311 insertions(+), 547 deletions(-)
```

Final diff check:

```bash
git diff --check
```

Result: exit 0, no output.
