import type { VoiceCueKey } from '../../audio/cues';
import { voicePriority } from '../../audio/cues';
import type {
  TrackedVoiceRequest,
  VoiceCancelReason,
  VoiceChannel,
} from '../../audio/voicePlayer';
import type { TrainingVoiceSequencePlanV21 } from './types';

export interface TrainingVoiceRuntimeSpeakResultV21 {
  readonly accepted: boolean;
  readonly reason: 'accepted' | 'plan_not_ready' | 'missing_physical_binding' | 'stale_stage' | 'voice_channel_busy';
  readonly trackedRequest: TrackedVoiceRequest | null;
}

export interface TrainingVoiceRuntimeV21Options {
  readonly voiceChannel: Pick<VoiceChannel, 'speakTracked' | 'cancelScope' | 'cancelActive'>;
  readonly scopePrefix?: string;
}

export class TrainingVoiceRuntimeV21 {
  private readonly voiceChannel: Pick<VoiceChannel, 'speakTracked' | 'cancelScope' | 'cancelActive'>;
  private readonly scopePrefix: string;
  private activeScopeId: string | null = null;
  private stageEpoch = 0;

  constructor(options: TrainingVoiceRuntimeV21Options) {
    this.voiceChannel = options.voiceChannel;
    this.scopePrefix = options.scopePrefix ?? 'training-v21';
  }

  beginStage(stageId: string): string {
    if (this.activeScopeId) this.voiceChannel.cancelScope(this.activeScopeId, 'stage_changed');
    this.stageEpoch += 1;
    this.activeScopeId = `${this.scopePrefix}:${stageId}:${this.stageEpoch}`;
    return this.activeScopeId;
  }

  cancelActive(reason: VoiceCancelReason = 'explicit_stop'): void {
    this.voiceChannel.cancelActive(reason);
    this.activeScopeId = null;
  }

  speakRequiredSequence(input: {
    readonly plan: TrainingVoiceSequencePlanV21;
    readonly stageScopeId: string;
    readonly physicalCueKeys: readonly VoiceCueKey[];
  }): TrainingVoiceRuntimeSpeakResultV21 {
    if (input.stageScopeId !== this.activeScopeId) {
      return { accepted: false, reason: 'stale_stage', trackedRequest: null };
    }
    if (!input.plan.ready) {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null };
    }
    if (input.physicalCueKeys.length !== input.plan.entries.length) {
      return { accepted: false, reason: 'missing_physical_binding', trackedRequest: null };
    }
    const request = this.voiceChannel.speakTracked(input.physicalCueKeys, {
      priority: maxPriority(input.physicalCueKeys),
      required: true,
      scopeId: input.stageScopeId,
    });
    return { accepted: request.accepted, reason: request.accepted ? 'accepted' : 'voice_channel_busy', trackedRequest: request };
  }
}

function maxPriority(cues: readonly VoiceCueKey[]): number {
  return cues.reduce((priority, cue) => Math.max(priority, voicePriority(cue)), 0);
}
