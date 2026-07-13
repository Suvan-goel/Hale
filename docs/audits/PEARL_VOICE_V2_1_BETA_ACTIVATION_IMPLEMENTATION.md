# Pearl Voice V2.1 Beta Activation Implementation

## 1. Result

Voice V2.1 is the default beta mode for new/fresh local state. Legacy rollback remains available.

## 2. Activation Policy

The resolver lives in `src/config/voiceExperience.ts` and resolves: force legacy env, explicit env mode, persisted setting, then default `v21_beta`.

## 3. Settings Rollback Toggle

Settings -> Trainer Voice -> New voice system toggles `settings.voiceExperienceMode` between `v21_beta` and `legacy`.

## 4. Environment Emergency Override

`EXPO_PUBLIC_FORCE_LEGACY_VOICE=1` forces legacy. `EXPO_PUBLIC_VOICE_EXPERIENCE_MODE=legacy` also selects legacy unless force legacy is absent and another mode is explicitly chosen.

## 5. Training Runtime Selection

Training pins `VoiceV21Activation` at session launch and passes internal V2.1 runtime props only when beta is enabled.

## 6. Micro-Check Runtime Selection

Micro-check pins mode at launch. Under beta, V2.1 cue keys and tracked countdown/go boundary are used by the existing deterministic measurement runner.

## 7. Movement Check-Up / MPV2 Selection

MPV2 screens receive a pinned `voiceExperienceMode`. Beta mounts the MPV2 voice runtime; legacy uses the preserved sequencer path.

## 8. Eyes-Open Balance V2 Selection

The Balance V2 beta gate uses physical audio readiness while keeping audio approval false.

## 9. Step-Up and Floor V2.1 Selection

Step-up alternation and floor V2.1 setup are enabled through the pinned training activation props.

## 10. Active-Flow Mode Pinning

Training, micro-check, and MPV2 have separate active activation state. Settings changes apply to the next launched flow.

## 11. Legacy Fallback Preservation

Legacy mode remains selectable in Settings and via env override.

## 12. Readiness and Approval Truth

Physical audio surface readiness is separate from approval. Audio approval, listening, physical-device QA, and speaker onset remain pending.

## 13. Diagnostics

Breadcrumbs record resolved mode/source, Settings writes, and each flow's pinned mode without raw video, landmarks, health values, names, or notes.

## 14. Tests

Focused resolver, Settings, readiness, and runtime-selection tests were added or updated.

## 15. Audit Results

See `PEARL_VOICE_V2_1_BETA_ACTIVATION_AUDIT.md` and JSON.

## 16. Remaining QA Boundaries

Human listening, audio approval, real-device QA, and speaker onset measurement remain P3 beta risks.

## 17. Files Changed

See git diff for exact files.

## 18. Worktree Integrity

Audio snapshots are compared by the audit harness.

## 19. Exact Next Phase

Real-device Voice V2.1 QA and tester feedback pass.
