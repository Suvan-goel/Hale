import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import type { CheckUp } from '../../../checkup';
import { CURRENT_NORM_VERSION, CURRENT_SCORING_VERSION, createCurrentVersionedScoreSnapshot, type VersionedCheckUpScoreSnapshot } from '../../../scoring';
import { mapLocalCheckupToRemotePayload } from '../checkupSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

function checkUp(): CheckUp {
  return {
    startedAt: '2026-06-17T12:00:00.000Z',
    bodyUnit: 0.33,
    items: [
      {
        movementId: CHAIR_STAND_ID,
        status: 'measured',
        result: {
          movementId: CHAIR_STAND_ID,
          flags: [],
          interruptions: 0,
          reps: 14,
          repStats: [],
          sessionMeanVel: 0.28,
          sessionMeanPeakVel: 0.41,
          pushOffDetected: false,
          frames: [{ shouldNotUpload: true }],
        } as never,
      },
      {
        movementId: BALANCE_LADDER_ID,
        status: 'measured',
        result: {
          movementId: BALANCE_LADDER_ID,
          flags: [],
          interruptions: 0,
          stages: [],
          singleLegEyesOpenSec: 12,
          landmarks: [{ shouldNotUpload: true }],
        } as never,
      },
      {
        movementId: SHOULDER_FLEXION_ID,
        status: 'measured',
        result: {
          movementId: SHOULDER_FLEXION_ID,
          flags: [],
          interruptions: 0,
          peakFlexionDeg: 152,
        } as never,
      },
    ],
  };
}

describe('movement check-up sync mapping', () => {
  it('maps local check-up results into an idempotent remote payload', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline',
        completedAt: '2026-06-17T12:08:00.000Z',
      },
      'user-123'
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.local_checkup_id).toBe('2026-06-17T12:00:00.000Z');
    expect(payload.checkup_type).toBe('baseline');
    expect(payload.status).toBe('completed');
    expect(payload.body_unit).toBe(0.33);
    expect(payload.strength_power_score).toEqual(expect.any(Number));
    expect(payload.balance_score).toEqual(expect.any(Number));
    expect(payload.mobility_score).toEqual(expect.any(Number));
    expect(payload.weakest_domain).toMatch(/strength_power|balance|mobility/);
    expect(payload.created_locally_at).toBe('2026-06-17T12:00:00.000Z');
    expect(payload.completed_at).toBe('2026-06-17T12:08:00.000Z');
    expect(payload.derived_scores_json).toMatchObject({
      checkupType: 'baseline',
      exactCheckupType: 'baseline',
      scoreSnapshotCompatibility: 'current',
      scoringVersion: CURRENT_SCORING_VERSION,
      normVersion: CURRENT_NORM_VERSION,
    });
    expect(payload.derived_scores_json).toHaveProperty('scoreSnapshot');
    expect(payload.raw_checkup_json).toMatchObject({ checkupType: 'baseline' });
    expect(payload.raw_checkup_json).toHaveProperty('scoreSnapshot');

    const rawJson = JSON.stringify(payload.raw_checkup_json);
    expect(rawJson).not.toContain('frames');
    expect(rawJson).not.toContain('landmarks');
    expect(rawJson).not.toContain('shouldNotUpload');
  });

  it('maps local-only check-up variants to unknown when the remote enum has no exact type', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline_retake',
      },
      'user-123'
    );

    expect(payload.checkup_type).toBe('unknown');
    expect(payload.derived_scores_json).toMatchObject({
      checkupType: 'baseline_retake',
      exactCheckupType: 'baseline_retake',
    });
    expect(payload.raw_checkup_json).toMatchObject({ checkupType: 'baseline_retake' });
  });

  it('omits malformed movement scores from derived remote fields without dropping other domains', () => {
    const malformed = checkUp();
    (malformed.items[0].result as unknown as Record<string, unknown>).reps = '14';

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: malformed,
        checkupType: 'baseline',
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toEqual(expect.any(Number));
    expect(payload.mobility_score).toEqual(expect.any(Number));
    expect(payload.weakest_domain).not.toBe('strength_power');
    expect(JSON.stringify(payload.derived_scores_json)).not.toContain('14 reps');
  });

  it('does not silently rescore legacy history records when no snapshot is supplied', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline',
        scoreSnapshot: null,
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'legacy_unversioned',
      score: null,
    });
  });

  it('uses a supplied frozen snapshot instead of rescoring raw check-up measurements during sync', () => {
    const rawCheckUp = checkUp();
    const snapshotCheckUp = checkUp();
    const chair = snapshotCheckUp.items.find((item) => item.movementId === CHAIR_STAND_ID)!;
    (chair.result as unknown as Record<string, unknown>).reps = 8;
    const snapshotScore = createCurrentVersionedScoreSnapshot(snapshotCheckUp).snapshot!;
    const frozenStrengthMidpoint = domainMidpoint(snapshotScore.score, 'strength');
    const rawStrengthMidpoint = domainMidpoint(createCurrentVersionedScoreSnapshot(rawCheckUp).score, 'strength');

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        scoreSnapshot: snapshotScore,
      },
      'user-123'
    );

    expect(frozenStrengthMidpoint).not.toBe(rawStrengthMidpoint);
    expect(payload.strength_power_score).toBe(frozenStrengthMidpoint);
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshotCompatibility: 'current',
      score: snapshotScore.score,
    });
    expect(payload.raw_checkup_json).toMatchObject({ scoreSnapshot: snapshotScore });
  });

  it('keeps exact-tie focus metadata inside the synced score snapshot', () => {
    const rawCheckUp = checkUp();
    const snapshot = exactTieSnapshotFor(rawCheckUp);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'official_retest',
        scoreSnapshot: snapshot,
      },
      'user-123'
    );

    expect(payload.weakest_domain).toBe('balance');
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: {
        focusSelection: {
          kind: 'exact_tie',
          focusDomain: 'balance',
          tiedDomains: ['strength', 'balance'],
          tieBreakReason: 'preserve_current_focus',
        },
      },
    });
    expect(payload.raw_checkup_json).toMatchObject({
      scoreSnapshot: {
        focusSelection: {
          kind: 'exact_tie',
          focusDomain: 'balance',
        },
      },
    });
  });

  it('does not upload derived scores when a supplied snapshot source differs from the raw check-up', () => {
    const rawCheckUp = checkUp();
    const otherCheckUp = { ...checkUp(), startedAt: '2026-06-18T12:00:00.000Z' };
    const otherSnapshot = createCurrentVersionedScoreSnapshot(otherCheckUp).snapshot!;

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        scoreSnapshot: otherSnapshot,
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'invalid_snapshot',
      scoreSnapshotSchemaVersion: null,
      scoringVersion: null,
      normVersion: null,
      score: null,
    });
    expect(payload.raw_checkup_json).toMatchObject({ scoreSnapshot: null });
  });
});

function domainMidpoint(
  score: { domains: readonly { domain: string; ageLow: number | null; ageHigh: number | null }[] },
  domain: string
): number {
  const result = score.domains.find((item) => item.domain === domain)!;
  if (result.ageLow === null || result.ageHigh === null) throw new Error(`Domain ${domain} was not measured`);
  return (result.ageLow + result.ageHigh) / 2;
}

function exactTieSnapshotFor(checkUp: CheckUp): VersionedCheckUpScoreSnapshot {
  const snapshot = createCurrentVersionedScoreSnapshot(checkUp).snapshot!;
  return {
    ...snapshot,
    score: {
      ...snapshot.score,
      weakestDomain: 'balance',
      domains: snapshot.score.domains.map((domain) => {
        if (domain.domain === 'strength' || domain.domain === 'balance') {
          return { ...domain, measured: true, ageLow: 72, ageHigh: 76 };
        }
        return { ...domain, measured: true, ageLow: 58, ageHigh: 62 };
      }),
    },
    focusSelection: {
      kind: 'exact_tie',
      focusDomain: 'balance',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'preserve_current_focus',
    },
  };
}
