You are implementing Stage 5E of Pearl’s production-readiness work:

PAIN/DISCOMFORT SAFETY, READINESS AUTOREGULATION, MINIMUM SAFE STIMULUS, AND PROGRESSION-ELIGIBILITY POLICY

This is a focused production-code remediation task following the completed and verified Stage 5A–5D work.

Do not begin Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or broad workout-generation redesign in this task.

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
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5D_1.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 5E

Stage 5A is complete:

- only explicit active-block, block-generated, valid-template A/B/C events can count;
- non-training events do not affect rotation;
- all-skipped, zero-work, malformed, unmatched, and missing-result attempts receive no main-plan credit;
- explicit planning dates are authoritative;
- duplicate credit is deduped.

Stage 5B and Stage 5B.1 are complete and verified:

- main-plan credit requires completed primary work matching the concrete active MovementBlock focus;
- supporting-only, fallback-only, wrong-domain, missing-metadata, and legacy-fallback work is non-credit;
- short sessions do not receive automatic credit;
- persistence and restore cannot promote false credit.

Stage 5C is complete:

- current dynamic planning never silently falls back to legacy;
- generation failures return typed recovery states;
- legacy-only state cannot steer current A/B/C training;
- valid supporting current sessions remain distinct and non-credit.

Stage 5D and Stage 5D.1 are complete and verified:

- `ladderProgressById` plus `appliedProgressionEventIds` is the sole current progression state;
- only credited current main-plan sessions provide official progression evidence;
- primary and supporting generated exercises may affect only their own valid ladder;
- fallback/skipped/invalid/non-credit/non-main evidence cannot progress;
- one stable event per ladder per credited completion is applied idempotently;
- restore does not replay progression;
- current sessions no longer mutate legacy progression;
- full validation is green at 88 suites / 676 tests;
- the canonical tab order is Today → Plan → Progress → Explore.

Stage 4A/4B and Stage 3D protections remain authoritative.

Do not weaken or bypass any of these contracts.

## Why Stage 5E is required

The Stage 5 audit and Stage 4 audit identified unresolved pain/readiness trust risks:

- pain filtering is incomplete for adjacent movement patterns;
- hip/back discomfort may still leave step-up or hinge-heavy work;
- shoulder discomfort may still leave rows or other shoulder-loaded patterns;
- ankle/foot discomfort may still leave single-leg balance, marching, lateral work, step-up, or calf work;
- readiness scaling can reduce level/dose, but the product contract for minimum safe/useful stimulus is not centralized;
- low-readiness or short sessions may count toward the block but could still create overly favorable progression evidence;
- if pain/readiness removes all primary focus work, the session must remain supporting/non-credit rather than bypassing safety to preserve progression;
- planning-time daily regression must not silently mutate permanent ladder state;
- malformed or missing readiness/discomfort inputs need a conservative fail-closed policy;
- user-facing copy must distinguish:
  - a normal plan;
  - a safely scaled plan;
  - a supporting/non-credit plan;
  - a session that cannot be safely prepared.

Stage 5E must harden this policy without making medical claims or pretending Pearl can diagnose pain.

## Primary objective

Implement one authoritative daily training-constraint and autoregulation contract so that:

1. Readiness and discomfort inputs are normalized once.

2. Safety/equipment/discomfort exclusions take precedence over preserving session difficulty or credit.

3. Same-domain safe regressions are preferred where available.

4. Cross-domain or supporting work is never relabelled as primary.

5. If no safe playable primary focus exercise remains, the plan is supporting/non-credit under Stage 5B.

6. A safely regressed primary focus exercise may still earn main-plan credit when explicitly completed.

7. Readiness-, pain-, and short-session adjustments cannot create falsely favorable progression evidence.

8. Planning-time temporary regressions do not mutate permanent ladder state.

9. Post-session pain/effort feedback still flows through Stage 5D once, idempotently.

10. Missing/malformed safety inputs fail conservatively.

11. User-facing copy is calm, non-medical, and honest.

12. Valid fully-ready sessions remain unchanged.

13. Stage 5F is unblocked only if no P0/P1 pain/readiness/autoregulation gap remains.

## Scope boundary

This task may change:

- readiness/discomfort input normalization;
- daily training-constraint types;
- pain/discomfort movement-pattern filtering;
- autoregulation metadata;
- planned session adjustment metadata;
- same-domain regression selection boundaries;
- progression-evidence eligibility/hold metadata;
- session preview/completion copy for scaled/supporting sessions;
- local serialization and compact backend metadata for these narrow fields;
- tests;
- the Stage 5E remediation report.

This task must not change:

- exercise catalogue content except narrow safety metadata corrections proven necessary;
- Stage 4A equipment gates;
- Stage 4B stimulus roles;
- Stage 5A main-plan event/work rules;
- Stage 5B primary-focus credit rule;
- Stage 5C planning-result/legacy containment;
- Stage 5D numeric progression thresholds and event-id architecture;
- Stage 5F canonical equipment-source policy;
- Stage 5G block timing/lapse policy;
- scoring;
- norms;
- Check-Up logic;
- score snapshots;
- exact/near focus policy;
- broad UI design;
- backend schema unless existing JSON metadata can carry narrow fields;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Product and safety principles

### 1. Pearl is not diagnosing pain

Use the user’s daily self-reported discomfort/readiness only as a conservative session constraint.

Do not claim:

- diagnosis;
- treatment;
- injury identification;
- medical clearance;
- rehabilitation;
- fall-risk prediction.

Preferred user language:

- discomfort;
- not comfortable today;
- choose a gentler option;
- stop if discomfort increases;
- review setup;
- try again another day;
- seek professional advice if symptoms are severe, sudden, persistent, or concerning.

### 2. Safety precedence

Apply planning constraints in this order:

1. Authoritative active-block/source/template identity.
2. Exercise release/catalogue validity.
3. Equipment and environmental safety from Stage 4A.
4. User-reported discomfort constraints.
5. Readiness/autoregulation constraints.
6. Short-on-time compaction.
7. Focus-stimulus eligibility from Stage 5B.
8. Main-plan credit potential.
9. Progression-evidence policy.

No later layer may reintroduce an exercise excluded by an earlier safety layer.

### 3. Never increase difficulty to preserve credit

If safety, discomfort, readiness, or equipment removes primary work:

- do not select a harder exercise;
- do not select an unsupported exercise;
- do not bypass floor/stair/support constraints;
- do not relabel supporting/fallback work as primary;
- do not grant credit merely because the session contains other exercises.

### 4. Same-domain regression first

When a planned exercise is excluded:

1. Prefer a safe lower level in the same coherent ladder/domain.
2. Then prefer a safe same-domain primary alternative if the existing generator supports it.
3. Then supporting/fallback work may remain, clearly labelled.
4. If no safe primary focus exercise remains, return a supporting/non-credit session.
5. If no safe useful exercise remains, return Stage 5C `unavailable: no_safe_exercises`.

Do not add clinically speculative substitutions.

### 5. Main-plan credit and progression are separate

A pain/readiness-adjusted session may earn main-plan credit when:

- it remains a genuine current A/B/C plan;
- it contains a safe playable primary exercise matching the block focus;
- the user explicitly completes at least one such primary exercise;
- Stage 5A/5B identity/work/focus gates pass.

However, not every credited adjusted session should provide positive progression evidence.

Stage 5E must add an explicit progression-evidence policy.

## Locked Stage 5E contracts

### 1. One normalized daily training context

Create or harden one pure normalizer.

Conceptually:

```ts
type NormalizedDailyTrainingContext = {
  readiness: NormalizedReadiness;
  shortOnTime: boolean;
  discomfortAreas: DiscomfortArea[];
  discomfortReported: boolean;
  inputStatus:
    | 'valid'
    | 'defaulted_cautious'
    | 'malformed_fail_closed';
  source: 'user_daily_check' | 'restored' | 'legacy_unknown';
};
```

Adapt to actual types.

Requirements:

- stable enum values;
- deduped discomfort areas;
- no free-text used in planning logic;
- unknown readiness fails conservatively;
- malformed discomfort data does not become “no discomfort” silently;
- explicit user selection of “none” remains valid;
- normalization is pure and non-mutating;
- reason codes are stable;
- current valid inputs remain unchanged.

### 2. Conservative malformed-input behavior

Use these defaults unless the existing architecture already has a stricter safe equivalent:

- missing but intentionally optional readiness:
  - preserve the documented current default only if the product flow explicitly permits it;
  - otherwise default to cautious and record `defaulted_cautious`.

- unknown/out-of-range readiness:
  - normalize to cautious;
  - do not grant normal progression eligibility.

- malformed discomfort data:
  - fail closed for current block-generated planning;
  - return supporting/non-credit or unavailable recovery depending whether safe exercises can be established without it;
  - do not silently assume no discomfort.

- explicit “no discomfort”:
  - valid normal input.

Do not make a temporary restore-format omission permanently block historical viewing.

### 3. Explicit movement-pattern safety map

Create one centralized conservative beta mapping from discomfort area to movement-pattern exclusions/constraints.

Use actual repository movement-pattern identifiers.

At minimum re-verify and cover:

#### Knee discomfort

Conservatively constrain patterns such as:

- deep/loaded squat;
- split squat;
- step-up;
- power sit-to-stand;
- high-rep knee-dominant work.

A supported shallow sit-to-stand regression may remain only if the current catalogue metadata and existing product logic explicitly classify it as an allowed same-domain regression.

#### Hip/back discomfort

Conservatively constrain:

- hip hinge;
- loaded squat;
- split squat;
- step-up;
- glute bridge/floor posterior-chain work where currently implicated;
- deep forward reach if relevant.

Do not infer that floor bridge is therapeutic.

#### Shoulder discomfort

Conservatively constrain:

- push;
- pull/row;
- overhead reach;
- overhead press;
- band pull-apart;
- shoulder-loaded floor work.

This explicitly closes the Stage 4 concern that rows could remain under shoulder discomfort.

#### Ankle/foot discomfort

Conservatively constrain:

- heel/toe raise;
- step-up;
- single-leg balance;
- marching;
- lateral stepping/walking;
- unsupported dynamic balance.

Use support-gated gentle alternatives only when current metadata explicitly allows them.

#### Multiple discomfort areas

Apply the union of constraints.

Requirements:

- centralized;
- testable;
- pattern-based rather than copy/name parsing;
- no diagnosis language;
- no hidden exercise reintroduction later in selection;
- any exceptions must be explicit and tested.

If current product uses different discomfort categories, adapt the matrix while preserving the safety intent.

### 4. Readiness policy

Use existing readiness states and numeric adjustments where safe.

Do not change current numeric dose reductions merely to redesign the product.

Harden these invariants:

#### Fully ready / normal

- current level/dose behavior remains;
- positive progression evidence may remain eligible if Stage 5D rules pass.

#### Cautious / low-energy / reduced-readiness

- never increase level, sets, reps, hold time, load, instability, or power demand;
- optional loaded/power/unstable work may be removed or regressed according to current logic;
- preserve one safe primary focus exercise if possible;
- if a primary remains and is completed, main-plan credit may be earned;
- positive ladder advancement is `hold_only` for that session;
- the session must not permanently lower the stored ladder merely because the user felt cautious today.

#### Short on time

- retain Stage 5B primary-focus requirement;
- credited short sessions are `hold_only` for positive progression unless the current full progression dose was actually completed and the repository already has authoritative proof;
- default Stage 5E policy: short sessions do not advance ladder level;
- no primary focus means supporting/non-credit.

#### Very low readiness / not ready, if represented

- prefer a supporting/recovery plan;
- main-plan credit potential is false unless the current product has a clearly safe, explicit low-readiness primary protocol;
- no positive progression;
- no shame.

Do not add a new readiness option if the current UI does not have one; map actual states conservatively.

### 5. Minimum safe planned stimulus

After equipment, discomfort, readiness, and short-session adjustments:

A normal plan-advancing session must contain:

- at least one playable primary exercise matching the concrete block focus;
- at least one finite positive prescribed work unit:
  - set;
  - rep;
  - hold;
  - or timed dose according to actual exercise type;
- no safety-excluded exercise;
- consistent Stage 4B stimulus metadata.

Do not invent a percentage threshold.

Do not require every domain.

If no primary remains:

- return a valid supporting session when useful safe work remains;
- otherwise return Stage 5C unavailable/no-safe-exercises.

### 6. Temporary daily regression does not mutate persistent ladder state

Planning-time autoregulation:

- may select a lower level for today;
- must preserve the authoritative stored ladder level;
- must record requested/current level and selected daily level separately;
- must record why the level changed;
- must not write to `ladderProgressById` during planning;
- must not create a fake regression event.

Persistent progression/regression remains Stage 5D feedback-driven and idempotent.

### 7. Explicit progression-evidence policy

Add or harden narrow metadata:

```ts
type ProgressionEvidencePolicy =
  | 'normal'
  | 'hold_only'
  | 'ineligible';
```

Conceptual rules:

- unscaled normal plan + valid feedback:
  - `normal`.

- cautious/low-readiness adjusted plan:
  - `hold_only`.

- short-on-time plan:
  - `hold_only`.

- pain/discomfort-adjusted plan:
  - `hold_only` at most;
  - positive advancement is not allowed from the adjusted exposure;
  - existing pain feedback may still produce current hold/regress decisions.

- supporting/non-credit plan:
  - `ineligible`.

- malformed/legacy/unknown context:
  - `ineligible`.

Requirements:

- policy is generated during planning;
- survives plan metadata;
- Stage 5D progression eligibility consumes it;
- `hold_only` records one applied progression event per ladder if the existing architecture needs replay protection, but must not advance level;
- duplicate/replay behavior remains idempotent;
- no numeric thresholds change.

### 8. Post-session pain/effort feedback

Preserve Stage 5D timing:

- progression applies only after required feedback;
- repeated feedback remains idempotent;
- missing feedback is not favorable evidence.

Main-plan credit:

- may remain if valid primary work was explicitly completed;
- post-session pain does not retroactively fabricate or erase work evidence;
- no positive progression when pain is reported;
- current hold/regress semantics remain.

Do not provide medical interpretation.

### 9. Pre-session honesty

The preview must distinguish:

#### Normal session

- normal plan-advancing copy.

#### Safely scaled but creditable session

- “Pearl adjusted today’s session based on how you’re feeling.”
- “Complete the primary focus exercise for this session to move your plan forward.”
- no promise of progression.

#### Supporting/non-credit session

- “Pearl couldn’t include a safe primary [focus] exercise with today’s selections.”
- “This supporting session can still be useful, but it won’t move your plan forward.”

#### Unavailable/no-safe-exercises

- Stage 5C recovery state;
- plan unchanged;
- review readiness, discomfort, equipment, or try later.

Do not display technical reason codes.

### 10. Post-session honesty

Distinguish:

- normal credited session;
- adjusted credited session;
- supporting-only non-credit;
- fallback-only non-credit;
- zero-work;
- pain-abandoned/incomplete if represented.

For an adjusted credited session:

- acknowledge completion;
- do not claim exercise-level progression;
- say the plan moved forward because safe primary work was completed;
- avoid “you levelled up” unless Stage 5D actually advanced a ladder.

### 11. Multiple sources of readiness/discomfort

Audit every source:

- daily session-start UI;
- safety profile;
- onboarding;
- restored session state;
- legacy training state;
- completion feedback.

Define precedence:

- current daily explicit user selection is authoritative for today;
- safety profile provides persistent constraints only where intended;
- completion feedback does not rewrite today’s pre-session input retroactively;
- legacy values do not override current explicit selections;
- malformed restored values fail conservatively.

Stage 5F will address canonical equipment state, not these daily inputs.

### 12. Supporting/manual/extra sessions

Preserve Stage 5A–5D:

- extra/manual/non-main sessions do not gain main-plan credit;
- they do not gain official progression authority;
- pain/readiness may still be used for safety filtering;
- they must not alter current block rotation.

## Primary implementation targets

The exact file layout may differ, but inspect and adapt at minimum:

- App.tsx
- src/training/autoregulation.ts
- src/training/workoutGeneration.ts
- src/training/equipmentSafety.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/focusStimulusEvidence.ts
- src/pearlFlow/progressionEvidence.ts
- src/pearlFlow/mainPlanEvents.ts
- src/pearlFlow/types.ts
- src/exercises/ladders.ts
- src/exercises/types.ts
- src/screens/SessionPreviewScreen.tsx
- src/adherence/screens/SessionCompletionScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- readiness/discomfort selection screens/components
- backend training-state sync/restore files
- all relevant tests.

## Working-tree safety

Before analysis or editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record exact outputs in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect all current diffs in files Stage 5E may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct every pain/readiness/autoregulation path

Before editing, trace:

- daily readiness input;
- short-on-time input;
- pain/discomfort input;
- persistent safety-profile input;
- session generation filters;
- same-ladder regression search;
- fallback selection;
- set/rep/hold scaling;
- preview metadata;
- main-plan-credit potential;
- completion feedback;
- progression evidence;
- serialization;
- restore;
- backend sync.

Document:

- current readiness enum/options;
- defaults;
- current pain/discomfort categories;
- current exercise-pattern exclusions;
- current order of filters;
- current numeric scaling;
- current minimum dose floors;
- current permanent-state mutations;
- current progression behavior after scaled sessions;
- current copy;
- every duplicated source of readiness/discomfort.

Do not edit until this trace is complete.

## Step 2: Implement one daily-context normalizer

Create a pure helper in the narrowest appropriate module.

Direct tests must cover:

- every valid readiness state;
- explicit no-discomfort;
- each discomfort area;
- duplicate discomfort areas;
- multiple discomfort areas;
- unknown readiness;
- malformed readiness;
- malformed discomfort array;
- unknown discomfort token;
- restored legacy context;
- input non-mutation;
- stable ordering.

Return structured diagnostics/reason codes.

## Step 3: Implement one movement-pattern discomfort policy

Create one centralized pure policy.

Conceptually:

```ts
type DiscomfortConstraint = {
  blockedMovementPatterns: MovementPattern[];
  blockedExerciseIds?: string[];
  requiredRegressionPatterns?: MovementPattern[];
  reasonCodes: DiscomfortConstraintReason[];
};
```

Prefer pattern-based rules.

Direct tests must prove:

- knee constraints;
- hip/back constraints;
- shoulder constraints, including row/pull;
- ankle/foot constraints;
- union for multiple areas;
- no-discomfort no exclusions;
- unknown/malformed fails conservatively;
- no exercise-name parsing;
- safety-excluded exercise cannot reappear through fallback.

## Step 4: Apply safety precedence centrally

Ensure current generation follows the locked precedence.

Tests should construct exercises that:

- pass equipment but fail discomfort;
- pass discomfort but fail equipment;
- fail readiness level;
- would reappear through fallback;
- would reappear through optional-level search.

Required:

- excluded exercise never reappears;
- same-domain safe regression is preferred;
- later filters cannot override earlier safety decisions;
- no harder level selected to preserve focus.

## Step 5: Harden readiness autoregulation

Preserve current numeric scaling where valid.

Add explicit metadata:

- original ladder level;
- selected daily level;
- sets/reps/hold before and after;
- adjustment reasons;
- readiness classification;
- short-session flag;
- progression-evidence policy.

Tests:

- ready unchanged;
- cautious does not increase any demand;
- cautious removes/lowers optional loaded/power/unstable work according to current logic;
- short plan retains primary if safe;
- very-low/not-ready becomes supporting/non-credit if represented;
- missing/malformed readiness is conservative;
- zero/negative/NaN dose never produced;
- temporary selected level does not mutate stored ladder state.

## Step 6: Enforce minimum safe planned stimulus

Use Stage 5B structured focus metadata after all adjustments.

Tests for each focus:

- strength: primary remains;
- balance: primary remains with support;
- mobility: primary remains;
- pain removes all primary;
- readiness removes all primary;
- equipment removes all primary;
- short compaction removes all primary;
- supporting safe work remains;
- no safe work remains.

Required result:

- normal/adjusted creditable plan;
- supporting non-credit plan;
- unavailable no-safe-exercises.

Do not synthesize a primary role.

## Step 7: Integrate progression-evidence policy with Stage 5D

Update Stage 5D progression eligibility/application to consume the plan’s policy.

Required behavior:

### `normal`

- existing Stage 5D decision engine unchanged.

### `hold_only`

- eligible completed primary/supporting evidence may be recorded;
- stable event ids still apply;
- duplicate replay still prevented;
- no ladder-level advancement;
- no favorable exposure count toward automatic progress;
- pain/unsafe feedback may still produce existing conservative hold/regress behavior where current decision engine supports it.

### `ineligible`

- no official progression event.

Tests:

- cautious credited session does not advance;
- short credited session does not advance;
- pain-adjusted credited session does not advance;
- normal credited session still can advance under existing rule;
- supporting non-credit remains ineligible;
- duplicate hold-only feedback is idempotent;
- restore does not replay;
- no legacy progression mutation.

Do not change existing thresholds.

## Step 8: Main-plan credit regression

Prove:

- safe same-domain regressed primary completed -> main-plan credit allowed;
- supporting-only -> no credit;
- fallback-only -> no credit;
- pain-adjusted session with no primary -> no credit;
- cautious session with primary completed -> credit allowed;
- short session with primary completed -> credit allowed;
- zero-work remains no credit;
- non-training remains no credit.

Credit and progression outcomes must be tested separately.

## Step 9: Post-session feedback behavior

Test:

- normal feedback, easy/no pain;
- adjusted session, easy/no pain;
- adjusted session with pain;
- normal session with pain;
- missing feedback;
- malformed RPE;
- duplicate feedback;
- restart before feedback then restore.

Required:

- one progression application at most;
- no favorable inference from missing feedback;
- hold-only metadata remains authoritative;
- main-plan credit is not duplicated or retroactively fabricated.

## Step 10: Preview and completion states

Add/update focused tests.

### Preview

- normal;
- adjusted creditable;
- supporting/non-credit;
- unavailable;
- malformed input fail-closed.

### Completion

- normal credited;
- adjusted credited with no progression claim;
- supporting-only;
- fallback-only;
- zero-work;
- pain-abandoned/incomplete if represented.

Copy must remain calm, premium, non-medical, and consistent with Stage 3D-A.

## Step 11: Serialization and restore

Persist only what is required:

- normalized readiness state;
- short-on-time flag;
- normalized discomfort areas/reason codes;
- adjustment metadata;
- progression-evidence policy;
- primary-focus eligibility;
- source/date/block/template identity.

Tests:

- round-trip normal;
- round-trip adjusted;
- round-trip supporting;
- malformed old metadata;
- missing policy defaults conservatively;
- restored adjusted session remains hold-only;
- restored supporting session remains non-credit;
- no read-time rewrite;
- stored ladder level remains authoritative and unchanged by temporary daily regression.

Do not persist raw free-text health notes.

## Step 12: Backend sync and restore

Use existing compact JSON metadata where possible.

Verify:

- credited adjusted session remains credited but marked hold-only;
- supporting/non-credit remains non-credit;
- normalized discomfort/readiness metadata is sanitized;
- restore cannot promote missing policy to normal progression;
- remote duplicate cannot replay progression;
- no raw health free text, pose data, or video is added;
- source identity remains fail-closed.

Do not add a schema migration unless absolutely necessary.

## Step 13: Observability

Emit safe structured diagnostics for:

- readiness defaulted cautious;
- malformed discomfort input;
- exercise excluded by discomfort pattern;
- same-domain regression selected;
- primary focus removed;
- session downgraded to supporting;
- no safe exercises;
- progression policy normal/hold/ineligible;
- temporary daily level selected;
- stored ladder level preserved.

Include only:

- stable reason code;
- session/block/template/exercise/ladder ids where safe;
- readiness enum;
- discomfort enum tokens;
- level before/selected;
- progression policy.

Exclude:

- free-text symptoms;
- raw health notes;
- pose/video/landmarks;
- auth data;
- raw payload dumps.

Keep pure helpers side-effect free.

## Required automated test matrix

### A. Context normalization

- valid readiness states;
- explicit no-discomfort;
- each discomfort area;
- multiple areas;
- duplicates;
- unknown/malformed;
- legacy restored;
- deterministic/non-mutating.

### B. Discomfort policy

- knee;
- hip/back;
- shoulder including rows/push/overhead;
- ankle/foot including balance/march/step/calf;
- multiple areas;
- no discomfort;
- fallback cannot reintroduce blocked pattern.

### C. Readiness scaling

- ready;
- cautious;
- low energy;
- short;
- very low/not ready if represented;
- loaded/optional;
- high ladder;
- malformed input;
- positive finite dose;
- stored level non-mutation.

### D. Focus/minimum safe stimulus

- primary remains;
- same-domain regression;
- only supporting remains;
- only fallback remains;
- no safe work;
- strength/balance/mobility;
- equipment + pain + readiness combinations.

### E. Credit vs progression

- normal credited + normal progression;
- cautious credited + hold-only;
- short credited + hold-only;
- pain-adjusted credited + hold-only;
- supporting non-credit + ineligible;
- zero-work non-credit;
- extra/manual non-credit;
- fallback non-progressing.

### F. Feedback/idempotency

- one feedback;
- duplicate feedback;
- missing feedback;
- malformed feedback;
- restart/restore;
- no replay.

### G. UI/copy

- preview normal/adjusted/supporting/unavailable;
- completion normal/adjusted/supporting/fallback/zero-work;
- no medical claims;
- no false progression claim.

### H. Persistence/backend

- local round-trip;
- backend round-trip;
- conservative missing-policy default;
- no promotion;
- no replay;
- no sensitive free text.

### I. Regression

- Stage 5A rotation/zero-work/date;
- Stage 5B primary credit;
- Stage 5C current-planner authority;
- Stage 5D authoritative idempotent progression;
- Stage 4A safety;
- Stage 4B stimulus roles;
- Stage 3D focus;
- Stage 3A/3B/3C protections;
- canonical tab order;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real production normalization/policy helpers;
- exercise actual generation/planning where practical;
- assert selected exercises and excluded patterns;
- assert plan credit separately from progression policy;
- assert persistent ladder state is not mutated during planning;
- assert adjusted sessions cannot positively progress;
- fail if blocked exercises reappear through fallback;
- preserve valid normal behavior.

Tests must not:

- provide medical advice;
- invent new exercise content;
- alter Stage 5D numeric thresholds;
- implement Stage 5F/G;
- mock every layer;
- assert only helper calls;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic ids, dates, blocks, templates, readiness, discomfort, and feedback.

## Validation commands

Run targeted tests for:

- autoregulation/readiness;
- discomfort/pain filtering;
- workout generation;
- session planning;
- focus stimulus;
- main-plan events/work evidence;
- progression evidence;
- session preview/completion states;
- training serialization/store;
- backend training-state/session sync/restore;
- Stage 5A–5D regressions;
- Stage 4A/4B;
- Stage 3D focus;
- navigation order.

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
- targeted suite count;
- targeted test count;
- full suite count;
- full test count;
- snapshots;
- skipped tests;
- typecheck result;
- Expo config result;
- diff-check result;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warnings;
- whether validation changed files.

## Manual source verification after tests

Retrace:

### Normal ready session

```text
daily context
-> safety/equipment
-> discomfort
-> readiness
-> generation
-> primary focus
-> credit
-> normal progression
```

### Cautious session

Confirm:

- safe adjustment;
- stored ladder unchanged;
- primary credit possible;
- hold-only progression.

### Pain-adjusted session

Confirm:

- blocked movement does not reappear;
- same-domain safe regression if available;
- no primary means supporting/non-credit;
- no positive progression.

### Short session

Confirm:

- primary completion required;
- hold-only progression.

### Restore

Confirm:

- adjusted policy survives;
- no promotion to normal;
- no replay.

## Remediation report

Create exactly one new report:

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Stage 5 pain/readiness gaps addressed.
4. Findings/policies deferred to Stage 5F/G/H and Stage 4.
5. Daily-context normalization.
6. Discomfort movement-pattern policy.
7. Safety precedence.
8. Readiness policy.
9. Minimum safe planned stimulus.
10. Temporary daily regression behavior.
11. Main-plan credit behavior.
12. Progression-evidence policy.
13. Feedback behavior.
14. Preview/completion copy.
15. Local serialization/restore.
16. Backend sync/restore.
17. Observability.
18. Files changed.
19. Tests added/changed.
20. Exact validation results.
21. Stage 1–5D regression verification.
22. Remaining Stage 5 blockers.
23. Whether Stage 5F is unblocked.
24. Whether beta automatic plan generation remains blocked.
25. Initial and final Git status.
26. Concurrent external changes.
27. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5E:

1. Daily readiness/discomfort is normalized once.
2. Malformed inputs fail conservatively.
3. Explicit no-discomfort remains valid.
4. Safety/equipment/discomfort precedence is enforced.
5. Excluded movement patterns cannot reappear through fallback.
6. Same-domain safe regression is preferred.
7. Difficulty never increases to preserve credit.
8. No-primary plans are supporting/non-credit.
9. No-safe-work plans are unavailable.
10. Safe regressed primary work may earn main-plan credit.
11. Planning-time regression does not mutate stored ladder state.
12. Cautious sessions are hold-only for progression.
13. Short sessions are hold-only for progression.
14. Pain-adjusted sessions cannot positively progress.
15. Supporting/non-credit sessions are progression-ineligible.
16. Normal valid sessions preserve existing progression behavior.
17. Feedback remains one-shot/idempotent.
18. Restore cannot promote hold-only/ineligible to normal.
19. Stage 5A/5B/5C/5D protections remain.
20. Stage 4A/4B semantics remain.
21. Stage 3D focus remains.
22. Canonical tab order remains.
23. No scoring/norm/Check-Up changes.
24. No medical claims are introduced.
25. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5E complete unless:

1. One authoritative daily-context normalizer exists.

2. One centralized discomfort movement-pattern policy exists.

3. Safety precedence is centralized/tested.

4. Readiness adjustments are explicit and non-escalating.

5. Minimum safe primary-stimulus behavior is enforced.

6. Temporary regression does not mutate persistent ladder state.

7. Progression-evidence policy distinguishes normal/hold/ineligible.

8. Stage 5D consumes that policy idempotently.

9. Main-plan credit remains distinct from progression.

10. Pain/readiness/short scenario matrices pass.

11. Preview/completion copy is honest and non-medical.

12. Persistence/restore fails conservatively.

13. Backend sync/restore cannot promote/replay.

14. Stage 5A–5D regressions pass.

15. Stage 4A/4B and Stage 3D regressions pass.

16. Targeted tests pass.

17. Full suite passes.

18. Typecheck passes.

19. Expo config passes.

20. `git diff --check` passes.

21. No new warning is introduced without explanation.

22. No unrelated user work is reverted or overwritten.

23. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5E COMPLETE
- STAGE 5E BLOCKED

Also state exactly one:

- STAGE 5F UNBLOCKED
- STAGE 5F BLOCKED

Use `STAGE 5F UNBLOCKED` only if no P0/P1 pain/readiness/autoregulation gap remains.

Also state:

- STAGE 5F REQUIRED
- STAGE 5G REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5E must not declare beta readiness. Canonical equipment state, remote conflict/metadata handling, block timing/lapse semantics, broad scenario testing, remaining Stage 4 safety/cueing work, Stage 3D-B, and beta-device validation remain.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Daily-context normalization.
- Discomfort movement-pattern policy.
- Safety precedence.
- Readiness behavior.
- Minimum safe stimulus behavior.
- Main-plan credit behavior.
- Progression normal/hold/ineligible policy.
- Temporary ladder regression behavior.
- Preview/completion copy.
- Local serialization/restore.
- Backend sync/restore.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A–5D, Stage 4A/4B, Stage 3D, and tab-order protections remain.
- Remaining Stage 5 blockers.
- STAGE 5E COMPLETE or STAGE 5E BLOCKED.
- STAGE 5F UNBLOCKED or STAGE 5F BLOCKED.
- STAGE 5F REQUIRED.
- STAGE 5G REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
