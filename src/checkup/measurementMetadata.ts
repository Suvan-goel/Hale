import type { CheckupType } from '../adherence/types';
import { ACTIVE_SHOULDER_REACH_V2_ID } from '../movements/activeShoulderReachV2';
import { BALANCE_EYES_OPEN_V2_ID } from '../movements/balanceEyesOpenV2';
import { ONE_LEG_BALANCE_V2_ID } from '../movements/oneLegBalanceV2';
import type { MicroCheckType } from '../training/microCheck';
import {
  deriveMeasurementComparability,
  measurementContextsAllowChangeClaim,
} from './measurementComparability';
import {
  createNotApplicableSideContext,
  createUnknownMeasurementContext,
  isBodySide,
  measurementContextMetadataRichness,
  measurementResultId,
  normalizeProtocolRef,
  parseMeasurementContext,
  type BodySide,
  type MeasurementContext,
  type MeasurementProtocolRef,
  type MeasurementSideContext,
  type MeasurementSideSource,
} from './measurementContext';
import {
  batteryProtocolRefForPolicy,
  descriptorForMicroCheck,
  descriptorForMovementMeasurement,
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V2,
  protocolRefForDescriptor,
  protocolVariantForMovementResult,
  type MeasurementProtocolDescriptor,
} from './measurementProtocolRegistry';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  isLegacyMovementAgePolicy,
  isMovementProfileV2Policy,
  normalizeCheckUpRecordProtocolPolicy,
  type CheckUpProtocolPolicyId,
} from './protocolPolicy';
import type { CheckUp, CheckUpItem } from './types';

export interface NormalizeCheckUpMeasurementMetadataOptions {
  checkupType?: CheckupType | null;
}

export interface NormalizeMicroCheckMeasurementMetadataOptions {
  measurementContext?: MeasurementContext | null;
  selectedSide?: BodySide | null;
  observedSide?: BodySide | null;
  source?: MeasurementSideSource;
  userConfirmed?: boolean;
  anchorResultId?: string | null;
  anchorSide?: BodySide | null;
}

export interface OfficialMeasurementAnchor {
  resultId: string;
  checkUpStartedAt: string;
  movementId: string;
  comparisonGroup: string;
  protocol: MeasurementProtocolRef;
  side: BodySide;
}

export interface OfficialMeasurementAnchorInput {
  records: readonly { checkUp: CheckUp; checkupType?: CheckupType | null }[];
  comparisonGroup: string;
  protocol: MeasurementProtocolRef;
}

export function normalizeCheckUpMeasurementMetadata(
  checkUp: CheckUp,
  options: NormalizeCheckUpMeasurementMetadataOptions = {}
): CheckUp {
  const policy = normalizeCheckUpRecordProtocolPolicy(checkUp);
  const policyId = policy.supported ? policy.policy.id : null;
  const measurementProtocol = checkUp.measurementProtocol
    ? normalizeProtocolRef(checkUp.measurementProtocol)
    : batteryProtocolRefForPolicy(policyId, derivedBatteryVersionForCheckUpItems(checkUp.items, policyId));
  const items = checkUp.items.map((item) => normalizeCheckUpItemMeasurementMetadata(checkUp, item, policyId, options));
  return {
    ...checkUp,
    measurementProtocol,
    items,
  };
}

export function normalizeCheckUpItemMeasurementMetadata(
  checkUp: CheckUp,
  item: CheckUpItem,
  policyId: CheckUpProtocolPolicyId | null,
  options: NormalizeCheckUpMeasurementMetadataOptions = {}
): CheckUpItem {
  const parsed = parseMeasurementContext(item.measurementContext);
  if (parsed) return { ...item, measurementContext: parsed };
  const measurementContext = measurementContextForCheckUpItem({
    checkUpStartedAt: checkUp.startedAt,
    item,
    policyId,
    checkupType: options.checkupType ?? null,
  });
  return { ...item, measurementContext };
}

export function measurementContextForCheckUpItem({
  checkUpStartedAt,
  item,
  policyId,
  checkupType,
}: {
  checkUpStartedAt: string;
  item: CheckUpItem;
  policyId: CheckUpProtocolPolicyId | null;
  checkupType?: CheckupType | null;
}): MeasurementContext {
  const variant = protocolVariantForMovementResult(item.movementId, item.result);
  const descriptor = descriptorForMovementMeasurement({ movementId: item.movementId, policyId, protocolVariant: variant });
  if (!descriptor) return createUnknownMeasurementContext();
  const protocol = protocolRefForDescriptor(descriptor, variant);
  if (!descriptor.sideRequired) return createNotApplicableSideContext(protocol);
  return sideRequiredContextForCheckUpItem({
    checkUpStartedAt,
    item,
    descriptor,
    protocol,
    checkupType,
  });
}

export function normalizeMicroCheckMeasurementMetadata(
  result: {
    type: MicroCheckType;
    startedAt: string;
    measurementContext?: MeasurementContext;
  },
  options: NormalizeMicroCheckMeasurementMetadataOptions = {}
): MeasurementContext {
  const parsed = parseMeasurementContext(options.measurementContext ?? result.measurementContext);
  if (parsed) return parsed;
  const descriptor = descriptorForMicroCheck(result.type);
  const protocol = protocolRefForDescriptor(descriptor);
  if (!descriptor.sideRequired) return createNotApplicableSideContext(protocol);
  const selectedSide = options.selectedSide ?? null;
  if (!selectedSide) return createUnknownMeasurementContext(protocol, descriptor.sideRole);
  const side: MeasurementSideContext = {
    role: descriptor.sideRole,
    selectedSide,
    observedSide: options.observedSide ?? selectedSide,
    source: options.source ?? 'manual_user_selected',
    userConfirmed: options.userConfirmed ?? true,
    anchorResultId: options.anchorResultId ?? null,
    anchorSide: options.anchorSide ?? selectedSide,
  };
  return {
    protocol,
    side,
    comparability: deriveMeasurementComparability({ current: { protocol, side } }),
  };
}

export function checkUpMeasurementMetadataRichness(checkUp: CheckUp): number {
  let score = measurementContextMetadataRichness({
    protocol: checkUp.measurementProtocol ?? { protocolId: 'unknown_protocol', protocolVersion: 0 },
    side: {
      role: 'not_applicable',
      selectedSide: null,
      observedSide: null,
      source: 'not_applicable',
      userConfirmed: false,
      anchorResultId: null,
      anchorSide: null,
    },
    comparability: {
      sideStatus: 'not_side_dependent',
      protocolStatus: checkUp.measurementProtocol ? 'establishes_protocol_baseline' : 'protocol_unknown_raw_only',
      overallStatus: checkUp.measurementProtocol ? 'establishes_new_baseline' : 'raw_only',
      referenceResultId: null,
      reasonCodes: ['NO_REFERENCE'],
    },
  });
  for (const item of checkUp.items) score += measurementContextMetadataRichness(item.measurementContext);
  return score;
}

export function microCheckMeasurementMetadataRichness(result: { measurementContext?: MeasurementContext }): number {
  return measurementContextMetadataRichness(result.measurementContext);
}

export function findOfficialMeasurementAnchor(input: OfficialMeasurementAnchorInput): OfficialMeasurementAnchor | null {
  const sorted = input.records
    .slice()
    .sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt));
  let anchor: OfficialMeasurementAnchor | null = null;
  for (const record of sorted) {
    if (!isOfficialCheckupType(record.checkupType)) continue;
    const normalized = normalizeCheckUpMeasurementMetadata(record.checkUp, { checkupType: record.checkupType });
    for (const item of normalized.items) {
      if (item.status !== 'measured' || item.result?.flags.includes('no-measurement')) continue;
      const context = item.measurementContext;
      if (!context) continue;
      const descriptor = descriptorForMovementMeasurement({
        movementId: item.movementId,
        policyId: policyIdForCheckUp(normalized),
        protocolVariant: context.protocol.protocolVariant ?? null,
      });
      if (!descriptor || !descriptor.officialEvidenceEligible) continue;
      if (descriptor.comparisonGroup !== input.comparisonGroup) continue;
      if (context.protocol.protocolId !== input.protocol.protocolId || context.protocol.protocolVersion !== input.protocol.protocolVersion) {
        continue;
      }
      if (context.comparability.overallStatus === 'raw_only' || context.comparability.overallStatus === 'reduced_comparability') {
        continue;
      }
      if (!context.side.selectedSide || context.side.source === 'opposite_side_fallback') continue;
      anchor = {
        resultId: measurementResultId(normalized.startedAt, item.movementId),
        checkUpStartedAt: normalized.startedAt,
        movementId: item.movementId,
        comparisonGroup: descriptor.comparisonGroup,
        protocol: context.protocol,
        side: context.side.selectedSide,
      };
    }
  }
  return anchor;
}

export function deriveOfficialMeasurementSide(input: OfficialMeasurementAnchorInput): BodySide | null {
  return findOfficialMeasurementAnchor(input)?.side ?? null;
}

export function checkUpItemsAllowChangeClaim(
  previous: CheckUpItem | null | undefined,
  latest: CheckUpItem | null | undefined,
  comparisonGroup: string
): boolean {
  return measurementContextsAllowChangeClaim(previous?.measurementContext, latest?.measurementContext, comparisonGroup);
}

function sideRequiredContextForCheckUpItem({
  checkUpStartedAt,
  item,
  descriptor,
  protocol,
  checkupType,
}: {
  checkUpStartedAt: string;
  item: CheckUpItem;
  descriptor: MeasurementProtocolDescriptor;
  protocol: MeasurementProtocolRef;
  checkupType?: CheckupType | null;
}): MeasurementContext {
  const result = asRecord(item.result);
  const selectedSide = selectedSideForResult(item.movementId, result);
  const setup = asRecord(result.setup);
  const priorSide = priorSideForResult(item.movementId, setup);
  const changedFromPrior = setup.changedFromPrior === true && !!priorSide && !!selectedSide && priorSide !== selectedSide;
  const userConfirmed = setupUserConfirmed(setup, selectedSide);
  if (!selectedSide || !userConfirmed) return createUnknownMeasurementContext(protocol, descriptor.sideRole);
  const source = sourceForSide({ checkupType, priorSide, changedFromPrior });
  const side: MeasurementSideContext = {
    role: descriptor.sideRole,
    selectedSide,
    observedSide: selectedSide,
    source,
    userConfirmed,
    anchorResultId: priorSide ? null : measurementResultId(checkUpStartedAt, item.movementId),
    anchorSide: priorSide ?? selectedSide,
  };
  if (changedFromPrior && priorSide) {
    const referenceSide: MeasurementSideContext = {
      ...side,
      selectedSide: priorSide,
      observedSide: priorSide,
      source: checkupType === 'baseline_retake' ? 'baseline_retake_anchor' : 'official_retest_anchor',
      anchorSide: priorSide,
    };
    return {
      protocol,
      side,
      comparability: deriveMeasurementComparability({
        current: { protocol, side },
        reference: { protocol, side: referenceSide },
      }),
    };
  }
  if (priorSide) {
    const referenceSide: MeasurementSideContext = {
      ...side,
      selectedSide: priorSide,
      observedSide: priorSide,
      source: checkupType === 'baseline_retake' ? 'baseline_retake_anchor' : 'official_retest_anchor',
      anchorSide: priorSide,
    };
    return {
      protocol,
      side,
      comparability: deriveMeasurementComparability({
        current: { protocol, side },
        reference: { protocol, side: referenceSide },
      }),
    };
  }
  return {
    protocol,
    side,
    comparability: deriveMeasurementComparability({ current: { protocol, side } }),
  };
}

function sourceForSide({
  checkupType,
  priorSide,
  changedFromPrior,
}: {
  checkupType?: CheckupType | null;
  priorSide: BodySide | null;
  changedFromPrior: boolean;
}): MeasurementSideSource {
  if (changedFromPrior) return 'opposite_side_fallback';
  if (checkupType === 'manual_extra' || checkupType === 'quick_recheck') return 'manual_user_selected';
  if (checkupType === 'official_retest' && priorSide) return 'official_retest_anchor';
  if (checkupType === 'baseline_retake' && priorSide) return 'baseline_retake_anchor';
  return 'baseline_user_confirmed';
}

function selectedSideForResult(movementId: string, result: Record<string, unknown>): BodySide | null {
  if (movementId === BALANCE_EYES_OPEN_V2_ID && isBodySide(result.selectedStandingLeg)) return result.selectedStandingLeg;
  if (movementId === ONE_LEG_BALANCE_V2_ID && isBodySide(result.standingLeg)) return result.standingLeg;
  if (movementId === ACTIVE_SHOULDER_REACH_V2_ID && isBodySide(result.selectedSide)) return result.selectedSide;
  return null;
}

function priorSideForResult(movementId: string, setup: Record<string, unknown>): BodySide | null {
  if (movementId === BALANCE_EYES_OPEN_V2_ID && isBodySide(setup.priorStandingLeg)) return setup.priorStandingLeg;
  if (movementId === ONE_LEG_BALANCE_V2_ID && isBodySide(setup.priorStandingLeg)) return setup.priorStandingLeg;
  if (movementId === ACTIVE_SHOULDER_REACH_V2_ID && isBodySide(setup.priorSelectedSide)) return setup.priorSelectedSide;
  return null;
}

function setupUserConfirmed(setup: Record<string, unknown>, selectedSide: BodySide | null): boolean {
  if (!selectedSide) return false;
  if (setup.source === 'direct_call') return false;
  if (setup.confidence !== undefined && setup.confidence !== 'confirmed') return false;
  return setup.confirmed === true;
}

function policyIdForCheckUp(checkUp: CheckUp): CheckUpProtocolPolicyId | null {
  if (isMovementProfileV2Policy(checkUp)) return 'movement_profile_v2';
  if (isLegacyMovementAgePolicy(checkUp)) return 'legacy_movement_age_v1';
  return null;
}

function isOfficialCheckupType(type: CheckupType | null | undefined): boolean {
  return type === 'baseline' || type === 'baseline_retake' || type === 'official_retest';
}

function derivedBatteryVersionForCheckUpItems(
  items: readonly CheckUpItem[],
  policyId: CheckUpProtocolPolicyId | null
): number | undefined {
  if (policyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) return undefined;
  return items.some((item) => item.movementId === BALANCE_EYES_OPEN_V2_ID)
    ? MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V2
    : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
