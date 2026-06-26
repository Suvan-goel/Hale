import type { SetGraderUpdate, SetResult } from '../../exercises';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import {
  advanceStepUpAlternationState,
  createStepUpAlternationRuntimeState,
  currentStepUpAttemptId,
  restoreStepUpAlternationRuntimeState,
} from './stateMachine';
import { stepUpSetResultToLegacySetResult, summarizeStepUpSetResult } from './aggregation';
import {
  createStepUpAlternationEvidenceAdapter,
  type StepUpEvidenceAdapterSnapshot,
} from './evidenceAdapter';
import { serializeStepUpAlternationRuntimeState, type StepUpAlternationRestoreEnvelope } from './persistence';
import { resolveStepUpRepEvidence } from './evidence';
import type {
  StepUpAlternationPlan,
  StepUpAlternationRuntimeState,
  StepUpLeadSide,
} from './types';

export interface StepUpAlternationRuntimeUpdate {
  readonly setUpdate: SetGraderUpdate;
  readonly acceptedRepEvent?: {
    readonly repAttemptId: string;
    readonly repCount: number;
  };
  readonly correction?: {
    readonly code: 'wrong_lead' | 'return_both_feet_to_floor' | 'insufficient_lead_evidence';
    readonly expectedLeadSide: StepUpLeadSide;
  };
  readonly stepUpContext: {
    readonly plan: StepUpAlternationPlan;
    readonly expectedLeadSide: StepUpLeadSide;
    readonly startLeadSide: StepUpLeadSide;
    readonly acceptedRepCount: number;
    readonly leftLeadRepCount: number;
    readonly rightLeadRepCount: number;
    readonly targetTotalReps: number;
  };
}

export interface SerializedStepUpAlternationSetRuntime {
  readonly kind: 'step_up_alternation';
  readonly schemaVersion: 1;
  readonly state: StepUpAlternationRestoreEnvelope;
  readonly adapter: StepUpEvidenceAdapterSnapshot;
}

export interface StepUpAlternationSetRuntimeInput {
  readonly plan: StepUpAlternationPlan;
  readonly setIndex: number;
  readonly restored?: SerializedStepUpAlternationSetRuntime | null;
}

export class StepUpAlternationSetRuntime {
  readonly kind = 'step_up_alternation' as const;

  private state: StepUpAlternationRuntimeState;
  private readonly adapter = createStepUpAlternationEvidenceAdapter();
  private readonly live: SetGraderUpdate = freshSetUpdate();
  private attemptStartedAtMs: number | null = null;
  private attemptObservedLeadSide: StepUpLeadSide | null = null;
  private attemptObservedAtMs: number | null = null;
  private attemptTopReachedAtMs: number | null = null;
  private attemptHadMovement = false;
  private emittedResult = false;

  constructor(input: StepUpAlternationSetRuntimeInput) {
    if (
      input.restored?.state.plan.planFingerprint === input.plan.planFingerprint &&
      input.restored.state.setIndex === input.setIndex
    ) {
      this.state = restoreStepUpAlternationRuntimeState(input.restored.state as StepUpAlternationRuntimeState);
      this.adapter.restore(input.restored.adapter);
    } else {
      this.state = createStepUpAlternationRuntimeState(input.plan, input.setIndex);
      this.adapter.resetForSet({ setIndex: input.setIndex });
    }
  }

  update(frame: PipelineFrameOutput): StepUpAlternationRuntimeUpdate {
    let acceptedRepEvent: StepUpAlternationRuntimeUpdate['acceptedRepEvent'];
    let correction: StepUpAlternationRuntimeUpdate['correction'];
    const observations = this.adapter.update(frame);
    for (const observation of observations) {
      if (!observation.trackingValid && this.state.currentRepAttemptId) {
        this.applyTerminalEvidence(observation.timestampMs, {
          trackingValid: false,
          bothFeetReturnedToFloor: false,
        });
        this.adapter.resetForRep({
          repAttemptId: currentStepUpAttemptId(this.state),
          expectedLeadSide: this.state.expectedLeadSide,
        });
        continue;
      }

      if (
        observation.bothFeetFloorReady &&
        (this.state.phase === 'set_setup' ||
          this.state.phase === 'wrong_lead_recovery' ||
          this.state.phase === 'tracking_recovery')
      ) {
        this.state = advanceStepUpAlternationState(this.state, { type: 'FLOOR_READY' });
      }

      if (observation.bothFeetFloorReady && this.state.phase === 'ready_both_feet_floor') {
        const attemptId = currentStepUpAttemptId(this.state);
        this.state = advanceStepUpAlternationState(this.state, {
          type: 'START_REP_ATTEMPT',
          attemptId,
        });
        this.attemptStartedAtMs = observation.timestampMs;
        this.attemptObservedLeadSide = null;
        this.attemptObservedAtMs = null;
        this.attemptTopReachedAtMs = null;
        this.attemptHadMovement = false;
        this.adapter.resetForRep({ repAttemptId: attemptId, expectedLeadSide: this.state.expectedLeadSide });
      }

      if (!this.state.currentRepAttemptId) continue;
      if (observation.ascentStarted || observation.reasonCodes.includes('lead_ambiguous_both_feet_moved')) {
        this.attemptHadMovement = true;
      }
      if (observation.observedLeadCandidate && !this.attemptObservedLeadSide) {
        this.attemptObservedLeadSide = observation.observedLeadCandidate;
        this.attemptObservedAtMs = observation.timestampMs;
      }
      if (observation.topPhaseValid && this.attemptTopReachedAtMs === null) {
        this.attemptTopReachedAtMs = observation.timestampMs;
      }

      const wrongLead =
        this.attemptObservedLeadSide !== null && this.attemptObservedLeadSide !== this.state.expectedLeadSide;
      if (wrongLead) {
        correction = {
          code: observation.bothFeetFloorReady ? 'wrong_lead' : 'return_both_feet_to_floor',
          expectedLeadSide: this.state.expectedLeadSide,
        };
      } else if (this.attemptHadMovement && !this.attemptObservedLeadSide) {
        correction = {
          code: 'insufficient_lead_evidence',
          expectedLeadSide: this.state.expectedLeadSide,
        };
      }

      if (observation.returnToFloorValid || (wrongLead && observation.bothFeetFloorReady)) {
        const beforeAccepted = this.state.acceptedRepCount;
        const beforeAttemptId = this.state.currentRepAttemptId;
        this.applyTerminalEvidence(observation.timestampMs, {
          trackingValid: true,
          bothFeetReturnedToFloor: observation.returnToFloorValid || wrongLead,
        });
        if (this.state.acceptedRepCount > beforeAccepted && beforeAttemptId) {
          acceptedRepEvent = {
            repAttemptId: beforeAttemptId,
            repCount: this.state.acceptedRepCount,
          };
        }
        this.adapter.resetForRep({
          repAttemptId: currentStepUpAttemptId(this.state),
          expectedLeadSide: this.state.expectedLeadSide,
        });
      } else if (this.attemptHadMovement && !this.attemptObservedLeadSide && observation.bothFeetFloorReady) {
        this.applyTerminalEvidence(observation.timestampMs, {
          trackingValid: true,
          bothFeetReturnedToFloor: false,
        });
        this.adapter.resetForRep({
          repAttemptId: currentStepUpAttemptId(this.state),
          expectedLeadSide: this.state.expectedLeadSide,
        });
      }
    }

    const setUpdate = this.fillSetUpdate();
    return {
      setUpdate,
      acceptedRepEvent,
      correction,
      stepUpContext: this.context(),
    };
  }

  pause(_atMs: number): StepUpAlternationRuntimeUpdate {
    this.state = advanceStepUpAlternationState(this.state, { type: 'PAUSE_OR_BACKGROUND' });
    this.adapter.resetForRep({
      repAttemptId: currentStepUpAttemptId(this.state),
      expectedLeadSide: this.state.expectedLeadSide,
    });
    this.clearAttempt();
    return { setUpdate: this.fillSetUpdate(), stepUpContext: this.context() };
  }

  resume(_atMs: number): StepUpAlternationRuntimeUpdate {
    return { setUpdate: this.fillSetUpdate(), stepUpContext: this.context() };
  }

  cancel(_atMs: number): StepUpAlternationRuntimeUpdate {
    this.state = advanceStepUpAlternationState(this.state, { type: 'CANCEL_SET' });
    this.clearAttempt();
    return { setUpdate: this.fillSetUpdate(), stepUpContext: this.context() };
  }

  finish(_timestampMs: number): SetResult {
    this.emittedResult = true;
    return stepUpSetResultToLegacySetResult(this.state.plan, summarizeStepUpSetResult(this.state));
  }

  serialize(): SerializedStepUpAlternationSetRuntime {
    return {
      kind: 'step_up_alternation',
      schemaVersion: 1,
      state: serializeStepUpAlternationRuntimeState(this.state),
      adapter: this.adapter.serialize(),
    };
  }

  getState(): StepUpAlternationRuntimeState {
    return this.state;
  }

  private applyTerminalEvidence(
    timestampMs: number,
    terminal: {
      readonly trackingValid: boolean;
      readonly bothFeetReturnedToFloor: boolean;
    }
  ): void {
    const attemptId = this.state.currentRepAttemptId;
    if (!attemptId) return;
    const observedLeadSide = this.attemptObservedLeadSide;
    const evidence = resolveStepUpRepEvidence({
      repAttemptId: attemptId,
      expectedLeadSide: this.state.expectedLeadSide,
      observedLeadSide,
      startedAtMs: this.attemptStartedAtMs ?? timestampMs,
      topReachedAtMs: this.attemptTopReachedAtMs,
      returnedToFloorAtMs: terminal.bothFeetReturnedToFloor ? timestampMs : null,
      bothFeetAtStart: true,
      expectedLeadInitiatedAscent: observedLeadSide === this.state.expectedLeadSide,
      topPhaseValid: this.attemptTopReachedAtMs !== null,
      bothFeetReturnedToFloor: terminal.bothFeetReturnedToFloor,
      trackingValid: terminal.trackingValid,
    });
    this.state = advanceStepUpAlternationState(this.state, {
      type: 'APPLY_REP_EVIDENCE',
      evidence,
    });
    this.clearAttempt();
  }

  private fillSetUpdate(): SetGraderUpdate {
    const live = this.live;
    live.repCredited = false;
    live.repCount = this.state.acceptedRepCount;
    live.measuring = this.state.phase !== 'set_setup' && this.state.phase !== 'tracking_recovery';
    live.holdMs = 0;
    live.remainingMs = NaN;
    live.validTimeState = null;
    live.validTimeCaption = null;
    live.autoregulationStop = false;
    live.complete = this.state.phase === 'set_complete';
    live.voice = null;
    return live;
  }

  private context(): StepUpAlternationRuntimeUpdate['stepUpContext'] {
    return {
      plan: this.state.plan,
      expectedLeadSide: this.state.expectedLeadSide,
      startLeadSide: this.state.startLeadSide,
      acceptedRepCount: this.state.acceptedRepCount,
      leftLeadRepCount: this.state.leftLeadRepCount,
      rightLeadRepCount: this.state.rightLeadRepCount,
      targetTotalReps: this.state.plan.targetTotalReps,
    };
  }

  private clearAttempt(): void {
    this.attemptStartedAtMs = null;
    this.attemptObservedLeadSide = null;
    this.attemptObservedAtMs = null;
    this.attemptTopReachedAtMs = null;
    this.attemptHadMovement = false;
  }
}

function freshSetUpdate(): SetGraderUpdate {
  return {
    repCredited: false,
    repCount: 0,
    measuring: false,
    holdMs: 0,
    remainingMs: NaN,
    validTimeState: null,
    validTimeCaption: null,
    autoregulationStop: false,
    complete: false,
    voice: null,
  };
}
