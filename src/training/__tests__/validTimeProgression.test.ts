import { BRIDGE_HOLD_ID } from '../../exercises';
import type { SetResult } from '../../exercises';
import type { ValidTimeResult } from '../../exercises/validTime';
import type { TrainingSessionResult } from '../sessionPlayer';
import {
  classifyValidTimePerformance,
  summarizeValidTimeSets,
  validTimeSessionSummaryCards,
} from '../validTimeProgression';

describe('valid-time progression signals', () => {
  it('classifies strong, reset-heavy, incomplete, uncertain, and absent metadata', () => {
    expect(classifyValidTimePerformance(validTime())).toBe('strong');
    expect(classifyValidTimePerformance(validTime({ pauseCount: 3, wallClockSeconds: 42, longestContinuousValidSeconds: 10 }))).toBe(
      'completed_with_resets'
    );
    expect(
      classifyValidTimePerformance(
        validTime({
          accumulatedValidSeconds: 12,
          longestContinuousValidSeconds: 12,
          completedByValidTime: false,
          endedBySafetyCap: true,
        })
      )
    ).toBe('incomplete');
    expect(classifyValidTimePerformance(validTime({ trackingLostSeconds: 5 }))).toBe('tracking_uncertain');
    expect(classifyValidTimePerformance(undefined)).toBe('not_applicable');
  });

  it('aggregates set-level signals without letting partial metadata look strong', () => {
    const summary = summarizeValidTimeSets([set(validTime()), set()]);

    expect(summary?.signal).toBe('tracking_uncertain');
  });

  it('builds calm user-facing session notes from valid-time results', () => {
    const session: TrainingSessionResult = {
      startedAt: '2026-06-17T09:00:00.000Z',
      items: [
        {
          exerciseId: BRIDGE_HOLD_ID,
          status: 'completed',
          sets: [set(validTime({ targetValidSeconds: 30, accumulatedValidSeconds: 30, wallClockSeconds: 32, longestContinuousValidSeconds: 26 }))],
        },
      ],
    };

    expect(validTimeSessionSummaryCards(session)).toEqual([
      {
        exerciseId: BRIDGE_HOLD_ID,
        title: 'Bridge Hold',
        signal: 'strong',
        lines: ['You held 30 seconds total.', 'Longest steady stretch: 26 seconds.'],
      },
    ]);
  });
});

function validTime(overrides: Partial<ValidTimeResult> = {}): ValidTimeResult {
  return {
    targetValidSeconds: 20,
    accumulatedValidSeconds: 20,
    wallClockSeconds: 22,
    pauseCount: 0,
    longestContinuousValidSeconds: 20,
    positionLostEvents: 0,
    trackingLostSeconds: 0,
    completedByValidTime: true,
    endedBySafetyCap: false,
    validationMode: 'strict_valid_position',
    ...overrides,
  };
}

function set(validTimeResult?: ValidTimeResult): SetResult {
  return {
    exerciseId: BRIDGE_HOLD_ID,
    reps: 0,
    meanVel: NaN,
    holdSec: validTimeResult?.accumulatedValidSeconds ?? NaN,
    romPeak: NaN,
    autoregulated: false,
    reachedTarget: validTimeResult?.completedByValidTime ?? false,
    interruptions: 0,
    flags: [],
    ...(validTimeResult ? { validTime: validTimeResult } : {}),
  };
}
