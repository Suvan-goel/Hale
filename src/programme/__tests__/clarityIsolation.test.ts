import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  MovementProfileV2Assessment,
  MovementProfileV2SuggestedFocus,
} from '../../reference/movementProfileV2/assessment';
import {
  applyOfficialAssessmentToProgrammeJourney,
  createEmptyProgrammeJourneyState,
} from '../journey';
import { createProgrammePhasePrescription } from '../prescription';

describe('physical programme isolation', () => {
  it('keeps non-physical check-up concepts out of journey and prescription modules', () => {
    const source = [
      readFileSync(join(__dirname, '..', 'journey.ts'), 'utf8'),
      readFileSync(join(__dirname, '..', 'prescription.ts'), 'utf8'),
    ].join('\n');

    expect(source).not.toMatch(/\bclarity\b/i);
    expect(source).not.toMatch(/\bselfReport\b/i);
    expect(source).not.toMatch(/\bdualTask\b/i);
  });

  it('ignores unrelated assessment appendices when deriving a plan or journey', () => {
    const physical = assessment();
    const withLowUnrelatedAppendix = {
      ...physical,
      clarityAppendix: { score: 1, note: 'noisy-day-a' },
    } as MovementProfileV2Assessment;
    const withHighUnrelatedAppendix = {
      ...physical,
      clarityAppendix: { score: 99, note: 'noisy-day-b' },
    } as MovementProfileV2Assessment;

    expect(createProgrammePhasePrescription(withLowUnrelatedAppendix, 1)).toEqual(
      createProgrammePhasePrescription(withHighUnrelatedAppendix, 1)
    );

    const empty = createEmptyProgrammeJourneyState();
    expect(
      applyOfficialAssessmentToProgrammeJourney(empty, {
        assessment: withLowUnrelatedAppendix,
        completedAtIso: '2026-06-01T08:00:00.000Z',
      })
    ).toEqual(
      applyOfficialAssessmentToProgrammeJourney(empty, {
        assessment: withHighUnrelatedAppendix,
        completedAtIso: '2026-06-01T08:00:00.000Z',
      })
    );
  });
});

function assessment(): MovementProfileV2Assessment {
  const focus: MovementProfileV2SuggestedFocus = {
    kind: 'domain',
    focusDomain: 'balance',
    planMode: 'checkup_reference_focus',
    reason: 'v2_focus_single_below_reference',
    candidateDomains: ['balance'],
  };
  return {
    kind: 'movement_profile_v2_assessment',
    schemaVersion: 1,
    assessmentId: 'assessment-baseline',
    assessmentFingerprint: 'assessment-fingerprint-baseline',
    sourceSnapshotId: 'snapshot-baseline',
    sourceSnapshotFingerprint: 'snapshot-fingerprint-baseline',
    sourceCheckUpId: 'checkup-baseline',
    sourceCheckUpType: 'baseline',
    createdAt: '2026-06-01T08:00:00.000Z',
    focus,
    focusProvenance: { decisionReason: focus.reason },
  } as MovementProfileV2Assessment;
}
