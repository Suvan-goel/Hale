import type {
  MovementProfileV2Assessment,
  MovementProfileV2SuggestedFocus,
} from '../../reference/movementProfileV2/assessment';
import {
  PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
  createProgrammePhasePrescription,
  derivePhysicalTrainingFocus,
} from '../prescription';

describe('programme phase prescription', () => {
  it.each([
    ['strength_power', 'strength', 'strength_each_session'],
    ['balance', 'balance', 'balance_each_session'],
  ] as const)(
    'maps canonical %s focus to physical %s emphasis',
    (focusDomain, physicalFocus, strategy) => {
      const source = assessment(
        domainFocus(focusDomain),
        focusDomain === 'strength_power' ? 'checkup-strength' : 'checkup-balance'
      );
      const result = createProgrammePhasePrescription(source, 1);

      expect(result).toMatchObject({
        ok: true,
        prescription: {
          phase: 1,
          physicalFocus,
          dosePolicy: {
            plannedFocusBlocksPerWeek: 3,
            focusBlockStrategy: strategy,
          },
          sourceAssessmentId: source.assessmentId,
          sourceAssessmentFingerprint: source.assessmentFingerprint,
          sourceCheckUpId: source.sourceCheckUpId,
          policyFingerprint: PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
        },
      });
    }
  );

  it('maps the canonical balanced decision to an alternating physical focus', () => {
    const source = assessment({
      kind: 'balanced',
      planMode: 'balanced_insufficient_reference',
      reason: 'v2_focus_balanced_no_unique_signal',
      candidateDomains: [],
    });

    expect(createProgrammePhasePrescription(source, 2)).toMatchObject({
      ok: true,
      prescription: {
        phase: 2,
        physicalFocus: 'balanced',
        canonicalFocus: { kind: 'balanced', domain: null },
        dosePolicy: { focusBlockStrategy: 'alternate_strength_balance' },
      },
    });
  });

  it('fails closed for needs-retake and unsupported mobility decisions', () => {
    const needsRetake = assessment({
      kind: 'needs_retake',
      planMode: 'needs_retake',
      reason: 'v2_focus_needs_retake',
      invalidDomains: ['balance'],
    });
    const mobility = assessment(domainFocus('mobility'));

    expect(derivePhysicalTrainingFocus(needsRetake)).toEqual({
      ok: false,
      reason: 'needs_retake',
    });
    expect(createProgrammePhasePrescription(needsRetake, 1)).toEqual({
      ok: false,
      reason: 'needs_retake',
    });
    expect(createProgrammePhasePrescription(mobility, 1)).toEqual({
      ok: false,
      reason: 'unsupported_focus_domain',
      unsupportedDomain: 'mobility',
    });
  });

  it('is deterministic and keeps each phase tied to the stored assessment artifact', () => {
    const source = assessment(domainFocus('balance'));
    const first = createProgrammePhasePrescription(source, 3);
    const replay = createProgrammePhasePrescription(source, 3);
    const anotherPhase = createProgrammePhasePrescription(source, 2);

    expect(replay).toEqual(first);
    expect(first.ok && replay.ok && first.prescription.prescriptionId).toBe(
      replay.ok ? replay.prescription.prescriptionId : ''
    );
    expect(first.ok && anotherPhase.ok && first.prescription.prescriptionId).not.toBe(
      anotherPhase.ok ? anotherPhase.prescription.prescriptionId : ''
    );
  });
});

function domainFocus(
  focusDomain: 'strength_power' | 'balance' | 'mobility'
): MovementProfileV2SuggestedFocus {
  return {
    kind: 'domain',
    focusDomain,
    planMode: 'checkup_reference_focus',
    reason: 'v2_focus_single_below_reference',
    candidateDomains: [focusDomain],
  };
}

function assessment(
  focus: MovementProfileV2SuggestedFocus,
  sourceCheckUpId = 'checkup-baseline'
): MovementProfileV2Assessment {
  return {
    kind: 'movement_profile_v2_assessment',
    schemaVersion: 1,
    assessmentId: `assessment-${sourceCheckUpId}`,
    assessmentFingerprint: `assessment-fingerprint-${sourceCheckUpId}`,
    sourceSnapshotId: `snapshot-${sourceCheckUpId}`,
    sourceSnapshotFingerprint: `snapshot-fingerprint-${sourceCheckUpId}`,
    sourceCheckUpId,
    sourceCheckUpType: 'baseline',
    createdAt: '2026-06-01T08:00:00.000Z',
    focus,
    focusProvenance: {
      decisionReason: focus.reason,
    },
  } as MovementProfileV2Assessment;
}
