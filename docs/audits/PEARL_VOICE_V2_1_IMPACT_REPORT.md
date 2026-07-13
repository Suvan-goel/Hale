# Pearl Voice V2.1 Impact Report

## Verdict

Primary verdict: RERUN_RUNTIME_AUDIT. V2.1 should not continue as written.

## What Changed

The worktree contains 62 new untracked spoken MP3s, a modified static manifest, Movement Profile V2 audio metadata, new MPV2 cue definitions, a new generation group, and a new MPV2 live check-up voice path.

## What Did Not Change

The committed baseline audio tree is unchanged. The app still uses bundled local audio at runtime through `expo-audio`; no runtime TTS or remote playback path was found.

## Existing Assets We Can Reuse

- final-position-set-v21: clara|marcus
- tracking-loss-v21: clara|marcus
- tracking-recovered-v21: clara|marcus
- countdown-three: clara|marcus
- countdown-two: clara|marcus
- countdown-one: clara|marcus
- go: clara|marcus
- times-up-v21: clara|marcus
- retry-v21: clara|marcus
- checkup-complete-v21: clara|marcus
- item-complete-v21: clara|marcus
- checkup-chair-stand-intro-v21: clara|marcus
- checkup-chair-stand-setup-v21: clara|marcus
- checkup-balance-intro-v21: clara|marcus
- checkup-balance-single-leg-v21: clara|marcus
- checkup-shoulder-turn-left-v21: clara|marcus
- checkup-shoulder-turn-right-v21: clara|marcus
- checkup-shoulder-raise-left-v21: clara|marcus
- checkup-shoulder-raise-right-v21: clara|marcus
- checkup-hinge-setup-v21: clara|marcus
- close-your-eyes: clara|marcus
- open-your-eyes: clara|marcus

## Existing Assets That Conflict With V2.1

- chair-result-prefix-v21: already_exists_different_key_same_script
- tug-intro: already_exists_binary_but_content_unverified
- tug-setup: already_exists_binary_but_content_unverified

## V2.1 Assets Already Present

- final-position-set-v21: exact current source match
- tracking-loss-v21: exact current source match
- tracking-recovered-v21: exact current source match
- countdown-three: exact current source match
- countdown-two: exact current source match
- countdown-one: exact current source match
- go: exact current source match
- times-up-v21: exact current source match
- retry-v21: exact current source match
- checkup-complete-v21: exact current source match
- item-complete-v21: exact current source match
- checkup-chair-stand-intro-v21: exact current source match
- checkup-chair-stand-setup-v21: exact current source match
- checkup-balance-intro-v21: exact current source match
- checkup-balance-single-leg-v21: exact current source match
- checkup-shoulder-turn-left-v21: exact current source match
- checkup-shoulder-turn-right-v21: exact current source match
- checkup-shoulder-raise-left-v21: exact current source match
- checkup-shoulder-raise-right-v21: exact current source match
- checkup-hinge-setup-v21: exact current source match
- close-your-eyes: exact current source match
- open-your-eyes: exact current source match

## V2.1 Documents That Need Updating

- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`
- Runtime timeline audit artifacts after MPV2 reconciliation

## Runtime Audit Validity

The previous runtime audit does not remain valid for integrated preview. MPV2 cue priorities, required-cue fallback behavior, and controller sequencing changed.

## Preview Pack Impact

The planned 21-cue Clara preview pack is stale. 3 planned preview cues already have current binaries, and they exist for both voices rather than Clara only.

## Safe Next Step

Freeze further generation, reconcile the current MPV2/V2.1 assets and manifests, then rerun the runtime timing audit on the changed MPV2 controller path.

## Blockers

- New generated binaries are untracked and require provenance/listening verification.
- V2.1 manifest and preview plan do not reflect current generated assets.
- Runtime timing audit must be rerun before integrated preview.
