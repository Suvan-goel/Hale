import { LOCAL_USER_ID, movementDomainFromScoreDomain, type CheckupType, type MovementAssessment } from '../adherence';
import type { CheckUpScore, DomainResult } from '../scoring';
import type { CreateAssessmentInput } from './types';

export function createMovementAssessment({
  userId = LOCAL_USER_ID,
  checkUpId,
  type,
  score,
  sourceBlockId,
  completedAt = new Date().toISOString(),
  status,
  isOfficialForProgress,
}: CreateAssessmentInput): MovementAssessment {
  const confidence = score ? confidenceFromScore(score) : 'low';
  const resolvedStatus = status ?? (confidence === 'low' ? 'invalid' : 'completed');
  return {
    id: `assessment-${type}-${checkUpId.replace(/[:.]/g, '-')}`,
    userId,
    type,
    status: resolvedStatus,
    createdAt: checkUpId,
    completedAt,
    sourceBlockId,
    results: score
      ? {
          strengthPowerScore: scoreForDomain(score, 'strength'),
          balanceScore: scoreForDomain(score, 'balance'),
          mobilityScore: scoreForDomain(score, 'mobility'),
          weakestDomain: movementDomainFromScoreDomain(score.weakestDomain),
          confidence,
          rawMetrics: { checkUpId: score.startedAt, measuredDomains: measuredDomains(score).length },
        }
      : {
          confidence: 'low',
          rawMetrics: { checkUpId },
        },
    isOfficialForProgress: isOfficialForProgress ?? isOfficialCheckupType(type),
  };
}

export function isOfficialCheckupType(type: CheckupType): boolean {
  return type === 'baseline' || type === 'baseline_retake' || type === 'official_retest';
}

export function latestOfficialAssessment(
  assessments: readonly MovementAssessment[]
): MovementAssessment | null {
  const official = assessments.filter((a) => a.isOfficialForProgress);
  if (official.length === 0) return null;
  return official.slice().sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
}

export function canReplaceBaselineWithRetake({
  original,
  retake,
  confirmed,
}: {
  original: MovementAssessment | null | undefined;
  retake: MovementAssessment;
  confirmed: boolean;
}): boolean {
  if (!confirmed || !original) return false;
  if (original.type !== 'baseline' || retake.type !== 'baseline_retake') return false;
  return retake.status === 'completed' && retake.isOfficialForProgress;
}

function confidenceFromScore(score: CheckUpScore): 'low' | 'medium' | 'high' {
  const measured = measuredDomains(score).length;
  if (measured >= 3) return 'high';
  if (measured >= 1) return 'medium';
  return 'low';
}

function measuredDomains(score: CheckUpScore): DomainResult[] {
  return score.domains.filter((d) => d.measured);
}

function scoreForDomain(score: CheckUpScore, domain: DomainResult['domain']): number | undefined {
  const result = score.domains.find((d) => d.domain === domain);
  if (!result?.measured) return undefined;
  return (result.ageLow + result.ageHigh) / 2;
}
