/**
 * Pain recurrence auto-exclusion (founder requirements, 2026-07-06):
 * (a) sessions never silently shrink — the generator BACKFILLS an excluded
 *     ladder's slot from the same slot's remaining candidates;
 * (b) reversal is a genuine fresh start;
 * (c) exclusion rides TrainingState — the store the generator reads — so
 *     excluded-in-telemetry-but-present-in-plan cannot exist.
 */

import { STS_STANDARD_ID } from '../../exercises';
import {
  activePainExclusionLadderIds,
  defaultPainHistory,
  PAIN_RECURRENCE_SESSION_COUNT,
  recordSessionPainEvents,
  reinstateLadder,
} from '../painHistory';
import {
  defaultTrainingState,
  deserializeTrainingState,
  serializeTrainingState,
} from '../serialize';
import {
  createTrainingBlockFromAssessment,
  generateTodaySession,
} from '../workoutGeneration';

const START = '2026-07-06T08:00:00.000Z';
const SESSION_1 = '2026-07-01T08:00:00.000Z';
const SESSION_2 = '2026-07-03T08:00:00.000Z';

function painEvent(exerciseId: string, atMs = 1000) {
  return { exerciseId, setIndex: 0, timestampMs: atMs };
}

describe('recurrence rule', () => {
  it('two pain events in ONE session do not exclude; a second session does', () => {
    expect(PAIN_RECURRENCE_SESSION_COUNT).toBe(2);
    const first = recordSessionPainEvents(
      defaultPainHistory(),
      [painEvent(STS_STANDARD_ID, 1000), painEvent(STS_STANDARD_ID, 90000)],
      SESSION_1
    );
    expect(first.newlyExcludedLadderIds).toEqual([]);
    expect(activePainExclusionLadderIds(first.history)).toEqual([]);

    const second = recordSessionPainEvents(first.history, [painEvent(STS_STANDARD_ID)], SESSION_2);
    expect(second.newlyExcludedLadderIds).toEqual(['sit-to-stand']);
    expect(activePainExclusionLadderIds(second.history)).toEqual(['sit-to-stand']);
    expect(second.history.exclusions[0].evidenceSessions).toEqual([SESSION_1, SESSION_2]);
  });

  it('an already-excluded ladder is not re-excluded, and unknown exercise ids are ignored', () => {
    const first = recordSessionPainEvents(defaultPainHistory(), [painEvent(STS_STANDARD_ID)], SESSION_1);
    const second = recordSessionPainEvents(first.history, [painEvent(STS_STANDARD_ID)], SESSION_2);
    const third = recordSessionPainEvents(
      second.history,
      [painEvent(STS_STANDARD_ID), painEvent('not-a-real-exercise')],
      '2026-07-05T08:00:00.000Z'
    );
    expect(third.newlyExcludedLadderIds).toEqual([]);
    expect(third.history.exclusions).toHaveLength(1);
  });

  it('reinstate is a fresh start: exclusion AND events cleared; two NEW sessions re-exclude', () => {
    const first = recordSessionPainEvents(defaultPainHistory(), [painEvent(STS_STANDARD_ID)], SESSION_1);
    const second = recordSessionPainEvents(first.history, [painEvent(STS_STANDARD_ID)], SESSION_2);
    const reinstated = reinstateLadder(second.history, 'sit-to-stand');
    expect(activePainExclusionLadderIds(reinstated)).toEqual([]);
    expect(reinstated.events).toEqual([]);

    const again1 = recordSessionPainEvents(reinstated, [painEvent(STS_STANDARD_ID)], '2026-07-10T08:00:00.000Z');
    expect(again1.newlyExcludedLadderIds).toEqual([]);
    const again2 = recordSessionPainEvents(again1.history, [painEvent(STS_STANDARD_ID)], '2026-07-12T08:00:00.000Z');
    expect(again2.newlyExcludedLadderIds).toEqual(['sit-to-stand']);
  });
});

describe('store integration (requirement c)', () => {
  it('painHistory round-trips through TrainingState; legacy files default cleanly', () => {
    const state = defaultTrainingState();
    const { history } = recordSessionPainEvents(
      recordSessionPainEvents(defaultPainHistory(), [painEvent(STS_STANDARD_ID)], SESSION_1).history,
      [painEvent(STS_STANDARD_ID)],
      SESSION_2
    );
    state.painHistory = history;
    const restored = deserializeTrainingState(serializeTrainingState(state));
    expect(restored?.painHistory.exclusions.map((x) => x.ladderId)).toEqual(['sit-to-stand']);
    expect(restored?.painHistory.events).toHaveLength(2);

    const legacy = JSON.parse(serializeTrainingState(defaultTrainingState()));
    delete legacy.payload.painHistory;
    const legacyRestored = deserializeTrainingState(JSON.stringify(legacy));
    expect(legacyRestored?.painHistory).toEqual(defaultPainHistory());
  });
});

describe('generator backfill (requirement a)', () => {
  function generate(painExcludedLadderIds?: readonly string[]) {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    return generateTodaySession({
      block,
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space'],
      painExcludedLadderIds,
    });
  }

  it('excluding sit-to-stand backfills the slot — session shape does not shrink', () => {
    const baseline = generate();
    const excluded = generate(['sit-to-stand']);

    expect(baseline.exercises.map((e) => e.ladderId)).toContain('sit-to-stand');
    expect(excluded.exercises.map((e) => e.ladderId)).not.toContain('sit-to-stand');
    expect(excluded.exercises.length).toBe(baseline.exercises.length);

    // The vacated slot is filled by another ladder of the same slot type.
    const baselineSlot = baseline.exercises.find((e) => e.ladderId === 'sit-to-stand')!;
    const replacement = excluded.exercises.find((e) => e.slotType === baselineSlot.slotType);
    expect(replacement).toBeDefined();
    expect(replacement!.ladderId).not.toBe('sit-to-stand');
  });

  it('the swap is explained in plain language with the doctor line, no diagnosis words', () => {
    const excluded = generate(['sit-to-stand']);
    const notes = excluded.exercises.flatMap((e) => e.substitutions ?? []);
    const painNote = notes.find((note) => note.includes('swapped out'));
    expect(painNote).toBeDefined();
    expect(painNote).toMatch(/worth mentioning to your doctor/);
    expect(painNote).toMatch(/bring it back any time in Settings/);
    expect(painNote).not.toMatch(/injur|diagnos|damage|tear|strain\b/i);
  });
});
