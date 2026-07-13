/**
 * Generates ALL bundled audio: voice lines via the ElevenLabs text-to-speech
 * API (Multilingual v2 model) — synthesized ONCE at build time, so the session
 * path never touches a runtime TTS API (CLAUDE.md audio law) — plus session
 * sound effects as raw-PCM WAV, and the typed require() manifest the player imports.
 *
 * Re-run after adding cues to src/audio/cues.ts, changing a line below, or
 * adding/replacing a voice in src/profile/voices.ts:
 *
 *   ELEVENLABS_API_KEY=sk_... npm run audio
 *   ELEVENLABS_API_KEY=sk_... npm run audio -- --cue voice-preview
 *
 * One ElevenLabs voice id per trainer voice is declared in src/profile/voices.ts
 * (the id is used here only; nothing in the app calls ElevenLabs at runtime).
 * Each voice's lines are written to assets/audio/voice/<voiceId>/<key>.mp3 and
 * all outputs are committed. The API key is read from the environment and never
 * committed.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import {
  AUDIO_OUTPUT_FORMAT,
  AUDIO_TTS_PROVIDER,
  AUDIO_VOICE_SETTINGS,
  ELEVENLABS_MODEL,
  safetyAudioCueIds,
  safetyAudioMetadataFor,
} from '../src/audio/safetyAudio';
import {
  movementProfileV2AudioCueIds,
  movementProfileV2AudioMetadataFor,
} from '../src/audio/movementProfileV2Audio';
import { MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA } from '../src/audio/movementProfileV2AudioManifest';
import { PROGRAMME_VOICE_LINES } from '../src/programme/voiceScripts';
import { VOICE_SESSION_LINE_SCRIPTS } from '../src/audio/voiceSessionLineScripts';
import { SAFETY_AUDIO_ASSET_METADATA } from '../src/audio/safetyAudioManifest';
import {
  voiceV21AudioExpectedPath,
  voiceV21AudioFingerprint,
  type VoiceV21AudioAssetMetadata,
} from '../src/audio/voiceV21Audio';
import { VOICE_V2_1_AUDIO_ASSET_METADATA } from '../src/audio/voiceV21AudioManifest';
import {
  MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
  movementProfileV2CueText,
  type MovementProfileV2CueId,
} from '../src/movementProfileV2/voiceCues';
import { BRAND } from '../src/brand';
import { VOICE_OPTIONS } from '../src/profile/voices';
import { safetyCueText, SAFETY_VOICE_LINES, type SafetyCueId } from '../src/training/safetyCueDefinitions';

const ROOT = path.resolve(__dirname, '..');
const VOICE_DIR = path.join(ROOT, 'assets/audio/voice');
const SFX_DIR = path.join(ROOT, 'assets/audio/sfx');
const MANIFEST_PATH = path.join(ROOT, 'src/audio/manifest.ts');

/** Every VoiceCueKey from src/audio/cues.ts must have a line here. */
const LINES: Record<string, string> = {
  // Voice-guided session lines live in src/audio/voiceSessionLineScripts.ts
  // (pure module) so CI's hot-phrase guardrail lints them — the safety
  // vocabulary listens while these lines play.
  ...VOICE_SESSION_LINE_SCRIPTS,
  // Programme v2 session lines (src/programme/voiceScripts.ts) — same
  // pure-module + guardrail-lint discipline as the voice-session lines.
  ...PROGRAMME_VOICE_LINES,
  // Settings voice picker.
  'voice-preview':
    "Hi, I'm {voiceName}. I'll guide you one step at a time.",
  // Pre-flight framing prompts.
  'step-into-frame': 'Step into view, about three big steps back from the phone.',
  'center-yourself': 'Move toward the middle of the picture.',
  'step-back': 'Take a small step back.',
  'step-closer': 'Take a small step closer.',
  'hold-still': 'Great. Hold still for a moment.',
  'turn-on-light': "It's a little dark in here. Please turn on the main light.",
  'framing-ready': 'That looks good. Stay there.',
  // Chair stand.
  'chair-stand-intro':
    'Next, the thirty second chair stand. Place a sturdy chair so you sit ' +
    'side-on to the phone, then sit in the middle of the seat with your ' +
    'feet flat on the floor.',
  'chair-stand-setup':
    'Cross your arms over your chest. When I say go, stand up all the way, ' +
    'then sit back down, and repeat as many times as you can until I say time.',
  // Balance ladder.
  'balance-intro':
    'Next, a few short balance holds. Stand near a kitchen counter or sturdy ' +
    'chair, so you can rest your fingertips on it if you need to steady yourself.',
  'balance-setup':
    "I'll tell you how to place your feet for each hold. Keep each position " +
    'until I tell you the next one, or until you need to touch down.',
  'balance-feet-together': 'Place your feet together, side by side.',
  'balance-semi-tandem':
    'Slide one foot half a step forward, so its instep touches your other big toe.',
  'balance-tandem': 'Place one foot directly in front of the other, heel to toe.',
  'balance-single-leg': 'Now stand on one leg, lifting your other foot just off the floor.',
  'balance-same-leg':
    'Stand on the same leg as your first attempt, and lift the other foot high off the floor.',
  'close-your-eyes': 'Keep holding, and gently close your eyes.',
  'open-your-eyes': 'You can open your eyes now.',
  // Timed Up and Go.
  'tug-intro':
    'Next, up and go. Put a sturdy chair side-on to the phone, with a clear ' +
    'three meter walking path in front of you.',
  'tug-setup':
    'Sit in the chair. When I say go, stand up, walk to the end of the path at ' +
    'a comfortable pace, turn around, walk back, and sit down.',
  // Shoulder flexion.
  'shoulder-intro':
    'Next, a shoulder reach. Turn so your side faces the phone, and stand tall ' +
    'with your arm relaxed at your side.',
  'shoulder-setup':
    'When I say go, raise that arm straight out in front of you and up as high ' +
    'as it comfortably goes, and hold it there.',
  'relax-arm': "Relax your arm now. Shoulder reach saved. We'll move on to the final movement.",
  // Hinge reach.
  'hinge-intro':
    'Last one, a forward reach. Stay side-on to the phone, standing tall with ' +
    'your feet under your hips.',
  'hinge-setup':
    'Stand tall and let your arms hang comfortably. Move slowly, and only go ' +
    "as far as feels comfortable. When you're ready, fold forward from your " +
    'hips and reach your hands toward the floor. The measurement starts when ' +
    'I see you folded forward. Hold there until I tell you to stand tall.',
  'stand-tall': 'Stand tall now. Forward reach saved.',
  // Shared result acknowledgement.
  'item-complete': 'Nicely done.',
  // Check-Up battery orchestration.
  'checkup-intro':
    "Welcome to your Movement Check-Up. We'll guide you through a few short movements " +
    'to check strength, balance, and mobility. ' +
    "Just follow my voice — you won't need to touch the screen. Let's begin.",
  'checkup-complete':
    "That's the whole check-up — really well done. Your results are ready on the screen.",
  'turn-side-on': 'For the next movement, please turn so your side faces the phone.',
  'face-forward': 'For the next movement, please turn to face the phone.',
  'next-exercise': "Nice work. Let's set up the next movement.",
  'exercise-skipped': "No problem — we'll skip this one for now and move on.",
  // Session flow.
  'countdown-three': 'Three.',
  'countdown-two': 'Two.',
  'countdown-one': 'One.',
  go: 'Go!',
  'times-up': 'Time! Have a seat and catch your breath.',
  // Results.
  'you-completed': 'You completed',
  'stands-suffix': 'chair stands. Well done.',
  'no-reps': "We couldn't measure any stands that time. We can try again whenever you like.",
  // Training exercise instructions (one per family).
  'ex-sit-to-stand':
    'Sit-to-stands. Sit tall in the middle of the chair, feet flat. When I say ' +
    'go, stand all the way up and sit back down, with control.',
  'ex-squat':
    'Squats. Feet about hip width apart, a chair behind you for support if you ' +
    'like. Lower down as if to sit, then stand back up.',
  'ex-step-up':
    'Step-ups. Stand facing your step. Step up with one foot, bring the other ' +
    'to meet it, then step back down, leading with the same foot.',
  'ex-heel-raise':
    'Heel raises. Stand tall, fingertips on a wall or counter for balance. Rise ' +
    'up onto the balls of your feet, then lower slowly.',
  'ex-glute-bridge':
    'Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips ' +
    'toward the ceiling, squeeze, and lower.',
  'ex-push-up':
    'Push-ups. Hands shoulder width apart against the wall or floor. Lower ' +
    'yourself in with control, then press back out.',
  'ex-overhead':
    'Overhead reach. Stand tall. Reach both arms up overhead as far as is ' +
    'comfortable, then lower.',
  'ex-hip-hinge':
    'Hip hinge. Stand a step in front of the wall, feet under your hips. Push ' +
    'your hips back to tap the wall, keeping your back long, then stand tall.',
  'ex-balance':
    'A balance hold. Get into the position I describe, fingertips near a ' +
    'counter, and hold steady until you need to touch down.',
  'ex-hamstring-reach':
    'Seated hamstring reach. Sit tall on the edge of the chair, one leg straight ' +
    'out, heel on the floor. Reach gently toward your toes and hold.',
  'ex-neck-rotation':
    'Neck rotations. Face the phone, sitting or standing tall. Slowly turn your ' +
    'head to look over one shoulder, then the other.',
  'ex-march':
    'Marching. Stand tall and march on the spot, driving each knee up nice and ' +
    'high, with a steady rhythm.',
  // Training session flow.
  'training-intro':
    "Time to train. We'll move through a few exercises together. Just follow my " +
    "voice — you won't need to touch the screen. Let's begin.",
  'thats-your-set': "Good — that's your set.",
  'rest-now': 'Nice work. Take a rest.',
  'next-up': "Let's set up the next exercise.",
  'last-set': 'Rest up. This is your last set.',
  'set-done': 'Good set.',
  'cooldown-now': 'Last part — a gentle cooldown to finish.',
  'session-complete':
    "That's your session — really well done. Have some water and enjoy your day.",
  'time-to-retest':
    "You've finished your four week block. It's a great time for a new " +
    'check-up, to see how far you have come.',
  // Weekly micro-check.
  'microcheck-intro': "A quick check-in to track your progress. It'll only take a minute.",
  'microcheck-chair':
    'Five quick chair stands. Sit tall, arms crossed, and when I say go, stand ' +
    'up and sit down five times, as quickly as you safely can.',
  'microcheck-balance':
    'A one-leg balance. Fingertips near a counter, stand on one leg and hold as ' +
    'long as you can.',
  'microcheck-complete': "Got it — that's logged. Nice work.",
};

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven',
  'twenty-eight', 'twenty-nine', 'thirty', 'thirty-one', 'thirty-two',
  'thirty-three', 'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven',
  'thirty-eight', 'thirty-nine', 'forty',
];
for (let n = 0; n < NUMBER_WORDS.length; n++) {
  LINES[`num-${n}`] = `${NUMBER_WORDS[n]}.`;
}
Object.assign(LINES, SAFETY_VOICE_LINES);
Object.assign(
  LINES,
  Object.fromEntries(MOVEMENT_PROFILE_V2_CUE_DEFINITIONS.map((cue) => [cue.id, cue.text]))
);

loadRootDotEnv();
const API_KEY = process.env.ELEVENLABS_API_KEY;

type AudioGroup = 'all' | 'safety' | 'movement_profile_v2' | 'voice_v21' | 'sfx';
type VoiceSelector = 'all' | string;
type AudioAssetStatus = 'valid' | 'missing' | 'stale' | 'zero-byte' | 'forced';

interface CliOptions {
  group: AudioGroup;
  voice: VoiceSelector;
  dryRun: boolean;
  force: boolean;
  cue: string | null;
  fromBacklog: string | null;
  mode: string | null;
  targeted: boolean;
}

interface SelectedVoice {
  id: string;
  elevenLabsVoiceId: string;
}

interface BacklogRow {
  logicalCueKey: string;
  exactScript: string;
  flow: string;
  category: string;
  policyId: string;
  requiredForVoiceFirst: string;
  voiceIdsNeeded: string;
  currentPhysicalCandidate: string;
  reuseDecision: string;
  reasonForGeneration: string;
  budgetClass: string;
  sourceArtifact: string;
  notes: string;
}

interface FinalCueRegistryRow {
  logicalCueKey: string;
  exactScript: string;
  flows: string;
  categories: string;
  policyId: string;
  requiredForVoiceFirst: string;
  lifecycle: string;
  reuseDecision: string;
  physicalCueKey: string;
  physicalManifestStatus: string;
  claraExists: string;
  marcusExists: string;
  semanticMatch: string;
  generationRequiredLater: string;
  retireLater: string;
  sourceArtifacts: string;
  notes: string;
}

interface VoiceV21GenerationJob {
  jobId: string;
  rowIndex: number;
  logicalCueKey: string;
  physicalCueKey: string;
  voice: SelectedVoice;
  exactScript: string;
  flow: string;
  category: string;
  policyId: string;
  reuseDecision: string;
  reasonForGeneration: string;
  budgetClass: string;
  sourceArtifact: string;
  notes: string;
  outputPath: string;
  outputAbsPath: string;
  fingerprint: string;
  status: AudioAssetStatus | 'blocked';
  dryRunStatus: string;
  blockingReason: string;
  willCreateNew: boolean;
  willReplaceExisting: boolean;
  legacyAffected: boolean;
  currentMetadata: VoiceV21AudioAssetMetadata | undefined;
}

interface ProbedAudio {
  fileSizeBytes: number;
  sha256: string;
  durationMs: number;
  sampleRateHz: number;
  channels: number;
}

interface VoiceV21JobResult {
  job: VoiceV21GenerationJob;
  status: 'generated' | 'skipped_current' | 'failed';
  stagingPath: string;
  errorCode: string;
  errorMessage: string;
  probe: ProbedAudio | null;
}

interface SafetyAssetPlanRow {
  cueId: SafetyCueId;
  voice: SelectedVoice;
  path: string;
  fingerprint: string;
  status: AudioAssetStatus;
}

interface MovementProfileV2AssetPlanRow {
  cueId: MovementProfileV2CueId;
  voice: SelectedVoice;
  path: string;
  fingerprint: string;
  status: AudioAssetStatus;
}

function loadRootDotEnv(): void {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const withoutExport = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separator = withoutExport.indexOf('=');
    if (separator <= 0) continue;
    const key = withoutExport.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
    process.env[key] = parseDotEnvValue(withoutExport.slice(separator + 1).trim());
  }
}

function parseDotEnvValue(rawValue: string): string {
  const value = rawValue.replace(/\s+#.*$/, '');
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    group: 'all',
    voice: 'all',
    dryRun: false,
    force: false,
    cue: null,
    fromBacklog: null,
    mode: null,
    targeted: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--group') {
      const value = argv[++index];
      if (!isAudioGroup(value)) throw new Error(`unsupported --group ${value}`);
      options.group = value;
    } else if (arg.startsWith('--group=')) {
      const value = arg.slice('--group='.length);
      if (!isAudioGroup(value)) throw new Error(`unsupported --group ${value}`);
      options.group = value;
    } else if (arg === '--voice') {
      options.voice = argv[++index] ?? 'all';
    } else if (arg.startsWith('--voice=')) {
      options.voice = arg.slice('--voice='.length);
    } else if (arg === '--cue') {
      options.cue = argv[++index] ?? null;
    } else if (arg.startsWith('--cue=')) {
      options.cue = arg.slice('--cue='.length);
    } else if (arg === '--from-backlog') {
      options.fromBacklog = argv[++index] ?? null;
    } else if (arg.startsWith('--from-backlog=')) {
      options.fromBacklog = arg.slice('--from-backlog='.length);
    } else if (arg === '--voices') {
      options.voice = argv[++index] ?? 'all';
    } else if (arg.startsWith('--voices=')) {
      options.voice = arg.slice('--voices='.length);
    } else if (arg === '--mode') {
      options.mode = argv[++index] ?? null;
    } else if (arg.startsWith('--mode=')) {
      options.mode = arg.slice('--mode='.length);
    } else if (arg === '--targeted') {
      options.targeted = true;
    } else {
      throw new Error(`unknown audio generation option: ${arg}`);
    }
  }
  if (options.fromBacklog !== null) {
    if (options.group !== 'all') throw new Error('--from-backlog cannot be combined with --group');
    if (options.cue !== null) throw new Error('--from-backlog cannot be combined with --cue');
    if (options.mode !== 'v2.1') throw new Error('--from-backlog requires --mode v2.1');
    if (!options.targeted) throw new Error('--from-backlog requires --targeted');
  }
  if (options.cue !== null && options.group !== 'all' && options.group !== 'movement_profile_v2') {
    throw new Error('--cue is only supported with the default full voice-line group or --group movement_profile_v2');
  }
  if (options.cue !== null && options.group === 'movement_profile_v2') {
    if (!movementProfileV2AudioCueIds().includes(options.cue as MovementProfileV2CueId)) {
      throw new Error(`unknown Movement Profile V2 cue '${options.cue}'`);
    }
  } else if (options.cue !== null && !LINES[options.cue]) {
    throw new Error(`unknown cue '${options.cue}'`);
  }
  if (
    options.cue !== null &&
    options.group !== 'movement_profile_v2' &&
    (safetyAudioCueIds().includes(options.cue as SafetyCueId) ||
      movementProfileV2AudioCueIds().includes(options.cue as MovementProfileV2CueId))
  ) {
    throw new Error('--cue is for regular voice lines; use the dedicated safety or Movement Profile V2 group');
  }
  return options;
}

function isAudioGroup(value: string | undefined): value is AudioGroup {
  return (
    value === 'all' ||
    value === 'safety' ||
    value === 'movement_profile_v2' ||
    value === 'voice_v21' ||
    value === 'sfx'
  );
}

function selectVoices(selector: VoiceSelector): SelectedVoice[] {
  const requested = selector === 'all'
    ? null
    : selector.split(',').map((item) => item.trim()).filter(Boolean);
  const voices = requested === null
    ? VOICE_OPTIONS
    : VOICE_OPTIONS.filter((voice) => requested.includes(voice.id));
  if (voices.length === 0) {
    throw new Error(`unknown voice '${selector}'. Expected one of: ${VOICE_OPTIONS.map((voice) => voice.id).join(', ')}, all`);
  }
  if (requested !== null && voices.length !== requested.length) {
    const known = new Set(VOICE_OPTIONS.map((voice) => voice.id));
    const missing = requested.filter((voiceId) => !known.has(voiceId));
    throw new Error(`unknown voice '${missing.join(',')}'. Expected one of: ${VOICE_OPTIONS.map((voice) => voice.id).join(', ')}, all`);
  }
  return voices.map((voice) => {
    if (!voice.elevenLabsVoiceId) {
      throw new Error(`voice '${voice.id}' has no ElevenLabs voice id in src/profile/voices.ts`);
    }
    return { id: voice.id, elevenLabsVoiceId: voice.elevenLabsVoiceId };
  });
}

function lineKeysForGroup(group: AudioGroup): string[] {
  if (group === 'safety') return safetyAudioCueIds();
  if (group === 'movement_profile_v2') return movementProfileV2AudioCueIds();
  if (group === 'voice_v21') return voiceV21MetadataLineKeys();
  if (group === 'sfx') return [];
  return [...new Set([...Object.keys(LINES), ...voiceV21MetadataLineKeys()])].sort();
}

function buildSafetyPlan(voices: readonly SelectedVoice[], force: boolean): SafetyAssetPlanRow[] {
  const rows: SafetyAssetPlanRow[] = [];
  for (const voice of voices) {
    for (const cueId of safetyAudioCueIds()) {
      const expected = safetyAudioMetadataFor({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      const absPath = path.join(ROOT, expected.path);
      const existing = SAFETY_AUDIO_ASSET_METADATA[voice.id]?.[cueId];
      const exists = fs.existsSync(absPath);
      const bytes = exists ? fs.statSync(absPath).size : 0;
      const fingerprintMatches =
        existing?.fingerprint === expected.fingerprint &&
        existing.path === expected.path &&
        existing.voiceId === voice.id &&
        existing.cueId === cueId;
      const status: AudioAssetStatus = !exists
        ? 'missing'
        : bytes <= 0
          ? 'zero-byte'
          : force
            ? 'forced'
            : fingerprintMatches
              ? 'valid'
              : 'stale';
      rows.push({
        cueId,
        voice,
        path: expected.path,
        fingerprint: expected.fingerprint,
        status,
      });
    }
  }
  return rows;
}

function needsGeneration(row: { status: AudioAssetStatus }): boolean {
  return row.status !== 'valid';
}

function lineTextForVoice(key: string, voiceId: string): string {
  const line = LINES[key] ?? voiceV21MetadataLineText(key);
  if (!line) throw new Error(`missing line for cue '${key}'`);
  const voiceName = VOICE_OPTIONS.find((voice) => voice.id === voiceId)?.label ?? BRAND.appName;
  return line.replaceAll('{voiceName}', voiceName);
}

function voiceV21MetadataLineKeys(): string[] {
  const keys = new Set<string>();
  for (const byCue of Object.values(VOICE_V2_1_AUDIO_ASSET_METADATA)) {
    for (const metadata of Object.values(byCue ?? {})) {
      if (metadata?.physicalCueKey) keys.add(metadata.physicalCueKey);
    }
  }
  return [...keys];
}

function voiceV21MetadataLineText(key: string): string | null {
  for (const byCue of Object.values(VOICE_V2_1_AUDIO_ASSET_METADATA)) {
    const metadata = byCue?.[key];
    if (metadata?.script) return metadata.script;
  }
  return null;
}

function printSafetyPlan(rows: readonly SafetyAssetPlanRow[], dryRun: boolean): void {
  const missing = rows.filter((row) => row.status === 'missing').length;
  const stale = rows.filter((row) => row.status === 'stale').length;
  const zeroByte = rows.filter((row) => row.status === 'zero-byte').length;
  const forced = rows.filter((row) => row.status === 'forced').length;
  const valid = rows.filter((row) => row.status === 'valid').length;
  const providerCalls = rows.filter(needsGeneration).length;
  console.log(
    [
      dryRun ? 'Safety audio dry run' : 'Safety audio generation plan',
      `requiredAssets=${rows.length}`,
      `valid=${valid}`,
      `missing=${missing}`,
      `stale=${stale}`,
      `zeroByte=${zeroByte}`,
      `forced=${forced}`,
      `providerCalls=${providerCalls}`,
      `providerCredentials=${API_KEY ? 'present' : 'missing'}`,
    ].join(' ')
  );
  for (const row of rows.filter(needsGeneration)) {
    console.log(`${row.status}\t${row.voice.id}\t${row.cueId}\t${row.path}`);
  }
}

function buildMovementProfileV2Plan(
  voices: readonly SelectedVoice[],
  force: boolean,
  cueFilter: MovementProfileV2CueId | null = null
): MovementProfileV2AssetPlanRow[] {
  const rows: MovementProfileV2AssetPlanRow[] = [];
  for (const voice of voices) {
    for (const cueId of movementProfileV2AudioCueIds()) {
      if (cueFilter !== null && cueId !== cueFilter) continue;
      const expected = movementProfileV2AudioMetadataFor({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      const absPath = path.join(ROOT, expected.path);
      const existing = MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA[voice.id]?.[cueId];
      const exists = fs.existsSync(absPath);
      const bytes = exists ? fs.statSync(absPath).size : 0;
      const fingerprintMatches =
        existing?.fingerprint === expected.fingerprint &&
        existing.path === expected.path &&
        existing.voiceId === voice.id &&
        existing.cueId === cueId;
      const status: AudioAssetStatus = !exists
        ? 'missing'
        : bytes <= 0
          ? 'zero-byte'
          : force
            ? 'forced'
            : fingerprintMatches
              ? 'valid'
              : 'stale';
      rows.push({
        cueId,
        voice,
        path: expected.path,
        fingerprint: expected.fingerprint,
        status,
      });
    }
  }
  return rows;
}

function printMovementProfileV2Plan(rows: readonly MovementProfileV2AssetPlanRow[], dryRun: boolean): void {
  const missing = rows.filter((row) => row.status === 'missing').length;
  const stale = rows.filter((row) => row.status === 'stale').length;
  const zeroByte = rows.filter((row) => row.status === 'zero-byte').length;
  const forced = rows.filter((row) => row.status === 'forced').length;
  const valid = rows.filter((row) => row.status === 'valid').length;
  const providerCalls = rows.filter(needsGeneration).length;
  console.log(
    [
      dryRun ? 'Movement Profile V2 audio dry run' : 'Movement Profile V2 audio generation plan',
      `requiredAssets=${rows.length}`,
      `valid=${valid}`,
      `missing=${missing}`,
      `stale=${stale}`,
      `zeroByte=${zeroByte}`,
      `forced=${forced}`,
      `providerCalls=${providerCalls}`,
      `providerCredentials=${API_KEY ? 'present' : 'missing'}`,
    ].join(' ')
  );
  for (const row of rows.filter(needsGeneration)) {
    console.log(`${row.status}\t${row.voice.id}\t${row.cueId}\t${row.path}`);
  }
}

/** One ElevenLabs TTS request → mp3 bytes for a single line. */
async function synthesizeLine(voiceId: string, text: string): Promise<Buffer> {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${AUDIO_OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY as string,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: AUDIO_VOICE_SETTINGS,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status} for configured voice ${voiceId}: ${sanitizeProviderDetail(detail)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Generate every line for one trainer voice into assets/audio/voice/<id>/. */
async function generateVoice(
  voiceId: string,
  elevenLabsVoiceId: string,
  keys: readonly string[],
  options: { resetDirectory: boolean } = { resetDirectory: true }
): Promise<string[]> {
  const outDir = path.join(VOICE_DIR, voiceId);
  if (options.resetDirectory) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  process.stdout.write(`${voiceId}: `);
  for (const key of keys) {
    const mp3 = await synthesizeLine(elevenLabsVoiceId, lineTextForVoice(key, voiceId));
    fs.writeFileSync(path.join(outDir, `${key}.mp3`), mp3);
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return keys.slice();
}

async function generateSafetyAssets(rows: readonly SafetyAssetPlanRow[]): Promise<Set<string>> {
  const generated = new Set<string>();
  for (const row of rows.filter(needsGeneration)) {
    const outPath = path.join(ROOT, row.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const tempPath = `${outPath}.tmp-${process.pid}`;
    try {
      const mp3 = await synthesizeLine(row.voice.elevenLabsVoiceId, safetyCueText(row.cueId));
      if (!looksLikeMp3(mp3)) {
        throw new Error(`provider response for ${row.voice.id}/${row.cueId} was not recognized as mp3`);
      }
      fs.writeFileSync(tempPath, mp3);
      fs.renameSync(tempPath, outPath);
      generated.add(`${row.voice.id}:${row.cueId}`);
      console.log(`generated\t${row.voice.id}\t${row.cueId}\t${mp3.length} bytes\t${row.path}`);
    } catch (error) {
      fs.rmSync(tempPath, { force: true });
      throw error;
    }
  }
  return generated;
}

async function generateMovementProfileV2Assets(
  rows: readonly MovementProfileV2AssetPlanRow[]
): Promise<Set<string>> {
  const generated = new Set<string>();
  for (const row of rows.filter(needsGeneration)) {
    const outPath = path.join(ROOT, row.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const tempPath = `${outPath}.tmp-${process.pid}`;
    try {
      const mp3 = await synthesizeLine(row.voice.elevenLabsVoiceId, movementProfileV2CueText(row.cueId));
      if (!looksLikeMp3(mp3)) {
        throw new Error(`provider response for ${row.voice.id}/${row.cueId} was not recognized as mp3`);
      }
      fs.writeFileSync(tempPath, mp3);
      fs.renameSync(tempPath, outPath);
      generated.add(`${row.voice.id}:${row.cueId}`);
      console.log(`generated\t${row.voice.id}\t${row.cueId}\t${mp3.length} bytes\t${row.path}`);
    } catch (error) {
      fs.rmSync(tempPath, { force: true });
      throw error;
    }
  }
  return generated;
}

function loadVoiceV21Backlog(backlogPath: string): BacklogRow[] {
  const absPath = path.resolve(ROOT, backlogPath);
  if (!absPath.startsWith(ROOT) || !fs.existsSync(absPath)) {
    throw new Error(`generation backlog is missing: ${backlogPath}`);
  }
  const rows = parseCsv(fs.readFileSync(absPath, 'utf8')) as unknown as BacklogRow[];
  validateVoiceV21Backlog(rows);
  return rows;
}

function loadVoiceV21RefreshRows(): BacklogRow[] {
  const registryRows = parseCsv(
    fs.readFileSync(path.join(ROOT, 'docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_REGISTRY.csv'), 'utf8')
  ) as unknown as FinalCueRegistryRow[];
  const registryByKey = new Map(registryRows.map((row) => [row.logicalCueKey, row]));
  const metadataKeys = voiceV21MetadataLineKeys().sort();
  if (metadataKeys.length === 0) throw new Error('Voice V2.1 metadata is empty; nothing to refresh');
  return metadataKeys.map((logicalCueKey) => {
    const registry = registryByKey.get(logicalCueKey);
    if (!registry) throw new Error(`Voice V2.1 cue missing from final cue registry: ${logicalCueKey}`);
    if (registry.lifecycle.includes('legacy') || registry.lifecycle === 'retired' || registry.lifecycle === 'not_required') {
      throw new Error(`Voice V2.1 refresh includes non-active cue ${registry.lifecycle}: ${logicalCueKey}`);
    }
    if (registry.physicalCueKey !== logicalCueKey) {
      throw new Error(`Voice V2.1 refresh requires one-to-one physical cue keys: ${logicalCueKey}`);
    }
    const existingScript = VOICE_V2_1_AUDIO_ASSET_METADATA.clara?.[logicalCueKey]?.script ?? '';
    return {
      logicalCueKey,
      exactScript: registry.exactScript,
      flow: registry.flows,
      category: registry.categories,
      policyId: registry.policyId,
      requiredForVoiceFirst: registry.requiredForVoiceFirst,
      voiceIdsNeeded: 'clara;marcus',
      currentPhysicalCandidate: registry.physicalCueKey,
      reuseDecision: registry.reuseDecision,
      reasonForGeneration:
        existingScript && existingScript !== registry.exactScript
          ? 'current_candidate_script_mismatch'
          : 'stale_fingerprint_refresh',
      budgetClass: registry.categories,
      sourceArtifact: registry.sourceArtifacts,
      notes: `Voice V2.1 refresh from final cue registry. ${registry.notes}`,
    };
  });
}

function validateVoiceV21Backlog(rows: readonly BacklogRow[]): void {
  if (rows.length === 0) throw new Error('generation backlog is empty or malformed');
  const byLogical = new Map<string, BacklogRow>();
  const registryByKey = new Map(
    parseCsv(fs.readFileSync(path.join(ROOT, 'docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_REGISTRY.csv'), 'utf8'))
      .map((row) => [row.logicalCueKey, row])
  );
  const allowedReuseDecisions = new Set(['new_pair_required', 'existing_pair_script_mismatch']);
  for (const row of rows) {
    if (!row.logicalCueKey) throw new Error('backlog row missing logicalCueKey');
    if (!row.exactScript) throw new Error(`backlog row missing exactScript: ${row.logicalCueKey}`);
    if (!row.flow || !row.category || !row.policyId) {
      throw new Error(`backlog row missing flow/category/policy: ${row.logicalCueKey}`);
    }
    if (!allowedReuseDecisions.has(row.reuseDecision)) {
      throw new Error(`backlog row has non-generating reuseDecision ${row.reuseDecision}: ${row.logicalCueKey}`);
    }
    if (!isSafeCueKey(row.logicalCueKey)) {
      throw new Error(`backlog row has unsafe logical cue key: ${row.logicalCueKey}`);
    }
    const voices = parseVoiceIdsNeeded(row.voiceIdsNeeded);
    if (voices.length !== 2 || !voices.includes('clara') || !voices.includes('marcus')) {
      throw new Error(`backlog row does not request exact Clara/Marcus pair: ${row.logicalCueKey}`);
    }
    const existing = byLogical.get(row.logicalCueKey);
    if (existing && existing.exactScript !== row.exactScript) {
      throw new Error(`duplicate logical cue with conflicting script: ${row.logicalCueKey}`);
    }
    byLogical.set(row.logicalCueKey, row);
    const registry = registryByKey.get(row.logicalCueKey);
    if (!registry) throw new Error(`backlog row missing from final cue registry: ${row.logicalCueKey}`);
    if (registry.exactScript !== row.exactScript) {
      throw new Error(`backlog script conflicts with final cue registry: ${row.logicalCueKey}`);
    }
    if (registry.reuseDecision === 'reuse_exact_existing_pair') {
      throw new Error(`backlog includes exact-ready pair: ${row.logicalCueKey}`);
    }
    const lifecycle = registry.lifecycle ?? '';
    if (lifecycle.includes('legacy') || lifecycle === 'retired' || lifecycle === 'not_required') {
      throw new Error(`backlog includes non-active cue ${lifecycle}: ${row.logicalCueKey}`);
    }
  }
}

function buildVoiceV21GenerationJobs(
  rows: readonly BacklogRow[],
  voices: readonly SelectedVoice[],
  force: boolean,
  options: { allowExistingRefresh?: boolean } = {}
): VoiceV21GenerationJob[] {
  const selectedById = new Map(voices.map((voice) => [voice.id, voice]));
  const jobs: VoiceV21GenerationJob[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const needed = parseVoiceIdsNeeded(row.voiceIdsNeeded);
    for (const voiceId of needed) {
      const voice = selectedById.get(voiceId);
      if (!voice) continue;
      const physicalCueKey = row.logicalCueKey;
      const outputPath = voiceV21AudioExpectedPath(voice.id, physicalCueKey);
      const outputAbsPath = path.join(ROOT, outputPath);
      const fingerprint = voiceV21AudioFingerprint({
        logicalCueKey: row.logicalCueKey,
        physicalCueKey,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
        script: row.exactScript,
      });
      const currentMetadata = VOICE_V2_1_AUDIO_ASSET_METADATA[voice.id]?.[physicalCueKey];
      const exists = fs.existsSync(outputAbsPath);
      const bytes = exists ? fs.statSync(outputAbsPath).size : 0;
      const metadataCurrent =
        currentMetadata?.logicalCueKey === row.logicalCueKey &&
        currentMetadata.physicalCueKey === physicalCueKey &&
        currentMetadata.voiceId === voice.id &&
        currentMetadata.providerVoiceId === voice.elevenLabsVoiceId &&
        currentMetadata.model === ELEVENLABS_MODEL &&
        currentMetadata.outputFormat === AUDIO_OUTPUT_FORMAT &&
        currentMetadata.path === outputPath &&
        currentMetadata.script === row.exactScript &&
        currentMetadata.fingerprint === fingerprint;
      const status: VoiceV21GenerationJob['status'] = !exists
        ? 'missing'
        : bytes <= 0
          ? 'zero-byte'
          : force
            ? 'forced'
            : metadataCurrent
              ? 'valid'
              : options.allowExistingRefresh
                ? 'stale'
                : 'blocked';
      const blockingReason = status === 'blocked'
        ? 'existing_v21_output_path_without_matching_metadata'
        : '';
      jobs.push({
        jobId: `voice-v21-${String(jobs.length + 1).padStart(3, '0')}`,
        rowIndex,
        logicalCueKey: row.logicalCueKey,
        physicalCueKey,
        voice,
        exactScript: row.exactScript,
        flow: row.flow,
        category: row.category,
        policyId: row.policyId,
        reuseDecision: row.reuseDecision,
        reasonForGeneration: row.reasonForGeneration,
        budgetClass: row.budgetClass,
        sourceArtifact: row.sourceArtifact,
        notes: row.notes,
        outputPath,
        outputAbsPath,
        fingerprint,
        status,
        dryRunStatus: status === 'valid' ? 'already_current_skip' : status === 'blocked' ? 'blocked' : 'ready_to_generate',
        blockingReason,
        willCreateNew: !exists,
        willReplaceExisting: exists && status !== 'valid' && status !== 'blocked',
        legacyAffected: Boolean(row.currentPhysicalCandidate && row.currentPhysicalCandidate !== physicalCueKey),
        currentMetadata,
      });
    }
  }
  return jobs;
}

function validateVoiceV21GenerationJobs(jobs: readonly VoiceV21GenerationJob[], expectedRows: number): void {
  if (jobs.length !== expectedRows * 2) {
    throw new Error(`planned job count mismatch: expected ${expectedRows * 2}, got ${jobs.length}`);
  }
  for (const job of jobs) {
    if (job.status === 'blocked') {
      throw new Error(`blocked generation job ${job.jobId} ${job.voice.id}/${job.logicalCueKey}: ${job.blockingReason}`);
    }
    if (!job.outputPath.startsWith(`assets/audio/voice/${job.voice.id}/`)) {
      throw new Error(`planned output path outside voice directory: ${job.outputPath}`);
    }
    if (job.outputPath.includes('..') || path.isAbsolute(job.outputPath)) {
      throw new Error(`unsafe planned output path: ${job.outputPath}`);
    }
    if (!job.voice.elevenLabsVoiceId || !ELEVENLABS_MODEL || !AUDIO_OUTPUT_FORMAT) {
      throw new Error(`missing provider/model config for ${job.jobId}`);
    }
  }
}

function printVoiceV21Plan(jobs: readonly VoiceV21GenerationJob[], dryRun: boolean): void {
  const valid = jobs.filter((job) => job.status === 'valid').length;
  const missing = jobs.filter((job) => job.status === 'missing').length;
  const stale = jobs.filter((job) => job.status === 'stale').length;
  const zeroByte = jobs.filter((job) => job.status === 'zero-byte').length;
  const forced = jobs.filter((job) => job.status === 'forced').length;
  const blocked = jobs.filter((job) => job.status === 'blocked').length;
  const generate = jobs.filter((job) => job.status !== 'valid' && job.status !== 'blocked').length;
  console.log(
    [
      dryRun ? 'Voice V2.1 backlog dry run' : 'Voice V2.1 backlog generation plan',
      `logicalRows=${new Set(jobs.map((job) => job.logicalCueKey)).size}`,
      `jobs=${jobs.length}`,
      `requiredAssets=${jobs.length}`,
      `valid=${valid}`,
      `missing=${missing}`,
      `stale=${stale}`,
      `zeroByte=${zeroByte}`,
      `forced=${forced}`,
      `blocked=${blocked}`,
      `providerCalls=${generate}`,
      `provider=${AUDIO_TTS_PROVIDER}`,
      `model=${ELEVENLABS_MODEL}`,
      `outputFormat=${AUDIO_OUTPUT_FORMAT}`,
      `voiceSettings=stability:${AUDIO_VOICE_SETTINGS.stability},similarity_boost:${AUDIO_VOICE_SETTINGS.similarity_boost},use_speaker_boost:${AUDIO_VOICE_SETTINGS.use_speaker_boost},speed:${AUDIO_VOICE_SETTINGS.speed}`,
      `voices=${[...new Set(jobs.map((job) => job.voice.id))].join(',')}`,
      `providerCredentials=${API_KEY ? 'present' : 'missing'}`,
    ].join(' ')
  );
}

function writeVoiceV21GenerationPlan(jobs: readonly VoiceV21GenerationJob[]): void {
  writeCsvFile('docs/audits/PEARL_VOICE_V2_1_GENERATION_PLAN.csv', [
    'jobId',
    'logicalCueKey',
    'physicalCueKey',
    'voiceId',
    'exactScript',
    'flow',
    'category',
    'policyId',
    'reuseDecision',
    'reasonForGeneration',
    'provider',
    'model',
    'providerVoiceId',
    'outputPath',
    'willCreateNew',
    'willReplaceExisting',
    'legacyAffected',
    'manifestTarget',
    'metadataTarget',
    'dryRunStatus',
    'blockingReason',
    'notes',
  ], jobs.map((job) => ({
    jobId: job.jobId,
    logicalCueKey: job.logicalCueKey,
    physicalCueKey: job.physicalCueKey,
    voiceId: job.voice.id,
    exactScript: job.exactScript,
    flow: job.flow,
    category: job.category,
    policyId: job.policyId,
    reuseDecision: job.reuseDecision,
    reasonForGeneration: job.reasonForGeneration,
    provider: AUDIO_TTS_PROVIDER,
    model: ELEVENLABS_MODEL,
    providerVoiceId: job.voice.elevenLabsVoiceId,
    outputPath: job.outputPath,
    willCreateNew: String(job.willCreateNew),
    willReplaceExisting: String(job.willReplaceExisting),
    legacyAffected: String(job.legacyAffected),
    manifestTarget: 'src/audio/manifest.ts',
    metadataTarget: 'src/audio/voiceV21AudioManifest.ts',
    dryRunStatus: job.dryRunStatus,
    blockingReason: job.blockingReason,
    notes: job.notes,
  })));
}

async function generateVoiceV21BacklogAssets(jobs: readonly VoiceV21GenerationJob[]): Promise<{
  results: VoiceV21JobResult[];
  stagingDir: string;
  generatedAt: string;
}> {
  const generatedAt = new Date().toISOString();
  const stagingDir = path.join('/tmp', 'pearl_voice_v21_generation_staging', generatedAt.replace(/[:.]/g, '-'));
  fs.mkdirSync(stagingDir, { recursive: true });
  const results: VoiceV21JobResult[] = [];
  for (const job of jobs) {
    if (job.status === 'valid' && job.currentMetadata) {
      results.push({
        job,
        status: 'skipped_current',
        stagingPath: '',
        errorCode: '',
        errorMessage: '',
        probe: {
          fileSizeBytes: job.currentMetadata.fileSizeBytes,
          sha256: job.currentMetadata.sha256,
          durationMs: job.currentMetadata.durationMs,
          sampleRateHz: job.currentMetadata.sampleRateHz,
          channels: job.currentMetadata.channels,
        },
      });
      continue;
    }
    const stagingPath = path.join(stagingDir, job.voice.id, `${job.physicalCueKey}.mp3`);
    fs.mkdirSync(path.dirname(stagingPath), { recursive: true });
    try {
      const mp3 = await synthesizeLine(job.voice.elevenLabsVoiceId, job.exactScript);
      if (!looksLikeMp3(mp3)) {
        throw new Error(`provider response for ${job.voice.id}/${job.logicalCueKey} was not recognized as mp3`);
      }
      fs.writeFileSync(stagingPath, mp3);
      const probe = probeGeneratedAudio(stagingPath);
      results.push({
        job,
        status: 'generated',
        stagingPath,
        errorCode: '',
        errorMessage: '',
        probe,
      });
      console.log(`staged\t${job.voice.id}\t${job.logicalCueKey}\t${probe.fileSizeBytes} bytes\t${stagingPath}`);
    } catch (error) {
      results.push({
        job,
        status: 'failed',
        stagingPath,
        errorCode: 'generation_failed',
        errorMessage: error instanceof Error ? sanitizeProviderDetail(error.message) : String(error),
        probe: null,
      });
      break;
    }
  }
  const failed = results.filter((result) => result.status === 'failed');
  if (failed.length > 0 || results.length !== jobs.length) {
    writeVoiceV21ResultLedger(results, generatedAt);
    throw new Error(
      `Voice V2.1 generation stopped before promotion; staging remains at ${stagingDir}; failures=${failed.length}`
    );
  }
  promoteVoiceV21GeneratedPairs(results);
  writeVoiceV21Metadata(results, generatedAt);
  writeManifestFromDisk(new Set(jobs.map((job) => job.physicalCueKey)));
  writeVoiceV21ResultLedger(results, generatedAt);
  writeVoiceV21GeneratedInventory(results);
  writeVoiceV21ManifestChanges(results);
  return { results, stagingDir, generatedAt };
}

function promoteVoiceV21GeneratedPairs(results: readonly VoiceV21JobResult[]): void {
  const byCue = new Map<string, VoiceV21JobResult[]>();
  for (const result of results) {
    const group = byCue.get(result.job.physicalCueKey) ?? [];
    group.push(result);
    byCue.set(result.job.physicalCueKey, group);
  }
  for (const [cueKey, group] of byCue) {
    const completedVoices = new Set(group.filter((item) => item.status !== 'failed').map((item) => item.job.voice.id));
    if (!completedVoices.has('clara') || !completedVoices.has('marcus')) {
      throw new Error(`cannot promote incomplete generated pair for ${cueKey}`);
    }
  }
  for (const result of results) {
    if (result.status === 'skipped_current') continue;
    fs.mkdirSync(path.dirname(result.job.outputAbsPath), { recursive: true });
    const tempPath = `${result.job.outputAbsPath}.tmp-${process.pid}`;
    fs.copyFileSync(result.stagingPath, tempPath);
    fs.renameSync(tempPath, result.job.outputAbsPath);
  }
}

function writeVoiceV21Metadata(results: readonly VoiceV21JobResult[], generatedAt: string): void {
  const out: Record<string, Partial<Record<string, VoiceV21AudioAssetMetadata>>> = {};
  for (const [voiceId, byCue] of Object.entries(VOICE_V2_1_AUDIO_ASSET_METADATA)) {
    out[voiceId] = { ...(byCue ?? {}) };
  }
  for (const result of results) {
    if (!result.probe) continue;
    const { job, probe } = result;
    const existingGeneratedAt = result.status === 'skipped_current'
      ? job.currentMetadata?.generatedAt ?? generatedAt
      : generatedAt;
    out[job.voice.id] = out[job.voice.id] ?? {};
    out[job.voice.id][job.physicalCueKey] = {
      schemaVersion: 1,
      logicalCueKey: job.logicalCueKey,
      physicalCueKey: job.physicalCueKey,
      voiceId: job.voice.id,
      provider: AUDIO_TTS_PROVIDER,
      providerVoiceId: job.voice.elevenLabsVoiceId,
      model: ELEVENLABS_MODEL,
      outputFormat: AUDIO_OUTPUT_FORMAT,
      voiceSettings: AUDIO_VOICE_SETTINGS,
      path: job.outputPath,
      script: job.exactScript,
      fingerprint: job.fingerprint,
      sha256: probe.sha256,
      fileSizeBytes: probe.fileSizeBytes,
      durationMs: probe.durationMs,
      sampleRateHz: probe.sampleRateHz,
      channels: probe.channels,
      generatedAt: existingGeneratedAt,
    };
  }
  const content = [
    '/**',
    ' * AUTO-GENERATED by scripts/generate-audio.ts -- do not edit by hand.',
    ' * Pure metadata for consolidated Voice V2.1 generated cue audio. Static',
    ' * require() asset mapping lives in src/audio/manifest.ts.',
    ' */',
    '',
    "import type { VoiceV21AudioMetadataByVoice } from './voiceV21Audio';",
    '',
    `export const VOICE_V2_1_AUDIO_ASSET_METADATA: VoiceV21AudioMetadataByVoice = ${JSON.stringify(out, null, 2)};`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'src/audio/voiceV21AudioManifest.ts'), content);
}

function writeVoiceV21ResultLedger(results: readonly VoiceV21JobResult[], generatedAt: string): void {
  writeCsvFile('docs/audits/PEARL_VOICE_V2_1_GENERATION_RESULT_LEDGER.csv', [
    'jobId',
    'logicalCueKey',
    'physicalCueKey',
    'voiceId',
    'exactScript',
    'outputPath',
    'status',
    'provider',
    'model',
    'providerVoiceId',
    'fileSizeBytes',
    'sha256',
    'durationMs',
    'sampleRateHz',
    'channels',
    'metadataWritten',
    'manifestRegistered',
    'verifyAudioCovered',
    'errorCode',
    'errorMessage',
    'notes',
  ], results.map((result) => ({
    jobId: result.job.jobId,
    logicalCueKey: result.job.logicalCueKey,
    physicalCueKey: result.job.physicalCueKey,
    voiceId: result.job.voice.id,
    exactScript: result.job.exactScript,
    outputPath: result.job.outputPath,
    status: result.status,
    provider: AUDIO_TTS_PROVIDER,
    model: ELEVENLABS_MODEL,
    providerVoiceId: result.job.voice.elevenLabsVoiceId,
    fileSizeBytes: String(result.probe?.fileSizeBytes ?? ''),
    sha256: result.probe?.sha256 ?? '',
    durationMs: String(result.probe?.durationMs ?? ''),
    sampleRateHz: String(result.probe?.sampleRateHz ?? ''),
    channels: String(result.probe?.channels ?? ''),
    metadataWritten: String(result.status !== 'failed'),
    manifestRegistered: String(result.status !== 'failed'),
    verifyAudioCovered: String(result.status !== 'failed'),
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    notes: `generatedAt=${generatedAt}; ${result.job.notes}`,
  })));
}

function writeVoiceV21GeneratedInventory(results: readonly VoiceV21JobResult[]): void {
  writeCsvFile('docs/audits/PEARL_VOICE_V2_1_GENERATED_ASSET_INVENTORY.csv', [
    'physicalCueKey',
    'logicalCueKey',
    'voiceId',
    'path',
    'exists',
    'sha256',
    'durationMs',
    'fileSizeBytes',
    'sampleRateHz',
    'channels',
    'script',
    'sourceBacklogRow',
    'reuseDecision',
    'generationStatus',
    'manifestRegistered',
    'fingerprintStatus',
    'notes',
  ], results.map((result) => ({
    physicalCueKey: result.job.physicalCueKey,
    logicalCueKey: result.job.logicalCueKey,
    voiceId: result.job.voice.id,
    path: result.job.outputPath,
    exists: String(fs.existsSync(result.job.outputAbsPath)),
    sha256: result.probe?.sha256 ?? '',
    durationMs: String(result.probe?.durationMs ?? ''),
    fileSizeBytes: String(result.probe?.fileSizeBytes ?? ''),
    sampleRateHz: String(result.probe?.sampleRateHz ?? ''),
    channels: String(result.probe?.channels ?? ''),
    script: result.job.exactScript,
    sourceBacklogRow: String(result.job.rowIndex + 1),
    reuseDecision: result.job.reuseDecision,
    generationStatus: result.status,
    manifestRegistered: String(result.status !== 'failed'),
    fingerprintStatus: result.status === 'failed' ? 'missing' : 'current',
    notes: result.job.notes,
  })));
}

function writeVoiceV21ManifestChanges(results: readonly VoiceV21JobResult[]): void {
  const seen = new Set<string>();
  const rows = [];
  let index = 1;
  for (const result of results) {
    if (seen.has(result.job.physicalCueKey)) continue;
    seen.add(result.job.physicalCueKey);
    const refresh = !result.job.willCreateNew;
    rows.push({
      changeId: `manifest-change-${String(index++).padStart(3, '0')}`,
      changeType: refresh ? 'refresh_generated_voice_v21_pair' : 'add_generated_voice_v21_pair',
      filePath: 'src/audio/manifest.ts',
      logicalCueKey: result.job.logicalCueKey,
      physicalCueKey: result.job.physicalCueKey,
      voiceId: 'clara;marcus',
      beforeStatus: refresh ? 'static_require_registered' : 'not_manifested',
      afterStatus: 'static_require_registered',
      staticRequirePath: `assets/audio/voice/{clara,marcus}/${result.job.physicalCueKey}.mp3`,
      verifyAudioImpact: 'covered_by_verify_audio_voice_v21_backlog',
      featureGateImpact: 'none_feature_defaults_remain_closed',
      reason: result.job.reasonForGeneration,
      notes: result.job.notes,
    });
  }
  writeCsvFile('docs/audits/PEARL_VOICE_V2_1_POST_GENERATION_MANIFEST_CHANGES.csv', [
    'changeId',
    'changeType',
    'filePath',
    'logicalCueKey',
    'physicalCueKey',
    'voiceId',
    'beforeStatus',
    'afterStatus',
    'staticRequirePath',
    'verifyAudioImpact',
    'featureGateImpact',
    'reason',
    'notes',
  ], rows);
}

function probeGeneratedAudio(absPath: string): ProbedAudio {
  const bytes = fs.readFileSync(absPath);
  if (!looksLikeMp3(bytes)) throw new Error(`staged file is not recognized as mp3: ${absPath}`);
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'a:0',
      '-show_entries',
      'stream=sample_rate,channels',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      absPath,
    ],
    { encoding: 'utf8' }
  );
  if (result.error) throw new Error(`ffprobe unavailable: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`ffprobe failed: ${result.stderr.trim()}`);
  const parsed = JSON.parse(result.stdout) as {
    format?: { duration?: string };
    streams?: Array<{ sample_rate?: string; channels?: number }>;
  };
  const durationSec = Number(parsed.format?.duration);
  const stream = parsed.streams?.[0];
  const sampleRateHz = Number(stream?.sample_rate);
  const channels = Number(stream?.channels);
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error(`invalid generated duration: ${absPath}`);
  }
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0 || !Number.isFinite(channels) || channels <= 0) {
    throw new Error(`invalid generated audio stream metadata: ${absPath}`);
  }
  return {
    fileSizeBytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    durationMs: Math.round(durationSec * 1000),
    sampleRateHz,
    channels,
  };
}

function parseVoiceIdsNeeded(value: string): string[] {
  return value.split(';').map((item) => item.trim()).filter(Boolean);
}

function isSafeCueKey(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]*$/.test(value) && !value.includes('..') && !value.includes('/');
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

function writeCsvFile(
  relPath: string,
  headers: readonly string[],
  rows: readonly Record<string, string>[]
): void {
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? '')).join(',')),
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, relPath), `${content}\n`);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

const SFX_DEFINITIONS = [
  {
    key: 'rep-credit',
    file: 'rep-credit.wav',
    durationSec: 0.16,
    tones: [{ start: 0, duration: 0.16, freq: 880, amp: 0.42, decay: 0.045, attack: 0.008, harmonic: 0.35 }],
  },
  {
    key: 'measurement-complete',
    file: 'measurement-complete.wav',
    durationSec: 0.44,
    tones: [
      { start: 0.0, duration: 0.28, freq: 523.25, amp: 0.22, decay: 0.12, attack: 0.014, harmonic: 0.28 },
      { start: 0.13, duration: 0.3, freq: 659.25, amp: 0.24, decay: 0.15, attack: 0.014, harmonic: 0.24 },
    ],
  },
  {
    key: 'tracking-paused',
    file: 'tracking-paused.wav',
    durationSec: 0.34,
    tones: [
      { start: 0.0, duration: 0.22, freq: 329.63, amp: 0.16, decay: 0.09, attack: 0.018, harmonic: 0.08 },
      { start: 0.1, duration: 0.22, freq: 246.94, amp: 0.14, decay: 0.11, attack: 0.018, harmonic: 0.06 },
    ],
  },
  {
    key: 'tracking-recovered',
    file: 'tracking-recovered.wav',
    durationSec: 0.32,
    tones: [
      { start: 0.0, duration: 0.2, freq: 392.0, amp: 0.16, decay: 0.08, attack: 0.014, harmonic: 0.12 },
      { start: 0.08, duration: 0.24, freq: 587.33, amp: 0.2, decay: 0.12, attack: 0.014, harmonic: 0.18 },
    ],
  },
  {
    key: 'session-complete',
    file: 'session-complete.wav',
    durationSec: 0.78,
    tones: [
      { start: 0.0, duration: 0.42, freq: 392.0, amp: 0.18, decay: 0.2, attack: 0.02, harmonic: 0.22 },
      { start: 0.16, duration: 0.42, freq: 523.25, amp: 0.18, decay: 0.22, attack: 0.02, harmonic: 0.2 },
      { start: 0.32, duration: 0.46, freq: 659.25, amp: 0.16, decay: 0.26, attack: 0.024, harmonic: 0.18 },
    ],
  },
] as const;

interface SfxTone {
  start: number;
  duration: number;
  freq: number;
  amp: number;
  decay: number;
  attack: number;
  harmonic: number;
}

/** Voice-independent premium session sounds: short, soft raw-PCM WAVs. */
function writeSfxWavs(): void {
  for (const definition of SFX_DEFINITIONS) {
    writeSfxWav(definition.file, definition.durationSec, definition.tones);
  }
}

function writeSfxWav(file: string, durationSec: number, tones: readonly SfxTone[]): void {
  const sampleRate = 24000;
  const samples = Math.round(sampleRate * durationSec);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let wave = 0;
    for (const tone of tones) {
      wave += sfxToneAt(t, tone);
    }
    const value = Math.round(Math.max(-0.92, Math.min(0.92, wave)) * 32767);
    data.writeInt16LE(value, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits/sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(SFX_DIR, file), Buffer.concat([header, data]));
}

function sfxToneAt(t: number, tone: SfxTone): number {
  const local = t - tone.start;
  if (local < 0 || local > tone.duration) return 0;
  const attack = Math.min(1, local / tone.attack);
  const releaseStart = tone.duration * 0.72;
  const release =
    local <= releaseStart ? 1 : Math.max(0, 1 - (local - releaseStart) / (tone.duration - releaseStart));
  const decay = Math.exp(-local / tone.decay);
  const fundamental = Math.sin(2 * Math.PI * tone.freq * local);
  const overtone = Math.sin(2 * Math.PI * tone.freq * 2 * local) * tone.harmonic;
  const air = Math.sin(2 * Math.PI * tone.freq * 3 * local) * tone.harmonic * 0.08;
  return (fundamental + overtone + air) * tone.amp * attack * release * decay;
}

/** Write the typed manifest: per-voice voice lines + voice-independent sfx. */
function writeManifestFromDisk(additionalKnownVoiceKeys: ReadonlySet<string> = new Set()): void {
  const voiceKeysById = VOICE_OPTIONS.map(({ id: voiceId }) => ({
    voiceId,
    keys: existingVoiceKeys(voiceId, additionalKnownVoiceKeys),
  }));
  const voiceBlocks = voiceKeysById
    .map(({ voiceId, keys }) => {
      const entries = keys
        .map((key) => `    '${key}': require('../../assets/audio/voice/${voiceId}/${key}.mp3'),`)
        .join('\n');
      return `  ${voiceId}: {\n${entries}\n  },`;
    })
    .join('\n');
  const durationBlocks = voiceKeysById
    .map(({ voiceId, keys }) => {
      const entries = keys
        .map((key) => {
          const durationMs = probeGeneratedAudio(path.join(VOICE_DIR, voiceId, `${key}.mp3`)).durationMs;
          return `    '${key}': ${durationMs},`;
        })
        .join('\n');
      return `  ${voiceId}: {\n${entries}\n  },`;
    })
    .join('\n');
  const lines = [
    '/**',
    ' * AUTO-GENERATED by scripts/generate-audio.ts — do not edit by hand.',
    ' * Maps audio cue keys to bundled assets, per trainer voice (static require',
    ' * calls so Metro packages them). Voice lines are synthesized once via the',
    ' * ElevenLabs API at build time; the session path never calls a runtime TTS API.',
    ' *',
    ' * Shape: VOICE_MANIFEST[voiceId][cue]. Missing safety cues fail closed;',
    ' * non-safety cues may fall back to the default voice (see src/audio/voicePlayer.ts).',
    ' * SFX are voice-independent.',
    ' */',
    '',
    "import { SfxCueKey, VoiceCueKey } from './cues';",
    '',
    'export const VOICE_MANIFEST: Record<string, Partial<Record<VoiceCueKey, number>>> = {',
    voiceBlocks,
    '};',
    '',
    'export const VOICE_DURATION_MANIFEST: Record<string, Partial<Record<VoiceCueKey, number>>> = {',
    durationBlocks,
    '};',
    '',
    'export const SFX_MANIFEST: Partial<Record<SfxCueKey, number>> = {',
    ...SFX_DEFINITIONS.map(
      (definition) => `  '${definition.key}': require('../../assets/audio/sfx/${definition.file}'),`
    ),
    '};',
    '',
  ];
  fs.writeFileSync(MANIFEST_PATH, lines.join('\n'));
}

function writeSafetyMetadata(generatedSafetyKeys: ReadonlySet<string>, forceAllExistingSafety = false): void {
  const out: Record<string, Partial<Record<SafetyCueId, ReturnType<typeof safetyAudioMetadataFor>>>> = {};
  for (const voice of VOICE_OPTIONS) {
    out[voice.id] = {};
    for (const cueId of safetyAudioCueIds()) {
      const key = `${voice.id}:${cueId}`;
      const expected = safetyAudioMetadataFor({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      const exists = fs.existsSync(path.join(ROOT, expected.path));
      const current = SAFETY_AUDIO_ASSET_METADATA[voice.id]?.[cueId];
      if ((generatedSafetyKeys.has(key) || forceAllExistingSafety) && exists) {
        out[voice.id][cueId] = expected;
      } else if (current) {
        out[voice.id][cueId] = current;
      }
    }
  }
  const content = [
    '/**',
    ' * AUTO-GENERATED by scripts/generate-audio.ts — do not edit by hand.',
    ' * Pure metadata for bundled safety cue audio. Static require() asset mapping',
    ' * lives in src/audio/manifest.ts.',
    ' */',
    '',
    "import type { SafetyAudioMetadataByVoice } from './safetyAudio';",
    '',
    `export const SAFETY_AUDIO_ASSET_METADATA: SafetyAudioMetadataByVoice = ${JSON.stringify(out, null, 2)};`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'src/audio/safetyAudioManifest.ts'), content);
}

function writeMovementProfileV2Metadata(
  generatedCueKeys: ReadonlySet<string>,
  forceAllExistingMovementProfileV2 = false
): void {
  const out: Record<
    string,
    Partial<Record<MovementProfileV2CueId, ReturnType<typeof movementProfileV2AudioMetadataFor>>>
  > = {};
  for (const voice of VOICE_OPTIONS) {
    out[voice.id] = {};
    for (const cueId of movementProfileV2AudioCueIds()) {
      const key = `${voice.id}:${cueId}`;
      const expected = movementProfileV2AudioMetadataFor({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      const exists = fs.existsSync(path.join(ROOT, expected.path));
      const current = MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA[voice.id]?.[cueId];
      if ((generatedCueKeys.has(key) || forceAllExistingMovementProfileV2) && exists) {
        out[voice.id][cueId] = {
          ...expected,
          durationMs: probeGeneratedAudio(path.join(ROOT, expected.path)).durationMs,
        };
      } else if (current) {
        out[voice.id][cueId] = current;
      }
    }
  }
  const content = [
    '/**',
    ' * AUTO-GENERATED by scripts/generate-audio.ts — do not edit by hand.',
    ' * Pure metadata for bundled Movement Profile V2 voice cue audio. Static',
    ' * require() asset mapping lives in src/audio/manifest.ts.',
    ' */',
    '',
    "import type { MovementProfileV2AudioMetadataByVoice } from './movementProfileV2Audio';",
    '',
    `export const MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA: MovementProfileV2AudioMetadataByVoice = ${JSON.stringify(out, null, 2)};`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'src/audio/movementProfileV2AudioManifest.ts'), content);
}

function existingVoiceKeys(voiceId: string, additionalKnownVoiceKeys: ReadonlySet<string> = new Set()): string[] {
  const dir = path.join(VOICE_DIR, voiceId);
  if (!fs.existsSync(dir)) return [];
  const knownKeys = new Set([...Object.keys(LINES), ...voiceV21MetadataLineKeys(), ...additionalKnownVoiceKeys]);
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mp3'))
    .map((file) => file.slice(0, -'.mp3'.length))
    .filter((key) => knownKeys.has(key))
    .sort();
}

function looksLikeMp3(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function sanitizeProviderDetail(detail: string): string {
  const cleaned = detail
    .replace(/sk_[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/xi-api-key["': ]+[^"',}\s]+/gi, 'xi-api-key [redacted]');
  return cleaned.length > 360 ? `${cleaned.slice(0, 360)}…` : cleaned;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const voices = selectVoices(options.voice);
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  fs.mkdirSync(SFX_DIR, { recursive: true });

  if (options.fromBacklog !== null) {
    const backlog = loadVoiceV21Backlog(options.fromBacklog);
    const jobs = buildVoiceV21GenerationJobs(backlog, voices, options.force);
    validateVoiceV21GenerationJobs(jobs, backlog.length);
    writeVoiceV21GenerationPlan(jobs);
    printVoiceV21Plan(jobs, options.dryRun);
    if (options.dryRun) return;
    if (!API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set; Voice V2.1 backlog assets were not generated');
    }
    const output = await generateVoiceV21BacklogAssets(jobs);
    const generated = output.results.filter((result) => result.status === 'generated').length;
    const skipped = output.results.filter((result) => result.status === 'skipped_current').length;
    console.log(
      `\nVoice V2.1 backlog generation complete: generated=${generated} skipped=${skipped} staging=${output.stagingDir}`
    );
    return;
  }

  if (options.group === 'safety') {
    const plan = buildSafetyPlan(voices, options.force);
    printSafetyPlan(plan, options.dryRun);
    if (options.dryRun) return;
    if (!API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set; safety audio assets were not generated');
    }
    const generatedSafetyKeys = await generateSafetyAssets(plan);
    writeManifestFromDisk();
    writeSafetyMetadata(generatedSafetyKeys);
    console.log(`\n${generatedSafetyKeys.size} safety line(s) generated, manifest updated`);
    return;
  }

  if (options.group === 'movement_profile_v2') {
    const plan = buildMovementProfileV2Plan(voices, options.force, options.cue as MovementProfileV2CueId | null);
    printMovementProfileV2Plan(plan, options.dryRun);
    if (options.dryRun) return;
    const needsProvider = plan.some(needsGeneration);
    if (needsProvider && !API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set; Movement Profile V2 audio assets were not generated');
    }
    const generatedCueKeys = needsProvider ? await generateMovementProfileV2Assets(plan) : new Set<string>();
    writeManifestFromDisk();
    writeMovementProfileV2Metadata(generatedCueKeys, !needsProvider);
    console.log(`\n${generatedCueKeys.size} Movement Profile V2 line(s) generated, manifest updated`);
    return;
  }

  if (options.group === 'voice_v21') {
    const refreshRows = loadVoiceV21RefreshRows();
    const jobs = buildVoiceV21GenerationJobs(refreshRows, voices, options.force, { allowExistingRefresh: true });
    validateVoiceV21GenerationJobs(jobs, refreshRows.length);
    writeVoiceV21GenerationPlan(jobs);
    printVoiceV21Plan(jobs, options.dryRun);
    if (options.dryRun) return;
    if (!API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set; Voice V2.1 refresh assets were not generated');
    }
    const output = await generateVoiceV21BacklogAssets(jobs);
    const generated = output.results.filter((result) => result.status === 'generated').length;
    const skipped = output.results.filter((result) => result.status === 'skipped_current').length;
    console.log(
      `\nVoice V2.1 refresh complete: generated=${generated} skipped=${skipped} staging=${output.stagingDir}`
    );
    return;
  }

  if (options.group === 'sfx') {
    writeSfxWavs();
    writeManifestFromDisk();
    console.log(`\n${SFX_DEFINITIONS.length} sound effect(s) → assets/audio/sfx/, manifest updated`);
    return;
  }

  const keys = options.cue === null ? lineKeysForGroup('all') : [options.cue];
  if (options.dryRun) {
    console.log(
      [
        options.cue === null ? 'Full audio dry run' : 'Single-cue audio dry run',
        `voices=${voices.map((voice) => voice.id).join(',')}`,
        `linesPerVoice=${keys.length}`,
        `providerCalls=${voices.length * keys.length}`,
        `providerCredentials=${API_KEY ? 'present' : 'missing'}`,
      ].join(' ')
    );
    return;
  }
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set. Run with a configured environment to generate audio.');
  }

  const generatedSafetyKeys = new Set<string>();
  const generatedMovementProfileV2Keys = new Set<string>();
  for (const voice of voices) {
    await generateVoice(voice.id, voice.elevenLabsVoiceId, keys, {
      resetDirectory: options.cue === null,
    });
    if (options.cue === null) {
      for (const cueId of safetyAudioCueIds()) {
        generatedSafetyKeys.add(`${voice.id}:${cueId}`);
      }
      for (const cueId of movementProfileV2AudioCueIds()) {
        generatedMovementProfileV2Keys.add(`${voice.id}:${cueId}`);
      }
    }
  }
  if (options.cue === null) {
    writeSfxWavs();
  }
  writeManifestFromDisk();
  if (options.cue === null) {
    writeSafetyMetadata(generatedSafetyKeys, true);
    writeMovementProfileV2Metadata(generatedMovementProfileV2Keys, true);
  }
  const total = voices.length * keys.length;
  console.log(
    options.cue === null
      ? `\n${voices.length} voice(s), ${total} lines + ${SFX_DEFINITIONS.length} sound effects → assets/audio/, manifest updated`
      : `\n${voices.length} voice(s), ${total} line(s) → assets/audio/, manifest updated`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
