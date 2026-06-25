import type {
  MeasurementComparability,
  MeasurementContext,
  MeasurementProtocolRef,
  MeasurementReasonCode,
  MeasurementSideContext,
} from './measurementContext';

export interface MeasurementComparableInput {
  current: Pick<MeasurementContext, 'protocol' | 'side'>;
  reference?: Pick<MeasurementContext, 'protocol' | 'side'> | null;
  currentValid?: boolean;
  referenceValid?: boolean;
  microCheckDistinctProtocol?: boolean;
}

export function deriveMeasurementComparability({
  current,
  reference = null,
  currentValid = true,
  referenceValid = true,
  microCheckDistinctProtocol = false,
}: MeasurementComparableInput): MeasurementComparability {
  if (!currentValid) {
    return rawOnly('side_unknown_raw_only', 'protocol_unknown_raw_only', null, ['INVALID_CURRENT']);
  }

  const reasonCodes: MeasurementReasonCode[] = [];
  if (microCheckDistinctProtocol) reasonCodes.push('MICROCHECK_DISTINCT_PROTOCOL');

  if (!reference || !referenceValid) {
    if (reference && !referenceValid) reasonCodes.push('INVALID_REFERENCE');
    else reasonCodes.push('NO_REFERENCE');
    if (protocolUnknown(current.protocol)) {
      return rawOnly(
        current.side.role === 'not_applicable' ? 'not_side_dependent' : 'side_unknown_raw_only',
        'protocol_unknown_raw_only',
        null,
        [...reasonCodes, 'PROTOCOL_UNKNOWN']
      );
    }
    if (current.side.role === 'not_applicable') {
      return {
        sideStatus: 'not_side_dependent',
        protocolStatus: 'establishes_protocol_baseline',
        overallStatus: 'establishes_new_baseline',
        referenceResultId: null,
        reasonCodes: stableReasonCodes([...reasonCodes, 'SIDE_NOT_APPLICABLE']),
      };
    }
    if (!current.side.selectedSide) {
      return rawOnly(
        'side_unknown_raw_only',
        'establishes_protocol_baseline',
        null,
        [...reasonCodes, 'CURRENT_SIDE_UNKNOWN', 'LEGACY_SIDE_UNKNOWN']
      );
    }
    return {
      sideStatus: 'establishes_side_baseline',
      protocolStatus: 'establishes_protocol_baseline',
      overallStatus: 'establishes_new_baseline',
      referenceResultId: null,
      reasonCodes: stableReasonCodes(reasonCodes),
    };
  }

  if (!sameProtocol(current.protocol, reference.protocol)) {
    return rawOnly(
      current.side.role === 'not_applicable' ? 'not_side_dependent' : 'side_unknown_raw_only',
      'different_protocol_raw_only',
      reference.side.anchorResultId,
      [...reasonCodes, 'DIFFERENT_PROTOCOL']
    );
  }

  reasonCodes.push('SAME_PROTOCOL');

  if (current.side.role === 'not_applicable') {
    return {
      sideStatus: 'not_side_dependent',
      protocolStatus: 'same_protocol_comparable',
      overallStatus: 'comparable',
      referenceResultId: reference.side.anchorResultId,
      reasonCodes: stableReasonCodes([...reasonCodes, 'SIDE_NOT_APPLICABLE']),
    };
  }

  if (!current.side.selectedSide) {
    return rawOnly(
      'side_unknown_raw_only',
      'same_protocol_comparable',
      reference.side.anchorResultId,
      [...reasonCodes, 'CURRENT_SIDE_UNKNOWN', 'LEGACY_SIDE_UNKNOWN']
    );
  }
  if (!reference.side.selectedSide && !reference.side.anchorSide) {
    return rawOnly(
      'side_unknown_raw_only',
      'same_protocol_comparable',
      reference.side.anchorResultId,
      [...reasonCodes, 'REFERENCE_SIDE_UNKNOWN', 'LEGACY_SIDE_UNKNOWN']
    );
  }

  const referenceSide = reference.side.anchorSide ?? reference.side.selectedSide;
  if (current.side.selectedSide === referenceSide) {
    return {
      sideStatus: 'same_side_comparable',
      protocolStatus: 'same_protocol_comparable',
      overallStatus: 'comparable',
      referenceResultId: reference.side.anchorResultId,
      reasonCodes: stableReasonCodes([...reasonCodes, 'SAME_SIDE']),
    };
  }

  return {
    sideStatus: 'opposite_side_reduced_comparability',
    protocolStatus: 'same_protocol_comparable',
    overallStatus: 'reduced_comparability',
    referenceResultId: reference.side.anchorResultId,
    reasonCodes: stableReasonCodes([...reasonCodes, 'OPPOSITE_SIDE']),
  };
}

export function sameProtocol(a: MeasurementProtocolRef, b: MeasurementProtocolRef): boolean {
  return (
    a.protocolId === b.protocolId &&
    a.protocolVersion === b.protocolVersion &&
    (a.protocolVariant ?? '') === (b.protocolVariant ?? '')
  );
}

export function measurementSeriesKey(
  context: Pick<MeasurementContext, 'protocol' | 'side'>,
  comparisonGroup: string
): string {
  const sideValue =
    context.side.role === 'not_applicable'
      ? 'na'
      : context.side.anchorSide ?? context.side.selectedSide ?? 'unknown';
  const variant = context.protocol.protocolVariant ? `:${context.protocol.protocolVariant}` : '';
  return [
    comparisonGroup,
    `${context.protocol.protocolId}${variant}`,
    `v${context.protocol.protocolVersion}`,
    context.side.role,
    sideValue,
  ].join('|');
}

export function comparableMeasurementSeriesKey(
  context: MeasurementContext,
  comparisonGroup: string
): string | null {
  if (context.protocol.protocolVersion <= 0) return null;
  if (context.comparability.overallStatus === 'raw_only' || context.comparability.overallStatus === 'reduced_comparability') {
    return null;
  }
  if (context.side.role !== 'not_applicable' && !context.side.selectedSide) return null;
  return measurementSeriesKey(context, comparisonGroup);
}

export function measurementContextsAllowChangeClaim(
  previous: MeasurementContext | null | undefined,
  latest: MeasurementContext | null | undefined,
  comparisonGroup: string
): boolean {
  if (!previous || !latest) return false;
  const previousKey = comparableMeasurementSeriesKey(previous, comparisonGroup);
  const latestKey = comparableMeasurementSeriesKey(latest, comparisonGroup);
  return !!previousKey && previousKey === latestKey;
}

export function stableReasonCodes(reasonCodes: readonly MeasurementReasonCode[]): MeasurementReasonCode[] {
  return Array.from(new Set(reasonCodes)).sort();
}

function protocolUnknown(protocol: MeasurementProtocolRef): boolean {
  return protocol.protocolVersion <= 0 || protocol.protocolId === 'unknown_protocol';
}

function rawOnly(
  sideStatus: MeasurementComparability['sideStatus'],
  protocolStatus: MeasurementComparability['protocolStatus'],
  referenceResultId: string | null,
  reasonCodes: readonly MeasurementReasonCode[]
): MeasurementComparability {
  return {
    sideStatus,
    protocolStatus,
    overallStatus: 'raw_only',
    referenceResultId,
    reasonCodes: stableReasonCodes(reasonCodes),
  };
}
