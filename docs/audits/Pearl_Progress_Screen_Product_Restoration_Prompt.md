You are implementing a narrow Progress page product/UI restoration pass for Pearl:

PEARL PROGRESS SCREEN PRODUCT RESTORATION
V2-CANONICAL LOGIC PRESERVED,
OLD POLISHED PROGRESS CARDS RESTORED WHERE PRODUCT-USEFUL,
TECHNICAL MOVEMENT PROFILE LABELS REMOVED,
HISTORY VISIBILITY REBALANCED,
AND H5/HF REGRESSION PROTECTED

This is a targeted UI/product presentation pass.

Do not redesign the whole app.
Do not change Movement Profile V2 measurement logic.
Do not change H5A Progress data authority.
Do not change H5B/HF2 micro-check policy.
Do not change H5C public V1 route retirement.
Do not change H5D release flags.
Do not change HF1/HF2/HF3 hands-free behavior.
Do not change training credit, schedule credit, progression, reports, official artifacts, Warden, audio, or public V1 rollback policy.

## Problem

After the V2 Movement Profile migration, the Progress page is functionally correct but feels too much like a saved-artifact viewer.

Current issues observed by founder:

1. The current Progress page after a completed Movement Profile shows:
   - a large Movement Profile hero;
   - a Latest Movement Profile card;
   - a Movement Profile history card even when there is only one profile.

2. A separate card explaining which Check-Up the plan was formulated from was removed by the founder because it felt redundant with the Plan page. Do not bring that separate source card back.

3. The old Progress page had useful user-facing cards that are no longer appearing:
   - “Your next check-up”
   - “Last 4-week plan” / current plan summary
   - “What you are practicing now”
   - “Extra check-up”

4. The latest Movement Profile metric rows currently show technical/truncated labels such as:
   - “Published compar...”
   - “Published age-gro...”
   - “Typical range saved”

These are not appropriate for a 50+ consumer audience. They are internal/reference-engine labels and are too technical.

## Product goal

Keep the V2 correctness from H5A, but make the Progress page feel like a user-facing progress dashboard again.

The page should answer:

```text
Where am I now?
What am I working on?
When do I check again?
What can I do next?
What has Pearl saved over time?
```

It should not feel like:

```text
Here are internal frozen artifacts and reference labels.
```

## Current authority to preserve

Read and preserve these reports before editing:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/PEARL_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/PEARL_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
docs/audits/PEARL_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
```

Key carried-forward truths:

```text
Progress is V2-canonical when V2 state exists.
V1 Progress is rollback-only.
No mixed V1/V2 public history.
Official Movement Profile history includes only baseline, baseline_retake, official_retest.
Micro-checks and optional check-ups are excluded from official Movement Profile history.
Progress read-only routes must not create snapshots, assessments, reports, blocks, sessions, or sync creation side effects.
Public V1 Movement Age flow is retired from normal builds.
Normal public Check-Up is unified V2.
H5B micro-check policy is preserved.
HF1/HF2/HF3 hands-free behavior is preserved.
Warden remains deferred.
Chair remains raw-only.
Physical-device validation is not claimed.
Public release remains blocked.
```

## Scope

You may change:

- `src/screens/ProgressScreen.tsx`
- Progress view-model/adapters/selectors only if needed for presentation data
- Progress-specific tests
- Copy guardrail tests
- A new audit report

You may add small pure presentation helpers if they reduce clutter.

You may reuse old Progress UI/components from Git history/current diffs, but do not restore V1 scoring authority.

Do not change:

- `movementProfileV2` reference engine/focus/snapshot/assessment logic
- official Check-Up source eligibility
- block/report creation
- micro-check target policy/slot identity
- training scheduler/credit/progression
- HF1/HF2/HF3 hands-free coordinators
- audio files/manifests/cues
- release flags
- routing/App state except Progress navigation callback names if strictly needed
- website
- dependencies/lockfiles

## Worktree safety

Before analysis or edits, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all current tracked/untracked changes as user-owned.
2. Inspect current `ProgressScreen.tsx` diff before touching it.
3. Preserve the founder’s restored Progress empty state.
4. Preserve the restored Manual / Extra Check-Up screen.
5. Preserve HF1/HF2/HF3 changes.
6. Do not revert unrelated changes.
7. Do not edit prior audit reports or `docs/decisions.md`.
8. Do not install packages.
9. Do not modify lockfiles.
10. Do not regenerate audio.
11. Do not stage, commit, branch, push, or open a PR.
12. Do not inspect or expose `.env` values or provider credentials.
13. Do not modify fonts/assets.

## Baseline validation

Before edits, run:

```bash
npm run typecheck
npm run verify:audio
```

Run a focused baseline slice for:

- ProgressScreen / Progress view model
- H5A Progress/history
- H5B/H5B.1 micro-check containment
- H5C public V1 route retirement
- H5D release flags
- HF1/HF2/HF3 hands-free regressions
- Stage 5 scheduler/training summary if Progress consumes those fields

Then run:

```bash
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/pearl-progress-restoration-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-progress-restoration-baseline-export
rc=$?
rm -rf /tmp/pearl-progress-restoration-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART A — Reconstruct current Progress page

## Step 1: Inventory current Progress UI

Create a table:

```text
Surface
Current component/function
Current data authority
Current visual source
Keep / remove / restore / rewrite
Reason
```

Include at least:

- page header
- hero card
- Latest Movement Profile card
- metric rows
- current plan / source card
- next check-up card
- Movement Profile history card
- block-report history card
- micro-check section
- Extra check-up action
- What you are practicing now
- pending/recovery state
- empty state
- read-only detail routes
- tab/safe-area layout

## Step 2: Find old Progress cards

Search Git history/current code for the previous Progress card designs:

```text
Your next check-up
Check-up history
Last 4-week plan
Extra check-up
What you are practicing now
```

Use old visual styling/layout where available, but update the data authorities and copy to V2-safe wording.

Do not restore V1 Movement Age, V1 history, weakest-domain, improvement/decline, or V1 result logic.

# PART B — Target Progress page structure

For a user who has completed one Movement Profile and has an active plan, target order:

```text
1. Header
2. Hero card
3. Latest Movement Profile card
4. Your next check-up card
5. Current 4-week plan card
6. What you are practicing now card
7. Extra check-up card/row
8. Movement Profile history only if 2+ official profiles
9. Block report history only if at least 1 report
10. Separate micro-check section only if there is meaningful micro-check state to show
```

Use judgement for spacing and visual hierarchy. Preserve the existing premium visual style.

## Do not bring back the removed plan-source card

Do not add a separate card whose main purpose is:

```text
This plan was formulated from X Movement Profile.
```

The founder removed that because it felt redundant.

Plan/source truth may still appear as a small note only when needed, especially for source mismatch:

```text
Your current plan is based on your previous Movement Profile. Your latest Movement Profile is saved.
```

But do not restore a whole plan-source card.

# PART C — Latest Movement Profile card copy

## Step 3: Remove technical metric labels

The Latest Movement Profile card must not show:

```text
Published compar...
Published comparison
Published age-gro...
Published age-group
Typical range saved
Reference eligible
Raw-only
IQR
Benchmark
Schema
Fingerprint
V2
Protocol
```

Those may exist in internal artifacts/tests, but not on the public Progress summary card.

## Step 4: Use simple labels or no right-side labels

Preferred metric presentation:

```text
Strength / Power
12 rises in 30 seconds
Saved result

Balance
38 seconds held
Strong hold / Building hold / Starting point

Mobility
142° right side
Within typical range / Saved result
```

Rules:

- If a simple user-facing band exists, show it.
- If the only available label is technical, show `Saved result` or omit the right-side label.
- Never truncate important labels into meaningless fragments.
- Prefer wrapping to ellipsizing.
- On compact phones, hide secondary label rather than show `Published compar...`.
- Chair remains raw-only; do not show a percentile or published comparison.
- Balance can show a Pearl task band in plain language.
- Shoulder/mobility can show `Within typical range`, `Below typical range`, `Above typical range`, or `Saved result` if that is too claimy/ineligible.
- Avoid “age group” language on the summary card.

## Step 5: Header/body copy

Current card header may remain:

```text
Latest Movement Profile
```

Replace technical body copy such as:

```text
Frozen from Jun 26, 2026. Pearl shows saved raw results and saved reference labels only.
```

with simpler copy, for example:

```text
Your latest saved check-up results.
```

or:

```text
Your latest Movement Check-Up results.
```

Do not mention “frozen”, “reference labels”, “schema”, or artifacts in public summary copy.

# PART D — Bring back Your next check-up

## Step 6: Restore card

Restore the old “Your next check-up” card visually, using current design tokens.

Data source must be Stage 5/H4 scheduler/retest state, not old V1 progress.

States:

### Next check-up not yet open

Example copy:

```text
Your next check-up
Opens in 6 days.
Pearl will guide your next Movement Check-Up when your 4-week plan is ready to review.
```

Better if schedule can compute exact timing.

### Check-up due now

```text
Your next check-up
Ready now.
Repeat your Movement Check-Up to save your latest Movement Profile.
```

CTA:

```text
Start Movement Check-Up
```

Routes to public V2 official retest when due.

### No active plan yet

Hide this card if there is no Movement Profile/plan context, unless the empty state already handles starting the first Check-Up.

### Training complete but waiting for date gate

Show the date-gated state.

### Block completed/report ready

If report already exists, do not show a conflicting “next check-up” message; show report/next plan state where current logic dictates.

Copy guardrails:

- No “improved”, “declined”, “changed”, “better”, “worse”.
- “Compare” is allowed only if current H4 comparison/report logic supports it and remains neutral. Prefer “review your latest saved results”.

# PART E — Bring back Current / Last 4-week plan card

## Step 7: Restore compact plan summary

Restore a V2-safe version of the old “Last 4-week plan” / “Current 4-week plan” card.

Preferred copy when active:

```text
Current 4-week plan
Strength / Power · 0 of 12 sessions completed.
```

If completed prior block and report exists:

```text
Last 4-week plan
Strength / Power · 12 of 12 sessions completed.
```

If Balanced:

```text
Current 4-week plan
Balanced · 0 of 12 sessions completed.
```

Action:

```text
View current plan
```

Navigation-only to Plan tab.

Do not start a session from this card.

Do not create/replace a block.

Do not show “changed in latest check-up.”

Do not show the redundant plan-source card.

## Step 8: Use authoritative schedule credit

The session count must come from Stage 5 schedule/main-plan credit, not raw completions.

Expected:

```text
X of 12 sessions completed
```

Only valid schedule-credited A/B/C sessions count.

Micro-checks, optional check-ups, Explore/manual/preset sessions, skipped/zero-work attempts, and supporting-only work must not increment this number.

# PART F — Bring back What you are practicing now

## Step 9: Restore card

Restore the old “What you are practicing now” card visually.

Purpose:

```text
Show simple current training/progression areas, not official Movement Profile interpretation.
```

Preferred copy:

```text
What you are practicing now
Pearl adjusts these movements based on your completed sessions.
```

Rows should use current training/progression state:

```text
Strength / Power
Sit-to-Stand
Ready

Balance
Feet-Together Hold
Building

Mobility
Mobility movements
Available
```

Use current exercise/ladder names where available.

Rules:

- This card is about training practice, not official Movement Profile history.
- Do not imply official improvement/decline.
- Do not show “changed”.
- Do not show Movement Age.
- Do not expose ladder IDs.
- Avoid truncating status labels. Use short statuses:
  - Ready
  - Building
  - Available
  - Holding
  - Paused
  - Not available
- If a status label does not fit, wrap or put it beneath the title instead of ellipsizing.

## Step 10: Data authority

Use existing training/progression view model/helpers where possible:

- current active V2 block
- generated session/progression state
- ladder progress by ID
- exercise catalogue display names
- release/optional containment state

Do not create a new progression authority.

Do not mutate ladder progress.

Do not make hidden optional levels visible.

Do not make manual/Explore practice count.

# PART G — Extra check-up card/row

## Step 11: Restore row/card

Restore the old Extra check-up affordance on Progress if product-appropriate.

Copy:

```text
Extra check-up
Start this if you want to check one area before your next scheduled check-up.
```

or, after optional full check-up restoration:

```text
Extra check-up
Try a quick check-in or a full optional check-up. This won’t change your plan.
```

Action:

```text
Extra check-up
```

Navigates to restored Manual / Extra Check-Up screen.

Containment:

- Optional full Check-Up remains non-official V2.
- Optional micro-check remains non-scheduled.
- No official history/progress/report/plan mutation.
- Do not use V1.

# PART H — Movement Profile history visibility

## Step 12: Hide full history card when it has only one official profile

Current issue: after one Check-Up, the bottom Movement Profile history card repeats what is already shown above.

New behavior:

```text
official profile count = 0
-> no history card

official profile count = 1
-> no full Movement Profile history card
-> optional small subtle "Saved in Movement Profile history" text is allowed, but not required

official profile count >= 2
-> show full Movement Profile history card
```

When shown, history card should use old/polished card style and copy:

```text
Check-up history
2 check-ups saved.
```

or:

```text
Movement Profile history
Saved official Check-Ups, newest first.
```

But keep copy simple.

Do not show internal source labels like `baseline`, `official_retest`, `movement_profile_v2`.

User-facing labels:

```text
First Movement Check-Up
Movement Check-Up retake
Follow-up Movement Check-Up
```

History row opens read-only saved Movement Profile detail.

## Step 13: Report history visibility

V2 block-report history should show only if at least one valid report exists.

If no report exists, do not show an empty report history card.

# PART I — Progress pending/recovery states

## Step 14: Preserve states

Do not break:

- no profile empty state
- raw Check-Up saved but reference details pending
- snapshot/assessment pending
- malformed V2 recovery
- plan/profile mismatch
- accepted V2 with release flag off
- rollback-only V1 state behind explicit flag

If any of these use the Progress card stack, ensure they retain polished design and no technical copy.

# PART J — Visual design requirements

## Step 15: Preserve current premium design

Do not introduce generic list UI.

Preserve:

- white stone/warm background
- serif headings
- dark text
- emerald/green accent
- botanical hero treatment where used
- existing header mark/settings icon
- card radii/borders/shadows
- divider style
- bottom tab/safe-area behavior
- compact phone behavior
- accessibility/touch targets

## Step 16: Avoid cramped/truncated labels

Add layout tests or snapshot assertions if available.

Metric rows and practice rows must not show meaningless ellipsis such as:

```text
Published compar...
Available ...
```

Prefer:

- hide secondary status on compact width
- wrap
- use shorter label
- place status beneath title
- use a badge with short text

# PART K — Copy guardrails

Public Progress copy must not include:

```text
Movement Age
body age
weakest
V1
V2
internal
schema
fingerprint
protocol
frozen
reference labels
published comparison
published age-group
IQR
Warden
percentile
improved
declined
better
worse
younger
older
changed in latest check-up
fall risk
diagnosis
pass/fail
```

Exception: prior audit docs/tests can contain these terms. Normal Progress UI must not.

# PART L — Tests

Add or update tests for:

## A. First completed Movement Profile

- renders hero
- renders Latest Movement Profile
- renders Your next check-up
- renders Current 4-week plan
- renders What you are practicing now
- renders Extra check-up
- does not render full Movement Profile history card when only one official profile exists
- does not render technical metric labels
- does not render Movement Age/weakest/V1/V2/internal copy

## B. Multiple official profiles

- renders Movement Profile history / Check-up history card
- newest first
- user-facing source labels
- read-only detail navigation
- no micro-check/optional check-up in official history

## C. Report history

- no report card when zero reports
- report card when at least one V2 report exists
- read-only report navigation

## D. Next check-up card

- opens in X days state
- due now state
- waiting/training-complete state
- no active plan hides or adapts
- uses V2 official retest route when due
- no V1 route

## E. Current 4-week plan card

- domain block
- Balanced block
- X of 12 schedule-credited sessions
- micro-check/optional/manual sessions excluded
- action navigates to Plan only

## F. What you are practicing now

- renders current training/practice rows
- no hidden optional levels exposed
- no technical IDs
- statuses not truncated in testable compact mode if possible

## G. Extra check-up

- navigates to Manual / Extra Check-Up
- optional full/micro containment remains tested elsewhere
- no V1 route

## H. Regression

- H5A Progress authority
- H5B/H5B.1 micro-check policy
- H5C route retirement
- H5D release flags
- HF1/HF2/HF3 hands-free regressions
- Stage 5 scheduler/training credit if touched
- audio verification

# PART M — Validation

After implementation, run focused tests for:

- ProgressScreen
- movementProfileV2ProgressViewModel
- progressDataAuthority
- progressViewModel if still used
- H5A Progress/history
- H5B/H5B.1 micro-check
- H5C public selector/routing
- H5D release flags
- HF1/HF2/HF3 regressions
- Stage 5 scheduler/credit if Progress uses session counts

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then:

```bash
rm -rf /tmp/pearl-progress-restoration-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-progress-restoration-export
rc=$?
rm -rf /tmp/pearl-progress-restoration-export
exit $rc
```

Record exact counts and warnings.

# PART N — Report

Create exactly one new report:

```text
docs/audits/PEARL_PROGRESS_SCREEN_PRODUCT_RESTORATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why this restoration was needed.
3. Current H5/HF constraints carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current Progress inventory.
7. Old Progress cards located/reused.
8. Final Progress information architecture.
9. Latest Movement Profile copy simplification.
10. Next check-up card.
11. Current/last 4-week plan card.
12. What you are practicing now card.
13. Extra check-up card.
14. Movement Profile history visibility rule.
15. Report history visibility rule.
16. Pending/recovery state preservation.
17. Visual design preservation.
18. Copy guardrails.
19. Data authority/containment.
20. Tests added/changed.
21. Files changed.
22. Focused validation.
23. Full validation.
24. Initial/final Git status.
25. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 routing rollback, training credit/progression change, scheduled micro-check policy change, HF regression, or physical-device validation claim occurred.

# Required final verdicts

At the end of the report state exactly one:

```text
PROGRESS SCREEN PRODUCT RESTORATION COMPLETE
PROGRESS SCREEN PRODUCT RESTORATION BLOCKED
```

Also state:

```text
V2 PROGRESS AUTHORITY PRESERVED
PROGRESS EMPTY STATE PRESERVED
LATEST MOVEMENT PROFILE COPY SIMPLIFIED
NEXT CHECK-UP CARD RESTORED
CURRENT 4-WEEK PLAN SUMMARY RESTORED
WHAT YOU ARE PRACTICING NOW RESTORED
EXTRA CHECK-UP ACTION RESTORED
MOVEMENT PROFILE HISTORY HIDDEN UNTIL MULTIPLE OFFICIAL PROFILES
TECHNICAL REFERENCE LABELS REMOVED FROM PROGRESS SUMMARY
NO H5 ROUTING ROLLBACK
NO V1 PUBLIC ROUTE REINTRODUCTION
NO OFFICIAL PROFILE CONTAINMENT CHANGE
NO TRAINING CREDIT / PROGRESSION CHANGE
NO SCHEDULED MICRO-CHECK POLICY CHANGE
NO AUDIO REGENERATION
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# Final Codex response

Return a concise summary with:

- report path
- whether production runtime code changed
- Progress surfaces changed
- cards restored
- history visibility behavior
- metric copy simplification
- data authorities used
- actions/routing
- tests added/changed
- focused validation
- full Jest
- audio verification
- typechecks
- Expo config/export
- git diff check
- H5A/H5B/H5C/H5D/HF1/HF2/HF3 regression result
- final verdict
- files changed
- confirmation no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 routing rollback, training credit/progression change, scheduled micro-check policy change, or physical-device validation claim occurred
