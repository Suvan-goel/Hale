# Pearl MPV2 / Voice V2.1 Reconciliation

## 1. Executive Verdict

- Preliminary verdict: READY_FOR_HUMAN_LISTENING
- Branch/commit: dev / 1ff532d
- Worktree state: dirty_before_audit_work
- Current added cue-key count: 31
- Current added MP3 count: 62
- Clara/Marcus pair count: 31
- MPV2 runtime-reachable cue count: 28
- Exact V2.1 matches: 16
- Alias/reuse candidates: 1
- Script conflicts: 2
- Current-only MPV2 operational cues: 15
- Legacy-only cues: 2
- Source/manifest defects: 0
- Assets requiring listening: 68
- Technical QC failures/outliers: 15
- Approved-decision conflicts: 0
- V2.1 patch required before listening: no
- Audio regeneration justified now: no
- Exact next step: Have the founder complete the local listening review and export the JSON, then run the targeted MPV2 runtime audit using PEARL_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json.

## 2. Scope and Method

This focused audit covers the changed MPV2 voice path, all 31 newly added cue keys, the current MPV2 event-to-cue graph, and the three known overlap cases. It uses current source, current manifests, the previous broad reconciliation, the V2.1 manifest/spec, local git state, and local ffmpeg/ffprobe metadata. No production code, manifests, tests, generation scripts, or audio files were changed.

## 3. Live Repository Snapshot

- Branch: dev
- HEAD: 1ff532db38850db1d2b254719836dd147826ea43
- Upstream: origin/dev
- Worktree clean: false
- Node: v25.2.1
- ffmpeg: ffmpeg version 8.1 Copyright (c) 2000-2026 the FFmpeg developers

## 4. Current MPV2 Flow and Battery

The current MPV2 live check-up is a camera-driven chair stand, single-leg balance, active shoulder reach, and hinge reach flow. It does not include TUG in the default MPV2 path. Balance is currently an eyes-open single-leg attempt protocol with rest/use-best branches, not the full V2.1 balance ladder. Chair timing uses an internal 3000 ms countdown and does not currently emit spoken countdown-three/two/one/go.

## 5. Current Added Cue Surface

All 31 current added cue keys are present in source and have Clara/Marcus physical MP3 pairs. Three of those keys are defined and bundled but not currently emitted by the MPV2 live sequencer: tracking-loss-v21, tracking-recovered-v21, retry-v21.

## 6. Full MPV2 Runtime Cue Surface

Runtime-reachable MPV2 cue keys (28): checkup-balance-intro-v21, checkup-balance-single-leg-v21, checkup-chair-stand-intro-v21, checkup-chair-stand-setup-v21, checkup-complete-v21, checkup-hinge-setup-v21, checkup-shoulder-raise-left-v21, checkup-shoulder-raise-right-v21, checkup-shoulder-turn-left-v21, checkup-shoulder-turn-right-v21, final-position-set-v21, item-complete-v21, mpv2_balance_attempt_saved, mpv2_balance_attempt_start, mpv2_balance_complete, mpv2_balance_full_hold, mpv2_balance_ready_after_30, mpv2_balance_ready_after_60, mpv2_balance_rest, mpv2_balance_tracking_retry, mpv2_balance_use_best, mpv2_chair_official_ready, mpv2_chair_practice_start, mpv2_checkup_intro, mpv2_hinge_complete, mpv2_hinge_no_measurement, mpv2_shoulder_tracking_retry, times-up-v21.

## 7. Canonical Cue Map

Canonical map artifact: `docs/audits/PEARL_MPV2_VOICE_CANONICAL_MAP.csv`.

Key classifications:

- Exact V2.1 matches: 16
- Current-only MPV2 operational cues: 15
- Conditional legacy/overlap rows: 2
- Same-key script conflicts: 2

## 8. V2.1 Reconciliation

The V2.1-approved shared/check-up lines in the current MPV2 source match by exact key and exact script where present. The MPV2-specific operational lines remain current-only and should not be forced into the general V2.1 namespace before listening and runtime audit. TUG remains conditional legacy and is not promoted into the default MPV2 battery.

## 9. Approved Founder-Decision Alignment

No approved-decision conflicts were found. FD-002 is script-valid but implementation-dependent for persisted side comparability because current side choices are passed through setup/grader state, while broader persistence remains outside this audio review. FD-003 is aligned for current default MPV2 because no eyes-closed cue is reachable. FD-006 is aligned because MPV2 does not speak total set count.

## 10. MPV2 Operational Cue Review

- mpv2_balance_attempt_saved: useful completion/progress confirmation; understandable but uses storage/measurement wording rather than user-centered wording; later action: keep_current_mpv2_operational.
- mpv2_balance_attempt_start: user-essential for eyes-off flow; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_balance_complete: useful completion/progress confirmation; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_balance_full_hold: useful operational narration; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_balance_ready_after_30: useful operational narration; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_balance_ready_after_60: useful operational narration; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_balance_rest: useful operational narration; line may be long in motion and needs runtime collision review; later action: keep_current_mpv2_operational.
- mpv2_balance_tracking_retry: user-essential recovery guidance; line may be long in motion and needs runtime collision review; later action: keep_current_mpv2_operational.
- mpv2_balance_use_best: useful completion/progress confirmation; understandable but uses storage/measurement wording rather than user-centered wording; later action: keep_current_mpv2_operational.
- mpv2_chair_official_ready: user-essential for eyes-off flow; wording exposes implementation concepts and should be reconsidered after listening; later action: rewrite_current_script_later.
- mpv2_chair_practice_start: user-essential for eyes-off flow; copy is suitable for human listening review; later action: keep_current_mpv2_operational.
- mpv2_checkup_intro: user-essential for eyes-off flow; wording exposes implementation concepts and should be reconsidered after listening; later action: rewrite_current_script_later.
- mpv2_hinge_complete: useful completion/progress confirmation; understandable but uses storage/measurement wording rather than user-centered wording; later action: keep_current_mpv2_operational.
- mpv2_hinge_no_measurement: useful operational narration; understandable but uses storage/measurement wording rather than user-centered wording; later action: rewrite_current_script_later.
- mpv2_shoulder_tracking_retry: user-essential recovery guidance; line may be long in motion and needs runtime collision review; later action: keep_current_mpv2_operational.

## 11. Known Overlap Resolution

- chair-result-prefix-v21: Different-key same-script alias candidate; keep current physical you-completed asset as A/B reference and alias later only after listening.
- tug-intro: Conditional legacy TUG cue; current source differs from V2.1 proposed wording and is not current MPV2-reachable. Keep conditional only.
- tug-setup: Conditional legacy TUG cue; current source differs from V2.1 proposed wording and is not current MPV2-reachable. Keep conditional only.

## 12. Source-to-Binary Provenance

All 62 new MP3s are untracked assets with current source expectations and generated metadata, but actual spoken content remains pending human listening. Overlap reference assets are historical binaries and still require listening before V2.1 reuse/alias approval.

## 13. Clara and Marcus Technical Parity

Both voices have complete physical pairs for the 31 added keys and the overlap/reference assets. Pair duration deltas are recorded in `docs/audits/PEARL_MPV2_VOICE_ASSET_QC.csv`; technical differences are not treated as semantic approval.

## 14. Acoustic QC

QC artifact: `docs/audits/PEARL_MPV2_VOICE_ASSET_QC.csv`. Rows: 68. Outlier/failure rows: 15. Technical QC does not replace listening.

## 15. Listening Review Pack

- HTML tool: `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW.html`
- Guide: `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW_GUIDE.md`
- Listening-review rows: 34
- Serve from repo root with `python3 -m http.server 8000`, then open `http://127.0.0.1:8000/docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW.html`.

## 16. Current Event-to-Cue Graph

Event graph rows: 29. The graph includes normal MPV2 transitions, recovery/interrupt branches, defined-but-not-emitted shared recovery cues, missing required cue handling, and playback-start failure handling.

## 17. Targeted Runtime Audit Handoff

- Runtime input: `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- Runtime scope: `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`
- Required later scenarios: 42

## 18. Exact Next Step

Complete the local listening review, export the JSON result from the HTML tool, and use that result plus `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json` to run the targeted MPV2 runtime timing audit. Do not generate audio unless listening or technical QC identifies a specific failed asset.

## 19. Validation and Limitations

No source/manifest defects were found.

Validation status: pass. Hard failures: 0.

Limitations:

- No human listened to or transcribed the files during this audit; expected scripts remain source expectations until the listening pack is completed.
- Local ffmpeg/ffprobe metrics are technical checks only and do not prove semantic correctness.
- The current worktree was already dirty; this audit treats untracked MPV2 files as current state without changing them.
- The targeted runtime timing audit was scoped but intentionally not run.

## 20. Complete Source Index

- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/movementProfileV2/recovery.ts`
- `src/audio/cues.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `docs/audits/PEARL_VOICE_CURRENT_STATE_RECONCILIATION.json`
- `docs/audits/PEARL_VOICE_CURRENT_ASSET_INVENTORY.csv`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
