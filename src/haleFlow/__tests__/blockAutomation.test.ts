import {
  createLifeGoal,
  defaultAdherenceStoreState,
} from '../../adherence';
import { syntheticCheckUp } from '../../checkup/devFixture';
import { createCurrentVersionedScoreSnapshot } from '../../scoring';
import { defaultTrainingState } from '../../training';
import { createMovementAssessment } from '../assessments';
import { createAutomaticMovementBlock } from '../blockAutomation';

const START = '2026-06-21T08:00:00.000Z';

function scoredCheckUp() {
  const checkUp = syntheticCheckUp(START);
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return { checkUp, score: scored.score, scoreSnapshot: scored.snapshot };
}

describe('createAutomaticMovementBlock', () => {
  it('creates a current block from an eligible official check-up', () => {
    const { checkUp, score, scoreSnapshot } = scoredCheckUp();
    const assessment = createMovementAssessment({
      checkUpId: checkUp.startedAt,
      type: 'baseline',
      score,
      scoreSnapshot,
      completedAt: START,
      isOfficialForProgress: true,
    });

    const result = createAutomaticMovementBlock({
      adherence: defaultAdherenceStoreState(),
      training: defaultTrainingState(),
      sourceCheckUpId: checkUp.startedAt,
      assessment,
      score,
      scoreSnapshot,
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      user: { age: 61 },
      nowIso: START,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.movementBlock.sourceAssessmentId).toBe(checkUp.startedAt);
    expect(result.adherence.blocks).toContainEqual(result.movementBlock);
    expect(result.training.block).toEqual(result.trainingBlock);
    expect(result.training.progress.completedSessions).toBe(0);
  });

  it('does not create a block from a manual extra check-up', () => {
    const { checkUp, score, scoreSnapshot } = scoredCheckUp();
    const assessment = createMovementAssessment({
      checkUpId: checkUp.startedAt,
      type: 'manual_extra',
      score,
      scoreSnapshot,
      completedAt: START,
    });

    const result = createAutomaticMovementBlock({
      adherence: defaultAdherenceStoreState(),
      training: defaultTrainingState(),
      sourceCheckUpId: checkUp.startedAt,
      assessment,
      score,
      scoreSnapshot,
      nowIso: START,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.eligibility.reason).toBe('non_official_assessment');
  });
});
