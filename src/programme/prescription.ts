/**
 * Pure, persisted input to one four-week programme phase.
 *
 * The canonical Movement Profile assessment owns the focus decision. This
 * module only maps that decision onto the physical training vocabulary the
 * programme can actually deliver. It deliberately has no dependency on raw
 * check-up appendices or session-generation code.
 */

import type {
  MovementProfileV2Assessment,
  MovementProfileV2FocusDecisionReason,
} from '../reference/movementProfileV2/assessment';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';

export const PROGRAMME_PHASE_NUMBERS = [1, 2, 3] as const;
export type ProgrammePhaseNumber = (typeof PROGRAMME_PHASE_NUMBERS)[number];

export const PHYSICAL_TRAINING_FOCI = ['strength', 'balance', 'balanced'] as const;
export type PhysicalTrainingFocus = (typeof PHYSICAL_TRAINING_FOCI)[number];

export const PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION = 1 as const;
export const PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION = 1 as const;

export type ProgrammeFocusBlockStrategy =
  | 'strength_each_session'
  | 'balance_each_session'
  | 'alternate_strength_balance';

/**
 * A small policy token rather than exercise details. The session generator
 * can evolve the exact exercises without silently changing a saved phase's
 * intended emphasis.
 */
export interface ProgrammePhaseDosePolicy {
  readonly plannedFocusBlocksPerWeek: 3;
  readonly focusBlockStrategy: ProgrammeFocusBlockStrategy;
}

export interface ProgrammeCanonicalFocusReference {
  readonly kind: 'domain' | 'balanced';
  readonly domain: 'strength_power' | 'balance' | null;
  readonly planMode: MovementProfileV2Assessment['focus']['planMode'];
  readonly decisionReason: MovementProfileV2FocusDecisionReason;
}

/**
 * Immutable-by-contract phase prescription. Its source ids and policy
 * fingerprint let storage and UI use the same frozen decision later rather
 * than recomputing focus from changing policy or raw measurements.
 */
export interface ProgrammePhasePrescription {
  readonly schemaVersion: typeof PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION;
  readonly policyVersion: typeof PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION;
  readonly policyFingerprint: string;
  readonly prescriptionId: string;
  readonly phase: ProgrammePhaseNumber;
  readonly physicalFocus: PhysicalTrainingFocus;
  readonly dosePolicy: ProgrammePhaseDosePolicy;
  readonly canonicalFocus: ProgrammeCanonicalFocusReference;
  readonly sourceAssessmentId: string;
  readonly sourceAssessmentFingerprint: string;
  readonly sourceCheckUpId: string;
  readonly sourceCheckUpType: MovementProfileV2Assessment['sourceCheckUpType'];
  readonly createdAtIso: string;
}

export type PhysicalTrainingFocusDerivation =
  | {
      readonly ok: true;
      readonly physicalFocus: PhysicalTrainingFocus;
      readonly canonicalFocus: ProgrammeCanonicalFocusReference;
    }
  | {
      readonly ok: false;
      readonly reason: 'needs_retake' | 'unsupported_focus_domain';
      readonly unsupportedDomain?: 'mobility';
    };

export type ProgrammePhasePrescriptionResult =
  | {
      readonly ok: true;
      readonly prescription: ProgrammePhasePrescription;
    }
  | {
      readonly ok: false;
      readonly reason: 'needs_retake' | 'unsupported_focus_domain';
      readonly unsupportedDomain?: 'mobility';
    };

const PHASE_DOSE_POLICY_BY_FOCUS: Readonly<
  Record<PhysicalTrainingFocus, ProgrammePhaseDosePolicy>
> = {
  strength: {
    plannedFocusBlocksPerWeek: 3,
    focusBlockStrategy: 'strength_each_session',
  },
  balance: {
    plannedFocusBlocksPerWeek: 3,
    focusBlockStrategy: 'balance_each_session',
  },
  balanced: {
    plannedFocusBlocksPerWeek: 3,
    focusBlockStrategy: 'alternate_strength_balance',
  },
};

export const PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT = deterministicFingerprint(
  'programme-phase-prescription-policy-v1',
  {
    version: PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION,
    canonicalMapping: {
      strength_power: 'strength',
      balance: 'balance',
      balanced: 'balanced',
      mobility: 'balanced_strength_balance_fallback',
      needs_retake: 'reject',
    },
    dosePolicyByFocus: PHASE_DOSE_POLICY_BY_FOCUS,
  }
);

/** Map a validated canonical assessment onto the programme's physical focus. */
export function derivePhysicalTrainingFocus(
  assessment: MovementProfileV2Assessment
): PhysicalTrainingFocusDerivation {
  const { focus } = assessment;
  if (focus.kind === 'needs_retake') {
    return { ok: false, reason: 'needs_retake' };
  }

  if (focus.kind === 'balanced') {
    return {
      ok: true,
      physicalFocus: 'balanced',
      canonicalFocus: {
        kind: 'balanced',
        domain: null,
        planMode: focus.planMode,
        decisionReason: focus.reason,
      },
    };
  }

  if (focus.focusDomain === 'mobility') {
    return {
      ok: true,
      physicalFocus: 'balanced',
      canonicalFocus: {
        kind: 'balanced',
        domain: null,
        planMode: 'balanced_insufficient_reference',
        decisionReason: focus.reason,
      },
    };
  }

  const physicalFocus: PhysicalTrainingFocus =
    focus.focusDomain === 'strength_power' ? 'strength' : 'balance';
  return {
    ok: true,
    physicalFocus,
    canonicalFocus: {
      kind: 'domain',
      domain: focus.focusDomain,
      planMode: focus.planMode,
      decisionReason: focus.reason,
    },
  };
}

/**
 * Freeze the canonical decision and its provenance for a specific phase.
 * Runtime validation of the assessment belongs to its reference module; this
 * function accepts the already validated, stored assessment artifact.
 */
export function createProgrammePhasePrescription(
  assessment: MovementProfileV2Assessment,
  phase: ProgrammePhaseNumber
): ProgrammePhasePrescriptionResult {
  const derived = derivePhysicalTrainingFocus(assessment);
  if (!derived.ok) return derived;

  const dosePolicy: ProgrammePhaseDosePolicy = {
    ...PHASE_DOSE_POLICY_BY_FOCUS[derived.physicalFocus],
  };
  const fingerprintInput = {
    schemaVersion: PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION,
    policyVersion: PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION,
    policyFingerprint: PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
    phase,
    physicalFocus: derived.physicalFocus,
    dosePolicy,
    canonicalFocus: derived.canonicalFocus,
    sourceAssessmentId: assessment.assessmentId,
    sourceAssessmentFingerprint: assessment.assessmentFingerprint,
    sourceCheckUpId: assessment.sourceCheckUpId,
    sourceCheckUpType: assessment.sourceCheckUpType,
    createdAtIso: assessment.createdAt,
  };

  return {
    ok: true,
    prescription: {
      ...fingerprintInput,
      prescriptionId: deterministicFingerprint(
        'programme-phase-prescription-v1',
        fingerprintInput
      ),
    },
  };
}
