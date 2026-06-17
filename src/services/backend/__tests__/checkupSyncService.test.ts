import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import type { CheckUp } from '../../../checkup';
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
  });
});
