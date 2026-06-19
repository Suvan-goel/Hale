import type { MovementAssessment } from '../adherence/types';
import type { CheckUpScore } from '../scoring';
import { getBlockCreationEligibility, type BlockCreationEligibility } from './assessmentEligibility';

export type AssessmentResultPrimaryAction = 'create_block' | 'retake_checkup';

export interface AssessmentResultState {
  eligibility: BlockCreationEligibility;
  canCreateBlock: boolean;
  primaryAction: AssessmentResultPrimaryAction;
  recoveryTitle?: string;
  recoveryBody?: string;
}

export function getAssessmentResultState({
  score,
  assessment,
}: {
  score: CheckUpScore;
  assessment?: MovementAssessment | null;
}): AssessmentResultState {
  const eligibility = getBlockCreationEligibility({ score, assessment });
  if (eligibility.eligible) {
    return {
      eligibility,
      canCreateBlock: true,
      primaryAction: 'create_block',
    };
  }

  return {
    eligibility,
    canCreateBlock: false,
    primaryAction: 'retake_checkup',
    recoveryTitle: "We couldn't get enough reliable measurements to build your plan.",
    recoveryBody: 'Adjust the phone setup, make sure the room is well lit, and repeat the Movement Check-Up when you are ready.',
  };
}
