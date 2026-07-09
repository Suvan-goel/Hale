import { applyOfficialAssessmentToProgrammeJourney } from '../journey';
import { officialCheckUpAccess } from '../officialCheckUpAccess';
import { defaultProgrammeState } from '../serialize';
import type { MovementProfileV2Assessment } from '../../reference/movementProfileV2';

const BASELINE_AT = '2026-01-01T10:00:00.000Z';

function assessment(): MovementProfileV2Assessment {
  return {
    kind: 'movement_profile_v2_assessment',
    schemaVersion: 1,
    assessmentId: 'assessment-1',
    assessmentFingerprint: 'fingerprint-1',
    sourceSnapshotId: 'snapshot-1',
    sourceSnapshotFingerprint: 'snapshot-fingerprint-1',
    sourceCheckUpId: 'checkup-1',
    sourceCheckUpType: 'baseline',
    createdAt: BASELINE_AT,
    focus: {
      kind: 'balanced',
      planMode: 'balanced_insufficient_reference',
      reason: 'v2_focus_balanced_no_unique_signal',
      candidateDomains: [],
    },
    focusProvenance: {
      decisionReason: 'v2_focus_balanced_no_unique_signal',
    },
  } as unknown as MovementProfileV2Assessment;
}

function eligibleState() {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true };
  return state;
}

describe('officialCheckUpAccess', () => {
  it('allows an eligible baseline and staged-draft resume', () => {
    const state = eligibleState();
    expect(officialCheckUpAccess(state, BASELINE_AT)).toEqual({
      allowed: true,
      mode: 'baseline',
    });
    expect(officialCheckUpAccess(state, BASELINE_AT, { hasDraft: true })).toEqual({
      allowed: true,
      mode: 'resume_draft',
    });
  });

  it('blocks consent and Gentle Start before considering a draft', () => {
    const declined = defaultProgrammeState();
    expect(officialCheckUpAccess(declined, BASELINE_AT, { hasDraft: true })).toEqual({
      allowed: false,
      reason: 'health_data_consent_required',
    });
    const gentle = eligibleState();
    gentle.profile = {
      ...gentle.profile,
      gentleStartActive: true,
      gpConfirmed: false,
      assessmentStatus: 'bypassed_b1',
    };
    expect(officialCheckUpAccess(gentle, BASELINE_AT)).toEqual({
      allowed: false,
      reason: 'gentle_start_safety_gate',
    });
  });

  it('allows active retests only when the phase is due', () => {
    const state = eligibleState();
    const applied = applyOfficialAssessmentToProgrammeJourney(state.journey, {
      assessment: assessment(),
      completedAtIso: BASELINE_AT,
    });
    if (applied.kind !== 'advanced') throw new Error('baseline did not start journey');
    state.journey = applied.state;
    expect(officialCheckUpAccess(state, '2026-01-28T10:00:00.000Z')).toEqual({
      allowed: false,
      reason: 'retest_not_due',
    });
    expect(officialCheckUpAccess(state, '2026-01-29T10:00:00.000Z')).toEqual({
      allowed: true,
      mode: 'retest',
    });
  });

  it('blocks a completed journey', () => {
    const state = eligibleState();
    state.journey = { ...state.journey, status: 'completed', completedAtIso: BASELINE_AT };
    expect(officialCheckUpAccess(state, '2026-05-01T10:00:00.000Z')).toEqual({
      allowed: false,
      reason: 'journey_completed',
    });
  });
});
