import {
  getMeasurementProtocolDescriptor,
  protocolRefForDescriptor,
  type MeasurementProtocolDescriptor,
} from '../../checkup';
import {
  MICRO_CHECK_VOICE_TYPES_V21,
  getMicroCheckVoiceContractV21,
  listMicroCheckVoiceContractsV21,
} from './contracts';
import type {
  MicroCheckProtocolCompatibilityV21,
  MicroCheckTypeV21,
} from './types';

export function listMicroCheckProtocolCompatibilityV21(): MicroCheckProtocolCompatibilityV21[] {
  return MICRO_CHECK_VOICE_TYPES_V21.map((type) => protocolCompatibilityForMicroCheckV21(type));
}

export function protocolCompatibilityForMicroCheckV21(
  type: MicroCheckTypeV21
): MicroCheckProtocolCompatibilityV21 {
  const contract = getMicroCheckVoiceContractV21(type);
  const oldDescriptor = requiredDescriptor(contract.currentProtocolId, contract.currentProtocolVersion);
  const newDescriptor = requiredDescriptor(contract.finalProtocolId, contract.finalProtocolVersion);
  return {
    microCheckType: type,
    oldProtocol: protocolRefForDescriptor(oldDescriptor),
    newProtocol: protocolRefForDescriptor(newDescriptor),
    activeStartSemantics: 'legacy update-loop go emission is replaced by countdown go playback-start evidence',
    interruptionSemantics: 'tracking loss, pause, retry, resume, and stale audio callbacks invalidate the current attempt before any fresh countdown',
    sideSemantics:
      contract.sideRole === 'not_applicable'
        ? 'side-independent measurement remains not_applicable'
        : `${contract.sideRole} is pinned before runner construction and remains part of the measurement context`,
    resultSemantics:
      type === 'chair-power'
        ? 'accepted five-rep target or hard cap; rep-credit remains sound-effect only'
        : type === 'single-leg-balance'
          ? 'hold termination or hard cap; interrupted holds cannot produce partial V2.1 results'
          : '9-second standing forward-reach capture uses the Movement Check-Up hinge reach grader',
    classification: 'new_protocol_version_required',
    directComparisonAllowed: false,
    oldHistoryPreserved: true,
    newSeriesRequired: true,
    reason:
      'V2.1 changes measurement timing evidence and interruption validity semantics, so persisted values must land in a new protocol version while older history remains readable.',
  };
}

export function validateMicroCheckProtocolCompatibilityV21(): {
  readonly valid: boolean;
  readonly compatibilityRowCount: number;
  readonly newProtocolVersionRequiredCount: number;
  readonly directComparisonAllowedCount: number;
  readonly oldHistoryNotPreservedCount: number;
  readonly missingRegisteredProtocolCount: number;
} {
  const rows = listMicroCheckProtocolCompatibilityV21();
  const contracts = listMicroCheckVoiceContractsV21();
  const missingRegisteredProtocolCount = contracts.filter(
    (contract) =>
      !getMeasurementProtocolDescriptor(contract.currentProtocolId, contract.currentProtocolVersion) ||
      !getMeasurementProtocolDescriptor(contract.finalProtocolId, contract.finalProtocolVersion)
  ).length;
  const directComparisonAllowedCount = rows.filter((row) => row.directComparisonAllowed).length;
  const oldHistoryNotPreservedCount = rows.filter((row) => !row.oldHistoryPreserved).length;
  const newProtocolVersionRequiredCount = rows.filter(
    (row) => row.classification === 'new_protocol_version_required'
  ).length;
  return {
    valid:
      rows.length === MICRO_CHECK_VOICE_TYPES_V21.length &&
      newProtocolVersionRequiredCount === rows.length &&
      directComparisonAllowedCount === 0 &&
      oldHistoryNotPreservedCount === 0 &&
      missingRegisteredProtocolCount === 0,
    compatibilityRowCount: rows.length,
    newProtocolVersionRequiredCount,
    directComparisonAllowedCount,
    oldHistoryNotPreservedCount,
    missingRegisteredProtocolCount,
  };
}

function requiredDescriptor(protocolId: string, protocolVersion: number): MeasurementProtocolDescriptor {
  const descriptor = getMeasurementProtocolDescriptor(protocolId, protocolVersion);
  if (!descriptor) throw new Error(`missing measurement protocol descriptor ${protocolId}@${protocolVersion}`);
  return descriptor;
}
