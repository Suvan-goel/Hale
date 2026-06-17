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

import { VOICE_OPTIONS } from '../src/profile/voices';

const ELEVENLABS_MODEL = 'eleven_flash_v2_5';
/** mp3 @ 44.1kHz / 128kbps — small, and expo-audio plays it on both platforms. */
const OUTPUT_FORMAT = 'mp3_44100_128';
/** Slightly slower than default for clarity with the 45–65 audience. */
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  use_speaker_boost: true,
  speed: 0.95,
};

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

const API_KEY = process.env.ELEVENLABS_API_KEY;

/** One ElevenLabs TTS request → mp3 bytes for a single line. */
async function synthesizeLine(voiceId: string, text: string): Promise<Buffer> {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`;
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
      voice_settings: VOICE_SETTINGS,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status} for voice ${voiceId}: ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Generate every line for one trainer voice into assets/audio/voice/<id>/. */
async function generateVoice(voiceId: string, elevenLabsVoiceId: string): Promise<string[]> {
  const outDir = path.join(VOICE_DIR, voiceId);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const keys = Object.keys(LINES).sort();
  process.stdout.write(`${voiceId}: `);
  for (const key of keys) {
    const mp3 = await synthesizeLine(elevenLabsVoiceId, LINES[key]);
    fs.writeFileSync(path.join(outDir, `${key}.mp3`), mp3);
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return keys;
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
function writeManifest(generated: { voiceId: string; keys: string[] }[]): void {
  const voiceBlocks = generated
    .map(({ voiceId, keys }) => {
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
    ' * Shape: VOICE_MANIFEST[voiceId][cue]. A cue missing for a given voice falls',
    ' * back to the default voice (see src/audio/voicePlayer.ts). SFX are voice-',
    ' * independent.',
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

async function main(): Promise<void> {
  if (!API_KEY) {
    throw new Error(
      'ELEVENLABS_API_KEY is not set. Run: ELEVENLABS_API_KEY=sk_... npm run audio'
    );
  }
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  fs.mkdirSync(SFX_DIR, { recursive: true });

  const generated: { voiceId: string; keys: string[] }[] = [];
  for (const voice of VOICE_OPTIONS) {
    if (!voice.elevenLabsVoiceId) {
      console.warn(`skipping ${voice.id}: no elevenLabsVoiceId set in src/profile/voices.ts`);
      continue;
    }
    const keys = await generateVoice(voice.id, voice.elevenLabsVoiceId);
    generated.push({ voiceId: voice.id, keys });
  }
  if (generated.length === 0) {
    throw new Error('no voices generated — set elevenLabsVoiceId in src/profile/voices.ts');
  }

  writeRepCreditWav();
  writeManifest(generated);
  const total = generated.reduce((n, g) => n + g.keys.length, 0);
  console.log(
    `\n${generated.length} voice(s), ${total} lines + rep-credit chime → assets/audio/, manifest updated`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
