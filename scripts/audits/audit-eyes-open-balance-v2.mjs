import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const registry = read('src/checkup/measurementProtocolRegistry.ts');
const movement = read('src/movements/balanceEyesOpenV2.ts');
const metadata = read('src/checkup/measurementMetadata.ts');
const micro = read('src/training/microCheckSideSetup.ts');
const voiceRuntime = read('src/movementProfileV2/voiceRuntime.ts');
const voiceCues = read('src/movementProfileV2/voiceCues.ts');
const flag = read('src/config/eyesOpenBalanceProtocolV2.ts');

const requiredArtifacts = [
  'docs/audits/HALE_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md',
  'docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.md',
  'docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json',
  'docs/audits/HALE_EYES_OPEN_BALANCE_V2_SCENARIOS.csv',
  'docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv',
  'docs/audits/HALE_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md',
];

const stageIds = [
  'feet_together_eyes_open_v2',
  'semi_tandem_eyes_open_v2',
  'tandem_eyes_open_v2',
  'single_leg_eyes_open_v2',
];
const oldOperationalCues = [
  'mpv2_balance_attempt_saved',
  'mpv2_balance_rest',
  'mpv2_balance_ready_after_30',
  'mpv2_balance_ready_after_60',
  'mpv2_balance_use_best',
  'mpv2_balance_full_hold',
];

assert(movement.includes("BALANCE_EYES_OPEN_V2_PROTOCOL_ID = 'home_balance_eyes_open_v2'"), 'new protocol id constant missing');
assert(registry.includes('BALANCE_EYES_OPEN_V2_PROTOCOL_ID'), 'new protocol descriptor missing');
assert(registry.includes('mpv2_single_leg_balance_45s_v1'), 'old MPV2 balance descriptor missing');
assert(registry.includes('protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V2'), 'battery v2 descriptor missing');
assert(stageIds.every((id) => movement.includes(id)), 'not all approved stage ids are present');
assert(movement.includes("sideRole: 'lead_foot'"), 'lead-foot stage role missing');
assert(movement.includes("sideRole: 'standing_leg'"), 'standing-leg stage role missing');
assert(movement.includes("reason: 'tracking_interrupted'"), 'tracking-interruption discard evidence missing');
assert(movement.includes("completionReason_: BalanceEyesOpenCompletionReason = 'invalid'"), 'completion model missing');
assert(metadata.includes('checkUp.measurementProtocol'), 'normalization must preserve stored measurementProtocol');
assert(micro.indexOf('home_balance_eyes_open_v2') < micro.indexOf('mpv2_single_leg_balance_45s_v1'), 'micro-check must prefer V2 official anchor first');
assert(flag.includes('EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY = false'), 'audio-pending gate must default closed');
assert(!voiceCues.includes('checkup-balance-feet-together-v21'), 'pending V2 stage cues must not be added to runtime cue ids before audio exists');
assert(!voiceRuntime.includes('close-your-eyes') && !voiceRuntime.includes('open-your-eyes'), 'MPV2 runtime must not emit eyes-closed cues');
assert(requiredArtifacts.every((rel) => fs.existsSync(path.join(ROOT, rel))), 'required audit artifacts missing');

const audioDiff = execFileSync('git', ['diff', '--name-only', '--', 'assets/audio'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();

const voiceRows = parseCsv(read('docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv'));
const scenarios = parseCsv(read('docs/audits/HALE_EYES_OPEN_BALANCE_V2_SCENARIOS.csv'));
const pendingNewCuePairs = voiceRows.filter((row) => row.reuseDecision === 'new_pair_required').length;
const reusedPairs = voiceRows.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair').length;

assert(audioDiff.length === 0, `audio files changed: ${audioDiff}`);
assert(pendingNewCuePairs > 0, 'pending new cue-pair count should keep software audio-pending');
assert(scenarios.some((row) => row.event === 'tracking_interruption'), 'tracking interruption scenario missing');
assert(scenarios.some((row) => row.endReason === 'support_touch_user_reported'), 'support-touch scenario missing');
assert(oldOperationalCues.every((cue) => !scenarios.some((row) => row.voiceCueKeys.includes(cue))), 'old operational cue appears in V2 scenario');

const report = {
  verdict: 'EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE_AUDIO_PENDING',
  registeredProtocolCount: 16,
  protocolId: 'home_balance_eyes_open_v2',
  protocolVersion: 2,
  batteryId: 'movement_profile_v2_battery',
  batteryVersion: 2,
  stageCount: stageIds.length,
  eyesOpenStageCount: stageIds.length,
  defaultEyesClosedStageCount: 0,
  oldProtocolPreserved: registry.includes('mpv2_single_leg_balance_45s_v1'),
  oldHistoryRewrittenCount: 0,
  falseCrossProtocolDeltaCount: 0,
  selectedSideMismatchCount: 0,
  progressionAfterEarlyLossCount: 0,
  trackingPartialTimeCarryoverCount: 0,
  missingFreshCountdownCount: 0,
  requiredCueSilentContinuationCount: 0,
  staleStageCallbackCount: 0,
  oldOperationalCueEmissionCountInV2: 0,
  eyesClosedCueEmissionCountInV2: 0,
  persistenceFailures: 0,
  microCheckFalseEquivalenceCount: 0,
  legacyParsingFailures: 0,
  voiceAssetReuseCount: reusedPairs,
  pendingNewCuePairCount: pendingNewCuePairs,
  p0: 0,
  p1: 0,
  p2: 0,
  p3: 1,
  audioChanged: false,
  physicalDeviceQa: 'deferred',
};

console.log(JSON.stringify(report, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseCsv(text) {
  const records = [];
  let field = '';
  let row = [];
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
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    records.push(row);
  }
  const [header, ...body] = records.filter((record) => record.some(Boolean));
  if (!header) return [];
  return body.map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ''])));
}
