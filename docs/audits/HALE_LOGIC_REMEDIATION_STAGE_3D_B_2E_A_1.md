# Hale Logic Remediation - Stage 3D-B.2E-A.1

Date: 2026-06-24

Scope: live Movement Profile V2 software completion after Stage 3D-B.2E-A. This stage closed active-flow V2 voice/text parity, the live replay snapshot-to-assessment break, JSON-safe supporting hinge no-measurement handling, and internal V2 artifact recovery. This stage did not perform physical-device validation.

## Gaps Addressed

1. Full V2 active-flow voice/text parity now has a canonical V2 cue vocabulary, visible text resolver, sequencer, selected-voice required assets, static manifest entries, and audio fingerprints.
2. The prior deterministic live replay now reaches: raw V2 Check-Up -> immutable V2 snapshot -> immutable V2 assessment -> Movement Profile V2 view model.
3. Supporting hinge no-measurement at the V2 live boundary now uses explicit `null` rather than persisting `NaN`.
4. Internal V2 artifact recovery now has a typed classifier and an internal-only recovery screen.

Preserved policies: V2 remains internal; V1 remains public/default; no V2 MovementBlock, report, public route, Warden chair transform, source-table change, medical/risk/pass/fail claim, improvement/decline claim, package install, lockfile change, staging, commit, branch, or push.

## Initial Git Status

Initial status observed at the beginning of this continuation:

```text
 M .env.example
 M App.tsx
 M src/checkup/movementProfileV2.ts
 M src/checkup/protocolEvidence.ts
 M src/history/trends.ts
 M src/movements/hingeReach.ts
 M src/scoring/scoring.ts
 M src/screens/MovementProfileV2CheckUpScreen.tsx
 M src/screens/SettingsScreen.tsx
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
?? docs/audits/HALE_VOICE_SPEC_V2_1_APPROVED_DECISIONS_CODEX_PROMPT.md
?? docs/audits/Hale_Stage_3D_B_2E_A_1_Live_V2_Software_Completion_Voice_Parity_Prompt.md
?? docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md
?? docs/specs/HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md
?? docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv
?? docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json
?? docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md
?? docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv
?? docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md
?? src/movementProfileV2/__tests__/liveCoordinator.test.ts
?? src/movementProfileV2/liveCoordinator.ts
?? src/movementProfileV2/liveDiagnostics.ts
?? src/movementProfileV2/voiceCues.ts
```

Concurrent external/user-owned work was preserved. `.env` values were not inspected or exposed.

## Prior Failure Reproduction And Root Cause

The focused live replay produced a raw Check-Up and immutable snapshot, then assessment returned `v2_assessment_raw_incomplete`.

Reproduction matrix:

| Domain/item | Raw result present | Raw validity | Protocol evidence | Snapshot interpretation | Domain evidence | Why assessment said incomplete |
| --- | --- | --- | --- | --- | --- | --- |
| Chair | yes | valid reps | `reference_protocol_complete` | raw metric `8`, chair remains raw-only because Warden transform is disabled | `raw_only_valid` | not missing |
| Balance | yes | valid best hold, about `2.132 sec` | `raw_only_protocol_incomplete` | raw metric present, `starting_point_low`, reference claim ineligible | `hale_starting_point` | incorrectly marked missing |
| Shoulder | yes | valid peak angle | `reference_protocol_complete` | raw metric about `161.6 deg`, reference eligible | `within_reference` or better depending fixture | not missing |
| Hinge supporting | yes or no-measurement | supporting only | n/a | n/a for headline completeness | n/a | not a headline requirement |

Exact cause: `src/checkup/movementProfileV2.ts` `evaluateMovementProfileV2Completeness` used `isReferenceProtocolComplete(status)` to fill the raw completeness `missingHeadlineMovementIds`. That equated reference eligibility with usable raw V2 evidence. A valid raw-only/reference-incomplete balance result was therefore recorded as missing, and `snapshotRawComplete()` in `src/reference/movementProfileV2/assessment.ts` rejected the snapshot because `snapshot.interpretation.rawCompleteness.referenceComplete` was false. The field name is historically misleading; it now means every headline item has usable raw evidence, while reference eligibility remains tracked separately in each domain interpretation.

The fix added `isValidMovementProfileV2RawEvidence(status)` in `src/checkup/protocolEvidence.ts` and uses it for raw completeness. `invalid_measurement` still blocks headline completeness; raw-only statuses do not.

## Corrected Artifact Chain

The live coordinator replay now proves:

```text
live chair practice + official reps
-> live balance trial/use-best
-> live selected-side shoulder capture
-> supporting hinge capture or explicit no-measurement
-> raw V2 Check-Up
-> immutable V2 snapshot
-> immutable V2 assessment
-> Movement Profile V2 view model
```

`src/movementProfileV2/__tests__/liveCoordinator.test.ts` calls the production coordinator, snapshot builder, assessment builder, `materializeOfficialMovementProfileV2Artifacts`, and `buildMovementProfileV2ResultsViewModel`.

`src/reference/movementProfileV2/__tests__/assessment.test.ts` now covers:

- Case A: raw-complete low balance creates a balance-domain focus.
- Case B: all-valid raw-only/reference-incomplete evidence can create a balanced assessment.
- Existing invalid-headline cases remain fail-closed.

Negative behavior retained: missing or invalid chair/balance/shoulder still blocks official snapshot/assessment materialization and can result in needs-retake/ineligible handling. Supporting hinge remains outside headline completeness.

## JSON-Safe No-Measurement

Inventory:

| Path | Non-finite possibility | Persisted? | Fix |
| --- | --- | --- | --- |
| Generic legacy hinge grader | `NaN` for no measurement | legacy serialization normalizes non-finite to `null` | legacy contract left unchanged |
| Live V2 supporting hinge boundary | previously could place `NaN` in raw Check-Up | yes, before JSON conversion | live V2 result now writes `reachBu: null` when no supporting measurement is captured |
| Scoring/trends hinge consumers | assumed finite number | display/history path | guards now require `typeof reachBu === 'number' && Number.isFinite(...)` |
| V2 snapshot/assessment | headline metrics finite or raw nulls | yes | tests assert JSON round-trip and no `NaN`/infinity |
| Diagnostics export | bounded transition/summary data only | exported text | existing bounded privacy-safe serializer retained |

No finite sentinel was introduced. `null` is the explicit V2 live supporting no-measurement value. The raw Check-Up, snapshot, and assessment tests assert no `NaN`, `Infinity`, or `-Infinity` survives JSON serialization.

## Voice Source Of Truth And Cue Matrix

Approved V2.1 cue text was used where present: `final-position-set-v21`, `tracking-loss-v21`, `tracking-recovered-v21`, `retry-v21`, `times-up-v21`, `checkup-complete-v21`, `item-complete-v21`, and the V2.1 check-up chair/balance/shoulder/hinge setup cues. Stage fallback text was used only for missing active-flow semantics such as balance rest, attempt saved, 30/60-second readiness, use-best, and no-measurement completion.

Runtime cue matrix:

| Runtime V2 state/transition | Visible text source | Cue IDs | Clara asset | Marcus asset | Status |
| --- | --- | --- | --- | --- | --- |
| Initial intro | canonical V2 cue definitions | `mpv2_checkup_intro`, `checkup-chair-stand-intro-v21`, `checkup-chair-stand-setup-v21` | yes | yes | verified |
| Chair setup/practice/countdown | canonical V2 cue definitions | `checkup-chair-stand-intro-v21`, `mpv2_chair_practice_start`, `mpv2_chair_official_ready` | yes | yes | verified |
| Chair official active | existing controller/timer plus V2 visible text | setup cue text; countdown/go remain timer-owned | existing and V2 assets | existing and V2 assets | verified |
| Balance setup | canonical V2 cue definitions | `times-up-v21`, `checkup-balance-intro-v21`, `checkup-balance-single-leg-v21` | yes | yes | verified |
| Balance trial start | canonical V2 cue definitions | `mpv2_balance_attempt_start` | yes | yes | verified |
| Balance saved/rest | canonical V2 cue definitions | `mpv2_balance_attempt_saved`, `mpv2_balance_rest` | yes | yes | verified |
| Balance 30 sec ready | canonical V2 cue definitions | `mpv2_balance_ready_after_30` | yes | yes | verified |
| Balance 60 sec ready | canonical V2 cue definitions | `mpv2_balance_ready_after_60` | yes | yes | verified |
| Balance use-best | canonical V2 cue definitions | `mpv2_balance_use_best`, `mpv2_balance_complete` | yes | yes | verified |
| Balance invalid retry | canonical V2 cue definitions | `mpv2_balance_tracking_retry` | yes | yes | verified |
| Balance 45 sec ceiling | canonical V2 cue definitions | `mpv2_balance_full_hold`, `mpv2_balance_complete` | yes | yes | verified |
| Shoulder setup/side | canonical V2 cue definitions | side-specific `checkup-shoulder-turn-*`, `checkup-shoulder-raise-*`, `final-position-set-v21` | yes | yes | verified |
| Shoulder retry | canonical V2 cue definitions | `mpv2_shoulder_tracking_retry` | yes | yes | verified |
| Hinge setup | canonical V2 cue definitions | `item-complete-v21`, `checkup-hinge-setup-v21`, `final-position-set-v21` | yes | yes | verified |
| Raw complete | canonical V2 cue definitions | `mpv2_hinge_complete` or `mpv2_hinge_no_measurement`, then `checkup-complete-v21` | yes | yes | verified |

Canonical implementation: `src/movementProfileV2/voiceCues.ts`.

Cue architecture:

- deterministic cue definition order;
- schema version and policy fingerprint;
- one visible text resolver;
- pure transition-to-cue resolver;
- `MovementProfileV2VoiceSequencer` dedupes by transition time, from/to, reason, movement epoch, and attempt epoch;
- screen cleanup disposes the sequencer and stops pending voice;
- `VoiceChannel` drops lower-priority stale cues and allows higher-priority recovery interruption;
- required V2 cue assets cannot cross-fallback between Clara and Marcus.

Timer authority remains in the live coordinator. Rest readiness and active timers are driven by monotonic timer ticks, not voice-completion callbacks.

## Audio Generation And Integrity

Generator changes:

- `scripts/generate-audio.ts` supports `--group movement_profile_v2`;
- dry run, force, selected voice/all voices supported;
- missing/stale-only generation;
- no voice directory deletion for V2 group;
- atomic temp writes;
- provider errors sanitized;
- V2 metadata written separately in `src/audio/movementProfileV2AudioManifest.ts`;
- safety metadata untouched for V2-only generation.

Dry run before generation:

```text
Movement Profile V2 audio dry run requiredAssets=62 valid=0 missing=62 stale=0 zeroByte=0 forced=0 providerCalls=62 providerCredentials=present
```

Generation result:

- provider calls: 62;
- Clara generated: 31, reused: 0, missing after generation: 0;
- Marcus generated: 31, reused: 0, missing after generation: 0;
- binary inventory: 62 new MP3 assets, `3.0M total` by `du -ch`;
- static Metro mappings added to `src/audio/manifest.ts`;
- fingerprints cover schema, cue schema, cue-policy fingerprint, cue ID, canonical text, voice ID, provider voice ID, provider, model, output format, and voice settings.

Dry run after generation:

```text
Movement Profile V2 audio dry run requiredAssets=62 valid=62 missing=0 stale=0 zeroByte=0 forced=0 providerCalls=0 providerCredentials=present
```

Audio verifier result:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3057566 durationRange=0.743-6.037s total: requiredAssets=150
```

Existing safety audio remained 44 cues / 88 assets and was not regenerated.

## Recovery

New typed classifier: `src/movementProfileV2/recovery.ts`.

States covered:

- `ready`;
- `raw_complete_missing_snapshot`;
- `snapshot_missing_assessment`;
- `raw_incomplete`;
- `snapshot_malformed_or_mismatched`;
- `assessment_malformed_or_mismatched`;
- `immutable_conflict`;
- `unsupported_future_artifact`;
- `sync_pending_local_ready`.

The classifier derives from existing parsers/selectors and does not create snapshots or assessments. Missing snapshot and missing assessment states route to finish/materialization paths; raw-incomplete and malformed/future states route to retake/fresh internal capture without overwriting frozen artifacts. `src/screens/MovementProfileV2RecoveryScreen.tsx` is internal-only and uses calm copy without parser codes or artifact jargon.

Recovery tests cover ready, sync pending, raw-complete missing snapshot, snapshot missing assessment, raw incomplete, future artifact, snapshot mismatch, malformed assessment, and copy guardrails.

## Diagnostics Non-Regression

Existing live diagnostics remain opt-in behind the internal V2 gate plus diagnostics flag. Export remains bounded and excludes landmarks/video/PII. Tests verify transition list bounds and absence of raw pose payload names. No secret-bearing voice paths or provider credentials are exported.

## Files Changed

Task-owned code and tests:

- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- `src/history/trends.ts`
- `src/movements/hingeReach.ts`
- `src/movements/__tests__/hingeReach.test.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/reference/movementProfileV2/__tests__/assessment.test.ts`
- `src/scoring/scoring.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`

Generated binary assets:

- 31 Clara Movement Profile V2 MP3 files under `assets/audio/voice/clara/`
- 31 Marcus Movement Profile V2 MP3 files under `assets/audio/voice/marcus/`

Concurrent external/user-owned files still present and not reverted:

- `.env.example`
- `App.tsx`
- `src/screens/SettingsScreen.tsx`
- prior Stage 3D-B.2E-A files/report;
- V2.1 voice spec/prompt files under `docs/audits/` and `docs/specs/`.

## Tests Added Or Changed

Added:

- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`

Changed:

- live coordinator full-chain test now asserts assessment/materializer/view-model success;
- assessment tests now cover raw-only/reference-incomplete domain and balanced cases;
- voice player tests now cover no required V2 cross-fallback and busy priority behavior;
- hinge reach tests now account for `number | null` while preserving legacy `NaN` grader behavior.

## Validation

Targeted validation:

```text
npm test -- --runInBand src/reference/movementProfileV2/__tests__/assessment.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/voiceCues.test.ts src/movementProfileV2/__tests__/recovery.test.ts src/audio/__tests__/voicePlayer.test.ts src/audio/__tests__/movementProfileV2Audio.test.ts src/movements/__tests__/hingeReach.test.ts
```

Result before final voice-player test addition: 7 suites / 43 tests passed. Final focused audio rerun:

```text
npm test -- --runInBand src/audio/__tests__/voicePlayer.test.ts
```

Result: 1 suite / 8 tests passed.

Full validation on final code:

```text
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
rm -rf /tmp/hale-stage3db2ea1-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2ea1-export
rc=$?
rm -rf /tmp/hale-stage3db2ea1-export
exit $rc
```

Results:

- `npm run verify:audio`: pass, safety 44/88, Movement Profile V2 31/62, total 150 assets.
- `npm test -- --runInBand`: pass, 121 suites / 1005 tests.
- `npm run typecheck`: pass.
- `npm --prefix website run typecheck`: pass.
- `npx --no-install expo config --type public`: pass with expected Sentry fallback warning; environment reported diagnostics flags.
- `git diff --check`: pass.
- Expo export: pass for Android and iOS, 442 assets, temp output removed.

Warnings observed:

- Watchman recrawl warning during Jest, pre-existing.
- Jest open-handle notice after full suite, pre-existing pattern.
- Expected backend sync test logs/warnings.
- Expo Sentry fallback warning for missing organization/project config, pre-existing.
- Export may emit Node `NO_COLOR`/`FORCE_COLOR` warnings in some runs; the final export passed.

No validation command intentionally changed files after generation except normal cache/temp output outside the repo.

## Regression Coverage

Stage 3D-B.2A through 2E-A coverage is included through Movement Profile V2 protocol, snapshot, assessment, persistence, internal flow, live coordinator, view model, and new cue/recovery suites. Stage 2A.1, Stage 4 closure, Stage 5G/5H, V1 check-up/scoring, navigation, history, backend sync/restore/export, safety audio, and TypeScript boundaries are covered by the full Jest suite and typechecks.

Containment confirmed:

- V1 remains public/default.
- V2 remains internal.
- No V2 MovementBlock or report is created.
- Warden chair transform remains disabled.
- No source table or transform was changed.
- No public route was added for V2 recovery.
- No physical-device validation is claimed.

## Physical-Device Runbook Handoff

Next stage only, not performed here:

1. Clara full live run.
2. Marcus full live run.
3. Chair practice and official count.
4. Balance 45-second ceiling, early touchdown, invalid tracking retry, 30-second ready, 60-second ready, and use-best.
5. Shoulder selected-side and invalid retry.
6. Hinge no-measurement.
7. Background each active stage.
8. Raw Check-Up -> snapshot -> assessment -> Movement Profile.
9. Raw-pending recovery.
10. Diagnostics/audio export review.
11. Offline local result with sync retry.

## Remaining Stage 3D-B Work

Physical-device validation remains the next required stage. Stage 3D-B.2D.2C is no longer blocked by the software artifact-chain, voice parity, JSON safety, or recovery gaps addressed here; it remains dependent on the planned real-device validation and product-owner sign-off before any broader rollout or downstream training/report work.

## Final Git Status

Final status must be read from Git after this report is added. Expected categories:

- tracked code/test/script/audio-manifest changes listed above;
- 62 new V2 MP3 assets;
- this new report;
- pre-existing user-owned dirty/untracked files preserved.

No package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

## Stage Decisions

STAGE 3D-B.2E-A.1 COMPLETE

LIVE V2 SNAPSHOT ASSESSMENT PROFILE CHAIN VERIFIED

V2 JSON-SAFE NO-MEASUREMENT VERIFIED

V2 VOICE TEXT PARITY VERIFIED

V2 MALFORMED-ARTIFACT RECOVERY IMPLEMENTED

STAGE 3D-B.2E-A SOFTWARE COMPLETION VERIFIED

SOFTWARE READY FOR PHYSICAL-DEVICE VALIDATION
