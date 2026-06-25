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
import type { MicroCheckResult } from '../microCheck';
import {
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

  it('does not borrow an official balance side for mobility reach', () => {
    const setup = deriveMicroCheckSideSetup({
      microCheckType: 'mobility-reach',
      officialCheckUps: [officialBalanceRecord('right', '2026-06-01T09:00:00.000Z')],
    });

    expect(setup).toMatchObject({
      recommendationSource: 'user_choice_required',
      selectedSide: null,
      role: 'extended_leg',
    });
    expect(setup.reasonCodes).toContain('MOBILITY_OFFICIAL_ANCHOR_NOT_SUPPORTED');
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
});

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
