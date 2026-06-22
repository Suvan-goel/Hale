You are carrying out Stage 4D-R.1 of Hale’s production-readiness work:

SAFETY-CUE AUDIO GENERATION, CLARA/MARCUS ASSET COMPLETENESS, STATIC BUNDLE INTEGRITY, RUNTIME VOICE/TEXT PARITY, AND STAGE 4D-R SIGN-OFF

This is a focused audio-asset generation and verification task following Stage 4D-R.

Do not begin Stage 4E-R optional-level policy, Stage 4F-R movement-specific progression review, Stage 4G-R remaining catalogue hardening, Stage 3D-B, physical-device validation, store release, or unrelated UI/product work in this task.

The primary blocker is narrow:

> Stage 4D-R implemented the canonical safety cue system, text guidance, cue sequencing, player controls, Explore/manual parity, and fail-closed plan validation, but the corresponding bundled MP3 assets for the new safety cue IDs are missing.

Stage 4D-R.1 must generate and verify those assets for both supported Hale voices:

- Clara
- Marcus

## Required prior reading

Read these reports in full before changing anything:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md

Also inspect the current audio architecture and project instructions before mutation:

- AGENTS.md, CLAUDE.md, or equivalent repository instructions;
- scripts/generate-audio.ts;
- src/audio/cues.ts;
- src/audio/voicePlayer.ts;
- any audio manifest, generated asset map, or voice configuration files;
- src/training/safetyCueDefinitions.ts;
- src/training/safetyCues.ts;
- src/training/sessionPlayer.ts;
- src/screens/TrainingSessionScreen.tsx;
- all current audio/cue/player tests;
- the actual bundled audio asset directories.

Treat the current working tree as the source of truth. Re-verify every path and identifier because report line numbers may no longer be exact.

## Verified Stage 4D-R baseline

Stage 4D-R added:

- a canonical typed safety-cue vocabulary;
- canonical text for safety cues;
- per-exercise safety profiles;
- cue tiers:
  - global;
  - setup;
  - active;
  - repeated-set;
  - recovery;
- generated/manual plan cue snapshots and fingerprints;
- start-time cue validation;
- session-global stop rules;
- exercise setup and repeated-set cue delivery;
- tracking/setup recovery cues;
- visible and replayable safety text;
- pause, repeat/help, skip, and stop controls;
- Explore/manual safety-note parity;
- band and door-anchor safety cue packs;
- catalogue-wide cue-completeness tests.

Stage 4D-R validation passed:

- full Jest: 98 suites / 791 tests;
- app typecheck;
- Expo public config;
- git diff check.

Stage 4D-R remained blocked because the new safety cue IDs were wired into the build-time generator but the bundled MP3 files were absent.

The Stage 4D-R report also omitted the required website typecheck.

## Locked Stage 4D-R.1 product policy

### 1. Both voices must have complete safety-cue coverage

Every safety cue whose voice policy requires audio must have one valid bundled MP3 for:

- Clara;
- Marcus.

Do not treat one voice as a fallback for the other.

Do not silently route Marcus to Clara or Clara to Marcus.

### 2. Canonical safety text is authoritative

The audio-generation input text must come from the current canonical definitions in:

```text
src/training/safetyCueDefinitions.ts
```

or the current equivalent canonical source.

Do not duplicate or paraphrase safety text in the generator.

Do not maintain a separate audio-only wording table unless the existing architecture already has an explicit, reviewed voice-text field.

If the canonical text changes, the asset integrity system must be able to detect that the existing file is stale.

### 3. Use the existing Hale voice identities and provider configuration

Use the repository’s existing:

- Clara voice identifier;
- Marcus voice identifier;
- TTS provider;
- model;
- audio format;
- generation settings;
- filename convention;
- asset directory convention.

Do not invent replacement voices.

Do not change provider/model/settings merely to make generation convenient unless a current setting is invalid and the reason is documented.

### 4. Generate only the missing or stale Stage 4D-R safety assets

Do not regenerate all existing Hale audio.

Do not overwrite unrelated cue assets.

Do not invoke a costly full-library generation pass when a safety-only selector can be used.

If the current generator cannot target the safety-cue set:

- add the smallest safe selector or command mode;
- preserve existing default behavior;
- document the new command.

Preferred capabilities:

```text
--group safety
--voice clara|marcus|all
--dry-run
--force
```

Adapt to the current script style.

Do not add a new package solely for CLI parsing.

### 5. No placeholders or fake parity

The following are not acceptable:

- zero-byte files;
- copied silence;
- copied unrelated cue audio;
- one generic safety audio reused for different text;
- renamed existing unrelated files;
- text-only completion reported as voice parity;
- runtime skipping of missing assets reported as success.

Different cue IDs may share one audio file only when their canonical spoken text is exactly identical and that alias is explicit and tested.

### 6. Text fallback remains mandatory

Even after audio is bundled:

- visible safety text remains available;
- missing/playback-failed audio must not hide the text;
- replay/help remains usable;
- runtime failure must not crash;
- the app must not claim the safety cue was spoken when playback failed.

Audio parity complements the text system; it does not replace it.

### 7. Safety audio must remain local and offline

All required safety MP3s must be bundled with the app.

Runtime must not fetch safety narration over the network.

The generation process may use the existing TTS provider during development, but production playback must use local assets.

### 8. Secrets must never be exposed

The generator may use already-configured environment credentials.

It must not:

- print API keys;
- print authorization headers;
- write secrets into reports;
- commit `.env` files;
- copy secrets into generated manifests;
- log full provider responses containing sensitive metadata.

Check only whether required configuration is present.

### 9. Network scope

Network access is permitted only through the repository’s existing TTS generation path and only for generating the required missing/stale safety assets.

Do not browse unrelated sites.

Do not call an alternative TTS API.

If the environment lacks provider credentials or network access:

- do not create placeholders;
- complete all static integrity work that is possible;
- mark Stage 4D-R.1 blocked;
- report the exact missing prerequisite without exposing secret values.

### 10. No dependency or lockfile changes

Use installed tooling only.

Do not install packages.

Do not modify lockfiles.

If audio validation requires a decoder or metadata tool, first use:

- an existing project helper;
- Node built-ins;
- `ffprobe`/`ffmpeg` only if already installed;
- another existing local binary.

Do not add an audio dependency for this task.

### 11. Binary assets are task-owned only when generated by this pass

Record every generated or replaced MP3.

Do not modify:

- existing unrelated voice cues;
- images;
- fonts;
- app icons;
- videos;
- native libraries.

Do not share or copy font assets.

## Primary objectives

Stage 4D-R.1 must:

1. Reconstruct the complete current audio-generation and runtime asset architecture.

2. Enumerate the authoritative safety cue ID × voice matrix.

3. Identify every missing, stale, orphaned, unresolved, or invalid safety audio asset.

4. Generate every required missing/stale safety MP3 for Clara and Marcus through the existing pipeline.

5. Verify every generated file is a valid, non-empty, decodable MP3 with plausible finite duration.

6. Verify every required cue maps to the correct static local asset for both voices.

7. Verify no unknown or missing `require(...)` path can break Metro bundling.

8. Verify runtime cue delivery works for:
   - session-global;
   - setup;
   - active;
   - repeated-set;
   - tracking/setup recovery;
   - replay/help.

9. Verify visible text remains when audio is unavailable or playback fails.

10. Verify generated, short, restart, supporting, Explore, and manual sessions all resolve the required audio assets.

11. Run app and website typechecks.

12. Run a local non-publishing Expo/Metro bundle check if supported by the existing project.

13. Formally sign off or block Stage 4D-R.

## Scope boundary

This task may change:

- scripts/generate-audio.ts;
- a narrow audio-generation helper;
- safety-cue audio manifest/static asset map;
- src/audio/cues.ts;
- src/audio/voicePlayer.ts;
- audio integrity tests;
- player/audio tests;
- bundled Clara/Marcus safety MP3 files;
- narrow documentation for the generation command;
- the Stage 4D-R.1 verification report.

This task must not change:

- canonical safety wording unless a verified defect is found;
- exercise selection;
- exercise catalogue levels;
- optional-level visibility;
- movement-capability gates;
- equipment gates;
- credit/progression/schedule logic;
- scoring;
- norms;
- Check-Up logic;
- pose thresholds;
- broad player UI;
- app navigation;
- dependencies;
- lockfiles;
- existing unrelated audio assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or mutation, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the verification report.

Rules:

1. Treat all existing changes as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior audit/remediation reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not alter lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change during the task:
   - record them;
   - do not overwrite them;
   - continue only when task-owned changes remain safe and unambiguous;
   - otherwise stop mutation and report the conflict.

## Step 1: Reconstruct the current audio architecture

Before changing anything, inspect:

- every supported voice ID and display name;
- provider voice IDs;
- TTS model/settings;
- audio format;
- generator input registry;
- output filename/path convention;
- static asset map;
- runtime asset resolution;
- preload/cache behavior;
- playback failure handling;
- replay behavior;
- test mocks;
- audio asset directories.

Search for:

- `Clara`;
- `Marcus`;
- `VoiceId`;
- `VoiceCueKey`;
- `generate-audio`;
- `SAFETY_CUE`;
- `safetyCue`;
- `.mp3`;
- `require(`;
- `Asset.fromModule`;
- `Audio`;
- `playCue`;
- `voicePlayer`;
- `missing`;
- `fallback`;
- `manifest`.

Document the architecture:

```text
canonical cue text
-> generation registry
-> provider request
-> output path
-> static asset mapping
-> voice player
-> session player
-> visible text fallback
```

Do not generate audio until this trace is complete.

## Step 2: Build the authoritative safety-audio matrix

Enumerate every current safety cue definition.

For each cue, record:

| Cue ID | Tier | Canonical text | Voice policy | Clara path | Marcus path | Existing status | Required action |

Allowed status values:

- valid;
- missing;
- zero-byte;
- invalid MP3;
- stale text fingerprint;
- unresolved static mapping;
- wrong voice;
- orphaned;
- approved text-only exemption.

Requirements:

- derive the list from production definitions;
- do not manually maintain a partial list in tests;
- include global, setup, active, repeat, and recovery cue IDs;
- include band and door-anchor cues;
- include floor, step, support, balance, range, breathing, stop, and tracking cues;
- include only currently required Stage 4D-R safety assets;
- list any approved text-only exemption explicitly.

Calculate:

```text
required safety cue count
required Clara asset count
required Marcus asset count
total required asset count
valid existing count
missing/stale count
```

## Step 3: Inspect and harden the generation script

Verify the generator:

- reads canonical safety text;
- uses existing Clara/Marcus voice IDs;
- produces the correct output format/path;
- creates parent directories safely;
- does not expose secrets;
- handles provider errors;
- does not leave partial files;
- writes atomically where practical;
- supports safety-only generation;
- supports dry run;
- does not overwrite valid assets by default;
- can force regeneration when canonical text changed.

If narrow changes are required, add tests or a non-network dry-run test.

Preferred behavior:

```text
dry run
-> expected asset matrix
-> missing/stale list
-> no provider calls
```

Then:

```text
generate safety assets
-> only missing/stale files
-> atomic write
-> post-write validation
```

If the existing script already satisfies this, do not redesign it.

## Step 4: Add deterministic cue-text fingerprinting

Use a deterministic fingerprint to detect stale audio.

The fingerprint should derive from:

- cue schema version;
- cue ID;
- canonical spoken text;
- voice ID;
- provider/model/settings that materially affect output.

Do not include the current timestamp.

Possible storage options:

- generated sidecar manifest;
- generated TypeScript metadata;
- existing audio manifest.

Use the existing project pattern if one exists.

Requirements:

- same inputs -> same fingerprint;
- canonical text change -> stale;
- Clara and Marcus fingerprints differ by voice identity;
- no API secrets;
- no raw provider response;
- JSON-safe;
- deterministic ordering.

Do not create one sidecar file per MP3 if a single bounded manifest is more consistent with the project.

## Step 5: Preflight generation safely

Before provider calls:

1. Run the safety-audio dry run.

2. Record:
   - exact missing files;
   - exact stale files;
   - exact voices;
   - expected provider-call count.

3. Verify required environment configuration is present without printing its value.

4. Verify output directories are writable.

5. Verify no unrelated audio will be regenerated.

6. Verify estimated generation scope is only the safety matrix.

If provider credentials/network are unavailable:

- do not create placeholders;
- skip to static verification/reporting;
- mark the stage blocked.

## Step 6: Generate Clara safety audio

Generate every missing/stale required Clara safety asset.

Requirements:

- exact canonical text;
- existing Clara voice ID;
- existing provider/model/settings;
- deterministic expected path;
- valid MP3 output;
- no unrelated file overwrite;
- no secret logging;
- failed generation leaves no corrupt final file;
- retry is safe.

Record:

| Cue ID | Output path | Bytes | Duration | Fingerprint | Result |

Do not manually edit MP3 binaries.

## Step 7: Generate Marcus safety audio

Repeat the same process for Marcus.

Do not reuse Clara assets.

Record the same matrix.

## Step 8: Validate every safety MP3

Create or harden an automated integrity check.

For every required asset:

- file exists;
- regular file;
- size exceeds a conservative non-empty minimum based on current audio assets;
- file is recognized as MP3;
- duration is finite and greater than zero;
- duration is within a broad plausible range for the canonical text;
- static mapping resolves;
- file path belongs to the expected voice;
- asset fingerprint matches current cue/voice inputs;
- no temporary/partial extension remains;
- no unrelated cue path was overwritten.

Prefer an existing audio probe.

If `ffprobe` is available, it may be used without installing anything.

Do not fail merely because encoded bitrates differ from older files unless the runtime requires a specific format.

### Duplicate-audio guard

Compare hashes.

Different cue IDs with different canonical text must not unexpectedly have identical audio bytes.

Allow explicit aliases only when:

- canonical spoken text is exactly identical;
- alias is declared;
- tests document it.

## Step 9: Validate static asset mapping

React Native/Metro asset resolution must remain static and bundle-safe.

Requirements:

- every Clara safety cue has a static local mapping;
- every Marcus safety cue has a static local mapping;
- no constructed dynamic `require(variablePath)`;
- no missing file referenced;
- no orphaned required generated file lacking a mapping;
- no wrong voice mapping;
- unknown cue ID fails closed;
- existing non-safety cue mappings remain unchanged.

Add tests that exercise the production map.

Do not load every MP3 into Jest memory if path/existence validation is enough.

## Step 10: Validate runtime voice selection

Using production voice resolution, prove:

- Clara selection resolves Clara safety assets;
- Marcus selection resolves Marcus safety assets;
- switching voice changes subsequent cue resolution;
- a running session remains internally consistent with the selected voice policy;
- unknown/malformed voice ID falls back only according to the existing approved voice policy;
- no cross-voice safety asset substitution occurs silently.

Do not change the voice-selection product policy in this task.

## Step 11: Validate cue delivery by tier

Use real production session-player/audio boundaries.

Verify:

### Session-global

- safety stop-rule assets play once per started session;
- both voices resolve;
- no full replay before each exercise.

### Setup

- exercise-specific safety assets resolve before countdown.

### Active

- short active cues resolve at the intended first-set point.

### Repeated set

- short reminders resolve;
- full setup pack is not replayed.

### Recovery

- tracking/setup recovery asset resolves;
- invalid tracking remains non-counting;
- cue is calm and repeat-safe.

### Replay/help

- current safety cues can be replayed;
- selected voice remains correct;
- replay does not mutate session credit/progression.

## Step 12: Validate band and door-anchor voice coverage

For each voice, assert complete audio coverage for:

### Seated band row

- band inspection;
- secure grip;
- face/eye clearance;
- controlled return;
- never release under tension;
- stop if slipping/shifting;
- actual seated anchoring/feet setup cues used by the current exercise.

### Standing band row

All seated/general band requirements plus:

- purpose-built anchor/setup instruction;
- fully closed secure door;
- light-tension test;
- outside door opening path;
- stop if door/anchor moves.

### Band pull-apart

- complete band pack;
- comfortable shoulder range.

### Overhead band press

- complete band pack;
- stable stance/setup;
- comfortable shoulder range.

Tests must fail if one required audio mapping is removed.

## Step 13: Validate floor, step, support, balance, and tracking audio coverage

For both voices, verify the required cue assets resolve for:

- floor transfer/clear space;
- step setup/control;
- sturdy support;
- support within reach;
- balance reset/unsteadiness;
- comfortable range/no forcing;
- breathing;
- sharp/increasing discomfort stop;
- dizziness/light-headedness stop;
- tracking pause/reset.

Preserve Stage 4C-R capability gates.

Audio presence must not replace the gate.

## Step 14: Text fallback and playback-failure verification

Simulate:

- missing asset lookup;
- playback rejection;
- audio API unavailable;
- user-selected mute/voice-disabled state if supported;
- replay after failure.

Required:

- visible canonical safety text remains;
- player does not crash;
- session does not auto-complete;
- no false “played” state where current UI exposes one;
- pause/stop/skip remain usable;
- observability logs bounded reason codes only;
- runtime does not fetch from the network.

Do not delete the existing runtime guard that skips unavailable assets until the full asset set is proven bundled.

After parity is verified, the runtime guard may remain as defense in depth.

## Step 15: Add a repository audio-integrity command

Add or harden a deterministic non-network command, for example:

```text
npm run verify:audio
```

or an existing equivalent.

It should verify at least:

- required cue matrix completeness;
- Clara/Marcus parity;
- file existence;
- MP3 validity;
- static map coverage;
- stale fingerprint detection;
- no unresolved required cue IDs;
- no unexpected missing safety files.

Do not install packages.

Do not make normal app typecheck depend on provider credentials.

The command must not call the TTS provider.

## Step 16: Local Expo/Metro bundle check

Because the original blocker was missing bundled assets, perform a local non-publishing bundle/export check if the installed Expo tooling supports it.

Preferred pattern:

```bash
rm -rf /tmp/hale-stage4dr1-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage4dr1-export
```

Adapt to the installed Expo CLI syntax if needed.

Requirements:

- no output written into the repository;
- no publish/deploy;
- no dependency install;
- both iOS and Android JS bundles/static asset resolution covered where supported;
- missing static MP3 references would fail the check.

If `--platform all` is unsupported:

- run separate installed iOS and Android non-publishing export/bundle checks;
- document commands.

If local export is blocked by an unrelated native/config issue:

- do not hide it;
- prove static safety-audio mapping with tests;
- report the exact export blocker;
- decide whether it prevents Stage 4D-R sign-off.

Remove `/tmp` export output after recording results.

## Step 17: Manual automated QA manifest

Create a report-only table for every required safety cue:

| Cue ID | Text | Clara file | Clara bytes/duration | Marcus file | Marcus bytes/duration | Map | Runtime tier | Status |

Do not create an additional repository report beyond the required Stage 4D-R.1 report unless the existing generator owns a manifest required by runtime/integrity.

Subjective listening quality remains part of physical-device validation.

However, Stage 4D-R.1 must establish that:

- the expected text was submitted to the expected voice;
- the resulting file is valid;
- the runtime maps to it.

## Step 18: Regression verification

Prove these remain green:

### Stage 4D-R

- cue vocabulary;
- cue profiles;
- start-time validation;
- global/setup/repeat/recovery sequencing;
- visible safety text;
- pause/replay/skip/stop controls;
- Explore/manual parity;
- optional-level non-regression.

### Stage 4C-R

- floor-transfer gate;
- step environment gate;
- single-leg confidence;
- daily context for Explore/manual;
- stale capability plan.

### Stage 5A–5H

- credit;
- progression;
- equipment authority;
- scheduling;
- lifecycle;
- adversarial suite.

### Other

- Stage 3D copy/focus guardrails;
- canonical tab order;
- app and website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Generation registry

- all required safety cues included;
- both voices included;
- dry run;
- no unrelated generation;
- no secret output.

### B. Asset integrity

- existence;
- size;
- MP3 recognition;
- duration;
- fingerprint;
- duplicate-audio guard.

### C. Static mapping

- Clara;
- Marcus;
- every cue ID;
- unknown ID;
- no cross-voice mapping.

### D. Runtime selection

- Clara;
- Marcus;
- voice switch;
- malformed voice.

### E. Delivery tiers

- global once;
- setup before countdown;
- active;
- repeat;
- recovery;
- replay.

### F. Hazard packs

- band;
- door anchor;
- floor;
- step;
- support;
- balance;
- range;
- stop rules;
- tracking.

### G. Failure fallback

- missing asset;
- playback failure;
- text remains;
- no crash/credit leak.

### H. Bundle integrity

- local Expo/Metro export or equivalent;
- no missing required asset.

### I. Regression

- Stage 4C-R/4D-R;
- Stage 5H;
- app/website typechecks;
- optional levels remain gated.

## Test-quality requirements

Tests must:

- exercise production cue definitions and asset mapping;
- derive expected assets from production definitions;
- verify both voices;
- verify real files on disk where appropriate;
- verify static asset resolution;
- exercise production player/voice boundaries;
- fail if one required file is deleted;
- fail if canonical text changes without regenerated metadata;
- fail if Clara/Marcus mapping crosses.

Tests must not:

- contact the provider;
- install packages;
- use real network;
- mock every layer;
- assert only helper calls;
- create placeholder audio;
- modify optional-level policy;
- change progression/scoring/norms.

Use deterministic cue IDs, voices, plans, and player events.

## Validation commands

Run targeted tests for:

- safety cue registry;
- audio generation dry run;
- audio integrity;
- static asset mapping;
- voice player;
- session player;
- session planning/start validation;
- Explore/manual cue parity;
- Stage 4C-R;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run the local non-publishing Expo/Metro bundle check described above when supported.

Do not install dependencies.

Record:

- exact generation dry-run command;
- exact generation command;
- provider call count;
- generated Clara count;
- generated Marcus count;
- existing reused count;
- stale regenerated count;
- total required cue count;
- total required asset count;
- audio verification result;
- targeted suite/test counts;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- bundle/export result;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any provider warnings/errors;
- whether validation changed files.

Stage 4D-R’s reference full baseline was:

- 98 suites;
- 791 tests.

Verify the current baseline rather than assuming it.

## Manual source verification after tests

Retrace:

### Clara

```text
canonical safety cue
-> Clara generation entry
-> Clara MP3
-> static map
-> voice player
-> session player
```

### Marcus

Repeat and confirm no Clara substitution.

### Band exercise

Confirm the complete band/anchor assets resolve.

### Tracking interruption

Confirm recovery audio and text.

### Playback failure

Confirm text remains and session does not crash.

### Bundle

Confirm Metro resolves every static audio asset.

## Verification report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Why Stage 4D-R.1 was required.
3. Initial Git status.
4. Current audio architecture.
5. Voice/provider configuration without secret values.
6. Authoritative safety cue matrix.
7. Required asset counts.
8. Initial missing/stale/orphan inventory.
9. Generator changes, if any.
10. Dry-run result.
11. Clara generation result.
12. Marcus generation result.
13. Audio validation method.
14. Complete asset integrity result.
15. Cue-text fingerprint behavior.
16. Static asset mapping result.
17. Runtime voice-selection result.
18. Cue-tier delivery result.
19. Band/door-anchor audio result.
20. Floor/step/support/balance/tracking audio result.
21. Text fallback/playback-failure result.
22. Audio integrity command.
23. Expo/Metro bundle result.
24. Full safety-audio QA table.
25. Files changed.
26. Binary assets generated/replaced.
27. Tests added/changed.
28. Exact validation results.
29. Stage 4C-R/4D-R regression verification.
30. Stage 5 regression verification.
31. F4R-003 status.
32. F4R-004 status.
33. Remaining Stage 4 findings.
34. Whether Stage 4E-R is unblocked.
35. Whether exercise catalogue remains beta-blocked.
36. Initial and final Git status.
37. Complete files-changed inventory.
38. Concurrent external changes.
39. Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.

## Required invariant outcomes

After Stage 4D-R.1:

1. Every voice-required safety cue has a Clara MP3.
2. Every voice-required safety cue has a Marcus MP3.
3. No required MP3 is empty or invalid.
4. Every required MP3 has finite positive duration.
5. Every required cue resolves through the static asset map.
6. Clara never silently uses Marcus assets.
7. Marcus never silently uses Clara assets.
8. Canonical text is the generation source.
9. Text changes make old assets stale.
10. Generation can target safety cues only.
11. Dry run performs no provider calls.
12. Generation does not expose secrets.
13. No unrelated audio is overwritten.
14. No placeholder/silence asset is accepted.
15. Global safety audio plays once.
16. Setup safety audio occurs before movement.
17. Repeated-set reminders remain short.
18. Recovery audio resolves on tracking/setup interruption.
19. Replay uses the selected voice.
20. Text remains visible when audio fails.
21. Playback failure does not crash or fabricate completion.
22. Band exercises have complete voice assets.
23. Standing band row has complete door-anchor voice assets.
24. Floor/step/support/balance/stop/tracking packs have voice assets.
25. Generated, short, restart, supporting, Explore, and manual sessions resolve safety audio.
26. New current plans fail closed for unresolved required cue audio.
27. Historical sessions remain readable.
28. Optional levels remain hidden/gated.
29. Stage 4C-R capability gates remain.
30. Stage 5A–5H contracts remain.
31. App and website typechecks pass.
32. Expo/Metro bundle resolves the assets.
33. No scoring/norm/Check-Up changes.
34. No package or lockfile changes.
35. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4D-R.1 complete unless:

1. The authoritative cue × voice matrix is complete.

2. Every required Clara and Marcus MP3 exists.

3. Every required asset passes automated validation.

4. Static mapping is complete and bundle-safe.

5. Canonical text/fingerprint integrity is enforced.

6. Runtime voice selection is verified.

7. Global/setup/repeat/recovery/replay delivery is verified.

8. Band and door-anchor voice packs are complete.

9. Text fallback remains verified.

10. A non-network audio-integrity command passes.

11. Local Expo/Metro bundle validation passes, or an equivalent static bundling proof is accepted and explicitly justified.

12. Stage 4C-R/4D-R regressions pass.

13. Stage 5 regressions pass.

14. Targeted tests pass.

15. Full suite passes.

16. App typecheck passes.

17. Website typecheck passes.

18. Expo config passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is reverted or overwritten.

22. No package install or lockfile change occurs.

23. No staging, commit, branch, or push occurs.

If provider credentials/network are unavailable or any required voice asset is missing, mark Stage 4D-R.1 blocked.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4D-R.1 COMPLETE`
- `STAGE 4D-R.1 BLOCKED`

Also state exactly one:

- `STAGE 4D-R VERIFIED`
- `STAGE 4D-R STILL BLOCKED`

Also state exactly one:

- `STAGE 4E-R UNBLOCKED`
- `STAGE 4E-R BLOCKED`

Use `STAGE 4E-R UNBLOCKED` only if:

- both voice matrices are complete;
- all required audio assets validate;
- static bundle resolution is proven;
- no P0/P1 cue-delivery gap remains.

Also state:

- `STAGE 4E-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4D-R.1 must not declare the exercise catalogue ready because F4R-005, F4R-008, F4R-009, and F4R-010 remain unresolved.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Audio generator changes.
- Required safety cue count.
- Required total asset count.
- Clara generated/reused/missing counts.
- Marcus generated/reused/missing counts.
- Provider/model identity without secrets.
- Dry-run result.
- Audio-integrity result.
- Static mapping result.
- Bundle/export result.
- Runtime voice-selection result.
- Cue-tier delivery result.
- Band/door-anchor parity result.
- Text-fallback result.
- Files changed.
- Binary assets generated/replaced.
- Tests added/changed.
- Targeted validation result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- Confirmation that Stage 4C-R, Stage 4D-R software, Stage 5A–5H, Stage 3D, navigation, and TypeScript-boundary protections remain.
- F4R-003 status.
- F4R-004 status.
- Remaining Stage 4 blockers.
- `STAGE 4D-R.1 COMPLETE` or blocked.
- `STAGE 4D-R VERIFIED` or still blocked.
- `STAGE 4E-R UNBLOCKED` or blocked.
- `STAGE 4E-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.
