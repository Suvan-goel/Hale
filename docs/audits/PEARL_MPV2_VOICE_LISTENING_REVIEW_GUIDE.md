# Pearl MPV2 Voice Listening Review Guide

## Open The Tool

From the repository root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW.html
```

The tool is local-only. It uses browser audio controls pointed at repository audio files and stores review data in browser localStorage. No network service, transcription API, or speech API is used.

## Listening Setup

Check first on a phone speaker, then a laptop speaker. Use headphones only as a secondary detail check for clicks, truncation, or noise.

## Review Order

1. Clara rows first.
2. Marcus rows second.
3. A/B overlap cases: chair-result-prefix-v21, tug-intro, tug-setup.
4. Critical start/stop/recovery cues.
5. Side-specific shoulder cues.
6. MPV2 operational cues.

## What To Listen For

- Exact wording versus the source expectation.
- Missing or extra words.
- Pronunciation and clarity.
- Pace that feels usable while moving.
- Clipping, clicks, noise, long silence, or abrupt endings.
- Volume inconsistency across Clara and Marcus.
- Patronising tone or technical wording.
- Unnatural seams when sequences are likely to play back-to-back.

## Export

Use Export JSON in the tool. Return that exported JSON for the next targeted runtime audit. CSV export is useful for quick triage, but the JSON is the source review artifact.

Audio quality approval does not approve integrated runtime behaviour. Timing, interruption, state-exit, and audible-go behavior still require the targeted runtime audit.

Rows to review: 34. Assets covered: 68.
