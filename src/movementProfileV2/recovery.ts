import type { CheckupType } from '../adherence';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
} from '../checkup/protocolPolicy';
import type { CheckUp } from '../checkup/types';
import {
  getMovementProfileV2AssessmentPersistenceEligibility,
  getMovementProfileV2SnapshotEligibility,
  parseStoredMovementProfileV2Snapshot,
  validMovementProfileV2SnapshotForCheckUp,
  type MovementProfileV2AssessmentCompatibility,
  type MovementProfileV2SnapshotCompatibility,
} from '../reference/movementProfileV2';

import { BRAND } from '../brand';
export type MovementProfileV2RecoveryStateKind =
  | 'ready'
  | 'raw_complete_missing_snapshot'
  | 'snapshot_missing_assessment'
  | 'raw_incomplete'
  | 'snapshot_malformed_or_mismatched'
  | 'assessment_malformed_or_mismatched'
  | 'immutable_conflict'
  | 'unsupported_future_artifact'
  | 'sync_pending_local_ready';

export interface MovementProfileV2RecoveryState {
  kind: MovementProfileV2RecoveryStateKind;
  canOpenProfile: boolean;
  canMaterialize: boolean;
  canUseSavedResult: boolean;
  shouldRetake: boolean;
  diagnostic: {
    snapshotCompatibility?: MovementProfileV2SnapshotCompatibility;
    assessmentCompatibility?: MovementProfileV2AssessmentCompatibility;
    sourceEligible: boolean;
    protocolSupported: boolean;
  };
}

export interface MovementProfileV2RecoveryCopy {
  title: string;
  body: string;
  primaryAction: 'open_profile' | 'finish_details' | 'use_saved' | 'retake' | 'start_fresh';
  primaryLabel: string;
  secondaryLabel?: string;
}

export function classifyMovementProfileV2RecoveryState(input: {
  checkUp: CheckUp;
  checkupType?: CheckupType | string | null;
  snapshot?: unknown;
  assessment?: unknown;
  syncPending?: boolean;
}): MovementProfileV2RecoveryState {
  const protocol = normalizeCheckUpRecordProtocolPolicy(input.checkUp);
  const protocolSupported =
    protocol.supported && protocol.policy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  const sourceEligibility = getMovementProfileV2SnapshotEligibility(input.checkUp, input.checkupType);
  const sourceEligible = sourceEligibility.eligible;

  if (!protocolSupported || !sourceEligible) {
    return state('raw_incomplete', {
      sourceEligible,
      protocolSupported,
      canOpenProfile: false,
      canMaterialize: false,
      canUseSavedResult: false,
      shouldRetake: true,
    });
  }

  const snapshotValue =
    input.snapshot !== undefined
      ? input.snapshot
      : (input.checkUp as { movementProfileV2Snapshot?: unknown }).movementProfileV2Snapshot;
  const parsedSnapshot = parseStoredMovementProfileV2Snapshot(snapshotValue);
  if (!parsedSnapshot.ok) {
    if (parsedSnapshot.compatibility === 'missing') {
      return state('raw_complete_missing_snapshot', {
        sourceEligible,
        protocolSupported,
        snapshotCompatibility: parsedSnapshot.compatibility,
        canOpenProfile: false,
        canMaterialize: true,
        canUseSavedResult: false,
        shouldRetake: false,
      });
    }
    if (parsedSnapshot.compatibility === 'future_schema') {
      return state('unsupported_future_artifact', {
        sourceEligible,
        protocolSupported,
        snapshotCompatibility: parsedSnapshot.compatibility,
        canOpenProfile: false,
        canMaterialize: false,
        canUseSavedResult: false,
        shouldRetake: true,
      });
    }
    return state('snapshot_malformed_or_mismatched', {
      sourceEligible,
      protocolSupported,
      snapshotCompatibility: parsedSnapshot.compatibility,
      canOpenProfile: false,
      canMaterialize: false,
      canUseSavedResult: false,
      shouldRetake: true,
    });
  }

  const validSnapshot = validMovementProfileV2SnapshotForCheckUp({
    snapshot: parsedSnapshot.snapshot,
    checkUp: input.checkUp,
    checkupType: input.checkupType,
  });
  if (!validSnapshot) {
    return state('snapshot_malformed_or_mismatched', {
      sourceEligible,
      protocolSupported,
      snapshotCompatibility: 'source_mismatch',
      canOpenProfile: false,
      canMaterialize: false,
      canUseSavedResult: false,
      shouldRetake: true,
    });
  }

  const assessmentValue =
    input.assessment !== undefined
      ? input.assessment
      : (input.checkUp as { movementProfileV2Assessment?: unknown }).movementProfileV2Assessment;
  if (assessmentValue === undefined || assessmentValue === null) {
    return state('snapshot_missing_assessment', {
      sourceEligible,
      protocolSupported,
      snapshotCompatibility: 'current',
      assessmentCompatibility: 'missing',
      canOpenProfile: false,
      canMaterialize: true,
      canUseSavedResult: false,
      shouldRetake: false,
    });
  }
  const assessmentEligibility = getMovementProfileV2AssessmentPersistenceEligibility({
    checkUp: input.checkUp,
    checkupType: input.checkupType,
    snapshot: validSnapshot,
    assessment: assessmentValue,
  });
  if (!assessmentEligibility.eligible) {
    if (assessmentEligibility.compatibility === 'missing') {
      return state('snapshot_missing_assessment', {
        sourceEligible,
        protocolSupported,
        snapshotCompatibility: 'current',
        assessmentCompatibility: assessmentEligibility.compatibility,
        canOpenProfile: false,
        canMaterialize: true,
        canUseSavedResult: false,
        shouldRetake: false,
      });
    }
    if (assessmentEligibility.compatibility === 'future_schema') {
      return state('unsupported_future_artifact', {
        sourceEligible,
        protocolSupported,
        snapshotCompatibility: 'current',
        assessmentCompatibility: assessmentEligibility.compatibility,
        canOpenProfile: false,
        canMaterialize: false,
        canUseSavedResult: false,
        shouldRetake: true,
      });
    }
    if (assessmentEligibility.compatibility === 'conflict') {
      return state('immutable_conflict', {
        sourceEligible,
        protocolSupported,
        snapshotCompatibility: 'current',
        assessmentCompatibility: assessmentEligibility.compatibility,
        canOpenProfile: false,
        canMaterialize: false,
        canUseSavedResult: false,
        shouldRetake: true,
      });
    }
    return state('assessment_malformed_or_mismatched', {
      sourceEligible,
      protocolSupported,
      snapshotCompatibility: 'current',
      assessmentCompatibility: assessmentEligibility.compatibility,
      canOpenProfile: false,
      canMaterialize: false,
      canUseSavedResult: false,
      shouldRetake: true,
    });
  }

  return state(input.syncPending ? 'sync_pending_local_ready' : 'ready', {
    sourceEligible,
    protocolSupported,
    snapshotCompatibility: 'current',
    assessmentCompatibility: 'current',
    canOpenProfile: true,
    canMaterialize: false,
    canUseSavedResult: true,
    shouldRetake: false,
  });
}

export function movementProfileV2RecoveryCopy(
  stateKind: MovementProfileV2RecoveryStateKind
): MovementProfileV2RecoveryCopy {
  switch (stateKind) {
    case 'ready':
      return {
        title: 'Movement Profile ready',
        body: 'Your saved Movement Profile is ready to open.',
        primaryAction: 'open_profile',
        primaryLabel: 'Open profile',
      };
    case 'sync_pending_local_ready':
      return {
        title: 'Saved on this phone',
        body: 'Your result is ready here. Any shared status can update later.',
        primaryAction: 'use_saved',
        primaryLabel: 'Use saved result',
        secondaryLabel: 'Open profile',
      };
    case 'raw_complete_missing_snapshot':
      return {
        title: 'Finish saved results',
        body: `The camera capture is saved. ${BRAND.appName} needs to finish preparing the saved result before it can be shown.`,
        primaryAction: 'finish_details',
        primaryLabel: 'Finish details',
        secondaryLabel: 'Retake',
      };
    case 'snapshot_missing_assessment':
      return {
        title: 'Finish saved results',
        body: 'The saved result needs one final local step before your Movement Profile can open.',
        primaryAction: 'finish_details',
        primaryLabel: 'Finish details',
        secondaryLabel: 'Retake',
      };
    case 'raw_incomplete':
      return {
        title: 'Retake Movement Profile',
        body: 'This capture does not include enough measured items to prepare a Movement Profile.',
        primaryAction: 'retake',
        primaryLabel: 'Retake',
        secondaryLabel: 'Start fresh',
      };
    case 'snapshot_malformed_or_mismatched':
      return {
        title: 'Start fresh',
        body: 'This saved item cannot be opened reliably. A fresh capture will create a clean Movement Profile.',
        primaryAction: 'start_fresh',
        primaryLabel: 'Start fresh',
        secondaryLabel: 'Retake',
      };
    case 'assessment_malformed_or_mismatched':
      return {
        title: 'Start fresh',
        body: 'This saved result cannot be opened reliably. A fresh capture will create a clean Movement Profile.',
        primaryAction: 'start_fresh',
        primaryLabel: 'Start fresh',
        secondaryLabel: 'Retake',
      };
    case 'immutable_conflict':
      return {
        title: 'Start fresh',
        body: 'Two saved versions point to the same capture. A fresh capture keeps your Movement Profile simple.',
        primaryAction: 'start_fresh',
        primaryLabel: 'Start fresh',
        secondaryLabel: 'Retake',
      };
    case 'unsupported_future_artifact':
      return {
        title: 'Update needed',
        body: `This saved result was prepared by a newer ${BRAND.appName} version. Update ${BRAND.appName} or retake when you are ready.`,
        primaryAction: 'retake',
        primaryLabel: 'Retake',
        secondaryLabel: 'Cancel',
      };
  }
}

function state(
  kind: MovementProfileV2RecoveryStateKind,
  input: {
    sourceEligible: boolean;
    protocolSupported: boolean;
    snapshotCompatibility?: MovementProfileV2SnapshotCompatibility;
    assessmentCompatibility?: MovementProfileV2AssessmentCompatibility;
    canOpenProfile: boolean;
    canMaterialize: boolean;
    canUseSavedResult: boolean;
    shouldRetake: boolean;
  }
): MovementProfileV2RecoveryState {
  return {
    kind,
    canOpenProfile: input.canOpenProfile,
    canMaterialize: input.canMaterialize,
    canUseSavedResult: input.canUseSavedResult,
    shouldRetake: input.shouldRetake,
    diagnostic: {
      snapshotCompatibility: input.snapshotCompatibility,
      assessmentCompatibility: input.assessmentCompatibility,
      sourceEligible: input.sourceEligible,
      protocolSupported: input.protocolSupported,
    },
  };
}
