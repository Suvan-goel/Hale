import type { MovementAssessment } from '../adherence/types';
import type { CheckUpScore, VersionedCheckUpScoreSnapshot } from '../scoring';
import { getBlockCreationEligibility, type BlockCreationEligibility } from './assessmentEligibility';
import { headlineEvidenceFromScore, isOfficialCheckupType } from './assessmentEvidence';

export type AssessmentResultPrimaryAction = 'create_block' | 'retake_checkup' | 'done';

export interface AssessmentResultState {
  eligibility: BlockCreationEligibility;
  canCreateBlock: boolean;
  primaryAction: AssessmentResultPrimaryAction;
  recoveryTitle?: string;
  recoveryBody?: string;
  canRetake: boolean;
}

export function getAssessmentResultState({
  score,
  scoreSnapshot,
  assessment,
}: {
  score: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  assessment?: MovementAssessment | null;
}): AssessmentResultState {
  const eligibility = getBlockCreationEligibility({ score, scoreSnapshot, assessment });
  if (eligibility.eligible) {
    return {
      eligibility,
      canCreateBlock: true,
      canRetake: false,
      primaryAction: 'create_block',
    };
  }

  const evidence = headlineEvidenceFromScore(score);
  const isExtra = assessment ? !assessment.isOfficialForProgress || !isOfficialCheckupType(assessment.type) : false;
  if (isExtra && evidence.complete) {
    return {
      eligibility,
      canCreateBlock: false,
      canRetake: false,
      primaryAction: 'done',
      recoveryTitle: 'Extra check-up saved',
      recoveryBody: 'These results are available to review, but they will not replace your official baseline, progress trend, or next training block.',
    };
  }

  const missing = evidence.missingDomains.length > 0 ? missingDomainsText(evidence.missingDomains) : 'the missing sections';
  return {
    eligibility,
    canCreateBlock: false,
    canRetake: true,
    primaryAction: 'retake_checkup',
    recoveryTitle:
      evidence.measuredDomainCount > 0
        ? "A few measurements need a retry."
        : "We couldn't get enough reliable measurements to build your plan.",
    recoveryBody:
      evidence.measuredDomainCount > 0
        ? `Your saved results are incomplete. Retry ${missing} when you are ready.`
        : 'Adjust the phone setup, make sure the room is well lit, and repeat the Movement Check-Up when you are ready.',
  };
}

function missingDomainsText(domains: readonly string[]): string {
  const labels = domains.map((domain) => {
    if (domain === 'strength_power') return 'strength';
    return domain;
  });
  if (labels.length <= 1) return labels[0] ?? 'the missing section';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}
