/**
 * THE brand token (REPOSITION_TDD §3, approved 2026-07-06). CommonJS on purpose:
 * consumed by app.config.js (config files are CommonJS-only) and re-exported
 * typed for app code via src/brand/index.ts.
 *
 * The rename is an edit to THIS file plus: regenerate the 2 safety-cue voice
 * lines that speak the name (×2 voices, via scripts/generate-audio.ts +
 * verify:audio — the script/audio fingerprint mismatch forces this, it cannot
 * be forgotten), swap logo/icon art, and sweep website/. Deliberately NOT
 * tokenized (separate founder decisions, see REPOSITION_TDD §3.2): slug,
 * scheme, bundle identifiers, EAS/Supabase project identity, storage
 * filenames, and the data-export machine id ('Hale' forever — old backups
 * must always restore).
 */
module.exports = {
  appName: 'Hale',
};
