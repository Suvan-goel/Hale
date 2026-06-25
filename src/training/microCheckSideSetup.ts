import {
  comparableMeasurementSeriesKey,
  deriveMeasurementComparability,
  descriptorForMicroCheck,
  findOfficialMeasurementAnchor,
  getMeasurementProtocolDescriptor,
  measurementResultId,
  normalizeMicroCheckMeasurementMetadata,
  parseMeasurementContext,
  protocolRefForDescriptor,
  sameProtocol,
  type BodySide,
  type MeasurementContext,
  type MeasurementProtocolDescriptor,
  type MeasurementProtocolRef,
  type MeasurementSideContext,
  type MeasurementSideRole,
  type MeasurementSideSource,
} from '../checkup';
import type { CheckupType } from '../adherence';
import type { CheckUp } from '../checkup/types';
import type { MicroCheckResult, MicroCheckType } from './microCheck';

export type MicroCheckSideRecommendationSource =
  | 'existing_microcheck_series'
  | 'compatible_official_anchor'
  | 'user_choice_required'
  | 'not_applicable';

export type MicroCheckSideReasonCode =
  | 'MICRO_CHECK_SIDE_NOT_REQUIRED'
  | 'EXISTING_MICROCHECK_SERIES_SIDE'
  | 'COMPATIBLE_OFFICIAL_BALANCE_ANCHOR'
  | 'USER_CHOICE_REQUIRED'
  | 'MOBILITY_OFFICIAL_ANCHOR_NOT_SUPPORTED'
  | 'SIDE_REQUIRED_WITHOUT_ANCHOR'
  | 'OPPOSITE_SIDE_REDUCES_COMPARABILITY'
  | 'OFFICIAL_RECOMMENDATION_ESTABLISHES_MICRO_SERIES';

export interface MicroCheckSideSetup {
  sideRequired: boolean;
  role: MeasurementSideRole;
  selectedSide: BodySide | null;
  anchorSide: BodySide | null;
  anchorResultId: string | null;
  recommendationSource: MicroCheckSideRecommendationSource;
  establishesNewSeries: boolean;
  changeWouldReduceComparability: boolean;
  reasonCodes: MicroCheckSideReasonCode[];
}

export interface MicroCheckSideProtocolRegistry {
  descriptorForMicroCheck: (type: MicroCheckType) => MeasurementProtocolDescriptor;
  protocolRefForDescriptor: (descriptor: MeasurementProtocolDescriptor) => MeasurementProtocolRef;
}

export interface OfficialCheckUpLike {
  checkUp: CheckUp;
  checkupType?: CheckupType | null;
}

export interface DeriveMicroCheckSideSetupInput {
  microCheckType: MicroCheckType;
  history?: readonly MicroCheckResult[] | null;
  officialCheckUps?: readonly OfficialCheckUpLike[] | null;
  protocolRegistry?: MicroCheckSideProtocolRegistry | null;
}

export interface CreateMicroCheckMeasurementContextForSideInput {
  microCheckType: MicroCheckType;
  startedAt: string;
  setup: MicroCheckSideSetup;
  selectedSide?: BodySide | null;
  observedSide?: BodySide | null;
  userConfirmed?: boolean;
}

interface MicroCheckAnchor {
  side: BodySide;
  resultId: string;
  context: MeasurementContext;
}

const DEFAULT_PROTOCOL_REGISTRY: MicroCheckSideProtocolRegistry = {
  descriptorForMicroCheck,
  protocolRefForDescriptor,
};

const BALANCE_EYES_OPEN_V2_PROTOCOL_ID = 'home_balance_eyes_open_v2';
const MPV2_BALANCE_PROTOCOL_ID = 'mpv2_single_leg_balance_45s_v1';

export function deriveMicroCheckSideSetup({
  microCheckType,
  history = [],
  officialCheckUps = [],
  protocolRegistry = DEFAULT_PROTOCOL_REGISTRY,
}: DeriveMicroCheckSideSetupInput): MicroCheckSideSetup {
  const registry = protocolRegistry ?? DEFAULT_PROTOCOL_REGISTRY;
  const descriptor = registry.descriptorForMicroCheck(microCheckType);
  const protocol = registry.protocolRefForDescriptor(descriptor);
  if (!descriptor.sideRequired) {
    return {
      sideRequired: false,
      role: descriptor.sideRole,
      selectedSide: null,
      anchorSide: null,
      anchorResultId: null,
      recommendationSource: 'not_applicable',
      establishesNewSeries: false,
      changeWouldReduceComparability: false,
      reasonCodes: ['MICRO_CHECK_SIDE_NOT_REQUIRED'],
    };
  }

  const microAnchor = latestMicroCheckAnchor({
    type: microCheckType,
    protocol,
    comparisonGroup: descriptor.comparisonGroup,
    role: descriptor.sideRole,
    history,
  });
  if (microAnchor) {
    return {
      sideRequired: true,
      role: descriptor.sideRole,
      selectedSide: microAnchor.side,
      anchorSide: microAnchor.side,
      anchorResultId: microAnchor.resultId,
      recommendationSource: 'existing_microcheck_series',
      establishesNewSeries: false,
      changeWouldReduceComparability: true,
      reasonCodes: ['EXISTING_MICROCHECK_SERIES_SIDE', 'OPPOSITE_SIDE_REDUCES_COMPARABILITY'],
    };
  }

  if (microCheckType === 'single-leg-balance') {
    const officialAnchor = latestCompatibleOfficialBalanceAnchor(officialCheckUps);
    if (officialAnchor) {
      return {
        sideRequired: true,
        role: descriptor.sideRole,
        selectedSide: officialAnchor.side,
        anchorSide: officialAnchor.side,
        anchorResultId: officialAnchor.resultId,
        recommendationSource: 'compatible_official_anchor',
        establishesNewSeries: true,
        changeWouldReduceComparability: false,
        reasonCodes: [
          'COMPATIBLE_OFFICIAL_BALANCE_ANCHOR',
          'OFFICIAL_RECOMMENDATION_ESTABLISHES_MICRO_SERIES',
        ],
      };
    }
  }

  return {
    sideRequired: true,
    role: descriptor.sideRole,
    selectedSide: null,
    anchorSide: null,
    anchorResultId: null,
    recommendationSource: 'user_choice_required',
    establishesNewSeries: true,
    changeWouldReduceComparability: false,
    reasonCodes:
      microCheckType === 'mobility-reach'
        ? ['USER_CHOICE_REQUIRED', 'MOBILITY_OFFICIAL_ANCHOR_NOT_SUPPORTED']
        : ['USER_CHOICE_REQUIRED', 'SIDE_REQUIRED_WITHOUT_ANCHOR'],
  };
}

export function createMicroCheckMeasurementContextForSide({
  microCheckType,
  startedAt,
  setup,
  selectedSide,
  observedSide,
  userConfirmed = true,
}: CreateMicroCheckMeasurementContextForSideInput): MeasurementContext {
  if (!setup.sideRequired) {
    return normalizeMicroCheckMeasurementMetadata({ type: microCheckType, startedAt });
  }

  const descriptor = descriptorForMicroCheck(microCheckType);
  const protocol = protocolRefForDescriptor(descriptor);
  const pinnedSide = selectedSide ?? setup.selectedSide ?? null;
  if (!pinnedSide) {
    return normalizeMicroCheckMeasurementMetadata({ type: microCheckType, startedAt });
  }

  const currentResultId = measurementResultId(startedAt, microCheckType);
  const hasMicroSeriesAnchor = setup.recommendationSource === 'existing_microcheck_series';
  const anchorSide = hasMicroSeriesAnchor ? setup.anchorSide : pinnedSide;
  const anchorResultId = hasMicroSeriesAnchor ? setup.anchorResultId : currentResultId;
  const side: MeasurementSideContext = {
    role: descriptor.sideRole,
    selectedSide: pinnedSide,
    observedSide: observedSide ?? pinnedSide,
    source: microCheckSideSource(setup, pinnedSide),
    userConfirmed,
    anchorResultId,
    anchorSide,
  };

  if (hasMicroSeriesAnchor && setup.anchorSide && setup.anchorResultId) {
    const referenceSide: MeasurementSideContext = {
      ...side,
      selectedSide: setup.anchorSide,
      observedSide: setup.anchorSide,
      source: 'manual_user_selected',
      userConfirmed: true,
      anchorResultId: setup.anchorResultId,
      anchorSide: setup.anchorSide,
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

export function oppositeMicroCheckSide(side: BodySide): BodySide {
  return side === 'left' ? 'right' : 'left';
}

function latestMicroCheckAnchor({
  type,
  protocol,
  comparisonGroup,
  role,
  history,
}: {
  type: MicroCheckType;
  protocol: MeasurementProtocolRef;
  comparisonGroup: string;
  role: MeasurementSideRole;
  history: readonly MicroCheckResult[] | null | undefined;
}): MicroCheckAnchor | null {
  let anchor: MicroCheckAnchor | null = null;
  const sorted = (history ?? [])
    .filter((result) => result.type === type && result.measured)
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  for (const result of sorted) {
    const context = parseMeasurementContext(result.measurementContext);
    if (!context) continue;
    if (!sameProtocol(context.protocol, protocol)) continue;
    if (context.side.role !== role || !context.side.selectedSide) continue;
    if (context.side.source === 'opposite_side_fallback') continue;
    if (context.comparability.overallStatus === 'raw_only' || context.comparability.overallStatus === 'reduced_comparability') {
      continue;
    }
    if (!comparableMeasurementSeriesKey(context, comparisonGroup)) continue;
    anchor = {
      side: context.side.anchorSide ?? context.side.selectedSide,
      resultId: context.side.anchorResultId ?? measurementResultId(result.startedAt, result.type),
      context,
    };
  }
  return anchor;
}

function latestCompatibleOfficialBalanceAnchor(
  records: readonly OfficialCheckUpLike[] | null | undefined
): { side: BodySide; resultId: string } | null {
  return (
    officialAnchorForProtocol(BALANCE_EYES_OPEN_V2_PROTOCOL_ID, records) ??
    officialAnchorForProtocol(MPV2_BALANCE_PROTOCOL_ID, records)
  );
}

function officialAnchorForProtocol(
  protocolId: string,
  records: readonly OfficialCheckUpLike[] | null | undefined
): { side: BodySide; resultId: string } | null {
  const descriptor = getMeasurementProtocolDescriptor(protocolId);
  if (!descriptor) return null;
  const anchor = findOfficialMeasurementAnchor({
    records: records ?? [],
    comparisonGroup: descriptor.comparisonGroup,
    protocol: protocolRefForDescriptor(descriptor),
  });
  return anchor ? { side: anchor.side, resultId: anchor.resultId } : null;
}

function microCheckSideSource(setup: MicroCheckSideSetup, selectedSide: BodySide): MeasurementSideSource {
  if (setup.recommendationSource === 'compatible_official_anchor') return 'microcheck_official_anchor';
  if (
    setup.recommendationSource === 'existing_microcheck_series' &&
    setup.anchorSide &&
    selectedSide !== setup.anchorSide
  ) {
    return 'opposite_side_fallback';
  }
  return 'manual_user_selected';
}
