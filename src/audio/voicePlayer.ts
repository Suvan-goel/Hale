/**
 * Bundled-audio playback for assessment sessions.
 *
 * Audio laws, enforced here:
 * - All lines are pre-generated assets (see scripts/generate-audio.ts);
 *   nothing in the session path calls a runtime TTS API.
 * - ONE voice line (or stitched sequence) at a time. A busy channel DROPS an
 *   incoming lower-or-equal-priority line — stale guidance is worse than
 *   silence. Higher priority interrupts.
 * - Audio configuration must never interrupt the camera session (Forma
 *   production pain): mixWithOthers + recording disabled, configured once at
 *   app start before the camera mounts.
 * - The rep-credit chime is a sound effect on its own channel; it may overlap
 *   voice and never competes with it.
 */

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { SfxCueKey, VoiceCueKey } from './cues';
import { SFX_MANIFEST, VOICE_MANIFEST } from './manifest';
import { DEFAULT_VOICE_ID } from '../profile/voices';

/** Call once at app start, BEFORE the pose camera mounts. */
export async function configureSessionAudio(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });
}

/**
 * Resolve a voice cue to a bundled asset for the chosen trainer voice, falling
 * back to the default voice for any cue that voice hasn't been generated yet
 * (so a partially-bundled voice still speaks, in its own voice where it can).
 */
function voiceAssetFor(voiceId: string, cue: VoiceCueKey): number {
  const asset = VOICE_MANIFEST[voiceId]?.[cue] ?? VOICE_MANIFEST[DEFAULT_VOICE_ID]?.[cue];
  if (asset === undefined) {
    throw new Error(`no bundled audio for cue '${cue}' — run npm run audio`);
  }
  return asset;
}

function sfxAssetFor(cue: SfxCueKey): number {
  const asset = SFX_MANIFEST[cue];
  if (asset === undefined) {
    throw new Error(`no bundled audio for sfx '${cue}' — run npm run audio`);
  }
  return asset;
}

export class VoiceChannel {
  private player: AudioPlayer | null = null;
  private pendingCues: VoiceCueKey[] = [];
  private currentPriority = -1;
  private playing = false;

  /** @param voiceId selected trainer voice (see src/profile/voices.ts). */
  constructor(private readonly voiceId: string = DEFAULT_VOICE_ID) {}

  get busy(): boolean {
    return this.playing;
  }

  /**
   * Speak a line or a stitched sequence (a result sentence is one utterance).
   * Returns false when the channel was busy with something at least as
   * important and the request was dropped.
   */
  speak(cues: readonly VoiceCueKey[], priority: number): boolean {
    if (cues.length === 0) return false;
    if (this.playing) {
      if (priority <= this.currentPriority) return false;
      this.stop();
    }
    this.currentPriority = priority;
    this.pendingCues = cues.slice(1);
    this.playing = true;
    this.playCue(cues[0]);
    return true;
  }

  stop(): void {
    this.releasePlayer();
    this.pendingCues = [];
    this.playing = false;
    this.currentPriority = -1;
  }

  private playCue(cue: VoiceCueKey): void {
    this.releasePlayer();
    const player = createAudioPlayer(voiceAssetFor(this.voiceId, cue));
    this.player = player;
    player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish || this.player !== player) return;
      const next = this.pendingCues.shift();
      if (next !== undefined) {
        this.playCue(next);
      } else {
        this.releasePlayer();
        this.playing = false;
        this.currentPriority = -1;
      }
    });
    player.play();
  }

  private releasePlayer(): void {
    if (this.player) {
      this.player.removeAllListeners('playbackStatusUpdate');
      this.player.remove();
      this.player = null;
    }
  }
}

/** Fire-and-forget chime channel (rep credits). Reuses one player. */
export class SfxChannel {
  private player: AudioPlayer | null = null;

  play(cue: SfxCueKey = 'rep-credit'): void {
    if (!this.player) {
      this.player = createAudioPlayer(sfxAssetFor(cue));
    }
    void this.player.seekTo(0);
    this.player.play();
  }

  release(): void {
    this.player?.remove();
    this.player = null;
  }
}
