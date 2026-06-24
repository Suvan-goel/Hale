/**
 * Typed protocol setup metadata for the V2 Movement Profile battery.
 *
 * V2 setup is part of measurement, not screen garnish: side choice, standing
 * leg choice, and uncertainty all travel into the raw result so future scoring
 * can decide whether a record is reference-comparable or raw-only.
 */

export type BodySide = 'left' | 'right';
export type ProtocolSetupSource = 'user' | 'prior_record' | 'default' | 'direct_call';
export type ProtocolSetupConfidence = 'confirmed' | 'uncertain' | 'bypassed';

export interface ChairRiseV2Setup {
  protocol: 'chair_rise_v2_setup';
  confirmed: boolean;
  confidence: ProtocolSetupConfidence;
  source: ProtocolSetupSource;
}

export interface OneLegBalanceV2Setup {
  protocol: 'one_leg_balance_v2_setup';
  standingLeg: BodySide;
  confirmed: boolean;
  confidence: ProtocolSetupConfidence;
  source: ProtocolSetupSource;
  priorStandingLeg: BodySide | null;
  changedFromPrior: boolean;
}

export interface ActiveShoulderReachV2Setup {
  protocol: 'active_shoulder_reach_v2_setup';
  selectedSide: BodySide;
  confirmed: boolean;
  confidence: ProtocolSetupConfidence;
  source: ProtocolSetupSource;
  priorSelectedSide: BodySide | null;
  changedFromPrior: boolean;
}

export type MovementProfileV2Setup =
  | ChairRiseV2Setup
  | OneLegBalanceV2Setup
  | ActiveShoulderReachV2Setup;

export function createChairRiseV2Setup({
  confirmed,
  source = 'user',
}: {
  confirmed: boolean;
  source?: ProtocolSetupSource;
}): ChairRiseV2Setup {
  return {
    protocol: 'chair_rise_v2_setup',
    confirmed,
    confidence: confidenceFor(confirmed, source),
    source,
  };
}

export function createOneLegBalanceV2Setup({
  standingLeg,
  confirmed,
  source = 'user',
  priorStandingLeg = null,
}: {
  standingLeg: BodySide;
  confirmed: boolean;
  source?: ProtocolSetupSource;
  priorStandingLeg?: BodySide | null;
}): OneLegBalanceV2Setup {
  return {
    protocol: 'one_leg_balance_v2_setup',
    standingLeg,
    confirmed,
    confidence: confidenceFor(confirmed, source),
    source,
    priorStandingLeg,
    changedFromPrior: priorStandingLeg !== null && priorStandingLeg !== standingLeg,
  };
}

export function createActiveShoulderReachV2Setup({
  selectedSide,
  confirmed,
  source = 'user',
  priorSelectedSide = null,
}: {
  selectedSide: BodySide;
  confirmed: boolean;
  source?: ProtocolSetupSource;
  priorSelectedSide?: BodySide | null;
}): ActiveShoulderReachV2Setup {
  return {
    protocol: 'active_shoulder_reach_v2_setup',
    selectedSide,
    confirmed,
    confidence: confidenceFor(confirmed, source),
    source,
    priorSelectedSide,
    changedFromPrior: priorSelectedSide !== null && priorSelectedSide !== selectedSide,
  };
}

export function setupHasUserConfirmation(setup: MovementProfileV2Setup | null | undefined): boolean {
  return !!setup && setup.confirmed && setup.source !== 'direct_call' && setup.confidence === 'confirmed';
}

function confidenceFor(confirmed: boolean, source: ProtocolSetupSource): ProtocolSetupConfidence {
  if (source === 'direct_call') return 'bypassed';
  return confirmed ? 'confirmed' : 'uncertain';
}
