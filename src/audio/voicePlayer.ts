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
 * - Session sound effects play on their own channel; they may overlap voice
 *   and never compete with it.
 */

import { AudioPlayer, createAudioPlayer, setAudioModeAsync, type AudioStatus } from 'expo-audio';

import { SfxCueKey, VoiceCueKey } from './cues';
import { SFX_MANIFEST, VOICE_DURATION_MANIFEST, VOICE_MANIFEST } from './manifest';
import { MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA } from './movementProfileV2AudioManifest';
import { DEFAULT_VOICE_ID, getVoice } from '../profile/voices';
import { isMovementProfileV2CueId } from '../movementProfileV2/voiceCues';
import { isSafetyCueId } from '../training/safetyCueDefinitions';

type VoiceManifestShape = Record<string, Partial<Record<VoiceCueKey, number>>>;

export type VoicePlaybackOutcome =
  | 'completed'
  | 'dropped_busy'
  | 'interrupted'
  | 'cancelled'
  | 'asset_missing'
  | 'asset_resolution_failed'
  | 'player_creation_failed'
  | 'playback_start_failed'
  | 'completion_timeout';

export type VoiceCancelReason =
  | 'explicit_stop'
  | 'stage_changed'
  | 'screen_unmounted'
  | 'app_backgrounded'
  | 'superseded'
  | 'retry'
  | 'voice_changed';

export type VoiceCueStartEvidence =
  | 'native_playing_status'
  | 'play_call_resolved'
  | 'fallback_proxy';

export interface VoiceCueStartedEvent {
  requestId: string;
  scopeId: string;
  cueKey: VoiceCueKey;
  cueIndex: number;
  startedAtMs: number;
  startEvidence: VoiceCueStartEvidence;
}

export interface VoicePlaybackResult {
  requestId: string;
  scopeId: string;
  outcome: VoicePlaybackOutcome;
  accepted: boolean;
  required: boolean;
  startedCueKeys: VoiceCueKey[];
  completedCueKeys: VoiceCueKey[];
  failedCueKey?: VoiceCueKey;
  cancelReason?: VoiceCancelReason;
  errorCode?: string;
  requestedAtMs: number;
  firstCueStartedAtMs?: number;
  completedAtMs: number;
}

export interface TrackedVoiceRequestOptions {
  priority: number;
  scopeId: string;
  required: boolean;
  onCueStarted?: (event: VoiceCueStartedEvent) => void;
}

export interface TrackedVoiceRequest {
  requestId: string;
  accepted: boolean;
  completion: Promise<VoicePlaybackResult>;
}

export const VOICE_PLAYER_STATUS_UPDATE_INTERVAL_MS = 50;
export const VOICE_START_FALLBACK_PROXY_MS = 75;
export const VOICE_COMPLETION_POLL_INTERVAL_MS = 100;
export const VOICE_INFERRED_COMPLETION_MARGIN_MS = 750;
export const VOICE_COMPLETION_WATCHDOG_MARGIN_MS = 1500;
export const VOICE_COMPLETION_WATCHDOG_FALLBACK_MS = 6000;
const VOICE_COMPLETION_EPSILON_SEC = 0.03;

export function voiceCompletionWatchdogMs(durationSec: number | null | undefined): number {
  const durationMs = typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec > 0
    ? Math.ceil(durationSec * 1000)
    : VOICE_COMPLETION_WATCHDOG_FALLBACK_MS;
  return durationMs + VOICE_COMPLETION_WATCHDOG_MARGIN_MS;
}

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
  if (isSafetyCueId(cue) || isMovementProfileV2CueId(cue)) {
    throw new Error(`no bundled required audio for ${normalizedVoiceId}/${cue}`);
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

let nextTrackedVoiceRequestNumber = 0;

function nextTrackedVoiceRequestId(): string {
  nextTrackedVoiceRequestNumber++;
  return `voice-${Date.now().toString(36)}-${nextTrackedVoiceRequestNumber.toString(36)}`;
}

function monotonicNowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function resolvedFailureOutcome(error: unknown): VoicePlaybackOutcome {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('no bundled')) return 'asset_missing';
  return 'asset_resolution_failed';
}

interface ActiveTrackedVoiceRequest {
  requestId: string;
  scopeId: string;
  priority: number;
  required: boolean;
  requestedAtMs: number;
  pendingCues: VoiceCueKey[];
  cueIndex: number;
  startedCueKeys: VoiceCueKey[];
  completedCueKeys: VoiceCueKey[];
  onCueStarted?: (event: VoiceCueStartedEvent) => void;
  completion: Promise<VoicePlaybackResult>;
  resolve: (result: VoicePlaybackResult) => void;
  completed: boolean;
  firstCueStartedAtMs?: number;
  failedCueKey?: VoiceCueKey;
  lastOptionalFailure?: VoicePlaybackOutcome;
  startTimer: ReturnType<typeof setTimeout> | null;
  watchdogTimer: ReturnType<typeof setTimeout> | null;
  completionPollTimer: ReturnType<typeof setInterval> | null;
  currentCue: VoiceCueKey | null;
  currentCueIndex: number;
  currentCueStarted: boolean;
  currentCueStartedAtMs: number | null;
  currentCueDurationMs: number | null;
}

export class VoiceChannel {
  private player: AudioPlayer | null = null;
  private pendingCues: VoiceCueKey[] = [];
  private currentPriority = -1;
  private playing = false;
  private activeTrackedRequest: ActiveTrackedVoiceRequest | null = null;

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
      this.interruptActivePlayback();
    }
    this.currentPriority = priority;
    this.pendingCues = cues.slice(1);
    this.playing = true;
    return this.playCue(cues[0]);
  }

  speakTracked(cues: readonly VoiceCueKey[], options: TrackedVoiceRequestOptions): TrackedVoiceRequest {
    const requestId = nextTrackedVoiceRequestId();
    const requestedAtMs = monotonicNowMs();
    if (cues.length === 0) {
      return resolvedTrackedRequest({
        requestId,
        scopeId: options.scopeId,
        outcome: 'dropped_busy',
        accepted: false,
        required: options.required,
        requestedAtMs,
      });
    }
    if (this.playing) {
      if (options.priority <= this.currentPriority) {
        return resolvedTrackedRequest({
          requestId,
          scopeId: options.scopeId,
          outcome: 'dropped_busy',
          accepted: false,
          required: options.required,
          requestedAtMs,
        });
      }
      this.interruptActivePlayback();
    }

    let resolve!: (result: VoicePlaybackResult) => void;
    const completion = new Promise<VoicePlaybackResult>((res) => {
      resolve = res;
    });
    const active: ActiveTrackedVoiceRequest = {
      requestId,
      scopeId: options.scopeId,
      priority: options.priority,
      required: options.required,
      requestedAtMs,
      pendingCues: cues.slice(),
      cueIndex: 0,
      startedCueKeys: [],
      completedCueKeys: [],
      onCueStarted: options.onCueStarted,
      completion,
      resolve,
      completed: false,
      startTimer: null,
      watchdogTimer: null,
      completionPollTimer: null,
      currentCue: null,
      currentCueIndex: -1,
      currentCueStarted: false,
      currentCueStartedAtMs: null,
      currentCueDurationMs: null,
    };

    this.activeTrackedRequest = active;
    this.currentPriority = options.priority;
    this.playing = true;
    this.playNextTrackedCue(active);

    return { requestId, accepted: true, completion };
  }

  cancelScope(scopeId: string, reason: VoiceCancelReason = 'stage_changed'): void {
    const active = this.activeTrackedRequest;
    if (!active || active.scopeId !== scopeId) return;
    this.cancelTrackedRequest(active, reason);
  }

  cancelActive(reason: VoiceCancelReason = 'explicit_stop'): void {
    const active = this.activeTrackedRequest;
    if (active) {
      this.cancelTrackedRequest(active, reason);
      return;
    }
    this.stop(reason);
  }

  stop(reason: VoiceCancelReason = 'explicit_stop'): void {
    const active = this.activeTrackedRequest;
    if (active) {
      this.cancelTrackedRequest(active, reason);
      return;
    }
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

  private playNextTrackedCue(active: ActiveTrackedVoiceRequest): void {
    if (this.activeTrackedRequest !== active || active.completed) return;
    const cue = active.pendingCues.shift();
    if (cue === undefined) {
      const outcome = active.lastOptionalFailure && active.completedCueKeys.length === 0
        ? active.lastOptionalFailure
        : 'completed';
      this.resolveTrackedRequest(active, outcome, { accepted: true, failedCueKey: active.failedCueKey });
      return;
    }

    active.currentCue = cue;
    active.currentCueIndex = active.cueIndex++;
    active.currentCueStarted = false;
    active.currentCueStartedAtMs = null;
    active.currentCueDurationMs = bundledVoiceCueDurationMs(this.voiceId, cue);
    this.clearTrackedTimers(active);
    this.releasePlayer();

    let asset: number;
    try {
      asset = voiceAssetFor(this.voiceId, cue);
    } catch (error) {
      this.handleTrackedCueFailure(active, cue, resolvedFailureOutcome(error), error);
      return;
    }

    let player: AudioPlayer;
    try {
      const createdPlayer = createAudioPlayer(asset, {
        updateInterval: VOICE_PLAYER_STATUS_UPDATE_INTERVAL_MS,
        keepAudioSessionActive: true,
      });
      if (!createdPlayer || typeof createdPlayer.addListener !== 'function') {
        throw new Error('audio player unavailable');
      }
      player = createdPlayer;
    } catch (error) {
      this.handleTrackedCueFailure(active, cue, 'player_creation_failed', error);
      return;
    }

    this.player = player;
    player.addListener('playbackStatusUpdate', (status) => {
      if (this.player !== player || this.activeTrackedRequest !== active || active.completed) return;
      if (status.playing) {
        this.markTrackedCueStarted(active, cue, active.currentCueIndex, 'native_playing_status');
      }
      if (!playbackStatusLooksFinished(status)) return;
      this.completeTrackedCue(active, cue);
    });

    try {
      player.play();
    } catch (error) {
      this.handleTrackedCueFailure(active, cue, 'playback_start_failed', error);
      return;
    }

    if (player.playing) {
      this.markTrackedCueStarted(active, cue, active.currentCueIndex, 'native_playing_status');
    }

    active.startTimer = setTimeout(() => {
      if (this.player !== player || this.activeTrackedRequest !== active || active.completed) return;
      this.markTrackedCueStarted(active, cue, active.currentCueIndex, 'fallback_proxy');
    }, VOICE_START_FALLBACK_PROXY_MS);

    const durationSec = finitePositiveSeconds(player.duration) ?? durationMsToSeconds(active.currentCueDurationMs);
    active.watchdogTimer = setTimeout(() => {
      if (this.player !== player || this.activeTrackedRequest !== active || active.completed) return;
      if (this.completeTrackedCueFromPlayerState(active, cue, player)) return;
      this.resolveTrackedRequest(active, 'completion_timeout', {
        failedCueKey: cue,
        errorCode: 'watchdog_timeout',
      });
    }, voiceCompletionWatchdogMs(durationSec));

    active.completionPollTimer = setInterval(() => {
      if (this.player !== player || this.activeTrackedRequest !== active || active.completed) return;
      this.completeTrackedCueFromPlayerState(active, cue, player);
    }, VOICE_COMPLETION_POLL_INTERVAL_MS);
  }

  private markTrackedCueStarted(
    active: ActiveTrackedVoiceRequest,
    cue: VoiceCueKey,
    cueIndex: number,
    startEvidence: VoiceCueStartEvidence
  ): void {
    if (this.activeTrackedRequest !== active || active.completed || active.currentCueStarted) return;
    active.currentCueStarted = true;
    const startedAtMs = monotonicNowMs();
    active.currentCueStartedAtMs = startedAtMs;
    active.startedCueKeys.push(cue);
    if (active.firstCueStartedAtMs === undefined) active.firstCueStartedAtMs = startedAtMs;
    active.onCueStarted?.({
      requestId: active.requestId,
      scopeId: active.scopeId,
      cueKey: cue,
      cueIndex,
      startedAtMs,
      startEvidence,
    });
  }

  private completeTrackedCue(active: ActiveTrackedVoiceRequest, cue: VoiceCueKey): void {
    if (this.activeTrackedRequest !== active || active.completed || active.currentCue !== cue) return;
    this.clearTrackedTimers(active);
    active.completedCueKeys.push(cue);
    const next = active.pendingCues[0];
    if (next !== undefined) {
      this.playNextTrackedCue(active);
      return;
    }
    this.resolveTrackedRequest(active, 'completed', { accepted: true });
  }

  private completeTrackedCueFromPlayerState(
    active: ActiveTrackedVoiceRequest,
    cue: VoiceCueKey,
    player: AudioPlayer
  ): boolean {
    if (this.activeTrackedRequest !== active || active.completed || active.currentCue !== cue) return false;
    const status = readPlayerStatus(player);
    if (status && playbackStatusLooksFinished(status)) {
      this.completeTrackedCue(active, cue);
      return true;
    }
    const durationSec = finitePositiveSeconds(player.duration);
    const currentTimeSec = finiteSeconds(player.currentTime);
    if (
      active.currentCueStarted &&
      durationSec !== null &&
      currentTimeSec !== null &&
      currentTimeSec >= durationSec - VOICE_COMPLETION_EPSILON_SEC &&
      player.playing === false
    ) {
      this.completeTrackedCue(active, cue);
      return true;
    }
    if (cueHasReachedBundledDuration(active)) {
      this.completeTrackedCue(active, cue);
      return true;
    }
    return false;
  }

  private handleTrackedCueFailure(
    active: ActiveTrackedVoiceRequest,
    cue: VoiceCueKey,
    outcome: VoicePlaybackOutcome,
    error: unknown
  ): void {
    active.failedCueKey = cue;
    const errorCode = error instanceof Error ? error.message : String(error);
    if (active.required) {
      this.resolveTrackedRequest(active, outcome, { failedCueKey: cue, errorCode });
      return;
    }
    console.warn('[audio] skipped voice cue', { cue, reason: outcome });
    active.lastOptionalFailure = outcome;
    const next = active.pendingCues[0];
    if (next !== undefined) {
      this.playNextTrackedCue(active);
      return;
    }
    this.resolveTrackedRequest(active, outcome, { accepted: true, failedCueKey: cue, errorCode });
  }

  private interruptActivePlayback(): void {
    const active = this.activeTrackedRequest;
    if (active) {
      this.resolveTrackedRequest(active, 'interrupted');
      return;
    }
    this.releasePlayer();
    this.pendingCues = [];
    this.playing = false;
    this.currentPriority = -1;
  }

  private cancelTrackedRequest(active: ActiveTrackedVoiceRequest, reason: VoiceCancelReason): void {
    this.resolveTrackedRequest(active, 'cancelled', { cancelReason: reason });
  }

  private resolveTrackedRequest(
    active: ActiveTrackedVoiceRequest,
    outcome: VoicePlaybackOutcome,
    options: {
      accepted?: boolean;
      failedCueKey?: VoiceCueKey;
      cancelReason?: VoiceCancelReason;
      errorCode?: string;
    } = {}
  ): void {
    if (active.completed) return;
    active.completed = true;
    this.clearTrackedTimers(active);
    if (this.activeTrackedRequest === active) this.activeTrackedRequest = null;
    this.releasePlayer();
    this.pendingCues = [];
    this.playing = false;
    this.currentPriority = -1;
    active.resolve({
      requestId: active.requestId,
      scopeId: active.scopeId,
      outcome,
      accepted: options.accepted ?? outcome !== 'dropped_busy',
      required: active.required,
      startedCueKeys: active.startedCueKeys.slice(),
      completedCueKeys: active.completedCueKeys.slice(),
      failedCueKey: options.failedCueKey ?? active.failedCueKey,
      cancelReason: options.cancelReason,
      errorCode: options.errorCode,
      requestedAtMs: active.requestedAtMs,
      firstCueStartedAtMs: active.firstCueStartedAtMs,
      completedAtMs: monotonicNowMs(),
    });
  }

  private clearTrackedTimers(active: ActiveTrackedVoiceRequest): void {
    if (active.startTimer) {
      clearTimeout(active.startTimer);
      active.startTimer = null;
    }
    if (active.watchdogTimer) {
      clearTimeout(active.watchdogTimer);
      active.watchdogTimer = null;
    }
    if (active.completionPollTimer) {
      clearInterval(active.completionPollTimer);
      active.completionPollTimer = null;
    }
  }

  private releasePlayer(): void {
    if (this.player) {
      this.player.removeAllListeners('playbackStatusUpdate');
      this.player.remove();
      this.player = null;
    }
  }
}

function readPlayerStatus(player: AudioPlayer): AudioStatus | null {
  try {
    return player.currentStatus;
  } catch {
    return null;
  }
}

function playbackStatusLooksFinished(
  status: Pick<AudioStatus, 'currentTime' | 'duration' | 'playing' | 'didJustFinish'>
): boolean {
  if (status.didJustFinish) return true;
  const durationSec = finitePositiveSeconds(status.duration);
  const currentTimeSec = finiteSeconds(status.currentTime);
  return (
    durationSec !== null &&
    currentTimeSec !== null &&
    currentTimeSec >= durationSec - VOICE_COMPLETION_EPSILON_SEC &&
    status.playing === false
  );
}

function finitePositiveSeconds(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function finiteSeconds(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function durationMsToSeconds(durationMs: number | null): number | null {
  return durationMs !== null && Number.isFinite(durationMs) && durationMs > 0 ? durationMs / 1000 : null;
}

function bundledVoiceCueDurationMs(voiceId: string, cue: VoiceCueKey): number | null {
  const manifestDurationMs = VOICE_DURATION_MANIFEST[voiceId]?.[cue];
  if (typeof manifestDurationMs === 'number' && Number.isFinite(manifestDurationMs) && manifestDurationMs > 0) {
    return manifestDurationMs;
  }
  if (!isMovementProfileV2CueId(cue)) return null;
  const durationMs = MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA[voiceId]?.[cue]?.durationMs;
  return typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0 ? durationMs : null;
}

function cueHasReachedBundledDuration(active: ActiveTrackedVoiceRequest): boolean {
  if (!active.currentCueStarted || active.currentCueStartedAtMs === null || active.currentCueDurationMs === null) {
    return false;
  }
  const elapsedMs = monotonicNowMs() - active.currentCueStartedAtMs;
  return elapsedMs >= active.currentCueDurationMs + VOICE_INFERRED_COMPLETION_MARGIN_MS;
}

function resolvedTrackedRequest(input: {
  requestId: string;
  scopeId: string;
  outcome: VoicePlaybackOutcome;
  accepted: boolean;
  required: boolean;
  requestedAtMs: number;
}): TrackedVoiceRequest {
  return {
    requestId: input.requestId,
    accepted: input.accepted,
    completion: Promise.resolve({
      requestId: input.requestId,
      scopeId: input.scopeId,
      outcome: input.outcome,
      accepted: input.accepted,
      required: input.required,
      startedCueKeys: [],
      completedCueKeys: [],
      requestedAtMs: input.requestedAtMs,
      completedAtMs: monotonicNowMs(),
    }),
  };
}

/** Fire-and-forget session sound-effect channel. Reuses one player per cue. */
export class SfxChannel {
  private readonly players = new Map<SfxCueKey, AudioPlayer>();

  play(cue: SfxCueKey = 'rep-credit'): void {
    let player = this.players.get(cue) ?? null;
    if (!player) {
      player = createAudioPlayer(sfxAssetFor(cue));
      this.players.set(cue, player);
    }
    void player.seekTo(0);
    player.play();
  }

  release(): void {
    for (const player of this.players.values()) {
      player.remove();
    }
    this.players.clear();
  }
}
