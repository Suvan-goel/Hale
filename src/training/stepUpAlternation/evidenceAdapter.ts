import { CHAIN_IDS, RELIABLE_THRESHOLD } from '../../pose/chains';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { LM, type PoseFrame } from '../../pose/types';
import type { StepUpLeadSide } from './types';

const LEFT_CHAIN_INDEX = CHAIN_IDS.indexOf('leftSide');
const RIGHT_CHAIN_INDEX = CHAIN_IDS.indexOf('rightSide');

const FOOT_VISIBILITY_THRESHOLD = 0.45;
const BASELINE_DWELL_FRAMES = 8;
const CANDIDATE_DWELL_FRAMES = 2;
const TOP_DWELL_FRAMES = 2;
const RETURN_DWELL_FRAMES = 3;
const BASELINE_STABILITY_BU = 0.05;
const FLOOR_TOLERANCE_BU = 0.1;
const LEAD_LIFT_ENTER_BU = 0.18;
const TOP_LIFT_ENTER_BU = 0.14;

export interface StepUpFrameObservation {
  readonly timestampMs: number;
  readonly trackingValid: boolean;
  readonly leftFootReliable: boolean;
  readonly rightFootReliable: boolean;
  readonly bothFeetFloorReady: boolean;
  readonly observedLeadCandidate: StepUpLeadSide | null;
  readonly ascentStarted: boolean;
  readonly topPhaseValid: boolean;
  readonly returnToFloorValid: boolean;
  readonly reasonCodes: readonly string[];
}

export interface StepUpEvidenceSetup {
  readonly setIndex: number;
}

export interface StepUpEvidenceRepSetup {
  readonly repAttemptId: string;
  readonly expectedLeadSide: StepUpLeadSide;
}

export interface StepUpEvidenceAdapterSnapshot {
  readonly schemaVersion: 1;
  readonly floorBaseline:
    | {
        readonly leftFootY: number;
        readonly rightFootY: number;
      }
    | null;
}

export interface StepUpAlternationEvidenceAdapter {
  resetForSet(input: StepUpEvidenceSetup): void;
  resetForRep(input: StepUpEvidenceRepSetup): void;
  update(frame: PipelineFrameOutput): StepUpFrameObservation[];
  serialize(): StepUpEvidenceAdapterSnapshot;
  restore(snapshot: StepUpEvidenceAdapterSnapshot | null | undefined): void;
}

export function createStepUpAlternationEvidenceAdapter(): StepUpAlternationEvidenceAdapter {
  return new DefaultStepUpAlternationEvidenceAdapter();
}

class DefaultStepUpAlternationEvidenceAdapter implements StepUpAlternationEvidenceAdapter {
  private baselineLeftY: number | null = null;
  private baselineRightY: number | null = null;
  private baselineFirstLeftY = 0;
  private baselineFirstRightY = 0;
  private baselineSumLeftY = 0;
  private baselineSumRightY = 0;
  private baselineFrames = 0;

  private candidateSide: StepUpLeadSide | null = null;
  private candidateFrames = 0;
  private observedLeadSide: StepUpLeadSide | null = null;
  private topFrames = 0;
  private topSeen = false;
  private returnFrames = 0;
  private returnSeen = false;
  private readonly observation: StepUpFrameObservation[] = [emptyObservation(0)];
  private readonly reasonCodes: string[] = [];

  resetForSet(): void {
    this.baselineLeftY = null;
    this.baselineRightY = null;
    this.baselineFirstLeftY = 0;
    this.baselineFirstRightY = 0;
    this.baselineSumLeftY = 0;
    this.baselineSumRightY = 0;
    this.baselineFrames = 0;
    this.resetRepState();
  }

  resetForRep(): void {
    this.resetRepState();
  }

  serialize(): StepUpEvidenceAdapterSnapshot {
    return {
      schemaVersion: 1,
      floorBaseline:
        this.baselineLeftY !== null && this.baselineRightY !== null
          ? { leftFootY: this.baselineLeftY, rightFootY: this.baselineRightY }
          : null,
    };
  }

  restore(snapshot: StepUpEvidenceAdapterSnapshot | null | undefined): void {
    if (
      snapshot?.schemaVersion === 1 &&
      snapshot.floorBaseline &&
      Number.isFinite(snapshot.floorBaseline.leftFootY) &&
      Number.isFinite(snapshot.floorBaseline.rightFootY)
    ) {
      this.baselineLeftY = snapshot.floorBaseline.leftFootY;
      this.baselineRightY = snapshot.floorBaseline.rightFootY;
      this.baselineFrames = BASELINE_DWELL_FRAMES;
    }
    this.resetRepState();
  }

  update(out: PipelineFrameOutput): StepUpFrameObservation[] {
    const ts = out.frame.timestampMs;
    this.reasonCodes.length = 0;
    const leftFootReliable = footReliable(out.frame, 'left') && out.chainReliability[LEFT_CHAIN_INDEX] >= RELIABLE_THRESHOLD;
    const rightFootReliable = footReliable(out.frame, 'right') && out.chainReliability[RIGHT_CHAIN_INDEX] >= RELIABLE_THRESHOLD;
    const streamInterrupted = out.events.some(
      (event) => event.type === 'subject-gone' || event.type === 'tracking-interrupted'
    );
    const trackingValid =
      !streamInterrupted &&
      out.state === 'tracking' &&
      out.frame.hasPose &&
      out.bodyUnit !== null &&
      leftFootReliable &&
      rightFootReliable;

    if (!trackingValid || out.bodyUnit === null) {
      if (streamInterrupted) this.reasonCodes.push('tracking_interrupted');
      else this.reasonCodes.push('tracking_not_valid');
      this.resetRepState();
      return this.setObservation(ts, {
        trackingValid: false,
        leftFootReliable,
        rightFootReliable,
        bothFeetFloorReady: false,
        observedLeadCandidate: null,
        ascentStarted: false,
        topPhaseValid: false,
        returnToFloorValid: false,
      });
    }

    const bodyUnit = out.bodyUnit;
    const leftFootY = footY(out.frame, 'left');
    const rightFootY = footY(out.frame, 'right');
    if (this.baselineLeftY === null || this.baselineRightY === null) {
      this.updateBaseline(leftFootY, rightFootY, bodyUnit);
      return this.setObservation(ts, {
        trackingValid,
        leftFootReliable,
        rightFootReliable,
        bothFeetFloorReady: this.baselineLeftY !== null && this.baselineRightY !== null,
        observedLeadCandidate: null,
        ascentStarted: false,
        topPhaseValid: false,
        returnToFloorValid: false,
      });
    }

    const leftLiftBu = (this.baselineLeftY - leftFootY) / bodyUnit;
    const rightLiftBu = (this.baselineRightY - rightFootY) / bodyUnit;
    const leftAtFloor = Math.abs(leftLiftBu) <= FLOOR_TOLERANCE_BU;
    const rightAtFloor = Math.abs(rightLiftBu) <= FLOOR_TOLERANCE_BU;
    const bothFeetFloorReady = leftAtFloor && rightAtFloor;
    const leadCandidate = this.resolveLeadCandidate(leftLiftBu, rightLiftBu, leftAtFloor, rightAtFloor);
    const ascentStarted = this.observedLeadSide !== null || this.candidateSide !== null;

    if (this.observedLeadSide !== null && leftLiftBu >= TOP_LIFT_ENTER_BU && rightLiftBu >= TOP_LIFT_ENTER_BU) {
      this.topFrames++;
      if (this.topFrames >= TOP_DWELL_FRAMES) this.topSeen = true;
    } else if (!this.topSeen) {
      this.topFrames = 0;
    }

    if (this.topSeen && bothFeetFloorReady) {
      this.returnFrames++;
      if (this.returnFrames >= RETURN_DWELL_FRAMES) this.returnSeen = true;
    } else if (!bothFeetFloorReady) {
      this.returnFrames = 0;
    }

    return this.setObservation(ts, {
      trackingValid,
      leftFootReliable,
      rightFootReliable,
      bothFeetFloorReady,
      observedLeadCandidate: leadCandidate,
      ascentStarted,
      topPhaseValid: this.topSeen,
      returnToFloorValid: this.returnSeen,
    });
  }

  private updateBaseline(leftFootY: number, rightFootY: number, bodyUnit: number): void {
    if (this.baselineFrames === 0) {
      this.baselineFirstLeftY = leftFootY;
      this.baselineFirstRightY = rightFootY;
      this.baselineSumLeftY = leftFootY;
      this.baselineSumRightY = rightFootY;
      this.baselineFrames = 1;
      this.reasonCodes.push('floor_baseline_collecting');
      return;
    }

    const stable =
      Math.abs(leftFootY - this.baselineFirstLeftY) / bodyUnit <= BASELINE_STABILITY_BU &&
      Math.abs(rightFootY - this.baselineFirstRightY) / bodyUnit <= BASELINE_STABILITY_BU;
    if (!stable) {
      this.baselineFrames = 0;
      this.baselineSumLeftY = 0;
      this.baselineSumRightY = 0;
      this.reasonCodes.push('floor_baseline_unstable');
      return;
    }

    this.baselineFrames++;
    this.baselineSumLeftY += leftFootY;
    this.baselineSumRightY += rightFootY;
    if (this.baselineFrames >= BASELINE_DWELL_FRAMES) {
      this.baselineLeftY = this.baselineSumLeftY / this.baselineFrames;
      this.baselineRightY = this.baselineSumRightY / this.baselineFrames;
      this.reasonCodes.push('floor_baseline_ready');
    } else {
      this.reasonCodes.push('floor_baseline_collecting');
    }
  }

  private resolveLeadCandidate(
    leftLiftBu: number,
    rightLiftBu: number,
    leftAtFloor: boolean,
    rightAtFloor: boolean
  ): StepUpLeadSide | null {
    if (this.observedLeadSide) return this.observedLeadSide;
    const leftMoved = leftLiftBu >= LEAD_LIFT_ENTER_BU;
    const rightMoved = rightLiftBu >= LEAD_LIFT_ENTER_BU;
    let nextCandidate: StepUpLeadSide | null = null;
    if (leftMoved && rightAtFloor && !rightMoved) nextCandidate = 'left';
    else if (rightMoved && leftAtFloor && !leftMoved) nextCandidate = 'right';
    else if (leftMoved && rightMoved) this.reasonCodes.push('lead_ambiguous_both_feet_moved');

    if (!nextCandidate) {
      this.candidateSide = null;
      this.candidateFrames = 0;
      return null;
    }

    if (this.candidateSide === nextCandidate) {
      this.candidateFrames++;
    } else {
      this.candidateSide = nextCandidate;
      this.candidateFrames = 1;
    }
    if (this.candidateFrames >= CANDIDATE_DWELL_FRAMES) {
      this.observedLeadSide = nextCandidate;
      this.reasonCodes.push(`lead_candidate_${nextCandidate}`);
      return nextCandidate;
    }
    this.reasonCodes.push(`lead_candidate_${nextCandidate}_collecting`);
    return null;
  }

  private setObservation(
    timestampMs: number,
    patch: Omit<StepUpFrameObservation, 'timestampMs' | 'reasonCodes'>
  ): StepUpFrameObservation[] {
    this.observation[0] = {
      timestampMs,
      ...patch,
      reasonCodes: this.reasonCodes.slice(),
    };
    return this.observation;
  }

  private resetRepState(): void {
    this.candidateSide = null;
    this.candidateFrames = 0;
    this.observedLeadSide = null;
    this.topFrames = 0;
    this.topSeen = false;
    this.returnFrames = 0;
    this.returnSeen = false;
  }
}

function emptyObservation(timestampMs: number): StepUpFrameObservation {
  return {
    timestampMs,
    trackingValid: false,
    leftFootReliable: false,
    rightFootReliable: false,
    bothFeetFloorReady: false,
    observedLeadCandidate: null,
    ascentStarted: false,
    topPhaseValid: false,
    returnToFloorValid: false,
    reasonCodes: [],
  };
}

function footReliable(frame: PoseFrame, side: StepUpLeadSide): boolean {
  const landmarks = side === 'left'
    ? [LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX]
    : [LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX];
  return landmarks.every(
    (landmark) =>
      frame.visibility[landmark] >= FOOT_VISIBILITY_THRESHOLD &&
      frame.presence[landmark] >= FOOT_VISIBILITY_THRESHOLD
  );
}

function footY(frame: PoseFrame, side: StepUpLeadSide): number {
  if (side === 'left') {
    return (frame.ys[LM.LEFT_ANKLE] + frame.ys[LM.LEFT_HEEL] + frame.ys[LM.LEFT_FOOT_INDEX]) / 3;
  }
  return (frame.ys[LM.RIGHT_ANKLE] + frame.ys[LM.RIGHT_HEEL] + frame.ys[LM.RIGHT_FOOT_INDEX]) / 3;
}
