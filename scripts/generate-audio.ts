/**
 * Generates ALL bundled audio: voice lines via the ElevenLabs text-to-speech
 * API (Flash v2.5 model) — synthesized ONCE at build time, so the session path
 * never touches a runtime TTS API (CLAUDE.md audio law) — plus the rep-credit
 * chime as raw-PCM WAV, and the typed require() manifest the player imports.
 *
 * Re-run after adding cues to src/audio/cues.ts, changing a line below, or
 * adding/replacing a voice in src/profile/voices.ts:
 *
 *   ELEVENLABS_API_KEY=sk_... npm run audio
 *
 * One ElevenLabs voice id per trainer voice is declared in src/profile/voices.ts
 * (the id is used here only; nothing in the app calls ElevenLabs at runtime).
 * Each voice's lines are written to assets/audio/voice/<voiceId>/<key>.mp3 and
 * all outputs are committed. The API key is read from the environment and never
 * committed.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AUDIO_OUTPUT_FORMAT,
  AUDIO_VOICE_SETTINGS,
  ELEVENLABS_MODEL,
  safetyAudioCueIds,
  safetyAudioExpectedPath,
  safetyAudioMetadataFor,
} from '../src/audio/safetyAudio';
import { SAFETY_AUDIO_ASSET_METADATA } from '../src/audio/safetyAudioManifest';
import { VOICE_OPTIONS } from '../src/profile/voices';
import { safetyCueText, SAFETY_VOICE_LINES, type SafetyCueId } from '../src/training/safetyCueDefinitions';

const ROOT = path.resolve(__dirname, '..');
const VOICE_DIR = path.join(ROOT, 'assets/audio/voice');
const SFX_DIR = path.join(ROOT, 'assets/audio/sfx');
const MANIFEST_PATH = path.join(ROOT, 'src/audio/manifest.ts');

/** Every VoiceCueKey from src/audio/cues.ts must have a line here. */
const LINES: Record<string, string> = {
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
  'relax-arm': 'Lovely. Lower your arm and relax.',
  // Hinge reach.
  'hinge-intro':
    'Last one, a forward reach. Stay side-on to the phone, standing tall with ' +
    'your feet under your hips.',
  'hinge-setup':
    'When I say go, slowly fold forward from your hips and reach your hands ' +
    'toward the floor, as far as is comfortable, and hold.',
  'stand-tall': "That's great. Slowly roll back up to standing.",
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

loadRootDotEnv();
const API_KEY = process.env.ELEVENLABS_API_KEY;

type AudioGroup = 'all' | 'safety';
type VoiceSelector = 'all' | string;
type SafetyAssetStatus = 'valid' | 'missing' | 'stale' | 'zero-byte' | 'forced';

interface CliOptions {
  group: AudioGroup;
  voice: VoiceSelector;
  dryRun: boolean;
  force: boolean;
}

interface SelectedVoice {
  id: string;
  elevenLabsVoiceId: string;
}

interface SafetyAssetPlanRow {
  cueId: SafetyCueId;
  voice: SelectedVoice;
  path: string;
  fingerprint: string;
  status: SafetyAssetStatus;
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
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--group') {
      const value = argv[++index];
      if (value !== 'all' && value !== 'safety') throw new Error(`unsupported --group ${value}`);
      options.group = value;
    } else if (arg.startsWith('--group=')) {
      const value = arg.slice('--group='.length);
      if (value !== 'all' && value !== 'safety') throw new Error(`unsupported --group ${value}`);
      options.group = value;
    } else if (arg === '--voice') {
      options.voice = argv[++index] ?? 'all';
    } else if (arg.startsWith('--voice=')) {
      options.voice = arg.slice('--voice='.length);
    } else {
      throw new Error(`unknown audio generation option: ${arg}`);
    }
  }
  return options;
}

function selectVoices(selector: VoiceSelector): SelectedVoice[] {
  const voices = selector === 'all' ? VOICE_OPTIONS : VOICE_OPTIONS.filter((voice) => voice.id === selector);
  if (voices.length === 0) {
    throw new Error(`unknown voice '${selector}'. Expected one of: ${VOICE_OPTIONS.map((voice) => voice.id).join(', ')}, all`);
  }
  return voices.map((voice) => {
    if (!voice.elevenLabsVoiceId) {
      throw new Error(`voice '${voice.id}' has no ElevenLabs voice id in src/profile/voices.ts`);
    }
    return { id: voice.id, elevenLabsVoiceId: voice.elevenLabsVoiceId };
  });
}

function lineKeysForGroup(group: AudioGroup): string[] {
  return group === 'safety' ? safetyAudioCueIds() : Object.keys(LINES).sort();
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
      const status: SafetyAssetStatus = !exists
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

function needsGeneration(row: SafetyAssetPlanRow): boolean {
  return row.status !== 'valid';
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
async function generateVoice(voiceId: string, elevenLabsVoiceId: string, keys: readonly string[]): Promise<string[]> {
  const outDir = path.join(VOICE_DIR, voiceId);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  process.stdout.write(`${voiceId}: `);
  for (const key of keys) {
    const mp3 = await synthesizeLine(elevenLabsVoiceId, LINES[key]);
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

/** Rep-credit chime: 880 Hz sine, fast attack, exponential decay, 160 ms. */
function writeRepCreditWav(): void {
  const sampleRate = 24000;
  const durationSec = 0.16;
  const samples = Math.round(sampleRate * durationSec);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.008);
    const decay = Math.exp(-t / 0.045);
    // Soft octave overtone keeps it chime-like instead of a flat beep.
    const wave = Math.sin(2 * Math.PI * 880 * t) + 0.35 * Math.sin(2 * Math.PI * 1760 * t);
    const value = Math.round(0.5 * attack * decay * wave * 32767 * 0.74);
    data.writeInt16LE(Math.max(-32768, Math.min(32767, value)), i * 2);
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
  fs.writeFileSync(path.join(SFX_DIR, 'rep-credit.wav'), Buffer.concat([header, data]));
}

/** Write the typed manifest: per-voice voice lines + voice-independent sfx. */
function writeManifestFromDisk(): void {
  const voiceBlocks = VOICE_OPTIONS
    .map(({ id: voiceId }) => {
      const keys = existingVoiceKeys(voiceId);
      const entries = keys
        .map((key) => `    '${key}': require('../../assets/audio/voice/${voiceId}/${key}.mp3'),`)
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
    'export const SFX_MANIFEST: Partial<Record<SfxCueKey, number>> = {',
    "  'rep-credit': require('../../assets/audio/sfx/rep-credit.wav'),",
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

function existingVoiceKeys(voiceId: string): string[] {
  const dir = path.join(VOICE_DIR, voiceId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mp3'))
    .map((file) => file.slice(0, -'.mp3'.length))
    .filter((key) => key in LINES)
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

  const keys = lineKeysForGroup('all');
  if (options.dryRun) {
    console.log(
      [
        'Full audio dry run',
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
  for (const voice of voices) {
    await generateVoice(voice.id, voice.elevenLabsVoiceId, keys);
    for (const cueId of safetyAudioCueIds()) {
      generatedSafetyKeys.add(`${voice.id}:${cueId}`);
    }
  }
  writeRepCreditWav();
  writeManifestFromDisk();
  writeSafetyMetadata(generatedSafetyKeys, true);
  const total = voices.length * keys.length;
  console.log(
    `\n${voices.length} voice(s), ${total} lines + rep-credit chime → assets/audio/, manifest updated`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
