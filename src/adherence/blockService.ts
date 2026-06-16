import type { CheckUpScore, Domain } from '../scoring';
import { addDaysIso } from './dateUtils';
import { getLifeGoalTrainingRelevance } from './goalDomainMapping';
import type { AssessmentForBlock, LifeGoal, MovementBlock, MovementDomain } from './types';
import { LOCAL_USER_ID } from './types';

const ALL_DOMAINS: MovementDomain[] = ['strength_power', 'balance', 'mobility'];

export function movementDomainFromScoreDomain(domain: Domain | null | undefined): MovementDomain {
  if (domain === 'balance') return 'balance';
  if (domain === 'mobility') return 'mobility';
  return 'strength_power';
}

export function scoreDomainFromMovementDomain(domain: MovementDomain): Domain {
  return domain === 'strength_power' ? 'strength' : domain;
}

export function createMovementBlockFromAssessment({
  userId = LOCAL_USER_ID,
  latestAssessment,
  lifeGoal,
  startDate = new Date().toISOString(),
}: {
  userId?: string;
  latestAssessment?: AssessmentForBlock | CheckUpScore | null;
  lifeGoal?: LifeGoal | null;
  startDate?: string;
}): MovementBlock {
  let score: CheckUpScore | null | undefined;
  let sourceAssessmentId: string | undefined;
  if (isAssessmentForBlock(latestAssessment)) {
    score = latestAssessment.score;
    sourceAssessmentId = latestAssessment.id;
  } else {
    score = latestAssessment;
    sourceAssessmentId = latestAssessment?.startedAt;
  }
  const focusDomain = movementDomainFromScoreDomain(score?.weakestDomain);
  const relevance = getLifeGoalTrainingRelevance(lifeGoal);
  const goalDomains = relevance.primaryDomains.filter((d) => d !== focusDomain);
  const secondaryDomains = uniqueDomains([...goalDomains, ...ALL_DOMAINS.filter((d) => d !== focusDomain)]).slice(0, 2);
  const endDate = addDaysIso(startDate, 28);

  return {
    id: `movement-block-${startDate.replace(/[:.]/g, '-')}`,
    userId,
    lifeGoalId: lifeGoal?.id,
    status: 'active',
    startDate,
    endDate,
    retestDate: endDate,
    focusDomain,
    secondaryDomains,
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceAssessmentId,
    createdAt: startDate,
    updatedAt: startDate,
  };
}

function isAssessmentForBlock(v: unknown): v is AssessmentForBlock {
  return !!v && typeof v === 'object' && 'score' in v;
}

export function getActiveMovementBlock(blocks: readonly MovementBlock[]): MovementBlock | null {
  const active = blocks.filter((b) => b.status === 'active' || b.status === 'paused');
  if (active.length === 0) return null;
  return active.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function getLatestMovementBlock(blocks: readonly MovementBlock[]): MovementBlock | null {
  if (blocks.length === 0) return null;
  return blocks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function uniqueDomains(domains: MovementDomain[]): MovementDomain[] {
  const out: MovementDomain[] = [];
  for (const d of domains) {
    if (!out.includes(d)) out.push(d);
  }
  return out;
}
