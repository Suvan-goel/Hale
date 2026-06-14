/**
 * Block assignment: a check-up score → a 12-session 4-week block biased to the
 * weakest domain, and the launch-time resolution of slots into runnable
 * exercises (current level + equipment substitution). Asserts the bias, that a
 * missing stair/band substitutes a zero-equipment item, and that EVERY session
 * of EVERY block resolves with no dead end.
 */

import { getExercise } from '../../exercises';
import { CheckUpScore, Domain } from '../../scoring';
import {
  DEFAULT_EQUIPMENT,
  EquipmentProfile,
  blockComplete,
  buildBlock,
  resolveSession,
  resolveSlot,
  totalSessions,
} from '../block';
import { initialProgressionState } from '../progression';

function score(weakest: Domain | null): CheckUpScore {
  return { startedAt: '2026-06-14T08:00:00.000Z', domains: [], weakestDomain: weakest };
}

const AT = '2026-06-14T09:00:00.000Z';

describe('buildBlock structure', () => {
  it('is 4 weeks × 3 sessions, correctly indexed', () => {
    const block = buildBlock(score('strength'), DEFAULT_EQUIPMENT, AT);
    expect(block.sessions).toHaveLength(12);
    expect(totalSessions(block)).toBe(12);
    expect(block.sessions[0]).toMatchObject({ index: 0, week: 1, dayOfWeek: 1 });
    expect(block.sessions[11]).toMatchObject({ index: 11, week: 4, dayOfWeek: 3 });
    expect(block.weakestDomain).toBe('strength');
  });
});

describe('weakest-domain bias', () => {
  const finisherFamily = (s: CheckUpScore) =>
    buildBlock(s, DEFAULT_EQUIPMENT, AT).sessions[0].slots.find((x) => x.slot === 'power')!.family;
  const firstSlot = (s: CheckUpScore) => buildBlock(s, DEFAULT_EQUIPMENT, AT).sessions[0].slots[0];

  it('strength → leg-power finisher, lower-push leads', () => {
    expect(finisherFamily(score('strength'))).toBe('step-up');
    expect(firstSlot(score('strength'))).toMatchObject({ slot: 'lower-push', family: 'sit-to-stand' });
  });

  it('balance → balance finisher and balance leads', () => {
    expect(finisherFamily(score('balance'))).toBe('balance');
    expect(firstSlot(score('balance')).slot).toBe('balance');
  });

  it('mobility → mobility finisher and a mobility item leads', () => {
    expect(finisherFamily(score('mobility'))).toBe('hamstring-reach');
    expect(firstSlot(score('mobility')).family).toBe('hamstring-reach');
  });

  it('an unmeasured check-up still produces a runnable default block', () => {
    const block = buildBlock(score(null), DEFAULT_EQUIPMENT, AT);
    expect(block.sessions).toHaveLength(12);
    expect(block.weakestDomain).toBeNull();
  });
});

describe('slot resolution + equipment substitution', () => {
  const prog = initialProgressionState();

  it('substitutes power sit-to-stand for the step-up when there is no stair', () => {
    const block = buildBlock(score('strength'), { stair: false, band: false }, AT);
    const ids = resolveSession(block.sessions[0], prog, { stair: false, band: false });
    expect(ids).toContain('sts-standard'); // the step-up substitute
    expect(ids).not.toContain('step-up');
  });

  it('keeps the step-up when a stair is available', () => {
    const block = buildBlock(score('strength'), { stair: true, band: false }, AT);
    const ids = resolveSession(block.sessions[0], prog, { stair: true, band: false });
    expect(ids).toContain('step-up');
  });

  it('substitutes overhead reach for the banded press when there is no band', () => {
    // Progress the overhead family to its band level, then resolve without a band.
    const promoted = { levels: { overhead: 2 }, velHistory: {} };
    const id = resolveSlot({ slot: 'pull-reach', family: 'overhead' }, promoted, { stair: false, band: false });
    expect(id).toBe('overhead-reach');
    const withBand = resolveSlot({ slot: 'pull-reach', family: 'overhead' }, promoted, { stair: false, band: true });
    expect(withBand).toBe('overhead-press-band');
  });

  it('every session of every domain block resolves with no dead end', () => {
    const equips: EquipmentProfile[] = [
      { stair: false, band: false },
      { stair: true, band: true },
    ];
    for (const domain of ['strength', 'balance', 'mobility', null] as (Domain | null)[]) {
      for (const equipment of equips) {
        const block = buildBlock(score(domain), equipment, AT);
        for (const session of block.sessions) {
          const ids = resolveSession(session, initialProgressionState(), equipment);
          expect(ids).toHaveLength(session.slots.length);
          for (const id of ids) expect(() => getExercise(id)).not.toThrow();
        }
      }
    }
  });
});

describe('block completion', () => {
  it('is complete only once all sessions are done (the re-test trigger)', () => {
    const block = buildBlock(score('strength'), DEFAULT_EQUIPMENT, AT);
    expect(blockComplete(block, 11)).toBe(false);
    expect(blockComplete(block, 12)).toBe(true);
  });
});
