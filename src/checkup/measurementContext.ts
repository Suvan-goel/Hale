export type BodySide = 'left' | 'right';

export type MeasurementSideRole =
  | 'measured_arm'
  | 'standing_leg'
  | 'extended_leg'
  | 'near_camera_side'
  | 'lead_foot'
  | 'not_applicable';

export type MeasurementSideSource =
  | 'baseline_user_confirmed'
  | 'baseline_recommended_user_confirmed'
  | 'official_retest_anchor'
  | 'baseline_retake_anchor'
  | 'manual_user_selected'
  | 'camera_inferred'
  | 'prior_record_camera_verified'
  | 'prior_micro_check_camera_verified'
  | 'user_fallback_selected'
  | 'microcheck_official_anchor'
  | 'opposite_side_fallback'
  | 'legacy_unknown'
  | 'not_applicable';

export type SideComparabilityStatus =
  | 'establishes_side_baseline'
  | 'same_side_comparable'
  | 'opposite_side_reduced_comparability'
  | 'side_unknown_raw_only'
  | 'not_side_dependent';

export type ProtocolComparabilityStatus =
  | 'establishes_protocol_baseline'
  | 'same_protocol_comparable'
  | 'different_protocol_raw_only'
  | 'protocol_unknown_raw_only';

export type OverallComparabilityStatus =
  | 'comparable'
  | 'reduced_comparability'
  | 'raw_only'
  | 'establishes_new_baseline'
  | 'not_applicable';

export type MeasurementReasonCode =
  | 'NO_REFERENCE'
  | 'SAME_PROTOCOL'
  | 'DIFFERENT_PROTOCOL'
  | 'SAME_SIDE'
  | 'OPPOSITE_SIDE'
  | 'CURRENT_SIDE_UNKNOWN'
  | 'REFERENCE_SIDE_UNKNOWN'
  | 'SIDE_NOT_APPLICABLE'
  | 'MANUAL_NON_OFFICIAL'
  | 'MICROCHECK_DISTINCT_PROTOCOL'
  | 'INVALID_REFERENCE'
  | 'INVALID_CURRENT'
  | 'PROTOCOL_UNKNOWN'
  | 'LEGACY_SIDE_UNKNOWN';

export interface MeasurementProtocolRef {
  protocolId: string;
  protocolVersion: number;
  protocolVariant?: string;
}

export interface MeasurementSideContext {
  role: MeasurementSideRole;
  selectedSide: BodySide | null;
  observedSide: BodySide | null;
  source: MeasurementSideSource;
  userConfirmed: boolean;
  anchorResultId: string | null;
  anchorSide: BodySide | null;
}

export interface MeasurementComparability {
  sideStatus: SideComparabilityStatus;
  protocolStatus: ProtocolComparabilityStatus;
  overallStatus: OverallComparabilityStatus;
  referenceResultId: string | null;
  reasonCodes: MeasurementReasonCode[];
}

export interface MeasurementContext {
  protocol: MeasurementProtocolRef;
  side: MeasurementSideContext;
  comparability: MeasurementComparability;
}

export const UNKNOWN_MEASUREMENT_PROTOCOL_REF: MeasurementProtocolRef = {
  protocolId: 'unknown_protocol',
  protocolVersion: 0,
};

const BODY_SIDES: readonly BodySide[] = ['left', 'right'];
const SIDE_ROLES: readonly MeasurementSideRole[] = [
  'measured_arm',
  'standing_leg',
  'extended_leg',
  'near_camera_side',
  'lead_foot',
  'not_applicable',
];
const SIDE_SOURCES: readonly MeasurementSideSource[] = [
  'baseline_user_confirmed',
  'baseline_recommended_user_confirmed',
  'official_retest_anchor',
  'baseline_retake_anchor',
  'manual_user_selected',
  'camera_inferred',
  'prior_record_camera_verified',
  'prior_micro_check_camera_verified',
  'user_fallback_selected',
  'microcheck_official_anchor',
  'opposite_side_fallback',
  'legacy_unknown',
  'not_applicable',
];
const SIDE_STATUSES: readonly SideComparabilityStatus[] = [
  'establishes_side_baseline',
  'same_side_comparable',
  'opposite_side_reduced_comparability',
  'side_unknown_raw_only',
  'not_side_dependent',
];
const PROTOCOL_STATUSES: readonly ProtocolComparabilityStatus[] = [
  'establishes_protocol_baseline',
  'same_protocol_comparable',
  'different_protocol_raw_only',
  'protocol_unknown_raw_only',
];
const OVERALL_STATUSES: readonly OverallComparabilityStatus[] = [
  'comparable',
  'reduced_comparability',
  'raw_only',
  'establishes_new_baseline',
  'not_applicable',
];
const REASON_CODES: readonly MeasurementReasonCode[] = [
  'NO_REFERENCE',
  'SAME_PROTOCOL',
  'DIFFERENT_PROTOCOL',
  'SAME_SIDE',
  'OPPOSITE_SIDE',
  'CURRENT_SIDE_UNKNOWN',
  'REFERENCE_SIDE_UNKNOWN',
  'SIDE_NOT_APPLICABLE',
  'MANUAL_NON_OFFICIAL',
  'MICROCHECK_DISTINCT_PROTOCOL',
  'INVALID_REFERENCE',
  'INVALID_CURRENT',
  'PROTOCOL_UNKNOWN',
  'LEGACY_SIDE_UNKNOWN',
];

export function measurementResultId(checkUpStartedAt: string, movementId: string): string {
  return `${checkUpStartedAt}#${movementId}`;
}

export function createUnknownMeasurementContext(
  protocol: MeasurementProtocolRef = UNKNOWN_MEASUREMENT_PROTOCOL_REF,
  role: MeasurementSideRole = 'not_applicable'
): MeasurementContext {
  return {
    protocol: normalizeProtocolRef(protocol),
    side: {
      role,
      selectedSide: null,
      observedSide: null,
      source: 'legacy_unknown',
      userConfirmed: false,
      anchorResultId: null,
      anchorSide: null,
    },
    comparability: {
      sideStatus: role === 'not_applicable' ? 'not_side_dependent' : 'side_unknown_raw_only',
      protocolStatus: protocol.protocolVersion > 0 ? 'establishes_protocol_baseline' : 'protocol_unknown_raw_only',
      overallStatus: protocol.protocolVersion > 0 && role === 'not_applicable' ? 'establishes_new_baseline' : 'raw_only',
      referenceResultId: null,
      reasonCodes: protocol.protocolVersion > 0 ? ['NO_REFERENCE'] : ['PROTOCOL_UNKNOWN'],
    },
  };
}

export function createNotApplicableSideContext(
  protocol: MeasurementProtocolRef,
  referenceResultId: string | null = null
): MeasurementContext {
  return {
    protocol: normalizeProtocolRef(protocol),
    side: {
      role: 'not_applicable',
      selectedSide: null,
      observedSide: null,
      source: 'not_applicable',
      userConfirmed: false,
      anchorResultId: referenceResultId,
      anchorSide: null,
    },
    comparability: {
      sideStatus: 'not_side_dependent',
      protocolStatus: referenceResultId ? 'same_protocol_comparable' : 'establishes_protocol_baseline',
      overallStatus: referenceResultId ? 'comparable' : 'establishes_new_baseline',
      referenceResultId,
      reasonCodes: referenceResultId ? ['SAME_PROTOCOL', 'SIDE_NOT_APPLICABLE'] : ['NO_REFERENCE', 'SIDE_NOT_APPLICABLE'],
    },
  };
}

export function normalizeProtocolRef(value: MeasurementProtocolRef): MeasurementProtocolRef {
  const protocolId = typeof value.protocolId === 'string' && value.protocolId.trim().length > 0
    ? value.protocolId
    : UNKNOWN_MEASUREMENT_PROTOCOL_REF.protocolId;
  const protocolVersion =
    typeof value.protocolVersion === 'number' && Number.isInteger(value.protocolVersion) && value.protocolVersion >= 0
      ? value.protocolVersion
      : UNKNOWN_MEASUREMENT_PROTOCOL_REF.protocolVersion;
  return {
    protocolId,
    protocolVersion,
    ...(typeof value.protocolVariant === 'string' && value.protocolVariant.trim().length > 0
      ? { protocolVariant: value.protocolVariant }
      : {}),
  };
}

export function parseMeasurementContext(value: unknown): MeasurementContext | null {
  if (!isRecord(value)) return null;
  const protocol = parseProtocolRef(value.protocol);
  const side = parseSideContext(value.side);
  const comparability = parseComparability(value.comparability);
  if (!protocol || !side || !comparability) return null;
  return { protocol, side, comparability };
}

export function measurementContextMetadataRichness(value: unknown): number {
  const context = parseMeasurementContext(value);
  if (!context) return 0;
  let score = 0;
  if (context.protocol.protocolVersion > 0 && context.protocol.protocolId !== UNKNOWN_MEASUREMENT_PROTOCOL_REF.protocolId) score += 3;
  if (context.side.role !== 'not_applicable') score += 1;
  if (context.side.selectedSide) score += 3;
  if (context.side.observedSide) score += 1;
  if (context.side.anchorSide) score += 1;
  if (context.comparability.overallStatus === 'comparable' || context.comparability.overallStatus === 'establishes_new_baseline') {
    score += 2;
  }
  if (context.comparability.overallStatus === 'raw_only') score -= 1;
  return score;
}

export function isBodySide(value: unknown): value is BodySide {
  return typeof value === 'string' && BODY_SIDES.includes(value as BodySide);
}

export function isMeasurementSideRole(value: unknown): value is MeasurementSideRole {
  return typeof value === 'string' && SIDE_ROLES.includes(value as MeasurementSideRole);
}

export function isMeasurementSideSource(value: unknown): value is MeasurementSideSource {
  return typeof value === 'string' && SIDE_SOURCES.includes(value as MeasurementSideSource);
}

export function isSideComparabilityStatus(value: unknown): value is SideComparabilityStatus {
  return typeof value === 'string' && SIDE_STATUSES.includes(value as SideComparabilityStatus);
}

export function isProtocolComparabilityStatus(value: unknown): value is ProtocolComparabilityStatus {
  return typeof value === 'string' && PROTOCOL_STATUSES.includes(value as ProtocolComparabilityStatus);
}

export function isOverallComparabilityStatus(value: unknown): value is OverallComparabilityStatus {
  return typeof value === 'string' && OVERALL_STATUSES.includes(value as OverallComparabilityStatus);
}

export function isMeasurementReasonCode(value: unknown): value is MeasurementReasonCode {
  return typeof value === 'string' && REASON_CODES.includes(value as MeasurementReasonCode);
}

function parseProtocolRef(value: unknown): MeasurementProtocolRef | null {
  if (!isRecord(value)) return null;
  const protocolId = typeof value.protocolId === 'string' && value.protocolId.trim().length > 0
    ? value.protocolId
    : null;
  const protocolVersion =
    typeof value.protocolVersion === 'number' && Number.isInteger(value.protocolVersion) && value.protocolVersion >= 0
      ? value.protocolVersion
      : null;
  if (!protocolId || protocolVersion === null) return null;
  return {
    protocolId,
    protocolVersion,
    ...(typeof value.protocolVariant === 'string' && value.protocolVariant.trim().length > 0
      ? { protocolVariant: value.protocolVariant }
      : {}),
  };
}

function parseSideContext(value: unknown): MeasurementSideContext | null {
  if (!isRecord(value)) return null;
  if (!isMeasurementSideRole(value.role) || !isMeasurementSideSource(value.source)) return null;
  const selectedSide = value.selectedSide === null || value.selectedSide === undefined
    ? null
    : isBodySide(value.selectedSide)
      ? value.selectedSide
      : undefined;
  const observedSide = value.observedSide === null || value.observedSide === undefined
    ? null
    : isBodySide(value.observedSide)
      ? value.observedSide
      : undefined;
  const anchorSide = value.anchorSide === null || value.anchorSide === undefined
    ? null
    : isBodySide(value.anchorSide)
      ? value.anchorSide
      : undefined;
  if (selectedSide === undefined || observedSide === undefined || anchorSide === undefined) return null;
  return {
    role: value.role,
    selectedSide,
    observedSide,
    source: value.source,
    userConfirmed: value.userConfirmed === true,
    anchorResultId: typeof value.anchorResultId === 'string' ? value.anchorResultId : null,
    anchorSide,
  };
}

function parseComparability(value: unknown): MeasurementComparability | null {
  if (!isRecord(value)) return null;
  if (
    !isSideComparabilityStatus(value.sideStatus) ||
    !isProtocolComparabilityStatus(value.protocolStatus) ||
    !isOverallComparabilityStatus(value.overallStatus)
  ) {
    return null;
  }
  return {
    sideStatus: value.sideStatus,
    protocolStatus: value.protocolStatus,
    overallStatus: value.overallStatus,
    referenceResultId: typeof value.referenceResultId === 'string' ? value.referenceResultId : null,
    reasonCodes: Array.isArray(value.reasonCodes)
      ? value.reasonCodes.filter(isMeasurementReasonCode).sort()
      : [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
