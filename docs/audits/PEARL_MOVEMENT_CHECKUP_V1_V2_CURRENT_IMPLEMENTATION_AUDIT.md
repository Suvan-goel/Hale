# Pearl Movement Check-Up V1/V2 Current Implementation Audit

Date: 2026-06-24
Auditor: Codex
Scope: Read-only implementation audit, except for this report file.
Prompt: `docs/audits/Pearl_Movement_CheckUp_V1_V2_Current_Implementation_Audit_Prompt.md`

## 1. Executive Recommendation

**Recommendation: build a unified hybrid, not V1-only and not current V2-as-is.**

The canonical future should be:

- V2 measurement protocols, raw artifacts, provenance, reference-policy engine, focus selection, and V2-origin training blocks for all new Movement Check-Ups.
- V1 onboarding/session shell and Stage 5 lifecycle pieces reused only where they are product-mature and claim-neutral.
- V1 score snapshots, Movement Age copy, and weakest-domain scoring kept as legacy history for old records only.
- One public check-up path after migration; no permanent dual public V1/V2 decision tree.

Current V2 is scientifically and architecturally closer to the right public product than V1, but it is still an internal/beta system: it is flag-gated, has manual controls in the session path, lacks full lifecycle parity, has no documented physical-device validation, and the repository currently fails `npm run typecheck`. V1 is more complete as an app flow today, but its public result model is the weaker long-term choice because it derives plan focus from sex-pooled and partly extrapolated Movement Age estimates, including estimated shoulder bands and a short balance protocol that does not match V2's longer reference posture.

**Release stance:**

- Closed beta: V2 can be used for invited internal/closed-beta measurement validation after fixing or explicitly waiving the typecheck/render blocker.
- Public production: ship a hybrid path that uses V2 artifacts/results and a unified public shell; keep V1 public/default only until that migration is complete.
- Do not promote current V2 as public canonical without the lifecycle, voice, and device-validation work listed below.

## 2. Scope And Constraints

I treated existing repository changes as user-owned. I did not revert, refactor, stage, or commit anything.

Allowed repo change:

- Created this report: `docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`

Temporary probes:

- Used `/tmp/pearl-checkup-v1-v2-audit/` for read-only scenario tests.
- Used `/tmp/pearl-checkup-v1-v2-audit-export/` for a non-publishing Expo export.
- Both temp directories were removed after the audit.

## 3. Source Hierarchy

Current code was treated as source of truth when prior reports disagreed. Files consulted included:

- Product/architecture context: `AGENTS.md`, `CLAUDE.md`, `docs/decisions.md`
- Audit prompt: `docs/audits/Pearl_Movement_CheckUp_V1_V2_Current_Implementation_Audit_Prompt.md`
- Current app routing and lifecycle: `App.tsx`
- V1 check-up, scoring, norms, history, reports, training, and UI modules under `src/checkup`, `src/scoring`, `src/pearlFlow`, `src/training`, and `src/screens`
- V2 protocol, live coordinator, reference, assessment, result, audio, block, and UI modules under `src/movementProfileV2`, `src/reference/movementProfileV2`, `src/checkup`, `src/pearlFlow`, `src/audio`, `src/screens`, and `src/movements`
- Native/Expo/config state through `package.json`, `npx expo config`, and tests

Historical audit/spec docs were useful orientation, but this report is based on current repository behavior.

## 4. Initial Worktree State

The worktree was already heavily dirty before this audit began. The audit did not create or modify those existing files.

Initial summary:

- 66 tracked files modified.
- 62 new V2/V2.1 voice assets under `assets/audio/voice/{clara,marcus}/`.
- Multiple untracked audit/spec/current-implementation docs.
- Multiple untracked V2 source/test/config files.
- `git diff --stat`: 66 files, 2995 insertions, 355 deletions.

Representative initial modified tracked files included:

```text
M .env.example
M App.tsx
M docs/decisions.md
M package-lock.json
M package.json
M src/checkup/movementProfileV2.ts
M src/checkup/protocolPolicy.ts
M src/pearlFlow/appLifecycle.ts
M src/pearlFlow/blockTrainingPlan.ts
M src/pearlFlow/checkupHistory.ts
M src/pearlFlow/progressViewModel.ts
M src/movementProfileV2/liveCoordinator.ts
M src/movementProfileV2/viewModel.ts
M src/reference/movementProfileV2/assessment.ts
M src/reference/movementProfileV2/engine.ts
M src/reference/movementProfileV2/snapshot.ts
M src/screens/MovementProfileV2CheckUpScreen.tsx
M src/screens/MovementProfileV2ResultsScreen.tsx
M src/training/workoutGeneration.ts
```

Representative initial untracked files included:

```text
assets/audio/voice/clara/movement-profile-v2-*.mp3
assets/audio/voice/marcus/movement-profile-v2-*.mp3
docs/audits/Pearl_Movement_CheckUp_V1_V2_Current_Implementation_Audit_Prompt.md
src/adherence/blockFocus.ts
src/audio/movementProfileV2Audio.ts
src/audio/movementProfileV2AudioManifest.ts
src/config/movementProfileV2Internal.ts
src/config/movementProfileV2VoiceRuntimeFoundation.ts
src/pearlFlow/movementProfileV2Block.ts
src/movementProfileV2/liveDiagnostics.ts
src/movementProfileV2/referenceDetailsDraft.ts
```

## 5. Validation Baseline

Targeted V1/V2 test slice:

```text
PASS
Test Suites: 26 passed, 26 total
Tests:       315 passed, 315 total
Snapshots:   0 total
Time:        8.388 s
```

Full Jest suite:

```text
PASS
Test Suites: 125 passed, 125 total
Tests:       1040 passed, 1040 total
Snapshots:   0 total
Time:        18.42 s
```

Audio verification:

```text
AUDIO VERIFICATION PASS
safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3057566 durationRange=0.743-6.037s
total: requiredAssets=150
```

Website typecheck:

```text
PASS
npm --prefix website run typecheck
```

Expo public config:

```text
PASS
npx --no-install expo config --type public
```

Expo export, non-publishing:

```text
PASS
npx --no-install expo export --platform all --output-dir /tmp/pearl-checkup-v1-v2-audit-export
```

Diff whitespace check:

```text
PASS
git diff --check
```

App typecheck:

```text
FAIL
npm run typecheck
```

Typecheck errors:

```text
src/diagnostics/poseRendererReplay.ts(112,20): error TS2304: Cannot find name 'createSculptedFigureGeometry'.
src/diagnostics/poseRendererReplay.ts(142,11): error TS2367: This comparison appears to be unintentional because the types '"digital-twin" | "limb-ribbon" | "solid-figure" | "silhouette"' and '"sculpted-figure"' have no overlap.
src/diagnostics/poseRendererReplay.ts(143,9): error TS2304: Cannot find name 'buildSculptedFigureGeometry'.
src/diagnostics/poseRendererReplay.ts(220,3): error TS2739: Type '{ mode: PoseAvatarRendererMode; frameCount: number; averagePathCount: number; maxPathCount: number; ... }' is missing fields from type 'PoseRendererReplaySummary'.
src/render/__tests__/poseAvatarConfig.test.ts(21,38): error TS2345: Argument of type '"sculpted_body"' is not assignable to parameter of type 'PoseAvatarRendererMode'.
src/render/matteGraphiteDigitalTwinGeometry.ts(505,57): error TS2345: Argument of type 'number[]' is not assignable to parameter of type 'readonly [number, number, number, number]'.
src/render/matteGraphiteDigitalTwinGeometry.ts(540,60): error TS2345: Argument of type 'number[]' is not assignable to parameter of type 'readonly [number, number, number, number]'.
src/render/SculptedPoseRenderer.tsx(135,13): error TS2367: This comparison appears to be unintentional because the types 'PoseAvatarRendererMode' and '"sculpted_body"' have no overlap.
src/render/SculptedPoseRenderer.tsx(173,7): error TS2322: Type '"sculpted_body"' is not assignable to type 'PoseAvatarRendererMode'.
src/render/SculptedPoseRenderer.tsx(187,9): error TS2322: Type '"sculpted_body"' is not assignable to type 'PoseAvatarRendererMode'.
```

This is not a V1/V2 scoring failure, but it is a release-blocking repository health failure.

## 6. Entry Points And Routing

Current public/default behavior:

- `beginCheckUp` starts the legacy V1 check-up flow and sets `currentFlow` to `checkup` in `App.tsx`.
- Onboarding baseline uses `beginCheckUp('baseline')`.
- Today, Plan, and Progress official retests call `beginCheckUp('official_retest')`, which remains V1.
- V1 `CheckUpScreen` is rendered for `checkup`, `onboarding-camera-setup`, and `camera-setup` flows.

Current V2 behavior:

- V2 is gated by `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL === '1'` in `src/config/movementProfileV2Internal.ts`.
- If the flag is false, `movement-profile-v2*` flows are redirected home.
- V2 entry points are internal Settings and an internal Progress card.
- `MovementProfileV2CheckUpScreen` and `MovementProfileV2ResultsScreen` are separate screens, not replacements for the public V1 flow.

Conclusion: V1 is still the production/default Movement Check-Up. V2 is internal/beta infrastructure with a separate route family.

## 7. V1 Inventory

### 7.1 V1 Battery

Default V1 battery:

- `chair-stand-30s`
- `balance-ladder`
- `shoulder-flexion-peak`
- `hinge-reach`

Hidden/beta V1 battery can include:

- `timed-up-and-go`

### 7.2 V1 Protocols

Chair stand:

- Side view.
- 30 seconds.
- Near-side knee-angle state machine with hysteresis.
- Records reps and per-rep/session rise velocity.
- Logs hand push-off as a flag, not as form critique.
- Subject-gone/tracking interruption resets the rep state.

Balance ladder:

- Front view.
- Feet-together, tandem, and single-leg stages.
- Current staged durations are shorter than V2's 45-second single-leg reference task.
- Uses hold termination and sway proxy.

Shoulder flexion:

- Side view.
- Peak upper-arm-to-trunk angle.
- Requires enough valid tracking time.
- Produces no measurement if invalid.

Hinge reach:

- Side view.
- Wrist-to-floor distance in body units.
- Supporting mobility metric.

Timed Up and Go:

- Implemented as side-lateral beta path.
- Seat-off to re-seated timing.
- Turn inferred by hip-x velocity reversal.
- Short-path variant flag available.

### 7.3 V1 Scoring And Claims

V1 creates `ScoreSnapshot` artifacts and public UI copy around domain ages:

- Strength/Power from chair stand reps, with velocity as supporting detail.
- Balance from single-leg eyes-open hold, with TUG as supporting detail when present.
- Mobility from shoulder flexion, with hinge reach as supporting detail.
- Weakest/focus domain is selected by oldest measured age midpoint, with near-tie handling.

V1 intentionally avoids a composite body age, but still says domains are "typical of age X-Y." Norms are sex-pooled and partly extrapolated; shoulder bands are explicitly estimate-like.

### 7.4 V1 Lifecycle

V1 is lifecycle-complete:

- Public onboarding baseline.
- Camera setup and check-up session.
- Results screen.
- Score/history persistence.
- Training block creation.
- Official retest.
- Block completion/reporting.
- Progress screen hero/trends.
- Backend sync and restore paths for V1 artifacts.

## 8. V2 Inventory

### 8.1 V2 Battery

V2 headline protocol set:

- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`

V2 supporting metric:

- `hinge-reach`

V2 completeness requires all headline items to have usable raw evidence. Hinge remains supporting and is not part of headline completeness.

### 8.2 V2 Protocols

Chair rise V2:

- Side view.
- Setup confirmation.
- Practice rep.
- Countdown.
- Counts full stands at or within 30 seconds.
- Records setup confidence, interruptions, practice completion, and raw result.
- Chair transform/reference is currently disabled unless an explicit approved transform/provider is supplied.

One-leg balance V2:

- Front view.
- Standing leg selection.
- Up to three valid trials.
- 45-second maximum per valid trial.
- 30-second rest between trials.
- Can decline remaining attempts.
- Records best hold, invalid attempts, rest state, and evidence status.
- Produces product-created task bands when published age/sex reference is not directly used.

Active shoulder reach V2:

- Side view.
- Side selection.
- 9-second capture.
- Requires 3 seconds valid tracking.
- Supports one invalid retry.
- Pain-limited path remains raw-only/focus-excluded.
- Uses Gill 2020 IQR-style reference status where eligible.

Hinge reach:

- Supporting raw metric.
- Not headline reference/focus evidence.

### 8.3 V2 Artifacts And Claims

V2 rejects legacy-derived artifacts such as:

- Movement Age.
- Body Age.
- Weakest domain.
- Score snapshot.
- V1 movement block.
- Block report.
- Training-plan display copy embedded into the assessment.

V2 assessment focuses on:

- Raw completeness.
- Source eligibility.
- Reference status.
- Evidence/provenance.
- Focus policy.
- V2-origin block creation.

This is directionally much stronger than V1 for scientific and trust posture.

### 8.4 V2 Lifecycle

V2 lifecycle exists but is incomplete:

- Internal entry point exists.
- Raw record save exists.
- Snapshot/assessment materialization exists.
- V2-origin block creation exists.
- V2 results screen exists.
- Progress can show a V2 internal latest card.

Missing or incomplete:

- Public onboarding replacement.
- Public official retest replacement.
- Report/next-block lifecycle parity.
- Main Progress hero/trend replacement.
- Balanced-block micro-check handling.
- Hands-free public session flow.
- Physical-device validation evidence.

## 9. V1 Vs V2 Protocol Comparison

| Domain | V1 Current | V2 Current | Audit Judgment |
|---|---|---|---|
| Strength/Power | 30s chair stand, reps plus velocity, Movement Age scoring | 30s chair rise, practice/setup provenance, raw-only chair reference for now | V2 protocol metadata is stronger, but chair reference/focus is not yet enabled |
| Balance | Short ladder and single-leg headline for scoring | 45s one-leg balance, best of up to 3 trials, task-band reference policy | V2 is better aligned to serious longitudinal protocol; V1 cannot simply feed V2 reference |
| Mobility shoulder | Shoulder flexion peak with estimate-like age bands | Active shoulder reach with side/pain/validity provenance and IQR reference | V2 is stronger |
| Mobility hinge | Supporting metric | Supporting metric | Compatible as supporting raw detail |
| TUG | Implemented beta | Not in V2 headline | Leave out of canonical V2 until a versioned protocol/reference path is defined |

## 10. Claim Validity

### V1 Claim Risk

V1's public claim is easy to understand, but scientifically fragile:

- "Typical of age X-Y" may imply more precision than the home-camera protocol supports.
- Norm tables are sex-pooled.
- Some 45-59 bands are extrapolated.
- Shoulder mobility relies on estimated bands.
- V1 balance protocol is shorter than V2's stronger balance target.

V1 copy has guardrails, but the artifact itself is still a Movement Age model.

### V2 Claim Strength

V2's claim posture is better:

- Raw-only when reference is not approved.
- Explicit source eligibility.
- Explicit reference status.
- Product-created task bands are not mislabeled as published norms.
- Pain-limited and setup-uncertain results are kept out of focus selection where appropriate.
- Legacy Movement Age artifacts are actively rejected.

V2's main scientific gap is that chair-rise comparison is not yet approved, which makes chair strength focus ineligible today.

## 11. Focus And Plan Behavior

### V1

V1 focus is based on domain-age midpoint:

- Oldest measured age range wins.
- Near ties are handled deterministically or by preserving current focus.
- This can over-focus balance because the current V1 balance ceiling and age mapping are comparatively harsh.

### V2

V2 focus is evidence-policy based:

- Missing/invalid headline evidence can force retake.
- Single below-reference domain can become focus.
- Multiple below-reference domains can preserve retest focus, use goal tie-breakers, or become balanced.
- Chair is currently focus-ineligible when transform is unapproved.
- Pain-limited shoulder is raw-only and focus-excluded.
- Balanced focus creates a balanced V2-origin block.

### Plan Creation

V1 block creation is mature and automatic.

V2 block creation is stricter:

- Reuses same block for same assessment fingerprint.
- Fails closed when assessment/source is ineligible.
- Fails on active-block conflict.
- Does not fake a single `focusDomain` for balanced blocks.

This is good architecture, but public UX must handle the fail-closed cases.

## 12. Matched Scenario Probe

I created a temporary Jest probe under `/tmp/pearl-checkup-v1-v2-audit/` that used production helpers and current source code. The temp probe was removed after the audit.

Probe command:

```text
npx --no-install jest --runInBand --roots /private/tmp/pearl-checkup-v1-v2-audit --runTestsByPath /private/tmp/pearl-checkup-v1-v2-audit/probe.test.ts
```

Probe result:

```text
PASS
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.719 s
```

Scenario results:

| Scenario | V1 Outcome | V2 Outcome | Meaning |
|---|---|---|---|
| Average-ish user | Strength 60-68, balance 79-87, mobility 59-71; focus balance | Chair raw-only, balance building, shoulder within; focus balanced | V1 over-commits to balance where V2 says balanced |
| Low balance | Focus balance, balance block | Focus balance, balance block | Both agree |
| Low chair | Focus strength, strength block | Chair raw-only; focus balanced | V2 cannot yet focus strength because chair transform is unapproved |
| Low shoulder | V1 near-tie balance/mobility, deterministic balance | V2 mobility focus | V2 better preserves source-specific shoulder signal |
| Near-equivalent | V1 focus strength via near-tie policy | V2 focus mobility due shoulder below reference | Policies differ materially |
| Missing reference profile | V1 still produces age/focus | V2 raw-only/profile incomplete and balanced | V2 fails softer and clearer |
| Chair setup uncertain | V1 unaffected | Chair raw-only; balanced | V2 provenance affects interpretation |
| Balance raw incomplete | V1 focus balance | V2 task-band still can focus balance | V2 retains useful evidence while marking protocol status |
| Shoulder pain-limited | V1 still selects balance via age tie | V2 shoulder focus-excluded; balanced | V2 is safer for pain-limited data |
| Invalid headline | V1 block fails incomplete | V2 materialization fails source ineligible | Both fail closed |
| Unique strength life goal | V1 focus balance | V2 no clear signal, goal-led strength | V2 can honor user goal only when evidence allows |
| Existing active block | V1 helper isolated ok in probe | V2 fails active-block conflict | V2 avoids silently replacing active work |
| Replay same materialization | Not applicable | Reused same materialization | V2 idempotence is working |
| Restored frozen history | V1 standard latest snapshot | V2 latest official restored; title "Suggested focus: Balance" | V2 restore/history path exists |

## 13. Lifecycle Parity Matrix

| Capability | V1 | V2 | Hybrid Need |
|---|---:|---:|---|
| Public onboarding baseline | Yes | No | Replace V1 baseline with V2 once shell is ready |
| Public camera setup | Yes | Internal separate | Reuse V1 shell patterns with V2 protocol readiness |
| Audio-first session | Mostly yes | Not yet | Remove/manualize beta controls only for dev |
| Results screen | Yes | Internal yes | Make V2 result public and claim-reviewed |
| Automatic 4-week block | Yes | Yes, stricter | Surface fail-closed reasons gracefully |
| Official retest | Yes | Not public/default | Add V2 retest path |
| Block completion report | Yes | No | Build V2 report or claim-neutral equivalent |
| Progress hero/trends | V1 | Internal V2 sidecard only | Make V2 canonical progress source |
| Sync/restore | Yes | Partial/current | Keep dual restore, display legacy explicitly |
| Physical-device validation | Existing implied V1 maturity | Not evidenced | Required before public V2/hybrid launch |

## 14. UX And Accessibility

V1 is closer to the audio-first product law because it is the public, automatic check-up shell.

V2 still exposes visible manual controls in `MovementProfileV2CheckUpScreen`, including:

- Confirm setup.
- Standing-leg picker.
- Shoulder-side picker.
- Stop attempt.
- Touch support.
- Rest/ready actions.
- Use this result.
- Start/finish capture.
- Diagnostics export.

Those are appropriate for internal beta and protocol validation, but not for a public adult 45-65 camera check-up that should run hands-free after setup.

V2 should keep dev controls behind dev/internal diagnostics and convert necessary selections into audio-guided, pre-session, or high-confidence auto-detected flows before public release.

## 15. Data, History, Migration, And Restore

V1 and V2 are deliberately separated:

- V1 scoring rejects non-legacy protocols.
- V2 snapshot creation rejects legacy derived artifacts.
- History selectors distinguish valid V1 score snapshots from valid V2 snapshots/assessments.
- Backend sync/restore has V2 snapshot/assessment fields.

Migration should not convert old V1 Movement Age snapshots into V2 facts. Instead:

- Preserve V1 history as "legacy Movement Check-Up estimate."
- Use V2 only for new official measurements after the migration point.
- Ensure Progress can show both legacy trend context and V2 current status without implying direct comparability.
- Keep protocol IDs and source policy versions in every V2 assessment and block origin.

## 16. Shared Architecture And Duplication

Shared or reusable pieces:

- App lifecycle storage/persistence.
- Training block/session generation where focus is claim-neutral.
- Audio asset verification.
- Movement registry patterns.
- History/sync infrastructure.
- Screen shell patterns and Progress navigation.

Duplicate or divergent pieces:

- V1 check-up orchestrator vs V2 live coordinator.
- V1 scoring/norms vs V2 reference engine/assessment.
- V1 results/progress copy vs V2 result view model.
- V1 block automation vs V2 block materialization.
- V1 and V2 entry routes.

Permanent dual systems would be expensive and risky. The target should be one canonical check-up player with versioned protocol adapters, not two public products.

## 17. Hybrid Option Analysis

### Hybrid A: V1 Protocols + V2 References/Results

Reject as canonical.

V1 balance does not produce the same protocol evidence as V2's 45-second best-of-three single-leg balance task. V1 shoulder and chair also lack some V2 setup/practice/provenance detail. Feeding V1 raw outputs into V2 reference policy would create a false sense of comparability.

### Hybrid B: V2 Protocols + V1 Movement Age Results

Reject.

This discards the main benefit of V2 and reintroduces Movement Age/weakest-domain artifacts that V2 explicitly rejects.

### Hybrid C: V1 Shell + V2 Protocols/Results/Artifacts + Stage 5 Lifecycle

Recommended migration path.

Use the mature public app shell and lifecycle while replacing the measurement/result artifact contract with V2. This gives the team the fastest path to public readiness without preserving V1's weaker claim model.

### Hybrid D: V2 Protocols + Selected V1 UI Components

Accept as implementation detail.

V1 components can be reused only when they are claim-neutral: camera setup layout, card shells, navigation affordances, rest UI, and progress scaffolding. Do not reuse V1 Movement Age framing.

### Hybrid E: Unified Canonical Player With Protocol-Version Adapters

Recommended target architecture.

One player should run V2 current protocols and optionally replay/display V1 legacy records through read-only adapters. This reduces maintenance and makes future protocol V2.1/V3 changes safer.

### Hybrid F: Per-Domain Best-Of-Both

Reject unless formalized into one versioned canonical protocol.

Ad hoc mixing would create "V3 by accident" and make claims, QA, and migration harder.

## 18. Weighted Decision Matrix

Scores are current-state implementation scores, not product aspiration scores.

| Criterion | Weight | V1 Canonical | Current V2 Canonical | Unified Hybrid |
|---|---:|---:|---:|---:|
| Raw protocol quality | 15 | 6 | 8 | 8 |
| External claim validity | 15 | 3 | 7 | 8 |
| Focus/plan correctness | 10 | 5 | 7 | 8 |
| User clarity/trust | 10 | 5 | 7 | 8 |
| Live-controller maturity | 12 | 8 | 6 | 7 |
| Safety/fail-closed behavior | 10 | 7 | 7 | 8 |
| Lifecycle completeness | 10 | 9 | 4 | 8 |
| UX friction/audio-first | 6 | 7 | 4 | 7 |
| Data/migration readiness | 5 | 6 | 8 | 8 |
| Maintainability | 4 | 5 | 5 | 8 |
| Release/rollback readiness | 3 | 5 | 4 | 7 |
| Weighted total | 100 | 59.8 | 64.3 | 78.6 |

Interpretation:

- V1 wins only on current lifecycle completeness.
- V2 wins on artifact and claim architecture but loses public readiness.
- Hybrid wins because it keeps V2's claim discipline and borrows only V1's mature shell/lifecycle capabilities.

## 19. Sensitivity Analysis

If scientific/claims validity is weighted higher:

- V1 falls further behind.
- Hybrid and V2 separate from V1.
- Hybrid still beats current V2 because V2 lacks lifecycle/public UX readiness.

If closed-beta speed is weighted higher:

- Current V2 becomes acceptable for invited beta after typecheck triage.
- The recommendation for public production does not change.

If public lifecycle completeness is weighted higher:

- V1 looks strongest today, but only as a temporary public fallback.
- Hybrid remains the proper destination because it can achieve lifecycle parity without preserving V1's Movement Age claims.

If maintenance cost is weighted higher:

- A unified hybrid becomes even more important.
- Permanent dual public systems should be avoided.

If chair reference transform is approved:

- V2 improves materially for low-strength users.
- The recommendation becomes even more strongly V2/hybrid, not V1.

## 20. Severity Findings

### P0

No P0 issue found that invalidates all V1/V2 audit work.

### P1

**MC-SHARED-001: App typecheck currently fails.**
Release gate is blocked by render/diagnostics type errors unrelated to V1/V2 scoring but affecting app health.

**MC-SCI-001: V1 remains public/default despite weaker Movement Age claim model.**
V1 derives public focus/results from domain-age estimates, including sex-pooled and partly extrapolated/estimated references.

**MC-V2-001: Current V2 is not public-ready.**
It is internal-gated, has manual controls in the session path, lacks documented physical-device validation, and lacks lifecycle parity.

**MC-V2-002: Chair strength focus is currently disabled by unapproved transform policy.**
Low chair performance becomes raw-only/balanced instead of strength focus, which is scientifically safer but product-incomplete.

**MC-MIG-001: V2 cannot replace V1 lifecycle as-is.**
V2 lacks public onboarding, public official retest, block report/next-block, and main Progress replacement.

### P2

**MC-UX-001: V2 interaction burden conflicts with audio-first public product law.**
Internal manual buttons are fine for beta, not for public measurement.

**MC-SHARED-002: Permanent V1/V2 dual systems would create high maintenance cost.**
Controllers, result models, blocks, and progress surfaces are currently split.

**MC-V2-003: Progress still treats V1 as the main current snapshot.**
V2 appears as an internal latest card rather than the canonical progress model.

**MC-V2-004: Active-block conflict can leave a completed V2 assessment without a plan CTA.**
Fail-closed behavior is correct, but public UX needs a clear recovery path.

**MC-V1-001: V1 balance protocol is not compatible with V2 balance reference assumptions.**
This blocks a simple V1-protocol/V2-result hybrid.

**MC-MIG-002: Legacy/current history presentation needs explicit user-facing boundaries.**
V1 and V2 records should not appear as one continuous equivalent trend without protocol labels.

### P3

**MC-OPS-001: Expo config shows diagnostics release flags enabled.**
`enablePoseLatencyDiagnostics` and `allowDiagnosticsInRelease` appear in public config. This may be intentional during internal beta, but should be reviewed before public release.

## 21. Beta Readiness Recommendation

Closed beta can proceed with current V2 only if framed as protocol validation, not production readiness.

Minimum before invited beta:

- Fix or explicitly waive `npm run typecheck` failures.
- Confirm `npm test -- --runInBand`, `npm run verify:audio`, `npx expo config`, and export remain green.
- Keep V2 behind internal/closed-beta flag.
- State clearly in beta copy that chair comparison is personal-baseline/raw-only until reference transform approval.
- Capture physical-device landmark recordings for chair, balance, shoulder, and interruption scenarios.
- Add replay tests for any surprising beta behavior before threshold changes.

## 22. Public Production Recommendation

Do not ship public production on current V2 as-is.

Public path should be:

1. Make V2 protocol/artifact/assessment the canonical current measurement model.
2. Reuse V1 shell/lifecycle where claim-neutral.
3. Replace V1 onboarding baseline with a V2 baseline.
4. Replace official retest with V2 official retest.
5. Replace Progress current snapshot/trends with V2 current status and protocol-labeled history.
6. Keep V1 as legacy history display only.
7. Validate on Android and iOS devices before enabling for public users.

## 23. Deprecation And Canonicalization Map

Keep:

- V1 historical records.
- V1 score snapshot rendering for legacy history only.
- V1 camera setup/session UI patterns where claim-neutral.
- V1 training lifecycle mechanics where compatible with V2-origin blocks.

Replace:

- New public V1 `beginCheckUp` baseline/retest with V2-backed flow.
- V1 Movement Age result copy for new measurements.
- V1 weakest-domain focus for new measurements.
- V1 Progress hero as the current movement state.

Remove or archive later:

- Public entry to V1 once V2/hybrid is proven.
- Duplicate V1 public copy once no longer reachable.
- Any bridge that converts V2 evidence into V1 score snapshots.

## 24. Recommended Roadmap

### Stage 0: Health Gate

- Fix typecheck.
- Review release diagnostics flags.
- Keep V2 internal.

### Stage 1: Device Validation

- Run V2 chair, balance, shoulder, hinge on Android and iOS physical devices.
- Capture landmark recordings for normal, low-light, interruption, setup-uncertain, pain-limited, and balance-touchdown cases.
- Add replay tests before tuning thresholds.

### Stage 2: Hybrid Public Shell

- Route baseline and official retest to a V2-backed check-up behind a staged flag.
- Convert manual V2 controls into audio-first or pre-session choices.
- Keep dev diagnostics behind internal/dev controls.

### Stage 3: V2 Lifecycle Parity

- Make V2 assessment the canonical Progress current state.
- Add V2 official retest block report/next-block behavior.
- Handle balanced-block micro-check or explicitly suppress it with product copy.
- Surface fail-closed block conflicts clearly.

### Stage 4: Legacy Migration

- Label V1 history as legacy estimates.
- Avoid direct trend equivalence between V1 Movement Age and V2 reference statuses.
- Keep V1 read-only until enough users have V2 history.

### Stage 5: Canonical Cleanup

- Remove public V1 check-up route.
- Keep only legacy display/replay support.
- Consolidate player architecture under versioned protocol adapters.

## 25. Founder Packet

Decision in one sentence:

> V2 is the right measurement and claims foundation, V1 is the better public shell today, so the product should ship a unified hybrid rather than bless either current system wholesale.

Why not V1:

- It is polished, but the Movement Age model is weaker and partly estimate/extrapolation-driven.
- It can select a training focus that V2's evidence policy would not select.
- Keeping it canonical prolongs the wrong claim architecture.

Why not V2 as-is:

- It is still internal and manually controlled.
- It is missing public lifecycle parity.
- Chair comparison is raw-only today.
- Device validation evidence is still needed.
- The repository typecheck fails.

Why hybrid:

- Preserves V2's safer raw/reference/provenance model.
- Reuses V1's mature onboarding, block, and progress lifecycle where safe.
- Avoids permanent dual product complexity.
- Gives beta testers the new measurement model while protecting public trust.

## 26. Evidence Gaps

These gaps could affect launch timing but not the architectural recommendation:

- No physical-device V2 validation evidence was found in code/docs during this audit.
- Chair-rise reference transform requires approval before public strength comparison/focus.
- V2 public copy still needs full legal/science review once the result model is final.
- V2 balanced training and micro-check policy needs product decision.
- Current render/typecheck errors need triage.

## 27. Final Decision

**Build the unified hybrid.**

Treat V2 as the canonical measurement/result artifact model for new check-ups, V1 as mature shell/lifecycle infrastructure and legacy history. Do not ship V1 as the long-term current measurement product, and do not ship current V2 as public production without the health, lifecycle, UX, and device-validation work above.

Confidence: **medium-high**.

The main uncertainty is physical-device validation, which could change protocol thresholds or beta timing. It is unlikely to make V1's Movement Age model the better long-term product foundation.

## 28. Final Cleanup And Audit Hygiene

Audit-created temp directories:

```text
/tmp/pearl-checkup-v1-v2-audit
/tmp/pearl-checkup-v1-v2-audit-export
```

Both were removed after the audit.

Audit-created repo file:

```text
docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md
```

Final status summary after writing this report:

```text
66  M
148 ??
```

`git ls-files --others --exclude-standard -- docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md` confirms this report is untracked. `git diff --name-only -- docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md` is empty because the report is a new untracked file.

No implementation files were intentionally modified by this audit.
