# Hale Logic Verification - Stage 4R Remaining Findings

Date: 2026-06-22  
Mode: read-only verification audit, except for this report file  
Auditor: Codex

## 1. Executive Verdict

Stage 4R verification is complete. The Stage 5 remediation line is verified as complete from the current code and tests: dynamic session generation, main-plan credit, progression authority, valid-time progression, daily readiness/discomfort filtering, canonical equipment, 4-week scheduling, and Stage 5H lifecycle/property coverage are all software-ready for controlled beta.

Stage 4 remediation is not complete. The exercise catalogue has stronger software gates than the original Stage 4 audit found, but it still has beta-blocking content/product safety gaps for unsupervised adults 45-65: floor-space is still not a real floor-transfer capability, step-up gating proves stairs plus support but not safe step conditions, band work lacks adequate anchor/snap-back cueing, and Explore/manual practice can bypass the daily readiness/discomfort policy used by main-plan generation.

Required decisions:

- STAGE 4R VERIFICATION COMPLETE
- STAGE 4 REMEDIATION STILL REQUIRED
- EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED
- STAGE 5 REMEDIATION COMPLETE
- DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA
- OVERALL BETA RELEASE STILL BLOCKED
- STAGE 3D-B REQUIRED
- BETA DEVICE VALIDATION REQUIRED

## 2. Scope

This audit covered the post-Stage-5 status of remaining Stage 4 exercise-catalogue findings. It reviewed:

- Current exercise registry, ladders, level metadata, prescriptions, voice-cue wiring, and equipment tags.
- Workout generation, equipment safety, daily readiness/discomfort policy, valid-time progression, progression authority, session planning, Explore/manual practice, and session player behavior.
- Prior Stage 4, Stage 4A, Stage 4B, Stage 5, Stage 5A-5H, and upstream Stage 0/2A/3C/3D reports relevant to remaining release blockers.
- Targeted tests for catalogue integrity, set graders, valid time, autoregulation, workout generation, daily context, equipment safety, session planning, Explore/manual, progression evidence, progression, session player, and Stage 5H lifecycle integration.

Out of scope:

- Editing production logic, copy, tests, exercises, scoring, norms, native pose code, config, dependencies, or assets.
- Physical-device validation.
- Medical/domain expert approval.
- Norm provenance remediation required by Stage 3D-B.

## 3. Initial Git Status

Exact initial `git status --short --untracked-files=all`:

```text
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/WelcomeScreen.tsx
?? docs/audits/Hale_Stage_4R_Post_Stage5_Remaining_Findings_Verification_Prompt.md
```

Exact initial `git diff --name-only`:

```text
src/screens/ExploreDetailScreens.tsx
src/screens/WelcomeScreen.tsx
```

Exact initial `git diff --stat`:

```text
 src/screens/ExploreDetailScreens.tsx | 2 +-
 src/screens/WelcomeScreen.tsx        | 2 +-
 2 files changed, 2 insertions(+), 2 deletions(-)
```

The two modified screen files and the untracked Stage 4R prompt were pre-existing user-owned changes. They were not edited by this audit.

## 4. Baseline Validation

Targeted Stage 4R/5H slice:

```text
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/setGraders.test.ts src/exercises/__tests__/validTime.test.ts src/exercises/__tests__/autoregulation.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/dailyTrainingContext.test.ts src/profile/__tests__/equipment.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/sessionPlayer.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: passed, 14 suites, 195 tests.

Required validation commands:

| Command | Result | Notes |
| --- | --- | --- |
| `npm test -- --runInBand` | Pass | 95 suites, 764 tests. Watchman recrawl warning and Jest open-handle notice appeared after successful exit. Backend sync tests printed expected mocked console logs/warnings. |
| `npm run typecheck` | Pass | `tsc --noEmit` exited 0. |
| `npm --prefix website run typecheck` | Pass | Website `tsc --noEmit` exited 0. |
| `npx --no-install expo config --type public` | Pass | Exited 0. Existing Sentry warning: missing organization/project config, environment fallback used. |
| `git diff --check` | Pass | No whitespace errors in tracked diffs. |

## 5. Current Training-Content Architecture

The current training architecture still follows the intended registry pattern:

- Exercise definitions are imported through `src/exercises/index.ts`.
- Ladders and level metadata live in `src/exercises/ladders.ts`.
- Screens and session planning resolve exercises through registry/ladders instead of hardcoding player behavior.
- `src/training/equipmentSafety.ts` centralizes equipment compatibility, including support, stairs, floor space, long band, door anchor, mini-band, and load tags.
- `src/profile/equipment.ts` makes canonical equipment authoritative and requires confirmation for unknown or migrated equipment.
- `src/training/dailyTrainingContext.ts` centralizes readiness/discomfort filtering.
- `src/training/workoutGeneration.ts` selects exercises and emits slot stimulus roles/reasons, safety notes, daily context, and progression policy.
- `src/haleFlow/sessionPlanning.ts` adapts generated sessions, blocks stale or unknown equipment, and keeps manual/preset sessions non-credit.
- `src/haleFlow/progressionEvidence.ts` and Stage 5 tests make main-plan progression authority separate from manual/extras.

This is a strong software base. The remaining Stage 4 blockers are mostly product/content safety definitions and parity paths, not broken registry mechanics.

## 6. Current Catalogue Inventory

Live inventory:

| Metric | Value |
| --- | ---: |
| Registered exercises | 37 |
| Exercise ladders | 11 |
| Ladder levels | 37 |
| V1 core levels | 30 |
| V1 optional levels | 7 |
| Linear progression ladders | 8 |
| Supporting-set ladders | 2 |
| Collection ladders | 1 |
| Measured levels | 15 |
| Camera-assisted levels | 19 |
| Voice-guided levels | 3 |
| Strength/power levels | 25 |
| Balance/stability levels | 6 |
| Mobility/flexibility levels | 6 |
| Dangling exercise definitions | 0 |
| Dangling ladder levels | 0 |

Equipment tags in the current catalogue: `backpack_or_weight`, `chair`, `counter`, `cushion`, `door_anchor`, `floor`, `long_band`, `mini_band`, `none`, `stair`, `wall`.

All current registered exercises and beta disposition:

| Exercise | Release | Current beta verdict |
| --- | --- | --- |
| `sts-cushion` | core | Keep. |
| `sts-standard` | core | Keep. |
| `sts-slow-eccentric` | core | Keep with generic stop-rule cue standard. |
| `sts-power` | core | Keep with generic stop-rule cue standard. |
| `loaded-sit-to-stand` | optional | Hide or gate until load-selection and stop-rule copy is approved. |
| `squat-supported` | core | Keep with support-quality and stop-rule cue standard. |
| `squat-free` | core | Keep with stop-rule cue standard. |
| `squat-slow-eccentric` | optional | Keep optional only after domain review of progression criteria. |
| `squat-loaded` | optional | Hide or gate until load-selection and stop-rule copy is approved. |
| `chair-supported-split-squat` | optional | Hide or gate until prerequisite/readiness policy is explicit. |
| `step-up` | core | Blocked for beta until step-height/surface/support setup is explicitly confirmed/cued. |
| `heel-raise-supported` | core | Keep with support-quality cue standard. |
| `heel-raise-free` | core | Keep with stop-rule cue standard. |
| `toe-raise-supported` | core | Keep with support-quality cue standard. |
| `push-up-wall` | core | Keep. |
| `push-up-incline` | core | Keep with support-surface cue standard. |
| `push-up-standard` | optional | Hide or gate until floor-transfer capability and floor setup cues are explicit. |
| `seated-band-row` | core | Blocked for beta until band inspection/anchor/snap-back cueing is approved. |
| `standing-band-row` | core | Blocked for beta until door-anchor setup and snap-back cueing are approved. |
| `band-pull-apart` | core | Blocked for beta until band inspection/snap-back/eye-clearance cueing is approved. |
| `hip-hinge-wall` | core | Keep. |
| `hip-hinge-free` | core | Keep. |
| `glute-bridge-hold` | core | Blocked for beta until floor-transfer capability is a real gate. |
| `glute-bridge-reps` | core | Blocked for beta until floor-transfer capability is a real gate. |
| `overhead-reach` | core | Keep with shoulder discomfort and comfortable-range cue standard. |
| `overhead-press-band` | core | Blocked for beta until band stance/anchoring/snap-back cueing is approved. |
| `balance-feet-together-hold` | core | Keep with support-quality cue standard. |
| `balance-tandem-hold` | core | Keep with support-quality cue standard. |
| `balance-single-leg-hold` | core | Keep only after balance-confidence prerequisite/gate is explicit. |
| `supported-side-step` | core | Keep with support-quality cue standard. |
| `mini-band-lateral-walk` | optional | Hide or gate until mini-band prerequisite/readiness policy is explicit. |
| `loaded-march` | core | Keep. Current content is unloaded March in Place with support. |
| `seated-hamstring-reach` | core | Keep with comfortable-range cue standard. |
| `thoracic-rotation` | core | Keep with comfortable-range cue standard. |
| `supported-hip-flexor-stretch` | core | Keep with support-quality cue standard. |
| `wall-calf-stretch` | core | Keep with comfortable-range cue standard. |
| `neck-rotation` | optional | Keep optional only; do not use as core default. |

## 7. Original Stage 4 Finding Closure Register

Original Stage 4 finding status, as of Stage 4R:

| Original finding | Stage 4R status | Evidence |
| --- | --- | --- |
| Floor work allowed without floor safety gate | Partially closed | `floor` now maps to canonical `floor_space`, and floor levels mention comfort getting down/up. Still no separate floor-transfer capability. |
| Step-up lacks explicit stair/support requirements | Partially closed | `step-up` requires `stair` plus `counter`; copy says lowest stable step. Still no explicit height/surface/space/footwear/support-quality confirmation. |
| `loaded-march` as unsafe no-equipment loaded balance | Closed | It is now March in Place, support-gated with `counter`, and classified under dynamic balance. |
| Single-leg balance reachable through generic progression | Open | It has support and valid-time metadata, but no extra confidence/prerequisite gate beyond ladder progression. |
| Band row/press safety under-specified | Partially closed | Band/door-anchor equipment gates exist. Cueing still lacks inspection, anchor orientation, snap-back, grip, and eye-clearance standards. |
| Loaded sit-to-stand/squat load selection | Open | Optional levels remain gated by load equipment, but load selection and stop rules are still not specific. |
| Split squat and mini-band prerequisites | Open | Both are optional and excluded from default generation, but prerequisite/readiness gates remain product decisions. |
| Pain filtering misses adjacent stress patterns | Partially closed | Main plan closed by Stage 5E discomfort policy; Explore/manual parity remains incomplete. |
| Generic safety notes omit key stop rules | Partially closed | Some level safety notes exist. No catalogue-wide standard for dizziness, breath holding, sharp pain, unsteadiness, obstacle clearance, or tracking-loss instructions. |
| Support-dependent paths not reliably support-gated | Closed | `counter` resolves through chair/wall support, and generation/manual/Explore share equipment safety checks. Support quality remains a cue issue. |
| Dynamic progression lacks safety-history authority | Partially closed | Stage 5D/5E closed software authority and pain/valid-time holds. Movement-specific domain progression rules remain generic. |
| `loaded-march` name mismatch | Closed | Display name is March in Place; legacy id is documented. |
| Level-numbering/copy mismatch | Partially closed | Ladders are contiguous and tested; Explore still displays `level + 1` labels for collections/supporting sets, which can imply linearity. |
| Mobility as linear ladder | Closed | `mobility-flexibility` is marked `collection`, and tests assert this. |
| Explore/manual guidance generic | Partially closed | Explore surfaces setup/safety notes and equipment gates. Manual practice still has one generic guidance line and no daily-context gate. |
| Equipment labels understate floor/counter nuance | Partially closed | Labels now expose floor space/support/bottom stair/band/door-anchor needs. Floor-transfer and support-quality nuance remain unresolved. |

Closure count across the original Stage 4 register: 5 closed, 8 partially closed, 3 open.

## 8. Floor-Space Versus Floor-Capability Audit

Current behavior:

- Catalogue floor levels: `push-up-standard`, `glute-bridge-hold`, `glute-bridge-reps`.
- `floor` equipment is considered available when canonical equipment includes `floor_space`.
- Ladders say floor levels require explicit floor-space opt-in and comfort getting down/up.
- Dynamic generation, manual practice, and Explore details all respect the `floor_space` equipment gate.
- Tests verify floor-space gating and floor-space labels.

Remaining problem:

`floor_space` confirms room/space, not the user's physical ability to get to and from the floor safely today. The AGENTS/product context makes floor work a safety-sensitive area for adults 45-65. A user can have enough floor space but still lack safe floor-transfer ability, nearby support, or current readiness. Core bridge levels can therefore be selected after only a space confirmation.

Stage 4R finding: F4R-001, P1 beta blocker.

Decision: keep floor work only if a separate floor-transfer capability/readiness gate and floor-transition cue standard are added; otherwise hide floor levels for controlled beta.

## 9. Step-Up Environment/Capability Audit

Current behavior:

- `step-up` is a V1 core level.
- It requires `stair` plus `counter`.
- Equipment safety maps `stair` to canonical `stairs` and `counter` to chair/wall support.
- Generation skips step-up unless stairs plus support are available.
- Manual practice returns null for stairs without support.
- Explore disables the stairs preset without bottom stair/support.
- Copy says lowest stable step, bottom stair, support nearby, and stop if the step/surface/balance feels unsafe.

Remaining problem:

The system still treats "stairs" as sufficient proof of a safe bottom step. It does not explicitly confirm step height, dry/stable surface, footwear, lighting, obstacle clearance, phone placement away from the path, or whether the support is a real rail/counter rather than an unstable chair. The camera cannot infer stair height or surface stability. The prompt explicitly disallows inferring safety from a boolean stairs flag.

Stage 4R finding: F4R-002, P1 beta blocker.

Decision: keep `step-up` only after adding explicit low-step/surface/support setup confirmation and spoken/text stop rules; otherwise demote/hide for beta.

## 10. Balance Safety/Progression Audit

Current behavior:

- Balance holds are support-gated through `counter`.
- `balance-feet-together-hold`, `balance-tandem-hold`, and `balance-single-leg-hold` all use valid-time metadata.
- Single-leg target is shorter than earlier balance rungs.
- Ankle/foot discomfort blocks single-leg balance and dynamic balance in the main plan.
- `loaded-march` is now unloaded March in Place with support.

Remaining problems:

- Single-leg balance can still be reached through the generic linear progression rule after two easy sessions at a level.
- There is no product-level balance-confidence prerequisite beyond recent completion/RPE/pain/tracking.
- Support quality is not verified beyond "chair or wall/counter support" availability.

Stage 4R finding: F4R-006, P2. This is not as severe as the original loaded-march issue, but it needs domain review before broader beta and should be conservative for controlled beta.

## 11. Band/Upper-Body Safety Audit

Current behavior:

- Upper-back pull no longer falls back to unrelated shoulder mobility as if it were equivalent. If no long band is available, the generator records a skipped/transparent stimulus reason.
- Standing row requires both `long_band` and `door_anchor`.
- Explore/manual respect door-anchor availability and fall back to seated band row without the anchor.
- Shoulder band press is explicitly marked `cross_domain_supporting`.

Remaining problems:

- `seated-band-row`, `standing-band-row`, `band-pull-apart`, and `overhead-press-band` lack a complete band safety standard.
- Rows/pull-aparts have empty exercise voice instruction arrays.
- Written copy does not require band inspection, safe grip, eye/face clearance, slow release, anchor height, door closure/orientation, or "do not use a door that opens toward you."
- Overhead band press says "stand tall on a long band or hold it safely," which is not enough for unsupervised band use.

Stage 4R finding: F4R-003, P1 beta blocker.

Decision: keep band work only after a band-safety cue pack is implemented and bundled; otherwise disable band-based core levels for controlled beta.

## 12. External-Load Safety Audit

Current behavior:

- `loaded-sit-to-stand` and `squat-loaded` are `v1_optional`.
- Optional levels are excluded by default in `generateTodaySession`.
- Load equipment resolves only from canonical backpack/dumbbell capability, not ambiguous legacy load.
- Copy states Hale does not infer load from the camera.

Remaining problems:

- No explicit load-selection rule: starting load, maximum effort cap, secure backpack setup, grip, breath-holding warning, or stop rules.
- No extra prerequisite gate beyond optional status and equipment capability.

Stage 4R finding: F4R-005, P2.

Decision: hide/gate optional load levels for controlled beta unless load selection and stop-rule copy is approved.

## 13. Cueing and Stop-Rule Audit

Current behavior:

- The player speaks intro, framing-ready, exercise instruction cues, countdown, rest, transitions, and completion.
- Family-level cues exist for many exercises.
- Generated exercises carry `safetyNotes`.
- Explore details display setup/safety/measurement notes.

Remaining problems:

- Several active catalogue definitions have empty voice instruction arrays: rows, pull-aparts, lateral stability timer drills, and mobility timer drills.
- `safetyNotesFor` is shallow: floor, stair, support, voice-guided comfortable range, otherwise nothing.
- No consistent catalogue standard for: sharp pain, dizziness/lightheadedness, chest discomfort, breath holding, unstable surfaces, obstacle clearance, camera/tracking loss, support quality, band snap-back, load selection, or floor-transfer stop rules.
- Learn articles contain helpful general discomfort guidance, but this is not equivalent to spoken session-path cueing.

Stage 4R finding: F4R-004, P1 beta blocker.

Decision: Stage 4 is not complete until a minimum cue/stop-rule standard exists for core exercises and safety-sensitive optional exercises are hidden or gated.

## 14. Progression-Content Audit

Current behavior:

- Stage 5D/5E made progression authority software-safe: only credited current main-plan work can improve ladder progress, feedback is required, valid-time incomplete/uncertain work holds or regresses conservatively, pain/readiness can force hold-only or ineligible policy, and evidence is idempotent.
- Ladders have `progressionModel` values to distinguish linear, supporting set, and collection.

Remaining problems:

- Linear progression remains generic: two easy complete sessions at the same level can promote.
- There are no movement-specific progression prerequisites for step-up, floor bridge, single-leg balance, load, or band work.
- Optional advanced levels are hidden from default generation, which reduces risk, but beta policy should explicitly decide whether Explore/manual can expose them later.

Stage 4R finding: F4R-008, P2.

Decision: software progression is safe enough to continue; content progression needs domain review before marking the catalogue fully ready.

## 15. Mobility Collection Audit

Current behavior:

- `mobility-flexibility` is marked `collection`.
- Tests assert the collection model and exact mobility level list.
- Generation can use available mobility items without treating them as linear endpoints.
- `neck-rotation` is optional and hidden from default V1 core detail.

Remaining concerns:

- Explore still uses "Level N" labels for collection entries via `level + 1`, which can imply progression.
- There is not yet a rotation/coverage policy that decides how often each mobility drill should appear across a block.
- Some mobility timer drills have empty voice instructions.

Stage 4R finding: F4R-009, P3.

Decision: mobility collection semantics are largely closed, but UI/cue polish remains.

## 16. Minimal-Equipment/Product-Promise Audit

Current behavior:

- "No equipment" start is not literal absence of support: the no-equipment adjustment intentionally keeps chair/wall as the zero-optional-gear safety baseline.
- Upper-back pull is honest when a band is missing and records `band_required` rather than substituting unrelated mobility.
- Step, band, mini-band, load, and floor levels are avoided when the matching canonical capability is missing.

Remaining product decision:

The V1 promise should be phrased as "start with a chair and wall, with optional equipment expanding the programme," not "full no-equipment strength programme." Without a band, the product cannot deliver true upper-back pulling stimulus. Without a floor-transfer gate, floor work should not be represented as automatically available from space alone.

Stage 4R finding: F4R-010, P3 product-positioning decision.

## 17. Pain/Readiness Parity Outside Main Plan

Current behavior:

- Main-plan generation uses daily readiness and pain/discomfort areas.
- Discomfort blocks adjacent risky patterns: shoulder blocks push/pull/overhead; hip/back blocks hinge/bridge/step/squat; ankle blocks balance/march/lateral/step/calf; knee blocks dynamic balance/step/squat; neck blocks neck rotation.
- Malformed daily context fails closed.
- Extra preset planning through `planTodayHaleSession` can accept readiness/pain fields if supplied.

Remaining problem:

Manual ladder practice has no daily readiness or pain/discomfort fields in `PlanLadderPracticeSessionInput`. It is equipment-gated and non-credit, but it can still create a player-compatible practice session for a ladder whose movement pattern would have been blocked or downgraded in the main plan. Explore card generation also only checks equipment/safety profile, not daily discomfort.

Stage 4R finding: F4R-007, P2.

Decision: controlled beta needs either daily-context parity for Explore/manual starts or a conservative "manual practice requires ready/no discomfort confirmation" interstitial.

## 18. Session Structure/Duration Audit

Current behavior:

- Main templates are 18-20 minutes; short sessions are about 10 minutes.
- Exercise estimates are bounded by prescription, rest, and template estimates.
- Presets include mobility reset, gentle restart, steady balance, chair/wall strength, band upper-back, stairs confidence, and quick full-body.
- Session player handles intro, setup, active sets, rests, transitions, and completion.

Remaining concern:

There is no explicit warm-up item in the session template structure. Some sessions start directly with strength or balance. This is mitigated by lower-dose beginner/readiness logic and movement-specific setup, but a conservative beta cue standard should include a brief "start easy on the first set" or warm-up progression policy.

Decision: not a standalone beta blocker if cue remediation lands; otherwise it contributes to F4R-004.

## 19. Measurement-to-Training Alignment

Current behavior:

- Stage 3C/3D focus selection work and Stage 5 generator metadata keep weakest-domain focus and supporting/fallback roles explicit.
- Upper-pull no-band dilution is transparent.
- Cross-domain shoulder press is marked supporting rather than a mobility endpoint.
- Main-plan credit is limited to planned primary focus work matching the active focus.
- Mobility, balance, and strength sessions retain supporting work without falsely crediting the wrong domain.

Remaining concern:

Measurement-to-training is software-sound, but domain experts still need to approve whether current ladder progressions are the right content response to measured deficits, especially for floor, step, balance, and band work.

Decision: no new Stage 5 software blocker; keep Stage 4 domain-review requirement.

## 20. Explore/Manual-Practice Audit

Current behavior:

- Explore extra sessions are equipment-gated.
- Band and stairs presets are disabled when required equipment/support is missing.
- Movement ladder details show current level, equipment, setup, safety, measurement notes, and easier/harder levels.
- Manual practice sessions are non-credit and player-compatible.
- Manual practice respects floor, stair/support, balance support, and door-anchor constraints.

Remaining problems:

- Manual practice guidance is generic: "Keep support nearby and move comfortably."
- Manual practice does not ask daily readiness/discomfort.
- Explore detail can show exercise notes, but starting practice does not enforce the same daily safety policy as the main plan.
- Collections/supporting sets can still appear through level framing.

Decision: Explore/manual is not a progression-authority risk, but it is a safety-parity risk before controlled beta.

## 21. Test-Quality/False-Confidence Audit

The current tests are valuable and broad:

- Catalogue integrity verifies registry/ladders, release status, metadata, cross-domain guardrails, collection semantics, and legacy id resolution.
- Workout generation verifies equipment gates, no-band honesty, no-equipment transparency, daily readiness/pain policy, valid-time progression, extras, optional filtering, and debug scenarios.
- Session planning verifies generated output validation, equipment snapshots, manual/extras non-credit, floor/stair/support/band gating, schedule truth, daily-context behavior, and progression updates.
- Stage 5H integration covers lifecycle, pairwise adversarial cases, property scenarios, corruptions, crash/retry, restore/schema, UI truthfulness, and user-boundary payloads.

False-confidence gaps:

- Tests assert that floor levels mention floor/floor-space, not that floor-transfer capability exists.
- Tests assert step-up mentions support/lowest stable step, not height/surface/footwear/obstacle confirmation.
- Tests assert band and door-anchor gates, not band snap-back/anchor safety cues.
- Tests do not require non-empty voice cues for every core exercise family.
- Tests do not require manual practice to receive or enforce daily discomfort/readiness.
- Tests do not require movement-specific progression prerequisites for high-risk levels.

Decision: test suite supports Stage 5 readiness, but cannot close Stage 4 content safety on its own.

## 22. Physical-Device/Domain-Review Dependency Map

Remaining dependencies before beta release:

| Dependency | Why it matters | Status |
| --- | --- | --- |
| Floor-transfer capability | Space is not ability to get down/up safely. | Required for floor bridge/push-up. |
| Stair environment validation | Camera cannot infer safe step height/surface/support. | Required for step-up. |
| Band/door-anchor safety review | Band snap-back and anchor misuse are plausible home hazards. | Required for rows, pull-aparts, band press. |
| Load selection review | Camera cannot infer load/tension/securement. | Required before loaded optional levels. |
| Balance progression review | Single-leg progression needs conservative prerequisite policy. | Required before broad rollout. |
| Cue standard and bundled audio | Audio-first law requires safety-critical guidance in session path. | Required for catalogue readiness. |
| Real-device pose validation | Camera readiness/grading must be confirmed in real homes. | Required by prior beta blockers. |
| Norm provenance/copy audit | Stage 3D-B remains required for scoring credibility. | Required before beta release. |

## 23. Current Finding Register

| ID | Severity | Finding | Beta impact |
| --- | --- | --- | --- |
| F4R-001 | P1 | `floor_space` is not a floor-transfer capability; core floor bridge can be selected with only floor-space availability. | Blocks catalogue readiness. |
| F4R-002 | P1 | Step-up proves stairs plus support, not safe step height/surface/space/footwear/support quality. | Blocks catalogue readiness. |
| F4R-003 | P1 | Band and door-anchor safety cueing is insufficient for rows, pull-aparts, and overhead press. | Blocks catalogue readiness. |
| F4R-004 | P1 | No catalogue-wide spoken/text stop-rule standard for dizziness, sharp pain, breath holding, unsteadiness, obstacle clearance, tracking loss, support quality, floor, stair, band, and load hazards. | Blocks catalogue readiness. |
| F4R-005 | P2 | Optional loaded levels lack load-selection and load stop rules. | Hide/gate before beta. |
| F4R-006 | P2 | Single-leg balance lacks a stronger balance-confidence prerequisite beyond generic progression. | Needs domain review/gate. |
| F4R-007 | P2 | Explore/manual practice is equipment-gated and non-credit but does not enforce main-plan daily discomfort/readiness parity. | Needs safety-parity fix. |
| F4R-008 | P2 | Progression authority is software-safe, but movement-specific progression prerequisites remain generic. | Needs domain review. |
| F4R-009 | P3 | Mobility collection is modeled correctly, but UI labels/rotation policy can still imply linear levels. | Polish/content improvement. |
| F4R-010 | P3 | Minimal-equipment positioning needs product clarity: chair/wall start is true; full no-equipment coverage is not. | Product copy decision. |

No P0 finding was identified in Stage 4R because optional high-risk levels are excluded by default and core risky levels have partial gates. The P1 findings are enough to block unsupervised controlled beta catalogue readiness.

## 24. Stage 4A-4G Reconciliation

Stage 4A closed a major class of software issues by adding shared equipment safety gates across generator, manual, and Explore. It reduced immediate risk for floor, stairs, support, no-band upper-pull substitution, and manual/Explore equipment paths.

Stage 4B closed key semantic issues by adding progression model/stimulus semantics, honest skipped/invalid/fallback reasons, support for upper-pull no-band honesty, door-anchor distinction, static/dynamic balance split, and mobility collection semantics.

Stage 5A-5H then closed dynamic generation software authority: credit identity, fallback exclusion, current main-plan authority, daily pain/readiness filtering, canonical equipment, schedule/retest timing, and lifecycle/property coverage.

What did not close:

- Product-level floor-transfer ability.
- Step-up environment confirmation.
- Band/door-anchor cue safety.
- Catalogue-wide stop rules and bundled audio coverage.
- Manual/Explore daily-context parity.
- Domain-reviewed movement-specific progression gates.

Stage 4C-4G work therefore remains required as content/product remediation, not because the Stage 5 generator is unstable.

## 25. Product-Decision Packet

Recommended product decisions before beta:

1. Define a floor-work policy:
   - Option A: add a separate floor-transfer capability/readiness confirmation and cue pack.
   - Option B: hide floor bridge/floor push-up for controlled beta.

2. Define a step-up policy:
   - Require bottom stair, low stable step, dry uncluttered surface, footwear/lighting check, phone outside path, and real support/rail/counter confirmation.
   - Otherwise demote step-up from core beta.

3. Define a band policy:
   - Require band inspection, no damaged bands, safe grip, slow return, eye/face clearance, door-anchor orientation, closed/locked door guidance, and no door opening toward user.
   - Add bundled voice cues before band core levels are enabled.

4. Define a stop-rule standard:
   - Every core exercise should have a session-path cue for sharp pain, dizziness/lightheadedness, breath holding, unstable support/surface, and stopping safely.

5. Define manual/Explore policy:
   - Either require ready/no discomfort before practice, or pipe current daily context into manual/extras and block/filter the same patterns as main-plan generation.

6. Define optional level policy:
   - Keep load, split squat, floor push-up, mini-band lateral walk, and neck rotations hidden/gated unless explicitly approved for the beta cohort.

## 26. Recommended Remaining Remediation Batches

Batch 4C - Safety capability gates:

- Split `floor_space` from floor-transfer ability.
- Add step-up environment confirmation.
- Add manual/Explore daily readiness/discomfort gate.

Batch 4D - Safety cue standard:

- Add catalogue-level required safety cue fields.
- Add bundled audio keys/files for band, floor, stair, load, support, dizziness, sharp pain, and breath-holding stop rules.
- Require non-empty instructions for every core beta exercise or a documented no-spoken-cue exemption.

Batch 4E - Advanced/optional gating:

- Hide or explicitly gate loaded levels, standard push-up, split squat, mini-band lateral walk, and neck rotation.
- Ensure Explore cannot start hidden optional levels accidentally.

Batch 4F - Movement-specific progression:

- Add domain-reviewed gates for single-leg balance, step-up, floor work, band work, and loaded levels.
- Keep generic two-exposure progression for low-risk levels only.

Batch 4G - Test hardening:

- Add tests for floor-transfer capability versus floor space.
- Add tests for step-up environment confirmation.
- Add tests for manual/Explore discomfort parity.
- Add tests that core beta exercises have approved safety cues.
- Add tests for optional-level beta visibility policy.

## 27. Controlled-Beta Catalogue Readiness

Controlled beta catalogue decision: EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED.

Reason:

- The catalogue is structurally coherent and well-tested.
- The generator and planner are software-ready.
- Equipment gates significantly reduce the original Stage 4 risk.
- However, multiple P1 content/product safety gaps remain on V1 core exercises that a controlled-beta user could receive unsupervised: step-up, floor bridge, band rows/pull-aparts, and band overhead press.
- Manual/Explore practice can still create non-credit sessions outside the main daily discomfort/readiness policy.

Catalogue can become controlled-beta ready after:

- F4R-001 through F4R-004 are closed.
- F4R-007 is closed or explicitly mitigated by a conservative start confirmation.
- Optional advanced levels are hidden/gated per F4R-005/F4R-006.

## 28. Remaining Non-Stage-4 Beta Blockers

Non-Stage-4 blockers remain:

- STAGE 3D-B REQUIRED: norm provenance, extrapolated bands, and scoring-source audit remain a beta blocker.
- BETA DEVICE VALIDATION REQUIRED: real-device camera readiness, pose pipeline, audio, session flow, and home-environment validation remain required.
- Native iOS/Android release-device verification remains required before beta despite software test pass.

Stage 5 is not a remaining blocker based on the current evidence.

## 29. Final Stage Decisions

STAGE 4R VERIFICATION COMPLETE

STAGE 4 REMEDIATION STILL REQUIRED

EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED

## 30. Final Git Status

Exact final `git status --short --untracked-files=all`:

```text
 M App.tsx
 M src/history/fsAdapter.ts
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/WelcomeScreen.tsx
?? docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
?? docs/audits/Hale_Stage_4R_Post_Stage5_Remaining_Findings_Verification_Prompt.md
```

Exact final `git diff --name-only`:

```text
App.tsx
src/history/fsAdapter.ts
src/screens/ExploreDetailScreens.tsx
src/screens/WelcomeScreen.tsx
```

Exact final `git diff --stat`:

```text
 App.tsx                              | 115 +++++++++++++++++++++++------------
 src/history/fsAdapter.ts             |  86 +++++++++++++++-----------
 src/screens/ExploreDetailScreens.tsx |   7 ++-
 src/screens/WelcomeScreen.tsx        |   2 +-
 4 files changed, 132 insertions(+), 78 deletions(-)
```

Note: `App.tsx` and `src/history/fsAdapter.ts` appeared as modified after the initial preflight snapshot. They were not edited, staged, reverted, or interpreted as audit-owned changes. This audit's only repo file addition is `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md`.
