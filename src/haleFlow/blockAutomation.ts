import {
  createMovementBlockFromAssessment,
  generateMilestones,
  mergeMilestones,
  upsertMovementBlock,
  type AdherenceStoreState,
  type LifeGoal,
  type MovementAssessment,
  type MovementBlock,
} from '../adherence';
import type { UserProfile } from '../profile';
import type { CheckUpScore, VersionedCheckUpScoreSnapshot } from '../scoring';
import {
  buildBlock,
  initialLadderProgressFromCheckUp,
  startBlock,
  type TrainingBlock,
  type TrainingState,
} from '../training';
import { getBlockCreationEligibility, type BlockCreationEligibility } from './assessmentEligibility';

export type AutomaticBlockCreationResult =
  | {
      ok: true;
      adherence: AdherenceStoreState;
      training: TrainingState;
      movementBlock: MovementBlock;
      trainingBlock: TrainingBlock;
    }
  | {
      ok: false;
      eligibility: Extract<BlockCreationEligibility, { eligible: false }>;
    };

export function createAutomaticMovementBlock({
  adherence,
  training,
  sourceCheckUpId,
  assessment,
  score,
  scoreSnapshot,
  lifeGoal,
  user,
  nowIso,
}: {
  adherence: AdherenceStoreState;
  training: TrainingState;
  sourceCheckUpId: string;
  assessment: MovementAssessment | null | undefined;
  score: CheckUpScore;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  lifeGoal?: LifeGoal | null;
  user?: Pick<UserProfile, 'age'> | null;
  nowIso: string;
}): AutomaticBlockCreationResult {
  const eligibility = getBlockCreationEligibility({ score, scoreSnapshot, assessment });
  if (!eligibility.eligible) return { ok: false, eligibility };

  const trainingBlock = buildBlock(score, training.equipment, nowIso);
  const movementBlock = createMovementBlockFromAssessment({
    latestAssessment: { score, scoreSnapshot, sourceCheckUpId, assessment },
    lifeGoal,
    startDate: nowIso,
  });
  let nextAdherence = upsertMovementBlock(adherence, movementBlock);
  nextAdherence = mergeMilestones(
    nextAdherence,
    generateMilestones({
      user,
      block: movementBlock,
      lifeGoal,
      latestAssessment: score,
      completions: nextAdherence.completions,
      existing: nextAdherence.milestones,
      nowIso,
    })
  );

  const startedTraining = startBlock(training, trainingBlock);
  return {
    ok: true,
    adherence: nextAdherence,
    training: {
      ...startedTraining,
      // Seeds only ladders the user has never touched, from the check-up's
      // own measured value (never age) — training-earned progress is
      // untouched. See docs/decisions.md.
      ladderProgressById: initialLadderProgressFromCheckUp({
        previousLadderProgress: startedTraining.ladderProgressById,
        score,
        nowIso,
      }),
    },
    movementBlock,
    trainingBlock,
  };
}
