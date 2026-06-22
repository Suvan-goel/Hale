You are implementing Stage 4G-R of Hale’s production-readiness work:

MOBILITY-COLLECTION ROTATION, NON-LINEAR LADDER PRESENTATION, MINIMAL-EQUIPMENT PRODUCT POSITIONING, AND FINAL STAGE 4 SOFTWARE/CONTENT CLOSURE

“Stage 4G-R” is the final planned Stage 4 remediation batch arising from the post-Stage-5 exercise-catalogue review.

This is a focused production-code, presentation-semantics, and product-copy remediation task.

Do not begin Stage 3D-B, physical-device validation, app-store submission, optional-level enablement, load prescription, new exercise development, or unrelated UI/product work in this task.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_4F_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also read the relevant upstream copy, release, progression, equipment, and restore contracts:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime and user-facing path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 4G-R

Current catalogue and policy:

- 37 registered levels.
- 11 ladders.
- 30 controlled-beta core levels.
- 7 hidden optional levels.
- 5 linear-progression ladders.
- 5 supporting-set ladders.
- 1 collection ladder.
- 11 explicit controlled-beta progression policies.
- 2 allowed automatic forward transitions.
- 2 allowed automatic regressions.
- 48 explicitly blocked automatic transitions.

Stage 4C-R is complete:

- floor transfer is distinct from floor space;
- step-up environment is explicitly confirmed;
- single-leg balance requires explicit supported confidence;
- Explore/manual starts use explicit daily readiness/discomfort;
- capability snapshots and stale-plan validation exist.

Stage 4D-R and Stage 4D-R.1 are complete and verified:

- one canonical safety-cue system exists;
- text and voice share canonical cue definitions;
- 44 required safety cues exist for both Clara and Marcus;
- 88/88 MP3 assets and static mappings validate;
- session-global/setup/active/repeat/recovery cue sequencing passes;
- text fallback and pause/repeat/help/skip/stop controls pass;
- Expo export resolves all bundled safety assets.

Stage 4E-R is complete:

- all seven optional levels remain hidden in controlled beta across generation, progression, Explore, manual practice, presets, restore, direct calls, and start validation.

Stage 4F-R.1 is complete:

- `progressionModel` now controls level mutation;
- supporting sets and collections do not mutate adjacent members;
- every automatic transition is explicit;
- risky transitions are held or capped;
- historical higher levels remain stored while current planning derives conservative effective levels;
- core progression is software/content-ready for controlled beta.

Stage 5 is complete:

- current-planner authority;
- main-plan/work/focus/schedule-credit honesty;
- idempotent progression;
- canonical equipment;
- daily context;
- four-week scheduling;
- restore/replay protection;
- full lifecycle adversarial testing.

Stage 4F-R.1 validation passed:

- targeted: 24 suites / 304 tests;
- full Jest: 103 suites / 844 tests;
- audio verification: 44 cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config;
- iOS/Android Expo export;
- `git diff --check`.

Re-run the current baseline rather than assuming these counts remain unchanged.

## Findings addressed by Stage 4G-R

### F4R-009 — P3

The mobility ladder is correctly modelled as a `collection`, and Stage 4F-R.1 prevents collection items from mutating as levels.

However, user-facing and selection semantics can still imply linear progression:

- Explore may still show `Level N`;
- supporting sets may still show harder/easier ordering;
- “current level” can imply a ranked achievement;
- mobility generation may repeatedly fall back to the first collection item;
- there is no explicit coverage/rotation policy;
- completion/progress copy can still use level language around non-linear groups;
- historical `currentLevelId` can leak into presentation even though it is no longer progression authority.

### F4R-010 — P3

Hale’s equipment positioning must be more precise.

The truthful controlled-beta position is:

- users can start with common household support, especially a sturdy chair and wall or counter;
- no specialist gym equipment is required to begin;
- a long resistance band unlocks meaningful upper-back pulling and makes the programme more complete;
- a door anchor is optional;
- floor space and a low stable step are used only when explicitly confirmed;
- Hale is not a complete “zero-equipment” programme for every movement domain;
- “using the phone camera” describes measurement technology, not the complete physical setup for training.

Current or concurrent app/website copy may still use phrases such as:

- no equipment needed;
- zero equipment;
- nothing but your phone;
- just your phone;
- complete programme without equipment;
- minimal equipment without qualification.

Stage 4G-R must close both findings without overhauling product design.

## Findings and work explicitly deferred

This task must not:

- enable any optional level;
- add loaded exercise guidance;
- relax any Stage 4F-R.1 progression gate;
- add new exercises;
- alter scoring/norms;
- change Check-Up measurement logic;
- claim physical-device validation;
- implement ecommerce or a Hale Movement Kit purchase flow;
- add a requirement to buy equipment;
- redesign the landing page or app screens broadly.

Stage 3D-B and physical-device validation remain separate blockers after Stage 4G-R.

## Approved Stage 4G-R product policy

The following policy is locked for this task.

# PART A — NON-LINEAR LADDER PRESENTATION

## 1. Linear ladders may use level language

Only ladders with:

```text
progressionModel === 'linear_progression'
```

may use user-facing concepts such as:

- Level 1 / Level 2;
- current level;
- easier level;
- harder level;
- progressed;
- maintaining this level.

Even for linear ladders, the displayed current level must use the Stage 4F-R.1 effective controlled-beta progression level, not a stale historical value.

## 2. Supporting sets must use movement/option language

For:

- heel-toe-raise;
- pull-upper-back;
- hinge-glutes;
- shoulder-reach-press;
- lateral-stability;

do not show:

- Level N;
- current level;
- harder/easier level;
- progressed from one member to another;
- “next level” between set members.

Use:

- Movements;
- Practice options;
- Movements in this set;
- Recently included;
- Available with your setup.

Each member remains a distinct movement.

Manual practice may remain available for controlled-beta core members, subject to all existing safety gates, but manual practice never changes progression.

## 3. Mobility collection must use mobility-area language

For `mobility-flexibility`, do not show:

- Level N;
- current level;
- harder/easier;
- progressed to;
- highest level;
- current rung.

Use:

- Mobility movements;
- Mobility areas;
- Varied across your block;
- Recently practised;
- Coverage this block.

The collection’s core controlled-beta members are:

1. `seated-hamstring-reach`
2. `thoracic-rotation`
3. `supported-hip-flexor-stretch`
4. `wall-calf-stretch`

`neck-rotation` remains hidden under Stage 4E-R.

## 4. Historical progression state is not presentation authority

A stored historical `currentLevelId` on a supporting set or collection may remain readable internally for migration/history.

It must not determine:

- a ranked label;
- harder/easier controls;
- achievement copy;
- automatic selection order;
- collection coverage.

Do not rewrite historical state on read.

# PART B — MOBILITY COLLECTION ROTATION

## 5. One canonical collection-selection policy

Create one pure, typed collection-selection module.

Conceptually:

```ts
type CollectionSelectionReason =
  | 'explicit_template_member'
  | 'never_practised_first'
  | 'least_recently_practised'
  | 'only_eligible_member'
  | 'canonical_fallback'
  | 'no_eligible_member';

type CollectionExposure = {
  blockId: string;
  exerciseId: string;
  plannedDateKey: string;
  completedAt?: string;
  completionId: string;
};

type CollectionSelectionResult =
  | {
      available: true;
      collectionId: string;
      selectedExerciseId: string;
      reason: CollectionSelectionReason;
      eligibleExerciseIds: readonly string[];
      practisedExerciseIds: readonly string[];
      unpractisedExerciseIds: readonly string[];
    }
  | {
      available: false;
      reason: 'no_eligible_member' | 'invalid_collection';
    };
```

Adapt to the current architecture.

Requirements:

- pure;
- deterministic;
- stable reason codes;
- no hidden clock;
- no display-name parsing;
- no mutation;
- uses exercise IDs;
- release, equipment, capability, and daily-context eligibility is applied before selection;
- optional levels cannot enter;
- equal inputs produce equal results.

## 6. Authoritative mobility exposure

For main-plan mobility rotation, count only an explicit completed exercise exposure that is:

- from a current block-generated session;
- for the current MovementBlock;
- a known controlled-beta mobility collection member;
- explicitly completed in session results/work evidence;
- not skipped;
- not fallback-only;
- not malformed;
- not a manual practice;
- not an Explore preset/extra session;
- not a micro-check;
- not a re-test;
- not a legacy session.

Manual and Explore practice remain useful history but do not steer automatic block mobility rotation.

Do not infer an exposure merely because:

- a plan was generated;
- the exercise appeared in a preview;
- a session was abandoned;
- a summary lacks explicit item completion;
- the historical collection `currentLevelId` points at the item.

## 7. Selection algorithm

When a mobility collection slot does not explicitly name one fixed member:

1. Build the eligible controlled-beta member list after:
   - release policy;
   - equipment;
   - movement capability;
   - daily discomfort/readiness;
   - current session duplicate prevention.

2. Prefer never-practised eligible members in canonical order.

3. Once all currently eligible members have been practised, choose the least recently practised eligible member.

4. Break equal-date ties using:
   - canonical member order;
   - stable completion ID if needed.

5. If only one eligible member remains, use it and record `only_eligible_member`.

6. If no member is eligible:
   - skip/support honestly under Stage 4B;
   - or return typed unavailable if no safe useful work remains;
   - never launch an empty player;
   - never pull in hidden neck rotation.

## 8. Multiple mobility slots in one session

When one generated session contains multiple mobility collection slots:

- avoid selecting the same member twice if another eligible member exists;
- pass already-selected exercise IDs into the selector;
- preserve explicit fixed-member template intent where the template genuinely names one exercise;
- do not replace an explicit fixed member with unrelated collection rotation unless the slot is marked collection-flexible;
- if a fixed member is unsafe/unavailable, use existing skipped/supporting semantics rather than silently changing product intent.

## 9. Rotation is not progression

Mobility rotation must not:

- mutate `ladderProgressById`;
- create a progression event;
- create “ready to progress” state;
- change the collection `currentLevelId`;
- award a level-up;
- alter main-plan credit by itself;
- alter schedule credit by itself.

A mobility exercise may still contribute to main-plan credit only through the existing Stage 5A/5B primary-focus rules when it is the planned primary exercise.

## 10. Coverage summary

Create a pure mobility coverage summary for the current active block.

Conceptually:

```ts
type CollectionCoverageSummary = {
  collectionId: string;
  totalEligibleMembers: number;
  practisedMemberIds: readonly string[];
  unpractisedMemberIds: readonly string[];
  completedExposureCount: number;
  coverageLabel: string;
};
```

User-facing copy examples:

- “2 of 4 mobility areas practised this block.”
- “Hale varies these movements across your block.”
- “All currently available mobility areas have been practised.”

Requirements:

- current block only;
- explicit completed block-generated exposures only;
- no level/rank language;
- deterministic;
- discomfort/equipment changes may alter currently eligible count without rewriting history;
- historical completed exposure remains historical;
- no shame if coverage is incomplete.

Do not add a large new Progress feature if the current design has no suitable place.

Preferred surfaces:

- Explore mobility card/details;
- a small explanatory line in relevant Plan/Progress view-model output only if it fits current design;
- no broad screen redesign.

## 11. Selection metadata

Preserve narrow collection-selection metadata on newly generated exercises/plans where useful:

```ts
type PlannedCollectionSelection = {
  schemaVersion: number;
  policyFingerprint: string;
  collectionId: string;
  selectedExerciseId: string;
  reason: CollectionSelectionReason;
};
```

Requirements:

- JSON-safe;
- deterministic;
- compact;
- no full history duplication;
- optional compact generated-summary/remote preservation if current summary architecture supports it;
- not a new safety authority;
- old plans remain readable;
- no start-time block solely because historical plans lack this metadata.

Do not add a database migration unless existing JSON cannot preserve the narrow fields.

## 12. Restore determinism

For identical:

- active block;
- completion history;
- planning date;
- daily context;
- equipment/capability;
- template;

mobility selection before serialization/sync/restore and after restore must be semantically identical.

Remote row order must not change the selected member.

Duplicate local/remote completion representations must not count twice.

# PART C — USER-FACING COPY AND VIEW-MODEL SEMANTICS

## 13. Central non-linear presentation helper

Create or harden one pure helper that derives user-facing ladder presentation from `progressionModel`.

Conceptually:

```ts
type LadderPresentationMode =
  | 'levels'
  | 'movement_set'
  | 'collection';

type LadderPresentation = {
  mode: LadderPresentationMode;
  itemNoun: 'level' | 'movement' | 'mobility movement';
  pluralNoun: string;
  showRank: boolean;
  showEasierHarder: boolean;
  showCurrentLevel: boolean;
  showCoverage: boolean;
};
```

Use it across:

- Explore cards;
- Explore details;
- manual-practice lists;
- progress/completion helpers where relevant;
- any “Level N” badges.

Do not create separate string checks in each screen.

## 14. Explore behavior

### Linear ladder

- show effective current level;
- easier/harder navigation may remain within controlled-beta policy;
- retain Stage 4E-R and Stage 4F-R.1 caps.

### Supporting set

- show distinct movements;
- no ranked numbers;
- no harder/easier arrows;
- no “current level” badge;
- manual practice for each eligible member remains available;
- use “Movement” or the exercise name.

### Mobility collection

- show the four available mobility movements;
- no level numbers;
- no harder/easier controls;
- show coverage or “varied across your block” copy;
- hidden neck rotation remains absent;
- manual practice remains non-credit/non-progressing.

## 15. Session preview/completion/progress truthfulness

Search all user-facing helpers and screens.

For supporting sets and collections:

- do not say “levelled up”;
- do not say “progressed to” another member;
- do not say “highest level”;
- do not say “level held” when the item group has no levels;
- do not show a level number derived from array index.

Preferred copy:

- “Movement completed.”
- “Mobility work completed.”
- “Hale will continue varying these movements.”
- “This movement remains available in your plan.”
- “Your plan moved forward.” only when Stage 5 credit actually exists.

Keep linear ladder copy unchanged except where a shared helper currently mislabels non-linear groups.

## 16. Copy guardrails for non-linear semantics

Add tests/guardrails for production user-facing areas.

The guard must detect inappropriate combinations such as:

- “Level” + mobility collection;
- “harder”/“easier” + supporting set;
- “progressed to band press” from overhead reach;
- “progressed to march” from side-step;
- “progressed to thoracic rotation” from hamstring reach.

Do not globally ban the word “level”; it remains valid for linear ladders.

# PART D — EQUIPMENT PRODUCT POSITIONING

## 17. One canonical controlled-beta positioning source

Create one canonical product-copy module or content object for app surfaces.

Conceptually:

```ts
type ControlledBetaEquipmentPositioning = {
  shortLabel: string;
  startingSetup: string;
  bandRecommendation: string;
  optionalSetup: string;
  noEquipmentClarification: string;
};
```

Approved positioning:

### Short label

> Minimal household setup

### Starting setup

> Start with a sturdy chair and a wall or counter for support.

### Specialist-equipment statement

> No specialist gym equipment is needed to begin.

### Band recommendation

> A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.

### Optional setup

> Floor space, a low stable step, and a door anchor are used only when you confirm they are available.

### Limited-setup clarification

> Hale plans around what you have, but some movements may be unavailable without household support or a resistance band.

Use exact or materially equivalent concise wording.

Do not introduce a purchase requirement.

## 18. Product truth rules

Allowed claims:

- minimal household setup;
- start with a sturdy chair and wall/counter;
- no specialist gym equipment required to begin;
- resistance band recommended for fuller upper-body training;
- band required for pulling exercises;
- optional equipment expands the programme;
- Hale adapts to confirmed setup.

Disallowed or misleading unqualified claims in training/product contexts:

- no equipment needed;
- zero equipment;
- no kit needed for the full programme;
- complete programme with only your phone;
- nothing but your phone;
- every workout needs no equipment;
- full-body strength without equipment;
- resistance band is never needed.

## 19. Measurement versus training distinction

It remains acceptable to explain that Hale uses the phone camera as the measurement sensor.

However, copy must distinguish:

### Measurement

- “Hale uses your phone camera to estimate movement.”
- “The camera is the sensor.”

### Training setup

- “Start with a sturdy chair and wall or counter.”
- “A resistance band expands upper-body training.”

Do not rewrite accurate camera/sensor explanations into equipment claims.

Do not use “using only your phone” if the same sentence implies the complete physical training setup.

## 20. App surfaces to audit and update

Inspect all production user-facing copy at minimum:

- Welcome/onboarding;
- camera explanation where equipment wording appears;
- equipment onboarding;
- safety profile;
- Today;
- Plan;
- Progress;
- Explore;
- Settings equipment;
- Session preview;
- Learn/articles;
- recovery screens;
- app config description if user-facing;
- shared copy/content modules.

Use the canonical positioning source where practical.

Do not redesign screens.

## 21. Equipment onboarding policy

Keep the existing canonical equipment model and selection tokens.

Do not rename stored IDs.

UI guidance should make clear:

- chair and wall/counter are the recommended starting setup;
- long resistance band is recommended for fuller upper-body training;
- door anchor is optional;
- floor and step use require separate confirmation;
- selecting no available setup may limit sessions.

If the current UI has an explicit `none` choice:

- keep its semantic meaning;
- label it honestly, such as “None of these” if that matches the current interaction;
- do not turn explicit none into confirmed chair/wall;
- show calm limitation copy rather than promising the full programme.

## 22. No Movement Kit commerce in this task

Do not:

- add a store link;
- add pricing;
- add purchase checkout;
- require a Hale Movement Kit;
- claim that a proprietary kit is necessary.

It is acceptable to say:

> A long resistance band is the first optional item Hale recommends as your programme expands.

Only add that line if it fits an existing equipment guidance surface.

## 23. Website positioning parity

Inspect the current website copy and concurrent diffs before editing.

At minimum check:

- website/src/content/landing.ts;
- website/src/components/LandingPage.tsx;
- FAQ;
- product steps;
- hero/supporting copy;
- store/download section;
- metadata/description if relevant;
- website tests.

Update only narrow product-copy strings required for truthful parity.

Do not redesign the website.

Do not overwrite concurrent layout/style/image work.

If the same file contains substantial concurrent work:

- inspect the diff;
- make the smallest safe string-level edit;
- if ownership is ambiguous, stop editing that file and document the conflict rather than overwriting it.

## 24. Website/app consistency

The app and website must agree that:

- users start with household support;
- a band is recommended for fuller upper-body training;
- pulling requires a band;
- floor/step/anchor are conditional;
- no full zero-equipment promise is made.

Add or update focused website unit/copy tests if the website is changed.

Use the website’s existing test tooling only.

Do not install packages.

# PART E — FINAL STAGE 4 CLOSURE

## 25. Re-evaluate F4R-001 through F4R-010

Create a final closure table:

| Finding | Current status | Closing stage | Current proof | Residual dependency |

Expected outcomes if all current work remains green:

- F4R-001: closed by Stage 4C-R.
- F4R-002: closed by Stage 4C-R.
- F4R-003: closed by Stage 4D-R/4D-R.1.
- F4R-004: closed by Stage 4D-R/4D-R.1.
- F4R-005: closed for controlled beta by Stage 4E-R containment.
- F4R-006: closed by Stage 4C-R plus Stage 4F-R.1 auto-progression cap.
- F4R-007: closed by Stage 4C-R.
- F4R-008: closed for controlled beta by Stage 4F-R.1.
- F4R-009: closed by Stage 4G-R.
- F4R-010: closed by Stage 4G-R.

Physical-device validation may remain as a release dependency without reopening a closed software/content finding.

## 26. Final Stage 4 readiness standard

Mark Stage 4 remediation complete only if:

- no unresolved P0/P1/P2 Stage 4 software/content finding remains;
- F4R-009 and F4R-010 are closed;
- all optional levels remain hidden;
- progression policies remain conservative;
- mobility selection is deterministic and non-progressive;
- non-linear UI semantics are truthful;
- product equipment claims are accurate;
- all safety audio remains bundled and verified;
- full release gates pass.

## Primary objective

Implement the final Stage 4 software/content closure so that:

1. Mobility collection items rotate deterministically by completed current-block coverage.

2. Mobility rotation never mutates progression.

3. Manual/extra/abandoned/skipped work does not steer main-plan rotation.

4. Multiple mobility slots avoid duplication where possible.

5. Restore/order differences do not change selection.

6. Collection and supporting-set UI no longer uses ranked level semantics.

7. Linear ladders retain appropriate level semantics.

8. Session/completion/progress copy does not overclaim non-linear progression.

9. App equipment positioning is truthful and centralized.

10. Website positioning matches the app.

11. No full zero-equipment or phone-only training promise remains.

12. Band recommendation and pulling requirement are explicit.

13. Stage 4 findings F4R-001 through F4R-010 are re-verified.

14. Stage 4 remediation can be formally closed if all gates pass.

## Scope boundary

This task may change:

- collection-selection policy/helpers;
- mobility selection in workout generation;
- generated-exercise collection-selection metadata;
- current-block mobility coverage helpers;
- Explore view models/details;
- narrow Plan/Progress/session copy helpers;
- non-linear presentation helpers;
- equipment-positioning copy/content modules;
- onboarding/equipment/settings copy;
- narrow app/website product copy;
- local/remote compact metadata if needed;
- tests;
- the Stage 4G-R remediation report.

This task must not change:

- exercise registry count;
- level IDs;
- optional-level visibility;
- progression transition policies;
- progression thresholds;
- safety cue definitions;
- MP3 assets;
- equipment/capability authority;
- readiness/discomfort policy;
- credit/schedule rules;
- scoring;
- norms;
- Check-Up logic;
- pose/native modules;
- broad app/website design;
- dependencies;
- lockfiles;
- image/font/audio assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the remediation report.

Important current-tree notes:

- Stage 4F-R.1 reported concurrent/external work in:
  - native pose-detection modules;
  - pose renderers;
  - app screens;
  - website files;
  - pose latency diagnostics;
  - package.json.
- The 88 Clara/Marcus safety MP3s and their manifests are part of the intended current change set.
- Do not delete, regenerate, rename, or omit those assets.
- Do not inspect or expose `.env` values or provider credentials.
- Do not share or modify font files.

Rules:

1. Treat all current modified/untracked files as user-owned.

2. Inspect current diffs in every file Stage 4G-R may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not regenerate audio.

9. Do not call the TTS provider.

10. Do not stage, commit, create a branch, or push.

11. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe and unambiguous;
    - otherwise stop mutation and report the conflict.

## Step 1: Reconstruct current collection selection and presentation

Before editing, inspect at minimum:

- src/exercises/types.ts
- src/exercises/ladders.ts
- src/exercises/progressionPolicy.ts
- src/exercises/releasePolicy.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/exploreViewModel.ts
- src/haleFlow/progressViewModel.ts
- src/haleFlow/planViewModel.ts
- src/haleFlow/types.ts
- src/screens/ExploreScreen.tsx
- src/screens/ExploreDetailScreens.tsx
- src/screens/SessionPreviewScreen.tsx
- completion/progression copy helpers
- local/backend restore and training-state sync
- relevant tests.

Search for:

- `progressionModel`;
- `collection`;
- `supporting_set`;
- `Level `;
- `currentLevel`;
- `current level`;
- `harder`;
- `easier`;
- `progressed to`;
- `readyToProgress`;
- mobility exercise IDs;
- selection by `currentLevelId`;
- collection default selection;
- recent generated session exercises.

Document:

- every current mobility selection path;
- every user-facing rank/level consumer;
- every non-linear copy surface;
- every existing history field suitable for exposure derivation;
- every restore/sync path.

Do not edit until this trace is complete.

## Step 2: Reconstruct all current equipment-positioning copy

Search production app and website user-facing code for:

- `no equipment`;
- `zero equipment`;
- `without equipment`;
- `no kit`;
- `nothing but your phone`;
- `just your phone`;
- `only your phone`;
- `minimal equipment`;
- `specialist equipment`;
- `resistance band`;
- `chair and wall`;
- `chair`;
- `wall`;
- `counter`;
- `door anchor`;
- `floor space`;
- `step`;
- `Movement Kit`.

Create a table:

| Surface | Current copy | Truth status | Required action |

Distinguish:

- measurement-sensor claims;
- training-setup claims;
- equipment-selection labels;
- marketing claims.

Do not edit until this inventory is complete.

## Step 3: Implement the collection-selection policy

Create one canonical pure module in the exercise/training domain.

Tests must cover:

- valid mobility collection;
- invalid collection;
- all four core members;
- hidden neck rotation exclusion;
- no history;
- one practised item;
- partial coverage;
- full coverage;
- equal-date ties;
- reversed history input;
- duplicate completion representation;
- wrong block;
- manual/extra/legacy exposure;
- skipped/malformed/missing result;
- discomfort/equipment exclusions;
- one eligible member;
- no eligible members;
- already-selected member in the same session;
- deterministic non-mutation.

## Step 4: Build authoritative collection exposure

Use the strongest existing current completion/work-evidence source.

Requirements:

- explicit completed item;
- current block;
- block-generated current source;
- known collection member;
- deduped by stable completion/exercise identity;
- input order independent;
- no generated-only inference;
- no manual/extra contamination;
- no read-time rewrite.

If current compact generated summaries lack enough item-level completion evidence:

- use authoritative adherence/session completion records;
- do not infer;
- document any old-history limitation.

## Step 5: Integrate mobility selection into generation

For collection-flexible mobility slots:

- call the canonical selector;
- choose least-covered/least-recently-practised eligible member;
- avoid duplicate member selection inside one session where possible;
- preserve explicit fixed template members;
- preserve Stage 4A–4F safety/release/progression contracts;
- no progression mutation.

Add generated metadata:

- policy version/fingerprint;
- collection ID;
- selected exercise ID;
- selection reason.

Do not make missing historical collection metadata a safety start blocker.

## Step 6: Add mobility coverage summary

Create a pure current-block coverage helper.

Tests:

- 0 of 4;
- partial coverage;
- all four;
- current eligible count changes;
- manual/extra ignored;
- duplicates ignored;
- wrong block ignored;
- restore equivalence;
- no shame copy.

Expose it narrowly in Explore details/card and, only where current design supports it, Plan/Progress view model.

Do not add a new tab or large dashboard feature.

## Step 7: Add non-linear presentation policy

Create one central helper driven by `progressionModel`.

Update relevant view models/screens.

Tests:

### Linear

- level labels remain;
- effective current auto level remains;
- easier/harder remains bounded.

### Supporting set

- no rank;
- no level number;
- no harder/easier controls;
- movement list remains startable under existing gates.

### Collection

- no rank;
- no current level;
- no harder/easier;
- coverage/variety copy appears;
- all four core members shown;
- hidden neck absent.

## Step 8: Remove false non-linear progression copy

Audit and update:

- session preview;
- completion;
- Progress;
- Explore;
- manual details;
- milestones if relevant.

Tests must fail if production copy again says:

- overhead reach progressed to band press;
- side-step progressed to march;
- one mobility item progressed to another;
- supporting-set/collection Level N.

Do not change truthful linear progression copy.

## Step 9: Add canonical equipment-positioning content

Create one central app content source.

Use the approved policy.

Wire it into the narrowest relevant surfaces:

- Welcome/onboarding;
- equipment onboarding;
- Safety Profile or Settings equipment;
- Explore equipment guidance;
- any shared Learn copy;
- relevant recovery copy.

Avoid repeating a long paragraph everywhere.

Use:

- one short headline;
- one starting-setup line;
- one band-recommendation line;
- one optional-setup line;
- one limited-setup clarification.

## Step 10: Correct misleading app copy

Update only user-facing copy that conflicts with the approved positioning.

Requirements:

- no false full no-equipment claim;
- no phone-only training implication;
- phone-camera measurement claims remain accurate;
- band-required pull behavior remains explicit;
- explicit-none equipment remains semantically unchanged;
- no purchase requirement;
- no “Hale inspected your setup” implication.

Add or update app copy guardrail tests.

## Step 11: Correct website positioning narrowly

If safe given current diffs:

- update landing content/FAQ/product steps;
- preserve layout and visual design;
- use the same approved positioning;
- add/update focused website copy tests.

If concurrent edits make a file unsafe to edit:

- do not overwrite it;
- document the exact conflict;
- continue with safe files;
- mark Stage 4G-R blocked only if truthful production website copy cannot be established.

Do not modify website fonts or image assets.

## Step 12: Persistence/restore integration

If collection-selection metadata is persisted:

- local round-trip;
- compact remote round-trip;
- malformed metadata fails locally without promoting authority;
- selection can be re-derived from authoritative history;
- old sessions remain readable;
- no database migration unless necessary.

Prove pre/post-restore selection equivalence.

## Step 13: Final Stage 4 closure tests

Create a Stage 4 closure test or table-driven suite that verifies:

- all 10 F4R findings remain closed/contained;
- all optional levels remain hidden;
- non-linear presentation is correct;
- mobility rotation is deterministic;
- equipment positioning guardrails pass;
- safety audio remains complete;
- Stage 5 lifecycle remains green.

Do not duplicate the entire Stage 5H suite.

## Step 14: Regression verification

Prove these remain green:

### Stage 4C-R

- movement capabilities;
- Explore/manual daily context;
- stale-plan capability validation.

### Stage 4D-R/4D-R.1

- cue profiles;
- 44 cues / 88 assets;
- voice/text parity;
- player controls.

### Stage 4E-R

- all seven optional levels hidden.

### Stage 4F-R.1

- explicit transition policies;
- non-linear no-mutation;
- conservative auto ceilings.

### Stage 5A–5H

- credit;
- progression;
- equipment;
- scheduling;
- restore;
- lifecycle.

### Other

- Stage 3D copy/focus guardrails;
- canonical tab order;
- app/website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Collection selection

- complete selection matrix;
- deterministic history order;
- current-block exposure;
- eligibility;
- within-session dedupe.

### B. Collection coverage

- 0/partial/full;
- eligible-count changes;
- restore.

### C. Presentation semantics

- linear;
- supporting set;
- collection;
- no false rank/copy.

### D. Generated planning

- mobility focus;
- supporting mobility slots;
- explicit fixed member;
- collection-flexible member;
- discomfort/equipment interactions;
- no progression mutation.

### E. Explore/manual

- movement/collection labels;
- coverage;
- manual non-progressing;
- hidden optional.

### F. Equipment positioning

- approved app copy;
- misleading phrase guardrails;
- explicit band recommendation;
- no purchase requirement;
- measurement/training distinction.

### G. Website parity

- approved copy;
- no false zero-equipment claim;
- no design regression from string-only edits.

### H. Persistence/restore

- collection metadata;
- history dedupe;
- selection equivalence.

### I. Final Stage 4 closure

- F4R-001 through F4R-010.

### J. Regression

- Stage 4C–4F-R.1;
- Stage 5H;
- safety audio;
- typechecks.

## Test-quality requirements

Tests must:

- exercise real production collection selection;
- derive members from the real catalogue;
- use explicit completed work evidence;
- assert no progression mutation;
- assert deterministic output;
- exercise real view-model presentation;
- protect approved copy;
- fail if optional neck rotation appears;
- fail if a supporting set/collection regains level language.

Tests must not:

- mock every layer;
- assert only helper calls;
- count manual/extra history as main rotation;
- modify progression policies;
- regenerate audio;
- install packages;
- use network;
- depend on wall-clock sleeps;
- make broad snapshot assertions.

Use deterministic IDs, dates, blocks, and completion evidence.

## Validation commands

Run targeted tests for:

- collection selection/coverage;
- workout generation;
- session planning;
- Explore view model/details;
- progression-policy regression;
- release-policy regression;
- local serialization;
- backend restore/sync;
- copy guardrails;
- Stage 4 closure;
- Stage 5H lifecycle.

If website files are changed, run the relevant existing website unit/copy tests using the repository’s current website test script. Do not install tooling.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run a local non-publishing Expo export:

```bash
rm -rf /tmp/hale-stage4gr-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage4gr-export
rc=$?
rm -rf /tmp/hale-stage4gr-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- website test command/result if applicable;
- audio verification counts;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

Stage 4F-R.1 reference baseline:

- targeted: 24 suites / 304 tests;
- full Jest: 103 suites / 844 tests;
- audio: 44 cues / 88 assets;
- both typechecks passed;
- Expo config/export passed.

Verify current counts rather than assuming them.

## Manual source verification after tests

Retrace:

### Mobility rotation

```text
current block completed mobility exposures
-> eligible collection members
-> never/least recently practised
-> selected mobility exercise
-> generated plan
```

Confirm no progression mutation.

### Supporting set presentation

Confirm no level rank/harder/easier semantics.

### Explore mobility

Confirm four core movements, hidden neck, and coverage/variety copy.

### Equipment positioning

Confirm app and website agree on chair/wall start and band recommendation.

### Restore

Confirm identical inputs produce identical mobility selection.

### Audio/optional/progression

Confirm Stage 4D-R.1, 4E-R, and 4F-R.1 remain intact.

## Remediation report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F4R-009.
   - F4R-010.
4. Prior mobility selection/presentation behavior.
5. Prior equipment-positioning inventory.
6. Approved product policy.
7. Collection-selection architecture.
8. Authoritative exposure contract.
9. Mobility selection algorithm.
10. Multiple-slot behavior.
11. Coverage summary.
12. Selection metadata/restore.
13. Non-linear presentation architecture.
14. Explore behavior.
15. Session/completion/progress copy.
16. App equipment positioning.
17. Website positioning.
18. Measurement versus training distinction.
19. Copy guardrails.
20. Persistence/backend behavior.
21. Final F4R-001–F4R-010 closure table.
22. Files changed.
23. Tests added/changed.
24. Exact validation results.
25. Stage 4C-R through 4F-R.1 regression verification.
26. Stage 5 regression verification.
27. F4R-009 status.
28. F4R-010 status.
29. Final Stage 4 software/content verdict.
30. Remaining overall beta blockers.
31. Initial and final Git status.
32. Complete files-changed inventory.
33. Concurrent external changes.
34. Confirmation that no package install, lockfile change, audio regeneration, provider call, staging, commit, branch, or push occurred.

## Required invariant outcomes

After Stage 4G-R:

1. Mobility collection does not use level/rank semantics.
2. Supporting sets do not use level/rank semantics.
3. Linear ladders retain valid level semantics.
4. Mobility selection uses explicit current-block completed exposure.
5. Manual/extra/legacy/skipped history does not steer main-plan rotation.
6. Never-practised eligible mobility members are selected first.
7. Fully covered collections use least-recently-practised selection.
8. Input order does not alter selection.
9. Duplicate history does not double count.
10. Multiple mobility slots avoid duplicates where possible.
11. Hidden neck rotation never appears.
12. Mobility rotation never mutates progression.
13. Mobility rotation does not create level-up copy.
14. Coverage summary is current-block and non-shaming.
15. Restore produces equivalent selection.
16. Explore shows movements/coverage rather than levels.
17. Supporting-set Explore details show movements, not harder/easier.
18. Completion/Progress copy does not overclaim non-linear progression.
19. One canonical equipment-positioning source exists.
20. App copy says chair/wall or counter is the starting setup.
21. App copy says no specialist gym equipment is needed to begin.
22. App copy recommends a long band for fuller upper-body training.
23. App copy states pulling requires a band.
24. Floor/step/door-anchor are conditional.
25. No unqualified full no-equipment claim remains.
26. No phone-only training implication remains.
27. Website matches app positioning.
28. No purchase requirement is introduced.
29. Explicit-none equipment semantics remain unchanged.
30. All seven optional levels remain hidden.
31. Progression policies remain unchanged.
32. Safety audio remains 44 cues / 88 assets.
33. F4R-001 through F4R-010 are closed/contained for controlled beta.
34. Stage 5A–5H contracts remain.
35. App and website typechecks pass.
36. Expo config/export pass.
37. No scoring/norm/Check-Up changes.
38. No package/lockfile/audio/provider mutation.
39. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4G-R complete unless:

1. One deterministic collection-selection policy exists.

2. Authoritative exposure is explicit and fail-closed.

3. Mobility rotation and coverage are tested.

4. Non-linear presentation policy is centralized.

5. Supporting sets/collection no longer show level semantics.

6. Mobility rotation cannot mutate progression.

7. Restore equivalence is proven.

8. One canonical equipment-positioning source exists.

9. App product copy is truthful.

10. Website product copy matches.

11. Copy guardrails prevent regression.

12. F4R-009 is closed.

13. F4R-010 is closed.

14. F4R-001 through F4R-010 are re-verified.

15. No unresolved P0/P1/P2 Stage 4 software/content finding remains.

16. All optional levels remain hidden.

17. Progression policies remain conservative.

18. `npm run verify:audio` passes.

19. Targeted tests pass.

20. Full Jest passes.

21. App typecheck passes.

22. Website typecheck passes.

23. Expo config passes.

24. Expo export passes.

25. `git diff --check` passes.

26. No new warning is introduced without explanation.

27. No unrelated user work is reverted or overwritten.

28. No package install or lockfile change occurs.

29. No audio regeneration or provider call occurs.

30. No staging, commit, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4G-R COMPLETE`
- `STAGE 4G-R BLOCKED`

Also state exactly one:

- `F4R-009 CLOSED`
- `F4R-009 STILL OPEN`

Also state exactly one:

- `F4R-010 CLOSED`
- `F4R-010 STILL OPEN`

Also state exactly one:

- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 4 REMEDIATION STILL REQUIRED`

Also state exactly one:

- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`

Use the ready/complete decisions only if no unresolved P0/P1/P2 Stage 4 software/content defect remains.

Also state:

- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4G-R must not declare Hale generally beta-ready.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Mobility collection-selection policy.
- Authoritative exposure rule.
- Rotation/coverage behavior.
- Non-linear presentation behavior.
- Explore behavior.
- Session/completion/progress copy behavior.
- Canonical equipment-positioning wording.
- App surfaces updated.
- Website surfaces updated.
- Measurement/training distinction.
- Copy guardrail result.
- F4R-001–F4R-010 closure result.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Website test result if applicable.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 4C-R through 4F-R.1, Stage 5A–5H, Stage 3D, navigation, TypeScript boundaries, optional containment, progression policies, and safety audio remain.
- F4R-009 status.
- F4R-010 status.
- `STAGE 4G-R COMPLETE` or blocked.
- `STAGE 4 REMEDIATION COMPLETE` or still required.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA` or blocked.
- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, provider call, staging, commit, branch, or push occurred.
