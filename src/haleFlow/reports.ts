import {
  LOCAL_USER_ID,
  blockProgress,
  movementDomainFromScoreDomain,
  scoreDomainFromMovementDomain,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import type { CheckUpScore } from '../scoring';
import { getReportCopy } from './copy';

export function createMovementBlockReport({
  userId = LOCAL_USER_ID,
  block,
  baselineAssessment,
  retestAssessment,
  previousScore,
  latestScore,
  completions,
  nowIso = new Date().toISOString(),
}: {
  userId?: string;
  block: MovementBlock;
  baselineAssessment?: MovementAssessment | null;
  retestAssessment?: MovementAssessment | null;
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  completions: readonly TrainingSessionCompletion[];
  nowIso?: string;
}): MovementBlockReport {
  const progress = blockProgress(block, completions);
  const domainChanges = compareDomains(previousScore, latestScore) ?? {};
  const focusChange = domainChanges[block.focusDomain];
  return {
    id: `block-report-${block.id}`,
    userId,
    blockId: block.id,
    baselineAssessmentId: baselineAssessment?.id ?? block.sourceAssessmentId,
    retestAssessmentId: retestAssessment?.id,
    createdAt: nowIso,
    summary: getReportCopy({ focusDomain: block.focusDomain, hasComparison: !!focusChange?.current }),
    sessionsCompleted: progress.completedSessions,
    totalPlannedSessions: progress.totalSessions,
    microChecksCompleted: progress.microChecksCompleted,
    domainChanges,
    recommendedNextFocusDomain: latestScore ? movementDomainFromScoreDomain(latestScore.weakestDomain) : block.focusDomain,
  };
}

function compareDomains(
  previousScore?: CheckUpScore | null,
  latestScore?: CheckUpScore | null
): MovementBlockReport['domainChanges'] {
  const out: MovementBlockReport['domainChanges'] = {};
  if (!previousScore || !latestScore) return out;
  for (const domain of ['strength_power', 'balance', 'mobility'] as MovementDomain[]) {
    const scoreDomain = scoreDomainFromMovementDomain(domain);
    const previous = previousScore.domains.find((d) => d.domain === scoreDomain);
    const current = latestScore.domains.find((d) => d.domain === scoreDomain);
    if (!previous?.measured || !current?.measured) continue;
    const previousMid = (previous.ageLow + previous.ageHigh) / 2;
    const currentMid = (current.ageLow + current.ageHigh) / 2;
    out[domain] = {
      previous: previousMid,
      current: currentMid,
      direction: direction(previousMid, currentMid),
    };
  }
  return out;
}

function direction(previous: number, current: number): 'improved' | 'held_steady' | 'declined' | 'unknown' {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 'unknown';
  if (current < previous) return 'improved';
  if (current === previous) return 'held_steady';
  return 'declined';
}
