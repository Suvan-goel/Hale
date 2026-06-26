# Hale Voice Project Post Final Cue Schema Handoff

Verdict: `VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING`

## Artifact Paths

- Final registry: `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_REGISTRY.csv`
- Physical reconciliation: `docs/audits/HALE_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv`
- Manifest plan: `docs/audits/HALE_VOICE_V2_1_MANIFEST_CHANGE_PLAN.csv`
- Generation backlog: `docs/audits/HALE_VOICE_V2_1_GENERATION_BACKLOG.csv`
- Retirement/legacy map: `docs/audits/HALE_VOICE_V2_1_RETIREMENT_LEGACY_MAP.csv`
- Timelines: `docs/audits/HALE_VOICE_V2_1_SCHEMA_TIMELINES.csv`
- Runtime scenarios: `docs/audits/HALE_VOICE_V2_1_SCHEMA_RUNTIME_SCENARIOS.csv`
- Audit JSON: `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json`

## Counts

- Pending logical cue count: 176
- Exact existing pair reuse count: 36
- Script mismatch count: 35
- Retired / legacy-only / conditional legacy counts: 1 / 117 / 6
- Pending Training cues: 159
- Pending Micro-Check cues: 10
- Pending MPV2/Check-Up cues: 0
- Pending Balance V2 cues: 9

## Regenerated Audio Baseline

Use `npm run verify:audio` plus a task-start hash snapshot of `assets/audio`. Do not compare regenerated audio directly to Git HEAD as a product failure.

## Generator Input

Use `docs/audits/HALE_VOICE_V2_1_GENERATION_BACKLOG.csv`. Each row includes logical cue key, exact script, flow, category, policy, requiredness, voice IDs needed, current candidate, reuse decision, reason, budget class, and source.

## Manifest Update Rules

After generation, add only Clara/Marcus pairs that exist, have exact scripts, have current fingerprints/metadata, and keep `npm run verify:audio` green. Do not mark audio ready until every required active pair is present and verified.

## Gates To Preserve

Training Voice V2.1 remains default off, audio ready false, selectable exercise count zero. Micro-Check Voice V2.1 remains default off, audio ready false, selectable type count zero. Balance V2 remains default closed/audio pending.

## Remaining QA

Final listening review for Clara and Marcus and consolidated Android/iOS device QA are still required after generation and manifest verification.

## Exact Next Task

Consolidated Clara/Marcus Voice V2.1 asset generation
