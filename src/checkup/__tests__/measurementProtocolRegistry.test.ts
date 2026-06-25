import {
  descriptorForMicroCheck,
  descriptorForMovementMeasurement,
  getMeasurementProtocolDescriptor,
  listMeasurementProtocols,
  protocolRefForDescriptor,
} from '../measurementProtocolRegistry';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../protocolPolicy';
import { ACTIVE_SHOULDER_REACH_V2_ID } from '../../movements/activeShoulderReachV2';
import {
  BALANCE_EYES_OPEN_V2_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
} from '../../movements/balanceEyesOpenV2';
import { CHAIR_RISE_V2_ID } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID } from '../../movements/oneLegBalanceV2';
import { BALANCE_LADDER_ID, CHAIR_STAND_ID, HINGE_REACH_ID, TUG_ID } from '../../movements';

describe('measurement protocol registry', () => {
  it('registers stable protocol ids and positive versions for current persisted measurements', () => {
    const protocols = listMeasurementProtocols();
    expect(protocols.length).toBe(16);
    expect(new Set(protocols.map((protocol) => `${protocol.protocolId}@${protocol.protocolVersion}`)).size).toBe(protocols.length);
    expect(protocols.every((protocol) => protocol.protocolVersion > 0)).toBe(true);
  });

  it('keeps side requirements and roles internally consistent', () => {
    const protocols = listMeasurementProtocols();
    expect(protocols.filter((protocol) => protocol.sideRequired)).toHaveLength(7);
    expect(protocols.filter((protocol) => !protocol.sideRequired)).toHaveLength(9);
    expect(protocols.filter((protocol) => protocol.sideRequired).every((protocol) => protocol.sideRole !== 'not_applicable')).toBe(true);
    expect(protocols.filter((protocol) => !protocol.sideRequired).every((protocol) => protocol.sideRole === 'not_applicable')).toBe(true);
  });

  it('covers legacy, MPV2, TUG, micro-check, and eyes-open balance procedures separately', () => {
    expect(descriptorForMovementMeasurement({ movementId: CHAIR_STAND_ID })?.protocolId).toBe('legacy_chair_stand_30s');
    expect(descriptorForMovementMeasurement({ movementId: BALANCE_LADDER_ID })?.protocolId).toBe('legacy_balance_ladder_v1');
    expect(descriptorForMovementMeasurement({ movementId: CHAIR_RISE_V2_ID })?.protocolId).toBe('mpv2_chair_rise_30s_v1');
    expect(descriptorForMovementMeasurement({ movementId: ONE_LEG_BALANCE_V2_ID })?.protocolId).toBe('mpv2_single_leg_balance_45s_v1');
    expect(descriptorForMovementMeasurement({ movementId: BALANCE_EYES_OPEN_V2_ID })).toMatchObject({
      protocolId: BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
      protocolVersion: BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
      sideRole: 'standing_leg',
      sideRequired: true,
    });
    expect(descriptorForMovementMeasurement({ movementId: ACTIVE_SHOULDER_REACH_V2_ID })?.protocolId).toBe('mpv2_active_shoulder_reach_v1');
    expect(
      descriptorForMovementMeasurement({ movementId: HINGE_REACH_ID, policyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID })
        ?.protocolId
    ).toBe('mpv2_hinge_reach_v1');
    expect(descriptorForMicroCheck('chair-power').protocolId).toBe('micro_chair_power_5_reps_v1');
    expect(getMeasurementProtocolDescriptor('mpv2_single_leg_balance_45s_v1')).not.toBeNull();
    expect(getMeasurementProtocolDescriptor(BALANCE_EYES_OPEN_V2_PROTOCOL_ID, BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION)).not.toBeNull();
  });

  it('preserves TUG variant metadata and fails safely for unknown legacy ids', () => {
    const tug = descriptorForMovementMeasurement({ movementId: TUG_ID, protocolVariant: 'short_path' })!;
    expect(protocolRefForDescriptor(tug, 'short_path')).toMatchObject({
      protocolId: 'tug_beta_lateral_v1',
      protocolVersion: 1,
      protocolVariant: 'short_path',
    });
    expect(getMeasurementProtocolDescriptor('missing_protocol')).toBeNull();
    expect(descriptorForMovementMeasurement({ movementId: 'missing-movement' })).toBeNull();
  });
});
