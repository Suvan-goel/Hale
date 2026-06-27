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
import { CHAIN_IDS } from '../pose/chains';
import type { PipelineFrameOutput } from '../pose/pipeline';
import { LM } from '../pose/types';
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
  source?: MeasurementSideSource;
  userConfirmed?: boolean;
}

export type MicroCheckCameraSideSetupReason =
  | 'not_required'
  | 'waiting_for_tracking'
  | 'waiting_for_balance_lift'
  | 'waiting_for_side_view'
  | 'hold_still'
  | 'ready';

export interface MicroCheckCameraSideSetupConfig {
  stableMs: number;
  fallbackMs: number;
  balanceLiftBu: number;
  reliabilityThreshold: number;
  sideReliabilityMargin: number;
}

export interface MicroCheckCameraSideSetupResult {
  ready: boolean;
  selectedSide: BodySide | null;
  observedSide: BodySide | null;
  source: MeasurementSideSource | null;
  stableForMs: number;
  fallbackAvailable: boolean;
  reason: MicroCheckCameraSideSetupReason;
  setupCaption: string;
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
const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

export const DEFAULT_MICRO_CHECK_CAMERA_SIDE_SETUP_CONFIG: MicroCheckCameraSideSetupConfig = {
  stableMs: 700,
  fallbackMs: 12000,
  balanceLiftBu: 0.14,
  reliabilityThreshold: 0.45,
  sideReliabilityMargin: 0.1,
};

export class MicroCheckCameraSideResolver {
  private firstTimestampMs = -1;
  private candidateSide: BodySide | null = null;
  private candidateSinceMs = 0;
  private readonly result: MicroCheckCameraSideSetupResult = {
    ready: false,
    selectedSide: null,
    observedSide: null,
    source: null,
    stableForMs: 0,
    fallbackAvailable: false,
    reason: 'waiting_for_tracking',
    setupCaption: '',
  };

  update(
    out: PipelineFrameOutput,
    microCheckType: MicroCheckType,
    setup: MicroCheckSideSetup,
    config: MicroCheckCameraSideSetupConfig = DEFAULT_MICRO_CHECK_CAMERA_SIDE_SETUP_CONFIG
  ): MicroCheckCameraSideSetupResult {
    const timestampMs = Number.isFinite(out.frame.timestampMs) ? out.frame.timestampMs : 0;
    if (this.firstTimestampMs < 0) this.firstTimestampMs = timestampMs;

    if (!setup.sideRequired) {
      return this.setResult({
        ready: true,
        selectedSide: null,
        observedSide: null,
        source: 'not_applicable',
        stableForMs: 0,
        fallbackAvailable: false,
        reason: 'not_required',
        setupCaption: '',
      });
    }

    const candidate = inferMicroCheckSideFromCamera({ microCheckType, setup, output: out, config });
    if (candidate !== this.candidateSide) {
      this.candidateSide = candidate;
      this.candidateSinceMs = timestampMs;
    }
    const stableForMs = candidate ? Math.max(0, timestampMs - this.candidateSinceMs) : 0;
    const fallbackAvailable = timestampMs - this.firstTimestampMs >= config.fallbackMs;
    const ready = candidate !== null && stableForMs >= config.stableMs;
    const reason = ready
      ? 'ready'
      : candidate
        ? 'hold_still'
        : reasonForWaiting(microCheckType, out);

    return this.setResult({
      ready,
      selectedSide: candidate,
      observedSide: candidate,
      source: ready ? microCheckCameraSideSource(setup, candidate) : null,
      stableForMs,
      fallbackAvailable,
      reason,
      setupCaption: microCheckCameraSideSetupCaption(microCheckType, setup, reason),
    });
  }

  reset(): void {
    this.firstTimestampMs = -1;
    this.candidateSide = null;
    this.candidateSinceMs = 0;
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    if (this.firstTimestampMs >= 0) this.firstTimestampMs += deltaMs;
    this.candidateSinceMs += deltaMs;
  }

  private setResult(next: MicroCheckCameraSideSetupResult): MicroCheckCameraSideSetupResult {
    this.result.ready = next.ready;
    this.result.selectedSide = next.selectedSide;
    this.result.observedSide = next.observedSide;
    this.result.source = next.source;
    this.result.stableForMs = next.stableForMs;
    this.result.fallbackAvailable = next.fallbackAvailable;
    this.result.reason = next.reason;
    this.result.setupCaption = next.setupCaption;
    return this.result;
  }
}

export function inferMicroCheckSideFromCamera({
  microCheckType,
  setup,
  output,
  config = DEFAULT_MICRO_CHECK_CAMERA_SIDE_SETUP_CONFIG,
}: {
  microCheckType: MicroCheckType;
  setup: MicroCheckSideSetup;
  output: PipelineFrameOutput;
  config?: MicroCheckCameraSideSetupConfig;
}): BodySide | null {
  if (!setup.sideRequired) return null;
  if (microCheckType === 'single-leg-balance') return inferBalanceStandingLeg(output, setup, config);
  if (microCheckType === 'mobility-reach') return inferMobilityReachSide(output, setup, config);
  return null;
}

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
  source,
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
    source: microCheckSideSource(setup, pinnedSide, source),
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

function microCheckSideSource(
  setup: MicroCheckSideSetup,
  selectedSide: BodySide,
  source?: MeasurementSideSource | null
): MeasurementSideSource {
  if (
    setup.recommendationSource === 'existing_microcheck_series' &&
    setup.anchorSide &&
    selectedSide !== setup.anchorSide
  ) {
    return 'opposite_side_fallback';
  }
  if (source) return source;
  if (setup.recommendationSource === 'compatible_official_anchor') return 'microcheck_official_anchor';
  return 'manual_user_selected';
}

function microCheckCameraSideSource(
  setup: MicroCheckSideSetup,
  selectedSide: BodySide
): MeasurementSideSource {
  if (
    setup.recommendationSource === 'existing_microcheck_series' &&
    setup.anchorSide &&
    selectedSide !== setup.anchorSide
  ) {
    return 'opposite_side_fallback';
  }
  if (
    setup.recommendationSource === 'existing_microcheck_series' &&
    setup.anchorSide === selectedSide
  ) {
    return 'prior_micro_check_camera_verified';
  }
  if (
    setup.recommendationSource === 'compatible_official_anchor' &&
    setup.selectedSide === selectedSide
  ) {
    return 'prior_record_camera_verified';
  }
  return 'camera_inferred';
}

function inferBalanceStandingLeg(
  out: PipelineFrameOutput,
  setup: MicroCheckSideSetup,
  config: MicroCheckCameraSideSetupConfig
): BodySide | null {
  if (
    out.state !== 'tracking' ||
    !out.frame.hasPose ||
    out.bodyUnit === null ||
    out.chainReliability[LEFT_SIDE_CHAIN] < config.reliabilityThreshold ||
    out.chainReliability[RIGHT_SIDE_CHAIN] < config.reliabilityThreshold
  ) {
    return null;
  }

  if (setup.selectedSide && selectedLegRaised(out, setup.selectedSide, config.balanceLiftBu)) {
    return setup.selectedSide;
  }

  const leftLowerThanRightBu =
    (out.frame.ys[LM.LEFT_ANKLE] - out.frame.ys[LM.RIGHT_ANKLE]) / out.bodyUnit;
  if (leftLowerThanRightBu > config.balanceLiftBu) return 'left';
  if (leftLowerThanRightBu < -config.balanceLiftBu) return 'right';
  return null;
}

function inferMobilityReachSide(
  out: PipelineFrameOutput,
  setup: MicroCheckSideSetup,
  config: MicroCheckCameraSideSetupConfig
): BodySide | null {
  if (out.state !== 'tracking' || !out.frame.hasPose) return null;
  const leftScore = out.chainReliability[LEFT_SIDE_CHAIN];
  const rightScore = out.chainReliability[RIGHT_SIDE_CHAIN];
  const leftReliable = leftScore >= config.reliabilityThreshold;
  const rightReliable = rightScore >= config.reliabilityThreshold;

  if (setup.selectedSide === 'left' && leftReliable) return 'left';
  if (setup.selectedSide === 'right' && rightReliable) return 'right';
  if (!leftReliable && !rightReliable) return null;
  if (leftReliable && !rightReliable) return 'left';
  if (rightReliable && !leftReliable) return 'right';
  if (Math.abs(leftScore - rightScore) < config.sideReliabilityMargin) return null;
  return leftScore > rightScore ? 'left' : 'right';
}

function selectedLegRaised(
  out: PipelineFrameOutput,
  standingLeg: BodySide,
  liftBu: number
): boolean {
  if (out.bodyUnit === null) return false;
  const standingAnkle = standingLeg === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const raisedAnkle = standingLeg === 'left' ? LM.RIGHT_ANKLE : LM.LEFT_ANKLE;
  return (out.frame.ys[standingAnkle] - out.frame.ys[raisedAnkle]) / out.bodyUnit > liftBu;
}

function reasonForWaiting(
  microCheckType: MicroCheckType,
  out: PipelineFrameOutput
): MicroCheckCameraSideSetupReason {
  if (out.state !== 'tracking' || !out.frame.hasPose) return 'waiting_for_tracking';
  if (microCheckType === 'single-leg-balance') return 'waiting_for_balance_lift';
  return 'waiting_for_side_view';
}

function microCheckCameraSideSetupCaption(
  microCheckType: MicroCheckType,
  setup: MicroCheckSideSetup,
  reason: MicroCheckCameraSideSetupReason
): string {
  if (reason === 'ready') return 'Side detected. Keep listening.';
  if (reason === 'hold_still') return 'Hold still for a moment.';
  if (microCheckType === 'single-leg-balance') {
    if (setup.selectedSide) {
      return `Use your ${setup.selectedSide} leg if comfortable. I'll start automatically when I can see it.`;
    }
    return "Stand on one leg when you're ready. I'll start automatically.";
  }
  if (microCheckType === 'mobility-reach') {
    if (setup.selectedSide) {
      return `Use your ${setup.selectedSide} side if comfortable. I'll start automatically when I can see it.`;
    }
    return "Turn side-on and reach when you're ready. I'll capture it automatically.";
  }
  return '';
}
