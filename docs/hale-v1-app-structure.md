# Hale V1 App Structure Audit

Date: 2026-06-16

Purpose: Stage 0 audit before restructuring the app around Today, Plan, Progress, Explore, and a profile/settings entry point. This is a read-first implementation map, not a product-code change.

## 1. Current Navigation And Routing

- Navigation is hand-rolled in `App.tsx`, not Expo Router or React Navigation.
- `App.tsx` owns two pieces of navigation state:
  - `tab: TabKey` for the bottom chrome tabs.
  - `flow: Flow | null` for full-screen flows that hide the tab bar.
- The current `Flow` union includes onboarding, camera/session flows, adherence/report flows, and dev camera screens:
  - `welcome`, `life-goal`, `safety-profile`, `camera-setup`, `manual-checkup`, `checkup`, `results`, `training`, `microcheck`, `block-intro`, `restart-intro`, `weekly-summary`, `block-report`, `session-complete`, `dev-assessment`, `dev-live`.
- The current bottom tabs are defined in `src/navigation/TabBar.tsx`:
  - `home`, `learn`, `family`, `settings`
  - Rendered labels: Home, Discover, Support, Profile.
- The tab-to-screen switch is in `App.tsx`.
- Route strings used by `src/haleFlow/nextBestAction.ts` are interpreted by `handleRoute` in `App.tsx`.

Recommended V1 tab insertion point:

- Replace `TabKey` and `TABS` in `src/navigation/TabBar.tsx` with:
  - `today`, `plan`, `progress`, `explore`
- Update the `App.tsx` tab switch to render the new screens.
- Move `SettingsScreen` out of the bottom tab and open it from a top-right profile/settings icon, likely as a full-screen `flow` first. This keeps the current custom navigation model and avoids a new native dependency.

## 2. Current Onboarding Or First-Run Flow

Onboarding exists, but it is implicit rather than represented by one persisted onboarding state machine.

Current first-run trigger:

- `App.tsx` opens `flow='welcome'` after stores load when:
  - `history.length === 0`
  - `!prefs.profile.lifeGoal`
  - `autoWelcomeShown` has not been set for the current app launch.

Current flow:

- `WelcomeScreen` -> `LifeGoalOnboardingScreen` -> `SafetyProfileScreen` -> `CameraSetupScreen` -> `CheckUpScreen` -> `ResultsScreen` -> `BlockIntroScreen`.
- The target V1 flow wants:
  - Welcome -> Life Goal -> Safety/Profile -> Equipment -> Camera Explanation -> Camera Setup Tutorial -> Baseline Movement Check-Up -> Results -> Create 4-Week Block -> Start First Session.

Current state storage:

- `ProfileStore` persists `preferences.json` with schema version 3.
- `prefs.profile.lifeGoal` is the durable onboarding marker for life goal.
- `prefs.profile.safetyProfile` is the durable safety/profile marker.
- Equipment is split:
  - Safety intake stores `availableEquipment` in `MovementSafetyProfile`.
  - Legacy training equipment lives in `training-state.json` as `EquipmentProfile`.
- There is no persisted `onboardingComplete` flag.

Reusable pieces:

- `WelcomeScreen` already frames Hale as a private Movement Check-Up and 4-week block.
- `LifeGoalOnboardingScreen` and `LifeGoalSelector` are reusable.
- `SafetyProfileScreen` already captures age, activity, comfort/safety, equipment, and preferred days. For the target flow, split or visually separate the equipment step instead of discarding it.
- `CameraSetupScreen` can become the camera explanation/setup tutorial step, but it currently combines permission, setup instructions, and privacy copy.

## 3. Current Assessment / Check-Up Flow

Main assessment screens:

- `src/screens/CheckUpScreen.tsx`: production Movement Check-Up battery.
- `src/screens/ResultsScreen.tsx`: movement age results, focus domain, trends, and create-block CTA.
- `src/screens/ManualCheckupStartScreen.tsx`: lets returning users choose official retest, quick recheck, manual extra, or micro-check.
- `src/screens/AssessmentScreen.tsx`: dev-only single chair-stand assessment.
- `src/screens/LiveSessionScreen.tsx`: dev-only live skeleton/preflight view.

Assessment engine:

- `src/checkup/checkup.ts` contains `CheckUpOrchestrator`.
- `DEFAULT_BATTERY` currently includes:
  - `chair-stand-30s`
  - `balance-ladder`
  - `shoulder-flexion-peak`
  - `hinge-reach`
- `BETA_BATTERY_WITH_TUG` also includes `timed-up-and-go`, but TUG is intentionally hidden from normal flow.
- Movement definitions live in `src/movements/*.ts` and self-register via `src/movements/index.ts`.

Assessment results storage:

- Raw check-ups are saved by `HistoryStore` as `checkup-<timestamp>.json`, schema version 1.
- `handleCheckUpComplete` in `App.tsx` also creates a `MovementAssessment` via `createMovementAssessment` and persists it in `adherence-state.json`.
- `scoreCheckUp` in `src/scoring/scoring.ts` derives movement-age domain results from raw check-up data.

How to connect the V1 Movement Check-Up:

- Keep `CheckUpScreen`, `CheckUpOrchestrator`, `HistoryStore`, and `ResultsScreen` as the core Movement Check-Up implementation.
- Treat TUG as a feature-flagged or beta item until the room-fit/non-standard variant UX is ready. Do not add it to the default battery without replay and device verification.
- Continue saving both raw `CheckUp` history and `MovementAssessment` records. The raw check-up is the measurement source of truth; adherence assessments are product-flow state.

## 4. Current Session / Workout Flow

Session player:

- `src/training/sessionPlayer.ts` contains `TrainingSessionPlayer`.
- `src/screens/TrainingSessionScreen.tsx` runs a voice-guided camera session from an ordered list of `exerciseIds`.
- It uses the same product-law pattern as check-up:
  - no camera video
  - skeleton rendering only
  - audio-first
  - throttled React HUD
  - per-frame pose pipeline outside React rendering

Current session planning integration:

- `handleStartPlan` in `App.tsx` creates two block records:
  - Legacy `src/training/block.ts` block via `buildBlock(...)`, persisted in `training-state.json`.
  - Newer `MovementBlock` via `createMovementBlockFromAssessment(...)`, persisted in `adherence-state.json`.
- `handleStartSession` uses legacy `nextSessionExercises(training)` from `src/training/state.ts`.
- `nextSessionPlan(training)` feeds the current Home plan card.
- On completion, `recordCompletedSession(training, result, completedAt)` updates legacy progression and completion count. `recordTrainingSessionCompletion(...)` also writes the newer adherence completion.

Dynamic generator status:

- `src/training/workoutGeneration.ts` is present and tested.
- `src/haleFlow/sessionPlanning.ts` adapts the dynamic generator into `HaleSessionPlan`.
- `src/haleFlow/sessionPlanning.ts` is not currently called by `App.tsx` or the live UI.
- The current UI therefore still runs the older block/session resolver, even though the dynamic generator exists.

Recommended connection:

- Generate "Today's Hale Session" from `src/haleFlow/sessionPlanning.ts` using the active `MovementBlock`, safety profile, life goal, adherence state, readiness, and recent completions.
- Feed `sessionPlan.exercises.map((e) => e.id)` to `TrainingSessionScreen` initially, since the session player already accepts exercise IDs.
- Preserve a fallback to the legacy `TrainingState` path for existing users with a saved legacy block but no active `MovementBlock`.
- Persist enough dynamic session metadata to update ladder progression and avoid regenerating a different session after completion. The existing `plannedDate` field may be usable as a template/session key, but this should be made explicit before Stage 2.

## 5. Current Progress / User State

State system:

- No Redux, Zustand, Supabase, backend, or account system.
- App state is local-only and file-backed through `expo-file-system`.
- All stores use the same `HistoryFs` adapter in `src/history/fsAdapter.ts`, currently backed by a `checkups` document directory. Non-check-up JSON files are skipped by check-up deserialization.

Stores:

- `HistoryStore`: raw check-up history, `checkup-*.json`, schema version 1.
- `TrainingStore`: legacy training state in `training-state.json` and append-only `microcheck-*.json`, schema version 1.
- `ProfileStore`: profile/settings in `preferences.json`, schema version 3.
- `AdherenceStore`: movement blocks, assessments, completions, reports, milestones, support connections, notification events, weekly summaries in `adherence-state.json`, schema version 2.

What to reuse:

- Reuse the existing local stores and schema-versioned serializers.
- Reuse raw `CheckUp` history as the measurement source of truth.
- Reuse `AdherenceStore` as the plan-led product state for 4-week blocks, next-best action, completions, reports, and support.
- Keep `TrainingStore` for exercise progression/equipment and for backwards compatibility with existing completed sessions and saved legacy blocks.

## 6. Current Design System / Components

Design tokens:

- `src/theme/index.ts` is the single source of truth.
- Palette: warm ivory base, cream surfaces, deep forest-green accent, sage support tones, champagne-gold accents.
- Typography: Fraunces headings and Inter body, loaded in `App.tsx`.
- Shared spacing, radius, shadows, tap target, and skeleton colors live in the theme.

Reusable UI:

- `src/components/ui.tsx` provides:
  - `Screen`, `ScreenHeader`
  - `Card`, `MaterialCard`
  - `PrimaryButton`, `SecondaryButton`, `GhostButton`
  - `Pill`, `StatusBadge`
  - `MetricCard`, `MetricRing`, `DailyPlanItem`, `HealthMetricRow`
  - `EmptyState`, `ToggleRow`
- `src/adherence/components/CurrentBlockCard.tsx` already expresses the active 4-week block well.
- `src/navigation/icons.tsx` provides custom SVG tab icons.

Recommended extension:

- Add small navigation primitives rather than new visual systems:
  - top app bar / profile icon button
  - compact section rows for Plan and Progress
  - optional icon button primitive if Settings moves to the header
- Reuse `Screen`, `MaterialCard`, `CurrentBlockCard`, `MetricRing`, `HealthMetricRow`, and `DailyPlanItem` for the new tabs.

## 7. Risks

Highest-risk flows:

- Camera flows: `CheckUpScreen`, `TrainingSessionScreen`, and `MicroCheckScreen` all depend on the same permission/audio/pipeline/renderer assumptions. Restructure should not remount or wrap them in ways that alter camera/audio setup.
- App-level route strings: `NextBestAction.primaryRoute` depends on `handleRoute` in `App.tsx`. Renaming tabs/routes can silently break CTAs.
- Dual block models: `training-state.json` legacy block and `adherence-state.json` `MovementBlock` can drift. Stage 2 should choose one UI source of truth while keeping legacy data readable.
- Dynamic session generation: regenerating a session at completion time could mismatch the exercises the user actually did unless the generated plan id/template id/exercise ids are retained.
- TUG: implemented but intentionally hidden because home-space walking is fragile. It should be feature-flagged until the short-path UX and replay coverage are ready.
- Onboarding: returning users are identified by existing life goal/safety/check-up state. Adding a persisted onboarding flag could strand current users if not migrated carefully.

Backward compatibility needs:

- Preserve exercise IDs and movement IDs.
- Preserve `checkup-*.json`, `training-state.json`, `microcheck-*.json`, `preferences.json`, and `adherence-state.json` compatibility.
- Do not delete the legacy training block/session path until a migration/fallback is in place.
- Keep existing completed `TrainingSessionCompletion` records valid.
- Keep all old route strings accepted by `handleRoute` during the transition.

Feature flags / dev gates:

- TUG in the default Movement Check-Up.
- Any richer Explore extra-session/preset browsing, since Today should remain the primary "press Start" experience.
- Any real reminders/notifications. Current reminder toggle is preference-only.
- Any Family functionality beyond local prototype data.

## 8. Proposed Implementation Plan

### Stage 1: Information Architecture And First-Run Shape

Goal: restructure the app shell and screens around the target IA without changing the camera/session engines.

Likely files:

- `App.tsx`
  - Change default tab to `today`.
  - Replace the tab switch with Today, Plan, Progress, Explore.
  - Add `settings` as a full-screen flow or header action instead of a bottom tab.
  - Keep existing full-screen camera/session flows unchanged.
  - Keep legacy route strings working.
- `src/navigation/TabBar.tsx`
  - Replace `TabKey` with `today | plan | progress | explore`.
  - Update labels to Today, Plan, Progress, Explore.
- `src/navigation/icons.tsx`
  - Add or repurpose icons for the four new tabs and profile/settings action.
- `src/screens/HomeScreen.tsx`
  - Either rename/refactor into `TodayScreen.tsx`, or leave an alias and create a new Today wrapper.
  - Lead with "Today's Hale Session" / next best action.
  - Use "session" and "Movement Check-Up" copy instead of "workout" as primary language.
- `src/screens/PlanScreen.tsx` (new)
  - Show current 4-week block, weekly target, micro-check status, retest timing, and current focus.
  - Reuse `CurrentBlockCard`.
  - Avoid making exercise browsing the primary action.
- `src/screens/ProgressScreen.tsx` (new)
  - Show latest movement-age profile, domain cards, trends, and reports.
  - Reuse result/trend components where possible, extracting from `ResultsScreen` only if useful.
- `src/screens/ExploreScreen.tsx` (new or `LearnScreen` rename)
  - Carry bundled articles from `LearnScreen`.
  - Optionally include gentle extras/presets later, but keep Today primary.
- `src/screens/SettingsScreen.tsx`
  - Keep as-is initially, opened from profile/settings icon.
- `src/screens/WelcomeScreen.tsx`, `src/adherence/screens/LifeGoalOnboardingScreen.tsx`, `src/screens/SafetyProfileScreen.tsx`, `src/screens/CameraSetupScreen.tsx`
  - Adjust copy and sequencing to match target onboarding.
  - Consider splitting equipment and camera tutorial into separate screens only if the edit stays small and low-risk.
- `src/components/ui.tsx`
  - Add a small `IconButton` / `TopBar` primitive if needed.
- `src/haleFlow/copy.ts`, `src/adherence/adherenceCopy.ts`
  - Align CTAs and labels with Today, Plan, Progress, Explore.

Checks:

- `npm run typecheck`
- `npm test -- --runInBand`
- `npx expo config --type public`

### Stage 2: Dynamic Today's Hale Session Integration

Goal: make the plan-led session path use the existing dynamic generator while preserving existing data.

Likely files:

- `App.tsx`
  - Add a `todaySessionPlan` derived from `generateTodaySession` in `src/haleFlow/sessionPlanning.ts`.
  - Use active `MovementBlock`, safety profile, life goal, adherence state, recent completions, and readiness.
  - Update `handleStartSession` to launch the generated plan's exercise IDs.
  - Keep fallback to `nextSessionExercises(training)` for legacy users.
  - Record the generated plan/template key in the completion path.
- `src/haleFlow/sessionPlanning.ts`
  - Confirm generated `HaleSessionPlan` carries all metadata needed for display and completion.
  - Make planned template/session identity explicit if `plannedDate` remains the storage field.
- `src/training/workoutGeneration.ts`
  - Prefer no behavioral changes unless gaps appear in generation metadata or fallback behavior.
- `src/training/serialize.ts`, `src/training/store.ts`
  - If dynamic ladder progress must persist separately, add a schema-versioned migration instead of replacing the current state shape.
- `src/screens/TrainingSessionScreen.tsx`
  - Optionally accept `sessionTitle` / `sessionPlan` display metadata while still passing exercise IDs to `TrainingSessionPlayer`.
- `src/training/sessionPlayer.ts`
  - Avoid changes unless dynamic-generated exercises expose a player incompatibility.
- `src/adherence/types.ts`, `src/adherence/serialize.ts`
  - Avoid schema changes unless completions need an explicit session/template id. If changed, keep schema v1/v2 records readable.
- Tests:
  - Add/extend `src/haleFlow/__tests__/haleFlow.test.ts` for UI-facing session planning.
  - Add an integration test for active MovementBlock -> generated Today session -> TrainingSessionScreen IDs -> completion.
  - Keep existing training store/session tests green for legacy blocks.

Architectural decision needed before coding Stage 2:

- Decide whether dynamic ladder progression is stored in existing `TrainingState.progression`, a new `ladderProgress` field, or derived from existing completion history. A new persisted field is likely cleanest, but it requires a schema migration and fallback.

## 9. Concerns Before Implementation

- The current branch has many existing modified and untracked files. Treat the worktree as user-owned and keep future diffs narrow.
- The product already has a strong custom navigation shell. Adding React Navigation or Expo Router for this restructure would be unnecessary churn.
- The dynamic generator is available but not live-wired. The most important Stage 2 task is making "Today" use it without breaking older saved blocks.
- The target first-time flow has more named steps than the current implementation. Reusing and lightly splitting existing screens is safer than rebuilding onboarding wholesale.
- TUG should remain beta-gated until a product and measurement decision is made for short-path rooms.
