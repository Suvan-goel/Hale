import { STS_STANDARD_ID } from '../../exercises';
import { getLadderProgressCards } from '../progressViewModel';

const START = '2026-06-01T08:00:00.000Z';

describe('progressViewModel', () => {
  it('returns an empty ladder state without crashing', () => {
    expect(getLadderProgressCards({})).toEqual([]);
    expect(getLadderProgressCards(null)).toEqual([]);
    expect(getLadderProgressCards(undefined)).toEqual([]);
  });

  it('shows current movement ladder levels', () => {
    const cards = getLadderProgressCards({
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: STS_STANDARD_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [1],
        recentRpe: [2],
        recentPain: [false],
        readyToProgress: true,
        updatedAt: START,
      },
    });

    expect(cards[0]).toMatchObject({
      title: 'Sit-to-Stand',
      status: 'Ready for next step',
    });
  });
});
