# Pearl Hands-Free Training HF3 Implementation

Date: 2026-06-27

## Scope

Implemented HF3 for active training sessions only: floor V2.1 setup no longer requires a mid-session "I'm ready" tap before the normal start path. The primary path is now camera-inferred movement readiness, a stable dwell, and the existing final-position voice cue plus countdown.

I did not edit prior audit reports, `docs/decisions.md`, audio assets, lockfiles, packages, release flags, credit/progression authorities, or schedule policy code.

## Files Changed For HF3

- `src/training/sessionPlayer.ts`
- `src/screens/TrainingSessionScreen.tsx`
- `src/training/__tests__/sessionPlayer.test.ts`
- `docs/audits/PEARL_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md`

The worktree already contained other modified and untracked files before this implementation; they were left untouched.

## Behavior Implemented

- Floor V2.1 training setup now enters a hands-free `movement_setup` path after the transfer/instruction audio.
- Camera readiness uses the existing movement-specific readiness tracker with a longer 900 ms stable dwell for training floor setup.
- A floor/start-position posture gate was added so ordinary side-standing framing cannot satisfy floor readiness by itself.
- Once floor posture is stable, the player speaks `final-position-set-v21`, waits for the existing post-instruction dwell, then starts the countdown.
- The explicit "I'm ready" action remains only as a delayed fallback after 12 seconds if camera floor detection cannot settle.
- Early fallback taps are rejected; rapid fallback taps are deduplicated by the existing setup epoch guard.
- Tracking loss during floor setup still clears readiness and returns to visibility readiness before countdown.
- Later floor sets continue to avoid repeating the first-use floor transfer cue.
- The training UI now renders a floor setup action only when the player explicitly exposes one via `actionLabel`.

## Preserved Invariants

- Pause, skip, help, and cancel controls remain available under the existing training screen rules.
- Non-floor training setup behavior is unchanged.
- HF1/HF2 check-up and micro-check paths were not modified.
- Safety cues, including floor transfer safety audio, remain in the existing voice path.
- No runtime TTS or audio regeneration was introduced.
- No training completion, schedule credit, progression evidence, percentile, or Movement Profile authority was added to `sessionPlayer.ts`; a source guard test now checks this.

## Validation

- `npm run typecheck` - passed.
- `npm test -- --runInBand --runTestsByPath src/training/__tests__/sessionPlayer.test.ts` - passed, 18 tests.
- HF regression set from the prompt - passed, 20 suites / 212 tests.
- `npm run verify:audio` - passed; required assets remain 502 total.
- `npm --prefix website run typecheck` - passed.
- `npx --no-install expo config --type public` - passed with the existing Sentry missing org/project warning.
- `git diff --check` - passed.
- `npm test -- --runInBand` - passed, 166 suites / 1343 tests. Existing Watchman recrawl and Jest open-handle notices remain.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-hf3-export` - passed for web, Android, and iOS; temp export directory removed afterward.

## Residual Risk

This is software-verified only. Real-device validation is still needed for varied floor exercises, lighting, camera distance, and real floor-transfer behavior. The posture gate is intentionally conservative: standing side-on must not start a floor exercise, and users who cannot satisfy camera inference still have the delayed manual fallback.
