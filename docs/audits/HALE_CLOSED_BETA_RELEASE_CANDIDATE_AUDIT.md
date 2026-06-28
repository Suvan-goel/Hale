# Hale Closed-Beta Release Candidate Audit

Audit date: 2026-06-28
Repository: `/Users/suvangoel/Hale`
Mode: audit and triage only, no production fixes.

## 1. Scope

This audit reviewed Hale as a closed-beta release candidate after the recent unified Movement Profile V2, Warden, H5, HF, Progress, micro-check, training lifecycle, auth, and local/profile work. The audit covered worktree hygiene, release flags, route/internal exposure, full user journeys, UI/copy, persistence/sync/restore/privacy, app config, website claims, validation gates, and test coverage.

Physical-device validation was not performed and is not claimed.

## 2. Why this audit was required

The latest implementation line reports the major software work complete, including Warden source acquisition/integration, exact age and reference sex onboarding, Warden-backed Strength / Power focus, public V2 Check-Up, Progress restoration, H5 release hardening, and HF hands-free flows. This audit was required because invite-only beta users are the first non-developer audience likely to encounter real auth/onboarding/Check-Up/plan/training/privacy paths.

The audit posture was bug search and go/no-go triage, not an architecture pass or remediation pass.

## 3. Current implementation baseline

Baseline read:

- Warden continuation supersedes the earlier blocked Warden report: official Warden source material was acquired, golden examples were created, Warden chair percentile transform integrated, and Strength / Power focus/plan creation verified.
- H5A/H5B/H5C/H5D remain the intended public Movement Profile V2 route, Progress, micro-check, V1-retirement, and release flag baseline.
- HF1/HF2/HF3 reports state V2 Check-Up, scheduled/optional micro-checks, and floor/training setup are hands-free, with physical-device validation still not claimed.
- `docs/decisions.md` records local closed-beta plan preparation, DOB rather than raw age entry, Expo SDK 56 / RN 0.85.3, Supabase auth, local stores scoped per signed-in user, and benchmark/diagnostic-only renderer work.

Local package/config baseline:

- Expo `~56.0.11`, React Native `0.85.3`, React `19.2.3`.
- App id/package: `com.suvangoel.hale`.
- App version: `0.1.0`.
- Supabase client uses only public URL/publishable-key env names in app code.

## 4. Worktree / release hygiene inventory

Initial `git status --short --untracked-files=all`:

```text
 M App.tsx
 M docs/decisions.md
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseRendererReplay.ts
 M src/movementProfileV2/referenceDetailsDraft.ts
 M src/onboarding/state.ts
 M src/profile/__tests__/age.test.ts
 M src/profile/__tests__/serialize.test.ts
 M src/profile/age.ts
 M src/profile/index.ts
 M src/profile/serialize.ts
 M src/profile/types.ts
 M src/render/PoseAvatarRenderer.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/poseAvatarTypes.ts
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/screens/__tests__/ProgressAndManualRestoration.test.ts
 M src/services/backend/__tests__/profileSyncService.test.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/restoreService.ts
?? docs/audits/Hale_Closed_Beta_Release_Candidate_Audit_Prompt.md
?? src/components/DateOfBirthPickerModal.tsx
?? src/render/ArtDirectedHumanRenderer.tsx
?? src/render/__tests__/artDirectedHumanGeometry.test.ts
?? src/render/artDirectedHumanGeometry.ts
```

Initial `git diff --name-only` matched the tracked modified files above. Initial `git diff --stat` reported 26 files changed, 576 insertions, 175 deletions. Initial untracked files were:

```text
docs/audits/Hale_Closed_Beta_Release_Candidate_Audit_Prompt.md
src/components/DateOfBirthPickerModal.tsx
src/render/ArtDirectedHumanRenderer.tsx
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
```

Inventory classification:

| Class | Files |
|---|---|
| Production runtime code | `App.tsx`, `src/profile/**`, `src/onboarding/state.ts`, `src/screens/**`, `src/services/backend/profileSyncService.ts`, `src/services/backend/restoreService.ts`, `src/render/PoseAvatarRenderer.tsx`, `src/render/poseAvatarTypes.ts`, untracked `src/components/DateOfBirthPickerModal.tsx`, untracked `src/render/ArtDirectedHumanRenderer.tsx`, untracked `src/render/artDirectedHumanGeometry.ts` |
| Tests | `src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts`, `src/profile/__tests__/**`, `src/render/__tests__/**`, `src/screens/__tests__/**`, `src/services/backend/__tests__/profileSyncService.test.ts`, untracked `src/render/__tests__/artDirectedHumanGeometry.test.ts` |
| Audit docs/prompts | untracked `docs/audits/Hale_Closed_Beta_Release_Candidate_Audit_Prompt.md`, this report |
| Source docs | `docs/decisions.md` |
| Assets/audio | No modified or untracked audio assets |
| Assets/images | No modified or untracked image assets found in git status |
| Website | No modified or untracked website files |
| Raw private/local source material | `/tmp/hale-warden-source/**`, outside git |
| Temporary files | `/tmp/hale-beta-rc-audit-export` and `/tmp/hale-beta-rc-safe-export` were created and removed by validation |
| Unknown/unexpected | `docs/audits/.DS_Store` exists in `docs/audits`; not newly created by this audit |

Before beta, all intended production runtime code changes and tests must be intentionally reviewed and committed. The audit prompt file is not needed in a release commit unless the team intentionally stores prompts. Raw Warden source files should remain private and untracked.

## 5. Private Warden source-pack status

`/tmp/hale-warden-source/` exists and contains:

```text
/tmp/hale-warden-source/raw/supporting_material_1_test_procedure_pzab299.pdf
/tmp/hale-warden-source/raw/supporting_material_2_calculator_v1_final_1_pzab299.xlsx
/tmp/hale-warden-source/warden-30s-sts-lms-table.csv
/tmp/hale-warden-source/warden-chair-golden-examples.csv
/tmp/hale-warden-source/warden-raw-file-inventory.txt
/tmp/hale-warden-source/warden-source-notes.md
```

The product owner should back this source pack up privately before `/tmp` is cleared. It was not committed, moved, copied into the repo, or exposed by this audit.

## 6. Baseline validation

Baseline gate results:

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | PASS | `tsc --noEmit` completed |
| `npm run verify:audio` | PASS | safety required assets 88, Movement Profile V2 required assets 62, voice V2.1 required assets 352, total required assets 502 |
| `npm test -- --runInBand` | PASS | 168 test suites passed, 1370 tests passed |
| `npm --prefix website run typecheck` | PASS | Website TypeScript gate completed |
| `npx --no-install expo config --type public` | PASS | Loaded `.env.local` and `.env`; did not print secret values; Sentry Expo plugin warned about missing org/project config |
| `git diff --check` | PASS | No whitespace errors |
| `npx --no-install expo export --platform all --output-dir /tmp/hale-beta-rc-audit-export` | PASS | Web, iOS, and Android exported; temporary export dir removed |

Known warnings:

- Watchman recrawl warning during Jest.
- Expected mocked Supabase sync failure warnings in failure-path tests.
- Jest open-handle notice after tests.
- Sentry Expo plugin warning about missing org/project config.
- Node color warning during export because both `NO_COLOR` and `FORCE_COLOR` were present.

No validation command changed source files.

## 7. Release flag/internal exposure audit

Flag inventory found strict `'1'` parsing for internal/diagnostic/release flags:

- `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK`
- `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP`
- `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL`
- `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS`
- `EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS`
- `EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE`
- `EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS`
- `EXPO_PUBLIC_ENABLE_SENTRY`
- `EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `ELEVENLABS_API_KEY`

`.env.example` is safe: internal Movement Profile V2, legacy V1 rollback, Movement Profile diagnostics, pose latency diagnostics, and diagnostics-in-release all default to `0`.

Source gating is generally correct:

- Movement Profile V2 internal Settings rows mount only when `MOVEMENT_PROFILE_V2_INTERNAL_ENABLED` is true.
- V2 internal flows redirect home when internal mode is disabled unless the flow is one of the public V2 flows.
- Movement Profile V2 live diagnostics require both internal and diagnostics flags.
- Pose benchmark route mounts only when pose latency diagnostics are enabled.

Finding: the current local public Expo config loaded `.env.local` / `.env` and produced `extra.enablePoseLatencyDiagnostics: true` and `extra.allowDiagnosticsInRelease: true`. That means the current build environment is not safe for a beta build unless explicit safe-beta overrides or a clean release profile are used. This is P1 release hygiene because it can expose diagnostic/benchmark surfaces to testers.

## 8. Safe-beta config/export audit

Safe-beta public config was run with:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0
```

Result: PASS. The public config reported pose latency diagnostics disabled and diagnostics-in-release disabled.

Safe-beta export with the same overrides: PASS. Web, iOS, and Android exported, and the temporary export directory was removed.

Conclusion: source defaults and explicit safe-beta overrides can produce a safe build. The current loaded local environment is not itself safe.

## 9. Fresh install/auth/onboarding audit

Reviewed paths:

- Signed-out launch goes to required auth.
- Sign-in/sign-up/reset-password paths are present.
- Safety profile collects date of birth and reference group before onboarding completion.
- DOB derives whole-year age and compatibility age mirrors.
- Reference sex copy uses reference group language rather than gender.
- Life goal, safety profile, equipment, camera explanation/setup, baseline Check-Up, results, and block creation remain the intended onboarding path.

Findings:

- P1: the post-Check-Up reference details confirmation screen can show a fabricated date of birth when prefilled from an existing profile. `movementProfileV2ReferenceDetailsDraftFromProfile` preserves exact age/reference sex but not DOB, and `MovementProfileV2ReferenceDetailsScreen` synthesizes DOB as today's month/day minus age. On 2026-06-28, a user born 1966-02-10 and age 60 would be shown as 06/28/1966. This is a beta blocker because it is user-visible, trust-sensitive, and appears directly after the Movement Check-Up.
- No old age-band-only editor was found in the main onboarding path.
- No Warden field persistence crash was found in static/source review.

## 10. Existing user/restore-state audit

Reviewed states:

- Existing profiles with exact age/reference sex remain compatible even without DOB.
- New profile path prefers DOB-derived age.
- Old snapshots are parsed through V2 snapshot/assessment compatibility checks rather than silently falling to V1.
- Restore only writes when local Hale state is empty.
- Malformed/future V2 artifacts fail closed through parser/recovery tests.
- Signed-out sync paths short-circuit through auth session checks.

Findings:

- No P0/P1 restore crash was found.
- The synthetic DOB reference-details issue also affects existing users because existing exact-age profiles can prefill that screen without preserving the real DOB.

## 11. Movement Check-Up hands-free audit

Evidence reviewed:

- HF1 implementation report.
- Movement Profile V2 live coordinator and voice runtime tests in the baseline Jest run.
- Public V2 unified Check-Up route wiring.

Expected hands-free behaviors remain represented in code/tests: chair setup/readiness, balance leg inference/auto-best, shoulder side inference/auto-capture, hinge auto-capture, fallback controls after timeout, official baseline/retake/retest, and optional full extra Check-Up as non-official.

No normal-path required tap was found in source review. Physical-device hands-free behavior was not validated.

## 12. Warden result/focus/plan audit

Evidence reviewed:

- Warden continuation reports.
- Warden chair interpretation/view model source.
- Assessment/focus source.
- Training/block plan creation source/tests in the full Jest pass.

Expected behaviors remain intact:

- Exact age and reference sex are frozen into official V2 artifacts.
- Eligible chair results produce Warden percentile ranges.
- Raw reps are shown first.
- Low Warden chair evidence can drive Strength / Power focus and block creation.
- Neutral/high Warden does not force Strength / Power.
- Ineligible/missing Warden remains raw-only/reference-ineligible.
- Optional Check-Ups stay non-official.

No Warden formula/data/fingerprint change was made by this audit. No Warden formula regression was found.

## 13. Results/report/next-block audit

Reviewed:

- Unified results presentation.
- Movement Profile result view model.
- Block report/next-block path from prior H4/H5 reports.
- Retest result CTA handling.

Findings:

- Plan/report CTAs are navigation actions in the presentation layer, not direct duplicate creators.
- Saved/read-only results preserve raw values and do not claim new plan mutation.
- P2 copy cleanup: public result/detail copy includes "published comparisons", "published comparison", "published age-group benchmark", and diagnosis-disclaimer language. These are not false claims, but they are colder and more technical than beta-safe consumer copy and appear in user-facing screens.

## 14. Today/Plan/Progress audit

Reviewed:

- Progress source and restored V2 canonical Progress state.
- Plan screen source.
- H5A/H5B/H5C/H5D reports.
- Progress/manual restoration tests in the full Jest pass.

Expected states remain covered by code/tests:

- Today/Plan routes consume active domain and Balanced plan state.
- Progress can show empty, one Movement Profile, multiple profiles, reports, and V2 progress.
- V2 internal Progress card is hidden unless `MOVEMENT_PROFILE_V2_INTERNAL_ENABLED` is true.
- Optional extra Check-Up entry points remain non-official containment paths.

No H5 regression was found in source review or tests.

## 15. Manual/Extra Check-Up audit

Reviewed:

- Optional full Check-Up and optional micro-check reports/tests.
- H5B/H5B.1 containment rules.
- App route wiring for optional flows.

Expected containment remains intact:

- Optional full Check-Up is V2/non-official.
- Optional micro-check is non-scheduled unless launched from a scheduled slot.
- Optional flows should not mutate official latest profile, focus, active block, report, official history, schedule credit, progression, or `microChecksCompleted`.

No P0/P1 optional containment issue was found.

## 16. Scheduled micro-check audit

Reviewed:

- H5B/H5B.1 reports.
- Micro-check policy tests included in the full Jest pass.
- Micro-check persistence/sync/restore/export/account clear integration tests.

Expected states remain intact:

- Domain block scheduled micro-checks are slot-backed.
- Balanced week 1/2/3 map to Strength, Balance, Mobility.
- Balanced week 4 has no scheduled micro-check.
- First accepted same-slot result wins.
- Optional fallback timeout does not turn optional checks into scheduled credit.

No H5B/HF2 regression was found.

## 17. Training-session audit

Reviewed:

- HF3 implementation report.
- Stage 5 scheduler/lifecycle reports.
- Training voice V2.1 and floor-readiness evidence from tests/reports.
- Current training source for release gates, floor setup, progression, credit, and optional practice.

Expected behaviors remain intact:

- Session preview, readiness/discomfort, domain and Balanced A/B/C sessions, main-plan credit, schedule credit, floor setup hands-free, pause/help/repeat/skip/stop, completion, feedback/RPE/pain, and recovery logic are covered by prior reports/tests.
- No change was made to credit, progression, equipment gates, capability gates, daily-context gates, release caps, or hidden optional levels.

No HF3 or Stage 5 regression was found.

## 18. Explore/manual-practice audit

Reviewed:

- Explore root/detail source.
- Extra sessions/presets and ladder detail source.
- Release policy/progression policy source.

Expected behavior:

- Manual practice remains non-credit and progression-ineligible.
- Optional advanced levels remain release-policy controlled.
- Equipment/capability/readiness gates remain in the planning layer.

No P0/P1 Explore/manual-practice issue was found.

## 19. Settings/Profile/Safety/Equipment audit

Reviewed:

- Settings root and sub-sections.
- Safety profile screen.
- DOB picker.
- Account auth/data actions.

Findings:

- Profile editing uses DOB/reference group rather than old age-band-only input.
- Reference sex copy uses "reference group", not gender.
- Local data deletion exists in Settings for signed-in users.
- P2: delete-account copy says it asks Hale to delete synced account data, then removes Hale data from this phone. `requestCloudAccountDeletion` currently throws the deferred cloud-deletion message before local deletion runs, so the user sees a failure/deferred message and local data is not cleared from that path. The separate "Delete local data only" path exists, so this is not a data-clear P1, but the delete-account path is rough for beta.
- P3: DOB picker max-age year options can exclude some valid edge-case 120-year-old birthdates. This is outside target age but should be cleaned later.

## 20. UI visual QA inventory

No simulator/device screenshot pass was performed. This table is source/test/report based.

| State | Status | Issue | Severity | Action |
|---|---|---|---:|---|
| Welcome / onboarding start | Acceptable | Auth hero copy uses "weakest areas" | P2 | Soften copy |
| Life goal onboarding | Acceptable | No issue found | - | Device QA |
| Age/reference sex onboarding | Needs cleanup | DOB/reference group path OK, but post-Check-Up reference screen can show synthetic DOB | P1 | Fix before beta |
| Equipment onboarding | Acceptable | No issue found | - | Device QA |
| Camera explanation | Acceptable | Camera privacy copy aligned | - | Device QA |
| Camera setup | Acceptable | No issue found in source | - | Device QA |
| V2 Check-Up recording | Acceptable by tests | No device validation | - | Device QA required |
| Reference details | Broken for prefilled DOB | Synthetic DOB | P1 | Fix before beta |
| Movement Profile results | Needs cleanup | Technical copy around published comparison/diagnosis disclaimers | P2 | Copy pass |
| First block intro | Acceptable | No issue found | - | Device QA |
| Today no plan | Acceptable | No issue found | - | Device QA |
| Today active plan | Acceptable | No issue found | - | Device QA |
| Today micro-check due | Acceptable by H5 tests | No issue found | - | Device QA |
| Today retest due | Acceptable by source review | No issue found | - | Device QA |
| Plan active domain | Acceptable | No issue found | - | Device QA |
| Plan active Balanced | Acceptable | No issue found | - | Device QA |
| Progress empty | Acceptable | No issue found | - | Device QA |
| Progress with one Movement Profile | Acceptable | Internal card hidden under safe flags | - | Device QA |
| Progress with Warden label | Needs cleanup | "published age-group" style label is technical | P2 | Copy pass |
| Progress 2+ profiles | Acceptable by tests | No issue found | - | Device QA |
| Manual / Extra Check-Up | Acceptable by containment tests | No issue found | - | Device QA |
| Optional full Check-Up flow | Acceptable by containment tests | No issue found | - | Device QA |
| Optional micro-check flow | Acceptable by H5B tests | No issue found | - | Device QA |
| Official re-test result | Acceptable | No duplicate creator found | - | Device QA |
| V2 block report | Acceptable | No issue found | - | Device QA |
| Explore root/detail | Acceptable | No issue found | - | Device QA |
| Training preview | Acceptable | No issue found | - | Device QA |
| Training active | Acceptable by HF3 tests | No issue found | - | Device QA |
| Floor setup | Acceptable by HF3 tests | No issue found | - | Device QA |
| Session completion | Acceptable | No issue found | - | Device QA |
| Settings root | Needs cleanup | Delete-account deferred/local-clear copy roughness | P2 | Copy/flow fix |
| Safety profile / movement setup | Acceptable | No issue found beyond copy | - | Device QA |
| Auth/sign-in/account | Needs cleanup | "weakest areas" copy and delete-account roughness | P2 | Copy/flow fix |

## 21. Forbidden copy scan

Public-facing defects or cleanup:

- `src/screens/AuthScreen.tsx`: "address your weakest areas" is user-facing. P2 copy issue.
- `src/results/movementProfileV2ResultsAdapter.ts`: "published comparisons" is user-facing. P2 copy issue.
- `src/movementProfileV2/viewModel.ts`: "published comparison", "Published comparison", "Published age-group benchmark saved", "diagnosis", "fall-risk diagnosis", and "medical ranges" appear in user-facing result details. These are disclaimers or reference labels, not claims, but should be simplified before broader beta. P2.
- `src/screens/MovementProfileV2ReferenceDetailsScreen.tsx` and `src/screens/SafetyProfileScreen.tsx`: "published comparisons" appears in reference-detail copy. P2 copy issue.
- `website/src/content/landing.ts`: "movement-age style ranges" appears in public website copy. It is framed as wellness guidance and not a diagnosis, but should be reviewed because the app is currently presenting "Movement Profile" rather than a precise Movement Age feature. P2.

Acceptable or gated hits:

- V1/V2/internal/debug/schema/fingerprint/Warden/LMS/percentile appear extensively in source, tests, diagnostics, reports, or gated internal/dev contexts.
- Warden result copy exposes percentile ranges such as "Below the 10th percentile" and "Around the 10th-40th percentile"; exact headline percentile values were not found in public result copy.
- "diagnosis" on the website and result details is generally disclaimer language, not a medical claim.

No user-facing "body age", "strength age", "sarcopenia", "pass/fail", "raw_only", "LMS", "Warden", "schema", or "fingerprint" defect was found in the normal safe-beta app surfaces.

## 22. Accessibility/basic UX audit

Source review found:

- Fallback controls and stop/cancel access are present in Check-Up/training flows.
- Voice assets verify successfully.
- Camera permission copy states skeleton measurement and no video shown/stored.
- Auth, DOB picker, account actions, and key Pressables include accessibility labels/roles in reviewed files.
- No color-only blocker was found in source review.

Risks:

- No large-text or screen-reader simulator pass was performed.
- No camera permission denial/audio failure physical-device pass was performed.
- The synthetic DOB issue is an accessibility/trust issue as well as a data issue because the visible field is wrong.

## 23. Persistence/sync/restore/account-clear audit

Reviewed:

- Raw Check-Up, snapshot, assessment, block, report, next block, micro-check, training completion persistence.
- Restore mapping/dedupe/fail-closed behavior.
- Account local-data clear and signed-out sync short-circuit.
- Backend sync services for profile, Check-Up, block, report, session, micro-check, and training state.

Findings:

- No P0/P1 restore/sync crash or duplicate official artifact creator was found.
- Account local-data-only clear exists and is tested.
- Delete-account path is rough because cloud account deletion is deferred before local clear runs. P2 because local clear is available separately.
- P1 export/privacy issue described below applies to persisted/synced legacy safety note fields.

## 24. Export/privacy audit

Positive findings:

- Export sanitizer removes/omits raw pose/video/image/frame/landmark keys, file/path/URI keys, token/secret/service-role keys, base64 image strings, and local `file://` / `content://` values.
- Supabase/Sentry/ElevenLabs credential values were not printed or exposed.
- Private Warden PDF/workbook content remained outside the repo and outside export code paths.
- Bounded Warden metadata such as source ids, age at test, reference sex, raw reps, percentile range, and eligibility state is allowed and present only as product data.

P1 finding:

- `MovementSafetyProfile` still allows `painNotes` and `injuryNotes`; `profileSyncService` syncs normalized safety profile into `safety_json`; `sanitizeForDataExport` does not redact note keys. Current Safety UI uses controlled pain-area values, but restored/legacy/synced data can still include free-text health notes and account export can include them. This violates the audit requirement that exports/diagnostics not include free-text health notes.

## 25. Backend/auth audit

Reviewed:

- Supabase client setup.
- Auth provider and auth service.
- Profile sync/merge.
- Check-Up/block/report/session/micro-check/training sync.
- Restore.
- Export/account data services.

Findings:

- Mobile app imports public Supabase URL and publishable key only; no service-role key was found in app source.
- User-owned tables are queried/upserted with current user id scoping in reviewed code.
- Signed-out export fails clearly.
- Restore only hydrates when local state is empty.
- Profile sync includes DOB-derived birth year top-level and profile/safety/preferences JSON payloads.
- P1 export privacy gap remains for legacy free-text health notes.

## 26. App config/store readiness checklist

| Item | Status | Notes |
|---|---|---|
| App name | OK | `Hale` |
| Bundle identifiers | OK | iOS/Android `com.suvangoel.hale` |
| Version | Needs release decision | `0.1.0`; build numbers not audited because no `eas.json` was present |
| Icons | Present | Config references iOS/Android icons |
| Splash | Not explicitly reviewed | No blocker found |
| Camera permission copy | OK | Skeleton measurement, no video shown/stored |
| Privacy policy/terms | Needs pre-store review | Website terms are draft beta terms |
| Support email | Website-config dependent | Terms page falls back if support email not configured |
| Sentry | Needs release config | Expo plugin warns about missing org/project config in local command |
| Supabase public config names | OK | Names only; values not printed |
| Android permissions | P2 | Public config generated `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` in addition to camera, likely via audio plugin. Investigate before store/broad beta because the product says recording disabled and camera/audio privacy matters. |

## 27. Website quick-claim check

Website typecheck passed. Quick content review found:

- Website privacy copy says the camera is a measuring tool and users see skeleton, not self-view video.
- Website diagnosis/medical-device wording is disclaimer language.
- Beta terms are clearly draft.
- P2: website FAQ/credibility copy mentions "movement-age style ranges". This may be directionally aligned with the broader product laws, but for this closed-beta app state it risks over-promising if the app is currently "Movement Profile" and reference bands rather than a Movement Age presentation.

No unsupported fall-risk/sarcopenia/pass-fail claim was found in website source.

## 28. Test coverage map

| Area | Existing tests/evidence | Recent validation | Gap | Severity | Follow-up |
|---|---|---:|---|---:|---|
| Onboarding exact age/reference sex | Profile age/serialize tests, onboarding state source | PASS | No test that real DOB is preserved into reference details screen | P1 | Add regression test with DOB not equal to today's month/day |
| Warden transform golden tests | Warden continuation/golden example reports and reference tests | PASS | Physical device not applicable | - | Keep golden examples private/source-faithful |
| V2 Check-Up hands-free | HF1 reports and live coordinator/voice tests | PASS | Physical device hands-free not tested | - | Device QA |
| Optional full Check-Up containment | H5/HF tests and Progress/manual restoration tests | PASS | Device route smoke still needed | - | Device QA |
| Scheduled/optional micro-checks | H5B/H5B.1 tests, micro-check sync/export tests | PASS | Device route smoke still needed | - | Device QA |
| Training floor setup | HF3 reports/tests | PASS | Physical floor setup not tested | - | Device QA |
| Progress restoration | Progress/manual restoration tests | PASS | Visual QA not screenshot-tested | P2 | Device/screenshot QA |
| Stage 5 scheduler | Stage 5 reports/tests | PASS | Device integration smoke | - | Device QA |
| Stage 4 safety gates | Stage 4 reports/tests | PASS | Large text/copy pass | P2 | Manual QA |
| Release flags | Release flag audit tests and safe-beta config/export | PASS | Current local env unsafe | P1 | Clean release env/EAS profile |
| Sync/restore/export | Backend tests and source review | PASS | Export health-note redaction missing | P1 | Add sanitizer/test |
| Copy guardrails | Manual `rg` scan | PASS with findings | No automated public-copy guard for banned phrases | P2 | Add copy guard test for public surfaces |

## 29. Defect register

| ID | Severity | Area | User-visible? | Reproduction / evidence | Why it matters | Recommended fix | Fix before beta? | Owner/follow-up prompt |
|---|---:|---|---|---|---|---|---|---|
| RC-001 | P1 | Reference details / DOB | Yes | Complete/check a V2 flow with profile DOB 1966-02-10 and age 60; the reference details screen prefill can show 06/28/1966 because it synthesizes DOB from age and current date | Trust-sensitive personal data appears wrong immediately after Check-Up | Preserve DOB in `MovementProfileV2ReferenceDetailsDraft` or pass profile DOB directly; only synthesize/display age when DOB is truly unknown; add regression test | Yes | "Fix Movement Profile V2 reference details DOB prefill without changing Warden formulas" |
| RC-002 | P1 | Release flags / diagnostics | Potentially | Baseline `expo config --type public` loaded local env and set pose diagnostics and diagnostics-in-release true | Beta builds from this environment can expose diagnostic/benchmark surfaces | Clean release env/EAS profile; enforce release audit failure if unsafe flags are true for beta profile; document safe build command | Yes | "Lock beta build profile so pose/internal diagnostics cannot ship" |
| RC-003 | P1 | Export/privacy | No, privacy/data | `MovementSafetyProfile` allows `painNotes`/`injuryNotes`; `profileSyncService` syncs safety JSON; export sanitizer does not redact note keys | Free-text health notes can be included in user export contrary to audit requirement | Redact/omit health-note free-text keys from export and diagnostics; add test covering `painNotes`/`injuryNotes` | Yes | "Redact free-text safety notes from export/sync diagnostics without deleting local profile behavior" |
| RC-004 | P2 | Auth/onboarding copy | Yes | `AuthScreen` says "address your weakest areas" | Harsh for target users and explicitly flagged by copy scan | Soften to "areas that need the most support" or similar | No | Copy polish |
| RC-005 | P2 | Results/reference copy | Yes | Public result/detail screens use "published comparisons", "published age-group", and diagnosis/fall-risk disclaimer language | Technical/medical-adjacent wording reduces trust | Replace with consumer reference-band copy and remove unnecessary medical terms from normal detail surfaces | No | Copy polish |
| RC-006 | P2 | App config/store privacy | Potentially | Expo public config generated Android audio/foreground media permissions beyond camera | Store/tester trust risk given no recording claim | Investigate `expo-audio` permission/plugin config and document why permissions are needed or remove if possible | No for tiny beta, yes before store | Release hygiene |
| RC-007 | P2 | Account deletion | Yes | Delete-account path calls deferred cloud deletion before local clear, so local data is not cleared from that path | User expectation mismatch | Change copy/flow so local data clear can still run or clearly separate cloud request from local clear | No | Account UX/privacy |
| RC-008 | P2 | Website claims | Yes | Website mentions "movement-age style ranges" | May over-promise current Movement Profile beta | Align public beta copy with actual app result language | No | Website copy |
| RC-009 | P3 | DOB picker edge | Yes, rare | Max-age year options can exclude some valid 120-year-old dates | Outside target audience but incorrect edge math | Generate DOB ranges by exact date, not only year | No | Cleanup |
| RC-010 | P3 | Release commit hygiene | No | Prompt file is untracked in `docs/audits` | Not needed in app release commit | Decide whether to archive prompts or leave untracked | No | Repo hygiene |
| RC-011 | P3 | Private Warden source backup | No | `/tmp/hale-warden-source` exists only under `/tmp` | Source pack can be lost when tmp clears | Product owner private backup | No code fix | Product owner action |

Counts: P0 = 0, P1 = 3, P2 = 5, P3 = 3.

## 30. Beta readiness decision

CLOSED BETA BLOCKED - P0/P1 SOFTWARE ISSUES FOUND

Rationale: validation gates pass, but the candidate has three P1 issues: synthetic DOB in a user-facing reference-details screen, unsafe current diagnostics/release-diagnostics env, and export leakage risk for free-text health notes.

Public release remains blocked. Physical-device validation remains required before any public release claim.

## 31. Recommended next actions

Targeted fixes before closed beta:

1. Fix DOB preservation in Movement Profile V2 reference details and add a regression test using a DOB whose month/day differs from the audit date.
2. Clean/lock the beta build environment so unsafe diagnostics flags cannot be enabled in beta/release builds; rerun safe-beta config/export.
3. Redact/omit free-text safety notes from export and diagnostics; add tests for `painNotes` and `injuryNotes`.

Then rerun:

```bash
npm run typecheck
npm run verify:audio
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

After P1 closure:

- Run physical-device QA on Android and iOS for auth, onboarding, V2 Check-Up, results/plan, scheduled micro-check, training floor setup, account export/local clear, camera denied, audio failure, and large text.
- Review/correct P2 copy and Android permission hygiene.
- Back up `/tmp/hale-warden-source` privately.
- Clean release branch contents: commit intended production/test/docs changes; decide whether audit prompt files should be tracked.

## 32. Validation results

Baseline full validation: PASS as recorded in section 6.

Post-report minimum validation:

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | PASS | `tsc --noEmit` completed after this report was created |
| `npm run verify:audio` | PASS | safety required assets 88, Movement Profile V2 required assets 62, voice V2.1 required assets 352, total required assets 502 |
| `git diff --check` | PASS | No whitespace errors after the report was created |

No files were changed by validation commands.

## 33. Files changed

This audit created exactly one report file:

```text
docs/audits/HALE_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md
```

No production runtime code was intentionally changed by this audit. The worktree already had production runtime code changes before this audit began.

## 34. Initial/final Git status

Initial status is recorded in section 4.

Final `git status --short --untracked-files=all` after writing the report and running post-report validation:

```text
 M App.tsx
 M docs/decisions.md
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseRendererReplay.ts
 M src/movementProfileV2/referenceDetailsDraft.ts
 M src/onboarding/state.ts
 M src/profile/__tests__/age.test.ts
 M src/profile/__tests__/serialize.test.ts
 M src/profile/age.ts
 M src/profile/index.ts
 M src/profile/serialize.ts
 M src/profile/types.ts
 M src/render/PoseAvatarRenderer.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/poseAvatarTypes.ts
 M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/PoseOverlayBenchmarkScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
 M src/screens/__tests__/ProgressAndManualRestoration.test.ts
 M src/services/backend/__tests__/profileSyncService.test.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/restoreService.ts
?? docs/audits/HALE_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md
?? docs/audits/Hale_Closed_Beta_Release_Candidate_Audit_Prompt.md
?? src/components/DateOfBirthPickerModal.tsx
?? src/render/ArtDirectedHumanRenderer.tsx
?? src/render/__tests__/artDirectedHumanGeometry.test.ts
?? src/render/artDirectedHumanGeometry.ts
```

Only the audit report was newly added by this audit. The other modified/untracked files were present before the audit began.

## 35. Confirmation

- No production fixes were performed.
- No production runtime code was intentionally changed by this audit.
- No package install was performed.
- No lockfile was changed.
- No audio regeneration was performed.
- No staging, commit, branch, push, or PR was performed.
- No Warden formula/data/fingerprint change was performed.
- Raw Warden source workbook/PDF files were not committed, moved, or copied into the repo.
- Public V1 Check-Up/results were not re-enabled.
- Training credit, schedule, and progression were not changed.
- Micro-check slot identity/containment was not changed.
- Official Movement Profile eligibility was not changed.
- HF1/HF2/HF3 logic was not changed.
- H5 release flag logic was not changed.
- No V2/Warden/HF/H5 regression was found in source review or validation, aside from the P1 build-env diagnostic exposure risk and the P1 DOB/export issues listed above.
- Physical-device validation was not performed or claimed.

CLOSED BETA RELEASE CANDIDATE AUDIT COMPLETE

P0/P1 SOFTWARE BLOCKERS FOUND

CLOSED BETA BLOCKED - P0/P1 SOFTWARE ISSUES FOUND

PUBLIC RELEASE REMAINS BLOCKED

PHYSICAL DEVICE VALIDATION NOT CLAIMED

NO PRODUCTION FIXES PERFORMED

NO AUDIO REGENERATION

NO PACKAGE / LOCKFILE CHANGE

NO STAGING / COMMIT / BRANCH / PUSH
