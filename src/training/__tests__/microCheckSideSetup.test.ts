import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
  measurementResultId,
} from '../../checkup';
import type { CheckUp } from '../../checkup';
import { ONE_LEG_BALANCE_V2_ID } from '../../movements/oneLegBalanceV2';
import { BALANCE_EYES_OPEN_V2_ID } from '../../movements/balanceEyesOpenV2';
import {
  createCapturedBalanceEyesOpenV2Result,
  createCapturedOneLegBalanceV2Result,
} from '../../movementProfileV2/internalCheckupFlow';
import { CHAIN_IDS } from '../../pose/chains';
import type { PipelineFrameOutput, TrackingState } from '../../pose/pipeline';
import { createPoseFrame, LM } from '../../pose/types';
import type { MicroCheckResult } from '../microCheck';
import {
  MicroCheckCameraSideResolver,
  createMicroCheckMeasurementContextForSide,
  deriveMicroCheckSideSetup,
} from '../microCheckSideSetup';

describe('micro-check side setup', () => {
  it('does not show a side selector for chair power', () => {
    const setup = deriveMicroCheckSideSetup({ microCheckType: 'chair-power' });

    expect(setup).toMatchObject({
      sideRequired: false,
      role: 'not_applicable',
      recommendationSource: 'not_applicable',
      selectedSide: null,
    });
  });

  it('requires an explicit balance side when no micro or official anchor exists', () => {
    const setup = deriveMicroCheckSideSetup({ microCheckType: 'single-leg-balance' });

    expect(setup).toMatchObject({
      sideRequired: true,
      role: 'standing_leg',
      recommendationSource: 'user_choice_required',
      selectedSide: null,
      establishesNewSeries: true,
    });
  });

  it('can recommend the standing leg from a compatible official balance anchor without comparing to it', () => {
    const official = officialBalanceRecord('left', '2026-06-01T09:00:00.000Z');
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'single-leg-balance',
      officialCheckUps: [official],
    });
    const context = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      selectedSide: 'left',
    });

    expect(setup).toMatchObject({
      selectedSide: 'left',
      anchorSide: 'left',
      anchorResultId: measurementResultId(official.checkUp.startedAt, ONE_LEG_BALANCE_V2_ID),
      recommendationSource: 'compatible_official_anchor',
      establishesNewSeries: true,
    });
    expect(context.side.source).toBe('microcheck_official_anchor');
    expect(context.side.anchorResultId).toBe(measurementResultId('2026-06-21T08:00:00.000Z', 'single-leg-balance'));
    expect(context.comparability.overallStatus).toBe('establishes_new_baseline');
    expect(context.comparability.referenceResultId).toBeNull();
  });

  it('prefers the new eyes-open official standing-leg anchor over the old MPV2 fallback', () => {
    const oldOfficial = officialBalanceRecord('left', '2026-06-01T09:00:00.000Z');
    const newOfficial = officialEyesOpenBalanceRecord('right', '2026-06-20T09:00:00.000Z');
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'single-leg-balance',
      officialCheckUps: [oldOfficial, newOfficial],
    });

    expect(setup).toMatchObject({
      selectedSide: 'right',
      anchorSide: 'right',
      anchorResultId: measurementResultId(newOfficial.checkUp.startedAt, BALANCE_EYES_OPEN_V2_ID),
      recommendationSource: 'compatible_official_anchor',
      establishesNewSeries: true,
    });
  });

  it('does not require side setup for mobility reach', () => {
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'mobility-reach',
      officialCheckUps: [officialBalanceRecord('right', '2026-06-01T09:00:00.000Z')],
    });

    expect(setup).toMatchObject({
      sideRequired: false,
      recommendationSource: 'not_applicable',
      selectedSide: null,
      role: 'not_applicable',
    });
    expect(setup.reasonCodes).toEqual(['MICRO_CHECK_SIDE_NOT_REQUIRED']);
  });

  it('prefers an existing side-known micro-check series over official recommendations', () => {
    const firstSetup = deriveMicroCheckSideSetup({ microCheckType: 'single-leg-balance' });
    const firstContext = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-10T08:00:00.000Z',
      setup: firstSetup,
      selectedSide: 'right',
    });
    const prior: MicroCheckResult = {
      type: 'single-leg-balance',
      startedAt: '2026-06-10T08:00:00.000Z',
      value: 14,
      reps: 0,
      measured: true,
      measurementContext: firstContext,
    };

    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'single-leg-balance',
      history: [prior],
      officialCheckUps: [officialBalanceRecord('left', '2026-06-01T09:00:00.000Z')],
    });
    const sameSide = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      selectedSide: 'right',
    });
    const oppositeSide = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-28T08:00:00.000Z',
      setup,
      selectedSide: 'left',
    });

    expect(setup).toMatchObject({
      recommendationSource: 'existing_microcheck_series',
      selectedSide: 'right',
      anchorResultId: measurementResultId(prior.startedAt, prior.type),
    });
    expect(sameSide.comparability.overallStatus).toBe('comparable');
    expect(oppositeSide.side.source).toBe('opposite_side_fallback');
    expect(oppositeSide.comparability.overallStatus).toBe('reduced_comparability');
  });

  it('infers a balance standing leg from stable camera evidence and records camera source metadata', () => {
    const setup = deriveMicroCheckSideSetup({ microCheckType: 'single-leg-balance' });
    const resolver = new MicroCheckCameraSideResolver();
    const first = { ...resolver.update(
      poseOutput({ timestampMs: 1000, leftAnkleY: 0.72, rightAnkleY: 0.5 }),
      'single-leg-balance',
      setup
    ) };
    const ready = resolver.update(
      poseOutput({ timestampMs: 1800, leftAnkleY: 0.72, rightAnkleY: 0.5 }),
      'single-leg-balance',
      setup
    );

    expect(first).toMatchObject({ ready: false, selectedSide: 'left', reason: 'hold_still' });
    expect(ready).toMatchObject({
      ready: true,
      selectedSide: 'left',
      observedSide: 'left',
      source: 'camera_inferred',
      reason: 'ready',
    });

    const context = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      selectedSide: ready.selectedSide,
      observedSide: ready.observedSide,
      source: ready.source ?? undefined,
      userConfirmed: false,
    });

    expect(context.side).toMatchObject({
      role: 'standing_leg',
      selectedSide: 'left',
      observedSide: 'left',
      source: 'camera_inferred',
      userConfirmed: false,
    });
    expect(context.comparability.overallStatus).toBe('establishes_new_baseline');
  });

  it('marks camera-verified balance setup from a compatible official anchor as a prior record verification', () => {
    const official = officialBalanceRecord('right', '2026-06-01T09:00:00.000Z');
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'single-leg-balance',
      officialCheckUps: [official],
    });
    const resolver = new MicroCheckCameraSideResolver();
    resolver.update(
      poseOutput({ timestampMs: 1000, leftAnkleY: 0.45, rightAnkleY: 0.68 }),
      'single-leg-balance',
      setup
    );
    const ready = resolver.update(
      poseOutput({ timestampMs: 1800, leftAnkleY: 0.45, rightAnkleY: 0.68 }),
      'single-leg-balance',
      setup
    );
    const context = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      selectedSide: ready.selectedSide,
      source: ready.source ?? undefined,
      userConfirmed: false,
    });

    expect(ready).toMatchObject({ ready: true, selectedSide: 'right', source: 'prior_record_camera_verified' });
    expect(context.side.source).toBe('prior_record_camera_verified');
    expect(context.side.userConfirmed).toBe(false);
    expect(context.comparability.overallStatus).toBe('establishes_new_baseline');
  });

  it('marks camera-verified same-side micro-check setup as prior micro-check verification', () => {
    const firstSetup = deriveMicroCheckSideSetup({ microCheckType: 'single-leg-balance' });
    const firstContext = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-10T08:00:00.000Z',
      setup: firstSetup,
      selectedSide: 'left',
      source: 'camera_inferred',
      userConfirmed: false,
    });
    const prior: MicroCheckResult = {
      type: 'single-leg-balance',
      startedAt: '2026-06-10T08:00:00.000Z',
      value: 12,
      reps: 0,
      measured: true,
      measurementContext: firstContext,
    };
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'single-leg-balance',
      history: [prior],
    });
    const resolver = new MicroCheckCameraSideResolver();
    resolver.update(
      poseOutput({ timestampMs: 1000, leftAnkleY: 0.72, rightAnkleY: 0.5 }),
      'single-leg-balance',
      setup
    );
    const ready = resolver.update(
      poseOutput({ timestampMs: 1800, leftAnkleY: 0.72, rightAnkleY: 0.5 }),
      'single-leg-balance',
      setup
    );
    const context = createMicroCheckMeasurementContextForSide({
      microCheckType: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      selectedSide: ready.selectedSide,
      source: ready.source ?? undefined,
      userConfirmed: false,
    });

    expect(ready).toMatchObject({ ready: true, selectedSide: 'left', source: 'prior_micro_check_camera_verified' });
    expect(context.side.source).toBe('prior_micro_check_camera_verified');
    expect(context.comparability.overallStatus).toBe('comparable');
  });

  it('does not run a side resolver for mobility reach', () => {
    const setup = deriveMicroCheckSideSetup({ microCheckType: 'mobility-reach' });
    const resolver = new MicroCheckCameraSideResolver();
    const ready = resolver.update(
      poseOutput({ timestampMs: 1800, leftReliability: 0.86, rightReliability: 0.22 }),
      'mobility-reach',
      setup
    );
    const context = createMicroCheckMeasurementContextForSide({
      microCheckType: 'mobility-reach',
      startedAt: '2026-06-21T08:00:00.000Z',
      setup,
      userConfirmed: false,
    });

    expect(ready).toMatchObject({ ready: true, selectedSide: null, source: 'not_applicable' });
    expect(context.side).toMatchObject({
      role: 'not_applicable',
      selectedSide: null,
      source: 'not_applicable',
      userConfirmed: false,
    });
  });

  it('does not expose manual side fallback for mobility reach', () => {
    const setup = deriveMicroCheckSideSetup({ microCheckType: 'mobility-reach' });
    const resolver = new MicroCheckCameraSideResolver();
    const first = { ...resolver.update(
      poseOutput({ timestampMs: 1000, state: 'warmup', leftReliability: 0.1, rightReliability: 0.1 }),
      'mobility-reach',
      setup
    ) };
    const later = resolver.update(
      poseOutput({ timestampMs: 13200, state: 'tracking', leftReliability: 0.2, rightReliability: 0.2 }),
      'mobility-reach',
      setup
    );

    expect(first).toMatchObject({ ready: true, fallbackAvailable: false });
    expect(later).toMatchObject({
      ready: true,
      selectedSide: null,
      fallbackAvailable: false,
      reason: 'not_required',
    });
  });
});

function poseOutput({
  timestampMs,
  state = 'tracking',
  bodyUnit = 1,
  leftReliability = 0.9,
  rightReliability = 0.9,
  leftAnkleY = 0.62,
  rightAnkleY = 0.62,
}: {
  timestampMs: number;
  state?: TrackingState;
  bodyUnit?: number | null;
  leftReliability?: number;
  rightReliability?: number;
  leftAnkleY?: number;
  rightAnkleY?: number;
}): PipelineFrameOutput {
  const frame = createPoseFrame();
  frame.timestampMs = timestampMs;
  frame.hasPose = true;
  frame.visibility.fill(1);
  frame.presence.fill(1);
  frame.ys[LM.LEFT_ANKLE] = leftAnkleY;
  frame.ys[LM.RIGHT_ANKLE] = rightAnkleY;
  const chainReliability = new Float64Array(CHAIN_IDS.length);
  chainReliability[CHAIN_IDS.indexOf('leftSide')] = leftReliability;
  chainReliability[CHAIN_IDS.indexOf('rightSide')] = rightReliability;
  const reliableSideChains =
    (leftReliability >= 0.45 ? 1 : 0) + (rightReliability >= 0.45 ? 1 : 0);
  return {
    state,
    inferenceMs: null,
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability,
    reliableSideChains,
    validity: { valid: true, reason: 'ok' },
    bodyUnit,
    events: [],
    fps: 30,
  } as unknown as PipelineFrameOutput;
}

function officialBalanceRecord(side: 'left' | 'right', startedAt: string): { checkUp: CheckUp; checkupType: 'baseline' } {
  return {
    checkupType: 'baseline',
    checkUp: {
      startedAt,
      protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
      bodyUnit: 1,
      items: [
        {
          movementId: ONE_LEG_BALANCE_V2_ID,
          status: 'measured',
          result: createCapturedOneLegBalanceV2Result({ standingLeg: side, holdsSec: [18] }),
        },
      ],
    },
  };
}

function officialEyesOpenBalanceRecord(side: 'left' | 'right', startedAt: string): { checkUp: CheckUp; checkupType: 'baseline' } {
  return {
    checkupType: 'baseline',
    checkUp: {
      startedAt,
      protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
      bodyUnit: 1,
      items: [
        {
          movementId: BALANCE_EYES_OPEN_V2_ID,
          status: 'measured',
          result: createCapturedBalanceEyesOpenV2Result({ standingLeg: side }),
        },
      ],
    },
  };
}
