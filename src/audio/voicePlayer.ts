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
import { DEFAULT_VOICE_ID, getVoice } from '../profile/voices';
import { isSafetyCueId } from '../training/safetyCueDefinitions';

type VoiceManifestShape = Record<string, Partial<Record<VoiceCueKey, number>>>;

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
 * Resolve a voice cue to a bundled asset. Safety cues must exist for the
 * selected voice; non-safety cues may use the historical default-voice fallback.
 */
export function resolveVoiceCueAsset(voiceId: string, cue: VoiceCueKey): {
  asset: number;
  resolvedVoiceId: string;
  usedFallback: boolean;
} {
  return resolveVoiceCueAssetFromManifest(VOICE_MANIFEST, voiceId, cue);
}

export function resolveVoiceCueAssetFromManifest(
  manifest: VoiceManifestShape,
  voiceId: string,
  cue: VoiceCueKey
): {
  asset: number;
  resolvedVoiceId: string;
  usedFallback: boolean;
} {
  const normalizedVoiceId = getVoice(voiceId).id;
  const direct = manifest[normalizedVoiceId]?.[cue];
  if (direct !== undefined) {
    return { asset: direct, resolvedVoiceId: normalizedVoiceId, usedFallback: false };
  }
  if (isSafetyCueId(cue)) {
    throw new Error(`no bundled safety audio for ${normalizedVoiceId}/${cue}`);
  }
  const fallback = manifest[DEFAULT_VOICE_ID]?.[cue];
  if (fallback === undefined) {
    throw new Error(`no bundled audio for cue '${cue}' — run npm run audio`);
  }
  return { asset: fallback, resolvedVoiceId: DEFAULT_VOICE_ID, usedFallback: true };
}

function voiceAssetFor(voiceId: string, cue: VoiceCueKey): number {
  return resolveVoiceCueAsset(voiceId, cue).asset;
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
  private readonly voiceId: string;

  constructor(voiceId: string = DEFAULT_VOICE_ID) {
    this.voiceId = getVoice(voiceId).id;
  }

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
    return this.playCue(cues[0]);
  }

  stop(): void {
    this.releasePlayer();
    this.pendingCues = [];
    this.playing = false;
    this.currentPriority = -1;
  }

  private playCue(cue: VoiceCueKey): boolean {
    this.releasePlayer();
    let player: AudioPlayer;
    try {
      const createdPlayer = createAudioPlayer(voiceAssetFor(this.voiceId, cue));
      if (!createdPlayer || typeof createdPlayer.addListener !== 'function') {
        throw new Error('audio player unavailable');
      }
      player = createdPlayer;
    } catch (error) {
      console.warn('[audio] skipped voice cue', { cue, reason: 'missing_bundled_asset' });
      const next = this.pendingCues.shift();
      if (next !== undefined) {
        return this.playCue(next);
      } else {
        this.playing = false;
        this.currentPriority = -1;
        return false;
      }
    }
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
    try {
      player.play();
    } catch {
      console.warn('[audio] skipped voice cue', { cue, reason: 'playback_start_failed' });
      const next = this.pendingCues.shift();
      if (next !== undefined) {
        return this.playCue(next);
      }
      this.releasePlayer();
      this.playing = false;
      this.currentPriority = -1;
      return false;
    }
    return true;
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
