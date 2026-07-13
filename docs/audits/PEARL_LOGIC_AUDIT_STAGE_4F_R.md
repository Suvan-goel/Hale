# PEARL LOGIC AUDIT - STAGE 4F-R MOVEMENT-SPECIFIC PROGRESSION

Date: 2026-06-22
Workspace: `/Users/suvangoel/Pearl`
Mode: read-only audit/product decision, except this new report.

## 1. Executive verdict

Stage 4F-R audit work is complete: the prior reports were read, current progression architecture was traced, every current ladder and controlled-beta transition was inventoried, targeted and full validation passed, and no production code, tests, assets, config, dependencies, lockfiles, branches, commits, staging, or pushes were changed by this audit.

The progression/content verdict is not complete for controlled beta. The current software shell is strong: release caps, safety cues, start-time planning gates, valid-time signals, daily-context hold-only behavior, schedule credit, idempotent progression event IDs, restore preservation, and audio verification all pass. The blocker is F4R-008: generic "two easy credited sessions" progression is still applied to all ladder IDs, including ladders marked `supporting_set` and `collection`, and several "linear" ladders contain movement-specific jumps that need explicit gates, lower beta ceilings, or domain/device validation before automatic progression can be trusted.

Final decision: Stage 4F-R audit complete; F4R-008 remediation required; core progression software/content blocked; Stage 4G-R blocked until the progression remediation is implemented and validated.

## 2. Scope

Included:
- Prior Stage 4 and Stage 5 remediation/verification report review.
- Current exercise ladder catalogue and release policy.
- Dynamic workout generation and progression decision logic.
- Authoritative progression evidence, schedule credit, daily context, valid-time gating, restore/persistence, Explore/manual practice, and safety/audio test coverage.
- Every controlled-beta visible ladder and transition.
- Read-only runtime probes using temporary files under `/private/tmp`, removed after execution.
- Required baseline validation commands.

Excluded:
- No code remediation.
- No audio regeneration.
- No package installation.
- No dependency or lockfile edits.
- No branch, commit, stage, or push.
- No runtime provider calls.
- No provider secret or `.env` content inspection.

## 3. Initial Git status

Initial status captured before the audit work in this continuation:

```text
 M src/screens/CheckUpScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/training/microCheck.ts
 M website/app/globals.css
 M website/src/components/LandingPage.tsx
 M website/src/config/brand.ts
?? docs/audits/Pearl_Stage_4F_R_Movement_Specific_Progression_Audit_Prompt.md
?? website/public/app-screens/pearl-explore.png
?? website/public/app-screens/pearl-plan.png
?? website/public/app-screens/pearl-progress.png
```

Initial diff name list:

```text
src/screens/CheckUpScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/training/microCheck.ts
website/app/globals.css
website/src/components/LandingPage.tsx
website/src/config/brand.ts
```

Initial diff stat:

```text
 src/screens/CheckUpScreen.tsx          |    2 +-
 src/screens/MicroCheckScreen.tsx       | 1003 +++++++++++++++++++++++++++++---
 src/screens/TrainingSessionScreen.tsx  |   14 +-
 src/training/microCheck.ts             |   13 +
 website/app/globals.css                |   98 ++--
 website/src/components/LandingPage.tsx |   77 ++-
 website/src/config/brand.ts            |    5 +
 7 files changed, 1071 insertions(+), 141 deletions(-)
```

Those changes were treated as user/external work. I did not edit them.

## 4. Baseline validation

Targeted command:

```bash
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/releasePolicy.test.ts src/exercises/__tests__/validTime.test.ts src/exercises/__tests__/setGraders.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/dailyTrainingContext.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/store.test.ts src/training/__tests__/safetyCues.test.ts src/training/__tests__/sessionPlayer.test.ts src/profile/__tests__/equipment.test.ts src/profile/__tests__/movementCapabilities.test.ts src/profile/__tests__/serialize.test.ts src/pearlFlow/__tests__/progressionEvidence.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/pearlFlow/__tests__/exploreViewModel.test.ts src/pearlFlow/__tests__/focusStimulusEvidence.test.ts src/pearlFlow/__tests__/mainPlanEvents.test.ts src/pearlFlow/__tests__/blockSchedule.test.ts src/pearlFlow/__tests__/sessionWorkEvidence.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts src/audio/__tests__/safetyAudio.test.ts src/audio/__tests__/voicePlayer.test.ts src/services/backend/__tests__/restoreService.test.ts
```

Targeted result: PASS. Test suites: 25 passed, 25 total. Tests: 300 passed, 300 total. Snapshots: 0 total. Time: 4.898 s, estimated 5 s.

Targeted warnings:
- Watchman recrawl warning.
- Jest did not exit one second after test completion warning.

Audio verification:

```bash
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

Full suite:

```bash
npm test -- --runInBand
```

Result: PASS. Test suites: 101 passed, 101 total. Tests: 823 passed, 823 total. Snapshots: 0 total. Time: 11.993 s, estimated 12 s.

Full-suite warnings:
- Watchman recrawl warning.
- Jest did not exit one second after test completion warning.
- Expected backend sync test console logs/warnings from mocked sync failure paths.

App typecheck:

```bash
npm run typecheck
```

Result: PASS.

Website typecheck:

```bash
npm --prefix website run typecheck
```

Result: PASS.

Expo config:

```bash
npx --no-install expo config --type public
```

Result: PASS. Expo loaded `.env` and printed environment variable names only, not values. Sentry plugin warned that organization/project config is missing and environment variables will be used as build fallback.

Git whitespace:

```bash
git diff --check
```

Result: PASS, no output.

Expo export:

```bash
rm -rf /tmp/pearl-stage4dr1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage4dr1-export
rc=$?
rm -rf /tmp/pearl-stage4dr1-export
exit $rc
```

Result: PASS. iOS bundled `index.ts` in 5997 ms with 1568 modules. Android bundled `index.ts` in 11123 ms with 1826 modules. Export reported 380 assets, one iOS bundle, one Android bundle, and `metadata.json`. The temporary export directory was removed.

Export warnings:
- Expo loaded `.env` and printed environment variable names only, not values.
- Sentry plugin missing organization/project config warning.
- Node warnings that `NO_COLOR` is ignored because `FORCE_COLOR` is set.

Temporary diagnostic files:
- Temporary Jest probe files under `/private/tmp` were removed.
- `/tmp/pearl-stage4dr1-export` was removed.
- A final `find /tmp /private/tmp` check for `pearl-stage4fr-*` and `pearl-stage4dr1-export` returned no files.

## 5. Current progression architecture

Architecture summary:
- Exercise definitions self-register through `src/exercises/index.ts` and `src/exercises/registry.ts`.
- Ladder metadata lives in `src/exercises/ladders.ts`.
- Controlled-beta release visibility and caps live in `src/exercises/releasePolicy.ts`.
- Session generation and generic ladder progression live in `src/training/workoutGeneration.ts`.
- Daily-context progression policy lives in `src/training/dailyTrainingContext.ts`.
- Valid-time progression signals live in `src/training/validTimeProgression.ts`.
- Authoritative progression evidence and idempotent event application live in `src/pearlFlow/progressionEvidence.ts`.
- Planning/start-time gates, manual practice, generated-session metadata, release snapshots, movement capability snapshots, equipment snapshots, and safety cue snapshots live in `src/pearlFlow/sessionPlanning.ts`.
- Explore display and manual ladder details use release-capped current levels through `src/pearlFlow/exploreViewModel.ts`.
- Persistence uses `TrainingState.ladderProgressById`, `appliedProgressionEventIds`, and generated-session summaries in `src/training/serialize.ts` and `src/training/dynamicState.ts`.

The main runtime chain is:

1. Block focus and schedule select a template.
2. `generateTodaySession` chooses ladder levels from persisted progress, release caps, daily context, equipment, movement capability, and discomfort filters.
3. `planTodayPearlSession` adapts generated exercises into a `PearlSessionPlan` with snapshots.
4. Completion is classified for main-plan/schedule credit.
5. `applyProgressionEvidenceFromSession` builds per-ladder evidence events only from credited current main-plan completions with feedback.
6. `applyProgressionEvidence` applies events once by event ID.
7. `updateLadderProgressAfterSession` mutates `currentLevelId`, counters, recent completion/RPE/pain arrays, and tracking fields.

Key boundary: the generic mutation function does not branch on `ExerciseLadder.progressionModel`. If an evidence event reaches it, `linear_progression`, `supporting_set`, and `collection` ladders all use the same adjacent-level mutation rules.

## 6. Current threshold/evidence contract

Progression input eligibility:
- Source must be current main-plan generated work, not manual, preset, legacy, or supporting-only.
- Completion must be credited by schedule.
- Template/date identities must match the active block and plan.
- Post-session feedback must provide perceived effort and pain state.
- Exercise result must match generated exercise metadata, ladder, level, and stimulus role.
- Fallback, skipped, invalid, mismatched, duplicate, conflicting-level, and missing-feedback evidence is excluded.

Generic progression thresholds:
- Recent evidence window: last 4 values.
- Easy completion: completion rate >= 0.85 and average RPE <= 3, with no recent pain.
- Promotion: 2 easy completions at the current level.
- Hold: RPE 4 or neutral/non-easy completion.
- First difficulty: pain, average RPE >= 5, completion rate < 0.6, or valid-time incomplete increments failure and resets easy counter.
- Regression: pain immediately, 2 failed sessions, or average completion < 0.6.
- Poor tracking: resets easy counter and holds without regression.
- Valid-time `strong`: can count toward the two-exposure promotion rule.
- Valid-time `completed_with_resets`: holds and resets easy/failure counters.
- Valid-time `incomplete`: difficulty signal and possible regression after repeated failure.
- Valid-time `tracking_uncertain`: hold/reset without regression.
- Release caps: adjacent-level selection skips hidden optional levels and holds at the highest controlled-beta level.

Policy behavior:
- `normal`: favorable evidence may progress, conservative evidence may regress.
- `hold_only`: favorable evidence is recorded but held; conservative evidence can still apply regression/hold.
- `ineligible`: no evidence is applied.

## 7. Ladder and transition inventory

Runtime probe result:
- Ladders: 11.
- Total registered ladder levels: 37.
- Controlled-beta available levels: 30.
- Controlled-beta hidden optional levels: 7.

Inventory:

| Ladder | Model | Available controlled-beta levels | Hidden optional levels | Highest beta level |
| --- | --- | --- | --- | --- |
| sit-to-stand | linear_progression | sts-cushion, sts-standard, sts-slow-eccentric, sts-power | loaded-sit-to-stand | sts-power |
| squat | linear_progression | squat-supported, squat-free | squat-slow-eccentric, squat-loaded, chair-supported-split-squat | squat-free |
| step-up | linear_progression | step-up | none | step-up |
| heel-toe-raise | linear_progression | heel-raise-supported, heel-raise-free, toe-raise-supported | none | toe-raise-supported |
| push | linear_progression | push-up-wall, push-up-incline | push-up-standard | push-up-incline |
| pull-upper-back | linear_progression | seated-band-row, standing-band-row, band-pull-apart | none | band-pull-apart |
| hinge-glutes | linear_progression | hip-hinge-wall, hip-hinge-free, glute-bridge-hold, glute-bridge-reps | none | glute-bridge-reps |
| shoulder-reach-press | supporting_set | overhead-reach, overhead-press-band | none | overhead-press-band |
| balance | linear_progression | balance-feet-together-hold, balance-tandem-hold, balance-single-leg-hold | none | balance-single-leg-hold |
| lateral-stability | supporting_set | supported-side-step, loaded-march | mini-band-lateral-walk | loaded-march |
| mobility-flexibility | collection | seated-hamstring-reach, thoracic-rotation, supported-hip-flexor-stretch, wall-calf-stretch | neck-rotation | wall-calf-stretch |

Forward transitions observed after a second easy credited exposure:

| Ladder | Transition result |
| --- | --- |
| sit-to-stand | sts-cushion -> sts-standard; sts-standard -> sts-slow-eccentric; sts-slow-eccentric -> sts-power; sts-power -> sts-power |
| squat | squat-supported -> squat-free; squat-free -> squat-free |
| step-up | step-up -> step-up |
| heel-toe-raise | heel-raise-supported -> heel-raise-free; heel-raise-free -> toe-raise-supported; toe-raise-supported -> toe-raise-supported |
| push | push-up-wall -> push-up-incline; push-up-incline -> push-up-incline |
| pull-upper-back | seated-band-row -> standing-band-row; standing-band-row -> band-pull-apart; band-pull-apart -> band-pull-apart |
| hinge-glutes | hip-hinge-wall -> hip-hinge-free; hip-hinge-free -> glute-bridge-hold; glute-bridge-hold -> glute-bridge-reps; glute-bridge-reps -> glute-bridge-reps |
| shoulder-reach-press | overhead-reach -> overhead-press-band; overhead-press-band -> overhead-press-band |
| balance | balance-feet-together-hold -> balance-tandem-hold; balance-tandem-hold -> balance-single-leg-hold; balance-single-leg-hold -> balance-single-leg-hold |
| lateral-stability | supported-side-step -> loaded-march; loaded-march -> loaded-march |
| mobility-flexibility | seated-hamstring-reach -> thoracic-rotation; thoracic-rotation -> supported-hip-flexor-stretch; supported-hip-flexor-stretch -> wall-calf-stretch; wall-calf-stretch -> wall-calf-stretch |

Backward transitions observed on pain:

| Ladder | Regression result |
| --- | --- |
| sit-to-stand | sts-standard -> sts-cushion; sts-slow-eccentric -> sts-standard; sts-power -> sts-slow-eccentric |
| squat | squat-free -> squat-supported |
| step-up | step-up -> step-up |
| heel-toe-raise | heel-raise-free -> heel-raise-supported; toe-raise-supported -> heel-raise-free |
| push | push-up-incline -> push-up-wall |
| pull-upper-back | standing-band-row -> seated-band-row; band-pull-apart -> standing-band-row |
| hinge-glutes | hip-hinge-free -> hip-hinge-wall; glute-bridge-hold -> hip-hinge-free; glute-bridge-reps -> glute-bridge-hold |
| shoulder-reach-press | overhead-press-band -> overhead-reach |
| balance | balance-tandem-hold -> balance-feet-together-hold; balance-single-leg-hold -> balance-tandem-hold |
| lateral-stability | loaded-march -> supported-side-step |
| mobility-flexibility | thoracic-rotation -> seated-hamstring-reach; supported-hip-flexor-stretch -> thoracic-rotation; wall-calf-stretch -> supported-hip-flexor-stretch |

## 8. Progression-semantic classification

Semantically linear enough for a generic adjacent-level model only after movement-specific gates:
- sit-to-stand: mostly linear, but power transition needs its own gate.
- squat: supported to free is a support-removal transition, not just more reps.
- push: wall to incline changes setup load and support height.
- balance: static base narrowing is linear-ish, but single-leg requires explicit capability and real-device validation.

Not safely linear as encoded:
- heel-toe-raise: heel raise to toe raise changes target movement.
- pull-upper-back: seated row, standing row, and pull-apart change setup, anchor, plane, and measurement tier.
- hinge-glutes: hip hinge to floor bridge changes posture, environment, and movement family.

Single-level:
- step-up: no automatic forward transition, but selection itself depends on step environment and device validation.

Non-linear labels that are not enforced by mutation:
- shoulder-reach-press is `supporting_set`, but can auto-progress from reach to band press.
- lateral-stability is `supporting_set`, but can auto-progress from side step to march, skipping hidden mini-band.
- mobility-flexibility is `collection`, but can auto-progress through unrelated mobility drills as if they were harder levels.

## 9. Current decision-behavior probes

Probe command was a temporary Jest test under `/private/tmp`, removed after execution:

```bash
npx --no-install jest --runInBand --roots /private/tmp --testRegex 'pearl-stage4fr-probe.*\.test\.ts$' --silent=false --watchman=false
```

Probe result: PASS, 1 temporary test.

Representative generic progression behavior:
- One easy sit-to-stand exposure at `sts-standard`: stays `sts-standard`, `readyToProgress=true`.
- Second easy sit-to-stand exposure at `sts-standard`: progresses to `sts-slow-eccentric`.
- RPE 4 after one easy exposure: holds current level.
- First RPE 5 exposure: records one failure.
- Second RPE 5 exposure at `sts-standard`: regresses to `sts-cushion`.
- Pain at `sts-slow-eccentric`: regresses to `sts-standard`.
- Poor tracking after one easy exposure: holds and clears ready-to-progress.

Valid-time behavior:
- `strong` balance evidence after one prior easy exposure: progresses feet-together to tandem.
- `completed_with_resets`: holds feet-together.
- repeated `incomplete`: regresses tandem to feet-together.
- `tracking_uncertain`: holds tandem.

Policy behavior:
- `hold_only` favorable evidence: decision held, diagnostic `progression_held_by_policy`.
- `hold_only` painful evidence at `sts-slow-eccentric`: conservative regression to `sts-standard`.
- duplicate event ID: diagnostic `duplicate_progression_event`.
- squat at beta cap (`squat-free`) after easy evidence: decision held with diagnostics `progression_applied` and `release_cap_reached`.

Most important probe finding:
- `supporting_set` and `collection` ladders progress through adjacent levels when they receive credited evidence. The `progressionModel` metadata does not prevent mutation.

## 10. Sit-to-stand audit

Verdict: domain/device validation required before automatic full-ladder beta. A lower beta ceiling or explicit power gate is needed.

What is strong:
- Well-aligned to the assessment chair stand.
- Side-view camera spec and near-side chain are consistent with product pose-detection rules.
- Standard, slow-lower, and power variants are coherent as a family.
- Optional loaded sit-to-stand is hidden and release-capped to power.
- Pain, RPE, completion, tracking, and valid-time fallback rules avoid aggressive progression when evidence is poor.

Risks:
- Standard -> slow-lower is a tempo/control change that RPE/completion alone does not prove.
- Slow-lower -> power changes intent to speed/power; it needs movement-specific velocity evidence or an explicit power-readiness gate.
- The current rule can promote to `sts-power` after two easy slow-eccentric sessions even without using the chair-stand rise-velocity trend as a gate.
- `sts-power` is the current controlled-beta cap. Release cap stops loaded progression, but not power exposure.

Controlled-beta recommendation:
- Allow `sts-cushion` and `sts-standard`.
- Permit `sts-slow-eccentric` only after explicit cadence/session validation.
- Keep `sts-power` behind a movement-specific gate or device-validation flag.

## 11. Squat audit

Verdict: remediation required. Current beta should not auto-remove support using only generic completion/RPE evidence.

What is strong:
- Optional slow, loaded, and split squat levels are hidden.
- `squat-free` is the current beta cap.
- Knee discomfort blocks sensitive squat variants.
- Support equipment and setup notes are present for `squat-supported`.

Risks:
- `squat-supported` -> `squat-free` removes support and increases balance/control demand.
- Generic evidence does not verify support independence, depth tolerance, knee comfort across days, or tracking stability in free stance.
- The only controlled-beta transition is the support-removal transition, so the ladder needs a bespoke gate or a lower ceiling.

Controlled-beta recommendation:
- Keep supported squat as default.
- Either cap squat at `squat-supported` or add an explicit support-removal readiness check.

## 12. Step-up audit

Verdict: domain/device validation required. No automatic forward transition exists, but selection itself is safety-critical.

What is strong:
- Single controlled-beta level only.
- Requires stair plus support.
- Movement capability gate requires confirmed low stable step, fixed support, clear dry area, and phone out of path.
- Equipment fallback and start-time planning guards exist.
- Safety audio covers step, support, tracking, and stop rules.

Risks:
- Step-up selection still depends on a home stair and phone placement that must be validated on real devices.
- Generic progression can update only counters because the ladder has one level, but the selection threshold for including step-up in strength templates still needs domain/device evidence.
- Step-up appears as a power/functional finisher; it should not become a default substitute for lower-body progression without environmental confirmation.

Controlled-beta recommendation:
- Keep single-level step-up only with existing capability gates.
- Require beta device validation before broad release.

## 13. Heel/toe audit

Verdict: remediation required. Reclassify or split before relying on automatic progression.

What is strong:
- Support and free heel raise are plausible progression siblings.
- Timer-based supported toe raise avoids fragile toe-rep counting.
- Ankle discomfort blocks related items.

Risks:
- `heel-raise-free` -> `toe-raise-supported` changes movement target from plantarflexion to dorsiflexion.
- Toe raise is more like accessory balance/ankle practice than a harder heel raise.
- Current regression from toe raise to heel raise is also semantically odd.
- Generic two-easy evidence cannot say the user is ready for a different ankle movement.

Controlled-beta recommendation:
- Split heel raise and toe raise into separate ladder IDs or mark the combined ladder as a supporting set and disable current-level mutation.

## 14. Push audit

Verdict: domain/device validation required. Current wall -> incline transition needs a setup/load gate.

What is strong:
- Floor push-up is hidden in controlled beta.
- Floor-transfer capability gate protects hidden/restored floor-level planning.
- Shoulder discomfort blocks upper push.
- Wall and incline equipment tags and safety copy are present.

Risks:
- Wall -> incline changes load, surface stability, and shoulder/wrist demand.
- Generic RPE/completion does not verify safe hand surface height, chair/counter stability, or shoulder tolerance.
- The transition is capped before floor, but the controlled-beta cap is still an increased-load transition.

Controlled-beta recommendation:
- Keep wall push-up broadly available.
- Allow incline only with an explicit stable-surface setup gate or device/domain validation.

## 15. Pull audit

Verdict: remediation required. The current ladder is not a safe linear progression.

What is strong:
- Pull work is skipped honestly when no band is available.
- Door-anchor and resistance-band safety cue coverage passes.
- Seated and standing row equipment requirements are distinct.
- Shoulder discomfort blocks rows and pull-aparts.

Risks:
- Seated row -> standing row changes posture and anchoring.
- Standing row -> band pull-apart changes plane, target muscles, camera view, and measurement tier.
- Door anchor presence distinguishes standing row from seated row, but generic progression does not assess anchor confidence or band tension.
- Pull-apart is timer-based, not the same measured row pattern.

Controlled-beta recommendation:
- Reclassify as a collection/supporting set or split row and pull-apart into separate ladders.
- Do not auto-progress row evidence into pull-apart.

## 16. Hinge/glutes audit

Verdict: remediation required. The encoded ladder crosses movement families and environments.

What is strong:
- Hip-hinge wall -> free hinge is a plausible support-removal progression.
- Floor bridge levels require floor transfer capability and floor-space equipment.
- Hip/back discomfort blocks hinge, bridge, step, squat, and deep reach patterns.
- Valid-time metadata applies to bridge hold.

Risks:
- Free hinge -> bridge hold changes from standing sagittal hinge to floor-based posterior-chain hold.
- Bridge hold -> bridge reps changes from isometric valid-time hold to dynamic reps.
- Generic progression can move users to floor work after two easy standing-hinge exposures if floor capability/equipment are confirmed, without bridge-specific onboarding evidence.
- Regression from bridge hold to free hinge is a different movement, not just a lower dose.

Controlled-beta recommendation:
- Split hip hinge and bridge into separate ladders or add explicit transition gates.
- Keep floor bridge behind both capability gates and movement-specific readiness.

## 17. Shoulder reach/press audit

Verdict: remediation required. The ladder is marked `supporting_set`, but runtime progression still mutates it.

What is strong:
- Cross-domain band press is explicitly marked as supporting.
- Shoulder discomfort blocks overhead work.
- Band equipment and safety cue coverage exist.
- No-band fallback to reach is present.

Risks:
- The probe confirmed `overhead-reach` -> `overhead-press-band` after a second easy credited exposure.
- The model label `supporting_set` does not stop current-level mutation.
- Band press changes load policy and shoulder strength demand.
- The ladder domain is mobility while the press level is strength-power cross-domain support; this should not be auto-promoted by generic mobility evidence.

Controlled-beta recommendation:
- Disable automatic current-level mutation for `supporting_set`.
- Keep overhead press as an explicit equipment-supported option, not an automatic progression from reach.

## 18. Static balance audit

Verdict: domain/device validation required. Valid-time gating helps, but single-leg progression needs explicit beta gating.

What is strong:
- Feet-together -> tandem -> single-leg is clinically plausible as a balance ladder.
- Front view and two reliable side chains align with bilateral balance needs.
- Valid-time `strong` is required for promotion.
- `completed_with_resets` holds, `tracking_uncertain` holds, and repeated `incomplete` can regress.
- Single-leg requires a confirmed support-capable balance setup at planning time.
- Safety audio includes support, no eyes closed/unstable surface, and stop-if-unsteady cues.

Risks:
- `tandem` -> `single-leg` is a materially higher fall/exposure step.
- Generic valid-time does not incorporate sway proxy, touchdown confidence, or support usage confidence.
- Capability confirmation is a setup gate, not proof that the user should progress automatically.
- Real-device validation is especially important for balance hold tracking.

Controlled-beta recommendation:
- Cap automatic balance progression at tandem until single-leg device/domain validation is complete, or add an explicit single-leg readiness gate.

## 19. Lateral/dynamic audit

Verdict: remediation required. Supporting-set semantics are not enforced and the controlled-beta transition is odd.

What is strong:
- Lateral side-step is broad setup-gated valid-time.
- Mini-band lateral walk is hidden.
- Dynamic balance discomfort exclusions exist.
- Safety cue coverage exists for support, tracking, and stop rules.

Risks:
- The probe confirmed `supported-side-step` -> `loaded-march` after a second easy credited exposure.
- `loaded-march` is a legacy ID with display name `March in Place`; it is not a harder lateral side-step.
- The hidden mini-band level is skipped, so the runtime jumps from side step to march.
- The ladder is `supporting_set`, but mutation treats it as linear.

Controlled-beta recommendation:
- Disable mutation for `lateral-stability` or split march into its own ladder.
- Keep side-step and march as selectable supporting patterns, not adjacent progression.

## 20. Mobility audit

Verdict: remediation required. `collection` metadata is not respected by current-level mutation.

What is strong:
- Mobility drills are intentionally gentle, mostly valid-time or ROM capture.
- Neck rotation is hidden for controlled beta.
- Discomfort policy blocks neck rotation and sensitive mobility patterns.
- Explore surfaces mobility as a collection.

Risks:
- The probe confirmed collection progression: hamstring reach -> thoracic rotation -> hip flexor stretch -> wall calf stretch.
- These are not harder versions of the same movement.
- Current-level persistence can bias future session selection toward later collection items as if they were achievement levels.
- Pain regression can move the "current" mobility item backward through unrelated drills.

Controlled-beta recommendation:
- Disable current-level mutation for `collection`.
- Select mobility items by template, focus, discomfort, and equipment, not by generic progression state.

## 21. Evidence matrix

| Signal | Current use | Suitability |
| --- | --- | --- |
| Completion rate | Main generic easy/difficulty threshold | Useful but too generic for support removal, load, power, balance, floor, and cross-pattern transitions |
| Perceived effort | Easy if average <= 3; difficulty if average >= 5 | Useful subjective signal, insufficient alone |
| Pain | Immediate conservative regression | Strong safety signal |
| Pain area | Stored and used in daily discomfort selection | Strong for selection; not enough for readiness-to-progress |
| Tracking quality | Poor tracking holds/reset | Strong guard against false progression |
| Valid-time strong | Counts for promotion | Good for holds/timers, needs movement-specific interpretation |
| Valid-time completed_with_resets | Holds | Good conservative behavior |
| Valid-time incomplete | Difficulty/regression | Good conservative behavior |
| Valid-time tracking_uncertain | Holds/reset | Good conservative behavior |
| Movement capability profile | Planning gate for floor, step, single-leg | Strong setup gate, not progression evidence |
| Equipment profile | Planning/start-time gate | Strong setup gate, not progression evidence |
| Release policy | Skips hidden optional levels and blocks stale plans | Strong beta containment |
| Schedule credit | Prevents same-day/extraneous progression | Strong eligibility gate |
| Stimulus role | Filters fallback/skipped/invalid | Strong, but supporting roles can still progress their own ladders |

Evidence gaps:
- No per-transition readiness contract.
- No minimum days-at-level beyond scheduled exposures.
- No assessment-to-training level calibration beyond focus/domain selection.
- No real-device confidence threshold per movement.
- No special handling for `supporting_set` or `collection` in the mutation function.

## 22. Generic threshold suitability

The current generic threshold is suitable as a conservative software primitive for simple same-pattern linear ladders after movement-specific gates exist. It is not suitable as the final beta progression policy for the full catalogue.

Suitable uses:
- Tracking progress history.
- Holding/regressing on pain, high effort, poor completion, or uncertain tracking.
- Avoiding optional-level leakage.
- Preventing stale manual/preset evidence from advancing progression.

Unsuitable uses:
- Automatically moving into power variants.
- Automatically removing support.
- Automatically moving to floor-based work.
- Automatically moving into single-leg balance.
- Automatically changing movement category inside a collection.
- Automatically promoting cross-domain supporting strength work.
- Treating timer/ROM collection items as harder levels.

## 23. Frequency/schedule audit

What is strong:
- Schedule credit is authoritative for progression eligibility.
- Same-day second sessions and off-schedule completions are denied progression credit.
- Presets and manual practice are ineligible.
- Restart/low-readiness sessions are hold-only unless conservative regression is needed.

Remaining risk:
- A ladder can appear in multiple scheduled templates within a block week. Two credited easy exposures can therefore produce a level change quickly if the schedule makes both exposures valid.
- There is no per-transition minimum days-at-level, minimum total exposures, or "repeat the exact new setup once as a preview" rule.
- For safety-critical transitions, scheduled exposure count alone is not enough.

Recommendation:
- Add per-transition `minimumCreditedExposures`, optional `minimumCalendarDays`, and optional `requiresExplicitCapabilityConfirmation` fields.

## 24. Regress/hold audit

What is strong:
- Pain causes immediate conservative regression if a lower level exists.
- Repeated high effort or incomplete work can regress.
- Poor tracking and tracking-uncertain valid time hold instead of punishing the user.
- Hold-only policy still allows conservative regression for pain or difficult evidence.
- Release cap reached is recorded instead of moving into hidden optional levels.

Risks:
- Regression across non-linear ladders can move to a different movement pattern, not a safer dose of the same pattern.
- Pain on `wall-calf-stretch` can regress to `supported-hip-flexor-stretch`, which is not the same tissue target.
- Pain on `band-pull-apart` can regress to standing row, which changes setup and movement.
- Pain on `loaded-march` can regress to side-step, which changes movement pattern.

Recommendation:
- Apply regression only within validated linear transition groups.
- For collection/supporting sets, record the pain/difficulty and bias future selection away from the item rather than mutating a global current level.

## 25. Beta ceiling audit

What is strong:
- Hidden optional level IDs are exactly seven.
- Hidden optional levels are registered but unavailable in controlled beta.
- Generation, manual practice, Explore cards/details, release snapshots, start-time validation, restore planning, and automatic progression respect controlled-beta caps.
- Restored optional progress is preserved in storage but capped at planning time.

Current beta ceilings:
- sit-to-stand: `sts-power`.
- squat: `squat-free`.
- push: `push-up-incline`.
- lateral-stability: `loaded-march` after skipping hidden mini-band.
- mobility-flexibility: `wall-calf-stretch` after hiding neck rotation.

Risk:
- Release caps block optional levels, but the current beta ceilings themselves are not all validated beta endpoints.

Recommendation:
- Introduce explicit controlled-beta progression ceilings distinct from release availability. Example: a level may be visible/practiceable but not auto-progressable.

## 26. Measurement alignment

Assessment-to-training alignment is strongest for:
- Chair stand -> sit-to-stand.
- Balance ladder -> static balance holds.
- Shoulder flexion -> overhead reach.
- Hinge reach -> hamstring/hinge mobility context.

Alignment gaps:
- TUG/step-up relation is indirect.
- Squat progression is not directly calibrated by an assessment movement.
- Push and pull progression lack assessment-derived readiness signals.
- Hinge/glute bridge transition is not directly assessed.
- Lateral/dynamic balance is not directly assessed by the static balance ladder.
- Mobility collection items are not ranked by assessment deficits.

Recommendation:
- Keep the current focus-domain selection, but do not present all ladder transitions as measurement-driven until per-transition assessment or session evidence is defined.

## 27. Explore/manual/history audit

Explore:
- Uses release-capped current levels.
- Hides optional levels in controlled beta.
- Shows setup, safety, tracking, equipment, and measurement notes.
- Can cap restored optional progress in cards and details.

Manual practice:
- Requires explicit daily context.
- Rejects direct optional-level requests.
- Caps restored optional progress for planning.
- Uses source `manual`, making progression evidence ineligible.

History/restore:
- Preserves ladder progress and applied event IDs.
- Does not replay remote completion rows into progression.
- Current planning caps restored optional levels without rewriting storage.

Risk:
- Explore can still display current level names that were produced by questionable automatic progression before remediation.

Recommendation:
- After remediation, add migration/normalization for non-linear ladder current levels if needed, or treat collection/supporting current level as display-only selection history.

## 28. Restore/persistence audit

What is strong:
- `TrainingState` schema version 4 persists `ladderProgressById`, `appliedProgressionEventIds`, generated session summaries, feedback, snapshots, and plan preferences.
- Deserialization validates ladder progress fields defensively.
- Applied event IDs are normalized and capped.
- Restore preserves stored progress but current planning release-caps hidden optional levels.
- Restore does not replay session completions into progression state.

Risk:
- Persistence has no semantic guard against restored/current levels on collection/supporting ladders.
- If users already received non-linear automatic progression, storage will preserve that state.
- Unknown stored level handling is tolerant at planning, but transition semantics remain generic once valid evidence arrives.

Recommendation:
- Add a semantic version or migration marker for progression-model behavior when collection/supporting mutation is remediated.

## 29. Tests and false-confidence audit

What current tests cover well:
- Catalogue metadata, release policy, hidden optional levels, and release snapshots.
- Safety cue coverage for visible and optional registered levels.
- Valid-time accumulator and valid-time progression signals.
- Generic progression thresholds.
- Dynamic workout generation under equipment, discomfort, readiness, optional cap, and debug scenarios.
- Daily context normalization and progression policy.
- Movement capability normalization and snapshots.
- Session planning gates, manual practice gates, release snapshot validation, safety cue validation, and movement capability validation.
- Authoritative progression evidence eligibility, duplicate event IDs, fallback/skipped exclusion, release cap diagnostics.
- Stage 5H lifecycle integration.
- Restore of progress and event IDs.
- Full audio verification and voice player behavior.

False-confidence gaps:
- Tests assert that every ladder has a `progressionModel`, but do not assert that mutation respects it.
- Tests intentionally prove generic progression after two easy sessions, including valid-time balance, but do not require per-ladder transition policies.
- There is no test that `supporting_set` and `collection` ladders cannot mutate current levels.
- There is no test that heel-toe, pull, hinge/bridge, lateral, and mobility transitions require explicit transition semantics.
- There is no test that beta auto-progression ceilings differ from visible practice ceilings.
- There is no device-backed regression evidence for camera-assisted/timer/hold confidence.

Required new tests:
- Non-linear model no-mutation tests.
- Per-transition policy tests.
- Beta auto-progression ceiling tests.
- Movement-specific gate tests for power, support removal, floor, single-leg, and band/door-anchor transitions.
- Restore normalization tests for non-linear ladder states.
- Explore/current-level display tests after semantic remediation.

## 30. Device-dependency audit

Device validation remains required for beta because:
- Balance valid-time, single-leg touchdown, sway/tracking confidence, and front-view support behavior are real-device sensitive.
- Step-up environment and phone-out-of-path assumptions need in-home device validation.
- Floor bridge camera framing and floor-transfer setup need device validation.
- Band/door-anchor exercises combine user setup and camera view changes.
- Side-view velocity and valid-time confidence should be verified on Android and iOS with bundled assets.

Current software mitigations:
- Native pose processing keeps camera frames off JS.
- No self-view camera video.
- Valid-time tracking uncertainty holds instead of progressing.
- Movement capability gates fail closed for missing/unknown floor, step, and single-leg confirmations.
- Start-time snapshots detect stale equipment/capability/release/safety-cue state.

Conclusion:
- Software validation passed, but beta device validation is still required.

## 31. Decision packet

Recommended remediation before unblocking Stage 4G-R:

1. Enforce `progressionModel` in progression mutation.
   - `linear_progression`: may mutate only through explicit transition policy.
   - `supporting_set`: record exposure/difficulty but do not auto-change `currentLevelId`.
   - `collection`: record item history but do not treat adjacent collection entries as harder levels.

2. Add per-transition policies.
   - Fields: `fromLevelId`, `toLevelId`, `autoProgressionStatus`, `minimumCreditedExposures`, `minimumDays`, `requiredEvidence`, `requiredCapability`, `betaAutoProgressionAllowed`, `rationale`.
   - Default to blocked unless declared.

3. Add auto-progression ceilings.
   - Separate "visible/practiceable in controlled beta" from "automatically reachable in controlled beta".

4. Split or reclassify non-linear ladders.
   - Heel and toe raise.
   - Row and pull-apart.
   - Hinge and bridge.
   - Lateral side-step and march.
   - Mobility collection.

5. Add movement-specific gates.
   - Power sit-to-stand: velocity/trend or explicit power-readiness gate.
   - Squat/push support removal: setup and support-independent confidence.
   - Balance single-leg: capability plus strong valid-time and device validation.
   - Floor bridge: floor-transfer plus bridge-specific intro/progression gate.
   - Band/door-anchor: anchor and equipment confirmation plus conservative selection.

6. Add tests.
   - Unit, integration, restore, Explore/manual, and Stage 5 lifecycle coverage for the new policy.

## 32. Findings

### P1 - F4F-001: Non-linear ladder semantics are metadata-only

`supporting_set` and `collection` ladders are labeled, displayed, and tested as semantic categories, but progression mutation does not respect those labels. Runtime probe confirmed:
- shoulder-reach-press: `overhead-reach` -> `overhead-press-band`.
- lateral-stability: `supported-side-step` -> `loaded-march`.
- mobility-flexibility: `seated-hamstring-reach` -> `thoracic-rotation` -> `supported-hip-flexor-stretch` -> `wall-calf-stretch`.

Impact: users can be automatically moved through unrelated or cross-domain movement entries after generic easy evidence.

Required fix: block mutation for non-linear models or introduce explicit per-transition policy.

### P1 - F4F-002: Generic thresholds are insufficient for safety-critical transitions

The generic rule promotes after two easy credited sessions using completion rate and RPE. That is not enough for:
- slow sit-to-stand -> power sit-to-stand.
- supported squat -> free squat.
- wall push-up -> incline push-up.
- tandem balance -> single-leg balance.
- free hinge -> floor bridge.
- seated/standing row -> pull-apart.

Impact: controlled-beta users can reach higher-risk movements without movement-specific readiness evidence.

Required fix: per-transition gates and beta auto-progression ceilings.

### P1 - F4F-003: Several linear ladders are semantically mixed

Heel-toe, pull-upper-back, and hinge-glutes are declared as `linear_progression`, but they contain target-movement or environment changes that should be split, reclassified, or gated.

Impact: progression and regression can move users between different movements, not easier/harder versions of the same movement.

Required fix: split/reclassify ladders or define explicit transition contracts.

### P2 - F4F-004: Beta release caps do not equal beta auto-progression ceilings

Release caps correctly hide optional levels, but the highest visible core level is sometimes too advanced to be automatically reachable before validation.

Impact: optional containment passes while content readiness remains blocked.

Required fix: add a separate auto-progression policy/ceiling.

### P2 - F4F-005: Tests prove the generic engine but not movement-specific correctness

Current tests give strong confidence in plumbing, safety gates, release caps, and generic behavior, but not in per-ladder progression suitability.

Impact: full validation can pass while F4R-008 remains open.

Required fix: add movement-specific policy tests.

### P2 - F4F-006: Assessment-to-training calibration is incomplete

Several training transitions are not directly tied to assessment metrics or session-specific movement signals.

Impact: "movement-specific progression" is not yet evidence-calibrated across the catalogue.

Required fix: define per-transition evidence or keep transitions manual/held for beta.

### P2 - F4F-007: Device validation remains a beta blocker

Software guards are strong, but real-device validation is still required for balance, step, floor, band, valid-time, and camera-assisted movement confidence.

Impact: controlled beta should not proceed as fully verified until device validation is complete.

Required fix: Stage 3D-B/device beta validation.

## 33. Invariants

1. The app must never show self-view camera video.
2. Audio-first session flow must remain the default.
3. Runtime sessions must not call provider TTS APIs.
4. Pre-generated bundled audio must remain the session path.
5. Provider secrets must never be printed, copied, committed, or exposed.
6. Controlled beta must hide all `v1_optional` levels.
7. Hidden optional levels must remain registered for compatibility and testing.
8. Planning must release-cap restored optional progress without rewriting stored state.
9. Manual direct optional-level requests must be rejected in controlled beta.
10. Explore must not show hidden optional levels.
11. Preset generation must not select hidden optional levels.
12. Dynamic generation must not select hidden optional current levels.
13. Automatic progression must not enter hidden optional levels.
14. Release policy snapshots must be stamped on playable plans.
15. Stale release policy snapshots must block start-time use.
16. Missing release policy snapshots on current plans must block start-time use.
17. Equipment snapshots must be stamped on playable plans.
18. Missing or stale equipment snapshots must block start-time use.
19. Movement capability snapshots must be stamped on playable plans.
20. Missing or stale movement capability snapshots must block sensitive start-time use.
21. Safety cue snapshots must be stamped on playable plans.
22. Missing or stale safety cue snapshots must block start-time use.
23. Safety cue coverage must include every visible controlled-beta level.
24. Safety cue coverage must include registered optional levels even when hidden.
25. Clara safety audio must include all required safety cues.
26. Marcus safety audio must include all required safety cues.
27. Required safety audio assets must be valid non-empty finite-duration MP3s.
28. Required safety audio mappings must be static and complete.
29. Safety audio fingerprints must be current.
30. Voice selection must not alias Clara and Marcus audio.
31. Manual practice must require explicit daily context.
32. Manual practice must be progression-ineligible.
33. Preset extra sessions must be progression-ineligible.
34. Generated block sessions must include daily context.
35. Ready/no-discomfort generated block sessions may be `normal` progression policy.
36. Low readiness generated block sessions must be `hold_only`.
37. Discomfort generated block sessions must be `hold_only`.
38. Malformed daily context must fail closed.
39. Legacy unknown daily context must be progression-ineligible.
40. Pain must remain a conservative regression signal.
41. Poor tracking must never promote.
42. Tracking-uncertain valid time must never promote.
43. Completed-with-resets valid time must hold.
44. Incomplete valid time must count as difficulty.
45. Strong valid time may count only for validated transitions.
46. Generic easy completion must require completion rate >= 0.85.
47. Generic easy completion must require average RPE <= 3.
48. Generic progression must require two qualifying exposures unless overridden by a stricter policy.
49. Generic failure must trigger at RPE >= 5.
50. Completion rate below 0.6 must count as difficulty.
51. Pain must clear ready-to-progress state.
52. Poor tracking must clear ready-to-progress state.
53. Release-cap reached must be diagnostic, not hidden optional selection.
54. Duplicate progression event IDs must not replay.
55. Progression event IDs must include completion, block, template, and ladder identity.
56. Off-schedule completions must not progress.
57. Same-day second valid sessions must not progress unless schedule permits them.
58. Supporting-only attempts must not count as main-plan progression.
59. Fallback-role exercises must not progress fallback ladders.
60. Skipped exercises must not progress.
61. Invalid stimulus metadata must fail closed.
62. Mismatched ladder/level metadata must fail closed.
63. Conflicting same-ladder levels in one completion must fail closed for that ladder.
64. Missing post-session feedback must block progression evidence.
65. Equipment-unsafe exercises must be excluded at planning.
66. Movement-capability-unsafe exercises must be excluded at planning.
67. Knee discomfort must block sensitive squat, step, dynamic balance, and knee-sensitive levels.
68. Hip/back discomfort must block hinge, bridge, step, squat, and deep reach patterns.
69. Shoulder discomfort must block push, pull, and overhead work.
70. Ankle discomfort must block ankle, step, lateral, march, calf, and single-leg patterns.
71. Neck discomfort must block neck rotation.
72. Floor exercises must require floor-transfer capability confirmation.
73. Step-up must require step-up environment confirmation.
74. Single-leg balance must require supported single-leg capability confirmation.
75. Step-up must require a low stable step and support nearby.
76. Door-anchor work must require door-anchor/band-specific safety cues.
77. Band work must require band safety cues.
78. Floor work must require floor safety cues.
79. Support-required work must require support safety cues.
80. Tracking-sensitive work must require tracking safety cues.
81. Sit-to-stand power must not be treated as automatically beta-ready without a power gate.
82. Supported squat must not auto-progress to free squat without a support-removal gate.
83. Wall push-up must not auto-progress to incline without a stable-surface/load gate.
84. Tandem balance must not auto-progress to single-leg without explicit single-leg readiness.
85. Free hinge must not auto-progress to floor bridge without bridge-specific readiness.
86. Rows must not auto-progress into pull-aparts without a pull-specific policy.
87. Heel raises must not auto-progress into toe raises as a harder level.
88. Lateral side step must not auto-progress into march because of adjacent array order.
89. Mobility collection items must not be ranked as harder levels by default.
90. `supporting_set` must not mutate current level unless an explicit policy says so.
91. `collection` must not mutate current level unless an explicit policy says so.
92. `linear_progression` must not imply all adjacent pairs are safe.
93. Visible/practiceable must be separate from auto-progressable.
94. Restore must preserve historical progress but planning must remain beta-safe.
95. Restored non-linear progress must not force unsafe future selection.
96. Explore current-level display must reflect release caps.
97. Explore must not imply clinical or medical claims.
98. Progression copy must remain non-shaming and non-medical.
99. Regression must be framed as protection or adjustment, not failure.
100. Device validation must be required for camera-sensitive beta decisions.
101. Android and iOS export must pass with bundled audio assets.
102. App typecheck must pass.
103. Website typecheck must pass.
104. Expo public config must pass.
105. `git diff --check` must pass.
106. Full Jest must pass.
107. Targeted progression/audio/cue tests must pass.
108. No package installation may occur during this audit.
109. No lockfile may change during this audit.
110. No staging, commit, branch, or push may occur during this audit.

## 34. Per-ladder verdict

| Ladder | Verdict | Reason |
| --- | --- | --- |
| sit-to-stand | Domain/device validation required | Power transition needs a movement-specific gate or lower beta auto-progression ceiling |
| squat | Remediation required | Support removal is automatic under generic evidence |
| step-up | Domain/device validation required | Single level, but selection depends on home step and camera/device validation |
| heel-toe-raise | Remediation required | Heel-toe sequence is not one linear movement ladder |
| push | Domain/device validation required | Wall -> incline changes load and setup stability |
| pull-upper-back | Remediation required | Rows and pull-apart are mixed movement/setup patterns |
| hinge-glutes | Remediation required | Standing hinge and floor bridge should not be adjacent generic progression |
| shoulder-reach-press | Remediation required | `supporting_set` can still auto-progress reach -> band press |
| balance | Domain/device validation required | Single-leg promotion needs explicit readiness/device validation |
| lateral-stability | Remediation required | `supporting_set` can auto-jump side step -> march |
| mobility-flexibility | Remediation required | `collection` can auto-rotate through unrelated mobility drills |

## 35. Remediation plan

P1 remediation:
1. Add progression-model enforcement to the mutation path.
2. Add per-transition policy metadata and fail closed when absent.
3. Add controlled-beta auto-progression ceilings.
4. Disable mutation for `supporting_set` and `collection` until explicit policies exist.
5. Add tests proving non-linear ladders do not mutate.

P2 remediation:
1. Split or reclassify mixed ladders.
2. Add movement-specific gates for support removal, power, floor, single-leg, band/anchor, and mobility collections.
3. Add restore/display normalization for existing non-linear current levels.
4. Add assessment-to-training calibration notes and tests.
5. Add device-validation checklist outcomes to the beta release decision.

Suggested implementation order:
1. Policy model and tests.
2. Non-linear no-mutation guard.
3. Beta auto-progression ceilings.
4. Per-ladder transition contracts.
5. Restore/Explore normalization.
6. Full validation and updated audit.

## 36. F4R-008 decision

F4R-008 is not closed. It requires remediation because movement-specific progression semantics are not yet enforced in the runtime mutation path, and several current transitions need explicit policies before controlled beta.

Decision: F4R-008 REMEDIATION REQUIRED.

## 37. Core progression readiness

Core progression is not ready for controlled beta as a software/content package.

Ready:
- Release caps and optional containment.
- Main-plan evidence authority.
- Daily-context hold-only/ineligible policy.
- Conservative pain/tracking/valid-time handling.
- Restore preservation and idempotent event IDs.
- Safety cue/audio integrity.
- Typecheck, full tests, Expo config, Expo export.

Blocked:
- Non-linear model enforcement.
- Per-transition progression policy.
- Beta auto-progression ceilings.
- Movement-specific gates for safety-critical transitions.
- Device validation.

Decision: CORE PROGRESSION SOFTWARE/CONTENT-BLOCKED.

## 38. Remaining Stage 4

Completed/verified before this audit:
- Stage 4D-R.1 safety audio generation and verification.
- Stage 4D-R safety cue work.
- Stage 4E-R optional-level controlled beta policy.

Remaining:
- F4R-008 movement-specific progression remediation.
- Stage 4G-R only after F4R-008 remediation.
- Stage 4 still remains blocked for beta release until progression/content remediation and device validation are complete.

## 39. Final stage decisions

STAGE 4F-R AUDIT COMPLETE

F4R-008 REMEDIATION REQUIRED

CORE PROGRESSION SOFTWARE/CONTENT-BLOCKED

STAGE 4G-R BLOCKED

STAGE 4G-R REQUIRED

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED

## 40. Final Git status

Immediately before writing this report, the worktree unexpectedly reported clean:

```text
(no output from git status --porcelain=v1 --untracked-files=all)
```

This differed from the initial dirty status. Because I did not edit, stage, revert, delete, or clean those user-owned files, I classify the disappearance of the initial modified/untracked files as concurrent external cleanup/removal outside this audit.

Final status observed after writing this one allowed report:

```text
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/__tests__/pearlFlow.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/microCheck.ts
 M src/pearlFlow/nextBestAction.ts
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_4F_R.md
```

Files changed by this audit:

```text
docs/audits/PEARL_LOGIC_AUDIT_STAGE_4F_R.md
```

Concurrent external changes observed:
- The initial modified files under `src/screens`, `src/training/microCheck.ts`, and `website` were no longer present in `git status` before the report write.
- The initial untracked Stage 4F prompt and website screenshots were no longer present in `git status` before the report write.
- After the report write, five `src/pearlFlow` files appeared as modified:
  - `src/pearlFlow/__tests__/appLifecycle.test.ts`
  - `src/pearlFlow/__tests__/pearlFlow.test.ts`
  - `src/pearlFlow/appLifecycle.ts`
  - `src/pearlFlow/microCheck.ts`
  - `src/pearlFlow/nextBestAction.ts`
- The concurrent `src/pearlFlow` diff stat was 5 files changed, 108 insertions, 26 deletions.
- I did not modify or remove those files.

Confirmation:
- No production code changed by this audit.
- No test files changed by this audit.
- No assets changed by this audit.
- No config files changed by this audit.
- No package install occurred.
- No lockfile changed.
- No staging occurred.
- No commit occurred.
- No branch was created or switched.
- No push occurred.
- No provider key or `.env` contents were printed, copied, or committed.
