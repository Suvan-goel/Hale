/**
 * Generates ALL bundled audio: voice lines via macOS `say` + `afconvert`
 * (one-time TTS — the session path never touches a runtime TTS API), the
 * rep-credit chime as raw-PCM WAV, and the typed require() manifest the
 * player imports. Re-run after adding cues to src/audio/cues.ts:
 *
 *   npm run audio
 *
 * macOS-only by design (CI never runs it; outputs are committed). Swapping
 * in a professional TTS voice later = regenerate the same file names.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const VOICE = 'Samantha';
const SPEECH_RATE = 170; // words/min — a touch slower for clarity
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
  'framing-ready': 'Perfect. Stay right there.',
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

function synthesizeVoiceLine(key: string, text: string): void {
  const aiff = path.join(os.tmpdir(), `voice-${key}.aiff`);
  const out = path.join(VOICE_DIR, `${key}.m4a`);
  execFileSync('say', ['-v', VOICE, '-r', String(SPEECH_RATE), '-o', aiff, text]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', aiff, out]);
  fs.rmSync(aiff);
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

function writeManifest(voiceKeys: string[]): void {
  const lines = [
    '/**',
    ' * AUTO-GENERATED by scripts/generate-audio.ts — do not edit by hand.',
    ' * Maps audio cue keys to bundled assets (static require calls so Metro',
    ' * packages them).',
    ' */',
    '',
    "import { AudioCueKey } from './cues';",
    '',
    'export const AUDIO_MANIFEST: Partial<Record<AudioCueKey, number>> = {',
    ...voiceKeys.map(
      (key) => `  '${key}': require('../../assets/audio/voice/${key}.m4a'),`
    ),
    "  'rep-credit': require('../../assets/audio/sfx/rep-credit.wav'),",
    '};',
    '',
  ];
  fs.writeFileSync(MANIFEST_PATH, lines.join('\n'));
}

fs.mkdirSync(VOICE_DIR, { recursive: true });
fs.mkdirSync(SFX_DIR, { recursive: true });

const keys = Object.keys(LINES).sort();
for (const key of keys) {
  synthesizeVoiceLine(key, LINES[key]);
  process.stdout.write('.');
}
writeRepCreditWav();
writeManifest(keys);
console.log(`\n${keys.length} voice lines + rep-credit chime → assets/audio/, manifest updated`);
