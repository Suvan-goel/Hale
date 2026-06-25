# Hale Training Voice V2.1 Foundation Implementation

## 1. Result

Primary verdict: `TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_BEHAVIOR_AND_AUDIO_PENDING`.

Implemented a default-closed Training Voice V2.1 software foundation for all 37 live registered exercise levels. The legacy training voice path remains the only selectable runtime path because audio and behaviour gates are deliberately false.

Founder review status used: `founder_assumed_accepted_for_implementation`. Human listening is waived, not completed. Audio approval is not granted.

## 2. Current Registry Reconciliation

- Branch: `dev`
- HEAD: `9bcfb41` (`9bcfb4164fccd8430081fd9ca4d300b0a29bbc63`)
- Upstream: `origin/dev`
- Live exact exercise count: 37
- Contract count: 37
- Missing/stale/duplicate contracts: 0 / 0 / 0
- Current-source correction recorded: `loaded-march` is an unloaded supported March in Place in the live registry.

## 3. Canonical Contract Types

Added strict immutable V2.1 types for laterality, setup models, set types, safety families, logical cues, target plans, side plans, progress plans, runtime status, asset requirements, sequence plans, and runtime readiness.

## 4. Logical Cue and Physical Asset Separation

No pending V2.1 logical cue was added to the physical `VoiceCueId` union or manifest. Logical cue keys live under `src/training/voiceV21`; physical reuse is represented only in the asset-requirement audit.

## 5. Exact 37-Level Mapping

- Exact first-use mapping count: 37
- Exact later-set mapping count: 37
- Semantic mismatch count: 0
- Bilateral side-policy error count: 0

## 6. Target Grammar

The target planner derives speech from the current prescription or generated-session target. Unsupported or non-integer target values make the V2.1 path not selectable. Silent target approximation count: 0.

## 7. Laterality and Behaviour Dependencies

- Both-sides behaviour-blocked count: 6
- Step-up behaviour-blocked count: 1
- Floor-gate-blocked count: 3
- Mini-band lateral walk is above-knees and both-directions-within-timed-set, with no FD-001 dependency.

## 8. Safety Family Planning

Implemented a pure most-specific-wins safety resolver with session memory. Duplicate safety-family count in planned first-use sequences: 0.

## 9. Setup and Final-Position Models

Each contract carries an explicit setup model and final-position decision. Floor work remains blocked on `IR-VOICE-FLOOR-GATE` and `IR-VOICE-FINAL-POSITION-READINESS`.

## 10. Sequence Planner

The deterministic planner returns first-use, later-set, and repeat-instructions cue order, scripts, policies, target plan, side plan, safety plan, blockers, and readiness. It does not insert broad legacy fallback cues.

## 11. Runtime Foundation and Legacy Isolation

Added a tracked runtime adapter that requires a ready plan plus complete physical cue bindings before speaking. Selection remains legacy when any V2.1 gate fails, so old and new voice systems cannot speak simultaneously.

## 12. Feature and Readiness Gates

- Feature flag: `EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1`
- Feature default: off
- Audio ready: false
- Behaviour ready: false
- Live V2.1 selectable exercise count: 0

## 13. Asset Requirement Backlog

- Unique logical cue count: 163
- Exact existing pair reuse count: 10
- Pending new pair count: 133
- Existing pair script-mismatch count: 20

## 14. Generated-Session Coverage

Inspected all 37 exact registry items plus generated-session target rules for default, readiness-scaled, short-session, pain, equipment substitution, equipment skip, and manual player entry paths. Unmapped generated-session item count: 0.

## 15. Tests

Focused Jest coverage added in `src/training/voiceV21/__tests__/foundation.test.ts`.

## 16. Files Changed

Production files added under `src/training/voiceV21/` and exported from `src/training/index.ts`. Audit harness added at `scripts/audits/audit-training-voice-v21-foundation.mjs`.

## 17. Worktree Integrity

The worktree was already dirty before this task. No destructive git operations were run. No audio files were generated, moved, renamed, or deleted. Current `git diff --name-only -- assets/audio`: empty.

## 18. Exact Next Phase

`Training both-sides round state and dose-preservation implementation`.
