# Pearl Voice Current-State Reconciliation

## 1. Executive Verdict

- Primary verdict: RERUN_RUNTIME_AUDIT
- Secondary flags: RECONCILE_ASSETS_WITH_V2_1, BASELINE_REFRESH_ONLY, SCRIPT_REVIEW_UPDATE
- Current Git commit: 1ff532d (1ff532db38850db1d2b254719836dd147826ea43)
- Worktree state: dirty; uncommitted/untracked voice-relevant files present
- Baseline method and confidence: git_commit_and_prior_artifacts, high
- Current physical audio count: 363
- Current spoken asset count: 362
- Current SFX count: 1
- Current voice count: 2
- Current Clara count: 181
- Current Marcus count: 181
- Added assets: 62
- Removed assets: 0
- Modified assets: 0
- Renamed/moved assets: 0
- Missing pairs: 0
- Corrupt assets: 0
- Orphan assets: 0
- Current cue-definition count: 181
- Current runtime-reachable cue count: 93
- Current V2.1 exact matches: 22
- Current V2.1 key/script conflicts: 3
- Whether the runtime audit remains valid: no
- Whether V2.1 remains valid: not as written
- Whether audio generation is safe: no
- Exact next action: Reconcile current Movement Profile V2/V2.1 cue assets, manifests, source text, and preview-pack status, then rerun the runtime timing audit for the changed MPV2 controller before any further audio generation or integrated preview.

## 2. Repository Snapshot

Generated at 2026-06-24T15:01:53.915Z. Branch `dev` tracks `origin/dev` and is at `1ff532d`. The branch is not detached.

Relevant staged changes: 0. Relevant unstaged changes: 12. Relevant untracked files: 81. Relevant ignored files: 0.

Git LFS command availability: not available. Audio files were checked for LFS pointer text directly; no current audio asset in the inventory is an LFS pointer. Submodules do not affect audio.

Node/package state: Node v25.2.1, npm 11.6.2, package manager npm/package-lock.json. Expo ~56.0.11, React Native 0.85.3, expo-audio ~56.0.12, expo-av not installed.

## 3. Baseline Establishment

Baseline method A was available. Commit `4b4c57c05ba02b87e5946beda1f44797180a4391` (4b4c57c05ba02b87e5946beda1f44797180a4391) introduced the prior cue inventory and contains the audited 301 tracked audio files. Its tracked audio tree hash matches HEAD's tracked audio tree hash, so committed audio is unchanged from the prior audited asset state. The current differences are untracked MP3 additions plus uncommitted source and manifest changes.

## 4. Current Audio Asset Surface

The repository currently contains 363 audio files: 362 spoken MP3 files under `assets/audio/voice/` and 1 WAV SFX file under `assets/audio/sfx/`. Per voice, Clara has 181 spoken files and Marcus has 181. The old baseline had 150 spoken files per voice; the current worktree has 31 additional cue keys per voice.

Current added cue keys: checkup-balance-intro-v21, checkup-balance-single-leg-v21, checkup-chair-stand-intro-v21, checkup-chair-stand-setup-v21, checkup-complete-v21, checkup-hinge-setup-v21, checkup-shoulder-raise-left-v21, checkup-shoulder-raise-right-v21, checkup-shoulder-turn-left-v21, checkup-shoulder-turn-right-v21, final-position-set-v21, item-complete-v21, mpv2_balance_attempt_saved, mpv2_balance_attempt_start, mpv2_balance_complete, mpv2_balance_full_hold, mpv2_balance_ready_after_30, mpv2_balance_ready_after_60, mpv2_balance_rest, mpv2_balance_tracking_retry, mpv2_balance_use_best, mpv2_chair_official_ready, mpv2_chair_practice_start, mpv2_checkup_intro, mpv2_hinge_complete, mpv2_hinge_no_measurement, mpv2_shoulder_tracking_retry, retry-v21, times-up-v21, tracking-loss-v21, tracking-recovered-v21.

## 5. Asset Integrity

All current audio paths were enumerated once, SHA-256 hashed, probed with `ffprobe`, and decode-tested locally with `ffmpeg -f null`. Corrupt asset count is 0. Missing voice pairs: 0. Orphan assets by manifest/source coverage: 0. See `PEARL_VOICE_CURRENT_ASSET_INVENTORY.csv` for per-file hash, duration, codec, decode health, and pairing.

## 6. Current Cue and Generation Source

`scripts/generate-audio.ts` now has three groups: `all`, `safety`, and `movement_profile_v2`. A dry run reports 181 lines per voice. The current source definitions contain 181 cue keys including number cues `num-0` through `num-40`, 44 safety cues, and 31 Movement Profile V2 cues.

## 7. Current Manifests and Pairing

`src/audio/manifest.ts` maps the current 362 spoken files plus `rep-credit.wav`. `src/audio/safetyAudioManifest.ts` covers 88 required safety assets. `src/audio/movementProfileV2AudioManifest.ts` covers 62 required Movement Profile V2 assets. Clara and Marcus are structurally paired across all 181 spoken cue keys.

## 8. Current Runtime Reachability

The legacy assessment, training, and micro-check paths still relay controller `VoiceRequest` objects into `VoiceChannel.speak`. The new Movement Profile V2 path is reachable through `MovementProfileV2CheckUpScreen` and `MovementProfileV2VoiceSequencer`, and currently references the new `mpv2_*` and selected `*-v21` cues.

## 9. Runtime Architecture Delta

- unchanged_verified: Runtime uses bundled audio rather than runtime TTS. Evidence: src/audio/voicePlayer.ts imports expo-audio and static manifests; scripts/generate-audio.ts is the only ElevenLabs caller. Impact: NO_IMPACT.
- unchanged_verified: One voice sequence plays at a time. Evidence: VoiceChannel has one AudioPlayer, pendingCues, playing, and currentPriority. Impact: NO_IMPACT.
- partially_changed: Lower/equal-priority incoming speech is dropped while busy; higher priority interrupts. Evidence: VoiceChannel.speak policy remains, but voicePriority now has MPV2/V2.1 branches and MPV2 definitions carry priority 50-100. Impact: RUNTIME_REAUDIT_REQUIRED.
- changed: Missing asset behavior. Evidence: resolveVoiceCueAsset now fails closed for safety and Movement Profile V2 cues; playCue catches missing assets and playback-start failures without leaving the channel busy. Impact: RUNTIME_REAUDIT_REQUIRED.
- changed: Assessment countdown and active timing path. Evidence: Legacy SessionController still frame-timestamp-gates countdown, but MovementProfileV2CheckUpScreen emits initial speech from React effects and subsequent speech from timer/user-action transitions. Impact: RUNTIME_REAUDIT_REQUIRED.
- unchanged_verified: stop() clears pending cues. Evidence: VoiceChannel.stop() releases player, clears pendingCues, sets playing false, resets priority. Impact: NO_IMPACT.
- unchanged_verified: Voice id captured by channel construction. Evidence: VoiceChannel constructor normalizes and stores readonly voiceId. Impact: NO_IMPACT.
- unchanged_verified: SFX may overlap voice. Evidence: SfxChannel remains independent from VoiceChannel. Impact: NO_IMPACT.
- unchanged_verified: Audio mode configuration does not interrupt camera. Evidence: configureSessionAudio uses playsInSilentMode true, mixWithOthers, allowsRecording false, background false, earpiece false. Impact: NO_IMPACT.

The old runtime audit is not valid for integrated Movement Profile V2 preview because priority values, required-cue fallback behavior, and controller sequencing changed.

## 10. Git Change History

The tracked audio tree is unchanged from the baseline commit. The current working tree adds 62 untracked MP3s and modifies or adds source files that map those assets. The generated change ledger records 95 current differences.

## 11. Source-to-Binary Synchronization

Baseline tracked binaries are unchanged from verified git blobs. The 62 new binaries have current source definitions and metadata fingerprints, but they are untracked and have no commit-level provenance. Their intended scripts are known from source; their actual spoken content still requires listening verification.

## 12. Clara and Marcus Parity

Clara and Marcus each have 181 assets. Missing physical pairs: 0. Binary-identical cross-voice pairs: 0. Default voice remains Clara. ElevenLabs generation IDs are still generation-time only.

## 13. Exercise, Assessment, and Safety Changes

Movement Profile V2 live check-up code, recovery code, raw-evidence eligibility, and hinge raw-null handling are present in the current worktree. These changes are assessment/protocol-significant and make V2.1 timing and preview assumptions stale for the MPV2 path. Safety assets remain complete, but V2.1 safety subsumption is not implemented.

## 14. V2.1 Reconciliation

The V2.1 manifest has 199 proposed rows. Current exact key/script matches: 22. Not present: 174. Key/script or binary-content conflicts/uncertainties: 3. V2.1 assets already present are not Clara-only; the present subset was generated for both Clara and Marcus.

## 15. V2.1 Cue-by-Cue Impact Summary

Exact matches include: final-position-set-v21, tracking-loss-v21, tracking-recovered-v21, countdown-three, countdown-two, countdown-one, go, times-up-v21, retry-v21, checkup-complete-v21, item-complete-v21, checkup-chair-stand-intro-v21, checkup-chair-stand-setup-v21, checkup-balance-intro-v21, checkup-balance-single-leg-v21, checkup-shoulder-turn-left-v21, checkup-shoulder-turn-right-v21, checkup-shoulder-raise-left-v21, checkup-shoulder-raise-right-v21, checkup-hinge-setup-v21, close-your-eyes, open-your-eyes.

Missing/not-present examples include: training-intro-v21, safe-session-start-v21, setup-enter-view-v21, setup-clearer-view-v21, setup-center-v21, setup-back-v21, setup-closer-v21, setup-hold-still-v21, setup-light-v21, halfway-v21, five-seconds-left-v21, paused-v21, resuming-v21, training-skip-v21, checkup-skip-v21, micro-discard-v21, set-complete-v21, rest-now-v21, last-set-v21, next-exercise-v21, session-complete-v21, microcheck-complete-v21, equip-chair-stable-v21, equip-support-close-v21, equip-balance-support-v21, equip-step-stable-v21, equip-long-band-v21, equip-door-anchor-v21, equip-floor-transition-v21, floor-gate-question-v21, switch-legs-v21, switch-foot-positions-v21, switch-sides-v21, ex-balance-feet-together-hold-first-v21, ex-balance-feet-together-hold-next-v21, target-balance-feet-together-hold-v21, ex-balance-single-leg-hold-first-v21, ex-balance-single-leg-hold-next-v21, target-balance-single-leg-hold-v21, side-single-leg-left-v21, ....

Conflicts or content-unverified overlaps include: chair-result-prefix-v21 (already_exists_different_key_same_script), tug-intro (already_exists_binary_but_content_unverified), tug-setup (already_exists_binary_but_content_unverified).

## 16. Change Ledger

The ledger is written to `docs/audits/PEARL_VOICE_CHANGE_LEDGER.csv`. It includes one row per added audio asset plus rows for current source, manifest, spec, and prompt changes relevant to voice reconciliation.

## 17. Recommendation Matrix

| Area | Current state | Changed since baseline? | V2.1 still valid? | Action |
|---|---|---:|---:|---|
| Physical voice assets | 362 spoken MP3s: 300 baseline plus 62 current MPV2/V2.1 additions. | Yes | No as written | Reconcile and refresh asset baseline. |
| Clara/Marcus parity | 181 Clara and 181 Marcus assets; no missing physical pairs detected. | Yes | Mostly | Keep both-voice parity, but verify new binaries by listening. |
| Cue definitions | 181 generated cue keys including 31 Movement Profile V2 cues. | Yes | Partial | Fold MPV2 cues into V2.1 decision surface. |
| Generation source | generate-audio now supports movement_profile_v2 group and full set is 181 lines per voice. | Yes | No as written | Update generation plan and do not generate more yet. |
| Manifests | Static manifest maps current untracked MPV2/V2.1 assets. | Yes | Partial | Commit/revert intentionally after reconciliation. |
| Runtime playback architecture | VoiceChannel policy mostly intact, but required MPV2 failure handling and priorities changed. | Yes | No | Rerun runtime audit. |
| Training cue mappings | Legacy training mappings unchanged in broad shape. | Limited | Mostly | Update only if V2.1 cue schema lands. |
| Check-up cue mappings | Legacy checkup plus new internal MPV2 live path. | Yes | No as written | Rebase check-up voice assumptions around MPV2 path. |
| Micro-check cue mappings | Legacy cues still active; V2.1 micro cues mostly absent. | No major current change | Partial | Keep in V2.1 manifest reconciliation. |
| Safety cue mappings | Safety required asset set remains valid; V2.1 safety consolidation not implemented. | No asset break | Partial | Do not retire current safety cues yet. |
| Exercise/assessment catalogue | Movement Profile V2 raw evidence and live protocol work changed assessment assumptions. | Yes | Partial | Review affected V2.1 contracts. |
| V2.1 cue manifest | 199 proposed rows; only a subset currently exists exactly. | Yes | No as written | Update manifest with current overlap and generated status. |
| V2.1 composed timelines | Old estimates do not account for new measured MPV2 assets and new controller path. | Yes | No | Recompute after reconciliation. |
| Clara preview pack | 21 planned Clara cues; some already exist for both voices, many do not. | Yes | No as written | Revise preview plan before any preview generation. |

## 18. Exact Next Step

Primary verdict: RERUN_RUNTIME_AUDIT. Secondary flags: RECONCILE_ASSETS_WITH_V2_1, BASELINE_REFRESH_ONLY, SCRIPT_REVIEW_UPDATE.

Exact next task: Freeze further audio generation, reconcile the current untracked Movement Profile V2/V2.1 asset and manifest set against the V2.1 manifest, then rerun the runtime timing audit for the changed Movement Profile V2 controller path.

Files that need updating next: `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`, `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`, `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`, and the runtime timeline audit artifacts after reconciliation.

Files that should remain untouched until that reconciliation is approved: `assets/audio/**`, `src/audio/manifest.ts`, `src/audio/movementProfileV2AudioManifest.ts`, `scripts/generate-audio.ts`, and production session/controller code.

Audio generation is not safe to begin. Integrated runtime preview is not safe to begin.

## 19. Validation and Limitations

Validation summary: {"parsedRelevantJson":true,"parsedRelevantCsv":true,"audioFilesEnumeratedOnce":true,"sha256ForEveryAudioFile":true,"currentCsvRowCountEqualsPhysicalFileCount":true,"allAudioPathsExist":true,"trackedAudioHydrated":true,"metadataParsedForEveryAudioFile":true,"decodeHealthRecordedForEveryAudioFile":true,"manifestEntriesResolve":true,"cueDefinitionsAccountedFor":true,"generationSourceLinesAccountedFor":true,"runtimeCueReferencesResolve":true,"claraMarcusPairingVerified":true,"numberCueRange":"0..40","classificationsAssigned":true,"baselineDifferencesHaveLedgerRows":true,"v21RowsReconciled":199,"previewCuesChecked":21,"blockingIntegrityFindings":0}.

Limitations: No audio was listened to or transcribed. Binary semantic correctness is not claimed from filename, duration, hash, or metadata. Untracked source and asset files are audited as current repository state but have no commit-level provenance. Runtime timing was compared statically enough to decide validity; this task did not rerun the full 374-scenario timing audit.

## 20. Complete Source Index

- `assets/audio/**`: physical audio inventory.
- `src/audio/cues.ts`: cue type surface and priority policy.
- `src/audio/manifest.ts`: static Metro asset map.
- `src/audio/voicePlayer.ts`: playback, priority, fallback, stop, and audio mode.
- `src/audio/safetyAudio.ts`, `src/audio/safetyAudioManifest.ts`: safety audio metadata.
- `src/audio/movementProfileV2Audio.ts`, `src/audio/movementProfileV2AudioManifest.ts`: Movement Profile V2 audio metadata.
- `scripts/generate-audio.ts`: generation source and grouping.
- `scripts/verify-audio.ts`: current safety/MPV2 asset verification.
- `src/training/sessionPlayer.ts`, `src/training/microCheck.ts`, `src/assessment/sessionController.ts`: legacy runtime cue sequencing.
- `src/movementProfileV2/voiceCues.ts`, `src/movementProfileV2/liveCoordinator.ts`, `src/screens/MovementProfileV2CheckUpScreen.tsx`: new MPV2 voice sequencing path.
- `docs/audits/PEARL_VOICE_CUE_INVENTORY.*`, `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.*`, `docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv`: prior baseline artifacts.
- `docs/specs/PEARL_VOICE_*_V2_1.*`: proposed V2.1 planning baseline.
