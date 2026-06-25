import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AUDIT_JSON = path.join(ROOT, 'docs/audits/HALE_MEASUREMENT_SIDE_PROTOCOL_POST_UX_AUDIT.json');
const SCENARIOS_CSV = path.join(ROOT, 'docs/audits/HALE_MEASUREMENT_SIDE_UX_SCENARIOS.csv');
const MICRO_SCREEN = path.join(ROOT, 'src/screens/MicroCheckScreen.tsx');
const MPV2_SCREEN = path.join(ROOT, 'src/screens/MovementProfileV2CheckUpScreen.tsx');
const SIDE_HELPER = path.join(ROOT, 'src/training/microCheckSideSetup.ts');

const audit = JSON.parse(fs.readFileSync(AUDIT_JSON, 'utf8'));
const scenarios = parseCsv(fs.readFileSync(SCENARIOS_CSV, 'utf8'));
const microScreen = fs.readFileSync(MICRO_SCREEN, 'utf8');
const mpv2Screen = fs.readFileSync(MPV2_SCREEN, 'utf8');
const sideHelper = fs.readFileSync(SIDE_HELPER, 'utf8');

assert(audit.verdict === 'SIDE_PROTOCOL_FOUNDATION_COMPLETE', 'post-UX verdict must be complete');
assert(audit.findings.counts.P0 === 0, 'P0 count must be 0');
assert(audit.findings.counts.P1 === 0, 'P1 count must be 0');
assert(audit.findings.counts.P2 === 0, 'P2 count must be 0');
assert(audit.findings.counts.P3 === 1, 'P3 count must remain the deferred device QA item');
assert(audit.microChecks.sideDependentWithoutExplicitOrPinnedSide === 0, 'micro-check pinned-side failures must be 0');
assert(audit.officialRetest.fallbackWithoutExplicitConfirmation === 0, 'official fallback confirmation failures must be 0');
assert(audit.comparability.falseSameSideComparison === 0, 'false same-side comparisons must be 0');
assert(audit.comparability.falseCrossProtocolComparison === 0, 'false cross-protocol comparisons must be 0');
assert(audit.persistence.localRoundTripFailure === 0, 'local persistence failures must be 0');
assert(audit.persistence.backendRoundTripFailure === 0, 'backend persistence failures must be 0');
assert(audit.accessibility.failures === 0, 'accessibility failures must be 0');
assert(audit.audio.changed === false, 'audio must not change');
assert(audit.audio.generated === false, 'audio must not be generated');
assert(audit.audio.externalSpeechOrAudioApiCalled === false, 'external speech/audio APIs must not be called');

const requiredScenarioIds = [
  'MC-001',
  'MC-002',
  'MC-003',
  'MC-004',
  'MC-005',
  'MC-006',
  'OF-001',
  'OF-002',
  'OF-004',
  'OF-005',
  'RT-001',
  'RT-002',
];
for (const id of requiredScenarioIds) {
  assert(scenarios.some((row) => row.scenarioId === id), `missing scenario ${id}`);
}
assert(scenarios.some((row) => row.itemId === 'mobility-reach' && row.anchorType === 'none'), 'mobility no-anchor scenario required');
assert(scenarios.some((row) => row.sideSource === 'opposite_side_fallback'), 'opposite-side fallback scenario required');
assert(scenarios.every((row) => row.anchorChanged === 'false'), 'no scenario may overwrite an anchor');

assert(sideHelper.includes('existing_microcheck_series'), 'helper must inspect existing micro-check series');
assert(sideHelper.includes('compatible_official_anchor'), 'helper must support compatible official anchor recommendation');
assert(sideHelper.includes('MOBILITY_OFFICIAL_ANCHOR_NOT_SUPPORTED'), 'mobility must not borrow official side anchors');
assert(microScreen.includes('active={!metricDebug && runner !== null}'), 'micro-check camera must wait for runner');
assert(microScreen.includes('Which side will you use?'), 'micro-check no-anchor copy missing');
assert(microScreen.includes('This check will start or continue a separate side comparison.'), 'micro-check opposite-side warning missing');
assert(mpv2Screen.includes('pendingOfficialFallback'), 'official fallback confirmation state missing');
assert(mpv2Screen.includes('This result may not be directly comparable with your earlier checks.'), 'official fallback warning missing');
assert(mpv2Screen.includes('Your usual side will remain unchanged.'), 'official fallback anchor-preservation copy missing');

console.log(JSON.stringify({
  verdict: audit.verdict,
  scenarios: scenarios.length,
  findings: audit.findings.counts,
  audioChanged: audit.audio.changed,
  physicalDeviceQa: audit.physicalDeviceQa.status,
}, null, 2));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  const records = [];
  let field = '';
  let record = [];
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...body] = records.filter((row) => row.some((cell) => cell.length > 0));
  if (!header) return rows;
  for (const row of body) {
    rows.push(Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])));
  }
  return rows;
}
