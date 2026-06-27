# Hale Warden Source Acquisition And Full Integration Continuation

Date: 2026-06-27

## 1. Scope

This continuation attempted official Warden source acquisition, local source-pack creation, 30-second chair/sit-to-stand formula extraction, golden example generation, source-faithful runtime integration, exact age/reference sex onboarding, Strength / Power focus integration, consumer-safe result surfacing, and validation.

## 2. Prior Blocked Warden Report

Prior blocked report preserved and not edited:

```text
docs/audits/HALE_WARDEN_CHAIR_PERCENTILE_FULL_INTEGRATION.md
```

That report documented product-owner permission but blocked implementation because the official Warden source data/calculator/formula and golden examples were not locally available.

## 3. Product-Owner Permission Decision

Relied on the product-owner decision that Hale has written permission from the Warden study authors to use the approved 30-second chair-stand percentile data/calculator/formula. The redacted permission summary remains:

```text
docs/sources/HALE_WARDEN_PERMISSION_SUMMARY.md
```

No private permission correspondence was inspected or committed.

## 4. Initial Git Status

Initial status before source work:

```text
?? docs/audits/HALE_WARDEN_CHAIR_PERCENTILE_FULL_INTEGRATION.md
?? docs/audits/Hale_Warden_Source_Acquisition_and_Full_Integration_Continuation_Prompt.md
?? docs/sources/HALE_WARDEN_PERMISSION_SUMMARY.md
```

`git diff --name-only` and `git diff --stat` were empty. `git ls-files --others --exclude-standard` listed those same three untracked files. They were treated as user-owned and preserved.

## 5. Baseline Validation

Baseline before source integration:

```text
npm run typecheck
PASS

npm run verify:audio
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s voiceV21: requiredAssets=352 total: requiredAssets=502
```

Focused baseline regression slice passed: 27 suites, 267 tests.

## 6. Source Acquisition Method

Local source search covered repo docs/source/reference/audit paths, `src/reference/movementProfileV2/**`, and `/tmp/**` using Warden/30s-STS/chair/centile/percentile/LMS/calculator/pzab299 terms.

Official web retrieval used the DOI and Oxford Academic article page. Only official DOI/OUP/Oxford Academic publisher links were used. Raw files were saved outside committed source under `/tmp/hale-warden-source/raw/`.

## 7. Official Source URLs Attempted

```text
https://doi.org/10.1093/ptj/pzab299
https://academic.oup.com/ptj/article/102/3/pzab299/6481185
```

Official supplementary links on the Oxford Academic page provided the downloaded raw files.

## 8. Local Source Files Found/Downloaded

Downloaded official files:

```text
/tmp/hale-warden-source/raw/supporting_material_1_test_procedure_pzab299.pdf
/tmp/hale-warden-source/raw/supporting_material_2_calculator_v1_final_1_pzab299.xlsx
```

Created local source-pack files:

```text
/tmp/hale-warden-source/warden-source-notes.md
/tmp/hale-warden-source/warden-raw-file-inventory.txt
/tmp/hale-warden-source/warden-30s-sts-lms-table.csv
/tmp/hale-warden-source/warden-chair-golden-examples.csv
```

Raw PDF/XLSX files were kept local only and were not committed.

## 9. Source File Inventory

```text
supporting_material_1_test_procedure_pzab299.pdf	727152 bytes	sha256=10424d9e1db9fdbde17029d8b664f3f43b6940c1ebc6850486cf04d3b04e9e50	/tmp/hale-warden-source/raw/supporting_material_1_test_procedure_pzab299.pdf
supporting_material_2_calculator_v1_final_1_pzab299.xlsx	1175158 bytes	sha256=d16f1cf53a857ef6759e7fea2eb20f410de25f5febe734e9af3d25ade46484b8	/tmp/hale-warden-source/raw/supporting_material_2_calculator_v1_final_1_pzab299.xlsx
warden-30s-sts-lms-table.csv	108029 bytes	sha256=bebec0be0e55de18c882328a4979bef010c60b48c9a3ace8f5c415dccc514952	/tmp/hale-warden-source/warden-30s-sts-lms-table.csv
warden-chair-golden-examples.csv	3120 bytes	sha256=414fa338a712fe0b97688c776dd0523bb14efc2614cd40a295e5577aace0f42a	/tmp/hale-warden-source/warden-chair-golden-examples.csv
```

## 10. Source Formula/Table Extraction

The official workbook contains sheets:

```text
Instructions & data entry
Normative data
FORMULAS
Grip
5x-STS
30s-STS
STS_PWR
```

Only the hidden `30s-STS` sheet was used. The extracted table includes female rows ages 18.0 to 80.0 and male rows ages 18.0 to 79.3, each with age, mu, nu, sigma, and z=+2 value.

Identified workbook behavior:

- age is rounded down to 0.1 years before lookup;
- repetitions must be positive;
- formula is LMS-style mu/nu/sigma lookup;
- adjusted CDF uses the workbook lower-bound correction;
- high tail uses the workbook modified z-score behavior once unmodified z is at least +2;
- output is an exact internal percentile, which Hale bins for public UI.

## 11. Golden Examples

Golden examples were generated from the official workbook/calculator into:

```text
/tmp/hale-warden-source/warden-chair-golden-examples.csv
```

Coverage includes female and male reference groups at ages 50, 65, and 75 with low/mid/high repetition examples. Runtime tests compare representative exact percentiles to these golden values.

## 12. Source Acquisition Verdict

```text
WARDEN SOURCE ACQUISITION COMPLETE
```

## 13. Onboarding/Profile Implementation

Implemented canonical local profile fields:

```text
exactAge: number | null
referenceSex: 'female' | 'male' | null
```

Normal safety/onboarding profile now requires exact integer age and female/male reference group before continuing. Settings profile details now edits exact age and reference group. The post-checkup reference details screen is mandatory for official Movement Profile materialization and no longer exposes age-band fallback, "prefer not to say," or "continue without published comparisons" in the normal official flow.

Legacy `age`/`ageBand` remain for migration and older surfaces, but age-band selection was removed from the normal user flow.

## 14. Warden Transform Implementation

Implemented:

```text
src/reference/movementProfileV2/wardenChairTransform.ts
```

Runtime identity:

```text
sourceId: warden_2022_30s_sts
sourceDataFingerprint: warden-source-data-v2-1y3l7jb
sourceFingerprint: reference-source-v1-1onwfy3
transformationId: warden_2022_30s_sts_percentile_v1
transformationFingerprint: reference-transform-v1-0g6u3za
approvalId: hale-warden-official-calculator-2026-06-27
enabled: true
```

The transform is pure, deterministic, finite-output guarded, source-fingerprinted, and fail-closed on missing provider/source/transform/approval mismatch. It does not use date, env, backend, or network.

## 15. Reference Engine Integration

Warden source metadata changed from pending metadata-only status to approved calculator transform status. The engine now builds the official Warden chair percentile provider by default from the registered source and transformation fingerprints.

Eligible chair output requires:

- official V2 source type;
- valid chair-rise-30s-v2 result;
- complete protocol evidence;
- exact age at test;
- female/male reference group;
- age within Warden sex-specific source range;
- matching approved source and transform fingerprints.

Missing/ineligible states remain raw-only/fail-closed.

## 16. Snapshot/Assessment/Focus Integration

Official snapshots now freeze:

- normalized exact age/reference sex profile;
- Warden source and transform metadata;
- raw chair repetitions;
- chair percentile range;
- eligibility state.

Assessment domain evidence policy moved to v2. Chair classification uses the conservative upper bound of the public percentile range:

- below 10th: below-reference Strength / Power focus candidate;
- range high <= 25: Hale starting point Strength / Power focus candidate;
- range high <= 40: Hale building;
- higher ranges: neutral/within reference;
- above 90th: above-reference/ceiling, not a low-focus signal.

Balance and shoulder rules were preserved. Official retest prior-focus behavior and life-goal tie-break behavior were preserved.

## 17. Plan Creation Integration

Plan creation consumes the updated v2 assessment. Low Warden chair evidence can now produce Strength / Power focus and a Strength / Power V2 block. Neutral chair plus low balance continues to produce Balance focus. All neutral remains genuine Balanced.

Scheduler, training credit, progression, A/B/C templates, and Balanced templates were not changed.

## 18. Results/Progress/Report UI

Movement Profile result and Progress presentation now show raw chair reps first and a consumer-safe range second, for example:

```text
12 rises in 30 seconds
Around the 10th-40th percentile
```

Public UI avoids technical Warden/LMS/schema/fingerprint language, exact headline percentile, Movement Age, diagnosis, fall-risk, pass/fail, and improvement/decline copy.

## 19. Optional/Micro Containment

Optional/non-official sources still cannot create official Warden snapshots, assessments, focus, plans, reports, or latest-profile history. Micro-check policy remains non-official and unchanged.

## 20. Persistence/Sync/Restore/Export/Account Clear

Exact age/reference sex now round-trip through local preferences and backend profile sync JSON. Restore local-empty detection treats these fields as meaningful preferences. Check-up history/backend check-up sync already carries bounded snapshot metadata. Data export remains sanitized and does not include raw workbooks/PDFs, frames/video/images/landmarks, secrets, or private permission correspondence. Existing account clear paths delete local/remote bounded app data through current services.

## 21. Copy Guardrails

Automated copy-focused tests passed. Public Warden-facing UI avoids:

```text
Movement Age
diagnosis
fall risk
Warden
LMS
centile calculator
schema
fingerprint
raw_only_source_transform_unapproved
exact headline percentile
```

Internal docs/tests may still name Warden and source identifiers.

## 22. Tests Added/Changed

Updated and extended tests for:

- Warden golden examples in the reference engine tests;
- default approved Warden provider behavior and mismatch fail-closed behavior;
- snapshot freezing of chair percentile ranges;
- domain evidence/focus policy v2;
- public onboarding/reference profile flow;
- Progress and result view-model chair labels;
- exact age/reference sex serialization and onboarding fixture completion;
- H4.1.1 retest policy fingerprint version expectations.

## 23. Files Changed

Primary runtime files changed:

```text
App.tsx
src/movementProfileV2/referenceDetailsDraft.ts
src/movementProfileV2/viewModel.ts
src/onboarding/state.ts
src/profile/index.ts
src/profile/serialize.ts
src/profile/types.ts
src/reference/movementProfileV2/assessment.ts
src/reference/movementProfileV2/chair.ts
src/reference/movementProfileV2/engine.ts
src/reference/movementProfileV2/index.ts
src/reference/movementProfileV2/snapshot.ts
src/reference/movementProfileV2/sources.ts
src/reference/movementProfileV2/transformations.ts
src/reference/movementProfileV2/types.ts
src/reference/movementProfileV2/wardenChairTransform.ts
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/progressProductPresentation.ts
src/services/backend/profileSyncService.ts
src/services/backend/restoreService.ts
```

Test files changed under `src/**/__tests__`.

## 24. Focused Validation

Latest focused validation:

```text
npm test -- --runInBand [29 focused suites]
PASS
Test Suites: 29 passed, 29 total
Tests: 283 passed, 283 total
```

Watchman recrawl warning and the existing Jest open-handle notice appeared; no focused failures.

## 25. Full Validation

Final validation:

```text
npm run typecheck
PASS

npm run verify:audio
PASS

npm test -- --runInBand
PASS
Test Suites: 167 passed, 167 total
Tests: 1362 passed, 1362 total

npm --prefix website run typecheck
PASS

npx --no-install expo config --type public
PASS

git diff --check
PASS

npx --no-install expo export --platform all --output-dir /tmp/hale-warden-source-acquisition-integration-export
PASS
```

Expo config/export printed existing environment variable names and the existing Sentry config warning; no secret values were exposed. Full Jest printed expected mocked Supabase sync warnings in sync-failure tests plus the existing Jest open-handle notice; no failures. Export output directory was removed after the command.

## 26. Remaining Limitations/Device QA

Physical-device validation was not performed and is not claimed. Public release remains blocked. Raw official source files remain local-only in `/tmp/hale-warden-source/` and should be reacquired or manually supplied if the temp directory is cleared.

## 27. Initial/Final Git Status

Initial status is recorded in section 4.

Final status before staging/commit:

```text
Modified tracked files include App.tsx, Warden reference engine files, profile/onboarding/settings screens, backend profile/restore services, and related tests.
Untracked user-owned files preserved:
  docs/audits/HALE_WARDEN_CHAIR_PERCENTILE_FULL_INTEGRATION.md
  docs/audits/Hale_Warden_Source_Acquisition_and_Full_Integration_Continuation_Prompt.md
  docs/sources/HALE_WARDEN_PERMISSION_SUMMARY.md
New untracked implementation/report files:
  src/reference/movementProfileV2/wardenChairTransform.ts
  docs/audits/HALE_WARDEN_SOURCE_ACQUISITION_AND_FULL_INTEGRATION_CONTINUATION.md
```

No files were staged or committed.

## 28. Required Confirmations

No package install occurred. No lockfile changed. No audio was regenerated. No staging, commit, branch, push, or PR occurred. No Warden formula approximation was used. No unauthorized source was used. No raw workbook/PDF was committed. No private permission correspondence was committed. No public V1 rollback was introduced. H5A/H5B/H5C/H5D behavior was preserved by regression tests. HF1/HF2/HF3 hands-free behavior was preserved by regression tests. Training credit/progression policy was not changed. Physical-device validation was not claimed.

## Final Verdicts

WARDEN SOURCE ACQUISITION AND FULL INTEGRATION COMPLETE

OFFICIAL WARDEN SOURCE MATERIAL ACQUIRED

WARDEN GOLDEN EXAMPLES CREATED

EXACT AGE AND REFERENCE SEX ONBOARDING IMPLEMENTED

WARDEN CHAIR PERCENTILE TRANSFORM IMPLEMENTED

WARDEN STRENGTH FOCUS INTEGRATION IMPLEMENTED

WARDEN-INFLUENCED PLAN CREATION VERIFIED

NO MOVEMENT AGE REINTRODUCTION

NO DIAGNOSIS / FALL-RISK CLAIMS

NO EXACT HEADLINE PERCENTILE

OPTIONAL CHECK-UP CONTAINMENT PRESERVED

MICRO-CHECK CONTAINMENT PRESERVED

H5A PROGRESS PRESERVED

H5B MICRO-CHECK POLICY PRESERVED

H5C PUBLIC V1 ROUTE RETIREMENT PRESERVED

H5D RELEASE HARDENING PRESERVED

HF1/HF2/HF3 HANDS-FREE BEHAVIOR PRESERVED

NO AUDIO REGENERATION

PHYSICAL DEVICE VALIDATION NOT CLAIMED

PUBLIC RELEASE REMAINS BLOCKED
